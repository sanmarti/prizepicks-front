import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyLeagues, createLeague, joinLeague } from '../api/leagues'
import Spinner from '../components/ui/Spinner'

function StarIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  )
}

export default function LeaguesPage() {
  const navigate = useNavigate()
  const [leagues, setLeagues] = useState([])
  const [loading, setLoading] = useState(true)
  const [showJoin, setShowJoin] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  const load = useCallback(async () => {
    try {
      const { data } = await getMyLeagues()
      setLeagues(data || [])
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="min-h-screen bg-[#0a0d12] text-white pb-24">
      <div className="max-w-md mx-auto px-4 pt-safe-5">

        {/* Header */}
        <div className="pt-6 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-black">Leagues</h1>
            <p className="text-gray-500 text-sm mt-0.5">Your private competitions</p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-colors">
            + Create
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size={28} /></div>
        ) : leagues.length === 0 ? (
          <EmptyState onCreate={() => setShowCreate(true)} onJoin={() => setShowJoin(true)} />
        ) : (
          <div className="space-y-3">
            {leagues.map(l => (
              <LeagueCard key={l.id} league={l} onClick={() => navigate(`/leagues/${l.id}`)} />
            ))}
            <div className="space-y-2 mt-2">
              <button onClick={() => setShowCreate(true)}
                className="w-full py-3.5 rounded-2xl text-white text-sm font-bold transition-colors"
                style={{ background: 'linear-gradient(90deg,#6366f1,#4f46e5)', boxShadow: '0 4px 16px rgba(99,102,241,0.25)' }}>
                + Create a new league
              </button>
              <button onClick={() => setShowJoin(true)}
                className="w-full py-3.5 rounded-2xl border border-indigo-500/30 bg-indigo-500/8 text-indigo-400 text-sm font-bold hover:bg-indigo-500/14 transition-colors">
                Join another league with a code
              </button>
            </div>
          </div>
        )}


      </div>

      {showJoin && <JoinModal onClose={() => setShowJoin(false)} onJoined={() => { setShowJoin(false); load() }} />}
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load() }} />}
    </div>
  )
}

const STATUS_BADGE = {
  draft:     'bg-gray-500/20 text-gray-400 border-gray-500/30',
  open:      'bg-blue-500/20 text-blue-400 border-blue-500/30',
  active:    'bg-green-500/20 text-green-400 border-green-500/30',
  completed: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
}
const STATUS_LABEL = { draft: 'Draft', open: 'Open', active: 'Active', completed: 'Finished' }

function LeagueCard({ league, onClick }) {
  const statusCls = STATUS_BADGE[league.status] || STATUS_BADGE.draft
  return (
    <div onClick={onClick}
      className="bg-[#0d1117] border border-white/8 rounded-2xl overflow-hidden cursor-pointer hover:border-indigo-500/30 transition-all active:scale-[0.99]">

      {/* Header image / banner */}
      <div className="relative h-32 overflow-hidden">
        {league.image_url
          ? <img src={league.image_url} alt={league.name} className="w-full h-full object-cover object-center" />
          : <div className="w-full h-full bg-gradient-to-br from-indigo-950 via-violet-900/50 to-slate-950" />}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117]/95 via-[#0d1117]/30 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span className={`text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm font-bold border ${statusCls}`}>
            {STATUS_LABEL[league.status] || 'Draft'}
          </span>
          {league.role === 'admin' && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-indigo-300 border border-indigo-500/30 font-bold">Admin</span>
          )}
        </div>

        {/* Bottom: name */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
          <p className="text-white font-black text-base leading-tight truncate">{league.name}</p>
          {league.total_weeks > 0 && (
            <p className="text-white/40 text-[11px] mt-0.5">Week {league.current_week} of {league.total_weeks}</p>
          )}
        </div>
      </div>

      {/* Progress bar (active leagues) */}
      {league.status === 'active' && league.total_weeks > 0 && (
        <div className="h-0.5 bg-white/8">
          <div className="h-full bg-indigo-500 transition-all"
            style={{ width: `${Math.min((league.current_week / league.total_weeks) * 100, 100)}%` }} />
        </div>
      )}

      {/* Info row */}
      <div className="px-4 py-3 flex items-center justify-between border-t border-white/5">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>👥 {league.member_count}</span>
          {league.entry_fee_euros > 0 && <span>€{parseFloat(league.entry_fee_euros).toFixed(2)}</span>}
        </div>
        <div className="flex items-center gap-3">
          {league.my_position != null && (
            <span className="text-indigo-400 font-black text-sm">
              #{league.my_position} <span className="text-gray-600 font-normal text-xs">of {league.member_count}</span>
            </span>
          )}
          <svg className="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ onCreate, onJoin }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
      <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-4xl">
        🏆
      </div>
      <div>
        <p className="text-white font-bold text-lg">No leagues yet</p>
        <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
          Create a private league or join one with an invite code. Compete with friends and track the standings.
        </p>
      </div>
      <div className="w-full space-y-3 pt-2">
        <button onClick={onCreate}
          className="w-full py-3.5 rounded-2xl font-bold text-sm text-white transition-colors"
          style={{ background: 'linear-gradient(90deg,#6366f1,#4f46e5)', boxShadow: '0 4px 20px rgba(99,102,241,0.3)' }}>
          + Create a league
        </button>
        <button onClick={onJoin}
          className="w-full py-3.5 rounded-2xl font-bold text-sm text-indigo-400 border border-indigo-500/30 bg-indigo-500/8 hover:bg-indigo-500/14 transition-colors">
          Join with a code
        </button>
      </div>
    </div>
  )
}

function JoinModal({ onClose, onJoined }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)

  async function handleJoin() {
    if (code.length < 4) return
    setLoading(true); setErr(null)
    try {
      await joinLeague(code.trim())
      onJoined()
    } catch (e) {
      setErr(e.response?.data?.error || 'Invalid code or already a member')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4 pb-6 sm:pb-0"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm bg-[#0d1117] border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-black text-lg">Join a league</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
        </div>
        <p className="text-gray-500 text-sm">Enter the invite code shared by the league admin.</p>
        <input value={code} onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. ERAU2025"
          maxLength={10}
          className="w-full px-4 py-3 rounded-xl text-white text-center text-lg font-mono font-bold tracking-[0.2em] bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-500 placeholder-gray-700 transition-colors" />
        {err && <p className="text-red-400 text-sm text-center">{err}</p>}
        <button onClick={handleJoin} disabled={code.length < 4 || loading}
          className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(90deg,#6366f1,#4f46e5)' }}>
          {loading ? <><Spinner size={16} /> Joining…</> : 'Join league'}
        </button>
      </div>
    </div>
  )
}

function CreateModal({ onClose, onCreated }) {
  const [name, setName] = useState('')
  const [fee, setFee] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)

  async function handleCreate() {
    if (!name.trim()) return
    setLoading(true); setErr(null)
    try {
      await createLeague({ name: name.trim(), entry_fee_euros: fee ? parseFloat(fee) : 0 })
      onCreated()
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed to create league')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4 pb-6 sm:pb-0"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm bg-[#0d1117] border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-black text-lg">Create a league</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-widest block mb-1.5">League name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. ERAU Prescott, Friday FC…"
              className="w-full px-4 py-3 rounded-xl text-white text-sm bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-500 placeholder-gray-700 transition-colors" />
          </div>
          <div>
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-widest block mb-1.5">Entry fee (€) — optional</label>
            <input type="number" step="0.01" min="0" value={fee} onChange={e => setFee(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 rounded-xl text-white text-sm bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-500 placeholder-gray-700 transition-colors" />
          </div>
        </div>
        <p className="text-gray-600 text-xs">An invite code will be generated automatically. Share it with your friends to let them join.</p>
        {err && <p className="text-red-400 text-sm">{err}</p>}
        <button onClick={handleCreate} disabled={!name.trim() || loading}
          className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(90deg,#6366f1,#4f46e5)' }}>
          {loading ? <><Spinner size={16} /> Creating…</> : 'Create league'}
        </button>
      </div>
    </div>
  )
}
