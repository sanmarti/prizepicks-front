import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getGloryDivisions, getGloryLeaderboard, getGloryStatus } from '../api/glory'
import { getProfile } from '../api/users'
import BottomNav from '../components/layout/BottomNav'

const DIVISION_VISUALS = {
  1: {
    image: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=900&q=80&auto=format&fit=crop',
    gradient: 'from-slate-900 via-slate-800 to-slate-950',
    accent: '#6b7280', accentBg: 'rgba(107,114,128,0.15)', accentBorder: 'rgba(107,114,128,0.35)',
    label: 'Academy Pitch',
  },
  2: {
    image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=900&q=80&auto=format&fit=crop',
    gradient: 'from-orange-950 via-orange-900 to-slate-950',
    accent: '#f97316', accentBg: 'rgba(249,115,22,0.12)', accentBorder: 'rgba(249,115,22,0.30)',
    label: 'Local Ground',
  },
  3: {
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=900&q=80&auto=format&fit=crop',
    gradient: 'from-blue-950 via-blue-900 to-slate-950',
    accent: '#3b82f6', accentBg: 'rgba(59,130,246,0.12)', accentBorder: 'rgba(59,130,246,0.30)',
    label: 'Regional Stadium',
  },
  4: {
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=900&q=80&auto=format&fit=crop',
    gradient: 'from-green-950 via-green-900 to-slate-950',
    accent: '#22c55e', accentBg: 'rgba(34,197,94,0.12)', accentBorder: 'rgba(34,197,94,0.30)',
    label: 'Pro Stadium',
  },
  5: {
    image: 'https://images.unsplash.com/photo-1540747913346-19212a4b23b4?w=900&q=80&auto=format&fit=crop',
    gradient: 'from-amber-950 via-amber-900 to-slate-950',
    accent: '#f59e0b', accentBg: 'rgba(245,158,11,0.12)', accentBorder: 'rgba(245,158,11,0.30)',
    label: 'Premier Ground',
  },
  6: {
    image: 'https://images.unsplash.com/photo-1522778526097-ce0a22ceb253?w=900&q=80&auto=format&fit=crop',
    gradient: 'from-purple-950 via-purple-900 to-slate-950',
    accent: '#a855f7', accentBg: 'rgba(168,85,247,0.12)', accentBorder: 'rgba(168,85,247,0.30)',
    label: 'Hall of Legends',
  },
}

function getV(div) { return DIVISION_VISUALS[div.display_order] || DIVISION_VISUALS[1] }

function ThresholdBar({ div, accent }) {
  const MAX      = 40
  const relMax   = div.allows_relegation && div.relegation_max_points !== null ? div.relegation_max_points + 1 : 0
  const promoMin = div.is_highest ? MAX : (div.promotion_min_points ?? MAX)
  const relegW   = (relMax / MAX) * 100
  const retW     = Math.max(0, ((promoMin - relMax) / MAX) * 100)
  const promoW   = Math.max(0, ((MAX - promoMin) / MAX) * 100)
  return (
    <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
      {relMax > 0 && <div className="h-full rounded-l-full" style={{ width: `${relegW}%`, background: '#ef444480' }} />}
      <div className="h-full" style={{ width: `${retW}%`, background: 'rgba(107,114,128,0.35)' }} />
      {!div.is_highest && <div className="h-full rounded-r-full" style={{ width: `${promoW}%`, background: accent + 'aa' }} />}
    </div>
  )
}

// ── Full-screen rankings overlay ───────────────────────────────────────────────
function RankingsScreen({ div, sprintId, myUserId, onClose }) {
  const navigate = useNavigate()
  const v        = getV(div)
  const [lb, setLb]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [imgError, setImgError] = useState(false)

  const promLP = div.promotion_min_points ?? null
  const relLP  = div.allows_relegation && div.relegation_max_points !== null ? div.relegation_max_points : null

  useEffect(() => {
    getGloryLeaderboard({ division_id: div.id, sprint_id: sprintId })
      .then(r => setLb(r.data))
      .catch(() => setLb({ rows: [] }))
      .finally(() => setLoading(false))
  }, [div.id, sprintId])

  const rows = lb?.rows || []
  const myIdx = rows.findIndex(r => r.user_id === myUserId)

  // Find cutoff indices for zone separators
  const lastPromoIdx  = promLP !== null ? rows.filter(r => r.total_league_points >= promLP).length - 1 : -1
  const firstRelIdx   = relLP  !== null ? rows.findIndex(r => r.total_league_points <= relLP) : -1

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#0a0d12' }}>
      {/* Hero header */}
      <div className="relative h-48 flex-shrink-0 overflow-hidden">
        {!imgError ? (
          <img
            src={div.badge_url || v.image} alt={div.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${v.gradient}`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d12] via-[#0a0d12]/40 to-transparent" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 w-9 h-9 rounded-xl bg-black/60 backdrop-blur-sm flex items-center justify-center text-white text-sm border border-white/10"
        >
          ←
        </button>

        {/* Division identity at bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 flex items-end gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border shadow-lg"
            style={{ background: v.accentBg, borderColor: v.accentBorder, backdropFilter: 'blur(8px)' }}>
            {div.icon}
          </div>
          <div>
            <p className="font-black text-xl" style={{ color: v.accent }}>{div.name}</p>
            <p className="text-white/40 text-xs font-medium tracking-wider">{v.label.toUpperCase()} · Rankings</p>
          </div>
        </div>
      </div>

      {/* Zone legend */}
      {(promLP !== null || relLP !== null) && (
        <div className="flex gap-2 px-4 py-2.5 flex-shrink-0 border-b border-white/5">
          {promLP !== null && !div.is_highest && (
            <span className="flex items-center gap-1 text-[10px] text-green-400 font-semibold">
              <span className="w-2 h-2 rounded-sm bg-green-500/40 border border-green-500/50 inline-block" />
              Promotion ≥{promLP} LP
            </span>
          )}
          {relLP !== null && (
            <span className="flex items-center gap-1 text-[10px] text-red-400 font-semibold ml-auto">
              <span className="w-2 h-2 rounded-sm bg-red-500/30 border border-red-500/40 inline-block" />
              Relegation ≤{relLP} LP
            </span>
          )}
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-20 gap-2 text-gray-600 text-sm">
            <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: v.accent, borderTopColor: 'transparent' }} />
          </div>
        )}
        {!loading && rows.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-2">
            <span className="text-4xl">{div.icon}</span>
            <p className="text-gray-500 text-sm">No players ranked yet</p>
            <p className="text-gray-700 text-xs">Rankings update when a sprint is active</p>
          </div>
        )}

        {!loading && rows.length > 0 && (
          <div className="pb-8">
            {rows.map((row, i) => {
              const rank    = i + 1
              const isMe    = row.user_id === myUserId
              const isPromo = promLP !== null && row.total_league_points >= promLP
              const isRel   = relLP  !== null && row.total_league_points <= relLP
              const showRelDivider = firstRelIdx === i && i > 0

              return (
                <div key={row.user_id}>
                  {showRelDivider && (
                    <div className="px-4 py-1.5 flex items-center gap-2 border-t border-red-500/20 bg-red-950/20">
                      <span className="text-red-400 text-[10px] font-bold">⬇ RELEGATION ZONE — ≤{relLP} LP</span>
                    </div>
                  )}
                  <button
                    onClick={() => navigate(`/users/${row.user_id}`)}
                    className={`w-full flex items-center gap-3 px-4 py-3 border-b border-white/4 text-left transition-colors ${
                      isMe ? 'bg-white/6' :
                      isPromo ? 'bg-green-950/15 hover:bg-green-950/25' :
                      isRel   ? 'bg-red-950/15 hover:bg-red-950/25' :
                      'hover:bg-white/3'
                    }`}
                  >
                    {/* Rank */}
                    <span className={`w-7 text-center text-sm font-black flex-shrink-0 ${
                      rank === 1 ? 'text-yellow-400' :
                      rank === 2 ? 'text-gray-300' :
                      rank === 3 ? 'text-amber-600' : 'text-gray-600'
                    }`}>{rank}</span>

                    {/* Avatar */}
                    {row.avatar_url
                      ? <img src={row.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                      : <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                          style={{ background: v.accent + '25', color: v.accent }}>
                          {(row.display_name || '?')[0].toUpperCase()}
                        </div>
                    }

                    {/* Name + sub-stats */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isMe ? 'text-white' : 'text-gray-200'}`}>
                        {row.display_name || 'Player'}
                        {isMe && <span className="text-[10px] font-normal ml-1.5" style={{ color: v.accent }}>you</span>}
                      </p>
                      <p className="text-gray-600 text-[10px] mt-0.5">
                        {row.total_correct_picks} correct
                        {row.perfect_weeks > 0 ? ` · ${row.perfect_weeks}⭐ perfect` : ''}
                        {row.gameweeks_participated > 0 ? ` · ${row.gameweeks_participated} GW` : ''}
                      </p>
                    </div>

                    {/* LP + zone arrow */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isPromo && <span className="text-green-400 text-xs">⬆</span>}
                      {isRel   && <span className="text-red-400 text-xs">⬇</span>}
                      <span className={`font-black text-base ${
                        isPromo ? 'text-green-400' : isRel ? 'text-red-400' : isMe ? '' : 'text-indigo-400'
                      }`} style={isMe && !isPromo && !isRel ? { color: v.accent } : {}}>
                        {row.total_league_points}
                        <span className="text-[10px] font-normal text-gray-500 ml-0.5">LP</span>
                      </span>
                    </div>
                  </button>

                  {/* Promotion divider after last promo player */}
                  {lastPromoIdx === i && i < rows.length - 1 && !div.is_highest && (
                    <div className="px-4 py-1 flex items-center gap-2 border-b border-white/5 bg-white/2">
                      <span className="text-gray-600 text-[10px] font-semibold">— Retention zone —</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* My position sticky footer if I'm in this division */}
      {!loading && myIdx >= 0 && (
        <div className="flex-shrink-0 px-4 py-3 border-t border-white/8 flex items-center justify-between"
          style={{ background: v.accentBg + 'cc', borderTop: `1px solid ${v.accentBorder}` }}>
          <div>
            <p className="text-white text-xs font-semibold">Your position</p>
            <p className="text-[10px] mt-0.5" style={{ color: v.accent }}>#{myIdx + 1} of {rows.length}</p>
          </div>
          <div className="text-right">
            <p className="font-black text-lg" style={{ color: v.accent }}>{rows[myIdx]?.total_league_points} LP</p>
            {!div.is_highest && promLP !== null && (
              <p className="text-[10px] text-gray-500">
                {Math.max(0, promLP - (rows[myIdx]?.total_league_points ?? 0))} to promotion
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Single division card (no inline rankings) ──────────────────────────────────
function DivisionCard({ div, myDivisionId, myUserId, sprintId, onViewRankings }) {
  const v       = getV(div)
  const isMyDiv = div.id === myDivisionId
  const [imgError, setImgError] = useState(false)

  const promLP = div.promotion_min_points ?? null
  const relLP  = div.allows_relegation && div.relegation_max_points !== null ? div.relegation_max_points : null

  return (
    <div
      className="rounded-3xl overflow-hidden border transition-all duration-300"
      style={{
        background: '#0d1117',
        borderColor: isMyDiv ? v.accent + 'bb' : 'rgba(255,255,255,0.07)',
        boxShadow: isMyDiv ? `0 0 0 1px ${v.accent}40, 0 0 40px ${v.accent}20, 0 8px 40px rgba(0,0,0,0.5)` : undefined,
      }}
    >
      {isMyDiv && (
        <div className="flex items-center justify-center gap-2 py-2.5 text-xs font-bold tracking-widest"
          style={{ background: `linear-gradient(135deg, ${v.accent}25, ${v.accent}15)`, color: v.accent, borderBottom: `1px solid ${v.accent}30` }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: v.accent }} />
          YOUR CURRENT DIVISION
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: v.accent }} />
        </div>
      )}

      {/* Cover */}
      <div className="relative h-44 overflow-hidden">
        {!imgError ? (
          <img src={div.badge_url || v.image} alt={div.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-center" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${v.gradient}`}>
            <svg viewBox="0 0 400 200" className="w-full h-full opacity-15" preserveAspectRatio="xMidYMid slice">
              <rect x="30" y="20" width="340" height="160" rx="4" fill="none" stroke="white" strokeWidth="1.5"/>
              <circle cx="200" cy="100" r="35" fill="none" stroke="white" strokeWidth="1.5"/>
              <line x1="200" y1="20" x2="200" y2="180" stroke="white" strokeWidth="1" opacity="0.5"/>
              <rect x="30" y="65" width="55" height="70" fill="none" stroke="white" strokeWidth="1.5"/>
              <rect x="315" y="65" width="55" height="70" fill="none" stroke="white" strokeWidth="1.5"/>
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117]/95 via-[#0d1117]/30 to-transparent" />

        <div className="absolute top-3 left-3 flex gap-1.5">
          {div.is_initial && <span className="text-[10px] bg-black/60 backdrop-blur-sm text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full font-semibold">START HERE</span>}
          {div.is_highest && <span className="text-[10px] bg-black/60 backdrop-blur-sm text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full font-semibold">TOP</span>}
        </div>

        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 flex items-end gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border shadow-lg backdrop-blur-sm"
            style={{ background: v.accentBg, borderColor: v.accentBorder }}>
            {div.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-lg leading-tight" style={{ color: v.accent, textShadow: `0 0 20px ${v.accent}50` }}>{div.name}</p>
            <p className="text-white/40 text-[11px] font-medium tracking-wider mt-0.5">{v.label.toUpperCase()}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pt-3 pb-4 space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-gray-600">
            <span>POINTS THRESHOLDS PER SPRINT</span>
            <span>0 → 40 LP</span>
          </div>
          <ThresholdBar div={div} accent={v.accent} />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl p-2.5 text-center"
            style={{ background: div.allows_relegation ? '#ef444415' : 'rgba(255,255,255,0.03)', border: `1px solid ${div.allows_relegation ? '#ef444430' : 'rgba(255,255,255,0.05)'}` }}>
            <p className="text-[9px] text-gray-600 tracking-wider mb-1">RELEGATION</p>
            <p className="font-bold text-xs text-red-400">
              {div.allows_relegation && relLP !== null ? `≤ ${relLP} LP` : '—'}
            </p>
          </div>
          <div className="rounded-xl p-2.5 text-center"
            style={{ background: 'rgba(107,114,128,0.08)', border: '1px solid rgba(107,114,128,0.15)' }}>
            <p className="text-[9px] text-gray-600 tracking-wider mb-1">RETENTION</p>
            <p className="font-bold text-xs text-gray-400">{div.retention_min_points ?? '—'}–{div.retention_max_points ?? '—'} LP</p>
          </div>
          <div className="rounded-xl p-2.5 text-center"
            style={{ background: div.is_highest ? 'rgba(168,85,247,0.08)' : v.accentBg, border: `1px solid ${div.is_highest ? 'rgba(168,85,247,0.20)' : v.accentBorder}` }}>
            <p className="text-[9px] text-gray-600 tracking-wider mb-1">PROMOTION</p>
            <p className="font-bold text-xs" style={{ color: div.is_highest ? '#a855f7' : v.accent }}>
              {div.is_highest ? '👑 Top' : `≥ ${div.promotion_min_points} LP`}
            </p>
          </div>
        </div>

        {/* Rankings button */}
        <button
          onClick={() => onViewRankings(div)}
          className="w-full py-3 rounded-2xl text-sm font-semibold border transition-all flex items-center justify-center gap-2"
          style={{ background: v.accentBg, borderColor: v.accentBorder, color: v.accent }}
        >
          <span>Rankings</span>
          <span className="text-[10px] opacity-60">→</span>
        </button>
      </div>
    </div>
  )
}

// ── Profile hero ───────────────────────────────────────────────────────────────
function ProfileHero({ profile, status }) {
  const div    = status?.division
  const sprint = status?.sprint
  const prog   = status?.sprint_progress
  const v      = div ? getV({ display_order: div.display_order }) : DIVISION_VISUALS[1]
  const name   = profile?.display_name || profile?.email?.split('@')[0] || 'Player'
  const lp     = prog?.total_league_points ?? 0
  const correct = prog?.total_correct_picks ?? 0
  const perfect = prog?.perfect_weeks ?? 0

  return (
    <div className="rounded-3xl overflow-hidden border" style={{ borderColor: v.accentBorder, background: '#0d1117' }}>
      <div className="h-1 w-full" style={{ background: `linear-gradient(to right, ${v.accent}00, ${v.accent}, ${v.accent}00)` }} />
      <div className="p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt={name} className="w-16 h-16 rounded-2xl object-cover border-2" style={{ borderColor: v.accent + '60' }} />
              : <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black border-2"
                  style={{ background: v.accentBg, borderColor: v.accentBorder, color: v.accent }}>
                  {name[0].toUpperCase()}
                </div>
            }
            <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl flex items-center justify-center text-sm border-2 border-[#0d1117]"
              style={{ background: v.accentBg }}>
              {div?.icon || '🎓'}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-lg leading-tight truncate">{name}</p>
            <p className="font-semibold text-sm mt-0.5" style={{ color: v.accent }}>{div?.division_name || 'Academy'}</p>
            {sprint && <p className="text-gray-500 text-xs mt-0.5 truncate">{sprint.name}</p>}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="rounded-2xl p-3 text-center" style={{ background: v.accentBg, border: `1px solid ${v.accentBorder}` }}>
            <p className="font-black text-2xl" style={{ color: v.accent }}>{lp}</p>
            <p className="text-gray-500 text-[10px] mt-0.5">League Points</p>
          </div>
          <div className="rounded-2xl p-3 text-center bg-white/4 border border-white/8">
            <p className="font-black text-2xl text-green-400">{correct}</p>
            <p className="text-gray-500 text-[10px] mt-0.5">Correct picks</p>
          </div>
          <div className="rounded-2xl p-3 text-center bg-white/4 border border-white/8">
            <p className="font-black text-2xl text-yellow-400">{perfect}</p>
            <p className="text-gray-500 text-[10px] mt-0.5">Perfect weeks</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function DivisionsPage() {
  const [divisions,   setDivisions]   = useState([])
  const [myStatus,    setMyStatus]    = useState(null)
  const [myProfile,   setMyProfile]   = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [rankingDiv,  setRankingDiv]  = useState(null)

  useEffect(() => {
    Promise.all([getGloryDivisions(), getGloryStatus(), getProfile()])
      .then(([divsRes, statusRes, profileRes]) => {
        setDivisions([...divsRes.data].sort((a, b) => a.display_order - b.display_order))
        setMyStatus(statusRes.data)
        setMyProfile(profileRes.data?.user ?? null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-[#0a0d12] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const myUserId = myStatus?.user?.id
  const myDivId  = myStatus?.division?.division_id
  const sprintId = myStatus?.sprint?.id

  return (
    <>
      {/* Full-screen rankings overlay */}
      {rankingDiv && (
        <RankingsScreen
          div={rankingDiv}
          sprintId={sprintId}
          myUserId={myUserId}
          onClose={() => setRankingDiv(null)}
        />
      )}

      <div className="min-h-screen bg-[#0a0d12] text-white pb-24">
        <div className="max-w-md mx-auto px-4 pt-5 space-y-4">
          <h1 className="text-white text-xl font-bold">Divisions</h1>

          <ProfileHero profile={myProfile} status={myStatus} />

          <div className="flex items-center gap-2 text-xs text-gray-600 pt-1">
            <span>Entry level</span>
            <div className="flex-1 h-px bg-gradient-to-r from-gray-700 via-indigo-700 to-purple-700" />
            <span>Elite</span>
          </div>

          {divisions.map(div => (
            <DivisionCard
              key={div.id}
              div={div}
              myDivisionId={myDivId}
              myUserId={myUserId}
              sprintId={sprintId}
              onViewRankings={setRankingDiv}
            />
          ))}
        </div>
        <BottomNav />
      </div>
    </>
  )
}
