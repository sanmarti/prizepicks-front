import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

// ── Fixed sprint calendar ─────────────────────────────────────────────────────
// Each sprint is 4 × Mon–Sun weeks. Dates are definitive — no manual input.
const SPRINT_SCHEDULE = [
  { id: 1, name: 'Spring Kickoff',  start: '2026-03-02' },
  { id: 2, name: 'April Clash',     start: '2026-04-06' },
  { id: 3, name: 'Champions Run',   start: '2026-05-04' },
  { id: 4, name: 'June Showdown',   start: '2026-06-01' },
  { id: 5, name: 'July Knockouts',  start: '2026-06-29' },
]

// ── Date helpers ──────────────────────────────────────────────────────────────
// Demo reference date: June sprint is settled with invented results;
// July sprint is the active one. Statuses compute from this fixed reference.
const NOW = new Date('2026-07-01T10:00:00')

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

// ── Add fixture modal ─────────────────────────────────────────────────────────
function AddFixtureModal({ weekNum, onAdd, onClose }) {
  const [search,   setSearch]   = useState('')
  const [fixture,  setFixture]  = useState('')
  const [pickType, setPickType] = useState('Match Result')
  const allFixtures = Object.values(FIXTURE_POOL).flat()
  const shown = search
    ? allFixtures.filter(f => f.toLowerCase().includes(search.toLowerCase())).slice(0, 10)
    : allFixtures.slice(0, 8)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative bg-[#0d1117] border border-white/12 rounded-t-2xl w-full max-w-md p-4 pb-10" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-white font-bold text-sm">Add fixture · Week {weekNum}</p>
          <button onClick={onClose} className="text-gray-500 hover:text-white w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/8">×</button>
        </div>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setFixture('') }}
          placeholder="Search or type custom fixture…"
          autoFocus
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 mb-2"
        />
        <div className="max-h-44 overflow-y-auto rounded-xl border border-white/6 mb-3">
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
        <button
          onClick={() => { if (!search) return; onAdd(fixture || search, pickType); onClose() }}
          disabled={!search}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm disabled:opacity-40 disabled:pointer-events-none transition-all">
          Add to Week {weekNum}
        </button>
      </div>
    </div>
  )
}

// ── Week card ─────────────────────────────────────────────────────────────────
function WeekCard({ weekNum, weekStart, lockDt, settleDt, events, canEdit, onAdd, onRemove }) {
  const [showAdd, setShowAdd] = useState(false)
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

  return (
    <div className={`rounded-2xl border overflow-hidden ${statusCfg.bg}`}>
      {showAdd && <AddFixtureModal weekNum={weekNum} onAdd={onAdd} onClose={() => setShowAdd(false)} />}

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
            {fmtDay(weekStart)} → {fmtDay(weekEnd)}
          </p>
          <p className="text-gray-600 text-[10px] mt-0.5">
            Lock {fmtShort(lockDt)} {fmtTime(lockDt)} · Settle {fmtShort(settleDt)} 00:00
          </p>
        </div>

        {canEdit && !isLocked && (
          <button onClick={() => setShowAdd(true)}
            className="flex-shrink-0 text-xs text-indigo-400 hover:text-white font-semibold px-3 py-1.5 rounded-lg bg-indigo-900/30 hover:bg-indigo-900/50 border border-indigo-500/20 transition-colors">
            + Add
          </button>
        )}
      </div>

      {/* Fixtures */}
      <div className="px-4 pb-3.5">
        {events.length > 0 ? (
          <div className="space-y-1">
            {events.map((ev, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/4 border border-white/6 group">
                <span className="flex-1 text-xs text-gray-200 truncate">{ev.fixture}</span>
                <span className="text-[10px] text-gray-600 flex-shrink-0">{ev.type}</span>
                {canEdit && !isLocked && (
                  <button onClick={() => onRemove(i)} className="text-gray-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-sm leading-none">×</button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className={`border border-dashed rounded-xl px-3 py-3 text-center ${isLocked ? 'border-white/5' : 'border-indigo-500/15'}`}>
            <p className="text-gray-600 text-xs">
              {isLocked ? 'No fixtures were assigned' : 'No fixtures yet — add before the week goes live on Monday'}
            </p>
          </div>
        )}
      </div>
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

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const navigate = useNavigate()
  const [activeTab,      setActiveTab]      = useState('sprints')
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
          {[['sprints', 'Sprints'], ['rules', 'Lifecycle rules']].map(([k, label]) => (
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
                  { dot: 'bg-green-500',  color: 'text-green-400',  trigger: 'Monday 00:00',    from: 'DRAFT',     to: 'PUBLISHED', desc: 'Week opens automatically — players can submit picks' },
                  { dot: 'bg-yellow-400', color: 'text-yellow-400', trigger: 'Sunday 20:00',    from: 'PUBLISHED', to: 'LOCKED',    desc: 'Picks lock — no more submissions accepted' },
                  { dot: 'bg-gray-500',   color: 'text-gray-400',   trigger: 'Monday 00:00',    from: 'LOCKED',    to: 'FINISHED',  desc: 'Results settle, LP awarded, next week activates' },
                  { dot: 'bg-purple-500', color: 'text-purple-400', trigger: 'After Week 4',    from: null, to: null, desc: 'Sprint closes, final rankings locked, promotions/relegations applied' },
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

            <div className="bg-indigo-950/25 border border-indigo-500/15 rounded-2xl px-4 py-4">
              <p className="text-indigo-300 font-semibold text-sm mb-1">Admin's only job</p>
              <p className="text-gray-400 text-xs leading-relaxed">
                Assign fixtures to each matchweek <span className="text-white font-semibold">before it goes live on Monday</span>.
                The system handles open, lock, settle, and sprint close automatically based on the fixed calendar.
              </p>
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
                      {' · 4 matchweeks'}
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
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
