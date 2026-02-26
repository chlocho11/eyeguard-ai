import random


def sample_metrics():
    is_drowsy = random.random() > 0.9
    return {
        "bpm": random.randint(12, 18),
        "ear": round(random.uniform(0.20, 0.40), 2),
        "too_close": random.random() > 0.85,
        "too_far": random.random() > 0.90,
        "drowsy": is_drowsy,
    }