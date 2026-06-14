import Avatar from '../ui/Avatar'
import { useCountdown } from '../../hooks/useCountdown'

export default function MatchupHeader({ matchup }) {
  const countdown = useCountdown(matchup?.lockAt)

  return (
    <div
      className="p-4 rounded-xl mb-4"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface2)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
          {matchup?.weekLabel ?? 'Week 12'}
        </span>
        {countdown && (
          <span className="text-[10px] font-mono" style={{ color: '#fb923c' }}>
            🔒 {countdown}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col items-center gap-1">
          <Avatar name={matchup?.home?.name ?? 'You'} size={48} borderColor="var(--accent-green)" />
          <span className="font-syne font-500 text-sm" style={{ color: 'var(--text-primary)' }}>
            {matchup?.home?.name ?? 'You'}
          </span>
          <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
            {matchup?.home?.record ?? '—'}
          </span>
        </div>

        <span className="font-syne font-700 text-xl" style={{ color: 'var(--text-muted)' }}>VS</span>

        <div className="flex flex-col items-center gap-1">
          <Avatar name={matchup?.away?.name ?? 'Rival'} size={48} borderColor="#f87171" />
          <span className="font-syne font-500 text-sm" style={{ color: 'var(--text-primary)' }}>
            {matchup?.away?.name ?? 'Rival'}
          </span>
          <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
            {matchup?.away?.record ?? '—'}
          </span>
        </div>
      </div>
    </div>
  )
}
