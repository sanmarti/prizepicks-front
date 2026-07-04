import { useNavigate } from 'react-router-dom'

// ── Tier badge helpers ─────────────────────────────────────────────────────────

export function getPlayerTier(correct, incorrect) {
  const total = (correct || 0) + (incorrect || 0)
  if (total === 0) return null
  const pct = (correct || 0) / total * 100
  if (pct >= 90) return { icon: '🥇', color: 'gold',   label: 'Gold Predictor' }
  if (pct >= 80) return { icon: '🥈', color: 'silver', label: 'Silver Predictor' }
  if (pct >= 70) return { icon: '🥉', color: 'bronze', label: 'Bronze Predictor' }
  return null
}

const TIER_BG = {
  gold:   'linear-gradient(135deg,#78350f,#b45309)',
  silver: 'linear-gradient(135deg,#1e293b,#475569)',
  bronze: 'linear-gradient(135deg,#431407,#9a3412)',
}

export function TierBadgeSm({ row }) {
  const t = getPlayerTier(
    row.lifetime_correct  ?? row.total_correct_picks,
    row.lifetime_incorrect ?? row.total_incorrect_picks,
  )
  if (!t) return null
  return (
    <span
      className="absolute -bottom-0.5 -right-0.5 w-[15px] h-[15px] text-[9px] rounded-full border border-[#0a0d12] flex items-center justify-center leading-none pointer-events-none"
      style={{ background: TIER_BG[t.color] }}
      title={t.label}
    >
      {t.icon}
    </span>
  )
}

// ── Division cover images (keyed by display_order) ────────────────────────────

export const DIVISION_COVER_IMAGES = {
  1: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=900&q=80&auto=format&fit=crop',
  2: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=900&q=80&auto=format&fit=crop',
  3: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=900&q=80&auto=format&fit=crop',
  4: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=900&q=80&auto=format&fit=crop',
  5: 'https://images.unsplash.com/photo-1540747913346-19212a4b23b4?w=900&q=80&auto=format&fit=crop',
  6: 'https://images.unsplash.com/photo-1522778526097-ce0a22ceb253?w=900&q=80&auto=format&fit=crop',
}

// ── Shared ranking header (hero image + zone legend + tiebreaker) ─────────────

/**
 * Props:
 *   division        – { name, icon, display_order, badge_url, is_highest }
 *   sprintName      – string | null
 *   playerCount     – number
 *   promLP          – number | null
 *   relLP           – number | null
 *   onBack          – () => void
 *   onDivisionsClick– () => void (optional; defaults to navigate('/divisions'))
 */
export function GloryRankingHeader({ division, sprintName, playerCount, promLP, relLP, onBack, onDivisionsClick }) {
  const navigate  = useNavigate()
  const coverSrc  = division?.badge_url || DIVISION_COVER_IMAGES[division?.display_order] || DIVISION_COVER_IMAGES[1]
  const goToDivs  = onDivisionsClick ?? (() => navigate('/divisions'))

  return (
    <>
      {/* Hero cover */}
      <div className="flex-shrink-0 h-36 bg-[#0a0d12]">
        <div className="relative h-36 max-w-md mx-auto overflow-hidden">
          <img
            src={coverSrc}
            alt={division?.name || ''}
            className="w-full h-full object-cover object-center opacity-65"
            onError={e => { e.target.style.display = 'none' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d12] via-[#0a0d12]/25 to-transparent" />

          {/* ← back */}
          <button
            onClick={onBack}
            className="absolute top-3 left-4 w-9 h-9 flex items-center justify-center rounded-xl border border-white/10 text-white text-sm backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.45)' }}
          >
            ←
          </button>

          {/* Player count */}
          <div
            className="absolute top-3 right-4 px-2.5 py-1 rounded-xl border border-white/10 backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.40)' }}
          >
            <p className="text-white/70 text-[11px] font-semibold">{playerCount ?? 0} players</p>
          </div>

          {/* Division info + divisions button */}
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
            <div className="flex items-center gap-2">
              {division?.icon && (
                <span className="text-2xl leading-none">{division.icon}</span>
              )}
              <div>
                <p className="font-black text-base leading-tight text-white drop-shadow-sm">
                  {division?.name || 'Division'}
                </p>
                {sprintName && (
                  <p className="text-white/50 text-[11px] leading-tight">{sprintName}</p>
                )}
              </div>
            </div>

            <button
              onClick={goToDivs}
              className="flex items-center gap-1 text-[10px] font-semibold text-white/60 hover:text-white/90 border border-white/15 rounded-lg px-2 py-1 backdrop-blur-sm transition-colors"
              style={{ background: 'rgba(0,0,0,0.35)' }}
            >
              All divisions
              <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Zone legend + tiebreaker */}
      <div className="flex-shrink-0 border-b border-white/5">
        <div className="max-w-md mx-auto px-4 pt-2 pb-1.5 flex items-center gap-3 flex-wrap">
          {promLP !== null && !division?.is_highest && (
            <span className="flex items-center gap-1 text-[10px] text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block flex-shrink-0" />
              Promotion ≥{promLP} LP
            </span>
          )}
          <span className="flex items-center gap-1 text-[10px] text-gray-500">
            <span className="w-2 h-2 rounded-full bg-gray-600 inline-block flex-shrink-0" />
            Retained
          </span>
          {relLP !== null && (
            <span className="flex items-center gap-1 text-[10px] text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block flex-shrink-0" />
              Relegation ≤{relLP} LP
            </span>
          )}
        </div>
        <p className="max-w-md mx-auto px-4 pb-2 text-[9px] text-gray-600">
          ⚡ Tiebreaker: equal LP → fewer energy used ranks higher
        </p>
      </div>
    </>
  )
}

// ── Ranking rows list ──────────────────────────────────────────────────────────

/**
 * Props:
 *   rows        – array of leaderboard row objects
 *   myUserId    – current user's ID
 *   promLP      – promotion LP threshold (number | null)
 *   relLP       – relegation LP threshold (number | null)
 *   isHighestDiv– true if no promotion zone
 *   isGwLocked  – boolean: locked gameweek → show LIVE badge + 🔒 instead of ⏳
 *   myRowRef    – React ref for the "me" row auto-scroll
 *   onUserClick – (userId) => void (optional; defaults to navigate)
 *   loading     – show spinner while true
 */
export default function GloryRankingList({
  rows = [],
  myUserId,
  promLP,
  relLP,
  isHighestDiv = false,
  isGwLocked = false,
  myRowRef,
  onUserClick,
  loading = false,
}) {
  const navigate = useNavigate()
  const handleUserClick = onUserClick ?? ((uid) => navigate(`/users/${uid}`))

  const lastPromo = promLP !== null
    ? rows.filter(r => r.total_league_points >= promLP).length - 1
    : -1
  const firstRel = relLP !== null
    ? rows.findIndex(r => r.total_league_points <= relLP)
    : -1

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div
          className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'rgba(168,85,247,0.8)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-2">
        <span className="text-5xl">🏟️</span>
        <p className="text-gray-300 text-sm font-semibold">No players have reached this level yet</p>
        <p className="text-gray-600 text-xs mt-0.5">The stadium is empty… be the first to get here! 👀</p>
      </div>
    )
  }

  return (
    <div className="pb-32">
      {rows.map((row, i) => {
        const rank        = i + 1
        const isMe        = row.user_id === myUserId
        const isPromo     = promLP !== null && row.total_league_points >= promLP && !isHighestDiv
        const isRel       = relLP  !== null && row.total_league_points <= relLP
        const showRelDiv  = firstRel === i && i > 0
        const showPromDiv = lastPromo === i && i < rows.length - 1 && !isHighestDiv
        const isLive      = isGwLocked && (row.pending_picks ?? 0) > 0

        return (
          <div key={row.user_id} ref={isMe ? myRowRef : null}>
            {showRelDiv && (
              <div className="flex items-center gap-2 px-4 py-1">
                <div className="flex-1 h-px bg-red-500/20" />
                <span className="text-[9px] text-red-600 tracking-widest font-semibold">RELEGATION LINE</span>
                <div className="flex-1 h-px bg-red-500/20" />
              </div>
            )}

            <div
              className={`w-full flex items-center gap-3 border-b relative transition-colors ${
                isMe ? 'px-4 py-3' : 'px-4 py-2.5'
              } ${
                !isMe && isPromo ? 'bg-green-950/15 border-green-900/40' :
                !isMe && isRel   ? 'bg-red-950/12  border-red-900/40'   :
                !isMe            ? 'border-white/4'                      : ''
              }`}
              style={isMe ? {
                background:  'linear-gradient(90deg, rgba(88,28,135,0.35) 0%, rgba(88,28,135,0.15) 60%, transparent 100%)',
                borderColor: 'rgba(168,85,247,0.35)',
                boxShadow:   'inset 0 0 40px -10px rgba(168,85,247,0.2)',
              } : {}}
            >
              {/* Zone / me left bar */}
              {isMe
                ? <span className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full bg-purple-500" />
                : (isPromo || isRel) && (
                    <span className={`absolute left-0 top-0 bottom-0 w-0.5 ${isPromo ? 'bg-green-500' : 'bg-red-500'}`} />
                  )
              }

              {/* Rank */}
              <span className={`text-center font-black flex-shrink-0 ${
                isMe ? 'w-8 text-base text-purple-300' : 'w-7 text-sm'
              } ${
                !isMe
                  ? rank === 1 ? 'text-yellow-400'
                  : rank === 2 ? 'text-gray-300'
                  : rank === 3 ? 'text-amber-600'
                  :              'text-gray-600'
                  : ''
              }`}>{rank}</span>

              {/* Avatar */}
              <div
                className="relative flex-shrink-0 cursor-pointer"
                onClick={() => handleUserClick(row.user_id)}
              >
                {row.avatar_url
                  ? <img
                      src={row.avatar_url}
                      alt=""
                      className={`rounded-full object-cover ${isMe ? 'w-9 h-9' : 'w-8 h-8'}`}
                      style={isMe ? { boxShadow: '0 0 0 2px rgba(168,85,247,0.8), 0 0 16px rgba(168,85,247,0.4)' } : {}}
                    />
                  : <div
                      className={`rounded-full flex items-center justify-center font-bold ${isMe ? 'w-9 h-9 text-sm' : 'w-8 h-8 text-sm'}`}
                      style={isMe
                        ? { background: 'rgba(88,28,135,0.6)', color: '#d8b4fe', boxShadow: '0 0 0 2px rgba(168,85,247,0.7), 0 0 16px rgba(168,85,247,0.35)' }
                        : { background: 'rgba(255,255,255,0.08)', color: '#9ca3af' }
                      }
                    >
                      {(row.display_name || '?')[0].toUpperCase()}
                    </div>
                }
                <TierBadgeSm row={row} />
              </div>

              {/* Name + stats */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className={`font-semibold truncate text-sm ${isMe ? 'text-white' : 'text-gray-300'}`}>
                    {row.display_name || 'Player'}
                  </p>
                  {isMe && (
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full border flex-shrink-0 bg-purple-900/50 border-purple-500/50 text-purple-300">
                      YOU
                    </span>
                  )}
                  {isLive && (
                    <span className="flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-full border flex-shrink-0 bg-green-500/10 border-green-500/30 text-green-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                      LIVE
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className={`font-semibold ${isMe ? 'text-[11px] text-green-400' : 'text-[10px] text-green-400'}`}>
                    {row.total_correct_picks ?? 0}✓
                  </span>
                  <span className="text-[10px] text-gray-600">·</span>
                  <span className={`${isMe ? 'text-[11px] text-red-400' : 'text-[10px] text-red-400'}`}>
                    {row.total_incorrect_picks ?? 0}✗
                  </span>
                  {(row.pending_picks ?? 0) > 0 && (
                    <>
                      <span className="text-[10px] text-gray-600">·</span>
                      <span className={`${isMe ? 'text-[11px] text-gray-400' : 'text-[10px] text-gray-400'}`}>
                        {row.pending_picks}{isGwLocked ? '🔒' : '⏳'}
                      </span>
                    </>
                  )}
                  {(row.perfect_weeks ?? 0) > 0 && (
                    <>
                      <span className="text-[10px] text-gray-600">·</span>
                      <span className={`${isMe ? 'text-[11px] text-yellow-400' : 'text-[10px] text-yellow-500'}`}>
                        {row.perfect_weeks}⭐
                      </span>
                    </>
                  )}
                  {(row.energy_used ?? 0) > 0 && (
                    <>
                      <span className="text-[10px] text-gray-600">·</span>
                      <span className={`${isMe ? 'text-[11px] text-orange-400' : 'text-[10px] text-orange-400'}`}>
                        {row.energy_used}⚡
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* LP */}
              <div className="flex-shrink-0 text-right">
                <span className={`font-black tabular-nums ${
                  isMe    ? 'text-xl text-white'       :
                  isPromo ? 'text-base text-green-400' :
                  isRel   ? 'text-base text-red-400'   :
                            'text-base text-indigo-300'
                }`} style={isMe ? { textShadow: '0 0 16px rgba(168,85,247,0.6)' } : {}}>
                  {row.total_league_points}
                </span>
                <p className={`font-normal ${isMe ? 'text-[11px] text-purple-400/70' : 'text-[10px] text-gray-500'}`}>LP</p>
              </div>
            </div>

            {showPromDiv && (
              <div className="flex items-center gap-2 px-4 py-1">
                <div className="flex-1 h-px bg-green-500/20" />
                <span className="text-[9px] text-green-600 tracking-widest font-semibold">PROMOTION LINE</span>
                <div className="flex-1 h-px bg-green-500/20" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
