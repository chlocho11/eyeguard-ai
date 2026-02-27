import os
import asyncio
from datetime import datetime
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

# dotenv optional
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

from .models import SessionStartIn, SessionEventIn, SessionEndIn
from .session_service import start_session, add_event, end_session, latest_session
from .eye_simulator import sample_metrics
from .gemini_service import GeminiService

app = FastAPI(title="EyeGuard API")

origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

gemini = GeminiService | None = None

@app.on_event("startup")
async def _startup():
    global gemini
    if os.getenv("GEMINI_API_KEY", "").strip():
        gemini = GeminiService()

@app.get("/")
def root():
    return {"status": "EyeGuard backend running", "ts": datetime.utcnow().isoformat()}

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/api/session/start")
def api_start_session(body: SessionStartIn):
    sid = start_session(mode=body.mode, user_id=None)  # demo: no auth yet
    return {"session_id": sid}

@app.post("/api/session/event")
def api_event(body: SessionEventIn):
    event = body.model_dump()
    add_event(body.session_id, event)
    return {"ok": True}

@app.post("/api/session/end")
def api_end(body: SessionEndIn):
    summary = end_session(body.session_id)
    return {"ok": True, "summary": summary}

@app.get("/api/session/latest")
def api_latest():
    data = latest_session(user_id=None)
    return {"session": data}

@app.post("/api/gemini/tip")
def api_tip(payload: dict):
    if gemini is None:
        return {"tip": "Try the 20-20-20 rule: look far for 20 seconds."}

    bpm = int(payload.get("bpm", 15))
    too_close = bool(payload.get("too_close", False))
    too_far = bool(payload.get("too_far", False))
    drowsy = bool(payload.get("drowsy", False))
    mode = str(payload.get("mode", "eye_health"))
    tip = gemini.tip(bpm=bpm, too_close=too_close, too_far=too_far, drowsy=drowsy, mode=mode)
    return {"tip": tip}

@app.websocket("/ws/live")
async def ws_live(ws: WebSocket):
    await ws.accept()
    try:
        while True:
            await ws.send_json(sample_metrics())
            await asyncio.sleep(2)
    except Exception:
        # client disconnect etc.
        pass