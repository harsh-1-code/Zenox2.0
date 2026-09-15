"""Two levels of scrubbing.

scrub_secrets()  runs BEFORE the Claude call. Removes only true secrets. UPI handles,
                 domains and sender names are kept - they are the scam signal.
scrub_for_log()  runs before anything is logged. Removes everything identifying.
"""

import re

_SECRET_NEAR = re.compile(
    r"\b(otp|o\.t\.p|pin|mpin|upi\s*pin|cvv|password|passcode)\b[^0-9]{0,15}(\d{3,8})",
    re.I,
)
_LONG_NUM = re.compile(r"\b\d{12,19}\b")
_PHONE = re.compile(r"\b(?:\+?91[-\s]?)?[6-9]\d{9}\b")
# Covers both emails and UPI handles - UPI handles have no TLD (name@okaxis).
_HANDLE = re.compile(r"\b[\w.+-]+@[\w-]+(?:\.[\w.]{2,})?\b")


def scrub_secrets(text: str) -> str:
    if not text:
        return text
    text = _SECRET_NEAR.sub(lambda m: m.group(0).replace(m.group(2), "[SECRET]"), text)
    return _LONG_NUM.sub("[CARD_OR_ACCOUNT]", text)


def scrub_for_log(text: str) -> str:
    if not text:
        return text
    text = scrub_secrets(text)
    text = _PHONE.sub("[PHONE]", text)
    return _HANDLE.sub("[HANDLE]", text)
