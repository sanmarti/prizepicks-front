import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPublicProfile } from '../api/glory'
import BottomNav from '../components/layout/BottomNav'

const OUTCOME_ICON  = { promoted: '⬆', retained: '=', relegated: '⬇', pending: '⏳' }
const OUTCOME_COLOR = { promoted: 'text-green-400', retained: 'text-gray-400', relegated: 'text-red-400', pending: 'text-indigo-400' }

const TIER_BG = { gold: 'linear-gradient(135deg,#78350f,#b45309)', silver: 'linear-gradient(135deg,#1e293b,#475569)', bronze: 'linear-gradient(135deg,#431407,#9a3412)' }
function getAccuracyTierPublic(pct) {
  if (!pct || pct < 70) return null
  if (pct >= 90) return { icon: '🥇', color: 'gold',   label: 'Gold Predictor' }
  if (pct >= 80) return { icon: '🥈', color: 'silver', label: 'Silver Predictor' }
  return        { icon: '🥉', color: 'bronze', label: 'Bronze Predictor' }
}

export default function UserPublicProfilePage() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const [data, setData]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPublicProfile(id)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="min-h-screen bg-[#0a0d12] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!data) return (
    <div className="min-h-screen bg-[#0a0d12] flex flex-col items-center justify-center gap-4 text-center p-6">
      <p className="text-gray-400">Player not found</p>
      <button onClick={() => navigate('/divisions')} className="text-indigo-400 text-sm">← Back to divisions</button>
    </div>
  )

  const { user, division, lifetime_stats: stats, sprint_history, badges } = data
  const name = user.display_name || user.id.slice(0, 8)
  const tier = getAccuracyTierPublic(stats?.accuracy_pct)

  return (
    <div className="min-h-screen bg-[#0a0d12] text-white pb-24">
      <div className="max-w-md mx-auto px-4 pt-5 space-y-4">

        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-white text-sm transition-colors">
          ← Back
        </button>

        {/* Hero */}
        <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-4 flex items-center gap-4">
          <div className="relative flex-shrink-0">
            {user.avatar_url
              ? <img src={user.avatar_url} alt={name} className="w-16 h-16 rounded-full object-cover" />
              : <div className="w-16 h-16 rounded-full bg-indigo-900/40 flex items-center justify-center text-indigo-300 text-2xl font-bold">
                  {name[0].toUpperCase()}
                </div>
            }
            {tier && (
              <span className="absolute bottom-0 right-0 w-5 h-5 text-xs rounded-full border-2 border-[#0d1117] flex items-center justify-center leading-none pointer-events-none"
                style={{ background: TIER_BG[tier.color] }} title={tier.label}>{tier.icon}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-xl truncate">{name}</p>
            {division && (
              <p className="text-gray-400 text-sm mt-0.5">{division.icon} {division.division_name}</p>
            )}
            <p className="text-gray-600 text-xs mt-1">
              Member since {new Date(user.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-4">
            <p className="text-gray-500 text-[11px] font-semibold tracking-widest uppercase mb-3">Career stats</p>
            <div className="flex gap-2 mb-2">
              <div className="flex-1 bg-white/4 rounded-xl p-3 text-center">
                <p className="text-indigo-400 font-black text-xl">{stats.lifetime_lp}</p>
                <p className="text-gray-600 text-[10px]">Total LP</p>
              </div>
              <div className="flex-1 bg-white/4 rounded-xl p-3 text-center">
                <p className="text-green-400 font-black text-xl">{stats.lifetime_correct}</p>
                <p className="text-gray-600 text-[10px]">Correct picks</p>
              </div>
              <div className="flex-1 bg-white/4 rounded-xl p-3 text-center">
                <p className="text-yellow-400 font-black text-xl">{stats.total_perfect_weeks}</p>
                <p className="text-gray-600 text-[10px]">Perfect weeks</p>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 bg-white/4 rounded-xl p-3 text-center">
                <p className="text-white font-black text-xl">{stats.sprints_played}</p>
                <p className="text-gray-600 text-[10px]">Sprints played</p>
              </div>
            </div>
          </div>
        )}

        {/* Badges */}
        {badges?.length > 0 && (
          <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-4">
            <p className="text-gray-500 text-[11px] font-semibold tracking-widest uppercase mb-3">
              Badges ({badges.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {badges.map((b, i) => (
                <div key={i} className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
                  <span className="text-xl">{b.icon}</span>
                  <div>
                    <p className="text-white text-xs font-medium">{b.name}</p>
                    <p className="text-gray-600 text-[10px]">{b.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sprint history */}
        {sprint_history?.length > 0 && (
          <div className="bg-[#0d1117] border border-white/8 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5">
              <p className="text-gray-500 text-[11px] font-semibold tracking-widest uppercase">Sprint history</p>
            </div>
            {sprint_history.map((s, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-white text-sm">{s.sprint_name}</p>
                  <p className="text-gray-600 text-[11px]">
                    {s.division_icon} {s.division_name || '—'}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-indigo-400 font-bold">{s.total_league_points} LP</span>
                  {s.sprint_outcome && (
                    <span className={OUTCOME_COLOR[s.sprint_outcome] || 'text-gray-500'}>
                      {OUTCOME_ICON[s.sprint_outcome]}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {(!sprint_history?.length && !badges?.length) && (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">This player hasn't competed yet</p>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
