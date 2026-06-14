const COMPETITION_STYLES = {
  EPL:       { bg: '#3a7d44', label: 'EPL' },
  CHAMPIONS: { bg: '#1a3a6b', label: 'UCL' },
  LALIGA:    { bg: '#8b1a1a', label: 'LALIGA' },
  SERIEA:    { bg: '#0055a4', label: 'SERIE A' },
  WORLDCUP:  { bg: '#5a3e00', label: 'WORLD CUP' },
}

export default function Badge({ competition, className = '' }) {
  const style = COMPETITION_STYLES[competition?.toUpperCase()] ?? { bg: '#333', label: competition }
  return (
    <span
      className={`inline-block text-[10px] font-mono font-500 px-2 py-0.5 rounded uppercase tracking-wider ${className}`}
      style={{ background: style.bg, color: 'rgba(255,255,255,0.9)' }}
    >
      {style.label}
    </span>
  )
}
