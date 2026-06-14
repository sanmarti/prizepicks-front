export default function LockButton({ energySpent, energyTotal, picksSelected, picksRequired, onLock, loading }) {
  const ready = picksSelected >= picksRequired

  return (
    <div
      className="fixed bottom-16 left-0 right-0 px-4 py-3 z-30"
      style={{ background: 'var(--bg-primary)' }}
    >
      <button
        onClick={ready ? onLock : undefined}
        disabled={!ready || loading}
        className="w-full py-3.5 rounded-xl font-syne font-700 text-sm tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
        style={
          ready
            ? {
                background: 'var(--accent-green)',
                color: '#000',
                boxShadow: '0 0 24px rgba(57,224,123,0.35)',
              }
            : { background: 'var(--bg-surface2)', color: 'var(--text-muted)', cursor: 'not-allowed' }
        }
      >
        {loading ? (
          <span>Locking...</span>
        ) : (
          <>
            <span>🔒</span>
            <span>LOCK PICKS</span>
            <span
              className="font-mono text-xs ml-1 px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(0,0,0,0.2)' }}
            >
              {energySpent}⚡ / {energyTotal}
            </span>
          </>
        )}
      </button>
      {!ready && (
        <p className="text-center text-[10px] mt-1.5 font-mono" style={{ color: 'var(--text-muted)' }}>
          Select {picksRequired - picksSelected} more pick{picksRequired - picksSelected !== 1 ? 's' : ''} to lock
        </p>
      )}
    </div>
  )
}
