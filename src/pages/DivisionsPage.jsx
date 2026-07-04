import { useEffect, useState, useRef } from 'react'
import { getGloryDivisions, getGloryLeaderboard, getGloryStatus } from '../api/glory'
import BottomNav from '../components/layout/BottomNav'
import GloryRankingList, { GloryRankingHeader } from '../components/GloryRankingList'

const V = {
  1: { accent: '#6b7280', bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.30)', glow: 'rgba(107,114,128,0.15)', label: 'Academy Pitch',   grad: 'from-slate-800  to-slate-950', image: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=900&q=80&auto=format&fit=crop' },
  2: { accent: '#f97316', bg: 'rgba(249,115,22,0.12)',  border: 'rgba(249,115,22,0.30)',  glow: 'rgba(249,115,22,0.15)',  label: 'Local Ground',    grad: 'from-orange-900 to-slate-950', image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=900&q=80&auto=format&fit=crop' },
  3: { accent: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.30)',  glow: 'rgba(59,130,246,0.15)',  label: 'Regional Stadium',grad: 'from-blue-900   to-slate-950', image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=900&q=80&auto=format&fit=crop' },
  4: { accent: '#22c55e', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.30)',   glow: 'rgba(34,197,94,0.15)',   label: 'Pro Stadium',     grad: 'from-green-900  to-slate-950', image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=900&q=80&auto=format&fit=crop' },
  5: { accent: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.30)',  glow: 'rgba(245,158,11,0.15)',  label: 'Premier Ground',  grad: 'from-amber-900  to-slate-950', image: 'https://images.unsplash.com/photo-1540747913346-19212a4b23b4?w=900&q=80&auto=format&fit=crop' },
  6: { accent: '#a855f7', bg: 'rgba(168,85,247,0.12)',  border: 'rgba(168,85,247,0.30)',  glow: 'rgba(168,85,247,0.15)',  label: 'Hall of Legends', grad: 'from-purple-900 to-slate-950', image: 'https://images.unsplash.com/photo-1522778526097-ce0a22ceb253?w=900&q=80&auto=format&fit=crop' },
}
const getV = d => V[d.display_order] || V[1]


// ── Full-screen "All Divisions" list ──────────────────────────────────────────
function DivisionsListScreen({ divisions, divStats, myDivId, activeDiv, onSelect, onClose, totalPlayers }) {
  const myDiv    = divisions.find(d => d.id === myDivId)
  const myV      = myDiv ? getV(myDiv) : null

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0d12] flex flex-col">
      {/* Header */}
      <div className="border-b border-white/6 flex-shrink-0">
        <div className="max-w-md mx-auto flex items-center px-4 pt-12 pb-4">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-white"
          >
            <span className="text-base">←</span>
            <span className="font-bold text-base">Back to my division rankings</span>
          </button>
        </div>
      </div>

      {/* Your division banner */}
      {myDiv && myV && (
        <div className="flex-shrink-0 border-b border-white/5" style={{ background: myV.bg }}>
          <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg border flex-shrink-0"
              style={{ background: myV.bg, borderColor: myV.border }}>
              {myDiv.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black tracking-widest" style={{ color: myV.accent }}>YOUR CURRENT DIVISION</p>
              <p className="text-white font-bold text-sm truncate">{myDiv.name}</p>
            </div>
            <button
              onClick={() => onSelect(myDiv)}
              className="flex-shrink-0 text-xs font-black px-3 py-1.5 rounded-xl"
              style={{ background: myV.accent + '25', color: myV.accent, border: `1px solid ${myV.border}` }}
            >
              View ›
            </button>
          </div>
        </div>
      )}

      {/* Division cards */}
      <div className="flex-1 overflow-y-auto py-4 pb-32">
        <div className="max-w-md mx-auto px-4 space-y-5">
          {[...divisions].reverse().map(div => {
            const v      = getV(div)
            const stats  = divStats[div.id] || {}
            const isMe   = div.id === myDivId
            const isActive = div.id === activeDiv?.id
            const count  = stats.count
            const myRank = stats.myRank
            const topLP  = stats.topLP

            const promLP = div.promotion_min_points
            const relLP  = div.allows_relegation && div.relegation_max_points !== null ? div.relegation_max_points : null
            const isTop  = div.is_highest
            const safeMin = relLP !== null ? relLP + 1 : 1
            const safeMax = !isTop && promLP !== null ? promLP - 1 : null

            return (
              <div
                key={div.id}
                className="rounded-2xl overflow-hidden border transition-all"
                style={{
                  borderColor: isMe ? v.accent : isActive ? v.border : 'rgba(255,255,255,0.10)',
                  boxShadow: isMe ? `0 4px 32px ${v.glow}` : isActive ? `0 4px 18px ${v.glow}` : undefined,
                }}
              >
                {/* ── Cover image (admin-panel style) ── */}
                <div className="relative h-36 overflow-hidden">
                  <img
                    src={div.badge_url || v.image}
                    alt={div.name}
                    className="w-full h-full object-cover object-center"
                    onError={e => { e.target.style.display = 'none' }}
                  />
                  {/* Gradient overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117]/95 via-[#0d1117]/40 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />

                  {/* Top badges */}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    {isTop && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-yellow-400 border border-yellow-500/40">
                        TOP DIV
                      </span>
                    )}
                    {isMe && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full backdrop-blur-sm"
                        style={{ background: 'rgba(0,0,0,0.6)', color: v.accent, border: `1px solid ${v.border}` }}>
                        YOUR DIVISION
                      </span>
                    )}
                  </div>

                  {/* Stats top-right */}
                  <div className="absolute top-3 right-3 text-right">
                    {count != null && (
                      <p className="text-white font-black text-sm drop-shadow">{count} <span className="text-white/50 text-[10px] font-normal">players</span></p>
                    )}
                    {topLP != null && (
                      <p className="text-yellow-400 text-[11px] font-bold drop-shadow">Leader {topLP} LP</p>
                    )}
                  </div>

                  {/* Division identity — bottom of image */}
                  <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 flex items-end gap-3">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl border flex-shrink-0 shadow-lg"
                      style={{ background: v.bg, borderColor: v.border, backdropFilter: 'blur(8px)' }}>
                      {div.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-base leading-tight" style={{ color: v.accent, textShadow: `0 0 20px ${v.accent}60` }}>
                        {div.name}
                      </p>
                      {totalPlayers > 0 && count != null && (
                        <p className="text-white/50 text-[11px]">{Math.round((count / totalPlayers) * 100)}% of players</p>
                      )}
                    </div>
                    {myRank != null && (
                      <div className="ml-auto flex-shrink-0 text-right">
                        <p className="font-black text-lg leading-none" style={{ color: v.accent }}>#{myRank}</p>
                        <p className="text-white/40 text-[10px]">your rank</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Zone breakdown ── */}
                <div className="bg-[#0d1117] divide-y divide-white/5">
                  {/* Promotion */}
                  {!isTop && promLP !== null && (
                    <div className="flex items-center gap-3 px-4 py-2.5">
                      <span className="w-1 h-7 rounded-full bg-green-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-green-400 text-[11px] font-black">⬆ Promotion</p>
                        <p className="text-green-700 text-[10px]">Score {promLP}+ LP this sprint to move up</p>
                      </div>
                      <span className="text-green-400 font-black text-xs flex-shrink-0">≥{promLP} LP</span>
                    </div>
                  )}

                  {/* Maintain */}
                  <div className="flex items-center gap-3 px-4 py-2.5">
                    <span className="w-1 h-7 rounded-full bg-white/20 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-300 text-[11px] font-black">↔ Maintain</p>
                      <p className="text-gray-600 text-[10px]">
                        {isTop
                          ? 'Hold your spot at the top division'
                          : relLP !== null
                            ? `Stay ${safeMin}–${safeMax ?? '?'} LP to keep your division`
                            : `Stay below ${promLP} LP — no relegation here`
                        }
                      </p>
                    </div>
                    <span className="text-gray-500 font-bold text-xs flex-shrink-0">
                      {safeMax != null ? `${safeMin}–${safeMax}` : `1–${(promLP ?? 1) - 1}`} LP
                    </span>
                  </div>

                  {/* Relegation */}
                  {relLP !== null ? (
                    <div className="flex items-center gap-3 px-4 py-2.5">
                      <span className="w-1 h-7 rounded-full bg-red-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-red-400 text-[11px] font-black">⬇ Relegation</p>
                        <p className="text-red-800 text-[10px]">Finish at {relLP} LP or below to drop down</p>
                      </div>
                      <span className="text-red-400 font-black text-xs flex-shrink-0">≤{relLP} LP</span>
                    </div>
                  ) : !isTop && (
                    <div className="flex items-center gap-3 px-4 py-2.5">
                      <span className="w-1 h-7 rounded-full bg-gray-800 flex-shrink-0" />
                      <p className="text-gray-700 text-[10px]">No relegation in this division</p>
                    </div>
                  )}

                  {/* View Rankings button */}
                  <div className="px-4 py-3">
                    <button
                      onClick={() => onSelect(div)}
                      className="w-full py-2.5 rounded-xl text-sm font-black transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                      style={{ background: v.bg, color: v.accent, border: `1px solid ${v.border}` }}
                    >
                      View Rankings ›
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

// ── Rankings screen ────────────────────────────────────────────────────────────
function RankingsScreen({ div, sprintId, sprintName, myUserId, myDivId, onOpenPicker, onBack, totalPlayers, isGwLocked }) {
  const promLP = div.promotion_min_points ?? null
  const relLP  = div.allows_relegation && div.relegation_max_points !== null ? div.relegation_max_points : null

  const [lb, setLb]           = useState(null)
  const [loading, setLoading] = useState(true)
  const myRowRef = useRef(null)

  useEffect(() => {
    setLoading(true)
    setLb(null)
    getGloryLeaderboard({ division_id: div.id, sprint_id: sprintId })
      .then(r => setLb(r.data))
      .catch(() => setLb({ rows: [] }))
      .finally(() => setLoading(false))
  }, [div.id, sprintId])

  const rows  = lb?.rows || []
  const myIdx = rows.findIndex(r => r.user_id === myUserId)

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[#0a0d12]">
      <GloryRankingHeader
        division={div}
        sprintName={sprintName}
        playerCount={rows.length}
        promLP={promLP}
        relLP={relLP}
        onBack={onBack}
        onDivisionsClick={onOpenPicker}
      />

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto">
          <GloryRankingList
            rows={rows}
            myUserId={myUserId}
            promLP={promLP}
            relLP={relLP}
            isHighestDiv={div.is_highest}
            isGwLocked={isGwLocked}
            myRowRef={myRowRef}
            loading={loading}
          />
        </div>
      </div>

      {/* Sticky footer */}
      {!loading && myIdx >= 0 && (
        <div className="flex-shrink-0 border-t border-white/8" style={{ backdropFilter: 'blur(12px)', background: 'rgba(10,13,18,0.95)' }}>
          <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-white text-xs font-semibold">Your position</p>
              <p className="text-purple-400 text-[11px] mt-0.5">#{myIdx + 1} of {rows.length}</p>
            </div>
            <div className="flex items-center gap-3">
              {!div.is_highest && promLP !== null && (
                <div className="text-right">
                  <p className="text-[10px] text-gray-500">to promotion</p>
                  <p className="font-bold text-sm text-green-400">
                    {Math.max(0, promLP - (rows[myIdx]?.total_league_points ?? 0))} LP
                  </p>
                </div>
              )}
              <div className="text-right">
                <p className="font-black text-2xl leading-none text-white">
                  {rows[myIdx]?.total_league_points}
                </p>
                <p className="text-[10px] text-gray-500">LP</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function DivisionsPage() {
  const [divisions,  setDivisions]  = useState([])
  const [myStatus,   setMyStatus]   = useState(null)
  const [divStats,   setDivStats]   = useState({})   // divId → { count, myRank, topLP }
  const [loading,    setLoading]    = useState(true)
  const [activeDiv,  setActiveDiv]  = useState(null)
  const [listOpen,   setListOpen]   = useState(false)

  useEffect(() => {
    Promise.all([getGloryDivisions(), getGloryStatus()])
      .then(async ([divsRes, statusRes]) => {
        const sorted   = [...divsRes.data].sort((a, b) => a.display_order - b.display_order)
        const status   = statusRes.data
        const myDivId  = status?.division?.division_id
        const sprintId = status?.sprint?.id
        const myUid    = status?.user?.id

        setDivisions(sorted)
        setMyStatus(status)
        setActiveDiv(sorted.find(d => d.id === myDivId) ?? sorted[0] ?? null)

        // Fetch all leaderboards in parallel to build stats for each card
        const results = await Promise.allSettled(
          sorted.map(d => getGloryLeaderboard({ division_id: d.id, sprint_id: sprintId }))
        )
        const stats = {}
        results.forEach((res, i) => {
          if (res.status !== 'fulfilled') return
          const rows  = res.value.data?.rows ?? []
          const myIdx = myUid ? rows.findIndex(r => r.user_id === myUid) : -1
          stats[sorted[i].id] = {
            count:  rows.length,
            myRank: myIdx >= 0 ? myIdx + 1 : null,
            topLP:  rows[0]?.total_league_points ?? null,
          }
        })
        setDivStats(stats)
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
  const sprintName  = myStatus?.sprint?.name
  const totalPlayers = Object.values(divStats).reduce((sum, s) => sum + (s.count || 0), 0)
  const isGwLocked  = (myStatus?.sprint?.gameweeks ?? []).some(g => g.status === 'LOCKED')

  if (!activeDiv) return (
    <div className="min-h-screen bg-[#0a0d12] flex items-center justify-center text-gray-500 text-sm">
      No divisions found
    </div>
  )

  return (
    <>
      <RankingsScreen
        div={activeDiv}
        sprintId={sprintId}
        sprintName={sprintName}
        myUserId={myUserId}
        myDivId={myDivId}
        onOpenPicker={() => setListOpen(true)}
        onBack={() => setListOpen(true)}
        totalPlayers={totalPlayers}
        isGwLocked={isGwLocked}
      />
      {listOpen && (
        <DivisionsListScreen
          divisions={divisions}
          divStats={divStats}
          myDivId={myDivId}
          activeDiv={activeDiv}
          onSelect={div => { setActiveDiv(div); setListOpen(false) }}
          onClose={() => setListOpen(false)}
          totalPlayers={totalPlayers}
        />
      )}
    </>
  )
}
