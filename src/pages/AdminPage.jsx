import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import { useAuthStore } from '../store/authStore'
import Spinner from '../components/ui/Spinner'

// ── design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: 'var(--bg-primary)', surface: 'var(--bg-surface)', surface2: 'var(--bg-surface2)',
  border: 'rgba(124,110,245,0.18)', purple: 'var(--accent-purple)',
  text: 'var(--text-primary)', muted: 'var(--text-muted)',
  green: '#4ade80', red: '#f87171', yellow: '#facc15', blue: '#38bdf8',
}
const mono = "'IBM Plex Mono', monospace"
const syne = "'Syne', sans-serif"

// ── micro-components ──────────────────────────────────────────────────────────
const Badge = ({ color = C.purple, children }) => (
  <span style={{ fontSize: 10, fontFamily: mono, padding: '2px 7px', borderRadius: 4, background: color + '22', color, border: `1px solid ${color}44` }}>{children}</span>
)
const Card = ({ children, style }) => (
  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, ...style }}>{children}</div>
)
const Label = ({ children }) => (
  <p style={{ fontSize: 10, fontFamily: mono, color: C.muted, letterSpacing: '0.1em', marginBottom: 4 }}>{children}</p>
)
const Field = ({ label, children, style }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, ...style }}>
    {label && <Label>{label}</Label>}
    {children}
  </div>
)
const inputStyle = {
  background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10,
  padding: '9px 12px', color: C.text, fontSize: 13, fontFamily: mono,
  outline: 'none', width: '100%', boxSizing: 'border-box',
}
const Input = ({ label, style, ...props }) => (
  <Field label={label} style={style}>
    <input style={inputStyle} {...props} />
  </Field>
)
const SelectField = ({ label, children, ...props }) => (
  <Field label={label}>
    <select style={{ ...inputStyle, cursor: 'pointer' }} {...props}>{children}</select>
  </Field>
)
const Btn = ({ children, onClick, disabled, danger, small, type = 'button' }) => (
  <button type={type} onClick={onClick} disabled={disabled} style={{
    padding: small ? '7px 14px' : '11px 22px',
    background: danger ? '#ef444422' : C.purple, border: danger ? '1px solid #ef4444' : 'none',
    color: danger ? '#ef4444' : '#fff', borderRadius: 10, fontFamily: syne, fontWeight: 700,
    fontSize: small ? 11 : 13, cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1, letterSpacing: '0.05em', whiteSpace: 'nowrap',
  }}>{children}</button>
)
const StatCard = ({ label, value, color = C.purple }) => (
  <Card style={{ textAlign: 'center', flex: 1, minWidth: 100 }}>
    <p style={{ fontSize: 30, fontFamily: syne, fontWeight: 700, color, margin: 0 }}>{value ?? '—'}</p>
    <Label>{label}</Label>
  </Card>
)

const TABS = ['Overview', 'Users', 'Leagues', 'Create Gameweek']

export default function AdminPage() {
  const user     = useAuthStore(s => s.user)
  const navigate = useNavigate()
  const [tab, setTab]           = useState(0)
  const [stats, setStats]       = useState(null)
  const [users, setUsers]       = useState([])
  const [leagues, setLeagues]   = useState([])
  const [competitions, setCompetitions] = useState([])
  const [loading, setLoading]   = useState(false)
  const [msg, setMsg]           = useState('')

  useEffect(() => {
    if (user?.role !== 'admin') { navigate('/'); return }
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const [s, u, l, c] = await Promise.all([
        client.get('/admin/stats'),
        client.get('/admin/users'),
        client.get('/admin/leagues'),
        client.get('/admin/competitions'),
      ])
      setStats(s.data)
      setUsers(u.data)
      setLeagues(l.data)
      setCompetitions(c.data)
    } catch { setMsg('Error loading data') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100dvh', background: C.bg, paddingBottom: 60 }}>
      {/* topbar */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 30 }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 18, cursor: 'pointer' }}>←</button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: syne, fontWeight: 700, fontSize: 16, color: C.text, margin: 0 }}>Admin Panel</h1>
          <p style={{ fontSize: 10, fontFamily: mono, color: C.muted, margin: 0 }}>{user?.email}</p>
        </div>
        <Badge>ADMIN</Badge>
        {loading && <Spinner size={14} />}
      </div>

      {/* tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, background: C.surface, overflowX: 'auto' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            flex: 1, minWidth: 110, padding: '12px 8px', border: 'none', cursor: 'pointer',
            fontFamily: mono, fontSize: 11, letterSpacing: '0.06em', background: 'none',
            color: tab === i ? C.purple : C.muted,
            borderBottom: tab === i ? `2px solid ${C.purple}` : '2px solid transparent',
          }}>{t.toUpperCase()}</button>
        ))}
      </div>

      <div style={{ padding: '20px 16px', maxWidth: 900, margin: '0 auto' }}>
        {msg && <p style={{ color: C.red, fontFamily: mono, fontSize: 12, marginBottom: 12 }}>{msg}</p>}
        {tab === 0 && <OverviewTab stats={stats} users={users} leagues={leagues} />}
        {tab === 1 && <UsersTab users={users} onRefresh={load} />}
        {tab === 2 && <LeaguesTab leagues={leagues} competitions={competitions} />}
        {tab === 3 && <GameweekTab competitions={competitions} setMsg={setMsg} />}
      </div>
    </div>
  )
}

// ── Overview ──────────────────────────────────────────────────────────────────
function OverviewTab({ stats, users, leagues }) {
  if (!stats) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <StatCard label="USERS"      value={stats.users}     color={C.purple} />
        <StatCard label="LEAGUES"    value={stats.leagues}   color={C.blue} />
        <StatCard label="GAMEWEEKS"  value={stats.gameweeks} color={C.green} />
      </div>
      <Card>
        <p style={{ fontFamily: syne, fontWeight: 700, color: C.text, marginBottom: 12, fontSize: 14 }}>Recent Registrations</p>
        {users.slice(0, 6).map(u => (
          <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
            <div>
              <p style={{ fontSize: 13, color: C.text, margin: 0, fontFamily: mono }}>{u.email}</p>
              <p style={{ fontSize: 11, color: C.muted, margin: 0, fontFamily: mono }}>{u.display_name || '—'}</p>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <Badge color={u.role === 'admin' ? C.red : C.purple}>{u.role}</Badge>
              <span style={{ fontSize: 11, color: C.green, fontFamily: mono }}>⚡{u.energy_balance}</span>
            </div>
          </div>
        ))}
      </Card>
    </div>
  )
}

// ── Users ─────────────────────────────────────────────────────────────────────
function UsersTab({ users, onRefresh }) {
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <p style={{ fontFamily: syne, fontWeight: 700, color: C.text, fontSize: 14, margin: 0 }}>
          Users <span style={{ color: C.muted, fontSize: 12 }}>({users.length})</span>
        </p>
        <Btn small onClick={onRefresh}>↻ Refresh</Btn>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: mono }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {['Email', 'Name', 'Role', '⚡', 'Joined'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: C.muted, fontWeight: 400, fontSize: 10, letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: `1px solid ${C.border}22` }}>
                <td style={{ padding: '9px 8px', color: C.text }}>{u.email}</td>
                <td style={{ padding: '9px 8px', color: C.muted }}>{u.display_name || '—'}</td>
                <td style={{ padding: '9px 8px' }}><Badge color={u.role === 'admin' ? C.red : C.purple}>{u.role}</Badge></td>
                <td style={{ padding: '9px 8px', color: C.green }}>{u.energy_balance}</td>
                <td style={{ padding: '9px 8px', color: C.muted }}>{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

// ── Leagues ───────────────────────────────────────────────────────────────────
function LeaguesTab({ leagues, competitions }) {
  const compMap = Object.fromEntries(competitions.map(c => [c.id, c.name]))
  const statusColor = { DRAFT: C.muted, ACTIVE: C.green, FINISHED: C.yellow }
  return (
    <Card>
      <p style={{ fontFamily: syne, fontWeight: 700, color: C.text, fontSize: 14, marginBottom: 14 }}>
        All Leagues <span style={{ color: C.muted, fontSize: 12 }}>({leagues.length})</span>
      </p>
      {leagues.length === 0 && <p style={{ color: C.muted, fontFamily: mono, fontSize: 12, textAlign: 'center', padding: 24 }}>No leagues yet</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {leagues.map(l => (
          <div key={l.id} style={{ background: C.surface2, borderRadius: 12, padding: '12px 14px', border: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <p style={{ fontFamily: syne, fontWeight: 700, color: C.text, margin: '0 0 3px', fontSize: 13 }}>{l.name}</p>
                <p style={{ fontFamily: mono, color: C.muted, margin: 0, fontSize: 11 }}>
                  {compMap[l.competition_id] || l.competition || '—'} · {l.creator_email || '—'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Badge color={statusColor[l.status] || C.muted}>{l.status}</Badge>
                <Badge color={C.blue}>{l.member_count}/{l.max_teams}</Badge>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontFamily: mono, color: C.muted }}>Entry: €{l.entry_fee}</span>
              <span style={{ fontSize: 11, fontFamily: mono, color: C.muted }}>Prize: €{l.prize_pool}</span>
              <span style={{ fontSize: 11, fontFamily: mono, color: C.muted }}>{new Date(l.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── Create Gameweek ───────────────────────────────────────────────────────────
const BLANK_OPTION = { label: '', energy_cost: '' }
const BLANK_EVENT  = {
  event_type: 'MATCH_RESULT', fixture_name: '', fixture_id: '',
  competition: '', match_time: '',
  options: [
    { label: 'Home', energy_cost: '' },
    { label: 'Draw', energy_cost: '' },
    { label: 'Away', energy_cost: '' },
  ],
}

function GameweekTab({ competitions, setMsg }) {
  const [form, setForm] = useState({
    competition_id: '',
    week_number: 1,
    lock_time: '',
    reveal_time: '',
    events: [{ ...BLANK_EVENT, options: BLANK_EVENT.options.map(o => ({ ...o })) }],
  })
  const [loading, setLoading] = useState(false)
  const [created, setCreated] = useState(null)

  const set  = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setEv = (i, k, v) => setForm(f => { const e = [...f.events]; e[i] = { ...e[i], [k]: v }; return { ...f, events: e } })
  const setOpt = (ei, oi, k, v) => setForm(f => {
    const e = [...f.events]; const o = [...e[ei].options]; o[oi] = { ...o[oi], [k]: v }
    e[ei] = { ...e[ei], options: o }; return { ...f, events: e }
  })

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.competition_id) { setMsg('Select a competition'); return }
    setLoading(true); setMsg('')
    try {
      const { data } = await client.post('/admin/gameweek', {
        competition_id: form.competition_id,
        week_number: parseInt(form.week_number),
        lock_time: form.lock_time,
        reveal_time: form.reveal_time || form.lock_time,
        events: form.events.map(ev => ({
          ...ev,
          options: ev.options
            .filter(o => o.label.trim())
            .map(o => ({ label: o.label, energy_cost: o.energy_cost ? parseInt(o.energy_cost) : undefined })),
        })),
      })
      setCreated(data.gameweekId)
      setMsg(`✓ Gameweek created (DRAFT) · ID: ${data.gameweekId}`)
    } catch (err) {
      setMsg(err.response?.data?.error || 'Error creating gameweek')
    } finally { setLoading(false) }
  }

  async function handlePublish() {
    setLoading(true)
    try {
      const { data } = await client.post('/admin/publish', { gameweek_id: created })
      setMsg(`✓ Published! ${data.matchupsCreated} matchups created across ${data.leagues_affected} league(s).`)
      setCreated(null)
    } catch (err) {
      setMsg(err.response?.data?.error || 'Error publishing')
    } finally { setLoading(false) }
  }

  const selectedComp = competitions.find(c => c.id === form.competition_id)

  return (
    <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Step 1 — Competition */}
      <Card>
        <p style={{ fontFamily: syne, fontWeight: 700, color: C.text, fontSize: 14, marginBottom: 14 }}>
          Step 1 · Competition & Schedule
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <SelectField label="COMPETITION" value={form.competition_id} onChange={e => set('competition_id', e.target.value)}>
            <option value="">— Select competition —</option>
            {competitions.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </SelectField>
          <Input label="WEEK NUMBER" type="number" min={1} value={form.week_number} onChange={e => set('week_number', e.target.value)} />
          <Input label="LOCK TIME" type="datetime-local" value={form.lock_time} onChange={e => set('lock_time', e.target.value)} />
          <Input label="REVEAL TIME" type="datetime-local" value={form.reveal_time} onChange={e => set('reveal_time', e.target.value)} />
        </div>
        {selectedComp && (
          <p style={{ fontSize: 11, fontFamily: mono, color: C.muted, marginTop: 10 }}>
            All active leagues in <span style={{ color: C.purple }}>{selectedComp.name}</span> will get matchups when this gameweek is published.
          </p>
        )}
      </Card>

      {/* Step 2 — Events */}
      <p style={{ fontFamily: syne, fontWeight: 700, color: C.text, fontSize: 14, margin: '4px 0 0' }}>
        Step 2 · Events
      </p>

      {form.events.map((ev, ei) => (
        <Card key={ei}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <p style={{ fontFamily: syne, fontWeight: 700, color: C.text, fontSize: 13, margin: 0 }}>Event {ei + 1}</p>
            {form.events.length > 1 && (
              <Btn small danger onClick={() => setForm(f => ({ ...f, events: f.events.filter((_, i) => i !== ei) }))}>Remove</Btn>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10, marginBottom: 14 }}>
            <SelectField label="TYPE" value={ev.event_type} onChange={e => setEv(ei, 'event_type', e.target.value)}>
              <option value="MATCH_RESULT">Match Result</option>
              <option value="GOALS">Goals</option>
              <option value="PLAYER_SCORE">Player Score</option>
              <option value="CLEAN_SHEET">Clean Sheet</option>
            </SelectField>
            <Input label="FIXTURE NAME" placeholder="Man Utd vs Arsenal" value={ev.fixture_name} onChange={e => setEv(ei, 'fixture_name', e.target.value)} />
            <Input label="FIXTURE ID" placeholder="API-Football ID" value={ev.fixture_id} onChange={e => setEv(ei, 'fixture_id', e.target.value)} />
            <Input label="MATCH TIME" type="datetime-local" value={ev.match_time} onChange={e => setEv(ei, 'match_time', e.target.value)} />
          </div>

          <Label>OPTIONS — label + energy cost (1–9). Leave cost empty for auto.</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
            {ev.options.map((opt, oi) => (
              <div key={oi} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input placeholder="Label (e.g. Home)" value={opt.label} onChange={e => setOpt(ei, oi, 'label', e.target.value)}
                  style={{ flex: 2, ...inputStyle, padding: '7px 10px' }} />
                <input placeholder="⚡ 1-9" type="number" min={1} max={9} value={opt.energy_cost} onChange={e => setOpt(ei, oi, 'energy_cost', e.target.value)}
                  style={{ flex: 1, ...inputStyle, padding: '7px 10px' }} />
                <button type="button" onClick={() => setForm(f => {
                  const e2 = [...f.events]; e2[ei] = { ...e2[ei], options: e2[ei].options.filter((_, i) => i !== oi) }
                  return { ...f, events: e2 }
                })} style={{ background: 'none', border: 'none', color: C.red, cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
              </div>
            ))}
            <button type="button" onClick={() => setForm(f => {
              const e2 = [...f.events]; e2[ei] = { ...e2[ei], options: [...e2[ei].options, { ...BLANK_OPTION }] }
              return { ...f, events: e2 }
            })} style={{ alignSelf: 'flex-start', background: 'none', border: `1px dashed ${C.border}`, borderRadius: 8, padding: '5px 12px', color: C.muted, fontFamily: mono, fontSize: 11, cursor: 'pointer' }}>
              + Add option
            </button>
          </div>
        </Card>
      ))}

      {/* actions */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Btn onClick={() => setForm(f => ({ ...f, events: [...f.events, { ...BLANK_EVENT, options: BLANK_EVENT.options.map(o => ({ ...o })) }] }))}>
          + Add Event
        </Btn>
        <Btn type="submit" disabled={loading}>
          {loading ? 'Creating…' : 'Create Gameweek (DRAFT)'}
        </Btn>
        {created && (
          <Btn onClick={handlePublish} disabled={loading}>
            Publish & Generate Matchups
          </Btn>
        )}
      </div>
    </form>
  )
}
