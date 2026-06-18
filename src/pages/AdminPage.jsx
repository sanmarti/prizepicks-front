import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import { useAuthStore } from '../store/authStore'
import Spinner from '../components/ui/Spinner'

// ── palette ───────────────────────────────────────────────────────────────────
const C = {
  bg:       'var(--bg-primary)',
  surface:  'var(--bg-surface)',
  surface2: 'var(--bg-surface2)',
  border:   'rgba(124,110,245,0.18)',
  purple:   'var(--accent-purple)',
  text:     'var(--text-primary)',
  muted:    'var(--text-muted)',
  green:    '#4ade80',
  red:      '#f87171',
  yellow:   '#facc15',
}

const mono  = "'IBM Plex Mono', monospace"
const syne  = "'Syne', sans-serif"

// ── small helpers ─────────────────────────────────────────────────────────────
const Badge = ({ color = C.purple, children }) => (
  <span style={{
    fontSize: 10, fontFamily: mono, letterSpacing: '0.08em',
    padding: '2px 7px', borderRadius: 4,
    background: color + '22', color, border: `1px solid ${color}44`,
  }}>{children}</span>
)

const Card = ({ children, style }) => (
  <div style={{
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 16, padding: 20, ...style,
  }}>{children}</div>
)

const Label = ({ children }) => (
  <p style={{ fontSize: 10, fontFamily: mono, color: C.muted, letterSpacing: '0.1em', marginBottom: 4 }}>
    {children}
  </p>
)

const Input = ({ label, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    {label && <Label>{label}</Label>}
    <input style={{
      background: C.surface2, border: `1px solid ${C.border}`,
      borderRadius: 10, padding: '9px 12px', color: C.text,
      fontSize: 13, fontFamily: mono, outline: 'none', width: '100%', boxSizing: 'border-box',
    }} {...props} />
  </div>
)

const Select = ({ label, children, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    {label && <Label>{label}</Label>}
    <select style={{
      background: C.surface2, border: `1px solid ${C.border}`,
      borderRadius: 10, padding: '9px 12px', color: C.text,
      fontSize: 13, fontFamily: mono, outline: 'none', width: '100%',
    }} {...props}>{children}</select>
  </div>
)

const Btn = ({ children, onClick, disabled, danger, small }) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding: small ? '7px 16px' : '11px 22px',
    background: danger ? '#ef444433' : C.purple,
    border: danger ? '1px solid #ef4444' : 'none',
    color: danger ? '#ef4444' : '#fff',
    borderRadius: 10, fontFamily: syne, fontWeight: 700,
    fontSize: small ? 12 : 13, cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1, letterSpacing: '0.05em',
    whiteSpace: 'nowrap',
  }}>{children}</button>
)

// ── stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color = C.purple }) => (
  <Card style={{ textAlign: 'center', flex: 1 }}>
    <p style={{ fontSize: 32, fontFamily: syne, fontWeight: 700, color, margin: 0 }}>{value}</p>
    <Label>{label}</Label>
  </Card>
)

// ── TABS ──────────────────────────────────────────────────────────────────────
const TABS = ['Overview', 'Users', 'Leagues', 'Create Gameweek']

// ── main component ────────────────────────────────────────────────────────────
export default function AdminPage() {
  const user     = useAuthStore(s => s.user)
  const navigate = useNavigate()
  const [tab, setTab]       = useState(0)
  const [stats, setStats]   = useState(null)
  const [users, setUsers]   = useState([])
  const [leagues, setLeagues] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg]       = useState('')

  useEffect(() => {
    if (user?.role !== 'admin') { navigate('/'); return }
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      const [s, u, l] = await Promise.all([
        client.get('/admin/stats'),
        client.get('/admin/users'),
        client.get('/admin/leagues'),
      ])
      setStats(s.data)
      setUsers(u.data)
      setLeagues(l.data)
    } catch (e) {
      setMsg('Error loading data')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100dvh', background: C.bg, padding: '0 0 80px' }}>
      {/* header */}
      <div style={{
        background: C.surface, borderBottom: `1px solid ${C.border}`,
        padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12,
        position: 'sticky', top: 0, zIndex: 30,
      }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 18, cursor: 'pointer' }}>←</button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: syne, fontWeight: 700, fontSize: 16, color: C.text, margin: 0 }}>Admin Panel</h1>
          <p style={{ fontSize: 10, fontFamily: mono, color: C.muted, margin: 0 }}>{user?.email}</p>
        </div>
        <Badge>ADMIN</Badge>
        {loading && <Spinner size={16} />}
      </div>

      {/* tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, background: C.surface, overflowX: 'auto' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            flex: 1, minWidth: 100, padding: '12px 8px', border: 'none', cursor: 'pointer',
            fontFamily: mono, fontSize: 11, letterSpacing: '0.06em',
            background: 'none', color: tab === i ? C.purple : C.muted,
            borderBottom: tab === i ? `2px solid ${C.purple}` : '2px solid transparent',
            transition: 'color 0.2s',
          }}>{t.toUpperCase()}</button>
        ))}
      </div>

      <div style={{ padding: '20px 16px', maxWidth: 900, margin: '0 auto' }}>
        {msg && <p style={{ color: C.red, fontFamily: mono, fontSize: 12, marginBottom: 12 }}>{msg}</p>}

        {tab === 0 && <OverviewTab stats={stats} users={users} leagues={leagues} />}
        {tab === 1 && <UsersTab users={users} onRefresh={fetchAll} setMsg={setMsg} />}
        {tab === 2 && <LeaguesTab leagues={leagues} />}
        {tab === 3 && <GameweekTab leagues={leagues} setMsg={setMsg} />}
      </div>
    </div>
  )
}

// ── Overview ──────────────────────────────────────────────────────────────────
function OverviewTab({ stats, users, leagues }) {
  if (!stats) return null
  const activeLeagues = leagues.filter(l => l.status === 'ACTIVE').length
  const admins = users.filter(u => u.role === 'admin').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <StatCard label="TOTAL USERS"   value={stats.users}    color={C.purple} />
        <StatCard label="TOTAL LEAGUES" value={stats.leagues}  color="#38bdf8" />
        <StatCard label="GAMEWEEKS"     value={stats.gameweeks} color={C.green} />
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <StatCard label="ACTIVE LEAGUES" value={activeLeagues} color={C.yellow} />
        <StatCard label="ADMIN USERS"    value={admins}        color={C.red} />
        <StatCard label="REGULAR USERS"  value={stats.users - admins} color={C.muted} />
      </div>

      {/* recent users */}
      <Card>
        <p style={{ fontFamily: syne, fontWeight: 700, color: C.text, marginBottom: 12, fontSize: 14 }}>Recent Registrations</p>
        {users.slice(0, 5).map(u => (
          <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
            <div>
              <p style={{ fontSize: 13, color: C.text, margin: 0, fontFamily: mono }}>{u.email}</p>
              <p style={{ fontSize: 11, color: C.muted, margin: 0, fontFamily: mono }}>{u.display_name || '—'}</p>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <Badge color={u.role === 'admin' ? C.red : C.purple}>{u.role}</Badge>
              <span style={{ fontSize: 11, color: C.muted, fontFamily: mono }}>⚡ {u.energy_balance}</span>
            </div>
          </div>
        ))}
      </Card>
    </div>
  )
}

// ── Users ─────────────────────────────────────────────────────────────────────
function UsersTab({ users, onRefresh, setMsg }) {
  const [promoting, setPromoting] = useState(null)

  async function toggleRole(u) {
    setPromoting(u.id)
    try {
      // We don't have a PUT /admin/users endpoint so do nothing for now — just show
      setMsg(`Role management via DB. User: ${u.email} current role: ${u.role}`)
    } finally { setPromoting(null) }
  }

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ fontFamily: syne, fontWeight: 700, color: C.text, fontSize: 14, margin: 0 }}>
          Registered Users <span style={{ color: C.muted, fontSize: 12 }}>({users.length})</span>
        </p>
        <Btn small onClick={onRefresh}>↻ Refresh</Btn>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: mono }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {['Email', 'Display Name', 'Role', '⚡ Energy', 'Joined'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: C.muted, fontWeight: 400, letterSpacing: '0.06em', fontSize: 10 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: `1px solid ${C.border}22` }}>
                <td style={{ padding: '10px 8px', color: C.text }}>{u.email}</td>
                <td style={{ padding: '10px 8px', color: C.muted }}>{u.display_name || '—'}</td>
                <td style={{ padding: '10px 8px' }}>
                  <Badge color={u.role === 'admin' ? C.red : C.purple}>{u.role}</Badge>
                </td>
                <td style={{ padding: '10px 8px', color: C.green }}>{u.energy_balance}</td>
                <td style={{ padding: '10px 8px', color: C.muted }}>
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

// ── Leagues ───────────────────────────────────────────────────────────────────
function LeaguesTab({ leagues }) {
  const statusColor = { DRAFT: C.muted, ACTIVE: C.green, FINISHED: C.yellow }

  return (
    <Card>
      <p style={{ fontFamily: syne, fontWeight: 700, color: C.text, fontSize: 14, marginBottom: 16 }}>
        All Leagues <span style={{ color: C.muted, fontSize: 12 }}>({leagues.length})</span>
      </p>
      {leagues.length === 0 && (
        <p style={{ color: C.muted, fontFamily: mono, fontSize: 12, textAlign: 'center', padding: 24 }}>No leagues created yet</p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {leagues.map(l => (
          <div key={l.id} style={{ background: C.surface2, borderRadius: 12, padding: '14px 16px', border: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <p style={{ fontFamily: syne, fontWeight: 700, color: C.text, margin: '0 0 4px', fontSize: 14 }}>{l.name}</p>
                <p style={{ fontFamily: mono, color: C.muted, margin: 0, fontSize: 11 }}>
                  {l.competition} · Season {l.season} · by {l.creator_email || '—'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <Badge color={statusColor[l.status] || C.muted}>{l.status}</Badge>
                <Badge color="#38bdf8">{l.member_count}/{l.max_teams} members</Badge>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontFamily: mono, color: C.muted }}>Entry: €{l.entry_fee}</span>
              <span style={{ fontSize: 11, fontFamily: mono, color: C.muted }}>Prize: €{l.prize_pool}</span>
              <span style={{ fontSize: 11, fontFamily: mono, color: C.muted }}>Created: {new Date(l.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── Gameweek Creator ──────────────────────────────────────────────────────────
const BLANK_EVENT = { event_type: 'MATCH_RESULT', fixture_name: '', fixture_id: '', competition: '', match_time: '', options: [{ label: 'Home', energy_cost: '' }, { label: 'Draw', energy_cost: '' }, { label: 'Away', energy_cost: '' }] }

function GameweekTab({ leagues, setMsg }) {
  const [form, setForm] = useState({ league_id: '', week_number: 1, lock_time: '', events: [{ ...BLANK_EVENT }] })
  const [loading, setLoading] = useState(false)
  const [created, setCreated] = useState(null)

  function setField(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function setEvent(i, key, val) {
    setForm(f => {
      const evs = [...f.events]; evs[i] = { ...evs[i], [key]: val }; return { ...f, events: evs }
    })
  }

  function setOption(ei, oi, key, val) {
    setForm(f => {
      const evs = [...f.events]
      const opts = [...evs[ei].options]; opts[oi] = { ...opts[oi], [key]: val }
      evs[ei] = { ...evs[ei], options: opts }
      return { ...f, events: evs }
    })
  }

  function addEvent() { setForm(f => ({ ...f, events: [...f.events, { ...BLANK_EVENT, options: [{ label: 'Home', energy_cost: '' }, { label: 'Draw', energy_cost: '' }, { label: 'Away', energy_cost: '' }] }] })) }
  function removeEvent(i) { setForm(f => ({ ...f, events: f.events.filter((_, idx) => idx !== i) })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.league_id) { setMsg('Select a league'); return }
    setLoading(true); setMsg('')
    try {
      const payload = {
        ...form,
        week_number: parseInt(form.week_number),
        events: form.events.map(ev => ({
          ...ev,
          options: ev.options.filter(o => o.label).map(o => ({
            label: o.label,
            energy_cost: o.energy_cost ? parseInt(o.energy_cost) : undefined,
          }))
        }))
      }
      const { data } = await client.post('/admin/gameweek', payload)
      setCreated(data.gameweekId)
      setMsg(`✓ Gameweek created! ID: ${data.gameweekId}`)
    } catch (err) {
      setMsg(err.response?.data?.error || 'Error creating gameweek')
    } finally { setLoading(false) }
  }

  async function handlePublish() {
    if (!created) return
    setLoading(true)
    try {
      const { data } = await client.post('/admin/publish', { gameweek_id: created })
      setMsg(`✓ Published! ${data.matchupsCreated} matchups created.`)
      setCreated(null)
    } catch (err) {
      setMsg(err.response?.data?.error || 'Error publishing')
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* basic info */}
      <Card>
        <p style={{ fontFamily: syne, fontWeight: 700, color: C.text, fontSize: 14, marginBottom: 14 }}>Gameweek Info</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <Select label="LEAGUE" value={form.league_id} onChange={e => setField('league_id', e.target.value)}>
            <option value="">— Select league —</option>
            {leagues.map(l => <option key={l.id} value={l.id}>{l.name} ({l.competition})</option>)}
          </Select>
          <Input label="WEEK NUMBER" type="number" min={1} value={form.week_number} onChange={e => setField('week_number', e.target.value)} />
          <Input label="LOCK TIME" type="datetime-local" value={form.lock_time} onChange={e => setField('lock_time', e.target.value)} />
        </div>
      </Card>

      {/* events */}
      {form.events.map((ev, ei) => (
        <Card key={ei}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <p style={{ fontFamily: syne, fontWeight: 700, color: C.text, fontSize: 13, margin: 0 }}>Event {ei + 1}</p>
            {form.events.length > 1 && <Btn small danger onClick={() => removeEvent(ei)}>Remove</Btn>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 14 }}>
            <Select label="TYPE" value={ev.event_type} onChange={e => setEvent(ei, 'event_type', e.target.value)}>
              <option value="MATCH_RESULT">Match Result</option>
              <option value="GOALS">Goals</option>
              <option value="PLAYER_SCORE">Player Score</option>
              <option value="CLEAN_SHEET">Clean Sheet</option>
            </Select>
            <Input label="FIXTURE NAME" placeholder="Man Utd vs Arsenal" value={ev.fixture_name} onChange={e => setEvent(ei, 'fixture_name', e.target.value)} />
            <Input label="FIXTURE ID" placeholder="API Football ID" value={ev.fixture_id} onChange={e => setEvent(ei, 'fixture_id', e.target.value)} />
            <Input label="COMPETITION" placeholder="EPL" value={ev.competition} onChange={e => setEvent(ei, 'competition', e.target.value)} />
            <Input label="MATCH TIME" type="datetime-local" value={ev.match_time} onChange={e => setEvent(ei, 'match_time', e.target.value)} />
          </div>
          {/* options */}
          <Label>OPTIONS (label + energy cost 1-9, leave cost empty for auto from odds)</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
            {ev.options.map((opt, oi) => (
              <div key={oi} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  placeholder="Label (e.g. Home)" value={opt.label}
                  onChange={e => setOption(ei, oi, 'label', e.target.value)}
                  style={{ flex: 2, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: '7px 10px', color: C.text, fontSize: 12, fontFamily: mono, outline: 'none' }}
                />
                <input
                  placeholder="⚡ 1-9" type="number" min={1} max={9} value={opt.energy_cost}
                  onChange={e => setOption(ei, oi, 'energy_cost', e.target.value)}
                  style={{ flex: 1, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: '7px 10px', color: C.text, fontSize: 12, fontFamily: mono, outline: 'none' }}
                />
                <button type="button" onClick={() => {
                  setForm(f => {
                    const evs = [...f.events]; const opts = evs[ei].options.filter((_, i) => i !== oi)
                    evs[ei] = { ...evs[ei], options: opts }; return { ...f, events: evs }
                  })
                }} style={{ background: 'none', border: 'none', color: C.red, cursor: 'pointer', fontSize: 16 }}>×</button>
              </div>
            ))}
            <button type="button" onClick={() => {
              setForm(f => {
                const evs = [...f.events]; evs[ei] = { ...evs[ei], options: [...evs[ei].options, { label: '', energy_cost: '' }] }
                return { ...f, events: evs }
              })
            }} style={{ alignSelf: 'flex-start', background: 'none', border: `1px dashed ${C.border}`, borderRadius: 8, padding: '6px 12px', color: C.muted, fontFamily: mono, fontSize: 11, cursor: 'pointer' }}>
              + Add option
            </button>
          </div>
        </Card>
      ))}

      {/* actions */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Btn type="button" small onClick={addEvent}>+ Add Event</Btn>
        <Btn type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create Gameweek (DRAFT)'}</Btn>
        {created && <Btn onClick={handlePublish} disabled={loading}>Publish & Generate Matchups</Btn>}
      </div>
    </form>
  )
}
