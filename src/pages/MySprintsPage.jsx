import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyRelevantSprints } from '../api/glory'
import BottomNav from '../components/layout/BottomNav'

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const OUTCOME_STYLE = {
  promoted:  { bg: 'bg-green-900/30 border-green-500/30',  text: 'text-green-400',  label: '⬆ Promoted' },
  retained:  { bg: 'bg-white/5 border-white/10',           text: 'text-gray-400',   label: '= Retained' },
  relegated: { bg: 'bg-red-900/20 border-red-500/25',      text: 'text-red-400',    label: '⬇ Relegated' },
  pending:   { bg: 'bg-indigo-900/20 border-indigo-500/20',text: 'text-indigo-400', label: '⏳ In Progress' },
}

function SprintCard({ sprint, isCurrent, isUpcoming }) {
  const navigate = useNavigate()
  const lp       = sprint.total_league_points ?? null
  const outcome  = sprint.sprint_outcome ?? (isCurrent ? 'pending' : null)
  const style    = outcome ? OUTCOME_STYLE[outcome] || OUTCOME_STYLE.pending : null
  const gwActive = sprint.active_gameweeks ?? 0
  const gwTotal  = sprint.gameweek_count   ?? 4

  return (
    <div className={`rounded-2xl border p-4 ${
      isCurrent  ? 'bg-indigo-950/20 border-indigo-500/30' :
      isUpcoming ? 'bg-white/2 border-white/6 opacity-70' :
      style      ? `${style.bg} border` :
      'bg-[#0d1117] border-white/8'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-white font-semibold text-sm">{sprint.name}</p>
            {isCurrent && (
              <span className="text-[10px] bg-green-900/40 text-green-400 px-2 py-0.5 rounded-full">LIVE</span>
            )}
            {isUpcoming && (
              <span className="text-[10px] bg-white/8 text-gray-500 px-2 py-0.5 rounded-full">UPCOMING</span>
            )}
          </div>
          <p className="text-gray-600 text-[11px] mt-0.5">
            {fmtDate(sprint.start_date)} → {fmtDate(sprint.end_date)}
          </p>
          {sprint.division_name && (
            <p className="text-gray-500 text-[11px] mt-0.5">
              {sprint.division_icon} {sprint.division_name}
            </p>
          )}
        </div>
        {style && (
          <span className={`text-[10px] font-semibold ${style.text} flex-shrink-0 ml-2`}>{style.label}</span>
        )}
      </div>

      {/* Gameweek progress */}
      <div className="flex gap-1.5 mb-3">
        {Array.from({ length: gwTotal }, (_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${
            i < gwActive ? 'bg-indigo-500' : 'bg-white/8'
          }`} />
        ))}
      </div>

      {!isUpcoming && lp !== null ? (
        <div className="flex gap-3">
          <div className="flex-1 bg-black/20 rounded-xl p-2.5 text-center">
            <p className="text-indigo-400 font-black text-xl">{lp}</p>
            <p className="text-gray-600 text-[10px]">League Points</p>
          </div>
          <div className="flex-1 bg-black/20 rounded-xl p-2.5 text-center">
            <p className="text-white font-bold text-xl">{sprint.total_correct_picks ?? 0}</p>
            <p className="text-gray-600 text-[10px]">Correct picks</p>
          </div>
          <div className="flex-1 bg-black/20 rounded-xl p-2.5 text-center">
            <p className="text-yellow-400 font-bold text-xl">{sprint.perfect_weeks ?? 0}</p>
            <p className="text-gray-600 text-[10px]">Perfect weeks</p>
          </div>
        </div>
      ) : isUpcoming ? (
        <p className="text-gray-700 text-xs text-center">Gameweeks will be published before the sprint starts</p>
      ) : (
        <p className="text-gray-600 text-xs">No picks submitted this sprint</p>
      )}

      {isCurrent && (
        <button
          onClick={() => navigate('/')}
          className="w-full mt-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 rounded-xl text-sm font-medium transition-colors"
        >
          Go to current matchweek →
        </button>
      )}
    </div>
  )
}

export default function MySprintsPage() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyRelevantSprints()
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-[#0a0d12] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const past     = data?.past     || []
  const upcoming = data?.upcoming || []

  const liveSprint      = past.find(s => s.status === 'live')
  const scheduledSprint = past.find(s => s.status === 'scheduled')
  const currentSprint   = liveSprint || scheduledSprint
  const historicSprints = past.filter(s => !['live','scheduled'].includes(s.status))

  return (
    <div className="min-h-screen bg-[#0a0d12] text-white pb-24">
      <div className="max-w-md mx-auto px-4 pt-5 space-y-5">

        <div>
          <h1 className="text-white text-xl font-bold">My Sprints</h1>
          <p className="text-gray-500 text-sm mt-0.5">Your competition history and upcoming sprints</p>
        </div>

        {/* Current sprint */}
        {currentSprint && (
          <section>
            <p className="text-gray-600 text-[11px] font-semibold tracking-widest uppercase mb-2">Current</p>
            <SprintCard sprint={currentSprint} isCurrent />
          </section>
        )}

        {/* Upcoming (current month + next month) */}
        {upcoming.length > 0 && (
          <section>
            <p className="text-gray-600 text-[11px] font-semibold tracking-widest uppercase mb-2">Upcoming</p>
            <div className="space-y-3">
              {upcoming.map(s => (
                <SprintCard key={s.id} sprint={s} isUpcoming />
              ))}
            </div>
          </section>
        )}

        {/* History */}
        {historicSprints.length > 0 && (
          <section>
            <p className="text-gray-600 text-[11px] font-semibold tracking-widest uppercase mb-2">History</p>
            <div className="space-y-3">
              {historicSprints.map(s => (
                <SprintCard key={s.id} sprint={s} />
              ))}
            </div>
          </section>
        )}

        {past.length === 0 && upcoming.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🏃</p>
            <p className="text-gray-400 font-medium">No sprints yet</p>
            <p className="text-gray-600 text-sm mt-1">Your first sprint is coming up soon.</p>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
