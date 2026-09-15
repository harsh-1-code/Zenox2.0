# Digi संरक्षक AI

<img width="326" height="319" alt="Screenshot 2026-09-15 at 12 43 37 PM" src="https://github.com/user-attachments/assets/e75a866d-6032-4955-be06-09ce96397bb2" />

Team GLITCH 

Ayush Kumar

Nitish Singh

Harsh Kumar










# Is this a scam? — Scam Decision Assistant

PS-1, Conversational Claude Impact Lab (Bhopal).

A web app that takes a screenshot, a pasted message, an app name or a description of a
call, and returns: what the message is doing (Scam DNA), the evidence both for and
against it being a scam, what it could not establish, and what to do in the next ten
minutes — including the reporting route if money has already gone.

Two-speed by design: the instant verdict comes back in under 10 seconds (no network
lookups), and **Research this live** is an explicit second step that uses Claude's
`web_search` tool to check the claimed institution's real domain and any public reports
about the app or link - citing every page it read. It never opens the suspicious link
itself; that would make the scammer's own channel the verification source.

Advisory only. Nothing is stored beyond the session. MIT licensed.

## It runs on the phone

The scam message arrives on a phone, so the phone is the target. This is an installable
PWA, not a desktop page:

- **Add to Home Screen** gives it an icon and a standalone window - no Play Store, no APK.
- **Share target**: in WhatsApp or Messages, hit Share -> Scam Check and the message is
  assessed immediately. The PS asks for "a pasted or forwarded message"; this is the
  forwarded half.
- Screenshot upload uses the native gallery/camera picker.
- Install and share target need HTTPS. Over plain LAN HTTP the app works fine, but the
  service worker will not register, so those two are unavailable - use a tunnel
  (`cloudflared tunnel --url http://localhost:5173`) or a deployed origin.

The service worker deliberately caches nothing. Zero retention applies here too.

## Measured results

Run `cd backend && python eval.py`. Last run, 52 held-out cases (26 scam / 22 genuine /
4 ambiguous), Claude Sonnet 5, instant path with no web research:

| Metric | Result |
|---|---|
| Overall accuracy | **98.1%** |
| Scam recall | **100%** |
| **False-alarm rate on genuine institutional messages** | **0.0%** |
| Ambiguous cases correctly left uncommitted | 75% (3/4) |
| Median latency | 7.8s |
| p95 latency | 14.8s (PS target: under 60s) |
| Errors | 0 |

The single miss is `ambiguous-04` ("kindly update your registered mobile number at your
nearest branch"), returned as LIKELY_LEGIT. That message contains no link, no payment
request, no urgency and no credential request, so the label is arguably wrong rather than
the verdict - it is left in the set unchanged rather than retuned to flatter the score.

Evidence fidelity reads 64.2%, but that metric is a crude word-overlap check against the
input and penalises correct paraphrasing; treat it as a smoke test, not a measurement.

Numbers in any presentation must come from this script, not from memory.

## Run

```bash
cp .env.example .env        # put your ANTHROPIC_API_KEY in it

cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload            # http://localhost:8000

cd ../frontend
npm install
npm run dev                              # http://localhost:5173
```

Tests (no API key needed):

```bash
cd backend && python -m pytest -q
```

Evaluation (needs API key, calls Claude once per case):

```bash
cd backend && python eval.py
```

## Demo order

1. **Genuine bank SMS** → LIKELY_LEGIT. Show that it looks for legitimacy evidence
   instead of flagging everything.
2. **KYC / digital arrest scam** → Scam DNA, evidence chain, unknowns panel.
3. **Incomplete input** → Claude asks one targeted question; the answer changes the
   verdict live.
4. **"Money already sent"** → incident mode, golden-hour countdown, 1930.
5. Hindi toggle. 6. Lending-app check (shows source + last-updated date).
7. **App name** tab — the reference-list result and Claude's assessment appear together.
8. **Help-desk view** — printable case summary + the 1930 reporting script listing exactly
   what the operator will ask for. This is PS-1's secondary user: branch and cyber
   help-desk staff, and family members assisting a relative.
9. **Research this live** on the KYC scam — Claude searches and surfaces the bank's real
   domain next to the fake one, with citations.
10. Clear session button — proves zero retention.

Measured on this build (Claude Sonnet 5): instant verdict 7-10s, live research 35-45s.
Both inside the one-minute target; the instant path is what the demo leads with.

## Before the demo

- [ ] Replace `backend/data/lending_apps.json` with the real RBI list. It is placeholder data.
- [ ] Fill in `last_verified` dates in `backend/data/sources.json`.
- [ ] Expand `backend/data/cases.json` to ~50 cases, roughly half genuine.
- [ ] Run `python eval.py` and paste the real numbers into the deck. Do not invent them.
- [ ] Run the full demo 10 times on the judging-day machine.

## Layout

| Path | What it owns |
|---|---|
| `backend/app/schemas.py` | Every data shape. Single source of truth; `frontend/src/types.ts` mirrors it. |
| `backend/app/pipeline.py` | redact → **one** Claude call → validate → guards → actions. |
| `backend/prompts/assess.md` | The one prompt. Returns the whole assessment as JSON. |
| `backend/app/guards.py` | Safety rules as code, not prompt text. Each has a test. |
| `backend/app/actions.py` | Deterministic action plan. Claude never writes this. |
| `backend/app/session.py` | In-memory, TTL 30 min. Nothing touches disk. |
| `backend/app/redact.py` | Secrets stripped before Claude; PII stripped before logs. |
| `frontend/src/App.tsx` | Whole flow. No router, no state library. Reads the PWA share target. |
| `backend/app/helpdesk.py` | Case summary + reporting script for help-desk staff. Pure formatting, no model call. |
| `frontend/public/manifest.webmanifest` | PWA install + WhatsApp share target. |

Full spec: `PS1_Scam_Decision_Assistant_Implementation_File_Structure.md`
