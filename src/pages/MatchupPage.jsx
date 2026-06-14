import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getMatchup } from '../api/matchups'
import { useMatchupProjection } from '../hooks/useMatchupProjection'
import MatchupHeader from '../components/matchup/MatchupHeader'
import PickRow from '../components/matchup/PickRow'
import ProjectionDisplay from '../components/matchup/ProjectionDisplay'
import BottomNav from '../components/layout/BottomNav'
import Spinner from '../components/ui/Spinner'

const MOCK_MATCHUP = {
  id: '1',
  weekLabel: 'Week 12',
  lockAt: new Date(Date.now() + 8100000).toISOString(),
  home: { name: 'Joan', record: '8-2-1', energyUsed: 24, score: 3 },
  away: { name: 'Mike', record: '6-4-1', energyUsed: 22, score: 2 },
  homePicks: [
    { id: '1', label: 'Real Madrid Win', fixture: 'Real Madrid vs Villarreal', status: 'WON' },
    { id: '2', label: 'Over 2.5 Goals', fixture: 'Arsenal vs Chelsea', status: 'WON' },
    { id: '3', label: 'Mbappé to Score', fixture: 'PSG vs Monaco', status: 'LIVE_FAVORABLE' },
    { id: '4', label: 'Clean Sheet City', fixture: 'Man City vs Liverpool', status: 'LIVE_RISK' },
    { id: '5', label: 'Under 3.5 Goals', fixture: 'Barça vs Atleti', status: 'SLEEPING' },
    { id: '6', label: 'Salah to Assist', fixture: 'Liverpool vs Everton', status: 'LOST' },
  ],
  awayPicks: [
    { id: '7', label: 'Draw Result', fixture: 'Real Madrid vs Villarreal', status: 'LOST' },
    { id: '8', label: 'Chelsea Win', fixture: 'Arsenal vs Chelsea', status: 'LOST' },
    { id: '9', label: 'Neymar to Score', fixture: 'PSG vs Monaco', status: 'LIVE_NEUTRAL' },
    { id: '10', label: 'Both Teams Score', fixture: 'Man City vs Liverpool', status: 'LIVE_FAVORABLE' },
    { id: '11', label: 'Over 3.5 Goals', fixture: 'Barça vs Atleti', status: 'SLEEPING' },
    { id: '12', label: 'Mane to Score', fixture: 'Liverpool vs Everton', status: 'WON' },
  ],
}

export default function MatchupPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [matchup, setMatchup] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMatchup(id)
      .then(({ data }) => setMatchup(data.matchup ?? MOCK_MATCHUP))
      .catch(() => setMatchup(MOCK_MATCHUP))
      .finally(() => setLoading(false))
  }, [id])

  const homeProjection = useMatchupProjection(matchup?.homePicks ?? [])
  const awayProjection = useMatchupProjection(matchup?.awayPicks ?? [])

  if (loading) return (
    <div className="min-h-dvh flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <Spinner size={36} />
    </div>
  )

  return (
    <div className="min-h-dvh pb-24" style={{ background: 'var(--bg-primary)' }}>
      <div className="px-4 pt-4">
        <button onClick={() => navigate(-1)} className="text-sm font-mono mb-4" style={{ color: 'var(--text-secondary)' }}>
          ← Back
        </button>

        <MatchupHeader matchup={matchup} />

        <ProjectionDisplay
          homeScore={matchup?.home?.score ?? 0}
          awayScore={matchup?.away?.score ?? 0}
          homeName={matchup?.home?.name ?? 'You'}
          awayName={matchup?.away?.name ?? 'Rival'}
          outlook={homeProjection.outlook}
          homeEnergy={matchup?.home?.energyUsed ?? 0}
          awayEnergy={matchup?.away?.energyUsed ?? 0}
        />

        {/* Projection scores */}
        <div
          className="flex items-center justify-between px-4 py-2 rounded-xl mb-4 text-xs font-mono"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface2)' }}
        >
          <span style={{ color: 'var(--text-secondary)' }}>
            Proj: <span style={{ color: 'var(--accent-green)' }}>{homeProjection.projected_score}</span>
          </span>
          <span style={{ color: 'var(--text-muted)' }}>vs</span>
          <span style={{ color: 'var(--text-secondary)' }}>
            Proj: <span style={{ color: '#f87171' }}>{awayProjection.projected_score}</span>
          </span>
        </div>

        {/* Picks columns */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] font-mono tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
              {matchup?.home?.name?.toUpperCase()} PICKS
            </p>
            {matchup?.homePicks?.map((p) => <PickRow key={p.id} pick={p} />)}
          </div>
          <div>
            <p className="text-[10px] font-mono tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
              {matchup?.away?.name?.toUpperCase()} PICKS
            </p>
            {matchup?.awayPicks?.map((p) => <PickRow key={p.id} pick={p} />)}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
