import { useEffect, useState, useRef } from 'react'
import { getGloryDivisions, getGloryLeaderboard, getGloryStatus } from '../api/glory'
import GloryRankingList from '../components/GloryRankingList'
import { getMyLeagues, getLeagueStandings } from '../api/leagues'
import Spinner from '../components/ui/Spinner'

const V = {
  1: { accent: '#6b7280', bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.30)', glow: 'rgba(107,114,128,0.15)', label: 'Academy Pitch',   grad: 'from-slate-800  to-slate-950', image: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=900&q=80&auto=format&fit=crop' },
  2: { accent: '#f97316', bg: 'rgba(249,115,22,0.12)',  border: 'rgba(249,115,22,0.30)',  glow: 'rgba(249,115,22,0.15)',  label: 'Local Ground',    grad: 'from-orange-900 to-slate-950', image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=900&q=80&auto=format&fit=crop' },
  3: { accent: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.30)',  glow: 'rgba(59,130,246,0.15)',  label: 'Regional Stadium',grad: 'from-blue-900   to-slate-950', image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=900&q=80&auto=format&fit=crop' },
  4: { accent: '#22c55e', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.30)',   glow: 'rgba(34,197,94,0.15)',   label: 'Pro Stadium',     grad: 'from-green-900  to-slate-950', image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=900&q=80&auto=format&fit=crop' },
  5: { accent: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.30)',  glow: 'rgba(245,158,11,0.15)',  label: 'Premier Ground',  grad: 'from-amber-900  to-slate-950', image: 'https://images.unsplash.com/photo-1540747913346-19212a4b23b4?w=900&q=80&auto=format&fit=crop' },
  6: { accent: '#a855f7', bg: 'rgba(168,85,247,0.12)',  border: 'rgba(168,85,247,0.30)',  glow: 'rgba(168,85,247,0.15)',  label: 'Hall of Legends', grad: 'from-purple-900 to-slate-950', image: 'https://images.unsplash.com/photo-1522778526097-ce0a22ceb253?w=900&q=80&auto=format&fit=crop' },
}
const getV = d => V[d.display_order] || V[1]



function PeriodToggle({ allTime, onChange }) {
  return (
    <div className="flex gap-0.5 bg-white/5 border border-white/8 rounded-xl p-0.5">
      {[['sprint', 'This Sprint'], ['alltime', 'All Time']].map(([key, label]) => (
        <button
          key={key}
          onClick={() => onChange(key === 'alltime')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-[11px] font-bold transition-colors ${
            (key === 'alltime') === allTime ? 'bg-white/12 text-white' : 'text-gray-500'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// ── Global rankings screen (all players, level shown per row) ─────────────────
function RankingsScreen({ sprintId, sprintName, myUserId, myDiv, totalPlayers, isGwLocked }) {
  const [lb, setLb]           = useState(null)
  const [loading, setLoading] = useState(true)
  const [allTime, setAllTime] = useState(false)
  const myRowRef = useRef(null)

  useEffect(() => {
    setLoading(true)
    setLb(null)
    const params = allTime ? { all_time: true } : { sprint_id: sprintId }
    getGloryLeaderboard(params)
      .then(r => setLb(r.data))
      .catch(() => setLb({ rows: [] }))
      .finally(() => setLoading(false))
  }, [sprintId, allTime])

  const rows  = lb?.rows || []
  const myIdx = rows.findIndex(r => r.user_id === myUserId)

  useEffect(() => {
    if (!loading && myRowRef.current)
      setTimeout(() => myRowRef.current?.scrollIntoView({ block: 'center', behavior: 'instant' }), 50)
  }, [loading])

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[#0a0d12]">
      {/* Hero header */}
      <div className="flex-shrink-0 h-36 bg-[#0a0d12]">
        <div className="relative h-36 max-w-md mx-auto overflow-hidden">
          <img
            src={myDiv?.badge_url || V[myDiv?.display_order]?.image || V[1].image}
            alt=""
            className="w-full h-full object-cover object-center opacity-65"
            onError={e => { e.target.style.display = 'none' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d12] via-[#0a0d12]/25 to-transparent" />
          <div className="absolute top-3 right-4 px-2.5 py-1 rounded-xl border border-white/10 backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.40)' }}>
            <p className="text-white/70 text-[11px] font-semibold">{rows.length || totalPlayers || 0} players</p>
          </div>
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
            <div>
              <p className="font-black text-base leading-tight text-white drop-shadow-sm">Global Ranking</p>
              <p className="text-white/50 text-[11px] leading-tight">{allTime ? 'All Time' : (sprintName || 'This Sprint')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle + your level */}
      <div className="flex-shrink-0 border-b border-white/5">
        <div className="max-w-md mx-auto px-4 py-2 flex items-center gap-3">
          {myDiv && (
            <span className="text-[10px] text-gray-500 flex-shrink-0">
              Your level: <span className="text-white/60 font-semibold">{myDiv.name}</span>
            </span>
          )}
          <div className="ml-auto flex-shrink-0">
            <PeriodToggle allTime={allTime} onChange={setAllTime} />
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto" style={{ overscrollBehaviorY: 'contain' }}>
        <div className="max-w-md mx-auto">
          <GloryRankingList
            rows={rows}
            myUserId={myUserId}
            promLP={null}
            relLP={null}
            isHighestDiv={true}
            isGwLocked={isGwLocked}
            myRowRef={myRowRef}
            loading={loading}
          />
          {!loading && rows.length > 0 && <div className="pb-32" />}
        </div>
      </div>

      {/* Sticky footer */}
      {!loading && myIdx >= 0 && (
        <div className="flex-shrink-0 border-t border-white/8" style={{ backdropFilter: 'blur(12px)', background: 'rgba(10,13,18,0.95)' }}>
          <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-white text-xs font-semibold">Your position</p>
              <p className="text-purple-400 text-[11px] mt-0.5">#{rows[myIdx]?.rank ?? myIdx + 1} of {rows.length}</p>
            </div>
            <div className="text-right">
              <p className="font-black text-2xl leading-none text-white">{rows[myIdx]?.total_league_points}</p>
              <p className="text-[10px] text-gray-500">LP</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── League standings avatar ────────────────────────────────────────────────────
function LeagueAvatar({ row, isMe }) {
  const [failed, setFailed] = useState(false)
  const sz = isMe ? 'w-9 h-9' : 'w-8 h-8'
  const meStyle    = { background: 'rgba(88,28,135,0.6)', color: '#d8b4fe', boxShadow: '0 0 0 2px rgba(168,85,247,0.7), 0 0 16px rgba(168,85,247,0.35)' }
  const otherStyle = { background: 'rgba(255,255,255,0.08)', color: '#9ca3af' }
  const imgStyle   = isMe ? { boxShadow: '0 0 0 2px rgba(168,85,247,0.8), 0 0 16px rgba(168,85,247,0.4)' } : {}
  if (row.avatar_url && !failed)
    return <img src={row.avatar_url} alt="" className={`rounded-full object-cover ${sz}`} style={imgStyle} onError={() => setFailed(true)} />
  return (
    <div className={`rounded-full flex items-center justify-center font-bold text-sm ${sz}`} style={isMe ? meStyle : otherStyle}>
      {(row.display_name || '?')[0].toUpperCase()}
    </div>
  )
}

// ── My Leagues rankings ────────────────────────────────────────────────────────
function LeagueStandingsView({ league, onBack, myUserId }) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [allTime, setAllTime] = useState(false)
  const myRowRef              = useRef(null)

  useEffect(() => {
    setLoading(true)
    setData(null)
    const params = allTime ? { all_time: true } : {}
    getLeagueStandings(league.id, params)
      .then(r => setData(r.data))
      .catch(() => setData({ standings: [] }))
      .finally(() => setLoading(false))
  }, [league.id, allTime])

  useEffect(() => {
    if (!loading && myRowRef.current)
      setTimeout(() => myRowRef.current?.scrollIntoView({ block: 'center', behavior: 'instant' }), 50)
  }, [loading])

  const standings = data?.standings || []
  const period    = data?.period
  const prizes    = Array.isArray(period?.prize_config) ? period.prize_config : []
  const myIdx     = standings.findIndex(r => r.user_id === myUserId)

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[#0a0d12]">

      {/* ── Hero header (matches GloryRankingHeader style) ── */}
      <div className="flex-shrink-0 h-36 bg-[#0a0d12]">
        <div className="relative h-36 max-w-md mx-auto overflow-hidden">
          {league.image_url ? (
            <img src={league.image_url} alt={league.name} className="w-full h-full object-cover object-center opacity-65" />
          ) : (
            <div className="w-full h-full" style={{ background: 'linear-gradient(135deg,#1e1b4b,#312e81,#1e1b4b)' }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d12] via-[#0a0d12]/25 to-transparent" />

          {/* Back button */}
          <button
            onClick={onBack}
            className="absolute top-3 left-4 flex items-center gap-1.5 text-[11px] font-semibold text-white/70 hover:text-white transition-colors"
            style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)', borderRadius: 8, padding: '4px 10px', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>

          {/* Member count badge */}
          <div className="absolute top-3 right-4 px-2.5 py-1 rounded-xl border border-white/10 backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.40)' }}>
            <p className="text-white/70 text-[11px] font-semibold">{standings.length || league.member_count || 0} players</p>
          </div>

          {/* League name + period + toggle */}
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl leading-none">🏆</span>
              <div>
                <p className="font-black text-base leading-tight text-white drop-shadow-sm">{league.name}</p>
                <p className="text-white/50 text-[11px] leading-tight">{allTime ? 'All Time' : (period?.name || 'This Period')}</p>
              </div>
            </div>
            <PeriodToggle allTime={allTime} onChange={setAllTime} />
          </div>
        </div>
      </div>

      {/* ── Prize pool strip ── */}
      {prizes.length > 0 && (
        <div className="flex-shrink-0 border-b border-white/5">
          <div className="max-w-md mx-auto px-4 py-2 flex flex-wrap gap-2">
            {prizes.map((p, i) => {
              const icons = ['🥇','🥈','🥉','4️⃣','5️⃣']
              return (
                <div key={i} className="flex items-center gap-1.5 bg-amber-500/8 border border-amber-500/15 rounded-xl px-2.5 py-1.5">
                  <span className="text-sm">{icons[i] || '🏅'}</span>
                  <div>
                    <p className="text-amber-300 font-black text-xs leading-none">€{parseFloat(p.amount_euros).toFixed(0)}</p>
                    <p className="text-amber-700 text-[9px]">{['1st','2nd','3rd','4th','5th'][i]}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Tiebreaker note ── */}
      <div className="flex-shrink-0 border-b border-white/5">
        <p className="max-w-md mx-auto px-4 py-2 text-[9px] text-gray-600">
          ⚡ Tiebreaker: equal points → more correct picks ranks higher
        </p>
      </div>

      {/* ── Scrollable standings list ── */}
      <div className="flex-1 overflow-y-auto" style={{ overscrollBehaviorY: 'contain' }}>
        <div className="max-w-md mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'rgba(168,85,247,0.8)', borderTopColor: 'transparent' }} />
            </div>
          ) : standings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-2">
              <span className="text-5xl">🏆</span>
              <p className="text-gray-300 text-sm font-semibold">No standings yet</p>
              <p className="text-gray-600 text-xs mt-0.5">Appears once gameweeks are settled</p>
            </div>
          ) : (
            standings.map((row, i) => {
              const rank = i + 1
              const isMe = row.user_id === myUserId
              return (
                <div
                  key={row.user_id}
                  ref={isMe ? myRowRef : null}
                  className={`w-full flex items-center gap-3 border-b relative ${isMe ? 'px-4 py-3' : 'px-4 py-2.5'}`}
                  style={isMe ? {
                    background:  'linear-gradient(90deg, rgba(88,28,135,0.35) 0%, rgba(88,28,135,0.15) 60%, transparent 100%)',
                    borderColor: 'rgba(168,85,247,0.35)',
                    boxShadow:   'inset 0 0 40px -10px rgba(168,85,247,0.2)',
                  } : { borderColor: 'rgba(255,255,255,0.04)' }}
                >
                  {/* Left bar */}
                  {isMe && <span className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full bg-purple-500" />}

                  {/* Rank */}
                  <span className={`text-center font-black flex-shrink-0 ${isMe ? 'w-8 text-base text-purple-300' : 'w-7 text-sm'} ${
                    !isMe ? (rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-gray-300' : rank === 3 ? 'text-amber-600' : 'text-gray-600') : ''
                  }`}>{rank}</span>

                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <LeagueAvatar row={row} isMe={isMe} />
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
                      {row.division_name && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full border flex-shrink-0 bg-white/4 border-white/8 text-gray-500">
                          {row.division_name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className={`font-semibold ${isMe ? 'text-[11px] text-green-400' : 'text-[10px] text-green-400'}`}>
                        {row.correct_picks ?? 0}✓
                      </span>
                      <span className="text-[10px] text-gray-600">·</span>
                      <span className={`${isMe ? 'text-[11px] text-gray-400' : 'text-[10px] text-gray-400'}`}>
                        {row.gameweeks_played ?? 0} GW
                      </span>
                    </div>
                  </div>

                  {/* Points */}
                  <div className="flex-shrink-0 text-right">
                    <span
                      className={`font-black tabular-nums ${isMe ? 'text-xl text-white' : 'text-base text-indigo-300'}`}
                      style={isMe ? { textShadow: '0 0 16px rgba(168,85,247,0.6)' } : {}}
                    >
                      {row.total_points}
                    </span>
                    <p className={`font-normal ${isMe ? 'text-[11px] text-purple-400/70' : 'text-[10px] text-gray-500'}`}>pts</p>
                  </div>
                </div>
              )
            })
          )}
          {!loading && standings.length > 0 && <div className="pb-32" />}
        </div>
      </div>

      {/* ── Sticky footer: your position ── */}
      {!loading && myIdx >= 0 && (
        <div className="flex-shrink-0 border-t border-white/8" style={{ backdropFilter: 'blur(12px)', background: 'rgba(10,13,18,0.95)' }}>
          <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-white text-xs font-semibold">Your position</p>
              <p className="text-purple-400 text-[11px] mt-0.5">#{myIdx + 1} of {standings.length}</p>
            </div>
            <div className="text-right">
              <p className="font-black text-2xl leading-none text-white">{standings[myIdx]?.total_points}</p>
              <p className="text-[10px] text-gray-500">pts</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MyLeaguesScreen({ onSelectLeague }) {
  const [leagues, setLeagues] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyLeagues()
      .then(r => setLeagues(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[#0a0d12]">
      {/* Spacer so content starts below the fixed tab bar */}
      <div className="flex-shrink-0" style={{ height: 'calc(env(safe-area-inset-top) + 44px)' }} />
      <div className="flex-1 overflow-y-auto" style={{ overscrollBehaviorY: 'contain' }}>
        <div className="max-w-md mx-auto px-4 py-4 pb-32 space-y-3">
          {loading ? (
            <div className="flex justify-center py-20"><Spinner size={28} /></div>
          ) : leagues.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-3xl mb-3">🏆</p>
              <p className="text-white font-bold text-base">No leagues yet</p>
              <p className="text-gray-500 text-sm mt-1">Join or create a league from the Leagues tab</p>
            </div>
          ) : leagues.map(l => (
            <button key={l.id} onClick={() => onSelectLeague(l)}
              className="w-full flex items-center gap-4 bg-[#0d1117] border border-white/8 rounded-2xl p-4 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all active:scale-[0.99] text-left">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                {l.image_url ? <img src={l.image_url} alt="" className="w-full h-full object-cover rounded-xl" /> : '🏆'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-white font-bold text-sm truncate">{l.name}</p>
                  {l.role === 'admin' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold flex-shrink-0">Admin</span>}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>👥 {l.member_count} members</span>
                  {l.current_period && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${l.current_period.status === 'live' ? 'bg-green-500/15 text-green-400' : 'bg-gray-500/15 text-gray-400'}`}>
                      {l.current_period.name}
                    </span>
                  )}
                </div>
              </div>
              <svg className="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function DivisionsPage() {
  const [divisions,      setDivisions]      = useState([])
  const [myStatus,       setMyStatus]       = useState(null)
  const [loading,        setLoading]        = useState(true)
  const [section,        setSection]        = useState('leagues')  // 'global' | 'leagues'
  const [selectedLeague, setSelectedLeague] = useState(null)

  useEffect(() => {
    Promise.all([getGloryDivisions(), getGloryStatus(), getMyLeagues()])
      .then(([divsRes, statusRes, leaguesRes]) => {
        const sorted  = [...divsRes.data].sort((a, b) => a.display_order - b.display_order)
        const leagues = leaguesRes.data || []
        setDivisions(sorted)
        setMyStatus(statusRes.data)
        if (leagues.length === 0) setSection('global')
        else if (leagues.length === 1) setSelectedLeague(leagues[0])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-[#0a0d12] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const myUserId   = myStatus?.user?.id
  const myDivId    = myStatus?.division?.division_id
  const sprintId   = myStatus?.sprint?.id
  const sprintName = myStatus?.sprint?.name
  const myDiv      = divisions.find(d => d.id === myDivId) ?? null
  const isGwLocked = (myStatus?.sprint?.gameweeks ?? []).some(g => g.status === 'LOCKED')

  const showTabBar = !selectedLeague

  return (
    <>
      {/* ── Section tab bar ─────────────────────────────────────────────────── */}
      {showTabBar && (
        <div
          className="fixed top-0 inset-x-0 z-[70] border-b border-white/6"
          style={{ paddingTop: 'env(safe-area-inset-top)', backdropFilter: 'blur(14px)', background: 'rgba(10,13,18,0.88)' }}
        >
          <div className="max-w-md mx-auto px-4 py-2 flex gap-1">
            {[
              { key: 'global',  label: 'Global' },
              { key: 'leagues', label: 'My Leagues' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setSection(key); setSelectedLeague(null) }}
                className={`flex-1 py-2 px-3 rounded-xl text-sm font-bold transition-colors ${
                  section === key ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Global rankings ─────────────────────────────────────────────────── */}
      {section === 'global' && (
        <RankingsScreen
          sprintId={sprintId}
          sprintName={sprintName}
          myUserId={myUserId}
          myDiv={myDiv}
          totalPlayers={divisions.length}
          isGwLocked={isGwLocked}
        />
      )}

      {/* ── My Leagues rankings ─────────────────────────────────────────────── */}
      {section === 'leagues' && !selectedLeague && (
        <MyLeaguesScreen onSelectLeague={setSelectedLeague} />
      )}
      {section === 'leagues' && selectedLeague && (
        <LeagueStandingsView
          league={selectedLeague}
          myUserId={myUserId}
          onBack={() => setSelectedLeague(null)}
        />
      )}
    </>
  )
}
