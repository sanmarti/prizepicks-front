import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyLeagues, getLeagueMatchup, getLeagueCalendar, getWeekMatchups } from '../api/leagues'
import Spinner from '../components/ui/Spinner'

// ── Shared helpers ────────────────────────────────────────────────────────────
const PICK_STATUS_COLOR = { won: 'text-green-400', lost: 'text-red-400', live: 'text-amber-400', pending: 'text-gray-600' }
const PICK_STATUS_BG    = { won: 'bg-green-500/15 border-green-500/25', lost: 'bg-red-500/12 border-red-500/20', live: 'bg-amber-500/12 border-amber-500/20', pending: 'bg-white/4 border-white/8' }
const PICK_ICON         = { won: '✓', lost: '✗', live: '⏱', pending: '·' }

function Avatar({ url, name, size = 10 }) {
  return (
    <div className={`w-${size} h-${size} rounded-full bg-indigo-500/20 border border-indigo-500/25 flex items-center justify-center text-sm font-black flex-shrink-0 overflow-hidden`}>
      {url
        ? <img src={url} alt={name} className="w-full h-full object-cover" />
        : <span className="text-indigo-300 text-xs">{(name || '?')[0].toUpperCase()}</span>}
    </div>
  )
}

function ResultBadge({ pts }) {
  if (pts === 3) return <span className="text-[10px] font-black text-green-400 bg-green-500/15 border border-green-500/25 px-2 py-0.5 rounded-full">W</span>
  if (pts === 1) return <span className="text-[10px] font-black text-gray-400 bg-gray-500/15 border border-gray-500/25 px-2 py-0.5 rounded-full">D</span>
  if (pts === 0) return <span className="text-[10px] font-black text-red-400/70 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">L</span>
  return null
}

// ── PickBreakdown — shows fixture-by-fixture picks for a matchup ──────────────
function PickBreakdown({ homePicks, awayPicks, events, picksVisible, gwStatus }) {
  if (!picksVisible) {
    return (
      <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-6 text-center mt-4">
        <p className="text-gray-500 text-sm">🔒 Picks hidden until gameweek locks</p>
        <p className="text-gray-700 text-xs mt-1">Picks are revealed once the gameweek is locked to prevent copying.</p>
      </div>
    )
  }

  const myPickMap    = Object.fromEntries((homePicks || []).map(p => [p.event_id, p]))
  const rivalPickMap = Object.fromEntries((awayPicks  || []).map(p => [p.event_id, p]))
  const allEvents    = events?.length ? events : [...new Set([...(homePicks || []), ...(awayPicks || [])].map(p => p.event_id))].map(eid => {
    const p = myPickMap[eid] || rivalPickMap[eid]
    return { id: eid, fixture_name: p?.fixture_name, event_type: p?.event_type, match_time: p?.match_time }
  })

  if (!allEvents.length) return (
    <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-6 text-center mt-4">
      <p className="text-gray-500 text-sm">No picks submitted yet</p>
    </div>
  )

  return (
    <div className="bg-[#0d1117] border border-white/8 rounded-2xl overflow-hidden mt-4">
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <p className="text-gray-500 text-[11px] font-semibold tracking-widest uppercase">Pick by pick</p>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="text-green-400/70">✓ correct</span>
          <span className="text-red-400/70">✗ wrong</span>
        </div>
      </div>
      <div className="divide-y divide-white/4">
        {allEvents.map(ev => {
          const hp = myPickMap[ev.id]
          const ap = rivalPickMap[ev.id]
          const hs = hp?.pick_status || 'pending'
          const as_ = ap?.pick_status || 'pending'
          return (
            <div key={ev.id} className="px-4 py-3">
              <p className="text-white/50 text-[11px] font-medium mb-2 truncate">{ev.fixture_name}</p>
              <div className="flex items-center gap-2">
                <div className={`flex-1 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 border ${PICK_STATUS_BG[hs]}`}>
                  <span className={`text-[11px] font-black ${PICK_STATUS_COLOR[hs]}`}>{PICK_ICON[hs]}</span>
                  <span className="text-white text-[11px] truncate">{hp?.pick_label || '—'}</span>
                </div>
                <div className="w-8 text-center">
                  <span className="text-gray-700 text-[10px]">vs</span>
                </div>
                <div className={`flex-1 flex items-center justify-end gap-1.5 rounded-lg px-2.5 py-1.5 border ${PICK_STATUS_BG[as_]}`}>
                  <span className="text-white text-[11px] truncate text-right">{ap?.pick_label || '—'}</span>
                  <span className={`text-[11px] font-black ${PICK_STATUS_COLOR[as_]}`}>{PICK_ICON[as_]}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── MatchupDetail — VS card + breakdown (used for own and others' matchups) ───
function MatchupDetail({ m, myUserId, onBack, leagueName }) {
  const isHome     = m.home_user_id === myUserId
  const isAway     = m.away_user_id === myUserId
  const myScore    = isHome ? (m.homeCorrect ?? m.home_score) : isAway ? (m.awayCorrect ?? m.away_score) : null
  const rivalScore = isHome ? (m.awayCorrect ?? m.away_score) : isAway ? (m.homeCorrect ?? m.home_score) : null
  const settled    = m.status === 'SETTLED'
  const homePts    = m.home_league_points
  const awayPts    = m.away_league_points

  const outlook = myScore != null
    ? myScore > rivalScore ? 'You\'re winning' : myScore < rivalScore ? 'Rival leading' : 'Drawing'
    : null

  return (
    <div className="space-y-3">
      {/* Back */}
      <button onClick={onBack}
        className="flex items-center gap-1.5 text-gray-500 hover:text-white text-sm transition-colors mb-1">
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Week {m.league_week}
      </button>

      {/* VS hero */}
      <div className="relative rounded-2xl overflow-hidden border border-indigo-500/25 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950">
        <div className="relative p-5">
          <div className="flex justify-center mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
              Week {m.league_week} · {leagueName}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            {/* Home */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <Avatar url={m.home_avatar} name={m.home_name} size={12} />
              <p className="text-white text-xs font-bold truncate max-w-[80px] text-center">{m.home_name}</p>
              {m.picksVisible && (
                <p className={`text-3xl font-black tabular-nums ${homePts === 3 ? 'text-green-400' : homePts === 0 ? 'text-red-300/70' : 'text-white'}`}>
                  {m.homeCorrect ?? m.home_score ?? '—'}
                </p>
              )}
              {settled && <ResultBadge pts={homePts} />}
            </div>

            {/* VS */}
            <div className="flex-shrink-0 text-center">
              <p className="text-gray-600 text-xs font-black uppercase tracking-widest">vs</p>
              {settled && (
                <p className="text-gray-600 text-[10px] mt-1">FT</p>
              )}
            </div>

            {/* Away */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <Avatar url={m.away_avatar} name={m.away_name} size={12} />
              <p className="text-white text-xs font-bold truncate max-w-[80px] text-center">{m.away_name}</p>
              {m.picksVisible && (
                <p className={`text-3xl font-black tabular-nums ${awayPts === 3 ? 'text-green-400' : awayPts === 0 ? 'text-red-300/70' : 'text-white'}`}>
                  {m.awayCorrect ?? m.away_score ?? '—'}
                </p>
              )}
              {settled && <ResultBadge pts={awayPts} />}
            </div>
          </div>

          {outlook && !settled && (
            <p className="text-center text-xs text-indigo-300/60 mt-4">{outlook}</p>
          )}
        </div>
      </div>

      {/* Pick breakdown */}
      <PickBreakdown
        homePicks={m.homePicks}
        awayPicks={m.awayPicks}
        events={null}
        picksVisible={m.picksVisible}
        gwStatus={m.gw_status}
      />
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MatchupPage() {
  const navigate   = useNavigate()
  const [leagues,   setLeagues]   = useState([])
  const [selIdx,    setSelIdx]    = useState(0)
  const [myMatchup, setMyMatchup] = useState(null)   // current user's matchup
  const [calendar,  setCalendar]  = useState(null)
  const [tab,       setTab]       = useState('matchup')
  const [loading,   setLoading]   = useState(true)
  const [mLoading,  setMLoading]  = useState(false)

  // Current week all-matchups (for "This Week" tab)
  const [currentWeekMatchups, setCurrentWeekMatchups] = useState(null)

  // Week drill-down state
  const [drillWeek,    setDrillWeek]    = useState(null)    // week number being viewed
  const [weekMatchups, setWeekMatchups] = useState(null)    // all matchups for that week
  const [wLoading,     setWLoading]     = useState(false)
  const [detailMatch,  setDetailMatch]  = useState(null)    // single matchup being inspected

  useEffect(() => {
    getMyLeagues()
      .then(r => setLeagues(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const activeLeagues = leagues.filter(l => ['active','open'].includes(l.status))
  const displayLeague = activeLeagues[selIdx] ?? leagues[0]

  const loadData = useCallback(async (leagueId, currentWeek) => {
    if (!leagueId) return
    setMLoading(true)
    try {
      const calls = [getLeagueMatchup(leagueId), getLeagueCalendar(leagueId)]
      if (currentWeek > 0) calls.push(getWeekMatchups(leagueId, currentWeek))
      const [mRes, cRes, wRes] = await Promise.all(calls)
      setMyMatchup(mRes.data)
      setCalendar(cRes.data)
      if (wRes) setCurrentWeekMatchups(wRes.data)
    } catch {}
    finally { setMLoading(false) }
  }, [])

  useEffect(() => {
    if (displayLeague?.id) loadData(displayLeague.id, displayLeague.current_week ?? 0)
    else { setMyMatchup(null); setCalendar(null); setCurrentWeekMatchups(null) }
    setDrillWeek(null); setWeekMatchups(null); setDetailMatch(null)
  }, [displayLeague?.id, displayLeague?.current_week, loadData])

  const openWeek = useCallback(async (week) => {
    if (!displayLeague?.id) return
    setDrillWeek(week)
    setDetailMatch(null)
    setWLoading(true)
    try {
      const r = await getWeekMatchups(displayLeague.id, week)
      setWeekMatchups(r.data)
    } catch {}
    finally { setWLoading(false) }
  }, [displayLeague?.id])

  if (loading) return (
    <div className="min-h-screen bg-[#0a0d12] flex items-center justify-center"><Spinner size={32} /></div>
  )

  if (leagues.length === 0) return (
    <div className="min-h-screen bg-[#0a0d12] text-white flex flex-col items-center justify-center px-6 text-center gap-6">
      <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-4xl">⚔️</div>
      <div>
        <p className="text-white font-black text-xl">No active league</p>
        <p className="text-gray-500 text-sm mt-2 max-w-xs">Join or create a private league to track your head-to-head matchups.</p>
      </div>
      <button onClick={() => navigate('/leagues')}
        className="px-6 py-3 rounded-xl font-bold text-white text-sm"
        style={{ background: 'linear-gradient(90deg,#6366f1,#4f46e5)' }}>
        Go to Leagues
      </button>
    </div>
  )

  // ── Drill-down: single matchup detail ──
  if (detailMatch) return (
    <div className="min-h-screen bg-[#0a0d12] text-white pb-28">
      <div className="max-w-md mx-auto px-4 pt-safe-5 pt-6">
        <MatchupDetail
          m={detailMatch}
          myUserId={null}
          onBack={() => setDetailMatch(null)}
          leagueName={displayLeague?.name}
        />
      </div>
    </div>
  )

  // ── Drill-down: week matchups list ──
  if (drillWeek !== null) return (
    <div className="min-h-screen bg-[#0a0d12] text-white pb-28">
      <div className="max-w-md mx-auto px-4 pt-safe-5 pt-6">
        <button onClick={() => { setDrillWeek(null); setWeekMatchups(null) }}
          className="flex items-center gap-1.5 text-gray-500 hover:text-white text-sm transition-colors mb-4">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Calendar
        </button>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-black text-lg">Week {drillWeek}</h2>
          <span className="text-gray-500 text-xs">{displayLeague?.name}</span>
        </div>

        {wLoading ? (
          <div className="flex justify-center py-16"><Spinner size={28} /></div>
        ) : (
          <div className="space-y-3">
            {(weekMatchups?.matchups || []).map(m => {
              const settled = m.status === 'SETTLED'
              return (
                <button key={m.id} onClick={() => setDetailMatch(m)}
                  className="w-full bg-[#0d1117] border border-white/8 rounded-2xl p-4 hover:border-indigo-500/30 transition-all active:scale-[0.99] text-left">
                  <div className="flex items-center gap-3">
                    {/* Home */}
                    <div className="flex flex-col items-center gap-1.5 flex-1">
                      <Avatar url={m.home_avatar} name={m.home_name} size={10} />
                      <p className="text-white text-[11px] font-semibold truncate max-w-[70px] text-center">{m.home_name}</p>
                      {settled && <ResultBadge pts={m.home_league_points} />}
                    </div>

                    {/* Score / status */}
                    <div className="flex-shrink-0 text-center min-w-[52px]">
                      {settled && m.picksVisible ? (
                        <>
                          <p className="text-white font-black text-lg tabular-nums">{m.home_score} · {m.away_score}</p>
                          <p className="text-gray-600 text-[10px]">correct</p>
                        </>
                      ) : weekMatchups?.picksVisible ? (
                        <>
                          <p className="text-white font-black text-lg tabular-nums">{m.homeCorrect ?? '—'} · {m.awayCorrect ?? '—'}</p>
                          <p className="text-amber-400/70 text-[10px]">live</p>
                        </>
                      ) : (
                        <>
                          <p className="text-gray-600 text-xs">vs</p>
                          <p className="text-gray-700 text-[10px]">
                            {m.status === 'PENDING' ? 'Open' : m.status === 'SCHEDULED' ? 'Scheduled' : m.status}
                          </p>
                        </>
                      )}
                    </div>

                    {/* Away */}
                    <div className="flex flex-col items-center gap-1.5 flex-1">
                      <Avatar url={m.away_avatar} name={m.away_name} size={10} />
                      <p className="text-white text-[11px] font-semibold truncate max-w-[70px] text-center">{m.away_name}</p>
                      {settled && <ResultBadge pts={m.away_league_points} />}
                    </div>

                    <svg className="w-4 h-4 text-gray-700 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </button>
              )
            })}
            {!weekMatchups?.picksVisible && (
              <p className="text-center text-gray-700 text-xs py-2">Picks are revealed once the gameweek locks</p>
            )}
          </div>
        )}
      </div>
    </div>
  )

  // ── Main view ──
  return (
    <div className="min-h-screen bg-[#0a0d12] text-white pb-28">
      <div className="max-w-md mx-auto px-4 pt-safe-5">

        <div className="pt-6 pb-4">
          <h1 className="text-white text-2xl font-black">Matchup</h1>
          <p className="text-gray-500 text-sm mt-0.5">Head-to-head this week</p>
        </div>

        {/* League selector */}
        {activeLeagues.length > 1 && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1 no-scrollbar">
            {activeLeagues.map((l, i) => (
              <button key={l.id} onClick={() => setSelIdx(i)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  i === selIdx ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/4 border-white/10 text-gray-400'
                }`}>
                {l.name}
              </button>
            ))}
          </div>
        )}

        {/* Tab toggle */}
        <div className="flex gap-1 bg-white/3 border border-white/8 rounded-2xl p-1 mb-4">
          {[['matchup','⚔️ This Week'],['calendar','📅 Calendar']].map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                tab === t ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {mLoading ? (
          <div className="flex justify-center py-16"><Spinner size={28} /></div>
        ) : tab === 'matchup' ? (
          <MyMatchupTab
            data={myMatchup}
            league={displayLeague}
            allWeekMatchups={currentWeekMatchups}
            onViewMatchup={setDetailMatch}
          />
        ) : (
          <CalendarTab calendar={calendar} league={displayLeague} onWeekClick={openWeek} />
        )}
      </div>
    </div>
  )
}

// ── My Matchup tab ────────────────────────────────────────────────────────────
function MyMatchupTab({ data, league, allWeekMatchups, onViewMatchup }) {
  const { matchup: m, my_picks = [], rival_picks = [], rival, events = [] } = data || {}

  const myCorrect    = my_picks.filter(p => p.pick_status === 'won').length
  const rivalCorrect = rival_picks.filter(p => p.pick_status === 'won').length
  const myPending    = my_picks.filter(p => p.pick_status === 'pending').length
  const winning = myCorrect > rivalCorrect
  const drawing = myCorrect === rivalCorrect
  const settled = m?.status === 'SETTLED'

  const outlookText = !m ? null : settled
    ? (winning ? 'You won! +3 pts' : drawing ? 'Draw — +1 pt each' : 'Lost — +0 pts')
    : myPending > 0 ? `${myPending} fixtures to play`
    : winning ? 'Winning ↑' : drawing ? 'Drawing' : 'Behind ↓'

  const outlookColor = winning ? 'text-green-400' : drawing ? 'text-gray-400' : 'text-red-400'

  // Other matchups in the current week
  const myMatchupId = m?.id
  const otherMatchups = (allWeekMatchups?.matchups || []).filter(wm => wm.id !== myMatchupId)

  return (
    <div className="space-y-4">
      {/* VS hero card (own matchup) */}
      {m ? (
        <div className="rounded-2xl overflow-hidden border border-indigo-500/25 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950">
          <div className="p-5">
            <div className="flex justify-center mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
                Week {m.league_week} · {league?.name}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col items-center gap-2 flex-1">
                <Avatar url={null} name="Me" size={12} />
                <p className="text-white text-xs font-bold">You</p>
                <p className={`text-3xl font-black tabular-nums ${winning ? 'text-green-400' : !drawing ? 'text-red-300' : 'text-white'}`}>{myCorrect}</p>
                {settled && <ResultBadge pts={m.home_league_points} />}
              </div>
              <p className="text-gray-600 text-xs font-black uppercase tracking-widest flex-shrink-0">vs</p>
              <div className="flex flex-col items-center gap-2 flex-1">
                <Avatar url={rival?.avatar_url} name={rival?.display_name} size={12} />
                <p className="text-white text-xs font-bold truncate max-w-[80px] text-center">{rival?.display_name || 'Rival'}</p>
                <p className={`text-3xl font-black tabular-nums ${!winning && !drawing ? 'text-green-400' : 'text-white'}`}>{rivalCorrect}</p>
                {settled && <ResultBadge pts={m.away_league_points} />}
              </div>
            </div>
            {outlookText && <p className={`text-center text-xs font-bold mt-4 ${outlookColor}`}>{outlookText}</p>}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
          <div className="text-5xl">⏳</div>
          <p className="text-white font-bold">No matchup yet</p>
          <p className="text-gray-500 text-sm max-w-xs">
            {league?.status === 'open'
              ? 'The season hasn\'t started yet. The admin will generate the calendar and start week 1 soon.'
              : 'This week\'s matchup hasn\'t been assigned yet.'}
          </p>
        </div>
      )}

      {/* Pick breakdown (own matchup) */}
      {m && (
        <PickBreakdown
          homePicks={my_picks}
          awayPicks={rival_picks}
          events={events}
          picksVisible={true}
          gwStatus="PUBLISHED"
        />
      )}

      {/* ── Other matches this week ── */}
      {otherMatchups.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/6" />
            <p className="text-[10px] font-black tracking-widest text-gray-500 uppercase flex-shrink-0">Also this week</p>
            <div className="h-px flex-1 bg-white/6" />
          </div>
          {otherMatchups.map(wm => {
            const settled = wm.status === 'SETTLED'
            const picksVisible = allWeekMatchups?.picksVisible || settled
            return (
              <button key={wm.id} onClick={() => onViewMatchup(wm)}
                className="w-full bg-[#0d1117] border border-white/8 rounded-2xl px-4 py-3 hover:border-indigo-500/25 hover:bg-indigo-950/10 transition-all active:scale-[0.99] text-left">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-white/8 border border-white/10 flex items-center justify-center text-[11px] font-black text-gray-300 flex-shrink-0 overflow-hidden">
                      {wm.home_avatar ? <img src={wm.home_avatar} alt="" className="w-full h-full object-cover" /> : (wm.home_name || '?')[0].toUpperCase()}
                    </div>
                    <span className={`text-xs font-semibold truncate ${settled && wm.home_league_points === 3 ? 'text-white' : 'text-gray-400'}`}>{wm.home_name}</span>
                    {settled && <ResultBadge pts={wm.home_league_points} />}
                  </div>
                  <div className="flex-shrink-0 text-center min-w-[44px]">
                    {picksVisible && wm.homeCorrect != null ? (
                      <p className="text-white font-black text-sm tabular-nums">{wm.homeCorrect} · {wm.awayCorrect}</p>
                    ) : (
                      <p className="text-gray-600 text-xs">vs</p>
                    )}
                    <p className="text-[9px] text-gray-700 mt-0.5">{settled ? 'FT' : wm.status === 'PENDING' ? 'Open' : 'Sched.'}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                    {settled && <ResultBadge pts={wm.away_league_points} />}
                    <span className={`text-xs font-semibold truncate text-right ${settled && wm.away_league_points === 3 ? 'text-white' : 'text-gray-400'}`}>{wm.away_name}</span>
                    <div className="w-7 h-7 rounded-full bg-white/8 border border-white/10 flex items-center justify-center text-[11px] font-black text-gray-300 flex-shrink-0 overflow-hidden">
                      {wm.away_avatar ? <img src={wm.away_avatar} alt="" className="w-full h-full object-cover" /> : (wm.away_name || '?')[0].toUpperCase()}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-1.5">
                  <span className="text-[9px] text-gray-700">View picks →</span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Calendar tab ──────────────────────────────────────────────────────────────
function CalendarTab({ calendar, league, onWeekClick }) {
  if (!calendar?.calendar || !Object.keys(calendar.calendar).length) return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
      <div className="text-5xl">📅</div>
      <p className="text-white font-bold">No calendar yet</p>
      <p className="text-gray-500 text-sm">The admin will generate the season schedule once all players have joined.</p>
    </div>
  )

  const weeks = Object.keys(calendar.calendar).map(Number).sort((a, b) => a - b)
  const currentWeek = league?.current_week ?? 0

  return (
    <div className="space-y-3">
      {league?.total_weeks > 0 && (
        <div className="bg-[#0d1117] border border-white/8 rounded-2xl px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-500 text-[11px] font-semibold uppercase tracking-widest">Season</p>
            <p className="text-indigo-300 text-xs font-bold">Week {currentWeek} / {league.total_weeks}</p>
          </div>
          <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min((currentWeek / league.total_weeks) * 100, 100)}%` }} />
          </div>
        </div>
      )}

      {weeks.map(week => {
        const matches = calendar.calendar[week] || []
        const isCurrent = week === currentWeek
        const settled   = matches.every(m => m.status === 'SETTLED')
        return (
          <button key={week} onClick={() => onWeekClick(week)}
            className={`w-full text-left bg-[#0d1117] border rounded-2xl overflow-hidden hover:border-indigo-500/30 transition-all active:scale-[0.99] ${isCurrent ? 'border-indigo-500/30' : 'border-white/8'}`}>
            <div className={`px-4 py-2.5 border-b border-white/5 flex items-center justify-between ${isCurrent ? 'bg-indigo-500/8' : ''}`}>
              <p className={`text-[11px] font-black uppercase tracking-widest ${isCurrent ? 'text-indigo-400' : 'text-gray-500'}`}>
                Week {week}
              </p>
              <div className="flex items-center gap-2">
                {isCurrent && <span className="text-[9px] font-black text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded-full">Current</span>}
                {settled && <span className="text-[9px] font-black text-green-400/70 bg-green-500/10 px-2 py-0.5 rounded-full">Settled</span>}
                <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>
            <div className="divide-y divide-white/4">
              {matches.map(m => (
                <div key={m.id} className="flex items-center gap-3 px-4 py-2.5">
                  <p className="flex-1 text-white text-xs font-medium truncate text-right">{m.home_name}</p>
                  <div className="flex-shrink-0 text-center w-12">
                    {m.status === 'SETTLED'
                      ? <p className="text-white font-black text-xs tabular-nums">{m.home_score} – {m.away_score}</p>
                      : <p className="text-gray-600 text-xs">vs</p>}
                  </div>
                  <p className="flex-1 text-white text-xs font-medium truncate">{m.away_name}</p>
                </div>
              ))}
            </div>
          </button>
        )
      })}
    </div>
  )
}
