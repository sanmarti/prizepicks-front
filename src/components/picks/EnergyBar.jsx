export default function EnergyBar({ spent, total, picksSelected, picksTotal }) {
  const energyLeft = total - spent
  const urgency = energyLeft <= 3

  return (
    <div
      className="p-3 rounded-xl"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface2)' }}
    >
      <div className="flex items-center gap-3">
        {/* Left: energy spent */}
        <div className="flex-1">
          <div className="flex items-center gap-1 mb-1">
            <span style={{ color: 'var(--accent-green)' }}>⚡</span>
            <span className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>
              ENERGY SPENT {spent} / {total}
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface2)' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${(spent / total) * 100}%`,
                background: 'var(--accent-green)',
              }}
            />
          </div>
        </div>

        {/* Center: energy left circle */}
        <div
          className={`flex flex-col items-center justify-center rounded-full ${urgency ? 'energy-pulse' : ''}`}
          style={{
            width: 56,
            height: 56,
            border: `2px solid ${urgency ? '#f87171' : 'var(--accent-green)'}`,
            background: 'var(--bg-surface2)',
            flexShrink: 0,
          }}
        >
          <span
            className="font-syne font-700 text-lg leading-none"
            style={{ color: urgency ? '#f87171' : 'var(--accent-green)' }}
          >
            {energyLeft}
          </span>
          <span className="text-[8px] font-mono" style={{ color: 'var(--text-muted)' }}>
            LEFT
          </span>
        </div>

        {/* Right: picks selected */}
        <div className="flex-1">
          <div className="flex items-center gap-1 mb-1 justify-end">
            <span className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>
              PICKS {picksSelected} / {picksTotal}
            </span>
            <span style={{ color: 'var(--accent-purple)' }}>📋</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface2)' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${(picksSelected / picksTotal) * 100}%`,
                background: 'var(--accent-purple)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
