import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPublicGameweek } from '../../api/competitions'
import OnboardingModal from '../onboarding/OnboardingModal'
import LegalModal from '../legal/LegalModal'

// ── SVG Icons ─────────────────────────────────────────────────────────────────

export const MailIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2.5"/>
    <path d="M2 7l10 7 10-7"/>
  </svg>
)

export const LockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

export const UserIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

export const EyeIcon = ({ open }) => open ? (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

// ── Football SVG ───────────────────────────────────────────────────────────────

export function Ball({ uid, size = 80 }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ display: 'block' }}>
      <defs>
        {/* 3D sphere gradient — light from top-left */}
        <radialGradient id={`rg-${uid}`} cx="36%" cy="28%" r="65%">
          <stop offset="0%"   stopColor="#ffffff"/>
          <stop offset="45%"  stopColor="#ebebeb"/>
          <stop offset="100%" stopColor="#7a7a7a"/>
        </radialGradient>
        {/* Subtle bottom shadow */}
        <radialGradient id={`sh-${uid}`} cx="50%" cy="85%" r="45%">
          <stop offset="0%"   stopColor="rgba(0,0,0,0.18)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
        </radialGradient>
        <clipPath id={`cp-${uid}`}>
          <circle cx="50" cy="50" r="47"/>
        </clipPath>
      </defs>

      {/* Base sphere */}
      <circle cx="50" cy="50" r="47" fill={`url(#rg-${uid})`}/>

      {/* Black pentagon patches — classic Telstar pattern */}
      <g clipPath={`url(#cp-${uid})`} fill="#111" stroke="#222" strokeWidth="0.4" strokeLinejoin="round">
        {/* Top pentagon */}
        <polygon points="50,8 63,17 58,32 42,32 37,17"/>
        {/* Upper-left pentagon */}
        <polygon points="37,17 21,14 12,29 22,43 37,38"/>
        {/* Upper-right pentagon */}
        <polygon points="63,17 79,14 88,29 78,43 63,38"/>
        {/* Left pentagon */}
        <polygon points="22,43  7,55 13,72 29,76 38,62"/>
        {/* Right pentagon */}
        <polygon points="78,43 93,55 87,72 71,76 62,62"/>
        {/* Lower-left pentagon */}
        <polygon points="29,76 20,90 38,96 50,87 41,72"/>
        {/* Lower-right pentagon */}
        <polygon points="71,76 80,90 62,96 50,87 59,72"/>
        {/* Bottom center pentagon */}
        <polygon points="50,87 41,72 50,64 59,72"/>
        {/* Center hexagon (dark inner edges only — ring of seams) */}
        <polygon points="42,32 37,38 40,53 50,59 60,53 63,38 58,32" fill="none" stroke="#333" strokeWidth="0.8"/>
      </g>

      {/* Bottom shadow overlay */}
      <circle cx="50" cy="50" r="47" fill={`url(#sh-${uid})`}/>

      {/* Sphere outline */}
      <circle cx="50" cy="50" r="47" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="1.2"/>

      {/* Specular highlight */}
      <ellipse cx="34" cy="26" rx="11" ry="6.5" fill="white" opacity="0.55" transform="rotate(-22 34 26)"/>
      <ellipse cx="38" cy="29" rx="5" ry="3" fill="white" opacity="0.3" transform="rotate(-22 38 29)"/>
    </svg>
  )
}

// ── Pitch ──────────────────────────────────────────────────────────────────────

function Pitch() {
  return (
    <svg viewBox="0 0 300 440" style={{
      position: 'absolute', bottom: '-20px', left: '50%',
      transform: 'translateX(-50%)',
      width: '82%', height: 'auto', opacity: 0.08,
      pointerEvents: 'none',
    }}>
      <rect x="8" y="8" width="284" height="424" rx="3" fill="none" stroke="white" strokeWidth="2.5"/>
      <line x1="8" y1="220" x2="292" y2="220" stroke="white" strokeWidth="2"/>
      <circle cx="150" cy="220" r="52" fill="none" stroke="white" strokeWidth="2"/>
      <circle cx="150" cy="220" r="3.5" fill="white"/>
      <rect x="73" y="8" width="154" height="72" rx="2" fill="none" stroke="white" strokeWidth="2"/>
      <rect x="108" y="8" width="84" height="28" rx="1" fill="none" stroke="white" strokeWidth="2"/>
      <circle cx="150" cy="62" r="3" fill="white"/>
      <path d="M98,80 A55,55 0 0,0 202,80" fill="none" stroke="white" strokeWidth="2"/>
      <rect x="73" y="360" width="154" height="72" rx="2" fill="none" stroke="white" strokeWidth="2"/>
      <rect x="108" y="404" width="84" height="28" rx="1" fill="none" stroke="white" strokeWidth="2"/>
      <circle cx="150" cy="378" r="3" fill="white"/>
      <path d="M98,360 A55,55 0 0,1 202,360" fill="none" stroke="white" strokeWidth="2"/>
      <path d="M8,24 A14,14 0 0,1 22,8"   fill="none" stroke="white" strokeWidth="1.8"/>
      <path d="M278,8 A14,14 0 0,1 292,24" fill="none" stroke="white" strokeWidth="1.8"/>
      <path d="M8,416 A14,14 0 0,0 22,432" fill="none" stroke="white" strokeWidth="1.8"/>
      <path d="M278,432 A14,14 0 0,0 292,416" fill="none" stroke="white" strokeWidth="1.8"/>
    </svg>
  )
}

// ── CSS ────────────────────────────────────────────────────────────────────────

const KEYFRAMES = `
@keyframes auth-float-a {
  0%   { transform: translate(0px, 0px) rotate(0deg); }
  25%  { transform: translate(18px, -38px) rotate(90deg); }
  50%  { transform: translate(-12px, -55px) rotate(200deg); }
  75%  { transform: translate(22px, -30px) rotate(300deg); }
  100% { transform: translate(0px, 0px) rotate(360deg); }
}
@keyframes auth-float-b {
  0%   { transform: translate(0px, 0px) rotate(0deg) scale(1); }
  20%  { transform: translate(-22px, -28px) rotate(-20deg) scale(1.06); }
  45%  { transform: translate(16px, -48px) rotate(15deg) scale(0.95); }
  70%  { transform: translate(-10px, -20px) rotate(-10deg) scale(1.03); }
  100% { transform: translate(0px, 0px) rotate(0deg) scale(1); }
}
@keyframes auth-float-c {
  0%   { transform: translate(0px, 0px) rotate(0deg); }
  30%  { transform: translate(24px, -32px) rotate(30deg); }
  60%  { transform: translate(-8px, -50px) rotate(-20deg); }
  100% { transform: translate(0px, 0px) rotate(0deg); }
}
@keyframes auth-float-d {
  0%   { transform: translate(0px, 0px) scale(1); }
  25%  { transform: translate(-14px, -42px) scale(1.12); }
  50%  { transform: translate(20px, -60px) scale(0.92); }
  75%  { transform: translate(-8px, -28px) scale(1.08); }
  100% { transform: translate(0px, 0px) scale(1); }
}
@keyframes auth-float-e {
  0%   { transform: translate(0px, 0px) rotate(0deg); }
  35%  { transform: translate(16px, -36px) rotate(-15deg); }
  65%  { transform: translate(-20px, -52px) rotate(10deg); }
  100% { transform: translate(0px, 0px) rotate(0deg); }
}
@keyframes auth-glow {
  0%,100% { opacity: 0.22; transform: scale(1); }
  50% { opacity: 0.55; transform: scale(1.14); }
}
@keyframes auth-fade-up {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes auth-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes auth-shimmer {
  0%   { background-position: 200% center; }
  100% { background-position: -200% center; }
}
@keyframes auth-scan {
  0%   { transform: translateY(-100%); opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { transform: translateY(100vh); opacity: 0; }
}
@keyframes auth-pulse-ring {
  0%   { transform: scale(0.85); opacity: 0.7; }
  70%  { transform: scale(1.15); opacity: 0; }
  100% { transform: scale(1.15); opacity: 0; }
}
@keyframes auth-number-glow {
  0%,100% { text-shadow: 0 0 12px currentColor; }
  50% { text-shadow: 0 0 28px currentColor, 0 0 60px currentColor; }
}
@keyframes modal-in {
  from { opacity: 0; transform: scale(0.96) translateY(16px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes auth-slide-up {
  from { opacity: 0; transform: translateY(40px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Layout breakpoint */
.auth-hero { display: none !important; }
.auth-mobile-logo { display: flex !important; }
.auth-mobile-steps { display: block !important; }
.auth-right-panel { overflow-x: hidden !important; }
@media (max-width: 899px) {
  .auth-outer { height: auto !important; overflow: visible !important; }
  .auth-inner { overflow: visible !important; height: auto !important; }
  .auth-right-panel { overflow-y: visible !important; height: auto !important; }
}
@media (min-width: 900px) {
  .auth-hero { display: flex !important; }
  .auth-mobile-logo { display: none !important; }
  .auth-mobile-steps { display: none !important; }
  .auth-right-panel { overflow: hidden !important; }
}
`

const MAX_PICKS    = 6

// ── Game Preview Modal ─────────────────────────────────────────────────────────
// picks: { eventId: { optionId, label, energyCost } }

function GamePreviewModal({ onClose, onSignUp, onLogin, gwData }) {
  const [picks, setPicks]         = useState({})
  const [submitted, setSubmitted] = useState(false)

  const TOTAL_ENERGY = gwData?.gameweek?.base_energy ?? 30
  const events     = gwData?.events ?? []
  const pickCount  = Object.keys(picks).length
  const energyUsed = Object.values(picks).reduce((s, p) => s + (p.energyCost ?? 0), 0)
  const energyLeft = TOTAL_ENERGY - energyUsed
  const canSubmit  = pickCount === MAX_PICKS && energyUsed <= TOTAL_ENERGY

  function selectOption(eventId, optionId, label, energyCost) {
    setPicks(prev => {
      const next    = { ...prev }
      const prevCost = next[eventId]?.energyCost ?? 0
      if (next[eventId]?.optionId === optionId) {
        delete next[eventId]
      } else if (next[eventId] || Object.keys(next).length < MAX_PICKS) {
        if ((energyUsed - prevCost + energyCost) <= TOTAL_ENERGY) {
          next[eventId] = { optionId, label, energyCost }
        }
      }
      return next
    })
  }

  function getTeams(ev) {
    const cleanName = (ev.fixture_name || '').replace(/^Who qualifies\?\s*/i, '')
    const parts = cleanName.split(' vs ')
    return { home: parts[0]?.trim() || ev.home_team || '?', away: parts[1]?.trim() || ev.away_team || '?' }
  }

  function sortedOptions(opts, home, away) {
    const KEY_ORDER = { HOME_WIN: 0, HOME_QUALIFIES: 0, DRAW: 1, AWAY_WIN: 2, AWAY_QUALIFIES: 2 }
    const rank = (opt) => {
      if (opt.result_key && KEY_ORDER[opt.result_key] !== undefined) return KEY_ORDER[opt.result_key]
      const lbl = (opt.label || '').toLowerCase()
      if (lbl.includes('draw') || lbl === 'x') return 1
      const h = (home || '').toLowerCase()
      const a = (away || '').toLowerCase()
      const firstWord = (s) => s.split(' ')[0]
      if (h && lbl.includes(firstWord(h))) return 0
      if (a && lbl.includes(firstWord(a))) return 2
      return 3
    }
    return [...opts].sort((a, b) => rank(a) - rank(b))
  }

  // Group events by day
  const days = []
  const dayMap = {}
  for (const ev of events) {
    const d = ev.match_time
      ? new Date(ev.match_time).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()
      : 'TBD'
    if (!dayMap[d]) { dayMap[d] = []; days.push(d) }
    dayMap[d].push(ev)
  }

  const atMax        = pickCount >= MAX_PICKS
  const energyPct    = (energyUsed / TOTAL_ENERGY) * 100
  const energyColor  = energyLeft < 3 ? '#f87171' : energyLeft < 8 ? '#f59e0b' : '#a78bfa'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>

      <div style={{
        width: '100%', maxWidth: 560, maxHeight: '92dvh',
        background: 'linear-gradient(160deg, #0a0e1a 0%, #070b14 100%)',
        border: '1px solid rgba(124,110,245,0.18)', borderRadius: 24,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
        animation: 'modal-in 0.28s cubic-bezier(0.34,1.56,0.64,1) both',
        position: 'relative',
      }}>

        {/* Header */}
        <div style={{
          padding: '18px 20px 14px', flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.02)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 9, letterSpacing: '0.18em', color: '#a78bfa', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>
                  {gwData?.sprint?.name ?? 'Sprint'}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.12)' }}>·</span>
                <span style={{ fontSize: 9, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.3)', fontFamily: "'IBM Plex Mono', monospace" }}>
                  Week {gwData?.gameweek?.sprint_week ?? '—'}
                </span>
                {gwData?.gameweek?.status === 'LOCKED' && (
                  <span style={{ fontSize: 8, color: '#f59e0b', letterSpacing: '0.1em', fontFamily: "'IBM Plex Mono', monospace", background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 99, padding: '1px 7px' }}>LOCKED</span>
                )}
              </div>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 17, color: '#fff', margin: 0 }}>
                Pick 6 outcomes — spend your energy wisely
              </h2>
            </div>
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 99, width: 28, height: 28, cursor: 'pointer',
              color: 'rgba(255,255,255,0.4)', fontSize: 13, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✕</button>
          </div>

          {/* Pick dots + energy bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: MAX_PICKS }).map((_, i) => (
                <div key={i} style={{
                  width: 18, height: 18, borderRadius: 5,
                  background: i < pickCount ? 'rgba(124,110,245,0.85)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${i < pickCount ? 'rgba(124,110,245,0.6)' : 'rgba(255,255,255,0.08)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 8, color: '#fff', transition: 'all 0.15s',
                  boxShadow: i < pickCount ? '0 0 6px rgba(124,110,245,0.4)' : 'none',
                }}>{i < pickCount ? '✓' : ''}</div>
              ))}
            </div>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: "'IBM Plex Mono', monospace", flexShrink: 0 }}>
              {pickCount}/{MAX_PICKS}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 99, background: energyColor,
                  width: `${Math.min(energyPct, 100)}%`, transition: 'width 0.2s, background 0.2s',
                  boxShadow: `0 0 8px ${energyColor}80`,
                }}/>
              </div>
            </div>
            <span style={{ fontSize: 10, color: energyColor, fontFamily: "'IBM Plex Mono', monospace", flexShrink: 0, transition: 'color 0.2s' }}>
              ⚡ {energyLeft} left
            </span>
          </div>
        </div>

        {/* Event list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 14px 14px' }}>
          {events.length === 0 && (
            <p style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.2)', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }}>
              Loading fixtures…
            </p>
          )}
          {days.map(day => (
            <div key={day}>
              <div style={{ fontSize: 9, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.2)', fontFamily: "'IBM Plex Mono', monospace", padding: '10px 6px 5px', fontWeight: 700 }}>
                {day}
              </div>
              {dayMap[day].map(ev => {
                const sel    = picks[ev.id]
                const isSel  = !!sel
                const locked = atMax && !isSel
                const { home, away } = getTeams(ev)
                const opts   = ev.options ?? []
                return (
                  <div key={ev.id} style={{
                    marginBottom: 6,
                    background: isSel ? 'rgba(124,110,245,0.07)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isSel ? 'rgba(124,110,245,0.25)' : 'rgba(255,255,255,0.05)'}`,
                    borderRadius: 14, padding: '12px 14px', transition: 'all 0.15s',
                    opacity: locked ? 0.35 : 1,
                  }}>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)', fontFamily: "'IBM Plex Mono', monospace", marginBottom: 7 }}>
                      {ev.competition || ev.event_type}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      {ev.event_type === 'WHO_QUALIFIES' ? (
                        <>
                          {(ev.home_logo || ev.fixture_home_logo)
                            ? <img src={ev.home_logo || ev.fixture_home_logo} alt="" style={{ width: 18, height: 18, objectFit: 'contain', flexShrink: 0 }} onError={e => { e.target.style.display='none' }}/>
                            : null
                          }
                          <span style={{ flex: 1, fontSize: 12, fontFamily: "'Syne', sans-serif", fontWeight: 700, color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{home}</span>
                          <span style={{ fontSize: 14, flexShrink: 0 }}>💥</span>
                          <span style={{ flex: 1, textAlign: 'right', fontSize: 12, fontFamily: "'Syne', sans-serif", fontWeight: 700, color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{away}</span>
                          {(ev.away_logo || ev.fixture_away_logo)
                            ? <img src={ev.away_logo || ev.fixture_away_logo} alt="" style={{ width: 18, height: 18, objectFit: 'contain', flexShrink: 0 }} onError={e => { e.target.style.display='none' }}/>
                            : null
                          }
                        </>
                      ) : (
                        <>
                          {(ev.home_logo || ev.fixture_home_logo) && (
                            <img src={ev.home_logo || ev.fixture_home_logo} alt="" style={{ width: 18, height: 18, objectFit: 'contain', flexShrink: 0 }} onError={e => { e.target.style.display='none' }}/>
                          )}
                          <span style={{ flex: 1, fontSize: 12, fontFamily: "'Syne', sans-serif", fontWeight: 700, color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{home}</span>
                          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontFamily: "'IBM Plex Mono', monospace", flexShrink: 0 }}>vs</span>
                          <span style={{ flex: 1, textAlign: 'right', fontSize: 12, fontFamily: "'Syne', sans-serif", fontWeight: 700, color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{away}</span>
                          {(ev.away_logo || ev.fixture_away_logo) && (
                            <img src={ev.away_logo || ev.fixture_away_logo} alt="" style={{ width: 18, height: 18, objectFit: 'contain', flexShrink: 0 }} onError={e => { e.target.style.display='none' }}/>
                          )}
                        </>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {sortedOptions(opts, home, away).map(opt => {
                        const isOptSel    = sel?.optionId === opt.id
                        const prevCost    = sel?.energyCost ?? 0
                        const wouldExceed = !isOptSel && (energyUsed - prevCost + opt.energy_cost) > TOTAL_ENERGY
                        const btnDisabled = locked || (!isOptSel && wouldExceed)
                        return (
                          <button key={opt.id}
                            onClick={() => !btnDisabled && selectOption(ev.id, opt.id, opt.label, opt.energy_cost)}
                            style={{
                              flex: 1, padding: '11px 6px 10px', borderRadius: 10,
                              cursor: btnDisabled ? 'not-allowed' : 'pointer',
                              transition: 'all 0.12s', opacity: btnDisabled ? 0.28 : 1,
                              border: isOptSel ? '1.5px solid rgba(124,110,245,0.8)' : '1px solid rgba(255,255,255,0.1)',
                              background: isOptSel ? 'linear-gradient(135deg, #7c6ef5, #a78bfa)' : 'rgba(255,255,255,0.05)',
                              boxShadow: isOptSel ? '0 0 14px rgba(124,110,245,0.45)' : 'none',
                              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                            }}>
                            <span style={{ fontSize: 13, fontFamily: "'Syne', sans-serif", fontWeight: 700, color: isOptSel ? '#fff' : 'rgba(255,255,255,0.7)', lineHeight: 1.2, textAlign: 'center' }}>
                              {opt.label}
                            </span>
                            <span style={{
                              fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600,
                              color: isOptSel ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)',
                              background: isOptSel ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
                              borderRadius: 99, padding: '2px 7px',
                            }}>
                              ⚡{opt.energy_cost}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 18px 18px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)', flexShrink: 0 }}>
          {pickCount < MAX_PICKS && (
            <p style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: "'IBM Plex Mono', monospace", marginBottom: 8 }}>
              Select {MAX_PICKS - pickCount} more pick{MAX_PICKS - pickCount !== 1 ? 's' : ''} to continue
            </p>
          )}
          <button onClick={() => canSubmit && setSubmitted(true)} disabled={!canSubmit} style={{
            width: '100%', padding: '13px 0', borderRadius: 14, border: 'none',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: '0.08em', color: '#fff',
            background: canSubmit ? 'linear-gradient(90deg, #7c6ef5 0%, #a78bfa 50%, #7c6ef5 100%)' : 'rgba(255,255,255,0.06)',
            backgroundSize: '200% auto', animation: canSubmit ? 'auth-shimmer 3s linear infinite' : 'none',
            opacity: canSubmit ? 1 : 0.5, boxShadow: canSubmit ? '0 4px 24px rgba(124,110,245,0.35)' : 'none',
            transition: 'opacity 0.2s, box-shadow 0.2s',
          }}>
            {canSubmit ? `Submit ${MAX_PICKS} picks · ⚡${energyUsed} used →` : `${MAX_PICKS - pickCount} picks remaining`}
          </button>
        </div>

        {/* Auth overlay after submit */}
        {submitted && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 24,
            background: 'linear-gradient(160deg, rgba(7,5,20,0.97) 0%, rgba(10,8,25,0.97) 100%)',
            backdropFilter: 'blur(4px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '32px 28px', animation: 'auth-slide-up 0.35s cubic-bezier(0.34,1.3,0.64,1) both',
          }}>
            <div style={{
              width: 68, height: 68, borderRadius: 18,
              background: 'linear-gradient(135deg, rgba(124,110,245,0.2), rgba(167,139,250,0.1))',
              border: '1px solid rgba(124,110,245,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 30, marginBottom: 18, boxShadow: '0 0 40px rgba(124,110,245,0.2)',
            }}>🏆</div>

            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 20, color: '#fff', textAlign: 'center', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
              Your picks are ready!
            </h2>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'IBM Plex Mono', monospace", textAlign: 'center', lineHeight: 1.7, margin: '0 0 16px' }}>
              {pickCount} picks · ⚡{energyUsed} energy spent<br/>
              Sign up to compete for real and track your results.
            </p>

            <div style={{ width: '100%', maxWidth: 360, marginBottom: 20, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 160, overflowY: 'auto' }}>
              {Object.entries(picks).map(([evId, pick]) => {
                const ev = events.find(e => e.id === evId)
                if (!ev) return null
                const { home, away } = getTeams(ev)
                return (
                  <div key={evId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: "'IBM Plex Mono', monospace", flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {home} vs {away}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                      <span style={{ fontSize: 9, color: '#a78bfa', fontFamily: "'IBM Plex Mono', monospace" }}>⚡{pick.energyCost}</span>
                      <span style={{ fontSize: 10, color: '#22c55e', fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>{pick.label}</span>
                    </span>
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, width: '100%', maxWidth: 320 }}>
              <button onClick={onSignUp} style={{
                padding: '13px 0', borderRadius: 13, border: 'none', cursor: 'pointer',
                fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: '0.06em', color: '#fff',
                background: 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)',
                boxShadow: '0 4px 20px rgba(34,197,94,0.3)',
              }}>Create free account →</button>
              <button onClick={onLogin} style={{
                padding: '11px 0', borderRadius: 13, cursor: 'pointer',
                fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, fontSize: 12, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.45)',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              }}>Already have an account? Sign in</button>
            </div>
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.12)', fontFamily: "'IBM Plex Mono', monospace", marginTop: 14, textAlign: 'center' }}>
              No credit card · Free forever
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── How-to steps ───────────────────────────────────────────────────────────────

const STEPS = [
  {
    num: '01', accent: '#22c55e', icon: '⚽',
    title: '15 events. Your 6 picks.',
    desc: '15 prediction events every Monday — pick your 6 before the weekly deadline.',
  },
  {
    num: '02', accent: '#a78bfa', icon: '🎯',
    title: 'Prove you know football.',
    desc: '1 League Point per correct pick. Nail all 6 and earn a Perfect Week (+4 bonus).',
  },
  {
    num: '03', accent: '#f59e0b', icon: '📅',
    title: 'Monthly Sprints',
    desc: 'Each calendar month is a Sprint — your League Points decide promotion or relegation.',
  },
  {
    num: '04', accent: '#38bdf8', icon: '🏆',
    title: 'Climb the divisions. Build your legacy.',
    desc: 'Rise from Academy to Hall of Legends Sprint by Sprint — earn badges for Perfect Weeks, promotions and accuracy.',
  },
  {
    num: '05', accent: '#facc15', icon: '⚡',
    title: 'Spend your energy wisely.',
    desc: 'Each week you get 30⚡ to spread across your 6 picks. Riskier outcomes cost more — manage your energy to maximise your score.',
  },
]

// ── Left Hero Panel ────────────────────────────────────────────────────────────

function HeroPanel({ onTryIt, gwData, onHowItWorks }) {
  return (
    <div className="auth-hero" style={{
      flex: '0 0 52%',
      position: 'relative',
      overflow: 'hidden',
      flexDirection: 'column',
      background: 'linear-gradient(160deg, #05080f 0%, #070c14 60%, #040810 100%)',
    }}>

      {/* Grid texture */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(rgba(124,110,245,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(124,110,245,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }}/>

      {/* Scan line */}
      <div style={{
        position: 'absolute', left: 0, right: 0, height: 2, zIndex: 1,
        background: 'linear-gradient(90deg, transparent, rgba(34,197,94,0.4), transparent)',
        animation: 'auth-scan 6s linear infinite',
        pointerEvents: 'none',
      }}/>

      {/* Glow orbs */}
      <div style={{
        position: 'absolute', top: '5%', left: '20%',
        width: 320, height: 320, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 65%)',
        animation: 'auth-glow 5s ease-in-out infinite',
        pointerEvents: 'none',
      }}/>
      <div style={{
        position: 'absolute', bottom: '8%', right: '5%',
        width: 260, height: 260, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,110,245,0.14) 0%, transparent 65%)',
        animation: 'auth-glow 4s ease-in-out infinite 1.8s',
        pointerEvents: 'none',
      }}/>

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', flexDirection: 'column',
        height: '100%', padding: '32px 48px 28px 52px',
        overflowY: 'auto',
        animation: 'auth-fade-up 0.8s ease both 0.15s',
      }}>
        {/* Brand — logo top-left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <img
            src="/images/logo.png"
            alt="OddsRivals"
            style={{
              height: 52, width: 52, flexShrink: 0,
              borderRadius: 12, objectFit: 'cover',
              filter: 'drop-shadow(0 0 10px rgba(34,197,94,0.4)) drop-shadow(0 0 20px rgba(124,110,245,0.2))',
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{
              fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 20,
              letterSpacing: '0.04em', lineHeight: 1,
              background: 'linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.75) 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>ODDS RIVALS</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 99, padding: '2px 8px', alignSelf: 'flex-start' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'block', animation: 'auth-pulse-ring 1.4s ease-out infinite', boxShadow: '0 0 6px #22c55e' }}/>
            <span style={{ color: '#22c55e', fontSize: 9, letterSpacing: '0.14em', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>{gwData?.sprint?.name ?? 'SEASON LIVE'}</span>
          </div>
          </div>
        </div>

        {/* Headline */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 700,
            fontSize: 'clamp(36px, 4vw, 56px)', lineHeight: 1.05,
            letterSpacing: '-0.03em', margin: '0 0 14px', color: '#fff',
          }}>
            Pick smarter.{' '}
            <span style={{ background: 'linear-gradient(90deg, #22c55e 0%, #a78bfa 60%, #f59e0b 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Rise through the ranks.
            </span>
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', fontFamily: "'IBM Plex Mono', monospace", margin: 0, lineHeight: 1.6 }}>
            A football prediction game where every pick counts. Choose 6 events each week, beat your mates and climb from Academy to Legend.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {STEPS.map(({ num, accent, icon, title, desc }) => (
            <div key={num} style={{
              display: 'flex', gap: 14, alignItems: 'flex-start',
              padding: '14px 16px',
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderLeft: `3px solid ${accent}`,
              borderRadius: 12,
            }}>
              <div style={{
                flexShrink: 0, width: 36, height: 36, borderRadius: 9,
                background: `${accent}18`, border: `1px solid ${accent}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 17, boxShadow: `0 0 10px ${accent}20`,
              }}>{icon}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: accent, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, letterSpacing: '0.12em', opacity: 0.85 }}>{num}</span>
                  <span style={{ fontSize: 22, fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#fff', lineHeight: 1.15 }}>{title}</span>
                </div>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.5, margin: 0 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* How it works button */}
        <button onClick={onHowItWorks} style={{
          alignSelf: 'flex-start',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 99, padding: '8px 18px', cursor: 'pointer',
          fontSize: 11, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.45)',
          fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 7,
          transition: 'background 0.2s, color 0.2s, border-color 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
        >
          <span style={{ fontSize: 13 }}>📖</span> HOW IT WORKS
        </button>

      </div>

      {/* Right edge fade */}
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: 70,
        background: 'linear-gradient(to right, transparent, rgba(5,8,15,0.9))',
        pointerEvents: 'none', zIndex: 3,
      }}/>
    </div>
  )
}

// ── Main AuthLayout export ─────────────────────────────────────────────────────

export default function AuthLayout({ heading, subheading, children }) {
  const [showPreview, setShowPreview] = useState(false)
  const [showGuide, setShowGuide]     = useState(false)
  const [legalModal, setLegalModal]   = useState(null) // 'privacy' | 'terms' | 'cookies'
  const [gwData, setGwData]           = useState(null)
  const navigate = useNavigate()
  const privacyRef  = useRef(null)
  const termsRef    = useRef(null)
  const cookiesRef  = useRef(null)

  useEffect(() => {
    function fetchGw() {
      getPublicGameweek()
        .then(r => r.data && setGwData(r.data))
        .catch(() => {})
    }
    fetchGw()
    // Refresh every 30 minutes in case the gameweek rolls over
    const interval = setInterval(fetchGw, 30 * 60 * 1000)
    // Also refresh when the user comes back to the tab
    const onVisible = () => { if (document.visibilityState === 'visible') fetchGw() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return (
    <>
      <style>{KEYFRAMES}</style>

      <div className="auth-outer" style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#060a10', overflow: 'hidden' }}>
      <div className="auth-inner" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <HeroPanel onTryIt={() => setShowPreview(true)} gwData={gwData} onHowItWorks={() => setShowGuide(true)}/>

        {/* Right panel */}
        <div className="auth-right-panel" style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'flex-start',
          padding: '60px 24px 40px', position: 'relative', overflowY: 'auto',
        }}>
          <div style={{
            position: 'absolute', top: 0, right: 0, width: 260, height: 260,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)',
            pointerEvents: 'none', transform: 'translate(50%, -50%)',
          }}/>
          <div style={{
            position: 'absolute', bottom: 0, left: 0, width: 220, height: 220,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,110,245,0.08) 0%, transparent 70%)',
            pointerEvents: 'none', transform: 'translate(-50%, 50%)',
          }}/>

          <div style={{ width: '100%', maxWidth: 390, animation: 'auth-fade-in 0.5s ease both' }}>
            {/* Mobile-only logo */}
            {/* Mobile logo + name */}
            <div className="auth-mobile-logo" style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
              marginBottom: 20,
            }}>
              <img
                src="/images/logo.png"
                alt="OddsRivals"
                style={{
                  height: 52, width: 52,
                  borderRadius: 12, objectFit: 'cover',
                  filter: 'drop-shadow(0 0 10px rgba(34,197,94,0.4)) drop-shadow(0 0 20px rgba(124,110,245,0.2))',
                }}
              />
              <span style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 20,
                letterSpacing: '0.04em', lineHeight: 1,
                background: 'linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.75) 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>ODDS RIVALS</span>
            </div>

            {/* Mobile hero text */}
            <div className="auth-mobile-logo" style={{
              flexDirection: 'column', alignItems: 'flex-start', gap: 8,
              marginBottom: 24,
            }}>
              <h1 style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 700,
                fontSize: 28, lineHeight: 1.1,
                letterSpacing: '-0.02em', margin: 0, color: '#fff',
              }}>
                Pick smarter.{' '}
                <span style={{ background: 'linear-gradient(90deg, #22c55e 0%, #a78bfa 60%, #f59e0b 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Rise through the ranks.
                </span>
              </h1>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontFamily: "'IBM Plex Mono', monospace", margin: 0, lineHeight: 1.6 }}>
                A football prediction game where every pick counts. Choose 6 events each week, beat your mates and climb from Academy to Legend.
              </p>
            </div>

            {/* Glass card */}
            <div style={{
              background: 'rgba(13,17,27,0.92)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(124,110,245,0.14)',
              borderRadius: 22,
              padding: '32px 28px 26px',
              boxShadow: '0 32px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}>
              <h2 style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 22,
                color: 'rgba(255,255,255,0.92)', marginBottom: 5, letterSpacing: '-0.01em',
              }}>{heading}</h2>
              <p style={{
                fontSize: 12, color: 'rgba(255,255,255,0.28)',
                marginBottom: 26, letterSpacing: '0.04em',
                fontFamily: "'IBM Plex Mono', monospace",
              }}>{subheading}</p>
              {children}
            </div>

            {/* ── Make your picks CTA — always visible below the auth card ── */}
            <div style={{ marginTop: 16 }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(124,110,245,0.08) 0%, rgba(34,197,94,0.06) 100%)',
                border: '1px solid rgba(124,110,245,0.2)',
                borderRadius: 16, padding: '14px 16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, minHeight: 20, opacity: gwData ? 1 : 0, transition: 'opacity 0.3s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 9, letterSpacing: '0.14em', color: '#a78bfa', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>
                      {gwData?.sprint?.name}
                    </span>
                    <span style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 99, padding: '1px 7px', fontSize: 8, color: '#22c55e', letterSpacing: '0.1em', fontFamily: "'IBM Plex Mono', monospace" }}>
                      LIVE
                    </span>
                  </div>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: "'IBM Plex Mono', monospace" }}>
                    GW{gwData?.gameweek?.sprint_week} · 15 events
                  </span>
                </div>
                <button
                  onClick={() => setShowPreview(true)}
                  style={{
                    width: '100%', padding: '13px 0', borderRadius: 12, border: 'none',
                    cursor: 'pointer', fontFamily: "'Syne', sans-serif", fontWeight: 700,
                    fontSize: 14, letterSpacing: '0.08em', color: '#fff',
                    background: 'linear-gradient(90deg, #16a34a 0%, #22c55e 50%, #16a34a 100%)',
                    backgroundSize: '200% auto', animation: 'auth-shimmer 3s linear infinite',
                    boxShadow: '0 4px 20px rgba(34,197,94,0.35)',
                  }}
                >
                  MAKE YOUR PICKS →
                </button>
              </div>
              <p style={{
                textAlign: 'center', marginTop: 10, fontSize: 10,
                color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em',
                fontFamily: "'IBM Plex Mono', monospace",
              }}>FREE TO PLAY · NO CARD REQUIRED TO START</p>
            </div>

            {/* ── Mobile-only: How to play ── */}
            <div className="auth-mobile-steps" style={{ marginTop: 40 }}>

              {/* How it works button — mobile */}
              <button onClick={() => setShowGuide(true)} style={{
                width: '100%', marginBottom: 20,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12, padding: '12px 0', cursor: 'pointer',
                fontSize: 12, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)',
                fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 14 }}>📖</span> HOW IT WORKS
              </button>

              {/* Steps */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 40 }}>
                {STEPS.map(({ num, accent, icon, title, desc }) => (
                  <div key={num} style={{
                    display: 'flex', gap: 14, alignItems: 'flex-start',
                    padding: '14px 16px',
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderLeft: `3px solid ${accent}`,
                    borderRadius: 12,
                  }}>
                    <div style={{
                      flexShrink: 0, width: 36, height: 36, borderRadius: 9,
                      background: `${accent}18`, border: `1px solid ${accent}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 17, boxShadow: `0 0 10px ${accent}20`,
                    }}>{icon}</div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 11, color: accent, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, letterSpacing: '0.12em', opacity: 0.85 }}>{num}</span>
                        <span style={{ fontSize: 22, fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#fff', lineHeight: 1.15 }}>{title}</span>
                      </div>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.5, margin: 0 }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
            {/* end mobile steps */}

          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(0,0,0,0.3)',
        padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 24, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.18)', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.1em' }}>
          © {new Date().getFullYear()} ODDS RIVALS
        </span>
        {[
          { label: 'PRIVACY POLICY',     type: 'privacy',  ref: privacyRef },
          { label: 'TERMS OF USE',       type: 'terms',    ref: termsRef },
          { label: 'COOKIE SETTINGS',    type: 'cookies',  ref: cookiesRef },
        ].map(({ label, type, ref }) => (
          <button
            key={type}
            ref={ref}
            onClick={() => setLegalModal(type)}
            style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              fontSize: 9, color: 'rgba(255,255,255,0.3)',
              fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.08em',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.65)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
          >{label}</button>
        ))}
      </div>
      </div>

      {showPreview && (
        <GamePreviewModal
          gwData={gwData}
          onClose={() => setShowPreview(false)}
          onSignUp={() => { setShowPreview(false); navigate('/register') }}
          onLogin={() => { setShowPreview(false); navigate('/login') }}
        />
      )}

      {showGuide && (
        <OnboardingModal
          onClose={() => setShowGuide(false)}
          onFinish={() => { setShowGuide(false); navigate('/register') }}
          finalLabel="GET STARTED →"
          finalGreen
        />
      )}

      {legalModal && (
        <LegalModal
          type={legalModal}
          onClose={() => setLegalModal(null)}
          triggerRef={
            legalModal === 'privacy' ? privacyRef :
            legalModal === 'terms'   ? termsRef   : cookiesRef
          }
        />
      )}
    </>
  )
}
