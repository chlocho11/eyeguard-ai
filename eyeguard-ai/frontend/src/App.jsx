import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, LayoutDashboard, Settings, Camera, Clock,
  ShieldCheck, Eye, LogOut, ChevronRight, Play,
  CheckCircle2, Sparkles, ArrowLeft, ShieldAlert,
  Volume2, Moon, Sun, Smartphone, Pause, Heart,
  Dumbbell, ChevronLeft, X, Edit3, History, RotateCcw,
  Minus, Plus, Star, Target, Info, Activity,
  TrendingUp, Users, Calendar, FastForward
} from 'lucide-react';

// ── API helpers (talks to FastAPI backend) ──────────────────────────────────
import { startSession, sendEvent, endSession, getTip } from "./api";

// ── MediaPipe blink / distance helpers ─────────────────────────────────────
import {
  createBlinkDetector,
  computeBlinkMetrics,
  computeDistanceAlert,
} from "./blinkDetector";

import { track } from "./firebaseClient";

// ==========================================
// 1. Global Styles & Animations
// ==========================================
const MASCOT_STYLES = `
  @keyframes blink { 0%, 88%, 92%, 100% { transform: scaleY(1); } 90%, 94% { transform: scaleY(0.1); } }
  @keyframes fastBlink { 0%, 20%, 40%, 60%, 80%, 100% { transform: scaleY(1); } 10%, 30%, 50%, 70%, 90% { transform: scaleY(0.1); } }
  @keyframes bodyBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-1.5px); } }
  @keyframes floatUp { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
  @keyframes floatDown { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(10px); } }
  @keyframes slowFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
  @keyframes glowPulse { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 1; transform: scale(1.1); } }
  @keyframes eyeRoll { 0% { transform: translate(0px,0px); } 25% { transform: translate(3px,-3px); } 50% { transform: translate(6px,0px); } 75% { transform: translate(3px,3px); } 100% { transform: translate(0px,0px); } }
  @keyframes palmingHands { 0% { transform: translateY(30px); opacity: 0; } 20%, 80% { transform: translateY(-5px); opacity: 1; } 100% { transform: translateY(30px); opacity: 0; } }
  @keyframes focusShift { 0%, 100% { r: 3px; } 50% { r: 5.5px; } }
  @keyframes teachingStick { 0%, 100% { transform: rotate(-20deg); } 50% { transform: rotate(-5deg); } }
  @keyframes rapidTypingLeft { 0%, 100% { transform: translateY(0); } 25% { transform: translateY(-1.5px) translateX(1px); } 50% { transform: translateY(0.5px) translateX(-0.5px); } 75% { transform: translateY(-1px); } }
  @keyframes rapidTypingRight { 0%, 100% { transform: translateY(0.5px); } 25% { transform: translateY(-1px) translateX(-1px); } 50% { transform: translateY(-0.5px) translateX(0.5px); } 75% { transform: translateY(1px); } }
  @keyframes stethoSwing { 0%, 100% { transform: rotate(-1.5deg); } 50% { transform: rotate(1.5deg); } }
  @keyframes writeMotion { 0%, 100% { transform: translate(0, 0); } 25% { transform: translate(1px, -1px); } 50% { transform: translate(-0.5px, 0.5px); } 75% { transform: translate(0.5px, -0.5px); } }
  @keyframes takePhoto { 0%, 100% { transform: translateY(0) rotate(0); } 10%, 30% { transform: translateY(-1px) rotate(-2deg); } }
  @keyframes cameraFlash { 0%, 14%, 20%, 100% { opacity: 0; fill: #fff; r: 0; } 15%, 18% { opacity: 0.9; fill: #ffffff; r: 35; } }
  @keyframes ponytailWhip { 0%, 100% { transform: rotate(0); } 50% { transform: rotate(-8deg); } }
  @keyframes digging { 0%, 100% { transform: rotate(0); } 40% { transform: rotate(-15deg); } 60% { transform: rotate(3deg); } }
  @keyframes plantBob { 0%, 100% { transform: rotate(-1deg); } 50% { transform: rotate(2deg) translateY(-1px); } }
  @keyframes glassesGleam { 0%, 90%, 100% { transform: translateX(-20px); opacity: 0; } 95% { transform: translateX(20px); opacity: 0.6; } }
  @keyframes walkLeftLeg { 0%, 100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-1.5px) rotate(-10deg); } }
  @keyframes walkRightLeg { 0%, 100% { transform: translateY(-1.5px) rotate(-10deg); } 50% { transform: translateY(0) rotate(0); } }
  @keyframes swingBriefcase { 0%, 100% { transform: rotate(-4deg); } 50% { transform: rotate(6deg); } }
  @keyframes tasselSwing { 0%, 100% { transform: rotate(3deg); } 50% { transform: rotate(-5deg); } }
  @keyframes scooterKick { 0%, 100% { transform: rotate(0); } 30% { transform: rotate(12deg); } 70% { transform: rotate(-3deg); } }
  @keyframes scooterBump { 0%, 50%, 100% { transform: translateY(0); } 25%, 75% { transform: translateY(-1px); } }
  @keyframes wheelSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(-360deg); } }
  @keyframes painting { 0% { transform: rotate(-3deg); } 50% { transform: rotate(6deg); } 100% { transform: rotate(-3deg); } }
  @keyframes paletteFloat { 0%, 100% { transform: translateY(0) rotate(3deg); } 50% { transform: translateY(-2px) rotate(1deg); } }
  @keyframes panFlip { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-10deg); } }
  @keyframes pancakeToss { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-15px) rotate(180deg); } }
  @keyframes strumming { 0%, 100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(4px) rotate(-3deg); } }
  @keyframes headBang { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(4deg); } }
  @keyframes flagWave { 0%, 100% { transform: skewY(0deg); } 50% { transform: skewY(5deg); } }
  @keyframes scooterDrive { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(-30px); } }
  @keyframes solidScan { 0% { top: 0; } 100% { top: 100%; } }
  .animate-solid-scan { position: absolute; height: 3px; width: 100%; background: #E58C49; animation: solidScan 2.5s linear infinite; }
  .a-blink { animation: blink 4s infinite; transform-origin: center; }
  .a-fast-blink { animation: fastBlink 2s infinite; transform-origin: center; }
  .a-bounce { animation: bodyBounce 3s ease-in-out infinite; }
  .a-float-1 { animation: floatUp 4s ease-in-out infinite; }
  .a-float-2 { animation: floatDown 5s ease-in-out infinite; }
  .a-roll { animation: eyeRoll 3s linear infinite; }
  .a-palm { animation: palmingHands 4s ease-in-out infinite; }
  .a-focus { animation: focusShift 4s ease-in-out infinite; }
  .a-teach { animation: teachingStick 1.5s ease-in-out infinite; transform-origin: 70px 60px; }
  .a-type-l { animation: rapidTypingLeft 0.2s infinite; }
  .a-type-r { animation: rapidTypingRight 0.25s infinite; }
  .a-stetho { animation: stethoSwing 2.5s ease-in-out infinite; transform-origin: 50px 45px; }
  .a-write { animation: writeMotion 0.25s infinite; transform-origin: 30px 60px; }
  .a-photo { animation: takePhoto 4s ease-in-out infinite; }
  .a-flash { animation: cameraFlash 4s infinite; mix-blend-mode: overlay; }
  .a-tail { animation: ponytailWhip 2.5s ease-in-out infinite; transform-origin: 30px 35px; }
  .a-dig { animation: digging 2.5s ease-in-out infinite; transform-origin: 27px 60px; }
  .a-plant { animation: plantBob 2.5s ease-in-out infinite; transform-origin: 73px 58px; }
  .a-gleam { animation: glassesGleam 5s infinite; }
  .a-walk-l { animation: walkLeftLeg 1.2s linear infinite; }
  .a-walk-r { animation: walkRightLeg 1.2s linear infinite; }
  .a-swing { animation: swingBriefcase 1.5s ease-in-out infinite; }
  .a-tassel { animation: tasselSwing 1.5s ease-in-out infinite; transform-origin: top center; }
  .a-kick { animation: scooterKick 1.5s ease-in infinite; }
  .a-bump { animation: scooterBump 0.8s linear infinite; }
  .a-wheel { animation: wheelSpin 0.8s linear infinite; }
  .a-paint { animation: painting 2s ease-in-out infinite; }
  .a-palette { animation: paletteFloat 3.5s ease-in-out infinite; transform-origin: center; }
  .a-pan { animation: panFlip 2s ease-in-out infinite; }
  .a-pancake { animation: pancakeToss 2s ease-in-out infinite; transform-origin: 22px 55px; }
  .a-strum { animation: strumming 0.4s ease-in-out infinite; }
  .a-headbang { animation: headBang 0.8s ease-in-out infinite; transform-origin: center bottom; }
  .a-flag { animation: flagWave 2s ease-in-out infinite; transform-origin: bottom right; }
  .a-float { animation: slowFloat 4.5s ease-in-out infinite; }
  .a-glow { animation: glowPulse 2.5s ease-in-out infinite; transform-origin: center; }
  .a-drive { animation: scooterDrive 6s ease-in-out infinite; }
`;

// ==========================================
// 2. Confetti Component
// ==========================================
const Confetti = () => {
  const pieces = Array.from({ length: 80 });
  const colors = ['bg-[#E395A4]', 'bg-[#7A9B76]', 'bg-[#E58C49]', 'bg-[#D9BE75]', 'bg-[#64b5f6]', 'bg-[#d500f9]'];
  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {pieces.map((_, i) => (
        <motion.div
          key={i}
          initial={{ top: '-10%', left: `${Math.random() * 100}%`, rotate: 0 }}
          animate={{ top: '110%', left: `${Math.random() * 100}%`, rotate: Math.random() * 720 }}
          transition={{ duration: 2 + Math.random() * 3, ease: "linear" }}
          className={`absolute w-3 h-3 rounded-sm ${colors[i % colors.length]}`}
          style={{ opacity: Math.random() * 0.5 + 0.5 }}
        />
      ))}
    </div>
  );
};

// ==========================================
// 3. Mascot Definitions
// ==========================================
const MASCOT_KEYS = ['coder', 'artist', 'photographer', 'gardener', 'doctor', 'chef', 'graduate', 'scooter', 'rocker', 'astro'];

const getMascot = (skin, pupilClass) => {
  const mascots = {
    coder: <g><rect x="25" y="30" width="50" height="35" fill="#64b5f6" rx="10" /><rect x="32" y="65" width="10" height="12" fill="#1565c0" /><rect x="58" y="65" width="10" height="12" fill="#1565c0" /><rect x="28" y="75" width="16" height="6" fill="#212121" rx="2" /><rect x="56" y="75" width="16" height="6" fill="#212121" rx="2" /><circle cx="30" cy="25" r="8" fill="#1565c0" /><circle cx="45" cy="20" r="10" fill="#1565c0" /><circle cx="60" cy="22" r="9" fill="#1565c0" /><circle cx="70" cy="30" r="7" fill="#1565c0" /><circle cx="25" cy="35" r="7" fill="#1565c0" /><path d="M 25 50 L 75 50 L 70 65 L 30 65 Z" fill="#8d6e63" /><polygon points="45,50 55,50 50,58" fill="#bbdefb" /><polygon points="45,52 50,55 45,58" fill="#d32f2f" /><polygon points="55,52 50,55 55,58" fill="#d32f2f" /><circle cx="50" cy="55" r="1.5" fill="#b71c1c" /><g><circle cx="38" cy="42" r="8" fill="none" stroke="#e3f2fd" strokeWidth="2" /><circle cx="62" cy="42" r="8" fill="none" stroke="#e3f2fd" strokeWidth="2" /><line x1="46" y1="42" x2="54" y2="42" stroke="#e3f2fd" strokeWidth="2" /><circle cx="38" cy="42" r="3" fill="#000" className={pupilClass} /><circle cx="62" cy="42" r="3" fill="#000" className={pupilClass} /><rect x="30" y="34" width="40" height="16" fill="#ffffff" className="a-gleam" style={{clipPath: 'url(#glassesClip)'}} /><clipPath id="glassesClip"><circle cx="38" cy="42" r="8" /><circle cx="62" cy="42" r="8" /></clipPath></g><rect x="18" y="52" width="12" height="8" fill="#e3f2fd" rx="3" transform="rotate(-15 25 55)" /><rect x="25" y="56" width="8" height="6" fill="#64b5f6" rx="2" className="a-type-l" /><g transform="translate(55, 52)"><path d="M 5 0 L 25 0 L 22 15 L 2 15 Z" fill="#b0bec5" /><path d="M 0 15 L 25 15 L 28 20 L -3 20 Z" fill="#90a4ae" /><circle cx="13" cy="7" r="2" fill="#fff" opacity="0.6" /></g><rect x="68" y="50" width="12" height="8" fill="#e3f2fd" rx="3" transform="rotate(20 75 55)" /><rect x="62" y="58" width="8" height="6" fill="#64b5f6" rx="2" className="a-type-r" /></g>,
    artist: <g><path d="M 25 35 Q 25 25 35 25 L 45 25 Q 50 25 50 30 L 50 65 L 25 65 Z" fill="#9575cd" /><path d="M 50 30 Q 50 25 55 25 L 65 25 Q 75 25 75 35 L 75 65 L 50 65 Z" fill="#ff8a65" /><path d="M 50 25 Q 45 35 50 45 Q 55 55 50 65" fill="none" stroke="#fff" strokeWidth="2" opacity="0.5"/><rect x="30" y="65" width="12" height="15" fill="#ff8a65" rx="2" /><rect x="58" y="65" width="12" height="15" fill="#ff8a65" rx="2" /><circle cx="38" cy="40" r="6" fill="#fff" /><circle cx="62" cy="40" r="6" fill="#fff" /><circle cx="40" cy="40" r="3" fill="#000" className={pupilClass} /><circle cx="64" cy="40" r="3" fill="#000" className={pupilClass} /><ellipse cx="40" cy="22" rx="16" ry="6" fill="#795548" transform="rotate(-15 40 22)" /><circle cx="44" cy="15" r="3" fill="#795548" /><path d="M 25 50 L 75 50 L 75 65 L 25 65 Z" fill="#5c6bc0" /><rect x="30" y="45" width="5" height="10" fill="#3949ab" rx="1" /><rect x="65" y="45" width="5" height="10" fill="#3949ab" rx="1" /><circle cx="32.5" cy="52" r="1.5" fill="#fdd835" /><circle cx="67.5" cy="52" r="1.5" fill="#fdd835" /><rect x="40" y="52" width="20" height="8" fill="#3949ab" rx="2" /><circle cx="35" cy="60" r="2" fill="#e91e63" /><circle cx="65" cy="58" r="1.5" fill="#00bcd4" /><g className="a-palette"><rect x="70" y="38" width="12" height="12" fill="#ff8a65" rx="4" /><path d="M 75 35 Q 95 30 90 50 Q 85 60 70 50 Z" fill="#d7ccc8" /><circle cx="75" cy="45" r="3" fill="#5d4037" /><circle cx="82" cy="38" r="2" fill="#f44336" /><circle cx="88" cy="42" r="2" fill="#2196f3" /><circle cx="85" cy="48" r="2" fill="#ffeb3b" /></g><g className="a-paint" style={{ transformOrigin: '23px 51px' }}><rect x="18" y="45" width="10" height="12" fill="#ff8a65" rx="4" /><rect x="12" y="20" width="4" height="35" fill="#8d6e63" transform="rotate(-15 14 37)" rx="1" /><path d="M 8 15 Q 15 10 18 20 Z" fill="#d32f2f" transform="rotate(-15 14 37)" /></g></g>,
    photographer: <g><g className="a-tail" style={{ transformOrigin: '30px 35px' }}><path d="M 30 35 Q 10 20 5 50 Q 25 55 30 40 Z" fill="#ffee58" /><rect x="25" y="32" width="6" height="10" fill="#e91e63" rx="2" transform="rotate(15 25 32)" /></g><path d="M 50 40 Q 50 25 35 25 Q 25 25 25 40 L 25 65 L 75 65 L 75 40 Q 75 25 60 25 Q 50 25 50 40 Z" fill="#f06292" /><rect x="30" y="65" width="12" height="12" fill="#f06292" rx="2" /><rect x="58" y="65" width="12" height="12" fill="#f06292" rx="2" /><path d="M 28 77 L 44 77 L 44 83 L 28 83 Z" fill="#f8bbd0" rx="2" /><path d="M 56 77 L 72 77 L 72 83 L 56 83 Z" fill="#f8bbd0" rx="2" /><circle cx="38" cy="42" r="6" fill="#fff" /><circle cx="62" cy="42" r="6" fill="#fff" /><circle cx="40" cy="42" r="3" fill="#000" className={pupilClass} /><circle cx="64" cy="42" r="3" fill="#000" className={pupilClass} /><path d="M 34 38 L 30 35 M 36 36 L 33 32" stroke="#000" strokeWidth="2" strokeLinecap="round" /><path d="M 66 38 L 70 35 M 64 36 L 67 32" stroke="#000" strokeWidth="2" strokeLinecap="round" /><path d="M 20 50 L 30 50 L 30 65 L 20 65 Z" fill="#ab47bc" rx="2" /><path d="M 70 50 L 80 50 L 80 65 L 70 65 Z" fill="#ab47bc" rx="2" /><path d="M 30 50 L 35 50 L 35 65 L 30 65 Z" fill="#81d4fa" /><path d="M 65 50 L 70 50 L 70 65 L 65 65 Z" fill="#81d4fa" /><g className="a-photo"><rect x="32" y="55" width="10" height="10" fill="#f06292" rx="3" /><rect x="58" y="55" width="10" height="10" fill="#f06292" rx="3" /><rect x="38" y="52" width="24" height="16" fill="#424242" rx="3" /><rect x="42" y="49" width="6" height="4" fill="#212121" rx="1" /><circle cx="50" cy="60" r="6" fill="#90caf9" stroke="#616161" strokeWidth="2" /><circle cx="50" cy="60" r="2" fill="#fff" opacity="0.8" /><circle cx="50" cy="60" r="0" fill="#fff" className="a-flash" style={{mixBlendMode: 'overlay'}} /></g></g>,
    gardener: <g><rect x="25" y="30" width="50" height="35" fill="#66bb6a" rx="10" /><rect x="32" y="65" width="10" height="12" fill="#66bb6a" /><rect x="58" y="65" width="10" height="12" fill="#66bb6a" /><rect x="30" y="75" width="14" height="6" fill="#795548" rx="2" /><rect x="56" y="75" width="14" height="6" fill="#795548" rx="2" /><circle cx="40" cy="45" r="6" fill="#fff" /><circle cx="60" cy="45" r="6" fill="#fff" /><circle cx="42" cy="45" r="3" fill="#000" className={pupilClass} /><circle cx="62" cy="45" r="3" fill="#000" className={pupilClass} /><circle cx="36" cy="48" r="2" fill="#81c784" /><circle cx="64" cy="48" r="2" fill="#81c784" /><path d="M 23 52 L 77 52 L 80 65 L 20 65 Z" fill="#fff9c4" rx="2" /><circle cx="30" cy="56" r="2.5" fill="#f48fb1" /><circle cx="45" cy="60" r="2.5" fill="#f48fb1" /><circle cx="60" cy="55" r="2.5" fill="#f48fb1" /><circle cx="70" cy="62" r="2.5" fill="#f48fb1" /><ellipse cx="50" cy="22" rx="25" ry="8" fill="#d4e157" /><path d="M 35 22 Q 50 5 65 22 Z" fill="#cddc39" /><path d="M 35 22 Q 50 15 65 22" stroke="#ffb74d" strokeWidth="3" fill="none" /><g className="a-plant" style={{ transformOrigin: '73px 58px' }}><rect x="63" y="56" width="10" height="10" fill="#66bb6a" rx="3" /><path d="M 68 53 L 88 53 L 84 66 L 72 66 Z" fill="#d84315" /><path d="M 78 53 Q 68 38 73 33 Q 83 38 78 53" fill="#4caf50" /><path d="M 78 53 Q 88 33 83 28 Q 73 33 78 53" fill="#8bc34a" /></g><g className="a-dig" style={{ transformOrigin: '27px 60px' }}><rect x="22" y="55" width="10" height="10" fill="#66bb6a" rx="3" /><rect x="18" y="50" width="4" height="15" fill="#795548" rx="1" transform="rotate(-20 20 57)" /><path d="M 12 62 L 18 75 L 22 73 Z" fill="#9e9e9e" /></g></g>,
    doctor: <g><rect x="25" y="30" width="50" height="35" fill="#b2ebf2" rx="10" /><rect x="32" y="65" width="10" height="12" fill="#00838f" /><rect x="58" y="65" width="10" height="12" fill="#00838f" /><rect x="30" y="75" width="14" height="6" fill="#ffffff" rx="2" /><rect x="56" y="75" width="14" height="6" fill="#ffffff" rx="2" /><circle cx="38" cy="40" r="6" fill="#fff" /><circle cx="62" cy="40" r="6" fill="#fff" /><circle cx="40" cy="40" r="3" fill="#000" className={pupilClass} /><circle cx="64" cy="40" r="3" fill="#000" className={pupilClass} /><path d="M 23 45 L 45 45 L 45 65 L 23 65 Z" fill="#ffffff" /><path d="M 77 45 L 55 45 L 55 65 L 77 65 Z" fill="#ffffff" /><path d="M 45 45 L 55 45 L 50 55 Z" fill="#80deea" /><g className="a-stetho" style={{ transformOrigin: '50px 45px' }}><path d="M 35 45 Q 50 65 65 45" fill="none" stroke="#424242" strokeWidth="2.5" /><line x1="50" y1="55" x2="50" y2="62" stroke="#424242" strokeWidth="2.5" /><circle cx="50" cy="64" r="3" fill="#cfd8dc" stroke="#424242" strokeWidth="1" /></g><rect x="70" y="55" width="10" height="10" fill="#b2ebf2" rx="3" /><rect x="65" y="45" width="18" height="22" fill="#d7ccc8" rx="2" transform="rotate(10 65 45)" /><rect x="67" y="47" width="14" height="18" fill="#ffffff" transform="rotate(10 65 45)" /><rect x="72" y="43" width="6" height="3" fill="#9e9e9e" transform="rotate(10 65 45)" /><g className="a-write" style={{ transformOrigin: '30px 60px' }}><rect x="25" y="52" width="10" height="10" fill="#b2ebf2" rx="3" /><rect x="30" y="48" width="3" height="12" fill="#1e88e5" rx="1" transform="rotate(30 30 48)" /><polygon points="34,58 35,61 32,60" fill="#212121" /></g></g>,
    chef: <g><rect x="25" y="30" width="50" height="35" fill="#fdfdfd" rx="10" /><rect x="32" y="65" width="10" height="12" fill="#e0e0e0" /><rect x="58" y="65" width="10" height="12" fill="#e0e0e0" /><rect x="30" y="75" width="14" height="6" fill="#424242" rx="2" /><rect x="56" y="75" width="14" height="6" fill="#424242" rx="2" /><circle cx="38" cy="40" r="6" fill="#2c3e50" /><circle cx="62" cy="40" r="6" fill="#2c3e50" /><circle cx="38" cy="40" r="5" fill="#fff" /><circle cx="62" cy="40" r="5" fill="#fff" /><circle cx="40" cy="40" r="3" fill="#000" className={pupilClass} /><circle cx="64" cy="40" r="3" fill="#000" className={pupilClass} /><circle cx="42" cy="55" r="1.5" fill="#9e9e9e" /><circle cx="42" cy="60" r="1.5" fill="#9e9e9e" /><circle cx="58" cy="55" r="1.5" fill="#9e9e9e" /><circle cx="58" cy="60" r="1.5" fill="#9e9e9e" /><path d="M 40 48 L 60 48 L 50 56 Z" fill="#e74c3c" /><path d="M 30 25 L 70 25 L 75 10 Q 60 0 50 10 Q 40 0 25 10 Z" fill="#ffffff" stroke="#eeeeee" strokeWidth="2" /><rect x="70" y="55" width="10" height="12" fill="#fdfdfd" rx="3" /><g className="a-pan" style={{ transformOrigin: '25px 55px' }}><rect x="20" y="55" width="10" height="12" fill="#fdfdfd" rx="3" /><rect x="-5" y="60" width="28" height="4" fill="#34495e" rx="2" /><path d="M -25 55 L -5 55 L -10 65 L -20 65 Z" fill="#2c3e50" /></g><ellipse cx="-15" cy="53" rx="8" ry="3" fill="#f1c40f" className="a-pancake" /></g>,
    graduate: <g><g className="a-walk-r" style={{ transformOrigin: '64px 65px' }}><rect x="58" y="65" width="12" height="18" fill="#f27d42" rx="2" /><path d="M 58 80 L 75 80 L 72 85 L 58 85 Z" fill="#212121" /></g><g className="a-walk-l" style={{ transformOrigin: '36px 65px' }}><rect x="30" y="65" width="12" height="18" fill="#f27d42" rx="2" /><path d="M 30 80 L 47 80 L 44 85 L 30 85 Z" fill="#212121" /></g><rect x="25" y="30" width="50" height="35" fill="#f27d42" rx="10" /><circle cx="38" cy="40" r="6" fill="#fff" /><circle cx="62" cy="40" r="6" fill="#fff" /><circle cx="40" cy="40" r="3" fill="#000" className={pupilClass} /><circle cx="64" cy="40" r="3" fill="#000" className={pupilClass} /><path d="M 23 50 L 45 50 L 50 65 L 23 65 Z" fill="#2c3e50" /><path d="M 77 50 L 55 50 L 50 65 L 77 65 Z" fill="#2c3e50" /><polygon points="45,50 55,50 50,58" fill="#fff" /><polygon points="48,53 52,53 50,65" fill="#c0392b" /><polygon points="50,15 20,25 50,35 80,25" fill="#212121" /><path d="M 35 25 L 65 25 L 60 35 L 40 35 Z" fill="#212121" /><g transform="translate(25, 25)" className="a-tassel"><line x1="0" y1="0" x2="0" y2="15" stroke="#f1c40f" strokeWidth="2" /><circle cx="0" cy="17" r="2" fill="#f1c40f" /></g><rect x="70" y="55" width="10" height="12" fill="#f27d42" rx="3" /><g className="a-swing" style={{ transformOrigin: '25px 55px' }}><rect x="20" y="55" width="10" height="12" fill="#f27d42" rx="3" /><rect x="10" y="65" width="28" height="20" fill="#5d4037" rx="3" /><rect x="16" y="61" width="16" height="6" fill="none" stroke="#3e2723" strokeWidth="3" rx="2" /><rect x="22" y="70" width="4" height="4" fill="#ffb300" /></g></g>,
    scooter: <g><rect x="20" y="80" width="55" height="6" fill="#95a5a6" rx="3" /><rect x="65" y="45" width="6" height="38" fill="#7f8c8d" rx="2" /><rect x="55" y="45" width="20" height="5" fill="#34495e" rx="2" /><rect x="68" y="82" width="4" height="4" fill="#34495e" /><g className="a-wheel" style={{ transformOrigin: '70px 86px' }}><circle cx="70" cy="86" r="6" fill="#2c3e50" /><circle cx="70" cy="86" r="2" fill="#ecf0f1" /></g><rect x="28" y="82" width="4" height="4" fill="#34495e" /><g className="a-wheel" style={{ transformOrigin: '30px 86px' }}><circle cx="30" cy="86" r="6" fill="#2c3e50" /><circle cx="30" cy="86" r="2" fill="#ecf0f1" /></g><g><rect x="25" y="35" width="35" height="30" fill="#f1c40f" rx="8" /><path d="M 25 35 Q 42 15 60 35 Z" fill="#d35400" /><rect x="23" y="32" width="39" height="6" fill="#e67e22" rx="2" /><circle cx="40" cy="45" r="6" fill="#fff" /><circle cx="55" cy="45" r="6" fill="#fff" /><circle cx="42" cy="45" r="3" fill="#000" className={pupilClass} /><circle cx="57" cy="45" r="3" fill="#000" className={pupilClass} /><rect x="20" y="52" width="45" height="18" fill="#c0392b" rx="5" /><rect x="35" y="58" width="15" height="10" fill="#e74c3c" rx="2" /><rect x="45" y="43" width="15" height="10" fill="#c0392b" rx="4" /><rect x="55" y="44" width="8" height="8" fill="#f1c40f" rx="2" /><rect x="45" y="70" width="12" height="12" fill="#2980b9" /><rect x="45" y="78" width="18" height="6" fill="#d35400" rx="2" /><rect x="45" y="82" width="18" height="2" fill="#fff" /><g className="a-kick" style={{ transformOrigin: '31px 70px' }}><rect x="25" y="70" width="12" height="12" fill="#2980b9" /><rect x="15" y="78" width="18" height="6" fill="#d35400" rx="2" /><rect x="15" y="82" width="18" height="2" fill="#fff" /></g></g></g>,
    rocker: <g><g className="a-headbang"><rect x="25" y="30" width="50" height="35" fill="#d500f9" rx="10" /><rect x="30" y="38" width="18" height="8" fill="#212121" rx="2" /><rect x="52" y="38" width="18" height="8" fill="#212121" rx="2" /><rect x="48" y="40" width="4" height="2" fill="#212121" /><line x1="32" y1="38" x2="46" y2="44" stroke="#424242" strokeWidth="1" /><path d="M 25 35 Q 50 15 75 35" fill="none" stroke="#00e5ff" strokeWidth="4" /><rect x="18" y="32" width="8" height="16" fill="#00b8d4" rx="4" /><rect x="74" y="32" width="8" height="16" fill="#00b8d4" rx="4" /></g><rect x="32" y="65" width="10" height="12" fill="#1a237e" /><rect x="58" y="65" width="10" height="12" fill="#1a237e" /><rect x="30" y="75" width="14" height="8" fill="#ff4081" rx="2" /><rect x="56" y="75" width="14" height="8" fill="#ff4081" rx="2" /><rect x="30" y="81" width="14" height="2" fill="#fff" /><rect x="56" y="81" width="14" height="2" fill="#fff" /><rect x="70" y="50" width="10" height="10" fill="#d500f9" rx="3" /><g transform="rotate(-20 50 60)"><rect x="25" y="58" width="50" height="4" fill="#8d6e63" /><path d="M 25 50 L 40 50 Q 45 60 40 70 L 25 70 Q 15 60 25 50 Z" fill="#ff1744" /><circle cx="35" cy="60" r="4" fill="#ffffff" /><rect x="75" y="56" width="6" height="8" fill="#424242" rx="1" /></g><g className="a-strum" style={{ transformOrigin: '30px 65px' }}><rect x="28" y="55" width="10" height="12" fill="#d500f9" rx="3" /><polygon points="38,62 42,65 38,68" fill="#fff" /></g></g>,
    astro: <g><rect x="20" y="30" width="60" height="38" fill="#f5f5f5" rx="15" /><rect x="28" y="68" width="16" height="14" fill="#f5f5f5" rx="4" /><rect x="56" y="68" width="16" height="14" fill="#f5f5f5" rx="4" /><rect x="26" y="80" width="20" height="8" fill="#9e9e9e" rx="3" /><rect x="54" y="80" width="20" height="8" fill="#9e9e9e" rx="3" /><line x1="30" y1="50" x2="70" y2="50" stroke="#e0e0e0" strokeWidth="2" /><rect x="35" y="55" width="10" height="6" fill="#64b5f6" rx="1" /><rect x="48" y="55" width="6" height="6" fill="#e53935" rx="1" /><rect x="57" y="55" width="6" height="6" fill="#4caf50" rx="1" /><circle cx="50" cy="35" r="22" fill="#ffffff" stroke="#e0e0e0" strokeWidth="2" /><ellipse cx="50" cy="35" rx="16" ry="12" fill="#1e88e5" /><path d="M 40 30 Q 50 25 60 30" stroke="#90caf9" strokeWidth="3" fill="none" strokeLinecap="round" /></g>,
  };
  return mascots[skin] || mascots['coder'];
};

const PixelMascot = ({ skin = 'coder', size = 150, alertState = false, action = 'idle' }) => {
  const isPalming = action === 'palming';
  const pupilClass = action === 'rolling' ? 'a-roll' : action === 'fast-blink' ? 'a-fast-blink' : action === 'focus' ? 'a-focus' : 'a-blink';
  return (
    <motion.div
      animate={alertState ? { x: [-5, 5, -5, 5, 0], rotate: [-2, 2, -2, 2, 0] } : {}}
      transition={{ duration: 0.5, repeat: alertState ? Infinity : 0, repeatDelay: 1 }}
      style={{ width: size, height: size }}
      className="relative flex items-center justify-center filter drop-shadow-md"
    >
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible relative z-10">
        <g className={action === 'idle' || action === 'teaching' ? 'a-bounce' : ''}>
          {getMascot(skin, pupilClass)}
          {isPalming && (
            <g className="a-palm">
              <rect x="28" y="35" width="20" height="15" fill="#fbcfe8" rx="6" />
              <rect x="52" y="35" width="20" height="15" fill="#fbcfe8" rx="6" />
            </g>
          )}
          {action === 'teaching' && (
            <g className="a-teach">
              <rect x="70" y="40" width="4" height="40" fill="#795548" rx="2" />
              <circle cx="72" cy="40" r="4" fill="#e53935" />
            </g>
          )}
        </g>
      </svg>
    </motion.div>
  );
};

// ==========================================
// 4. Logo Component
// ==========================================
const LogoSVG = ({ className = "w-10 h-10" }) => (
  <svg className="w-10 h-10" viewBox="0 0 100 100">
  <rect x="18" y="22" width="64" height="56" rx="18" fill="#22c55e"/>
  <circle cx="40" cy="50" r="10" fill="#fff"/>
  <circle cx="60" cy="50" r="10" fill="#fff"/>
  <circle cx="40" cy="50" r="5" fill="#0f172a"/>
  <circle cx="60" cy="50" r="5" fill="#0f172a"/>
  <rect x="45" y="62" width="10" height="6" rx="3" fill="#0f172a" opacity="0.7"/>
  <path d="M50 14 L58 26 L42 26 Z" fill="#16a34a"/>
</svg>
);

// ==========================================
// 5. Exercise Data & Icons
// ==========================================
const CuteIcons = {
  rule20: (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
      <circle cx="50" cy="50" r="45" fill="#E58C49" />
      <circle cx="50" cy="50" r="30" fill="#FFF" />
      <rect x="46" y="25" width="8" height="30" fill="#7A9B76" rx="4" />
      <rect x="46" y="46" width="25" height="8" fill="#E395A4" rx="4" />
      <circle cx="50" cy="50" r="8" fill="#3D4035" />
    </svg>
  ),
  palming: (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
      <rect x="15" y="25" width="70" height="50" fill="#E58C49" rx="20" />
      <circle cx="35" cy="50" r="10" fill="#FFF" />
      <circle cx="65" cy="50" r="10" fill="#FFF" />
      <path d="M 30 75 Q 50 85 70 75" fill="none" stroke="#7A9B76" strokeWidth="6" strokeLinecap="round" />
    </svg>
  ),
  rolling: (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
      <circle cx="50" cy="50" r="45" fill="#7A9B76" />
      <circle cx="50" cy="50" r="22" fill="#FFF" />
      <circle cx="50" cy="40" r="8" fill="#3D4035" />
      <path d="M 25 50 A 25 25 0 1 1 50 75" fill="none" stroke="#E395A4" strokeWidth="8" strokeLinecap="round" strokeDasharray="12 8" />
    </svg>
  ),
  focus: (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
      <circle cx="50" cy="50" r="45" fill="#E395A4" />
      <polygon points="20,70 50,30 80,70" fill="#FCF9F2" />
      <circle cx="70" cy="35" r="12" fill="#E58C49" />
      <rect x="40" y="55" width="20" height="30" fill="#7A9B76" rx="10" />
    </svg>
  ),
  blink: (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
      <circle cx="50" cy="50" r="45" fill="#D9BE75" />
      <path d="M 20 50 Q 50 20 80 50 Q 50 80 20 50" fill="#FFF" />
      <circle cx="50" cy="50" r="15" fill="#7A9B76" />
      <circle cx="45" cy="45" r="5" fill="#FFF" />
      <path d="M 80 30 Q 85 40 90 30 Q 85 20 80 30" fill="#E395A4" />
      <path d="M 15 25 Q 20 35 25 25 Q 20 15 15 25" fill="#E58C49" />
    </svg>
  )
};

const EYE_EXERCISES = [
  { id: '20-20-20', title: "20-20-20 Rule", desc: "Every 20 mins, look 20ft away for 20s.", duration: 20, icon: 'rule20', color: "bg-[#FFF0E5]", action: 'idle' },
  { id: 'palming', title: "Warm Palming", desc: "Use hand warmth to soothe optic nerves.", duration: 30, icon: 'palming', color: "bg-[#E2F0CB]", action: 'palming' },
  { id: 'rolling', title: "Eye Rolling", desc: "Stretch and tone eye muscles gently.", duration: 20, icon: 'rolling', color: "bg-[#E8DFF5]", action: 'rolling' },
  { id: 'focus-shift', title: "Near-Far Focus", desc: "Train your ciliary muscles flexibly.", duration: 25, icon: 'focus', color: "bg-[#D4F0F0]", action: 'focus' },
  { id: 'blink-fast', title: "Rapid Blinking", desc: "Refresh the tear film to avoid dryness.", duration: 15, icon: 'blink', color: "bg-[#FCE1E4]", action: 'fast-blink' }
];

// ==========================================
// 6. User Context
// ==========================================
const UserContext = React.createContext(null);

// ==========================================
// 7. Top Navigation
// ==========================================
function TopNavigation({ user, onEditProfile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isDark = user?.theme === 'dark';
  const navs = [
    { path: '/home', icon: Home, label: 'Home' },
    { path: '/exercises', icon: Eye, label: 'Exercises' },
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 h-20 ${isDark ? 'bg-[#1D2B26]/90' : 'bg-[#99C5B5]/90'} backdrop-blur-md z-40 px-8 flex items-center justify-between border-b border-black/5`}>
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/home')}>
        <LogoSVG className="w-10 h-10" />
        <span className={`font-extrabold text-2xl tracking-tight ${isDark ? 'text-white' : 'text-[#3D4035]'}`}>
          <span className={isDark ? "text-yellow-400" : "text-[#E58C49]"}>Eye</span>Guard
        </span>
      </div>
      <div className={`flex items-center gap-8 ${isDark ? 'bg-[#2B423A]' : 'bg-[#FCF9F2]'} px-6 py-3 rounded-full shadow-sm border border-black/5`}>
        {navs.map(n => (
          <button key={n.path} onClick={() => navigate(n.path)}
            className={`flex items-center gap-2 text-sm font-bold transition-colors ${location.pathname === n.path ? 'text-[#E58C49]' : (isDark ? 'text-slate-400' : 'text-[#7A9B76] hover:text-[#3D4035]')}`}>
            <n.icon size={18} /> {n.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right text-[#FCF9F2]">
          <p className="text-xs font-bold uppercase opacity-80">Welcome Back</p>
          <p className="font-bold">{user?.name}</p>
        </div>
        <div onClick={onEditProfile} className="w-12 h-12 bg-white rounded-full flex items-center justify-center overflow-hidden cursor-pointer hover:shadow-lg transition-all group relative border-2 border-white/50">
          <PixelMascot skin={user?.mascot} size={70} />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Edit3 size={16} className="text-white" />
          </div>
        </div>
      </div>
    </header>
  );
}

// ==========================================
// 8. Landing Page
// ==========================================
function LandingPage() {
    const navigate = useNavigate();
    const [authTab, setAuthTab] = useState('login');
    const [showAuth, setShowAuth] = useState(false);
    const { setUser } = React.useContext(UserContext);
    const infoRef = React.useRef(null);

  const handleAuth = () => {
    setUser({ name: 'User', mascot: 'coder', theme: 'light' });
    navigate('/onboarding');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-[#0f926e] relative overflow-hidden font-sans flex flex-col selection:bg-yellow-300 selection:text-slate-900 w-full">
      <header className="relative z-30 px-6 md:px-12 py-6 text-white w-full max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer">
          <LogoSVG className="w-10 h-10" />
          <span className="font-extrabold text-2xl tracking-tight"><span className="text-yellow-400">Eye</span><span className="text-white">Guard</span></span>
        </div>
        <div className="flex gap-6 items-center">
          <button onClick={() => infoRef.current?.scrollIntoView({ behavior: 'smooth' })} className="hidden md:block text-white/80 hover:text-white font-bold transition-colors">About</button>
          <button onClick={() => setShowAuth(true)} className="bg-white/10 hover:bg-white/20 text-white border border-white/30 px-5 py-2.5 rounded-2xl font-bold transition-all">Log in</button>
          <button onClick={() => setShowAuth(true)} className="bg-white text-[#0f926e] px-5 py-2.5 rounded-2xl font-bold hover:bg-yellow-50 transition-all shadow-lg">Get Started Free</button>
        </div>
      </header>

      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-10 pb-4 min-h-[30vh]">
        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="mb-6">
          <span className="bg-white/20 text-white text-sm font-bold px-4 py-2 rounded-full border border-white/30">✨ AI-Powered Eye Health for Everyone</span>
        </motion.div>
        <motion.h1 initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-5xl md:text-7xl font-black text-white leading-tight mb-6 max-w-4xl">
          Protect Your Eyes,<br /><span className="text-yellow-300">Boost Your Focus.</span>
        </motion.h1>
        <motion.p initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="text-xl text-white/80 font-medium max-w-xl mb-10">
          Real-time blink detection, drowsiness alerts, and AI-powered coaching to keep your eyes healthy during long work sessions.
        </motion.p>
        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="flex gap-4 flex-wrap justify-center">
          <button onClick={() => setShowAuth(true)} className="bg-white text-[#0f926e] px-8 py-4 rounded-2xl font-black text-lg hover:bg-yellow-50 transition-all shadow-xl">Start for Free</button>
          <button onClick={() => infoRef.current?.scrollIntoView({ behavior: 'smooth' })} className="bg-white/10 border border-white/30 text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-white/20 transition-all">Learn More</button>
        </motion.div>
      </div>

      {/* ── CSS animations for SVG characters ── */}
      <style>{`
        @keyframes a-bounce-kf   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes a-float-kf    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes a-walk-r-kf   { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(25deg)} }
        @keyframes a-walk-l-kf   { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-25deg)} }
        @keyframes a-swing-kf    { 0%,100%{transform:rotate(-15deg)} 50%{transform:rotate(15deg)} }
        @keyframes a-tassel-kf   { 0%,100%{transform:rotate(-10deg)} 50%{transform:rotate(10deg)} }
        @keyframes a-headbang-kf { 0%,100%{transform:rotate(-8deg)} 50%{transform:rotate(8deg)} }
        @keyframes a-strum-kf    { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-20deg)} }
        @keyframes a-stetho-kf   { 0%,100%{transform:rotate(-5deg)} 50%{transform:rotate(5deg)} }
        @keyframes a-write-kf    { 0%,100%{transform:translateX(0)} 50%{transform:translateX(4px)} }
        @keyframes a-plant-kf    { 0%,100%{transform:rotate(-10deg)} 50%{transform:rotate(10deg)} }
        @keyframes a-dig-kf      { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-20deg)} }
        @keyframes a-pan-kf      { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(15deg)} }
        @keyframes a-pancake-kf  { 0%,100%{transform:translateY(0) scaleY(1)} 40%{transform:translateY(-18px) scaleY(0.8)} 80%{transform:translateY(0) scaleY(1)} }
        @keyframes a-paint-kf    { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-15deg)} }
        @keyframes a-palette-kf  { 0%,100%{transform:rotate(-5deg)} 50%{transform:rotate(5deg)} }
        @keyframes a-drive-kf    { 0%,100%{transform:translateX(0)} 50%{transform:translateX(4px)} }
        @keyframes a-bump-kf     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
        @keyframes a-kick-kf     { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(30deg)} }
        @keyframes a-wheel-kf    { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        @keyframes a-tail-kf     { 0%,100%{transform:rotate(-10deg)} 50%{transform:rotate(10deg)} }
        @keyframes a-photo-kf    { 0%,100%{transform:rotate(-5deg)} 50%{transform:rotate(5deg)} }
        @keyframes a-flash-kf    { 0%{r:0;opacity:1} 100%{r:20;opacity:0} }
        @keyframes a-glow-kf     { 0%,100%{opacity:0.7;r:14} 50%{opacity:1;r:18} }
        @keyframes a-gleam-kf    { 0%,100%{opacity:0} 50%{opacity:0.3} }
        @keyframes a-blink-kf    { 0%,90%,100%{ry:3} 95%{ry:0.5} }
        @keyframes a-flag-kf     { 0%,100%{transform:skewX(0deg)} 50%{transform:skewX(-10deg)} }
        @keyframes a-type-l-kf   { 0%,100%{transform:translateX(0)} 50%{transform:translateX(-2px)} }
        @keyframes a-type-r-kf   { 0%,100%{transform:translateX(0)} 50%{transform:translateX(2px)} }

        .a-bounce   { animation: a-bounce-kf 1.2s ease-in-out infinite }
        .a-float    { animation: a-float-kf 2.5s ease-in-out infinite }
        .a-walk-r   { animation: a-walk-r-kf 0.5s ease-in-out infinite alternate }
        .a-walk-l   { animation: a-walk-l-kf 0.5s ease-in-out infinite alternate }
        .a-swing    { animation: a-swing-kf 0.8s ease-in-out infinite alternate }
        .a-tassel   { animation: a-tassel-kf 0.6s ease-in-out infinite alternate }
        .a-headbang { animation: a-headbang-kf 0.3s ease-in-out infinite alternate }
        .a-strum    { animation: a-strum-kf 0.25s ease-in-out infinite alternate }
        .a-stetho   { animation: a-stetho-kf 1.5s ease-in-out infinite alternate }
        .a-write    { animation: a-write-kf 0.4s ease-in-out infinite alternate }
        .a-plant    { animation: a-plant-kf 1.2s ease-in-out infinite alternate }
        .a-dig      { animation: a-dig-kf 0.8s ease-in-out infinite alternate }
        .a-pan      { animation: a-pan-kf 1s ease-in-out infinite alternate }
        .a-pancake  { animation: a-pancake-kf 1.2s ease-in-out infinite }
        .a-paint    { animation: a-paint-kf 1s ease-in-out infinite alternate }
        .a-palette  { animation: a-palette-kf 1.4s ease-in-out infinite alternate }
        .a-drive    { animation: a-drive-kf 0.6s ease-in-out infinite alternate }
        .a-bump     { animation: a-bump-kf 0.4s ease-in-out infinite alternate }
        .a-kick     { animation: a-kick-kf 0.5s ease-in-out infinite alternate }
        .a-wheel    { animation: a-wheel-kf 0.5s linear infinite }
        .a-tail     { animation: a-tail-kf 0.6s ease-in-out infinite alternate }
        .a-photo    { animation: a-photo-kf 1.5s ease-in-out infinite alternate }
        .a-flash    { animation: a-flash-kf 2s ease-out infinite }
        .a-glow     { animation: a-glow-kf 1.5s ease-in-out infinite }
        .a-gleam    { animation: a-gleam-kf 2s ease-in-out infinite }
        .a-blink    { animation: a-blink-kf 3s ease-in-out infinite }
        .a-flag     { animation: a-flag-kf 0.8s ease-in-out infinite alternate }
        .a-type-l   { animation: a-type-l-kf 0.15s ease-in-out infinite alternate }
        .a-type-r   { animation: a-type-r-kf 0.15s ease-in-out infinite alternate }
      `}</style>

      {/* ── Animated landscape scene ── */}
      <div className="relative w-full" style={{ height: '85vh', marginTop: '-330px' }}>
        <div className="absolute bottom-0 left-0 w-full h-full overflow-hidden pointer-events-none z-10">
          <svg className="w-full h-full" viewBox="0 0 1440 800" preserveAspectRatio="xMidYMax meet">
            <path d="M 0 350 Q 720 450 1440 350 L 1440 800 L 0 800 Z" fill="#10b981" />
            <path d="M -220 300 Q 150 150 420 800 L -200 800 Z" fill="#018159" opacity="1"/>
            <path d="M 1640 300 Q 1290 150 1020 800 L 1640 800 Z" fill="#018159" opacity="1"/>
            <defs>
              <g id="grass-tuft"><path d="M 0 10 Q 5 0 10 10 Q 15 0 20 10 Q 10 5 0 10 Z" fill="#059669" opacity="0.4" /></g>
              <g id="big-tree">
                <path d="M-5,0 L-5,-80 L5,-80 L5,0 Z" fill="#78350f" />
                <circle cx="0" cy="-90" r="40" fill="#059669" />
                <circle cx="-30" cy="-70" r="35" fill="#047857" />
                <circle cx="30" cy="-75" r="30" fill="#065f46" />
                <circle cx="-15" cy="-40" r="25" fill="#10b981" />
                <circle cx="20" cy="-45" r="25" fill="#34d399" />
              </g>
              <g id="fence-post">
                <rect x="-4" y="-40" width="8" height="40" fill="#ffffff" rx="1" />
                <path d="M -4 -39 L 0 -45 L 4 -39 Z" fill="#ffffff" />
                <rect x="0" y="-39" width="1" height="39" fill="#e2e8f0" />
              </g>
            </defs>

            <use href="#big-tree" x="200" y="420" transform="scale(1.3)" />
            <use href="#grass-tuft" x="150" y="450" transform="scale(1.5)" />
            <use href="#grass-tuft" x="280" y="490" transform="scale(1.2)" />
            <use href="#grass-tuft" x="380" y="520" transform="scale(2)" />
            <use href="#grass-tuft" x="80" y="650" transform="scale(1.8)" />
            <use href="#grass-tuft" x="320" y="680" transform="scale(1.4)" />
            <use href="#grass-tuft" x="780" y="700" transform="scale(2.5)" />
            <use href="#grass-tuft" x="1150" y="480" transform="scale(1.2)" />
            <use href="#grass-tuft" x="980" y="620" transform="scale(1.7)" />
            <use href="#grass-tuft" x="1100" y="670" transform="scale(1.4)" />
            <use href="#grass-tuft" x="1350" y="680" transform="scale(2.2)" />

            <path d="M 300 800 C 600 800, 900 500, 1280 290 L 1320 290 C 1200 500, 1100 800, 900 800 Z" fill="#f8f3e6" />

            <g id="right-fences">
              <path d="M 900 800 C 1100 800, 1200 500, 1340 300" stroke="#ffffff" strokeWidth="6" fill="none" transform="translate(0, -28)" />
              <path d="M 900 800 C 1100 800, 1200 500, 1340 300" stroke="#ffffff" strokeWidth="6" fill="none" transform="translate(0, -12)" />
              <use href="#fence-post" transform="translate(900, 800) scale(1.5)" />
              <use href="#fence-post" transform="translate(970, 770) scale(1.3)" />
              <use href="#fence-post" transform="translate(1040, 700) scale(1.1)" />
              <use href="#fence-post" transform="translate(1110, 610) scale(0.9)" />
              <use href="#fence-post" transform="translate(1180, 510) scale(0.7)" />
              <use href="#fence-post" transform="translate(1250, 410) scale(0.5)" />
              <use href="#fence-post" transform="translate(1290, 350) scale(0.35)" />
              <use href="#fence-post" transform="translate(1325, 310) scale(0.2)" />
            </g>

            <g id="left-fences">
              <path d="M 300 800 C 600 800, 900 500, 1260 300" stroke="#ffffff" strokeWidth="6" fill="none" transform="translate(0, -28)" />
              <path d="M 300 800 C 600 800, 900 500, 1260 300" stroke="#ffffff" strokeWidth="6" fill="none" transform="translate(0, -12)" />
              <use href="#fence-post" transform="translate(300, 800) scale(1.5)" />
              <use href="#fence-post" transform="translate(460, 770) scale(1.3)" />
              <use href="#fence-post" transform="translate(610, 700) scale(1.1)" />
              <use href="#fence-post" transform="translate(750, 610) scale(0.9)" />
              <use href="#fence-post" transform="translate(890, 510) scale(0.7)" />
              <use href="#fence-post" transform="translate(1020, 410) scale(0.5)" />
              <use href="#fence-post" transform="translate(1120, 350) scale(0.35)" />
              <use href="#fence-post" transform="translate(1220, 310) scale(0.2)" />
            </g>

            {/* House */}
            <g transform="translate(1300, 285) scale(0.85)">
              <rect x="-40" y="-40" width="80" height="40" fill="#ffffff" />
              <rect x="-45" y="-40" width="90" height="5" fill="#e2e8f0" />
              <polygon points="-50,-40 0,-85 50,-40" fill="#ef4444" />
              <polygon points="-40,-40 0,-75 40,-40" fill="#dc2626" opacity="0.4" />
              <rect x="-25" y="-75" width="12" height="25" fill="#ef4444" />
              <rect x="-28" y="-80" width="18" height="5" fill="#ffffff" />
              <rect x="-12" y="-20" width="12" height="20" fill="#1e293b" />
              <circle cx="-3" cy="-10" r="1.5" fill="#fcd34d" />
              <rect x="15" y="-25" width="14" height="14" fill="#38bdf8" />
              <rect x="15" y="-25" width="14" height="14" fill="none" stroke="#e2e8f0" strokeWidth="2" />
              <line x1="22" y1="-25" x2="22" y2="-11" stroke="#e2e8f0" strokeWidth="2" />
              <line x1="15" y1="-18" x2="29" y2="-18" stroke="#e2e8f0" strokeWidth="2" />
            </g>

            {/* Astronaut */}
            <svg x="1140" y="190" width="90" height="90" viewBox="0 0 100 100" overflow="visible">
              <g><g className="a-float"><ellipse cx="50" cy="90" rx="35" ry="10" fill="#cbd5e1" /><ellipse cx="35" cy="87" rx="6" ry="2" fill="#94a3b8" /><ellipse cx="65" cy="92" rx="4" ry="1.5" fill="#94a3b8" /><ellipse cx="48" cy="93" rx="8" ry="2" fill="#94a3b8" /><rect x="20" y="30" width="60" height="38" fill="#f5f5f5" rx="15" /><rect x="28" y="68" width="16" height="14" fill="#f5f5f5" rx="4" /><rect x="56" y="68" width="16" height="14" fill="#f5f5f5" rx="4" /><rect x="26" y="80" width="20" height="8" fill="#9e9e9e" rx="3" /><rect x="54" y="80" width="20" height="8" fill="#9e9e9e" rx="3" /><line x1="30" y1="50" x2="70" y2="50" stroke="#e0e0e0" strokeWidth="2" /><rect x="35" y="55" width="10" height="6" fill="#64b5f6" rx="1" /><rect x="48" y="55" width="6" height="6" fill="#e53935" rx="1" /><rect x="57" y="55" width="6" height="6" fill="#4caf50" rx="1" /><circle cx="50" cy="35" r="22" fill="#ffffff" stroke="#e0e0e0" strokeWidth="2" /><ellipse cx="50" cy="35" rx="16" ry="12" fill="#1e88e5" /><path d="M 40 30 Q 50 25 60 30" stroke="#90caf9" strokeWidth="3" fill="none" strokeLinecap="round" /><circle cx="45" cy="35" r="2" fill="#fff" /><circle cx="55" cy="35" r="2" fill="#fff" /><rect x="15" y="45" width="12" height="12" fill="#f5f5f5" rx="4" /><rect x="73" y="45" width="12" height="12" fill="#f5f5f5" rx="4" /><rect x="80" y="20" width="4" height="60" fill="#9e9e9e" rx="2" /><g className="a-flag"><path d="M 82 25 L 105 25 L 100 35 L 105 45 L 82 45 Z" fill="#e53935" /></g></g></g>
            </svg>

            {/* Graduate */}
            <svg x="1200" y="320" width="80" height="80" viewBox="0 0 100 100" overflow="visible">
              <g transform="translate(50,50) scale(-1, 1) translate(-50,-50)"><g className="a-bounce"><g className="a-walk-r" style={{ transformOrigin: '64px 65px' }}><rect x="58" y="65" width="12" height="18" fill="#f27d42" rx="2" /><path d="M 58 80 L 75 80 L 72 85 L 58 85 Z" fill="#212121" /></g><g className="a-walk-l" style={{ transformOrigin: '36px 65px' }}><rect x="30" y="65" width="12" height="18" fill="#f27d42" rx="2" /><path d="M 30 80 L 47 80 L 44 85 L 30 85 Z" fill="#212121" /></g><rect x="25" y="30" width="50" height="35" fill="#f27d42" rx="10" /><circle cx="38" cy="40" r="6" fill="#fff" /><circle cx="62" cy="40" r="6" fill="#fff" /><circle cx="40" cy="40" r="3" fill="#000" className="a-blink" /><circle cx="64" cy="40" r="3" fill="#000" className="a-blink" /><path d="M 23 50 L 45 50 L 50 65 L 23 65 Z" fill="#2c3e50" /><path d="M 77 50 L 55 50 L 50 65 L 77 65 Z" fill="#2c3e50" /><polygon points="45,50 55,50 50,58" fill="#fff" /><polygon points="48,53 52,53 50,65" fill="#c0392b" /><polygon points="50,15 20,25 50,35 80,25" fill="#212121" /><path d="M 35 25 L 65 25 L 60 35 L 40 35 Z" fill="#212121" /><g transform="translate(25, 25)" className="a-tassel"><line x1="0" y1="0" x2="0" y2="15" stroke="#f1c40f" strokeWidth="2" /><circle cx="0" cy="17" r="2" fill="#f1c40f" /></g><rect x="70" y="55" width="10" height="12" fill="#f27d42" rx="3" /><g className="a-swing" style={{ transformOrigin: '25px 55px' }}><rect x="20" y="55" width="10" height="12" fill="#f27d42" rx="3" /><rect x="10" y="65" width="28" height="20" fill="#5d4037" rx="3" /><rect x="16" y="61" width="16" height="6" fill="none" stroke="#3e2723" strokeWidth="3" rx="2" /><rect x="22" y="70" width="4" height="4" fill="#ffb300" /></g></g></g>
            </svg>

            {/* Gardener */}
            <svg x="1000" y="350" width="90" height="90" viewBox="0 0 100 100" overflow="visible">
              <g className="a-bounce"><rect x="25" y="30" width="50" height="35" fill="#66bb6a" rx="10" /><rect x="32" y="65" width="10" height="12" fill="#66bb6a" /><rect x="58" y="65" width="10" height="12" fill="#66bb6a" /><rect x="30" y="75" width="14" height="6" fill="#795548" rx="2" /><rect x="56" y="75" width="14" height="6" fill="#795548" rx="2" /><circle cx="40" cy="45" r="6" fill="#fff" /><circle cx="60" cy="45" r="6" fill="#fff" /><circle cx="42" cy="45" r="3" fill="#000" className="a-blink" /><circle cx="62" cy="45" r="3" fill="#000" className="a-blink" /><circle cx="36" cy="48" r="2" fill="#81c784" /><circle cx="64" cy="48" r="2" fill="#81c784" /><path d="M 23 52 L 77 52 L 80 65 L 20 65 Z" fill="#fff9c4" rx="2" /><circle cx="30" cy="56" r="2.5" fill="#f48fb1" /><circle cx="45" cy="60" r="2.5" fill="#f48fb1" /><circle cx="60" cy="55" r="2.5" fill="#f48fb1" /><circle cx="70" cy="62" r="2.5" fill="#f48fb1" /><ellipse cx="50" cy="22" rx="25" ry="8" fill="#d4e157" /><path d="M 35 22 Q 50 5 65 22 Z" fill="#cddc39" /><path d="M 35 22 Q 50 15 65 22" stroke="#ffb74d" strokeWidth="3" fill="none" /><g className="a-plant" style={{ transformOrigin: '73px 58px' }}><rect x="63" y="56" width="10" height="10" fill="#66bb6a" rx="3" /><path d="M 68 53 L 88 53 L 84 66 L 72 66 Z" fill="#d84315" /><path d="M 78 53 Q 68 38 73 33 Q 83 38 78 53" fill="#4caf50" /><path d="M 78 53 Q 88 33 83 28 Q 73 33 78 53" fill="#8bc34a" /></g><g className="a-dig" style={{ transformOrigin: '27px 60px' }}><rect x="22" y="55" width="10" height="10" fill="#66bb6a" rx="3" /><rect x="18" y="50" width="4" height="15" fill="#795548" rx="1" transform="rotate(-20 20 57)" /><path d="M 12 62 L 18 75 L 22 73 Z" fill="#9e9e9e" /></g></g>
            </svg>

            {/* Chef */}
            <svg x="1120" y="440" width="140" height="140" viewBox="0 0 100 100" overflow="visible">
              <g transform="translate(50,50) scale(-1, 1) translate(-50,-50)"><g className="a-bounce"><rect x="25" y="30" width="50" height="35" fill="#fdfdfd" rx="10" /><rect x="32" y="65" width="10" height="12" fill="#e0e0e0" /><rect x="58" y="65" width="10" height="12" fill="#e0e0e0" /><rect x="30" y="75" width="14" height="6" fill="#424242" rx="2" /><rect x="56" y="75" width="14" height="6" fill="#424242" rx="2" /><circle cx="38" cy="40" r="6" fill="#2c3e50" /><circle cx="62" cy="40" r="6" fill="#2c3e50" /><circle cx="38" cy="40" r="5" fill="#fff" /><circle cx="62" cy="40" r="5" fill="#fff" /><circle cx="40" cy="40" r="3" fill="#000" className="a-blink" /><circle cx="64" cy="40" r="3" fill="#000" className="a-blink" /><circle cx="42" cy="55" r="1.5" fill="#9e9e9e" /><circle cx="42" cy="60" r="1.5" fill="#9e9e9e" /><circle cx="58" cy="55" r="1.5" fill="#9e9e9e" /><circle cx="58" cy="60" r="1.5" fill="#9e9e9e" /><path d="M 40 48 L 60 48 L 50 56 Z" fill="#e74c3c" /><path d="M 30 25 L 70 25 L 75 10 Q 60 0 50 10 Q 40 0 25 10 Z" fill="#ffffff" stroke="#eeeeee" strokeWidth="2" /><rect x="70" y="55" width="10" height="12" fill="#fdfdfd" rx="3" /><g className="a-pan" style={{ transformOrigin: '25px 55px' }}><rect x="20" y="55" width="10" height="12" fill="#fdfdfd" rx="3" /><rect x="-5" y="60" width="28" height="4" fill="#34495e" rx="2" /><path d="M -25 55 L -5 55 L -10 65 L -20 65 Z" fill="#2c3e50" /></g><ellipse cx="-15" cy="53" rx="8" ry="3" fill="#f1c40f" className="a-pancake" /></g></g>
            </svg>

            {/* Coder */}
            <svg x="820" y="480" width="140" height="140" viewBox="0 0 100 100" overflow="visible">
              <g className="a-bounce"><g transform="translate(45, -10)"><circle cx="5" cy="5" r="16" fill="#fcd34d" className="a-glow" /><path d="M0,8 C0,4 10,4 10,8 C10,11 7,13 7,16 L3,16 C3,13 0,11 0,8 Z" fill="#fbbf24" /><rect x="3" y="16" width="4" height="3" fill="#9ca3af" /><path d="M3,20 L7,20 L5,22 Z" fill="#4b5563" /><line x1="5" y1="2" x2="5" y2="-2" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" /><line x1="-1" y1="4" x2="-4" y2="1" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" /><line x1="11" y1="4" x2="14" y2="1" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" /></g><rect x="25" y="30" width="50" height="35" fill="#64b5f6" rx="10" /><rect x="32" y="65" width="10" height="12" fill="#1565c0" /><rect x="58" y="65" width="10" height="12" fill="#1565c0" /><rect x="28" y="75" width="16" height="6" fill="#212121" rx="2" /><rect x="56" y="75" width="16" height="6" fill="#212121" rx="2" /><circle cx="30" cy="25" r="8" fill="#1565c0" /><circle cx="45" cy="20" r="10" fill="#1565c0" /><circle cx="60" cy="22" r="9" fill="#1565c0" /><circle cx="70" cy="30" r="7" fill="#1565c0" /><circle cx="25" cy="35" r="7" fill="#1565c0" /><path d="M 25 50 L 75 50 L 70 65 L 30 65 Z" fill="#8d6e63" /><polygon points="45,50 55,50 50,58" fill="#bbdefb" /><polygon points="45,52 50,55 45,58" fill="#d32f2f" /><polygon points="55,52 50,55 55,58" fill="#d32f2f" /><circle cx="50" cy="55" r="1.5" fill="#b71c1c" /><g><circle cx="38" cy="42" r="8" fill="none" stroke="#e3f2fd" strokeWidth="2" /><circle cx="62" cy="42" r="8" fill="none" stroke="#e3f2fd" strokeWidth="2" /><line x1="46" y1="42" x2="54" y2="42" stroke="#e3f2fd" strokeWidth="2" /><circle cx="38" cy="42" r="3" fill="#000" className="a-blink" /><circle cx="62" cy="42" r="3" fill="#000" className="a-blink" /></g><rect x="18" y="52" width="12" height="8" fill="#e3f2fd" rx="3" transform="rotate(-15 25 55)" /><rect x="25" y="56" width="8" height="6" fill="#64b5f6" rx="2" className="a-type-l" /><g transform="translate(55, 52)"><path d="M 5 0 L 25 0 L 22 15 L 2 15 Z" fill="#b0bec5" /><path d="M 0 15 L 25 15 L 28 20 L -3 20 Z" fill="#90a4ae" /><circle cx="13" cy="7" r="2" fill="#fff" opacity="0.6" /></g><rect x="68" y="50" width="12" height="8" fill="#e3f2fd" rx="3" transform="rotate(20 75 55)" /><rect x="62" y="58" width="8" height="6" fill="#64b5f6" rx="2" className="a-type-r" /></g>
            </svg>

            {/* Doctor */}
            <svg x="930" y="480" width="140" height="140" viewBox="0 0 100 100" overflow="visible">
              <g transform="translate(50,50) scale(-1, 1) translate(-50,-50)"><g className="a-bounce"><rect x="25" y="30" width="50" height="35" fill="#b2ebf2" rx="10" /><rect x="32" y="65" width="10" height="12" fill="#00838f" /><rect x="58" y="65" width="10" height="12" fill="#00838f" /><rect x="30" y="75" width="14" height="6" fill="#ffffff" rx="2" /><rect x="56" y="75" width="14" height="6" fill="#ffffff" rx="2" /><circle cx="38" cy="40" r="6" fill="#fff" /><circle cx="62" cy="40" r="6" fill="#fff" /><circle cx="40" cy="40" r="3" fill="#000" className="a-blink" /><circle cx="64" cy="40" r="3" fill="#000" className="a-blink" /><path d="M 23 45 L 45 45 L 45 65 L 23 65 Z" fill="#ffffff" /><path d="M 77 45 L 55 45 L 55 65 L 77 65 Z" fill="#ffffff" /><path d="M 45 45 L 55 45 L 50 55 Z" fill="#80deea" /><g className="a-stetho" style={{ transformOrigin: '50px 45px' }}><path d="M 35 45 Q 50 65 65 45" fill="none" stroke="#424242" strokeWidth="2.5" /><line x1="50" y1="55" x2="50" y2="62" stroke="#424242" strokeWidth="2.5" /><circle cx="50" cy="64" r="3" fill="#cfd8dc" stroke="#424242" strokeWidth="1" /></g><rect x="70" y="55" width="10" height="10" fill="#b2ebf2" rx="3" /><rect x="65" y="45" width="18" height="22" fill="#d7ccc8" rx="2" transform="rotate(10 65 45)" /><rect x="67" y="47" width="14" height="18" fill="#ffffff" transform="rotate(10 65 45)" /><rect x="72" y="43" width="6" height="3" fill="#9e9e9e" transform="rotate(10 65 45)" /><g className="a-write" style={{ transformOrigin: '30px 60px' }}><rect x="25" y="52" width="10" height="10" fill="#b2ebf2" rx="3" /><rect x="30" y="48" width="3" height="12" fill="#1e88e5" rx="1" transform="rotate(30 30 48)" /><polygon points="34,58 35,61 32,60" fill="#212121" /></g></g></g>
            </svg>

            {/* Artist */}
            <svg x="560" y="480" width="130" height="130" viewBox="0 0 100 100" overflow="visible">
              <g className="a-bounce"><path d="M 25 35 Q 25 25 35 25 L 45 25 Q 50 25 50 30 L 50 65 L 25 65 Z" fill="#9575cd" />
                <path d="M 50 30 Q 50 25 55 25 L 65 25 Q 75 25 75 35 L 75 65 L 50 65 Z" fill="#ff8a65" />
                <path d="M 50 25 Q 45 35 50 45 Q 55 55 50 65" fill="none" stroke="#fff" strokeWidth="2" opacity="0.5"/>
                <rect x="30" y="65" width="12" height="15" fill="#ff8a65" rx="2" /><rect x="58" y="65" width="12" height="15" fill="#ff8a65" rx="2" />
                <circle cx="38" cy="40" r="6" fill="#fff" /><circle cx="62" cy="40" r="6" fill="#fff" />
                <circle cx="40" cy="40" r="3" fill="#000" className="a-blink" /><circle cx="64" cy="40" r="3" fill="#000" className="a-blink" />
                <ellipse cx="40" cy="22" rx="16" ry="6" fill="#795548" transform="rotate(-15 40 22)" /><circle cx="44" cy="15" r="3" fill="#795548" />
                <path d="M 25 50 L 75 50 L 75 65 L 25 65 Z" fill="#5c6bc0" />
                <rect x="30" y="45" width="5" height="10" fill="#3949ab" rx="1" /><rect x="65" y="45" width="5" height="10" fill="#3949ab" rx="1" />
                <circle cx="32.5" cy="52" r="1.5" fill="#fdd835" /><circle cx="67.5" cy="52" r="1.5" fill="#fdd835" />
                <rect x="40" y="52" width="20" height="8" fill="#3949ab" rx="2" />
                <circle cx="35" cy="60" r="2" fill="#e91e63" /><circle cx="65" cy="58" r="1.5" fill="#00bcd4" />
                <g className="a-palette"><rect x="70" y="38" width="12" height="12" fill="#ff8a65" rx="4" /><path d="M 75 35 Q 95 30 90 50 Q 85 60 70 50 Z" fill="#d7ccc8" /><circle cx="75" cy="45" r="3" fill="#5d4037" /><circle cx="82" cy="38" r="2" fill="#f44336" /><circle cx="88" cy="42" r="2" fill="#2196f3" /><circle cx="85" cy="48" r="2" fill="#ffeb3b" /></g>
                <g className="a-paint" style={{ transformOrigin: '23px 51px' }}><rect x="18" y="45" width="10" height="12" fill="#ff8a65" rx="4" /><rect x="12" y="20" width="4" height="35" fill="#8d6e63" transform="rotate(-15 14 37)" rx="1" /><path d="M 8 15 Q 15 10 18 20 Z" fill="#d32f2f" transform="rotate(-15 14 37)" /></g>
                <g transform="translate(85, 25)"><line x1="15" y1="10" x2="0" y2="45" stroke="#8b4513" strokeWidth="3" strokeLinecap="round" /><line x1="15" y1="10" x2="30" y2="45" stroke="#8b4513" strokeWidth="3" strokeLinecap="round" /><line x1="15" y1="10" x2="15" y2="50" stroke="#8b4513" strokeWidth="3" strokeLinecap="round" /><rect x="0" y="5" width="30" height="25" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" rx="2" /><rect x="4" y="9" width="22" height="17" fill="#e0f2fe" /><circle cx="20" cy="14" r="3" fill="#fcd34d" /><path d="M 4 26 L 10 18 L 16 26 Z" fill="#34d399" /><path d="M 12 26 L 18 16 L 26 26 Z" fill="#10b981" /></g>
              </g>
            </svg>

            {/* Rocker */}
            <svg x="510" y="590" width="180" height="180" viewBox="0 0 100 100" overflow="visible">
              <g className="a-bounce"><g className="a-headbang"><rect x="25" y="30" width="50" height="35" fill="#d500f9" rx="10" /><rect x="30" y="38" width="18" height="8" fill="#212121" rx="2" /><rect x="52" y="38" width="18" height="8" fill="#212121" rx="2" /><rect x="48" y="40" width="4" height="2" fill="#212121" /><line x1="32" y1="38" x2="46" y2="44" stroke="#424242" strokeWidth="1" /><path d="M 25 35 Q 50 15 75 35" fill="none" stroke="#00e5ff" strokeWidth="4" /><rect x="18" y="32" width="8" height="16" fill="#00b8d4" rx="4" /><rect x="74" y="32" width="8" height="16" fill="#00b8d4" rx="4" /></g><rect x="32" y="65" width="10" height="12" fill="#1a237e" /><rect x="58" y="65" width="10" height="12" fill="#1a237e" /><rect x="30" y="75" width="14" height="8" fill="#ff4081" rx="2" /><rect x="56" y="75" width="14" height="8" fill="#ff4081" rx="2" /><rect x="30" y="81" width="14" height="2" fill="#fff" /><rect x="56" y="81" width="14" height="2" fill="#fff" /><rect x="70" y="50" width="10" height="10" fill="#d500f9" rx="3" /><g transform="rotate(-20 50 60)"><rect x="25" y="58" width="50" height="4" fill="#8d6e63" /><path d="M 25 50 L 40 50 Q 45 60 40 70 L 25 70 Q 15 60 25 50 Z" fill="#ff1744" /><circle cx="35" cy="60" r="4" fill="#ffffff" /><rect x="75" y="56" width="6" height="8" fill="#424242" rx="1" /></g><g className="a-strum" style={{ transformOrigin: '30px 65px' }}><rect x="28" y="55" width="10" height="12" fill="#d500f9" rx="3" /><polygon points="38,62 42,65 38,68" fill="#fff" /></g></g>
            </svg>

            {/* Scooter */}
            <svg x="780" y="530" width="180" height="180" viewBox="0 0 100 100" overflow="visible">
              <g transform="translate(50,50) scale(-1, 1) translate(-50,-50)"><g className="a-drive"><g className="a-bump"><rect x="20" y="80" width="55" height="6" fill="#95a5a6" rx="3" /><rect x="65" y="45" width="6" height="38" fill="#7f8c8d" rx="2" /><rect x="55" y="45" width="20" height="5" fill="#34495e" rx="2" /><g className="a-wheel" style={{ transformOrigin: '70px 86px' }}><circle cx="70" cy="86" r="6" fill="#2c3e50" /><circle cx="70" cy="86" r="2" fill="#ecf0f1" /></g><rect x="28" y="82" width="4" height="4" fill="#34495e" /><g className="a-wheel" style={{ transformOrigin: '30px 86px' }}><circle cx="30" cy="86" r="6" fill="#2c3e50" /><circle cx="30" cy="86" r="2" fill="#ecf0f1" /></g><g><rect x="25" y="35" width="35" height="30" fill="#f1c40f" rx="8" /><path d="M 25 35 Q 42 15 60 35 Z" fill="#d35400" /><rect x="23" y="32" width="39" height="6" fill="#e67e22" rx="2" /><circle cx="40" cy="45" r="6" fill="#fff" /><circle cx="55" cy="45" r="6" fill="#fff" /><circle cx="42" cy="45" r="3" fill="#000" className="a-blink" /><circle cx="57" cy="45" r="3" fill="#000" className="a-blink" /><rect x="20" y="52" width="45" height="18" fill="#c0392b" rx="5" /><rect x="35" y="58" width="15" height="10" fill="#e74c3c" rx="2" /><rect x="45" y="43" width="15" height="10" fill="#c0392b" rx="4" /><rect x="55" y="44" width="8" height="8" fill="#f1c40f" rx="2" /><rect x="45" y="70" width="12" height="12" fill="#2980b9" /><rect x="45" y="78" width="18" height="6" fill="#d35400" rx="2" /><rect x="45" y="82" width="18" height="2" fill="#fff" /><g className="a-kick" style={{ transformOrigin: '31px 70px' }}><rect x="25" y="70" width="12" height="12" fill="#2980b9" /><rect x="15" y="78" width="18" height="6" fill="#d35400" rx="2" /><rect x="15" y="82" width="18" height="2" fill="#fff" /></g></g></g></g></g>
            </svg>

            {/* Photographer */}
            <svg x="150" y="550" width="220" height="220" viewBox="0 0 100 100" overflow="visible">
              <g className="a-bounce"><g className="a-tail" style={{ transformOrigin: '30px 35px' }}><path d="M 30 35 Q 10 20 5 50 Q 25 55 30 40 Z" fill="#ffee58" /><rect x="25" y="32" width="6" height="10" fill="#e91e63" rx="2" transform="rotate(15 25 32)" /></g><path d="M 50 40 Q 50 25 35 25 Q 25 25 25 40 L 25 65 L 75 65 L 75 40 Q 75 25 60 25 Q 50 25 50 40 Z" fill="#f06292" /><rect x="30" y="65" width="12" height="12" fill="#f06292" rx="2" /><rect x="58" y="65" width="12" height="12" fill="#f06292" rx="2" /><path d="M 28 77 L 44 77 L 44 83 L 28 83 Z" fill="#f8bbd0" rx="2" /><path d="M 56 77 L 72 77 L 72 83 L 56 83 Z" fill="#f8bbd0" rx="2" /><circle cx="38" cy="42" r="6" fill="#fff" /><circle cx="62" cy="42" r="6" fill="#fff" /><circle cx="40" cy="42" r="3" fill="#000" className="a-blink" /><circle cx="64" cy="42" r="3" fill="#000" className="a-blink" /><path d="M 34 38 L 30 35 M 36 36 L 33 32" stroke="#000" strokeWidth="2" strokeLinecap="round" /><path d="M 66 38 L 70 35 M 64 36 L 67 32" stroke="#000" strokeWidth="2" strokeLinecap="round" /><path d="M 20 50 L 30 50 L 30 65 L 20 65 Z" fill="#ab47bc" rx="2" /><path d="M 70 50 L 80 50 L 80 65 L 70 65 Z" fill="#ab47bc" rx="2" /><path d="M 30 50 L 35 50 L 35 65 L 30 65 Z" fill="#81d4fa" /><path d="M 65 50 L 70 50 L 70 65 L 65 65 Z" fill="#81d4fa" /><g className="a-photo"><rect x="32" y="55" width="10" height="10" fill="#f06292" rx="3" /><rect x="58" y="55" width="10" height="10" fill="#f06292" rx="3" /><rect x="38" y="52" width="24" height="16" fill="#424242" rx="3" /><rect x="42" y="49" width="6" height="4" fill="#212121" rx="1" /><circle cx="50" cy="60" r="6" fill="#90caf9" stroke="#616161" strokeWidth="2" /><circle cx="50" cy="60" r="2" fill="#fff" opacity="0.8" /><circle cx="50" cy="60" r="0" fill="#fff" className="a-flash" /></g></g>
            </svg>

          </svg>
        </div>
      </div>

      {/* ── Feature cards ── */}
      <div ref={infoRef} className="relative z-20 w-full max-w-6xl mx-auto px-6 pb-20 grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {[
            { icon: '👁️', title: 'Blink Rate Monitor', desc: 'MediaPipe AI tracks your blink rate in real-time and alerts you when you stop blinking enough.' },
            { icon: '📏', title: 'Distance Detection', desc: 'Warns you when you are too close or too far from your screen to prevent strain.' },
            { icon: '😴', title: 'Drowsiness Alert', desc: 'Feeling sleepy while working or studying? Our AI detects prolonged eye closure and fatigue patterns to gently wake you up before productivity drops.' },
            { icon: '📊', title: 'Personalized Dashboard', desc: 'Track your blink trends, focus sessions, and eye health insights with real-time analytics tailored to your productivity and health mode.' },
            { icon: '🧘‍♂️', title: 'Eye Exercise Mode', desc: 'Feel strain building up? Get real-time guided eye relaxation and focus-shifting exercises powered by intelligent coaching to reduce fatigue and restore clarity.' },
            { icon: '🤖', title: 'Gemini AI Coach', desc: 'Get personalised, witty tips from AI — a coach for your eyes.' },

        ].map(f => (
          <motion.div
            key={f.title}
            initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }}
            className="bg-white/15 border border-white/25 backdrop-blur-sm rounded-[28px] p-8 text-white hover:bg-white/20 transition-colors shadow-lg"
          >
            <div className="text-4xl mb-4">{f.icon}</div>
            <h3 className="font-black text-xl mb-2">{f.title}</h3>
            <p className="text-white/80 font-medium">{f.desc}</p>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showAuth && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md px-4">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="w-[400px] p-8 bg-[#FCF9F2] rounded-[40px] shadow-2xl relative border-2 border-white/50">
              <button onClick={() => setShowAuth(false)} className="absolute top-6 right-6 text-[#3D4035] hover:opacity-50"><X size={20}/></button>
              <h2 className="text-3xl font-black mb-6 text-[#3D4035]">{authTab === 'login' ? 'Welcome Back' : 'Join Us'}</h2>
              <div className="relative flex bg-white border border-[#99C5B5] rounded-full p-1 mb-8 shadow-inner">
                <motion.div className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#E58C49] rounded-full" animate={{ left: authTab === 'login' ? '4px' : 'calc(50%)' }} transition={{ type: "spring", bounce: 0.2, duration: 0.4 }} />
                <button onClick={() => setAuthTab('login')} className={`flex-1 py-2 relative z-10 font-bold text-sm transition-colors ${authTab === 'login' ? 'text-white' : 'text-[#7A9B76]'}`}>Log In</button>
                <button onClick={() => setAuthTab('signup')} className={`flex-1 py-2 relative z-10 font-bold text-sm transition-colors ${authTab === 'signup' ? 'text-white' : 'text-[#7A9B76]'}`}>Sign Up</button>
              </div>
              <div className="space-y-4 mb-8">
                <input type="text" placeholder="Username" className="w-full bg-white border border-[#99C5B5]/50 text-[#3D4035] px-5 py-4 rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-[#E58C49]" />
                <input type="password" placeholder="Password" className="w-full bg-white border border-[#99C5B5]/50 text-[#3D4035] px-5 py-4 rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-[#E58C49]" />
              </div>
              <button onClick={handleAuth} className="w-full bg-[#E58C49] text-white py-4 rounded-2xl font-bold text-lg mb-4 hover:bg-[#D47A3A] transition-colors shadow-md">
                {authTab === 'login' ? 'Sign In' : 'Create Account'}
              </button>
              <button onClick={handleAuth} className="w-full bg-white border-2 border-transparent text-[#3D4035] shadow-sm py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
                Continue with Google
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ==========================================
// 9. Onboarding Page
// ==========================================
function OnboardingPage() {
  const navigate = useNavigate();
  const { setUser } = React.useContext(UserContext);
  const [selectedMascot, setSelectedMascot] = useState('coder');
  const [name, setName] = useState('');
  const [status, setStatus] = useState(null);

  const handleFinish = () => {
    setStatus(`Successfully selected ${selectedMascot}! Ready to protect your eyes.`);
    setTimeout(() => {
      setStatus(null);
      setUser({ name: name || 'User', mascot: selectedMascot, theme: 'light' });
      navigate('/calibration');
    }, 1500);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-[#FCF9F2] text-[#3D4035] py-20 px-6 flex flex-col items-center relative">
      <button onClick={() => navigate('/')} className="absolute top-10 left-10 p-2 text-[#7A9B76] hover:bg-black/5 rounded-full transition-colors z-50"><ArrowLeft size={24}/></button>
      <AnimatePresence>
        {status && (<motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="fixed top-0 bg-[#E58C49] text-white px-8 py-3 rounded-full font-bold shadow-2xl z-[100]">{status}</motion.div>)}
      </AnimatePresence>
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Choose Your Buddy</h2>
        <p className="text-[#7A9B76] text-lg font-bold max-w-md mx-auto">They will keep an eye on you while you work and remind you to blink.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6 max-w-7xl w-full mb-12">
        {MASCOT_KEYS.map((skin, idx) => (
          <motion.div key={skin} whileHover={{ y: -5 }} onClick={() => setSelectedMascot(skin)}
            className={`relative bg-white rounded-[32px] p-6 h-56 flex flex-col items-center justify-center cursor-pointer transition-all border-4 shadow-sm ${selectedMascot === skin ? 'border-[#E58C49] shadow-[0_10px_30px_rgba(229,140,73,0.3)] scale-105' : 'border-transparent hover:border-[#99C5B5]/50'}`}>
            <div className="absolute top-4 left-4 text-[#99C5B5] font-black tracking-widest text-xs uppercase">0{idx + 1}</div>
            <div className="relative flex flex-col items-center z-10 mt-4"><PixelMascot skin={skin} size={130} /></div>
            <AnimatePresence>{selectedMascot === skin && (<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-4 right-4 bg-[#E58C49] text-white rounded-full p-1"><CheckCircle2 size={20} /></motion.div>)}</AnimatePresence>
            <div className={`mt-2 text-xs font-bold uppercase tracking-wider ${selectedMascot === skin ? 'text-[#E58C49]' : 'text-slate-400'}`}>{skin}</div>
          </motion.div>
        ))}
      </div>
      <div className="w-full max-w-md space-y-4">
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Name your buddy" className="w-full bg-white border-2 border-[#99C5B5] px-6 py-4 rounded-2xl font-bold focus:outline-none focus:border-[#E58C49] text-lg text-center text-[#3D4035] shadow-inner transition-all" />
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleFinish} className="w-full bg-[#7A9B76] text-white py-5 rounded-2xl font-bold text-xl shadow-lg hover:bg-[#60805F] transition-colors uppercase tracking-widest">Start Protecting</motion.button>
      </div>
    </motion.div>
  );
}

// ==========================================
// 10. Calibration Page
// ==========================================
function CalibrationPage() {
  const navigate = useNavigate();
  const { user } = React.useContext(UserContext);
  const [timeLeft, setTimeLeft] = useState(300);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (timeLeft > 0 && !isDone) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && !isDone) setIsDone(true);
  }, [timeLeft, isDone]);

  const formatMinSec = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-[#FCF9F2] text-[#3D4035] flex flex-col items-center justify-center p-6 relative">
      <div className="w-full max-w-2xl bg-white rounded-[40px] p-12 shadow-2xl border border-white flex flex-col items-center text-center">
        {!isDone ? (
          <>
            <div className="w-24 h-24 bg-[#E58C49]/10 text-[#E58C49] rounded-full flex items-center justify-center mb-6"><Camera size={40} className="animate-pulse" /></div>
            <h2 className="text-4xl font-black mb-4">Personal Baseline Calibration</h2>
            <p className="text-lg text-[#7A9B76] font-medium mb-10 leading-relaxed">Before we start protecting your eyes, let's establish your personal baseline. This helps our AI understand your natural blink rate and posture for more accurate alerts.<br/><br/><strong>Please look at the screen and use your device as usual for the next 5 minutes.</strong></p>
            <div className="relative mb-8">
              <svg className="w-48 h-48 -rotate-90 drop-shadow-md">
                <circle cx="96" cy="96" r="85" stroke="#E2E8F0" strokeWidth="10" fill="transparent" />
                <motion.circle cx="96" cy="96" r="85" stroke="#E58C49" strokeWidth="10" fill="transparent" strokeDasharray="534" animate={{ strokeDashoffset: 534 - (534 * ((300 - timeLeft) / 300)) }} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-4xl font-black">{formatMinSec(timeLeft)}</span></div>
            </div>
            <button onClick={() => { setTimeLeft(0); setIsDone(true); }} className="text-xs font-bold text-slate-400 hover:text-[#E58C49] flex items-center gap-1 transition-colors"><FastForward size={14} /> Skip for Demo</button>
          </>
        ) : (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
            <div className="w-24 h-24 bg-[#7A9B76]/20 text-[#7A9B76] rounded-full flex items-center justify-center mb-6"><CheckCircle2 size={48} /></div>
            <h2 className="text-4xl font-black mb-4">Calibration Complete!</h2>
            <p className="text-lg text-[#7A9B76] font-medium mb-10 leading-relaxed">Your baseline is set. The AI is now perfectly tailored to your unique habits. You can recalibrate anytime in Settings.</p>
            <button onClick={() => navigate('/home')} className="w-full max-w-sm bg-[#E58C49] text-white py-5 rounded-2xl font-bold text-xl shadow-lg hover:bg-[#D47A3A] transition-colors uppercase tracking-widest">Continue</button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ==========================================
// 11. Home Page
// ==========================================
function HomePage() {
  const navigate = useNavigate();
  const { user } = React.useContext(UserContext);
  const isDark = user?.theme === 'dark';
  const cardBg = isDark ? 'bg-[#1D2B26] border-[#3D6055] text-white' : 'bg-[#FCF9F2] border-white text-[#3D4035]';

  const handleModeStart = (mode) => {
    localStorage.setItem('eyeguard_mode', mode);
    navigate('/live');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pt-32 pb-20 px-8 max-w-7xl mx-auto">
      <div className="mb-12 relative bg-[#1B8B68] rounded-[40px] p-12 overflow-hidden shadow-md text-white flex items-center justify-between">
        <div className="relative z-10 max-w-lg">
          <h2 className="text-4xl md:text-5xl font-black mb-4 leading-tight">Elevate Your Focus with EyeGuard</h2>
          <p className="text-[#E0F2E9] text-lg mb-8 leading-relaxed font-medium">Explore exercises, track your focus, and work seamlessly. From smart tracking to eye health insights, we've cracked the code for a healthier journey in every session.</p>
          <button onClick={() => handleModeStart('eye_health')} className="bg-white text-[#1B8B68] px-8 py-3 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-colors shadow-lg">Get started</button>
        </div>
        <div className="hidden md:flex relative w-[300px] h-[200px] justify-center items-center z-10">
          <div className="z-20 scale-125"><PixelMascot skin={user?.mascot} size={180} /></div>
        </div>
        <div className="absolute right-[-10%] top-[-20%] w-64 h-64 bg-[#147053] rounded-full opacity-50" />
        <div className="absolute right-[20%] bottom-[-30%] w-48 h-48 bg-[#147053] rounded-full opacity-50" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ModeCard icon={<Camera className="text-white"/>} title="Eye Health Mode" bg="bg-[#E395A4]" cardBg={cardBg}
          desc="AI detects blink rates and screen distance to prevent digital eye strain."
          tags={['Requires Camera', 'AI Powered']} onClick={() => handleModeStart('eye_health')} />
        <ModeCard icon={<ShieldAlert className="text-white"/>} title="Productivity Mode" bg="bg-[#E58C49]" cardBg={cardBg}
          desc="Monitors drowsiness and eye closures to keep you sharp and awake."
          tags={['Anti-Fatigue', 'Focus Tracking']} onClick={() => handleModeStart('productivity')} />
        <ModeCard icon={<Clock className="text-white"/>} title="Timer Mode" bg="bg-[#7A9B76]" cardBg={cardBg}
          desc="Classic 20-20-20 rule reminders. Fully customizable work and break periods."
          tags={['No Camera Needed', 'Simple Timer']} onClick={() => navigate('/timer')} />
      </div>
    </motion.div>
  );
}

function ModeCard({ title, desc, icon, bg, cardBg, tags, onClick }) {
  return (
    <motion.div whileHover={{ y: -5 }} onClick={onClick} className={`${cardBg} p-8 rounded-[32px] cursor-pointer transition-all shadow-sm hover:shadow-xl flex flex-col h-full border`}>
      <div className={`w-16 h-16 ${bg} rounded-[20px] flex items-center justify-center mb-6 shadow-sm`}>{React.cloneElement(icon, { size: 32 })}</div>
      <h3 className="text-2xl font-black mb-3">{title}</h3>
      <p className="opacity-70 mb-8 flex-1 font-medium">{desc}</p>
      <div className="flex flex-wrap gap-2 mb-6">{tags.map(t => <span key={t} className="bg-black/5 text-sm font-bold px-3 py-1.5 rounded-xl opacity-80">{t}</span>)}</div>
      <div className="mt-auto flex items-center justify-between font-black text-lg opacity-90">Start <ChevronRight size={20} /></div>
    </motion.div>
  );
}

// ==========================================
// 12. Live Monitor Page  ← FULLY WIRED
// ==========================================
function LivePage() {
  const navigate = useNavigate();
  const { user } = React.useContext(UserContext);
  const mode = localStorage.getItem('eyeguard_mode') || 'eye_health';

  // ── UI state ──────────────────────────────────────────────────────────────
  const [sessionTime, setSessionTime]   = useState(0);
  const [totalBlinks, setTotalBlinks]   = useState(0);
  const [drowsyCount, setDrowsyCount]   = useState(0);
  const [coachTip, setCoachTip]     = useState("I'm watching your eyeballs (lovingly). Blink normally and keep a comfy distance.");
  const [coachTipTs, setCoachTipTs] = useState(0);
  const [banner, setBanner]             = useState(null);
  const [sessionId, setSessionId]       = useState(null);
  const [camDenied, setCamDenied]       = useState(false);
  const [modelReady, setModelReady]     = useState(false);

  // ── Live metrics (updated every animation frame) ───────────────────────
  const [ear, setEar]         = useState(0);
  const [bpm, setBpm]         = useState(0);
  const [tooClose, setTooClose] = useState(false);
  const [tooFar, setTooFar]     = useState(false);
  const [drowsy, setDrowsy]     = useState(false);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const faceRef   = useRef(null);   // FaceLandmarker instance
  const rafRef    = useRef(null);   // requestAnimationFrame id

  // Blink state machine
  const blinkRef = useRef({
    closed: false,
    closeStart: 0,
    lastBlinkTs: 0,
    blinks: [],         // timestamps of blinks in last 60s
  });

  // AI cooldown — fire Gemini tip at most once per minute
  const aiRef = useRef({ lastTs: 0 });
  // Live refs so the RAF loop always reads current values (avoids stale closures)
  const bpmRef      = useRef(0);
  const tooCloseRef = useRef(false);
  const tooFarRef   = useRef(false);
  const drowsyRef   = useRef(false);

  // ── Audio beep helper ────────────────────────────────────────────────────
  function beep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 880; g.gain.value = 0.08;
      o.start();
      setTimeout(() => { o.stop(); ctx.close(); }, 180);
    } catch {}
  }

  // ── Notification banner helper ───────────────────────────────────────────
  function notify(text, { sound = true, vibrate = true } = {}) {
    setBanner(text);
    if (sound) beep();
    if (vibrate && 'vibrate' in navigator) navigator.vibrate([120, 80, 120]);
    setTimeout(() => setBanner(null), 6000);
  }

  // ── Gemini AI tip trigger — reads from refs so it's never stale ────────
  async function maybeAI() {
    const now = Date.now();
    if (now - aiRef.current.lastTs < 60_000) return; // 1-min cooldown
    if (tip && typeof tip === 'string') {
        setCoachTip(tip.trim());
        setCoachTipTs(Date.now());
        }
    const fallback = 'Take a 20-second break, relax your shoulders, then blink slowly 6 times.';
        setCoachTip(fallback);
        setCoachTipTs(Date.now());
        notify(fallback, { sound: true });
    const mascotSubtitle = (() => {
        if (coachTip && Date.now() - coachTipTs < 5 * 60_000) return coachTip;
        if (tooClose) return 'Back up a little — your screen is not a hug target.';
        if (tooFar) return "Scoot closer so you don't squint like a detective.";
        if (drowsy) return 'Quick reset: stand up, stretch, and drink water.';
        if (bpm < 10) return 'Blink check: your eyes need tiny breaks too.';
        return 'Steady pace. Keep blinking and stay comfy.';
        })();
    const _bpm      = bpmRef.current;
    const too_close = tooCloseRef.current;
    const too_far   = tooFarRef.current;
    const _drowsy   = drowsyRef.current;

    let should = false;
    if (mode === 'eye_health')   should = _bpm < 10 || too_close || too_far || _drowsy;
    if (mode === 'productivity') should = _drowsy || _bpm < 7;
    if (!should) return;

    aiRef.current.lastTs = now;
    try {
      track("gemini_tip_requested", { mode });
      const { tip } = await getTip({ bpm: _bpm, too_close, too_far, drowsy: _drowsy, mode });
      track("gemini_tip_received", { mode });
      notify(tip, { sound: true, vibrate: true });
    } catch (err) {
      track("gemini_tip_error", { mode });
      notify('Take a 20-second break and blink slowly a few times.', { sound: true });
    }
  }

  // ── Session timer ────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => setSessionTime(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // ── Start backend session on mount ───────────────────────────────────────
  useEffect(() => {
    track("session_start", { mode });
    startSession(mode).then(id => setSessionId(id));
  }, []);

  // ── End backend session on unmount ───────────────────────────────────────
  useEffect(() => {
    return () => {
      if (sessionId) endSession(sessionId);
    };
  }, [sessionId]);

  // ── Send periodic events to backend ──────────────────────────────────────
  useEffect(() => {
    if (!sessionId) return;
    const iv = setInterval(() => {
      sendEvent(sessionId, {
        event_type: 'metrics',
        data: { bpm, ear, too_close: tooClose, too_far: tooFar, drowsy },
      });
    }, 10_000); // every 10 s
    return () => clearInterval(iv);
  }, [sessionId, bpm, ear, tooClose, tooFar, drowsy]);

  // ── Camera + MediaPipe main loop ──────────────────────────────────────────
  useEffect(() => {
    let stream = null;
    let cancelled = false;

    const run = async () => {
      // 1. Request camera
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        track("camera_permission_granted");
      } catch {
        setCamDenied(true);
        track("camera_permission_denied");
        return;
      }

      if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }

      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      // 2. Load MediaPipe FaceLandmarker
      if (!faceRef.current) {
        faceRef.current = await createBlinkDetector();
      }
      setModelReady(true);
      track("mediapipe_model_ready");

      const landmarker = faceRef.current;

      // 3. Per-frame inference loop
      const tick = () => {
        if (cancelled) return;

        const video = videoRef.current;
        if (!video || video.readyState < 2) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }

        const t = performance.now();
        const res = landmarker.detectForVideo(video, t);

        if (res?.faceLandmarks?.length) {
          const lm = res.faceLandmarks[0];

          // ── EAR (eye-aspect-ratio) ──────────────────────────────────────
          const { ear: earVal } = computeBlinkMetrics(lm);
          setEar(earVal);

          // ── Distance alert ──────────────────────────────────────────────
          const { too_close, too_far } = computeDistanceAlert(lm);
          setTooClose(too_close);
          setTooFar(too_far);
          tooCloseRef.current = too_close;
          tooFarRef.current   = too_far;

          // ── Blink state machine ─────────────────────────────────────────
          const THRESH       = 0.23;  // EAR below → eye closed
          const MIN_CLOSE_MS = 80;    // must stay closed this long to count
          const MIN_GAP_MS   = 200;   // min gap between blinks
          const DROWSY_MS    = 1500;  // eyes closed > this → drowsy

          const st = blinkRef.current;
          const now = Date.now();

          if (earVal < THRESH) {
            if (!st.closed) {
              st.closed = true;
              st.closeStart = now;
            }
            // Drowsiness check
            const isDrowsy = (now - st.closeStart) > DROWSY_MS;
            setDrowsy(isDrowsy);
            drowsyRef.current = isDrowsy;
            if (isDrowsy) setDrowsyCount(c => c + 1);
          } else {
            if (st.closed) {
              const closeDur = now - st.closeStart;
              const gap      = now - st.lastBlinkTs;
              if (closeDur >= MIN_CLOSE_MS && gap >= MIN_GAP_MS) {
                st.lastBlinkTs = now;
                st.blinks.push(now);
                // Keep only blinks in the last 60 s
                st.blinks = st.blinks.filter(x => now - x <= 60_000);
                const newBpm = st.blinks.length;
                setBpm(newBpm);
                bpmRef.current = newBpm;
                setTotalBlinks(c => c + 1);
              }
              setDrowsy(false);
              drowsyRef.current = false;
            }
            st.closed = false;
          }

          // ── Distance banner ─────────────────────────────────────────────
          if (too_close) notify('📏 Too close! Back up from your screen.', { sound: false, vibrate: false });

          // ── Gemini AI tip (rate-limited, reads fresh refs) ────────
          maybeAI();
        }

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    };

    run();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, []);

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const handleEndSession = () => {
    if (sessionId) endSession(sessionId);
    navigate('/home');
  };

  // ── Distance label ────────────────────────────────────────────────────────
  const distLabel = tooClose ? 'TOO CLOSE' : tooFar ? 'TOO FAR' : 'GOOD DISTANCE';
  const distColor = tooClose ? 'text-red-400' : tooFar ? 'text-amber-400' : 'text-[#7A9B76]';
  const mascotAlert = tooClose || drowsy;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-[#111] text-white p-8 pb-16">
      <canvas ref={canvasRef} className="hidden" />

      {/* ── Notification Banner ── */}
      <AnimatePresence>
        {banner && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] bg-[#E58C49] text-white px-8 py-4 rounded-2xl font-bold shadow-2xl max-w-lg text-center text-sm leading-snug"
          >
            {banner}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Camera denied warning ── */}
      {camDenied && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
          <div className="bg-[#1a1a1a] border border-red-500/30 rounded-[32px] p-10 max-w-sm text-center">
            <Camera size={48} className="text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-black mb-2 text-red-400">Camera Access Denied</h3>
            <p className="text-white/60 mb-6 text-sm">Please allow camera access in your browser settings and refresh the page.</p>
            <button onClick={() => navigate('/home')} className="bg-white/10 text-white px-6 py-3 rounded-xl font-bold">← Go Back</button>
          </div>
        </div>
      )}

      <header className="flex items-center justify-between mb-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#7A9B76]/20 text-[#7A9B76] px-4 py-2 rounded-full font-bold text-sm">
            <div className="w-2 h-2 bg-[#7A9B76] rounded-full animate-pulse" />
            {mode === 'eye_health' ? 'Health AI Active' : 'Focus AI Active'}
          </div>
          {!modelReady && (
            <div className="text-white/40 text-xs font-bold animate-pulse">Loading model…</div>
          )}
        </div>
        <button onClick={handleEndSession} className="bg-white/10 hover:bg-[#E395A4] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors">End Session & Back</button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto h-[75vh]">
        {/* ── Left: camera feed + EAR bar ── */}
        <div className="lg:col-span-8 flex flex-col gap-6 h-full">
          <div className="bg-black rounded-[40px] flex-1 relative overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center">
            <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-80 rounded-[40px]" />
            {!modelReady && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Camera size={64} className="text-white/20" />
              </div>
            )}
            <div className="animate-solid-scan" />
            {/* Face guide box */}
            <div className="absolute w-48 h-64 border-2 border-dashed border-[#7A9B76]/50 rounded-3xl" />
            {/* CAM ON badge */}
            <div className="absolute top-6 right-6 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-white/10">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-white tracking-wider">CAM ON</span>
            </div>
            {/* Distance badge */}
            <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-white/10">
              <Target size={16} className={distColor} />
              <span className={`text-xs font-bold tracking-wider ${distColor}`}>{distLabel}</span>
            </div>
            {/* Drowsy badge */}
            {drowsy && (
              <div className="absolute top-6 left-6 flex items-center gap-2 bg-[#E58C49]/80 backdrop-blur-md px-4 py-2 rounded-full shadow-lg">
                <span className="text-xs font-black text-white tracking-wider">😴 DROWSY DETECTED</span>
              </div>
            )}
          </div>

          {/* EAR progress bar */}
          <div className="bg-white/5 rounded-[32px] p-6 border border-white/10">
            <div className="flex justify-between text-sm font-bold uppercase tracking-widest text-white/50 mb-3">
              <span>Eye Openness (EAR)</span>
              <span className="text-[#E58C49]">{ear.toFixed(3)}</span>
            </div>
            <div className="h-4 bg-black/50 rounded-full overflow-hidden relative">
              <motion.div
                className={`absolute top-0 left-0 h-full rounded-full transition-colors ${ear < 0.23 ? 'bg-[#E395A4]' : 'bg-[#E58C49]'}`}
                animate={{ width: `${Math.min(ear * 250, 100)}%` }}
                transition={{ duration: 0.1 }}
              />
              {/* Threshold marker at EAR=0.23 → 23/100*250 = 57.5% */}
              <div className="absolute top-0 bottom-0 left-[57.5%] w-0.5 bg-white/30" title="Blink threshold" />
            </div>
            <p className="text-white/30 text-xs mt-2">Dashed line = blink threshold (EAR 0.23)</p>
          </div>
        </div>

        {/* ── Right: mascot + stats ── */}
        <div className="lg:col-span-4 flex flex-col gap-6 h-full">
          <div className={`rounded-[40px] p-8 border text-center flex-1 flex flex-col items-center justify-center transition-colors ${mascotAlert ? 'bg-[#E395A4]/10 border-[#E395A4]/50' : 'bg-white/5 border-white/10'}`}>
            <PixelMascot skin={user?.mascot} size={200} alertState={mascotAlert} />
            <div className="mt-8 h-20">
              {tooClose
                ? <><h4 className="text-[#E395A4] font-bold text-xl">Too Close!</h4><p className="text-white/50 text-sm mt-1">Back up from the screen</p></>
                : drowsy
                ? <><h4 className="text-[#E58C49] font-bold text-xl">Sleepy spotted!</h4><p className="text-white/50 text-sm mt-1">Wake up, you've got this!</p></>
                : tooFar
                ? <><h4 className="text-amber-400 font-bold text-xl">Too Far!</h4><p className="text-white/50 text-sm mt-1">Move closer to the screen</p></>
                : <><h4 className="text-[#7A9B76] font-bold text-xl">Looking Good!</h4><p className="text-white/50 text-sm mt-1">Keep it up 👀</p></>
              }
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <p className="text-white/50 text-[10px] font-bold uppercase mb-2 tracking-wider">Session Time</p>
              <p className="text-3xl font-black text-white">{formatTime(sessionTime)}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <p className="text-white/50 text-[10px] font-bold uppercase mb-2 tracking-wider">Total Blinks</p>
              <p className="text-3xl font-black text-white">{totalBlinks}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 col-span-2 flex justify-between items-center">
              <div>
                <p className="text-white/50 text-[10px] font-bold uppercase mb-2 tracking-wider">Blink Rate</p>
                <p className="text-3xl font-black text-[#E58C49]">
                  {bpm} <span className="text-sm text-white/50">BPM</span>
                </p>
                <p className="text-white/30 text-xs mt-1">
                  {bpm < 10 ? '⚠️ Low — blink more!' : bpm < 15 ? '😐 Below average' : '✅ Healthy range'}
                </p>
              </div>
              <Activity className="text-[#E58C49] opacity-50" size={32} />
            </div>
            {drowsyCount > 0 && (
              <div className="bg-[#E58C49]/10 border border-[#E58C49]/30 rounded-3xl p-6 col-span-2">
                <p className="text-[#E58C49] text-[10px] font-bold uppercase mb-1 tracking-wider">Drowsy Events</p>
                <p className="text-2xl font-black text-[#E58C49]">{drowsyCount}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ==========================================
// 13. Timer Page
// ==========================================
function TimerPage() {
  const navigate = useNavigate();
  const { user } = React.useContext(UserContext);
  const isDark = user?.theme === 'dark';
  const [workMins, setWorkMins] = useState(35);
  const [breakMins, setBreakMins] = useState(10);
  const [timeLeft, setTimeLeft] = useState(35 * 60);
  const [isBreak, setIsBreak] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    let timer;
    if (isRunning && timeLeft > 0) timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    else if (isRunning && timeLeft === 0) {
      setShowConfetti(true); setIsRunning(false);
      setTimeout(() => { setShowConfetti(false); setIsBreak(!isBreak); setTimeLeft(isBreak ? workMins * 60 : breakMins * 60); }, 4000);
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft, isBreak, workMins, breakMins]);

  useEffect(() => { if (!isRunning) setTimeLeft(isBreak ? breakMins * 60 : workMins * 60); }, [workMins, breakMins, isBreak, isRunning]);

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const total = isBreak ? breakMins * 60 : workMins * 60;
  const progress = total > 0 ? ((total - timeLeft) / total) * 100 : 0;
  const cardBg = isDark ? 'bg-[#1D2B26] border-[#3D6055]' : 'bg-[#FCF9F2] border-[#E2E8F0]';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen flex flex-col items-center justify-center pt-20 pb-10 relative">
      <button onClick={() => navigate('/home')} className={`absolute top-28 left-12 flex items-center gap-2 font-bold ${isDark ? 'text-white/50' : 'text-[#7A9B76]'} hover:opacity-100 transition-colors z-50`}><ArrowLeft size={20} /> Back to Home</button>
      {showConfetti && <Confetti />}
      <div className="w-full flex flex-col items-center mt-16 px-6 mx-auto">
        <div className="relative mt-24 flex justify-center w-full max-w-lg">
          <div className="absolute -top-[145px] z-0"><PixelMascot skin={user?.mascot} size={180} /></div>
          <div className={`relative z-10 ${cardBg} ${isDark ? 'text-white' : 'text-[#3D4035]'} rounded-[40px] p-12 w-full shadow-2xl border`}>
            <div className="flex justify-between items-start mb-10 min-h-[100px]">
              {!isEditing ? (
                <div className="flex gap-8 w-full justify-between" onClick={() => !isRunning && setIsEditing(true)}>
                  <div className={`flex flex-col cursor-pointer ${!isBreak ? 'opacity-100' : 'opacity-40'}`}>
                    <span className="text-sm font-black tracking-widest uppercase mb-1">Focus Timer</span>
                    <span className="text-7xl font-black">{!isBreak ? formatTime(timeLeft) : `${workMins}:00`}</span>
                  </div>
                  <div className={`flex flex-col cursor-pointer ${isBreak ? 'opacity-100' : 'opacity-40'} text-right`}>
                    <span className="text-sm font-black tracking-widest uppercase mb-1">Relax Break</span>
                    <span className="text-7xl font-black text-[#E395A4]">{isBreak ? formatTime(timeLeft) : `${breakMins}:00`}</span>
                  </div>
                </div>
              ) : (
                <div className="flex gap-6 w-full">
                  <div className="flex flex-col flex-1 bg-black/5 p-6 rounded-2xl">
                    <span className="text-sm font-black uppercase mb-3 text-center">Focus (min)</span>
                    <div className="flex items-center justify-between">
                      <button onClick={() => setWorkMins(m => Math.max(1, m - 1))} className="p-3 bg-white rounded-xl shadow-sm text-black"><Minus size={20}/></button>
                      <span className="text-3xl font-black">{workMins}</span>
                      <button onClick={() => setWorkMins(m => m + 1)} className="p-3 bg-white rounded-xl shadow-sm text-black"><Plus size={20}/></button>
                    </div>
                  </div>
                  <div className="flex flex-col flex-1 bg-black/5 p-6 rounded-2xl">
                    <span className="text-sm font-black uppercase mb-3 text-center">Relax (min)</span>
                    <div className="flex items-center justify-between">
                      <button onClick={() => setBreakMins(m => Math.max(1, m - 1))} className="p-3 bg-white rounded-xl shadow-sm text-black"><Minus size={20}/></button>
                      <span className="text-3xl font-black text-[#E395A4]">{breakMins}</span>
                      <button onClick={() => setBreakMins(m => m + 1)} className="p-3 bg-white rounded-xl shadow-sm text-black"><Plus size={20}/></button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between gap-6 mt-8">
              <div className="flex-1 flex items-center gap-4 bg-black/5 p-5 rounded-3xl">
                <Heart size={28} className="text-[#E395A4]" fill="currentColor" />
                <div className="flex-1 h-5 bg-black/10 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-[#E395A4] rounded-full" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ ease: "linear", duration: 1 }} />
                </div>
              </div>
              {!isEditing && (
                <button onClick={() => { setIsRunning(false); setTimeLeft(isBreak ? breakMins * 60 : workMins * 60); }} className="w-16 h-16 bg-black/5 rounded-2xl flex items-center justify-center hover:bg-black/10 transition-colors"><RotateCcw size={28} className="opacity-70" /></button>
              )}
              <button onClick={() => { setIsRunning(!isRunning); setIsEditing(false); }} className="w-20 h-20 bg-[#E58C49] rounded-3xl flex items-center justify-center text-white shadow-[0_10px_20px_rgba(229,140,73,0.4)] hover:bg-[#D47A3A] hover:scale-105 active:scale-95 transition-all">
                {isEditing ? <CheckCircle2 size={32} /> : isRunning ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ==========================================
// 14. Exercises Page
// ==========================================
function ExercisesPage() {
  const navigate = useNavigate();
  const { user } = React.useContext(UserContext);
  const isDark = user?.theme === 'dark';
  const [activeExercise, setActiveExercise] = useState(null);
  const [showKnowledge, setShowKnowledge] = useState(null);
  const cardBg = isDark ? 'bg-[#1D2B26] border-[#3D6055]' : 'bg-[#FCF9F2] border-white';

  if (activeExercise) return <ExercisePlayer exercise={activeExercise} onBack={() => setActiveExercise(null)} user={user} isDark={isDark} />;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pt-32 pb-20 px-8 max-w-7xl mx-auto relative">
      <div className="flex items-center gap-4 mb-4">
        <button onClick={() => navigate('/home')} className={`p-2 rounded-full ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/5 hover:bg-black/10 text-black'}`}><ArrowLeft size={20}/></button>
        <h2 className={`text-4xl font-black ${isDark ? 'text-white' : 'text-[#3D4035]'}`}>Eye Care Routines</h2>
      </div>
      <p className="opacity-70 mb-12 text-lg font-medium ml-14">Colorful, gentle routines to keep your eyes sparkling.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {EYE_EXERCISES.map((ex) => (
          <div key={ex.id} className={`${cardBg} rounded-[32px] overflow-hidden shadow-lg border hover:-translate-y-2 transition-transform duration-300 flex flex-col`}>
            <div className={`h-40 ${ex.color} relative flex items-center justify-center p-6`}>
              <div className="w-24 h-24">{CuteIcons[ex.icon]}</div>
            </div>
            <div className="p-8 flex flex-col flex-1 bg-white text-[#3D4035]">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-xl font-black">{ex.title}</h4>
                <button onClick={() => setActiveExercise(ex)} className="w-10 h-10 bg-[#FCF9F2] rounded-full flex items-center justify-center hover:bg-[#E58C49] hover:text-white transition-colors shadow-sm"><Play size={16} fill="currentColor" className="ml-0.5" /></button>
              </div>
              <p className="text-sm opacity-70 font-medium mb-6 flex-1">{ex.desc}</p>
              <button onClick={() => setShowKnowledge(ex)} className="w-fit font-bold text-sm text-[#7A9B76] underline underline-offset-4 hover:text-[#365C4F] transition-colors">Learn more</button>
            </div>
          </div>
        ))}
      </div>
      <AnimatePresence>
        {showKnowledge && <KnowledgeCardView exercise={showKnowledge} onBack={() => setShowKnowledge(null)} user={user} isDark={isDark} />}
      </AnimatePresence>
    </motion.div>
  );
}

function ExercisePlayer({ exercise, onBack, user, isDark }) {
  const [timeLeft, setTimeLeft] = useState(exercise.duration);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    let timer;
    if (isActive && timeLeft > 0) timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    else if (timeLeft === 0) setIsActive(false);
    return () => clearInterval(timer);
  }, [isActive, timeLeft]);

  const progress = ((exercise.duration - timeLeft) / exercise.duration) * 100;

  return (
    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="min-h-screen flex flex-col items-center justify-center pt-20 relative">
      <button onClick={onBack} className={`absolute top-28 left-12 flex items-center gap-2 font-bold ${isDark ? 'text-white/50' : 'text-[#7A9B76]'} hover:opacity-100 transition-colors z-50`}><ArrowLeft size={20} /> Exit Routine</button>
      <div className={`relative ${isDark ? 'bg-[#1D2B26] text-white border-[#3D6055]' : 'bg-[#FCF9F2] text-[#3D4035] border-white'} rounded-[40px] shadow-2xl border p-12 max-w-lg w-full flex flex-col items-center text-center`}>
        <h2 className="text-3xl font-black mb-2">{exercise.title}</h2>
        <p className="opacity-70 font-bold mb-8 bg-black/5 px-6 py-3 rounded-2xl">Follow Buddy's lead!</p>
        <div className="relative mb-12">
          <svg className="w-64 h-64 -rotate-90 drop-shadow-md">
            <circle cx="128" cy="128" r="110" stroke={isDark ? "#3D6055" : "#E2E8F0"} strokeWidth="12" fill="transparent" />
            <motion.circle cx="128" cy="128" r="110" stroke="#E58C49" strokeWidth="12" fill="transparent" strokeDasharray="691" animate={{ strokeDashoffset: 691 - (691 * progress) / 100 }} transition={{ ease: "linear", duration: 1 }} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center"><PixelMascot skin={user?.mascot} size={140} action={timeLeft > 0 ? exercise.action : 'idle'} /></div>
        </div>
        <div className="text-7xl font-black mb-8">{timeLeft}<span className="text-2xl font-bold opacity-50 ml-1">s</span></div>
        {timeLeft === 0 ? (
          <button onClick={onBack} className="w-full bg-[#7A9B76] text-white py-4 rounded-2xl font-bold text-xl flex items-center justify-center gap-2 shadow-lg"><CheckCircle2 size={24} /> Finish</button>
        ) : (
          <button onClick={() => setIsActive(!isActive)} className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors shadow-sm ${isDark ? 'bg-[#3D6055] hover:bg-[#4E766A]' : 'bg-white text-[#E58C49] hover:bg-slate-50 border border-slate-100'}`}>
            {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
          </button>
        )}
      </div>
    </motion.div>
  );
}

function KnowledgeCardView({ exercise, onBack, user, isDark }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-[360px] h-[500px]">
        <motion.div initial={{ rotate: 0 }} animate={{ rotate: 8 }} className="absolute inset-0 bg-[#E395A4] rounded-[32px] shadow-lg" />
        <motion.div initial={{ rotate: 0 }} animate={{ rotate: 4 }} className="absolute inset-0 bg-[#E58C49] rounded-[32px] shadow-lg" />
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute inset-0 bg-[#FCF9F2] text-[#3D4035] rounded-[32px] p-8 shadow-2xl flex flex-col items-center text-center border-2 border-white">
          <button onClick={onBack} className="absolute top-4 right-4 p-2 opacity-50 hover:opacity-100 transition-opacity"><X size={24} /></button>
          <div className="w-20 h-20 mb-4">{CuteIcons[exercise.icon]}</div>
          <h3 className="text-2xl font-black mb-4">{exercise.title}</h3>
          <div className="bg-black/5 p-4 rounded-2xl mb-auto">
            <p className="font-bold text-sm leading-relaxed"><Info size={16} className="inline mr-1 -mt-1 text-[#7A9B76]"/>{exercise.desc} Practicing this daily helps reset your visual system and significantly reduces eye strain!</p>
          </div>
          <div className="mt-4 relative w-full flex justify-end pr-4"><PixelMascot skin={user?.mascot} size={120} action="teaching" /></div>
        </motion.div>
      </div>
    </div>
  );
}

// ==========================================
// 15. Dashboard Page
// ==========================================
function DashboardPage() {
  const navigate = useNavigate();
  const { user } = React.useContext(UserContext);
  const isDark = user?.theme === 'dark';
  const cardBg = isDark ? 'bg-[#1D2B26] border-[#3D6055] text-white' : 'bg-[#FCF9F2] border-white text-[#3D4035]';
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const dates = Array.from({ length: 29 }, (_, i) => (i + 1).toString().padStart(2, '0'));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pt-32 pb-20 px-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/home')} className={`p-2 rounded-full ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-white hover:bg-slate-50'} transition-colors`}><ArrowLeft size={20}/></button>
          <h2 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-[#3D4035]'}`}>Analytics Overview</h2>
        </div>
        <div className={`flex items-center gap-2 ${cardBg} px-4 py-2 rounded-full font-bold text-sm shadow-sm`}>This Week <ChevronRight size={16}/></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className={`lg:col-span-4 ${cardBg} rounded-[32px] p-6 shadow-sm border`}>
          <div className="flex justify-between items-center mb-6 px-2">
            <div><span className="font-black text-xl">Check-in Streak</span><p className="text-xs font-bold opacity-50 mt-1">Feb 2026</p></div>
            <div className="flex gap-2">
              <div className="w-8 h-8 bg-[#E58C49] text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-[#D47A3A] shadow-md"><ChevronLeft size={16}/></div>
              <div className="w-8 h-8 bg-[#E58C49] text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-[#D47A3A] shadow-md"><ChevronRight size={16}/></div>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-y-6 text-center">
            {days.map(d => <div key={d} className="text-xs font-black opacity-50 tracking-tighter">{d}</div>)}
            {['28','29','30','31','01'].map(d => <div key={d} className="text-sm font-bold opacity-30">{d}</div>)}
            {dates.map((d) => (
              <div key={d} className="relative flex justify-center items-center h-8">
                {d === '05' && <div className="absolute w-10 h-10 bg-[#E58C49] rounded-full -z-10 shadow-[0_0_15px_rgba(229,140,73,0.5)]" />}
                <span className={`text-sm font-bold ${d === '05' ? 'text-white' : ''}`}>{d}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`lg:col-span-5 ${cardBg} rounded-[32px] p-8 shadow-sm border`}>
          <h4 className="font-bold text-lg mb-6">Total Focus Time</h4>
          <div className="h-48 flex items-end justify-between px-4 gap-2 border-b-2 border-black/5 pb-2">
            {[40, 60, 30, 80, 50, 90, 70].map((h, i) => (
              <div key={i} className="flex flex-col items-center gap-1 w-full">
                <div className="flex items-end gap-1 w-full justify-center h-40">
                  <div className="w-1/3 bg-[#E58C49] rounded-t-sm" style={{ height: `${h}%` }} />
                  <div className="w-1/3 bg-[#7A9B76] rounded-t-sm" style={{ height: `${h * 0.4}%` }} />
                </div>
                <span className="text-xs font-bold opacity-50 mt-2">{'SMTWTFS'[i]}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-6 mt-4 justify-center text-sm font-bold opacity-80">
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#E58C49]" /> Focus Time</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#7A9B76]" /> Eye Rest</div>
          </div>
        </div>

        <div className={`lg:col-span-3 ${cardBg} rounded-[32px] p-8 shadow-sm border flex flex-col items-center justify-center text-center`}>
          <h4 className="font-bold text-lg mb-6 self-start">Weekly Goal Achieved</h4>
          <div className="relative w-40 h-40 mb-6">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 drop-shadow-sm">
              <circle cx="50" cy="50" r="35" stroke={isDark ? "#3D6055" : "#E2E8F0"} strokeWidth="15" fill="none" />
              <circle cx="50" cy="50" r="35" stroke="#E58C49" strokeWidth="15" fill="none" strokeDasharray="220" strokeDashoffset="55" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-3xl font-black">75%</div>
          </div>
        </div>

        <div className={`lg:col-span-4 ${cardBg} rounded-[32px] p-8 shadow-sm border flex-1`}>
           <h4 className="font-bold text-lg mb-6 flex items-center gap-2"><History size={20} /> Recent History</h4>
           <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-black/10 before:to-transparent">
             <div className="relative flex items-center justify-between">
               <div className="flex items-center gap-4">
                 <div className="w-5 h-5 rounded-full bg-[#E2F0CB] border-2 border-[#7A9B76] z-10" />
                 <div><p className="font-bold text-sm">20-20-20 Rule</p><p className="text-xs opacity-60">Completed full session</p></div>
               </div>
               <span className="text-xs font-bold opacity-40">2h ago</span>
             </div>
             <div className="relative flex items-center justify-between">
               <div className="flex items-center gap-4">
                 <div className="w-5 h-5 rounded-full bg-[#FFF0E5] border-2 border-[#E58C49] z-10" />
                 <div><p className="font-bold text-sm">Warm Palming</p><p className="text-xs opacity-60">Streak: 3 Days</p></div>
               </div>
               <span className="text-xs font-bold opacity-40">5h ago</span>
             </div>
             <div className="relative flex items-center justify-between">
               <div className="flex items-center gap-4">
                 <div className="w-5 h-5 rounded-full bg-[#FCE1E4] border-2 border-[#E395A4] z-10" />
                 <div><p className="font-bold text-sm">Eye Health Mode</p><p className="text-xs opacity-60">45 mins tracking</p></div>
               </div>
               <span className="text-xs font-bold opacity-40">Yesterday</span>
             </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
}

// ==========================================
// 16. Settings Page
// ==========================================
function SettingsPage() {
    const navigate = useNavigate();
    const { user, setUser } = React.useContext(UserContext);
    const isDark = user?.theme === 'dark';
    const [dnd, setDnd] = useState(false);
    const [notifs, setNotifs] = useState(['banner', 'sound']);
    const toggleNotif = (key) => setNotifs(prev => prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key]);
    const cardBg = isDark ? 'bg-[#1D2B26] border-[#3D6055] text-white' : 'bg-[#FCF9F2] border-white text-[#3D4035]';
    
    // --- Notification demo helpers (Banner + Sound) ---
    const playChime = () => {
    try {
        // Simple "ding" using Web Audio (no mp3 file needed)
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioCtx();
        const o = ctx.createOscillator();
        const g = ctx.createGain();

        o.type = "sine";
        o.frequency.value = 880; // A5
        g.gain.value = 0.0001;

        o.connect(g);
        g.connect(ctx.destination);

        o.start();

        // quick attack + decay
        g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);

        o.stop(ctx.currentTime + 0.27);

        // cleanup
        setTimeout(() => ctx.close?.(), 350);
    } catch (e) {
        console.warn("Sound blocked / unsupported:", e);
    }
    };

    const [banner, setBanner] = useState(null);
    // banner: { title, message, type } or null

    const showBanner = ({ title, message, type = "info" }) => {
    setBanner({ title, message, type });
    // auto-hide after 3.5s
    window.clearTimeout(showBanner._t);
    showBanner._t = window.setTimeout(() => setBanner(null), 3500);
    };

    // Call this whenever you want to send an alert
    const notify = ({ title, message, type = "info" }) => {
    if (dnd) return;

    // Banner Pop-up
    if (notifs.includes("banner")) showBanner({ title, message, type });

    // Sound Chime
    if (notifs.includes("sound")) playChime();
    };

  return (
    
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pt-32 pb-20 px-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-10">
        <button onClick={() => navigate('/home')} className={`p-2 rounded-full ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-white hover:bg-slate-50'} transition-colors`}><ArrowLeft size={20}/></button>
        <h2 className="text-4xl font-black">Preferences</h2>
      </div>
      <div className="space-y-6">
        <section className={`${cardBg} rounded-[40px] p-8 shadow-sm border`}>
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Target className="text-[#7A9B76]" /> AI Calibration</h3>
          <div className="flex items-center justify-between py-4">
            <div><p className="font-bold text-lg">Personal Baseline</p><p className="text-sm opacity-60 font-medium">Recalibrate your natural blink rate and distance.</p></div>
            <button onClick={() => navigate('/calibration')} className="bg-[#7A9B76] text-white px-6 py-3 rounded-2xl font-bold hover:shadow-md hover:bg-[#60805F] transition-all">Recalibrate</button>
          </div>
        </section>

        <section className={`${cardBg} rounded-[40px] p-8 shadow-sm border`}>
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Volume2 className="text-[#E58C49]" /> Notifications & Sound</h3>
          <div className="flex items-center justify-between py-6 border-b border-black/10">
            <div><p className="font-bold text-lg">Do Not Disturb</p><p className="text-sm opacity-60 font-medium">Silence all alerts from Mascot.</p></div>
            <div onClick={() => setDnd(!dnd)} className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors shadow-inner ${dnd ? 'bg-[#7A9B76]' : 'bg-black/20'}`}>
              <motion.div animate={{ x: dnd ? 24 : 0 }} className="w-6 h-6 bg-white rounded-full shadow-md" />
            </div>
          </div>
          <div className="py-6">
            <p className="font-bold text-lg mb-4">Notification Preferences</p>
            <div className="flex flex-col gap-4">
              {[{ label: 'Banner Pop-up', key: 'banner' }, { label: 'Sound Chime', key: 'sound' }, { label: 'Vibration', key: 'vibration' }].map(({ label, key }) => {
                const isChecked = notifs.includes(key);
                return (
                  <label key={key} className="flex items-center gap-4 cursor-pointer group w-fit" onClick={e => { e.preventDefault(); toggleNotif(key); }}>
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${isChecked ? 'bg-[#7A9B76] border-[#7A9B76]' : 'border-black/20 group-hover:border-[#7A9B76]/50'}`}>
                      {isChecked && <CheckCircle2 size={16} className="text-white" />}
                    </div>
                    <span className="font-bold opacity-80 group-hover:opacity-100">{label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </section>

        <section className={`${cardBg} rounded-[40px] p-8 shadow-sm border`}>
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Smartphone className="text-[#E395A4]" /> Appearance</h3>
          <div className="flex items-center justify-between py-4">
            <div><p className="font-bold text-lg">App Theme</p><p className="text-sm opacity-60 font-medium">Toggle Sage Green Dark mode.</p></div>
            <button onClick={() => setUser({ ...user, theme: isDark ? 'light' : 'dark' })} className={`flex items-center gap-2 ${isDark ? 'bg-[#2B423A]' : 'bg-white'} border border-black/10 px-6 py-3 rounded-2xl font-bold hover:shadow-md transition-all`}>
              {isDark ? <Sun size={18} className="text-[#E58C49]" /> : <Moon size={18} className="text-[#7A9B76]" />} {isDark ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </section>
      </div>
    </motion.div>
  );
}

// ==========================================
// 17. Edit Profile Modal
// ==========================================
function EditProfileModal({ user, onClose }) {
  const { setUser } = React.useContext(UserContext);
  const isDark = user?.theme === 'dark';
  const [name, setName] = useState(user?.name || '');
  const [mascot, setMascot] = useState(user?.mascot || 'coder');
  const bgClass = isDark ? 'bg-[#1D2B26] border-[#3D6055] text-white' : 'bg-[#FCF9F2] border-white text-[#3D4035]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className={`${bgClass} rounded-[40px] p-10 max-w-2xl w-full shadow-2xl relative border`}>
        <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full bg-black/5 hover:bg-black/10 transition-colors"><X size={20}/></button>
        <h3 className="text-3xl font-black mb-8 text-center">Edit Profile</h3>
        <div className="mb-6">
          <label className="block text-sm font-bold opacity-60 uppercase tracking-widest mb-2">Display Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className={`w-full ${isDark ? 'bg-black/20 border-[#3D6055]' : 'bg-white border-[#E2E8F0]'} border px-6 py-4 rounded-2xl font-bold focus:outline-none focus:border-[#7A9B76] text-lg`} />
        </div>
        <div className="mb-10">
          <label className="block text-sm font-bold opacity-60 uppercase tracking-widest mb-4">Update Mascot</label>
          <div className="flex overflow-x-auto gap-4 pb-4 px-2 snap-x">
            {MASCOT_KEYS.map((skin) => (
              <div key={skin} onClick={() => setMascot(skin)} className={`snap-center shrink-0 w-32 h-32 rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all border-4 relative ${mascot === skin ? 'border-[#E58C49] shadow-[0_0_20px_rgba(229,140,73,0.3)] bg-[#E58C49]/10' : 'border-transparent hover:border-black/20 bg-black/5'}`}>
                <PixelMascot skin={skin} size={80} />
              </div>
            ))}
          </div>
        </div>
        <button onClick={() => { setUser({ ...user, name, mascot }); onClose(); }} className="w-full bg-[#7A9B76] text-white py-4 rounded-2xl font-bold text-xl hover:bg-[#60805F] shadow-lg">Save Changes</button>
      </motion.div>
    </div>
  );
}

// ==========================================
// 18. Protected Route + App Shell
// ==========================================
function RequireAuth({ children }) {
  const { user } = React.useContext(UserContext);
  const location = useLocation();
  if (!user) return <Navigate to="/" state={{ from: location }} replace />;
  return children;
}

function AppShell({ children }) {
  const { user } = React.useContext(UserContext);
  const location = useLocation();
  const isDark = user?.theme === 'dark';
  const [showEditProfile, setShowEditProfile] = useState(false);
  const noNav = ['/', '/onboarding', '/calibration', '/live'].includes(location.pathname);
  const appBg = isDark ? 'bg-[#2B423A]' : 'bg-[#99C5B5]';
  const textColor = isDark ? 'text-slate-100' : 'text-[#3D4035]';

  const getContainerClass = () => {
    if (location.pathname === '/' || location.pathname === '/login') return 'bg-[#0f926e] text-white';
    if (location.pathname === '/onboarding' || location.pathname === '/calibration') return 'bg-[#FCF9F2] text-[#3D4035]';
    if (location.pathname === '/live') return 'bg-[#111] text-white';
    return `${appBg} ${textColor}`;
  };

  return (
    <div className={`min-h-screen ${getContainerClass()} font-sans overflow-x-hidden transition-colors duration-500`}>
      {user && !noNav && <TopNavigation user={user} onEditProfile={() => setShowEditProfile(true)} />}
      {children}
      <AnimatePresence>
        {showEditProfile && user && <EditProfileModal user={user} onClose={() => setShowEditProfile(false)} />}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// 19. Root App
// ==========================================
export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('eyeguard_user')); } catch { return null; }
  });

  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = MASCOT_STYLES;
    document.head.appendChild(styleSheet);
    return () => styleSheet.remove();
  }, []);

  useEffect(() => {
    if (user) sessionStorage.setItem('eyeguard_user', JSON.stringify(user));
    else sessionStorage.removeItem('eyeguard_user');
  }, [user]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <AppShell>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LandingPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/calibration" element={<CalibrationPage />} />
            <Route path="/home" element={<RequireAuth><HomePage /></RequireAuth>} />
            <Route path="/live" element={<RequireAuth><LivePage /></RequireAuth>} />
            <Route path="/timer" element={<RequireAuth><TimerPage /></RequireAuth>} />
            <Route path="/exercises" element={<RequireAuth><ExercisesPage /></RequireAuth>} />
            <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
            <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </AppShell>
    </UserContext.Provider>
  );
}