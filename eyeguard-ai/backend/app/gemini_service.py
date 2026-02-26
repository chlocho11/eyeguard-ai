import os
import google.generativeai as genai


class GeminiService:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY", "").strip()
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not set")

        genai.configure(api_key=api_key)
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash").strip()
        self.model = genai.GenerativeModel(self.model_name)

    def tip(self, bpm: int, too_close: bool, too_far: bool, drowsy: bool, mode: str = "eye_health") -> str:
        prompt = (
            "You are a witty, slightly obsessed eye-health coach (like the Duolingo owl). "
            "Your goal is to keep the user healthy with ONE short, punchy, and personality-filled tip. "
            "Guidelines: Use 1-2 sentences. Be encouraging, a bit cheeky, or use mild guilt-tripping if they aren't blinking. "
            f"Current State: Mode={mode}, BPM={bpm}, TooClose={too_close}, TooFar={too_far}, Drowsy={drowsy}. "
            "Rules: "
            "1. PRODUCTIVITY MODE: You are a HYPE-MAN. If drowsy, scream (in text) for them to wake up! "
            "Suggest coffee, a quick dance, or remind them they are almost at the finish line. Be loud and fun. "
            "2. EYE HEALTH MODE: You are a VISION GUARDIAN. If blinks are low, remind them their eyes aren't made of stone. "
            "Use 'dryness' as the villain. Remind them to blink to stay fresh. "
            "3. DISTANCE ALERTS: If too_close, act like they're trying to climb into the monitor. "
            "Constraint: No medical jargon. No 'please maintain 20 inches.' Use 'Back up, bestie!' instead."
        )
        resp = self.model.generate_content(prompt)
        text = (resp.text or "").strip()
        return text if text else "Try the 20-20-20 rule: every 20 minutes, look 20 feet away for 20 seconds."