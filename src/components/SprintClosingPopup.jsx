import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { markPopupSeen, getSprintPicks } from '../api/glory'

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

const EVENT_TYPE_LABEL = {
  MATCH_RESULT:  'Result',
  BTTS:          'BTTS',
  GOALS:         'Goals',
  CLEAN_SHEET:   'Clean Sheet',
  WHO_QUALIFIES: 'Qualifies',
}

function PicksPage({ sprint, accentColor, onNext, nextLabel }) {
  const [weeks, setWeeks]   = useState(null)
  const [loading, setLoading] = useState(true)
  const fetched = useRef(false)

  useEffect(() => {
    if (fetched.current || !sprint?.id) return
    fetched.current = true
    getSprintPicks(sprint.id)
      .then(res => setWeeks(res.data?.weeks ?? []))
      .catch(() => setWeeks([]))
      .finally(() => setLoading(false))
  }, [sprint?.id])

  const totalPicks  = weeks?.reduce((s, w) => s + w.picks.length, 0) ?? 0
  const totalWon    = weeks?.reduce((s, w) => s + (w.week_correct ?? 0), 0) ?? 0

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />

      <div className="relative w-full max-w-sm mx-4 mb-4 sm:mb-0 rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-[#0d1117] flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/6 flex-shrink-0">
          <p className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold">{sprint?.name}</p>
          <h2 className="text-white font-black text-xl tracking-tight mt-0.5">My Picks</h2>
          {!loading && totalPicks > 0 && (
            <p className="text-gray-400 text-xs mt-1">
              {totalWon}/{totalPicks} correct
              <span className="ml-1.5 text-gray-600">· {Math.round((totalWon / totalPicks) * 100)}% accuracy</span>
            </p>
          )}
        </div>

        {/* Scrollable picks list */}
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-4">
          {loading && (
            <div className="py-8 flex justify-center">
              <div className="w-5 h-5 border-2 border-white/10 border-t-white/50 rounded-full animate-spin" />
            </div>
          )}
          {!loading && weeks?.length === 0 && (
            <p className="text-gray-600 text-sm text-center py-8">No picks recorded for this sprint.</p>
          )}
          {!loading && weeks?.map(week => (
            <div key={week.sprint_week}>
              {/* Week header */}
              <div className="flex items-center justify-between px-1 mb-2">
                <p className="text-gray-600 text-[10px] uppercase tracking-wider font-semibold">
                  Week {week.sprint_week}
                </p>
                {(week.week_correct > 0 || week.week_incorrect > 0) && (
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="text-green-500 font-semibold">{week.week_correct}✓</span>
                    <span className="text-red-500 font-semibold">{week.week_incorrect}✗</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                {week.picks.map((pick, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border ${
                      pick.result === 'WON'
                        ? 'bg-green-900/15 border-green-700/25'
                        : pick.result === 'LOST'
                        ? 'bg-red-900/15 border-red-700/20'
                        : 'bg-white/3 border-white/6'
                    }`}
                  >
                    {/* Team logos */}
                    {(pick.home_logo || pick.away_logo) ? (
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        {pick.home_logo && <img src={pick.home_logo} alt="" className="w-4 h-4 object-contain" />}
                        {pick.away_logo && <img src={pick.away_logo} alt="" className="w-4 h-4 object-contain" />}
                      </div>
                    ) : (
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        pick.result === 'WON' ? 'bg-green-400' : pick.result === 'LOST' ? 'bg-red-400' : 'bg-gray-600'
                      }`} />
                    )}

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-[12px] font-semibold leading-tight truncate">{pick.fixture_name}</p>
                      <p className="text-gray-500 text-[10px] mt-0.5 truncate">
                        {EVENT_TYPE_LABEL[pick.event_type] || pick.event_type} · {pick.picked_label}
                      </p>
                    </div>

                    {/* Energy cost + result */}
                    <div className="flex-shrink-0 flex flex-col items-end gap-0.5">
                      {pick.energy_cost > 0 && (
                        <span className="text-[9px] text-yellow-500/70 font-semibold">⚡{pick.energy_cost}</span>
                      )}
                      <span className={`text-[11px] font-black ${
                        pick.result === 'WON' ? 'text-green-400' : pick.result === 'LOST' ? 'text-red-400' : 'text-gray-600'
                      }`}>
                        {pick.result === 'WON' ? '✓' : pick.result === 'LOST' ? '✗' : '–'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="px-6 py-4 border-t border-white/6 flex-shrink-0">
          <button
            onClick={onNext}
            className="w-full py-3.5 rounded-2xl font-black text-sm tracking-wide text-white"
            style={{ background: `linear-gradient(135deg, #1e293b, ${accentColor})` }}
          >
            {nextLabel}
          </button>
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
      <PicksPage
        sprint={sprint}
        accentColor={cfg.accent}
        onNext={handlePicksNext}
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
