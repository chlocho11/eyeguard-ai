from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import cv2
import base64
import json
import numpy as np
import asyncio
import time
from app.eye_tracker import EyeTracker
from app.gemini_service import get_health_tip

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Track when we last called Gemini (avoid spamming)
last_tip_time = {}
last_tip_text = {}
TIP_COOLDOWN  = 60  # seconds between tips

@app.get("/")
def root():
    return {"status": "EyeGuard-AI backend running"}

@app.websocket("/ws/track")
async def websocket_track(websocket: WebSocket):
    await websocket.accept()
    tracker = EyeTracker()
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        await websocket.send_text(json.dumps({"error": "Camera not found"}))
        await websocket.close()
        return

    print("WebSocket connected — starting eye tracking")

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            metrics = tracker.process_frame(frame)

            # --- Gemini tip logic ---
            alert = metrics.get("alert")
            tip   = last_tip_text.get(alert, None)

            if alert:
                now      = time.time()
                last_t   = last_tip_time.get(alert, 0)
                if now - last_t > TIP_COOLDOWN:
                    # Run Gemini in background thread (non-blocking)
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

            # --- Encode frame as base64 JPEG to send to frontend ---
            _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 60])
            frame_b64 = base64.b64encode(buffer).decode("utf-8")
            metrics["frame"] = frame_b64

            await websocket.send_text(json.dumps(metrics))
            await asyncio.sleep(0.05)  # ~20fps

    except WebSocketDisconnect:
        print("Client disconnected")
    finally:
        cap.release()
        print("Camera released")