import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getGloryStatus } from '../api/glory'

const DIVISION_ORDER = ['Academy', 'Division 4', 'Division 3', 'Division 2', 'Division 1', 'Champions / Legend']

function ProgressBar({ value, max, color = '#6366f1' }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  )
}

function DivisionPath({ currentDivision }) {
  const currentIdx = DIVISION_ORDER.findIndex(d =>
    d === currentDivision?.division_name
  )
  return (
    <div className="flex items-center gap-1">
      {DIVISION_ORDER.map((name, idx) => (
        <div key={name} className="flex items-center gap-1">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs border-2 transition-all ${
            idx < currentIdx  ? 'border-indigo-500 bg-indigo-900/40 text-indigo-400' :
            idx === currentIdx ? 'border-indigo-400 bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-500/30' :
            'border-white/10 bg-white/5 text-gray-600'
          }`}>
            {idx < currentIdx ? '✓' : idx + 1}
          </div>
          {idx < DIVISION_ORDER.length - 1 && (
            <div className={`h-0.5 w-4 ${idx < currentIdx ? 'bg-indigo-500' : 'bg-white/10'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

function StatCard({ label, value, sublabel, color = 'text-white' }) {
  return (
    <div className="bg-white/5 rounded-2xl p-4 text-center">
      <p className="text-gray-500 text-xs mb-1">{label}</p>
      <p className={`font-bold text-2xl ${color}`}>{value}</p>
      {sublabel && <p className="text-gray-600 text-xs mt-0.5">{sublabel}</p>}
    </div>
  )
}

export default function GloryHomePage() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    getGloryStatus()
      .then(r => setStatus(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0d12] flex items-center justify-center">
        <p className="text-gray-500">Loading your status…</p>
      </div>
    )
  }

  const { division, sprint, sprint_progress, current_gameweek, next_division, recent_badges } = status || {}

  const lp   = sprint_progress?.total_league_points ?? 0
  const toPromotion = next_division
    ? Math.max(0, (division?.promotion_min_points ?? 17) - lp)
    : 0
  const relegationRisk = division?.allows_relegation && division?.relegation_max_points !== null
    ? lp <= (division.relegation_max_points ?? 0)
    : false
  const gwsRemaining = sprint
    ? (sprint.gameweek_count || 4) - (sprint_progress?.gameweeks_participated ?? 0)
    : null

  return (
    <div className="min-h-screen bg-[#0a0d12] text-white pb-20">
      <div className="max-w-md mx-auto px-4 pt-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs tracking-widest">6 TO GLORY</p>
            <h1 className="text-white text-2xl font-bold mt-0.5">
              {division?.icon} {division?.division_name || 'Academy'}
            </h1>
          </div>
          <button onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full bg-indigo-900/40 border border-indigo-500/30 flex items-center justify-center text-indigo-300 text-lg">
            👤
          </button>
        </div>

        {/* Division path */}
        <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-4">
          <p className="text-gray-500 text-xs mb-3">Your journey</p>
          <DivisionPath currentDivision={division} />
          <p className="text-gray-400 text-xs mt-3 text-center">
            {next_division
              ? `${toPromotion} more LP to reach ${next_division.name}`
              : division?.is_highest ? 'You are at the top!' : ''}
          </p>
        </div>

        {/* Sprint progress */}
        {sprint ? (
          <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs">Current Sprint</p>
                <p className="text-white font-semibold">{sprint.name}</p>
              </div>
              <span className="text-xs bg-green-900/30 text-green-400 px-2 py-0.5 rounded-full">
                {sprint.status?.toUpperCase()}
              </span>
            </div>

            {division?.is_rookie || sprint_progress?.is_rookie ? (
              <div className="bg-yellow-900/20 border border-yellow-500/20 rounded-xl p-3 text-xs text-yellow-300">
                You joined mid-sprint. Earn points and badges but your first official promotion cycle starts next sprint.
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <StatCard label="League Points" value={lp} color="text-indigo-400" />
              <StatCard label="Correct picks" value={sprint_progress?.total_correct_picks ?? 0} />
              <StatCard label="Perfect Weeks" value={sprint_progress?.perfect_weeks ?? 0} color="text-yellow-400" />
              <StatCard label="GWs left" value={gwsRemaining ?? '–'} />
            </div>

            {/* Promotion progress bar */}
            {next_division && !division?.is_highest && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Progress to {next_division.name}</span>
                  <span className="text-indigo-400">{lp} / {division?.promotion_min_points} LP</span>
                </div>
                <ProgressBar value={lp} max={division?.promotion_min_points ?? 1} />
              </div>
            )}

            {/* Relegation warning */}
            {relegationRisk && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-3 text-xs text-red-300">
                ⚠️ Relegation risk — earn more LP to stay safe!
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-6 text-center">
            <p className="text-gray-500 text-sm">No active sprint right now.</p>
            <p className="text-gray-600 text-xs mt-1">Check back soon for the next competition.</p>
          </div>
        )}

        {/* Current gameweek CTA */}
        {current_gameweek && (
          <div
            onClick={() => navigate(`/glory/picks/${current_gameweek.id}`)}
            className="bg-gradient-to-br from-indigo-900/40 to-indigo-800/20 border border-indigo-500/30 rounded-2xl p-5 cursor-pointer hover:border-indigo-400/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-gray-400 text-xs">Current Gameweek</p>
                <p className="text-white font-semibold mt-0.5">Week {current_gameweek.sprint_week}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                current_gameweek.status === 'PUBLISHED' ? 'bg-green-900/40 text-green-400' :
                current_gameweek.status === 'LOCKED'    ? 'bg-yellow-900/40 text-yellow-400' :
                'bg-gray-700 text-gray-400'
              }`}>
                {current_gameweek.status}
              </span>
            </div>
            <p className="text-gray-400 text-sm mb-3">
              {current_gameweek.event_count} events available · Pick exactly 6
            </p>
            <p className="text-gray-600 text-xs">
              Lock: {new Date(current_gameweek.lock_time).toLocaleString()}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-indigo-300">
                ⭐ Perfect Week = 10 LP (6 correct + 4 bonus)
              </div>
              <span className="text-indigo-400 text-sm font-medium">
                Make picks →
              </span>
            </div>
          </div>
        )}

        {/* Recent badges */}
        {recent_badges?.length > 0 && (
          <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-4">
            <p className="text-gray-500 text-xs mb-3">Recent badges</p>
            <div className="flex flex-wrap gap-2">
              {recent_badges.map((b, i) => (
                <div key={i} className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
                  <span className="text-lg">{b.icon}</span>
                  <div>
                    <p className="text-white text-xs font-medium">{b.name}</p>
                    <p className="text-gray-600 text-[10px]">{new Date(b.earned_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How it works */}
        <div className="bg-white/3 border border-white/5 rounded-2xl p-4 space-y-2 text-xs text-gray-500">
          <p className="text-gray-400 font-medium text-sm">How 6 to Glory works</p>
          <p>• Every Gameweek has 15 events — select exactly 6 predictions</p>
          <p>• Every correct pick = +1 League Point</p>
          <p>• 6/6 Perfect Week = +10 LP (6 correct + 4 bonus)</p>
          <p>• At Sprint end, your total LP determines promotion, retention, or relegation</p>
          <p>• Every player gets the same 15 events — pure skill, no luck</p>
        </div>
      </div>
    </div>
  )
}
