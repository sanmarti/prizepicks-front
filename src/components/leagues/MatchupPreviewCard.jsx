import { useNavigate } from 'react-router-dom'
import Avatar from '../ui/Avatar'
import { useCountdown } from '../../hooks/useCountdown'

export default function MatchupPreviewCard({ matchup }) {
  const navigate = useNavigate()
  const countdown = useCountdown(matchup?.lockAt)

  return (
    <div
      className="rounded-xl p-4 mb-3"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--accent-purple)',
        boxShadow: '0 0 20px rgba(124,110,245,0.1)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono font-500 tracking-widest" style={{ color: 'var(--accent-purple)' }}>
          ▶ NEXT MATCHUP
        </span>
        <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
          {matchup?.label ?? 'Regular Season - Week 12'}
        </span>
      </div>

      {/* Players row */}
      <div className="flex items-center justify-between gap-3">
        {/* Home */}
        <div className="flex flex-col items-center gap-1">
          <Avatar
            name={matchup?.home?.name ?? 'You'}
            size={44}
            borderColor="var(--accent-green)"
          />
          <span className="text-xs font-syne font-500" style={{ color: 'var(--text-primary)' }}>
            {matchup?.home?.name ?? 'You'}
          </span>
          <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
            {matchup?.home?.record ?? '0-0'}
          </span>
        </div>

        {/* VS + lock */}
        <div className="flex flex-col items-center gap-1">
          <span className="font-syne font-700 text-base" style={{ color: 'var(--text-muted)' }}>VS</span>
          {countdown && (
            <span className="text-[10px] font-mono" style={{ color: '#fb923c' }}>
              🔒 Locks in {countdown}
            </span>
          )}
        </div>

        {/* Away */}
        <div className="flex flex-col items-center gap-1">
          <Avatar
            name={matchup?.away?.name ?? 'Rival'}
            size={44}
            borderColor="#f87171"
          />
          <span className="text-xs font-syne font-500" style={{ color: 'var(--text-primary)' }}>
            {matchup?.away?.name ?? 'Rival'}
          </span>
          <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
            {matchup?.away?.record ?? '0-0'}
          </span>
        </div>
      </div>

      {/* CTA */}
      <button
        className="mt-4 w-full py-2.5 rounded-xl text-sm font-syne font-700 tracking-wide transition-opacity hover:opacity-90 active:scale-[0.99]"
        style={{ background: 'var(--accent-purple)', color: '#fff' }}
        onClick={() => navigate(`/matchup/${matchup?.id ?? 1}`)}
      >
        OPEN MATCHUP →
      </button>
    </div>
  )
}
