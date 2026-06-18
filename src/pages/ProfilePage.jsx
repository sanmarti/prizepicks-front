import { useEffect, useState } from 'react'
import { getProfile, updateProfile, changePassword } from '../api/users'
import { useAuthStore } from '../store/authStore'
import Avatar from '../components/ui/Avatar'
import BottomNav from '../components/layout/BottomNav'
import Spinner from '../components/ui/Spinner'
import Toast from '../components/ui/Toast'

// ── Shared input style ─────────────────────────────────────────────────────────
const INPUT = {
  width: '100%',
  padding: '12px 14px',
  background: 'rgba(255,255,255,0.035)',
  border: '1px solid rgba(124,110,245,0.18)',
  borderRadius: 12,
  color: 'rgba(255,255,255,0.9)',
  fontSize: 14,
  outline: 'none',
  fontFamily: "'IBM Plex Mono', monospace",
  transition: 'border-color 0.2s, box-shadow 0.2s',
  boxSizing: 'border-box',
}

function onFocus(e) {
  e.target.style.borderColor = 'rgba(124,110,245,0.6)'
  e.target.style.boxShadow   = '0 0 0 3px rgba(124,110,245,0.08)'
}
function onBlur(e) {
  e.target.style.borderColor = 'rgba(124,110,245,0.18)'
  e.target.style.boxShadow   = 'none'
}

function Label({ children }) {
  return (
    <label style={{
      display: 'block', fontSize: 10, letterSpacing: '0.12em',
      color: 'rgba(255,255,255,0.28)', marginBottom: 7,
      fontFamily: "'IBM Plex Mono', monospace",
    }}>
      {children}
    </label>
  )
}

function Section({ title, children }) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--bg-surface2)',
      borderRadius: 16, padding: 20, marginBottom: 16,
    }}>
      <p style={{
        fontSize: 10, letterSpacing: '0.14em', marginBottom: 16,
        color: 'rgba(255,255,255,0.25)', fontFamily: "'IBM Plex Mono', monospace",
      }}>
        {title}
      </p>
      {children}
    </div>
  )
}

function PrimaryBtn({ onClick, loading, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: '100%', padding: '13px 0', border: 'none', borderRadius: 12,
        background: disabled || loading ? 'var(--bg-surface2)' : 'var(--accent-purple)',
        color: disabled || loading ? 'var(--text-muted)' : '#fff',
        fontFamily: "'Syne', sans-serif", fontWeight: 700,
        fontSize: 13, letterSpacing: '0.08em', cursor: disabled || loading ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transition: 'opacity 0.2s, transform 0.15s',
        boxShadow: disabled || loading ? 'none' : '0 4px 16px rgba(124,110,245,0.25)',
      }}
      onMouseEnter={e => { if (!disabled && !loading) e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {loading ? <Spinner size={16} /> : children}
    </button>
  )
}

function StatPill({ label, value, color }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: 'var(--bg-surface2)', borderRadius: 12, padding: '12px 8px',
    }}>
      <span style={{
        fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 22,
        color: color ?? 'var(--text-primary)',
      }}>
        {value ?? '—'}
      </span>
      <span style={{ fontSize: 9, letterSpacing: '0.1em', color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace", marginTop: 3 }}>
        {label}
      </span>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { logout } = useAuthStore()
  const [profile, setProfile]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [toast, setToast]       = useState(null)

  // Edit profile form
  const [displayName, setDisplayName]   = useState('')
  const [savingInfo, setSavingInfo]     = useState(false)

  // Change password form
  const [curPw,  setCurPw]  = useState('')
  const [newPw,  setNewPw]  = useState('')
  const [newPw2, setNewPw2] = useState('')
  const [savingPw, setSavingPw] = useState(false)
  const [showPw, setShowPw] = useState(false)

  useEffect(() => {
    getProfile()
      .then(({ data }) => {
        setProfile(data.user)
        setDisplayName(data.user.display_name ?? '')
      })
      .catch(() => setToast({ message: 'Could not load profile', type: 'error' }))
      .finally(() => setLoading(false))
  }, [])

  async function handleSaveInfo(e) {
    e.preventDefault()
    if (!displayName.trim()) return
    setSavingInfo(true)
    try {
      const { data } = await updateProfile({ display_name: displayName.trim() })
      setProfile(p => ({ ...p, ...data.user }))
      setToast({ message: 'Profile updated', type: 'success' })
    } catch (err) {
      setToast({ message: err.response?.data?.error ?? 'Update failed', type: 'error' })
    } finally {
      setSavingInfo(false)
    }
  }

  async function handleChangePw(e) {
    e.preventDefault()
    if (newPw !== newPw2) { setToast({ message: 'Passwords do not match', type: 'error' }); return }
    if (newPw.length < 8) { setToast({ message: 'Password must be at least 8 characters', type: 'error' }); return }
    setSavingPw(true)
    try {
      await changePassword({ current_password: curPw, new_password: newPw })
      setToast({ message: 'Password changed', type: 'success' })
      setCurPw(''); setNewPw(''); setNewPw2('')
    } catch (err) {
      setToast({ message: err.response?.data?.error ?? 'Password change failed', type: 'error' })
    } finally {
      setSavingPw(false)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      <Spinner size={36} />
    </div>
  )

  const record = profile
    ? `${profile.wins ?? 0}-${profile.losses ?? 0}-${profile.draws ?? 0}`
    : '—'

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-primary)', paddingBottom: 96 }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px 0' }}>

        {/* ── Avatar + name hero ── */}
        <Section title="YOUR PROFILE">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <Avatar
              name={profile?.display_name ?? profile?.email ?? 'U'}
              size={64}
              borderColor="var(--accent-purple)"
            />
            <div>
              <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 20, color: 'var(--text-primary)', margin: 0 }}>
                {profile?.display_name ?? 'Player'}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: "'IBM Plex Mono', monospace", margin: '3px 0 0' }}>
                {profile?.email}
              </p>
              <span style={{
                display: 'inline-block', marginTop: 6,
                fontSize: 10, fontFamily: "'IBM Plex Mono', monospace",
                padding: '3px 10px', borderRadius: 20,
                background: profile?.role === 'admin' ? 'rgba(248,113,113,0.15)' : 'var(--accent-purple-dim)',
                color: profile?.role === 'admin' ? '#f87171' : 'var(--accent-purple)',
              }}>
                {(profile?.role ?? 'user').toUpperCase()}
              </span>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 10 }}>
            <StatPill label="RECORD"  value={record} />
            <StatPill label="POINTS"  value={profile?.points}         color="var(--accent-purple)" />
            <StatPill label="ENERGY"  value={`⚡${profile?.energy_balance ?? 0}`} color="var(--accent-green)" />
          </div>
        </Section>

        {/* ── Edit display name ── */}
        <Section title="EDIT PROFILE">
          <form onSubmit={handleSaveInfo} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <Label>DISPLAY NAME</Label>
              <input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your name"
                required
                style={INPUT}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>
            <div>
              <Label>EMAIL</Label>
              <input
                value={profile?.email ?? ''}
                disabled
                style={{ ...INPUT, opacity: 0.4, cursor: 'not-allowed' }}
              />
            </div>
            <PrimaryBtn loading={savingInfo} disabled={displayName.trim() === (profile?.display_name ?? '')}>
              SAVE CHANGES
            </PrimaryBtn>
          </form>
        </Section>

        {/* ── Change password ── */}
        <Section title="CHANGE PASSWORD">
          <form onSubmit={handleChangePw} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <Label>CURRENT PASSWORD</Label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={curPw}
                  onChange={e => setCurPw(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{ ...INPUT, paddingRight: 46 }}
                  onFocus={onFocus} onBlur={onBlur}
                />
                <EyeToggle show={showPw} onToggle={() => setShowPw(s => !s)} />
              </div>
            </div>
            <div>
              <Label>NEW PASSWORD</Label>
              <input
                type={showPw ? 'text' : 'password'}
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                required minLength={8}
                placeholder="min. 8 characters"
                style={INPUT}
                onFocus={onFocus} onBlur={onBlur}
              />
            </div>
            <div>
              <Label>CONFIRM NEW PASSWORD</Label>
              <input
                type={showPw ? 'text' : 'password'}
                value={newPw2}
                onChange={e => setNewPw2(e.target.value)}
                required minLength={8}
                placeholder="repeat new password"
                style={{
                  ...INPUT,
                  borderColor: newPw2 && newPw !== newPw2
                    ? 'rgba(248,113,113,0.5)' : 'rgba(124,110,245,0.18)',
                }}
                onFocus={onFocus} onBlur={onBlur}
              />
              {newPw2 && newPw !== newPw2 && (
                <p style={{ fontSize: 11, color: '#f87171', marginTop: 5, fontFamily: "'IBM Plex Mono', monospace" }}>
                  Passwords do not match
                </p>
              )}
            </div>
            <PrimaryBtn loading={savingPw} disabled={!curPw || !newPw || newPw !== newPw2}>
              UPDATE PASSWORD
            </PrimaryBtn>
          </form>
        </Section>

        {/* ── Danger zone ── */}
        <Section title="SESSION">
          <button
            onClick={logout}
            style={{
              width: '100%', padding: '13px 0', border: '1px solid rgba(248,113,113,0.25)',
              borderRadius: 12, background: 'rgba(248,113,113,0.07)',
              color: '#f87171', fontFamily: "'Syne', sans-serif",
              fontWeight: 700, fontSize: 13, letterSpacing: '0.08em',
              cursor: 'pointer', transition: 'background 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.14)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.07)' }}
          >
            ↩ &nbsp;SIGN OUT
          </button>
        </Section>

      </div>

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
      <BottomNav />
    </div>
  )
}

function EyeToggle({ show, onToggle }) {
  return (
    <button
      type="button" onClick={onToggle}
      style={{
        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none', cursor: 'pointer', padding: 4,
        color: 'rgba(255,255,255,0.3)', display: 'flex',
      }}
    >
      {show
        ? <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 3l18 18M10.5 10.68A3 3 0 0013.32 13.5M6.35 6.35A9.77 9.77 0 003 12c1.73 4.39 6 7.5 9 7.5a9.77 9.77 0 004.65-1.15M9 9a3 3 0 014.24 4.24M21 12c-1.73-4.39-6-7.5-9-7.5a9.77 9.77 0 00-3.65.75"/></svg>
        : <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      }
    </button>
  )
}
