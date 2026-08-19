import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getLeague, getLeagueStandings, leaveLeague, updateLeague, getSprints, updatePeriod } from '../api/leagues'
import Spinner from '../components/ui/Spinner'

const TABS = ['Standings', 'Members', 'Settings']
const ADMIN_TABS = ['Standings', 'Members', 'Settings']

export default function LeagueDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState('Standings')
  const [league, setLeague] = useState(null)
  const [standings, setStandings] = useState([])
  const [loading, setLoading] = useState(true)
  const [leaving, setLeaving] = useState(false)
  const [editName, setEditName] = useState('')
  const [editFee, setEditFee] = useState('')
  const [editImageUrl, setEditImageUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState(null)
  const [sprints, setSprints] = useState([])
  const [periodName, setPeriodName] = useState('')
  const [startSprintId, setStartSprintId] = useState('')
  const [endSprintId, setEndSprintId] = useState('')
  const [savingPeriod, setSavingPeriod] = useState(false)
  const [periodMsg, setPeriodMsg] = useState(null)

  const load = useCallback(async () => {
    try {
      const [lRes, sRes] = await Promise.all([getLeague(id), getLeagueStandings(id)])
      setLeague(lRes.data)
      setStandings(sRes.data.standings || [])
    } catch { navigate('/leagues') }
    finally { setLoading(false) }
  }, [id, navigate])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!league) return
    if (league.my_role === 'admin') {
      getSprints().then(r => setSprints(r.data || [])).catch(() => {})
    }
    if (league.periods?.[0]) {
      setPeriodName(league.periods[0].name || '')
    }
  }, [league])

  if (loading) return (
    <div className="min-h-screen bg-[#0a0d12] flex items-center justify-center">
      <Spinner size={32} />
    </div>
  )
  if (!league) return null

  const isAdmin = league.my_role === 'admin'
  const currentPeriod = league.periods?.[0]

  return (
    <div className="min-h-screen bg-[#0a0d12] text-white pb-24">
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

        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-950 via-violet-900/40 to-indigo-950 border border-indigo-500/25 rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-3xl flex-shrink-0 overflow-hidden">
              {league.image_url
                ? <img src={league.image_url} alt={league.name} className="w-full h-full object-cover rounded-xl" />
                : '🏆'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-white font-black text-lg truncate">{league.name}</h1>
                {isAdmin && <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/25 text-indigo-300 font-semibold flex-shrink-0">Admin</span>}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>👥 {league.member_count} members</span>
                {league.entry_fee_euros > 0 && <span>€{parseFloat(league.entry_fee_euros).toFixed(2)} entry</span>}
              </div>
            </div>
          </div>

          {/* Invite code (admin only) */}
          {isAdmin && (
            <div className="mt-4 flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl px-4 py-2.5">
              <span className="text-gray-500 text-xs">Invite code</span>
              <span className="text-indigo-300 font-mono font-bold tracking-widest text-sm flex-1">{league.invite_code}</span>
              <button
                onClick={() => navigator.clipboard.writeText(league.invite_code)}
                className="text-gray-500 hover:text-white text-xs transition-colors"
              >Copy</button>
            </div>
          )}

          {/* Current period */}
          {currentPeriod && (
            <div className="mt-3 flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                currentPeriod.status === 'live' ? 'bg-green-500/15 text-green-400' : 'bg-gray-500/15 text-gray-400'
              }`}>{currentPeriod.name}</span>
              {currentPeriod.status === 'live' && <span className="text-green-400/70 text-xs">· Active period</span>}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/3 border border-white/8 rounded-2xl p-1 mb-4">
          {(isAdmin ? ADMIN_TABS : TABS).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-colors ${tab === t ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Standings */}
        {tab === 'Standings' && (
          <div className="space-y-3">
            {/* Prize pool (if configured) */}
            {(() => {
              const prizes = Array.isArray(currentPeriod?.prize_config) ? currentPeriod.prize_config : []
              if (prizes.length === 0) return null
              const icons = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣']
              return (
                <div className="bg-[#0d1117] border border-amber-500/20 rounded-2xl p-4">
                  <p className="text-amber-400/80 text-[10px] font-black uppercase tracking-widest mb-3">Prize Pool</p>
                  <div className="flex flex-wrap gap-3">
                    {prizes.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 bg-amber-500/8 border border-amber-500/15 rounded-xl px-3 py-2">
                        <span className="text-base">{icons[i] || '🏅'}</span>
                        <div>
                          <p className="text-amber-300 font-black text-sm leading-none">€{parseFloat(p.amount_euros).toFixed(0)}</p>
                          <p className="text-amber-700 text-[10px] mt-0.5">{['1st Place','2nd Place','3rd Place','4th Place','5th Place'][i] || `${i+1}th`}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
          <div className="bg-[#0d1117] border border-white/8 rounded-2xl overflow-hidden">
            {standings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-sm">No picks submitted yet</p>
                <p className="text-gray-700 text-xs mt-1">Standings will appear once gameweeks are settled</p>
              </div>
            ) : (
              <div className="divide-y divide-white/4">
                {standings.map((row, i) => (
                  <div key={row.user_id} className="flex items-center gap-4 px-4 py-3">
                    <span className={`w-6 text-sm font-black text-center flex-shrink-0 ${
                      i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gray-600'
                    }`}>{row.position}</span>
                    <div className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center text-sm font-bold flex-shrink-0 overflow-hidden">
                      {row.avatar_url
                        ? <img src={row.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                        : <span className="text-indigo-300">{row.display_name?.[0]?.toUpperCase()}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{row.display_name}</p>
                      <p className="text-gray-600 text-xs">{row.gameweeks_played} GW · {row.correct_picks} correct</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-white font-black text-lg leading-none">{row.total_points}</p>
                      <p className="text-gray-600 text-[10px] mt-0.5">pts</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          </div>
        )}

        {/* Members */}
        {tab === 'Members' && (
          <div className="bg-[#0d1117] border border-white/8 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5">
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest">{league.members?.length} members</p>
            </div>
            <div className="divide-y divide-white/4">
              {(league.members || []).map(m => (
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
                  {league.entry_fee_euros > 0 && (
                    <span className={`text-xs px-2 py-1 rounded-lg font-semibold ${
                      m.has_paid ? 'bg-green-500/15 text-green-400' : 'bg-red-500/10 text-red-400'
                    }`}>{m.has_paid ? '✅ Paid' : '⏳ Pending'}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-white/5">
              <button
                onClick={async () => {
                  if (!window.confirm('Leave this league? You can rejoin with the invite code.')) return
                  setLeaving(true)
                  try {
                    await leaveLeague(id)
                    navigate('/leagues')
                  } catch (e) {
                    alert(e.response?.data?.error || 'Could not leave league')
                    setLeaving(false)
                  }
                }}
                disabled={leaving}
                className="text-red-500/70 hover:text-red-400 text-sm font-semibold transition-colors disabled:opacity-40"
              >
                {leaving ? 'Leaving…' : 'Leave league'}
              </button>
            </div>
          </div>
        )}

        {/* Settings */}
        {tab === 'Settings' && !isAdmin && (
          <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-5 space-y-4">
            <div>
              <label className="text-gray-500 text-[11px] font-semibold uppercase tracking-widest block mb-1.5">League name</label>
              <div className="bg-white/3 border border-white/8 rounded-xl px-4 py-3 text-white text-sm">{league.name}</div>
            </div>
            {league.entry_fee_euros > 0 && (
              <div>
                <label className="text-gray-500 text-[11px] font-semibold uppercase tracking-widest block mb-1.5">Entry fee (€)</label>
                <div className="bg-white/3 border border-white/8 rounded-xl px-4 py-3 text-white text-sm">€{parseFloat(league.entry_fee_euros).toFixed(2)}</div>
              </div>
            )}
            {league.image_url && (
              <div>
                <label className="text-gray-500 text-[11px] font-semibold uppercase tracking-widest block mb-1.5">League image</label>
                <div className="w-full h-24 rounded-xl overflow-hidden border border-white/8">
                  <img src={league.image_url} alt="" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
            {currentPeriod && (
              <div>
                <label className="text-gray-500 text-[11px] font-semibold uppercase tracking-widest block mb-1.5">Current period</label>
                <div className="bg-white/3 border border-white/8 rounded-xl px-4 py-3 text-white text-sm">{currentPeriod.name}</div>
              </div>
            )}
          </div>
        )}

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
              <label className="text-gray-500 text-[11px] font-semibold uppercase tracking-widest block mb-1.5">League image URL</label>
              <div className="flex gap-3 items-start">
                <input value={editImageUrl || league.image_url || ''} onChange={e => setEditImageUrl(e.target.value)}
                  placeholder="https://…"
                  className="flex-1 bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 transition-colors placeholder-gray-700" />
                {(editImageUrl || league.image_url) && (
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 bg-white/5">
                    <img src={editImageUrl || league.image_url} alt="" className="w-full h-full object-cover"
                      onError={e => { e.target.style.display = 'none' }} />
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="text-gray-500 text-[11px] font-semibold uppercase tracking-widest block mb-1.5">Invite code</label>
              <div className="flex items-center gap-3 bg-white/3 border border-white/8 rounded-xl px-4 py-3">
                <span className="text-indigo-300 font-mono font-bold tracking-widest text-sm flex-1">{league.invite_code}</span>
                <button onClick={() => navigator.clipboard.writeText(league.invite_code)}
                  className="text-gray-500 hover:text-white text-xs transition-colors flex-shrink-0">Copy</button>
              </div>
            </div>
            <div className="flex items-center gap-4 pt-1">
              <button
                onClick={async () => {
                  setSaving(true); setSaveMsg(null)
                  try {
                    await updateLeague(id, {
                      name: editName || undefined,
                      entry_fee_euros: editFee !== '' ? parseFloat(editFee) : undefined,
                      image_url: editImageUrl || undefined,
                    })
                    setSaveMsg('Saved ✓')
                    load()
                  } catch { setSaveMsg('Save failed') }
                  finally { setSaving(false) }
                }}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-colors disabled:opacity-40"
                style={{ background: 'linear-gradient(90deg,#6366f1,#4f46e5)' }}
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              {saveMsg && <p className={`text-sm ${saveMsg.includes('✓') ? 'text-green-400' : 'text-red-400'}`}>{saveMsg}</p>}
            </div>

            {/* Period date range */}
            {currentPeriod && (
              <div className="pt-2 border-t border-white/8 space-y-3">
                <p className="text-gray-500 text-[11px] font-semibold uppercase tracking-widest">League Period</p>
                <div>
                  <label className="text-gray-500 text-[11px] font-semibold uppercase tracking-widest block mb-1.5">Period name</label>
                  <input value={periodName} onChange={e => setPeriodName(e.target.value)}
                    className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-500 text-[11px] font-semibold uppercase tracking-widest block mb-1.5">Starts from</label>
                    <select value={startSprintId} onChange={e => setStartSprintId(e.target.value)}
                      className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-3 text-white text-sm outline-none focus:border-indigo-500 transition-colors appearance-none">
                      <option value="">All time</option>
                      {sprints.map(s => (
                        <option key={s.id} value={s.id} className="bg-[#0d1117]">
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-500 text-[11px] font-semibold uppercase tracking-widest block mb-1.5">Ends after</label>
                    <select value={endSprintId} onChange={e => setEndSprintId(e.target.value)}
                      className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-3 text-white text-sm outline-none focus:border-indigo-500 transition-colors appearance-none">
                      <option value="">All time</option>
                      {sprints.map(s => (
                        <option key={s.id} value={s.id} className="bg-[#0d1117]">
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {(startSprintId || endSprintId) && (() => {
                  const s = sprints.find(x => x.id === startSprintId)
                  const e = sprints.find(x => x.id === endSprintId)
                  const fmt = d => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                  if (s || e) return (
                    <p className="text-indigo-400/70 text-xs">
                      Standings cover: {s ? fmt(s.start_date) : '…'} → {e ? fmt(e.end_date) : '…'}
                    </p>
                  )
                })()}
                <div className="flex items-center gap-4">
                  <button
                    onClick={async () => {
                      setSavingPeriod(true); setPeriodMsg(null)
                      try {
                        await updatePeriod(id, currentPeriod.id, {
                          name: periodName || undefined,
                          start_sprint_id: startSprintId || undefined,
                          end_sprint_id: endSprintId || undefined,
                        })
                        setPeriodMsg('Saved ✓')
                        load()
                      } catch { setPeriodMsg('Save failed') }
                      finally { setSavingPeriod(false) }
                    }}
                    disabled={savingPeriod}
                    className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-colors disabled:opacity-40"
                    style={{ background: 'linear-gradient(90deg,#6366f1,#4f46e5)' }}
                  >
                    {savingPeriod ? 'Saving…' : 'Save period'}
                  </button>
                  {periodMsg && <p className={`text-sm ${periodMsg.includes('✓') ? 'text-green-400' : 'text-red-400'}`}>{periodMsg}</p>}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
