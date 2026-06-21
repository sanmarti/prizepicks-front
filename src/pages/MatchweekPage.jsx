import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getGloryStatus, getGloryGameweek, submitGloryPicks,
  getGloryLeaderboard, getCommunityPicks,
} from '../api/glory'
import BottomNav from '../components/layout/BottomNav'

const EVENT_TYPE_LABELS = {
  MATCH_RESULT: 'Match result', GOALS: 'Goals',
  CLEAN_SHEET: 'Clean sheet', BTTS: 'Both teams to score',
  PLAYER_SCORE: 'Player scores', CORNER_OVER: 'Corners',
}

function fmt(d, opts) { return new Date(d).toLocaleString('en-GB', opts) }
function fmtShort(d) { return fmt(d, { day: 'numeric', month: 'short' }) }
function fmtFull(d)  { return fmt(d, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }

// ── Sprint gameweek navigation ─────────────────────────────────────────────────
function GwNav({ sprint, currentGwId }) {
  if (!sprint?.gameweeks?.length && !sprint?.id) return null
  const gwCount = sprint.gameweek_count || 4
  const gws     = sprint.gameweeks || []
  const byWeek  = {}
  for (const g of gws) byWeek[g.sprint_week] = g

  return (
    <div className="flex gap-2">
      {Array.from({ length: gwCount }, (_, i) => i + 1).map(w => {
        const gw     = byWeek[w]
        const active = gw?.id === currentGwId
        const done   = gw?.status === 'FINISHED'
        const open   = gw?.status === 'PUBLISHED'
        const locked = gw?.status === 'LOCKED'
        return (
          <div key={w}
            className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-[11px] font-medium border transition-colors ${
              active  ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300' :
              done    ? 'bg-white/5 border-white/10 text-gray-500' :
              open    ? 'bg-white/5 border-white/10 text-gray-400' :
              'bg-white/3 border-transparent text-gray-700'
            }`}
          >
            <span className="font-bold text-xs">W{w}</span>
            <span className={`w-1.5 h-1.5 rounded-full ${
              done ? 'bg-purple-400' : locked ? 'bg-yellow-400' : open ? 'bg-green-400' : 'bg-gray-700'
            }`} />
          </div>
        )
      })}
    </div>
  )
}

// ── Single event pick card ─────────────────────────────────────────────────────
function EventCard({ event, selectedOptionId, onSelect, isLocked, dimmed }) {
  const [open, setOpen] = useState(!dimmed)
  return (
    <div className={`rounded-2xl border transition-all ${
      dimmed
        ? 'bg-white/2 border-white/5 opacity-50'
        : selectedOptionId
          ? 'bg-indigo-950/30 border-indigo-500/30'
          : 'bg-[#0d1117] border-white/8'
    }`}>
      <button
        onClick={() => dimmed && setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-4 py-3 ${dimmed ? 'cursor-pointer' : ''}`}
      >
        <div className="text-left min-w-0">
          <p className="text-gray-500 text-[10px] tracking-wider">{EVENT_TYPE_LABELS[event.event_type] || event.event_type}</p>
          <p className="text-white font-medium text-sm mt-0.5 leading-tight truncate">{event.fixture_name}</p>
          <p className="text-gray-600 text-[10px] mt-0.5">{fmtFull(event.match_time)}</p>
        </div>
        {dimmed && (
          <span className="text-gray-700 text-xs ml-2 flex-shrink-0">{open ? '▲' : '▼'}</span>
        )}
        {!dimmed && selectedOptionId && (
          <span className="text-[10px] bg-indigo-900/50 text-indigo-400 px-2 py-0.5 rounded-full flex-shrink-0 ml-2">Picked</span>
        )}
      </button>

      {(!dimmed || open) && (
        <div className="px-4 pb-3 grid gap-1.5">
          {event.options.map(opt => {
            const isSelected = opt.id === selectedOptionId
            const won  = opt.result === 'WON'
            const lost = opt.result === 'LOST'
            const pct  = event.total_picks > 0 ? Math.round((opt.pick_count || 0) / event.total_picks * 100) : null

            return (
              <button
                key={opt.id}
                onClick={() => !isLocked && !dimmed && onSelect(event.id, opt.id)}
                disabled={isLocked || dimmed}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative overflow-hidden ${
                  won  ? 'bg-green-900/30 border border-green-500/40 text-green-300' :
                  lost ? `bg-red-900/10 border border-red-500/15 text-red-400 opacity-50` :
                  isSelected
                    ? 'bg-indigo-600 border border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                    : dimmed
                      ? 'bg-white/5 border border-white/8 text-gray-500'
                      : 'bg-white/5 border border-white/8 text-gray-300 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                {pct !== null && (
                  <span
                    className="absolute inset-0 rounded-xl opacity-10"
                    style={{
                      background: won ? '#22c55e' : isSelected ? '#6366f1' : '#ffffff',
                      width: `${pct}%`,
                    }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {opt.label}
                  {!isLocked && !won && !lost && opt.energy_cost && (
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-indigo-500/40 text-indigo-200' : 'bg-white/8 text-gray-500'
                    }`}>⚡{opt.energy_cost}</span>
                  )}
                </span>
                <span className="relative z-10 flex items-center gap-2 text-xs flex-shrink-0">
                  {pct !== null && <span className="text-gray-500">{pct}%</span>}
                  {won  && <span className="text-green-400">✓</span>}
                  {lost && <span className="text-red-400">✗</span>}
                  {!won && !lost && isSelected && <span className="text-indigo-200">✓</span>}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Sprint leaderboard (compact) ───────────────────────────────────────────────
function SprintLeaderboard({ sprintId, myUserId, myDivisionId }) {
  const [data, setData] = useState(null)
  useEffect(() => {
    if (!sprintId || !myDivisionId) return
    getGloryLeaderboard({ sprint_id: sprintId, division_id: myDivisionId })
      .then(r => setData(r.data))
      .catch(() => {})
  }, [sprintId, myDivisionId])

  if (!data?.rows?.length) return null

  const myIdx = data.rows.findIndex(r => r.user_id === myUserId)
  const promLP = data.division?.promotion_min_points
  const relLP  = data.division?.relegation_max_points

  // Show 3 rows around me
  const start = Math.max(0, myIdx - 2)
  const end   = Math.min(data.rows.length, myIdx + 3)
  const shown = data.rows.slice(start, end)
  const myLP  = data.rows[myIdx]?.total_league_points ?? 0

  return (
    <div className="bg-[#0d1117] border border-white/8 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <p className="text-white text-sm font-semibold">{data.division?.name || 'Division'} standings</p>
        <p className="text-gray-600 text-xs">{data.rows.length} players</p>
      </div>

      {promLP && (
        <div className="px-4 py-2 bg-green-900/10 border-b border-green-500/10 flex items-center justify-between text-xs">
          <span className="text-green-400">⬆ Promotion zone</span>
          <span className="text-green-400">{Math.max(0, promLP - myLP)} LP to go</span>
        </div>
      )}
      {start > 0 && (
        <p className="text-center text-gray-700 text-xs py-1.5">· · · {start} players above · · ·</p>
      )}

      <div>
        {shown.map((r, i) => {
          const rank   = start + i + 1
          const isMe   = r.user_id === myUserId
          const isPromo = promLP !== null && r.total_league_points >= promLP
          const isRel  = relLP !== null && r.total_league_points <= relLP
          return (
            <div key={r.user_id}
              className={`flex items-center gap-3 px-4 py-2.5 border-b border-white/5 last:border-0 ${
                isMe ? 'bg-indigo-900/20' : ''
              }`}
            >
              <span className={`w-6 text-center text-xs font-bold flex-shrink-0 ${
                rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-gray-300' : rank === 3 ? 'text-amber-600' : 'text-gray-600'
              }`}>{rank}</span>
              {r.avatar_url
                ? <img src={r.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                : <div className="w-7 h-7 rounded-full bg-indigo-900/50 flex items-center justify-center text-xs text-indigo-300 flex-shrink-0">
                    {(r.display_name || '?')[0].toUpperCase()}
                  </div>
              }
              <span className={`flex-1 text-sm min-w-0 truncate ${isMe ? 'text-white font-semibold' : 'text-gray-300'}`}>
                {r.display_name || 'Player'}
                {isMe && <span className="text-indigo-400 text-xs ml-1">← you</span>}
              </span>
              <span className={`text-sm font-bold flex-shrink-0 ${
                isPromo ? 'text-green-400' : isRel ? 'text-red-400' : 'text-indigo-400'
              }`}>{r.total_league_points} LP</span>
            </div>
          )
        })}
      </div>

      {end < data.rows.length && (
        <p className="text-center text-gray-700 text-xs py-1.5">· · · {data.rows.length - end} players below · · ·</p>
      )}
      {relLP !== null && (
        <div className="px-4 py-2 bg-red-900/10 border-t border-red-500/10 flex items-center justify-between text-xs">
          <span className="text-red-400">⬇ Relegation zone ≤{relLP} LP</span>
          {myLP <= relLP && <span className="text-red-400 font-semibold">You're at risk!</span>}
        </div>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function MatchweekPage() {
  const navigate   = useNavigate()
  const [status, setStatus] = useState(null)
  const [gwData, setGwData] = useState(null)
  const [community, setCommunity] = useState(null)
  const [picks, setPicks]   = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const [msg, setMsg]   = useState('')
  const [err, setErr]   = useState('')
  const [loading, setLoading] = useState(true)

  const loadStatus = useCallback(() => {
    return getGloryStatus().then(r => { setStatus(r.data); return r.data }).catch(() => null)
  }, [])

  const loadGw = useCallback((gwId) => {
    if (!gwId) return
    getGloryGameweek(gwId).then(r => {
      setGwData(r.data)
      if (r.data.my_picks?.length) {
        const existing = {}
        for (const p of r.data.my_picks) existing[p.event_id] = p.event_option_id
        setPicks(existing); setSubmitted(true)
      } else { setPicks({}); setSubmitted(false) }
    }).catch(() => {})
  }, [])

  const loadCommunity = useCallback((gwId, isLocked) => {
    if (!gwId || !isLocked) return
    getCommunityPicks(gwId)
      .then(r => setCommunity(r.data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    loadStatus().then(st => {
      const gwId   = st?.current_gameweek?.id
      const locked = st?.current_gameweek?.status === 'LOCKED' || st?.current_gameweek?.status === 'FINISHED'
      if (gwId) loadGw(gwId)
      if (gwId && locked) loadCommunity(gwId, true)
      setLoading(false)
    })
  }, [loadStatus, loadGw, loadCommunity])

  const gw     = gwData?.gameweek
  const isLocked = gwData?.is_locked ?? false
  const entry  = gwData?.my_entry
  const events = gw?.events || []
  const pickCount = Object.keys(picks).length

  // Total energy cost of currently selected picks
  const totalEnergy = useMemo(() => {
    let sum = 0
    for (const ev of events) {
      const chosenOptId = picks[ev.id]
      if (!chosenOptId) continue
      const opt = ev.options.find(o => o.id === chosenOptId)
      if (opt?.energy_cost) sum += opt.energy_cost
    }
    return sum
  }, [picks, events])

  // Merge community pick counts into events
  const eventsWithCounts = useMemo(() => {
    if (!community) return events
    const byId = {}
    for (const ce of community.events) {
      const total = ce.options.reduce((s, o) => s + (o.pick_count || 0), 0)
      byId[ce.id] = { options: ce.options, total_picks: total }
    }
    return events.map(e => {
      const c = byId[e.id]
      if (!c) return e
      const mergedOpts = e.options.map(o => {
        const co = c.options.find(x => x.id === o.id)
        return { ...o, pick_count: co?.pick_count ?? 0 }
      })
      return { ...e, options: mergedOpts, total_picks: c.total_picks }
    })
  }, [events, community])

  // Split: my picked events vs not-picked
  const myPickedEvents   = eventsWithCounts.filter(e => picks[e.id])
  const unpickedEvents   = eventsWithCounts.filter(e => !picks[e.id])

  const handleSelect = (eventId, optionId) => {
    if (isLocked) return
    setPicks(prev => {
      const next = { ...prev }
      if (next[eventId] === optionId) delete next[eventId]
      else next[eventId] = optionId
      return next
    })
    setSubmitted(false)
  }

  const handleSubmit = async () => {
    if (pickCount !== 6) { setErr('Select exactly 6 picks'); return }
    setSubmitting(true); setErr(''); setMsg('')
    try {
      const pickList = Object.entries(picks).map(([event_id, event_option_id]) => ({ event_id, event_option_id }))
      await submitGloryPicks(gw.id, pickList)
      setSubmitted(true)
      setMsg('Picks saved! Good luck!')
      setTimeout(() => setMsg(''), 4000)
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to submit — try again')
    } finally { setSubmitting(false) }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0a0d12] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const sprint = status?.sprint
  const div    = status?.division
  const prog   = status?.sprint_progress
  const lp     = prog?.total_league_points ?? 0

  return (
    <div className="min-h-screen bg-[#0a0d12] text-white pb-24">
      <div className="max-w-md mx-auto px-4 pt-5 space-y-4">

        {/* Sprint header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-[11px] tracking-widest uppercase">
              {sprint?.name || '6 to Glory'}
            </p>
            <h1 className="text-white text-xl font-bold mt-0.5">
              {div?.icon} {div?.division_name || 'Academy'}
            </h1>
          </div>
          <div className="text-right">
            <p className="text-indigo-400 font-black text-2xl">{lp}</p>
            <p className="text-gray-600 text-[11px]">League Points</p>
          </div>
        </div>

        {/* Sprint gameweek nav */}
        {sprint && <GwNav sprint={sprint} currentGwId={gw?.id} />}

        {/* No active sprint or gameweek */}
        {!sprint && (
          <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-8 text-center">
            <p className="text-4xl mb-3">🏆</p>
            <p className="text-gray-400 font-medium">No active sprint</p>
            <p className="text-gray-600 text-sm mt-1">The next sprint is being prepared. Check back soon.</p>
          </div>
        )}

        {sprint && !gw && (
          <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-8 text-center">
            <p className="text-gray-400 font-medium">No active gameweek yet</p>
            <p className="text-gray-600 text-sm mt-1">The current sprint's gameweeks are being set up.</p>
          </div>
        )}

        {gw && (
          <>
            {/* Gameweek header */}
            <div className="bg-[#0d1117] border border-white/8 rounded-2xl px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-white font-semibold">Week {gw.sprint_week}</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Lock: {fmtFull(gw.lock_time)}
                  </p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  gw.status === 'PUBLISHED' ? 'bg-green-900/40 text-green-400' :
                  gw.status === 'LOCKED'    ? 'bg-yellow-900/40 text-yellow-400' :
                  gw.status === 'FINISHED'  ? 'bg-purple-900/40 text-purple-400' :
                  'bg-gray-800 text-gray-500'
                }`}>{gw.status}</span>
              </div>

              {/* Pick counter */}
              {!isLocked && (
                <>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-gray-500">Picks selected</span>
                    <div className="flex items-center gap-3">
                      {totalEnergy > 0 && (
                        <span className="text-yellow-500 font-mono font-bold text-[11px]">⚡{totalEnergy} energy</span>
                      )}
                      <span className={pickCount === 6 ? 'text-green-400 font-bold' : 'text-indigo-400 font-bold'}>
                        {pickCount}/6 {pickCount === 6 && '✓'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: 6 }, (_, i) => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full ${i < pickCount ? 'bg-indigo-500' : 'bg-white/10'}`} />
                    ))}
                  </div>
                </>
              )}

              {/* Settled entry summary */}
              {entry?.status === 'completed' && (
                <div className={`mt-3 rounded-xl p-3 flex items-center justify-between ${
                  entry.is_perfect_week ? 'bg-yellow-900/20 border border-yellow-500/30' : 'bg-white/5'
                }`}>
                  {entry.is_perfect_week && <p className="text-yellow-400 font-bold">⭐ PERFECT WEEK!</p>}
                  <div className="flex gap-4 text-center">
                    <div><p className="text-gray-500 text-[10px]">Correct</p><p className="text-green-400 font-bold">{entry.correct_picks}</p></div>
                    <div><p className="text-gray-500 text-[10px]">LP</p><p className="text-indigo-400 font-bold">{entry.league_points}</p></div>
                    {entry.perfect_week_bonus > 0 && <div><p className="text-gray-500 text-[10px]">Bonus</p><p className="text-yellow-400 font-bold">+{entry.perfect_week_bonus}</p></div>}
                  </div>
                </div>
              )}
            </div>

            {err && <p className="text-red-400 text-xs bg-red-900/20 rounded-xl px-4 py-2.5">{err}</p>}
            {msg && <p className="text-green-400 text-xs bg-green-900/20 rounded-xl px-4 py-2.5">{msg}</p>}

            {/* Events — before lock: all 15 to pick, after: my picks then rest dimmed */}
            {!isLocked ? (
              <div className="space-y-2.5">
                <p className="text-gray-500 text-xs font-medium tracking-wider uppercase">
                  {events.length} events — pick exactly 6
                </p>
                {eventsWithCounts.map(ev => (
                  <EventCard
                    key={ev.id} event={ev}
                    selectedOptionId={picks[ev.id]}
                    onSelect={handleSelect}
                    isLocked={false} dimmed={false}
                  />
                ))}
              </div>
            ) : (
              <>
                {/* My picks */}
                {myPickedEvents.length > 0 && (
                  <div className="space-y-2.5">
                    <p className="text-gray-400 text-xs font-semibold tracking-wider uppercase">Your picks</p>
                    {myPickedEvents.map(ev => (
                      <EventCard
                        key={ev.id} event={ev}
                        selectedOptionId={picks[ev.id]}
                        onSelect={handleSelect}
                        isLocked={true} dimmed={false}
                      />
                    ))}
                  </div>
                )}

                {/* Locked / no picks */}
                {isLocked && myPickedEvents.length === 0 && (
                  <div className="bg-yellow-900/15 border border-yellow-500/20 rounded-2xl p-5 text-center">
                    <p className="text-yellow-400 font-medium text-sm">🔒 Picks closed</p>
                    <p className="text-gray-500 text-xs mt-1">You didn't submit picks for this gameweek</p>
                  </div>
                )}

                {/* Other events — dimmed community view */}
                {unpickedEvents.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-gray-600 text-xs font-medium tracking-wider uppercase">
                      Other events in this matchweek
                    </p>
                    {unpickedEvents.map(ev => (
                      <EventCard
                        key={ev.id} event={ev}
                        selectedOptionId={null}
                        onSelect={() => {}}
                        isLocked={true} dimmed={true}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Submit CTA */}
            {!isLocked && (
              <button
                onClick={handleSubmit}
                disabled={pickCount !== 6 || submitting}
                className={`w-full py-4 rounded-2xl font-bold text-sm transition-all ${
                  pickCount === 6
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                    : 'bg-white/5 text-gray-600 cursor-not-allowed'
                } disabled:opacity-60`}
              >
                {submitting ? 'Saving…' : submitted ? '✓ Update picks' : `Submit ${pickCount}/6 picks`}
              </button>
            )}

            {/* Sprint leaderboard */}
            <SprintLeaderboard
              sprintId={sprint?.id}
              myUserId={status?.user?.id}
              myDivisionId={div?.division_id}
            />
          </>
        )}

        {/* Info footer */}
        <div className="text-xs text-gray-700 text-center pb-2">
          1 correct pick = +1 LP · 6/6 perfect = +10 LP
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
