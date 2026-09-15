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

# 🔗 Try it

| | |
|---|---|
| **Web / PWA** | **https://zenox2-0.vercel.app** — open it, or Add to Home Screen for the app experience |
| **Android APK** | **https://digi-sanrakshak-api.onrender.com/api/download/apk** |
| **API** | https://digi-sanrakshak-api.onrender.com |

Nothing needs to be installed to try it. The APK adds one thing the web cannot do:
watching incoming SMS in the background.

> The API is on Render's free plan, which sleeps after 15 minutes idle and takes ~50s to
> wake. Open `/api/health` first if the first check seems slow.

---

# 📊 Measured, not claimed

Run it yourself: `cd backend && python eval.py`. Last run — 52 held-out cases
(26 scam / 22 genuine / 4 ambiguous), Claude Sonnet 5, instant path:

| Metric | Result |
|---|---|
| **False-alarm rate on genuine institutional messages** | **0.0 %** |
| Scam recall | 100 % |
| Overall accuracy | 98.1 % |
| Ambiguous cases correctly left uncommitted | 75 % (3/4) |
| Median latency | 7.8 s |
| p95 latency | 14.8 s *(PS target: under 60 s)* |
| Errors | 0 |

The false-alarm number is the one that matters. Twenty-two genuine messages — real bank
debit alerts, OTP messages, LIC premium reminders, electricity bills, LPG receipts — and
not one was wrongly escalated. Catching scams is easy; not crying wolf is what makes a
safety tool worth opening.

The single miss is `ambiguous-04` ("kindly update your registered mobile number at your
nearest branch"), returned as LIKELY_LEGIT. It has no link, no payment request, no urgency
and no credential ask, so the label is arguably wrong rather than the verdict. It is left
in the set unchanged rather than retuned to flatter the score.

Evidence fidelity reads 64.2 %, but that metric is a crude word-overlap check that
penalises correct paraphrasing. Treat it as a smoke test, not a measurement.

---

# ✨ What it does

**Four ways in.** A pasted message, a screenshot, a description of a call in your own
words, or an app name. A call is *described*, not recorded — a browser cannot reach
telephony audio and the PS asks for a description.

**Scam DNA.** Not a label but a structured read of the attack: who it impersonates, the
pressure applied, what it wants you to do, the manipulation used, the claim type.

**Evidence on both sides.** Risk indicators *and* signs it may be genuine, plus an honest
list of what could not be established. The legitimacy side is the false-alarm defence.

**One question when it is stuck.** Where evidence is thin it asks the single question that
changes the advice, and the answer updates the verdict. No interrogation.

**Research this live.** An explicit second step that uses Claude's web search to find the
institution's real domain and public reports about a link or app — citing every page it
read. It never opens the suspicious link itself; that would make the scammer's own channel
the verification source.

**Golden hour.** If money has gone, it switches to incident mode with a countdown, a Call
1930 button and the NCRP portal.

**Help-desk view.** A printable case summary and a reporting script listing exactly what
the 1930 operator will ask for — for branch staff and for family helping a relative, the
PS's secondary users.

**A voice guide that speaks your language.** Tap the orb and talk. It knows every feature,
can drive the app for you, and answers in whatever language you used — Bhojpuri, Marathi,
Tamil, Bengali, Telugu, romanised Hinglish, English. It never issues a verdict itself; it
routes you to the check that does, so every verdict still arrives with evidence.

**Background SMS warning.** With the app closed, an arriving SMS is checked as it lands and
a warning appears before you open it.

---

# 🔒 Safety and privacy

**The rules are code, not prompt text.** `guards.py` holds seven of them, each with a test:
never elicits an OTP or PIN · no high risk without evidence to show for it · no
uncalibrated percentage · no invented source · "not found" never becomes "fraud" · no
clickable suspicious link · nothing raw reaches the logs.

**Zero retention, enforced.** Sessions live in memory with a 30-minute TTL. Secrets are
stripped before the Claude call and all PII before any log line. The service worker caches
the app shell and never an assessment. A Clear session button proves it live.

**The SMS check never uploads anything.** `SmsWatcher.java` runs a local pattern score on
arrival — no network at all. The message leaves the device only when you *tap* the warning,
which routes it through the ordinary share path. Silently uploading every SMS someone
receives would be indefensible in a product whose promise is that nothing is stored.

**Advisory only.** No automatic reporting, no contact with banks or police on anyone's
behalf. Every factual claim resolves to a source with a date.

---

# 🚫 Two things we could have faked

**No "92 % scam" score.** A precise-looking number with no calibrated evaluation behind it
is invented confidence. The gauge encodes four interpretable states and a guard strips
percentages from model output.

**No fabricated RBI list.** RBI's Digital Lending Apps directory (`rbi.org.in` → Citizen's
Corner, live since 01-07-2025) is served through a JavaScript report viewer with no
fetchable export. Rather than ship invented rows, the app says `DIRECTORY NOT LOADED`,
links the authoritative page, and falls back to cited live research. A one-command
importer is ready for when the export exists:

```bash
python scripts/import_rbi_dla.py ~/Downloads/dla_directory.xlsx
```

> In a product whose job is exposing false authority, shipping false authority would
> disqualify it.

---

# 🛣️ Next: real-time voice-clone detection on live calls

> **Designed, not shipped.** Nothing below is in this build. It is the next problem we
> intend to solve, and the architecture for it is worked out — we are listing it because
> the design is real, not because the feature is.

Today a call reaches the assistant as a *description* — the person tells us what the
caller said. That is what PS-1 asks for, and a browser cannot reach telephony audio. But
the fraud that is growing fastest in India is not a badly written SMS: it is a cloned
voice. A caller who sounds exactly like your son, your manager, or your bank's relationship
officer, asking for money.

**What we would build**

```
SIM call → telephony audio → VAD → fast anti-spoof screen
                                        │
                              suspicious? → heavier confirmer
                                        │
                     temporal smoothing across several windows
                                        │
                        LOW / SUSPICIOUS / HIGH  +  uncertainty
                                        │
                    "This voice may be AI-generated. Call them
                     back on a number you already have."
```

- **Two-stage detection.** A light always-on screen (RawNet2 / compact AASIST class) on
  every analysis window, with a heavier confirmer (fine-tuned Wav2Vec2-XLS-R) only when
  the first stage is unsure. Cheap enough to run continuously, accurate when it matters.
- **Telephone-channel-aware training.** Studio-clean anti-spoof models collapse on a real
  call. Training needs codec degradation, band-limiting, packet loss and Indian-accent
  calibration, evaluated on held-out real call audio.
- **Anti-spoof, not speaker verification.** A good clone *passes* speaker verification —
  it is supposed to sound like the person. The question worth asking is not "is this them?"
  but "was this speech synthesised?"
- **Calibrated risk, warned inside a few seconds.** Not a sub-second verdict: several
  windows have to agree before interrupting a call, or every noisy line becomes an alarm.

**Why it is not in this build**

Android does not give an ordinary app the live audio of a phone call, by design. Reaching
it needs a privileged capture path — a Shizuku/ADB-backed service on a specific, frozen
OS build — or, for production, an OEM system component or carrier IMS integration. That is
a platform partnership, not a weekend of code, and a demo that depends on one handset
staying in a debugging session is a demo that breaks on stage.

So the engine we would build is deliberately **audio-source-agnostic**: it takes PCM
frames and knows nothing about telephony. The capture adapter is a separate layer that can
be swapped for an OEM or carrier feed without touching the detector. The assistant you can
use today handles the same scam the way the platform currently allows — you describe the
call, and it walks you through verifying the caller on a number you already had, which is
the advice that actually defeats a clone.

---

# 🧱 Architecture

```
Message · Screenshot · Call description · App name
                      │
              redact secrets
                      │
            ONE Claude call  ──── optional: web search, cited
                      │
        validate → seven safety guards
                      │
        ┌─────────────┴─────────────┐
   enough evidence            needs context
        │                           │
        │                    one targeted question
        │                           │
        └─────────────┬─────────────┘
                      │
     deterministic action plan (Python, not model output)
                      │
        verdict · evidence · unknowns · sources
                      │
                session wiped
```

**One Claude call, not six.** A chained six-prompt pipeline measured 130s and would have
failed the PS's own one-minute criterion on stage. One call returns the whole assessment in
about eight seconds.

**Actions are code.** The 1930 and NCRP steps come from a Python table, so post-incident
guidance always matches published procedure and the model never improvises what to tell a
victim.

**One codebase, three surfaces.** Capacitor wraps the same React app as a browser page, an
installable PWA, and an Android APK.

| Layer | Stack |
|---|---|
| Frontend | React 18 · TypeScript · Vite (no router, no state library) |
| Mobile | Capacitor 8 · one Java activity · native speech + SMS receiver |
| Backend | FastAPI · Pydantic · in-memory sessions |
| Model | Claude Sonnet 5 with the `web_search` server tool |
| Hosting | Vercel (web) · Render (API) |

---

# 🛠️ Run it locally

```bash
cp .env.example .env            # add your ANTHROPIC_API_KEY

cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload   # http://localhost:8000

cd ../frontend
npm install
npm run dev                     # http://localhost:5173
```

Tests — no API key needed, nothing here calls Claude:

```bash
cd backend && python -m pytest -q      # 21 passing
```

Evaluation — needs a key, one Claude call per case, runs six-wide in ~83s:

```bash
cd backend && python eval.py
```

## Android build

```bash
cd frontend
VITE_API_BASE=https://digi-sanrakshak-api.onrender.com npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
../../scripts/publish_apk.sh    # so the download link is not a version behind
```

> Gradle 8.14 cannot parse Java 25 class files, which Android Studio's bundled JDK
> produces. JDK 21 is pinned in `gradle.properties`.

---

# 🚀 Deploy

Backend first — the frontend build bakes the API URL in.

1. **Render** → New → Blueprint → this repo. `render.yaml` is picked up automatically. Set
   `ANTHROPIC_API_KEY` by hand; it is deliberately not in the file.
2. **Vercel** → New Project → this repo → **Root Directory `frontend`** → add
   `VITE_API_BASE = https://<your-render-service>.onrender.com`.
3. Back on Render, set `ALLOWED_ORIGINS` to the Vercel URL.
4. Rebuild the APK against the deployed backend (above) so the phone needs no laptop.

---

# 🎬 Demo order

1. **Genuine bank SMS → Likely genuine.** Lead with this. Everyone can flag a scam; proving
   we do not cry wolf is what earns trust. Zero warnings on a real message.
2. **KYC scam → High risk.** Scam DNA, evidence chain, and what we could *not* establish.
3. **Incomplete input → one question.** The answer changes the verdict live.
4. **"Paisa bhej diya" → incident mode.** Golden-hour countdown, Call 1930.
5. **Hindi toggle**, then the **voice guide** — speak to it in any language.
6. **Research this live** on the KYC scam — the bank's real domain, with citations.
7. **Send an SMS to the demo phone** — the warning appears with the app closed.
8. **Clear session** — proves zero retention.

**Before the demo**

- [ ] Wake the API: open `/api/health` a minute beforehand.
- [ ] Grant SMS + Notification permission on the demo phone. Android silently refuses SMS
      access to browser-sideloaded apps; `adb install -g` or Settings → Permissions.
- [ ] Hand judges the **PWA link**, not the APK — sideloading hits Play Protect and
      unknown-sources prompts, and stage time is not the place for that.

---

# 📁 Layout

| Path | Owns |
|---|---|
| `backend/app/schemas.py` | Every data shape. `frontend/src/types.ts` mirrors it. |
| `backend/app/pipeline.py` | redact → one Claude call → validate → guards → actions. |
| `backend/app/guards.py` | Safety rules as code. Each has a test. |
| `backend/app/actions.py` | Deterministic action plan. Claude never writes this. |
| `backend/app/assistant.py` | The voice guide's Claude call — short spoken answers. |
| `backend/app/helpdesk.py` | Case summary + 1930 reporting script. |
| `backend/app/session.py` | In-memory, TTL 30 min. Nothing touches disk. |
| `backend/prompts/` | `assess.md` and `assistant.md` — the two prompts. |
| `backend/eval.py` | The held-out run behind every number above. |
| `frontend/src/App.tsx` | Whole flow. Reads the PWA and native share targets. |
| `frontend/src/voice.ts` | One speech interface over Capacitor and the Web Speech API. |
| `frontend/android/…/SmsWatcher.java` | Local-only SMS check. No network. |
| `deck/index.html` | Presentation. Arrow keys, `N` for notes, `F` for full screen. |

---

**MIT licensed.** Built for the Conversational Claude Impact Lab, Bhopal — PS-1.
