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

def test_money_sent_puts_the_bank_call_inside_ten_minutes():
    """The bank is the only party that can freeze a transfer, so it leads and it is the
    tightest deadline. 1930 and the portal follow inside the hour."""
    plan = actions.build(_a(user_state="money_sent"))
    assert plan[0].kind == "do_now" and plan[0].deadline_minutes == 10
    nineteen_thirty = next(a for a in plan if "1930" in a.text)
    assert nineteen_thirty.deadline_minutes == 60
    assert any(a.kind == "preserve" for a in plan)


def test_every_action_names_a_real_source():
    """PS: cite the source of every rule or fact. An action plan is the most
    consequential rule the product issues, so none of them may be unsourced."""
    import json
    from app.config import DATA

    known = {s["source_id"] for s in json.loads((DATA / "sources.json").read_text())}
    for state in ("nothing_done", "clicked_or_installed", "credentials_shared", "money_sent"):
        for act in actions.build(_a(user_state=state)):
            assert act.source_id, f"unsourced action in {state}: {act.text[:40]}"
            assert act.source_id in known, f"invented source {act.source_id}"


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

def _with_directory(monkeypatch, apps):
    """The shipped build has an empty directory (see scripts/import_rbi_dla.py), so the
    loaded-state tests supply their own rows rather than depending on invented data."""
    monkeypatch.setattr(lending, "_APPS", apps)
    monkeypatch.setattr(lending, "LOADED", bool(apps))


def test_unknown_app_is_not_found_never_fraud(monkeypatch):
    _with_directory(monkeypatch, [{"app": "RealLender", "entity": "X Bank", "entity_type": "Bank"}])
    r = lending.check("SomeAppNobodyHasHeardOf")
    assert r["status"] == "NOT_FOUND"
    assert "does not prove" in r["note"]
    assert "fraud" not in r["status"].lower()


def test_known_app_matches_and_carries_its_entity(monkeypatch):
    _with_directory(monkeypatch, [{"app": "RealLender", "entity": "X Bank", "entity_type": "Bank"}])
    r = lending.check("real lender")   # normalisation ignores case and spacing
    assert r["status"] == "MATCHED"
    assert r["matches"][0]["entity"] == "X Bank"


def test_unloaded_directory_says_so_instead_of_guessing(monkeypatch):
    _with_directory(monkeypatch, [])
    r = lending.check("AnyApp")
    assert r["status"] == "DIRECTORY_NOT_LOADED"
    assert r["matches"] == []


def test_result_always_carries_source_and_date():
    r = lending.check("anything")
    assert r["source"] and r["source_url"] and r["last_updated"]


# --- help-desk output --------------------------------------------------------

def _verdict(**kw):
    from app.schemas import Verdict
    base = dict(scam_dna=ScamDNA(claim_type="kyc_expiry"), risk_state="HIGH_RISK",
                summary="test", session_id="s1")
    v = Verdict(**{**base, **kw})
    v.actions = actions.build(v)
    return v


def test_case_summary_is_printable_and_carries_the_verdict():
    from app import helpdesk
    out = helpdesk.case_summary(_verdict(user_state="money_sent"))
    assert "HIGH RISK" in out and "kyc_expiry" in out
    assert "ACTION GIVEN TO THE PERSON" in out
    assert "1930" in out


def test_reporting_script_asks_for_more_when_money_is_gone():
    from app import helpdesk
    gone = helpdesk.reporting_script(_verdict(user_state="money_sent"))
    safe = helpdesk.reporting_script(_verdict(user_state="nothing_done"))
    assert len(gone["they_will_ask"]) > len(safe["they_will_ask"])
    assert "1930" in gone["call"]


def test_case_summary_never_leaks_a_secret():
    from app import helpdesk
    from app.schemas import Evidence
    v = _verdict(scam_evidence=[Evidence(type="OBSERVED",
                                         statement=redact.scrub_secrets("OTP 448192 was asked for"))])
    assert "448192" not in helpdesk.case_summary(v)


# --- the app must actually boot -----------------------------------------------

def test_the_app_imports():
    """A circular import between pipeline and localize crashed the server at startup
    while every test here still passed, because nothing imported the app. Render kept
    serving the previous build and the failure stayed invisible. This is the guard."""
    from app.main import app

    paths = {r.path for r in app.routes}
    for required in (
        "/api/analyze", "/api/investigate", "/api/assistant",
        "/api/helpdesk", "/api/lending-app/check", "/api/health",
    ):
        assert required in paths, f"missing route {required}"


def test_every_module_imports():
    """Same reason: an import-time error in a module no test touches is invisible."""
    import importlib

    for m in (
        "actions", "assistant", "claude", "config", "guards", "helpdesk",
        "lending", "localize", "main", "pipeline", "prompt", "redact",
        "schemas", "session",
    ):
        importlib.import_module(f"app.{m}")


# --- the app must actually boot -----------------------------------------------

def test_the_app_imports():
    """A circular import between pipeline and localize crashed the server at startup
    while every test here still passed, because nothing imported the app. Render kept
    serving the previous build and the failure stayed invisible. This is the guard."""
    from app.main import app

    paths = {r.path for r in app.routes}
    for required in (
        "/api/analyze", "/api/investigate", "/api/assistant",
        "/api/helpdesk", "/api/lending-app/check", "/api/health",
    ):
        assert required in paths, f"missing route {required}"


def test_every_module_imports():
    """Same reason: an import-time error in a module no test touches is invisible."""
    import importlib

    for m in ("actions", "assistant", "claude", "config", "guards", "helpdesk",
              "lending", "localize", "main", "pipeline", "prompt", "redact",
              "schemas", "session"):
        importlib.import_module(f"app.{m}")


# --- the guide must stay in JSON across a conversation ------------------------

def test_assistant_replays_past_replies_as_json():
    """The client stores only the spoken text. Feeding that straight back made the model
    copy its own apparent format and answer in prose from turn two onward, so every
    follow-up parsed as a failure and came back as "I did not understand"."""
    import json as _json
    from app import assistant

    sent = {}

    class FakeClient:
        class messages:
            @staticmethod
            def create(**kw):
                sent.update(kw)
                raise RuntimeError("stop here - we only care about what was sent")

    assistant._get_client = lambda: FakeClient()
    assistant.reply(
        "and what about the link",
        "en",
        None,
        [{"role": "user", "text": "i got a bank message"},
         {"role": "assistant", "text": "Sure, paste it here."}],
    )

    past = [m for m in sent["messages"] if m["role"] == "assistant"]
    assert past, "history was dropped"
    for m in past:
        assert _json.loads(m["content"])["say"], "assistant turn replayed as bare prose"
