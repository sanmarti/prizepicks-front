import { useNavigate } from 'react-router-dom'

export default function TopBar({ title, subtitle, showBack = false, right }) {
  const navigate = useNavigate()

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
      {right && <div className="flex-shrink-0">{right}</div>}
    </header>
  )
}
