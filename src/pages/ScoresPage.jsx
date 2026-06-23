import { useState, useEffect, useCallback, useRef } from 'react'
import { getScores } from '../api/competitions'
import { getFixtureStats } from '../api/glory'
import BottomNav from '../components/layout/BottomNav'
import TopBar from '../components/layout/TopBar'

const LIVE_STATUSES   = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'SUSP', 'INT', 'LIVE'])
const DONE_STATUSES   = new Set(['FT', 'AET', 'PEN', 'AWD', 'WO'])
const CANCEL_STATUSES = new Set(['PST', 'CANC', 'ABD'])

const KEY_STATS = [
  'Ball Possession',
  'Total Shots',
  'Shots on Goal',
  'Corner Kicks',
  'Fouls',
  'Yellow Cards',
]

function toDateStr(d) { return d.toISOString().slice(0, 10) }
function offsetDate(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return toDateStr(d)
}

function elapsed(ev) {
  return `${ev.elapsed}${ev.extra ? `+${ev.extra}` : ''}'`
}

// ── Inline stats panel ─────────────────────────────────────────────────────────
function InlineStats({ fix, data, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-4 gap-2 text-gray-600 text-xs">
        <div className="w-3 h-3 border border-gray-700 border-t-indigo-400 rounded-full animate-spin" />
        Loading…
      </div>
    )
  }

  if (!data) return null

  const isLive = LIVE_STATUSES.has(fix.status_short)
  const hasEvents = data.events?.length > 0
  const hasStats  = data.statistics?.length >= 2

  if (!hasEvents && !hasStats) {
    return (
      <p className="text-center text-gray-700 text-xs py-3">
        {isLive ? 'No events yet' : 'Stats not available yet'}
      </p>
    )
  }

  // Key events: goals + cards only, sorted by minute
  const keyEvents = (data.events || [])
    .filter(e => e.type === 'Goal' || e.type === 'Card')
    .sort((a, b) => (a.elapsed * 100 + (a.extra || 0)) - (b.elapsed * 100 + (b.extra || 0)))

  const homeStats = data.statistics?.find(t => t.team === fix.home_team) || data.statistics?.[0]
  const awayStats = data.statistics?.find(t => t.team === fix.away_team) || data.statistics?.[1]

  const getVal = (teamStats, type) => teamStats?.stats.find(s => s.type === type)?.value ?? null

  return (
    <div className="space-y-3">
      {/* Event timeline */}
      {keyEvents.length > 0 && (
        <div className="space-y-0.5">
          {keyEvents.map((ev, i) => {
            const isHome = ev.team === fix.home_team
            const isRed  = ev.type === 'Card' && ev.detail?.toLowerCase().includes('red')
            const icon   = ev.type === 'Goal' ? '⚽' : isRed ? '🟥' : '🟨'
            return (
              <div key={i} className={`flex items-center gap-1.5 text-xs ${isHome ? '' : 'flex-row-reverse'}`}>
                {/* minute */}
                <span className="text-gray-600 font-mono text-[10px] w-8 flex-shrink-0 text-center">
                  {elapsed(ev)}
                </span>
                <span className="text-[11px]">{icon}</span>
                <div className={`flex-1 min-w-0 ${isHome ? 'text-left' : 'text-right'}`}>
                  <span className={`font-medium ${
                    ev.type === 'Goal' ? 'text-white' :
                    isRed ? 'text-red-400' : 'text-yellow-300'
                  }`}>{ev.player}</span>
                  {ev.type === 'Goal' && ev.assist && (
                    <span className="text-gray-600 ml-1">({ev.assist})</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Divider if we have both events and stats */}
      {keyEvents.length > 0 && hasStats && (
        <div className="h-px bg-white/6" />
      )}

      {/* Key stats */}
      {hasStats && (
        <div className="space-y-1.5">
          {KEY_STATS.map(type => {
            const hVal = getVal(homeStats, type)
            const aVal = getVal(awayStats, type)
            if (hVal === null && aVal === null) return null
            const hNum = parseFloat(String(hVal ?? 0).replace('%', '')) || 0
            const aNum = parseFloat(String(aVal ?? 0).replace('%', '')) || 0
            const total = hNum + aNum || 1
            const hPct  = (hNum / total) * 100
            return (
              <div key={type}>
                <div className="flex items-center gap-2">
                  <span className="text-white text-[11px] font-semibold w-6 text-right flex-shrink-0">{hVal ?? 0}</span>
                  <div className="flex-1 flex h-1 rounded-full overflow-hidden bg-white/8">
                    <div className="bg-indigo-500 transition-all" style={{ width: `${hPct}%` }} />
                    <div className="bg-purple-500 flex-1" />
                  </div>
                  <span className="text-white text-[11px] font-semibold w-6 text-left flex-shrink-0">{aVal ?? 0}</span>
                  <span className="text-gray-600 text-[10px] w-20 flex-shrink-0 text-center">{type}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Fixture row with inline expand ────────────────────────────────────────────
function FixtureRow({ fix }) {
  const live    = LIVE_STATUSES.has(fix.status_short)
  const done    = DONE_STATUSES.has(fix.status_short)
  const hasScore = fix.home_goals !== null && fix.away_goals !== null
  const canExpand = live || done

  const [expanded, setExpanded] = useState(false)
  const [statsData, setStatsData] = useState(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const fetched = useRef(false)

  const toggle = () => {
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

  return (
    <div className={`rounded-xl overflow-hidden transition-colors ${
      live ? 'bg-green-950/20 border border-green-500/15' :
      expanded ? 'bg-white/4 border border-white/10' :
      'bg-white/2 border border-transparent'
    }`}>
      {/* Main row */}
      <button
        onClick={toggle}
        className={`w-full px-3 py-2.5 flex items-center gap-3 text-left ${canExpand ? 'cursor-pointer' : 'cursor-default'}`}
      >
        {/* Status */}
        <div className="w-8 flex-shrink-0 flex flex-col items-center gap-0.5">
          {live ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] font-bold text-green-400 leading-none">
                {fix.status_short === 'HT' ? 'HT' : fix.status_short === 'BT' ? 'BT' : fix.status_elapsed ? `${fix.status_elapsed}'` : fix.status_short}
              </span>
            </>
          ) : done ? (
            <span className="text-[10px] font-semibold text-gray-500">{fix.status_short}</span>
          ) : CANCEL_STATUSES.has(fix.status_short) ? (
            <span className="text-[10px] font-semibold text-yellow-700">{fix.status_short}</span>
          ) : null}
        </div>

        {/* Teams */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-1.5">
            {fix.home_logo && <img src={fix.home_logo} alt="" className="w-4 h-4 object-contain flex-shrink-0" onError={e => { e.target.style.display = 'none' }} />}
            <span className={`text-sm leading-tight truncate ${
              homeWin ? 'text-white font-semibold' :
              awayWin ? 'text-gray-500' :
              live ? 'text-white' : 'text-gray-300'
            }`}>{fix.home_team}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {fix.away_logo && <img src={fix.away_logo} alt="" className="w-4 h-4 object-contain flex-shrink-0" onError={e => { e.target.style.display = 'none' }} />}
            <span className={`text-sm leading-tight truncate ${
              awayWin ? 'text-white font-semibold' :
              homeWin ? 'text-gray-500' :
              live ? 'text-white' : 'text-gray-300'
            }`}>{fix.away_team}</span>
          </div>
        </div>

        {/* Score / time + chevron */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {hasScore ? (
            <span className={`font-mono font-bold text-sm tabular-nums ${live ? 'text-green-400' : done ? 'text-white' : 'text-gray-400'}`}>
              {fix.home_goals} – {fix.away_goals}
            </span>
          ) : (
            <span className="text-gray-500 text-xs font-mono">
              {new Date(fix.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {canExpand && (
            <span className={`text-gray-600 text-[10px] transition-transform ${expanded ? 'rotate-180' : ''}`}>▼</span>
          )}
        </div>
      </button>

      {/* Expanded stats */}
      {expanded && (
        <div className="px-3 pb-3 pt-0.5 border-t border-white/5">
          <InlineStats fix={fix} data={statsData} loading={statsLoading} />
        </div>
      )}
    </div>
  )
}

function CompetitionSection({ name, logo, fixtures }) {
  const liveCount = fixtures.filter(f => LIVE_STATUSES.has(f.status_short)).length
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 px-1 py-1.5">
        {logo && <img src={logo} alt="" className="w-5 h-5 object-contain flex-shrink-0" onError={e => { e.target.style.display = 'none' }} />}
        <span className="text-gray-400 text-xs font-semibold tracking-wide uppercase flex-1 truncate">{name}</span>
        {liveCount > 0 && (
          <span className="text-[10px] text-green-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
            {liveCount} live
          </span>
        )}
      </div>
      <div className="space-y-1">
        {fixtures.map(fix => <FixtureRow key={fix.id} fix={fix} />)}
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
    // Poll every 60s for today and yesterday (backend auto-refreshes from API-Football every 5 min)
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
  const fmtDate = d => new Date(d + 'T12:00:00Z').toLocaleDateString('en-GB', {
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

      <div className="flex gap-1 px-4 pt-3 pb-1">
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

      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-24 space-y-5">
        {loading && (
          <div className="flex items-center justify-center py-20 gap-2 text-gray-600 text-sm">
            <div className="w-4 h-4 border border-gray-600 border-t-indigo-400 rounded-full animate-spin" />
            Loading…
          </div>
        )}
        {!loading && err && (
          <div className="bg-red-900/15 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm text-center">{err}</div>
        )}
        {!loading && !err && fixtures.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-sm">No fixtures for {fmtDate(date)}</p>
            <p className="text-gray-700 text-xs mt-2">
              {activeOffset === 0 ? 'No matches scheduled today'
                : activeOffset < 0 ? 'No matches on this date'
                : 'No matches scheduled for tomorrow yet'}
            </p>
          </div>
        )}
        {!loading && groups.map(g => (
          <CompetitionSection key={g.name} name={g.name} logo={g.logo} fixtures={g.fixtures} />
        ))}
        {activeOffset === 0 && !loading && fixtures.length > 0 && (
          <p className="text-center text-gray-700 text-[10px] pb-2">Scores refresh every 60s</p>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
