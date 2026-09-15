"""Translate the fixed action plan into a language it was not hand-written in.

The action texts are the product's most consequential output, so they are authored in
Python and reviewed, not generated. For English and Hindi that is where it ends. For any
other language this does one narrow thing: a faithful translation of those exact strings.

The distinction matters. The model is never asked what the steps are, only how to say
the steps we already decided. Order, deadlines, sources and count all come from
actions.py and are untouched here.
"""

import json
from typing import List

from .config import ANTHROPIC_MODEL
from .claude import get_client as _get_client
from .schemas import Action

HANDWRITTEN = {"en", "hi"}

_SYSTEM = """You are translating a fraud-safety action plan for an Indian user.

Translate each numbered line into {lang}, faithfully. This is safety guidance, not copy
to improve:

- Do not add, drop, merge, soften or reorder anything.
- Keep 1930, cybercrime.gov.in, OTP, PIN, KYC, UPI and any number exactly as written.
- Keep the imperative tone: these are instructions, not suggestions.
- Natural spoken register, the way a helpful bank employee would say it.

Return ONLY a JSON array of strings, same length and same order as the input."""


def actions_into(acts: List[Action], reply_lang: str) -> List[Action]:
    base = (reply_lang or "en").split("-")[0].lower()
    if base in HANDWRITTEN or not acts:
        return acts

    try:
        lines = [a.text for a in acts]
        r = _get_client().messages.create(
            model=ANTHROPIC_MODEL,
            max_tokens=2000,
            system=_SYSTEM.format(lang=reply_lang),
            messages=[{"role": "user", "content": json.dumps(lines, ensure_ascii=False)}],
        )
        raw = "".join(b.text for b in r.content if b.type == "text")
        out = json.loads(raw[raw.find("[") : raw.rfind("]") + 1])
        if not isinstance(out, list) or len(out) != len(acts):
            return acts  # a partial translation is worse than none
        return [a.model_copy(update={"text": str(t)}) for a, t in zip(acts, out)]
    except Exception:
        # Guidance in the wrong language still saves money; no guidance does not.
        return acts
