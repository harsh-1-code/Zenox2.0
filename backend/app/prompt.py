from typing import Optional
from .config import PROMPTS

_TEMPLATE = (PROMPTS / "assess.md").read_text()

_LANG = {"en": "English", "hi": "Hindi (Devanagari script)"}


_RESEARCH_OFF = "\nWeb search is unavailable for this request. Do not claim you looked anything up.\n"


def system(lang: str, deep: bool = True) -> str:
    s = _TEMPLATE.replace("{{LANGUAGE}}", _LANG.get(lang, "English"))
    return s if deep else s + _RESEARCH_OFF


def user_blocks(
    text: Optional[str],
    image_b64: Optional[str],
    app_name: Optional[str],
    input_type: str,
    history: list[dict],
) -> list[dict]:
    blocks: list[dict] = []

    if image_b64:
        blocks.append(
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/png",
                    "data": image_b64,
                },
            }
        )

    parts = [f"INPUT TYPE: {input_type}"]
    if app_name:
        parts.append(f"APP NAME: {app_name}")
    if text:
        parts.append(f"CONTENT:\n{text}")
    if history:
        qa = "\n".join(f"Q: {h['q']}\nA: {h['a']}" for h in history)
        parts.append(f"PREVIOUS QUESTIONS AND ANSWERS:\n{qa}")
    parts.append("Return only the JSON object.")

    blocks.append({"type": "text", "text": "\n\n".join(parts)})
    return blocks
