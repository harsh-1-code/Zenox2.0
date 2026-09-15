"""Held-out evaluation. Produces the numbers for the deck slide.

    python eval.py

Never hand-write the output numbers into the presentation - paste what this prints.
"""

import json
import time

from app.config import DATA
from app import pipeline

SCAMMY = {"HIGH_RISK", "SUSPICIOUS"}


def main() -> None:
    cases = json.loads((DATA / "cases.json").read_text())["cases"]
    rows, latencies = [], []

    for c in cases:
        t0 = time.time()
        v = pipeline.assess(None, c["input_type"], c.get("text"), None, None, "en")
        latencies.append(time.time() - t0)

        flagged = v.risk_state in SCAMMY
        correct = (
            flagged if c["label"] == "scam"
            else (not flagged) if c["label"] == "genuine"
            else v.risk_state in {"SUSPICIOUS", "UNCERTAIN"}
        )
        # evidence fidelity: does each OBSERVED statement point at something in the input?
        src = (c.get("text") or "").lower()
        observed = [e for e in v.scam_evidence if e.type == "OBSERVED"]
        fidelity = sum(
            any(w in src for w in e.statement.lower().split() if len(w) > 5) for e in observed
        ) / max(len(observed), 1)

        rows.append((c["id"], c["label"], v.risk_state, correct, fidelity))
        print(f"{c['id']:<22} {c['label']:<10} -> {v.risk_state:<13} {'ok' if correct else 'MISS'}")

    genuine = [r for r in rows if r[1] == "genuine"]
    scam = [r for r in rows if r[1] == "scam"]
    false_alarms = [r for r in genuine if r[2] in SCAMMY]

    print("\n--- results ---")
    print(f"cases                : {len(rows)}  ({len(scam)} scam / {len(genuine)} genuine)")
    print(f"overall accuracy     : {sum(r[3] for r in rows) / len(rows):.1%}")
    if genuine:
        print(f"false-alarm rate     : {len(false_alarms) / len(genuine):.1%}  (genuine wrongly escalated)")
    if scam:
        print(f"scam recall          : {sum(r[3] for r in scam) / len(scam):.1%}")
    print(f"evidence fidelity    : {sum(r[4] for r in rows) / len(rows):.1%}")
    print(f"mean latency         : {sum(latencies) / len(latencies):.1f}s")
    print(f"max latency          : {max(latencies):.1f}s   (PS target: under 60s)")


if __name__ == "__main__":
    main()
