const STATUS_CONFIG = {
  SLEEPING:       { color: 'var(--text-muted)',    icon: '😴', score: '0.4' },
  LIVE_FAVORABLE: { color: 'var(--accent-green)',  icon: '🟢', score: '0.75' },
  LIVE_NEUTRAL:   { color: '#fbbf24',              icon: '🟡', score: '0.50' },
  LIVE_RISK:      { color: '#f87171',              icon: '🔴', score: '0.25' },
  WON:            { color: 'var(--accent-green)',  icon: '✓',  score: '1.00' },
  LOST:           { color: '#f87171',              icon: '✗',  score: '0.00' },
}

export default function PickRow({ pick }) {
  const cfg = STATUS_CONFIG[pick.status] ?? STATUS_CONFIG.SLEEPING

  return (
    <div
      className="flex items-center gap-2 py-2 px-2 rounded-lg mb-1"
      style={{ background: 'var(--bg-surface2)' }}
    >
      <span className="text-sm flex-shrink-0">{cfg.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-syne font-500 truncate" style={{ color: 'var(--text-primary)' }}>
          {pick.label}
        </p>
        {pick.fixture && (
          <p className="text-[10px] font-mono truncate" style={{ color: 'var(--text-muted)' }}>
            {pick.fixture}
          </p>
        )}
      </div>
      <span className="font-mono text-xs font-500 flex-shrink-0" style={{ color: cfg.color }}>
        {cfg.score}
      </span>
    </div>
  )
}
