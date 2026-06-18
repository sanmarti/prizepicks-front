import { useEffect, useState } from 'react'
import { getProfile, updateProfile, changePassword } from '../api/users'
import { useAuthStore } from '../store/authStore'
import Avatar from '../components/ui/Avatar'
import BottomNav from '../components/layout/BottomNav'
import Spinner from '../components/ui/Spinner'
import Toast from '../components/ui/Toast'

// ── Styles ─────────────────────────────────────────────────────────────────────
const INPUT = {
  width: '100%', padding: '12px 14px', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(124,110,245,0.2)',
  borderRadius: 12, color: 'rgba(255,255,255,0.9)',
  fontSize: 14, outline: 'none',
  fontFamily: "'IBM Plex Mono', monospace",
  transition: 'border-color 0.2s, box-shadow 0.2s',
}
const onFocus = e => { e.target.style.borderColor = 'rgba(124,110,245,0.65)'; e.target.style.boxShadow = '0 0 0 3px rgba(124,110,245,0.09)' }
const onBlur  = e => { e.target.style.borderColor = 'rgba(124,110,245,0.2)';  e.target.style.boxShadow = 'none' }

function Label({ children }) {
  return (
    <label style={{
      display: 'block', fontSize: 10, letterSpacing: '0.13em', marginBottom: 7,
      color: 'rgba(255,255,255,0.3)', fontFamily: "'IBM Plex Mono', monospace",
    }}>{children}</label>
  )
}

function Card({ title, children }) {
  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--bg-surface2)',
      borderRadius: 18, padding: '20px 18px', marginBottom: 14,
    }}>
      {title && (
        <p style={{
          fontSize: 10, letterSpacing: '0.14em', marginBottom: 18, marginTop: 0,
          color: 'rgba(255,255,255,0.22)', fontFamily: "'IBM Plex Mono', monospace",
        }}>{title}</p>
      )}
      {children}
    </div>
  )
}

function PurpleBtn({ type = 'submit', onClick, loading, disabled, children }) {
  const inactive = disabled || loading
  return (
    <button
      type={type} onClick={onClick} disabled={inactive}
      style={{
        width: '100%', padding: '13px 0', border: 'none', borderRadius: 12,
        background: inactive ? 'var(--bg-surface2)' : 'var(--accent-purple)',
        color: inactive ? 'var(--text-muted)' : '#fff',
        fontFamily: "'Syne', sans-serif", fontWeight: 700,
        fontSize: 13, letterSpacing: '0.09em',
        cursor: inactive ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        boxShadow: inactive ? 'none' : '0 4px 18px rgba(124,110,245,0.28)',
        transition: 'transform 0.15s, opacity 0.2s',
      }}
      onMouseEnter={e => { if (!inactive) e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {loading ? <Spinner size={16} /> : children}
    </button>
  )
}

function StatBox({ label, value, color }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: 'var(--bg-surface2)', borderRadius: 12, padding: '14px 8px', gap: 4,
    }}>
      <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 20, color: color ?? 'var(--text-primary)' }}>
        {value ?? '—'}
      </span>
      <span style={{ fontSize: 9, letterSpacing: '0.1em', color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono',monospace" }}>
        {label}
      </span>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user: jwtUser, logout } = useAuthStore()

  // Profile data (starts from JWT, enriched by API)
  const [profile,  setProfile]  = useState(null)
  const [apiReady, setApiReady] = useState(false)
  const [toast,    setToast]    = useState(null)

  // Edit name
  const [displayName, setDisplayName] = useState('')
  const [savingInfo,  setSavingInfo]  = useState(false)

  // Change password
  const [curPw,     setCurPw]    = useState('')
  const [newPw,     setNewPw]    = useState('')
  const [newPw2,    setNewPw2]   = useState('')
  const [showPw,    setShowPw]   = useState(false)
  const [savingPw,  setSavingPw] = useState(false)

  // Seed from JWT immediately — no loading spinner needed
  useEffect(() => {
    const seed = {
      email: jwtUser?.email ?? '',
      display_name: jwtUser?.name ?? jwtUser?.display_name ?? '',
      role: jwtUser?.role ?? 'user',
      energy_balance: 0,
      wins: 0, losses: 0, draws: 0, points: 0,
    }
    setProfile(seed)
    setDisplayName(seed.display_name)

    // Enrich with real API data
    getProfile()
      .then(({ data }) => {
        setProfile(data.user)
        setDisplayName(data.user.display_name ?? '')
        setApiReady(true)
      })
      .catch(() => {
        // API not yet deployed — JWT data is enough to show the page
        setApiReady(false)
      })
  }, [jwtUser])

  async function handleSaveInfo(e) {
    e.preventDefault()
    if (!displayName.trim()) return
    setSavingInfo(true)
    try {
      const { data } = await updateProfile({ display_name: displayName.trim() })
      setProfile(p => ({ ...p, ...data.user }))
      setToast({ message: 'Profile updated ✓', type: 'success' })
    } catch (err) {
      setToast({ message: err.response?.data?.error ?? 'Update failed', type: 'error' })
    } finally {
      setSavingInfo(false)
    }
  }

  async function handleChangePw(e) {
    e.preventDefault()
    if (newPw !== newPw2) { setToast({ message: 'Passwords do not match', type: 'error' }); return }
    if (newPw.length < 8) { setToast({ message: 'Min. 8 characters', type: 'error' }); return }
    setSavingPw(true)
    try {
      await changePassword({ current_password: curPw, new_password: newPw })
      setToast({ message: 'Password updated ✓', type: 'success' })
      setCurPw(''); setNewPw(''); setNewPw2('')
    } catch (err) {
      setToast({ message: err.response?.data?.error ?? 'Failed to update password', type: 'error' })
    } finally {
      setSavingPw(false)
    }
  }

  const record = profile ? `${profile.wins ?? 0}-${profile.losses ?? 0}-${profile.draws ?? 0}` : '—'
  const name   = profile?.display_name || profile?.email || 'Player'

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-primary)', paddingBottom: 96 }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '28px 16px 0' }}>

        {/* ── Hero ── */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <Avatar name={name} size={68} borderColor="var(--accent-purple)" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 22,
                color: 'var(--text-primary)', margin: '0 0 3px',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {name}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: "'IBM Plex Mono',monospace", margin: '0 0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile?.email}
              </p>
              <span style={{
                fontSize: 10, fontFamily: "'IBM Plex Mono',monospace",
                padding: '3px 10px', borderRadius: 20,
                background: profile?.role === 'admin' ? 'rgba(248,113,113,0.15)' : 'var(--accent-purple-dim)',
                color: profile?.role === 'admin' ? '#f87171' : 'var(--accent-purple)',
              }}>
                {(profile?.role ?? 'user').toUpperCase()}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <StatBox label="RECORD" value={record} />
            <StatBox label="POINTS" value={profile?.points} color="var(--accent-purple)" />
            <StatBox label="ENERGY" value={`⚡${profile?.energy_balance ?? 0}`} color="var(--accent-green)" />
          </div>
        </Card>

        {/* ── Edit profile ── */}
        <Card title="EDIT PROFILE">
          <form onSubmit={handleSaveInfo} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <Label>DISPLAY NAME</Label>
              <input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your name"
                required
                style={INPUT}
                onFocus={onFocus} onBlur={onBlur}
              />
            </div>
            <div>
              <Label>EMAIL (read-only)</Label>
              <input
                value={profile?.email ?? ''}
                disabled
                style={{ ...INPUT, opacity: 0.38, cursor: 'not-allowed' }}
              />
            </div>
            <PurpleBtn loading={savingInfo} disabled={!displayName.trim()}>
              SAVE CHANGES
            </PurpleBtn>
          </form>
        </Card>

        {/* ── Change password ── */}
        <Card title="CHANGE PASSWORD">
          <form onSubmit={handleChangePw} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <Label>CURRENT PASSWORD</Label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={curPw} onChange={e => setCurPw(e.target.value)}
                  required placeholder="••••••••"
                  style={{ ...INPUT, paddingRight: 46 }}
                  onFocus={onFocus} onBlur={onBlur}
                />
                <EyeBtn show={showPw} onToggle={() => setShowPw(s => !s)} />
              </div>
            </div>
            <div>
              <Label>NEW PASSWORD</Label>
              <input
                type={showPw ? 'text' : 'password'}
                value={newPw} onChange={e => setNewPw(e.target.value)}
                required minLength={8} placeholder="min. 8 characters"
                style={INPUT} onFocus={onFocus} onBlur={onBlur}
              />
            </div>
            <div>
              <Label>CONFIRM NEW PASSWORD</Label>
              <input
                type={showPw ? 'text' : 'password'}
                value={newPw2} onChange={e => setNewPw2(e.target.value)}
                required minLength={8} placeholder="repeat new password"
                style={{
                  ...INPUT,
                  borderColor: newPw2 && newPw !== newPw2 ? 'rgba(248,113,113,0.5)' : 'rgba(124,110,245,0.2)',
                }}
                onFocus={onFocus} onBlur={onBlur}
              />
              {newPw2 && newPw !== newPw2 && (
                <p style={{ fontSize: 11, color: '#f87171', marginTop: 5, fontFamily: "'IBM Plex Mono',monospace" }}>
                  Passwords do not match
                </p>
              )}
            </div>
            <PurpleBtn loading={savingPw} disabled={!curPw || !newPw || newPw !== newPw2}>
              UPDATE PASSWORD
            </PurpleBtn>
          </form>
        </Card>

        {/* ── Sign out ── */}
        <Card title="SESSION">
          <button
            onClick={logout}
            style={{
              width: '100%', padding: '13px 0',
              border: '1px solid rgba(248,113,113,0.25)',
              borderRadius: 12, background: 'rgba(248,113,113,0.07)',
              color: '#f87171', fontFamily: "'Syne',sans-serif",
              fontWeight: 700, fontSize: 13, letterSpacing: '0.08em',
              cursor: 'pointer', transition: 'background 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.15)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.07)' }}
          >
            ↩ &nbsp;SIGN OUT
          </button>
        </Card>

      </div>

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
      <BottomNav />
    </div>
  )
}

function EyeBtn({ show, onToggle }) {
  return (
    <button type="button" onClick={onToggle} style={{
      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
      background: 'none', border: 'none', cursor: 'pointer', padding: 4,
      color: 'rgba(255,255,255,0.3)', display: 'flex',
    }}>
      {show
        ? <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 3l18 18M10.5 10.68A3 3 0 0013.32 13.5M6.35 6.35A9.77 9.77 0 003 12c1.73 4.39 6 7.5 9 7.5a9.77 9.77 0 004.65-1.15M9 9a3 3 0 014.24 4.24M21 12c-1.73-4.39-6-7.5-9-7.5a9.77 9.77 0 00-3.65.75"/></svg>
        : <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      }
    </button>
  )
}
