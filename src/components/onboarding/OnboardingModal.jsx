import { useState, useEffect } from 'react'

export const SLIDES = [
  {
    icon: '⚽',
    accent: '#22c55e',
    title: 'Welcome to OddsRivals',
    body: "A football prediction game where every pick counts. No bets, no luck — just football knowledge, yours against everyone else's.",
    sub: "Let's walk you through how it works.",
  },
  {
    icon: '📅',
    accent: '#a78bfa',
    title: 'A new Gameweek, every Monday',
    body: 'Every Monday, 15 prediction events go live — match winners, goal totals, clean sheets and more, pulled from the biggest games of the week.',
    sub: 'Your job: pick the 6 you trust most before the weekly deadline.',
  },
  {
    icon: '⚡️',
    accent: '#f59e0b',
    title: 'Energy is your pick budget',
    body: 'Each prediction option has an energy cost. Easier, safer calls cost more energy — trickier ones cost less. You start each Gameweek with 25 energy — spend it wisely across your 6 picks.',
    sub: "Run out of energy and you can't add more picks, so choose carefully.",
  },
  {
    icon: '🎯',
    accent: '#38bdf8',
    title: 'Earn League Points',
    body: 'Every correct pick earns you 1 League Point. Nail all 6 in a single Gameweek and you unlock a Perfect Week: 6 points for your picks plus a +4 bonus.',
    sub: "6/6 correct = 10 League Points. That's how you pull ahead.",
  },
  {
    icon: '🏆',
    accent: '#f43f5e',
    title: 'Sprints and Divisions',
    body: 'Each month is a Sprint — 4 or 5 Gameweeks depending on the calendar. Your League Points build up across the Sprint and determine your position on the division leaderboard.',
    sub: "Finish strong enough and you'll be promoted. Fall short and you risk relegation.",
  },
  {
    icon: '👑',
    accent: '#fbbf24',
    title: 'Climb from Academy to Legend',
    body: "Every player starts in Academy. Beat your division targets Sprint after Sprint and you rise — earning badges, unlocking tiers and building a record your mates can't ignore.",
    sub: 'Your football knowledge is on the line. Time to prove it.',
  },
]

const KEYFRAMES = `
@keyframes ob-fade-up {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes ob-shimmer {
  0%   { background-position: 200% center; }
  100% { background-position: -200% center; }
}
@keyframes ob-pulse {
  0%,100% { transform: scale(1); }
  50%      { transform: scale(1.12); }
}
`

function getIsDark() {
  const saved = localStorage.getItem('or-theme')
  if (saved) return saved === 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export default function OnboardingModal({
  onClose,
  onFinish,
  userName = null,
  finalLabel = 'MAKE YOUR PICKS →',
  finalGreen = true,
  dark: darkProp = null,
}) {
  const [slide, setSlide] = useState(0)
  const [isDark, setIsDark] = useState(() => darkProp !== null ? darkProp : getIsDark())

  useEffect(() => {
    if (darkProp !== null) { setIsDark(darkProp); return }
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = e => setIsDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [darkProp])

  const current = SLIDES[slide]
  const isLast  = slide === SLIDES.length - 1
  const isFirst = slide === 0
  const pct     = ((slide + 1) / SLIDES.length) * 100

  const th = isDark ? {
    cardBg:        'rgba(10,13,22,0.97)',
    shadow:        '0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03)',
    closeBg:       'rgba(255,255,255,0.05)',
    closeBorder:   'rgba(255,255,255,0.08)',
    closeColor:    'rgba(255,255,255,0.35)',
    closeHoverBg:  'rgba(255,255,255,0.1)',
    trackBg:       'rgba(255,255,255,0.06)',
    title:         '#fff',
    body:          'rgba(255,255,255,0.52)',
    prevBg:        'rgba(255,255,255,0.04)',
    prevBorder:    'rgba(255,255,255,0.1)',
    prevColor:     'rgba(255,255,255,0.55)',
    prevHoverBg:   'rgba(255,255,255,0.08)',
    prevHoverClr:  '#fff',
    dotInactive:   'rgba(255,255,255,0.12)',
  } : {
    cardBg:        'rgba(255,255,255,0.98)',
    shadow:        '0 40px 100px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
    closeBg:       'rgba(0,0,0,0.05)',
    closeBorder:   'rgba(0,0,0,0.1)',
    closeColor:    'rgba(0,0,0,0.35)',
    closeHoverBg:  'rgba(0,0,0,0.1)',
    closeHoverClr: 'rgba(0,0,0,0.8)',
    trackBg:       'rgba(0,0,0,0.08)',
    title:         '#0f172a',
    body:          'rgba(0,0,0,0.55)',
    prevBg:        'rgba(0,0,0,0.04)',
    prevBorder:    'rgba(0,0,0,0.12)',
    prevColor:     'rgba(0,0,0,0.5)',
    prevHoverBg:   'rgba(0,0,0,0.08)',
    prevHoverClr:  '#0f172a',
    dotInactive:   'rgba(0,0,0,0.12)',
  }

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px 16px',
        }}
      >
        {/* Card */}
        <div
          key={slide}
          style={{
            width: '100%', maxWidth: 480,
            background: th.cardBg,
            backdropFilter: 'blur(24px)',
            border: `1px solid ${current.accent}28`,
            borderRadius: 24,
            padding: '36px 32px 28px',
            boxShadow: `${th.shadow}, 0 0 60px ${current.accent}10`,
            animation: 'ob-fade-up 0.28s cubic-bezier(0.34,1.3,0.64,1) both',
            position: 'relative',
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 16, right: 16,
              background: th.closeBg, border: `1px solid ${th.closeBorder}`,
              borderRadius: 99, width: 30, height: 30, cursor: 'pointer',
              color: th.closeColor, fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = th.closeHoverBg; e.currentTarget.style.color = th.closeHoverClr ?? (isDark ? '#fff' : '#0f172a') }}
            onMouseLeave={e => { e.currentTarget.style.background = th.closeBg; e.currentTarget.style.color = th.closeColor }}
          >✕</button>

          {/* Progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 26 }}>
            <span style={{
              fontSize: 9, letterSpacing: '0.18em', fontFamily: "'IBM Plex Mono', monospace",
              fontWeight: 700, color: current.accent, opacity: 0.8,
            }}>
              {slide + 1} / {SLIDES.length}
            </span>
            <div style={{ flex: 1, height: 3, borderRadius: 99, background: th.trackBg, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 99,
                width: `${pct}%`,
                background: current.accent,
                boxShadow: `0 0 8px ${current.accent}80`,
                transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1), background 0.4s',
              }}/>
            </div>
          </div>

          {/* Icon */}
          <div style={{
            width: 72, height: 72, borderRadius: 18, marginBottom: 22,
            background: `${current.accent}0d`,
            border: `1px solid ${current.accent}25`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 42,
            lineHeight: 1,
            boxShadow: `0 0 28px ${current.accent}30`,
            animation: 'ob-pulse 2.8s ease-in-out infinite',
          }}>
            {current.icon}
          </div>

          {/* Title */}
          <h2 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 24,
            color: th.title, margin: '0 0 14px', lineHeight: 1.15, letterSpacing: '-0.02em',
          }}>
            {slide === 0 && userName
              ? `Welcome, ${userName.split(' ')[0]}.`
              : current.title}
          </h2>

          {/* Body */}
          <p style={{
            fontSize: 14, color: th.body,
            fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.7,
            margin: '0 0 14px',
          }}>
            {current.body}
          </p>

          {/* Sub line */}
          <p style={{
            fontSize: 12, color: current.accent,
            fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.6,
            margin: '0 0 28px', opacity: 0.85,
            borderLeft: `2px solid ${current.accent}50`,
            paddingLeft: 12,
          }}>
            {current.sub}
          </p>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            {/* Previous */}
            <button
              onClick={() => setSlide(s => s - 1)}
              disabled={isFirst}
              style={{
                flex: '0 0 auto', padding: '13px 18px', borderRadius: 12,
                border: `1px solid ${th.prevBorder}`,
                background: th.prevBg,
                cursor: isFirst ? 'not-allowed' : 'pointer',
                color: isFirst ? `${th.prevColor}60` : th.prevColor,
                fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, fontSize: 13,
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { if (!isFirst) { e.currentTarget.style.background = th.prevHoverBg; e.currentTarget.style.color = th.prevHoverClr }}}
              onMouseLeave={e => { e.currentTarget.style.background = th.prevBg; e.currentTarget.style.color = isFirst ? `${th.prevColor}60` : th.prevColor }}
            >← PREV</button>

            {/* Next / Finish */}
            {isLast ? (
              <button
                onClick={onFinish}
                style={{
                  flex: 1, padding: '13px 0', borderRadius: 12, border: 'none',
                  cursor: 'pointer', fontFamily: "'Syne', sans-serif", fontWeight: 700,
                  fontSize: 14, letterSpacing: '0.08em', color: '#fff',
                  background: finalGreen
                    ? 'linear-gradient(90deg, #16a34a 0%, #22c55e 50%, #16a34a 100%)'
                    : `linear-gradient(90deg, ${current.accent}cc 0%, ${current.accent} 50%, ${current.accent}cc 100%)`,
                  backgroundSize: '200% auto', animation: 'ob-shimmer 3s linear infinite',
                  boxShadow: finalGreen ? '0 4px 20px rgba(34,197,94,0.35)' : `0 4px 20px ${current.accent}40`,
                }}
              >
                {finalLabel}
              </button>
            ) : (
              <button
                onClick={() => setSlide(s => s + 1)}
                style={{
                  flex: 1, padding: '13px 0', borderRadius: 12, border: 'none',
                  cursor: 'pointer', fontFamily: "'Syne', sans-serif", fontWeight: 700,
                  fontSize: 14, letterSpacing: '0.08em', color: '#fff',
                  background: `linear-gradient(90deg, ${current.accent}cc 0%, ${current.accent} 50%, ${current.accent}cc 100%)`,
                  backgroundSize: '200% auto', animation: 'ob-shimmer 3s linear infinite',
                  boxShadow: `0 4px 20px ${current.accent}40`,
                }}
              >
                NEXT →
              </button>
            )}
          </div>

          {/* Dot navigation */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 18 }}>
            {SLIDES.map((_, i) => (
              <div
                key={i}
                onClick={() => setSlide(i)}
                style={{
                  width: i === slide ? 18 : 6, height: 6, borderRadius: 99,
                  background: i === slide ? current.accent : th.dotInactive,
                  transition: 'width 0.3s, background 0.3s',
                  boxShadow: i === slide ? `0 0 6px ${current.accent}80` : 'none',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
