from google import genai
import os
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def get_health_tip(alert_type: str, bpm: int, bpm_drop_pct: float, session_seconds: int) -> str:
    session_min = round(session_seconds / 60, 1)
    prompts = {
        "dry_eyes": f"A user has been on screen for {session_min} minutes. Their blink rate is {bpm} blinks/min, which is {bpm_drop_pct}% below normal. Their eyes are likely dry. Give a SHORT (2-3 sentence) friendly, warm, actionable eye health tip. No bullet points.",
        "drowsy":   f"A user has been on screen for {session_min} minutes and shows drowsiness. Blink rate: {bpm}/min. Give a SHORT (2-3 sentence) friendly tip to help them stay alert or rest properly. No bullet points.",
        "too_close":f"A user has been sitting too close to their screen for {session_min} minutes. Give a SHORT (2-3 sentence) friendly reminder about screen distance and posture. No bullet points."
    }
    prompt = prompts.get(alert_type, "Give a short general eye health tip.")
    try:
        response = client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
        return response.text.strip()
    except Exception as e:
        print(f"Gemini error: {e}")
        fallback = {
            "dry_eyes" : "Your blink rate has dropped. Try the 20-20-20 rule: look at something 20 feet away for 20 seconds.",
            "drowsy"   : "You seem drowsy. Stand up, splash cold water on your face, and take a 5-minute walk.",
            "too_close": "You're sitting too close. Move back to at least arm's length from your screen."
        }
        return fallback.get(alert_type, "Remember to take regular breaks for your eye health.")

def get_session_summary(duration: int, avg_bpm: float, total_blinks: int, alert_count: int, mode: str) -> str:
    duration_min = round(duration / 60, 1)
    mode_label   = "Eye Health Protection" if mode == "health" else "Focus & Productivity"
    prompt = f"""
    A user just completed a {duration_min}-minute screen session in {mode_label} mode.
    Stats: average blink rate {avg_bpm} blinks/min (normal: 15), total blinks: {total_blinks}, health alerts triggered: {alert_count}.
    Write a SHORT (3-4 sentence) warm, personalized session summary.
    Include: how their eye health was, one improvement tip, one encouraging note.
    No bullet points. Friendly tone.
    """
    try:
        response = client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
        return response.text.strip()
    except:
        return f"You completed a {duration_min}-minute session with {total_blinks} total blinks. Your average blink rate was {avg_bpm}/min. Remember to rest your eyes regularly and stay hydrated!"