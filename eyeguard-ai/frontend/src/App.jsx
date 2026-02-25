import { useState, useEffect, useRef, useCallback } from "react"
import { Eye, EyeOff, Activity, Clock, AlertTriangle, CheckCircle, Zap, Shield, Brain, ChevronRight, BarChart2, X } from "lucide-react"

const WS_URL = "ws://localhost:8000/ws/track"

// ─── Colour tokens ───────────────────────────────────────────────────────────
const MODE = {
  health:       { accent: "#22d3ee", glow: "rgba(34,211,238,0.15)", label: "Eye Health Mode",      icon: <Shield size={20}/> },
  productivity: { accent: "#a78bfa", glow: "rgba(167,139,250,0.15)", label: "Productivity Mode", icon: <Brain  size={20}/> },
}

const EXERCISES = [
  { title: "20-20-20 Rule",   desc: "Look at something 20 feet away for 20 seconds every 20 minutes." },
  { title: "Eye Rolling",     desc: "Slowly roll eyes clockwise then counter-clockwise. Repeat 3×." },
  { title: "Palming",         desc: "Cup warm hands over closed eyes for 30 seconds." },
  { title: "Focus Shifting",  desc: "Alternate focus between finger 10 cm away and a far object. 10×." },
  { title: "Blink Training",  desc: "Blink rapidly 10×, then close eyes 20 s. Repeat 3×." },
]

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
function fmt(s) {
  if (!s) return "0:00"
  return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`
}
function healthScore(bpm, alerts, secs) {
  if (!secs) return 100
  let score = 100
  if (bpm < 8)  score -= 30
  else if (bpm < 12) score -= 15
  score -= Math.min(40, alerts * 10)
  return Math.max(0, score)
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Pill({ children, color = "#22d3ee" }) {
  return (
    <span style={{ background: color+"22", border: `1px solid ${color}44`, color }}
      className="text-xs px-2.5 py-0.5 rounded-full font-semibold tracking-wide">
      {children}
    </span>
  )
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ borderColor: accent+"33", background: accent+"0d" }}
      className="rounded-2xl border p-4 flex flex-col gap-1">
      <div className="text-xs opacity-50 uppercase tracking-widest">{label}</div>
      <div className="text-3xl font-black text-white">{value}</div>
      {sub && <div className="text-xs opacity-40">{sub}</div>}
    </div>
  )
}

function StatusChip({ ok, labelOk, labelBad }) {
  return (
    <div style={{ background: ok ? "#22c55e18" : "#ef444418", border: `1px solid ${ok?"#22c55e":"#ef4444"}44`,
        color: ok ? "#4ade80" : "#f87171" }}
      className="flex-1 rounded-xl py-2.5 text-center text-xs font-semibold">
      {ok ? `✓ ${labelOk}` : `⚠ ${labelBad}`}
    </div>
  )
}

function AlertBanner({ alert, tip, accent }) {
  if (!alert) return null
  const cfg = {
    dry_eyes:  { label: "Dry Eyes Detected",        color: "#facc15" },
    drowsy:    { label: "Drowsiness Detected",       color: "#f87171" },
    too_close: { label: "Too Close to Screen",       color: "#fb923c" },
  }
  const c = cfg[alert] || cfg.dry_eyes
  return (
    <div style={{ borderColor: c.color+"66", background: c.color+"11" }}
      className="rounded-2xl border p-4 flex gap-3 items-start">
      <AlertTriangle size={18} style={{ color: c.color }} className="mt-0.5 shrink-0"/>
      <div>
        <div className="font-bold text-white text-sm">{c.label}</div>
        {tip && <div className="text-xs opacity-70 mt-1 text-white leading-relaxed">{tip}</div>}
      </div>
    </div>
  )
}

// ─── PAGES ────────────────────────────────────────────────────────────────────

function LandingPage({ onStart }) {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Nav */}
      <nav className="px-8 py-5 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center">
            <Eye size={16} className="text-white"/>
          </div>
          <span className="font-black text-white text-lg tracking-tight">EyeGuard AI</span>
        </div>
        <div className="flex items-center gap-3">
          <Pill color="#22d3ee">SDG 3</Pill>
          <Pill color="#a78bfa">Powered by Gemini</Pill>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-8 py-16">
        <div className="flex flex-col items-center gap-5">
          <div style={{ background: "radial-gradient(circle, rgba(34,211,238,0.15) 0%, transparent 70%)" }}
            className="w-24 h-24 rounded-full flex items-center justify-center">
            <Eye size={44} className="text-cyan-400"/>
          </div>
          <h1 className="text-5xl font-black text-white leading-tight max-w-xl">
            Your Intelligent<br/>
            <span className="text-cyan-400">Eye Health</span> Companion
          </h1>
          <p className="text-white/50 text-lg max-w-md leading-relaxed">
            AI-powered real-time blink monitoring, fatigue detection, and personalized eye health coaching — aligned with <strong className="text-white/70">UN SDG 3</strong>.
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-3 justify-center">
          {["Real-time Blink Detection","AI Adaptive Reminders","Drowsiness Detection","Personalized Exercises","Screen Distance Monitor"].map(f=>(
            <div key={f} className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-sm text-white/70">
              <CheckCircle size={13} className="text-cyan-400"/> {f}
            </div>
          ))}
        </div>

        <button onClick={onStart}
          className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-black px-8 py-4 rounded-2xl text-lg transition-all hover:scale-105 shadow-lg shadow-cyan-500/30">
          Start Monitoring <ChevronRight size={20}/>
        </button>

        {/* SDG callout */}
        <div className="max-w-lg bg-white/3 border border-white/8 rounded-2xl p-5 text-left">
          <div className="text-xs text-cyan-400 font-bold uppercase tracking-widest mb-2">SDG 3 — Good Health & Well-Being</div>
          <p className="text-white/50 text-sm leading-relaxed">
            Over 60% of people experience digital eye strain. Prolonged screen exposure reduces blink rate by up to 66%, causing dryness, myopia progression, and fatigue. EyeGuard AI uses real computer vision to detect these risks before they cause harm.
          </p>
        </div>
      </div>
    </div>
  )
}

function ModeSelectionPage({ onSelect }) {
  const [hovered, setHovered] = useState(null)
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6 gap-10">
      <div className="text-center">
        <h2 className="text-3xl font-black text-white mb-2">Choose Your Mode</h2>
        <p className="text-white/40 text-sm">Each mode prioritizes different aspects of your wellbeing</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl">
        {/* Health Mode */}
        <button
          onMouseEnter={()=>setHovered("health")}
          onMouseLeave={()=>setHovered(null)}
          onClick={()=>onSelect("health")}
          style={{ borderColor: hovered==="health" ? "#22d3ee88" : "#ffffff14",
            background: hovered==="health" ? "rgba(34,211,238,0.07)" : "rgba(255,255,255,0.02)" }}
          className="rounded-3xl border p-7 flex flex-col gap-4 text-left transition-all cursor-pointer">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center">
            <Shield size={22} className="text-cyan-400"/>
          </div>
          <div>
            <div className="text-white font-black text-lg mb-1">Eye Health Mode</div>
            <div className="text-white/40 text-sm leading-relaxed">Focuses on preventing eye strain, dryness, and myopia. Alerts trigger on low blink rate and poor screen distance.</div>
          </div>
          <div className="flex flex-wrap gap-2 mt-1">
            {["Blink monitoring","Distance warnings","Eye exercises"].map(t=>(
              <span key={t} className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-1 rounded-full">{t}</span>
            ))}
          </div>
          <div className="flex items-center gap-1 text-cyan-400 text-sm font-bold mt-1">
            Select <ChevronRight size={16}/>
          </div>
        </button>

        {/* Productivity Mode */}
        <button
          onMouseEnter={()=>setHovered("productivity")}
          onMouseLeave={()=>setHovered(null)}
          onClick={()=>onSelect("productivity")}
          style={{ borderColor: hovered==="productivity" ? "#a78bfa88" : "#ffffff14",
            background: hovered==="productivity" ? "rgba(167,139,250,0.07)" : "rgba(255,255,255,0.02)" }}
          className="rounded-3xl border p-7 flex flex-col gap-4 text-left transition-all cursor-pointer">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/20 flex items-center justify-center">
            <Brain size={22} className="text-violet-400"/>
          </div>
          <div>
            <div className="text-white font-black text-lg mb-1">Productivity Mode</div>
            <div className="text-white/40 text-sm leading-relaxed">Focuses on detecting drowsiness and micro-sleeps. Keeps you alert and prevents burnout during long work sessions.</div>
          </div>
          <div className="flex flex-wrap gap-2 mt-1">
            {["Drowsiness detection","Focus alerts","Anti-burnout tips"].map(t=>(
              <span key={t} className="text-xs bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2.5 py-1 rounded-full">{t}</span>
            ))}
          </div>
          <div className="flex items-center gap-1 text-violet-400 text-sm font-bold mt-1">
            Select <ChevronRight size={16}/>
          </div>
        </button>
      </div>

      <p className="text-white/20 text-xs">Both modes use Google MediaPipe + Gemini AI</p>
    </div>
  )
}

function SessionSummaryPage({ data, mode, onRestart }) {
  const [summary, setSummary] = useState("Generating your personalized summary...")
  const accent = MODE[mode].accent

  useEffect(() => {
    fetch("http://localhost:8000/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then(r => r.json())
      .then(d => setSummary(d.summary))
      .catch(() => setSummary("Great session! Remember to rest your eyes regularly."))
  }, [])

  const score = healthScore(data.avg_bpm, data.alert_count, data.duration)

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6 py-12 gap-8">
      <div className="text-center">
        <div className="text-white/40 text-sm mb-1">Session Complete</div>
        <h2 className="text-3xl font-black text-white">Your Session Summary</h2>
      </div>

      {/* Health score ring */}
      <div className="flex flex-col items-center gap-2">
        <div style={{ background: `conic-gradient(${accent} ${score}%, #ffffff14 0)` }}
          className="w-32 h-32 rounded-full flex items-center justify-center"
          title="Health Score">
          <div className="w-24 h-24 bg-gray-950 rounded-full flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-white">{score}</span>
            <span className="text-xs opacity-40">/ 100</span>
          </div>
        </div>
        <div className="text-white/40 text-sm">Eye Health Score</div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl">
        <StatCard label="Duration"     value={fmt(data.duration)}    sub="mm:ss"          accent={accent}/>
        <StatCard label="Avg Blink/m"  value={data.avg_bpm}          sub="normal: 15"     accent={accent}/>
        <StatCard label="Total Blinks" value={data.total_blinks}     sub="this session"   accent={accent}/>
        <StatCard label="Alerts"       value={data.alert_count}      sub="triggered"      accent={accent}/>
      </div>

      {/* AI Summary */}
      <div style={{ borderColor: accent+"33", background: accent+"0a" }}
        className="w-full max-w-2xl rounded-2xl border p-5">
        <div style={{ color: accent }} className="flex items-center gap-2 text-sm font-bold mb-2">
          <Zap size={14}/> AI-Generated Summary (Gemini)
        </div>
        <p className="text-white/70 text-sm leading-relaxed">{summary}</p>
      </div>

      <button onClick={onRestart}
        style={{ background: accent, color: "#030712" }}
        className="font-black px-8 py-3.5 rounded-2xl text-sm hover:opacity-90 transition-all">
        Start New Session
      </button>
    </div>
  )
}

function DashboardPage({ mode, onEnd }) {
  const [metrics, setMetrics]   = useState(null)
  const [frame, setFrame]       = useState(null)
  const [wsError, setWsError]   = useState(null)
  const [showEx, setShowEx]     = useState(false)
  const [alertCount, setAlertCount] = useState(0)
  const [bpmSum, setBpmSum]     = useState(0)
  const [bpmCount, setBpmCount] = useState(0)
  const wsRef   = useRef(null)
  const prevAlert = useRef(null)
  const accent  = MODE[mode].accent

  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}?mode=${mode}`)
    wsRef.current = ws
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.error) { setWsError(data.error); return }
      const { frame: f, ...rest } = data
      setMetrics(rest)
      if (f) setFrame("data:image/jpeg;base64," + f)
      // track alert count
      if (data.alert && data.alert !== prevAlert.current) {
        setAlertCount(c => c + 1)
        prevAlert.current = data.alert
      }
      if (!data.alert) prevAlert.current = null
      if (data.bpm > 0) { setBpmSum(s=>s+data.bpm); setBpmCount(c=>c+1) }
    }
    ws.onerror = () => setWsError("Cannot connect to backend.")
    return () => ws.close()
  }, [mode])

  const handleEnd = () => {
    wsRef.current?.close()
    onEnd({
      duration:     metrics?.session_seconds ?? 0,
      avg_bpm:      bpmCount ? Math.round(bpmSum/bpmCount) : 0,
      total_blinks: metrics?.blink_count ?? 0,
      alert_count:  alertCount,
      mode
    })
  }

  const bpmColor = () => {
    if (!metrics?.bpm) return "#64748b"
    if (metrics.bpm < 8) return "#f87171"
    if (metrics.bpm < 12) return "#facc15"
    return "#4ade80"
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: accent+"22" }}>
            <Eye size={15} style={{ color: accent }}/>
          </div>
          <span className="font-black text-white">EyeGuard AI</span>
          <Pill color={accent}>{MODE[mode].label}</Pill>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-green-400 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block"/> Live
          </span>
          <button onClick={handleEnd}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
            End Session
          </button>
        </div>
      </div>

      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-5 flex flex-col gap-4">
        {wsError && (
          <div className="border border-red-400/30 bg-red-400/10 rounded-xl p-3 text-red-400 text-xs">⚠ {wsError}</div>
        )}

        <AlertBanner alert={metrics?.alert} tip={metrics?.tip} accent={accent}/>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
          {/* Camera side */}
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl overflow-hidden border border-white/8 bg-gray-900 aspect-video flex items-center justify-center relative">
              {frame
                ? <img src={frame} alt="webcam" className="w-full h-full object-cover"/>
                : <div className="flex flex-col items-center gap-2 opacity-30">
                    <Eye size={32}/><span className="text-sm">Waiting for camera…</span>
                  </div>
              }
              {metrics?.face_detected && (
                <div style={{ background: accent+"22", borderColor: accent+"44", color: accent }}
                  className="absolute top-3 left-3 text-xs border px-2.5 py-1 rounded-full font-semibold">
                  ● Face tracked
                </div>
              )}
            </div>
            {/* Status chips */}
            <div className="flex gap-2">
              <StatusChip ok={metrics?.face_detected}  labelOk="Face Detected"  labelBad="No Face"/>
              <StatusChip ok={!metrics?.too_close}     labelOk="Good Distance"  labelBad="Too Close"/>
              <StatusChip ok={!metrics?.drowsy}        labelOk="Alert"          labelBad="Drowsy"/>
            </div>
          </div>

          {/* Stats side */}
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Blink Rate"   value={<span style={{color:bpmColor()}}>{metrics?.bpm??0}</span>}   sub="per min · normal: 15"  accent={accent}/>
              <StatCard label="Total Blinks" value={metrics?.blink_count??0}   sub="this session"     accent={accent}/>
              <StatCard label="Session Time" value={fmt(metrics?.session_seconds)} sub="mm:ss"        accent={accent}/>
              <StatCard label="BPM Drop"     value={`${metrics?.bpm_drop_pct??0}%`} sub="vs baseline" accent={metrics?.bpm_drop_pct>50?"#f87171":accent}/>
            </div>

            {/* EAR bar */}
            <div className="bg-white/3 border border-white/8 rounded-2xl p-4">
              <div className="flex justify-between text-xs mb-2">
                <span className="opacity-40 uppercase tracking-widest">Eye Openness (EAR)</span>
                <span className="font-mono opacity-60">{metrics?.ear??0}</span>
              </div>
              <div className="w-full bg-white/8 rounded-full h-2">
                <div className="h-2 rounded-full transition-all duration-150"
                  style={{ width:`${Math.min(100,(metrics?.ear??0)*400)}%`, background: accent }}/>
              </div>
              <div className="text-xs opacity-30 mt-1.5">Below 0.21 = eye closed</div>
            </div>

            {/* Gemini tip (non-alert state) */}
            {metrics?.tip && !metrics?.alert && (
              <div style={{ borderColor: accent+"33", background: accent+"0a" }}
                className="rounded-2xl border p-4">
                <div style={{ color: accent }} className="flex items-center gap-1.5 text-xs font-bold mb-1.5">
                  <Zap size={12}/> Gemini Health Tip
                </div>
                <p className="text-xs text-white/60 leading-relaxed">{metrics.tip}</p>
              </div>
            )}
          </div>
        </div>

        {/* Eye exercises accordion */}
        <div className="border border-white/8 rounded-2xl overflow-hidden">
          <button onClick={()=>setShowEx(!showEx)}
            className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-white/3 transition-all text-sm">
            <span className="flex items-center gap-2 font-bold">
              <CheckCircle size={16} className="text-green-400"/> Eye Relaxation Exercises
            </span>
            <span className="opacity-30 text-xs">{showEx?"▲":"▼"}</span>
          </button>
          {showEx && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 p-4 border-t border-white/5">
              {EXERCISES.map((ex,i)=>(
                <div key={i} style={{ borderColor: accent+"22" }} className="bg-white/3 rounded-xl p-3.5 border">
                  <div style={{ color: accent }} className="font-bold text-xs mb-1">{ex.title}</div>
                  <div className="text-xs opacity-40 leading-relaxed">{ex.desc}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage]       = useState("landing")   // landing | mode | dashboard | summary
  const [mode, setMode]       = useState("health")
  const [sessionData, setSData] = useState(null)

  if (page === "landing")   return <LandingPage  onStart={()=>setPage("mode")}/>
  if (page === "mode")      return <ModeSelectionPage onSelect={m=>{ setMode(m); setPage("dashboard") }}/>
  if (page === "dashboard") return <DashboardPage mode={mode} onEnd={d=>{ setSData(d); setPage("summary") }}/>
  if (page === "summary")   return <SessionSummaryPage data={sessionData} mode={mode} onRestart={()=>setPage("mode")}/>
}