import random
import time


def sample_metrics() -> dict:
    """
    Returns simulated eye-tracking metrics.
    Used by the /ws/live WebSocket endpoint when no real camera data is available.
    """
    bpm = random.randint(8, 20)
    ear = round(random.uniform(0.20, 0.42), 3)
    return {
        "bpm": bpm,
        "ear": ear,
        "too_close": random.random() < 0.08,
        "too_far": random.random() < 0.05,
        "drowsy": random.random() < 0.05,
        "ts": round(time.time(), 3),
    }