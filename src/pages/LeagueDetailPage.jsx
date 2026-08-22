import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getLeague, getLeagueStandings, getLeagueCalendar, leaveLeague, updateLeague, toggleMemberPayment, activateLeague } from '../api/leagues'
import { useAuthStore } from '../store/authStore'
import Spinner from '../components/ui/Spinner'

const TABS = ['Standings', 'Calendar', 'Members', 'Settings']

const STATUS_LABEL = {
  draft:     { label: 'Draft',    cls: 'bg-gray-500/15 text-gray-400 border-gray-500/25' },
  open:      { label: 'Open',     cls: 'bg-blue-500/15 text-blue-400 border-blue-500/25' },
  active:    { label: 'Active',   cls: 'bg-green-500/15 text-green-400 border-green-500/25' },
  completed: { label: 'Finished', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
}

export default function LeagueDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tab,        setTab]        = useState('Standings')
  const [league,     setLeague]     = useState(null)
  const [standings,  setStandings]  = useState([])
  const [calendar,   setCalendar]   = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [leaving,    setLeaving]    = useState(false)
  const [editName,   setEditName]   = useState('')
  const [editFee,    setEditFee]    = useState('')
  const [editImg,    setEditImg]    = useState('')
  const [saving,     setSaving]     = useState(false)
  const [saveMsg,    setSaveMsg]    = useState(null)
  const [activating, setActivating] = useState(false)
  const [activateErr, setActivateErr] = useState(null)
  const myUserId = useAuthStore(s => s.user?.userId)

  const load = useCallback(async () => {
    try {
      const [lRes, sRes, cRes] = await Promise.all([
        getLeague(id),
        getLeagueStandings(id),
        getLeagueCalendar(id).catch(() => ({ data: null })),
      ])
      setLeague(lRes.data)
      setStandings(sRes.data?.standings || [])
      setCalendar(cRes.data)
    } catch { navigate('/leagues') }
    finally { setLoading(false) }
  }, [id, navigate])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <div className="min-h-screen bg-[#0a0d12] flex items-center justify-center"><Spinner size={32} /></div>
  )
  if (!league) return null

  const isAdmin = league.my_role === 'admin'
  const statusInfo = STATUS_LABEL[league.status] ?? STATUS_LABEL.draft

  return (
    <div className="min-h-screen bg-[#0a0d12] text-white pb-28">
      <div className="max-w-md mx-auto px-4 pt-safe-5">

        {/* Back */}
        <div className="pt-4 pb-2">
          <button onClick={() => navigate('/leagues')}
            className="flex items-center gap-1.5 text-gray-500 hover:text-white text-sm transition-colors">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Leagues
          </button>
        </div>

        {/* Hero header */}
        <div className="relative rounded-2xl overflow-hidden mb-4" style={{ minHeight: 140 }}>
          {league.image_url
            ? <img src={league.image_url} alt={league.name} className="absolute inset-0 w-full h-full object-cover" />
            : <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-violet-900/40 to-indigo-950" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          <div className="relative px-5 pt-4 pb-5 flex flex-col justify-end h-full" style={{ minHeight: 140 }}>
            <div className="flex items-end justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${statusInfo.cls}`}>{statusInfo.label}</span>
                  {isAdmin && <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/25 text-indigo-300 font-semibold border border-indigo-500/30">Admin</span>}
                </div>
                <h1 className="text-white font-black text-xl leading-tight truncate">{league.name}</h1>
                <div className="flex items-center gap-3 text-xs text-white/40 mt-1">
                  <span>👥 {league.member_count} members</span>
                  {league.total_weeks > 0 && <span>Week {league.current_week}/{league.total_weeks}</span>}
                  {league.entry_fee_euros > 0 && <span>€{parseFloat(league.entry_fee_euros).toFixed(2)}</span>}
                </div>
              </div>
              {league.total_weeks > 0 && (
                <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-black/40 border border-white/10 flex flex-col items-center justify-center">
                  <p className="text-white font-black text-lg leading-none">{league.current_week}</p>
                  <p className="text-white/40 text-[9px]">of {league.total_weeks}</p>
                </div>
              )}
            </div>
            {/* Season progress bar */}
            {league.total_weeks > 0 && (
              <div className="mt-3 h-1 bg-white/15 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-400 rounded-full"
                  style={{ width: `${Math.min((league.current_week / league.total_weeks) * 100, 100)}%` }} />
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/3 border border-white/8 rounded-2xl p-1 mb-4">
          {(isAdmin ? TABS : TABS.filter(t => t !== 'Settings')).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 px-1 rounded-xl text-xs font-semibold transition-colors ${tab === t ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* ── Standings ── */}
        {tab === 'Standings' && (
          <StandingsTab standings={standings} leagueStatus={league.status} myUserId={myUserId} inviteCode={league.invite_code} />
        )}

        {/* ── Calendar ── */}
        {tab === 'Calendar' && (
          <CalendarTab
            calendar={calendar}
            currentWeek={league.current_week}
            isAdmin={isAdmin}
            leagueStatus={league.status}
            memberCount={league.member_count}
            onActivate={async (startWeek) => {
              setActivating(true); setActivateErr(null)
              try { await activateLeague(id, startWeek); await load() }
              catch (e) { setActivateErr(e.response?.data?.error || 'Could not activate league') }
              finally { setActivating(false) }
            }}
            activating={activating}
            activateErr={activateErr}
          />
        )}

        {/* ── Members ── */}
        {tab === 'Members' && (
          <MembersTab
            members={league.members || []}
            leagueId={id}
            entryFee={league.entry_fee_euros}
            isAdmin={isAdmin}
            onLeave={async () => {
              if (!window.confirm('Leave this league?')) return
              setLeaving(true)
              try { await leaveLeague(id); navigate('/leagues') }
              catch (e) { alert(e.response?.data?.error || 'Could not leave'); setLeaving(false) }
            }}
            leaving={leaving}
          />
        )}

        {/* ── Settings (admin) ── */}
        {tab === 'Settings' && isAdmin && (
          <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-5 space-y-4">
            <div>
              <label className="text-gray-500 text-[11px] font-semibold uppercase tracking-widest block mb-1.5">League name</label>
              <input value={editName || league.name} onChange={e => setEditName(e.target.value)}
                className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 transition-colors" />
            </div>
            <div>
              <label className="text-gray-500 text-[11px] font-semibold uppercase tracking-widest block mb-1.5">Entry fee (€)</label>
              <input type="number" step="0.01" min="0"
                value={editFee !== '' ? editFee : league.entry_fee_euros}
                onChange={e => setEditFee(e.target.value)}
                className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 transition-colors" />
            </div>
            <div>
              <label className="text-gray-500 text-[11px] font-semibold uppercase tracking-widest block mb-1.5">Invite code</label>
              <div className="flex gap-2 items-center">
                <input readOnly value={league.invite_code}
                  className="flex-1 bg-white/3 border border-white/8 rounded-xl px-4 py-3 text-indigo-300 font-mono font-bold tracking-widest text-sm outline-none cursor-default" />
                <button type="button" onClick={() => navigator.clipboard.writeText(league.invite_code)}
                  className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/8 rounded-xl text-gray-400 hover:text-white text-xs font-semibold transition-colors">
                  Copy
                </button>
              </div>
            </div>
            <div>
              <label className="text-gray-500 text-[11px] font-semibold uppercase tracking-widest block mb-1.5">League image URL</label>
              <div className="flex gap-3 items-start">
                <input value={editImg || league.image_url || ''} onChange={e => setEditImg(e.target.value)}
                  placeholder="https://…"
                  className="flex-1 bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 transition-colors placeholder-gray-700" />
                {(editImg || league.image_url) && (
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 bg-white/5">
                    <img src={editImg || league.image_url} alt="" className="w-full h-full object-cover"
                      onError={e => { e.target.style.display = 'none' }} />
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 pt-1">
              <button
                onClick={async () => {
                  setSaving(true); setSaveMsg(null)
                  try {
                    await updateLeague(id, {
                      name:            editName  || undefined,
                      entry_fee_euros: editFee !== '' ? parseFloat(editFee) : undefined,
                      image_url:       editImg   || undefined,
                    })
                    setSaveMsg('Saved ✓')
                    load()
                  } catch { setSaveMsg('Save failed') }
                  finally { setSaving(false) }
                }}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-colors disabled:opacity-40"
                style={{ background: 'linear-gradient(90deg,#6366f1,#4f46e5)' }}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              {saveMsg && <p className={`text-sm ${saveMsg.includes('✓') ? 'text-green-400' : 'text-red-400'}`}>{saveMsg}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Standings tab ─────────────────────────────────────────────────────────────
function StandingsTab({ standings, leagueStatus, myUserId, inviteCode }) {
  if (standings.length === 0) return (
    <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-8 text-center">
      <p className="text-gray-500 text-sm">No standings yet</p>
      <p className="text-gray-700 text-xs mt-1">
        {leagueStatus === 'draft' || leagueStatus === 'open'
          ? 'Standings appear once the season starts and weeks are settled.'
          : 'Standings will update after each week is settled.'}
      </p>
    </div>
  )

  return (
  <>
    <div className="bg-[#0d1117] border border-white/8 rounded-2xl overflow-hidden">
      {/* Header row */}
      <div className="grid grid-cols-[32px_1fr_28px_28px_28px_28px_40px] gap-1 px-4 py-2 border-b border-white/5">
        <span />
        <span className="text-gray-600 text-[10px] font-semibold uppercase tracking-widest">Player</span>
        <span className="text-gray-600 text-[10px] font-semibold uppercase tracking-widest text-center">W</span>
        <span className="text-gray-600 text-[10px] font-semibold uppercase tracking-widest text-center">D</span>
        <span className="text-gray-600 text-[10px] font-semibold uppercase tracking-widest text-center">L</span>
        <span className="text-gray-600 text-[10px] font-semibold uppercase tracking-widest text-center">TRP</span>
        <span className="text-gray-600 text-[10px] font-semibold uppercase tracking-widest text-right">Pts</span>
      </div>
      <div className="divide-y divide-white/4">
        {standings.map((row, i) => {
          const isMe = row.user_id === myUserId
          return (
          <div key={row.user_id} className={`grid grid-cols-[32px_1fr_28px_28px_28px_28px_40px] gap-1 items-center px-4 py-3 ${isMe ? 'bg-indigo-500/10 border-l-2 border-indigo-500' : i === 0 ? 'bg-amber-500/4' : ''}`}>
            <span className={`text-sm font-black text-center ${
              i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gray-600'
            }`}>{row.position}</span>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden">
                {row.avatar_url
                  ? <img src={row.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                  : <span className="text-indigo-300">{row.display_name?.[0]?.toUpperCase()}</span>}
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-semibold truncate ${isMe ? 'text-indigo-300' : 'text-white'}`}>
                  {row.display_name}{isMe && <span className="ml-1 text-[9px] text-indigo-400/70 font-normal">you</span>}
                </p>
                {row.division_name && <p className="text-gray-700 text-[9px]">{row.division_name}</p>}
              </div>
            </div>
            <span className="text-green-400 text-xs font-bold text-center">{row.wins ?? 0}</span>
            <span className="text-gray-400 text-xs font-bold text-center">{row.draws ?? 0}</span>
            <span className="text-red-400/70 text-xs font-bold text-center">{row.losses ?? 0}</span>
            <span className="text-indigo-400 text-xs text-center tabular-nums font-semibold">
              {row.right_picks ?? row.goals_for ?? 0}
            </span>
            <span className="text-white font-black text-sm text-right tabular-nums">{row.league_points ?? 0}</span>
          </div>
          )
        })}
      </div>
    </div>

    {inviteCode && leagueStatus !== 'active' && leagueStatus !== 'completed' && (
      <div className="flex items-center gap-3 bg-white/3 border border-white/8 rounded-2xl px-4 py-3 mt-3">
        <span className="text-gray-600 text-xs">Invite code</span>
        <span className="text-indigo-300 font-mono font-bold tracking-widest text-sm flex-1">{inviteCode}</span>
        <button onClick={() => navigator.clipboard.writeText(inviteCode)}
          className="text-gray-600 hover:text-white text-xs transition-colors">Copy</button>
      </div>
    )}
  </>
  )
}

// ── Calendar tab ──────────────────────────────────────────────────────────────
function CalendarTab({ calendar, currentWeek, isAdmin, leagueStatus, memberCount, activating, activateErr, onActivate }) {
  const [startWeek, setStartWeek] = useState('')

  const totalWeeks   = memberCount >= 4 ? (memberCount - 1) * 2 : null
  const endWeek      = startWeek && totalWeeks ? parseInt(startWeek) + totalWeeks - 1 : null
  const canActivate  = startWeek && parseInt(startWeek) >= 1 && memberCount >= 4

  if (!calendar?.calendar || Object.keys(calendar.calendar).length === 0) {
    if (isAdmin && leagueStatus === 'draft') {
      return (
        <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-6 space-y-5">
          <div className="text-center space-y-1.5">
            <p className="text-3xl">📅</p>
            <p className="text-white font-bold text-base">Set up the season</p>
            <p className="text-gray-500 text-xs">
              {memberCount} players · {totalWeeks ?? '?'} weeks total ({Math.ceil(memberCount / 2)} matches/week)
            </p>
          </div>

          <div>
            <label className="text-gray-500 text-[11px] font-semibold uppercase tracking-widest block mb-2">
              Starting week number
            </label>
            <input
              type="number" min="1" value={startWeek}
              onChange={e => setStartWeek(e.target.value)}
              placeholder="e.g. 5"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 transition-colors"
            />
            {startWeek && totalWeeks && (
              <p className="text-indigo-400 text-xs mt-2 text-center font-semibold">
                Week {startWeek} → Week {endWeek} &nbsp;·&nbsp; {totalWeeks} matchweeks
              </p>
            )}
          </div>

          <div className="bg-white/3 border border-white/8 rounded-xl px-4 py-3 text-xs text-gray-600 leading-relaxed">
            Once activated, the full double round-robin calendar is generated — every player faces every other player twice (home & away). Make sure all players have joined first.
          </div>

          <button
            disabled={activating || !canActivate}
            onClick={() => onActivate(parseInt(startWeek))}
            className="w-full py-3.5 rounded-2xl font-black text-sm text-white transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
          >
            {activating
              ? <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".25"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                  Generating calendar…
                </span>
              : 'Activate League'}
          </button>
          {activateErr && <p className="text-red-400 text-xs text-center">{activateErr}</p>}
        </div>
      )
    }
    return (
      <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-8 text-center space-y-2">
        <p className="text-3xl">📅</p>
        <p className="text-gray-500 text-sm font-semibold">No calendar yet</p>
        <p className="text-gray-700 text-xs">The admin will generate the season calendar once all players have joined.</p>
      </div>
    )
  }

  const weeks = Object.keys(calendar.calendar).map(Number).sort((a, b) => a - b)

  return (
    <div className="space-y-3">
      {weeks.map(week => {
        const matches = calendar.calendar[week] || []
        const isCurrent = week === currentWeek
        return (
          <div key={week} className={`bg-[#0d1117] border rounded-2xl overflow-hidden ${isCurrent ? 'border-indigo-500/30' : 'border-white/8'}`}>
            <div className={`px-4 py-2.5 border-b border-white/5 flex items-center justify-between ${isCurrent ? 'bg-indigo-500/8' : ''}`}>
              <p className={`text-[11px] font-black uppercase tracking-widest ${isCurrent ? 'text-indigo-400' : 'text-gray-500'}`}>Week {week}</p>
              {isCurrent && <span className="text-[9px] font-black text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded-full">Current</span>}
            </div>
            <div className="divide-y divide-white/4">
              {matches.map(m => {
                const settled = m.status === 'SETTLED'
                return (
                  <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0 text-right">
                      <p className="text-white text-xs font-semibold truncate">{m.home_name}</p>
                      {settled && (
                        <p className={`text-[10px] font-black ${m.home_league_points === 3 ? 'text-green-400' : m.home_league_points === 1 ? 'text-gray-400' : 'text-red-400/60'}`}>
                          {m.home_league_points === 3 ? 'W' : m.home_league_points === 1 ? 'D' : 'L'}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-center w-14">
                      {settled
                        ? <p className="text-white font-black text-sm">{m.home_score} – {m.away_score}</p>
                        : <p className="text-gray-600 text-xs">vs</p>}
                      <p className="text-gray-700 text-[9px]">{settled ? 'FT' : m.status === 'PENDING' ? 'Open' : '—'}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-semibold truncate">{m.away_name}</p>
                      {settled && (
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

// ── Members tab ───────────────────────────────────────────────────────────────
function MembersTab({ members, leagueId, entryFee, isAdmin, onLeave, leaving }) {
  return (
    <div className="space-y-3">
      <div className="bg-[#0d1117] border border-white/8 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest">{members.length} members</p>
        </div>
        <div className="divide-y divide-white/4">
          {members.map(m => (
            <div key={m.user_id} className="flex items-center gap-3 px-4 py-3">
              <div className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center text-sm font-bold flex-shrink-0 overflow-hidden">
                {m.avatar_url
                  ? <img src={m.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                  : <span className="text-indigo-300">{m.display_name?.[0]?.toUpperCase()}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white text-sm font-medium truncate">{m.display_name}</p>
                  {m.role === 'admin' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold">Admin</span>}
                </div>
              </div>
              {entryFee > 0 && (
                <span className={`text-xs px-2 py-1 rounded-lg font-semibold ${
                  m.has_paid ? 'bg-green-500/15 text-green-400' : 'bg-red-500/10 text-red-400'
                }`}>{m.has_paid ? '✅ Paid' : '⏳ Pending'}</span>
              )}
            </div>
          ))}
        </div>
      </div>
      <button onClick={onLeave} disabled={leaving}
        className="w-full py-3 rounded-xl text-sm font-semibold text-red-500/70 hover:text-red-400 transition-colors disabled:opacity-40">
        {leaving ? 'Leaving…' : 'Leave league'}
      </button>
    </div>
  )
}
