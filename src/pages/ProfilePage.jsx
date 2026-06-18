import { useEffect, useRef, useState } from 'react'
import { getProfile, updateProfile, changePassword } from '../api/users'
import { useAuthStore } from '../store/authStore'
import BottomNav from '../components/layout/BottomNav'
import Spinner from '../components/ui/Spinner'
import Toast from '../components/ui/Toast'

// ── Image compression ─────────────────────────────────────────────────────────
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 220
      const scale = Math.min(MAX / img.width, MAX / img.height, 1)
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width  = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.80))
    }
    img.onerror = reject
    img.src = url
  })
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const INPUT = {
  width: '100%', padding: '12px 14px', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(124,110,245,0.22)',
  borderRadius: 12, color: 'rgba(255,255,255,0.9)',
  fontSize: 14, outline: 'none',
  fontFamily: "'IBM Plex Mono', monospace",
  transition: 'border-color 0.2s, box-shadow 0.2s',
}
const onFocus = e => {
  e.target.style.borderColor = 'rgba(124,110,245,0.7)'
  e.target.style.boxShadow   = '0 0 0 3px rgba(124,110,245,0.1)'
}
const onBlur = e => {
  e.target.style.borderColor = 'rgba(124,110,245,0.22)'
  e.target.style.boxShadow   = 'none'
}

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
          fontSize: 10, letterSpacing: '0.14em', margin: '0 0 18px',
          color: 'rgba(255,255,255,0.22)', fontFamily: "'IBM Plex Mono', monospace",
        }}>{title}</p>
      )}
      {children}
    </div>
  )
}

function PurpleBtn({ type = 'submit', onClick, loading, children, style = {} }) {
  return (
    <button
      type={type} onClick={onClick} disabled={loading}
      style={{
        width: '100%', padding: '13px 0', border: 'none', borderRadius: 12,
        background: loading ? 'var(--bg-surface2)' : 'var(--accent-purple)',
        color: loading ? 'var(--text-muted)' : '#fff',
        fontFamily: "'Syne', sans-serif", fontWeight: 700,
        fontSize: 13, letterSpacing: '0.09em',
        cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        boxShadow: loading ? 'none' : '0 4px 18px rgba(124,110,245,0.28)',
        transition: 'transform 0.15s',
        ...style,
      }}
      onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)' }}
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

// ── Avatar upload button ───────────────────────────────────────────────────────
function AvatarPicker({ src, name, uploading, onFile }) {
  const ref = useRef()
  const initials = (name || '?').charAt(0).toUpperCase()

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {/* Circle */}
      <div
        onClick={() => !uploading && ref.current.click()}
        style={{
          width: 72, height: 72, borderRadius: '50%',
          border: '2px solid var(--accent-purple)',
          background: 'var(--bg-surface2)',
          overflow: 'hidden', cursor: uploading ? 'wait' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}
      >
        {src
          ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 28, color: 'var(--text-primary)' }}>{initials}</span>
        }
        {/* Hover overlay */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'rgba(124,110,245,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: uploading ? 1 : 0,
          transition: 'opacity 0.2s',
        }}
          onMouseEnter={e => { if (!uploading) e.currentTarget.style.opacity = '1' }}
          onMouseLeave={e => { if (!uploading) e.currentTarget.style.opacity = '0' }}
        >
          {uploading
            ? <Spinner size={22} />
            : <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          }
        </div>
      </div>

      {/* Edit badge */}
      <div
        onClick={() => !uploading && ref.current.click()}
        style={{
          position: 'absolute', bottom: 0, right: 0,
          width: 22, height: 22, borderRadius: '50%',
          background: 'var(--accent-purple)',
          border: '2px solid var(--bg-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: uploading ? 'wait' : 'pointer',
        }}
      >
        <svg width="11" height="11" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </div>

      <input
        ref={ref} type="file" accept="image/*"
        style={{ display: 'none' }}
        onChange={e => { if (e.target.files[0]) onFile(e.target.files[0]); e.target.value = '' }}
      />
    </div>
  )
}

// ── Eye toggle ────────────────────────────────────────────────────────────────
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

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user: jwtUser, logout } = useAuthStore()

  const [profile,     setProfile]     = useState(null)
  const [toast,       setToast]       = useState(null)

  // Edit profile
  const [displayName, setDisplayName] = useState('')
  const [avatarSrc,   setAvatarSrc]   = useState(null)
  const [savingInfo,  setSavingInfo]  = useState(false)
  const [uploadingAv, setUploadingAv] = useState(false)

  // Change password
  const [curPw,    setCurPw]    = useState('')
  const [newPw,    setNewPw]    = useState('')
  const [newPw2,   setNewPw2]   = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [savingPw, setSavingPw] = useState(false)

  // Seed from JWT immediately, then enrich from API
  useEffect(() => {
    const fallbackName = jwtUser?.display_name ?? jwtUser?.name ?? ''
    setProfile({ email: jwtUser?.email ?? '', display_name: fallbackName, role: jwtUser?.role ?? 'user', energy_balance: 0, wins: 0, losses: 0, draws: 0, points: 0 })
    setDisplayName(fallbackName)

    getProfile()
      .then(({ data }) => {
        setProfile(data.user)
        setDisplayName(data.user.display_name ?? '')
        setAvatarSrc(data.user.avatar_url || null)
      })
      .catch(() => {/* API not deployed yet — JWT fallback is fine */})
  }, [jwtUser])

  // ── Avatar upload ────────────────────────────────────────────────────────────
  async function handleAvatarFile(file) {
    setUploadingAv(true)
    try {
      const base64 = await compressImage(file)
      const { data } = await updateProfile({ avatar_url: base64 })
      setAvatarSrc(data.user.avatar_url)
      setProfile(p => ({ ...p, avatar_url: data.user.avatar_url }))
      setToast({ message: 'Profile picture updated ✓', type: 'success' })
    } catch (err) {
      setToast({ message: err.response?.data?.error ?? 'Upload failed', type: 'error' })
    } finally {
      setUploadingAv(false)
    }
  }

  // ── Save name ────────────────────────────────────────────────────────────────
  async function handleSaveInfo(e) {
    e.preventDefault()
    const name = displayName.trim()
    if (name.length < 2) { setToast({ message: 'Name must be at least 2 characters', type: 'error' }); return }
    setSavingInfo(true)
    try {
      const { data } = await updateProfile({ display_name: name })
      setProfile(p => ({ ...p, display_name: data.user.display_name }))
      setToast({ message: 'Name updated ✓', type: 'success' })
    } catch (err) {
      setToast({ message: err.response?.data?.error ?? 'Update failed', type: 'error' })
    } finally {
      setSavingInfo(false)
    }
  }

  // ── Change password ──────────────────────────────────────────────────────────
  async function handleChangePw(e) {
    e.preventDefault()
    if (newPw !== newPw2) { setToast({ message: 'Passwords do not match', type: 'error' }); return }
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

  const record    = profile ? `${profile.wins ?? 0}-${profile.losses ?? 0}-${profile.draws ?? 0}` : '—'
  const shownName = profile?.display_name || profile?.email || 'Player'

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-primary)', paddingBottom: 96 }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '28px 16px 0' }}>

        {/* ── Hero card ── */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <AvatarPicker
              src={avatarSrc}
              name={shownName}
              uploading={uploadingAv}
              onFile={handleAvatarFile}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 21,
                color: 'var(--text-primary)', margin: '0 0 3px',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {shownName}
              </p>
              <p style={{
                fontSize: 12, color: 'var(--text-secondary)', fontFamily: "'IBM Plex Mono',monospace",
                margin: '0 0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
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
            <StatBox label="RECORD"  value={record} />
            <StatBox label="POINTS"  value={profile?.points}           color="var(--accent-purple)" />
            <StatBox label="ENERGY"  value={`⚡${profile?.energy_balance ?? 0}`} color="var(--accent-green)" />
          </div>

          <p style={{
            fontSize: 10, textAlign: 'center', marginTop: 12, marginBottom: 0,
            color: 'rgba(255,255,255,0.2)', fontFamily: "'IBM Plex Mono',monospace",
          }}>
            Tap the avatar to change your profile picture
          </p>
        </Card>

        {/* ── Edit name ── */}
        <Card title="EDIT PROFILE">
          <form onSubmit={handleSaveInfo} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <Label>DISPLAY NAME</Label>
              <input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your name"
                required minLength={2}
                style={INPUT}
                onFocus={onFocus} onBlur={onBlur}
              />
            </div>
            <div>
              <Label>EMAIL (read-only)</Label>
              <input
                value={profile?.email ?? ''}
                disabled
                style={{ ...INPUT, opacity: 0.35, cursor: 'not-allowed' }}
              />
            </div>
            <PurpleBtn loading={savingInfo}>
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
                  borderColor: newPw2 && newPw !== newPw2
                    ? 'rgba(248,113,113,0.5)' : 'rgba(124,110,245,0.22)',
                }}
                onFocus={onFocus} onBlur={onBlur}
              />
              {newPw2 && newPw !== newPw2 && (
                <p style={{ fontSize: 11, color: '#f87171', marginTop: 5, fontFamily: "'IBM Plex Mono',monospace" }}>
                  Passwords do not match
                </p>
              )}
            </div>
            <PurpleBtn loading={savingPw}>
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
