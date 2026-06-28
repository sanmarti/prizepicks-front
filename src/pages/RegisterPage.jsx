import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register as apiRegister } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import AuthLayout, { UserIcon, MailIcon, LockIcon, EyeIcon } from '../components/auth/AuthLayout'
import { ErrorBox, SubmitBtn } from './LoginPage'

const INPUT = {
  width: '100%',
  paddingTop: 13, paddingBottom: 13,
  paddingLeft: 44, paddingRight: 14,
  background: 'rgba(255,255,255,0.035)',
  border: '1px solid rgba(124,110,245,0.18)',
  borderRadius: 12,
  color: 'rgba(255,255,255,0.9)',
  fontSize: 14, outline: 'none',
  fontFamily: "'IBM Plex Mono', monospace",
  transition: 'border-color 0.2s, box-shadow 0.2s',
}

function onFocus(e) {
  e.target.style.borderColor = 'rgba(124,110,245,0.6)'
  e.target.style.boxShadow = '0 0 0 3px rgba(124,110,245,0.08)'
}
function onBlur(e) {
  e.target.style.borderColor = 'rgba(124,110,245,0.18)'
  e.target.style.boxShadow = 'none'
}

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
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Name */}
        <Field label="NAME">
          <Icon><UserIcon/></Icon>
          <input
            type="text" value={form.name} onChange={set('name')}
            required placeholder="Your name"
            style={INPUT} onFocus={onFocus} onBlur={onBlur}
          />
        </Field>

        {/* Email */}
        <Field label="EMAIL">
          <Icon><MailIcon/></Icon>
          <input
            type="email" value={form.email} onChange={set('email')}
            required placeholder="you@example.com"
            style={INPUT} onFocus={onFocus} onBlur={onBlur}
          />
        </Field>

        {/* Password */}
        <Field label="PASSWORD">
          <Icon><LockIcon/></Icon>
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
              color: 'rgba(255,255,255,0.3)', display: 'flex',
            }}
          >
            <EyeIcon open={showPw}/>
          </button>
        </Field>

        {/* Error */}
        {error && <ErrorBox>{error}</ErrorBox>}

        {/* Submit */}
        <SubmitBtn loading={loading}>CREATE ACCOUNT &nbsp;→</SubmitBtn>
      </form>

      <p style={{
        fontSize: 12, textAlign: 'center', marginTop: 20,
        color: 'rgba(255,255,255,0.22)', fontFamily: "'IBM Plex Mono', monospace",
      }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: '#7c6ef5', textDecoration: 'none' }}>
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: 10, letterSpacing: '0.12em',
        color: 'rgba(255,255,255,0.28)', marginBottom: 7,
        fontFamily: "'IBM Plex Mono', monospace",
      }}>{label}</label>
      <div style={{ position: 'relative' }}>{children}</div>
    </div>
  )
}

function Icon({ children }) {
  return (
    <span style={{
      position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
      color: 'rgba(255,255,255,0.22)', pointerEvents: 'none', display: 'flex',
    }}>
      {children}
    </span>
  )
}
