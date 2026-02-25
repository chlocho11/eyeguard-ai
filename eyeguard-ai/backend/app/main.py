from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import cv2
import base64
import json
import asyncio
import time
from app.eye_tracker import EyeTracker
from app.gemini_service import get_health_tip, get_session_summary

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

last_tip_time = {}
last_tip_text = {}
TIP_COOLDOWN  = 60

@app.get("/")
def root():
    return {"status": "EyeGuard-AI backend running"}

@app.websocket("/ws/track")
async def websocket_track(websocket: WebSocket):
    await websocket.accept()

    # Read mode from query param: ?mode=health or ?mode=productivity
    mode = websocket.query_params.get("mode", "health")

    tracker = EyeTracker(mode=mode)
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        await websocket.send_text(json.dumps({"error": "Camera not found"}))
        await websocket.close()
        return

    blink_history = []  # (timestamp, bpm) for session summary

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            metrics = tracker.process_frame(frame)

            # Track bpm over time for summary graph
            if metrics.get("bpm", 0) > 0:
                blink_history.append({
                    "t": metrics["session_seconds"],
                    "bpm": metrics["bpm"]
                })

            # Gemini tip logic
            alert = metrics.get("alert")
            tip   = last_tip_text.get(alert)

            if alert:
                now    = time.time()
                last_t = last_tip_time.get(alert, 0)
                if now - last_t > TIP_COOLDOWN:
                    tip = await asyncio.to_thread(
                        get_health_tip,
                        alert,
                        metrics["bpm"],
                        metrics["bpm_drop_pct"],
                        metrics["session_seconds"]
                    )
                    last_tip_time[alert] = now
                    last_tip_text[alert] = tip

            metrics["tip"] = tip
            metrics["mode"] = mode
            metrics["blink_history"] = blink_history[-60:]  # last 60 data points

            _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 60])
            metrics["frame"] = base64.b64encode(buffer).decode("utf-8")

            await websocket.send_text(json.dumps(metrics))
            await asyncio.sleep(0.05)

    except WebSocketDisconnect:
        print("Client disconnected")
    finally:
        cap.release()

@app.post("/summary")
async def get_summary(data: dict):
    summary = await asyncio.to_thread(
        get_session_summary,
        data.get("duration", 0),
        data.get("avg_bpm", 0),
        data.get("total_blinks", 0),
        data.get("alert_count", 0),
        data.get("mode", "health")
    )
    return {"summary": summary}