import { useNavigate } from 'react-router-dom'
import Badge from '../ui/Badge'
import Avatar from '../ui/Avatar'
import { useCountdown } from '../../hooks/useCountdown'

export default function LeagueCard({ league }) {
  const navigate = useNavigate()
  const countdown = useCountdown(league.nextMatchupLockAt)
  const hasSubmitted = league.picksStatus === 'submitted'

  return (
    <div
      className="rounded-xl p-3 mb-3 cursor-pointer transition-all active:scale-[0.99]"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--bg-surface2)',
      }}
      onClick={() => navigate(`/leagues/${league.id}`)}
    >
      {/* Top row */}
      <div className="flex items-start gap-3">
        {/* Left: icon + name */}
        <div className="flex flex-col items-center gap-1" style={{ minWidth: 44 }}>
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
            style={{ background: 'var(--bg-surface2)' }}
          >
            {league.icon ?? '🏆'}
          </div>
        </div>

        {/* Center: name, type, badge */}
        <div className="flex-1 min-w-0">
          <p className="font-syne font-500 text-sm truncate" style={{ color: 'var(--text-primary)' }}>
            {league.name}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {league.type ?? 'Private League'}
          </p>
          <Badge competition={league.competition} className="mt-1" />
        </div>

        {/* Position */}
        <div className="flex flex-col items-center" style={{ minWidth: 56 }}>
          <span className="font-syne font-700 text-xl" style={{ color: 'var(--accent-purple)' }}>
            {league.position ?? '—'}
          </span>
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            / {league.totalTeams ?? '?'}
          </span>
          <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
            Your Position
          </span>
        </div>

        {/* Right: rival + countdown */}
        <div className="flex flex-col items-center gap-1" style={{ minWidth: 60 }}>
          <Avatar name={league.opponentName ?? '?'} size={32} />
          <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
            vs {league.opponentName ?? '?'}
          </span>
          {countdown && (
            <span className="text-[10px] flex items-center gap-0.5" style={{ color: 'var(--text-muted)' }}>
              🕐 {countdown}
            </span>
          )}
          <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
            Next Matchup
          </span>
        </div>
      </div>

      {/* Status pill */}
      <div className="mt-2 flex justify-end">
        <span
          className="text-[10px] font-mono px-2 py-0.5 rounded-full"
          style={
            hasSubmitted
              ? { background: 'rgba(57,224,123,0.15)', color: 'var(--accent-green)' }
              : { background: 'rgba(251,146,60,0.15)', color: '#fb923c' }
          }
        >
          {hasSubmitted ? '✓ PICKS SUBMITTED' : '! PICKS NOT SUBMITTED'}
        </span>
      </div>
    </div>
  )
}
