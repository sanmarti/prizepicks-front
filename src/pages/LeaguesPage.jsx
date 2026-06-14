import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLeagues } from '../api/leagues'
import { useAuthStore } from '../store/authStore'
import LeagueCard from '../components/leagues/LeagueCard'
import BottomNav from '../components/layout/BottomNav'
import Avatar from '../components/ui/Avatar'
import Spinner from '../components/ui/Spinner'

const MOCK_LEAGUES = [
  {
    id: '1', name: 'Sunday Ballers', icon: '⚽', competition: 'EPL', type: 'Private League',
    position: 2, totalTeams: 12, opponentName: 'Alex', picksStatus: 'submitted',
    nextMatchupLockAt: new Date(Date.now() + 6120000).toISOString(),
  },
  {
    id: '2', name: 'Champions Elite', icon: '🏆', competition: 'CHAMPIONS', type: 'Private League',
    position: 5, totalTeams: 8, opponentName: 'Mike', picksStatus: 'pending',
    nextMatchupLockAt: new Date(Date.now() + 3600000).toISOString(),
  },
  {
    id: '3', name: 'La Liga Masters', icon: '👑', competition: 'LALIGA', type: 'Public League',
    position: 1, totalTeams: 16, opponentName: 'Sara', picksStatus: 'submitted',
    nextMatchupLockAt: new Date(Date.now() + 86400000).toISOString(),
  },
]

const FILTERS = ['All', 'Pending', 'Submitted']

export default function LeaguesPage() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [leagues, setLeagues] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    getLeagues()
      .then(({ data }) => setLeagues(data.leagues ?? MOCK_LEAGUES))
      .catch(() => setLeagues(MOCK_LEAGUES))
      .finally(() => setLoading(false))
  }, [])

  const pending = leagues.filter((l) => l.picksStatus !== 'submitted')
  const submitted = leagues.filter((l) => l.picksStatus === 'submitted')

  const filtered = filter === 'All' ? leagues
    : filter === 'Pending' ? pending
    : submitted

  return (
    <div className="min-h-dvh pb-24" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        {/* User card */}
        <div
          className="rounded-2xl p-4 mb-4"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface2)' }}
        >
          <div className="flex items-center gap-3">
            <Avatar name={user?.name ?? 'U'} size={48} />
            <div className="flex-1 min-w-0">
              <h2 className="font-syne font-700 text-base" style={{ color: 'var(--text-primary)' }}>
                {user?.name ?? 'Player'}
              </h2>
              <p className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                8-2-1 · Global Record
              </p>
              <p className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                {leagues.length} Leagues Joined
              </p>
            </div>
            <span
              className="text-[11px] font-mono px-2.5 py-1 rounded-xl"
              style={{ background: 'var(--accent-purple-dim)', color: 'var(--accent-purple)' }}
            >
              Top 2 in 4 leagues
            </span>
          </div>
        </div>

        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-syne font-700 text-xl" style={{ color: 'var(--text-primary)' }}>
            My Leagues
          </h1>
          <button
            className="text-xs font-mono px-3 py-1.5 rounded-lg transition-all hover:brightness-110"
            style={{ background: 'var(--accent-purple)', color: '#fff' }}
            onClick={() => navigate('/create-league')}
          >
            + New
          </button>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1 rounded-full text-xs font-mono transition-all"
              style={
                filter === f
                  ? { background: 'var(--accent-purple)', color: '#fff' }
                  : { background: 'var(--bg-surface2)', color: 'var(--text-secondary)' }
              }
            >
              {f}
              {f === 'Pending' && pending.length > 0 && (
                <span className="ml-1 text-[9px]">({pending.length})</span>
              )}
              {f === 'Submitted' && submitted.length > 0 && (
                <span className="ml-1 text-[9px]">({submitted.length})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* League list */}
      <div className="px-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size={32} />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center py-8 text-sm font-mono" style={{ color: 'var(--text-muted)' }}>
            No leagues found
          </p>
        ) : (
          filtered.map((l) => <LeagueCard key={l.id} league={l} />)
        )}
      </div>

      {/* Pending banner */}
      {pending.length > 0 && (
        <div
          className="fixed bottom-16 left-0 right-0 mx-4 mb-2 rounded-xl px-4 py-3 flex items-center justify-between z-20 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, var(--accent-purple) 0%, #6d5ce7 100%)',
            boxShadow: '0 4px 20px rgba(124,110,245,0.4)',
          }}
          onClick={() => setFilter('Pending')}
        >
          <span className="text-xs font-mono font-500 text-white">
            OPEN PENDING LEAGUES · {pending.length} league{pending.length !== 1 ? 's' : ''} need your picks
          </span>
          <span className="text-white">→</span>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
