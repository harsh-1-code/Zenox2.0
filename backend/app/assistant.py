"""In-app voice guide.

A separate, deliberately small Claude call: short spoken answers, awareness of every
feature in the app, and the same safety rules as the assessment path. It never produces
a verdict itself - it routes the person to the check that does, so every verdict still
carries evidence.
"""

import json
import re
from typing import Optional

from pydantic import ValidationError

from . import session
from .config import ANTHROPIC_MODEL, PROMPTS
from .pipeline import _get_client
from .schemas import AssistantReply

_TEMPLATE = (PROMPTS / "assistant.md").read_text()
_LANG = {"en": "English", "hi": "Hindi (Devanagari script)"}
_SECRET = re.compile(r"\b(otp|pin|mpin|cvv|password|passcode)\b[^0-9]{0,15}(\d{3,8})", re.I)

MAX_TOKENS = 500  # spoken answers are short; this also keeps the reply fast


def _context(session_id: Optional[str]) -> str:
    """What is currently on the person's screen, so the guide can talk about it."""
    if not session_id:
        return "No check has been run yet in this session."
    _, data = session.get_or_create(session_id)
    last = data.get("last")
    if not last:
        return "No check has been run yet in this session."
    bits = [
        f"A check has already been run. Result: {last['risk_state']}.",
        f"Summary shown to them: {last['summary']}",
        f"What they have already done: {last['user_state'].replace('_', ' ')}.",
    ]
    if last.get("unknowns"):
        bits.append("Still unestablished: " + "; ".join(last["unknowns"][:3]))
    return "\n".join(bits)


def reply(message: str, lang: str, session_id: Optional[str], history: list) -> AssistantReply:
    # Never let a spoken secret reach the model or the transcript.
    safe = _SECRET.sub(lambda m: m.group(0).replace(m.group(2), "[not needed]"), message)

    system = _TEMPLATE.replace("{{LANGUAGE}}", _LANG.get(lang, "English"))
    turns = [
        {"role": h["role"], "content": h["text"]}
        for h in history[-6:]
        if h.get("role") in ("user", "assistant") and h.get("text")
    ]
    turns.append(
        {"role": "user", "content": f"CURRENT SCREEN CONTEXT:\n{_context(session_id)}\n\nTHEY SAID:\n{safe}"}
    )

    def attempt() -> AssistantReply:
        r = _get_client().messages.create(
            model=ANTHROPIC_MODEL, max_tokens=MAX_TOKENS, system=system, messages=turns
        )
        raw = "".join(b.text for b in r.content if b.type == "text")
        start, end = raw.find("{"), raw.rfind("}")
        if start < 0 or end < start:
            raise ValueError("no JSON object in reply")
        data = json.loads(raw[start : end + 1])
        # An action we do not know is not worth losing the whole reply over - the words
        # matter more than the routing.
        if data.get("action") not in {
            "none", "open_message", "open_screenshot", "open_call",
            "open_app", "open_emergency", "run_check",
        }:
            data["action"] = "none"
        return AssistantReply(**data)

    try:
        try:
            return attempt()
        except (ValidationError, json.JSONDecodeError, ValueError):
            # One malformed reply is usually a one-off; retry before giving up, the way
            # the assessment pipeline does.
            return attempt()
    except (ValidationError, json.JSONDecodeError, ValueError):
        return AssistantReply(
            say=(
                "मैं समझ नहीं पाया। क्या आप दोबारा बता सकते हैं?"
                if lang == "hi"
                else "I did not catch that. Could you say it again?"
            ),
            reply_lang="hi-IN" if lang == "hi" else "en-IN",
        )
    except Exception:  # noqa: BLE001 - a guide that crashes is worse than one that waits
        return AssistantReply(
            say=(
                "अभी कनेक्शन में दिक्कत है। आप मैसेज सीधे ऐप में पेस्ट करके जांच सकते हैं।"
                if lang == "hi"
                else "I am having trouble connecting. You can paste the message into the app to check it directly."
            ),
            reply_lang="hi-IN" if lang == "hi" else "en-IN",
        )
