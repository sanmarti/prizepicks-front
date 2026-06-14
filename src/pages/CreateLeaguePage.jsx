import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createLeague } from '../api/leagues'
import { useAuthStore } from '../store/authStore'
import Avatar from '../components/ui/Avatar'
import Toast from '../components/ui/Toast'
import Spinner from '../components/ui/Spinner'

const LOGOS = ['⚽', '👑', '⚡', '🏆']
const COMPETITIONS = ['EPL', 'CHAMPIONS', 'LALIGA', 'SERIEA', 'WORLD CUP']
const SEASONS = ['2024/25', '2025/26', 'World Cup 2026']
const TEAM_LIMITS = [2, 4, 8, 12, 16, 20]
const MISSED_WEEK_OPTIONS = [
  { id: 'random', icon: '🎲', label: 'Random valid picks' },
  { id: 'auto',   icon: '⭐', label: 'Auto favorite picks' },
  { id: 'zero',   icon: '0️⃣', label: 'No picks = 0' },
]
const FORMATS = [
  { id: 'standings', icon: '🏆', label: 'Final Standings' },
  { id: 'playoffs',  icon: '🏆', label: 'Playoffs' },
]

function ProgressDots({ step }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2, 3].map((s) => (
        <div
          key={s}
          className="rounded-full transition-all"
          style={{
            width: s === step ? 24 : 8,
            height: 8,
            background: s <= step ? 'var(--accent-purple)' : 'var(--bg-surface2)',
          }}
        />
      ))}
    </div>
  )
}

function StepLabel({ step }) {
  return (
    <p className="text-center text-[11px] font-mono mb-4" style={{ color: 'var(--text-muted)' }}>
      Step {step} of 3
    </p>
  )
}

// ── Step 1 ────────────────────────────────────────────────────────────────────
function Step1({ data, onChange, onNext }) {
  const user = useAuthStore((s) => s.user)
  return (
    <div>
      {/* Creator card */}
      <div
        className="flex items-center gap-3 p-3 rounded-xl mb-5"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface2)' }}
      >
        <Avatar name={user?.name ?? 'U'} size={40} />
        <div>
          <p className="font-syne font-500 text-sm" style={{ color: 'var(--text-primary)' }}>{user?.name ?? 'You'}</p>
          <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>Creating a new league</p>
        </div>
      </div>

      {/* League name */}
      <label className="text-[10px] font-mono tracking-widest block mb-1.5" style={{ color: 'var(--text-muted)' }}>LEAGUE NAME</label>
      <input
        className="w-full px-3 py-2.5 rounded-xl text-sm font-mono outline-none mb-4"
        style={{ background: 'var(--bg-surface2)', border: '1px solid var(--accent-purple-dim)', color: 'var(--text-primary)' }}
        placeholder="Sunday Ballers"
        value={data.name}
        onChange={(e) => onChange('name', e.target.value)}
        onFocus={(e) => (e.target.style.borderColor = 'var(--accent-purple)')}
        onBlur={(e) => (e.target.style.borderColor = 'var(--accent-purple-dim)')}
      />

      {/* Logo */}
      <label className="text-[10px] font-mono tracking-widest block mb-2" style={{ color: 'var(--text-muted)' }}>CHOOSE LOGO</label>
      <div className="grid grid-cols-4 gap-2 mb-4">
        {LOGOS.map((logo) => (
          <button
            key={logo}
            onClick={() => onChange('logo', logo)}
            className="aspect-square rounded-xl flex items-center justify-center text-2xl transition-all"
            style={{
              background: data.logo === logo ? 'var(--accent-purple-dim)' : 'var(--bg-surface2)',
              border: data.logo === logo ? '2px solid var(--accent-purple)' : '1px solid transparent',
            }}
          >
            {logo}
          </button>
        ))}
      </div>

      {/* Competition */}
      <label className="text-[10px] font-mono tracking-widest block mb-2" style={{ color: 'var(--text-muted)' }}>COMPETITION</label>
      <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
        {COMPETITIONS.map((c) => (
          <button
            key={c}
            onClick={() => onChange('competition', c)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-mono transition-all"
            style={
              data.competition === c
                ? { background: 'var(--accent-purple)', color: '#fff' }
                : { background: 'var(--bg-surface2)', color: 'var(--text-secondary)' }
            }
          >
            {c}
          </button>
        ))}
      </div>

      {/* Season */}
      <label className="text-[10px] font-mono tracking-widest block mb-1.5" style={{ color: 'var(--text-muted)' }}>SEASON</label>
      <select
        className="w-full px-3 py-2.5 rounded-xl text-sm font-mono outline-none mb-4"
        style={{ background: 'var(--bg-surface2)', border: '1px solid var(--accent-purple-dim)', color: 'var(--text-primary)' }}
        value={data.season}
        onChange={(e) => onChange('season', e.target.value)}
      >
        {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      {/* Team limit */}
      <label className="text-[10px] font-mono tracking-widest block mb-1.5" style={{ color: 'var(--text-muted)' }}>TEAM LIMIT</label>
      <select
        className="w-full px-3 py-2.5 rounded-xl text-sm font-mono outline-none mb-6"
        style={{ background: 'var(--bg-surface2)', border: '1px solid var(--accent-purple-dim)', color: 'var(--text-primary)' }}
        value={data.teamLimit}
        onChange={(e) => onChange('teamLimit', Number(e.target.value))}
      >
        {TEAM_LIMITS.map((n) => <option key={n} value={n}>{n} teams</option>)}
      </select>

      <button
        onClick={onNext}
        disabled={!data.name || !data.competition}
        className="w-full py-3 rounded-xl font-syne font-700 text-sm tracking-wide transition-all hover:brightness-110 active:scale-[0.99]"
        style={{ background: data.name && data.competition ? 'var(--accent-purple)' : 'var(--bg-surface2)', color: '#fff' }}
      >
        CONTINUE →
      </button>
    </div>
  )
}

// ── Step 2 ────────────────────────────────────────────────────────────────────
function Step2({ data, onChange, onNext, onBack }) {
  const prizePool = data.paid ? data.teamLimit * 10 : 0
  return (
    <div>
      {/* Entry fee */}
      <label className="text-[10px] font-mono tracking-widest block mb-2" style={{ color: 'var(--text-muted)' }}>ENTRY FEE</label>
      <div className="flex gap-2 mb-4">
        {[false, true].map((isPaid) => (
          <button
            key={String(isPaid)}
            onClick={() => onChange('paid', isPaid)}
            className="flex-1 py-2 rounded-xl text-sm font-mono transition-all"
            style={
              data.paid === isPaid
                ? { background: 'var(--accent-purple)', color: '#fff', border: '1px solid var(--accent-purple)' }
                : { background: 'var(--bg-surface2)', color: 'var(--text-secondary)', border: '1px solid transparent' }
            }
          >
            {isPaid ? 'Paid (€10/team)' : 'Free ($0)'}
          </button>
        ))}
      </div>

      {data.paid && (
        <div
          className="rounded-xl p-3 mb-4 text-center"
          style={{ background: 'var(--accent-purple-dim)', border: '1px solid var(--accent-purple)' }}
        >
          <p className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>Prize Pool Preview</p>
          <p className="font-syne font-700 text-lg" style={{ color: 'var(--accent-purple)' }}>
            {data.teamLimit} teams × €10 = €{prizePool}
          </p>
        </div>
      )}

      {/* Payment rule */}
      <div
        className="rounded-xl p-3 mb-4"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface2)' }}
      >
        <p className="text-xs font-mono font-500" style={{ color: 'var(--text-primary)' }}>
          ON HOLD
        </p>
        <p className="text-[11px] font-mono mt-1" style={{ color: 'var(--text-muted)' }}>
          Any unpaid team is on hold
        </p>
      </div>

      {/* Missed week */}
      <label className="text-[10px] font-mono tracking-widest block mb-2" style={{ color: 'var(--text-muted)' }}>MISSED WEEK</label>
      <div className="flex flex-col gap-2 mb-4">
        {MISSED_WEEK_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onChange('missedWeek', opt.id)}
            className="flex items-center gap-3 p-3 rounded-xl text-sm transition-all text-left"
            style={
              data.missedWeek === opt.id
                ? { background: 'var(--accent-purple-dim)', border: '1px solid var(--accent-purple)', color: 'var(--text-primary)' }
                : { background: 'var(--bg-surface2)', border: '1px solid transparent', color: 'var(--text-secondary)' }
            }
          >
            <span className="text-lg">{opt.icon}</span>
            <span className="font-mono text-xs">{opt.label}</span>
          </button>
        ))}
      </div>

      {/* Format */}
      <label className="text-[10px] font-mono tracking-widest block mb-2" style={{ color: 'var(--text-muted)' }}>LEAGUE FORMAT</label>
      <div className="flex flex-col gap-2 mb-6">
        {FORMATS.map((f) => (
          <button
            key={f.id}
            onClick={() => onChange('format', f.id)}
            className="flex items-center gap-3 p-3 rounded-xl text-sm transition-all text-left"
            style={
              data.format === f.id
                ? { background: 'var(--accent-purple-dim)', border: '1px solid var(--accent-purple)', color: 'var(--text-primary)' }
                : { background: 'var(--bg-surface2)', border: '1px solid transparent', color: 'var(--text-secondary)' }
            }
          >
            <span className="text-lg">{f.icon}</span>
            <span className="font-mono text-xs">{f.label}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button onClick={onBack} className="flex-1 py-3 rounded-xl font-mono text-sm" style={{ background: 'var(--bg-surface2)', color: 'var(--text-secondary)' }}>
          ← Back
        </button>
        <button onClick={onNext} className="flex-1 py-3 rounded-xl font-syne font-700 text-sm tracking-wide hover:brightness-110" style={{ background: 'var(--accent-purple)', color: '#fff' }}>
          CONTINUE
        </button>
      </div>
    </div>
  )
}

// ── Step 3 ────────────────────────────────────────────────────────────────────
function Step3({ data, onCreate, loading, onBack }) {
  const [copied, setCopied] = useState(false)
  const inviteUrl = 'https://prizepicks.app/join/PRZE-' + Math.random().toString(36).slice(2, 6).toUpperCase()
  const joinCode = '#PRZE-' + Math.random().toString(36).slice(2, 6).toUpperCase()
  const teams = [
    { name: 'Joan (You)', status: 'PAID' },
    { name: 'Alex', status: 'PENDING' },
    { name: 'Mike', status: 'ON HOLD' },
  ]

  const STATUS_COLORS = {
    PAID: { bg: 'rgba(57,224,123,0.15)', color: 'var(--accent-green)' },
    PENDING: { bg: 'rgba(251,146,60,0.15)', color: '#fb923c' },
    'ON HOLD': { bg: 'rgba(248,113,113,0.12)', color: '#f87171' },
  }

  return (
    <div>
      {/* Invite link */}
      <div
        className="rounded-xl p-3 mb-3"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface2)' }}
      >
        <p className="text-[10px] font-mono tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>INVITE LINK</p>
        <p className="text-xs font-mono truncate mb-2" style={{ color: 'var(--text-secondary)' }}>{inviteUrl}</p>
        <div className="flex gap-2">
          <button
            onClick={() => { navigator.clipboard.writeText(inviteUrl); setCopied(true) }}
            className="flex-1 py-2 rounded-lg text-xs font-mono"
            style={{ background: 'var(--accent-purple-dim)', color: 'var(--accent-purple)' }}
          >
            {copied ? 'COPIED!' : 'COPY'}
          </button>
          <button
            onClick={() => navigator.share?.({ url: inviteUrl, title: 'Join my PrizePicks league!' })}
            className="flex-1 py-2 rounded-lg text-xs font-mono"
            style={{ background: 'var(--bg-surface2)', color: 'var(--text-secondary)' }}
          >
            SHARE
          </button>
        </div>
      </div>

      {/* Join code */}
      <div
        className="rounded-xl p-3 mb-4 text-center"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface2)' }}
      >
        <p className="text-[10px] font-mono tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>JOIN CODE</p>
        <p className="font-syne font-700 text-2xl" style={{ color: 'var(--accent-purple)' }}>{joinCode}</p>
        <button className="mt-2 px-4 py-1.5 rounded-xl text-xs font-mono" style={{ background: 'var(--accent-purple-dim)', color: 'var(--accent-purple)' }}>
          + ADD TEAM
        </button>
      </div>

      {/* Stats */}
      <div
        className="flex items-center justify-between px-3 py-2 rounded-xl mb-3 text-xs font-mono"
        style={{ background: 'var(--bg-surface2)', color: 'var(--text-secondary)' }}
      >
        <span>1 / {data.teamLimit} Teams · 1 Paid · 2 Pending</span>
        {data.paid && <span style={{ color: 'var(--accent-green)' }}>€10 PRIZE POOL</span>}
      </div>

      {/* Team list */}
      <div className="flex flex-col gap-2 mb-5">
        {teams.map((team, i) => {
          const sc = STATUS_COLORS[team.status]
          return (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: 'var(--bg-surface)' }}>
              <Avatar name={team.name} size={32} />
              <span className="flex-1 text-xs font-syne font-500" style={{ color: 'var(--text-primary)' }}>{team.name}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={sc}>
                {team.status}
              </span>
            </div>
          )
        })}
      </div>

      <button
        onClick={onCreate}
        disabled={loading}
        className="w-full py-3.5 rounded-xl font-syne font-700 text-sm tracking-widest flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.99] mb-3"
        style={{ background: 'var(--accent-purple)', color: '#fff', boxShadow: '0 0 24px rgba(124,110,245,0.35)' }}
      >
        {loading ? <Spinner size={18} /> : '🚀 LAUNCH LEAGUE'}
      </button>
      <p className="text-[10px] font-mono text-center" style={{ color: 'var(--text-muted)' }}>
        Once launched, teams will be locked and picks will open.
      </p>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CreateLeaguePage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [form, setForm] = useState({
    name: '', logo: '🏆', competition: 'EPL', season: '2024/25',
    teamLimit: 12, paid: false, missedWeek: 'random', format: 'standings',
  })

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  async function handleCreate() {
    setLoading(true)
    try {
      await createLeague(form)
      setToast({ message: '🚀 League launched!', type: 'success' })
      setTimeout(() => navigate('/'), 1500)
    } catch {
      setToast({ message: 'Failed to create league', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh pb-10" style={{ background: 'var(--bg-primary)' }}>
      <div className="px-4 pt-6">
        <button onClick={() => step > 1 ? setStep(s => s - 1) : navigate(-1)} className="text-sm font-mono mb-4" style={{ color: 'var(--text-secondary)' }}>
          ← Back
        </button>

        <h1 className="font-syne font-700 text-xl mb-1" style={{ color: 'var(--text-primary)' }}>
          Create League
        </h1>

        <StepLabel step={step} />
        <ProgressDots step={step} />

        {step === 1 && <Step1 data={form} onChange={set} onNext={() => setStep(2)} />}
        {step === 2 && <Step2 data={form} onChange={set} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
        {step === 3 && <Step3 data={form} onCreate={handleCreate} loading={loading} onBack={() => setStep(2)} />}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  )
}
