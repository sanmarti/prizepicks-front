import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register as apiRegister } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import AuthLayout, { UserIcon, MailIcon, LockIcon, EyeIcon, useTheme } from '../components/auth/AuthLayout'
import { ErrorBox, SubmitBtn } from './LoginPage'

export default function RegisterPage() {
  const [form, setForm]       = useState({ name: '', email: '', password: '' })
  const [showPw, setShowPw]   = useState(false)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const authLogin = useAuthStore((s) => s.login)
  const navigate  = useNavigate()

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await apiRegister(form)
      authLogin(data)
      navigate('/onboarding')
    } catch (err) {
      setError(err.response?.data?.error ?? err.response?.data?.message ?? 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout heading="Create account" subheading="Join a league and start picking">
      <RegisterForm
        form={form} set={set}
        showPw={showPw} setShowPw={setShowPw}
        error={error} loading={loading}
        onSubmit={handleSubmit}
      />
    </AuthLayout>
  )
}

function RegisterForm({ form, set, showPw, setShowPw, error, loading, onSubmit }) {
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
      <Field label="NAME" T={T}>
        <Icon T={T}><UserIcon/></Icon>
        <input
          type="text" value={form.name} onChange={set('name')}
          required placeholder="Your name"
          style={INPUT} onFocus={onFocus} onBlur={onBlur}
        />
      </Field>

      <Field label="EMAIL" T={T}>
        <Icon T={T}><MailIcon/></Icon>
        <input
          type="email" value={form.email} onChange={set('email')}
          required placeholder="you@example.com"
          style={INPUT} onFocus={onFocus} onBlur={onBlur}
        />
      </Field>

      <Field label="PASSWORD" T={T}>
        <Icon T={T}><LockIcon/></Icon>
        <input
          type={showPw ? 'text' : 'password'}
          value={form.password} onChange={set('password')}
          required minLength={8} placeholder="min. 8 characters"
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

      {error && <ErrorBox>{error}</ErrorBox>}

      <SubmitBtn loading={loading}>CREATE ACCOUNT &nbsp;→</SubmitBtn>

      <p style={{
        fontSize: 12, textAlign: 'center', marginTop: 6,
        color: T.textGhost, fontFamily: "'IBM Plex Mono', monospace",
      }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: '#7c6ef5', textDecoration: 'none' }}>
          Sign in
        </Link>
      </p>
    </form>
  )
}

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
