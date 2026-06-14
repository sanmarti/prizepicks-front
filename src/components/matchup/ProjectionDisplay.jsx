const OUTLOOK_STYLES = {
  'STRONG EDGE':  { color: 'var(--accent-green)', bg: 'var(--accent-green-neon)' },
  'SLIGHT EDGE':  { color: '#fbbf24',             bg: 'rgba(251,191,36,0.12)' },
  'EVEN':         { color: 'var(--text-secondary)',bg: 'var(--bg-surface2)' },
  'AT RISK':      { color: '#f87171',             bg: 'rgba(248,113,113,0.12)' },
}

export default function ProjectionDisplay({ homeScore, awayScore, homeName, awayName, outlook, homeEnergy, awayEnergy }) {
  const style = OUTLOOK_STYLES[outlook] ?? OUTLOOK_STYLES['EVEN']

  return (
    <div
      className="p-4 rounded-xl mb-4"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface2)' }}
    >
      {/* Score */}
      <div className="flex items-center justify-center gap-6 mb-3">
        <div className="flex flex-col items-center">
          <span className="font-syne font-700 text-4xl" style={{ color: 'var(--text-primary)' }}>
            {homeScore}
          </span>
          <span className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>{homeName}</span>
          <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>⚡ {homeEnergy} used</span>
        </div>
        <span className="font-syne font-700 text-2xl" style={{ color: 'var(--text-muted)' }}>vs</span>
        <div className="flex flex-col items-center">
          <span className="font-syne font-700 text-4xl" style={{ color: 'var(--text-primary)' }}>
            {awayScore}
          </span>
          <span className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>{awayName}</span>
          <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>⚡ {awayEnergy} used</span>
        </div>
      </div>

      {/* Outlook */}
      <div className="flex justify-center">
        <span
          className="text-xs font-mono font-500 px-3 py-1 rounded-full"
          style={{ background: style.bg, color: style.color }}
        >
          {outlook}
        </span>
      </div>
    </div>
  )
}
