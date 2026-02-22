import cv2
import mediapipe as mp
import time
from collections import deque

# Eye landmark indices from MediaPipe Face Mesh
LEFT_EYE = [362, 385, 387, 263, 373, 380]
RIGHT_EYE = [33, 160, 158, 133, 153, 144]

def eye_aspect_ratio(landmarks, eye_indices, img_w, img_h):
    """Calculate Eye Aspect Ratio (EAR) - drops when eye closes"""
    points = []
    for idx in eye_indices:
        lm = landmarks[idx]
        points.append((lm.x * img_w, lm.y * img_h))

    # Vertical distances
    v1 = ((points[1][0]-points[5][0])**2 + (points[1][1]-points[5][1])**2) ** 0.5
    v2 = ((points[2][0]-points[4][0])**2 + (points[2][1]-points[4][1])**2) ** 0.5
    # Horizontal distance
    h  = ((points[0][0]-points[3][0])**2 + (points[0][1]-points[3][1])**2) ** 0.5

    return (v1 + v2) / (2.0 * h) if h > 0 else 0

class EyeTracker:
    EAR_THRESHOLD   = 0.21   # below this = eye closed
    BLINK_CONSEC    = 2       # frames eye must be closed to count as blink
    NORMAL_BPM      = 15      # normal blinks per minute baseline

    def __init__(self):
        self.face_mesh = mp.solutions.face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.reset()

    def reset(self):
        self.blink_count       = 0
        self.frame_counter     = 0   # consecutive closed frames
        self.session_start     = time.time()
        self.blink_times       = deque(maxlen=60)  # timestamps of last 60 blinks
        self.last_bpm          = 0
        self.ear_history       = deque(maxlen=10)
        self.drowsy_frames     = 0

    def process_frame(self, frame):
        """Process one frame. Returns dict of metrics."""
        img_h, img_w = frame.shape[:2]
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(rgb)

        metrics = {
            "face_detected"  : False,
            "ear"            : 0.0,
            "blink_count"    : self.blink_count,
            "bpm"            : 0,
            "bpm_drop_pct"   : 0,
            "drowsy"         : False,
            "too_close"      : False,
            "session_seconds": int(time.time() - self.session_start),
            "alert"          : None
        }

        if not results.multi_face_landmarks:
            return metrics

        lm = results.multi_face_landmarks[0].landmark
        metrics["face_detected"] = True

        # --- EAR calculation ---
        left_ear  = eye_aspect_ratio(lm, LEFT_EYE,  img_w, img_h)
        right_ear = eye_aspect_ratio(lm, RIGHT_EYE, img_w, img_h)
        ear = (left_ear + right_ear) / 2.0
        metrics["ear"] = round(ear, 3)
        self.ear_history.append(ear)

        # --- Blink detection ---
        if ear < self.EAR_THRESHOLD:
            self.frame_counter += 1
        else:
            if self.frame_counter >= self.BLINK_CONSEC:
                self.blink_count += 1
                self.blink_times.append(time.time())
                metrics["blink_count"] = self.blink_count
            self.frame_counter = 0

        # --- Blinks per minute (rolling 60s window) ---
        now = time.time()
        recent = [t for t in self.blink_times if now - t <= 60]
        bpm = len(recent)
        self.last_bpm = bpm
        metrics["bpm"] = bpm

        # --- BPM drop % vs normal baseline ---
        if bpm > 0:
            drop = max(0, (self.NORMAL_BPM - bpm) / self.NORMAL_BPM * 100)
            metrics["bpm_drop_pct"] = round(drop, 1)

        # --- Drowsiness: EAR low for many frames ---
        avg_ear = sum(self.ear_history) / len(self.ear_history)
        if avg_ear < 0.18:
            self.drowsy_frames += 1
        else:
            self.drowsy_frames = max(0, self.drowsy_frames - 1)
        metrics["drowsy"] = self.drowsy_frames > 15

        # --- Distance: face bounding box size ---
        xs = [lm[i].x for i in range(0, 468)]
        face_width = (max(xs) - min(xs)) * img_w
        metrics["too_close"] = face_width > img_w * 0.55

        # --- Smart alert logic ---
        if metrics["drowsy"]:
            metrics["alert"] = "drowsy"
        elif metrics["bpm_drop_pct"] > 50 and bpm > 0:
            metrics["alert"] = "dry_eyes"
        elif metrics["too_close"]:
            metrics["alert"] = "too_close"

        return metrics