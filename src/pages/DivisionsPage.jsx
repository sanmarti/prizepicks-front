import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getGloryDivisions, getGloryLeaderboard, getGloryStatus } from '../api/glory'
import BottomNav from '../components/layout/BottomNav'

// Exact same visuals as admin panel
const DIVISION_VISUALS = {
  1: {
    image: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=900&q=80&auto=format&fit=crop',
    gradient: 'from-slate-900 via-slate-800 to-slate-950',
    accent: '#6b7280',
    accentBg: 'rgba(107,114,128,0.15)',
    accentBorder: 'rgba(107,114,128,0.35)',
    label: 'Academy Pitch',
  },
  2: {
    image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=900&q=80&auto=format&fit=crop',
    gradient: 'from-orange-950 via-orange-900 to-slate-950',
    accent: '#f97316',
    accentBg: 'rgba(249,115,22,0.12)',
    accentBorder: 'rgba(249,115,22,0.30)',
    label: 'Local Ground',
  },
  3: {
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=900&q=80&auto=format&fit=crop',
    gradient: 'from-blue-950 via-blue-900 to-slate-950',
    accent: '#3b82f6',
    accentBg: 'rgba(59,130,246,0.12)',
    accentBorder: 'rgba(59,130,246,0.30)',
    label: 'Regional Stadium',
  },
  4: {
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=900&q=80&auto=format&fit=crop',
    gradient: 'from-green-950 via-green-900 to-slate-950',
    accent: '#22c55e',
    accentBg: 'rgba(34,197,94,0.12)',
    accentBorder: 'rgba(34,197,94,0.30)',
    label: 'Pro Stadium',
  },
  5: {
    image: 'https://images.unsplash.com/photo-1540747913346-19212a4b23b4?w=900&q=80&auto=format&fit=crop',
    gradient: 'from-amber-950 via-amber-900 to-slate-950',
    accent: '#f59e0b',
    accentBg: 'rgba(245,158,11,0.12)',
    accentBorder: 'rgba(245,158,11,0.30)',
    label: 'Premier Ground',
  },
  6: {
    image: 'https://images.unsplash.com/photo-1522778526097-ce0a22ceb253?w=900&q=80&auto=format&fit=crop',
    gradient: 'from-purple-950 via-purple-900 to-slate-950',
    accent: '#a855f7',
    accentBg: 'rgba(168,85,247,0.12)',
    accentBorder: 'rgba(168,85,247,0.30)',
    label: 'Hall of Legends',
  },
}

function getV(div) {
  return DIVISION_VISUALS[div.display_order] || DIVISION_VISUALS[1]
}

// ── LP threshold bar ───────────────────────────────────────────────────────────
function ThresholdBar({ div, accent }) {
  const MAX     = 40
  const relMax  = div.allows_relegation && div.relegation_max_points !== null ? div.relegation_max_points + 1 : 0
  const promoMin = div.is_highest ? MAX : (div.promotion_min_points ?? MAX)
  const relegW  = (relMax / MAX) * 100
  const retW    = Math.max(0, ((promoMin - relMax) / MAX) * 100)
  const promoW  = Math.max(0, ((MAX - promoMin) / MAX) * 100)

  return (
    <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
      {relMax > 0 && (
        <div className="h-full rounded-l-full" style={{ width: `${relegW}%`, background: '#ef444480' }} />
      )}
      <div className="h-full" style={{ width: `${retW}%`, background: 'rgba(107,114,128,0.35)' }} />
      {!div.is_highest && (
        <div className="h-full rounded-r-full" style={{ width: `${promoW}%`, background: accent + 'aa' }} />
      )}
    </div>
  )
}

// ── Leaderboard row ────────────────────────────────────────────────────────────
function PlayerRow({ row, rank, isMe, accent, promLP, relLP, onClick }) {
  const isPromo = promLP !== null && row.total_league_points >= promLP
  const isRel   = relLP  !== null && row.total_league_points <= relLP

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0 text-left transition-colors hover:bg-white/3 ${
        isMe ? 'bg-white/5' : ''
      }`}
    >
      {/* Rank */}
      <span className={`w-6 text-center text-xs font-black flex-shrink-0 ${
        rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-gray-300' : rank === 3 ? 'text-amber-600' : 'text-gray-600'
      }`}>{rank}</span>

      {/* Avatar */}
      {row.avatar_url
        ? <img src={row.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
        : <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: accent + '25', color: accent }}>
            {(row.display_name || '?')[0].toUpperCase()}
          </div>
      }

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${isMe ? 'text-white font-bold' : 'text-gray-300'}`}>
          {row.display_name || 'Player'}
          {isMe && <span className="text-xs ml-1.5 font-normal" style={{ color: accent }}>← you</span>}
        </p>
        <p className="text-gray-600 text-[10px]">
          {row.perfect_weeks > 0 && `${row.perfect_weeks}⭐ · `}
          {row.total_correct_picks} correct
        </p>
      </div>

      {/* LP + zone indicator */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {isPromo && <span className="text-green-400 text-xs">⬆</span>}
        {isRel   && <span className="text-red-400 text-xs">⬇</span>}
        <span className="font-black text-sm" style={{ color: isMe ? accent : (isPromo ? '#22c55e' : isRel ? '#ef4444' : '#818cf8') }}>
          {row.total_league_points} LP
        </span>
      </div>
    </button>
  )
}

// ── Single division card ───────────────────────────────────────────────────────
function DivisionCard({ div, myDivisionId, myUserId, sprintId }) {
  const navigate   = useNavigate()
  const v          = getV(div)
  const isMyDiv    = div.id === myDivisionId
  const [imgError, setImgError] = useState(false)
  const [expanded, setExpanded] = useState(isMyDiv)
  const [lb, setLb]             = useState(null)
  const [lbLoading, setLbLoading] = useState(false)

  const loadLb = useCallback(() => {
    if (lb || lbLoading) return
    setLbLoading(true)
    getGloryLeaderboard({ division_id: div.id, sprint_id: sprintId })
      .then(r => setLb(r.data))
      .catch(() => setLb({ rows: [] }))
      .finally(() => setLbLoading(false))
  }, [div.id, sprintId, lb, lbLoading])

  const handleToggle = () => {
    const next = !expanded
    setExpanded(next)
    if (next) loadLb()
  }

  useEffect(() => {
    if (isMyDiv) loadLb()
  }, [isMyDiv, loadLb])

  const promLP = div.promotion_min_points ?? null
  const relLP  = div.allows_relegation && div.relegation_max_points !== null ? div.relegation_max_points : null
  const myIdx  = lb?.rows?.findIndex(r => r.user_id === myUserId) ?? -1

  return (
    <div
      className="rounded-3xl overflow-hidden border transition-all duration-300"
      style={{
        background: '#0d1117',
        borderColor: isMyDiv ? v.accentBorder : 'rgba(255,255,255,0.07)',
        boxShadow: isMyDiv ? `0 0 0 1px ${v.accent}30, 0 8px 40px ${v.accent}10` : undefined,
      }}
    >
      {/* ── Cover image ── */}
      <div className="relative h-44 overflow-hidden">
        {!imgError ? (
          <img
            src={div.badge_url || v.image}
            alt={div.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-center transition-transform duration-700"
            style={{ transform: expanded ? 'scale(1.04)' : 'scale(1)' }}
          />
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

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117]/95 via-[#0d1117]/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />

        {/* Chips */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {div.is_initial && (
            <span className="text-[10px] bg-black/60 backdrop-blur-sm text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full font-semibold">
              START HERE
            </span>
          )}
          {div.is_highest && (
            <span className="text-[10px] bg-black/60 backdrop-blur-sm text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full font-semibold">
              TOP
            </span>
          )}
        </div>
        {isMyDiv && (
          <div className="absolute top-3 right-3">
            <span className="text-[10px] px-2.5 py-1 rounded-full font-bold backdrop-blur-sm border"
              style={{ background: v.accentBg, borderColor: v.accentBorder, color: v.accent }}>
              YOUR DIVISION
            </span>
          </div>
        )}

        {/* Identity */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 flex items-end gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 border shadow-lg backdrop-blur-sm"
            style={{ background: v.accentBg, borderColor: v.accentBorder }}>
            {div.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-lg leading-tight" style={{ color: v.accent, textShadow: `0 0 20px ${v.accent}50` }}>
              {div.name}
            </p>
            <p className="text-white/40 text-[11px] font-medium tracking-wider mt-0.5">{v.label.toUpperCase()}</p>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-4 pt-3 pb-4 space-y-3">

        {/* LP threshold bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-gray-600">
            <span>POINTS THRESHOLDS PER SPRINT</span>
            <span>0 → 40 LP</span>
          </div>
          <ThresholdBar div={div} accent={v.accent} />
        </div>

        {/* Threshold cells */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl p-2.5 text-center"
            style={{ background: div.allows_relegation ? '#ef444415' : 'rgba(255,255,255,0.03)', border: `1px solid ${div.allows_relegation ? '#ef444430' : 'rgba(255,255,255,0.05)'}` }}>
            <p className="text-[9px] text-gray-600 tracking-wider mb-1">RELEGATION</p>
            <p className="font-bold text-xs text-red-400">
              {div.allows_relegation && div.relegation_max_points !== null ? `≤ ${div.relegation_max_points} LP` : '—'}
            </p>
          </div>
          <div className="rounded-xl p-2.5 text-center"
            style={{ background: 'rgba(107,114,128,0.08)', border: '1px solid rgba(107,114,128,0.15)' }}>
            <p className="text-[9px] text-gray-600 tracking-wider mb-1">RETENTION</p>
            <p className="font-bold text-xs text-gray-400">
              {div.retention_min_points ?? '—'}–{div.retention_max_points ?? '—'} LP
            </p>
          </div>
          <div className="rounded-xl p-2.5 text-center"
            style={{ background: div.is_highest ? 'rgba(168,85,247,0.08)' : v.accentBg, border: `1px solid ${div.is_highest ? 'rgba(168,85,247,0.20)' : v.accentBorder}` }}>
            <p className="text-[9px] text-gray-600 tracking-wider mb-1">PROMOTION</p>
            <p className="font-bold text-xs" style={{ color: div.is_highest ? '#a855f7' : v.accent }}>
              {div.is_highest ? '👑 Top' : `≥ ${div.promotion_min_points} LP`}
            </p>
          </div>
        </div>

        {/* My position in this division (if I'm here) */}
        {isMyDiv && myIdx >= 0 && lb?.rows && (
          <div className="rounded-2xl px-3 py-2.5 flex items-center justify-between"
            style={{ background: v.accentBg, border: `1px solid ${v.accentBorder}` }}>
            <div>
              <p className="text-white text-xs font-semibold">Your position</p>
              <p className="text-[10px] mt-0.5" style={{ color: v.accent }}>
                #{myIdx + 1} of {lb.rows.length} players
              </p>
            </div>
            <div className="text-right">
              <p className="font-black text-lg" style={{ color: v.accent }}>
                {lb.rows[myIdx]?.total_league_points} LP
              </p>
              {!div.is_highest && promLP !== null && (
                <p className="text-[10px] text-gray-500">
                  {Math.max(0, promLP - (lb.rows[myIdx]?.total_league_points ?? 0))} to promotion
                </p>
              )}
            </div>
          </div>
        )}

        {/* Rankings toggle button */}
        <button
          onClick={handleToggle}
          className="w-full py-2.5 rounded-2xl text-sm font-semibold border transition-all"
          style={{
            background: expanded ? v.accentBg : 'rgba(255,255,255,0.04)',
            borderColor: expanded ? v.accentBorder : 'rgba(255,255,255,0.08)',
            color: expanded ? v.accent : '#6b7280',
          }}
        >
          {expanded ? '▲ Hide rankings' : `▼ View rankings${lb?.rows?.length ? ` (${lb.rows.length})` : ''}`}
        </button>
      </div>

      {/* ── Expanded leaderboard ── */}
      {expanded && (
        <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          {lbLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: v.accent, borderTopColor: 'transparent' }} />
            </div>
          )}
          {!lbLoading && (!lb?.rows?.length) && (
            <div className="py-10 text-center">
              <p className="text-2xl mb-2">{div.icon}</p>
              <p className="text-gray-500 text-sm">No players ranked yet</p>
              <p className="text-gray-700 text-xs mt-1">Rankings update when a sprint is active</p>
            </div>
          )}
          {!lbLoading && lb?.rows?.length > 0 && (
            <>
              {/* Promotion zone header */}
              {promLP !== null && !div.is_highest && (
                <div className="px-4 py-1.5 text-[10px] font-semibold text-green-400 bg-green-900/10 flex items-center gap-1.5">
                  <span>⬆</span> Promotion zone — {promLP}+ LP
                </div>
              )}

              {lb.rows.map((row, i) => {
                const rank = i + 1
                const isMe = row.user_id === myUserId
                const showRelLine = relLP !== null && i === lb.rows.findLastIndex(r => r.total_league_points > relLP)

                return (
                  <div key={row.user_id}>
                    <PlayerRow
                      row={row} rank={rank} isMe={isMe}
                      accent={v.accent} promLP={promLP} relLP={relLP}
                      onClick={() => navigate(`/users/${row.user_id}`)}
                    />
                    {/* Relegation separator line */}
                    {showRelLine && relLP !== null && (
                      <div className="px-4 py-1.5 text-[10px] font-semibold text-red-400 bg-red-900/10 flex items-center gap-1.5 border-t border-red-500/15">
                        <span>⬇</span> Relegation zone — ≤{relLP} LP
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function DivisionsPage() {
  const [divisions, setDivisions]   = useState([])
  const [myStatus,  setMyStatus]    = useState(null)
  const [loading,   setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([getGloryDivisions(), getGloryStatus()])
      .then(([divsRes, statusRes]) => {
        // Sort ascending by display_order: Academy (1) at top, Champions (6) at bottom
        const sorted = [...divsRes.data].sort((a, b) => a.display_order - b.display_order)
        setDivisions(sorted)
        setMyStatus(statusRes.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-[#0a0d12] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const myUserId    = myStatus?.user?.id
  const myDivId     = myStatus?.division?.division_id
  const sprintId    = myStatus?.sprint?.id

  return (
    <div className="min-h-screen bg-[#0a0d12] text-white pb-24">
      <div className="max-w-md mx-auto px-4 pt-5 space-y-4">

        <div>
          <h1 className="text-white text-xl font-bold">Divisions</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            From Academy to Legend — every division ranked live
          </p>
        </div>

        {/* Journey label */}
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span>Entry</span>
          <div className="flex-1 h-px bg-gradient-to-r from-gray-700 via-indigo-700 to-purple-700" />
          <span>Elite</span>
        </div>

        {/* Division cards — Academy (top) → Champions (bottom) */}
        {divisions.map(div => (
          <DivisionCard
            key={div.id}
            div={div}
            myDivisionId={myDivId}
            myUserId={myUserId}
            sprintId={sprintId}
          />
        ))}
      </div>
      <BottomNav />
    </div>
  )
}
