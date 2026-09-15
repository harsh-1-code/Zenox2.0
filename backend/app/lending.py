"""Lending-app reference check against the RBI Digital Lending Apps directory.

Exact/fuzzy name matching only - no inference, no verdict. Two hard rules, both from
PS-1:

  * "Not found" is never evidence of fraud. It means this list did not establish a
    match, and the user is told exactly that.
  * The result always carries its source and the date that source was last updated.

If the directory has not been imported yet (see scripts/import_rbi_dla.py) we say so
and send the user to the authoritative page. We do not ship invented entries: a
fabricated "RBI list" inside a fraud-safety tool is the same false authority the
product exists to expose.
"""

import json
import re

from .config import DATA

_RAW = json.loads((DATA / "lending_apps.json").read_text())
_APPS = _RAW.get("apps", [])
LOADED = bool(_APPS)

NOTE_NOT_FOUND = (
    "NOT FOUND means this reference list did not establish a match. It does not prove "
    "the app is fraudulent. Verify independently before installing or borrowing."
)
NOTE_NOT_LOADED = (
    "The RBI directory has not been loaded into this build, so we cannot check the name "
    "offline. Check it yourself on the RBI directory linked below, and never grant a "
    "lending app access to your contacts or gallery."
)


def _norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", s.lower())


def _meta() -> dict:
    return {
        "source": _RAW["source"],
        "source_url": _RAW.get("directory_url") or _RAW["source_url"],
        "directory_path": _RAW.get("directory_path", ""),
        "last_updated": _RAW.get("last_updated") or "not loaded",
    }


def check(app_name: str) -> dict:
    if not LOADED:
        return {"status": "DIRECTORY_NOT_LOADED", "matches": [], "note": NOTE_NOT_LOADED, **_meta()}

    q = _norm(app_name)
    exact = [a for a in _APPS if _norm(a["app"]) == q]
    partial = [a for a in _APPS if q and q in _norm(a["app"])]

    if exact:
        status, matches = "MATCHED", exact
    elif len(partial) == 1:
        status, matches = "MATCHED", partial
    elif partial:
        status, matches = "AMBIGUOUS", partial[:8]
    else:
        status, matches = "NOT_FOUND", []

    return {
        "status": status,
        "matches": matches,
        "note": NOTE_NOT_FOUND if status == "NOT_FOUND" else "",
        **_meta(),
    }
