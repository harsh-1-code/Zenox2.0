from typing import Literal, Optional

from pydantic import BaseModel

RiskState = Literal["LIKELY_LEGIT", "SUSPICIOUS", "HIGH_RISK", "UNCERTAIN"]
EvidenceType = Literal["OBSERVED", "VERIFIED", "INFERRED", "UNKNOWN", "CONFLICTING"]
UserState = Literal[
    "nothing_done", "clicked_or_installed", "credentials_shared", "money_sent"
]
Lang = Literal["en", "hi"]


class ScamDNA(BaseModel):
    impersonation: Optional[str] = None
    urgency: Literal["none", "low", "medium", "high"] = "none"
    requested_action: list[str] = []
    payment_request: bool = False
    credential_risk: Literal["none", "possible", "explicit"] = "none"
    link_app_risk: Literal["none", "suspicious", "high"] = "none"
    manipulation: list[str] = []
    claim_type: Optional[str] = None
    channel: str = "unknown"


class Evidence(BaseModel):
    type: EvidenceType
    statement: str
    source_id: Optional[str] = None


class Assessment(BaseModel):
    """Exactly what Claude must return. Validated before anything else runs."""

    scam_dna: ScamDNA
    scam_evidence: list[Evidence] = []
    legitimacy_evidence: list[Evidence] = []
    unknowns: list[str] = []
    claims: list[str] = []
    risk_state: RiskState
    user_state: UserState = "nothing_done"
    needs_investigation: bool = False
    next_question: Optional[str] = None
    summary: str


class Action(BaseModel):
    text: str
    kind: Literal["do_not", "do_now", "verify", "preserve"]
    deadline_minutes: Optional[int] = None


class Verdict(Assessment):
    session_id: str
    actions: list[Action] = []
    sources: list[dict] = []
    researched: bool = False


class AnalyzeRequest(BaseModel):
    session_id: Optional[str] = None
    input_type: Literal["text", "image", "app", "call"] = "text"
    text: Optional[str] = None
    image_b64: Optional[str] = None
    app_name: Optional[str] = None
    lang: Lang = "en"
    deep: bool = False  # live web research - opt-in, adds ~20-60s


class InvestigateRequest(BaseModel):
    session_id: str
    answer: str
    lang: Lang = "en"
    deep: bool = False


class LendingRequest(BaseModel):
    app_name: str
