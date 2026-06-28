import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPublicProfile } from '../api/glory'
import BottomNav from '../components/layout/BottomNav'

// ── Tier helpers ──────────────────────────────────────────────────────────────
const TIERS = [
  { min: 90, label: 'Gold Predictor',   icon: '🥇', color: 'gold',
    heroBg: 'linear-gradient(135deg, #1c1505 0%, #2d1a00 45%, #0a0d12 100%)',
    heroShadow: '0 0 70px -10px rgba(250,204,21,0.45)',
    heroBorder: 'rgba(250,204,21,0.35)', avatarRing: '#facc15',
    badgeBg: 'linear-gradient(135deg, #1c1505, #2d1a00)',
    badgeBorder: 'rgba(250,204,21,0.5)', badgeShadow: '0 0 26px -4px rgba(250,204,21,0.7)',
    badgeText: 'text-yellow-300', accentColor: '#f59e0b', barFrom: '#eab308', barTo: '#fbbf24',
  },
  { min: 80, label: 'Silver Predictor', icon: '🥈', color: 'silver',
    heroBg: 'linear-gradient(135deg, #1e293b 0%, #15202b 45%, #0a0d12 100%)',
    heroShadow: '0 0 70px -10px rgba(148,163,184,0.4)',
    heroBorder: 'rgba(148,163,184,0.35)', avatarRing: '#cbd5e1',
    badgeBg: 'linear-gradient(135deg, #1e293b, #334155)',
    badgeBorder: 'rgba(203,213,225,0.45)', badgeShadow: '0 0 26px -4px rgba(148,163,184,0.6)',
    badgeText: 'text-slate-200', accentColor: '#94a3b8', barFrom: '#94a3b8', barTo: '#e2e8f0',
  },
  { min: 70, label: 'Bronze Predictor', icon: '🥉', color: 'bronze',
    heroBg: 'linear-gradient(135deg, #1c0a00 0%, #2d1500 45%, #0a0d12 100%)',
    heroShadow: '0 0 70px -10px rgba(249,115,22,0.4)',
    heroBorder: 'rgba(249,115,22,0.35)', avatarRing: '#fb923c',
    badgeBg: 'linear-gradient(135deg, #1c0a00, #2d1500)',
    badgeBorder: 'rgba(249,115,22,0.5)', badgeShadow: '0 0 26px -4px rgba(249,115,22,0.65)',
    badgeText: 'text-orange-300', accentColor: '#f97316', barFrom: '#f97316', barTo: '#fbbf24',
  },
]
function getTier(pct) {
  if (!pct || pct < 70) return null
  return TIERS.find(t => pct >= t.min) ?? null
}

const BADGE_ACCENTS = {
  FIRST_GAMEWEEK:      { glow: '#34d399', border: 'rgba(52,211,153,0.35)',  text: 'text-emerald-400' },
  FIRST_CORRECT:       { glow: '#facc15', border: 'rgba(250,204,21,0.35)',  text: 'text-yellow-400'  },
  PERFECT_WEEK:        { glow: '#facc15', border: 'rgba(250,204,21,0.4)',   text: 'text-yellow-400'  },
  CONSISTENT_PLAYER:   { glow: '#fb923c', border: 'rgba(251,146,60,0.35)',  text: 'text-orange-400'  },
  PERFECT_MONTH:       { glow: '#fbbf24', border: 'rgba(251,191,36,0.35)',  text: 'text-amber-400'   },
  FIRST_PROMOTION:     { glow: '#818cf8', border: 'rgba(129,140,248,0.35)', text: 'text-indigo-400'  },
  COMEBACK:            { glow: '#fb7185', border: 'rgba(251,113,133,0.35)', text: 'text-rose-400'    },
  THREE_PROMOTIONS:    { glow: '#a78bfa', border: 'rgba(167,139,250,0.35)', text: 'text-violet-400'  },
  REACHED_DIV1:        { glow: '#38bdf8', border: 'rgba(56,189,248,0.35)',  text: 'text-sky-400'     },
  REACHED_CHAMPIONS:   { glow: '#fde047', border: 'rgba(253,224,71,0.45)', text: 'text-yellow-300'  },
  DIV_CHAMP_ACADEMY:   { glow: '#6ee7b7', border: 'rgba(110,231,183,0.35)', text: 'text-emerald-300' },
  DIV_CHAMP_SUNDAY:    { glow: '#fca5a5', border: 'rgba(252,165,165,0.35)', text: 'text-red-300'     },
  DIV_CHAMP_DIV3:      { glow: '#cd7f32', border: 'rgba(205,127,50,0.45)',  text: 'text-amber-600'   },
  DIV_CHAMP_DIV2:      { glow: '#94a3b8', border: 'rgba(148,163,184,0.45)', text: 'text-slate-300'   },
  DIV_CHAMP_DIV1:      { glow: '#fbbf24', border: 'rgba(251,191,36,0.45)',  text: 'text-yellow-400'  },
  DIV_CHAMP_CHAMPIONS: { glow: '#fde047', border: 'rgba(253,224,71,0.55)',  text: 'text-yellow-200'  },
}

// ── Pick result icon ───────────────────────────────────────────────────────────
function PickResult({ result }) {
  if (result === 'WON')  return <span className="text-green-400 font-black text-sm">✓</span>
  if (result === 'LOST') return <span className="text-red-400 font-black text-sm">✗</span>
  return <span className="text-gray-600 font-bold text-sm">·</span>
}

// ── Matchweek picks card ───────────────────────────────────────────────────────
function MatchweekPicksCard({ gw }) {
  const { sprint_week, status, entry, picks } = gw
  const isPerfect = entry?.is_perfect_week

  // Group picks by fixture
  const byFixture = {}
  for (const p of picks) {
    if (!byFixture[p.fixture_name]) byFixture[p.fixture_name] = []
    byFixture[p.fixture_name].push(p)
  }

  const statusColor = status === 'FINISHED' ? 'text-purple-400' : 'text-yellow-400'
  const statusBg    = status === 'FINISHED' ? 'bg-purple-900/30 border-purple-500/25' : 'bg-yellow-900/30 border-yellow-500/25'

  return (
    <div className="bg-[#0d1117] border border-white/8 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-xs font-black text-indigo-400">
            W{sprint_week}
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBg} ${statusColor}`}>
            {status}
          </span>
          {isPerfect && <span className="text-yellow-400 text-sm">⭐ Perfect</span>}
        </div>
        {entry && (
          <div className="flex items-center gap-3 text-xs">
            <span className="text-indigo-400 font-black">{entry.league_points} LP</span>
            <span className="text-green-400">{entry.correct_picks}✓</span>
            <span className="text-red-400/70">{entry.incorrect_picks}✗</span>
          </div>
        )}
      </div>

      {/* Picks */}
      {picks.length === 0 ? (
        <div className="px-4 py-5 text-center">
          <p className="text-gray-600 text-sm">Did not participate</p>
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {Object.entries(byFixture).map(([fixture, fps], i) => (
            <div key={i} className="px-4 py-3">
              <p className="text-gray-400 text-xs font-semibold mb-2 truncate">{fixture}</p>
              <div className="space-y-1.5">
                {fps.map((p, j) => (
                  <div key={j} className={`flex items-center gap-2.5 rounded-xl px-3 py-2 ${
                    p.option_result === 'WON'  ? 'bg-green-900/20 border border-green-500/20' :
                    p.option_result === 'LOST' ? 'bg-white/3 border border-white/6' :
                    'bg-white/3 border border-white/6'
                  }`}>
                    <PickResult result={p.option_result} />
                    <span className={`flex-1 text-xs font-medium ${
                      p.option_result === 'WON' ? 'text-green-300' :
                      p.option_result === 'LOST' ? 'text-gray-500' : 'text-gray-300'
                    }`}>
                      {p.option_label}
                    </span>
                    <span className="text-indigo-400/60 text-[10px]">⚡{p.energy_cost}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function UserPublicProfilePage() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]       = useState('stats') // stats | picks | history

  useEffect(() => {
    setLoading(true)
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
      <p className="text-5xl mb-2">👤</p>
      <p className="text-white font-bold text-lg">Player not found</p>
      <button onClick={() => navigate(-1)} className="text-indigo-400 text-sm">← Go back</button>
    </div>
  )

  const { user, division, lifetime_stats: stats, sprint_history, badges, current_sprint } = data
  const name = user.display_name || user.id.slice(0, 8)
  const totalPicks = (stats?.lifetime_correct ?? 0) + (Number(stats?.lifetime_incorrect) || 0)
  const accuracyPct = totalPicks > 0 ? Math.round((stats.lifetime_correct / totalPicks) * 100) : null
  const tier = getTier(accuracyPct)

  const earnedBadges = (badges ?? []).filter(b => (b.earned_count ?? 0) > 0)
  const lockedGws    = current_sprint?.gameweeks ?? []
  const sprintProg   = current_sprint?.progress
  const hasPicksToShow = lockedGws.some(gw => gw.picks.length > 0)

  const TABS = [
    { id: 'stats',   label: 'Stats' },
    { id: 'picks',   label: `Picks${lockedGws.length > 0 ? ` (${lockedGws.length})` : ''}` },
    { id: 'history', label: 'History' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0d12] text-white pb-24">
      <div className="max-w-md mx-auto px-4 pt-5 space-y-4">

        {/* Back button */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-gray-500 hover:text-white text-sm transition-colors">
          ← Back
        </button>

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <div className="relative rounded-2xl p-4 overflow-hidden"
          style={{
            background: tier ? tier.heroBg : 'linear-gradient(135deg, #0d1117, #0a0d14)',
            boxShadow: tier ? tier.heroShadow : undefined,
            border: `1px solid ${tier ? tier.heroBorder : 'rgba(255,255,255,0.08)'}`,
          }}>
          <div className="absolute -top-8 -left-8 w-36 h-36 rounded-full blur-3xl pointer-events-none"
            style={{ background: tier ? tier.accentColor : '#6366f1', opacity: tier ? 0.18 : 0.1 }} />

          {tier && (
            <div className="flex items-center gap-1.5 mb-3">
              <span className="text-base leading-none">{tier.icon}</span>
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${tier.badgeText}`}>{tier.label}</span>
              <div className="flex-1 h-px ml-1" style={{ background: `linear-gradient(to right, ${tier.accentColor}40, transparent)` }} />
            </div>
          )}

          <div className="relative flex items-center gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {user.avatar_url
                ? <img src={user.avatar_url} alt={name}
                    className="w-20 h-20 rounded-full object-cover"
                    style={{ border: `2px solid ${tier ? tier.avatarRing : '#6366f1'}` }} />
                : <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold"
                    style={{ background: tier ? tier.badgeBg : 'rgba(99,102,241,0.2)', border: `2px solid ${tier ? tier.avatarRing : '#6366f1'}`, color: tier ? tier.accentColor : '#818cf8' }}>
                    {name[0].toUpperCase()}
                  </div>
              }
            </div>

            {/* Name + division */}
            <div className="min-w-0 flex-1">
              <p className="text-white font-bold text-xl truncate">{name}</p>
              <p className="text-gray-500 text-xs mt-0.5">
                Member since {new Date(user.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
              </p>
              {division && (
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-base">{division.icon}</span>
                  <span className="text-gray-300 text-sm">{division.division_name}</span>
                </div>
              )}
            </div>

            {/* Accuracy badge */}
            {accuracyPct != null && (
              <div className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-2xl"
                style={{
                  background: tier ? tier.badgeBg : 'linear-gradient(135deg, #1c0f00, #2d1900)',
                  border: `1px solid ${tier ? tier.badgeBorder : 'rgba(245,158,11,0.35)'}`,
                  boxShadow: tier ? tier.badgeShadow : '0 0 18px -4px rgba(245,158,11,0.4)',
                }}>
                {tier
                  ? <span className="text-lg leading-none mb-0.5">{tier.icon}</span>
                  : <span className="text-amber-500/70 text-[9px] font-semibold uppercase tracking-wider mb-0.5">accuracy</span>
                }
                <span className={`font-black text-xl leading-none ${tier ? tier.badgeText : 'text-amber-300'}`}>
                  {accuracyPct}%
                </span>
                {tier && <span className={`text-[8px] font-bold uppercase tracking-wider mt-0.5 ${tier.badgeText} opacity-50`}>{tier.color}</span>}
              </div>
            )}
          </div>

          {/* Current sprint mini */}
          {current_sprint && sprintProg && (
            <div className="relative mt-3 rounded-xl px-3 py-2 flex items-center justify-between"
              style={tier ? { background: `${tier.accentColor}10`, border: `1px solid ${tier.accentColor}20` } : { background: 'rgba(255,255,255,0.04)' }}>
              <p className="text-gray-400 text-xs">{current_sprint.sprint.name}</p>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-indigo-400 font-bold">{sprintProg.total_league_points} LP</span>
                {current_sprint.division_rank != null && (
                  <span className="text-white/50">#{current_sprint.division_rank}<span className="text-white/25 text-[10px]">/{current_sprint.division_total}</span></span>
                )}
                {sprintProg.perfect_weeks > 0 && <span className="text-yellow-400">⭐{sprintProg.perfect_weeks}</span>}
              </div>
            </div>
          )}
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <div className="flex gap-1 bg-white/3 border border-white/8 rounded-2xl p-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2 px-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                tab === t.id ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── STATS TAB ─────────────────────────────────────────────────── */}
        {tab === 'stats' && (
          <div className="space-y-3">

            {/* Accuracy hero */}
            {accuracyPct != null && (
              <div className="relative rounded-2xl overflow-hidden"
                style={{
                  background: tier ? tier.badgeBg : 'linear-gradient(135deg, #1c1000, #2d1900 50%, #1c0a00)',
                  border: `1px solid ${tier ? tier.badgeBorder : 'rgba(245,158,11,0.3)'}`,
                  boxShadow: tier ? tier.badgeShadow : '0 0 22px -6px rgba(245,158,11,0.35)',
                }}>
                <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full blur-3xl pointer-events-none"
                  style={{ background: tier ? tier.accentColor : '#f59e0b', opacity: 0.18 }} />
                <div className="relative p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{tier ? tier.icon : '📊'}</span>
                      <span className={`text-[10px] font-black uppercase tracking-[0.18em] ${tier ? tier.badgeText : 'text-amber-500/60'}`}>
                        {tier ? tier.label : 'Prediction accuracy'}
                      </span>
                    </div>
                    <span className="text-white/25 text-[10px] font-semibold uppercase tracking-widest">lifetime</span>
                  </div>
                  <p className={`font-black leading-none mb-1 ${tier ? tier.badgeText : 'text-amber-300'}`} style={{ fontSize: 56 }}>
                    {accuracyPct}<span style={{ fontSize: 28, opacity: 0.55 }}>%</span>
                  </p>
                  <p className="text-white/35 text-[11px] font-medium mb-3">
                    {stats.lifetime_correct} correct out of {totalPicks} picks
                  </p>
                  <div className="h-2 rounded-full bg-white/8 overflow-hidden mb-1.5">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(accuracyPct, 100)}%`,
                        background: tier ? `linear-gradient(to right, ${tier.barFrom}, ${tier.barTo})` : 'linear-gradient(to right, #f59e0b, #fbbf24)',
                      }} />
                  </div>
                  <div className="flex justify-between text-[9px] text-white/20 font-semibold">
                    <span>0%</span><span>🥉 70%</span><span>🥈 80%</span><span>🥇 90%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'League Points', value: stats?.lifetime_lp ?? 0, icon: '⚡', color: 'text-violet-300', grad: 'bg-gradient-to-br from-violet-950 via-purple-900/60 to-violet-950', border: 'border-violet-500/25', glow: 'shadow-[0_0_16px_-4px_rgba(139,92,246,0.28)]' },
                { label: 'Picks made',    value: totalPicks,               icon: '🎮', color: 'text-cyan-300',   grad: 'bg-gradient-to-br from-cyan-950 via-teal-900/50 to-cyan-950',   border: 'border-cyan-500/25',   glow: 'shadow-[0_0_16px_-4px_rgba(6,182,212,0.22)]' },
                { label: 'Correct picks', value: stats?.lifetime_correct ?? 0, icon: '✅', color: 'text-emerald-300', grad: 'bg-gradient-to-br from-emerald-950 via-green-900/60 to-emerald-950', border: 'border-emerald-500/25', glow: 'shadow-[0_0_16px_-4px_rgba(52,211,153,0.28)]' },
                { label: 'Perfect weeks', value: stats?.total_perfect_weeks ?? 0, icon: '⭐', color: 'text-yellow-300', grad: 'bg-gradient-to-br from-yellow-950 via-amber-900/60 to-yellow-950', border: 'border-yellow-500/25', glow: 'shadow-[0_0_16px_-4px_rgba(250,204,21,0.22)]' },
                { label: 'Sprints played', value: stats?.sprints_played ?? 0, icon: '🏁', color: 'text-sky-300', grad: 'bg-gradient-to-br from-sky-950 via-blue-900/60 to-sky-950', border: 'border-sky-500/25', glow: 'shadow-[0_0_16px_-4px_rgba(56,189,248,0.2)]' },
                { label: 'Matchweeks',    value: stats?.matchweeks_played ?? 0, icon: '📅', color: 'text-pink-300', grad: 'bg-gradient-to-br from-pink-950 via-rose-900/40 to-pink-950', border: 'border-pink-500/20', glow: 'shadow-[0_0_16px_-4px_rgba(244,114,182,0.18)]' },
              ].map(({ label, value, icon, color, grad, border, glow }) => (
                <div key={label} className={`relative rounded-2xl overflow-hidden ${grad} ${glow} border ${border}`}>
                  <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-40 pointer-events-none" style={{ background: 'white' }} />
                  <div className="relative p-4">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xl">{icon}</span>
                    </div>
                    <p className={`font-black text-3xl leading-none mb-1 ${color}`}>{value ?? '—'}</p>
                    <p className="text-white/40 text-[11px] font-medium">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Earned badges */}
            {earnedBadges.length > 0 && (
              <div className="bg-[#0d1117] border border-white/8 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5">
                  <p className="text-gray-500 text-[11px] font-semibold tracking-widest uppercase">Achievements ({earnedBadges.length})</p>
                </div>
                <div className="p-4 space-y-2">
                  {earnedBadges.map((b, i) => {
                    const ac = BADGE_ACCENTS[b.code] ?? { glow: '#6366f1', border: 'rgba(99,102,241,0.35)', text: 'text-indigo-400' }
                    return (
                      <div key={i} className="relative rounded-2xl overflow-hidden"
                        style={{
                          background: 'rgba(255,255,255,0.055)',
                          border: `1px solid ${ac.border}`,
                          boxShadow: `0 0 26px -4px ${ac.glow}55`,
                        }}>
                        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full blur-3xl pointer-events-none" style={{ background: ac.glow, opacity: 0.2 }} />
                        <div className="relative flex items-center gap-4 p-4">
                          <span className="text-5xl flex-shrink-0 leading-none">{b.icon}</span>
                          <div className="min-w-0 flex-1">
                            <p className="font-black text-lg leading-tight text-white">{b.name}</p>
                            <p className="text-white/50 text-xs mt-0.5">{b.description}</p>
                            {b.last_earned_at && (
                              <p className={`text-[10px] mt-1 ${ac.text} opacity-70`}>
                                {new Date(b.last_earned_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            )}
                          </div>
                          {b.earned_count > 1 && <span className={`text-xs font-black ${ac.text}`}>×{b.earned_count}</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PICKS TAB ─────────────────────────────────────────────────── */}
        {tab === 'picks' && (
          <div className="space-y-3">
            {current_sprint ? (
              <>
                {/* Sprint header */}
                <div className="bg-gradient-to-br from-indigo-950 via-violet-900/50 to-indigo-950 border border-indigo-500/25 rounded-2xl p-4">
                  <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-1">{current_sprint.sprint.name}</p>
                  {sprintProg ? (
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-indigo-400 font-black text-2xl leading-none">{sprintProg.total_league_points}</p>
                        <p className="text-white/25 text-[10px] uppercase tracking-wider mt-0.5">LP</p>
                      </div>
                      <div className="text-center">
                        <p className="text-emerald-400 font-black text-2xl leading-none">{sprintProg.total_correct_picks}</p>
                        <p className="text-white/25 text-[10px] uppercase tracking-wider mt-0.5">Correct</p>
                      </div>
                      <div className="text-center">
                        <p className="text-yellow-400 font-black text-2xl leading-none">{sprintProg.perfect_weeks ?? 0}</p>
                        <p className="text-white/25 text-[10px] uppercase tracking-wider mt-0.5">Perfect</p>
                      </div>
                      {current_sprint.division_rank != null && (
                        <div className="text-center ml-auto">
                          <p className="text-white font-black text-2xl leading-none">#{current_sprint.division_rank}</p>
                          <p className="text-white/25 text-[10px] uppercase tracking-wider mt-0.5">of {current_sprint.division_total}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-white/40 text-sm">No sprint data</p>
                  )}
                </div>

                {lockedGws.length === 0 ? (
                  <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-8 text-center">
                    <p className="text-4xl mb-3">🔒</p>
                    <p className="text-white font-semibold text-sm">Picks not visible yet</p>
                    <p className="text-gray-500 text-xs mt-2">
                      {name.split(' ')[0]}'s picks will show here once a matchweek is locked.
                      <br />This protects fair play — you can't see picks before the deadline.
                    </p>
                  </div>
                ) : !hasPicksToShow ? (
                  <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-8 text-center">
                    <p className="text-4xl mb-3">📭</p>
                    <p className="text-gray-500 text-sm">{name.split(' ')[0]} hasn't submitted picks yet</p>
                  </div>
                ) : (
                  lockedGws.map((gw, i) => <MatchweekPicksCard key={i} gw={gw} />)
                )}

                {/* Lock notice */}
                {lockedGws.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-indigo-950/30 border border-indigo-500/15 rounded-xl">
                    <span className="text-indigo-400 text-sm">🔒</span>
                    <p className="text-indigo-400/60 text-[11px]">Picks are revealed only after the matchweek locks — picks from open weeks are always hidden.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-8 text-center">
                <p className="text-4xl mb-3">🏁</p>
                <p className="text-gray-500 text-sm">No active sprint</p>
              </div>
            )}
          </div>
        )}

        {/* ── HISTORY TAB ───────────────────────────────────────────────── */}
        {tab === 'history' && (
          <div className="space-y-3">
            {sprint_history?.length > 0 ? (
              <div className="bg-[#0d1117] border border-white/8 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5">
                  <p className="text-gray-500 text-[11px] font-semibold tracking-widest uppercase">Sprint history</p>
                </div>
                {sprint_history.map((s, i) => {
                  const outcomeIcon  = { promoted: '⬆', retained: '=', relegated: '⬇', pending: '⏳' }[s.sprint_outcome] ?? ''
                  const outcomeColor = { promoted: 'text-green-400', retained: 'text-gray-400', relegated: 'text-red-400', pending: 'text-indigo-400' }[s.sprint_outcome] ?? 'text-gray-500'
                  return (
                    <div key={i} className="flex items-center justify-between px-4 py-3.5 border-b border-white/5 last:border-0">
                      <div>
                        <p className="text-white text-sm font-semibold">{s.sprint_name}</p>
                        <p className="text-gray-600 text-[11px] mt-0.5">
                          {s.division_icon} {s.division_name || '—'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-indigo-400 font-black text-sm">{s.total_league_points} LP</span>
                        {s.sprint_outcome && (
                          <span className={`font-bold text-sm ${outcomeColor}`}>{outcomeIcon}</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-8 text-center">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-gray-500 text-sm">{name.split(' ')[0]} hasn't competed in any sprint yet</p>
              </div>
            )}
          </div>
        )}

      </div>
      <BottomNav />
    </div>
  )
}
