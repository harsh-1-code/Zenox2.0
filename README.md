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
7. **Research this live** on the KYC scam — Claude searches and surfaces the bank's real
   domain next to the fake one, with citations.
8. Clear session button — proves zero retention.

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
| `frontend/src/App.tsx` | Whole flow. No router, no state library. |

Full spec: `PS1_Scam_Decision_Assistant_Implementation_File_Structure.md`
