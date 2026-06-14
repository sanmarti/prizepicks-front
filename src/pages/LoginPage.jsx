import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login as apiLogin } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import Spinner from '../components/ui/Spinner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const authLogin = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await apiLogin({ email, password })
      authLogin(data)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message ?? 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-5 py-8"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Logo */}
      <h1
        className="font-syne font-700 text-3xl tracking-widest mb-1"
        style={{
          background: 'linear-gradient(135deg, var(--accent-purple) 0%, #a78bfa 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        PRIZEPICKS
      </h1>
      <p className="text-xs font-mono mb-8" style={{ color: 'var(--text-muted)' }}>
        Football fantasy leagues
      </p>

      {/* Card */}
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--accent-purple-dim)',
          boxShadow: '0 0 40px rgba(124,110,245,0.08)',
        }}
      >
        <h2 className="font-syne font-700 text-lg mb-5" style={{ color: 'var(--text-primary)' }}>
          Sign In
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-[10px] font-mono tracking-widest block mb-1.5" style={{ color: 'var(--text-muted)' }}>
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full px-3 py-2.5 rounded-xl text-sm font-mono outline-none transition-all"
              style={{
                background: 'var(--bg-surface2)',
                border: '1px solid var(--accent-purple-dim)',
                color: 'var(--text-primary)',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent-purple)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--accent-purple-dim)')}
            />
          </div>

          <div>
            <label className="text-[10px] font-mono tracking-widest block mb-1.5" style={{ color: 'var(--text-muted)' }}>
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-3 py-2.5 rounded-xl text-sm font-mono outline-none transition-all"
              style={{
                background: 'var(--bg-surface2)',
                border: '1px solid var(--accent-purple-dim)',
                color: 'var(--text-primary)',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent-purple)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--accent-purple-dim)')}
            />
          </div>

          {error && (
            <p className="text-[11px] font-mono text-center" style={{ color: '#f87171' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-3 rounded-xl font-syne font-700 text-sm tracking-widest flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.99]"
            style={{ background: 'var(--accent-purple)', color: '#fff' }}
          >
            {loading ? <Spinner size={18} /> : 'CONTINUE'}
          </button>
        </form>

        <p className="text-xs font-mono text-center mt-4" style={{ color: 'var(--text-muted)' }}>
          No account?{' '}
          <Link to="/register" style={{ color: 'var(--accent-purple)' }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}
