import { useState, useEffect, useCallback, useRef } from 'react'
import { getScores } from '../api/competitions'
import BottomNav from '../components/layout/BottomNav'
import TopBar from '../components/layout/TopBar'

const LIVE_STATUSES   = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'SUSP', 'INT', 'LIVE'])
const DONE_STATUSES   = new Set(['FT', 'AET', 'PEN', 'AWD', 'WO'])
const CANCEL_STATUSES = new Set(['PST', 'CANC', 'ABD'])

function toDateStr(d) { return d.toISOString().slice(0, 10) }

function offsetDate(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return toDateStr(d)
}

function StatusBadge({ status, elapsed }) {
  if (LIVE_STATUSES.has(status)) {
    const label = status === 'HT' ? 'HT' : status === 'BT' ? 'BT' : elapsed ? `${elapsed}'` : status
    return (
      <div className="flex flex-col items-center gap-0.5 w-10 flex-shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        <span className="text-[10px] font-bold text-green-400 leading-none">{label}</span>
      </div>
    )
  }
  if (DONE_STATUSES.has(status)) {
    return (
      <div className="w-10 flex-shrink-0 text-center">
        <span className="text-[10px] font-semibold text-gray-500">{status}</span>
      </div>
    )
  }
  if (CANCEL_STATUSES.has(status)) {
    return (
      <div className="w-10 flex-shrink-0 text-center">
        <span className="text-[10px] font-semibold text-yellow-600">{status}</span>
      </div>
    )
  }
  return null
}

function Score({ fix }) {
  const live = LIVE_STATUSES.has(fix.status_short)
  const done = DONE_STATUSES.has(fix.status_short)
  const hasScore = fix.home_goals !== null && fix.away_goals !== null

  if (!hasScore) {
    const time = new Date(fix.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    return <span className="text-gray-500 text-xs font-mono w-14 text-center flex-shrink-0">{time}</span>
  }

  return (
    <span className={`font-mono font-bold text-sm w-14 text-center flex-shrink-0 ${
      live ? 'text-green-400' : done ? 'text-white' : 'text-gray-400'
    }`}>
      {fix.home_goals} – {fix.away_goals}
    </span>
  )
}

function FixtureRow({ fix }) {
  const live = LIVE_STATUSES.has(fix.status_short)
  const done = DONE_STATUSES.has(fix.status_short)

  return (
    <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-colors ${
      live
        ? 'bg-green-950/20 border border-green-500/15'
        : 'bg-white/2 border border-transparent'
    }`}>
      <StatusBadge status={fix.status_short} elapsed={fix.status_elapsed} />

      {/* Teams */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-1.5">
          {fix.home_logo && (
            <img src={fix.home_logo} alt="" className="w-4 h-4 object-contain flex-shrink-0"
              onError={e => { e.target.style.display = 'none' }} />
          )}
          <span className={`text-sm leading-tight truncate ${
            done && fix.home_goals > fix.away_goals ? 'text-white font-semibold' :
            done && fix.home_goals < fix.away_goals ? 'text-gray-500' :
            live ? 'text-white' : 'text-gray-300'
          }`}>{fix.home_team}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {fix.away_logo && (
            <img src={fix.away_logo} alt="" className="w-4 h-4 object-contain flex-shrink-0"
              onError={e => { e.target.style.display = 'none' }} />
          )}
          <span className={`text-sm leading-tight truncate ${
            done && fix.away_goals > fix.home_goals ? 'text-white font-semibold' :
            done && fix.away_goals < fix.home_goals ? 'text-gray-500' :
            live ? 'text-white' : 'text-gray-300'
          }`}>{fix.away_team}</span>
        </div>
      </div>

      {/* Score / kickoff time */}
      <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
        <Score fix={fix} />
      </div>
    </div>
  )
}

function CompetitionSection({ name, logo, fixtures }) {
  const liveCount = fixtures.filter(f => LIVE_STATUSES.has(f.status_short)).length
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 px-1 py-1.5">
        {logo && (
          <img src={logo} alt="" className="w-5 h-5 object-contain flex-shrink-0"
            onError={e => { e.target.style.display = 'none' }} />
        )}
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
    // Auto-refresh every 60s only for today (live matches)
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (activeOffset === 0) {
      intervalRef.current = setInterval(() => load(false), 60000)
    }
    return () => clearInterval(intervalRef.current)
  }, [load, activeOffset])

  // Group fixtures by competition
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
  const fmtDate = (d) => new Date(d + 'T12:00:00Z').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  })

  return (
    <div className="flex flex-col min-h-dvh" style={{ background: 'var(--bg-primary)' }}>
      <TopBar
        title={
          <span className="flex items-center gap-2">
            Scores
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

      {/* Day filter tabs */}
      <div className="flex gap-1 px-4 pt-3 pb-1">
        {DAY_TABS.map(({ label, offset }) => (
          <button
            key={offset}
            onClick={() => setActiveOffset(offset)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeOffset === offset
                ? 'bg-indigo-600 text-white'
                : 'text-gray-500 hover:text-gray-300'
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
          <div className="bg-red-900/15 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm text-center">
            {err}
          </div>
        )}

        {!loading && !err && fixtures.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-sm">No fixtures for {fmtDate(date)}</p>
            <p className="text-gray-700 text-xs mt-2">
              {activeOffset === 0
                ? 'No matches scheduled today in your imported competitions'
                : activeOffset < 0
                  ? 'No matches played on this date'
                  : 'No matches scheduled for tomorrow yet'}
            </p>
          </div>
        )}

        {!loading && groups.map(g => (
          <CompetitionSection key={g.name} name={g.name} logo={g.logo} fixtures={g.fixtures} />
        ))}

        {activeOffset === 0 && !loading && fixtures.length > 0 && (
          <p className="text-center text-gray-700 text-[10px] pb-2">
            Live scores refresh every 60s automatically
          </p>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
