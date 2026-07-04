import { useState, useEffect, useCallback, useRef } from 'react'
import { getScores } from '../api/competitions'
import { getFixtureStats } from '../api/glory'
import BottomNav from '../components/layout/BottomNav'
import TopBar from '../components/layout/TopBar'

const LIVE_STATUSES   = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'SUSP', 'INT', 'LIVE'])
const DONE_STATUSES   = new Set(['FT', 'AET', 'PEN', 'AWD', 'WO'])
const CANCEL_STATUSES = new Set(['PST', 'CANC', 'ABD'])

const ALL_STATS = [
  'Ball Possession',
  'Total Shots',
  'Shots on Goal',
  'Shots off Goal',
  'Blocked Shots',
  'Corner Kicks',
  'Fouls',
  'Yellow Cards',
  'Red Cards',
  'Offsides',
  'Goalkeeper Saves',
  'Total passes',
  'Passes accurate',
]

function toDateStr(d) { return d.toISOString().slice(0, 10) }
function offsetDate(days) {
  const d = new Date(); d.setDate(d.getDate() + days); return toDateStr(d)
}
function elapsedStr(ev) {
  return `${ev.elapsed}${ev.extra ? `+${ev.extra}` : ''}'`
}

// ── Rich match detail panel ────────────────────────────────────────────────────
function MatchDetail({ fix, data, loading }) {
  const [tab, setTab] = useState('events')

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 gap-2 text-gray-600 text-xs">
        <div className="w-4 h-4 border border-gray-700 border-t-indigo-500 rounded-full animate-spin" />
        Loading match details…
      </div>
    )
  }

  if (!data) return null

  const isLive    = LIVE_STATUSES.has(fix.status_short)
  const hasEvents = data.events?.length > 0
  const hasStats  = data.statistics?.length >= 2

  if (!hasEvents && !hasStats) {
    return (
      <p className="text-center text-gray-600 text-xs py-6">
        {isLive ? 'No events yet — check back shortly' : 'Match details not available'}
      </p>
    )
  }

  // Filter to goals + cards, sorted by minute
  const keyEvents = (data.events || [])
    .filter(e => e.type === 'Goal' || e.type === 'Card')
    .sort((a, b) => (a.elapsed * 100 + (a.extra || 0)) - (b.elapsed * 100 + (b.extra || 0)))

  const homeEvents = keyEvents.filter(e => e.team === fix.home_team)
  const awayEvents = keyEvents.filter(e => e.team === fix.away_team)
  const allMinutes = [...new Set(keyEvents.map(e => e.elapsed))].sort((a, b) => a - b)

  const homeStats = data.statistics?.find(t => t.team === fix.home_team) || data.statistics?.[0]
  const awayStats = data.statistics?.find(t => t.team === fix.away_team) || data.statistics?.[1]
  const getVal    = (ts, type) => ts?.stats?.find(s => s.type === type)?.value ?? null

  const tabs = []
  if (hasEvents) tabs.push('events')
  if (hasStats)  tabs.push('stats')

  const activeTab = tabs.includes(tab) ? tab : tabs[0]

  return (
    <div className="space-y-3">
      {/* Tab bar */}
      {tabs.length > 1 && (
        <div className="flex gap-1 bg-white/5 rounded-xl p-1">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                activeTab === t ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}>
              {t === 'events' ? 'Events' : 'Stats'}
            </button>
          ))}
        </div>
      )}

      {/* Events tab */}
      {activeTab === 'events' && hasEvents && (
        <div className="space-y-0">
          {/* Header */}
          <div className="grid grid-cols-[1fr_48px_1fr] gap-1 mb-2">
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wide truncate">{fix.home_team}</span>
            <span />
            <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wide text-right truncate">{fix.away_team}</span>
          </div>

          {keyEvents.map((ev, i) => {
            const isHome = ev.team === fix.home_team
            const isGoal = ev.type === 'Goal'
            const isRed  = ev.type === 'Card' && ev.detail?.toLowerCase().includes('red')
            const icon   = isGoal ? '⚽' : isRed ? '🟥' : '🟨'
            return (
              <div key={i} className={`grid grid-cols-[1fr_48px_1fr] gap-1 items-center py-1 border-b border-white/4 last:border-0 ${
                isGoal ? '' : 'opacity-70'
              }`}>
                {/* Home side */}
                <div className={`text-right ${isHome ? '' : 'invisible'}`}>
                  <p className={`text-xs font-semibold truncate ${
                    isGoal ? 'text-white' : isRed ? 'text-red-400' : 'text-yellow-300'
                  }`}>{ev.player}</p>
                  {isGoal && ev.assist && (
                    <p className="text-[10px] text-gray-600 truncate">↪ {ev.assist}</p>
                  )}
                </div>
                {/* Minute */}
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[10px] text-gray-600 font-mono leading-none">{elapsedStr(ev)}</span>
                  <span className="text-[13px] leading-none">{icon}</span>
                </div>
                {/* Away side */}
                <div className={`text-left ${!isHome ? '' : 'invisible'}`}>
                  <p className={`text-xs font-semibold truncate ${
                    isGoal ? 'text-white' : isRed ? 'text-red-400' : 'text-yellow-300'
                  }`}>{ev.player}</p>
                  {isGoal && ev.assist && (
                    <p className="text-[10px] text-gray-600 truncate">↪ {ev.assist}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Stats tab */}
      {activeTab === 'stats' && hasStats && (
        <div className="space-y-2">
          {/* Team headers */}
          <div className="grid grid-cols-[1fr_80px_1fr] gap-2 mb-3">
            <span className="text-[11px] text-indigo-400 font-bold truncate">{homeStats?.team ?? fix.home_team}</span>
            <span />
            <span className="text-[11px] text-purple-400 font-bold text-right truncate">{awayStats?.team ?? fix.away_team}</span>
          </div>
          {ALL_STATS.map(type => {
            const hVal = getVal(homeStats, type)
            const aVal = getVal(awayStats, type)
            if (hVal === null && aVal === null) return null
            const hNum  = parseFloat(String(hVal ?? 0).replace('%', '')) || 0
            const aNum  = parseFloat(String(aVal ?? 0).replace('%', '')) || 0
            const total = hNum + aNum || 1
            const hPct  = (hNum / total) * 100
            const isPossession = type === 'Ball Possession'
            return (
              <div key={type} className="space-y-1">
                <div className="grid grid-cols-[40px_1fr_40px] gap-2 items-center">
                  <span className="text-xs font-bold text-white text-right tabular-nums">{hVal ?? 0}</span>
                  <div className="flex h-1.5 rounded-full overflow-hidden bg-white/8">
                    <div className={`rounded-full transition-all ${isPossession ? 'bg-indigo-400' : 'bg-indigo-500'}`}
                      style={{ width: `${hPct}%` }} />
                    <div className={`flex-1 rounded-full ${isPossession ? 'bg-purple-400' : 'bg-purple-500'}`} />
                  </div>
                  <span className="text-xs font-bold text-white text-left tabular-nums">{aVal ?? 0}</span>
                </div>
                <p className="text-[10px] text-gray-600 text-center">{type}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Fixture card ───────────────────────────────────────────────────────────────
function FixtureCard({ fix }) {
  const live     = LIVE_STATUSES.has(fix.status_short)
  const done     = DONE_STATUSES.has(fix.status_short)
  const canceled = CANCEL_STATUSES.has(fix.status_short)
  const hasScore = fix.home_goals !== null && fix.away_goals !== null
  const canExpand = live || done

  const [expanded, setExpanded]     = useState(false)
  const [statsData, setStatsData]   = useState(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const fetched = useRef(false)

  function toggle() {
    if (!canExpand) return
    setExpanded(e => !e)
    if (!fetched.current) {
      fetched.current = true
      setStatsLoading(true)
      getFixtureStats(fix.id)
        .then(r => setStatsData(r.data))
        .catch(() => setStatsData(null))
        .finally(() => setStatsLoading(false))
    }
  }

  const homeWin = done && hasScore && fix.home_goals > fix.away_goals
  const awayWin = done && hasScore && fix.away_goals > fix.home_goals
  const isDraw  = done && hasScore && fix.home_goals === fix.away_goals

  const liveLabel = live
    ? fix.status_short === 'HT' ? 'HT'
    : fix.status_short === 'BT' ? 'BT'
    : fix.status_elapsed ? `${fix.status_elapsed}'`
    : fix.status_short
    : null

  return (
    <div className={`rounded-2xl overflow-hidden transition-all ${
      live     ? 'bg-gradient-to-b from-green-950/40 to-green-950/10 border border-green-500/20' :
      expanded ? 'bg-white/5 border border-white/12' :
      'bg-white/3 border border-white/6'
    }`}>
      {/* Main card tap area */}
      <button
        onClick={toggle}
        className={`w-full px-4 py-3 flex flex-col gap-2 ${canExpand ? 'cursor-pointer active:bg-white/5' : 'cursor-default'}`}
      >
        {/* Status row */}
        <div className="flex items-center justify-between">
          {live ? (
            <span className="flex items-center gap-1.5 text-[11px] font-black text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              {liveLabel}
            </span>
          ) : done ? (
            <span className="text-[10px] font-semibold text-gray-500">{fix.status_short}</span>
          ) : canceled ? (
            <span className="text-[10px] font-semibold text-yellow-700">{fix.status_short}</span>
          ) : (
            <span className="text-[10px] text-gray-600 font-mono">
              {new Date(fix.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {canExpand && (
            <span className={`text-gray-600 text-[10px] transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>▼</span>
          )}
        </div>

        {/* Teams + score row */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          {/* Home team */}
          <div className="flex flex-col items-center gap-1.5">
            {fix.home_logo
              ? <img src={fix.home_logo} alt="" className="w-10 h-10 object-contain" onError={e => { e.target.style.display='none' }} />
              : <div className="w-10 h-10 rounded-full bg-white/8 flex items-center justify-center text-xs text-gray-500">{fix.home_team?.[0]}</div>
            }
            <span className={`text-xs font-semibold text-center leading-tight line-clamp-2 ${
              homeWin ? 'text-white' : done ? 'text-gray-400' : 'text-gray-200'
            }`}>{fix.home_team}</span>
          </div>

          {/* Score / VS */}
          <div className="flex flex-col items-center gap-1 min-w-[60px]">
            {hasScore ? (
              <>
                <span className={`text-2xl font-black tabular-nums tracking-tight ${
                  live ? 'text-green-400' : done ? 'text-white' : 'text-gray-300'
                }`}>
                  {fix.home_goals} <span className="text-gray-500 font-light">–</span> {fix.away_goals}
                </span>
                {fix.ht_home != null && done && (
                  <span className="text-[10px] text-gray-600 font-mono">({fix.ht_home}–{fix.ht_away} HT)</span>
                )}
                {fix.pen_home != null && (
                  <span className="text-[10px] text-orange-400 font-semibold">PSO {fix.pen_home}–{fix.pen_away}</span>
                )}
              </>
            ) : (
              <span className="text-gray-600 text-xs font-medium">VS</span>
            )}
          </div>

          {/* Away team */}
          <div className="flex flex-col items-center gap-1.5">
            {fix.away_logo
              ? <img src={fix.away_logo} alt="" className="w-10 h-10 object-contain" onError={e => { e.target.style.display='none' }} />
              : <div className="w-10 h-10 rounded-full bg-white/8 flex items-center justify-center text-xs text-gray-500">{fix.away_team?.[0]}</div>
            }
            <span className={`text-xs font-semibold text-center leading-tight line-clamp-2 ${
              awayWin ? 'text-white' : done ? 'text-gray-400' : 'text-gray-200'
            }`}>{fix.away_team}</span>
          </div>
        </div>

        {/* Venue */}
        {fix.venue_name && (
          <p className="text-[10px] text-gray-700 text-center truncate">
            {fix.venue_name}{fix.venue_city ? `, ${fix.venue_city}` : ''}
          </p>
        )}
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-white/8">
          <MatchDetail fix={fix} data={statsData} loading={statsLoading} />
        </div>
      )}
    </div>
  )
}

function CompetitionSection({ name, logo, fixtures }) {
  const liveCount = fixtures.filter(f => LIVE_STATUSES.has(f.status_short)).length
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        {logo && <img src={logo} alt="" className="w-5 h-5 object-contain flex-shrink-0" onError={e => { e.target.style.display='none' }} />}
        <span className="text-gray-400 text-xs font-bold tracking-wide uppercase flex-1 truncate">{name}</span>
        {liveCount > 0 && (
          <span className="text-[10px] text-green-400 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
            {liveCount} live
          </span>
        )}
      </div>
      <div className="space-y-2">
        {fixtures.map(fix => <FixtureCard key={fix.id} fix={fix} />)}
      </div>
    </div>
  )
}

const DAY_TABS = [
  { label: 'Yesterday', offset: -1 },
  { label: 'Today',     offset: 0  },
  { label: 'Tomorrow',  offset: 1  },
]

export default function ScoresPage() {
  const [activeOffset, setActiveOffset] = useState(0)
  const [fixtures, setFixtures]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [err, setErr]                   = useState('')
  const intervalRef = useRef(null)

  const date = offsetDate(activeOffset)

  const load = useCallback((showLoading = false) => {
    if (showLoading) setLoading(true)
    setErr('')
    getScores(date)
      .then(r => setFixtures(Array.isArray(r.data) ? r.data : []))
      .catch(e => setErr(e.response?.data?.error || 'Failed to load scores'))
      .finally(() => setLoading(false))
  }, [date])

  useEffect(() => {
    load(true)
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (activeOffset === 0 || activeOffset === -1) {
      intervalRef.current = setInterval(() => load(false), 60000)
    }
    return () => clearInterval(intervalRef.current)
  }, [load, activeOffset])

  const groups = []
  const seen = new Map()
  for (const f of fixtures) {
    const key = f.competition_name || 'Other'
    if (!seen.has(key)) {
      seen.set(key, [])
      groups.push({ name: key, logo: f.competition_logo, fixtures: seen.get(key) })
    }
    seen.get(key).push(f)
  }

  const totalLive = fixtures.filter(f => LIVE_STATUSES.has(f.status_short)).length
  const fmtDate   = d => new Date(d + 'T12:00:00Z').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  })

  return (
    <div className="flex flex-col min-h-dvh" style={{ background: 'var(--bg-primary)' }}>
      <TopBar
        showBack
        title={
          <span className="flex items-center gap-2">
            Live Scores
            {totalLive > 0 && (
              <span className="flex items-center gap-1 text-green-400 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                {totalLive} live
              </span>
            )}
          </span>
        }
        subtitle={fmtDate(date)}
      />

      {/* Day tabs */}
      <div className="max-w-md mx-auto w-full px-4 pt-3 pb-1 flex gap-1">
        {DAY_TABS.map(({ label, offset }) => (
          <button
            key={offset}
            onClick={() => setActiveOffset(offset)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeOffset === offset ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
            style={activeOffset !== offset ? { background: 'var(--bg-surface)' } : {}}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-md mx-auto px-4 pt-3 space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-24 gap-2 text-gray-600 text-sm">
              <div className="w-4 h-4 border border-gray-600 border-t-indigo-400 rounded-full animate-spin" />
              Loading…
            </div>
          )}
          {!loading && err && (
            <div className="bg-red-900/15 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm text-center">{err}</div>
          )}
          {!loading && !err && fixtures.length === 0 && (
            <div className="text-center py-24">
              <p className="text-4xl mb-3">📅</p>
              <p className="text-gray-400 text-sm font-semibold">No fixtures for {fmtDate(date)}</p>
              <p className="text-gray-700 text-xs mt-1">
                {activeOffset < 0 ? 'No matches on this date' : activeOffset > 0 ? 'Schedule not yet available' : 'No matches today'}
              </p>
            </div>
          )}
          {!loading && groups.map(g => (
            <CompetitionSection key={g.name} name={g.name} logo={g.logo} fixtures={g.fixtures} />
          ))}
          {activeOffset === 0 && !loading && fixtures.length > 0 && (
            <p className="text-center text-gray-700 text-[10px] pb-2">Scores auto-refresh every 60s</p>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
