import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'

// ── Fixed sprint calendar ─────────────────────────────────────────────────────
// Each sprint is 4 × Mon–Sun weeks. Dates are definitive — no manual input.
const SPRINT_SCHEDULE = [
  { id: 1, name: 'Spring Kickoff',  start: '2026-03-02' },
  { id: 2, name: 'April Clash',     start: '2026-04-06' },
  { id: 3, name: 'Champions Run',   start: '2026-05-04' },
  { id: 4, name: 'June Showdown',   start: '2026-06-01' },
  { id: 5, name: 'July Knockouts',  start: '2026-07-04' },
]

// ── Date helpers ──────────────────────────────────────────────────────────────
const NOW = new Date()

function localDate(dateStr) { return new Date(dateStr + 'T00:00:00') }

function addDays(d, n) {
  const r = new Date(d); r.setDate(r.getDate() + n); return r
}

function fmtShort(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
function fmtDay(d) {
  return new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}
function fmtTime(d) {
  return new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}
function fmtCountdown(target) {
  const diff = new Date(target) - NOW
  if (diff <= 0) return null
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

// Derive the 4 weeks for a sprint from its start Monday
function getSprintWeeks(startStr) {
  const mon0 = localDate(startStr)
  return Array.from({ length: 4 }, (_, i) => {
    const weekStart = addDays(mon0, i * 7); weekStart.setHours(0, 0, 0, 0)
    const lockDt    = addDays(weekStart, 6); lockDt.setHours(20, 0, 0, 0)
    const settleDt  = addDays(weekStart, 7); settleDt.setHours(0, 0, 0, 0)
    return { weekStart, lockDt, settleDt }
  })
}

function getWeekStatus(weekStart, lockDt, settleDt) {
  if (NOW >= settleDt)  return 'FINISHED'
  if (NOW >= lockDt)    return 'LOCKED'
  if (NOW >= weekStart) return 'PUBLISHED'
  return 'DRAFT'
}

// Sprint-level status derived from W1 start and W4 settle
function getSprintStatus(startStr) {
  const weeks = getSprintWeeks(startStr)
  if (NOW >= weeks[3].settleDt)  return 'COMPLETED'
  if (NOW >= weeks[0].weekStart) return 'LIVE'
  return 'UPCOMING'
}

// ── Fixture pool ──────────────────────────────────────────────────────────────
const FIXTURE_POOL = {
  'World Cup 2026 · R16': [
    'USA vs Panama', 'Germany vs Denmark', 'Spain vs Georgia', 'France vs Portugal',
    'Argentina vs Australia', 'Brazil vs Mexico', 'England vs Netherlands', 'Italy vs Morocco',
  ],
  'World Cup 2026 · QF': [
    'Argentina vs France', 'Brazil vs Germany', 'England vs Spain', 'USA vs Portugal',
  ],
  'World Cup 2026 · SF + Final': [
    'Brazil vs Argentina (WC SF)', 'England vs France (WC SF)',
    'England vs Brazil (WC Final)', 'Argentina vs France (WC Final)',
  ],
  'Premier League': ['Arsenal vs Liverpool', 'Man City vs Chelsea', 'Tottenham vs Man United'],
  'La Liga':        ['Real Madrid vs Barcelona', 'Atletico vs Sevilla'],
  'Bundesliga':     ['Bayern Munich vs Dortmund', 'Leverkusen vs Leipzig'],
  'Serie A':        ['Inter vs Juventus', 'AC Milan vs Roma'],
}
const PICK_TYPES = ['Match Result', 'Goals Over/Under', 'BTTS', 'Clean Sheet']

// ── Team logos ────────────────────────────────────────────────────────────────
const TEAM_LOGOS = {
  // Premier League
  'Arsenal':       'https://media.api-sports.io/football/teams/42.png',
  'Liverpool':     'https://media.api-sports.io/football/teams/40.png',
  'Man City':      'https://media.api-sports.io/football/teams/50.png',
  'Chelsea':       'https://media.api-sports.io/football/teams/49.png',
  'Tottenham':     'https://media.api-sports.io/football/teams/47.png',
  'Man United':    'https://media.api-sports.io/football/teams/33.png',
  // La Liga
  'Real Madrid':   'https://media.api-sports.io/football/teams/541.png',
  'Barcelona':     'https://media.api-sports.io/football/teams/529.png',
  'Atletico':      'https://media.api-sports.io/football/teams/530.png',
  'Sevilla':       'https://media.api-sports.io/football/teams/536.png',
  // Bundesliga
  'Bayern Munich': 'https://media.api-sports.io/football/teams/157.png',
  'Dortmund':      'https://media.api-sports.io/football/teams/165.png',
  'Leverkusen':    'https://media.api-sports.io/football/teams/168.png',
  'Leipzig':       'https://media.api-sports.io/football/teams/173.png',
  // Serie A
  'Inter':         'https://media.api-sports.io/football/teams/505.png',
  'Juventus':      'https://media.api-sports.io/football/teams/496.png',
  'AC Milan':      'https://media.api-sports.io/football/teams/489.png',
  'Roma':          'https://media.api-sports.io/football/teams/497.png',
  // Ligue 1
  'PSG':           'https://media.api-sports.io/football/teams/85.png',
  'Marseille':     'https://media.api-sports.io/football/teams/81.png',
  'Monaco':        'https://media.api-sports.io/football/teams/91.png',
  // National teams
  'France':        'https://media.api-sports.io/football/teams/2.png',
  'Argentina':     'https://media.api-sports.io/football/teams/26.png',
  'Brazil':        'https://media.api-sports.io/football/teams/24.png',
  'Germany':       'https://media.api-sports.io/football/teams/25.png',
  'Spain':         'https://media.api-sports.io/football/teams/9.png',
  'England':       'https://media.api-sports.io/football/teams/10.png',
  'Portugal':      'https://media.api-sports.io/football/teams/27.png',
  'Netherlands':   'https://media.api-sports.io/football/teams/1118.png',
  'Italy':         'https://media.api-sports.io/football/teams/768.png',
  'Morocco':       'https://media.api-sports.io/football/teams/1020.png',
  'USA':           'https://media.api-sports.io/football/teams/2856.png',
  'Mexico':        'https://media.api-sports.io/football/teams/769.png',
  'Australia':     'https://media.api-sports.io/football/teams/2763.png',
  'Panama':        'https://media.api-sports.io/football/teams/2816.png',
  'Denmark':       'https://media.api-sports.io/football/teams/21.png',
  'Georgia':       'https://media.api-sports.io/football/teams/1530.png',
  'Croatia':       'https://media.api-sports.io/football/teams/3.png',
}

function parseTeams(fixture) {
  const clean = fixture.replace(/\s*\(.*\)$/, '').trim()
  const parts = clean.split(' vs ')
  return parts.length === 2 ? [parts[0].trim(), parts[1].trim()] : [clean, '']
}

function TeamLogo({ name, size = 20 }) {
  const [failed, setFailed] = useState(false)
  const url = TEAM_LOGOS[name]
  if (!url || failed) return (
    <span
      className="inline-flex items-center justify-center rounded-full bg-white/10 text-gray-400 font-black flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >{name?.[0] ?? '?'}</span>
  )
  return (
    <img
      src={url} alt={name}
      onError={() => setFailed(true)}
      className="object-contain flex-shrink-0"
      style={{ width: size, height: size }}
    />
  )
}

// ── Add fixture modal ─────────────────────────────────────────────────────────
function AddFixtureModal({ weekNum, currentCount, onAdd, onClose }) {
  const [search,    setSearch]    = useState('')
  const [fixture,   setFixture]   = useState('')
  const [pickType,  setPickType]  = useState('Match Result')
  const [flash,     setFlash]     = useState('')
  const [addedThis, setAddedThis] = useState(0)
  const allFixtures = Object.values(FIXTURE_POOL).flat()
  const shown = search
    ? allFixtures.filter(f => f.toLowerCase().includes(search.toLowerCase())).slice(0, 10)
    : allFixtures.slice(0, 8)

  const handleAdd = () => {
    const fix = fixture || search
    if (!fix) return
    onAdd(fix, pickType)
    setAddedThis(n => n + 1)
    setFlash(`${fix} · ${pickType}`)
    setPickType('Match Result')
    setTimeout(() => setFlash(''), 2000)
  }

  const total = currentCount + addedThis

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative bg-[#0d1117] border border-white/12 rounded-t-2xl w-full max-w-md p-4 pb-10" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-white font-bold text-sm">Add picks · Week {weekNum}</p>
            <p className="text-gray-600 text-[10px] mt-0.5">{total} / 15 picks this week</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/8">×</button>
        </div>

        {flash && (
          <div className="mb-2 px-3 py-1.5 rounded-lg bg-green-900/30 border border-green-500/25 flex items-center gap-2">
            <span className="text-green-400 text-xs">✓</span>
            <span className="text-green-300 text-xs truncate">{flash}</span>
          </div>
        )}

        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setFixture('') }}
          placeholder="Search or type custom fixture…"
          autoFocus
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 mb-2"
        />
        <div className="max-h-40 overflow-y-auto rounded-xl border border-white/6 mb-3">
          {shown.map(f => (
            <button key={f} onClick={() => { setFixture(f); setSearch(f) }}
              className={`w-full text-left px-3 py-2 text-sm border-b border-white/5 last:border-0 transition-colors ${
                fixture === f ? 'bg-indigo-600/40 text-white' : 'text-gray-300 hover:bg-white/5'
              }`}>
              {f}
            </button>
          ))}
          {shown.length === 0 && <p className="text-gray-600 text-xs text-center py-3">No matches</p>}
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {PICK_TYPES.map(t => (
            <button key={t} onClick={() => setPickType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                pickType === t ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/4 border-white/8 text-gray-500 hover:text-gray-300'
              }`}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAdd}
            disabled={!search || total >= 15}
            className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm disabled:opacity-40 disabled:pointer-events-none transition-all">
            {total >= 15 ? 'Week full (15/15)' : '+ Add pick'}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-xl bg-white/6 hover:bg-white/10 text-gray-300 font-semibold text-sm transition-all">
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Week card ─────────────────────────────────────────────────────────────────
function WeekCard({ weekNum, weekStart, lockDt, settleDt, events, canEdit, onAdd, onRemove, dbGw, sprintDbId, onGwSaved }) {
  const [showAdd,    setShowAdd]    = useState(false)
  const [cfg,        setCfg]        = useState({})   // { base_energy, start_date, end_date, lock_time }
  const [cfgSaving,  setCfgSaving]  = useState(false)
  const [cfgSaved,   setCfgSaved]   = useState(null)

  const toDtLocal = (iso) => iso ? iso.slice(0, 16) : ''
  const toDateVal = (iso) => iso ? iso.slice(0, 10) : ''
  const setF = (k, v) => setCfg(p => ({ ...p, [k]: v }))
  const dirty = Object.keys(cfg).some(k => cfg[k] !== '' && cfg[k] != null)

  const saveCfg = async () => {
    if (!sprintDbId || !dirty) return
    setCfgSaving(true)
    setCfgSaved(null)
    try {
      const body = {}
      if (cfg.lock_time)    { body.lock_time = new Date(cfg.lock_time).toISOString(); body.reveal_time = body.lock_time }
      if (cfg.start_date)     body.start_date  = cfg.start_date
      if (cfg.end_date)       body.end_date    = cfg.end_date
      if (cfg.base_energy)    body.base_energy = Number(cfg.base_energy)

      let gwId = dbGw?.id
      if (!gwId) {
        const created = await client.post(`/admin/sprints/${sprintDbId}/gameweeks`, { sprint_week: weekNum, events: [], base_energy: body.base_energy || 30 })
        gwId = created.data.gameweek_id
        delete body.base_energy  // already set by POST
      }

      await client.patch(`/admin/sprints/${sprintDbId}/gameweeks/${gwId}`, body)
      setCfgSaved('ok')
      setCfg({})
      onGwSaved?.()
      setTimeout(() => setCfgSaved(null), 2000)
    } catch (e) {
      setCfgSaved(e.response?.data?.error || 'Save failed')
    }
    setCfgSaving(false)
  }
  // Group events by fixture for display
  const grouped = events.reduce((acc, ev, i) => {
    const key = ev.fixture
    if (!acc[key]) acc[key] = []
    acc[key].push({ type: ev.type, idx: i })
    return acc
  }, {})
  const status = getWeekStatus(weekStart, lockDt, settleDt)
  const weekEnd = addDays(weekStart, 6)

  const statusCfg = {
    FINISHED:  { bg: 'bg-gray-900/50 border-white/6',           badge: 'bg-gray-800 text-gray-500 border-gray-700/50',         dot: 'bg-gray-600',                label: 'Finished'          },
    LOCKED:    { bg: 'bg-yellow-950/30 border-yellow-700/20',   badge: 'bg-yellow-900/30 text-yellow-300 border-yellow-600/25', dot: 'bg-yellow-400',              label: 'Locked'            },
    PUBLISHED: { bg: 'bg-green-950/20 border-green-700/20',     badge: 'bg-green-900/30 text-green-300 border-green-600/25',   dot: 'bg-green-400 animate-pulse', label: 'Live — picks open' },
    DRAFT:     { bg: 'bg-white/2 border-white/6',               badge: 'bg-white/4 text-gray-600 border-white/8',              dot: 'bg-gray-700',                label: 'Upcoming'          },
  }[status]

  const countdown = status === 'PUBLISHED' ? fmtCountdown(lockDt)
    : status === 'DRAFT' ? fmtCountdown(weekStart)
    : null

  const isLocked = status === 'FINISHED' || status === 'LOCKED'

  // Use DB dates when available, fall back to sprint-schedule computation
  const displayStart = dbGw?.start_date ? new Date(dbGw.start_date) : weekStart
  const displayEnd   = dbGw?.end_date   ? new Date(dbGw.end_date)   : weekEnd

  // Derive lock/close fixture anchors from DB events
  const dbEvents = (dbGw?.events || []).filter(e => e.match_time)
  const byTime   = [...dbEvents].sort((a, b) => new Date(a.match_time) - new Date(b.match_time))
  const firstFix = byTime[0]        || null
  const lastFix  = byTime[byTime.length - 1] || null
  const lockTime  = dbGw?.lock_time  ? new Date(dbGw.lock_time)  : (events.length > 0 ? lockDt   : null)
  const closeTime = dbGw?.end_date   ? new Date(dbGw.end_date)   : (events.length > 0 ? settleDt : null)
  const lockIsFallback  = !dbGw?.lock_time
  const closeIsFallback = !dbGw?.end_date

  return (
    <div className={`rounded-2xl border overflow-hidden ${statusCfg.bg}`}>
      {showAdd && <AddFixtureModal weekNum={weekNum} currentCount={events.length} onAdd={onAdd} onClose={() => setShowAdd(false)} />}

      <div className="px-4 pt-3.5 pb-3 flex items-start gap-3">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0 border ${
          status === 'PUBLISHED' ? 'bg-green-900/40 border-green-600/30 text-green-300' :
          status === 'LOCKED'   ? 'bg-yellow-900/40 border-yellow-600/30 text-yellow-300' :
          status === 'FINISHED' ? 'bg-white/6 border-white/8 text-gray-600' :
          'bg-white/3 border-white/6 text-gray-700'
        }`}>W{weekNum}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusCfg.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusCfg.dot}`} />
              {statusCfg.label}
            </span>
            {countdown && (
              <span className={`text-[10px] font-semibold ${status === 'PUBLISHED' ? 'text-yellow-300' : 'text-indigo-300'}`}>
                {status === 'PUBLISHED' ? `· locks in ${countdown}` : `· opens in ${countdown}`}
              </span>
            )}
          </div>
          <p className="text-white text-sm font-semibold">
            {fmtDay(displayStart)} → {fmtDay(displayEnd)}
          </p>
          {(lockTime || closeTime) && (
            <div className="flex flex-col gap-0.5 mt-1">
              {lockTime && (
                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border bg-yellow-900/20 border-yellow-700/20 text-yellow-400 w-fit max-w-full truncate">
                  🔒 LOCKS {fmtDay(lockTime)} {fmtTime(lockTime)}
                  {lockIsFallback && <span className="text-yellow-700">(fallback)</span>}
                  {firstFix && <span className="text-yellow-600 ml-0.5">· {firstFix.fixture_name} KO {fmtTime(new Date(firstFix.match_time))}</span>}
                </span>
              )}
              {closeTime && (
                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border bg-orange-900/20 border-orange-700/20 text-orange-400 w-fit max-w-full truncate">
                  ⚠ FORCE-CLOSE DEADLINE {fmtDay(closeTime)} {fmtTime(closeTime)}
                  {lastFix && <span className="text-orange-600 ml-0.5">· last fixture {lastFix.fixture_name} KO {fmtTime(new Date(lastFix.match_time))}</span>}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 flex flex-col items-end gap-1">
          {canEdit && !isLocked && (
            <button onClick={() => setShowAdd(true)}
              className="text-xs text-indigo-400 hover:text-white font-semibold px-3 py-1.5 rounded-lg bg-indigo-900/30 hover:bg-indigo-900/50 border border-indigo-500/20 transition-colors">
              + Add
            </button>
          )}
          <span className={`text-[10px] font-bold tabular-nums ${events.length >= 15 ? 'text-green-400' : events.length > 0 ? 'text-indigo-400' : 'text-gray-700'}`}>
            {events.length} / 15
          </span>
        </div>
      </div>

      {/* Fixtures grouped by match */}
      <div className="px-4 pb-3.5">
        {events.length > 0 ? (
          <div className="space-y-2">
            {Object.entries(grouped).map(([fix, picks]) => {
              const [home, away] = parseTeams(fix)
              return (
              <div key={fix} className="rounded-xl bg-white/3 border border-white/6 overflow-hidden">
                <div className="px-3 py-1.5 border-b border-white/5 flex items-center gap-1.5">
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <TeamLogo name={home} size={18} />
                    <TeamLogo name={away} size={18} />
                  </div>
                  <span className="text-xs text-gray-200 font-semibold flex-1 truncate">{fix}</span>
                  <span className="text-[10px] text-gray-600">{picks.length} pick{picks.length > 1 ? 's' : ''}</span>
                </div>
                <div className="divide-y divide-white/4">
                  {picks.map(({ type, idx }) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-1.5 group">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/50 flex-shrink-0" />
                      <span className="flex-1 text-[11px] text-gray-400">{type}</span>
                      {canEdit && !isLocked && (
                        <button onClick={() => onRemove(idx)} className="text-gray-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-sm leading-none">×</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              )
            })}
          </div>
        ) : (
          <div className={`border border-dashed rounded-xl px-3 py-3 text-center ${isLocked ? 'border-white/5' : 'border-indigo-500/15'}`}>
            <p className="text-gray-600 text-xs">
              {isLocked ? 'No fixtures were assigned' : 'No fixtures yet — add before the week goes live on Monday'}
            </p>
          </div>
        )}
      </div>

      {/* Gameweek config — base energy + dates */}
      {sprintDbId && (
        <div className="mx-4 mb-3.5 pt-3 border-t border-white/6 space-y-2">
          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Gameweek config</p>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-0.5 col-span-2">
              <span className="text-[10px] text-gray-500">Base energy per user ⚡</span>
              <input type="number" min="10" max="60"
                key={`be-${weekNum}-${dbGw?.id ?? 'new'}`}
                defaultValue={dbGw?.base_energy ?? 30}
                onChange={e => setF('base_energy', e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500/50 w-24" />
            </label>
            <label className="flex flex-col gap-0.5">
              <span className="text-[10px] text-gray-500">Start date</span>
              <input type="date"
                key={`sd-${weekNum}-${dbGw?.id ?? weekStart.toISOString().slice(0,10)}`}
                defaultValue={toDateVal(dbGw?.start_date) || weekStart.toISOString().slice(0, 10)}
                onChange={e => setF('start_date', e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500/50" />
            </label>
            <label className="flex flex-col gap-0.5">
              <span className="text-[10px] text-orange-500/80">Force-close fallback ⚠</span>
              <input type="date"
                key={`ed-${weekNum}-${dbGw?.id ?? weekEnd.toISOString().slice(0,10)}`}
                defaultValue={toDateVal(dbGw?.end_date) || weekEnd.toISOString().slice(0, 10)}
                onChange={e => setF('end_date', e.target.value)}
                className="bg-white/5 border border-orange-500/20 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500/50" />
            </label>
            <label className="flex flex-col gap-0.5 col-span-2">
              <span className="text-[10px] text-gray-500">Lock time (picks freeze)</span>
              <input type="datetime-local"
                key={`lt-${weekNum}-${dbGw?.id ?? 'new'}`}
                defaultValue={toDtLocal(dbGw?.lock_time)}
                onChange={e => setF('lock_time', e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500/50" />
            </label>
          </div>
          <div className="flex items-center gap-2 pt-0.5">
            <button onClick={saveCfg} disabled={!dirty || cfgSaving}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 disabled:opacity-40 text-white transition-colors">
              {cfgSaving ? 'Saving…' : 'Save config'}
            </button>
            {cfgSaved === 'ok' && <span className="text-[11px] text-green-400">✓ Saved</span>}
            {cfgSaved && cfgSaved !== 'ok' && <span className="text-[11px] text-red-400">{cfgSaved}</span>}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sprint status pill ────────────────────────────────────────────────────────
function SprintStatusPill({ status }) {
  if (status === 'LIVE') return (
    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-green-900/40 text-green-300 border border-green-500/30">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />LIVE
    </span>
  )
  if (status === 'UPCOMING') return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-900/30 text-indigo-400 border border-indigo-500/20">UPCOMING</span>
  )
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-gray-600 border border-white/8">DONE</span>
  )
}

// ── Gameweek Date Editor ──────────────────────────────────────────────────────
function GameweekDateEditor({ sprintId }) {
  const [sprint,  setSprint]  = useState(null)   // full sprint row incl. start_date
  const [dbGws,   setDbGws]   = useState([])
  const [loading, setLoading] = useState(false)
  const [open,    setOpen]    = useState({})      // weekNum → bool
  const [edits,   setEdits]   = useState({})
  const [saving,  setSaving]  = useState({})
  const [saved,   setSaved]   = useState({})

  const fetchData = async (id) => {
    if (!id) { setSprint(null); setDbGws([]); return }
    setLoading(true)
    try {
      const r = await client.get(`/admin/sprints/${id}`)
      setSprint(r.data)
      setDbGws(r.data.gameweeks || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { setEdits({}); setSaved({}); fetchData(sprintId) }, [sprintId])

  // Compute Mon–Sun defaults for each week from sprint start_date
  const weekDefault = (weekNum) => {
    if (!sprint?.start_date) return { start: '', end: '' }
    const mon = new Date(sprint.start_date)
    mon.setUTCDate(mon.getUTCDate() + (weekNum - 1) * 7)
    const sun = new Date(mon)
    sun.setUTCDate(sun.getUTCDate() + 6)
    return {
      start: mon.toISOString().slice(0, 10),
      end:   sun.toISOString().slice(0, 10),
    }
  }

  const toIso     = (v) => v ? new Date(v).toISOString() : undefined
  const toDateVal = (iso) => iso ? iso.slice(0, 10) : ''
  const toDtLocal = (iso) => iso ? iso.slice(0, 16) : ''

  const setField = (weekNum, field, val) =>
    setEdits(p => ({ ...p, [weekNum]: { ...p[weekNum], [field]: val } }))

  const save = async (weekNum) => {
    const patch   = edits[weekNum] || {}
    const def     = weekDefault(weekNum)
    const hasPatch = Object.keys(patch).some(k => patch[k])
    if (!hasPatch) return
    setSaving(p => ({ ...p, [weekNum]: true }))
    setSaved(p => ({ ...p, [weekNum]: null }))
    try {
      const body = {}
      if (patch.start_date) body.start_date = patch.start_date
      if (patch.end_date)   body.end_date   = patch.end_date
      if (patch.lock_time)  { body.lock_time = toIso(patch.lock_time); body.reveal_time = body.lock_time }

      let gwId = dbGws.find(g => g.sprint_week === weekNum)?.id
      if (!gwId) {
        const cr = await client.post(`/admin/sprints/${sprintId}/gameweeks`, {
          sprint_week: weekNum,
          events: [],
          // seed defaults so DB row has sensible start/end even before PATCH
        })
        gwId = cr.data.gameweek_id
      }

      await client.patch(`/admin/sprints/${sprintId}/gameweeks/${gwId}`, body)
      setEdits(p => ({ ...p, [weekNum]: {} }))
      setSaved(p => ({ ...p, [weekNum]: 'ok' }))
      await fetchData(sprintId)
    } catch (e) {
      setSaved(p => ({ ...p, [weekNum]: e.response?.data?.error || 'Error' }))
    }
    setSaving(p => ({ ...p, [weekNum]: false }))
  }

  if (!sprintId) return (
    <div className="bg-[#0d1117] border border-white/8 rounded-2xl px-4 py-4">
      <p className="text-white font-bold text-sm mb-1">Gameweek date windows</p>
      <p className="text-gray-600 text-xs">Select a sprint in the Sprints tab first.</p>
    </div>
  )

  return (
    <div className="bg-[#0d1117] border border-white/8 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/6">
        <p className="text-white font-bold text-sm">Gameweek date windows</p>
        <p className="text-gray-500 text-xs mt-0.5">Mon–Sun defaults pre-filled. Edit any week and save.</p>
      </div>
      <div className="px-4 py-4 space-y-3">
        {[1, 2, 3, 4].map(weekNum => {
          const dbGw  = dbGws.find(g => g.sprint_week === weekNum) || null
          const def   = weekDefault(weekNum)
          const e     = edits[weekNum] || {}
          const dirty = Object.keys(e).some(k => e[k])
          const sv    = saved[weekNum]

          // Resolved display values: DB > edits > Mon-Sun default
          const startVal = toDateVal(dbGw?.start_date) || def.start
          const endVal   = toDateVal(dbGw?.end_date)   || def.end
          const lockVal  = toDtLocal(dbGw?.lock_time)

          // Lock / close source fixtures
          const gwEvents  = (dbGw?.events || []).filter(e => e.match_time)
          const byTime    = [...gwEvents].sort((a, b) => new Date(a.match_time) - new Date(b.match_time))
          const firstFix  = byTime[0] || null
          const lastFix   = byTime[byTime.length - 1] || null
          const lockDt    = dbGw?.lock_time ? new Date(dbGw.lock_time) : null
          const closeDt   = dbGw?.end_date  ? new Date(dbGw.end_date)  : null

          return (
            <div key={weekNum} className="rounded-xl border border-white/6 bg-white/2 p-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-bold">
                    Week {weekNum}
                    <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      loading                    ? 'bg-white/5 text-gray-700'        :
                      !dbGw                      ? 'bg-white/5 text-gray-500'        :
                      dbGw.status === 'FINISHED' ? 'bg-gray-800 text-gray-500'       :
                      dbGw.status === 'LOCKED'   ? 'bg-yellow-900/40 text-yellow-400':
                      dbGw.status === 'PUBLISHED'? 'bg-green-900/40 text-green-400'  :
                                                   'bg-white/5 text-gray-500'
                    }`}>{loading ? '…' : dbGw ? dbGw.status : 'EMPTY'}</span>
                  </p>
                  {startVal && endVal && (
                    <p className="text-gray-500 text-[11px] mt-0.5">{startVal} → {endVal}</p>
                  )}
                </div>
                <button
                  onClick={() => setOpen(p => ({ ...p, [weekNum]: !p[weekNum] }))}
                  className="flex-shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-colors">
                  {open[weekNum] ? 'Hide' : 'Edit dates'}
                </button>
              </div>

              {(lockDt || closeDt) && (
                <div className="flex flex-col gap-1">
                  {lockDt && (
                    <span className="inline-flex flex-wrap items-center gap-x-1.5 text-[10px] px-2 py-1 rounded-lg border bg-yellow-900/20 border-yellow-700/20 text-yellow-400 w-fit max-w-full">
                      🔒 <span className="font-semibold">LOCKS</span> {fmtDay(lockDt)} {fmtTime(lockDt)}
                      {firstFix && (
                        <span className="text-yellow-600/80">
                          · {firstFix.fixture_name} KO {fmtTime(new Date(firstFix.match_time))}
                        </span>
                      )}
                    </span>
                  )}
                  {closeDt && (
                    <span className="inline-flex flex-wrap items-center gap-x-1.5 text-[10px] px-2 py-1 rounded-lg border bg-orange-900/20 border-orange-700/20 text-orange-400 w-fit max-w-full">
                      ⚠ <span className="font-semibold">FORCE-CLOSE DEADLINE</span> {fmtDay(closeDt)} {fmtTime(closeDt)}
                      {lastFix && (
                        <span className="text-orange-600/80">
                          · last fixture {lastFix.fixture_name} KO {fmtTime(new Date(lastFix.match_time))}
                        </span>
                      )}
                    </span>
                  )}
                </div>
              )}

              {open[weekNum] && (
                <>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/6">
                    <label className="block">
                      <span className="text-gray-500 text-[10px] uppercase tracking-wider block mb-1">Start (Mon)</span>
                      <input type="date"
                        key={`sd-${weekNum}-${dbGw?.id ?? def.start}`}
                        defaultValue={startVal}
                        onChange={ev => setField(weekNum, 'start_date', ev.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500/50" />
                    </label>
                    <label className="block">
                      <span className="text-orange-500/80 text-[10px] uppercase tracking-wider block mb-1">⚠ Force-close fallback</span>
                      <input type="date"
                        key={`ed-${weekNum}-${dbGw?.id ?? def.end}`}
                        defaultValue={endVal}
                        onChange={ev => setField(weekNum, 'end_date', ev.target.value)}
                        className="w-full bg-white/5 border border-orange-500/20 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500/50" />
                    </label>
                    <label className="block col-span-2">
                      <span className="text-gray-500 text-[10px] uppercase tracking-wider block mb-1">Lock time</span>
                      <input type="datetime-local"
                        key={`lt-${weekNum}-${dbGw?.id ?? def.start}`}
                        defaultValue={lockVal}
                        onChange={ev => setField(weekNum, 'lock_time', ev.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500/50" />
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <button disabled={!dirty || saving[weekNum]} onClick={() => save(weekNum)}
                      className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:pointer-events-none text-white font-bold text-xs transition-colors">
                      {saving[weekNum] ? 'Saving…' : 'Save dates'}
                    </button>
                    {sv === 'ok' && <span className="text-green-400 text-xs">✓ Saved</span>}
                    {sv && sv !== 'ok' && <span className="text-red-400 text-xs truncate">{sv}</span>}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const navigate = useNavigate()
  const [activeTab,      setActiveTab]      = useState('sprints')
  const [toolResult,     setToolResult]     = useState(null)
  const [toolLoading,    setToolLoading]    = useState(false)
  const [knockoutGwId,   setKnockoutGwId]   = useState('')
  const [knockoutEvents, setKnockoutEvents] = useState(null)
  const [knockoutLoading, setKnockoutLoading] = useState(false)
  const [knockoutError,  setKnockoutError]  = useState(null)
  const [selectedSprint, setSelectedSprint] = useState(() => {
    // Default to the live sprint, or next upcoming one
    const live = SPRINT_SCHEDULE.find(s => getSprintStatus(s.start) === 'LIVE')
    return live?.id ?? SPRINT_SCHEDULE.find(s => getSprintStatus(s.start) === 'UPCOMING')?.id ?? SPRINT_SCHEDULE[SPRINT_SCHEDULE.length - 1].id
  })

  // Per-sprint, per-week fixture state
  const [allWeekEvents, setAllWeekEvents] = useState(() => {
    const init = {}
    SPRINT_SCHEDULE.forEach(s => {
      init[s.id] = {
        1: [], 2: [], 3: [], 4: [],
        // Pre-load some fixtures for the current upcoming sprint
        ...(s.id === 5 ? {
          1: [
            { fixture: 'USA vs Panama',         type: 'Match Result' },
            { fixture: 'Germany vs Denmark',     type: 'Match Result' },
            { fixture: 'France vs Portugal',     type: 'Match Result' },
            { fixture: 'Spain vs Georgia',       type: 'Match Result' },
            { fixture: 'Argentina vs Australia', type: 'Goals Over/Under' },
            { fixture: 'Brazil vs Mexico',       type: 'BTTS' },
          ],
          2: [
            { fixture: 'England vs Netherlands', type: 'Match Result' },
            { fixture: 'Italy vs Morocco',       type: 'Match Result' },
          ],
        } : {}),
      }
    })
    return init
  })

  const addEvent    = (sprintId, w, fix, type) => setAllWeekEvents(p => ({ ...p, [sprintId]: { ...p[sprintId], [w]: [...(p[sprintId][w] || []), { fixture: fix, type }] } }))
  const removeEvent = (sprintId, w, i)         => setAllWeekEvents(p => ({ ...p, [sprintId]: { ...p[sprintId], [w]: p[sprintId][w].filter((_, j) => j !== i) } }))

  const [dbSprintId,   setDbSprintId]   = useState(null)
  const [dbGameweeks,  setDbGameweeks]  = useState([])

  const loadDbSprint = async (sprintStartDate) => {
    try {
      const listRes = await client.get('/admin/sprints')
      const match = (listRes.data || []).find(s => s.start_date?.slice(0, 10) === sprintStartDate)
      if (!match) { setDbSprintId(null); setDbGameweeks([]); return }
      setDbSprintId(match.id)
      const detailRes = await client.get(`/admin/sprints/${match.id}`)
      const gws = (detailRes.data.gameweeks || []).sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
      setDbGameweeks(gws)
    } catch { setDbSprintId(null); setDbGameweeks([]) }
  }

  useEffect(() => {
    const s = SPRINT_SCHEDULE.find(sp => sp.id === selectedSprint)
    if (s) loadDbSprint(s.start)
  }, [selectedSprint])

  const sprint = SPRINT_SCHEDULE.find(s => s.id === selectedSprint)
  const sprintStatus = sprint ? getSprintStatus(sprint.start) : null
  const sprintWeeks  = sprint ? getSprintWeeks(sprint.start)  : []
  const sprintEnd    = sprintWeeks[3] ? addDays(sprintWeeks[3].weekStart, 6) : null
  const canEdit      = sprintStatus !== 'COMPLETED'

  return (
    <div className="min-h-screen bg-[#0a0d12] text-white pb-16">

      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0a0d12]/96 backdrop-blur border-b border-white/8">
        <div className="max-w-md mx-auto px-4 pt-4 pb-3">
          <p className="text-gray-500 text-[10px] font-semibold tracking-widest uppercase">Admin panel</p>
          <p className="text-white font-bold text-lg leading-tight">Sprint Manager</p>
        </div>

        {/* Tabs */}
        <div className="max-w-md mx-auto px-4 pb-2 flex gap-1">
          {[['sprints', 'Sprints'], ['rules', 'Lifecycle rules'], ['tools', 'Tools']].map(([k, label]) => (
            <button key={k} onClick={() => setActiveTab(k)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === k ? 'bg-white/10 text-white' : 'text-gray-600 hover:text-gray-400'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4">
        <button
          onClick={() => navigate('/admin/energy-packs')}
          className="w-full flex items-center gap-4 p-4 rounded-2xl border border-indigo-500/20 bg-indigo-950/30 hover:bg-indigo-950/50 transition-colors text-left mb-5"
        >
          <div className="w-11 h-11 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-xl flex-shrink-0">
            ⚡
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm">Energy Packs</p>
            <p className="text-gray-500 text-xs mt-0.5">Create packs · upload images from your computer · set prices</p>
          </div>
          <svg width="16" height="16" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" viewBox="0 0 24 24" className="flex-shrink-0">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>

      <div className="max-w-md mx-auto px-4 pt-0 space-y-5">

        {/* ── LIFECYCLE RULES TAB ─────────────────────────────────────────── */}
        {activeTab === 'rules' && (
          <>
            <div className="bg-[#0d1117] border border-white/8 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/6">
                <p className="text-white font-bold text-sm">Automatic sprint lifecycle</p>
                <p className="text-gray-500 text-xs mt-0.5">Statuses update on their own — no manual action needed</p>
              </div>
              <div className="px-4 py-4 space-y-3.5">
                {[
                  { dot: 'bg-green-500',  color: 'text-green-400',  trigger: 'Admin publishes',        from: 'DRAFT',     to: 'PUBLISHED', desc: 'Picks open — players can submit until the lock time' },
                  { dot: 'bg-yellow-400', color: 'text-yellow-400', trigger: 'Admin-set lock time',    from: 'PUBLISHED', to: 'LOCKED',    desc: 'Picks freeze — set this before the first match kick-off' },
                  { dot: 'bg-gray-500',   color: 'text-gray-400',   trigger: 'All fixtures settled',   from: 'LOCKED',    to: 'FINISHED',  desc: 'Scores awarded automatically once every fixture of the week is done. Force-close fallback triggers if any fixture gets stuck (set it well after the last KO).' },
                  { dot: 'bg-purple-500', color: 'text-purple-400', trigger: 'Last week FINISHED',     from: null, to: null, desc: 'Sprint settles — promotions/relegations applied. If the next week has no fixtures yet, the app holds on the completed week until admin defines them. Sprint only settles when the gameweek with the highest week number finishes.' },
                ].map((s, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5">
                      <div className={`w-2 h-2 rounded-full ${s.dot}`} />
                      {i < 3 && <div className="w-px flex-1 bg-white/6 min-h-[20px]" />}
                    </div>
                    <div className="pb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-xs font-bold ${s.color}`}>{s.trigger}</p>
                        {s.from && <span className="text-[10px] text-gray-700">{s.from} → {s.to}</span>}
                      </div>
                      <p className="text-gray-400 text-xs mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-indigo-950/25 border border-indigo-500/15 rounded-2xl px-4 py-4 space-y-2">
              <p className="text-indigo-300 font-semibold text-sm">Admin checklist per week</p>
              <ol className="text-gray-400 text-xs leading-relaxed space-y-1.5 list-none">
                <li><span className="text-white font-semibold">1.</span> Add fixtures and publish the week before the first match.</li>
                <li><span className="text-white font-semibold">2.</span> Set the <span className="text-yellow-300 font-semibold">lock time</span> to just before the first match kick-off — picks freeze here.</li>
                <li><span className="text-white font-semibold">3.</span> Set the <span className="text-orange-300 font-semibold">force-close fallback</span> to a few hours after the last match of the week — this is a safety net only; the system closes naturally as fixtures settle.</li>
                <li><span className="text-white font-semibold">4.</span> The sprint settles automatically after the <span className="text-white font-semibold">last defined week</span> finishes. Add the next week's fixtures any time — the sprint won't settle until they're done too.</li>
              </ol>
            </div>
          </>
        )}

        {/* ── SPRINTS TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'sprints' && (
          <>
            {/* Sprint selector */}
            <div className="bg-[#0d1117] border border-white/8 rounded-2xl overflow-hidden">
              <div className="px-4 pt-3 pb-1">
                <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider mb-2">Season 2026 · Sprint calendar</p>
              </div>
              <div className="divide-y divide-white/5">
                {SPRINT_SCHEDULE.map(s => {
                  const st    = getSprintStatus(s.start)
                  const weeks = getSprintWeeks(s.start)
                  const end   = addDays(weeks[3].weekStart, 6)
                  const isSelected = s.id === selectedSprint
                  return (
                    <button key={s.id} onClick={() => setSelectedSprint(s.id)}
                      className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                        isSelected ? 'bg-indigo-600/15' : 'hover:bg-white/3'
                      }`}>
                      <div className={`w-1.5 h-8 rounded-full flex-shrink-0 ${
                        st === 'LIVE' ? 'bg-green-400' : st === 'UPCOMING' ? 'bg-indigo-500/60' : 'bg-gray-700'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-sm font-bold ${isSelected ? 'text-white' : st === 'COMPLETED' ? 'text-gray-500' : 'text-gray-200'}`}>
                            {s.name}
                          </p>
                          <SprintStatusPill status={st} />
                        </div>
                        <p className="text-gray-600 text-[10px] mt-0.5">
                          {fmtShort(weeks[0].weekStart)} → {fmtShort(end)}
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-white/15 bg-transparent'
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Selected sprint detail */}
            {sprint && (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-base leading-tight">{sprint.name}</p>
                    <p className="text-gray-600 text-xs">
                      {sprintEnd ? `${fmtShort(sprintWeeks[0].weekStart)} → ${fmtShort(sprintEnd)}` : ''}
                      {' · up to 4 matchweeks · settles after last week'}
                    </p>
                  </div>
                  <SprintStatusPill status={sprintStatus} />
                </div>

                {sprintStatus === 'COMPLETED' && (
                  <div className="bg-white/3 border border-white/6 rounded-2xl px-4 py-3 text-center">
                    <p className="text-gray-500 text-xs">This sprint has finished. Fixture history is read-only.</p>
                  </div>
                )}

                <div className="space-y-3">
                  {sprintWeeks.map((w, i) => (
                    <WeekCard
                      key={i}
                      weekNum={i + 1}
                      weekStart={w.weekStart}
                      lockDt={w.lockDt}
                      settleDt={w.settleDt}
                      events={allWeekEvents[sprint.id]?.[i + 1] || []}
                      canEdit={canEdit}
                      onAdd={(fix, type) => addEvent(sprint.id, i + 1, fix, type)}
                      onRemove={idx => removeEvent(sprint.id, i + 1, idx)}
                      dbGw={dbGameweeks[i] || null}
                      sprintDbId={dbSprintId}
                      onGwSaved={() => loadDbSprint(sprint.start)}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ── TOOLS TAB ────────────────────────────────────────────────────── */}
        {activeTab === 'tools' && (
          <div className="space-y-4">
            <GameweekDateEditor sprintId={dbSprintId} />

            <div className="bg-[#0d1117] border border-white/8 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/6">
                <p className="text-white font-bold text-sm">Settlement repair</p>
                <p className="text-gray-500 text-xs mt-0.5">Fix picks that were settled incorrectly due to timing issues</p>
              </div>
              <div className="px-4 py-4 space-y-3">
                <div className="rounded-xl border border-orange-500/20 bg-orange-950/20 p-4">
                  <p className="text-orange-300 font-semibold text-sm mb-1">Fix broken WHO_QUALIFIES picks</p>
                  <p className="text-gray-400 text-xs mb-3">
                    Detects events where all options ended up as LOST — impossible in real knockout football.
                    Happens when a game settled at FT before going to extra time / penalties.
                    Re-fetches fixture data and resettles picks and LP correctly.
                  </p>
                  <button
                    disabled={toolLoading}
                    onClick={async () => {
                      setToolLoading(true)
                      setToolResult(null)
                      try {
                        const res = await client.post('/admin/debug/fix-who-qualifies')
                        setToolResult({ ok: true, data: res.data })
                      } catch (e) {
                        setToolResult({ ok: false, error: e.response?.data?.error || e.message })
                      } finally {
                        setToolLoading(false)
                      }
                    }}
                    className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-sm transition-colors"
                  >
                    {toolLoading ? 'Running…' : 'Run fix now'}
                  </button>
                </div>

                {toolResult && (
                  <div className={`rounded-xl border p-4 text-xs font-mono whitespace-pre-wrap break-all ${
                    toolResult.ok ? 'border-green-500/30 bg-green-950/20 text-green-300' : 'border-red-500/30 bg-red-950/20 text-red-300'
                  }`}>
                    {toolResult.ok ? JSON.stringify(toolResult.data, null, 2) : `Error: ${toolResult.error}`}
                  </div>
                )}
              </div>
            </div>

            {/* Knockout flag manager */}
            <div className="bg-[#0d1117] border border-white/8 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/6">
                <p className="text-white font-bold text-sm">Knockout event flags</p>
                <p className="text-gray-500 text-xs mt-0.5">Mark events as knockout matches so extra-time goals count in goal markets</p>
              </div>
              <div className="px-4 py-4 space-y-3">
                <div className="flex gap-2">
                  <input
                    value={knockoutGwId}
                    onChange={e => setKnockoutGwId(e.target.value)}
                    placeholder="Gameweek ID"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-700 font-mono focus:outline-none focus:border-indigo-500/50"
                  />
                  <button
                    disabled={!knockoutGwId.trim() || knockoutLoading}
                    onClick={async () => {
                      setKnockoutLoading(true)
                      setKnockoutError(null)
                      try {
                        const res = await client.get(`/admin/gameweek/${knockoutGwId.trim()}`)
                        const goalTypes = ['GOALS','BTTS','CLEAN_SHEET','PLAYER_SCORE']
                        setKnockoutEvents(
                          (res.data.events || []).filter(e => goalTypes.includes(e.event_type))
                        )
                      } catch (e) {
                        setKnockoutError(e.response?.data?.error || e.message)
                        setKnockoutEvents(null)
                      } finally {
                        setKnockoutLoading(false)
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-sm transition-colors"
                  >
                    {knockoutLoading ? '…' : 'Load'}
                  </button>
                </div>

                {knockoutError && (
                  <p className="text-red-400 text-xs">{knockoutError}</p>
                )}

                {knockoutEvents && knockoutEvents.length === 0 && (
                  <p className="text-gray-600 text-xs">No goal-market events found in this gameweek.</p>
                )}

                {knockoutEvents && knockoutEvents.length > 0 && (
                  <div className="space-y-2">
                    {knockoutEvents.map(ev => (
                      <div key={ev.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/3 border border-white/6">
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-semibold truncate">{ev.fixture_name}</p>
                          <p className="text-gray-600 text-[10px]">{ev.event_type}</p>
                        </div>
                        <button
                          onClick={async () => {
                            const next = !ev.is_knockout
                            try {
                              await client.patch(`/admin/events/${ev.id}`, { is_knockout: next })
                              setKnockoutEvents(prev => prev.map(e => e.id === ev.id ? { ...e, is_knockout: next } : e))
                            } catch (e) {
                              alert(e.response?.data?.error || e.message)
                            }
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                            ev.is_knockout
                              ? 'bg-amber-900/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/60'
                              : 'bg-white/4 border-white/8 text-gray-500 hover:text-gray-300 hover:bg-white/8'
                          }`}
                        >
                          {ev.is_knockout ? '⚡ Knockout' : 'Regular'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
