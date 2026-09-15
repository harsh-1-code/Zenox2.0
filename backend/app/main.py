import logging
import time

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from . import lending, pipeline, session
from .schemas import AnalyzeRequest, InvestigateRequest, LendingRequest, Verdict

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


@app.post("/api/lending-app/check")
def lending_check(req: LendingRequest) -> dict:
    return lending.check(req.app_name)


@app.delete("/api/session/{session_id}")
def delete_session(session_id: str) -> dict:
    if not session.delete(session_id):
        raise HTTPException(404, "no such session")
    return {"deleted": True, "sessions_remaining": session.count()}


@app.get("/api/health")
def health() -> dict:
    return {"ok": True, "active_sessions": session.count()}
