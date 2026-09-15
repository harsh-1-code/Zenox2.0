"""Lending-app reference check. Exact/fuzzy match only - no inference, no verdict."""

import json
import re

from .config import DATA

_RAW = json.loads((DATA / "lending_apps.json").read_text())
_APPS = _RAW["apps"]

NOT_FOUND_NOTE = (
    "NOT_FOUND means this reference list did not establish a match. "
    "It does not prove the app is fraudulent. Verify independently before borrowing."
)


def _norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", s.lower())


def check(app_name: str) -> dict:
    q = _norm(app_name)
    exact = [a for a in _APPS if _norm(a["app"]) == q]
    partial = [a for a in _APPS if q and q in _norm(a["app"])]

    if exact:
        status, matches = "MATCHED", exact
    elif len(partial) == 1:
        status, matches = "MATCHED", partial
    elif partial:
        status, matches = "AMBIGUOUS", partial
    else:
        status, matches = "NOT_FOUND", []

    return {
        "status": status,
        "matches": matches,
        "source": _RAW["source"],
        "source_url": _RAW["source_url"],
        "last_updated": _RAW["last_updated"],
        "note": NOT_FOUND_NOTE if status == "NOT_FOUND" else "",
    }
