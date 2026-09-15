"""redact -> ONE Claude call (optionally with live web research) -> validate
-> guards -> deterministic actions.

Research uses the `web_search` server tool, so it runs inside the same request. We
deliberately do NOT declare `web_fetch`: the assistant must never visit the suspicious
URL itself. Searching for the institution's real domain is verification; opening the
scammer's link is not.
"""

import json
import re
from typing import Optional

from anthropic import Anthropic
from pydantic import ValidationError

from . import actions, guards, prompt, redact, session
from .config import ANTHROPIC_API_KEY, ANTHROPIC_MODEL, DATA, MAX_TOKENS
from .schemas import Assessment, ScamDNA, Verdict

_SOURCES = json.loads((DATA / "sources.json").read_text())
_client: Optional[Anthropic] = None

_WEB_SEARCH = {"type": "web_search_20260209", "name": "web_search", "max_uses": 3}


def _get_client() -> Anthropic:
    global _client
    if _client is None:
        _client = Anthropic(api_key=ANTHROPIC_API_KEY or None)
    return _client


def _extract_json(raw: str) -> dict:
    """The model may narrate around the object when it has been searching."""
    start, end = raw.find("{"), raw.rfind("}")
    if start == -1 or end == -1:
        raise json.JSONDecodeError("no object found", raw, 0)
    return json.loads(raw[start : end + 1])


def _call(system_prompt: str, blocks: list, deep: bool) -> tuple:
    """Returns (assessment_dict, research[]). Handles the server-tool pause_turn loop."""
    kwargs = {"tools": [_WEB_SEARCH]} if deep else {}
    messages = [{"role": "user", "content": blocks}]
    research, text = [], ""

    for _ in range(4):  # pause_turn can recur; 4 is well past what max_uses=3 needs
        r = _get_client().messages.create(
            model=ANTHROPIC_MODEL,
            max_tokens=MAX_TOKENS,
            system=system_prompt,
            messages=messages,
            **kwargs,
        )
        for b in r.content:
            if b.type == "text":
                text += b.text
            elif b.type == "web_search_tool_result":
                # Server-tool errors come back as HTTP 200 with an object, not a list.
                if isinstance(b.content, list):
                    research += [
                        {"title": x.title, "url": x.url, "page_age": getattr(x, "page_age", None)}
                        for x in b.content
                        if getattr(x, "type", "") == "web_search_result"
                    ]
        if r.stop_reason != "pause_turn":
            break
        messages.append({"role": "assistant", "content": r.content})

    return _extract_json(text), research


def _fallback(reason: str) -> Assessment:
    return Assessment(
        scam_dna=ScamDNA(),
        risk_state="UNCERTAIN",
        needs_investigation=True,
        next_question=guards.FALLBACK_QUESTION,
        unknowns=["Automatic assessment did not complete ({}).".format(reason)],
        summary="Could not assess this reliably. Treat it as unverified and do not act on it yet.",
    )


def assess(
    session_id: Optional[str],
    input_type: str,
    text: Optional[str],
    image_b64: Optional[str],
    app_name: Optional[str],
    lang: str,
    deep: bool = False,
) -> Verdict:
    sid, data = session.get_or_create(session_id)

    safe_text = redact.scrub_secrets(text or "")
    blocks = prompt.user_blocks(safe_text, image_b64, app_name, input_type, data["history"])
    system_prompt = prompt.system(lang, deep)

    research: list = []
    try:
        raw, research = _call(system_prompt, blocks, deep)
        a = Assessment(**raw)
    except (ValidationError, json.JSONDecodeError):
        try:  # one retry - malformed JSON is usually not repeated
            raw, research = _call(system_prompt, blocks, deep)
            a = Assessment(**raw)
        except Exception as e:  # noqa: BLE001 - never hard-fail the user
            a = _fallback(type(e).__name__)
    except Exception as e:  # noqa: BLE001 - API/network
        a = _fallback(type(e).__name__)

    a = guards.apply(a)

    data["last"] = a.model_dump()
    data["input"] = {"text": safe_text, "app_name": app_name, "input_type": input_type}
    if a.next_question:
        data["pending_q"] = a.next_question
    session.update(sid, data)

    used = {e.source_id for e in a.scam_evidence + a.legitimacy_evidence if e.source_id}
    registry = [s for s in _SOURCES if s["source_id"] in used] or _SOURCES[:2]
    # Live search hits become sources too - de-duplicated by URL, capped for display.
    seen, web = set(), []
    for r in research:
        if r["url"] not in seen:
            seen.add(r["url"])
            web.append(
                {
                    "source_id": "WEB-{}".format(len(web) + 1),
                    "title": r["title"],
                    "publisher": "Web search",
                    "url": r["url"],
                    "last_verified": r.get("page_age") or "live",
                }
            )

    return Verdict(
        **a.model_dump(),
        session_id=sid,
        actions=actions.build(a, lang),
        sources=registry + web[:6],
        researched=bool(research),
    )


def reassess(session_id: str, answer: str, lang: str, deep: bool = False) -> Verdict:
    """Same pipeline. The answer becomes new evidence in the next prompt."""
    sid, data = session.get_or_create(session_id)
    data["history"].append({"q": data.get("pending_q", ""), "a": redact.scrub_secrets(answer)})
    session.update(sid, data)
    prev = data.get("input", {})
    return assess(
        sid, prev.get("input_type", "text"), prev.get("text"), None,
        prev.get("app_name"), lang, deep,
    )
