import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyLeagues, getLeagueMatchup, getLeagueCalendar } from '../api/leagues'
import Spinner from '../components/ui/Spinner'

const PICK_STATUS_COLOR = {
  won:     'text-green-400',
  lost:    'text-red-400',
  live:    'text-amber-400',
  pending: 'text-gray-600',
}

const PICK_STATUS_BG = {
  won:     'bg-green-500/15 border-green-500/25',
  lost:    'bg-red-500/12 border-red-500/20',
  live:    'bg-amber-500/12 border-amber-500/20',
  pending: 'bg-white/4 border-white/8',
}

const PICK_ICON = {
  won:     '✓',
  lost:    '✗',
  live:    '⏱',
  pending: '·',
}

function Avatar({ url, name, size = 10 }) {
  const cls = `w-${size} h-${size} rounded-full bg-indigo-500/20 border border-indigo-500/25 flex items-center justify-center text-sm font-black flex-shrink-0 overflow-hidden`
  return (
    <div className={cls}>
      {url
        ? <img src={url} alt={name} className="w-full h-full object-cover" />
        : <span className="text-indigo-300">{(name || '?')[0].toUpperCase()}</span>}
    </div>
  )
}

function OutcomeBadge({ outcome }) {
  if (!outcome) return null
  const map = {
    win:  { label: 'Win',  cls: 'bg-green-500/20 text-green-400 border-green-500/30' },
    draw: { label: 'Draw', cls: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
    loss: { label: 'Loss', cls: 'bg-red-500/15 text-red-400 border-red-500/25' },
  }
  const o = map[outcome]
  if (!o) return null
  return (
    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${o.cls}`}>{o.label}</span>
  )
}

export default function MatchupPage() {
  const navigate = useNavigate()
  const [leagues,  setLeagues]  = useState([])
  const [selIdx,   setSelIdx]   = useState(0)
  const [matchup,  setMatchup]  = useState(null)
  const [calendar, setCalendar] = useState(null)
  const [tab,      setTab]      = useState('matchup') // 'matchup' | 'calendar'
  const [loading,  setLoading]  = useState(true)
  const [mLoading, setMLoading] = useState(false)

  // Load my leagues
  useEffect(() => {
    getMyLeagues()
      .then(r => setLeagues(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const activeLeague = leagues.filter(l => l.status === 'active' || l.status === 'open')[selIdx] ?? leagues[selIdx]

  const loadMatchup = useCallback(async (leagueId) => {
    if (!leagueId) return
    setMLoading(true)
    try {
      const [mRes, cRes] = await Promise.all([
        getLeagueMatchup(leagueId),
        getLeagueCalendar(leagueId),
      ])
      setMatchup(mRes.data)
      setCalendar(cRes.data)
    } catch {}
    finally { setMLoading(false) }
  }, [])

  useEffect(() => {
    if (activeLeague?.id) loadMatchup(activeLeague.id)
    else { setMatchup(null); setCalendar(null) }
  }, [activeLeague?.id, loadMatchup])

  if (loading) return (
    <div className="min-h-screen bg-[#0a0d12] flex items-center justify-center">
      <Spinner size={32} />
    </div>
  )

  // No active leagues
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

  const leagueOptions = leagues.filter(l => l.status === 'active' || l.status === 'open')
  const displayLeague = leagueOptions[selIdx] ?? leagues[0]

  return (
    <div className="min-h-screen bg-[#0a0d12] text-white pb-28">
      <div className="max-w-md mx-auto px-4 pt-safe-5">

        {/* Header */}
        <div className="pt-6 pb-4">
          <h1 className="text-white text-2xl font-black">Matchup</h1>
          <p className="text-gray-500 text-sm mt-0.5">Head-to-head this week</p>
        </div>

        {/* League selector (if multiple active leagues) */}
        {leagueOptions.length > 1 && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1 no-scrollbar">
            {leagueOptions.map((l, i) => (
              <button key={l.id} onClick={() => setSelIdx(i)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  i === selIdx
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-white/4 border-white/10 text-gray-400'
                }`}>
                {l.name}
              </button>
            ))}
          </div>
        )}

        {/* Tab toggle */}
        <div className="flex gap-1 bg-white/3 border border-white/8 rounded-2xl p-1 mb-4">
          {['matchup', 'calendar'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors capitalize ${
                tab === t ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}>
              {t === 'matchup' ? '⚔️ This Week' : '📅 Calendar'}
            </button>
          ))}
        </div>

        {mLoading ? (
          <div className="flex justify-center py-16"><Spinner size={28} /></div>
        ) : tab === 'matchup' ? (
          <MatchupTab matchup={matchup} league={displayLeague} />
        ) : (
          <CalendarTab calendar={calendar} league={displayLeague} />
        )}

      </div>
    </div>
  )
}

// ── This Week tab ─────────────────────────────────────────────────────────────
function MatchupTab({ matchup, league }) {
  if (!matchup?.matchup) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <div className="text-5xl">⏳</div>
        <div>
          <p className="text-white font-bold">No matchup yet</p>
          <p className="text-gray-500 text-sm mt-1 max-w-xs">
            {league?.status === 'open'
              ? 'The league calendar hasn\'t been generated yet. The admin will start the season soon.'
              : 'This week\'s matchup hasn\'t been assigned yet.'}
          </p>
        </div>
      </div>
    )
  }

  const { matchup: m, my_picks = [], rival_picks = [], rival, events = [] } = matchup
  const isHome = !rival || m.home_user_id !== m.away_user_id
  const myCorrect     = my_picks.filter(p => p.pick_status === 'won').length
  const rivalCorrect  = rival_picks.filter(p => p.pick_status === 'won').length
  const myPending     = my_picks.filter(p => p.pick_status === 'pending').length
  const rivalPending  = rival_picks.filter(p => p.pick_status === 'pending').length

  const winning = myCorrect > rivalCorrect
  const drawing = myCorrect === rivalCorrect
  const losing  = myCorrect < rivalCorrect

  const outlook = myPending > 0 && rivalPending > 0 ? 'Live tracking'
    : winning ? 'You\'re winning — +3 pts'
    : drawing ? 'It\'s a draw — +1 pt each'
    : 'Rival winning — +0 pts'

  const outlookColor = myPending > 0 && rivalPending > 0 ? 'text-amber-400'
    : winning ? 'text-green-400' : drawing ? 'text-gray-400' : 'text-red-400'

  // Build a map of event_id → picks for each player
  const myPickMap    = Object.fromEntries(my_picks.map(p => [p.event_id, p]))
  const rivalPickMap = Object.fromEntries(rival_picks.map(p => [p.event_id, p]))

  return (
    <div className="space-y-4">
      {/* VS Hero card */}
      <div className="relative rounded-2xl overflow-hidden border border-indigo-500/25 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40 pointer-events-none" />
        <div className="relative p-5">
          {/* Week badge */}
          <div className="flex justify-center mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
              Week {m.league_week} · {league?.name}
            </span>
          </div>

          {/* Players + score */}
          <div className="flex items-center justify-between gap-3">
            {/* Me */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <Avatar url={null} name="Me" size={12} />
              <p className="text-white text-xs font-bold">You</p>
              <p className={`text-3xl font-black tabular-nums ${winning ? 'text-green-400' : losing ? 'text-red-300' : 'text-white'}`}>
                {myCorrect}
              </p>
              <p className="text-gray-600 text-[10px]">{my_picks.length} picks</p>
            </div>

            {/* VS divider */}
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <p className="text-gray-600 text-xs font-black uppercase tracking-widest">vs</p>
              {m.status === 'SETTLED' && (
                <OutcomeBadge outcome={winning ? 'win' : drawing ? 'draw' : 'loss'} />
              )}
            </div>

            {/* Rival */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <Avatar url={rival?.avatar_url} name={rival?.display_name} size={12} />
              <p className="text-white text-xs font-bold truncate max-w-[80px] text-center">{rival?.display_name || 'Rival'}</p>
              <p className={`text-3xl font-black tabular-nums ${!winning && !drawing ? 'text-red-400' : losing ? 'text-green-400' : 'text-white'}`}>
                {rivalCorrect}
              </p>
              <p className="text-gray-600 text-[10px]">{rival_picks.length} picks</p>
            </div>
          </div>

          {/* Outlook */}
          <div className="mt-4 text-center">
            <p className={`text-xs font-bold ${outlookColor}`}>{outlook}</p>
            {(myPending > 0 || rivalPending > 0) && (
              <p className="text-gray-600 text-[10px] mt-0.5">{myPending} fixtures still to play</p>
            )}
          </div>
        </div>
      </div>

      {/* Fixture-by-fixture breakdown */}
      {events.length > 0 && (
        <div className="bg-[#0d1117] border border-white/8 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <p className="text-gray-500 text-[11px] font-semibold tracking-widest uppercase">Pick-by-pick</p>
            <div className="flex items-center gap-3 text-[10px] text-gray-600">
              <span className="text-green-400/70">✓ correct</span>
              <span className="text-red-400/70">✗ wrong</span>
              <span>· pending</span>
            </div>
          </div>
          <div className="divide-y divide-white/4">
            {events.map(ev => {
              const myPick    = myPickMap[ev.id]
              const rivalPick = rivalPickMap[ev.id]
              const myStatus  = myPick?.pick_status || 'pending'
              const rvStatus  = rivalPick?.pick_status || 'pending'
              return (
                <div key={ev.id} className="px-4 py-3">
                  {/* Fixture name */}
                  <p className="text-white/60 text-[11px] font-medium mb-2 truncate">{ev.fixture_name}</p>
                  <div className="flex items-center gap-2">
                    {/* My pick */}
                    <div className={`flex-1 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 border ${PICK_STATUS_BG[myStatus]}`}>
                      <span className={`text-[11px] font-black ${PICK_STATUS_COLOR[myStatus]}`}>{PICK_ICON[myStatus]}</span>
                      <span className="text-white text-[11px] font-medium truncate">{myPick?.pick_label || '—'}</span>
                    </div>
                    {/* Middle: event status */}
                    <div className="flex-shrink-0 text-center w-10">
                      <span className={`text-[9px] font-bold uppercase ${ev.status === 'LIVE' ? 'text-amber-400' : ev.status === 'FINISHED' ? 'text-gray-500' : 'text-gray-700'}`}>
                        {ev.status === 'LIVE' ? 'Live' : ev.status === 'FINISHED' ? 'FT' : '—'}
                      </span>
                    </div>
                    {/* Rival pick */}
                    <div className={`flex-1 flex items-center justify-end gap-1.5 rounded-lg px-2.5 py-1.5 border ${PICK_STATUS_BG[rvStatus]}`}>
                      <span className="text-white text-[11px] font-medium truncate text-right">{rivalPick?.pick_label || '—'}</span>
                      <span className={`text-[11px] font-black ${PICK_STATUS_COLOR[rvStatus]}`}>{PICK_ICON[rvStatus]}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* If no picks yet */}
      {events.length === 0 && (
        <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-6 text-center">
          <p className="text-gray-500 text-sm">Picks haven't been submitted yet</p>
          <p className="text-gray-700 text-xs mt-1">Head to the Gameweek tab to submit your picks</p>
        </div>
      )}
    </div>
  )
}

// ── Calendar tab ──────────────────────────────────────────────────────────────
function CalendarTab({ calendar, league }) {
  if (!calendar?.calendar || Object.keys(calendar.calendar).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <div className="text-5xl">📅</div>
        <div>
          <p className="text-white font-bold">No calendar yet</p>
          <p className="text-gray-500 text-sm mt-1">The season calendar will appear once the admin generates it.</p>
        </div>
      </div>
    )
  }

  const weeks = Object.keys(calendar.calendar).map(Number).sort((a, b) => a - b)
  const currentWeek = league?.current_week ?? 0

  return (
    <div className="space-y-3">
      {/* Season progress */}
      {league?.total_weeks > 0 && (
        <div className="bg-[#0d1117] border border-white/8 rounded-2xl px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-500 text-[11px] font-semibold uppercase tracking-widest">Season progress</p>
            <p className="text-indigo-300 text-xs font-bold">Week {currentWeek} of {league.total_weeks}</p>
          </div>
          <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full transition-all"
              style={{ width: `${Math.min((currentWeek / league.total_weeks) * 100, 100)}%` }} />
          </div>
        </div>
      )}

      {/* Week-by-week */}
      {weeks.map(week => {
        const matches = calendar.calendar[week] || []
        const isCurrent = week === currentWeek
        return (
          <div key={week} className={`bg-[#0d1117] border rounded-2xl overflow-hidden ${isCurrent ? 'border-indigo-500/30' : 'border-white/8'}`}>
            <div className={`px-4 py-2.5 border-b border-white/5 flex items-center justify-between ${isCurrent ? 'bg-indigo-500/8' : ''}`}>
              <p className={`text-[11px] font-black uppercase tracking-widest ${isCurrent ? 'text-indigo-400' : 'text-gray-500'}`}>
                Week {week}
              </p>
              {isCurrent && <span className="text-[9px] font-black text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded-full">Current</span>}
            </div>
            <div className="divide-y divide-white/4">
              {matches.map(m => {
                const settled = m.status === 'SETTLED'
                return (
                  <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-semibold truncate">{m.home_name}</p>
                      {m.home_league_points != null && (
                        <p className={`text-[10px] font-black ${m.home_league_points === 3 ? 'text-green-400' : m.home_league_points === 1 ? 'text-gray-400' : 'text-red-400/60'}`}>
                          {m.home_league_points === 3 ? 'W' : m.home_league_points === 1 ? 'D' : 'L'}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-center min-w-[48px]">
                      {settled ? (
                        <p className="text-white font-black text-sm tabular-nums">{m.home_score} · {m.away_score}</p>
                      ) : (
                        <p className="text-gray-600 text-xs">vs</p>
                      )}
                      <p className="text-gray-700 text-[9px]">{settled ? 'FT' : m.status === 'PENDING' ? 'Open' : 'Sched.'}</p>
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                      <p className="text-white text-xs font-semibold truncate">{m.away_name}</p>
                      {m.away_league_points != null && (
                        <p className={`text-[10px] font-black ${m.away_league_points === 3 ? 'text-green-400' : m.away_league_points === 1 ? 'text-gray-400' : 'text-red-400/60'}`}>
                          {m.away_league_points === 3 ? 'W' : m.away_league_points === 1 ? 'D' : 'L'}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
