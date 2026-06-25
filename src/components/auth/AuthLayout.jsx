import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPublicGameweek } from '../../api/competitions'

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
        <radialGradient id={`rg-${uid}`} cx="35%" cy="28%">
          <stop offset="0%"   stopColor="#ffffff"/>
          <stop offset="55%"  stopColor="#e6e6e6"/>
          <stop offset="100%" stopColor="#aaaaaa"/>
        </radialGradient>
        <clipPath id={`cp-${uid}`}>
          <circle cx="50" cy="50" r="47"/>
        </clipPath>
      </defs>
      <circle cx="50" cy="50" r="47" fill={`url(#rg-${uid})`}/>
      <g clipPath={`url(#cp-${uid})`} fill="#111111">
        <polygon points="50,11 63,21 58,38 42,38 37,21"/>
        <polygon points="37,21 23,17 15,33 25,47 42,38"/>
        <polygon points="63,21 77,17 85,33 75,47 58,38"/>
        <polygon points="25,47 15,61 24,75 40,73 42,56"/>
        <polygon points="75,47 85,61 76,75 60,73 58,56"/>
        <polygon points="40,73 24,75 31,90 50,93 50,78"/>
        <polygon points="60,73 76,75 69,90 50,93 50,78"/>
        <polygon points="42,56 40,73 50,78 60,73 58,56 50,51"/>
      </g>
      <circle cx="50" cy="50" r="47" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="1.5"/>
      <ellipse cx="33" cy="28" rx="9" ry="5" fill="white" opacity="0.52" transform="rotate(-20 33 28)"/>
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
  0%,100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-22px) rotate(180deg); }
}
@keyframes auth-glow {
  0%,100% { opacity: 0.22; transform: scale(1); }
  50% { opacity: 0.55; transform: scale(1.14); }
}
@keyframes auth-fade-up {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
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
@media (min-width: 900px) {
  .auth-hero { display: flex !important; }
  .auth-mobile-logo { display: none !important; }
}
`

const MAX_PICKS    = 6
const TOTAL_ENERGY = 25

// ── Game Preview Modal ─────────────────────────────────────────────────────────

function GamePreviewModal({ onClose, onSignUp, onLogin }) {
  const [picks, setPicks]       = useState({}) // { fixtureId: 'H'|'D'|'A' }
  const [submitted, setSubmitted] = useState(false)

  const pickCount = Object.keys(picks).length
  const energyPerPick = pickCount > 0 ? Math.floor(TOTAL_ENERGY / pickCount) : 0
  const energyUsed    = energyPerPick * pickCount
  const canSubmit     = pickCount === MAX_PICKS

  function togglePick(id, outcome) {
    setPicks(prev => {
      const next = { ...prev }
      if (next[id] === outcome) {
        delete next[id]
      } else if (Object.keys(next).length < MAX_PICKS || next[id]) {
        next[id] = outcome
      }
      return next
    })
  }

  const days = [...new Set(MOCK_FIXTURES.map(f => f.day))]

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.82)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>

      <div style={{
        width: '100%', maxWidth: 560,
        maxHeight: '92dvh',
        background: 'linear-gradient(160deg, #0a0e1a 0%, #070b14 100%)',
        border: '1px solid rgba(124,110,245,0.18)',
        borderRadius: 24,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
        animation: 'modal-in 0.28s cubic-bezier(0.34,1.56,0.64,1) both',
        position: 'relative',
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.02)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{
                  fontSize: 9, letterSpacing: '0.18em', color: '#a78bfa',
                  fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700,
                }}>{MOCK_SPRINT.name}</span>
                <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: 10 }}>·</span>
                <span style={{
                  fontSize: 9, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.3)',
                  fontFamily: "'IBM Plex Mono', monospace",
                }}>{MOCK_SPRINT.week}</span>
              </div>
              <h2 style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 700,
                fontSize: 18, color: '#fff', margin: 0, letterSpacing: '-0.01em',
              }}>Select your 6 picks</h2>
              <p style={{
                fontSize: 11, color: 'rgba(255,255,255,0.25)',
                fontFamily: "'IBM Plex Mono', monospace", margin: '4px 0 0',
              }}>Pick 1 outcome per match — Home win, Draw, or Away win</p>
            </div>
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 99, width: 30, height: 30, cursor: 'pointer',
              color: 'rgba(255,255,255,0.4)', fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>✕</button>
          </div>

          {/* Energy + pick bar */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {/* Pick counter */}
            <div style={{
              display: 'flex', gap: 4,
            }}>
              {Array.from({ length: MAX_PICKS }).map((_, i) => (
                <div key={i} style={{
                  width: 20, height: 20, borderRadius: 6,
                  background: i < pickCount ? 'rgba(124,110,245,0.8)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${i < pickCount ? 'rgba(124,110,245,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, color: i < pickCount ? '#fff' : 'rgba(255,255,255,0.2)',
                  transition: 'all 0.15s',
                  boxShadow: i < pickCount ? '0 0 8px rgba(124,110,245,0.4)' : 'none',
                }}>{i < pickCount ? '✓' : ''}</div>
              ))}
            </div>
            <span style={{
              fontSize: 10, color: 'rgba(255,255,255,0.25)',
              fontFamily: "'IBM Plex Mono', monospace",
            }}>{pickCount}/{MAX_PICKS} picks</span>
            <div style={{ flex: 1 }}/>
            {/* Energy */}
            <div style={{ textAlign: 'right' }}>
              <span style={{
                fontSize: 10, color: '#a78bfa',
                fontFamily: "'IBM Plex Mono', monospace",
              }}>⚡ {energyUsed}/{TOTAL_ENERGY} energy</span>
              {pickCount > 0 && (
                <span style={{
                  fontSize: 9, color: 'rgba(255,255,255,0.2)',
                  fontFamily: "'IBM Plex Mono', monospace",
                  display: 'block',
                }}>{energyPerPick} per pick</span>
              )}
            </div>
          </div>
        </div>

        {/* ── Fixture list ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 16px' }}>
          {days.map(day => (
            <div key={day} style={{ marginBottom: 8 }}>
              <div style={{
                fontSize: 9, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.2)',
                fontFamily: "'IBM Plex Mono', monospace", padding: '10px 8px 6px',
                fontWeight: 700,
              }}>{day}</div>
              {MOCK_FIXTURES.filter(f => f.day === day).map(fix => {
                const sel = picks[fix.id]
                const atMax = pickCount >= MAX_PICKS && !sel
                return (
                  <div key={fix.id} style={{
                    marginBottom: 6,
                    background: sel ? 'rgba(124,110,245,0.07)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${sel ? 'rgba(124,110,245,0.25)' : 'rgba(255,255,255,0.05)'}`,
                    borderRadius: 12,
                    padding: '10px 12px',
                    transition: 'all 0.15s',
                    opacity: atMax ? 0.4 : 1,
                  }}>
                    {/* League row */}
                    <div style={{
                      fontSize: 9, color: 'rgba(255,255,255,0.22)',
                      fontFamily: "'IBM Plex Mono', monospace", marginBottom: 8,
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                      <span>{fix.flag}</span>
                      <span>{fix.league}</span>
                    </div>
                    {/* Match row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {/* Teams */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <span style={{
                            fontSize: 12, fontFamily: "'Syne', sans-serif", fontWeight: 700,
                            color: sel === 'H' ? '#fff' : 'rgba(255,255,255,0.7)', truncate: true,
                          }}>{fix.home}</span>
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: "'IBM Plex Mono', monospace", flexShrink: 0 }}>vs</span>
                          <span style={{
                            fontSize: 12, fontFamily: "'Syne', sans-serif", fontWeight: 700,
                            color: sel === 'A' ? '#fff' : 'rgba(255,255,255,0.7)', textAlign: 'right',
                          }}>{fix.away}</span>
                        </div>
                      </div>
                      {/* Pick buttons */}
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        {[['H', fix.home.split(' ')[0]], ['D', 'X'], ['A', fix.away.split(' ')[0]]].map(([out, label]) => (
                          <button key={out} onClick={() => !atMax && togglePick(fix.id, out)}
                            disabled={atMax && sel !== out}
                            style={{
                              width: 36, height: 28, borderRadius: 7,
                              fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700,
                              cursor: atMax && sel !== out ? 'not-allowed' : 'pointer',
                              transition: 'all 0.12s',
                              border: sel === out
                                ? '1px solid rgba(124,110,245,0.7)'
                                : '1px solid rgba(255,255,255,0.08)',
                              background: sel === out
                                ? 'linear-gradient(135deg, #7c6ef5, #a78bfa)'
                                : 'rgba(255,255,255,0.04)',
                              color: sel === out ? '#fff' : 'rgba(255,255,255,0.4)',
                              boxShadow: sel === out ? '0 0 10px rgba(124,110,245,0.4)' : 'none',
                            }}>{out}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: '14px 20px 20px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(0,0,0,0.3)',
          flexShrink: 0,
        }}>
          {!canSubmit && (
            <p style={{
              textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.25)',
              fontFamily: "'IBM Plex Mono', monospace", marginBottom: 10,
            }}>Select {MAX_PICKS - pickCount} more pick{MAX_PICKS - pickCount !== 1 ? 's' : ''} to continue</p>
          )}
          <button
            onClick={() => canSubmit && setSubmitted(true)}
            disabled={!canSubmit}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 14,
              border: 'none', cursor: canSubmit ? 'pointer' : 'not-allowed',
              fontFamily: "'Syne', sans-serif", fontWeight: 700,
              fontSize: 14, letterSpacing: '0.08em', color: '#fff',
              background: canSubmit
                ? 'linear-gradient(90deg, #7c6ef5 0%, #a78bfa 50%, #7c6ef5 100%)'
                : 'rgba(255,255,255,0.06)',
              backgroundSize: '200% auto',
              animation: canSubmit ? 'auth-shimmer 3s linear infinite' : 'none',
              opacity: canSubmit ? 1 : 0.5,
              boxShadow: canSubmit ? '0 4px 24px rgba(124,110,245,0.35)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {canSubmit ? 'Submit my picks →' : `${MAX_PICKS - pickCount} picks remaining`}
          </button>
        </div>

        {/* ── Auth prompt overlay (after submit) ── */}
        {submitted && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 24,
            background: 'linear-gradient(160deg, rgba(7,5,20,0.97) 0%, rgba(10,8,25,0.97) 100%)',
            backdropFilter: 'blur(4px)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '40px 32px',
            animation: 'auth-slide-up 0.35s cubic-bezier(0.34,1.3,0.64,1) both',
          }}>
            {/* Trophy animation */}
            <div style={{
              width: 72, height: 72, borderRadius: 20,
              background: 'linear-gradient(135deg, rgba(124,110,245,0.2), rgba(167,139,250,0.1))',
              border: '1px solid rgba(124,110,245,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32, marginBottom: 20,
              boxShadow: '0 0 40px rgba(124,110,245,0.2)',
            }}>🏆</div>

            <h2 style={{
              fontFamily: "'Syne', sans-serif", fontWeight: 700,
              fontSize: 22, color: '#fff', textAlign: 'center',
              margin: '0 0 8px', letterSpacing: '-0.02em',
            }}>Your picks are locked in!</h2>
            <p style={{
              fontSize: 12, color: 'rgba(255,255,255,0.35)',
              fontFamily: "'IBM Plex Mono', monospace",
              textAlign: 'center', lineHeight: 1.7, margin: '0 0 8px',
            }}>
              You picked {pickCount} matches with {TOTAL_ENERGY} energy.<br/>
              Create a free account to enter a real league and compete.
            </p>

            {/* Picks summary */}
            <div style={{
              width: '100%', maxWidth: 360, marginBottom: 28,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 14, padding: '12px 16px',
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              {Object.entries(picks).map(([id, out]) => {
                const fix = MOCK_FIXTURES.find(f => f.id === Number(id))
                const label = out === 'H' ? fix.home : out === 'A' ? fix.away : 'Draw'
                const color = out === 'H' ? '#22c55e' : out === 'A' ? '#f59e0b' : '#38bdf8'
                return (
                  <div key={id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontSize: 11,
                  }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'IBM Plex Mono', monospace" }}>
                      {fix.home} vs {fix.away}
                    </span>
                    <span style={{ color, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 10 }}>
                      {label}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* CTA buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320 }}>
              <button onClick={onSignUp} style={{
                padding: '14px 0', borderRadius: 14, border: 'none', cursor: 'pointer',
                fontFamily: "'Syne', sans-serif", fontWeight: 700,
                fontSize: 14, letterSpacing: '0.06em', color: '#fff',
                background: 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)',
                boxShadow: '0 4px 20px rgba(34,197,94,0.3)',
              }}>Create free account →</button>
              <button onClick={onLogin} style={{
                padding: '12px 0', borderRadius: 14, cursor: 'pointer',
                fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600,
                fontSize: 12, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.5)',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>Already have an account? Sign in</button>
            </div>

            <p style={{
              fontSize: 10, color: 'rgba(255,255,255,0.15)',
              fontFamily: "'IBM Plex Mono', monospace", marginTop: 16, textAlign: 'center',
            }}>No credit card required · Free forever</p>
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
    title: 'Pick 6 from 15',
    desc: 'Every week, choose 6 match predictions from 15 of the best fixtures in world football.',
  },
  {
    num: '02', accent: '#a78bfa', icon: '⚡',
    title: 'Manage Your Energy',
    desc: 'You get 25 free energy units each week. Spend them wisely across your 6 predictions.',
  },
  {
    num: '03', accent: '#f59e0b', icon: '🎯',
    title: 'Earn Points & Boosts',
    desc: 'Every correct pick earns points and unlocks boosts. Stack them to dominate the leaderboard.',
  },
  {
    num: '04', accent: '#38bdf8', icon: '🏆',
    title: 'Climb Divisions',
    desc: 'Sprints last 4 weeks. Top performers get promoted — bottom ones are relegated. Reach the top.',
  },
]

// ── Left Hero Panel ────────────────────────────────────────────────────────────

function HeroPanel({ onTryIt }) {
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
          linear-gradient(rgba(124,110,245,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(124,110,245,0.04) 1px, transparent 1px)
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

      {/* Floating ball */}
      <div style={{
        position: 'absolute', top: '4%', right: '8%',
        animation: 'auth-float-a 8s ease-in-out infinite',
        filter: 'drop-shadow(0 0 18px rgba(34,197,94,0.3)) drop-shadow(0 12px 28px rgba(0,0,0,0.8))',
        pointerEvents: 'none',
      }}>
        <Ball uid="h1" size={68}/>
      </div>

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', flexDirection: 'column',
        height: '100%', padding: '40px 50px 40px 52px',
        overflowY: 'auto',
        animation: 'auth-fade-up 0.8s ease both 0.15s',
      }}>
        {/* Brand */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              borderRadius: 8, width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, boxShadow: '0 0 16px rgba(34,197,94,0.4)',
            }}>⚽</div>
            <div>
              <span style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 20, letterSpacing: '0.02em',
                background: 'linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.7) 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>6</span>
              <span style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 20, letterSpacing: '0.02em',
                background: 'linear-gradient(90deg, #22c55e, #a78bfa)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>TO</span>
              <span style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 20, letterSpacing: '0.02em',
                background: 'linear-gradient(90deg, #a78bfa 0%, #fff 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>GLORY</span>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.25)',
              borderRadius: 99, padding: '3px 9px',
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: '50%', background: '#22c55e',
                display: 'block', animation: 'auth-pulse-ring 1.4s ease-out infinite',
                boxShadow: '0 0 6px #22c55e',
              }}/>
              <span style={{
                color: '#22c55e', fontSize: 9, letterSpacing: '0.14em',
                fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600,
              }}>SEASON LIVE</span>
            </div>
          </div>
        </div>

        {/* Headline */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 700,
            fontSize: 'clamp(28px, 3vw, 42px)', lineHeight: 1.05,
            letterSpacing: '-0.03em', margin: '0 0 12px', color: '#fff',
          }}>
            Pick smarter.<br/>
            <span style={{
              background: 'linear-gradient(90deg, #22c55e 0%, #a78bfa 60%, #f59e0b 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Rise through<br/>the ranks.</span>
          </h1>
          <p style={{
            fontSize: 12, color: 'rgba(255,255,255,0.28)',
            lineHeight: 1.75, fontFamily: "'IBM Plex Mono', monospace", margin: 0,
          }}>6 picks. 25 energy. 4 weeks per sprint.<br/>One shot at glory.</p>
        </div>

        {/* HOW TO PLAY */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <span style={{
            fontSize: 9, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.2)',
            fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700,
          }}>HOW TO PLAY</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }}/>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          {STEPS.map(({ num, accent, icon, title, desc }) => (
            <div key={num} style={{
              display: 'flex', gap: 12, alignItems: 'flex-start',
              padding: '12px 14px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderLeft: `2px solid ${accent}`,
              borderRadius: 12,
            }}>
              <div style={{
                flexShrink: 0, width: 32, height: 32, borderRadius: 8,
                background: `${accent}15`, border: `1px solid ${accent}28`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, boxShadow: `0 0 10px ${accent}18`,
              }}>{icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                  <span style={{
                    fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, fontWeight: 700,
                    letterSpacing: '0.14em', color: accent, opacity: 0.7,
                  }}>{num}</span>
                  <span style={{
                    fontFamily: "'Syne', sans-serif", fontWeight: 700,
                    fontSize: 12, color: 'rgba(255,255,255,0.9)',
                  }}>{title}</span>
                </div>
                <p style={{
                  fontSize: 11, color: 'rgba(255,255,255,0.26)',
                  lineHeight: 1.6, fontFamily: "'IBM Plex Mono', monospace", margin: 0,
                }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Current Sprint card + CTA ── */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(124,110,245,0.08) 0%, rgba(34,197,94,0.06) 100%)',
          border: '1px solid rgba(124,110,245,0.2)',
          borderRadius: 16, padding: '16px 18px', marginBottom: 12,
        }}>
          {/* Sprint info row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span style={{
                  fontSize: 9, letterSpacing: '0.14em', color: '#a78bfa',
                  fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700,
                }}>{MOCK_SPRINT.name}</span>
                <span style={{
                  background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)',
                  borderRadius: 99, padding: '1px 7px',
                  fontSize: 8, color: '#22c55e', letterSpacing: '0.1em',
                  fontFamily: "'IBM Plex Mono', monospace",
                }}>ACTIVE</span>
              </div>
              <div style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 700,
                fontSize: 15, color: '#fff',
              }}>{MOCK_SPRINT.week}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 700,
                fontSize: 22, color: '#f59e0b',
                textShadow: '0 0 20px rgba(245,158,11,0.5)',
              }}>{MOCK_SPRINT.daysLeft}</div>
              <div style={{
                fontSize: 8, color: 'rgba(255,255,255,0.25)',
                letterSpacing: '0.12em', fontFamily: "'IBM Plex Mono', monospace",
              }}>DAYS LEFT</div>
            </div>
          </div>

          {/* Mini fixture preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
            {MOCK_FIXTURES.slice(0, 3).map(fix => (
              <div key={fix.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                fontSize: 11, color: 'rgba(255,255,255,0.45)',
                fontFamily: "'IBM Plex Mono', monospace",
                padding: '5px 10px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 8,
              }}>
                <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{fix.home}</span>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>vs</span>
                <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{fix.away}</span>
              </div>
            ))}
            <div style={{
              textAlign: 'center', fontSize: 9,
              color: 'rgba(255,255,255,0.2)', fontFamily: "'IBM Plex Mono', monospace",
              padding: '4px 0',
            }}>+ 12 more fixtures</div>
          </div>

          {/* Try it button */}
          <button onClick={onTryIt} style={{
            width: '100%', padding: '12px 0', borderRadius: 12, border: 'none',
            cursor: 'pointer', fontFamily: "'Syne', sans-serif", fontWeight: 700,
            fontSize: 13, letterSpacing: '0.06em', color: '#fff',
            background: 'linear-gradient(90deg, #7c6ef5 0%, #a78bfa 50%, #7c6ef5 100%)',
            backgroundSize: '200% auto',
            animation: 'auth-shimmer 3s linear infinite',
            boxShadow: '0 4px 20px rgba(124,110,245,0.35)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(124,110,245,0.5)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(124,110,245,0.35)' }}
          >
            ⚡ Try this gameweek →
          </button>
        </div>

        <p style={{
          textAlign: 'center', fontSize: 9, color: 'rgba(255,255,255,0.15)',
          fontFamily: "'IBM Plex Mono', monospace', letterSpacing: '0.08em",
        }}>Demo mode — sign up to play for real</p>
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
  const navigate = useNavigate()

  return (
    <>
      <style>{KEYFRAMES}</style>

      <div style={{ minHeight: '100dvh', display: 'flex', background: '#060a10' }}>
        <HeroPanel onTryIt={() => setShowPreview(true)}/>

        {/* Right panel */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '40px 24px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -100, right: -100, width: 340, height: 340,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}/>
          <div style={{
            position: 'absolute', bottom: -80, left: -80, width: 280, height: 280,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,110,245,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}/>

          <div style={{ width: '100%', maxWidth: 390, animation: 'auth-fade-up 0.6s ease both' }}>
            {/* Mobile-only logo */}
            <div className="auth-mobile-logo" style={{
              textAlign: 'center', marginBottom: 28,
              flexDirection: 'column', alignItems: 'center', gap: 6,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  borderRadius: 7, width: 26, height: 26,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, boxShadow: '0 0 12px rgba(34,197,94,0.4)',
                }}>⚽</div>
                <span style={{
                  fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 20,
                  letterSpacing: '0.04em',
                  background: 'linear-gradient(90deg, #22c55e, #a78bfa, #fff)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>6TOGLORY</span>
              </div>
              <p style={{
                fontSize: 10, color: 'rgba(255,255,255,0.22)',
                letterSpacing: '0.1em', fontFamily: "'IBM Plex Mono', monospace",
              }}>PICK · EARN · CLIMB</p>
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

            <p style={{
              textAlign: 'center', marginTop: 18, fontSize: 10,
              color: 'rgba(255,255,255,0.14)', letterSpacing: '0.08em',
              fontFamily: "'IBM Plex Mono', monospace",
            }}>FREE TO PLAY · NO CREDIT CARD REQUIRED</p>
          </div>
        </div>
      </div>

      {showPreview && (
        <GamePreviewModal
          onClose={() => setShowPreview(false)}
          onSignUp={() => { setShowPreview(false); navigate('/register') }}
          onLogin={() => { setShowPreview(false); navigate('/login') }}
        />
      )}
    </>
  )
}
