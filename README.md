# 🛡️ Digi संरक्षक AI

<p align="center">

<img width="1254" height="1254" alt="08b9a51e-ba3d-49fa-a152-6bbbcbee112e" src="https://github.com/user-attachments/assets/5f8e7021-1bb4-4452-872e-929d66a12240" />

</p>

<p align="center">

### **Ruko. Socho. Verify Karo.**

**AI-powered Scam Decision Assistant for safer digital payments and online interactions.**

</p>

---

## 👥 Team GLITCH

| Team Member |
|---|
| **Ayush Kumar** |
| **Nitish Singh** |
| **Harsh Kumar** |

---

<p align="center">

<img width="1024" height="559" alt="0a1165e8-8c6d-450d-a9c4-9a9ef37dca6b" src="https://github.com/user-attachments/assets/ae8339de-ab0a-4e10-9bed-1a7b0ebbe843" />

</p>

---

# 🔎 Is this a scam?

## Scam Decision Assistant

**PS-1, Conversational Claude Impact Lab (Bhopal)**

### Financial Safety and Consumer Protection

Digi संरक्षक AI is a web application designed to help an individual make a safer decision when confronted with a suspicious message, call, screenshot, application or link.

The user provides the suspicious content, and the assistant explains:

- **What the interaction is trying to do**
- **Scam DNA behind the interaction**
- Evidence suggesting it may be a scam
- Evidence suggesting it may be legitimate
- What the system could not establish
- What the user should do in the **next ten minutes**
- What to do if money has already been transferred
- The appropriate reporting route

> **The goal is not only to answer "Is this a scam?" — it is to help the user decide what to do next.**

---

# 💡 What Problem Are We Solving?

Fraud increasingly arrives through the same digital channels people already use every day:

- SMS
- WhatsApp and messaging applications
- Voice and video calls
- App stores
- Payment links
- Digital lending applications
- Social and investment platforms

Common fraud patterns include:

| Fraud Pattern | Typical Approach |
|---|---|
| 🏦 **KYC / Bank Impersonation** | Fake expiry or verification warnings |
| 📦 **Parcel / Customs Scam** | Small payment demands |
| ⚡ **Utility Scam** | Threat of immediate disconnection |
| 💼 **Job Scam** | Registration or processing fees |
| 📈 **Investment Scam** | Fake profits and trading platforms |
| 👮 **Digital Arrest** | Police / agency impersonation |
| 💳 **Loan App Scam** | Unregulated apps and extortion |
| 🌾 **Agriculture / Rural Scam** | Fake credit, insurance or subsidy offers |

The problem is not that public warnings do not exist.

The problem is that guidance is often **generic, scattered and difficult to retrieve under pressure**.

### Digi संरक्षक AI focuses on that exact moment of decision.

---

# 🚀 Our Solution

Digi संरक्षक AI converts a suspicious interaction into an understandable decision-support flow.

```text
Suspicious Message / Screenshot / Call / App / URL
                         │
                         ▼
                  AI Assessment
                         │
                         ▼
                    Scam DNA
                         │
                         ▼
              Evidence + Unknowns
                         │
                         ▼
                  Risk Assessment
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
        Enough evidence       More context needed
              │                     │
              │              Targeted question
              │                     │
              └──────────┬──────────┘
                         ▼
                Immediate Actions
                         │
                         ▼
              Recovery / Reporting
                         │
                         ▼
                   Sources Shown

---

# 🛠️ Build, run and verify

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

## The in-app voice guide

Tap **पूछें / Ask**, say what happened, and it answers out loud and drives the app for
you — opens the right card, or runs the check itself, or jumps to emergency mode.

- Speech in and out uses the **native Android engines** through Capacitor. The system
  WebView cannot be relied on for recognition, so the browser's Web Speech API is only
  the fallback path.
- Typing always works. If the device has no recogniser, or the microphone permission is
  refused, the panel stays fully usable — speech is an enhancement, never a requirement.
- It runs on a separate, small Claude call (`prompts/assistant.md`) that knows every
  feature of the app and is told its answers will be spoken, so replies stay to a few
  sentences.
- **It never produces a verdict itself.** It routes the person to the check that does,
  so every verdict still arrives with evidence attached. It also refuses to hear an OTP:
  secrets are stripped from the transcript before the model sees them.

## The RBI lending-app directory

RBI has run a public directory of Digital Lending Apps deployed by its regulated
entities since 01-07-2025 (`rbi.org.in` -> Citizen's Corner -> "DLA's deployed by
Regulated Entities"). It is served through a JavaScript report viewer, so it cannot be
fetched programmatically - the export is a manual step.

**This build ships with that list empty, deliberately.** A fabricated "RBI list" inside
a fraud-safety tool is the same false authority the product exists to expose. Until it
is imported the app says `DIRECTORY NOT LOADED`, links the user to the authoritative
page, and falls back to live web research for app-name questions - which is enforced in
`pipeline.py`, not in the UI, so every client gets it.

To load it:

```bash
# export the directory to CSV or Excel from the RBI viewer, then
python scripts/import_rbi_dla.py ~/Downloads/dla_directory.xlsx
```

That sets `last_updated` to the import date, which the UI shows next to every result -
the PS requires the date the list was last updated to be visible.

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

- [ ] Import the RBI directory (see below). The app ships with it empty, on purpose.
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
| `backend/app/assistant.py` | The voice guide's Claude call. Short spoken answers, app-wide knowledge, same safety rules. |
| `frontend/src/voice.ts` | One speech interface over native Capacitor plugins and the Web Speech API. |
| `backend/app/helpdesk.py` | Case summary + reporting script for help-desk staff. Pure formatting, no model call. |
| `frontend/public/manifest.webmanifest` | PWA install + WhatsApp share target. |

Full spec: `PS1_Scam_Decision_Assistant_Implementation_File_Structure.md`
