import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login as apiLogin } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import Spinner from '../components/ui/Spinner'
import AuthLayout, { MailIcon, LockIcon, EyeIcon, useTheme } from '../components/auth/AuthLayout'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const authLogin = useAuthStore((s) => s.login)
  const navigate  = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await apiLogin({ email, password })
      authLogin(data)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error ?? err.response?.data?.message ?? 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout heading="Welcome back" subheading="Make your picks, outsmart your mates and climb the divisions.">
      <LoginForm
        email={email} setEmail={setEmail}
        password={password} setPassword={setPassword}
        showPw={showPw} setShowPw={setShowPw}
        error={error} loading={loading}
        onSubmit={handleSubmit}
      />
    </AuthLayout>
  )
}

function LoginForm({ email, setEmail, password, setPassword, showPw, setShowPw, error, loading, onSubmit }) {
  const { T } = useTheme()

  const INPUT = {
    width: '100%',
    paddingTop: 13, paddingBottom: 13,
    paddingLeft: 44, paddingRight: 14,
    background: T.inputBg,
    border: `1px solid ${T.inputBorder}`,
    borderRadius: 12,
    color: T.inputColor,
    fontSize: 14, outline: 'none',
    fontFamily: "'IBM Plex Mono', monospace",
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }

  function onFocus(e) {
    e.target.style.borderColor = 'rgba(124,110,245,0.6)'
    e.target.style.boxShadow = '0 0 0 3px rgba(124,110,245,0.08)'
  }
  function onBlur(e) {
    e.target.style.borderColor = T.inputBorder
    e.target.style.boxShadow = 'none'
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Field label="EMAIL" T={T}>
        <Icon T={T}><MailIcon/></Icon>
        <input
          type="email" value={email} onChange={e => setEmail(e.target.value)}
          required placeholder="you@example.com"
          style={INPUT} onFocus={onFocus} onBlur={onBlur}
        />
      </Field>

      <Field label="PASSWORD" T={T}>
        <Icon T={T}><LockIcon/></Icon>
        <input
          type={showPw ? 'text' : 'password'}
          value={password} onChange={e => setPassword(e.target.value)}
          required placeholder="••••••••"
          style={{ ...INPUT, paddingRight: 46 }}
          onFocus={onFocus} onBlur={onBlur}
        />
        <button
          type="button" onClick={() => setShowPw(s => !s)}
          style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', padding: 4,
            color: T.textGhost, display: 'flex',
          }}
        >
          <EyeIcon open={showPw}/>
        </button>
      </Field>

      {error && <ErrorBox T={T}>{error}</ErrorBox>}

      <SubmitBtn loading={loading}>SIGN IN &nbsp;→</SubmitBtn>

      <p style={{
        fontSize: 12, textAlign: 'center', marginTop: 6,
        color: T.textGhost, fontFamily: "'IBM Plex Mono', monospace",
      }}>
        New here?{' '}
        <Link to="/register" style={{ color: '#7c6ef5', textDecoration: 'none' }}>
          Start free
        </Link>
      </p>
    </form>
  )
}

// ── Shared micro-components ────────────────────────────────────────────────────

function Field({ label, children, T }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: 10, letterSpacing: '0.12em',
        color: T.textFaint, marginBottom: 7,
        fontFamily: "'IBM Plex Mono', monospace",
      }}>{label}</label>
      <div style={{ position: 'relative' }}>{children}</div>
    </div>
  )
}

function Icon({ children, T }) {
  return (
    <span style={{
      position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
      color: T.textGhost, pointerEvents: 'none', display: 'flex',
    }}>
      {children}
    </span>
  )
}

export function ErrorBox({ children, T: _T }) {
  return (
    <div style={{
      background: 'rgba(248,113,113,0.07)',
      border: '1px solid rgba(248,113,113,0.18)',
      borderRadius: 8, padding: '10px 14px',
      fontSize: 12, color: '#f87171', textAlign: 'center',
      fontFamily: "'IBM Plex Mono', monospace",
    }}>
      {children}
    </div>
  )
}

export function SubmitBtn({ loading, children }) {
  return (
    <button
      type="submit" disabled={loading}
      style={{
        marginTop: 6, width: '100%', padding: '14px 0',
        border: 'none', borderRadius: 12,
        cursor: loading ? 'not-allowed' : 'pointer',
        fontFamily: "'Syne', sans-serif", fontWeight: 700,
        fontSize: 14, letterSpacing: '0.1em', color: '#fff',
        background: 'linear-gradient(90deg, #16a34a 0%, #22c55e 48%, #16a34a 100%)',
        backgroundSize: '200% auto',
        animation: loading ? 'none' : 'auth-shimmer 3s linear infinite',
        opacity: loading ? 0.6 : 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        boxShadow: loading ? 'none' : '0 4px 22px rgba(34,197,94,0.32)',
        transition: 'transform 0.15s, opacity 0.2s',
      }}
      onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
      onMouseDown={e =>  { e.currentTarget.style.transform = 'scale(0.99)' }}
      onMouseUp={e =>    { e.currentTarget.style.transform = 'translateY(-1px)' }}
    >
      {loading ? <Spinner size={18}/> : children}
    </button>
  )
}
