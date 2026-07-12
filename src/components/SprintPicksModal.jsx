import { useState, useEffect, useRef } from 'react'
import { getSprintPicks, getPublicSprintPicks } from '../api/glory'

const EVENT_TYPE_LABEL = {
  MATCH_RESULT:  'Result',
  BTTS:          'BTTS',
  GOALS:         'Goals O/U',
  CLEAN_SHEET:   'Clean Sheet',
  WHO_QUALIFIES: 'Qualifies',
}

// sprintId + sprintName required
// userId: if provided, fetches that user's picks (public profile view)
// accentColor: optional gradient accent
// onClose: required
export default function SprintPicksModal({ sprintId, sprintName, userId, accentColor = '#6366f1', onClose, nextLabel = 'CLOSE ✓', onNext }) {
  const [weeks, setWeeks]     = useState(null)
  const [loading, setLoading] = useState(true)
  const fetched = useRef(false)

  useEffect(() => {
    if (fetched.current || !sprintId) return
    fetched.current = true
    const req = userId
      ? getPublicSprintPicks(userId, sprintId)
      : getSprintPicks(sprintId)
    req
      .then(res => setWeeks(res.data?.weeks ?? []))
      .catch(err => { console.error('[SprintPicksModal] fetch failed', err?.response?.status, err?.message); setWeeks([]) })
      .finally(() => setLoading(false))
  }, [sprintId, userId])

  const totalPicks = weeks?.reduce((s, w) => s + w.picks.length, 0) ?? 0
  const totalWon   = weeks?.reduce((s, w) => s + (w.week_correct ?? 0), 0) ?? 0

  const handleNext = onNext ?? onClose

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm mx-4 mb-4 sm:mb-0 rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-[#0d1117] flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/6 flex-shrink-0 flex items-start justify-between">
          <div>
            <p className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold">{sprintName}</p>
            <h2 className="text-white font-black text-xl tracking-tight mt-0.5">Picks</h2>
            {!loading && totalPicks > 0 && (
              <p className="text-gray-400 text-xs mt-1">
                {totalWon}/{totalPicks} correct
                <span className="ml-1.5 text-gray-600">· {Math.round((totalWon / totalPicks) * 100)}% accuracy</span>
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors text-lg leading-none mt-1">✕</button>
        </div>

        {/* Picks list */}
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
                    {/* Team logos or result dot */}
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

                    {/* Energy + result */}
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
            onClick={handleNext}
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
