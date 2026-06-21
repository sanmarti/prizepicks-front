import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyRelevantSprints, getSprintDetail } from '../api/glory'
import BottomNav from '../components/layout/BottomNav'

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtShort(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

const EVENT_LABELS = {
  MATCH_RESULT: 'Result', GOALS: 'Goals', CLEAN_SHEET: 'Clean sheet',
  BTTS: 'BTTS', PLAYER_SCORE: 'Player scores', CORNER_OVER: 'Corners',
}

const OUTCOME = {
  promoted:  { bg: 'from-green-950/60 to-green-900/20',  border: 'border-green-500/25', badge: 'bg-green-900/50 text-green-300 border-green-500/40', label: '⬆ Promoted' },
  retained:  { bg: 'from-white/4 to-white/0',            border: 'border-white/10',     badge: 'bg-white/10 text-gray-400 border-white/15',          label: '= Retained' },
  relegated: { bg: 'from-red-950/50 to-red-900/10',      border: 'border-red-500/20',   badge: 'bg-red-900/40 text-red-300 border-red-500/30',        label: '⬇ Relegated' },
  pending:   { bg: 'from-indigo-950/40 to-indigo-900/10',border: 'border-indigo-500/25',badge: 'bg-indigo-900/40 text-indigo-300 border-indigo-500/30',label: '🔴 Live' },
}

// ── Full-screen Division Rankings ──────────────────────────────────────────────
function RankingsScreen({ sprint, division, rankings, myUserId, onClose }) {
  const promLP = division?.promotion_min_points ?? null
  const relLP  = division?.relegation_max_points ?? null

  const lastPromoIdx = promLP !== null ? (() => {
    let idx = -1
    rankings.forEach((r, i) => { if (r.total_league_points >= promLP) idx = i })
    return idx
  })() : -1
  const firstRelIdx = relLP !== null ? rankings.findIndex(r => r.total_league_points <= relLP) : -1
  const myIdx = rankings.findIndex(r => r.user_id === myUserId)
  const myRow = rankings[myIdx]

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0d12] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-3 border-b border-white/8">
        <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/6 flex items-center justify-center text-gray-300 hover:bg-white/10">
          ←
        </button>
        <div>
          <p className="text-white font-bold text-base">{division?.name || 'Division'} Rankings</p>
          <p className="text-gray-500 text-xs">{sprint?.name}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-gray-500 text-xs">{rankings.length} players</p>
        </div>
      </div>

      {/* Zone legend */}
      <div className="flex gap-2 px-4 py-2.5 border-b border-white/5">
        <span className="flex items-center gap-1 text-[10px] text-green-400"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Promotion ≥{promLP ?? '?'} LP</span>
        <span className="flex items-center gap-1 text-[10px] text-gray-500 ml-auto"><span className="w-2 h-2 rounded-full bg-gray-600 inline-block" /> Retained</span>
        <span className="flex items-center gap-1 text-[10px] text-red-400"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Relegation ≤{relLP ?? '?'} LP</span>
      </div>

      {/* Rankings list */}
      <div className="flex-1 overflow-y-auto pb-6">
        {rankings.map((row, i) => {
          const isPromo = promLP !== null && row.total_league_points >= promLP
          const isRel   = relLP  !== null && row.total_league_points <= relLP
          const isMe    = row.user_id === myUserId
          const rank    = Number(row.rank)
          return (
            <div key={row.user_id}>
              {/* Green zone divider */}
              {lastPromoIdx === i - 1 && i > 0 && (
                <div className="flex items-center gap-2 px-4 py-1">
                  <div className="flex-1 h-px bg-green-500/20" />
                  <span className="text-[9px] text-green-600 tracking-widest font-semibold">PROMOTION LINE</span>
                  <div className="flex-1 h-px bg-green-500/20" />
                </div>
              )}
              {/* Red zone divider */}
              {firstRelIdx === i && i > 0 && (
                <div className="flex items-center gap-2 px-4 py-1">
                  <div className="flex-1 h-px bg-red-500/15" />
                  <span className="text-[9px] text-red-600 tracking-widest font-semibold">RELEGATION LINE</span>
                  <div className="flex-1 h-px bg-red-500/15" />
                </div>
              )}
              <div className={`flex items-center gap-3 px-4 py-3 ${
                isMe   ? 'bg-indigo-900/20' :
                isPromo ? 'bg-green-950/15' :
                isRel   ? 'bg-red-950/12'  : ''
              }`}>
                <span className={`w-7 text-center text-sm font-black flex-shrink-0 ${
                  rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-gray-300' : rank === 3 ? 'text-amber-600' : 'text-gray-600'
                }`}>{rank}</span>
                {row.avatar_url
                  ? <img src={row.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  : <div className="w-8 h-8 rounded-full bg-indigo-900/50 flex items-center justify-center text-xs text-indigo-300 font-bold flex-shrink-0">
                      {(row.display_name || '?')[0].toUpperCase()}
                    </div>
                }
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isMe ? 'text-white' : 'text-gray-200'}`}>
                    {row.display_name || 'Player'}{isMe && <span className="text-indigo-400 text-xs ml-1">← you</span>}
                  </p>
                  <p className="text-gray-600 text-[10px]">{row.total_correct_picks ?? 0} correct · {row.perfect_weeks ?? 0} ⭐</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-black text-base ${isPromo ? 'text-green-400' : isRel ? 'text-red-400' : 'text-indigo-400'}`}>
                    {row.total_league_points}
                  </p>
                  <p className="text-gray-700 text-[10px]">LP</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* My position footer */}
      {myRow && (
        <div className="border-t border-white/8 px-4 py-3 flex items-center gap-3 bg-[#0a0d12]">
          <span className="text-xs text-gray-500">Your position</span>
          <span className="text-indigo-400 font-bold text-sm">#{myRow.rank}</span>
          <span className="text-indigo-400 font-black text-lg ml-auto">{myRow.total_league_points} LP</span>
          {promLP !== null && myRow.total_league_points < promLP && (
            <span className="text-green-400 text-xs">{promLP - myRow.total_league_points} to promo</span>
          )}
        </div>
      )}
    </div>
  )
}

// ── Per-gameweek picks tab ─────────────────────────────────────────────────────
function GameweekTab({ gw, isLive }) {
  const entry = gw.entry
  const picks = gw.picks || []
  const noEntry = !entry

  if (gw.status === 'DRAFT') {
    return (
      <div className="text-center py-8 text-gray-700 text-sm">
        Gameweek not published yet
      </div>
    )
  }

  if (noEntry) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 text-sm font-medium">No picks submitted</p>
        {gw.status === 'PUBLISHED' && (
          <p className="text-gray-700 text-xs mt-1">Picks are still open</p>
        )}
      </div>
    )
  }

  const wonCount  = picks.filter(p => p.option_result === 'WON').length
  const lostCount = picks.filter(p => p.option_result === 'LOST').length
  const pending   = picks.filter(p => !p.option_result || p.option_result === 'PENDING').length
  const lp        = entry.league_points ?? 0

  return (
    <div className="space-y-3 py-1">
      {/* Summary bar */}
      <div className="flex gap-2">
        <div className="flex-1 bg-green-950/30 border border-green-500/20 rounded-xl py-2.5 text-center">
          <p className="text-green-400 font-black text-xl">{entry.correct_picks ?? wonCount}</p>
          <p className="text-gray-600 text-[10px]">Correct</p>
        </div>
        <div className="flex-1 bg-red-950/15 border border-red-500/15 rounded-xl py-2.5 text-center">
          <p className="text-red-400 font-black text-xl">{entry.incorrect_picks ?? lostCount}</p>
          <p className="text-gray-600 text-[10px]">Wrong</p>
        </div>
        <div className="flex-1 bg-indigo-950/30 border border-indigo-500/20 rounded-xl py-2.5 text-center">
          <p className="text-indigo-400 font-black text-xl">{lp}</p>
          <p className="text-gray-600 text-[10px]">LP</p>
        </div>
        {entry.is_perfect_week && (
          <div className="flex-1 bg-yellow-900/25 border border-yellow-500/25 rounded-xl py-2.5 text-center">
            <p className="text-yellow-400 text-xl">⭐</p>
            <p className="text-yellow-600 text-[10px]">Perfect</p>
          </div>
        )}
      </div>

      {/* Picks list */}
      {picks.map((pick, i) => {
        const won  = pick.option_result === 'WON'
        const lost = pick.option_result === 'LOST'
        const pend = !pick.option_result || pick.option_result === 'PENDING'
        return (
          <div key={i} className={`rounded-xl border px-3 py-2.5 flex items-center gap-3 ${
            won  ? 'bg-green-950/20 border-green-500/20' :
            lost ? 'bg-red-950/15 border-red-500/15' :
                   'bg-white/3 border-white/6'
          }`}>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-sm ${
              won  ? 'bg-green-500/20 text-green-400' :
              lost ? 'bg-red-500/15 text-red-400' :
                     'bg-white/8 text-gray-500'
            }`}>
              {won ? '✓' : lost ? '✗' : '·'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-400 text-[10px] font-medium">{EVENT_LABELS[pick.event_type] || pick.event_type} · {pick.fixture_name}</p>
              <p className={`text-sm font-semibold mt-0.5 ${won ? 'text-green-300' : lost ? 'text-red-400' : 'text-white'}`}>
                {pick.option_label}
              </p>
            </div>
            {pick.energy_cost && (
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                won ? 'bg-green-500/20 text-green-400' : lost ? 'bg-white/5 text-gray-600' : 'bg-white/8 text-gray-500'
              }`}>⚡{pick.energy_cost}</span>
            )}
          </div>
        )
      })}
      {pending > 0 && picks.length > 0 && (
        <p className="text-center text-gray-700 text-xs">{pending} result{pending > 1 ? 's' : ''} pending</p>
      )}
    </div>
  )
}

// ── Sprint detail full-screen ──────────────────────────────────────────────────
function SprintDetailScreen({ sprintSummary, myUserId, onClose }) {
  const [detail, setDetail]     = useState(null)
  const [loading, setLoading]   = useState(true)
  const [activeWeek, setActiveWeek] = useState(1)
  const [showRankings, setShowRankings] = useState(false)

  useEffect(() => {
    setLoading(true)
    getSprintDetail(sprintSummary.id)
      .then(r => {
        setDetail(r.data)
        const currentGw = r.data.gameweeks?.find(g => g.status === 'PUBLISHED' || g.status === 'LOCKED')
        if (currentGw) setActiveWeek(currentGw.sprint_week)
        else if (r.data.gameweeks?.length) setActiveWeek(r.data.gameweeks[0].sprint_week)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [sprintSummary.id])

  const sprint   = detail?.sprint || sprintSummary
  const progress = detail?.progress
  const division = detail?.division
  const rankings = detail?.rankings || []
  const gameweeks = detail?.gameweeks || []
  const outcome = progress?.sprint_outcome ?? (sprintSummary.status === 'live' ? 'pending' : null)
  const oc = outcome ? (OUTCOME[outcome] || OUTCOME.pending) : null
  const gwCount = sprint.gameweek_count || 4
  const isLive  = sprint.status === 'live'

  const myRank    = rankings.find(r => r.user_id === myUserId)
  const myLP      = progress?.total_league_points ?? 0
  const promLP    = division?.promotion_min_points ?? null
  const relLP     = division?.relegation_max_points ?? null
  const myIsPromo = promLP !== null && myLP >= promLP
  const myIsRel   = relLP  !== null && myLP <= relLP

  if (showRankings && detail) {
    return (
      <RankingsScreen
        sprint={sprint}
        division={division}
        rankings={rankings}
        myUserId={myUserId}
        onClose={() => setShowRankings(false)}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0d12] flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto pb-6">
        {/* Hero */}
        <div className={`relative bg-gradient-to-b ${oc?.bg || 'from-white/4 to-transparent'} px-4 pt-5 pb-6 border-b ${oc?.border || 'border-white/8'}`}>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-black/30 flex items-center justify-center text-gray-300 mb-4">
            ←
          </button>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-xs tracking-widest uppercase mb-1">Sprint</p>
              <h1 className="text-white font-black text-2xl leading-tight">{sprint.name}</h1>
              <p className="text-gray-500 text-sm mt-1">{fmtDate(sprint.start_date)} → {fmtDate(sprint.end_date)}</p>
              {division && (
                <p className="text-gray-400 text-sm mt-1 font-medium">{division.icon} {division.name}</p>
              )}
            </div>
            {oc && (
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full border flex-shrink-0 ml-3 ${oc.badge}`}>
                {oc.label}
              </span>
            )}
          </div>

          {/* Gameweek progress dots */}
          <div className="flex gap-2 mt-5">
            {Array.from({ length: gwCount }, (_, i) => {
              const gw = gameweeks[i]
              const done   = gw?.status === 'FINISHED'
              const locked = gw?.status === 'LOCKED'
              const open   = gw?.status === 'PUBLISHED'
              return (
                <div key={i} className="flex-1 flex flex-col gap-1">
                  <div className={`h-1.5 rounded-full ${done ? 'bg-indigo-500' : locked ? 'bg-yellow-500/60' : open ? 'bg-green-500/60' : 'bg-white/10'}`} />
                  <p className="text-gray-700 text-[9px] text-center">W{i + 1}</p>
                </div>
              )
            })}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-gray-600 text-sm">
            <div className="w-4 h-4 border border-gray-700 border-t-indigo-400 rounded-full animate-spin" />
            Loading…
          </div>
        ) : (
          <div className="px-4 space-y-5 pt-5">
            {/* Stats row */}
            {progress ? (
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#0d1117] border border-white/8 rounded-2xl py-3 text-center">
                  <p className={`font-black text-2xl ${myIsPromo ? 'text-green-400' : myIsRel ? 'text-red-400' : 'text-indigo-400'}`}>{myLP}</p>
                  <p className="text-gray-600 text-[10px] mt-0.5">League Points</p>
                </div>
                <div className="bg-[#0d1117] border border-white/8 rounded-2xl py-3 text-center">
                  <p className="text-white font-black text-2xl">{progress.total_correct_picks ?? 0}</p>
                  <p className="text-gray-600 text-[10px] mt-0.5">Correct picks</p>
                </div>
                <div className="bg-[#0d1117] border border-white/8 rounded-2xl py-3 text-center">
                  <p className="text-yellow-400 font-black text-2xl">{progress.perfect_weeks ?? 0}</p>
                  <p className="text-gray-600 text-[10px] mt-0.5">Perfect weeks</p>
                </div>
              </div>
            ) : (
              <div className="bg-white/3 border border-white/6 rounded-2xl px-4 py-4 text-center">
                <p className="text-gray-500 text-sm">No picks submitted this sprint</p>
              </div>
            )}

            {/* Zone status */}
            {progress && (myIsPromo || myIsRel) && (
              <div className={`rounded-xl border px-4 py-3 flex items-center justify-between ${
                myIsPromo ? 'bg-green-950/20 border-green-500/25' : 'bg-red-950/15 border-red-500/20'
              }`}>
                <span className={`text-sm font-semibold ${myIsPromo ? 'text-green-300' : 'text-red-300'}`}>
                  {myIsPromo ? '⬆ Promotion zone' : '⬇ Relegation zone'}
                </span>
                {myRank && <span className={`font-bold text-sm ${myIsPromo ? 'text-green-400' : 'text-red-400'}`}>#{myRank.rank}</span>}
              </div>
            )}
            {progress && !myIsPromo && !myIsRel && myRank && (
              <div className="bg-white/3 border border-white/6 rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-gray-400 text-sm">Your rank in division</span>
                <span className="text-indigo-400 font-bold">#{myRank.rank}</span>
              </div>
            )}

            {/* Rankings button */}
            {rankings.length > 0 && (
              <button
                onClick={() => setShowRankings(true)}
                className="w-full bg-[#0d1117] border border-white/8 rounded-2xl px-4 py-4 flex items-center justify-between hover:bg-white/4 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-900/40 flex items-center justify-center text-base">🏆</div>
                  <div className="text-left">
                    <p className="text-white font-semibold text-sm">Division Rankings</p>
                    <p className="text-gray-500 text-xs">{rankings.length} players · {division?.name}</p>
                  </div>
                </div>
                <span className="text-gray-500 text-sm">→</span>
              </button>
            )}

            {/* Gameweek picks history */}
            {gameweeks.length > 0 && (
              <div>
                <p className="text-gray-500 text-[11px] font-semibold tracking-widest uppercase mb-3">Gameweek picks</p>

                {/* Week tabs */}
                <div className="flex gap-1.5 mb-4">
                  {gameweeks.map(gw => {
                    const active = gw.sprint_week === activeWeek
                    const hasEntry = !!gw.entry
                    const correct = gw.entry?.correct_picks ?? null
                    return (
                      <button
                        key={gw.sprint_week}
                        onClick={() => setActiveWeek(gw.sprint_week)}
                        className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 rounded-xl border text-[11px] font-semibold transition-all ${
                          active
                            ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                            : hasEntry
                              ? 'bg-white/5 border-white/10 text-gray-400 hover:text-gray-200'
                              : 'bg-white/2 border-white/5 text-gray-700'
                        }`}
                      >
                        <span>W{gw.sprint_week}</span>
                        {hasEntry && correct !== null
                          ? <span className={`text-[9px] font-bold ${correct === 6 ? 'text-yellow-400' : correct >= 4 ? 'text-green-400' : correct >= 2 ? 'text-gray-400' : 'text-red-400'}`}>{correct}/6</span>
                          : <span className="text-[9px] text-gray-700">{gw.status === 'DRAFT' ? '–' : 'N/A'}</span>
                        }
                      </button>
                    )
                  })}
                </div>

                {/* Active week picks */}
                {gameweeks.filter(g => g.sprint_week === activeWeek).map(gw => (
                  <GameweekTab key={gw.id} gw={gw} isLive={isLive} />
                ))}
              </div>
            )}

            {/* Go to current gameweek CTA */}
            {isLive && (
              <div className="pt-1">
                <a href="/" className="block w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm text-center transition-colors shadow-lg shadow-indigo-500/20">
                  Go to current Gameweek →
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sprint list card ───────────────────────────────────────────────────────────
function SprintCard({ sprint, isCurrent, isUpcoming, onEnter }) {
  const lp      = sprint.total_league_points ?? null
  const outcome = sprint.sprint_outcome ?? (isCurrent ? 'pending' : null)
  const oc      = outcome ? (OUTCOME[outcome] || OUTCOME.pending) : null
  const gwActive = sprint.active_gameweeks ?? 0
  const gwTotal  = sprint.gameweek_count   ?? 4

  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-all ${oc ? `bg-gradient-to-b ${oc.bg} ${oc.border}` : 'bg-[#0d1117] border-white/8'}`}
    >
      <div className="px-4 pt-4 pb-3">
        {/* Top row */}
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-white font-bold text-sm">{sprint.name}</p>
              {isCurrent && <span className="text-[9px] bg-green-900/50 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full font-bold tracking-wider">LIVE</span>}
              {isUpcoming && <span className="text-[9px] bg-white/8 text-gray-500 px-2 py-0.5 rounded-full">UPCOMING</span>}
            </div>
            <p className="text-gray-600 text-[11px] mt-0.5">{fmtShort(sprint.start_date)} – {fmtShort(sprint.end_date)}</p>
            {sprint.division_name && (
              <p className="text-gray-400 text-[11px] mt-0.5">{sprint.division_icon} {sprint.division_name}</p>
            )}
          </div>
          {oc && (
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex-shrink-0 ml-2 ${oc.badge}`}>
              {oc.label}
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="flex gap-1 mb-3">
          {Array.from({ length: gwTotal }, (_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i < gwActive ? 'bg-indigo-500' : 'bg-white/8'}`} />
          ))}
        </div>

        {/* Stats row */}
        {!isUpcoming && lp !== null ? (
          <div className="flex gap-2 text-center">
            <div className="flex-1">
              <p className="text-indigo-400 font-black text-lg">{lp}</p>
              <p className="text-gray-700 text-[10px]">LP</p>
            </div>
            <div className="w-px bg-white/5" />
            <div className="flex-1">
              <p className="text-white font-bold text-lg">{sprint.total_correct_picks ?? 0}</p>
              <p className="text-gray-700 text-[10px]">Correct</p>
            </div>
            <div className="w-px bg-white/5" />
            <div className="flex-1">
              <p className="text-yellow-400 font-bold text-lg">{sprint.perfect_weeks ?? 0}</p>
              <p className="text-gray-700 text-[10px]">⭐ Perfect</p>
            </div>
          </div>
        ) : isUpcoming ? (
          <p className="text-gray-700 text-xs text-center py-1">Gameweeks coming soon</p>
        ) : (
          <p className="text-gray-600 text-xs py-1">No picks submitted</p>
        )}
      </div>

      {/* Enter button */}
      <button
        onClick={() => onEnter(sprint)}
        className={`w-full py-3 border-t text-sm font-semibold transition-colors ${
          isCurrent
            ? 'border-indigo-500/20 bg-indigo-600/10 text-indigo-300 hover:bg-indigo-600/20'
            : 'border-white/6 bg-white/2 text-gray-400 hover:bg-white/6 hover:text-white'
        }`}
      >
        {isCurrent ? '⚽ Enter sprint →' : 'View details →'}
      </button>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function MySprintsPage() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [myUserId, setMyUserId] = useState(null)

  useEffect(() => {
    getMyRelevantSprints()
      .then(r => { setData(r.data); if (r.data.user_id) setMyUserId(r.data.user_id) })
      .catch(() => {})
      .finally(() => setLoading(false))

    // Get userId from local storage / auth store
    try {
      const raw = localStorage.getItem('auth-storage')
      if (raw) {
        const parsed = JSON.parse(raw)
        setMyUserId(parsed?.state?.user?.id)
      }
    } catch {}
  }, [])

  const past     = data?.past     || []
  const upcoming = data?.upcoming || []

  const currentSprint   = past.find(s => s.status === 'live' || s.status === 'scheduled')
  const historicSprints = past.filter(s => s !== currentSprint)

  if (loading) return (
    <div className="min-h-screen bg-[#0a0d12] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0d12] text-white pb-24">
      {selected && (
        <SprintDetailScreen
          sprintSummary={selected}
          myUserId={myUserId}
          onClose={() => setSelected(null)}
        />
      )}

      <div className="max-w-md mx-auto px-4 pt-5 space-y-6">
        <div>
          <h1 className="text-white text-xl font-bold">My Sprints</h1>
          <p className="text-gray-500 text-sm mt-0.5">Your competition history</p>
        </div>

        {/* Current sprint */}
        {currentSprint && (
          <section className="space-y-2">
            <p className="text-gray-500 text-[11px] font-semibold tracking-widest uppercase">Current sprint</p>
            <SprintCard sprint={currentSprint} isCurrent onEnter={setSelected} />
          </section>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <section className="space-y-2">
            <p className="text-gray-500 text-[11px] font-semibold tracking-widest uppercase">Upcoming</p>
            {upcoming.map(s => (
              <SprintCard key={s.id} sprint={s} isUpcoming onEnter={setSelected} />
            ))}
          </section>
        )}

        {/* History */}
        {historicSprints.length > 0 && (
          <section className="space-y-2">
            <p className="text-gray-500 text-[11px] font-semibold tracking-widest uppercase">Past sprints</p>
            {historicSprints.map(s => (
              <SprintCard key={s.id} sprint={s} onEnter={setSelected} />
            ))}
          </section>
        )}

        {past.length === 0 && upcoming.length === 0 && (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🏃</p>
            <p className="text-gray-400 font-semibold text-base">No sprints yet</p>
            <p className="text-gray-600 text-sm mt-1">Your first sprint is coming soon.</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
