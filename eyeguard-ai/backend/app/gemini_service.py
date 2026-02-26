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

    def tip(self, bpm: int, too_close: bool, too_far: bool, drowsy: bool) -> str:
        prompt = (
            "You are an eye-health assistant for screen users. "
            "Give ONE short actionable tip (max 2 sentences). "
            f"Metrics: blink_rate_bpm={bpm}, too_close={too_close}, too_far={too_far}, drowsy={drowsy}. "
            "Avoid medical diagnosis; give safe general advice."
        )
        resp = self.model.generate_content(prompt)
        text = (resp.text or "").strip()
        return text if text else "Try the 20-20-20 rule: every 20 minutes, look 20 feet away for 20 seconds."