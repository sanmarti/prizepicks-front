export default function PickOption({ label, cost, discountedCost, selected, disabled, hasToken, onClick }) {
  const appliedCost = hasToken && discountedCost != null ? discountedCost : cost

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className="flex flex-col items-center justify-center rounded-lg px-2 py-1.5 transition-all text-xs font-mono min-w-[52px]"
      style={
        disabled
          ? { background: 'var(--bg-surface2)', color: 'var(--text-muted)', cursor: 'not-allowed' }
          : selected
          ? {
              background: 'var(--accent-green-neon)',
              border: '1.5px solid var(--accent-green)',
              color: 'var(--accent-green)',
              boxShadow: '0 0 10px rgba(57,224,123,0.3)',
            }
          : {
              background: 'var(--bg-surface2)',
              border: '1px solid transparent',
              color: 'var(--text-primary)',
            }
      }
    >
      {disabled ? (
        <>
          <span className="text-base">🔒</span>
          <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Get energy</span>
        </>
      ) : (
        <>
          <div className="flex items-center gap-1">
            {selected && <span className="text-[10px]">✓</span>}
            <span className="font-500">{label}</span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            {hasToken && discountedCost != null && (
              <span
                className="line-through text-[9px]"
                style={{ color: 'var(--text-muted)' }}
              >
                {cost}⚡
              </span>
            )}
            <span className="text-[10px]" style={{ color: selected ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
              {appliedCost}⚡
            </span>
            {hasToken && discountedCost != null && (
              <span
                className="text-[9px] px-1 rounded"
                style={{ background: 'rgba(124,110,245,0.2)', color: 'var(--accent-purple)' }}
              >
                -1
              </span>
            )}
          </div>
        </>
      )}
    </button>
  )
}
