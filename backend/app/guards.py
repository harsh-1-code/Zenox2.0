"""Code-level safety rules. These override model output - they are not prompt text.

Every rule here has a matching assertion in tests/test_pipeline.py.
"""

import json
import re

from .config import DATA
from .schemas import Assessment

_SECRET_WORD = re.compile(r"\b(otp|pin|mpin|cvv|password|passcode)\b", re.I)
_ELICIT_VERB = re.compile(r"\b(share|send|give|tell|enter|provide|type|paste|what is)\b", re.I)
_NUMERIC_PROB = re.compile(r"\b\d{1,3}\s?%")

_VALID_SOURCES = {s["source_id"] for s in json.loads((DATA / "sources.json").read_text())}

FALLBACK_QUESTION = "Did they ask you to transfer money or install an app?"


def apply(a: Assessment) -> Assessment:
    # 1. Never ask the user to reveal a secret. ("Did they ask for an OTP?" is fine;
    #    "What is your OTP?" is not.)
    if a.next_question and _SECRET_WORD.search(a.next_question):
        if _ELICIT_VERB.search(a.next_question) and not re.search(
            r"\b(did|do|were|was|have|has)\b", a.next_question[:20], re.I
        ):
            a.next_question = FALLBACK_QUESTION

    # 2. No high risk without evidence to show for it.
    if a.risk_state == "HIGH_RISK" and not a.scam_evidence:
        a.risk_state = "UNCERTAIN"

    # 3. No uncalibrated numeric probability anywhere user-facing.
    a.summary = _NUMERIC_PROB.sub("", a.summary).strip()

    # 4. Evidence citing a source we do not have gets dropped, not shown.
    for bucket in (a.scam_evidence, a.legitimacy_evidence):
        bucket[:] = [
            e
            for e in bucket
            if e.source_id is None
            or e.source_id in _VALID_SOURCES
            or e.source_id.startswith("WEB-")  # live search hit, attached by pipeline
        ]

    # 5. A question only exists if we actually need one.
    if not a.needs_investigation:
        a.next_question = None
    elif not a.next_question:
        a.next_question = FALLBACK_QUESTION

    return a
