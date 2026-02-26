export async function startSession(mode) {
  const r = await fetch("/api/session/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode, client_ts: Date.now() }),
  });
  if (!r.ok) throw new Error("startSession failed");
  return r.json(); // { session_id }
}

export async function sendEvent(event) {
  const r = await fetch("/api/session/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...event, client_ts: Date.now() }),
  });
  if (!r.ok) throw new Error("sendEvent failed");
}

export async function endSession(session_id) {
  const r = await fetch("/api/session/end", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id, client_ts: Date.now() }),
  });
  if (!r.ok) throw new Error("endSession failed");
  return r.json(); // { ok, summary }
}

export async function getLatestSession() {
  const r = await fetch("/api/session/latest");
  if (!r.ok) throw new Error("getLatestSession failed");
  return r.json(); // { session }
}

export async function getTip({ bpm, too_close, too_far, drowsy, mode }) {
  const r = await fetch("/api/gemini/tip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bpm, too_close, too_far, drowsy, mode }),
  });
  if (!r.ok) throw new Error("getTip failed");
  return r.json(); 
}

