# PS-1 "Is this a scam?" — Implementation File Structure

**Event:** Conversational Claude Impact Lab, Bhopal · **Deliverable:** web app demo + presentation
**Status:** this supersedes the earlier ~200-file structure. Same product, same vocabulary (Scam DNA, Evidence, Risk states), one-third the files.

---

## 0. Decisions locked

| Decision | Value | Why |
|---|---|---|
| Form factor | **Web app** (Vite + React + TS) | Projector se direct chalega, install nahi, screenshot upload native. Mobile-responsive rakhna — deck ke liye phone-width screenshot. |
| Backend | FastAPI + Pydantic | Structured-output validation ke liye. |
| Claude calls per assessment | **ONE** | PS criterion: verdict under one minute. 6-prompt chain 60–90s leta hai — live demo maar deta hai. |
| Storage | In-memory session, TTL 30 min | PS: zero retention. Koi DB nahi. |
| Language | EN + HI | PS: "operates in the user's language". Bhopal judging. |
| Source files | **~25** | Reference PDF Section 14 khud bolta hai wo responsibility map hai, file list nahi. |

---

## 1. Tree

```text
scam-decision-assistant/
├── README.md                      # run in 3 commands + demo script
├── .env.example                   # ANTHROPIC_API_KEY, ANTHROPIC_MODEL, SESSION_TTL_MIN
├── .gitignore
│
├── backend/
│   ├── requirements.txt
│   ├── eval.py                    # held-out run → accuracy + false-alarm rate (the deck slide)
│   ├── app/
│   │   ├── main.py                # FastAPI, CORS, 5 routes
│   │   ├── config.py              # env + model id + risk policy constants
│   │   ├── schemas.py             # ALL Pydantic models — single source of truth
│   │   ├── pipeline.py            # redact → ONE Claude call → validate → guards → actions
│   │   ├── prompt.py              # builds system+user prompt from prompt.md + input
│   │   ├── actions.py             # risk_state + user_state → action plan (pure Python, no LLM)
│   │   ├── lending.py             # app-name normalize + match against reference list
│   │   ├── redact.py              # strip OTP/PIN/card/account patterns BEFORE Claude
│   │   ├── session.py             # in-memory dict + TTL sweep + explicit delete
│   │   └── guards.py              # code-level safety rules (Section 6)
│   │
│   ├── prompts/
│   │   └── assess.md              # the one prompt. Also used for re-assessment.
│   │
│   ├── data/
│   │   ├── lending_apps.json      # RBI regulated-entity DLA list + last_updated
│   │   ├── sources.json           # source registry: id, publisher, url, last_verified
│   │   ├── trusted_routes.json    # claim type → independent verification route
│   │   └── cases.json             # 50 labelled cases: ~50% genuine. Demo + eval dono.
│   │
│   └── tests/
│       └── test_pipeline.py       # guards + actions + lending + redaction. pytest, no fixtures.
│
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx                # whole flow + state. No router, no store lib.
        ├── api.ts                 # 5 fetch calls
        ├── types.ts               # mirrors backend schemas.py
        ├── i18n.ts                # EN/HI strings for UI chrome (Claude text already localized)
        ├── styles.css
        └── components/
            ├── Intake.tsx         # screenshot / text / app name / call description + demo picker
            ├── Verdict.tsx        # risk state banner + Scam DNA grid
            ├── Evidence.tsx       # scam | legitimacy | unknown columns + source badges
            ├── Question.tsx       # one targeted question + answer input
            ├── ActionPlan.tsx     # do-not-do + next 10 minutes + verification routes
            ├── GoldenHour.tsx     # live countdown + 1930 + evidence preservation (incident mode)
            └── LendingCheck.tsx   # match status + source + last-updated date
```

**25 source files.** Isse zyada banane ki zaroorat nahi hai.

---

## 2. Pipeline — one call

```text
POST /api/analyze
  │
  ├─ session.get_or_create()
  ├─ redact.scrub()            OTP/PIN/card/account numbers hatao — Claude ko bhejne se PEHLE
  ├─ prompt.build()            assess.md + input + prior session evidence + answers + lang
  ├─ claude call               multimodal, single, structured JSON out
  ├─ schemas.Assessment(**r)   Pydantic validate. Fail → retry once → UNCERTAIN fallback.
  ├─ guards.apply()            safety rules override model output
  ├─ actions.build()           deterministic, from risk_state + user_state
  └─ session.update() → return Verdict
```

Re-assessment (`/api/investigate`) wahi pipeline hai — session ki previous evidence + naya answer prompt mein jaata hai. **Alag code path mat banao.**

Action plan Claude se mat banwao. Wo fixed hai, deterministic hona chahiye, aur PS "post-incident guidance matches published procedures" maangta hai — model ko invent karne ka mauka mat do.

---

## 3. The contract (`schemas.py`)

```python
RiskState = Literal["LIKELY_LEGIT", "SUSPICIOUS", "HIGH_RISK", "UNCERTAIN"]
EvidenceType = Literal["OBSERVED", "VERIFIED", "INFERRED", "UNKNOWN", "CONFLICTING"]
UserState = Literal["nothing_done", "clicked_or_installed", "credentials_shared", "money_sent"]

class ScamDNA(BaseModel):
    impersonation: str | None        # bank / police / courier / utility / employer / govt / family
    urgency: Literal["none", "low", "medium", "high"]
    requested_action: list[str]      # click / install / transfer / call / share_otp
    payment_request: bool
    credential_risk: Literal["none", "possible", "explicit"]
    link_app_risk: Literal["none", "suspicious", "high"]
    manipulation: list[str]          # fear / authority / secrecy / reward / shame
    claim_type: str | None           # kyc_expiry / parcel_fee / digital_arrest / job_fee / ...
    channel: str

class Evidence(BaseModel):
    type: EvidenceType
    statement: str                   # user-facing, already in requested language
    source_id: str | None = None     # resolves against sources.json

class Assessment(BaseModel):          # <- exactly what Claude must return
    scam_dna: ScamDNA
    scam_evidence: list[Evidence]
    legitimacy_evidence: list[Evidence]
    unknowns: list[str]
    claims: list[str]
    risk_state: RiskState
    user_state: UserState
    needs_investigation: bool
    next_question: str | None
    summary: str

class Action(BaseModel):
    text: str
    kind: Literal["do_not", "do_now", "verify", "preserve"]
    deadline_minutes: int | None = None

class Verdict(Assessment):
    session_id: str
    actions: list[Action]
    sources: list[dict]
```

`assess.md` mein ye schema literally paste karo aur bolo "return only this JSON". Frontend `types.ts` isi ka mirror hai.

---

## 4. API

| Route | Purpose |
|---|---|
| `POST /api/analyze` | `{session_id?, input_type, text?, image_b64?, app_name?, lang}` → `Verdict` |
| `POST /api/investigate` | `{session_id, answer}` → updated `Verdict` |
| `POST /api/lending-app/check` | `{app_name}` → `{status: MATCHED\|NOT_FOUND\|AMBIGUOUS, entity?, source, last_updated}` |
| `DELETE /api/session/{id}` | explicit wipe — demo mein ye button dabana hai |
| `GET /api/health` | liveness |

---

## 5. Actions — deterministic table (`actions.py`)

| user_state | Output |
|---|---|
| `nothing_done` | **Do-not:** link mat kholo, OTP/PIN share mat karo, paisa mat bhejo. **Do-now:** claim ko independent official channel se verify karo (`trusted_routes.json` se). |
| `clicked_or_installed` | Containment: net off karo, app uninstall karo, device scan, bank ko alert. |
| `credentials_shared` | Password/PIN change, 2FA, bank ko block request. **Secret kabhi mat poochho — sirf kis type ka credential tha.** |
| `money_sent` | **Incident mode.** P1 bank/fraud team. P2 1930 + cybercrime portal. P3 evidence preserve (txn id, screenshots, number, URL). `deadline_minutes` set karo → GoldenHour timer chalta hai. |

Har action ka `source_id` `sources.json` mein resolve hona chahiye. Bina source ke user-facing factual claim allowed nahi.

---

## 6. Code-level guards (`guards.py`) — UI text nahi, actual code

```text
next_question mein OTP/PIN/password maanga  → question drop, fallback question
risk_state HIGH_RISK par evidence 0         → downgrade to UNCERTAIN
koi bhi numeric probability output          → strip (calibrated nahi hai)
source_id jo sources.json mein nahi hai     → evidence drop
lending "NOT_FOUND"                         → kabhi "fraud" mein convert mat karo
output mein suspicious link clickable       → render as plain text, never <a>
raw input logs mein                         → blocked (redact.py ke baad hi kuch log hota hai)
```

`test_pipeline.py` in saatoN ko assert kare. Yahi wo test hai jo judges ke saamne dikhaya ja sakta hai.

---

## 7. Zero retention

```text
request → session dict (RAM) → response → TTL 30 min ya explicit DELETE → gone
```

Persist kuch nahi hota. Logs mein sirf: `request_id, latency_ms, risk_state, error_type`.
Screenshot Claude API ko jaata hai — judge poochega. Jawab: PII pre-send redact hota hai, disk pe kuch nahi likha jaata, session RAM-only.

---

## 8. Demo path

`cases.json` se demo cases load hote hain aur **normal pipeline se hi** guzarte hain. UI mein hardcoded verdict bilkul nahi.

Demo order:

1. **Genuine bank SMS → LIKELY_LEGIT.** Pehle ye. False-positive handling hi "trusted" prove karta hai.
2. **Digital arrest / KYC scam → Scam DNA + evidence + UNKNOWNS panel.**
3. **Adhoora input → Claude ek question poochta hai → answer se verdict live badalta hai.**
4. **"Paisa ja chuka hai" → incident mode + golden-hour countdown + 1930.**
5. Hindi toggle. 6. Lending app check (source + last-updated date dikhana mandatory). 7. Delete session button.

---

## 9. Evaluation (`eval.py`)

`cases.json` pe chalao, print karo: classification accuracy, **false-alarm rate on genuine**, evidence fidelity (statement input mein actually hai ya nahi), uncertainty quality, mean latency.

Deck mein ek slide. **Numbers measured hone chahiye, invent nahi.** Zyadatar teams 3 messages demo karke ruk jayengi — ye slide tumhe serious banata hai.

---

## 10. Build order

| # | Kaam | Done = |
|---|---|---|
| 1 | `schemas.py` + `main.py` + stub `/analyze` | frontend parallel start ho sakta hai |
| 2 | `prompts/assess.md` + `pipeline.py` | ek paste kiya message real Assessment JSON deta hai |
| 3 | `Intake` + `Verdict` + `Evidence` | verdict screen pe dikh raha hai |
| 4 | `actions.py` + `ActionPlan` + `GoldenHour` | chaaron user_state ka plan aata hai |
| 5 | `Question` + `/investigate` | answer se verdict badalta hai — **ye demo ka core moment hai** |
| 6 | `guards.py` + `redact.py` + `session.py` + tests | safety story sach ho gayi |
| 7 | `lending.py` + `LendingCheck` | app lookup + source date |
| 8 | `i18n.ts` + lang param | Hindi toggle |
| 9 | `cases.json` + `eval.py` | deck ka numbers slide |
| 10 | Polish + demo 10 baar chalao | judging-day setup pe exactly |

Time kam pade to 7, 8, 9 ko slide bana do — code nahi.

---

## 11. Deliberately NOT built

| Skipped | Kyun / kab add karo |
|---|---|
| Database | PS zero retention maangta hai. Kabhi nahi, is product mein. |
| Mobile app | Demo laptop se hoga. Web ko responsive rakha hai. |
| 6 role-specific prompts | Latency criterion tod deta hai. Ek call quality mein barabar hai, speed mein jeet. |
| 15 alag core modules | Har module asal mein ek prompt field + ek Pydantic model hai. |
| 4-tier test pyramid | Ek `test_pipeline.py` jo saat guards assert kare — wahi asli value hai. |
| Auth / accounts | Zero retention ke saath contradictory. |
| Automatic reporting | PS constraint: advisory only. Kabhi nahi. |
| Help-desk staff mode | PS ka secondary user — deck slide #8 mein rakho. Code tabhi jab partner actually maange. |
| Call audio / voice-clone detection | Alag PS (SIH 26104). Yahan scope creep hai — call sirf text description se handle hoti hai. |

---

## 12. Ek line mein

```text
Multimodal input → redact → ONE Claude call → Scam DNA + scam/legitimacy evidence + unknowns
→ risk state → targeted question if uncertain → independent verification route
→ deterministic action plan → sources shown → session wiped
```

