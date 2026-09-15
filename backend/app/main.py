import logging
import time

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from . import config, helpdesk, lending, pipeline, session
from .schemas import (
    AnalyzeRequest,
    HelpdeskRequest,
    InvestigateRequest,
    LendingRequest,
    Verdict,
)

logging.basicConfig(level=logging.INFO, format="%(message)s")
log = logging.getLogger("sda")

app = FastAPI(title="Scam Decision Assistant", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/analyze", response_model=Verdict)
def analyze(req: AnalyzeRequest) -> Verdict:
    t0 = time.time()
    v = pipeline.assess(
        req.session_id, req.input_type, req.text, req.image_b64, req.app_name,
        req.lang, req.deep
    )
    # safe telemetry only - never the input
    log.info("analyze risk=%s researched=%s ms=%d", v.risk_state, v.researched,
             int((time.time() - t0) * 1000))
    return v


@app.post("/api/investigate", response_model=Verdict)
def investigate(req: InvestigateRequest) -> Verdict:
    return pipeline.reassess(req.session_id, req.answer, req.lang, req.deep)


@app.post("/api/helpdesk", response_model=None)
def helpdesk_view(req: HelpdeskRequest) -> dict:
    """Case summary + reporting script for a verdict the caller already has.

    Takes the Verdict back rather than reading the session, so a help-desk operator can
    produce the handout without the assessment being re-run or re-stored.
    """
    return {
        "case_summary": helpdesk.case_summary(req.verdict),
        "reporting_script": helpdesk.reporting_script(req.verdict),
    }


@app.post("/api/lending-app/check")
def lending_check(req: LendingRequest) -> dict:
    return lending.check(req.app_name)


@app.delete("/api/session/{session_id}")
def delete_session(session_id: str) -> dict:
    if not session.delete(session_id):
        raise HTTPException(404, "no such session")
    return {"deleted": True, "sessions_remaining": session.count()}


# Demo convenience: hand out the built APK without putting a 4 MB binary inside the
# web bundle (which would then ship inside the next APK).
_APK = (
    config.BASE.parent
    / "frontend/android/app/build/outputs/apk/debug/app-debug.apk"
)


@app.get("/api/download/apk")
def download_apk() -> FileResponse:
    if not _APK.exists():
        raise HTTPException(404, "APK not built yet")
    return FileResponse(
        _APK, media_type="application/vnd.android.package-archive",
        filename="digi-sanrakshak.apk",
    )


@app.get("/api/health")
def health() -> dict:
    return {"ok": True, "active_sessions": session.count()}
