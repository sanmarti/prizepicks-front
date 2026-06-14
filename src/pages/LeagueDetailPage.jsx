import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getLeague, getStandings } from '../api/leagues'
import { useAuthStore } from '../store/authStore'
import StandingsTable from '../components/leagues/StandingsTable'
import MatchupPreviewCard from '../components/leagues/MatchupPreviewCard'
import Badge from '../components/ui/Badge'
import BottomNav from '../components/layout/BottomNav'
import Spinner from '../components/ui/Spinner'

const MOCK_LEAGUE = {
  id: '1', name: 'Sunday Ballers', competition: 'EPL', icon: '⚽',
  teamsCount: 12, season: '2024/25', weekNumber: 12, weeksLeft: 8,
  playoffLine: 7,
  nextMatchup: {
    id: '1', label: 'Regular Season - Week 12',
    lockAt: new Date(Date.now() + 6120000).toISOString(),
    home: { name: 'Joan', record: '8-2-1' },
    away: { name: 'Mike', record: '6-4-1' },
  },
}

const MOCK_STANDINGS = [
  { userId: '1', name: 'Joan', teamName: 'FC Galaxy', rank: 1, wins: 8, losses: 2, draws: 1, points: 25, lastThree: ['W','W','L'] },
  { userId: '2', name: 'Mike', teamName: 'Red Devils', rank: 2, wins: 7, losses: 3, draws: 1, points: 22, lastThree: ['W','L','W'] },
  { userId: '3', name: 'Sara', teamName: 'Blue Stars', rank: 3, wins: 6, losses: 4, draws: 1, points: 19, lastThree: ['L','W','W'] },
  { userId: '4', name: 'Alex', teamName: 'Yellow Thunder', rank: 4, wins: 5, losses: 5, draws: 1, points: 16, lastThree: ['D','L','L'] },
  { userId: '5', name: 'Tom', teamName: 'Night Wolves', rank: 5, wins: 4, losses: 6, draws: 1, points: 13, lastThree: ['L','L','W'] },
  { userId: '6', name: 'Lena', teamName: 'Green Giants', rank: 6, wins: 3, losses: 7, draws: 1, points: 10, lastThree: ['L','L','L'] },
  { userId: '7', name: 'Ravi', teamName: 'Iron Eagles', rank: 7, wins: 2, losses: 8, draws: 1, points: 7, lastThree: ['L','L','L'] },
]

const TABS = ['STANDINGS', 'MATCHUPS', 'SETTINGS']

export default function LeagueDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [league, setLeague] = useState(null)
  const [standings, setStandings] = useState([])
  const [tab, setTab] = useState('STANDINGS')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getLeague(id), getStandings(id)])
      .then(([{ data: l }, { data: s }]) => {
        setLeague(l.league ?? MOCK_LEAGUE)
        setStandings(s.standings ?? MOCK_STANDINGS)
      })
      .catch(() => {
        setLeague(MOCK_LEAGUE)
        setStandings(MOCK_STANDINGS)
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="min-h-dvh flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <Spinner size={36} />
    </div>
  )

  return (
    <div className="min-h-dvh pb-24" style={{ background: 'var(--bg-primary)' }}>
      {/* Back */}
      <div className="px-4 pt-4">
        <button onClick={() => navigate(-1)} className="text-sm font-mono mb-4" style={{ color: 'var(--text-secondary)' }}>
          ← Back
        </button>

        {/* League header */}
        <div
          className="rounded-2xl p-4 mb-4"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface2)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            {/* Hexagon logo */}
            <div
              className="flex items-center justify-center text-3xl"
              style={{
                width: 56, height: 56,
                background: 'var(--bg-surface2)',
                clipPath: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)',
              }}
            >
              {league?.icon}
            </div>
            <div>
              <h1 className="font-syne font-700 text-xl" style={{ color: 'var(--text-primary)' }}>
                {league?.name}
              </h1>
              <div className="flex flex-wrap gap-2 mt-1">
                <Badge competition={league?.competition} />
                <span className="text-[11px] font-mono" style={{ color: 'var(--text-secondary)' }}>
                  👥 {league?.teamsCount} Teams
                </span>
                <span className="text-[11px] font-mono" style={{ color: 'var(--text-secondary)' }}>
                  📅 {league?.season}
                </span>
                <span className="text-[11px] font-mono" style={{ color: 'var(--text-secondary)' }}>
                  Week {league?.weekNumber}
                </span>
              </div>
              <p className="text-xs font-mono mt-1" style={{ color: 'var(--accent-purple)' }}>
                {league?.weeksLeft} weeks left
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b mb-4" style={{ borderColor: 'var(--bg-surface2)' }}>
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2.5 text-xs font-mono tracking-wider transition-colors"
              style={{
                color: tab === t ? 'var(--accent-purple)' : 'var(--text-muted)',
                borderBottom: tab === t ? '2px solid var(--accent-purple)' : '2px solid transparent',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'STANDINGS' && (
          <>
            <MatchupPreviewCard matchup={league?.nextMatchup} />

            {/* Info bar */}
            <div
              className="flex items-center justify-between px-3 py-2 rounded-xl mb-4 text-xs font-mono"
              style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
            >
              <span>Top 6 make the playoffs · Tiebreaker: Total Points</span>
              <button style={{ color: 'var(--accent-purple)' }}>View Playoff Bracket →</button>
            </div>

            <StandingsTable
              standings={standings}
              playoffLine={league?.playoffLine}
              currentUserId={user?.sub ?? user?.id}
            />
          </>
        )}

        {tab === 'MATCHUPS' && (
          <div className="py-8 text-center text-sm font-mono" style={{ color: 'var(--text-muted)' }}>
            Matchup history coming soon
          </div>
        )}

        {tab === 'SETTINGS' && (
          <div className="py-8 text-center text-sm font-mono" style={{ color: 'var(--text-muted)' }}>
            League settings
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
