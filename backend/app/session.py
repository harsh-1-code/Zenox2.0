"""In-memory, TTL-bounded session store. Nothing touches disk. PS: zero retention."""

from typing import Optional
import time
import uuid

from .config import SESSION_TTL_MIN

_store: dict[str, dict] = {}


def _sweep() -> None:
    cutoff = time.time() - SESSION_TTL_MIN * 60
    for sid in [s for s, v in _store.items() if v["ts"] < cutoff]:
        _store.pop(sid, None)


def get_or_create(session_id: Optional[str]) -> tuple[str, dict]:
    _sweep()
    if session_id and session_id in _store:
        return session_id, _store[session_id]["data"]
    sid = session_id or uuid.uuid4().hex
    _store[sid] = {"ts": time.time(), "data": {"history": []}}
    return sid, _store[sid]["data"]


def update(session_id: str, data: dict) -> None:
    _store[session_id] = {"ts": time.time(), "data": data}


def delete(session_id: str) -> bool:
    return _store.pop(session_id, None) is not None


def count() -> int:
    _sweep()
    return len(_store)
