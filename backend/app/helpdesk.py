"""Help-desk output for PS-1's secondary users: bank branch and cyber help-desk staff,
and family members assisting a relative.

Staff do not need the explanation - they need something they can read out and hand over.
This turns a finished Verdict into a plain-text case summary and a reporting script
listing exactly what the 1930 operator will ask for. Pure formatting over data we already
have; no model call, nothing stored.
"""

from .schemas import Verdict

_ASKED_FOR = [
    "Your name and mobile number",
    "Date and time of the transaction",
    "Amount transferred",
    "Your bank / wallet and the account or card used",
    "The beneficiary UPI ID, account number or phone number, if known",
    "Transaction ID / UTR / reference number",
    "How you were contacted (SMS, call, WhatsApp, app) and the number or link used",
    "A short description of what you were told",
]

_RISK_LINE = {
    "HIGH_RISK": "HIGH RISK - strong converging scam indicators",
    "SUSPICIOUS": "SUSPICIOUS - real risk indicators, material uncertainty remains",
    "UNCERTAIN": "UNCERTAIN - evidence insufficient or conflicting",
    "LIKELY_LEGIT": "LIKELY GENUINE - evidence favours legitimate communication",
}


def case_summary(v: Verdict) -> str:
    """Plain text a help-desk operator can print, paste into a ticket, or read aloud."""
    d = v.scam_dna
    lines = [
        "SCAM DECISION ASSISTANT - CASE SUMMARY",
        "Advisory only. Generated from the person's own description. Nothing was stored.",
        "",
        "ASSESSMENT: " + _RISK_LINE.get(v.risk_state, v.risk_state),
        "Pattern:    " + (d.claim_type or "not identified"),
        "Channel:    " + d.channel,
        "Impersonation: " + (d.impersonation or "none identified"),
        "Person has already: " + v.user_state.replace("_", " "),
        "",
        "SUMMARY",
        "  " + v.summary,
    ]

    if v.scam_evidence:
        lines += ["", "RISK INDICATORS FOUND"]
        lines += ["  - [{}] {}".format(e.type, e.statement) for e in v.scam_evidence]
    if v.legitimacy_evidence:
        lines += ["", "INDICATORS OF LEGITIMACY"]
        lines += ["  - [{}] {}".format(e.type, e.statement) for e in v.legitimacy_evidence]
    if v.unknowns:
        lines += ["", "NOT ESTABLISHED"]
        lines += ["  - " + u for u in v.unknowns]

    lines += ["", "ACTION GIVEN TO THE PERSON"]
    for a in v.actions:
        when = " (within {} min)".format(a.deadline_minutes) if a.deadline_minutes else ""
        lines.append("  [{}]{} {}".format(a.kind.upper(), when, a.text))

    if v.sources:
        lines += ["", "SOURCES CITED"]
        lines += ["  - {} ({})".format(s["title"], s.get("url") or s.get("publisher", ""))
                  for s in v.sources]

    return "\n".join(lines)


def reporting_script(v: Verdict) -> dict:
    """What to say on 1930, and the details the operator will ask for."""
    money_gone = v.user_state == "money_sent"
    opening = (
        "I want to report a cyber financial fraud. Money has already been transferred "
        "and I am reporting within the reporting window."
        if money_gone
        else "I want to report a suspected fraud attempt. No money has been transferred yet."
    )
    return {
        "call": "1930 (National Cyber Crime Helpline)",
        "portal": "https://cybercrime.gov.in/",
        "say_this": opening,
        "they_will_ask": _ASKED_FOR if money_gone else _ASKED_FOR[:4] + _ASKED_FOR[6:],
        "reminder": (
            "Do not delete any message, screenshot or transaction record before reporting. "
            "The helpline may ask you to file the complaint on the portal as well - keep the "
            "acknowledgement number."
        ),
    }
