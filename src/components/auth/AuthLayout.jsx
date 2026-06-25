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

// ── Football SVG (inline, no copyright) ───────────────────────────────────────

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
        {/* Center-top pentagon */}
        <polygon points="50,11 63,21 58,38 42,38 37,21"/>
        {/* Upper-left */}
        <polygon points="37,21 23,17 15,33 25,47 42,38"/>
        {/* Upper-right */}
        <polygon points="63,21 77,17 85,33 75,47 58,38"/>
        {/* Mid-left */}
        <polygon points="25,47 15,61 24,75 40,73 42,56"/>
        {/* Mid-right */}
        <polygon points="75,47 85,61 76,75 60,73 58,56"/>
        {/* Lower-left */}
        <polygon points="40,73 24,75 31,90 50,93 50,78"/>
        {/* Lower-right */}
        <polygon points="60,73 76,75 69,90 50,93 50,78"/>
        {/* Center hexagon fill */}
        <polygon points="42,56 40,73 50,78 60,73 58,56 50,51"/>
      </g>
      <circle cx="50" cy="50" r="47" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="1.5"/>
      {/* Specular highlight */}
      <ellipse cx="33" cy="28" rx="9" ry="5" fill="white" opacity="0.52" transform="rotate(-20 33 28)"/>
    </svg>
  )
}

// ── Pitch lines (top-down view, semi-transparent) ─────────────────────────────

function Pitch() {
  return (
    <svg
      viewBox="0 0 300 440"
      style={{
        position: 'absolute', bottom: '-20px', left: '50%',
        transform: 'translateX(-50%)',
        width: '82%', height: 'auto', opacity: 0.08,
        pointerEvents: 'none',
      }}
    >
      {/* Outer border */}
      <rect x="8" y="8" width="284" height="424" rx="3" fill="none" stroke="white" strokeWidth="2.5"/>
      {/* Halfway line */}
      <line x1="8" y1="220" x2="292" y2="220" stroke="white" strokeWidth="2"/>
      {/* Center circle */}
      <circle cx="150" cy="220" r="52" fill="none" stroke="white" strokeWidth="2"/>
      {/* Center spot */}
      <circle cx="150" cy="220" r="3.5" fill="white"/>
      {/* Penalty area — top */}
      <rect x="73" y="8" width="154" height="72" rx="2" fill="none" stroke="white" strokeWidth="2"/>
      {/* Goal area — top */}
      <rect x="108" y="8" width="84" height="28" rx="1" fill="none" stroke="white" strokeWidth="2"/>
      {/* Penalty spot — top */}
      <circle cx="150" cy="62" r="3" fill="white"/>
      {/* Penalty arc — top */}
      <path d="M98,80 A55,55 0 0,0 202,80" fill="none" stroke="white" strokeWidth="2"/>
      {/* Penalty area — bottom */}
      <rect x="73" y="360" width="154" height="72" rx="2" fill="none" stroke="white" strokeWidth="2"/>
      {/* Goal area — bottom */}
      <rect x="108" y="404" width="84" height="28" rx="1" fill="none" stroke="white" strokeWidth="2"/>
      {/* Penalty spot — bottom */}
      <circle cx="150" cy="378" r="3" fill="white"/>
      {/* Penalty arc — bottom */}
      <path d="M98,360 A55,55 0 0,1 202,360" fill="none" stroke="white" strokeWidth="2"/>
      {/* Corner arcs */}
      <path d="M8,24 A14,14 0 0,1 22,8"   fill="none" stroke="white" strokeWidth="1.8"/>
      <path d="M278,8 A14,14 0 0,1 292,24" fill="none" stroke="white" strokeWidth="1.8"/>
      <path d="M8,416 A14,14 0 0,0 22,432" fill="none" stroke="white" strokeWidth="1.8"/>
      <path d="M278,432 A14,14 0 0,0 292,416" fill="none" stroke="white" strokeWidth="1.8"/>
    </svg>
  )
}

// ── CSS Animations ─────────────────────────────────────────────────────────────

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

/* Layout breakpoint */
.auth-hero { display: none !important; }
.auth-mobile-logo { display: flex !important; }
@media (min-width: 900px) {
  .auth-hero { display: flex !important; }
  .auth-mobile-logo { display: none !important; }
}
`

const STEPS = [
  {
    num: '01',
    accent: '#22c55e',
    icon: '⚽',
    title: 'Pick 6 from 15',
    desc: 'Every week, choose 6 match predictions from 15 of the best fixtures in world football.',
  },
  {
    num: '02',
    accent: '#a78bfa',
    icon: '⚡',
    title: 'Manage Your Energy',
    desc: 'You get 25 free energy units each week. Spend them wisely across your 6 predictions.',
  },
  {
    num: '03',
    accent: '#f59e0b',
    icon: '🎯',
    title: 'Earn Points & Boosts',
    desc: 'Every correct pick earns points and unlocks boosts. Stack them to dominate the leaderboard.',
  },
  {
    num: '04',
    accent: '#38bdf8',
    icon: '🏆',
    title: 'Climb Divisions',
    desc: 'Sprints last 4 weeks. Top performers get promoted — bottom ones are relegated. Reach the top.',
  },
]

// ── Left Hero Panel ────────────────────────────────────────────────────────────

function HeroPanel() {
  return (
    <div
      className="auth-hero"
      style={{
        flex: '0 0 52%',
        position: 'relative',
        overflow: 'hidden',
        flexDirection: 'column',
        background: 'linear-gradient(160deg, #05080f 0%, #070c14 60%, #040810 100%)',
      }}
    >
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
                fontFamily: "'Syne', sans-serif", fontWeight: 700,
                fontSize: 20, letterSpacing: '0.02em',
                background: 'linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.7) 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>6</span>
              <span style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 700,
                fontSize: 20, letterSpacing: '0.02em',
                background: 'linear-gradient(90deg, #22c55e, #a78bfa)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>TO</span>
              <span style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 700,
                fontSize: 20, letterSpacing: '0.02em',
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
        <div style={{ marginBottom: 36 }}>
          <h1 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 700,
            fontSize: 'clamp(30px, 3.2vw, 46px)', lineHeight: 1.05,
            letterSpacing: '-0.03em', margin: '0 0 12px',
            color: '#fff',
          }}>
            Pick smarter.<br/>
            <span style={{
              background: 'linear-gradient(90deg, #22c55e 0%, #a78bfa 60%, #f59e0b 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Rise through<br/>the ranks.</span>
          </h1>
          <p style={{
            fontSize: 12, color: 'rgba(255,255,255,0.28)',
            lineHeight: 1.75, fontFamily: "'IBM Plex Mono', monospace",
            margin: 0,
          }}>
            6 picks. 25 energy. 4 weeks per sprint.<br/>One shot at glory.
          </p>
        </div>

        {/* HOW TO PLAY label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
          <span style={{
            fontSize: 9, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.2)',
            fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700,
          }}>HOW TO PLAY</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }}/>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 36 }}>
          {STEPS.map(({ num, accent, icon, title, desc }) => (
            <div key={num} style={{
              display: 'flex', gap: 14, alignItems: 'flex-start',
              padding: '14px 16px',
              background: 'rgba(255,255,255,0.02)',
              border: `1px solid rgba(255,255,255,0.05)`,
              borderLeft: `2px solid ${accent}`,
              borderRadius: 12,
              transition: 'background 0.2s',
            }}>
              {/* Icon badge */}
              <div style={{
                flexShrink: 0, width: 34, height: 34,
                borderRadius: 9,
                background: `rgba(${accent === '#22c55e' ? '34,197,94' : accent === '#a78bfa' ? '167,139,250' : accent === '#f59e0b' ? '245,158,11' : '56,189,248'},0.12)`,
                border: `1px solid ${accent}28`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15,
                boxShadow: `0 0 12px ${accent}20`,
              }}>{icon}</div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 8, fontWeight: 700, letterSpacing: '0.14em',
                    color: accent, opacity: 0.7,
                    animation: 'auth-number-glow 3s ease-in-out infinite',
                  }}>{num}</span>
                  <span style={{
                    fontFamily: "'Syne', sans-serif", fontWeight: 700,
                    fontSize: 13, color: 'rgba(255,255,255,0.9)',
                    letterSpacing: '-0.01em',
                  }}>{title}</span>
                </div>
                <p style={{
                  fontSize: 11.5, color: 'rgba(255,255,255,0.28)',
                  lineHeight: 1.65, fontFamily: "'IBM Plex Mono', monospace",
                  margin: 0,
                }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom stat row */}
        <div style={{
          display: 'flex', gap: 0,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 14, overflow: 'hidden',
        }}>
          {[['6', 'PICKS / WEEK', '#22c55e'], ['25', 'ENERGY UNITS', '#a78bfa'], ['4', 'WEEKS / SPRINT', '#f59e0b']].map(([v, l, c], i) => (
            <div key={l} style={{
              flex: 1, padding: '14px 0', textAlign: 'center',
              borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            }}>
              <div style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 700,
                fontSize: 22, color: c, letterSpacing: '-0.02em',
                textShadow: `0 0 20px ${c}60`,
              }}>{v}</div>
              <div style={{
                fontSize: 8, color: 'rgba(255,255,255,0.22)',
                letterSpacing: '0.12em', marginTop: 3,
                fontFamily: "'IBM Plex Mono', monospace",
              }}>{l}</div>
            </div>
          ))}
        </div>
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
  return (
    <>
      <style>{KEYFRAMES}</style>

      <div style={{ minHeight: '100dvh', display: 'flex', background: '#060a10' }}>
        <HeroPanel/>

        {/* Right panel */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '40px 24px', position: 'relative', overflow: 'hidden',
        }}>
          {/* Background orbs */}
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

          <div style={{
            width: '100%', maxWidth: 390,
            animation: 'auth-fade-up 0.6s ease both',
          }}>
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
              }}>
                PICK · EARN · CLIMB
              </p>
            </div>

            {/* Glass card */}
            <div style={{
              background: 'rgba(13, 17, 27, 0.92)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(124,110,245,0.14)',
              borderRadius: 22,
              padding: '32px 28px 26px',
              boxShadow: '0 32px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}>
              <h2 style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 22,
                color: 'rgba(255,255,255,0.92)', marginBottom: 5, letterSpacing: '-0.01em',
              }}>
                {heading}
              </h2>
              <p style={{
                fontSize: 12, color: 'rgba(255,255,255,0.28)',
                marginBottom: 26, letterSpacing: '0.04em',
                fontFamily: "'IBM Plex Mono', monospace",
              }}>
                {subheading}
              </p>

              {children}
            </div>

            {/* Trust line */}
            <p style={{
              textAlign: 'center', marginTop: 18, fontSize: 10,
              color: 'rgba(255,255,255,0.14)', letterSpacing: '0.08em',
              fontFamily: "'IBM Plex Mono', monospace",
            }}>
              TRUSTED BY 12,000+ FANTASY MANAGERS
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
