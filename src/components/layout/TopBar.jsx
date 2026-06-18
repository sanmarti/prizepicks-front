import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export default function TopBar({ title, subtitle, showBack = false, right }) {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  return (
    <header
      className="sticky top-0 z-30 flex items-center px-4 py-3 gap-3"
      style={{
        background: 'var(--bg-primary)',
        borderBottom: '1px solid var(--bg-surface2)',
      }}
    >
      {showBack && (
        <button
          onClick={() => navigate(-1)}
          className="text-[var(--text-secondary)] text-xl"
        >
          ←
        </button>
      )}
      <div className="flex-1 min-w-0">
        {title && (
          <h1 className="font-syne font-700 text-base truncate" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="text-[11px] font-mono" style={{ color: 'var(--text-secondary)' }}>
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {right && <div>{right}</div>}
        {user?.role === 'admin' && (
          <button
            onClick={() => navigate('/admin')}
            title="Admin Panel"
            className="text-[11px] font-mono px-2 py-1 rounded transition-colors"
            style={{
              color: 'var(--accent-purple)',
              border: '1px solid var(--accent-purple)',
            }}
          >
            ⚙ admin
          </button>
        )}
        {user && (
          <button
            onClick={logout}
            title="Logout"
            className="text-[11px] font-mono px-2 py-1 rounded transition-colors"
            style={{
              color: 'var(--text-muted)',
              border: '1px solid var(--bg-surface2)',
            }}
          >
            ↩ logout
          </button>
        )}
      </div>
    </header>
  )
}
