import PickOption from './PickOption'

const CATEGORY_ICONS = {
  match: '⚽',
  goals: '🎯',
  player: '👤',
  cleansheet: '🛡',
}

export default function EventCard({ event, index, selectedOption, energyLeft, tokens, onOptionClick }) {
  const icon = CATEGORY_ICONS[event.category] ?? '⚽'

  return (
    <div
      className="rounded-xl p-3 mb-2"
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${selectedOption ? 'rgba(57,224,123,0.3)' : 'var(--bg-surface2)'}`,
      }}
    >
      <div className="flex items-start gap-2">
        {/* Number */}
        <span
          className="font-mono text-xs mt-0.5 w-5 text-right flex-shrink-0"
          style={{ color: 'var(--text-muted)' }}
        >
          {index}
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-base">{icon}</span>
            <span
              className="text-[10px] font-mono tracking-wider"
              style={{ color: 'var(--accent-purple)' }}
            >
              {event.type?.toUpperCase() ?? 'EVENT'}
            </span>
          </div>
          <p className="text-sm font-syne font-500 truncate" style={{ color: 'var(--text-primary)' }}>
            {event.fixture ?? event.label}
          </p>

          {/* Options */}
          <div className="flex gap-2 mt-2 flex-wrap">
            {event.options?.map((opt) => {
              const canAfford = energyLeft >= opt.cost || selectedOption === opt.id
              return (
                <PickOption
                  key={opt.id}
                  label={opt.label}
                  cost={opt.cost}
                  discountedCost={opt.cost > 1 ? opt.cost - 1 : undefined}
                  selected={selectedOption === opt.id}
                  disabled={!canAfford && selectedOption !== opt.id}
                  hasToken={tokens > 0}
                  onClick={() => onOptionClick(event.id, opt)}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
