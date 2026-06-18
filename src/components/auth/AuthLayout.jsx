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
  50% { transform: translateY(-26px) rotate(180deg); }
}
@keyframes auth-float-b {
  0%,100% { transform: translateY(0px) rotate(20deg); }
  50% { transform: translateY(-18px) rotate(210deg); }
}
@keyframes auth-float-c {
  0%,100% { transform: translateY(0px) rotate(-10deg); }
  40% { transform: translateY(-34px) rotate(115deg); }
}
@keyframes auth-glow {
  0%,100% { opacity: 0.18; transform: scale(1); }
  50% { opacity: 0.42; transform: scale(1.12); }
}
@keyframes auth-fade-up {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes auth-shimmer {
  0%   { background-position: 200% center; }
  100% { background-position: -200% center; }
}

/* Layout breakpoint */
.auth-hero { display: none !important; }
.auth-mobile-logo { display: flex !important; }
@media (min-width: 900px) {
  .auth-hero { display: flex !important; }
  .auth-mobile-logo { display: none !important; }
}
`

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
        background: 'linear-gradient(165deg, #071a0d 0%, #041009 45%, #050912 100%)',
      }}
    >
      <Pitch/>

      {/* Glow orbs */}
      <div style={{
        position: 'absolute', top: '16%', left: '18%',
        width: 360, height: 360, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(34,197,94,0.18) 0%, transparent 68%)',
        animation: 'auth-glow 5s ease-in-out infinite',
        pointerEvents: 'none',
      }}/>
      <div style={{
        position: 'absolute', bottom: '22%', right: '10%',
        width: 220, height: 220, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,110,245,0.24) 0%, transparent 68%)',
        animation: 'auth-glow 4s ease-in-out infinite 1.6s',
        pointerEvents: 'none',
      }}/>

      {/* Floating balls */}
      <div style={{
        position: 'absolute', top: '9%', right: '12%',
        animation: 'auth-float-a 7s ease-in-out infinite',
        filter: 'drop-shadow(0 14px 32px rgba(0,0,0,0.75))',
      }}>
        <Ball uid="h1" size={105}/>
      </div>
      <div style={{
        position: 'absolute', top: '46%', left: '6%',
        animation: 'auth-float-b 9s ease-in-out infinite 1s',
        filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.65))',
      }}>
        <Ball uid="h2" size={60}/>
      </div>
      <div style={{
        position: 'absolute', bottom: '30%', right: '7%',
        animation: 'auth-float-c 11s ease-in-out infinite 2.2s',
        filter: 'drop-shadow(0 5px 14px rgba(0,0,0,0.55))',
      }}>
        <Ball uid="h3" size={38}/>
      </div>

      {/* Bottom content */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '0 52px 52px',
        background: 'linear-gradient(to top, rgba(4,9,8,0.97) 0%, rgba(4,9,8,0.68) 55%, transparent 100%)',
        animation: 'auth-fade-up 0.9s ease both 0.2s',
      }}>
        {/* Live badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(34,197,94,0.1)',
          border: '1px solid rgba(34,197,94,0.22)',
          borderRadius: 99, padding: '5px 14px', marginBottom: 22,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: '#22c55e',
            display: 'block', boxShadow: '0 0 6px #22c55e',
          }}/>
          <span style={{
            color: '#22c55e', fontSize: 10, letterSpacing: '0.12em',
            fontFamily: "'IBM Plex Mono', monospace",
          }}>
            SEASON 2025/26 ACTIVE
          </span>
        </div>

        <h1 style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 700,
          fontSize: 'clamp(46px, 4.5vw, 62px)', lineHeight: 0.95,
          letterSpacing: '-0.02em', color: 'rgba(255,255,255,0.92)',
          marginBottom: 16,
        }}>
          PRIZE<br/>PICKS
        </h1>
        <p style={{
          fontSize: 14, color: 'rgba(255,255,255,0.35)',
          letterSpacing: '0.04em', marginBottom: 38, lineHeight: 1.65,
          fontFamily: "'IBM Plex Mono', monospace",
        }}>
          Pick your outcomes. Beat your rivals.<br/>Earn energy. Win the league.
        </p>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 40 }}>
          {[['12K+', 'LEAGUES'], ['89K+', 'PICKS'], ['3.2K+', 'PLAYERS']].map(([v, l]) => (
            <div key={l}>
              <div style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 700,
                fontSize: 24, color: '#fff', letterSpacing: '-0.01em',
              }}>{v}</div>
              <div style={{
                fontSize: 9, color: 'rgba(255,255,255,0.26)',
                letterSpacing: '0.1em', marginTop: 3,
                fontFamily: "'IBM Plex Mono', monospace",
              }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right fade edge */}
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: 90,
        background: 'linear-gradient(to right, transparent, rgba(6,10,16,0.85))',
        pointerEvents: 'none',
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
              flexDirection: 'column', alignItems: 'center', gap: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Ball uid="mob" size={30}/>
                <span style={{
                  fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 22,
                  letterSpacing: '0.12em',
                  background: 'linear-gradient(135deg, #7c6ef5 0%, #a78bfa 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>PRIZEPICKS</span>
              </div>
              <p style={{
                fontSize: 11, color: 'rgba(255,255,255,0.28)',
                letterSpacing: '0.06em', fontFamily: "'IBM Plex Mono', monospace",
              }}>
                Football fantasy leagues
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
