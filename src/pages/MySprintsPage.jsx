import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyRelevantSprints, getSprintDetail, getGloryGameweek } from '../api/glory'
import BottomNav from '../components/layout/BottomNav'
import SprintClosingPopup from '../components/SprintClosingPopup'

function getPlayerTier(correct, incorrect) {
  const total = (correct || 0) + (incorrect || 0)
  if (total < 10) return null
  const pct = (correct || 0) / total * 100
  if (pct >= 90) return { icon: '🥇', color: 'gold',   label: 'Gold Predictor' }
  if (pct >= 80) return { icon: '🥈', color: 'silver', label: 'Silver Predictor' }
  if (pct >= 70) return { icon: '🥉', color: 'bronze', label: 'Bronze Predictor' }
  return null
}
const TIER_BG = { gold: 'linear-gradient(135deg,#78350f,#b45309)', silver: 'linear-gradient(135deg,#1e293b,#475569)', bronze: 'linear-gradient(135deg,#431407,#9a3412)' }

function TierBadgeSm({ correct, incorrect }) {
  const t = getPlayerTier(correct, incorrect)
  if (!t) return null
  return (
    <span className="absolute -bottom-0.5 -right-0.5 w-[15px] h-[15px] text-[9px] rounded-full border border-[#0a0d12] flex items-center justify-center leading-none pointer-events-none"
      style={{ background: TIER_BG[t.color] }} title={t.label}>{t.icon}</span>
  )
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtShort(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
function fmtWeekday(d) {
  return new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}
function fmtCountdown(target) {
  const diff = new Date(target) - Date.now()
  if (diff <= 0) return null
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}
// Derive Mon–Sun of the calendar week that contains lockTimeStr
function getWeekRange(lockTimeStr) {
  if (!lockTimeStr) return { mon: null, sun: null }
  const lockDt = new Date(lockTimeStr)
  const day = lockDt.getUTCDay() // 0=Sun, 1=Mon … 6=Sat
  const daysToMon = day === 0 ? -6 : 1 - day
  const mon = new Date(lockDt)
  mon.setUTCDate(mon.getUTCDate() + daysToMon)
  mon.setUTCHours(0, 0, 0, 0)
  const sun = new Date(mon)
  sun.setUTCDate(sun.getUTCDate() + 6)
  sun.setUTCHours(23, 59, 59, 999)
  return { mon, sun }
}
// Trust backend status first; fall back to time-based only for data without a real status
function getWeekStatus(lockTimeStr, gwStatus) {
  if (gwStatus === 'FINISHED') return 'FINISHED'
  if (gwStatus === 'LOCKED')   return 'LOCKED'
  if (gwStatus === 'PUBLISHED') return 'PUBLISHED'
  if (gwStatus === 'DRAFT')    return 'DRAFT'
  // Time-based fallback for legacy/mock data without an explicit status
  if (!lockTimeStr) return 'DRAFT'
  const now = new Date()
  const { mon } = getWeekRange(lockTimeStr)
  if (!mon) return 'DRAFT'
  const settle = new Date(mon); settle.setUTCDate(settle.getUTCDate() + 7)
  if (now >= settle) return 'FINISHED'
  if (now >= new Date(lockTimeStr)) return 'LOCKED'
  if (now >= mon) return 'PUBLISHED'
  return 'DRAFT'
}

const EVENT_LABELS = {
  MATCH_RESULT: 'Result', GOALS: 'Goals O/U', CLEAN_SHEET: 'Clean Sheet',
  BTTS: 'BTTS', PLAYER_SCORE: 'Player Scores', CORNER_OVER: 'Corners',
}

const OUTCOME = {
  promoted:  { bg: 'from-green-950/60 to-green-900/20',   border: 'border-green-500/25',  badge: 'bg-green-900/50 text-green-300 border-green-500/40',   label: '⬆ Promoted',  color: '#22c55e' },
  retained:  { bg: 'from-white/4 to-white/0',             border: 'border-white/10',      badge: 'bg-white/10 text-gray-400 border-white/15',            label: '= Retained',   color: '#6b7280' },
  relegated: { bg: 'from-red-950/50 to-red-900/10',       border: 'border-red-500/20',    badge: 'bg-red-900/40 text-red-300 border-red-500/30',         label: '⬇ Relegated', color: '#ef4444' },
  pending:   { bg: 'from-indigo-950/40 to-indigo-900/10', border: 'border-indigo-500/25', badge: 'bg-green-900/40 text-green-300 border-green-500/30',   label: '● Live',      color: '#6366f1' },
}

const TEAM_LOGOS = {
  Arsenal:42,Chelsea:49,Liverpool:40,'Man City':50,'Manchester City':50,
  'Man United':33,'Manchester United':33,Tottenham:47,Spurs:47,Brighton:51,
  Newcastle:34,'Aston Villa':66,Fulham:36,Everton:45,'West Ham':48,
  Wolves:39,Southampton:41,Brentford:55,
  Barcelona:529,'Real Madrid':541,Atletico:530,Sevilla:536,Villarreal:533,
  Getafe:546,Osasuna:727,Granada:715,'Athletic Bilbao':531,'Real Sociedad':548,
  'Real Betis':543,Rayo:728,Espanyol:532,Valencia:532,
  'Bayern Munich':157,Bayern:157,'Borussia Dortmund':165,BVB:165,Dortmund:165,
  Leverkusen:168,'Bayer Leverkusen':168,Leipzig:173,Stuttgart:172,Freiburg:160,
  'Werder Bremen':162,Wolfsburg:161,Hoffenheim:167,Augsburg:170,Frankfurt:169,
  PSG:85,Lyon:80,Marseille:81,Monaco:91,Nice:84,Lille:79,Lens:116,
  Brest:1273,Strasbourg:95,Reims:93,Rennes:94,
  Inter:505,'Inter Milan':505,Juventus:496,'AC Milan':489,Napoli:492,
  Roma:497,Lazio:487,Atalanta:499,Fiorentina:502,Bologna:500,Sassuolo:488,
}
function getTeamLogoUrl(name) {
  if (!name) return null
  for (const [key, id] of Object.entries(TEAM_LOGOS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) {
      return `https://media.api-sports.io/football/teams/${id}.png`
    }
  }
  return null
}

// ── Full-screen Division Rankings ──────────────────────────────────────────────
function RankingsScreen({ sprint, division, rankings, myUserId, onClose, onUserClick, isGwLocked }) {
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
      <div className="flex-shrink-0 border-b border-white/8">
        <div className="max-w-md mx-auto flex items-center gap-3 px-4 pt-5 pb-3">
          <button onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/6 flex items-center justify-center text-gray-300 hover:bg-white/10 flex-shrink-0">
            ←
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-base leading-tight">{division?.name || 'Division'} — Final Rankings</p>
            {sprint?.name && <p className="text-gray-500 text-xs mt-0.5">{sprint.name}</p>}
          </div>
          {rankings.length > 0 && (
            <p className="text-gray-500 text-xs flex-shrink-0">{rankings.length} players</p>
          )}
        </div>
      </div>

      {/* Zone legend */}
      {(promLP !== null || relLP !== null) && (
        <div className="flex-shrink-0 border-b border-white/5">
          <div className="max-w-md mx-auto flex items-center gap-3 px-4 py-2">
            {promLP !== null && (
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
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-6">
        <div className="max-w-md mx-auto">
          {rankings.map((row, i) => {
            const isPromo = promLP !== null && row.total_league_points >= promLP
            const isRel   = relLP  !== null && row.total_league_points <= relLP
            const isMe    = row.user_id === myUserId
            const rank    = Number(row.rank)
            return (
              <div key={row.user_id}>
                {lastPromoIdx === i - 1 && i > 0 && (
                  <div className="flex items-center gap-2 px-4 py-1">
                    <div className="flex-1 h-px bg-green-500/20" />
                    <span className="text-[9px] text-green-600 tracking-widest font-semibold">PROMOTION LINE</span>
                    <div className="flex-1 h-px bg-green-500/20" />
                  </div>
                )}
                {firstRelIdx === i && i > 0 && (
                  <div className="flex items-center gap-2 px-4 py-1">
                    <div className="flex-1 h-px bg-red-500/15" />
                    <span className="text-[9px] text-red-600 tracking-widest font-semibold">RELEGATION LINE</span>
                    <div className="flex-1 h-px bg-red-500/15" />
                  </div>
                )}
                <div className={`relative flex items-center gap-3 border-b ${
                  isMe ? 'px-4 py-4 border-purple-500/30' : 'px-4 py-2.5 border-white/4'
                } ${
                  !isMe && isPromo ? 'bg-green-950/15' : !isMe && isRel ? 'bg-red-950/12' : ''
                }`}
                  style={isMe ? {
                    background: 'linear-gradient(90deg, rgba(88,28,135,0.45) 0%, rgba(88,28,135,0.2) 60%, transparent 100%)',
                    boxShadow: 'inset 0 0 40px -10px rgba(168,85,247,0.25)',
                  } : {}}>

                  {isMe
                    ? <span className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full bg-purple-500" />
                    : (isPromo || isRel) && <span className={`absolute left-0 top-0 bottom-0 w-0.5 ${isPromo ? 'bg-green-500' : 'bg-red-500'}`} />
                  }

                  <span className={`text-center font-black flex-shrink-0 ${
                    isMe ? 'w-8 text-base text-purple-300' :
                    `w-7 text-sm ${rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-gray-300' : rank === 3 ? 'text-amber-600' : 'text-gray-600'}`
                  }`}>{rank}</span>

                  <button onClick={() => onUserClick?.(row.user_id)} className="relative flex-shrink-0">
                    {row.avatar_url
                      ? <img src={row.avatar_url} alt="" className={`rounded-full object-cover ${isMe ? 'w-11 h-11' : 'w-8 h-8'}`}
                          style={isMe ? { boxShadow: '0 0 0 2px rgba(168,85,247,0.8), 0 0 16px rgba(168,85,247,0.4)' } : {}} />
                      : <div className={`rounded-full flex items-center justify-center font-bold ${
                          isMe ? 'w-11 h-11 text-base' : 'w-8 h-8 text-xs bg-white/8 text-gray-400'
                        }`} style={isMe ? { background: 'rgba(88,28,135,0.6)', color: '#d8b4fe', boxShadow: '0 0 0 2px rgba(168,85,247,0.7), 0 0 16px rgba(168,85,247,0.35)' } : {}}>
                          {(row.display_name || '?')[0].toUpperCase()}
                        </div>
                    }
                    <TierBadgeSm correct={row.total_correct_picks} incorrect={row.total_incorrect_picks} />
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={`font-semibold truncate ${isMe ? 'text-white text-base' : 'text-gray-300 text-sm'}`}>
                        {row.display_name || 'Player'}
                      </p>
                      {isMe && (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full border border-purple-500/50 bg-purple-900/40 text-purple-300 flex-shrink-0">YOU</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className={`text-[10px] font-semibold text-green-400`}>{row.total_correct_picks ?? 0}✓</span>
                      <span className="text-[10px] text-gray-600">·</span>
                      <span className="text-[10px] text-red-400">{row.total_incorrect_picks ?? 0}✗</span>
                      {(row.pending_picks ?? 0) > 0 && (
                        <>
                          <span className="text-[10px] text-gray-600">·</span>
                          <span className="text-[10px] text-gray-400">{row.pending_picks}{isGwLocked ? '🔒' : '⏳'}</span>
                        </>
                      )}
                      {(row.perfect_weeks ?? 0) > 0 && (
                        <>
                          <span className="text-[10px] text-gray-600">·</span>
                          <span className="text-[10px] text-yellow-500">{row.perfect_weeks}⭐</span>
                        </>
                      )}
                      {(row.energy_used ?? 0) > 0 && (
                        <>
                          <span className="text-[10px] text-gray-600">·</span>
                          <span className="text-[10px] text-orange-400">{row.energy_used}⚡</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className={`font-black tabular-nums ${
                      isMe ? 'text-2xl text-white' : isPromo ? 'text-base text-green-400' : isRel ? 'text-base text-red-400' : 'text-base text-indigo-300'
                    }`} style={isMe ? { textShadow: '0 0 16px rgba(168,85,247,0.6)' } : {}}>
                      {row.total_league_points}
                    </p>
                    <p className={`text-[10px] -mt-0.5 ${isMe ? 'text-purple-400/70' : 'text-gray-600'}`}>LP</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {myRow && (
        <div className="flex-shrink-0 border-t border-white/8" style={{ backdropFilter: 'blur(12px)', background: 'rgba(10,13,18,0.95)' }}>
          <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-white text-xs font-semibold">Your position</p>
              <p className="text-purple-400 text-[11px] mt-0.5">#{myRow.rank} of {rankings.length}</p>
            </div>
            <div className="flex items-center gap-3">
              {promLP !== null && (
                <div className="text-right">
                  <p className="text-[10px] text-gray-500">to promotion</p>
                  <p className="font-bold text-sm text-green-400">
                    {Math.max(0, promLP - (myRow.total_league_points ?? 0))} LP
                  </p>
                </div>
              )}
              <div className="text-right">
                <p className="font-black text-2xl leading-none text-white">{myRow.total_league_points}</p>
                <p className="text-[10px] text-gray-500">LP</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Single event card with logos and score ────────────────────────────────────
function EventCard({ event, myOptionId }) {
  const cleanFixture = (event.fixture_name || '').replace(/\s*\([^)]*\)/g, '').trim()
  const [homeTeam, awayTeam] = cleanFixture.split(' vs ').map(s => s?.trim())
  const typeLabel = EVENT_LABELS[event.event_type] || event.event_type
  const isPlayerScore = event.event_type === 'PLAYER_SCORE'
  const myPicked = !!myOptionId
  const hasScore = event.home_score != null && event.away_score != null
  const homeLogo = getTeamLogoUrl(homeTeam)
  const awayLogo = getTeamLogoUrl(awayTeam)

  return (
    <div className={`rounded-xl border overflow-hidden ${myPicked ? 'border-indigo-500/30' : 'border-white/6'}`}
      style={myPicked ? { background: 'rgba(99,102,241,0.06)' } : { background: 'rgba(255,255,255,0.02)' }}>

      {/* Event header */}
      <div className="px-3 pt-2.5 pb-2 border-b border-white/5">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-[9px] text-gray-600 font-bold tracking-wide uppercase">{typeLabel}</span>
          {myPicked && <span className="text-[9px] font-bold text-indigo-400 bg-indigo-900/30 px-1.5 py-0.5 rounded">YOUR PICK</span>}
        </div>

        {isPlayerScore ? (
          <p className={`text-sm font-semibold ${myPicked ? 'text-white' : 'text-gray-400'}`}>{event.player_name || event.fixture_name}</p>
        ) : (
          <div className="flex items-center gap-2">
            {/* Home team */}
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              {homeLogo && (
                <img src={homeLogo} alt="" className="w-5 h-5 object-contain flex-shrink-0"
                  onError={e => { e.target.style.display = 'none' }} />
              )}
              <span className={`text-xs font-semibold truncate ${myPicked ? 'text-white' : 'text-gray-300'}`}>{homeTeam}</span>
            </div>

            {/* Score or separator */}
            {hasScore ? (
              <div className="flex items-center gap-1 flex-shrink-0 px-1.5 py-0.5 rounded-md bg-white/6">
                <span className="font-mono font-black text-white text-sm leading-none">{event.home_score}</span>
                <span className="text-gray-600 text-[10px] leading-none">–</span>
                <span className="font-mono font-black text-white text-sm leading-none">{event.away_score}</span>
              </div>
            ) : (
              <span className="text-gray-700 text-[10px] flex-shrink-0">vs</span>
            )}

            {/* Away team */}
            <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
              <span className={`text-xs font-semibold truncate text-right ${myPicked ? 'text-white' : 'text-gray-300'}`}>{awayTeam}</span>
              {awayLogo && (
                <img src={awayLogo} alt="" className="w-5 h-5 object-contain flex-shrink-0"
                  onError={e => { e.target.style.display = 'none' }} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Options */}
      <div className="px-3 py-2.5 grid gap-1">
        {event.options.map(opt => {
          const isMe  = opt.id === myOptionId
          const won   = opt.result === 'WON'
          const lost  = opt.result === 'LOST'
          return (
            <div key={opt.id} className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs ${
              isMe && won  ? 'bg-green-900/40 border border-green-500/40 text-green-200' :
              isMe && lost ? 'bg-red-900/30 border border-red-500/30 text-red-300' :
              isMe         ? 'bg-indigo-900/30 border border-indigo-500/30 text-indigo-200' :
              won          ? 'bg-green-950/20 border border-green-500/15 text-green-600' :
                             'border border-white/5 text-gray-600'
            }`}>
              <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] flex-shrink-0 ${
                isMe && won ? 'bg-green-500 text-white' :
                isMe && lost ? 'bg-red-800 text-red-200' :
                isMe ? 'bg-indigo-600 text-white' :
                won  ? 'bg-green-900/60 text-green-500' : 'bg-white/5 text-gray-700'
              }`}>
                {isMe ? '●' : won ? '✓' : ''}
              </span>
              <span className="flex-1 font-medium">{opt.label}</span>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {opt.energy_cost && <span className="text-[9px] font-mono text-gray-700">⚡{opt.energy_cost}</span>}
                {won  && <span className="text-[10px] font-black text-green-400">WON</span>}
                {lost && opt.result && !isMe && <span className="text-[10px] text-gray-700">✗</span>}
                {lost && isMe && <span className="text-[10px] font-bold text-red-400">LOST</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Slot status helper ─────────────────────────────────────────────────────────
// slotStatus: 'live' | 'played' | 'missed' | 'not-available' | 'coming-soon' | 'upcoming'
function computeSlotStatus(gw, weekNum, liveWeekNum, isSprintCompleted) {
  if (!gw) {
    if (isSprintCompleted) return 'not-available'
    if (liveWeekNum == null) return 'upcoming'
    // Sprint is running — any empty future slot hasn't been created yet, mark unavailable
    return 'not-available'
  }
  const st = getWeekStatus(gw.lock_time, gw.status)
  if (st === 'PUBLISHED') {
    // Only the current (live) week is marked live; future weeks with early picks open are upcoming
    return weekNum === liveWeekNum ? 'live' : 'upcoming'
  }
  if (st === 'LOCKED' && weekNum === liveWeekNum) return 'live'
  if (st === 'FINISHED' || st === 'LOCKED') return gw.entry ? 'played' : 'missed'
  // DRAFT with gw data — always upcoming (picks exist but week not open yet)
  if (isSprintCompleted) return 'not-available'
  return 'upcoming'
}

// ── Gameweek section (expandable, fetches all events) ──────────────────────────
function GameweekSection({ gw, weekNum, slotStatus, lpBefore, lpAfter, isOpen: defaultOpen }) {
  const isLiveWeek   = slotStatus === 'live'
  const isExpandable = slotStatus === 'live' || slotStatus === 'played' || slotStatus === 'missed'

  const [expanded, setExpanded]   = useState(defaultOpen ?? isLiveWeek)
  const [gwData,   setGwData]     = useState(null)
  const [loading,  setLoading]    = useState(false)
  const fetched = useRef(false)

  const toggle = () => {
    if (!isExpandable) return
    setExpanded(e => !e)
    if (!fetched.current && gw?.id) {
      fetched.current = true
      setLoading(true)
      getGloryGameweek(gw.id)
        .then(r => setGwData(r.data))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }

  useEffect(() => {
    if (defaultOpen && gw?.id && !fetched.current) {
      fetched.current = true
      setLoading(true)
      getGloryGameweek(gw.id)
        .then(r => setGwData(r.data))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const hasEntry     = !!gw?.entry
  const entry        = gw?.entry
  const participated = hasEntry
  const isFinished   = gw?.status === 'FINISHED' || gw?.status === 'LOCKED'

  const pickMap = {}
  for (const p of gw?.picks || []) {
    if (p.event_id) pickMap[p.event_id] = p.event_option_id
  }
  for (const p of gwData?.my_picks || []) {
    if (p.event_id) pickMap[p.event_id] = p.event_option_id
  }

  const allEvents = gwData?.gameweek?.events || gw?._events || []
  const lpEarned  = entry?.league_points ?? 0
  const correct   = entry?.correct_picks ?? 0
  const incorrect = entry?.incorrect_picks ?? 0
  const isPerfect = entry?.is_perfect_week

  const outerClass = {
    live:            'border-green-500/40 shadow-[0_0_20px_-4px_rgba(34,197,94,0.25)]',
    played:          isPerfect ? 'border-yellow-500/30' : 'border-white/10',
    missed:          'border-red-500/15',
    'not-available': 'border-white/5 opacity-50',
    'coming-soon':   'border-amber-500/20',
    upcoming:        'border-white/5',
  }[slotStatus] ?? 'border-white/6'

  const outerStyle = {
    live:   { background: 'linear-gradient(160deg, rgba(34,197,94,0.05) 0%, rgba(10,13,18,1) 50%)' },
    played: isPerfect ? { background: 'rgba(234,179,8,0.04)' } : {},
  }[slotStatus] ?? {}

  const badgeClass = {
    live:            'bg-green-900/40 border-green-500/50 text-green-300',
    played:          isPerfect ? 'bg-yellow-900/30 border-yellow-500/30 text-yellow-400' : 'bg-indigo-900/30 border-indigo-500/30 text-indigo-300',
    missed:          'bg-red-900/20 border-red-500/20 text-red-400/70',
    'not-available': 'bg-white/3 border-white/5 text-gray-700',
    'coming-soon':   'bg-amber-900/20 border-amber-500/20 text-amber-400/60',
    upcoming:        'bg-white/3 border-white/6 text-gray-700',
  }[slotStatus] ?? 'bg-white/3 border-white/8 text-gray-700'

  const titleClass = {
    live:            'text-green-300',
    played:          'text-white',
    missed:          'text-gray-500',
    'not-available': 'text-gray-700',
    'coming-soon':   'text-amber-400/70',
    upcoming:        'text-gray-600',
  }[slotStatus] ?? 'text-gray-500'

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${outerClass}`} style={outerStyle}>

      {/* ── Live top strip ── */}
      {isLiveWeek && (
        <div className="flex items-center gap-2 px-4 py-2 bg-green-900/20 border-b border-green-500/20">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
          <span className="text-green-400 text-[10px] font-black tracking-widest uppercase">Live — Make your picks now</span>
          {gw?.lock_time && (() => {
            const cd = fmtCountdown(gw.lock_time)
            return cd ? <span className="ml-auto text-yellow-400 text-[10px] font-semibold">Locks in {cd}</span> : null
          })()}
        </div>
      )}

      {/* ── Week header ── */}
      <button
        onClick={toggle}
        className={`w-full px-4 py-4 flex items-center gap-3 text-left ${
          isLiveWeek ? 'hover:bg-green-900/10' : isExpandable ? 'hover:bg-white/2' : 'cursor-default'
        } transition-colors`}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 border ${badgeClass}`}>
          W{weekNum}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className={`text-sm font-bold ${titleClass}`}>Week {weekNum}</p>
            {slotStatus === 'live'          && <span className="text-[9px] bg-green-900/50 text-green-300 border border-green-500/40 px-1.5 py-0.5 rounded-full font-bold">● LIVE</span>}
            {slotStatus === 'played' && isPerfect && <span className="text-[9px] bg-yellow-900/40 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded-full font-bold">⭐ PERFECT</span>}
            {slotStatus === 'missed'        && <span className="text-[9px] bg-red-900/30 text-red-400/80 border border-red-500/20 px-1.5 py-0.5 rounded-full">Missed</span>}
            {slotStatus === 'not-available' && <span className="text-[9px] bg-white/4 text-gray-700 px-1.5 py-0.5 rounded-full">Not available</span>}
            {slotStatus === 'coming-soon'   && <span className="text-[9px] bg-amber-900/30 text-amber-400/70 border border-amber-500/20 px-1.5 py-0.5 rounded-full">Coming soon</span>}
            {slotStatus === 'upcoming'      && <span className="text-[9px] bg-white/4 text-gray-600 px-1.5 py-0.5 rounded-full">Upcoming</span>}
          </div>

          {gw?.lock_time && (() => {
            const { mon, sun } = getWeekRange(gw.lock_time)
            return mon ? (
              <p className="text-gray-600 text-[10px] mt-0.5 font-mono">
                {fmtWeekday(mon)} → {fmtWeekday(sun)}
              </p>
            ) : null
          })()}

          {(slotStatus === 'live' || slotStatus === 'played' || slotStatus === 'missed') && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-gray-600 text-[11px]">{lpBefore} LP</span>
              <span className="text-gray-700 text-[10px]">→</span>
              <span className={`text-[11px] font-semibold ${lpEarned > 0 ? 'text-indigo-300' : 'text-gray-600'}`}>
                {lpAfter} LP
                {lpEarned > 0 && <span className="text-green-400 ml-1">+{lpEarned}</span>}
              </span>
              {participated && (
                <span className="text-gray-700 text-[10px]">· {correct}✓ {incorrect > 0 ? `${incorrect}✗` : ''}</span>
              )}
            </div>
          )}
        </div>

        {isExpandable && (
          <span className={`text-gray-600 text-xs transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>▼</span>
        )}
      </button>

      {/* ── Expanded content ── */}
      {expanded && isExpandable && (
        <div className="border-t border-white/6 px-4 pt-4 pb-4 space-y-3">

          {participated && (
            <div className="flex gap-2">
              <div className="flex-1 bg-green-950/25 border border-green-500/15 rounded-xl py-2.5 text-center">
                <p className="text-green-400 font-black text-xl">{correct}</p>
                <p className="text-gray-600 text-[10px]">Correct</p>
              </div>
              <div className="flex-1 bg-red-950/15 border border-red-500/10 rounded-xl py-2.5 text-center">
                <p className="text-red-400 font-black text-xl">{incorrect}</p>
                <p className="text-gray-600 text-[10px]">Wrong</p>
              </div>
              <div className="flex-1 bg-indigo-950/25 border border-indigo-500/15 rounded-xl py-2.5 text-center">
                <p className="text-indigo-400 font-black text-xl">+{lpEarned}</p>
                <p className="text-gray-600 text-[10px]">LP earned</p>
              </div>
              {isPerfect && (
                <div className="flex-1 bg-yellow-900/20 border border-yellow-500/20 rounded-xl py-2.5 text-center">
                  <p className="text-yellow-400 text-xl">⭐</p>
                  <p className="text-yellow-600 text-[10px]">Perfect</p>
                </div>
              )}
            </div>
          )}

          {!participated && isFinished && (
            <div className="bg-white/3 border border-white/8 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-2xl flex-shrink-0">⏭</span>
              <div>
                <p className="text-gray-500 text-sm font-semibold">Did not participate</p>
                <p className="text-gray-700 text-xs mt-0.5">Here are this week's event results</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8 gap-2 text-gray-600 text-sm">
              <div className="w-4 h-4 border border-gray-700 border-t-indigo-400 rounded-full animate-spin" />
              Loading events…
            </div>
          )}

          {!loading && allEvents.length > 0 && (
            <div className="space-y-2">
              <p className="text-gray-600 text-[10px] font-bold tracking-widest uppercase">
                {allEvents.length} Events · {participated ? 'your picks highlighted' : 'results'}
              </p>
              {allEvents.map(ev => (
                <EventCard key={ev.id} event={ev} myOptionId={pickMap[ev.id] ?? null} />
              ))}
            </div>
          )}

          {!loading && !gwData && gw?.status === 'DRAFT' && (
            <p className="text-center text-gray-700 text-xs py-4">Events not published yet</p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Compact inline rankings strip ──────────────────────────────────────────────
function InlineRankings({ rankings, myUserId, promLP, relLP, onViewFull, division, myDivRank, onUserClick }) {
  if (!rankings?.length) return null
  const myIdx = rankings.findIndex(r => r.user_id === myUserId)
  const top3  = rankings.slice(0, 3)
  const myRow = myIdx >= 0 ? rankings[myIdx] : null
  const showMyRow = myIdx > 2
  const displayRank = myRow ? (myRow.rank ?? myIdx + 1) : myDivRank
  const divLabel = division
    ? `${division.icon ? division.icon + ' ' : ''}${division.name}`
    : null

  return (
    <div className="bg-[#0d1117] border border-white/8 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-bold">Division Ranking</p>
          {divLabel && (
            <p className="text-gray-500 text-[10px] mt-0.5">{divLabel}</p>
          )}
        </div>
        {displayRank != null && (
          <div className="text-center flex-shrink-0">
            <p className="text-indigo-300 font-black text-xl leading-none">#{displayRank}</p>
            <p className="text-gray-600 text-[10px] mt-0.5">your rank</p>
          </div>
        )}
        <button onClick={onViewFull} className="text-indigo-400 text-xs font-semibold hover:text-indigo-300 flex-shrink-0">
          See all {rankings.length} →
        </button>
      </div>

      {/* Zone pills */}
      <div className="flex gap-2 px-4 py-2 border-b border-white/5">
        {promLP != null && <span className="text-[10px] text-green-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> Promotion ≥{promLP} LP</span>}
        {relLP != null && <span className="text-[10px] text-red-400 flex items-center gap-1 ml-auto"><span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" /> Relegation ≤{relLP} LP</span>}
      </div>

      {/* Top 3 */}
      {top3.map((row, i) => {
        const rank    = i + 1
        const isMe    = row.user_id === myUserId
        const isPromo = promLP != null && row.total_league_points >= promLP
        const isRel   = relLP  != null && row.total_league_points <= relLP
        return (
          <div key={row.user_id} className={`flex items-start gap-3 px-4 py-3 border-b border-white/4 ${isMe ? 'bg-indigo-900/20' : ''}`}>
            <span className={`w-6 text-center text-xs font-black flex-shrink-0 mt-0.5 ${rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-gray-300' : 'text-amber-600'}`}>{rank}</span>
            <button onClick={() => onUserClick?.(row.user_id)} className="relative flex-shrink-0 mt-0.5">
              <div className="w-7 h-7 rounded-full overflow-hidden bg-indigo-900/40 flex items-center justify-center text-xs text-indigo-300 font-bold flex-shrink-0">
                {row.avatar_url
                  ? <img src={row.avatar_url} alt="" className="w-full h-full object-cover" />
                  : (row.display_name || '?')[0].toUpperCase()
                }
              </div>
              <TierBadgeSm correct={row.total_correct_picks} incorrect={row.total_incorrect_picks} />
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-sm truncate ${isMe ? 'text-white font-semibold' : 'text-gray-300'}`}>
                {row.display_name || 'Player'}{isMe && <span className="text-indigo-400 text-xs ml-1">you</span>}
              </p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {(() => {
                  const wrong = row.total_wrong_picks ?? row.total_incorrect_picks ?? 0
                  const total = (row.total_correct_picks || 0) + wrong
                  const acc = total > 0 ? Math.round((row.total_correct_picks || 0) / total * 100) : null
                  const gw  = row.gameweeks_participated
                  return (<>
                    <span className="text-[10px] text-green-400 font-semibold">{row.total_correct_picks ?? 0}✓</span>
                    <span className="text-[10px] text-red-400/70">{wrong}✗</span>
                    {acc !== null && <span className="text-[10px] text-gray-500">{acc}%</span>}
                    {gw > 0 && <span className="text-[10px] text-gray-600">{gw} GW</span>}
                    <span className="text-[10px] text-yellow-500/60">{row.energy_used ?? 0}⚡</span>
                  </>)
                })()}
              </div>
            </div>
            <span className={`font-black text-sm mt-0.5 flex-shrink-0 ${isPromo ? 'text-green-400' : isRel ? 'text-red-400' : 'text-indigo-400'}`}>{row.total_league_points} LP</span>
          </div>
        )
      })}

      {/* Ellipsis */}
      {showMyRow && <p className="text-center text-gray-700 text-xs py-2">· · ·</p>}

      {/* My position if not in top 3 */}
      {showMyRow && myRow && (() => {
        const isPromo = promLP != null && myRow.total_league_points >= promLP
        const isRel   = relLP  != null && myRow.total_league_points <= relLP
        return (
          <div className="flex items-start gap-3 px-4 py-3 bg-indigo-900/20 border-t border-indigo-500/15">
            <span className="w-6 text-center text-xs font-black text-indigo-400 flex-shrink-0 mt-0.5">{myIdx + 1}</span>
            <button onClick={() => onUserClick?.(myRow.user_id)} className="relative flex-shrink-0 mt-0.5">
              <div className="w-7 h-7 rounded-full overflow-hidden bg-indigo-700/50 flex items-center justify-center text-xs text-indigo-200 font-bold flex-shrink-0">
                {myRow.avatar_url
                  ? <img src={myRow.avatar_url} alt="" className="w-full h-full object-cover" />
                  : (myRow.display_name || '?')[0].toUpperCase()
                }
              </div>
              <TierBadgeSm correct={myRow.total_correct_picks} incorrect={myRow.total_incorrect_picks} />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-semibold truncate">{myRow.display_name || 'You'} <span className="text-indigo-400 text-xs">you</span></p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {(() => {
                  const wrong = myRow.total_wrong_picks ?? myRow.total_incorrect_picks ?? 0
                  const total = (myRow.total_correct_picks || 0) + wrong
                  const acc = total > 0 ? Math.round((myRow.total_correct_picks || 0) / total * 100) : null
                  const gw  = myRow.gameweeks_participated
                  return (<>
                    <span className="text-[10px] text-green-400 font-semibold">{myRow.total_correct_picks ?? 0}✓</span>
                    <span className="text-[10px] text-red-400/70">{wrong}✗</span>
                    {acc !== null && <span className="text-[10px] text-gray-500">{acc}%</span>}
                    {gw > 0 && <span className="text-[10px] text-gray-600">{gw} GW</span>}
                    <span className="text-[10px] text-yellow-500/60">{myRow.energy_used ?? 0}⚡</span>
                  </>)
                })()}
              </div>
            </div>
            <span className={`font-black text-sm mt-0.5 flex-shrink-0 ${isPromo ? 'text-green-400' : isRel ? 'text-red-400' : 'text-indigo-400'}`}>{myRow.total_league_points} LP</span>
          </div>
        )
      })()}
    </div>
  )
}

// ── Overall sprint rankings across all divisions ──────────────────────────────
function OverallRankingsScreen({ sprint, overallRanking, myUserId, onClose, onUserClick, isGwLocked }) {
  const myRow  = overallRanking.find(r => r.user_id === myUserId)
  const myRef  = useRef(null)
  const OUTCOME_ICON = { promoted:'⬆', retained:'=', relegated:'⬇' }
  const OUTCOME_CLS  = { promoted:'text-green-400', retained:'text-gray-400', relegated:'text-red-400' }

  useEffect(() => {
    if (myRef.current) {
      myRef.current.scrollIntoView({ block: 'center' })
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0d12] flex flex-col">
      {/* Header */}
      <div className="border-b border-white/8">
        <div className="max-w-md mx-auto flex items-center gap-3 px-4 pt-5 pb-3">
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/6 flex items-center justify-center text-gray-300 hover:bg-white/10">←</button>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-base">🌍 Overall Rankings</p>
            <p className="text-gray-500 text-xs">{sprint?.name} · {overallRanking.length} players</p>
          </div>
          {myRow && (
            <div className="text-right flex-shrink-0">
              <p className="text-indigo-300 font-black text-xl leading-none">#{myRow.overall_rank}</p>
              <p className="text-gray-600 text-[10px]">your position</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-6">
        <div className="max-w-md mx-auto divide-y divide-white/4">
          {overallRanking.map((row) => {
            const isMe = row.user_id === myUserId
            const oc = OUTCOME_CLS[row.sprint_outcome] || 'text-gray-400'
            const oi = OUTCOME_ICON[row.sprint_outcome] || '='
            return (
              <div key={`${row.user_id}_${row.overall_rank}`}
                ref={isMe ? myRef : null}
                className="relative flex items-start gap-3 px-4 py-3 border-b border-white/4"
                style={isMe ? {
                  background: 'linear-gradient(90deg, rgba(88,28,135,0.4) 0%, rgba(88,28,135,0.15) 60%, transparent 100%)',
                  borderColor: 'rgba(168,85,247,0.25)',
                } : {}}>
                {isMe && <span className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full bg-purple-500" />}
                <span className={`w-7 text-center text-sm font-black flex-shrink-0 mt-0.5 ${
                  isMe ? 'text-purple-300' :
                  row.overall_rank === 1 ? 'text-yellow-400' :
                  row.overall_rank === 2 ? 'text-gray-300' :
                  row.overall_rank === 3 ? 'text-amber-600' : 'text-gray-600'
                }`}>{row.overall_rank}</span>

                <button onClick={() => onUserClick?.(row.user_id)} className="relative flex-shrink-0">
                  <div className={`rounded-full flex items-center justify-center font-bold ${isMe ? 'w-9 h-9 text-sm' : 'w-8 h-8 text-xs bg-white/8 text-gray-400'}`}
                    style={isMe ? { background: 'rgba(88,28,135,0.6)', color: '#d8b4fe', boxShadow: '0 0 0 2px rgba(168,85,247,0.7), 0 0 12px rgba(168,85,247,0.3)' } : {}}>
                    {(row.display_name || '?')[0].toUpperCase()}
                  </div>
                  <TierBadgeSm correct={row.total_correct_picks} incorrect={row.total_incorrect_picks} />
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className={`text-sm font-semibold truncate ${isMe ? 'text-white' : 'text-gray-300'}`}>
                      {row.display_name}
                    </p>
                    {isMe && <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full border border-purple-500/50 bg-purple-900/40 text-purple-300 flex-shrink-0">YOU</span>}
                    <span className={`text-[10px] font-bold flex-shrink-0 ${oc}`}>{oi}</span>
                  </div>
                  <p className="text-gray-500 text-[10px] mt-0.5">
                    {row.division_icon} {row.division_name} · #{row.division_rank}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="text-green-400 text-[10px] font-semibold">{row.total_correct_picks ?? 0}✓</span>
                    <span className="text-[10px] text-gray-600">·</span>
                    <span className="text-red-400 text-[10px]">{row.total_incorrect_picks ?? 0}✗</span>
                    {(row.pending_picks ?? 0) > 0 && (
                      <>
                        <span className="text-[10px] text-gray-600">·</span>
                        <span className="text-gray-400 text-[10px]">{row.pending_picks}{isGwLocked ? '🔒' : '⏳'}</span>
                      </>
                    )}
                    <span className="text-[10px] text-gray-600">·</span>
                    <span className="text-orange-400 text-[10px]">{row.energy_used ?? 0}⚡</span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className={`font-black text-base ${isMe ? 'text-white' : oc}`}
                    style={isMe ? { textShadow: '0 0 12px rgba(168,85,247,0.5)' } : {}}>{row.total_league_points}</p>
                  <p className={`text-[10px] ${isMe ? 'text-purple-400/70' : 'text-gray-600'}`}>LP</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Sticky footer: user position */}
      {myRow && (
        <div className="border-t border-white/8 bg-[#0a0d12]">
          <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
            <span className="text-xs text-gray-500">Your overall position</span>
            <span className="text-indigo-400 font-bold text-sm">#{myRow.overall_rank} of {overallRanking.length}</span>
            <span className="text-indigo-400 font-black text-lg ml-auto">{myRow.total_league_points} LP</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sprint detail full-screen ──────────────────────────────────────────────────
function SprintDetailScreen({ sprintSummary, myUserId, onClose }) {
  const navigate = useNavigate()
  const [detail,       setDetail]       = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [showRankings, setShowRankings] = useState(false)
  const [showOverall,  setShowOverall]  = useState(false)

  useEffect(() => {
    setLoading(true)
    getSprintDetail(sprintSummary.id)
      .then(r => setDetail(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [sprintSummary.id])

  const sprint         = detail?.sprint || sprintSummary
  const progress       = detail?.progress
  const division       = detail?.division
  const rankings       = detail?.rankings || []
  const overallRanking = detail?.overall_ranking || []
  const gameweeks      = detail?.gameweeks || []
  const effectiveUserId = detail?.progress?.user_id ?? myUserId
  const outcome   = progress?.sprint_outcome ?? (sprintSummary.status === 'live' ? 'pending' : null)
  const oc        = outcome ? (OUTCOME[outcome] || OUTCOME.pending) : null
  const gwCount   = sprint.gameweek_count || 4
  const isLive    = sprint.status === 'live'
  const promLP    = division?.promotion_min_points ?? null
  const relLP     = division?.relegation_max_points ?? null
  const isSprintCompleted = sprint.status === 'completed' || sprint.status === 'archived'
  const isGwLocked = gameweeks.some(g => g.status === 'LOCKED')

  // Build week lookup and find live week number
  const gwByWeek = {}
  for (const gw of gameweeks) {
    if (gw.sprint_week) gwByWeek[gw.sprint_week] = gw
  }
  // Prefer PUBLISHED (picks open) over LOCKED (deadline passed awaiting results)
  const liveWeekNum = (
    gameweeks.filter(g => getWeekStatus(g?.lock_time, g?.status) === 'PUBLISHED')
      .sort((a, b) => (a.sprint_week ?? 99) - (b.sprint_week ?? 99))[0]
    ?? gameweeks.filter(g => getWeekStatus(g?.lock_time, g?.status) === 'LOCKED')
      .sort((a, b) => (a.sprint_week ?? 99) - (b.sprint_week ?? 99))[0]
  )?.sprint_week ?? null

  // LP/correct counts — all weeks with an entry (FINISHED = final, LOCKED = live/in-progress)
  const gwsWithEntry   = gameweeks.filter(g => g.entry)
  const settledLP      = gwsWithEntry.reduce((s, g) => s + (g.entry.league_points ?? 0), 0)
  const settledCorrect = gwsWithEntry.reduce((s, g) => s + (g.entry.correct_picks ?? 0), 0)
  const settledPerfect = gwsWithEntry.filter(g => g.entry.is_perfect_week).length
  const hasSettled     = gwsWithEntry.length > 0
  const hasLiveEntry   = gameweeks.some(g => g.entry && (g.status === 'LOCKED' || g.status === 'PUBLISHED'))

  // Compute cumulative LP by week slot 1..gwCount
  const cumLP = []
  let running = 0
  for (let i = 1; i <= gwCount; i++) {
    const gw = gwByWeek[i]
    const earned = gw?.entry?.league_points ?? 0
    const before = running
    running += earned
    cumLP.push({ before, after: running })
  }

  const goToUser = (userId) => navigate(`/users/${userId}`)

  if (showOverall && detail) {
    return (
      <OverallRankingsScreen
        sprint={sprint}
        overallRanking={overallRanking}
        myUserId={effectiveUserId}
        onClose={() => setShowOverall(false)}
        onUserClick={goToUser}
        isGwLocked={isGwLocked}
      />
    )
  }
  if (showRankings && detail) {
    return (
      <RankingsScreen
        sprint={sprint}
        division={division}
        rankings={rankings}
        myUserId={effectiveUserId}
        onClose={() => setShowRankings(false)}
        onUserClick={goToUser}
        isGwLocked={isGwLocked}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0d12] flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto pb-6">

        {/* Hero */}
        <div className={`relative bg-gradient-to-b ${oc?.bg || 'from-white/4 to-transparent'} border-b ${oc?.border || 'border-white/8'}`}>
          <div className="max-w-md mx-auto px-4 pt-5 pb-5">
            <button onClick={onClose} className="w-9 h-9 rounded-xl bg-black/30 flex items-center justify-center text-gray-300 mb-4">←</button>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-[10px] tracking-widest uppercase font-semibold mb-1">Sprint history</p>
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

            {/* Gameweek progress — cards per week */}
            <div className="mt-5 flex gap-2">
              {Array.from({ length: gwCount }, (_, i) => {
                const gw      = gwByWeek[i + 1] ?? gameweeks[i]
                const st      = getWeekStatus(gw?.lock_time, gw?.status)
                const isLive  = st === 'PUBLISHED' || st === 'LOCKED'
                const isDone  = st === 'FINISHED'
                const isFuture = !isLive && !isDone
                const has     = !!gw?.entry
                const missed  = isDone && !has
                const { mon } = gw?.lock_time ? getWeekRange(gw.lock_time) : {}
                return (
                  <div key={i} className={`flex-1 rounded-xl px-2 py-2 border text-center transition-all ${
                    isLive         ? 'border-green-500/50 bg-green-900/20 shadow-[0_0_12px_-3px_rgba(34,197,94,0.3)]' :
                    isDone && has  ? 'border-indigo-500/25 bg-indigo-900/15' :
                    missed         ? 'border-red-500/15 bg-red-950/10' :
                    isFuture       ? 'border-dashed border-white/10 bg-white/2' :
                                     'border-white/5 bg-white/2'
                  }`}>
                    {/* Status bar */}
                    <div className={`h-1 w-full rounded-full mb-1.5 ${
                      isLive        ? 'bg-green-400 animate-pulse' :
                      isDone && has ? 'bg-indigo-500' :
                      missed        ? 'bg-red-800/50' :
                                      'bg-white/6'
                    }`} />
                    <p className={`text-[10px] font-black ${
                      isLive        ? 'text-green-300' :
                      isDone && has ? 'text-indigo-300' :
                      missed        ? 'text-red-400/70' :
                                      'text-gray-700'
                    }`}>W{i + 1}</p>
                    {isLive && <p className="text-[8px] text-green-400 font-bold mt-0.5">LIVE</p>}
                    {isLive && gw?.entry?.league_points != null && gw.entry.league_points > 0 && (
                      <p className="text-[8px] text-green-300 mt-0.5">+{gw.entry.league_points} LP</p>
                    )}
                    {isDone && has && gw?.entry?.league_points != null && (
                      <p className="text-[8px] text-indigo-400 mt-0.5">+{gw.entry.league_points} LP</p>
                    )}
                    {missed && <p className="text-[8px] text-red-500/60 mt-0.5">missed</p>}
                    {isFuture && mon && (
                      <p className="text-[8px] text-gray-700 mt-0.5">{fmtShort(mon)}</p>
                    )}
                    {isFuture && !mon && (
                      <p className="text-[8px] text-gray-700 mt-0.5">soon</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-gray-600 text-sm">
            <div className="w-5 h-5 border-2 border-t-transparent border-indigo-500 rounded-full animate-spin" />
            Loading sprint…
          </div>
        ) : (
          <div className="max-w-md mx-auto px-4 space-y-5 pt-5">

            {/* Sprint completed — outcome banner */}
            {sprint.status === 'completed' && outcome && outcome !== 'pending' && (
              <div className={`rounded-2xl p-5 bg-gradient-to-br ${
                outcome === 'promoted'  ? 'from-green-900/40 to-green-950/20 border border-green-500/30' :
                outcome === 'relegated' ? 'from-red-900/30 to-red-950/15 border border-red-500/25' :
                'from-white/4 to-white/2 border border-white/10'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0 ${
                    outcome === 'promoted'  ? 'bg-green-900/60 border border-green-500/40' :
                    outcome === 'relegated' ? 'bg-red-900/50 border border-red-500/30' :
                    'bg-white/8 border border-white/15'
                  }`}>
                    {outcome === 'promoted' ? '⬆' : outcome === 'relegated' ? '⬇' : '='}
                  </div>
                  <div>
                    <p className={`font-black text-base leading-tight ${
                      outcome === 'promoted' ? 'text-green-300' : outcome === 'relegated' ? 'text-red-300' : 'text-white'
                    }`}>
                      {outcome === 'promoted' ? 'Promoted!' : outcome === 'relegated' ? 'Relegated' : 'Retained'}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {outcome === 'promoted' ? 'You move up to the next division for the next sprint' :
                       outcome === 'relegated' ? 'You drop down to the previous division' :
                       'You stay in your current division'}
                    </p>
                  </div>
                </div>
                {/* Division transition */}
                {division && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-white/8 border border-white/10 text-gray-300 font-medium">
                      {division.icon} {division.name}
                    </span>
                    <span className={`font-black ${outcome === 'promoted' ? 'text-green-400' : outcome === 'relegated' ? 'text-red-400' : 'text-gray-600'}`}>
                      {outcome === 'promoted' ? '→' : outcome === 'relegated' ? '→' : '·'}
                    </span>
                    {outcome === 'promoted' && (
                      <span className="px-2.5 py-1 rounded-lg bg-green-900/40 border border-green-500/30 text-green-300 font-medium">
                        Next division ↑
                      </span>
                    )}
                    {outcome === 'relegated' && (
                      <span className="px-2.5 py-1 rounded-lg bg-red-900/30 border border-red-500/25 text-red-300 font-medium">
                        Previous division ↓
                      </span>
                    )}
                    {outcome === 'retained' && (
                      <span className="px-2.5 py-1 rounded-lg bg-white/8 border border-white/10 text-gray-400 font-medium">
                        Stay in {division.icon} {division.name}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Sprint settling — awaiting results */}
            {sprint.status === 'live' && progress?.sprint_outcome === 'pending' && (() => {
              const finishedGws = gameweeks.filter(g => getWeekStatus(g?.lock_time, g?.status) === 'FINISHED').length
              const allFinished = finishedGws >= gwCount
              return allFinished ? (
                <div className="bg-purple-950/30 border border-purple-500/20 rounded-2xl px-4 py-3.5 flex items-start gap-3">
                  <span className="text-xl mt-0.5">⏳</span>
                  <div>
                    <p className="text-purple-300 font-bold text-sm">Sprint settling — results incoming</p>
                    <p className="text-gray-500 text-xs mt-0.5">All matches are finished. Final LP and division outcomes are being calculated.</p>
                  </div>
                </div>
              ) : null
            })()}

            {/* Sprint summary stats */}
            {(progress || hasSettled) ? (
              <div className="space-y-2">
                {hasLiveEntry && (
                  <div className="flex items-center gap-1.5 px-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                    <p className="text-green-400 text-[10px] font-semibold tracking-wide">Live week included — updating as matches finish</p>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-[#0d1117] border border-white/8 rounded-2xl py-3 text-center">
                    <p className={`font-black text-2xl ${outcome === 'promoted' ? 'text-green-400' : outcome === 'relegated' ? 'text-red-400' : 'text-indigo-400'}`}>
                      {isLive ? settledLP : (progress?.total_league_points ?? 0)}
                    </p>
                    <p className="text-gray-600 text-[10px] mt-0.5">{isLive ? 'LP so far' : 'Final LP'}</p>
                  </div>
                  <div className="bg-[#0d1117] border border-white/8 rounded-2xl py-3 text-center">
                    <p className="text-white font-black text-2xl">{isLive ? settledCorrect : (progress?.total_correct_picks ?? 0)}</p>
                    <p className="text-gray-600 text-[10px] mt-0.5">Correct picks</p>
                  </div>
                  <div className="bg-[#0d1117] border border-white/8 rounded-2xl py-3 text-center">
                    <p className="text-yellow-400 font-black text-2xl">{isLive ? settledPerfect : (progress?.perfect_weeks ?? 0)}</p>
                    <p className="text-gray-600 text-[10px] mt-0.5">Perfect weeks</p>
                  </div>
                </div>
              </div>
            ) : isLive ? (
              <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-2xl px-4 py-3 text-center">
                <p className="text-indigo-300 text-sm font-semibold">Sprint in progress</p>
                <p className="text-gray-500 text-xs mt-1">Submit your picks in the Gameweek tab to start earning LP</p>
              </div>
            ) : null}

            {/* Rankings section */}
            {(rankings.length > 0 || overallRanking.length > 0 || sprint.my_rank) && (() => {
              const myOverallRow = overallRanking.find(r => r.user_id === effectiveUserId)
              return (
              <div className="space-y-2">
                {overallRanking.length > 0 && (
                  <button
                    onClick={() => setShowOverall(true)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-indigo-500/25 bg-indigo-950/30 hover:bg-indigo-950/50 transition-colors"
                  >
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-white font-bold text-sm">🌍 Overall Sprint Rankings</p>
                      <p className="text-gray-500 text-xs mt-0.5">{overallRanking.length} players across all divisions</p>
                    </div>
                    {myOverallRow && (
                      <div className="text-center flex-shrink-0">
                        <p className="text-indigo-300 font-black text-xl leading-none">#{myOverallRow.overall_rank}</p>
                        <p className="text-gray-600 text-[10px] mt-0.5">your rank</p>
                      </div>
                    )}
                    <span className="text-indigo-400 font-semibold text-sm flex-shrink-0">→</span>
                  </button>
                )}
                {rankings.length > 0 ? (
                  <InlineRankings
                    rankings={rankings}
                    myUserId={effectiveUserId}
                    promLP={promLP}
                    relLP={relLP}
                    onViewFull={() => setShowRankings(true)}
                    division={division}
                    myDivRank={myOverallRow?.division_rank}
                    onUserClick={goToUser}
                  />
                ) : sprint.my_rank ? (
                  <div className="bg-[#0d1117] border border-white/8 rounded-2xl px-4 py-3.5 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-bold">Division Ranking</p>
                      {division && (
                        <p className="text-gray-500 text-[10px] mt-0.5">
                          {division.icon ? `${division.icon} ` : ''}{division.name}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-indigo-300 font-black text-xl leading-none">#{sprint.my_rank}</p>
                      <p className="text-gray-600 text-[10px] mt-0.5">
                        your rank{sprint.total_players ? ` / ${sprint.total_players}` : ''}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
              )
            })()}


            {/* How sprints work */}
            {isLive && (
              <div className="rounded-2xl border border-white/8 bg-white/3 px-4 py-3.5 space-y-2.5">
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">How this sprint ends</p>
                <div className="flex items-start gap-2.5">
                  <span className="text-base leading-none mt-0.5">⬆</span>
                  <p className="text-gray-300 text-xs leading-relaxed"><span className="text-green-400 font-semibold">Top players get promoted</span> to the next division for the following sprint.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-base leading-none mt-0.5">⬇</span>
                  <p className="text-gray-300 text-xs leading-relaxed"><span className="text-red-400 font-semibold">Bottom players get relegated</span> to a lower division.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-base leading-none mt-0.5">🔄</span>
                  <p className="text-gray-300 text-xs leading-relaxed"><span className="text-indigo-300 font-semibold">League Points reset to 0</span> at the start of every new sprint — everyone starts fresh.</p>
                </div>
              </div>
            )}
            {isSprintCompleted && (
              <div className="flex items-start gap-2.5 rounded-2xl border border-white/6 bg-white/2 px-4 py-3">
                <span className="text-sm leading-none mt-0.5">🔄</span>
                <p className="text-gray-500 text-xs leading-relaxed">Promotions and relegations from this sprint have been applied. LP resets to 0 at the start of each new sprint.</p>
              </div>
            )}

            {/* CTA for live sprint */}
            {isLive && (
              <a href="/" className="block w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm text-center transition-colors shadow-lg shadow-indigo-500/20">
                Go to current Gameweek →
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Current sprint card (prominent hero style) ────────────────────────────────
const DIVISION_IMAGES = {
  1: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=900&q=80&auto=format&fit=crop',
  2: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=900&q=80&auto=format&fit=crop',
  3: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=900&q=80&auto=format&fit=crop',
  4: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=900&q=80&auto=format&fit=crop',
  5: 'https://images.unsplash.com/photo-1540747913346-19212a4b23b4?w=900&q=80&auto=format&fit=crop',
  6: 'https://images.unsplash.com/photo-1522778526097-ce0a22ceb253?w=900&q=80&auto=format&fit=crop',
}

function CurrentSprintCard({ sprint, onEnter }) {
  const gws = sprint.gameweeks || []

  // myRelevantSprints returns entry data nested under gw.entry (null when no entry)
  const gwsWithEntry = gws.filter(gw => gw.entry != null)
  const earnedLP        = gwsWithEntry.reduce((s, gw) => s + (gw.entry.league_points ?? 0), 0)
  const earnedCorrect   = gwsWithEntry.reduce((s, gw) => s + (gw.entry.correct_picks ?? 0), 0)
  const earnedIncorrect = gwsWithEntry.reduce((s, gw) => s + (gw.entry.incorrect_picks ?? 0), 0)
  const earnedPerfect   = gwsWithEntry.filter(gw => gw.entry.is_perfect_week).length
  const hasStats        = gwsWithEntry.length > 0

  // Rankings
  const divRank       = sprint.my_rank ?? null
  const divTotal      = sprint.total_players ?? null
  const globalRank    = sprint.my_global_rank ?? null
  const globalTotal   = sprint.total_global_players ?? null

  // Promotion / relegation status
  const promLP   = sprint.promotion_min_points ?? null
  const relLP    = sprint.relegation_max_points ?? null
  const outcome  = sprint.sprint_outcome

  let statusBanner = null
  if (outcome && outcome !== 'pending') {
    if (outcome === 'promoted')
      statusBanner = { text: 'You got promoted! Moving up next sprint.', cls: 'bg-green-900/40 border-green-500/30 text-green-300', icon: '⬆' }
    else if (outcome === 'relegated')
      statusBanner = { text: 'You got relegated. Better luck next sprint!', cls: 'bg-red-900/30 border-red-500/25 text-red-300', icon: '⬇' }
    else
      statusBanner = { text: 'You stay in your division next sprint.', cls: 'bg-white/5 border-white/10 text-gray-400', icon: '=' }
  } else if (sprint.status === 'live' && hasStats) {
    if (promLP !== null && earnedLP >= promLP)
      statusBanner = { text: `Promotion zone — keep it up! (${earnedLP} / ${promLP} LP needed)`, cls: 'bg-green-900/40 border-green-500/30 text-green-300', icon: '⬆' }
    else if (relLP !== null && earnedLP <= relLP)
      statusBanner = { text: `Relegation risk — earn more LP! (${earnedLP} / ${relLP + 1} LP needed)`, cls: 'bg-red-900/30 border-red-500/25 text-red-300', icon: '⬇' }
    else if (promLP !== null)
      statusBanner = { text: `${promLP - earnedLP} LP needed for promotion`, cls: 'bg-indigo-900/30 border-indigo-500/25 text-indigo-300', icon: '=' }
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-indigo-500/30"
      style={{ background: 'linear-gradient(160deg, rgba(99,102,241,0.13) 0%, rgba(13,17,23,1) 60%)', boxShadow: '0 0 50px -12px rgba(99,102,241,0.28)' }}>

      {/* Header */}
      <div className="relative h-32 overflow-hidden">
        <img
          src={sprint.division_badge_url || DIVISION_IMAGES[sprint.division_display_order] || DIVISION_IMAGES[1]}
          alt={sprint.division_name || ''}
          className="w-full h-full object-cover object-center opacity-70"
          onError={e => { e.target.style.display = 'none' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d12] via-[#0a0d12]/40 to-transparent" />
        <div className="absolute inset-0 px-4 pb-3 flex flex-col justify-end">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-wider text-green-400 bg-green-900/50 border border-green-500/30 px-2.5 py-1 rounded-full mb-2 self-start">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
            LIVE SPRINT
          </span>
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h2 className="text-white font-black text-xl leading-tight drop-shadow-lg">{sprint.name}</h2>
              <p className="text-gray-400 text-[11px] mt-0.5">{fmtShort(sprint.start_date)} – {fmtShort(sprint.end_date)}</p>
            </div>
            {sprint.division_name && (
              <div className="flex-shrink-0 text-right">
                <p className="text-indigo-300 text-xs font-bold">{sprint.division_icon} {sprint.division_name}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 divide-x divide-white/6 border-t border-white/6">
        <div className="py-3 text-center">
          <p className="text-indigo-400 font-black text-lg leading-none">{earnedLP}</p>
          <p className="text-gray-600 text-[9px] mt-1 uppercase tracking-wide">LP</p>
        </div>
        <div className="py-3 text-center">
          <p className="text-green-400 font-black text-lg leading-none">{earnedCorrect}</p>
          <p className="text-gray-600 text-[9px] mt-1 uppercase tracking-wide">Correct</p>
        </div>
        <div className="py-3 text-center">
          <p className="text-red-400 font-black text-lg leading-none">{earnedIncorrect}</p>
          <p className="text-gray-600 text-[9px] mt-1 uppercase tracking-wide">Wrong</p>
        </div>
        <div className="py-3 text-center">
          <p className="text-yellow-400 font-black text-lg leading-none">{earnedPerfect}</p>
          <p className="text-gray-600 text-[9px] mt-1 uppercase tracking-wide">⭐ Perfect</p>
        </div>
      </div>

      {/* Rankings */}
      {(globalRank || divRank) && (
        <div className="grid grid-cols-2 gap-2 px-4 pt-3 pb-2">
          {/* Global */}
          <div className="rounded-xl bg-white/4 border border-white/8 px-3 py-2.5">
            <p className="text-gray-500 text-[9px] uppercase tracking-wider font-semibold mb-1">🌍 Global ranking</p>
            {globalRank ? (
              <div className="flex items-baseline gap-1">
                <span className="text-white font-black text-xl leading-none">#{globalRank}</span>
                {globalTotal && <span className="text-gray-600 text-[10px]">of {globalTotal}</span>}
              </div>
            ) : (
              <span className="text-gray-600 text-xs">—</span>
            )}
          </div>
          {/* Division */}
          <div className={`rounded-xl border px-3 py-2.5 ${
            statusBanner?.icon === '⬆' ? 'bg-green-900/20 border-green-500/25' :
            statusBanner?.icon === '⬇' ? 'bg-red-900/15 border-red-500/20' :
            'bg-white/4 border-white/8'
          }`}>
            <p className="text-gray-500 text-[9px] uppercase tracking-wider font-semibold mb-1">{sprint.division_icon} Division ranking</p>
            {divRank ? (
              <div className="flex items-baseline gap-1.5">
                <span className={`font-black text-xl leading-none ${
                  statusBanner?.icon === '⬆' ? 'text-green-400' :
                  statusBanner?.icon === '⬇' ? 'text-red-400' :
                  'text-white'
                }`}>#{divRank}</span>
                {divTotal && <span className="text-gray-600 text-[10px]">of {divTotal}</span>}
                {statusBanner?.icon === '⬆' && <span className="text-green-400 text-[10px] font-black ml-auto">⬆ PROMO</span>}
                {statusBanner?.icon === '⬇' && <span className="text-red-400 text-[10px] font-black ml-auto">⬇ REL</span>}
              </div>
            ) : (
              <span className="text-gray-600 text-xs">—</span>
            )}
          </div>
        </div>
      )}

      {/* Status banner */}
      {statusBanner && (
        <div className={`mx-4 mb-3 px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 ${statusBanner.cls}`}>
          <span className="text-sm">{statusBanner.icon}</span>
          {statusBanner.text}
        </div>
      )}

      {/* Matchweek rows */}
      {gws.length > 0 && (
        <div className="px-4 pb-3 space-y-1.5">
          <p className="text-gray-600 text-[9px] uppercase tracking-wider font-semibold mb-2">Matchweeks</p>
          {gws.map(gw => {
            const { mon, sun } = getWeekRange(gw.lock_time)
            const st     = getWeekStatus(gw.lock_time, gw.status)
            const isLive = st === 'LOCKED'
            const isOpen = st === 'PUBLISHED'
            const isDone = st === 'FINISHED'
            const lp     = gw.entry?.league_points ?? null
            return (
              <div key={gw.id}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl border ${
                  isLive ? 'bg-green-900/15 border-green-500/20' :
                  isOpen ? 'bg-indigo-900/20 border-indigo-500/25' :
                  isDone ? 'bg-white/3 border-white/6' :
                           'bg-white/2 border-white/4'
                }`}>
                {/* Dot */}
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  isLive ? 'bg-green-400 animate-pulse' :
                  isOpen ? 'bg-indigo-400 animate-pulse' :
                  isDone ? 'bg-indigo-500/50' :
                           'bg-gray-700'
                }`} />
                {/* Week number */}
                <span className={`text-xs font-black flex-shrink-0 w-5 ${
                  isLive ? 'text-green-300' : isOpen ? 'text-indigo-300' : isDone ? 'text-gray-500' : 'text-gray-700'
                }`}>W{gw.sprint_week}</span>
                {/* Date range */}
                <span className={`text-xs flex-1 min-w-0 truncate ${
                  isLive || isOpen ? 'text-white/80' : isDone ? 'text-gray-600' : 'text-gray-700'
                }`}>
                  {mon ? `${fmtWeekday(mon)} → ${fmtWeekday(sun)}` : `Week ${gw.sprint_week}`}
                </span>
                {/* Right label */}
                {isLive && <span className="text-[10px] flex-shrink-0 font-black text-green-400 tracking-wide">LIVE</span>}
                {isOpen && <span className="text-[10px] flex-shrink-0 font-semibold text-yellow-300">{fmtCountdown(gw.lock_time) ? `Locks ${fmtCountdown(gw.lock_time)}` : 'Open'}</span>}
                {isDone && (
                  <span className={`text-[10px] flex-shrink-0 font-black ${lp != null && lp > 0 ? 'text-indigo-400' : 'text-gray-600'}`}>
                    {lp != null ? `+${lp} LP` : '—'}
                  </span>
                )}
                {!isLive && !isOpen && !isDone && <span className="text-[10px] flex-shrink-0 text-gray-700">Upcoming</span>}
              </div>
            )
          })}
        </div>
      )}

      {/* CTA */}
      <div className="p-3 pt-0">
        <button
          onClick={() => onEnter(sprint)}
          className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-bold text-sm transition-all shadow-lg shadow-indigo-900/50"
        >
          View sprint details →
        </button>
      </div>
    </div>
  )
}

// ── Past sprint card (compact row) ────────────────────────────────────────────
function PastSprintCard({ sprint, onEnter, onViewSummary }) {
  const lp      = sprint.total_league_points ?? null
  const outcome = sprint.sprint_outcome
  const oc      = OUTCOME[outcome] || OUTCOME.retained
  const myRank  = sprint.my_rank
  const players = sprint.total_players
  const month   = sprint.start_date
    ? new Date(sprint.start_date + 'T12:00:00Z').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : ''

  return (
    <div className="rounded-2xl overflow-hidden border border-white/8 bg-[#0d1117]">
      <div className="flex">
        {/* Outcome colour stripe */}
        <div className="w-1 flex-shrink-0 rounded-l-2xl" style={{ background: oc.color }} />

        <div className="flex-1 px-4 py-3 min-w-0">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-white font-bold text-sm">{sprint.name}</p>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${oc.badge}`}>
                  {oc.label}
                </span>
              </div>
              <p className="text-gray-600 text-[10px] mt-0.5">
                {month}
                {sprint.division_icon ? ` · ${sprint.division_icon} ${sprint.division_name}` : ''}
              </p>
            </div>
            {myRank && (
              <div className="flex-shrink-0 text-right">
                <p className="text-white font-black text-base leading-none">#{myRank}</p>
                <p className="text-gray-600 text-[10px] mt-0.5">{players ? `/ ${players}` : ''}</p>
              </div>
            )}
          </div>

          {/* Stats + button row */}
          <div className="flex items-center gap-3 mt-2.5">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {lp !== null && (
                <span className="text-indigo-400 font-black text-sm">{lp} LP</span>
              )}
              <span className="text-gray-500 text-sm">{sprint.total_correct_picks ?? 0}✓</span>
              {(sprint.perfect_weeks ?? 0) > 0 && (
                <span className="text-yellow-400 text-sm font-semibold">{sprint.perfect_weeks}⭐</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {onViewSummary && (
                <button
                  onClick={() => onViewSummary(sprint)}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                  style={{ color: oc.color, background: `${oc.color}15` }}
                >
                  Summary
                </button>
              )}
              <button
                onClick={() => onEnter(sprint)}
                className="text-xs text-gray-400 hover:text-white font-semibold px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                Details →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function MySprintsPage() {
  const [data,           setData]          = useState(null)
  const [loading,        setLoading]       = useState(true)
  const [selected,       setSelected]      = useState(null)
  const [myUserId,       setMyUserId]      = useState(null)
  const [summaryPopup,   setSummaryPopup]  = useState(null)

  useEffect(() => {
    getMyRelevantSprints()
      .then(r => { setData(r.data); if (r.data.user_id) setMyUserId(r.data.user_id) })
      .catch(() => {})
      .finally(() => setLoading(false))

    try {
      const raw = localStorage.getItem('auth-storage')
      if (raw) {
        const parsed = JSON.parse(raw)
        setMyUserId(parsed?.state?.user?.id)
      }
    } catch {}
  }, [])

  const allSprints = data?.past || []

  // Current sprint = live sprint first, fall back to nearest scheduled
  const currentSprint =
    allSprints.find(s => s.status === 'live') ||
    allSprints.filter(s => s.status === 'scheduled').sort((a, b) => new Date(a.start_date) - new Date(b.start_date))[0] ||
    null

  // History: only sprints the user participated in, newest first
  // Guard: my_rank must be a positive integer (API may return 0 or null for non-participated)
  const historicSprints = allSprints
    .filter(s =>
      (s.status === 'completed' || s.status === 'archived') &&
      s.my_rank != null && s.my_rank > 0
    )
    .sort((a, b) => new Date(b.start_date) - new Date(a.start_date))

  if (loading) return (
    <div className="min-h-screen bg-[#0a0d12] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0d12] text-white pb-24">
      {summaryPopup && (
        <SprintClosingPopup
          sprint={summaryPopup}
          nextSprint={null}
          readOnly={!!summaryPopup.closing_popup_seen_at}
          onDismiss={() => setSummaryPopup(null)}
        />
      )}

      {selected && (
        <SprintDetailScreen
          sprintSummary={selected}
          myUserId={myUserId}
          onClose={() => setSelected(null)}
        />
      )}

      <div className="max-w-md mx-auto px-4 pt-5 space-y-6">
        <h1 className="text-white text-xl font-bold">Sprints</h1>

        {/* ── Current sprint ── */}
        {currentSprint && (
          <section>
            <CurrentSprintCard sprint={currentSprint} onEnter={setSelected} />
          </section>
        )}

        {!currentSprint && historicSprints.length === 0 && (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🏃</p>
            <p className="text-gray-400 font-semibold text-base">No sprints yet</p>
            <p className="text-gray-600 text-sm mt-1">Your first sprint is coming soon.</p>
          </div>
        )}

        {/* ── Sprint history ── */}
        {historicSprints.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-3">
              <p className="text-gray-500 text-[11px] font-semibold tracking-widest uppercase flex-shrink-0">Sprint history</p>
              <div className="flex-1 h-px bg-white/5" />
            </div>
            <div className="space-y-2.5">
              {historicSprints.map(s => (
                <PastSprintCard key={s.id} sprint={s} onEnter={setSelected} onViewSummary={setSummaryPopup} />
              ))}
            </div>
          </section>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
