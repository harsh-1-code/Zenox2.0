"""Held-out evaluation. Produces the numbers for the deck.

    python eval.py            # full set
    python eval.py --deep     # with live web research (slow, costs more)

Never hand-write these numbers into a presentation - paste what this prints.
"""

import argparse
import json
import statistics
import sys
import time
from concurrent.futures import ThreadPoolExecutor

from app import pipeline
from app.config import DATA

FLAGGED = {"HIGH_RISK", "SUSPICIOUS"}
WORKERS = 6  # ponytail: fixed pool; raise only if the API rate limit allows


def run_case(c: dict, deep: bool) -> dict:
    t0 = time.time()
    try:
        v = pipeline.assess(
            None, c["input_type"], c.get("text"), None, c.get("app_name"), "en", deep
        )
        err = None
    except Exception as e:  # noqa: BLE001 - a failed case is a data point, not a crash
        return {**c, "risk": "ERROR", "err": type(e).__name__, "secs": time.time() - t0}

    flagged = v.risk_state in FLAGGED
    if c["label"] == "scam":
        correct = flagged
    elif c["label"] == "genuine":
        correct = not flagged
    else:  # ambiguous: the right answer is to not commit
        correct = v.risk_state in {"SUSPICIOUS", "UNCERTAIN"}

    # Evidence fidelity: does each OBSERVED claim point at something in the input?
    src = (c.get("text") or "").lower()
    observed = [e for e in v.scam_evidence if e.type == "OBSERVED"]
    hits = sum(
        any(w in src for w in e.statement.lower().split() if len(w) > 5) for e in observed
    )
    fidelity = hits / len(observed) if observed else None

    return {
        **c,
        "risk": v.risk_state,
        "claim": v.scam_dna.claim_type,
        "correct": correct,
        "flagged": flagged,
        "fidelity": fidelity,
        "asked": bool(v.next_question),
        "secs": time.time() - t0,
        "err": err,
    }


def pct(n: int, d: int) -> str:
    return f"{n / d:.1%}" if d else "n/a"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--deep", action="store_true", help="enable live web research")
    args = ap.parse_args()

    cases = json.loads((DATA / "cases.json").read_text())["cases"]
    print(f"running {len(cases)} cases, {WORKERS} at a time, deep={args.deep}\n")

    t0 = time.time()
    with ThreadPoolExecutor(WORKERS) as ex:
        rows = list(ex.map(lambda c: run_case(c, args.deep), cases))
    wall = time.time() - t0

    for r in sorted(rows, key=lambda r: r["id"]):
        mark = "ok  " if r.get("correct") else "MISS"
        print(f"{mark} {r['id']:<28} {r['label']:<10} -> {r['risk']:<13} {r['secs']:>5.1f}s")

    scam = [r for r in rows if r["label"] == "scam"]
    gen = [r for r in rows if r["label"] == "genuine"]
    amb = [r for r in rows if r["label"] == "ambiguous"]
    errs = [r for r in rows if r["risk"] == "ERROR"]
    fid = [r["fidelity"] for r in rows if r.get("fidelity") is not None]
    secs = sorted(r["secs"] for r in rows)

    print("\n" + "=" * 62)
    print(f"  HELD-OUT EVALUATION  ({len(rows)} cases: {len(scam)} scam / "
          f"{len(gen)} genuine / {len(amb)} ambiguous)")
    print("=" * 62)
    print(f"  Overall accuracy        {pct(sum(bool(r.get('correct')) for r in rows), len(rows))}")
    print(f"  Scam recall             {pct(sum(bool(r.get('correct')) for r in scam), len(scam))}")
    print(f"  FALSE-ALARM RATE        {pct(sum(r['flagged'] for r in gen if r['risk'] != 'ERROR'), len(gen))}"
          "   <- genuine wrongly escalated")
    print(f"  Ambiguous handled well  {pct(sum(bool(r.get('correct')) for r in amb), len(amb))}")
    print(f"  Evidence fidelity       {statistics.mean(fid):.1%}" if fid else "  Evidence fidelity       n/a")
    print(f"  Asked a question        {pct(sum(bool(r.get('asked')) for r in rows), len(rows))}")
    print(f"  Errors                  {len(errs)}")
    print("-" * 62)
    print(f"  Median latency          {statistics.median(secs):.1f}s")
    print(f"  p95 latency             {secs[int(len(secs) * 0.95) - 1]:.1f}s"
          "        (PS target: under 60s)")
    print(f"  Wall clock              {wall:.0f}s for the whole set")
    print("=" * 62)

    misses = [r for r in rows if not r.get("correct")]
    if misses:
        print("\nMisses worth reading:")
        for r in misses:
            print(f"  {r['id']:<28} {r['label']:<10} -> {r['risk']}  {r.get('err') or ''}")

    out = DATA.parent / "eval_report.json"
    out.write_text(json.dumps(
        {"generated": time.strftime("%Y-%m-%d %H:%M"), "deep": args.deep, "rows": rows},
        indent=2, default=str))
    print(f"\nfull rows -> {out}")

    if errs:
        sys.exit(1)


if __name__ == "__main__":
    main()
