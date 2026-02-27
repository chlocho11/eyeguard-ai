const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function startSession(mode) {
  try {
    const res = await fetch(`${BASE}/api/session/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    });
    const data = await res.json();
    return data.session_id;
  } catch (e) {
    console.warn("startSession failed:", e);
    return null;
  }
}

export async function sendEvent(session_id, payload) {
  if (!session_id) return;
  try {
    await fetch(`${BASE}/api/session/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id, ...payload }),
    });
  } catch (e) {
    console.warn("sendEvent failed:", e);
  }
}

export async function endSession(session_id) {
  if (!session_id) return;
  try {
    const res = await fetch(`${BASE}/api/session/end`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id }),
    });
    return res.json();
  } catch (e) {
    console.warn("endSession failed:", e);
  }
}

export async function getTip(payload) {
  try {
    const res = await fetch(`${BASE}/api/gemini/tip`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  } catch (e) {
    console.warn("getTip failed:", e);
    return { tip: "Remember the 20-20-20 rule — every 20 mins, look 20ft away for 20s!" };
  }
}