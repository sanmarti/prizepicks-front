import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getGloryDivisions, getGloryLeaderboard, getGloryStatus } from '../api/glory'
import BottomNav from '../components/layout/BottomNav'

const DIV_COLORS = {
  1: '#64748b', // Academy - slate
  2: '#f97316', // Div 4 - orange
  3: '#f59e0b', // Div 3 - amber
  4: '#3b82f6', // Div 2 - blue
  5: '#22c55e', // Div 1 - green
  6: '#a855f7', // Champions/Legend - purple
}

function Avatar({ src, name, size = 8 }) {
  return src
    ? <img src={src} alt={name} className={`w-${size} h-${size} rounded-full object-cover flex-shrink-0`} />
    : <div className={`w-${size} h-${size} rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0`}
        style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8' }}>
        {(name || '?')[0].toUpperCase()}
      </div>
}

function LeaderboardRow({ row, rank, isMe, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0 text-left transition-colors hover:bg-white/3 ${
        isMe ? 'bg-indigo-900/15' : ''
      }`}
    >
      <span className={`w-6 text-center text-xs font-bold flex-shrink-0 ${
        rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-gray-300' : rank === 3 ? 'text-amber-600' : 'text-gray-600'
      }`}>{rank}</span>
      <Avatar src={row.avatar_url} name={row.display_name} size={8} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${isMe ? 'text-white font-semibold' : 'text-gray-300'}`}>
          {row.display_name || 'Player'}
          {isMe && <span className="text-indigo-400 text-xs ml-1.5">you</span>}
        </p>
        <p className="text-gray-600 text-[10px]">
          {row.gameweeks_participated || 0} GW · {row.total_correct_picks || 0} correct · {row.perfect_weeks || 0} ⭐
        </p>
      </div>
      <span className="text-indigo-400 font-black text-sm flex-shrink-0">{row.total_league_points} LP</span>
    </button>
  )
}

export default function DivisionsPage() {
  const navigate   = useNavigate()
  const [divisions, setDivisions]   = useState([])
  const [myStatus, setMyStatus]     = useState(null)
  const [selectedDiv, setSelectedDiv] = useState(null)
  const [lbData, setLbData]         = useState(null)
  const [lbLoading, setLbLoading]   = useState(false)
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    Promise.all([getGloryDivisions(), getGloryStatus()])
      .then(([divsRes, statusRes]) => {
        setDivisions(divsRes.data)
        setMyStatus(statusRes.data)
        // Auto-select user's division
        const myDivOrder = statusRes.data?.division?.display_order
        const myDiv = divsRes.data.find(d => d.display_order === myDivOrder)
        setSelectedDiv(myDiv || divsRes.data[0] || null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const loadLeaderboard = useCallback((div) => {
    if (!div) return
    setLbLoading(true)
    setLbData(null)
    getGloryLeaderboard({ division_id: div.id })
      .then(r => setLbData(r.data))
      .catch(() => setLbData({ rows: [] }))
      .finally(() => setLbLoading(false))
  }, [])

  useEffect(() => {
    if (selectedDiv) loadLeaderboard(selectedDiv)
  }, [selectedDiv, loadLeaderboard])

  const myUserId   = myStatus?.user?.id
  const myDivOrder = myStatus?.division?.display_order

  if (loading) return (
    <div className="min-h-screen bg-[#0a0d12] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0d12] text-white pb-24">
      <div className="max-w-md mx-auto pt-5 space-y-4">

        <div className="px-4">
          <h1 className="text-white text-xl font-bold">Divisions</h1>
          <p className="text-gray-500 text-sm mt-0.5">Live rankings across all divisions</p>
        </div>

        {/* Division selector tabs (horizontal scroll) */}
        <div className="px-4">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {divisions.map(div => {
              const color = DIV_COLORS[div.display_order] || '#6366f1'
              const isSelected = selectedDiv?.id === div.id
              const isMyDiv    = div.display_order === myDivOrder
              return (
                <button
                  key={div.id}
                  onClick={() => setSelectedDiv(div)}
                  className="flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-2xl border text-xs font-medium transition-all"
                  style={{
                    background: isSelected ? `${color}22` : 'rgba(255,255,255,0.03)',
                    borderColor: isSelected ? `${color}70` : 'rgba(255,255,255,0.07)',
                    color: isSelected ? color : '#6b7280',
                  }}
                >
                  <span className="text-base">{div.icon}</span>
                  <span className="max-w-[70px] text-center leading-tight">
                    {div.name}
                    {isMyDiv && <span className="ml-0.5">·</span>}
                  </span>
                  {isMyDiv && (
                    <span className="text-[9px]" style={{ color }}>you</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Division detail */}
        {selectedDiv && (
          <div>
            {/* Division header */}
            <div className="px-4 mb-3">
              <div className="flex items-center justify-between bg-[#0d1117] border border-white/8 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{selectedDiv.icon}</span>
                  <div>
                    <p className="text-white font-bold">{selectedDiv.name}</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {selectedDiv.display_order === myDivOrder ? 'Your current division' : ''}
                      {selectedDiv.promotion_min_points && ` · Promotion: ${selectedDiv.promotion_min_points}+ LP`}
                    </p>
                  </div>
                </div>
                {lbData?.rows && (
                  <div className="text-right">
                    <p className="text-white font-bold">{lbData.rows.length}</p>
                    <p className="text-gray-600 text-xs">players</p>
                  </div>
                )}
              </div>
            </div>

            {/* Promotion/relegation info */}
            {(selectedDiv.promotion_min_points || selectedDiv.relegation_max_points) && (
              <div className="px-4 mb-3 flex gap-2">
                {selectedDiv.promotion_min_points && !selectedDiv.is_highest && (
                  <div className="flex-1 bg-green-900/15 border border-green-500/20 rounded-xl px-3 py-2 text-xs text-center">
                    <p className="text-green-400 font-semibold">⬆ Promotion</p>
                    <p className="text-gray-500">{selectedDiv.promotion_min_points}+ LP</p>
                  </div>
                )}
                {selectedDiv.relegation_max_points !== null && selectedDiv.allows_relegation && (
                  <div className="flex-1 bg-red-900/15 border border-red-500/20 rounded-xl px-3 py-2 text-xs text-center">
                    <p className="text-red-400 font-semibold">⬇ Relegation</p>
                    <p className="text-gray-500">≤{selectedDiv.relegation_max_points} LP</p>
                  </div>
                )}
                {selectedDiv.is_highest && (
                  <div className="flex-1 bg-purple-900/15 border border-purple-500/20 rounded-xl px-3 py-2 text-xs text-center">
                    <p className="text-purple-400 font-semibold">👑 Top division</p>
                    <p className="text-gray-500">The pinnacle</p>
                  </div>
                )}
              </div>
            )}

            {/* Leaderboard */}
            <div className="mx-4 bg-[#0d1117] border border-white/8 rounded-2xl overflow-hidden">
              {lbLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {!lbLoading && (!lbData?.rows?.length) && (
                <div className="py-12 text-center">
                  <p className="text-gray-500 text-sm">No players in this division yet</p>
                  <p className="text-gray-700 text-xs mt-1">Rankings update when a sprint is active</p>
                </div>
              )}
              {!lbLoading && lbData?.rows?.length > 0 && (
                <div>
                  {lbData.rows.map((row, i) => (
                    <LeaderboardRow
                      key={row.user_id}
                      row={row}
                      rank={i + 1}
                      isMe={row.user_id === myUserId}
                      onClick={() => navigate(`/users/${row.user_id}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
