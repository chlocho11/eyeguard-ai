from google import genai
import os
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def get_health_tip(alert_type: str, bpm: int, bpm_drop_pct: float, session_seconds: int) -> str:
    session_min = round(session_seconds / 60, 1)

    prompts = {
        "dry_eyes": f"""
            A user has been on screen for {session_min} minutes.
            Their blink rate is {bpm} blinks/min, which is {bpm_drop_pct}% below normal.
            Their eyes are likely dry and strained.
            Give a SHORT (2-3 sentence) friendly, personalized eye health tip.
            Be specific, warm, and actionable. Do not use bullet points.
        """,
        "drowsy": f"""
            A user has been on screen for {session_min} minutes and is showing drowsiness signs.
            Their blink rate is {bpm} blinks/min.
            Give a SHORT (2-3 sentence) friendly tip to help them stay alert or take a proper break.
            Be specific, warm, and actionable. Do not use bullet points.
        """,
        "too_close": f"""
            A user has been sitting too close to their screen for {session_min} minutes.
            Give a SHORT (2-3 sentence) friendly reminder about proper screen distance and posture.
            Be specific, warm, and actionable. Do not use bullet points.
        """
    }

    prompt = prompts.get(alert_type, "Give a short general eye health tip.")

    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        print(f"Gemini error: {e}")
        fallback = {
            "dry_eyes" : "Your blink rate has dropped. Try the 20-20-20 rule: look at something 20 feet away for 20 seconds.",
            "drowsy"   : "You seem drowsy. Stand up, splash cold water on your face, and take a 5 minute walk.",
            "too_close": "You're sitting too close to the screen. Move back to at least arm's length distance."
        }
        return fallback.get(alert_type, "Remember to take regular breaks for your eye health.")