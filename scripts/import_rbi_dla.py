#!/usr/bin/env python3
"""Load the RBI Digital Lending Apps directory into the app's reference list.

    python scripts/import_rbi_dla.py ~/Downloads/dla_directory.xlsx

Where to get the file:
    rbi.org.in -> Citizen's Corner -> "DLA's deployed by Regulated Entities"
    -> export the report to CSV or Excel from the viewer's toolbar.

The directory is served through a JavaScript report viewer, so it cannot be fetched
programmatically - the manual export is a property of the source, not a shortcut here.
Column names vary between exports, so headers are matched loosely.
"""

import json
import re
import sys
from datetime import date
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "backend/data/lending_apps.json"

# Header names vary between exports ("Name of the DLA", "DLA Name", "App"), so match on
# words rather than substrings. Substring matching put the title line - "Digital Lending
# Apps (DLAs) deployed by Regulated Entities" - through as the header, because it contains
# "dla"; word matching plus the two-column rule below rejects it.
_WORDS = re.compile(r"[a-z]+")


def words(cell) -> set:
    return set(_WORDS.findall(str(cell or "").lower()))


def is_app_col(cell) -> bool:
    w = words(cell)
    if w & {"dla", "dlas"}:
        return True
    return "app" in w and bool(w & {"name", "lending", "digital"})


def is_entity_col(cell) -> bool:
    w = words(cell)
    return bool(w & {"re", "res", "entity", "entities", "lender", "lenders"})


def is_type_col(cell) -> bool:
    w = words(cell)
    return "type" in w or "category" in w


def index_of(cells: list, test) -> int:
    for i, c in enumerate(cells):
        if test(c):
            return i
    return -1


def find_header(rows: list) -> int:
    """The real header names both an app column and an entity column and has several
    filled cells. Title and "as on" lines above it have neither."""
    for i, r in enumerate(rows[:15]):
        cells = list(r)
        if sum(1 for c in cells if str(c or "").strip()) < 2:
            continue
        if index_of(cells, is_app_col) >= 0 and index_of(cells, is_entity_col) >= 0:
            return i
    for i, r in enumerate(rows[:15]):   # some exports omit the entity column
        cells = list(r)
        if sum(1 for c in cells if str(c or "").strip()) >= 2 and index_of(cells, is_app_col) >= 0:
            return i
    return -1


def read_rows(path: Path) -> list:
    if path.suffix.lower() in {".xlsx", ".xls"}:
        try:
            from openpyxl import load_workbook
        except ImportError:
            sys.exit("pip install openpyxl, or export the directory as CSV instead")
        ws = load_workbook(path, read_only=True, data_only=True).active
        return [list(row) for row in ws.iter_rows(values_only=True)]
    import csv

    with path.open(newline="", encoding="utf-8-sig") as f:
        return list(csv.reader(f))


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if len(args) != 1:
        sys.exit(__doc__)
    rows = [r for r in read_rows(Path(args[0])) if r and any(c for c in r)]
    if not rows:
        sys.exit("file is empty")

    head_i = find_header(rows)
    if head_i < 0:
        sys.exit(f"no header row found. First rows seen:\n" +
                 "\n".join(str(r) for r in rows[:5]))

    headers = list(rows[head_i])
    ai = index_of(headers, is_app_col)
    ei = index_of(headers, is_entity_col)
    ti = index_of(headers, is_type_col)

    def cell(r: list, i: int) -> str:
        return str(r[i]).strip() if 0 <= i < len(r) and r[i] is not None else ""

    apps, seen = [], set()
    for r in rows[head_i + 1 :]:
        app = cell(r, ai)
        if not app or app.lower() in seen:
            continue
        seen.add(app.lower())
        apps.append({
            "app": app,
            "entity": cell(r, ei) or "Not stated",
            "entity_type": cell(r, ti) or "RE",
        })

    if not apps:
        sys.exit("header found but no rows under it - check the export")

    print(f"header row {head_i + 1}: {headers}")
    print("first three parsed:")
    for a in apps[:3]:
        print(f"  {a['app']}  |  {a['entity']}  |  {a['entity_type']}")
    print(f"... {len(apps)} unique apps total")

    if "--yes" not in sys.argv and input("\nimport these? [y/N] ").strip().lower() != "y":
        sys.exit("cancelled")

    cur = json.loads(DATA.read_text())
    cur["apps"] = apps
    cur["last_updated"] = date.today().isoformat()
    cur["_status"] = "LOADED"
    cur.pop("_why", None)
    DATA.write_text(json.dumps(cur, ensure_ascii=False, indent=2) + "\n")
    print(f"imported {len(apps)} apps -> {DATA}")
    print(f"last_updated = {cur['last_updated']} (shown to the user, as the PS requires)")


if __name__ == "__main__":
    main()
