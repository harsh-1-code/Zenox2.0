"""One file. Asserts every safety guard and the deterministic action table.

    cd backend && python -m pytest -q

No API key needed - nothing here calls Claude.
"""

from app import actions, guards, lending, redact
from app.schemas import Assessment, Evidence, ScamDNA


def _a(**kw) -> Assessment:
    base = dict(scam_dna=ScamDNA(), risk_state="SUSPICIOUS", summary="test")
    return Assessment(**{**base, **kw})


# --- guards -----------------------------------------------------------------

def test_never_elicits_a_secret():
    a = guards.apply(_a(needs_investigation=True, next_question="What is your OTP?"))
    assert a.next_question == guards.FALLBACK_QUESTION


def test_asking_whether_otp_was_requested_is_allowed():
    q = "Did they ask you to share an OTP?"
    assert guards.apply(_a(needs_investigation=True, next_question=q)).next_question == q


def test_no_high_risk_without_evidence():
    assert guards.apply(_a(risk_state="HIGH_RISK", scam_evidence=[])).risk_state == "UNCERTAIN"


def test_strips_uncalibrated_probability():
    a = guards.apply(_a(summary="This is 97% a scam."))
    assert "%" not in a.summary


def test_drops_evidence_with_unknown_source():
    a = guards.apply(
        _a(scam_evidence=[
            Evidence(type="OBSERVED", statement="real", source_id="SRC-1930"),
            Evidence(type="OBSERVED", statement="fake", source_id="SRC-INVENTED"),
        ])
    )
    assert [e.statement for e in a.scam_evidence] == ["real"]


def test_no_question_when_not_investigating():
    assert guards.apply(_a(needs_investigation=False, next_question="Anything?")).next_question is None


# --- redaction --------------------------------------------------------------

def test_secret_removed_before_claude():
    assert "[SECRET]" in redact.scrub_secrets("Your OTP is 448192, share it now")
    assert "448192" not in redact.scrub_secrets("Your OTP is 448192, share it now")


def test_card_number_removed():
    assert "[CARD_OR_ACCOUNT]" in redact.scrub_secrets("Acct 4111111111111111 blocked")


def test_upi_handle_survives_for_claude_but_not_for_logs():
    t = "Pay to fraudster@okaxis now"
    assert "fraudster@okaxis" in redact.scrub_secrets(t)   # scam signal, keep
    assert "[HANDLE]" in redact.scrub_for_log(t)            # never logged


# --- actions ----------------------------------------------------------------

def test_money_sent_puts_bank_call_first_with_golden_hour():
    plan = actions.build(_a(user_state="money_sent"))
    assert plan[0].kind == "do_now" and plan[0].deadline_minutes == 60
    assert any("1930" in a.text for a in plan)
    assert any(a.kind == "preserve" for a in plan)


def test_legit_verdict_has_no_do_not_list():
    plan = actions.build(_a(risk_state="LIKELY_LEGIT"))
    assert not [a for a in plan if a.kind == "do_not"]


def test_uncertain_gets_short_caution_not_full_scare_list():
    short = [a for a in actions.build(_a(risk_state="UNCERTAIN")) if a.kind == "do_not"]
    full = [a for a in actions.build(_a(risk_state="HIGH_RISK")) if a.kind == "do_not"]
    assert 0 < len(short) < len(full)


def test_hindi_plan_is_in_devanagari():
    plan = actions.build(_a(risk_state="HIGH_RISK", user_state="money_sent"), "hi")
    assert any("1930" in a.text for a in plan)
    assert all(any("\u0900" <= c <= "\u097f" for c in a.text) for a in plan)


def test_claim_type_selects_its_verification_route():
    a = _a(scam_dna=ScamDNA(claim_type="digital_arrest"))
    assert any("video call" in x.text for x in actions.build(a) if x.kind == "verify")


# --- lending ----------------------------------------------------------------

def test_unknown_app_is_not_found_never_fraud():
    r = lending.check("SomeAppNobodyHasHeardOf")
    assert r["status"] == "NOT_FOUND"
    assert "does not prove" in r["note"]


def test_result_carries_source_and_date():
    r = lending.check("SAMPLE-A")
    assert r["status"] == "MATCHED" and r["last_updated"] and r["source"]
