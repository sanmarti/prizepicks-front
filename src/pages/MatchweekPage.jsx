import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
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
function fmtFull(d)   { return fmt(d, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }

// ── Week navigation bar ────────────────────────────────────────────────────────
function WeekNav({ gwCount, byWeek, selectedWeek, currentWeek, onSelect }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: gwCount }, (_, i) => i + 1).map(w => {
        const gw         = byWeek[w]
        const isSelected = w === selectedWeek
        const isCurrent  = w === currentWeek
        const done       = gw?.status === 'FINISHED'
        const locked     = gw?.status === 'LOCKED'
        const open       = gw?.status === 'PUBLISHED'

        return (
          <button
            key={w}
            onClick={() => gw && onSelect(w)}
            disabled={!gw}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-[11px] font-semibold border transition-all ${
              isSelected
                ? 'bg-indigo-600/25 border-indigo-500/50 text-indigo-300'
                : isCurrent
                  ? 'bg-white/8 border-white/20 text-white'
                  : gw
                    ? 'bg-white/4 border-white/8 text-gray-500 hover:text-gray-300 hover:bg-white/8'
                    : 'bg-white/2 border-transparent text-gray-800 cursor-not-allowed'
            }`}
          >
            <span>W{w}</span>
            {isCurrent && (
              <span className={`text-[8px] font-bold tracking-widest ${isSelected ? 'text-indigo-400' : 'text-indigo-500'}`}>NOW</span>
            )}
            {!isCurrent && (
              <span className={`w-1.5 h-1.5 rounded-full ${
                done ? 'bg-purple-400' : locked ? 'bg-yellow-400' : open ? 'bg-green-400' : gw ? 'bg-gray-700' : 'bg-transparent'
              }`} />
            )}
          </button>
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
        ? 'bg-white/2 border-white/5 opacity-55'
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
        {dimmed && <span className="text-gray-700 text-xs ml-2 flex-shrink-0">{open ? '▲' : '▼'}</span>}
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
                  lost ? 'bg-red-900/10 border border-red-500/15 text-red-400 opacity-50' :
                  isSelected
                    ? 'bg-indigo-600 border border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                    : dimmed
                      ? 'bg-white/5 border border-white/8 text-gray-500'
                      : 'bg-white/5 border border-white/8 text-gray-300 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                {pct !== null && (
                  <span className="absolute inset-0 rounded-xl opacity-10" style={{
                    background: won ? '#22c55e' : isSelected ? '#6366f1' : '#ffffff',
                    width: `${pct}%`,
                  }} />
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

  const myIdx  = data.rows.findIndex(r => r.user_id === myUserId)
  const promLP = data.division?.promotion_min_points
  const relLP  = data.division?.relegation_max_points
  const start  = Math.max(0, myIdx - 2)
  const end    = Math.min(data.rows.length, myIdx + 3)
  const shown  = data.rows.slice(start, end)
  const myLP   = data.rows[myIdx]?.total_league_points ?? 0

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
      {start > 0 && <p className="text-center text-gray-700 text-xs py-1.5">· · · {start} above · · ·</p>}
      <div>
        {shown.map((r, i) => {
          const rank    = start + i + 1
          const isMe    = r.user_id === myUserId
          const isPromo = promLP !== null && r.total_league_points >= promLP
          const isRel   = relLP  !== null && r.total_league_points <= relLP
          return (
            <div key={r.user_id} className={`flex items-center gap-3 px-4 py-2.5 border-b border-white/5 last:border-0 ${isMe ? 'bg-indigo-900/20' : ''}`}>
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
                {r.display_name || 'Player'}{isMe && <span className="text-indigo-400 text-xs ml-1">← you</span>}
              </span>
              <span className={`text-sm font-bold flex-shrink-0 ${isPromo ? 'text-green-400' : isRel ? 'text-red-400' : 'text-indigo-400'}`}>
                {r.total_league_points} LP
              </span>
            </div>
          )
        })}
      </div>
      {end < data.rows.length && <p className="text-center text-gray-700 text-xs py-1.5">· · · {data.rows.length - end} below · · ·</p>}
      {relLP !== null && (
        <div className="px-4 py-2 bg-red-900/10 border-t border-red-500/10 flex items-center justify-between text-xs">
          <span className="text-red-400">⬇ Relegation ≤{relLP} LP</span>
          {myLP <= relLP && <span className="text-red-400 font-semibold">You're at risk!</span>}
        </div>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function MatchweekPage() {
  const [status,      setStatus]      = useState(null)
  const [gwData,      setGwData]      = useState(null)
  const [community,   setCommunity]   = useState(null)
  const [picks,       setPicks]       = useState({})
  const [submitting,  setSubmitting]  = useState(false)
  const [submitted,   setSubmitted]   = useState(false)
  const [msg,         setMsg]         = useState('')
  const [err,         setErr]         = useState('')
  const [loading,     setLoading]     = useState(true)
  const [gwLoading,   setGwLoading]   = useState(false)
  const [selectedWeek, setSelectedWeek] = useState(null)

  const loadStatus = useCallback(() =>
    getGloryStatus().then(r => { setStatus(r.data); return r.data }).catch(() => null)
  , [])

  const loadGw = useCallback((gwId) => {
    if (!gwId) return
    setGwLoading(true)
    setPicks({}); setSubmitted(false); setCommunity(null); setErr(''); setMsg('')
    getGloryGameweek(gwId).then(r => {
      setGwData(r.data)
      if (r.data.my_picks?.length) {
        const existing = {}
        for (const p of r.data.my_picks) existing[p.event_id] = p.event_option_id
        setPicks(existing); setSubmitted(true)
      }
      const locked = r.data.gameweek?.status === 'LOCKED' || r.data.gameweek?.status === 'FINISHED'
      if (locked) {
        getCommunityPicks(gwId).then(r => setCommunity(r.data)).catch(() => {})
      }
    }).catch(() => {}).finally(() => setGwLoading(false))
  }, [])

  // Initial load
  useEffect(() => {
    setLoading(true)
    loadStatus().then(st => {
      if (!st) { setLoading(false); return }
      const current = st.current_gameweek
      const currentWeek = current?.sprint_week ?? 1
      setSelectedWeek(currentWeek)
      if (current?.id) loadGw(current.id)
      setLoading(false)
    })
  }, [loadStatus, loadGw])

  // When selected week changes after initial load, find and load that gameweek
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    if (!status || selectedWeek === null) return
    const gw = (status.sprint?.gameweeks || []).find(g => g.sprint_week === selectedWeek)
    if (gw?.id) loadGw(gw.id)
    else { setGwData(null) }
  }, [selectedWeek]) // eslint-disable-line react-hooks/exhaustive-deps

  const sprint   = status?.sprint
  const div      = status?.division
  const prog     = status?.sprint_progress
  const lp       = prog?.total_league_points ?? 0
  const gwCount  = sprint?.gameweek_count || 4
  const gwList   = sprint?.gameweeks || []
  const byWeek   = useMemo(() => Object.fromEntries(gwList.map(g => [g.sprint_week, g])), [gwList])
  const currentWeek = status?.current_gameweek?.sprint_week

  const gw       = gwData?.gameweek
  const isLocked = gwData?.is_locked ?? false
  const entry    = gwData?.my_entry
  const events   = gw?.events || []
  const pickCount = Object.keys(picks).length

  const totalEnergy = useMemo(() => {
    let sum = 0
    for (const ev of events) {
      const opt = ev.options?.find(o => o.id === picks[ev.id])
      if (opt?.energy_cost) sum += opt.energy_cost
    }
    return sum
  }, [picks, events])

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
      return { ...e, options: e.options.map(o => { const co = c.options.find(x => x.id === o.id); return { ...o, pick_count: co?.pick_count ?? 0 } }), total_picks: c.total_picks }
    })
  }, [events, community])

  const myPickedEvents = eventsWithCounts.filter(e => picks[e.id])
  const unpickedEvents = eventsWithCounts.filter(e => !picks[e.id])

  const handleSelect = (eventId, optionId) => {
    if (isLocked) return
    setPicks(prev => { const n = { ...prev }; if (n[eventId] === optionId) delete n[eventId]; else n[eventId] = optionId; return n })
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

  return (
    <div className="min-h-screen bg-[#0a0d12] text-white pb-24">
      <div className="max-w-md mx-auto px-4 pt-5 space-y-4">

        {/* Sprint header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-[11px] tracking-widest uppercase">{sprint?.name || '6 to Glory'}</p>
            <h1 className="text-white text-xl font-bold mt-0.5">{div?.icon} {div?.division_name || 'Academy'}</h1>
          </div>
          <div className="text-right">
            <p className="text-indigo-400 font-black text-2xl">{lp}</p>
            <p className="text-gray-600 text-[11px]">League Points</p>
          </div>
        </div>

        {/* No active sprint */}
        {!sprint && (
          <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-8 text-center">
            <p className="text-4xl mb-3">🏆</p>
            <p className="text-gray-400 font-medium">No active sprint</p>
            <p className="text-gray-600 text-sm mt-1">The next sprint is being prepared. Check back soon.</p>
          </div>
        )}

        {sprint && (
          <>
            {/* Week navigation */}
            <WeekNav
              gwCount={gwCount}
              byWeek={byWeek}
              selectedWeek={selectedWeek}
              currentWeek={currentWeek}
              onSelect={setSelectedWeek}
            />

            {/* Week header with prev/next */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => setSelectedWeek(w => Math.max(1, w - 1))}
                disabled={selectedWeek <= 1}
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-gray-400 disabled:opacity-25 hover:bg-white/10 transition-colors flex-shrink-0"
              >
                ←
              </button>
              <div className="flex-1 text-center">
                <p className="text-white font-bold text-base">Gameweek {selectedWeek}</p>
                {selectedWeek === currentWeek && (
                  <p className="text-indigo-400 text-[10px] font-semibold tracking-widest">CURRENT WEEK</p>
                )}
                {selectedWeek !== currentWeek && gw && (
                  <p className="text-gray-600 text-[10px]">{gw.status}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedWeek(w => Math.min(gwCount, w + 1))}
                disabled={selectedWeek >= gwCount || !byWeek[selectedWeek + 1]}
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-gray-400 disabled:opacity-25 hover:bg-white/10 transition-colors flex-shrink-0"
              >
                →
              </button>
            </div>

            {/* Loading state for week switch */}
            {gwLoading && (
              <div className="flex items-center justify-center py-10 gap-2 text-gray-600 text-sm">
                <div className="w-4 h-4 border border-gray-700 border-t-indigo-400 rounded-full animate-spin" />
                Loading gameweek…
              </div>
            )}

            {/* Week not yet created */}
            {!gwLoading && !gw && byWeek[selectedWeek] === undefined && (
              <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-8 text-center">
                <p className="text-gray-500 text-sm font-medium">Gameweek {selectedWeek} not yet set up</p>
                <p className="text-gray-700 text-xs mt-1">Events will appear here once the admin publishes this week</p>
              </div>
            )}

            {!gwLoading && gw && (
              <>
                {/* Gameweek detail card */}
                <div className="bg-[#0d1117] border border-white/8 rounded-2xl px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-gray-500 text-xs">Lock: {fmtFull(gw.lock_time)}</p>
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

                  {/* Settled entry */}
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

                {/* Events */}
                {!isLocked ? (
                  <div className="space-y-2.5">
                    <p className="text-gray-500 text-xs font-medium tracking-wider uppercase">
                      {events.length} events — pick exactly 6
                    </p>
                    {eventsWithCounts.map(ev => (
                      <EventCard key={ev.id} event={ev} selectedOptionId={picks[ev.id]}
                        onSelect={handleSelect} isLocked={false} dimmed={false} />
                    ))}
                  </div>
                ) : (
                  <>
                    {myPickedEvents.length > 0 && (
                      <div className="space-y-2.5">
                        <p className="text-gray-400 text-xs font-semibold tracking-wider uppercase">Your picks</p>
                        {myPickedEvents.map(ev => (
                          <EventCard key={ev.id} event={ev} selectedOptionId={picks[ev.id]}
                            onSelect={handleSelect} isLocked={true} dimmed={false} />
                        ))}
                      </div>
                    )}

                    {isLocked && myPickedEvents.length === 0 && (
                      <div className="bg-yellow-900/15 border border-yellow-500/20 rounded-2xl p-5 text-center">
                        <p className="text-yellow-400 font-medium text-sm">🔒 Picks closed</p>
                        <p className="text-gray-500 text-xs mt-1">You didn't submit picks for this gameweek</p>
                      </div>
                    )}

                    {unpickedEvents.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-gray-600 text-xs font-medium tracking-wider uppercase">Other events</p>
                        {unpickedEvents.map(ev => (
                          <EventCard key={ev.id} event={ev} selectedOptionId={null}
                            onSelect={() => {}} isLocked={true} dimmed={true} />
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

                {/* Division standings */}
                <SprintLeaderboard
                  sprintId={sprint?.id}
                  myUserId={status?.user?.id}
                  myDivisionId={div?.division_id}
                />
              </>
            )}
          </>
        )}

        <div className="text-xs text-gray-700 text-center pb-2">
          1 correct pick = +1 LP · 6/6 perfect = +10 LP
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
