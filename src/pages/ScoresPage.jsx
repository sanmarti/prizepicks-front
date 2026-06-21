import { useState, useEffect, useCallback, useRef } from 'react'
import { getScores } from '../api/competitions'
import { getFixtureStats } from '../api/glory'
import BottomNav from '../components/layout/BottomNav'
import TopBar from '../components/layout/TopBar'

const LIVE_STATUSES   = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'SUSP', 'INT', 'LIVE'])
const DONE_STATUSES   = new Set(['FT', 'AET', 'PEN', 'AWD', 'WO'])
const CANCEL_STATUSES = new Set(['PST', 'CANC', 'ABD'])

const EVENT_ICONS = {
  Goal:          '⚽',
  'subst':       '🔄',
  Card:          '🟨',
  Var:           '📺',
}
const STAT_ORDER = [
  'Ball Possession', 'Total Shots', 'Shots on Goal', 'Shots off Goal',
  'Corner Kicks', 'Fouls', 'Yellow Cards', 'Red Cards', 'Offsides',
  'Goalkeeper Saves', 'Total passes', 'Passes accurate', 'Passes %',
]

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
    return <div className="w-10 flex-shrink-0 text-center"><span className="text-[10px] font-semibold text-gray-500">{status}</span></div>
  }
  if (CANCEL_STATUSES.has(status)) {
    return <div className="w-10 flex-shrink-0 text-center"><span className="text-[10px] font-semibold text-yellow-600">{status}</span></div>
  }
  return null
}

function ScoreOrTime({ fix }) {
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
    }`}>{fix.home_goals} – {fix.away_goals}</span>
  )
}

// ── Fixture stats drawer ───────────────────────────────────────────────────────
function StatsDrawer({ fixtureId, fix, onClose }) {
  const [data, setData]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!fixtureId) return
    setLoading(true)
    getFixtureStats(fixtureId)
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [fixtureId])

  const goals = (data?.events || []).filter(e => e.type === 'Goal')
  const cards = (data?.events || []).filter(e => e.type === 'Card')
  const subs  = (data?.events || []).filter(e => e.type === 'subst')

  const [homeStats, awayStats] = (() => {
    if (!data?.statistics?.length) return [null, null]
    const h = data.statistics.find(t => t.team === fix.home_team) || data.statistics[0]
    const a = data.statistics.find(t => t.team === fix.away_team) || data.statistics[1]
    return [h, a]
  })()

  const getStatValue = (teamStats, type) =>
    teamStats?.stats.find(s => s.type === type)?.value ?? null

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={onClose}>
      <div className="flex-1" />
      <div
        className="rounded-t-3xl overflow-hidden flex flex-col max-h-[85dvh]"
        style={{ background: 'var(--bg-surface)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="px-5 pt-2 pb-4 flex-shrink-0 border-b border-white/8">
          <div className="flex items-center justify-between mb-3">
            <button onClick={onClose} className="text-gray-500 text-sm hover:text-white">✕</button>
            <span className="text-gray-500 text-xs">{fix.competition_name || ''} · {fix.round || ''}</span>
            <div />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              {fix.home_logo && <img src={fix.home_logo} alt="" className="w-8 h-8 object-contain" />}
              <span className="font-semibold text-white text-sm leading-tight">{fix.home_team}</span>
            </div>
            <div className="text-center flex-shrink-0">
              {fix.home_goals !== null
                ? <span className="font-black text-2xl text-white">{fix.home_goals} – {fix.away_goals}</span>
                : <span className="text-gray-500 text-sm">{new Date(fix.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
              }
              <div className={`text-[10px] font-semibold mt-0.5 ${LIVE_STATUSES.has(fix.status_short) ? 'text-green-400' : 'text-gray-600'}`}>
                {fix.status_long || fix.status_short}
                {fix.status_elapsed ? ` ${fix.status_elapsed}'` : ''}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-1 justify-end">
              <span className="font-semibold text-white text-sm leading-tight text-right">{fix.away_team}</span>
              {fix.away_logo && <img src={fix.away_logo} alt="" className="w-8 h-8 object-contain" />}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-5">
          {loading && (
            <div className="flex items-center justify-center py-12 gap-2 text-gray-600 text-sm">
              <div className="w-4 h-4 border border-gray-600 border-t-indigo-400 rounded-full animate-spin" />
              Loading stats…
            </div>
          )}

          {!loading && !data?.cached && (
            <p className="text-center text-gray-600 text-sm py-8">
              Stats not yet available — synced after the match is finished
            </p>
          )}

          {/* Goals / Key events */}
          {!loading && goals.length > 0 && (
            <div>
              <p className="text-gray-500 text-[10px] font-semibold tracking-widest uppercase mb-2">Goals</p>
              <div className="space-y-1.5">
                {goals.map((g, i) => {
                  const isHome = g.team === fix.home_team
                  return (
                    <div key={i} className={`flex items-center gap-2 text-sm ${isHome ? '' : 'flex-row-reverse'}`}>
                      <span className="text-[10px] font-mono text-gray-500 w-7 flex-shrink-0 text-center">
                        {g.elapsed}{g.extra ? `+${g.extra}` : ''}'
                      </span>
                      <span className="text-sm">⚽</span>
                      <div className={isHome ? 'text-left' : 'text-right'}>
                        <span className="text-white text-sm font-medium">{g.player}</span>
                        {g.assist && <span className="text-gray-500 text-xs ml-1">(assist: {g.assist})</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Cards */}
          {!loading && cards.length > 0 && (
            <div>
              <p className="text-gray-500 text-[10px] font-semibold tracking-widest uppercase mb-2">Cards</p>
              <div className="space-y-1.5">
                {cards.map((c, i) => {
                  const isHome = c.team === fix.home_team
                  const isRed  = c.detail?.toLowerCase().includes('red')
                  return (
                    <div key={i} className={`flex items-center gap-2 text-sm ${isHome ? '' : 'flex-row-reverse'}`}>
                      <span className="text-[10px] font-mono text-gray-500 w-7 flex-shrink-0 text-center">
                        {c.elapsed}{c.extra ? `+${c.extra}` : ''}'
                      </span>
                      <span>{isRed ? '🟥' : '🟨'}</span>
                      <span className={`text-sm ${isHome ? 'text-left' : 'text-right'} ${isRed ? 'text-red-400' : 'text-yellow-300'}`}>{c.player}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Statistics bars */}
          {!loading && homeStats && awayStats && (
            <div>
              <p className="text-gray-500 text-[10px] font-semibold tracking-widest uppercase mb-3">Statistics</p>
              <div className="space-y-3">
                {STAT_ORDER.map(type => {
                  const hVal = getStatValue(homeStats, type)
                  const aVal = getStatValue(awayStats, type)
                  if (hVal === null && aVal === null) return null
                  const hNum = parseFloat(String(hVal).replace('%', '')) || 0
                  const aNum = parseFloat(String(aVal).replace('%', '')) || 0
                  const total = hNum + aNum || 1
                  const hPct = (hNum / total) * 100
                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-white font-semibold">{hVal ?? 0}</span>
                        <span className="text-gray-500 text-[10px]">{type}</span>
                        <span className="text-white font-semibold">{aVal ?? 0}</span>
                      </div>
                      <div className="flex h-1.5 rounded-full overflow-hidden bg-white/8">
                        <div className="bg-indigo-500 rounded-l-full transition-all" style={{ width: `${hPct}%` }} />
                        <div className="bg-purple-500 rounded-r-full flex-1 transition-all" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Substitutions */}
          {!loading && subs.length > 0 && (
            <div>
              <p className="text-gray-500 text-[10px] font-semibold tracking-widest uppercase mb-2">Substitutions</p>
              <div className="space-y-1">
                {subs.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="text-[10px] font-mono text-gray-600 w-7 text-center">{s.elapsed}'</span>
                    <span>🔄</span>
                    <span className="text-green-400">↑ {s.assist}</span>
                    <span className="text-red-400">↓ {s.player}</span>
                    <span className="text-gray-600 ml-auto">{s.team === fix.home_team ? fix.home_team : fix.away_team}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FixtureRow({ fix, onTap }) {
  const live = LIVE_STATUSES.has(fix.status_short)
  const done = DONE_STATUSES.has(fix.status_short)
  const hasScore = fix.home_goals !== null && fix.away_goals !== null

  return (
    <button
      onClick={() => onTap(fix)}
      className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl transition-colors text-left ${
        live
          ? 'bg-green-950/20 border border-green-500/15 hover:bg-green-950/30'
          : 'bg-white/2 border border-transparent hover:bg-white/5'
      }`}
    >
      <StatusBadge status={fix.status_short} elapsed={fix.status_elapsed} />

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-1.5">
          {fix.home_logo && <img src={fix.home_logo} alt="" className="w-4 h-4 object-contain flex-shrink-0" onError={e => { e.target.style.display = 'none' }} />}
          <span className={`text-sm leading-tight truncate ${
            done && hasScore && fix.home_goals > fix.away_goals ? 'text-white font-semibold' :
            done && hasScore && fix.home_goals < fix.away_goals ? 'text-gray-500' :
            live ? 'text-white' : 'text-gray-300'
          }`}>{fix.home_team}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {fix.away_logo && <img src={fix.away_logo} alt="" className="w-4 h-4 object-contain flex-shrink-0" onError={e => { e.target.style.display = 'none' }} />}
          <span className={`text-sm leading-tight truncate ${
            done && hasScore && fix.away_goals > fix.home_goals ? 'text-white font-semibold' :
            done && hasScore && fix.away_goals < fix.home_goals ? 'text-gray-500' :
            live ? 'text-white' : 'text-gray-300'
          }`}>{fix.away_team}</span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
        <ScoreOrTime fix={fix} />
        {(done || live) && <span className="text-gray-700 text-[9px]">tap for stats</span>}
      </div>
    </button>
  )
}

function CompetitionSection({ name, logo, fixtures, onTap }) {
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
        {fixtures.map(fix => <FixtureRow key={fix.id} fix={fix} onTap={onTap} />)}
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
  const [selected, setSelected]         = useState(null)
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
    if (activeOffset === 0) {
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
              {activeOffset === 0 ? 'No matches scheduled today in your imported competitions'
                : activeOffset < 0 ? 'No matches played on this date'
                : 'No matches scheduled for tomorrow yet'}
            </p>
          </div>
        )}
        {!loading && groups.map(g => (
          <CompetitionSection key={g.name} name={g.name} logo={g.logo} fixtures={g.fixtures} onTap={setSelected} />
        ))}
        {activeOffset === 0 && !loading && fixtures.length > 0 && (
          <p className="text-center text-gray-700 text-[10px] pb-2">Live scores refresh every 60s automatically</p>
        )}
      </div>

      <BottomNav />

      {selected && (
        <StatsDrawer
          fixtureId={selected.id}
          fix={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
