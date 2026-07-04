import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { markPopupSeen } from '../api/glory'
import SprintPicksModal from './SprintPicksModal'

const OUTCOME_CFG = {
  promoted: {
    bg: 'from-yellow-950 via-amber-900/60 to-[#0a0d12]',
    accent: '#f59e0b',
    accentDim: '#78350f',
    badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    icon: '🏆',
    title: 'PROMOTED!',
    subtitle: "You're moving up — incredible performance!",
    cta: 'Keep the momentum going',
    particles: true,
  },
  relegated: {
    bg: 'from-red-950 via-red-900/40 to-[#0a0d12]',
    accent: '#ef4444',
    accentDim: '#7f1d1d',
    badge: 'bg-red-900/30 text-red-300 border-red-500/30',
    icon: '💪',
    title: 'Keep Fighting',
    subtitle: "Tough sprint. Use this as fuel to come back stronger.",
    cta: 'Time to bounce back',
    particles: false,
  },
  retained: {
    bg: 'from-indigo-950 via-indigo-900/30 to-[#0a0d12]',
    accent: '#6366f1',
    accentDim: '#312e81',
    badge: 'bg-indigo-900/30 text-indigo-300 border-indigo-500/30',
    icon: '⚖️',
    title: 'Division Held',
    subtitle: "Solid sprint. Keep building and push for promotion next time.",
    cta: 'Stay consistent',
    particles: false,
  },
  rookie: {
    bg: 'from-blue-950 via-blue-900/30 to-[#0a0d12]',
    accent: '#3b82f6',
    accentDim: '#1e3a5f',
    badge: 'bg-blue-900/30 text-blue-300 border-blue-500/30',
    icon: '🌱',
    title: 'Rookie Sprint Done!',
    subtitle: "You've completed your first sprint. Division rules apply from next sprint.",
    cta: "You're just getting started",
    particles: false,
  },
}

function GoldParticles() {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: `${5 + (i * 5.5) % 90}%`,
    delay: `${(i * 0.18) % 2}s`,
    duration: `${1.5 + (i * 0.13) % 1.5}s`,
    size: i % 3 === 0 ? 8 : i % 3 === 1 ? 5 : 6,
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full opacity-0 animate-fall"
          style={{
            left: p.left,
            top: '-10px',
            width: p.size,
            height: p.size,
            background: p.id % 2 === 0 ? '#f59e0b' : '#fcd34d',
            animationDelay: p.delay,
            animationDuration: p.duration,
            animationFillMode: 'forwards',
            animation: `fall ${p.duration} ${p.delay} ease-in forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes fall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

function WelcomePopup({ sprint, onClose }) {
  if (!sprint) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm mx-4 mb-4 sm:mb-0 bg-[#0d1117] border border-indigo-500/30 rounded-3xl overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-b from-indigo-950 via-indigo-900/40 to-[#0d1117] px-6 pt-8 pb-6">
          <div className="text-center">
            <div className="text-5xl mb-3">⚡</div>
            <h2 className="text-white font-black text-2xl tracking-tight">New Sprint!</h2>
            <p className="text-indigo-300 font-bold text-base mt-1">{sprint.name}</p>
            <p className="text-gray-400 text-sm mt-2">
              Make your week 1 picks and get your sprint started.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            <button
              onClick={() => { onClose('picks') }}
              className="w-full py-3.5 rounded-2xl font-black text-sm tracking-wide text-white"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              MAKE MY PICKS →
            </button>
            <button
              onClick={() => onClose(null)}
              className="w-full py-2.5 rounded-2xl font-semibold text-sm text-gray-400 hover:text-white transition-colors"
            >
              I'll do it later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


export default function SprintClosingPopup({ sprint, nextSprint, onDismiss, readOnly = false }) {
  const [step, setStep] = useState('summary') // 'summary' | 'picks' | 'welcome'
  const [marking, setMarking] = useState(false)
  const navigate = useNavigate()

  const outcome = sprint?.sprint_outcome || 'retained'
  const cfg = OUTCOME_CFG[outcome] || OUTCOME_CFG.retained

  const lp          = sprint?.total_league_points ?? 0
  const correct     = sprint?.total_correct_picks ?? 0
  const perfect     = sprint?.perfect_weeks ?? 0
  const participated = sprint?.gameweeks_participated ?? 0
  const myRank      = sprint?.my_rank
  const totalPlayers = sprint?.total_players
  const fromDiv     = sprint?.division_name
  const fromIcon    = sprint?.division_icon
  const toDiv       = sprint?.final_division_name
  const toIcon      = sprint?.final_division_icon

  const handleSeenAndPicks = () => {
    if (marking) return
    setMarking(true)
    if (!readOnly) markPopupSeen(sprint.id).catch(() => {})
    setStep('picks')
  }

  const handlePicksNext = () => {
    if (nextSprint) setStep('welcome')
    else onDismiss()
  }

  const handleWelcomeClose = (action) => {
    onDismiss()
    if (action === 'picks') navigate('/')
  }

  if (step === 'picks') {
    return (
      <SprintPicksModal
        sprintId={sprint?.id}
        sprintName={sprint?.name}
        accentColor={cfg.accent}
        onNext={handlePicksNext}
        onClose={handlePicksNext}
        nextLabel={nextSprint ? 'NEXT: NEW SPRINT →' : 'CLOSE ✓'}
      />
    )
  }

  if (step === 'welcome') {
    return <WelcomePopup sprint={nextSprint} onClose={handleWelcomeClose} />
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />

      <div className="relative w-full max-w-sm mx-4 mb-4 sm:mb-0 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
        {/* Header gradient */}
        <div className={`relative bg-gradient-to-b ${cfg.bg} px-6 pt-8 pb-6`}>
          {cfg.particles && <GoldParticles />}

          {/* Outcome badge */}
          <div className="text-center relative z-10">
            <div className="text-6xl mb-3 drop-shadow-lg">{cfg.icon}</div>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-black tracking-widest uppercase mb-3 ${cfg.badge}`}>
              {outcome === 'promoted' ? '⬆ PROMOTED' : outcome === 'relegated' ? '⬇ RELEGATED' : outcome === 'rookie' ? '🌱 ROOKIE' : '= RETAINED'}
            </div>
            <h2 className="text-white font-black text-2xl tracking-tight leading-tight">{cfg.title}</h2>
            <p className="text-gray-300 text-sm mt-1.5 leading-snug">{cfg.subtitle}</p>
          </div>

          {/* Division movement */}
          {(fromDiv || toDiv) && (
            <div className="mt-5 flex items-center justify-center gap-3 relative z-10">
              {fromDiv && (
                <div className="text-center">
                  <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-0.5">From</p>
                  <p className="text-white font-bold text-sm">{fromIcon} {fromDiv}</p>
                </div>
              )}
              {fromDiv && toDiv && (
                <div className="text-gray-500 text-xl font-bold">→</div>
              )}
              {toDiv && (
                <div className="text-center">
                  <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-0.5">To</p>
                  <p className="font-black text-sm" style={{ color: cfg.accent }}>{toIcon} {toDiv}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="bg-[#0d1117] px-6 py-5">
          <p className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold mb-3">{sprint?.name} · Summary</p>

          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="bg-white/4 rounded-2xl p-3 text-center">
              <p className="font-black text-lg text-white leading-none">{lp}</p>
              <p className="text-gray-500 text-[10px] mt-0.5">LP</p>
            </div>
            <div className="bg-white/4 rounded-2xl p-3 text-center">
              <p className="font-black text-lg text-white leading-none">{correct}</p>
              <p className="text-gray-500 text-[10px] mt-0.5">Correct</p>
            </div>
            <div className="bg-white/4 rounded-2xl p-3 text-center">
              <p className="font-black text-lg text-white leading-none">{participated}</p>
              <p className="text-gray-500 text-[10px] mt-0.5">Weeks</p>
            </div>
          </div>

          {(myRank || perfect > 0) && (
            <div className="flex gap-3">
              {myRank && (
                <div className="flex-1 bg-white/4 rounded-2xl p-3 text-center">
                  <p className="font-black text-lg text-white leading-none">#{myRank}</p>
                  <p className="text-gray-500 text-[10px] mt-0.5">
                    {totalPlayers ? `of ${totalPlayers}` : 'Rank'}
                  </p>
                </div>
              )}
              {perfect > 0 && (
                <div className="flex-1 bg-yellow-900/20 border border-yellow-500/20 rounded-2xl p-3 text-center">
                  <p className="font-black text-lg text-yellow-400 leading-none">{perfect}⭐</p>
                  <p className="text-gray-500 text-[10px] mt-0.5">Perfect weeks</p>
                </div>
              )}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleSeenAndPicks}
            disabled={marking}
            className="mt-5 w-full py-3.5 rounded-2xl font-black text-sm tracking-wide text-white transition-opacity disabled:opacity-60"
            style={{ background: `linear-gradient(135deg, ${cfg.accentDim}, ${cfg.accent})` }}
          >
            {marking ? 'Loading...' : 'SEE MY PICKS →'}
          </button>
        </div>
      </div>
    </div>
  )
}
