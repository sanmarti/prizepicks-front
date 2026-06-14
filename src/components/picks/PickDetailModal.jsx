import Modal from '../ui/Modal'
import Badge from '../ui/Badge'

const INSIGHTS = [
  { icon: '✅', text: 'Scored in 4 of last 5 matches' },
  { icon: '🎯', text: 'Takes penalties when on the pitch' },
  { icon: '🛡', text: 'Opponent conceded 7 goals in last 3 away matches' },
  { icon: '👕', text: 'Expected to start - team news positive' },
]

export default function PickDetailModal({ open, onClose, event, selectedOption, onSelect, tokens }) {
  if (!event) return null

  const opts = event.options ?? []

  return (
    <Modal open={open} onClose={onClose}>
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Badge competition={event.competition ?? 'EPL'} />
          <span className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>
            {event.type?.toUpperCase()}
          </span>
        </div>
        <h2 className="font-syne font-700 text-lg" style={{ color: 'var(--text-primary)' }}>
          {event.fixture ?? event.label}
        </h2>
        {event.team && (
          <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-secondary)' }}>{event.team}</p>
        )}
      </div>

      {/* Match info */}
      <div
        className="flex items-center justify-center gap-4 py-3 rounded-xl mb-4"
        style={{ background: 'var(--bg-surface2)' }}
      >
        <span className="font-syne font-700 text-sm" style={{ color: 'var(--text-primary)' }}>
          {event.homeTeam ?? 'Home'}
        </span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>vs</span>
        <span className="font-syne font-700 text-sm" style={{ color: 'var(--text-primary)' }}>
          {event.awayTeam ?? 'Away'}
        </span>
      </div>

      {/* Description */}
      {event.description && (
        <p className="text-xs font-mono mb-4" style={{ color: 'var(--text-secondary)' }}>
          {event.description}
        </p>
      )}

      {/* Insights */}
      <div className="mb-4">
        <p className="text-[10px] font-mono tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
          INSIGHTS
        </p>
        <div className="flex flex-col gap-1.5">
          {INSIGHTS.map((ins, i) => (
            <div key={i} className="flex items-start gap-2 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
              <span>{ins.icon}</span>
              <span>{ins.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick stats */}
      <div className="flex gap-2 flex-wrap mb-4">
        {['4.2 Goals (L5)', '4.1 Shots/90', '87% Start', '1.6 oGA/M'].map((stat, i) => (
          <span
            key={i}
            className="text-[10px] font-mono px-2 py-1 rounded-lg"
            style={{
              background: 'var(--bg-surface2)',
              color: i === 3 ? '#f87171' : 'var(--text-secondary)',
            }}
          >
            {stat}
          </span>
        ))}
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2 mb-4">
        {opts.map((opt) => {
          const appliedCost = tokens > 0 && opt.cost > 1 ? opt.cost - 1 : opt.cost
          const isSel = selectedOption === opt.id
          return (
            <button
              key={opt.id}
              onClick={() => onSelect(opt)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all"
              style={
                isSel
                  ? {
                      background: 'var(--accent-purple-dim)',
                      border: '1.5px solid var(--accent-purple)',
                      color: 'var(--accent-purple)',
                      boxShadow: '0 0 12px rgba(124,110,245,0.2)',
                    }
                  : {
                      background: 'var(--bg-surface2)',
                      border: '1px solid transparent',
                      color: 'var(--text-primary)',
                    }
              }
            >
              <span className="font-syne font-700">{opt.label}</span>
              <div className="flex items-center gap-2 font-mono text-sm">
                {tokens > 0 && opt.cost > 1 && (
                  <span className="line-through text-xs" style={{ color: 'var(--text-muted)' }}>
                    {opt.cost}⚡
                  </span>
                )}
                <span>{appliedCost}⚡</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Token note */}
      {tokens > 0 && (
        <p className="text-[10px] font-mono text-center mb-3" style={{ color: 'var(--accent-purple)' }}>
          🔮 {tokens} discount token applied: -1 energy per pick
        </p>
      )}

      <button
        className="w-full py-3 rounded-xl font-syne font-700 text-sm tracking-wide transition-all hover:opacity-90"
        style={{ background: 'var(--accent-purple)', color: '#fff' }}
        onClick={onClose}
      >
        SELECT
      </button>
    </Modal>
  )
}
