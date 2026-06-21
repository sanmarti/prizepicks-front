import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getGloryGameweek, submitGloryPicks } from '../api/glory'

const EVENT_TYPE_LABELS = {
  MATCH_RESULT: 'Match result',
  GOALS: 'Goals',
  CLEAN_SHEET: 'Clean sheet',
  PLAYER_SCORE: 'Player scores',
}

function EventCard({ event, selectedOptionId, onSelect, isLocked }) {
  const isSettled = event.options.some(o => o.result !== 'PENDING')

  return (
    <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-gray-500 text-[10px] tracking-wider">{EVENT_TYPE_LABELS[event.event_type] || event.event_type}</p>
          <p className="text-white font-medium text-sm mt-0.5 leading-tight">{event.fixture_name}</p>
          {event.match_time && (
            <p className="text-gray-600 text-[10px] mt-0.5">
              {new Date(event.match_time).toLocaleString()}
            </p>
          )}
        </div>
        {selectedOptionId && event.options.find(o => o.id === selectedOptionId) && (
          <span className="text-[10px] bg-indigo-900/40 text-indigo-400 px-2 py-0.5 rounded-full flex-shrink-0">
            Selected
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-1.5">
        {event.options.map(opt => {
          const isSelected = opt.id === selectedOptionId
          const won  = opt.result === 'WON'
          const lost = opt.result === 'LOST'

          return (
            <button
              key={opt.id}
              onClick={() => !isLocked && !isSettled && onSelect(event.id, opt.id)}
              disabled={isLocked || isSettled}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                won  ? 'bg-green-900/30 border border-green-500/40 text-green-300' :
                lost ? 'bg-red-900/20 border border-red-500/20 text-red-400 opacity-60' :
                isSelected
                  ? 'bg-indigo-600 border border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-white/5 border border-white/8 text-gray-300 hover:bg-white/10 hover:border-white/20 disabled:opacity-50'
              }`}
            >
              <span>{opt.label}</span>
              {won  && <span className="text-green-400 text-xs">✓ Won</span>}
              {lost && <span className="text-red-400 text-xs">✗ Lost</span>}
              {!won && !lost && isSelected && <span className="text-indigo-200 text-xs">✓</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function GloryPicksPage() {
  const { gameweekId } = useParams()
  const navigate = useNavigate()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [picks, setPicks] = useState({})   // { event_id: event_option_id }
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    getGloryGameweek(gameweekId)
      .then(r => {
        setData(r.data)
        // Pre-populate with existing picks
        if (r.data.my_picks?.length) {
          const existing = {}
          for (const p of r.data.my_picks) existing[p.event_id] = p.event_option_id
          setPicks(existing)
          setSubmitted(true)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [gameweekId])

  useEffect(() => { load() }, [load])

  const pickCount = Object.keys(picks).length
  const isLocked = data?.is_locked
  const gw = data?.gameweek
  const events = gw?.events || []

  const handleSelect = (eventId, optionId) => {
    if (isLocked) return
    setPicks(prev => {
      const next = { ...prev }
      if (next[eventId] === optionId) {
        delete next[eventId]
      } else {
        next[eventId] = optionId
      }
      return next
    })
    setSubmitted(false)
  }

  const handleSubmit = async () => {
    if (pickCount !== 6) { setErr('Select exactly 6 picks'); return }
    setSubmitting(true); setErr(''); setMsg('')
    try {
      const pickList = Object.entries(picks).map(([event_id, event_option_id]) => ({
        event_id, event_option_id
      }))
      await submitGloryPicks(gameweekId, pickList)
      setSubmitted(true)
      setMsg('Picks saved! Good luck!')
    } catch (e) {
      setErr(e.response?.data?.message || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0d12] flex items-center justify-center">
        <p className="text-gray-500">Loading gameweek…</p>
      </div>
    )
  }

  if (!gw) {
    return (
      <div className="min-h-screen bg-[#0a0d12] flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-gray-400">Gameweek not found or not available</p>
        <button onClick={() => navigate('/')} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm">
          Go home
        </button>
      </div>
    )
  }

  const entry = data?.my_entry

  return (
    <div className="min-h-screen bg-[#0a0d12] text-white pb-32">
      <div className="max-w-md mx-auto px-4 pt-6 space-y-4">

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate('/')} className="text-gray-500 hover:text-white">←</button>
          <div>
            <h1 className="text-white font-bold">Week {gw.sprint_week} Picks</h1>
            <p className="text-gray-500 text-xs">
              Lock: {new Date(gw.lock_time).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Pick counter */}
        <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Picks selected</p>
            <p className={`text-2xl font-bold ${pickCount === 6 ? 'text-green-400' : 'text-white'}`}>
              {pickCount}/6
            </p>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full ${i < pickCount ? 'bg-indigo-500' : 'bg-white/10'}`} />
            ))}
          </div>
          <p className="text-gray-600 text-xs mt-2">
            {6 - pickCount > 0 ? `Select ${6 - pickCount} more` : 'All 6 picks selected! '}
            {pickCount === 6 && <span className="text-green-400">Ready to submit</span>}
          </p>
        </div>

        {/* Locked state */}
        {isLocked && (
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-2xl p-4 text-center">
            <p className="text-yellow-300 font-medium">🔒 Picks are locked</p>
            <p className="text-gray-500 text-xs mt-1">Results will appear here as matches finish</p>
          </div>
        )}

        {/* Settled entry summary */}
        {entry?.status === 'completed' && (
          <div className={`rounded-2xl p-4 border text-center ${
            entry.is_perfect_week
              ? 'bg-yellow-900/20 border-yellow-500/40'
              : 'bg-[#0d1117] border-white/8'
          }`}>
            {entry.is_perfect_week && (
              <p className="text-yellow-400 font-bold text-lg mb-1">⭐ PERFECT WEEK!</p>
            )}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-gray-500 text-xs">Correct</p>
                <p className="text-green-400 font-bold text-xl">{entry.correct_picks}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">League Points</p>
                <p className="text-indigo-400 font-bold text-xl">{entry.league_points}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Bonus</p>
                <p className="text-yellow-400 font-bold text-xl">+{entry.perfect_week_bonus}</p>
              </div>
            </div>
          </div>
        )}

        {/* Scoring info */}
        {!isLocked && (
          <div className="text-xs text-gray-600 bg-white/3 rounded-xl px-3 py-2">
            Each correct pick = +1 LP · All 6 correct = +10 LP (6 + 4 bonus)
          </div>
        )}

        {err && <p className="text-red-400 text-xs bg-red-900/20 p-2 rounded-xl">{err}</p>}
        {msg && <p className="text-green-400 text-xs bg-green-900/20 p-2 rounded-xl">{msg}</p>}

        {/* Events */}
        <div className="space-y-3">
          {events.map(ev => (
            <EventCard
              key={ev.id}
              event={ev}
              selectedOptionId={picks[ev.id]}
              onSelect={handleSelect}
              isLocked={isLocked}
            />
          ))}
        </div>
      </div>

      {/* Fixed bottom CTA */}
      {!isLocked && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0a0d12]/95 backdrop-blur border-t border-white/8 p-4">
          <div className="max-w-md mx-auto">
            <button
              onClick={handleSubmit}
              disabled={pickCount !== 6 || submitting}
              className={`w-full py-3.5 rounded-2xl font-semibold text-sm transition-all ${
                pickCount === 6
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-white/5 text-gray-600 cursor-not-allowed'
              } disabled:opacity-50`}
            >
              {submitting ? 'Saving picks…' : submitted ? '✓ Update picks' : `Submit ${pickCount}/6 picks`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
