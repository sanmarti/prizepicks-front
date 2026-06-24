import { useEffect, useState, useRef } from 'react'
import { getMyRelevantSprints, getSprintDetail, getGloryGameweek } from '../api/glory'
import { MOCK_PAST_SPRINTS, MOCK_CURRENT_SPRINT, getMockSprintDetail } from '../api/mockSprintData'
import BottomNav from '../components/layout/BottomNav'

// Demo date: Mon 28 Jul 2026 — W4 of July sprint is live (sprint opens Jul 6, first Monday of July)
const DEMO_NOW = new Date('2026-07-28T10:00:00')

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
  const diff = new Date(target) - DEMO_NOW
  if (diff <= 0) return null
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}
// From lock_time (Sunday 20:00) derive Mon start and Sun end
function getWeekRange(lockTimeStr) {
  if (!lockTimeStr) return { mon: null, sun: null }
  const lockDt = new Date(lockTimeStr)
  const mon = new Date(lockDt); mon.setDate(mon.getDate() - 6); mon.setHours(0, 0, 0, 0)
  const sun = new Date(lockDt)
  return { mon, sun: lockDt }
}
function getWeekStatus(lockTimeStr, gwStatus) {
  if (!lockTimeStr) return gwStatus || 'DRAFT'
  const now = DEMO_NOW
  const { mon, sun } = getWeekRange(lockTimeStr)
  if (!mon) return gwStatus || 'DRAFT'
  const settle = new Date(mon); settle.setDate(settle.getDate() + 7) // next Monday = settle
  if (now >= settle || gwStatus === 'FINISHED') return 'FINISHED'
  if (now >= sun    || gwStatus === 'LOCKED')   return 'LOCKED'
  if (now >= mon    || gwStatus === 'PUBLISHED') return 'PUBLISHED'
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
  pending:   { bg: 'from-indigo-950/40 to-indigo-900/10', border: 'border-indigo-500/25', badge: 'bg-indigo-900/40 text-indigo-300 border-indigo-500/30', label: '🔴 Live',      color: '#6366f1' },
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
      <div className="border-b border-white/8">
        <div className="max-w-md mx-auto flex items-center gap-3 px-4 pt-5 pb-3">
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/6 flex items-center justify-center text-gray-300 hover:bg-white/10">←</button>
          <div>
            <p className="text-white font-bold text-base">{division?.name || 'Division'} — Final Rankings</p>
            <p className="text-gray-500 text-xs">{sprint?.name}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-gray-500 text-xs">{rankings.length} players</p>
          </div>
        </div>
      </div>

      <div className="border-b border-white/5">
        <div className="max-w-md mx-auto flex gap-2 px-4 py-2.5">
          <span className="flex items-center gap-1 text-[10px] text-green-400"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Promotion ≥{promLP ?? '?'} LP</span>
          <span className="flex items-center gap-1 text-[10px] text-gray-500 ml-auto"><span className="w-2 h-2 rounded-full bg-gray-600 inline-block" /> Retained</span>
          {relLP !== null && <span className="flex items-center gap-1 text-[10px] text-red-400"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Relegation ≤{relLP} LP</span>}
        </div>
      </div>

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
                <div className={`flex items-center gap-3 px-4 py-3 border-b border-white/4 ${isMe ? 'bg-indigo-900/20' : isPromo ? 'bg-green-950/15' : isRel ? 'bg-red-950/12' : ''}`}>
                  <span className={`w-7 text-center text-sm font-black flex-shrink-0 ${rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-gray-300' : rank === 3 ? 'text-amber-600' : 'text-gray-600'}`}>{rank}</span>
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
                    <p className="text-gray-600 text-[10px]">{row.total_correct_picks ?? 0}✓ correct · {row.perfect_weeks ?? 0}⭐</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-black text-base ${isPromo ? 'text-green-400' : isRel ? 'text-red-400' : 'text-indigo-400'}`}>{row.total_league_points}</p>
                    <p className="text-gray-700 text-[10px]">LP</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {myRow && (
        <div className="border-t border-white/8 bg-[#0a0d12]">
          <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
            <span className="text-xs text-gray-500">Your final position</span>
            <span className="text-indigo-400 font-bold text-sm">#{myRow.rank}</span>
            <span className="text-indigo-400 font-black text-lg ml-auto">{myRow.total_league_points} LP</span>
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

// ── Gameweek section (expandable, fetches all events) ──────────────────────────
function GameweekSection({ gw, lpBefore, lpAfter, isOpen: defaultOpen }) {
  const computedStatus = getWeekStatus(gw.lock_time, gw.status)
  const isLiveWeek     = computedStatus === 'PUBLISHED' || computedStatus === 'LOCKED'

  const [expanded, setExpanded]   = useState(defaultOpen ?? isLiveWeek)
  const [gwData,   setGwData]     = useState(null)
  const [loading,  setLoading]    = useState(false)
  const fetched = useRef(false)

  const toggle = () => {
    setExpanded(e => !e)
    if (!fetched.current && gw.id) {
      fetched.current = true
      setLoading(true)
      getGloryGameweek(gw.id)
        .then(r => setGwData(r.data))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }

  // Fetch immediately if defaultOpen
  useEffect(() => {
    if (defaultOpen && gw.id && !fetched.current) {
      fetched.current = true
      setLoading(true)
      getGloryGameweek(gw.id)
        .then(r => setGwData(r.data))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const hasEntry     = !!gw.entry
  const entry        = gw.entry
  const participated = hasEntry
  const isFinished   = gw.status === 'FINISHED' || gw.status === 'LOCKED'

  // Build pick map from sprint detail data (event_id → option_id)
  const pickMap = {}
  for (const p of gw.picks || []) {
    if (p.event_id) pickMap[p.event_id] = p.event_option_id
  }
  // Also try from fetched gwData my_picks
  for (const p of gwData?.my_picks || []) {
    if (p.event_id) pickMap[p.event_id] = p.event_option_id
  }

  const allEvents  = gwData?.gameweek?.events || gw._events || []
  const lpEarned   = entry?.league_points ?? 0
  const correct    = entry?.correct_picks ?? 0
  const incorrect  = entry?.incorrect_picks ?? 0
  const isPerfect  = entry?.is_perfect_week

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${
      isLiveWeek ? 'border-green-500/40 shadow-[0_0_20px_-4px_rgba(34,197,94,0.25)]' :
      isPerfect  ? 'border-yellow-500/30' :
      hasEntry   ? 'border-white/10' :
                   'border-white/6'
    }`} style={
      isLiveWeek ? { background: 'linear-gradient(160deg, rgba(34,197,94,0.05) 0%, rgba(10,13,18,1) 50%)' } :
      isPerfect  ? { background: 'rgba(234,179,8,0.04)' } : {}
    }>

      {/* ── Live week top strip ── */}
      {isLiveWeek && (
        <div className="flex items-center gap-2 px-4 py-2 bg-green-900/20 border-b border-green-500/20">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
          <span className="text-green-400 text-[10px] font-black tracking-widest uppercase">Live — Make your picks now</span>
          {gw.lock_time && (() => {
            const cd = fmtCountdown(gw.lock_time)
            return cd ? <span className="ml-auto text-yellow-400 text-[10px] font-semibold">Locks in {cd}</span> : null
          })()}
        </div>
      )}

      {/* ── Week header ── */}
      <button
        onClick={toggle}
        className={`w-full px-4 py-4 flex items-center gap-3 text-left ${isLiveWeek ? 'hover:bg-green-900/10' : 'hover:bg-white/2'} transition-colors`}
      >
        {/* Week number badge */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 border ${
          isLiveWeek  ? 'bg-green-900/40 border-green-500/50 text-green-300' :
          isPerfect   ? 'bg-yellow-900/30 border-yellow-500/30 text-yellow-400' :
          participated? 'bg-indigo-900/30 border-indigo-500/30 text-indigo-300' :
          isFinished  ? 'bg-white/5 border-white/10 text-gray-600' :
                        'bg-white/3 border-white/8 text-gray-700'
        }`}>
          W{gw.sprint_week}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className={`text-sm font-bold ${isLiveWeek ? 'text-green-300' : participated ? 'text-white' : 'text-gray-500'}`}>
              Week {gw.sprint_week}
            </p>
            {isLiveWeek  && <span className="text-[9px] bg-green-900/50 text-green-300 border border-green-500/40 px-1.5 py-0.5 rounded-full font-bold">● LIVE</span>}
            {isPerfect   && <span className="text-[9px] bg-yellow-900/40 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded-full font-bold">⭐ PERFECT</span>}
            {!participated && isFinished && !isLiveWeek && <span className="text-[9px] bg-white/5 text-gray-600 px-1.5 py-0.5 rounded-full">Missed</span>}
            {computedStatus === 'DRAFT' && <span className="text-[9px] bg-white/4 text-gray-600 px-1.5 py-0.5 rounded-full">Upcoming</span>}
          </div>

          {/* Mon → Sun date range */}
          {gw.lock_time && (() => {
            const { mon, sun } = getWeekRange(gw.lock_time)
            return mon ? (
              <p className="text-gray-600 text-[10px] mt-0.5 font-mono">
                {fmtWeekday(mon)} → {fmtWeekday(sun)}
              </p>
            ) : null
          })()}

          {/* LP row */}
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
        </div>

        <span className={`text-gray-600 text-xs transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {/* ── Expanded content ── */}
      {expanded && (
        <div className="border-t border-white/6 px-4 pt-4 pb-4 space-y-3">

          {/* Stats row (if participated) */}
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

          {/* Did not participate notice */}
          {!participated && isFinished && (
            <div className="bg-white/3 border border-white/8 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-2xl flex-shrink-0">⏭</span>
              <div>
                <p className="text-gray-500 text-sm font-semibold">Did not participate</p>
                <p className="text-gray-700 text-xs mt-0.5">Here are this week's event results</p>
              </div>
            </div>
          )}

          {/* Loading events */}
          {loading && (
            <div className="flex items-center justify-center py-8 gap-2 text-gray-600 text-sm">
              <div className="w-4 h-4 border border-gray-700 border-t-indigo-400 rounded-full animate-spin" />
              Loading events…
            </div>
          )}

          {/* All events */}
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

          {!loading && !gwData && gw.status === 'DRAFT' && (
            <p className="text-center text-gray-700 text-xs py-4">Events not published yet</p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Compact inline rankings strip ──────────────────────────────────────────────
function InlineRankings({ rankings, myUserId, promLP, relLP, onViewFull }) {
  if (!rankings?.length) return null
  const myIdx = rankings.findIndex(r => r.user_id === myUserId)
  const top3  = rankings.slice(0, 3)
  const myRow = myIdx >= 0 ? rankings[myIdx] : null
  const showMyRow = myIdx > 2

  return (
    <div className="bg-[#0d1117] border border-white/8 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <p className="text-white text-sm font-bold">Final Sprint Ranking</p>
        <button onClick={onViewFull} className="text-indigo-400 text-xs font-semibold hover:text-indigo-300">
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
            <div className="w-7 h-7 rounded-full bg-indigo-900/40 flex items-center justify-center text-xs text-indigo-300 font-bold flex-shrink-0 mt-0.5">
              {(row.display_name || '?')[0].toUpperCase()}
            </div>
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
            <div className="w-7 h-7 rounded-full bg-indigo-700/50 flex items-center justify-center text-xs text-indigo-200 font-bold flex-shrink-0 mt-0.5">
              {(myRow.display_name || '?')[0].toUpperCase()}
            </div>
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
function OverallRankingsScreen({ sprint, overallRanking, myUserId, onClose }) {
  const myRow = overallRanking.find(r => r.user_id === myUserId)
  const OUTCOME_ICON = { promoted:'⬆', retained:'=', relegated:'⬇' }
  const OUTCOME_CLS  = { promoted:'text-green-400', retained:'text-gray-400', relegated:'text-red-400' }

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0d12] flex flex-col">
      {/* Header */}
      <div className="border-b border-white/8">
        <div className="max-w-md mx-auto flex items-center gap-3 px-4 pt-5 pb-3">
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/6 flex items-center justify-center text-gray-300 hover:bg-white/10">←</button>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-base">Overall Rankings</p>
            <p className="text-gray-500 text-xs">{sprint?.name} · {overallRanking.length} players</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="border-b border-white/5">
        <div className="max-w-md mx-auto flex gap-3 px-4 py-2">
          <span className="flex items-center gap-1 text-[10px] text-green-400">⬆ Promoted</span>
          <span className="flex items-center gap-1 text-[10px] text-gray-500">= Retained</span>
          <span className="flex items-center gap-1 text-[10px] text-red-400 ml-auto">⬇ Relegated</span>
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
                className={`flex items-start gap-3 px-4 py-3 ${isMe ? 'bg-indigo-900/20' : ''}`}>
                {/* Rank */}
                <span className={`w-7 text-center text-sm font-black flex-shrink-0 mt-0.5 ${
                  row.overall_rank === 1 ? 'text-yellow-400' :
                  row.overall_rank === 2 ? 'text-gray-300' :
                  row.overall_rank === 3 ? 'text-amber-600' : 'text-gray-600'
                }`}>{row.overall_rank}</span>

                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  isMe ? 'bg-indigo-700/60 text-indigo-200' : 'bg-white/8 text-gray-400'
                }`}>
                  {(row.display_name || '?')[0].toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className={`text-sm font-semibold truncate ${isMe ? 'text-white' : 'text-gray-200'}`}>
                      {row.display_name}{isMe && <span className="text-indigo-400 text-xs ml-1">← you</span>}
                    </p>
                    <span className={`text-[10px] font-bold flex-shrink-0 ${oc}`}>{oi}</span>
                  </div>
                  {/* Division badge */}
                  <p className="text-gray-500 text-[10px] mt-0.5">
                    {row.division_icon} {row.division_name} · Div #{row.division_rank}
                  </p>
                  {/* Stats row */}
                  {(() => {
                    const gw = Math.min(4, Math.round((row.total_correct_picks + row.total_wrong_picks) / 6))
                    return (
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-green-400 text-[10px] font-semibold">{row.total_correct_picks}✓</span>
                        <span className="text-red-400/80 text-[10px]">{row.total_wrong_picks}✗</span>
                        <span className="text-gray-500 text-[10px]">{row.accuracy_pct}%</span>
                        {gw > 0 && <span className="text-[10px] text-gray-600">{gw} GW</span>}
                      </div>
                    )
                  })()}
                </div>

                {/* LP */}
                <div className="text-right flex-shrink-0">
                  <p className={`font-black text-base ${oc}`}>{row.total_league_points}</p>
                  <p className="text-gray-700 text-[10px]">LP</p>
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
  const [detail,       setDetail]       = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [showRankings, setShowRankings] = useState(false)
  const [showOverall,  setShowOverall]  = useState(false)

  const isMock = sprintSummary.id?.startsWith('mock_')

  useEffect(() => {
    setLoading(true)
    if (isMock) {
      const d = getMockSprintDetail(sprintSummary.id)
      setDetail(d)
      setLoading(false)
      return
    }
    getSprintDetail(sprintSummary.id)
      .then(r => setDetail(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [sprintSummary.id, isMock])

  const sprint         = detail?.sprint || sprintSummary
  const progress       = detail?.progress
  const division       = detail?.division
  const rankings       = detail?.rankings || []
  const overallRanking = detail?.overall_ranking || []
  const gameweeks      = detail?.gameweeks || []
  // For mock data the "you" row has user_id='mock_YOU'; use that as effective ID
  const effectiveUserId = isMock ? 'mock_YOU' : myUserId
  const outcome   = progress?.sprint_outcome ?? (sprintSummary.status === 'live' ? 'pending' : null)
  const oc        = outcome ? (OUTCOME[outcome] || OUTCOME.pending) : null
  const gwCount   = sprint.gameweek_count || 4
  const isLive    = sprint.status === 'live'
  const promLP    = division?.promotion_min_points ?? null
  const relLP     = division?.relegation_max_points ?? null

  // Compute cumulative LP after each week
  const cumLP = []
  let running = 0
  for (let i = 0; i < gwCount; i++) {
    const gw = gameweeks[i]
    const earned = gw?.entry?.league_points ?? 0
    const before = running
    running += earned
    cumLP.push({ before, after: running })
  }

  if (showOverall && detail) {
    return (
      <OverallRankingsScreen
        sprint={sprint}
        overallRanking={overallRanking}
        myUserId={effectiveUserId}
        onClose={() => setShowOverall(false)}
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
                const gw   = gameweeks[i]
                const st   = getWeekStatus(gw?.lock_time, gw?.status)
                const done = st === 'FINISHED'
                const open = st === 'PUBLISHED' || st === 'LOCKED'
                const has  = !!gw?.entry
                const { mon } = gw?.lock_time ? getWeekRange(gw.lock_time) : {}
                return (
                  <div key={i} className={`flex-1 rounded-xl px-2 py-2 border text-center transition-all ${
                    open ? 'border-green-500/50 bg-green-900/20 shadow-[0_0_12px_-3px_rgba(34,197,94,0.3)]' :
                    done && has ? 'border-indigo-500/25 bg-indigo-900/15' :
                    done ? 'border-white/8 bg-white/3' :
                    'border-white/5 bg-white/2'
                  }`}>
                    {/* Bar */}
                    <div className={`h-1 w-full rounded-full mb-1.5 ${
                      open ? 'bg-green-400 animate-pulse' :
                      done && has ? 'bg-indigo-500' :
                      done ? 'bg-white/20' : 'bg-white/8'
                    }`} />
                    <p className={`text-[10px] font-black ${
                      open ? 'text-green-300' : done && has ? 'text-indigo-300' : done ? 'text-gray-600' : 'text-gray-700'
                    }`}>W{i + 1}</p>
                    {open && <p className="text-[8px] text-green-400 font-bold mt-0.5">LIVE</p>}
                    {done && has && gw?.entry?.league_points != null && (
                      <p className="text-[8px] text-indigo-400 mt-0.5">+{gw.entry.league_points} LP</p>
                    )}
                    {done && !has && <p className="text-[8px] text-gray-700 mt-0.5">missed</p>}
                    {!open && !done && mon && (
                      <p className="text-[8px] text-gray-700 mt-0.5">{fmtShort(mon)}</p>
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

            {/* Sprint summary stats */}
            {progress ? (
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#0d1117] border border-white/8 rounded-2xl py-3 text-center">
                  <p className={`font-black text-2xl ${outcome === 'promoted' ? 'text-green-400' : outcome === 'relegated' ? 'text-red-400' : 'text-indigo-400'}`}>
                    {progress.total_league_points ?? 0}
                  </p>
                  <p className="text-gray-600 text-[10px] mt-0.5">Final LP</p>
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
            ) : isLive ? (
              <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-2xl px-4 py-3 text-center">
                <p className="text-indigo-300 text-sm font-semibold">Sprint in progress</p>
                <p className="text-gray-500 text-xs mt-1">Submit your picks in the Gameweek tab to start earning LP</p>
              </div>
            ) : null}

            {/* Rankings section */}
            {(rankings.length > 0 || overallRanking.length > 0) && (
              <div className="space-y-2">
                {overallRanking.length > 0 && (
                  <button
                    onClick={() => setShowOverall(true)}
                    className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border border-indigo-500/25 bg-indigo-950/30 hover:bg-indigo-950/50 transition-colors"
                  >
                    <div className="text-left">
                      <p className="text-white font-bold text-sm">Overall Sprint Rankings</p>
                      <p className="text-gray-500 text-xs mt-0.5">{overallRanking.length} players across all divisions</p>
                    </div>
                    <span className="text-indigo-400 font-semibold text-sm">→</span>
                  </button>
                )}
                {rankings.length > 0 && (
                  <InlineRankings
                    rankings={rankings}
                    myUserId={effectiveUserId}
                    promLP={promLP}
                    relLP={relLP}
                    onViewFull={() => setShowRankings(true)}
                  />
                )}
              </div>
            )}

            {/* Gameweeks */}
            {gameweeks.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <p className="text-gray-500 text-[11px] font-bold tracking-widest uppercase flex-shrink-0">Weekly breakdown</p>
                  <div className="flex-1 h-px bg-white/5" />
                </div>
                {gameweeks.map((gw, i) => (
                  <GameweekSection
                    key={gw.id}
                    gw={gw}
                    lpBefore={cumLP[i]?.before ?? 0}
                    lpAfter={cumLP[i]?.after ?? 0}
                    isOpen={false}
                  />
                ))}
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
function CurrentSprintCard({ sprint, onEnter }) {
  const lp      = sprint.total_league_points ?? null
  const hasStats = lp !== null
  const gws     = sprint.gameweeks || []

  // Find the active (PUBLISHED/LOCKED) week
  const activeGw = gws.find(g => {
    const st = getWeekStatus(g.lock_time, g.status)
    return st === 'PUBLISHED' || st === 'LOCKED'
  })

  return (
    <div className="rounded-2xl overflow-hidden border border-indigo-500/30"
      style={{ background: 'linear-gradient(160deg, rgba(99,102,241,0.13) 0%, rgba(13,17,23,1) 65%)', boxShadow: '0 0 50px -12px rgba(99,102,241,0.28)' }}>

      {/* Top: badge + sprint name */}
      <div className="px-4 pt-4 pb-3">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-wider text-green-400 bg-green-900/35 border border-green-500/30 px-2.5 py-1 rounded-full mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
          LIVE SPRINT
        </span>
        <h2 className="text-white font-black text-2xl leading-tight">{sprint.name}</h2>
        <p className="text-gray-500 text-xs mt-0.5">{fmtShort(sprint.start_date)} – {fmtShort(sprint.end_date)}</p>
        {sprint.division_name && (
          <p className="text-indigo-300 text-xs mt-1 font-semibold">{sprint.division_icon} {sprint.division_name}</p>
        )}
      </div>

      {/* Week schedule with dates */}
      {gws.length > 0 && (
        <div className="px-4 pb-3 space-y-1.5">
          {gws.map(gw => {
            const { mon, sun } = getWeekRange(gw.lock_time)
            const st = getWeekStatus(gw.lock_time, gw.status)
            const isActive = st === 'PUBLISHED' || st === 'LOCKED'
            const isDone   = st === 'FINISHED'
            const countdown = isActive ? fmtCountdown(gw.lock_time) : st === 'DRAFT' && mon ? fmtCountdown(mon) : null
            return (
              <div key={gw.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${
                  isActive ? 'bg-indigo-900/20 border-indigo-500/25' :
                  isDone   ? 'bg-white/3 border-white/6' :
                             'bg-white/2 border-white/5'
                }`}>
                {/* Status dot */}
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  isActive ? 'bg-green-400 animate-pulse' :
                  isDone   ? 'bg-indigo-500/60' :
                             'bg-gray-700'
                }`} />
                {/* Week label */}
                <span className={`text-xs font-bold flex-shrink-0 w-6 ${
                  isActive ? 'text-indigo-300' : isDone ? 'text-gray-500' : 'text-gray-700'
                }`}>W{gw.sprint_week}</span>
                {/* Date range */}
                <span className={`text-xs flex-1 min-w-0 truncate ${
                  isActive ? 'text-white' : isDone ? 'text-gray-500' : 'text-gray-600'
                }`}>
                  {mon ? `${fmtWeekday(mon)} → ${fmtWeekday(sun)}` : `Week ${gw.sprint_week}`}
                </span>
                {/* Status + countdown */}
                <span className={`text-[10px] flex-shrink-0 font-semibold ${
                  isActive ? 'text-yellow-300' : isDone ? 'text-indigo-400/60' : 'text-gray-700'
                }`}>
                  {isActive && countdown ? `Locks in ${countdown}` :
                   isActive ? 'Open' :
                   isDone   ? `+${gw.entry?.league_points ?? 0} LP` :
                   countdown ? `Starts in ${countdown}` : 'Upcoming'}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Stats row (only if LP earned) */}
      {hasStats && (
        <div className="flex border-t border-white/6 divide-x divide-white/5">
          <div className="flex-1 py-3 text-center">
            <p className="text-indigo-400 font-black text-xl leading-none">{lp}</p>
            <p className="text-gray-600 text-[10px] mt-1">LP earned</p>
          </div>
          <div className="flex-1 py-3 text-center">
            <p className="text-white font-black text-xl leading-none">{sprint.total_correct_picks ?? 0}</p>
            <p className="text-gray-600 text-[10px] mt-1">Correct</p>
          </div>
          <div className="flex-1 py-3 text-center">
            <p className="text-yellow-400 font-black text-xl leading-none">{sprint.perfect_weeks ?? 0}</p>
            <p className="text-gray-600 text-[10px] mt-1">⭐ Perfect</p>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="p-3 border-t border-white/5">
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
function PastSprintCard({ sprint, onEnter }) {
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
            <button
              onClick={() => onEnter(sprint)}
              className="flex-shrink-0 text-xs text-gray-400 hover:text-white font-semibold px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              Details →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function MySprintsPage() {
  const [data,     setData]     = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState(null)
  const [myUserId, setMyUserId] = useState(null)

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

  const realPast = data?.past || []

  // July sprint shows as current only once its W1 has started
  const sprintStarted = DEMO_NOW >= new Date(MOCK_CURRENT_SPRINT.start_date + 'T00:00:00')
  const currentSprint = sprintStarted ? MOCK_CURRENT_SPRINT : null

  // History: real API finished sprints (end_date in the past) + mock past sprints, deduped, newest first, max 4
  const realPastFinished = realPast
    .filter(s => s.end_date && new Date(s.end_date + 'T23:59:59') < DEMO_NOW)
    .map(s => ({ ...s, status: 'finished' }))
  const realPastIds = new Set(realPastFinished.map(s => s.id))
  const historicSprints = [
    ...realPastFinished,
    ...MOCK_PAST_SPRINTS.filter(s => !realPastIds.has(s.id)),
  ].sort((a, b) => new Date(b.start_date) - new Date(a.start_date)).slice(0, 4)

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
                <PastSprintCard key={s.id} sprint={s} onEnter={setSelected} />
              ))}
            </div>
          </section>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
