import { useEffect, useRef, useState } from 'react'
import { getProfile, updateProfile, changePassword } from '../api/users'
import { useAuthStore } from '../store/authStore'
import BottomNav from '../components/layout/BottomNav'
import Spinner from '../components/ui/Spinner'

// ── Image compression (client-side, no server cost) ───────────────────────────
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 220
      const scale = Math.min(MAX / img.width, MAX / img.height, 1)
      const canvas = document.createElement('canvas')
      canvas.width  = Math.round(img.width  * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Bad image')) }
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
const focus = e => { e.target.style.borderColor = 'rgba(124,110,245,0.7)'; e.target.style.boxShadow = '0 0 0 3px rgba(124,110,245,0.1)' }
const blur  = e => { e.target.style.borderColor = 'rgba(124,110,245,0.22)'; e.target.style.boxShadow = 'none' }

function Lbl({ children }) {
  return <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.13em', marginBottom: 7, color: 'rgba(255,255,255,0.3)', fontFamily: "'IBM Plex Mono',monospace" }}>{children}</label>
}

function Card({ title, children }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface2)', borderRadius: 18, padding: '20px 18px', marginBottom: 14 }}>
      {title && <p style={{ fontSize: 10, letterSpacing: '0.14em', margin: '0 0 18px', color: 'rgba(255,255,255,0.22)', fontFamily: "'IBM Plex Mono',monospace" }}>{title}</p>}
      {children}
    </div>
  )
}

// Inline status shown right under the button — more reliable than a floating toast
function InlineMsg({ status }) {
  if (!status) return null
  const isErr = status.type === 'error'
  return (
    <div style={{
      marginTop: 10, padding: '10px 14px', borderRadius: 10, fontSize: 12,
      fontFamily: "'IBM Plex Mono',monospace", textAlign: 'center',
      background: isErr ? 'rgba(248,113,113,0.08)' : 'rgba(57,224,123,0.08)',
      border: `1px solid ${isErr ? 'rgba(248,113,113,0.25)' : 'rgba(57,224,123,0.25)'}`,
      color: isErr ? '#f87171' : 'var(--accent-green)',
    }}>
      {status.msg}
    </div>
  )
}

function Btn({ loading, children, onClick, red }) {
  return (
    <button
      type={onClick ? 'button' : 'submit'}
      onClick={onClick}
      disabled={loading}
      style={{
        width: '100%', padding: '13px 0', border: red ? '1px solid rgba(248,113,113,0.3)' : 'none',
        borderRadius: 12,
        background: loading ? 'var(--bg-surface2)' : red ? 'rgba(248,113,113,0.08)' : 'var(--accent-purple)',
        color: loading ? 'var(--text-muted)' : red ? '#f87171' : '#fff',
        fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: '0.09em',
        cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        boxShadow: loading || red ? 'none' : '0 4px 18px rgba(124,110,245,0.28)',
        transition: 'transform 0.15s, background 0.2s',
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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--bg-surface2)', borderRadius: 12, padding: '14px 8px', gap: 4 }}>
      <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 20, color: color ?? 'var(--text-primary)' }}>{value ?? '—'}</span>
      <span style={{ fontSize: 9, letterSpacing: '0.1em', color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono',monospace" }}>{label}</span>
    </div>
  )
}

// ── Avatar picker ─────────────────────────────────────────────────────────────
function AvatarPicker({ src, name, uploading, onFile }) {
  const ref = useRef()
  const initial = (name || '?').charAt(0).toUpperCase()

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div
        onClick={() => !uploading && ref.current.click()}
        title="Change profile picture"
        style={{ width: 72, height: 72, borderRadius: '50%', border: '2px solid var(--accent-purple)', background: 'var(--bg-surface2)', overflow: 'hidden', cursor: uploading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
      >
        {src
          ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 28, color: 'var(--text-primary)' }}>{initial}</span>
        }
        <div
          style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(124,110,245,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: uploading ? 1 : 0, transition: 'opacity 0.18s' }}
          onMouseEnter={e => { if (!uploading) e.currentTarget.style.opacity = '1' }}
          onMouseLeave={e => { if (!uploading) e.currentTarget.style.opacity = '0' }}
        >
          {uploading ? <Spinner size={22} /> : <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>}
        </div>
      </div>
      {/* Edit badge */}
      <div onClick={() => !uploading && ref.current.click()} style={{ position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: '50%', background: 'var(--accent-purple)', border: '2px solid var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <svg width="11" height="11" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </div>
      <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) onFile(e.target.files[0]); e.target.value = '' }} />
    </div>
  )
}

function EyeBtn({ show, onToggle }) {
  return (
    <button type="button" onClick={onToggle} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'rgba(255,255,255,0.3)', display: 'flex' }}>
      {show
        ? <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 3l18 18M10.5 10.68A3 3 0 0013.32 13.5M6.35 6.35A9.77 9.77 0 003 12c1.73 4.39 6 7.5 9 7.5a9.77 9.77 0 004.65-1.15M9 9a3 3 0 014.24 4.24M21 12c-1.73-4.39-6-7.5-9-7.5a9.77 9.77 0 00-3.65.75"/></svg>
        : <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      }
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user: jwt, logout } = useAuthStore()

  const [profile,    setProfile]    = useState(null)
  const [avatarSrc,  setAvatarSrc]  = useState(null)

  // edit name
  const [displayName, setDisplayName] = useState('')
  const [savingInfo,  setSavingInfo]  = useState(false)
  const [infoMsg,     setInfoMsg]     = useState(null)

  // avatar
  const [uploadingAv, setUploadingAv] = useState(false)
  const [avatarMsg,   setAvatarMsg]   = useState(null)

  // change password
  const [curPw,    setCurPw]    = useState('')
  const [newPw,    setNewPw]    = useState('')
  const [newPw2,   setNewPw2]   = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [savingPw, setSavingPw] = useState(false)
  const [pwMsg,    setPwMsg]    = useState(null)

  // ── Seed from JWT then enrich from API ────────────────────────────────────────
  useEffect(() => {
    // Use email prefix as name fallback so the field is never empty
    const jwtName     = jwt?.display_name ?? jwt?.name ?? ''
    const emailPrefix = (jwt?.email ?? '').split('@')[0]
    const fallback    = jwtName || emailPrefix

    setProfile({ email: jwt?.email ?? '', display_name: fallback, role: jwt?.role ?? 'user', energy_balance: 0, wins: 0, losses: 0, draws: 0, points: 0 })
    setDisplayName(fallback)

    getProfile()
      .then(({ data }) => {
        const u = data.user
        setProfile(u)
        setDisplayName(u.display_name || (u.email ?? '').split('@')[0])
        setAvatarSrc(u.avatar_url || null)
      })
      .catch(() => { /* API may not be deployed yet — JWT fallback is shown */ })
  }, [jwt])

  // ── Avatar upload ─────────────────────────────────────────────────────────────
  async function handleAvatarFile(file) {
    setUploadingAv(true)
    setAvatarMsg(null)
    try {
      const base64 = await compressImage(file)
      const { data } = await updateProfile({ avatar_url: base64 })
      setAvatarSrc(data.user.avatar_url)
      setProfile(p => ({ ...p, avatar_url: data.user.avatar_url }))
      setAvatarMsg({ type: 'ok', msg: 'Profile picture updated ✓' })
    } catch (err) {
      setAvatarMsg({ type: 'error', msg: err.response?.data?.error ?? 'Upload failed — try again' })
    } finally {
      setUploadingAv(false)
    }
  }

  // ── Save name ─────────────────────────────────────────────────────────────────
  async function handleSaveInfo(e) {
    e.preventDefault()
    const name = displayName.trim()
    if (name.length < 2) {
      setInfoMsg({ type: 'error', msg: 'Name must be at least 2 characters' })
      return
    }
    setSavingInfo(true)
    setInfoMsg(null)
    try {
      const { data } = await updateProfile({ display_name: name })
      setProfile(p => ({ ...p, display_name: data.user.display_name }))
      setInfoMsg({ type: 'ok', msg: 'Name updated ✓' })
    } catch (err) {
      const msg = err.response?.data?.error ?? err.message ?? 'Update failed'
      setInfoMsg({ type: 'error', msg })
    } finally {
      setSavingInfo(false)
    }
  }

  // ── Change password ───────────────────────────────────────────────────────────
  async function handleChangePw(e) {
    e.preventDefault()
    if (newPw !== newPw2) { setPwMsg({ type: 'error', msg: 'Passwords do not match' }); return }
    if (newPw.length < 8) { setPwMsg({ type: 'error', msg: 'Minimum 8 characters' });   return }
    setSavingPw(true)
    setPwMsg(null)
    try {
      await changePassword({ current_password: curPw, new_password: newPw })
      setPwMsg({ type: 'ok', msg: 'Password updated ✓' })
      setCurPw(''); setNewPw(''); setNewPw2('')
    } catch (err) {
      setPwMsg({ type: 'error', msg: err.response?.data?.error ?? 'Failed — check current password' })
    } finally {
      setSavingPw(false)
    }
  }

  const record    = profile ? `${profile.wins ?? 0}-${profile.losses ?? 0}-${profile.draws ?? 0}` : '—'
  const shownName = profile?.display_name || (profile?.email ?? '').split('@')[0] || 'Player'

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-primary)', paddingBottom: 96 }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '28px 16px 0' }}>

        {/* ── Hero ── */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <AvatarPicker src={avatarSrc} name={shownName} uploading={uploadingAv} onFile={handleAvatarFile} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 21, color: 'var(--text-primary)', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {shownName}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: "'IBM Plex Mono',monospace", margin: '0 0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile?.email}
              </p>
              <span style={{ fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", padding: '3px 10px', borderRadius: 20, background: profile?.role === 'admin' ? 'rgba(248,113,113,0.15)' : 'var(--accent-purple-dim)', color: profile?.role === 'admin' ? '#f87171' : 'var(--accent-purple)' }}>
                {(profile?.role ?? 'user').toUpperCase()}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
            <StatBox label="RECORD" value={record} />
            <StatBox label="POINTS" value={profile?.points}                   color="var(--accent-purple)" />
            <StatBox label="ENERGY" value={`⚡${profile?.energy_balance ?? 0}`} color="var(--accent-green)" />
          </div>

          <InlineMsg status={avatarMsg} />
          <p style={{ fontSize: 10, textAlign: 'center', marginTop: 8, marginBottom: 0, color: 'rgba(255,255,255,0.18)', fontFamily: "'IBM Plex Mono',monospace" }}>
            Tap the avatar to change your profile picture
          </p>
        </Card>

        {/* ── Edit name ── */}
        <Card title="EDIT PROFILE">
          <form onSubmit={handleSaveInfo} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <Lbl>DISPLAY NAME</Lbl>
              {/* No required / minLength — handled in JS to avoid silent browser block */}
              <input
                value={displayName}
                onChange={e => { setDisplayName(e.target.value); setInfoMsg(null) }}
                placeholder="Your name"
                style={INPUT}
                onFocus={focus} onBlur={blur}
              />
            </div>
            <div>
              <Lbl>EMAIL (read-only)</Lbl>
              <input value={profile?.email ?? ''} disabled style={{ ...INPUT, opacity: 0.35, cursor: 'not-allowed' }} />
            </div>
            <Btn loading={savingInfo}>SAVE CHANGES</Btn>
            <InlineMsg status={infoMsg} />
          </form>
        </Card>

        {/* ── Change password ── */}
        <Card title="CHANGE PASSWORD">
          <form onSubmit={handleChangePw} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <Lbl>CURRENT PASSWORD</Lbl>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={curPw} onChange={e => { setCurPw(e.target.value); setPwMsg(null) }}
                  placeholder="••••••••"
                  style={{ ...INPUT, paddingRight: 46 }}
                  onFocus={focus} onBlur={blur}
                />
                <EyeBtn show={showPw} onToggle={() => setShowPw(s => !s)} />
              </div>
            </div>
            <div>
              <Lbl>NEW PASSWORD</Lbl>
              <input
                type={showPw ? 'text' : 'password'}
                value={newPw} onChange={e => { setNewPw(e.target.value); setPwMsg(null) }}
                placeholder="min. 8 characters"
                style={INPUT} onFocus={focus} onBlur={blur}
              />
            </div>
            <div>
              <Lbl>CONFIRM NEW PASSWORD</Lbl>
              <input
                type={showPw ? 'text' : 'password'}
                value={newPw2} onChange={e => { setNewPw2(e.target.value); setPwMsg(null) }}
                placeholder="repeat new password"
                style={{ ...INPUT, borderColor: newPw2 && newPw !== newPw2 ? 'rgba(248,113,113,0.5)' : 'rgba(124,110,245,0.22)' }}
                onFocus={focus} onBlur={blur}
              />
              {newPw2 && newPw !== newPw2 && (
                <p style={{ fontSize: 11, color: '#f87171', marginTop: 5, fontFamily: "'IBM Plex Mono',monospace" }}>Passwords do not match</p>
              )}
            </div>
            <Btn loading={savingPw}>UPDATE PASSWORD</Btn>
            <InlineMsg status={pwMsg} />
          </form>
        </Card>

        {/* ── Sign out ── */}
        <Card title="SESSION">
          <Btn red onClick={logout}>↩ &nbsp;SIGN OUT</Btn>
        </Card>

      </div>
      <BottomNav />
    </div>
  )
}
