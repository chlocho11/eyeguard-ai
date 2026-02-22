import { useState, useEffect, useRef } from "react"
import { Eye, EyeOff, Activity, Clock, AlertTriangle, CheckCircle, Zap } from "lucide-react"

const WS_URL = "ws://localhost:8000/ws/track"

const EXERCISES = [
  { title: "20-20-20 Rule", desc: "Look at something 20 feet away for 20 seconds." },
  { title: "Eye Rolling", desc: "Slowly roll your eyes clockwise, then counter-clockwise. Repeat 3x." },
  { title: "Palming", desc: "Rub hands together, cup them over closed eyes for 30 seconds." },
  { title: "Focus Shifting", desc: "Hold finger 10cm from face, focus on it, then focus far away. Repeat 10x." },
  { title: "Blink Training", desc: "Blink rapidly 10 times, then close eyes for 20 seconds. Repeat 3x." },
]

function StatCard({ icon, label, value, sub, color = "blue" }) {
  const colors = {
    blue:   "from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400",
    green:  "from-green-500/20 to-green-600/10 border-green-500/30 text-green-400",
    yellow: "from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 text-yellow-400",
    red:    "from-red-500/20 to-red-600/10 border-red-500/30 text-red-400",
    purple: "from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400",
  }
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-5 flex flex-col gap-2`}>
      <div className="flex items-center gap-2 opacity-80 text-sm">{icon}<span>{label}</span></div>
      <div className="text-3xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs opacity-60">{sub}</div>}
    </div>
  )
}

function AlertBanner({ alert, tip }) {
  if (!alert) return null
  const cfg = {
    dry_eyes:  { color: "border-yellow-400 bg-yellow-400/10", icon: <EyeOff size={20} className="text-yellow-400"/>, label: "Dry Eyes Detected" },
    drowsy:    { color: "border-red-400 bg-red-400/10",    icon: <AlertTriangle size={20} className="text-red-400"/>, label: "Drowsiness Detected" },
    too_close: { color: "border-orange-400 bg-orange-400/10", icon: <AlertTriangle size={20} className="text-orange-400"/>, label: "Too Close to Screen" },
  }
  const c = cfg[alert] || cfg.dry_eyes
  return (
    <div className={`border ${c.color} rounded-2xl p-4 flex gap-3 items-start animate-pulse`}>
      <div className="mt-0.5">{c.icon}</div>
      <div>
        <div className="font-semibold text-white">{c.label}</div>
        {tip && <div className="text-sm opacity-80 mt-1 text-white">{tip}</div>}
      </div>
    </div>
  )
}

export default function App() {
  const [metrics, setMetrics]     = useState(null)
  const [running, setRunning]     = useState(false)
  const [frame, setFrame]         = useState(null)
  const [showEx, setShowEx]       = useState(false)
  const [wsError, setWsError]     = useState(null)
  const wsRef = useRef(null)

  const startTracking = () => {
    setWsError(null)
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => { setRunning(true); console.log("WS connected") }

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.error) { setWsError(data.error); return }
      const { frame, ...rest } = data
      setMetrics(rest)
      if (frame) setFrame("data:image/jpeg;base64," + frame)
    }

    ws.onerror = () => setWsError("Could not connect to backend. Is it running?")
    ws.onclose = () => { setRunning(false); setFrame(null) }
  }

  const stopTracking = () => {
    wsRef.current?.close()
    setRunning(false)
    setMetrics(null)
    setFrame(null)
  }

  useEffect(() => () => wsRef.current?.close(), [])

  const formatTime = (s) => {
    if (!s) return "0:00"
    const m = Math.floor(s / 60), sec = s % 60
    return `${m}:${sec.toString().padStart(2, "0")}`
  }

  const bpmColor = () => {
    if (!metrics?.bpm) return "blue"
    if (metrics.bpm < 8) return "red"
    if (metrics.bpm < 12) return "yellow"
    return "green"
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
            <Eye size={18} />
          </div>
          <span className="text-lg font-bold">EyeGuard AI</span>
          <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">SDG 3</span>
        </div>
        <div className="flex items-center gap-2">
          {running && (
            <span className="flex items-center gap-1.5 text-green-400 text-sm">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block"/>
              Live
            </span>
          )}
          <button
            onClick={running ? stopTracking : startTracking}
            className={`px-5 py-2 rounded-xl font-semibold text-sm transition-all ${
              running
                ? "bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            {running ? "Stop Session" : "Start Tracking"}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col gap-6">

        {/* Error */}
        {wsError && (
          <div className="border border-red-400/40 bg-red-400/10 rounded-2xl p-4 text-red-400 text-sm">
            ⚠️ {wsError}
          </div>
        )}

        {/* Alert Banner */}
        {metrics && <AlertBanner alert={metrics.alert} tip={metrics.tip} />}

        {/* Not started state */}
        {!running && !metrics && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-60">
            <Eye size={48} />
            <p className="text-lg">Click <strong>Start Tracking</strong> to begin your session</p>
            <p className="text-sm">Your webcam will activate and EyeGuard AI will monitor your eye health in real time.</p>
          </div>
        )}

        {/* Main content */}
        {running && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Left: Camera */}
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl overflow-hidden border border-white/10 bg-gray-900 aspect-video flex items-center justify-center">
                {frame
                  ? <img src={frame} alt="webcam" className="w-full h-full object-cover"/>
                  : <div className="text-white/30 text-sm">Waiting for camera...</div>
                }
              </div>

              {/* Status row */}
              <div className="flex gap-3">
                <div className={`flex-1 rounded-xl border p-3 text-center text-sm ${
                  metrics?.face_detected
                    ? "border-green-500/30 bg-green-500/10 text-green-400"
                    : "border-red-500/30 bg-red-500/10 text-red-400"
                }`}>
                  {metrics?.face_detected ? "✓ Face Detected" : "✗ No Face"}
                </div>
                <div className={`flex-1 rounded-xl border p-3 text-center text-sm ${
                  metrics?.too_close
                    ? "border-orange-500/30 bg-orange-500/10 text-orange-400"
                    : "border-green-500/30 bg-green-500/10 text-green-400"
                }`}>
                  {metrics?.too_close ? "⚠ Too Close" : "✓ Good Distance"}
                </div>
                <div className={`flex-1 rounded-xl border p-3 text-center text-sm ${
                  metrics?.drowsy
                    ? "border-red-500/30 bg-red-500/10 text-red-400"
                    : "border-green-500/30 bg-green-500/10 text-green-400"
                }`}>
                  {metrics?.drowsy ? "😴 Drowsy" : "✓ Alert"}
                </div>
              </div>
            </div>

            {/* Right: Stats */}
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  icon={<Activity size={16}/>}
                  label="Blink Rate"
                  value={`${metrics?.bpm ?? 0}`}
                  sub="blinks / min (normal: 15)"
                  color={bpmColor()}
                />
                <StatCard
                  icon={<Eye size={16}/>}
                  label="Total Blinks"
                  value={metrics?.blink_count ?? 0}
                  sub="this session"
                  color="purple"
                />
                <StatCard
                  icon={<Clock size={16}/>}
                  label="Session Time"
                  value={formatTime(metrics?.session_seconds)}
                  sub="mm:ss"
                  color="blue"
                />
                <StatCard
                  icon={<Zap size={16}/>}
                  label="BPM Drop"
                  value={`${metrics?.bpm_drop_pct ?? 0}%`}
                  sub="vs normal baseline"
                  color={metrics?.bpm_drop_pct > 50 ? "red" : "green"}
                />
              </div>

              {/* EAR bar */}
              <div className="bg-gray-900 border border-white/10 rounded-2xl p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="opacity-60">Eye Openness (EAR)</span>
                  <span className="font-mono">{metrics?.ear ?? 0}</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all duration-200 bg-blue-500"
                    style={{ width: `${Math.min(100, (metrics?.ear ?? 0) * 400)}%` }}
                  />
                </div>
                <div className="text-xs opacity-40 mt-1">Below 0.21 = eye closed</div>
              </div>

              {/* Gemini tip box */}
              {metrics?.tip && !metrics?.alert && (
                <div className="border border-blue-500/30 bg-blue-500/10 rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold mb-1">
                    <Zap size={14}/> AI Health Tip
                  </div>
                  <p className="text-sm opacity-80">{metrics.tip}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Eye Exercises Panel */}
        <div className="border border-white/10 rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowEx(!showEx)}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-all"
          >
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle size={18} className="text-green-400"/> Eye Relaxation Exercises
            </div>
            <span className="text-white/40 text-sm">{showEx ? "▲ Hide" : "▼ Show"}</span>
          </button>
          {showEx && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 border-t border-white/10">
              {EXERCISES.map((ex, i) => (
                <div key={i} className="bg-gray-900 rounded-xl p-4 border border-white/5">
                  <div className="font-semibold text-sm text-blue-400 mb-1">{ex.title}</div>
                  <div className="text-xs opacity-60">{ex.desc}</div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}