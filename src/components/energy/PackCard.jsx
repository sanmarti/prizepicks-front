const PACK_STYLES = {
  starter: {
    icon: '🔋',
    accent: 'var(--accent-purple)',
    bg: 'var(--accent-purple-dim)',
    banner: null,
  },
  value: {
    icon: '⚡',
    accent: 'var(--accent-green)',
    bg: 'var(--accent-green-neon)',
    banner: 'BEST VALUE',
  },
  pro: {
    icon: '🔆',
    accent: '#3b82f6',
    bg: 'rgba(59,130,246,0.12)',
    banner: 'MOST POPULAR',
  },
}

export default function PackCard({ pack, onBuy }) {
  const s = PACK_STYLES[pack.id] ?? PACK_STYLES.starter

  return (
    <div
      className="rounded-xl p-4 relative overflow-hidden"
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${s.accent}`,
        boxShadow: `0 0 16px ${s.bg}`,
      }}
    >
      {s.banner && (
        <div
          className="absolute top-2 right-2 text-[9px] font-mono font-500 px-2 py-0.5 rounded"
          style={{ background: s.accent, color: '#000' }}
        >
          {s.banner}
        </div>
      )}

      <div className="text-3xl mb-2">{s.icon}</div>
      <p className="font-syne font-700 text-base mb-0.5" style={{ color: 'var(--text-primary)' }}>
        {pack.units} ENERGY UNITS
      </p>
      <p className="font-mono text-2xl font-500 mb-3" style={{ color: s.accent }}>
        {pack.price}
      </p>

      <button
        onClick={() => onBuy(pack)}
        className="w-full py-2.5 rounded-xl font-syne font-700 text-sm tracking-wide transition-all hover:opacity-90 active:scale-[0.99]"
        style={{ background: s.accent, color: '#000' }}
      >
        BUY NOW
      </button>
    </div>
  )
}
