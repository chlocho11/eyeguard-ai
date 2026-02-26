from datetime import datetime
from typing import Dict, Any, Optional
from .firebase import get_db

COL_SESSIONS = "sessions"


def start_session(mode: str, user_id: Optional[str] = None) -> str:
    db = get_db()
    doc = {
        "mode": mode,
        "user_id": user_id,
        "started_at": datetime.utcnow(),
        "ended_at": None,
        "summary": None,
        "event_count": 0,
        "avg_bpm": None,
        "avg_ear": None,
        "too_close_count": 0,
        "too_far_count": 0,
        "drowsy_count": 0,
    }
    ref = db.collection(COL_SESSIONS).document()
    ref.set(doc)
    return ref.id


def add_event(session_id: str, event: Dict[str, Any]) -> None:
    db = get_db()
    sref = db.collection(COL_SESSIONS).document(session_id)

    # Save event into subcollection
    eref = sref.collection("events").document()
    eref.set({**event, "server_at": datetime.utcnow()})

    snap = sref.get()
    if not snap.exists:
        return

    s = snap.to_dict() or {}
    count_prev = int(s.get("event_count") or 0)
    count = count_prev + 1

    prev_avg_bpm = float(s.get("avg_bpm") or 0.0) if s.get("avg_bpm") is not None else 0.0
    prev_avg_ear = float(s.get("avg_ear") or 0.0) if s.get("avg_ear") is not None else 0.0

    bpm = float(event.get("bpm") or 0.0)
    ear = float(event.get("ear") or 0.0)

    avg_bpm = (prev_avg_bpm * count_prev + bpm) / count
    avg_ear = (prev_avg_ear * count_prev + ear) / count

    updates = {
        "event_count": count,
        "avg_bpm": avg_bpm,
        "avg_ear": avg_ear,
        "too_close_count": int(s.get("too_close_count") or 0) + (1 if event.get("too_close") else 0),
        "too_far_count": int(s.get("too_far_count") or 0) + (1 if event.get("too_far") else 0),
        "drowsy_count": int(s.get("drowsy_count") or 0) + (1 if event.get("drowsy") else 0),
    }
    sref.update(updates)


def end_session(session_id: str):
    db = get_db()
    sref = db.collection(COL_SESSIONS).document(session_id)
    snap = sref.get()
    if not snap.exists:
        return None

    s = snap.to_dict() or {}
    summary = {
        "mode": s.get("mode"),
        "event_count": s.get("event_count"),
        "avg_bpm": s.get("avg_bpm"),
        "avg_ear": s.get("avg_ear"),
        "too_close_count": s.get("too_close_count"),
        "too_far_count": s.get("too_far_count"),
        "drowsy_count": s.get("drowsy_count"),
    }

    sref.update({"ended_at": datetime.utcnow(), "summary": summary})
    return summary


def latest_session(user_id: Optional[str] = None):
    db = get_db()
    q = db.collection(COL_SESSIONS).order_by("started_at", direction="DESCENDING").limit(1)
    docs = list(q.stream())
    if not docs:
        return None

    d = docs[0]
    out = d.to_dict() or {}
    out["id"] = d.id
    return out