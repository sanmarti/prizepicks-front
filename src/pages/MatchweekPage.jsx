import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getGloryStatus, getGloryGameweek, submitGloryPicks,
  getGloryLeaderboard, getCommunityPicks, getFixtureForm, getFixtureStats, getGameweekLive, getEnergyPacks,
} from '../api/glory'

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

const EVENT_TYPE_LABELS = {
  MATCH_RESULT:  { label: 'Match Result',       icon: '⚽' },
  WHO_QUALIFIES: { label: 'Who Qualifies?',     icon: '💥' },
  GOALS:         { label: 'Goals Over/Under',   icon: '⚽' },
  CLEAN_SHEET:   { label: 'Clean Sheet',        icon: '🧤' },
  BTTS:          { label: 'Both Teams Score',   icon: '🎯' },
  PLAYER_SCORE:  { label: 'Player Scores',      icon: '⭐' },
  CORNER_OVER:   { label: 'Corner Kicks',       icon: '🚩' },
}

const COUNTRY_FLAGS = {
  'Argentina':'🇦🇷','Austria':'🇦🇹','France':'🇫🇷','Iraq':'🇮🇶',
  'Portugal':'🇵🇹','Uzbekistan':'🇺🇿','England':'🏴󠁧󠁢󠁥󠁮󠁧󠁿','Ghana':'🇬🇭',
  'Colombia':'🇨🇴','Congo DR':'🇨🇩','Germany':'🇩🇪','USA':'🇺🇸',
  'Brazil':'🇧🇷','Mexico':'🇲🇽','Canada':'🇨🇦','Japan':'🇯🇵',
  'Spain':'🇪🇸','Italy':'🇮🇹','Netherlands':'🇳🇱','Croatia':'🇭🇷',
  'Morocco':'🇲🇦','Senegal':'🇸🇳','Ecuador':'🇪🇨','Uruguay':'🇺🇾',
  'Switzerland':'🇨🇭','Denmark':'🇩🇰','Belgium':'🇧🇪','Poland':'🇵🇱',
  'Serbia':'🇷🇸','Australia':'🇦🇺','South Korea':'🇰🇷','Iran':'🇮🇷',
  'Saudi Arabia':'🇸🇦','Tunisia':'🇹🇳','Cameroon':'🇨🇲','Ivory Coast':'🇨🇮',
  'Costa Rica':'🇨🇷','Panama':'🇵🇦','Jamaica':'🇯🇲','Guatemala':'🇬🇹',
  'Sweden':'🇸🇪','Wales':'🏴󠁧󠁢󠁷󠁬󠁳󠁿','Scotland':'🏴󠁧󠁢󠁳󠁣󠁴󠁿','Turkey':'🇹🇷','Türkiye':'🇹🇷',
  'Ukraine':'🇺🇦','Romania':'🇷🇴','Slovakia':'🇸🇰','Hungary':'🇭🇺',
  'Czechia':'🇨🇿','Czech Republic':'🇨🇿','Slovenia':'🇸🇮','Albania':'🇦🇱',
  'Georgia':'🇬🇪','New Zealand':'🇳🇿','Bolivia':'🇧🇴','Paraguay':'🇵🇾',
  'Peru':'🇵🇪','Chile':'🇨🇱','Venezuela':'🇻🇪','Egypt':'🇪🇬',
  'Nigeria':'🇳🇬','Algeria':'🇩🇿','Mali':'🇲🇱','South Africa':'🇿🇦',
  'Angola':'🇦🇴','Qatar':'🇶🇦','Kuwait':'🇰🇼','Indonesia':'🇮🇩',
  'United States':'🇺🇸','Honduras':'🇭🇳','El Salvador':'🇸🇻','Haiti':'🇭🇹',
  'Trinidad and Tobago':'🇹🇹','Russia':'🇷🇺','Israel':'🇮🇱',
  'Norway':'🇳🇴','Finland':'🇫🇮','Iceland':'🇮🇸','Ireland':'🇮🇪',
  'Cape Verde Islands':'🇨🇻','Cape Verde':'🇨🇻',
  'Burkina Faso':'🇧🇫','Guinea':'🇬🇳','Guinea-Bissau':'🇬🇼','Mozambique':'🇲🇿',
  'Tanzania':'🇹🇿','Zimbabwe':'🇿🇼','Zambia':'🇿🇲','Namibia':'🇳🇦',
  'Libya':'🇱🇾','Sudan':'🇸🇩','Ethiopia':'🇪🇹','Benin':'🇧🇯',
  'Togo':'🇹🇬','Gabon':'🇬🇦','Rwanda':'🇷🇼','Uganda':'🇺🇬',
  'Oman':'🇴🇲','Bahrain':'🇧🇭','Jordan':'🇯🇴','United Arab Emirates':'🇦🇪','UAE':'🇦🇪',
  'Syria':'🇸🇾','Lebanon':'🇱🇧','China':'🇨🇳','India':'🇮🇳',
  'Thailand':'🇹🇭','Vietnam':'🇻🇳','Malaysia':'🇲🇾','Philippines':'🇵🇭',
  'North Korea':'🇰🇵','Kyrgyzstan':'🇰🇬','Tajikistan':'🇹🇯','Turkmenistan':'🇹🇲',
  'Azerbaijan':'🇦🇿','Armenia':'🇦🇲','Kazakhstan':'🇰🇿','Belarus':'🇧🇾',
  'Moldova':'🇲🇩','Kosovo':'🇽🇰','Montenegro':'🇲🇪','North Macedonia':'🇲🇰',
  'Bosnia':'🇧🇦','Bosnia and Herzegovina':'🇧🇦','Lithuania':'🇱🇹','Latvia':'🇱🇻','Estonia':'🇪🇪',
  'Luxembourg':'🇱🇺','Malta':'🇲🇹','Cyprus':'🇨🇾','Liechtenstein':'🇱🇮',
  'Andorra':'🇦🇩','San Marino':'🇸🇲','Gibraltar':'🇬🇮','Faroe Islands':'🇫🇴',
  'New Caledonia':'🇳🇨','Papua New Guinea':'🇵🇬','Fiji':'🇫🇯',
  'Dominican Republic':'🇩🇴','Cuba':'🇨🇺','Curaçao':'🇨🇼','Nicaragua':'🇳🇮',
  'Suriname':'🇸🇷','Guyana':'🇬🇾',
}

const COMPETITION_ICONS = {
  'World Cup':'🌍','Champions League':'⭐','Premier League':'🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'La Liga':'🇪🇸','Serie A':'🇮🇹','Bundesliga':'🇩🇪','Ligue 1':'🇫🇷',
  'Eredivisie':'🇳🇱','Euro':'🇪🇺','Copa America':'🌎','Nations League':'🌐',
}

function getFlag(teamName) {
  if (!teamName) return ''
  const exact = COUNTRY_FLAGS[teamName.trim()]
  if (exact) return exact
  // partial match
  const key = Object.keys(COUNTRY_FLAGS).find(k => teamName.trim().startsWith(k) || k.startsWith(teamName.trim()))
  return key ? COUNTRY_FLAGS[key] : ''
}

function energyStyle(cost) {
  if (!cost) return { cls: 'bg-white/8 text-gray-500' }
  if (cost >= 8) return { cls: 'bg-yellow-400/25 text-yellow-200 font-bold' }
  if (cost >= 5) return { cls: 'bg-yellow-500/20 text-yellow-300' }
  return { cls: 'bg-yellow-600/15 text-yellow-500' }
}

const MAX_WEEKLY_EXTRA = 5

const LIVE_STATUSES     = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'SUSP', 'INT', 'LIVE']
const FINISHED_STATUSES = ['FT', 'AET', 'PEN', 'AWD', 'WO']

// Sort events: live fixtures first, then by match_time, then WHO_QUALIFIES first within each fixture
function sortWithLiveFirst(events, liveData) {
  return [...events].sort((a, b) => {
    const aLive = (liveData[a.id] && LIVE_STATUSES.includes(liveData[a.id].fixture_status_short)) ? 0 : 1
    const bLive = (liveData[b.id] && LIVE_STATUSES.includes(liveData[b.id].fixture_status_short)) ? 0 : 1
    if (aLive !== bLive) return aLive - bLive
    const timeDiff = new Date(a.match_time) - new Date(b.match_time)
    if (timeDiff !== 0) return timeDiff
    const aIsWQ = a.event_type === 'WHO_QUALIFIES' ? 0 : 1
    const bIsWQ = b.event_type === 'WHO_QUALIFIES' ? 0 : 1
    return aIsWQ - bIsWQ
  })
}

// Compute the live color for a user's picked option given live fixture data
function computePickLiveStatus(event, pickedOptionId, liveEvent) {
  if (!liveEvent) {
    const opt = (event.options || []).find(o => o.id === pickedOptionId)
    if (opt?.result === 'WON') return 'won'
    if (opt?.result === 'LOST') return 'lost'
    return 'upcoming'
  }
  const { fixture_status_short: st, fixture_elapsed: elapsed, home_goals: hg, away_goals: ag, options } = liveEvent

  if (!st || st === 'NS' || st === 'TBD') return 'upcoming'

  const pickedOpt = (options || []).find(o => o.id === pickedOptionId)
  if (!pickedOpt) return 'upcoming'

  // Finished: use settled result
  if (FINISHED_STATUSES.includes(st)) {
    if (pickedOpt.result === 'WON') return 'won'
    if (pickedOpt.result === 'LOST') return 'lost'
    return 'finished_unknown'
  }

  if (!LIVE_STATUSES.includes(st)) return 'upcoming'

  // Early-settled mid-game: outcome already determined, skip score inference
  if (pickedOpt.result === 'WON') return 'won'
  if (pickedOpt.result === 'LOST') return 'lost'

  // LIVE — compute based on event type + result_key + current score
  const hGoals = hg ?? 0
  const aGoals = ag ?? 0
  const total  = hGoals + aGoals
  const min    = elapsed ?? 0
  const isLate = min >= 70

  const rk = pickedOpt.result_key

  // MATCH_RESULT
  if (event.event_type === 'MATCH_RESULT') {
    const homeAhead = hGoals > aGoals
    const awayAhead = aGoals > hGoals
    const tied      = hGoals === aGoals
    const margin    = Math.abs(hGoals - aGoals)
    if (rk === 'HOME_WIN') {
      if (homeAhead) return (isLate && margin >= 1) ? 'likely'  : 'live_winning'
      if (tied)      return isLate                  ? 'unlikely' : 'live_neutral'
      return isLate ? 'unlikely' : 'live_neutral'
    }
    if (rk === 'AWAY_WIN') {
      if (awayAhead) return (isLate && margin >= 1) ? 'likely'  : 'live_winning'
      if (tied)      return isLate                  ? 'unlikely' : 'live_neutral'
      return isLate ? 'unlikely' : 'live_neutral'
    }
    if (rk === 'DRAW') {
      if (tied)      return (isLate && min >= 80)   ? 'likely'  : 'live_winning'
      return isLate ? 'unlikely' : 'live_neutral'
    }
  }

  // BTTS
  if (event.event_type === 'BTTS') {
    const bothScored = hGoals > 0 && aGoals > 0
    if (rk === 'BTTS_YES') {
      if (bothScored) return isLate ? 'likely' : 'live_winning'
      if (hGoals > 0 || aGoals > 0) return 'live_neutral'
      return isLate ? 'unlikely' : 'live_neutral'
    }
    if (rk === 'BTTS_NO') {
      if (bothScored) return isLate ? 'unlikely' : 'live_neutral'
      return (isLate && min >= 80) ? 'likely' : 'live_winning'
    }
  }

  // GOALS (Over/Under)
  if (event.event_type === 'GOALS') {
    // Try to parse threshold from label (e.g. "Over 2.5" or "Under 2")
    const overMatch  = pickedOpt.label.match(/over\s*([\d.]+)/i)
    const underMatch = pickedOpt.label.match(/under\s*([\d.]+)/i)
    if (overMatch) {
      const thresh = parseFloat(overMatch[1])
      if (total > thresh) return isLate ? 'likely' : 'live_winning'
      return isLate ? 'unlikely' : 'live_neutral'
    }
    if (underMatch) {
      const thresh = parseFloat(underMatch[1])
      if (total < thresh) return isLate ? 'likely' : 'live_winning'
      return isLate ? 'unlikely' : 'live_neutral'
    }
  }

  // CLEAN_SHEET
  if (event.event_type === 'CLEAN_SHEET') {
    const label = pickedOpt.label.toLowerCase()
    const homeCS = label.includes('home') || (liveEvent.home_team && label.includes(liveEvent.home_team.toLowerCase()))
    if (rk === 'CS_YES' || pickedOpt.label.toLowerCase() === 'yes') {
      const homeConceded = aGoals > 0
      const awayConceded = hGoals > 0
      const conceded = homeCS ? homeConceded : awayConceded
      if (!conceded) return (isLate && min >= 75) ? 'likely' : 'live_winning'
      return isLate ? 'unlikely' : 'live_neutral'
    }
  }

  // WHO_QUALIFIES — knockout: being behind is always At Risk regardless of minute
  if (event.event_type === 'WHO_QUALIFIES') {
    const isET  = st === 'ET' || st === 'BT' || st === 'P'
    const margin = Math.abs(hGoals - aGoals)
    const pickedHomeWinning = rk === 'HOME_QUALIFIES' && hGoals > aGoals
    const pickedAwayWinning = rk === 'AWAY_QUALIFIES' && aGoals > hGoals
    const pickedTeamAhead   = pickedHomeWinning || pickedAwayWinning
    const tied              = hGoals === aGoals
    if (pickedTeamAhead)  return (isLate || isET) && margin >= 1 ? 'likely' : 'live_winning'
    if (tied)             return 'live_neutral'
    return 'unlikely'
  }

  // Default for LIVE
  return 'live_neutral'
}

const LIVE_STATUS_STYLES = {
  upcoming:         { bg: 'bg-gray-800/50',       text: 'text-gray-500',    border: 'border-gray-700/50',    dot: 'bg-gray-600',      label: 'Starting soon'  },
  live_neutral:     { bg: 'bg-blue-900/25',        text: 'text-blue-300',    border: 'border-blue-700/30',    dot: 'bg-blue-400',      label: 'Live'           },
  live_winning:     { bg: 'bg-green-900/30',       text: 'text-green-300',   border: 'border-green-700/40',   dot: 'bg-green-400',     label: 'Favorable'      },
  likely:           { bg: 'bg-green-900/40',       text: 'text-green-300',   border: 'border-green-600/50',   dot: 'bg-green-400',     label: 'Looking good ✓' },
  unlikely:         { bg: 'bg-red-900/30',         text: 'text-red-300',     border: 'border-red-700/40',     dot: 'bg-red-400',       label: 'At risk'        },
  won:              { bg: 'bg-green-900/30',       text: 'text-green-300',   border: 'border-green-700/40',   dot: 'bg-green-400',     label: 'Won ✓'          },
  lost:             { bg: 'bg-red-900/25',         text: 'text-red-300',     border: 'border-red-700/30',     dot: 'bg-red-400',       label: 'Lost'           },
  finished_unknown: { bg: 'bg-gray-800/50',        text: 'text-gray-500',    border: 'border-gray-700/50',    dot: 'bg-gray-500',      label: 'Settled'        },
}

function LivePickBadge({ status, elapsed, matchTime }) {
  const s = LIVE_STATUS_STYLES[status] || LIVE_STATUS_STYLES.upcoming
  const isLive = ['live_neutral', 'live_winning', 'likely', 'unlikely'].includes(status)
  let label = s.label
  if (status === 'upcoming' && matchTime) {
    const today = new Date()
    const mt    = new Date(matchTime)
    const isToday = mt.getFullYear() === today.getFullYear()
                 && mt.getMonth()    === today.getMonth()
                 && mt.getDate()     === today.getDate()
    label = isToday ? 'Starting soon' : 'Upcoming'
  }
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${s.bg} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot} ${isLive ? 'animate-pulse' : ''}`} />
      <span className={`text-[10px] font-bold ${s.text}`}>{label}</span>
      {isLive && elapsed > 0 && (
        <span className={`text-[9px] font-medium ${s.text} opacity-70`}>{elapsed}'</span>
      )}
    </div>
  )
}

function fmt(d, opts) { return new Date(d).toLocaleString('en-GB', opts) }
function fmtFull(d)   { return fmt(d, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }
function fmtShort(d)  { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }
function fmtWeekRange(lockTime) {
  if (!lockTime) return null
  const lock = new Date(lockTime)
  const start = new Date(lock); start.setDate(start.getDate() - 6)
  const o = { day: 'numeric', month: 'short' }
  return `${start.toLocaleDateString('en-GB', o)} – ${lock.toLocaleDateString('en-GB', o)}`
}
function fmtCountdown(lockTime) {
  if (!lockTime) return null
  const diff = new Date(lockTime) - Date.now()
  if (diff <= 0) return 'Deadline passed'
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (d > 0) return `${d}d ${h}h left`
  if (h > 0) return `${h}h ${m}m left`
  return `${m}m left`
}

// ── Team form dropdown ─────────────────────────────────────────────────────────
function FormDot({ result }) {
  const cfg = result === 'W'
    ? { bg: 'bg-green-500', text: 'text-white' }
    : result === 'D'
    ? { bg: 'bg-gray-600',  text: 'text-gray-200' }
    : { bg: 'bg-red-500',   text: 'text-white' }
  return (
    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${cfg.bg} ${cfg.text}`}>
      {result}
    </span>
  )
}

function FormDropdown({ fixtureId, homeTeam, awayTeam, homeFlag, awayFlag }) {
  const [open, setOpen]       = useState(false)
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(false)
  const fetched = useRef(false)

  const toggle = () => {
    setOpen(o => !o)
    if (!fetched.current && fixtureId) {
      fetched.current = true
      setLoading(true)
      getFixtureForm(fixtureId)
        .then(r => setData(r.data))
        .catch(() => setData(null))
        .finally(() => setLoading(false))
    }
  }

  return (
    <div className="border-t border-white/6">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-2 text-left hover:bg-white/3 transition-colors"
      >
        <span className="text-[10px] text-gray-600 font-semibold tracking-wide uppercase">Recent form</span>
        <span className={`text-gray-700 text-[9px] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {loading && (
            <div className="flex items-center gap-2 text-gray-600 text-[10px]">
              <div className="w-3 h-3 border border-gray-700 border-t-indigo-400 rounded-full animate-spin" />
              Loading…
            </div>
          )}

          {!loading && data && (() => {
            const rows = [
              { logo: data.home_logo, name: homeTeam, flag: homeFlag, form: data.home_form },
              { logo: data.away_logo, name: awayTeam, flag: awayFlag, form: data.away_form },
            ]
            return rows.map((team, ti) => (
              <div key={ti} className="flex items-center gap-3">
                {/* Team logo */}
                <div className="w-6 h-6 flex-shrink-0">
                  {team.logo
                    ? <img src={team.logo} alt="" className="w-full h-full object-contain" onError={e => { e.target.style.display = 'none' }} />
                    : <span className="text-sm">{team.flag}</span>
                  }
                </div>
                {/* Team name */}
                <span className="text-gray-400 text-[11px] font-semibold flex-1 truncate min-w-0">{team.name}</span>
                {/* Last 5 results */}
                <div className="flex gap-1 flex-shrink-0">
                  {team.form?.length
                    ? team.form.map((m, i) => <FormDot key={i} result={m.result} />)
                    : <span className="text-gray-700 text-[9px]">No data</span>
                  }
                </div>
              </div>
            ))
          })()}

          {!loading && !data && (
            <p className="text-gray-700 text-[10px]">Form data unavailable</p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Live match insights dropdown ───────────────────────────────────────────────
function InsightsDropdown({ fixtureId, liveEv }) {
  const [open, setOpen]       = useState(false)
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(false)
  const fetchedRef  = useRef(false)
  const prevElapsed = useRef(null)

  const doFetch = useCallback(() => {
    if (!fixtureId) return
    setLoading(true)
    getFixtureStats(fixtureId)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [fixtureId])

  const toggle = () => {
    setOpen(o => {
      const next = !o
      if (next && !fetchedRef.current) { fetchedRef.current = true; doFetch() }
      return next
    })
  }

  // Re-fetch while open whenever elapsed minute changes (every ~1 min of live action)
  useEffect(() => {
    const el = liveEv?.fixture_elapsed
    if (open && el != null && el !== prevElapsed.current) {
      prevElapsed.current = el
      doFetch()
    }
  }, [liveEv?.fixture_elapsed, open, doFetch])

  const st        = liveEv?.fixture_status_short
  const elapsed   = liveEv?.fixture_elapsed
  const isLive    = LIVE_STATUSES.includes(st)
  const isFinished = FINISHED_STATUSES.includes(st)
  const statusTag = isFinished ? 'FT' : isLive && elapsed ? `${elapsed}'` : null

  return (
    <div className="border-t border-white/6">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-2 text-left hover:bg-white/3 transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-500 font-semibold tracking-wide uppercase">
            {isLive ? 'Live insights' : isFinished ? 'Match report' : 'Match insights'}
          </span>
          {isLive && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse flex-shrink-0" />}
        </div>
        <div className="flex items-center gap-1.5">
          {statusTag && (
            <span className={`text-[9px] font-bold tabular-nums ${isLive ? 'text-blue-400' : 'text-gray-500'}`}>{statusTag}</span>
          )}
          <span className={`text-gray-700 text-[9px] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▼</span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-3 space-y-2">
          {loading && (
            <div className="flex items-center gap-2 text-gray-600 text-[10px]">
              <div className="w-3 h-3 border border-gray-700 border-t-blue-400 rounded-full animate-spin" />
              Loading…
            </div>
          )}

          {!loading && data && (() => {
            const allGoals = (data.events || []).filter(e => e.type === 'Goal')
            const allCards = (data.events || []).filter(e => e.type === 'Card')

            // Split by elapsed: null means penalty shootout event (no clock)
            const gameEvents    = [...allGoals, ...allCards].filter(e => e.elapsed != null)
              .sort((a, b) => (a.elapsed ?? 0) - (b.elapsed ?? 0))
            const shootoutEvents = allGoals.filter(e => e.elapsed == null)

            const stats  = data.statistics || []
            const [hStats, aStats] = stats.length >= 2 ? [stats[0], stats[1]] : [null, null]
            const KEY_STATS = ['Ball Possession', 'Total Shots', 'Shots on Goal', 'Corner Kicks', 'Fouls']
            const statRows = hStats
              ? KEY_STATS.map(k => ({
                  label: k,
                  h: hStats.stats.find(s => s.type === k)?.value ?? '—',
                  a: aStats?.stats.find(s => s.type === k)?.value ?? '—',
                })).filter(r => r.h !== '—' || r.a !== '—')
              : []

            const hasData = gameEvents.length > 0 || shootoutEvents.length > 0 || statRows.length > 0
            if (!hasData) return <p className="text-gray-700 text-[10px]">No data yet — check back during the match</p>

            const renderEvent = (e, i) => {
              const detailLc    = e.detail?.toLowerCase() ?? ''
              const isMissedPen = detailLc.includes('missed')
              const isOwnGoal   = detailLc.includes('own goal')
              const isPenGoal   = e.type === 'Goal' && detailLc.includes('penalty') && !isMissedPen
              const icon = e.type === 'Goal'
                ? isMissedPen ? '✗' : isOwnGoal ? '⚽ OG' : '⚽'
                : e.detail === 'Yellow Card'   ? '🟨'
                : e.detail === 'Red Card'      ? '🟥'
                : e.detail?.includes('Second') ? '🟨🟥' : '📋'
              return (
                <div key={i} className="flex items-center gap-2 text-[11px]">
                  {e.elapsed != null ? (
                    <span className="text-gray-600 w-7 text-right font-mono flex-shrink-0">
                      {e.elapsed}{e.extra ? `+${e.extra}` : ''}′
                    </span>
                  ) : (
                    <span className="w-7 flex-shrink-0" />
                  )}
                  <span className={`flex-shrink-0 text-xs ${isMissedPen ? 'text-red-400' : ''}`}>{icon}</span>
                  <span className="text-gray-300 truncate flex-1 min-w-0">
                    {e.player}{isPenGoal && <span className="text-gray-500 text-[9px] ml-1">(pen)</span>}
                  </span>
                  <span className="text-gray-600 text-[9px] flex-shrink-0 truncate max-w-[60px]">
                    {e.team?.split(' ').slice(-1)[0]}
                  </span>
                </div>
              )
            }

            return (
              <>
                {/* Regular game events: goals + cards */}
                {gameEvents.length > 0 && (
                  <div className="space-y-1">
                    {gameEvents.map(renderEvent)}
                  </div>
                )}

                {/* Penalty shootout */}
                {shootoutEvents.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex-1 h-px bg-white/8" />
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider flex-shrink-0">Penalty shootout</span>
                      <div className="flex-1 h-px bg-white/8" />
                    </div>
                    {shootoutEvents.map(renderEvent)}
                  </div>
                )}

                {/* Stats table */}
                {statRows.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-white/5">
                    <div className="flex justify-between text-[9px] text-gray-600 pb-0.5">
                      <span className="truncate max-w-[80px]">{hStats?.team?.split(' ').slice(-1)[0]}</span>
                      <span className="truncate max-w-[80px] text-right">{aStats?.team?.split(' ').slice(-1)[0]}</span>
                    </div>
                    {statRows.map((r, i) => (
                      <div key={i} className="flex items-center gap-2 text-[10px]">
                        <span className="text-gray-200 w-8 text-right font-semibold tabular-nums">{r.h}</span>
                        <span className="text-gray-600 flex-1 text-center text-[9px]">{r.label}</span>
                        <span className="text-gray-200 w-8 font-semibold tabular-nums">{r.a}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )
          })()}

          {!loading && !data && (
            <p className="text-gray-700 text-[10px]">Insights unavailable</p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Mock events (used when API returns no events) ──────────────────────────────
const MOCK_GW_EVENTS = [
  // ── Premier League ──
  { id:'mg1',  fixture_name:'Arsenal vs Chelsea',          event_type:'MATCH_RESULT', competition:'Premier League', match_time:'2026-06-20T19:45:00Z', total_picks:312,  options:[{id:'mg1o1',label:'Arsenal Win',energy_cost:4,pick_count:145},{id:'mg1o2',label:'Draw',energy_cost:7,pick_count:89},{id:'mg1o3',label:'Chelsea Win',energy_cost:5,pick_count:78}] },
  { id:'mg2',  fixture_name:'Liverpool vs Man City',       event_type:'MATCH_RESULT', competition:'Premier League', match_time:'2026-06-21T14:00:00Z', total_picks:445,  options:[{id:'mg2o1',label:'Liverpool Win',energy_cost:5,pick_count:178},{id:'mg2o2',label:'Draw',energy_cost:7,pick_count:134},{id:'mg2o3',label:'Man City Win',energy_cost:4,pick_count:133}] },
  { id:'mg3',  fixture_name:'Man United vs Tottenham',     event_type:'MATCH_RESULT', competition:'Premier League', match_time:'2026-06-21T16:30:00Z', total_picks:278,  options:[{id:'mg3o1',label:'Man United Win',energy_cost:6,pick_count:89},{id:'mg3o2',label:'Draw',energy_cost:6,pick_count:95},{id:'mg3o3',label:'Tottenham Win',energy_cost:5,pick_count:94}] },
  { id:'mg4',  fixture_name:'Arsenal vs Liverpool',        event_type:'BTTS',         competition:'Premier League', match_time:'2026-06-20T19:45:00Z', total_picks:389,  options:[{id:'mg4o1',label:'Both Teams Score',energy_cost:4,pick_count:245},{id:'mg4o2',label:'Clean Sheet',energy_cost:5,pick_count:144}] },
  { id:'mg12', fixture_name:'Man City vs Chelsea',         event_type:'GOALS',        competition:'Premier League', match_time:'2026-06-21T14:00:00Z', total_picks:334,  options:[{id:'mg12o1',label:'Over 2.5 Goals',energy_cost:4,pick_count:212},{id:'mg12o2',label:'Under 2.5 Goals',energy_cost:5,pick_count:122}] },
  { id:'mg13', fixture_name:'Arsenal vs Tottenham',        event_type:'BTTS',         competition:'Premier League', match_time:'2026-06-22T16:30:00Z', total_picks:445,  options:[{id:'mg13o1',label:'Both Teams Score',energy_cost:4,pick_count:289},{id:'mg13o2',label:'Clean Sheet',energy_cost:6,pick_count:156}] },
  // ── La Liga ──
  { id:'mg5',  fixture_name:'Real Madrid vs Barcelona',    event_type:'MATCH_RESULT', competition:'La Liga',        match_time:'2026-06-22T20:00:00Z', total_picks:892,  options:[{id:'mg5o1',label:'Real Madrid Win',energy_cost:4,pick_count:356},{id:'mg5o2',label:'Draw',energy_cost:7,pick_count:267},{id:'mg5o3',label:'Barcelona Win',energy_cost:5,pick_count:269}] },
  { id:'mg6',  fixture_name:'Real Madrid vs Atletico',     event_type:'GOALS',        competition:'La Liga',        match_time:'2026-06-22T20:00:00Z', total_picks:534,  options:[{id:'mg6o1',label:'Over 2.5 Goals',energy_cost:4,pick_count:312},{id:'mg6o2',label:'Under 2.5 Goals',energy_cost:5,pick_count:222}] },
  { id:'mg11', fixture_name:'Barcelona vs Atletico',       event_type:'MATCH_RESULT', competition:'La Liga',        match_time:'2026-06-19T20:00:00Z', total_picks:512,  options:[{id:'mg11o1',label:'Barcelona Win',energy_cost:4,pick_count:245},{id:'mg11o2',label:'Draw',energy_cost:6,pick_count:145},{id:'mg11o3',label:'Atletico Win',energy_cost:5,pick_count:122}] },
  // ── Bundesliga / Ligue 1 / Serie A ──
  { id:'mg7',  fixture_name:'Bayern Munich vs Dortmund',   event_type:'MATCH_RESULT', competition:'Bundesliga',     match_time:'2026-06-21T17:30:00Z', total_picks:621,  options:[{id:'mg7o1',label:'Bayern Win',energy_cost:3,pick_count:334},{id:'mg7o2',label:'Draw',energy_cost:7,pick_count:156},{id:'mg7o3',label:'Dortmund Win',energy_cost:6,pick_count:131}] },
  { id:'mg14', fixture_name:'Bayern Munich vs Leverkusen', event_type:'GOALS',        competition:'Bundesliga',     match_time:'2026-06-21T17:30:00Z', total_picks:289,  options:[{id:'mg14o1',label:'Over 2.5 Goals',energy_cost:4,pick_count:189},{id:'mg14o2',label:'Under 2.5 Goals',energy_cost:5,pick_count:100}] },
  { id:'mg8',  fixture_name:'PSG vs Marseille',            event_type:'MATCH_RESULT', competition:'Ligue 1',        match_time:'2026-06-22T21:00:00Z', total_picks:445,  options:[{id:'mg8o1',label:'PSG Win',energy_cost:3,pick_count:267},{id:'mg8o2',label:'Draw',energy_cost:7,pick_count:111},{id:'mg8o3',label:'Marseille Win',energy_cost:7,pick_count:67}] },
  { id:'mg15', fixture_name:'PSG vs Monaco',               event_type:'MATCH_RESULT', competition:'Ligue 1',        match_time:'2026-06-19T20:00:00Z', total_picks:234,  options:[{id:'mg15o1',label:'PSG Win',energy_cost:3,pick_count:145},{id:'mg15o2',label:'Draw',energy_cost:7,pick_count:56},{id:'mg15o3',label:'Monaco Win',energy_cost:6,pick_count:33}] },
  { id:'mg9',  fixture_name:'Juventus vs Inter Milan',     event_type:'MATCH_RESULT', competition:'Serie A',        match_time:'2026-06-20T20:45:00Z', total_picks:378,  options:[{id:'mg9o1',label:'Juventus Win',energy_cost:5,pick_count:145},{id:'mg9o2',label:'Draw',energy_cost:6,pick_count:123},{id:'mg9o3',label:'Inter Win',energy_cost:4,pick_count:110}] },
  { id:'mg10', fixture_name:'Juventus vs Inter Milan',     event_type:'BTTS',         competition:'Serie A',        match_time:'2026-06-20T20:45:00Z', total_picks:267,  options:[{id:'mg10o1',label:'Both Teams Score',energy_cost:4,pick_count:167},{id:'mg10o2',label:'Clean Sheet',energy_cost:5,pick_count:100}] },
  // ── World Cup 2026 ──
  { id:'wc1',  fixture_name:'England vs Spain',            event_type:'MATCH_RESULT', competition:'World Cup',      match_time:'2026-06-20T22:00:00Z', total_picks:1245, options:[{id:'wc1o1',label:'England Win',energy_cost:5,pick_count:445},{id:'wc1o2',label:'Draw',energy_cost:7,pick_count:378},{id:'wc1o3',label:'Spain Win',energy_cost:4,pick_count:422}] },
  { id:'wc2',  fixture_name:'Brazil vs France',            event_type:'MATCH_RESULT', competition:'World Cup',      match_time:'2026-06-21T22:00:00Z', total_picks:1891, options:[{id:'wc2o1',label:'Brazil Win',energy_cost:4,pick_count:756},{id:'wc2o2',label:'Draw',energy_cost:6,pick_count:567},{id:'wc2o3',label:'France Win',energy_cost:5,pick_count:568}] },
  { id:'wc3',  fixture_name:'Argentina vs Germany',        event_type:'MATCH_RESULT', competition:'World Cup',      match_time:'2026-06-22T18:00:00Z', total_picks:1567, options:[{id:'wc3o1',label:'Argentina Win',energy_cost:4,pick_count:623},{id:'wc3o2',label:'Draw',energy_cost:6,pick_count:489},{id:'wc3o3',label:'Germany Win',energy_cost:5,pick_count:455}] },
  { id:'wc4',  fixture_name:'Brazil vs Argentina',         event_type:'BTTS',         competition:'World Cup',      match_time:'2026-06-22T22:00:00Z', total_picks:2134, options:[{id:'wc4o1',label:'Both Teams Score',energy_cost:4,pick_count:1345},{id:'wc4o2',label:'Clean Sheet',energy_cost:6,pick_count:789}] },
  { id:'wc5',  fixture_name:'USA vs Mexico',               event_type:'MATCH_RESULT', competition:'World Cup',      match_time:'2026-06-21T20:00:00Z', total_picks:987,  options:[{id:'wc5o1',label:'USA Win',energy_cost:5,pick_count:389},{id:'wc5o2',label:'Draw',energy_cost:7,pick_count:312},{id:'wc5o3',label:'Mexico Win',energy_cost:5,pick_count:286}] },
  { id:'wc6',  fixture_name:'England vs Germany',          event_type:'GOALS',        competition:'World Cup',      match_time:'2026-06-20T22:00:00Z', total_picks:1123, options:[{id:'wc6o1',label:'Over 2.5 Goals',energy_cost:4,pick_count:712},{id:'wc6o2',label:'Under 2.5 Goals',energy_cost:5,pick_count:411}] },
  { id:'wc7',  fixture_name:'Portugal vs Morocco',         event_type:'MATCH_RESULT', competition:'World Cup',      match_time:'2026-06-22T00:00:00Z', total_picks:834,  options:[{id:'wc7o1',label:'Portugal Win',energy_cost:4,pick_count:389},{id:'wc7o2',label:'Draw',energy_cost:6,pick_count:245},{id:'wc7o3',label:'Morocco Win',energy_cost:6,pick_count:200}] },
]

// ── Mock previous-week results (shown when a FINISHED week has no API events) ──
const MOCK_RESULTS_EVENTS = [
  { id:'mr1', fixture_name:'England vs France',        event_type:'MATCH_RESULT', competition:'World Cup',      match_time:'2026-06-13T19:00:00Z', total_picks:1567, options:[{id:'mr1o1',label:'England Win',energy_cost:5,pick_count:623,result:'WON'},{id:'mr1o2',label:'Draw',energy_cost:7,pick_count:489,result:'LOST'},{id:'mr1o3',label:'France Win',energy_cost:4,pick_count:455,result:'LOST'}] },
  { id:'mr2', fixture_name:'Brazil vs Argentina',      event_type:'MATCH_RESULT', competition:'World Cup',      match_time:'2026-06-14T22:00:00Z', total_picks:2134, options:[{id:'mr2o1',label:'Brazil Win',energy_cost:4,pick_count:891,result:'WON'},{id:'mr2o2',label:'Draw',energy_cost:6,pick_count:712,result:'LOST'},{id:'mr2o3',label:'Argentina Win',energy_cost:5,pick_count:531,result:'LOST'}] },
  { id:'mr3', fixture_name:'Germany vs Spain',         event_type:'BTTS',         competition:'World Cup',      match_time:'2026-06-13T20:00:00Z', total_picks:987,  options:[{id:'mr3o1',label:'Both Teams Score',energy_cost:4,pick_count:645,result:'WON'},{id:'mr3o2',label:'Clean Sheet',energy_cost:6,pick_count:342,result:'LOST'}] },
  { id:'mr4', fixture_name:'USA vs Canada',            event_type:'MATCH_RESULT', competition:'World Cup',      match_time:'2026-06-14T00:00:00Z', total_picks:756,  options:[{id:'mr4o1',label:'USA Win',energy_cost:4,pick_count:412,result:'WON'},{id:'mr4o2',label:'Draw',energy_cost:7,pick_count:189,result:'LOST'},{id:'mr4o3',label:'Canada Win',energy_cost:6,pick_count:155,result:'LOST'}] },
  { id:'mr5', fixture_name:'Portugal vs Netherlands',  event_type:'GOALS',        competition:'World Cup',      match_time:'2026-06-15T19:00:00Z', total_picks:834,  options:[{id:'mr5o1',label:'Over 2.5 Goals',energy_cost:4,pick_count:556,result:'WON'},{id:'mr5o2',label:'Under 2.5 Goals',energy_cost:5,pick_count:278,result:'LOST'}] },
  { id:'mr6', fixture_name:'Italy vs Croatia',         event_type:'MATCH_RESULT', competition:'World Cup',      match_time:'2026-06-15T22:00:00Z', total_picks:689,  options:[{id:'mr6o1',label:'Italy Win',energy_cost:4,pick_count:312,result:'LOST'},{id:'mr6o2',label:'Draw',energy_cost:6,pick_count:245,result:'WON'},{id:'mr6o3',label:'Croatia Win',energy_cost:6,pick_count:132,result:'LOST'}] },
  { id:'mr7', fixture_name:'Arsenal vs Man City',      event_type:'MATCH_RESULT', competition:'Premier League', match_time:'2026-06-14T14:00:00Z', total_picks:445,  options:[{id:'mr7o1',label:'Arsenal Win',energy_cost:5,pick_count:189,result:'LOST'},{id:'mr7o2',label:'Draw',energy_cost:6,pick_count:145,result:'LOST'},{id:'mr7o3',label:'Man City Win',energy_cost:4,pick_count:111,result:'WON'}] },
  { id:'mr8', fixture_name:'Real Madrid vs Juventus',  event_type:'BTTS',         competition:'Champions League',match_time:'2026-06-13T21:00:00Z', total_picks:567,  options:[{id:'mr8o1',label:'Both Teams Score',energy_cost:4,pick_count:367,result:'WON'},{id:'mr8o2',label:'Clean Sheet',energy_cost:5,pick_count:200,result:'LOST'}] },
]
const MOCK_PREV_WEEK_PICKS = { mr1:'mr1o1', mr2:'mr2o1', mr3:'mr3o1', mr4:'mr4o1', mr5:'mr5o1', mr6:'mr6o2' }
const MOCK_PREV_ENTRY = { status:'completed', correct_picks:5, league_points:9, is_perfect_week:false }

// ── Week role helpers ──────────────────────────────────────────────────────────
function getWeekRole(gw, isCurrentWeek, weekHasPicks, weekNum) {
  if (!gw || gw.status === 'DRAFT') return 'unavailable'
  if (gw.status === 'FINISHED') return 'results'
  if (gw.status === 'LOCKED') return isCurrentWeek ? 'locked' : 'past_locked'
  if (gw.status === 'PUBLISHED') return isCurrentWeek ? 'current' : 'open'
  return 'unavailable'
}

function WeekRoleBadge({ role, weekHasPicks, weekNum }) {
  const hasPicks = weekHasPicks?.[weekNum]
  if (role === 'current') return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-widest text-green-400">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
      PICKS OPEN{hasPicks ? ' · ✓ SAVED' : ''}
    </span>
  )
  if (role === 'open') return (
    <span className="text-[10px] font-bold tracking-widest text-blue-400">OPEN</span>
  )
  if (role === 'locked') return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-widest text-yellow-400">
      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse inline-block" />
      LOCKED · LIVE
    </span>
  )
  if (role === 'past_locked') return (
    <span className="text-[10px] font-bold tracking-widest text-gray-500">LOCKED</span>
  )
  if (role === 'results') return (
    <span className="text-[10px] font-bold tracking-widest text-purple-400">RESULTS</span>
  )
  return <span className="text-[10px] font-bold tracking-widest text-gray-600">COMING SOON</span>
}

// ── Week selector (prev / dots / next) ─────────────────────────────────────────
function WeekSelector({ selectedWeek, gwCount, byWeek, currentWeek, weekHasPicks, onSelect }) {
  const prevW  = selectedWeek - 1
  const nextW  = selectedWeek + 1
  const hasPrev = selectedWeek > 1
  const hasNext = selectedWeek < gwCount

  const contextLabel = selectedWeek === currentWeek ? 'THIS WEEK' :
                       selectedWeek < currentWeek   ? 'PREVIOUS WEEK' : 'NEXT WEEK'
  const contextColor = selectedWeek === currentWeek ? 'text-green-400' :
                       selectedWeek < currentWeek   ? 'text-purple-400' : 'text-blue-400'

  const todayStr = new Date().toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' })
  const currentGw = byWeek[selectedWeek]
  const weekRange = fmtWeekRange(currentGw?.lock_time)

  return (
    <div className="space-y-3">
      {/* Prev / Week / Next row */}
      <div className="flex items-center gap-2">
        {/* Previous Week button */}
        <button
          onClick={() => hasPrev && onSelect(prevW)}
          disabled={!hasPrev}
          className={`flex items-center gap-2 pl-2.5 pr-3 py-2.5 rounded-2xl border flex-shrink-0 transition-all ${
            hasPrev
              ? 'bg-white/5 border-white/10 hover:bg-white/10 active:scale-95 cursor-pointer'
              : 'opacity-0 pointer-events-none'
          }`}
        >
          <span className="text-white text-sm">←</span>
          <div className="text-left">
            <p className="text-white text-[11px] font-bold leading-none">Previous</p>
            <p className="text-gray-500 text-[9px] mt-0.5 leading-none">Week {prevW}</p>
          </div>
        </button>

        {/* Center info */}
        <div className="flex-1 flex flex-col items-center gap-1.5">
          <p className="text-white font-black text-xl leading-none">Week {selectedWeek}</p>
          <p className="text-gray-600 text-[10px]">of {gwCount} this sprint</p>
          {/* Progress dots */}
          <div className="flex gap-1.5 mt-0.5">
            {Array.from({ length: gwCount }, (_, i) => i + 1).map(w => (
              <button
                key={w}
                onClick={() => onSelect(w)}
                className="p-0.5"
              >
                <div className={`rounded-full transition-all duration-200 h-1.5 ${
                  w === selectedWeek ? 'w-5 bg-indigo-500' :
                  w < selectedWeek   ? 'w-1.5 bg-white/30' :
                  !byWeek[w] || byWeek[w]?.status === 'DRAFT' ? 'w-1.5 bg-white/8' : 'w-1.5 bg-white/20'
                }`} />
              </button>
            ))}
          </div>
        </div>

        {/* Next Week button */}
        <button
          onClick={() => hasNext && onSelect(nextW)}
          disabled={!hasNext}
          className={`flex items-center gap-2 pl-3 pr-2.5 py-2.5 rounded-2xl border flex-shrink-0 transition-all ${
            hasNext
              ? 'bg-white/5 border-white/10 hover:bg-white/10 active:scale-95 cursor-pointer'
              : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="text-right">
            <p className="text-white text-[11px] font-bold leading-none">Next</p>
            <p className="text-gray-500 text-[9px] mt-0.5 leading-none">Week {nextW}</p>
          </div>
          <span className="text-white text-sm">→</span>
        </button>
      </div>

      {/* Context label + date info */}
      <div className="text-center space-y-0.5">
        <p className={`text-[10px] font-black tracking-widest ${contextColor}`}>{contextLabel}</p>
        {weekRange && <p className="text-gray-600 text-[10px]">{weekRange}</p>}
        {selectedWeek === currentWeek && (
          <p className="text-gray-700 text-[9px]">Today: {todayStr}</p>
        )}
      </div>
    </div>
  )
}

// ── Single event pick card ─────────────────────────────────────────────────────
function EventCard({ event, selectedOptionId, onSelect, isLocked, dimmed, remainingEnergy, picksLocked, liveEv, showInsights }) {
  const [open, setOpen] = useState(!dimmed)

  const isWhoQualifies = event.event_type === 'WHO_QUALIFIES'
  const cleanFixtureName = (event.fixture_name || '').replace(/^Who qualifies\?\s*/i, '')
  const [homeTeam, awayTeam] = cleanFixtureName.split(' vs ').map(s => s?.trim())
  const homeFlag = getFlag(homeTeam)
  const awayFlag = getFlag(awayTeam)
  const compIcon = COMPETITION_ICONS[event.competition] || '🏆'
  const typeInfo = EVENT_TYPE_LABELS[event.event_type] || { label: event.event_type, icon: '📋' }
  const isPlayerScore = event.event_type === 'PLAYER_SCORE'

  const selectedOption = selectedOptionId ? (event.options || []).find(o => o.id === selectedOptionId) : null
  const pickResult = selectedOption?.result
  const pickWon  = pickResult === 'WON'
  const pickLost = pickResult === 'LOST'

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${
      dimmed
        ? 'bg-white/2 border-white/5 opacity-60'
        : pickWon
          ? 'bg-green-950/30 border-green-500/50 shadow-[0_0_12px_rgba(34,197,94,0.12)]'
          : pickLost
            ? 'bg-red-950/20 border-red-500/30'
            : selectedOptionId
              ? 'bg-indigo-950/25 border-indigo-500/40'
              : 'bg-[#0d1117] border-white/8'
    }`}>
      {/* Card header */}
      <button
        onClick={() => dimmed && setOpen(o => !o)}
        className={`w-full px-4 pt-3 pb-2 text-left ${dimmed ? 'cursor-pointer' : 'cursor-default'}`}
      >
        {/* Competition + type row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{typeInfo.icon}</span>
            <span className="text-[10px] text-gray-500 font-semibold tracking-wide uppercase">{typeInfo.label}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px]">{compIcon}</span>
            <span className="text-[10px] text-gray-600">{event.competition}</span>
            {dimmed && <span className="text-gray-700 text-[10px] ml-1">{open ? '▲' : '▼'}</span>}
            {!dimmed && selectedOptionId && (
              pickWon
                ? <span className="text-[10px] bg-green-900/60 text-green-300 border border-green-500/40 px-2 py-0.5 rounded-full ml-1 font-bold">✓ Correct</span>
                : pickLost
                  ? <span className="text-[10px] bg-red-900/40 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full ml-1 font-bold">✗ Wrong</span>
                  : <span className="text-[10px] bg-indigo-900/50 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full ml-1 font-semibold">✓ Your Pick</span>
            )}
          </div>
        </div>

        {/* PLAYER_SCORE: special player header */}
        {isPlayerScore ? (
          <div className="flex items-center gap-3 mb-2">
            {/* Player avatar: specific team logo, or overlapping home+away logos */}
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
              {event.player_team_logo ? (
                <img src={event.player_team_logo} alt="" className="w-9 h-9 object-contain" onError={e => { e.target.style.display='none' }} />
              ) : event.fixture_home_logo || event.fixture_away_logo ? (
                <div className="relative w-9 h-9">
                  {event.fixture_home_logo && (
                    <img src={event.fixture_home_logo} alt="" className="w-6 h-6 object-contain absolute top-0 left-0" onError={e => { e.target.style.display='none' }} />
                  )}
                  {event.fixture_away_logo && (
                    <img src={event.fixture_away_logo} alt="" className="w-6 h-6 object-contain absolute bottom-0 right-0" onError={e => { e.target.style.display='none' }} />
                  )}
                </div>
              ) : (
                <span className="text-xl">⭐</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-black text-base leading-tight truncate ${dimmed ? 'text-gray-500' : 'text-white'}`}>
                {event.player_name || 'Player'}
              </p>
              {event.player_team ? (
                <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                  {getFlag(event.player_team)} {event.player_team}
                </p>
              ) : (
                <p className="text-[11px] text-gray-600 mt-0.5 truncate">{event.fixture_name}</p>
              )}
            </div>
          </div>
        ) : (
          /* Normal match header */
          (() => {
            const hasScore   = liveEv?.home_goals != null && liveEv?.away_goals != null
            const isLiveMatch = hasScore && LIVE_STATUSES.includes(liveEv?.fixture_status_short)
            const isDoneMatch = hasScore && FINISHED_STATUSES.includes(liveEv?.fixture_status_short)
            const isPen       = liveEv?.fixture_status_short === 'PEN'
            const ScoreBlock  = () => (isLiveMatch || isDoneMatch) ? (
              <div className="flex flex-col items-center flex-shrink-0 min-w-[52px]">
                <span className={`font-black text-xl tabular-nums leading-none ${isLiveMatch ? 'text-green-400' : dimmed ? 'text-gray-400' : 'text-white'}`}>
                  {liveEv.home_goals}–{liveEv.away_goals}
                </span>
                {isDoneMatch && (
                  <span className="text-[9px] text-gray-600 font-semibold uppercase tracking-wide mt-0.5">
                    {isPen ? 'pens' : 'FT'}
                  </span>
                )}
                {isPen && liveEv.pen_home != null && (
                  <span className="text-[8px] text-gray-700 tabular-nums mt-0.5">
                    ({liveEv.pen_home}–{liveEv.pen_away})
                  </span>
                )}
              </div>
            ) : (
              <span className="text-gray-700 text-xs font-semibold flex-shrink-0">vs</span>
            )
            return (
              <>{isWhoQualifies ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {event.fixture_home_logo && (
                      <img src={event.fixture_home_logo} alt="" className="w-5 h-5 object-contain flex-shrink-0" onError={e => { e.target.style.display='none' }} />
                    )}
                    <span className={`font-bold text-sm leading-tight truncate ${dimmed ? 'text-gray-500' : 'text-white'}`}>{homeTeam}</span>
                  </div>
                  <ScoreBlock />
                  <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                    <span className={`font-bold text-sm leading-tight truncate text-right ${dimmed ? 'text-gray-500' : 'text-white'}`}>{awayTeam}</span>
                    {event.fixture_away_logo && (
                      <img src={event.fixture_away_logo} alt="" className="w-5 h-5 object-contain flex-shrink-0" onError={e => { e.target.style.display='none' }} />
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {event.fixture_home_logo && (
                      <img src={event.fixture_home_logo} alt="" className="w-5 h-5 object-contain flex-shrink-0" onError={e => { e.target.style.display='none' }} />
                    )}
                    <span className={`font-bold text-sm leading-tight truncate ${dimmed ? 'text-gray-500' : 'text-white'}`}>{homeTeam}</span>
                  </div>
                  <ScoreBlock />
                  <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                    <span className={`font-bold text-sm leading-tight truncate text-right ${dimmed ? 'text-gray-500' : 'text-white'}`}>{awayTeam}</span>
                    {event.fixture_away_logo && (
                      <img src={event.fixture_away_logo} alt="" className="w-5 h-5 object-contain flex-shrink-0" onError={e => { e.target.style.display='none' }} />
                    )}
                  </div>
                </div>
              )}</>
            )
          })()
        )}

        {/* Match time + venue */}
        <p className="text-gray-600 text-[10px] mt-1">
          {fmtFull(event.match_time)}
          {event.venue_name && <span className="text-gray-700"> · 🏟 {event.venue_name}</span>}
        </p>
      </button>

      {/* Insights (locked/finished) or recent form (pre-match) dropdown */}
      {event.fixture_id && !isPlayerScore && (
        showInsights
          ? <InsightsDropdown fixtureId={event.fixture_id} liveEv={liveEv} />
          : <FormDropdown fixtureId={event.fixture_id} homeTeam={homeTeam} awayTeam={awayTeam} homeFlag={homeFlag} awayFlag={awayFlag} />
      )}

      {/* Knockout rule notice */}
      {event.is_knockout && ['GOALS','BTTS','CLEAN_SHEET','PLAYER_SCORE'].includes(event.event_type) && (
        <div className="mx-3 mb-2 px-3 py-2 rounded-xl bg-amber-950/40 border border-amber-500/25 flex items-start gap-2">
          <span className="text-amber-400 text-sm flex-shrink-0 mt-px">ⓘ</span>
          <p className="text-[11px] text-amber-300/80 leading-relaxed">
            Knockout match — extra time goals count towards this market. Penalty shootout goals are not included.
          </p>
        </div>
      )}

      {/* Options */}
      {(!dimmed || open) && (
        <div className="px-3 pb-3 grid gap-1.5">
          {[...event.options].sort((a, b) => {
            const ORDER = { HOME_WIN: 0, HOME_QUALIFIES: 0, DRAW: 1, AWAY_WIN: 2, AWAY_QUALIFIES: 2 }
            return (ORDER[a.result_key] ?? 3) - (ORDER[b.result_key] ?? 3)
          }).map(opt => {
            const isSelected = opt.id === selectedOptionId
            const won  = opt.result === 'WON'
            const lost = opt.result === 'LOST'
            const userPickedLost = event.options.some(o => o.id === selectedOptionId && o.result === 'LOST')
            const pct  = !isLocked && event.total_picks > 0 ? Math.ceil((opt.pick_count || 0) / event.total_picks * 100) : null
            const notEnoughEnergy = !isSelected && !won && !lost && !dimmed
              && remainingEnergy !== undefined && opt.energy_cost != null
              && opt.energy_cost > remainingEnergy
            const lockBlocked = !isSelected && !won && !lost && !dimmed && picksLocked
            const isUnavailable = notEnoughEnergy || lockBlocked

            // Flag: use home/away flag directly for MATCH_RESULT/WHO_QUALIFIES, fall back to label lookup
            const optFlag = (opt.result_key === 'HOME_WIN' || opt.result_key === 'HOME_QUALIFIES') ? homeFlag
              : (opt.result_key === 'AWAY_WIN' || opt.result_key === 'AWAY_QUALIFIES') ? awayFlag
              : opt.result_key === 'DRAW' ? ''
              : (() => { const t = Object.keys(COUNTRY_FLAGS).find(k => opt.label.startsWith(k + ' ')); return t ? COUNTRY_FLAGS[t] : '' })()
            const optLabelClean = opt.label
            const isDraw = opt.result_key === 'DRAW' || opt.label === 'Draw'
            const optTeam = opt.result_key === 'HOME_WIN' ? homeTeam
              : opt.result_key === 'AWAY_WIN' ? awayTeam
              : null
            const es = energyStyle(isSelected ? null : opt.energy_cost)

            return (
              <button
                key={opt.id}
                onClick={() => {
                  if (isLocked || dimmed || isUnavailable) return
                  onSelect(event.id, opt.id)
                }}
                disabled={isLocked || dimmed || isUnavailable}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative overflow-hidden ${
                  won  ? `bg-green-900/30 border border-green-500/40 ${userPickedLost ? 'text-green-600' : 'text-green-300'}` :
                  lost ? `bg-red-900/10 border border-red-500/15 ${isSelected ? 'text-red-400' : 'text-red-400/60'}` :
                  isSelected
                    ? 'bg-indigo-600 border border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                    : isUnavailable
                      ? 'bg-white/2 border border-white/4 text-gray-700 cursor-not-allowed'
                      : dimmed
                        ? 'bg-white/4 border border-white/6 text-gray-500'
                        : 'bg-white/5 border border-white/8 text-gray-200 hover:bg-white/10 hover:border-white/20 active:scale-[0.98]'
                }`}
              >
                {/* Community pick % background fill */}
                {pct !== null && !isUnavailable && (
                  <span className="absolute inset-0 rounded-xl" style={{
                    background: won ? 'rgba(34,197,94,0.08)' : isSelected ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                    width: `${pct}%`,
                  }} />
                )}

                {/* Flag / icon */}
                <span className="relative z-10 text-xl flex-shrink-0 leading-none">
                  {isDraw ? '🤝' : (isSelected && lost ? '❌' : won && !userPickedLost ? '✅' : optFlag || '')}
                </span>

                {/* Label */}
                <span className="relative z-10 flex-1 text-left font-semibold">
                  {optTeam ? optTeam : opt.label}
                  {optTeam && optLabelClean && <span className="text-xs font-normal ml-1 opacity-70">{optLabelClean}</span>}
                </span>

                {/* Right side: energy + community % + result */}
                <span className="relative z-10 flex items-center gap-1.5 flex-shrink-0">
                  {pct !== null && !isUnavailable && (
                    <span className={`text-[10px] ${isSelected ? 'text-indigo-200' : 'text-gray-600'}`}>{pct}%</span>
                  )}
                  {!isLocked && !won && !lost && opt.energy_cost != null && !isUnavailable && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md font-mono ${
                      isSelected ? 'bg-indigo-500/30 text-indigo-200' : es.cls
                    }`}>⚡{opt.energy_cost}</span>
                  )}
                  {notEnoughEnergy && (
                    <span className="text-[9px] text-gray-700 font-mono">⚡{opt.energy_cost}</span>
                  )}
                  {won  && <span className="text-green-400 font-bold">✓</span>}
                  {lost && <span className="text-red-400/60">✗</span>}
                  {!won && !lost && isSelected && <span className="text-indigo-200">✓</span>}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Energy CTA banner ─────────────────────────────────────────────────────────
function EnergyCTABanner({ remainingEnergy, onSaveAndGo }) {
  const isEmpty = remainingEnergy <= 0
  return (
    <div className={`rounded-2xl border p-4 ${
      isEmpty
        ? 'bg-red-950/35 border-red-500/30'
        : 'bg-amber-950/30 border-amber-500/25'
    }`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{isEmpty ? '🪫' : '⚡'}</span>
        <div className="flex-1 min-w-0">
          <p className={`font-black text-sm ${isEmpty ? 'text-red-300' : 'text-amber-300'}`}>
            {isEmpty ? 'No energy left this week' : `Only ${remainingEnergy}⚡ remaining`}
          </p>
          <p className="text-gray-500 text-xs mt-1 leading-relaxed">
            {isEmpty
              ? "You've used all your energy this week. Top up to unlock premium picks."
              : "Some picks cost more energy than you have left. Top up to unlock them all."}
          </p>
          <button
            onClick={onSaveAndGo}
            className={`mt-3 w-full py-2.5 rounded-xl text-sm font-black transition-all active:scale-[0.98] shadow-lg ${
              isEmpty
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/50'
                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/40'
            }`}
          >
            ⚡ Save picks &amp; Buy Energy Pack →
          </button>
          <p className="text-[10px] text-gray-700 text-center mt-2">
            Unused bonus energy carries over to future weeks
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Sprint leaderboard (compact) ───────────────────────────────────────────────
function SprintLeaderboard({ myUserId, data, isGwLocked }) {
  if (!data?.rows?.length) return null

  const myIdx   = data.rows.findIndex(r => r.user_id === myUserId)
  const promPts = data.division?.promotion_min_points
  const relPts  = data.division?.relegation_max_points
  const start   = Math.max(0, myIdx - 2)
  const end     = Math.min(data.rows.length, myIdx + 3)
  const shown   = data.rows.slice(start, end)
  const myPts   = data.rows[myIdx]?.total_league_points ?? 0

  return (
    <div className="bg-[#0d1117] border border-white/8 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <p className="text-white text-sm font-semibold">{data.division?.name || 'Division'} standings</p>
        <p className="text-gray-600 text-xs">{data.rows.length} players</p>
      </div>

      {promPts != null && promPts > 0 && (
        <div className="px-4 py-2 bg-green-900/10 border-b border-green-500/10 flex items-center justify-between text-xs">
          <span className="text-green-400 font-semibold">⬆ Promotion zone</span>
          <span className="text-green-400">{Math.max(0, promPts - myPts)} pts to go</span>
        </div>
      )}

      {start > 0 && <p className="text-center text-gray-700 text-xs py-1.5">· · · {start} above · · ·</p>}

      <div>
        {shown.map((r, i) => {
          const rank    = start + i + 1
          const isMe    = r.user_id === myUserId
          const isPromo = promPts !== null && r.total_league_points >= promPts
          const isRel   = relPts  !== null && r.total_league_points <= relPts
          const totalPicks = (r.gameweeks_participated || 0) * 6
          const accuracy   = totalPicks > 0
            ? Math.round((r.total_correct_picks / totalPicks) * 100)
            : null

          return (
            <div key={r.user_id} className={`relative border-b border-white/5 last:border-0 ${
              isMe
                ? 'border-b-purple-500/20'
                : !isMe && isPromo ? 'bg-green-950/15 border-b-green-900/40'
                : !isMe && isRel   ? 'bg-red-950/12 border-b-red-900/40'
                : ''
            }`}
              style={isMe ? { background: 'linear-gradient(90deg, rgba(88,28,135,0.35) 0%, rgba(88,28,135,0.15) 60%, transparent 100%)' } : {}}>
              {isMe
                ? <div className="absolute inset-y-0 left-0 w-1 bg-purple-500 rounded-r" />
                : (isPromo || isRel) && <div className={`absolute inset-y-0 left-0 w-0.5 ${isPromo ? 'bg-green-500' : 'bg-red-500'} rounded-r`} />
              }
              <div className={`flex items-center gap-3 ${isMe ? 'px-4 py-3.5' : 'px-4 py-2.5'}`}>
                {/* Rank */}
                <span className={`text-center font-black flex-shrink-0 ${
                  isMe
                    ? 'w-7 text-sm text-purple-300'
                    : `w-6 text-xs ${rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-gray-300' : rank === 3 ? 'text-amber-600' : 'text-gray-600'}`
                }`}>{rank}</span>

                {/* Avatar */}
                {(() => {
                  const t = getPlayerTier(r.total_correct_picks, r.total_incorrect_picks)
                  return (
                    <div className="relative flex-shrink-0">
                      {r.avatar_url
                        ? <img src={r.avatar_url} alt="" className={`rounded-full object-cover ${isMe ? 'w-9 h-9' : 'w-8 h-8'}`}
                            style={isMe ? { boxShadow: '0 0 0 2px rgba(168,85,247,0.8), 0 0 12px rgba(168,85,247,0.35)' } : {}} />
                        : <div className={`rounded-full flex items-center justify-center font-bold ${
                            isMe ? 'w-9 h-9 text-sm' : 'w-8 h-8 text-xs bg-white/8 text-gray-400'
                          }`}
                          style={isMe ? { background: 'rgba(88,28,135,0.6)', color: '#d8b4fe', boxShadow: '0 0 0 2px rgba(168,85,247,0.7), 0 0 12px rgba(168,85,247,0.35)' } : {}}>
                            {(r.display_name || '?')[0].toUpperCase()}
                          </div>
                      }
                      {t && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-[15px] h-[15px] text-[9px] rounded-full border border-[#0a0d12] flex items-center justify-center leading-none pointer-events-none"
                          style={{ background: TIER_BG[t.color] }} title={t.label}>{t.icon}</span>
                      )}
                    </div>
                  )
                })()}

                {/* Name + stats row */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`font-semibold truncate ${isMe ? 'text-white text-sm' : 'text-gray-400 text-xs'}`}>
                      {r.display_name || 'Jugador'}
                    </span>
                    {isMe && (
                      <span className="text-[10px] font-black bg-purple-900/50 text-purple-300 border border-purple-500/50 px-1.5 py-0.5 rounded-full flex-shrink-0">YOU</span>
                    )}
                    {r.is_rookie && <span className="text-[9px] bg-blue-900/40 text-blue-400 px-1.5 py-0.5 rounded-full flex-shrink-0">ROOKIE</span>}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className={`font-semibold ${isMe ? 'text-[11px] text-green-400' : 'text-[10px] text-green-500/60'}`}>{r.total_correct_picks ?? 0}✓</span>
                    <span className="text-[10px] text-gray-700">·</span>
                    <span className={`${isMe ? 'text-[11px] text-red-400/80' : 'text-[10px] text-red-400/40'}`}>{r.total_incorrect_picks ?? 0}✗</span>
                    {(r.pending_picks ?? 0) > 0 && <>
                      <span className="text-[10px] text-gray-700">·</span>
                      <span className={`${isMe ? 'text-[11px] text-gray-400' : 'text-[10px] text-gray-500'}`}>{r.pending_picks}{isGwLocked ? '🔒' : '⏳'}</span>
                    </>}
                    {(r.energy_used ?? 0) > 0 && <>
                      <span className="text-[10px] text-gray-700">·</span>
                      <span className={`${isMe ? 'text-[11px] text-orange-400' : 'text-[10px] text-orange-400/60'}`}>{r.energy_used}⚡</span>
                    </>}
                    {r.perfect_weeks > 0 && <>
                      <span className="text-[10px] text-gray-700">·</span>
                      <span className="text-[10px] text-yellow-500">⭐{r.perfect_weeks}</span>
                    </>}
                  </div>
                </div>

                {/* Points */}
                <div className="text-right flex-shrink-0">
                  <p className={`font-black tabular-nums ${
                    isMe    ? 'text-xl text-white'
                    : isPromo ? 'text-base text-green-400'
                    : isRel   ? 'text-base text-red-400'
                    :           'text-base text-indigo-300'
                  }`} style={isMe ? { textShadow: '0 0 12px rgba(168,85,247,0.5)' } : {}}>
                    {r.total_league_points}
                  </p>
                  <p className={`text-[9px] -mt-0.5 ${isMe ? 'text-purple-400/60' : 'text-gray-700'}`}>pts</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {end < data.rows.length && <p className="text-center text-gray-700 text-xs py-1.5">· · · {data.rows.length - end} below · · ·</p>}

      {relPts != null && (
        <div className="px-4 py-2 bg-red-900/10 border-t border-red-500/10 flex items-center justify-between text-xs">
          <span className="text-red-400 font-semibold">⬇ Relegation ≤{relPts} pts</span>
          {myPts <= relPts && <span className="text-red-400 font-bold animate-pulse">⚠ You're at risk!</span>}
        </div>
      )}

      <a href="/divisions"
        className="flex items-center justify-center gap-2 px-4 py-3 border-t border-white/5 text-indigo-400 hover:text-indigo-300 hover:bg-white/3 transition-colors text-xs font-semibold">
        View full ranking
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </a>
    </div>
  )
}

// ── Picks confirmation modal (bottom sheet) ───────────────────────────────────
function PicksConfirmModal({ picks, effectiveEvents, totalEnergy, totalAvailable, gw, submitting, err, onConfirm, onClose }) {
  const pickedEvents = effectiveEvents.filter(e => picks[e.id])
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={!submitting ? onClose : undefined} />
      <div className="relative w-full max-w-md bg-[#0d1117] border border-white/10 rounded-t-3xl">
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-8 h-1 bg-white/15 rounded-full" />
        </div>

        <div className="px-5 pb-2">
          <h2 className="text-white font-black text-lg">Review your picks</h2>
          <p className="text-gray-500 text-xs mt-0.5">
            {pickedEvents.length} pick{pickedEvents.length !== 1 ? 's' : ''} · {gw?.lock_time ? `Deadline: ${fmtFull(gw.lock_time)}` : 'Check the deadline before confirming'}
          </p>
        </div>

        <div className="px-5 py-2 space-y-0 overflow-y-auto" style={{ maxHeight: '40vh' }}>
          {pickedEvents.map((ev, i) => {
            const opt = ev.options?.find(o => o.id === picks[ev.id])
            return (
              <div key={ev.id} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
                <span className="w-5 h-5 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-[10px] font-black flex-shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-400 text-[11px] truncate">{ev.fixture_name || ev.player_name || 'Event'}</p>
                  <p className="text-white font-semibold text-sm truncate">{opt?.label}</p>
                </div>
                <span className="text-yellow-500 text-xs font-bold flex-shrink-0">⚡{opt?.energy_cost}</span>
              </div>
            )
          })}
        </div>

        <div className="mx-5 mt-2 mb-3 flex items-center justify-between px-4 py-2.5 bg-yellow-950/20 border border-yellow-500/15 rounded-xl">
          <span className="text-gray-400 text-sm">⚡ Energy used</span>
          <span className="text-yellow-400 font-bold text-sm">{totalEnergy} / {totalAvailable}</span>
        </div>

        {err && <p className="text-red-400 text-xs px-5 mb-2">{err}</p>}

        <div className="px-5 pb-8 space-y-2">
          <button
            onClick={onConfirm}
            disabled={submitting}
            className="w-full py-4 bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-black text-base rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {submitting
              ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</span>
              : '✅  Confirm & save picks'
            }
          </button>
          <button
            onClick={onClose}
            disabled={submitting}
            className="w-full py-3 text-gray-400 hover:text-white text-sm font-medium transition-colors disabled:opacity-40"
          >
            Keep editing
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Future week preview section ───────────────────────────────────────────────
function FutureWeekSection({ nextGw, nextWeekNum, onGoToNextWeek }) {
  const divider = (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-white/6" />
      <span className="text-[10px] font-black tracking-widest text-blue-400/80">NEXT WEEK</span>
      <div className="h-px flex-1 bg-white/6" />
    </div>
  )

  if (!nextGw || nextGw.status !== 'PUBLISHED') {
    return (
      <div className="mt-6 space-y-3">
        {divider}
        <div className="flex items-center gap-3 px-4 py-3.5 bg-[#0d1117] border border-white/6 rounded-2xl">
          <span className="text-xl flex-shrink-0">🔜</span>
          <div className="flex-1 min-w-0">
            <p className="text-gray-400 font-semibold text-sm">Week {nextWeekNum} not published yet</p>
            <p className="text-gray-600 text-xs mt-0.5">Schedule hasn't been released yet</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-6 space-y-3">
      {divider}
      <button
        onClick={onGoToNextWeek}
        className="w-full flex items-center gap-3 px-4 py-3.5 bg-blue-950/20 border border-blue-500/20 rounded-2xl hover:bg-blue-950/35 hover:border-blue-500/35 active:scale-[0.98] transition-all text-left"
      >
        <span className="text-xl flex-shrink-0">📅</span>
        <div className="flex-1 min-w-0">
          <p className="text-blue-300 font-bold text-sm">Week {nextWeekNum} — picks open</p>
          {nextGw.lock_time && (
            <p className="text-blue-700 text-xs mt-0.5">
              Closes {fmtFull(nextGw.lock_time)} · {fmtCountdown(nextGw.lock_time)}
            </p>
          )}
        </div>
        <span className="text-blue-400 text-base flex-shrink-0">→</span>
      </button>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function MatchweekPage() {
  const navigate = useNavigate()
  const [status,        setStatus]        = useState(null)
  const [gwData,        setGwData]        = useState(null)
  const [community,     setCommunity]     = useState(null)
  const [picks,         setPicks]         = useState({})
  const [submitting,    setSubmitting]    = useState(false)
  const [submitted,     setSubmitted]     = useState(false)
  const [showConfirm,   setShowConfirm]   = useState(false)
  const [err,           setErr]           = useState('')
  const [loading,       setLoading]       = useState(true)
  const [gwLoading,   setGwLoading]   = useState(false)
  const [selectedWeek, setSelectedWeek] = useState(null)
  const [weekHasPicks, setWeekHasPicks] = useState({})
  const [liveData,    setLiveData]    = useState({})
  const [walletBalance, setWalletBalance] = useState(0)
  const [leaderboard, setLeaderboard] = useState(null)
  const liveIntervalRef = useRef(null)

  const loadStatus = useCallback(() =>
    getGloryStatus().then(r => { setStatus(r.data); return r.data }).catch(() => null)
  , [])

  const loadGw = useCallback((gwId) => {
    if (!gwId) return
    setGwLoading(true)
    setPicks({}); setSubmitted(false); setCommunity(null); setErr(''); setShowConfirm(false)
    getGloryGameweek(gwId).then(r => {
      setGwData(r.data)
      if (r.data.my_picks?.length) {
        const existing = {}
        for (const p of r.data.my_picks) existing[p.event_id] = p.event_option_id
        setPicks(existing); setSubmitted(true)
        const sprintWeek = r.data.gameweek?.sprint_week
        if (sprintWeek) setWeekHasPicks(prev => ({ ...prev, [sprintWeek]: true }))
        localStorage.removeItem(`draftPicks_${gwId}`)
      } else {
        // Restore draft picks saved before navigating to store
        try {
          const draft = JSON.parse(localStorage.getItem(`draftPicks_${gwId}`) || 'null')
          if (draft && typeof draft === 'object' && Object.keys(draft).length > 0) {
            // Validate draft against current events — discard if event IDs are all stale (gameweek republished)
            const currentEventIds = new Set((r.data.gameweek?.events || []).map(e => e.id))
            const validDraft = Object.fromEntries(
              Object.entries(draft).filter(([evId]) => currentEventIds.has(evId))
            )
            if (Object.keys(validDraft).length > 0) {
              setPicks(validDraft)
            } else {
              localStorage.removeItem(`draftPicks_${gwId}`)
            }
          }
        } catch {}
      }
      const locked = r.data.gameweek?.status === 'LOCKED' || r.data.gameweek?.status === 'FINISHED'
      if (locked) {
        getCommunityPicks(gwId).then(r => setCommunity(r.data)).catch(() => {})
      }
    }).catch(() => {}).finally(() => setGwLoading(false))
  }, [])

  // Initial load
  useEffect(() => {
    getEnergyPacks().then(r => setWalletBalance(r.data?.wallet_balance ?? 0)).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    loadStatus().then(st => {
      if (!st) { setLoading(false); return }
      const gws = st.sprint?.gameweeks || []
      // Prefer backend current_gameweek; fallback mirrors backend logic exactly
      let targetGw = st.current_gameweek
      if (!targetGw || !targetGw.id) {
        const now = new Date()
        const pubRows = gws.filter(g => g.status === 'PUBLISHED')
        const activePub = pubRows.find(g => new Date(g.lock_time) > now) ?? null
        const locked    = gws.find(g => g.status === 'LOCKED') ?? null
        const finished  = [...gws].reverse().find(g => g.status === 'FINISHED') ?? null
        targetGw = activePub ?? locked ?? finished ?? gws[0] ?? null
      }
      const currentWeek = targetGw?.sprint_week ?? 1
      setSelectedWeek(currentWeek)
      if (targetGw?.id) loadGw(targetGw.id)
      setLoading(false)
    })
  }, [loadStatus, loadGw])

  // When selected week changes after initial load, find and load that gameweek
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    if (!status || selectedWeek === null) return
    const gw = (status.sprint?.gameweeks || []).find(g => g.sprint_week === selectedWeek)
    if (gw?.id && gw.status !== 'DRAFT') loadGw(gw.id)
    else { setGwData(null); setGwLoading(false) }
  }, [selectedWeek]) // eslint-disable-line react-hooks/exhaustive-deps

  const sprint   = status?.sprint
  const div      = status?.division
  const prog     = status?.sprint_progress

  useEffect(() => {
    if (!sprint?.id || !div?.division_id) return
    getGloryLeaderboard({ sprint_id: sprint.id, division_id: div.division_id })
      .then(r => setLeaderboard(r.data))
      .catch(() => {})
  }, [sprint?.id, div?.division_id])
  const lp       = prog?.total_league_points ?? 0
  const gwCount  = sprint?.gameweek_count || 4
  const gwList   = sprint?.gameweeks || []
  const byWeek   = useMemo(() => Object.fromEntries(gwList.map(g => [g.sprint_week, g])), [gwList])
  const currentWeek = status?.current_gameweek?.sprint_week

  const myUserId   = status?.user?.id
  const lbRows     = leaderboard?.rows || []
  const myRankIdx  = lbRows.findIndex(r => r.user_id === myUserId)
  const myRank     = myRankIdx >= 0 ? myRankIdx + 1 : null
  const divSize    = lbRows.length

  const gw       = gwData?.gameweek
  const isLocked = gwData?.is_locked ?? false
  const entry    = gwData?.my_entry
  const weekRole = getWeekRole(gw, selectedWeek === currentWeek, weekHasPicks, selectedWeek)
  const events = gw?.events || []
  const isMockResultsMode = events.length === 0 && weekRole === 'results'
  const isMockOpenMode    = events.length === 0 && (weekRole === 'current' || weekRole === 'open' || weekRole === 'locked' || weekRole === 'past_locked')
  const effectiveEvents   = events.length > 0 ? events :
    isMockResultsMode ? MOCK_RESULTS_EVENTS :
    isMockOpenMode    ? MOCK_GW_EVENTS : []
  const effectiveIsLocked = isLocked || isMockResultsMode
  const effectiveEntry    = entry ?? (isMockResultsMode ? MOCK_PREV_ENTRY : null)
  const pickCount         = Object.keys(picks).length

  const totalEnergy = useMemo(() => {
    let sum = 0
    for (const ev of effectiveEvents) {
      const opt = ev.options?.find(o => o.id === picks[ev.id])
      if (opt?.energy_cost) sum += opt.energy_cost
    }
    return sum
  }, [picks, effectiveEvents])

  const baseEnergy      = gw?.base_energy ?? 30
  const extraFromWallet = Math.min(MAX_WEEKLY_EXTRA, walletBalance)
  const totalAvailable  = baseEnergy + extraFromWallet
  const remainingEnergy = totalAvailable - totalEnergy
  const picksLocked     = pickCount === 6 && !effectiveIsLocked

  const saveAndGoToStore = () => {
    if (gw?.id) localStorage.setItem(`draftPicks_${gw.id}`, JSON.stringify(picks))
    if (pickCount >= 4 && !submitting) {
      const pickList = Object.entries(picks).map(([event_id, event_option_id]) => ({ event_id, event_option_id }))
      submitGloryPicks(gw.id, pickList).catch(() => {})
    }
    navigate('/store')
  }

  const eventsWithCounts = useMemo(() => {
    if (!community) return effectiveEvents
    const byId = {}
    for (const ce of community.events) {
      const total = ce.options.reduce((s, o) => s + (o.pick_count || 0), 0)
      byId[ce.id] = { options: ce.options, total_picks: total }
    }
    return effectiveEvents.map(e => {
      const c = byId[e.id]
      if (!c) return e
      return { ...e, options: e.options.map(o => { const co = c.options.find(x => x.id === o.id); return { ...o, pick_count: co?.pick_count ?? 0 } }), total_picks: c.total_picks }
    })
  }, [effectiveEvents, community])

  // Merge liveData option results into events so green/red shows on buttons without waiting for Sunday settlement
  const eventsWithLive = useMemo(() => {
    if (!Object.keys(liveData).length) return eventsWithCounts
    return eventsWithCounts.map(ev => {
      const ld = liveData[ev.id]
      if (!ld?.options?.length) return ev
      const resultMap = {}
      for (const o of ld.options) if (o.result === 'WON' || o.result === 'LOST') resultMap[o.id] = o.result
      if (!Object.keys(resultMap).length) return ev
      return { ...ev, options: ev.options.map(o => ({ ...o, result: resultMap[o.id] ?? o.result })) }
    })
  }, [eventsWithCounts, liveData])

  const displayPicks = (isMockResultsMode && Object.keys(picks).length === 0)
    ? MOCK_PREV_WEEK_PICKS
    : picks

  const myPickedEvents = eventsWithLive.filter(e => displayPicks[e.id])
  const unpickedEvents = eventsWithLive.filter(e => !displayPicks[e.id])

  // Live tally for locked/finished weeks
  const liveTally = useMemo(() => {
    if (!effectiveIsLocked || myPickedEvents.length === 0) return null
    let won = 0, lost = 0
    for (const ev of myPickedEvents) {
      const opt = ev.options?.find(o => o.id === displayPicks[ev.id])
      if (opt?.result === 'WON') won++
      else if (opt?.result === 'LOST') lost++
    }
    const pending = myPickedEvents.length - won - lost
    const pts = won + (won === 6 && pending === 0 ? 4 : 0)
    return { won, lost, pending, pts }
  }, [effectiveIsLocked, myPickedEvents, displayPicks])

  const handleSelect = (eventId, optionId) => {
    if (isLocked) return
    if (picksLocked && !picks[eventId]) return
    setPicks(prev => {
      const n = { ...prev }
      if (n[eventId] === optionId) delete n[eventId]; else n[eventId] = optionId
      if (gw?.id) {
        try { localStorage.setItem(`draftPicks_${gw.id}`, JSON.stringify(n)) } catch {}
      }
      return n
    })
    setSubmitted(false)
    setErr('')
  }

  const openConfirmModal = () => {
    if (submitting || !gw?.id || pickCount !== 6) return
    setErr('')
    setShowConfirm(true)
  }

  const confirmPicks = useCallback(() => {
    if (submitting || !gw?.id || pickCount !== 6) return
    const pickList = Object.entries(picks).map(([event_id, event_option_id]) => ({ event_id, event_option_id }))
    setSubmitting(true); setErr('')
    submitGloryPicks(gw.id, pickList)
      .then(() => {
        setSubmitted(true)
        setShowConfirm(false)
        if (gw.sprint_week) setWeekHasPicks(prev => ({ ...prev, [gw.sprint_week]: true }))
        localStorage.removeItem(`draftPicks_${gw.id}`)
      })
      .catch(e => setErr(e.response?.data?.error || e.response?.data?.message || 'Failed to save picks — try again'))
      .finally(() => setSubmitting(false))
  }, [picks, gw, submitting, pickCount]) // eslint-disable-line react-hooks/exhaustive-deps

  // Live polling: fetch fixture live data every 45s when gameweek is active
  const fetchLive = useCallback(() => {
    if (!gw?.id) return
    getGameweekLive(gw.id)
      .then(r => {
        const byEventId = {}
        for (const ev of r.data.events || []) byEventId[ev.event_id] = ev
        setLiveData(byEventId)
      })
      .catch(() => {})
  }, [gw?.id])

  useEffect(() => {
    if (!gw?.id) return
    fetchLive()
    liveIntervalRef.current = setInterval(fetchLive, 45000)
    return () => clearInterval(liveIntervalRef.current)
  }, [gw?.id, fetchLive])

  if (loading) return (
    <div className="min-h-screen bg-[#0a0d12] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0d12] text-white">

      {/* ── Top section (non-sticky) ── */}
      <div className="max-w-md mx-auto px-4 pt-5 space-y-4">

        {/* Sprint header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-indigo-400 text-[13px] font-bold tracking-wide">{sprint?.name || 'OddsRivals'}</p>
            <h1 className="text-white text-xl font-bold mt-0.5">{div?.icon} {div?.division_name || 'Academy'}</h1>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={() => navigate('/scores')}
              className="flex items-center gap-2 bg-green-500/15 hover:bg-green-500/25 border border-green-500/40 text-green-400 text-xs font-bold px-3 py-2 rounded-xl transition-colors active:scale-95"
            >
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Live Scores
            </button>
            <div className="text-right">
              <p className="text-indigo-400 font-black text-2xl leading-none tabular-nums">{lp}</p>
              <p className="text-gray-500 text-[11px] leading-none mt-0.5">sprint pts</p>
              {myRank && (
                <p className="text-gray-500 text-[11px] leading-none mt-1">
                  <span className="text-white font-bold">#{myRank}</span>
                  {divSize > 0 && <span className="text-gray-600"> / {divSize}</span>}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* No active sprint */}
        {!sprint && (
          <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-8 text-center">
            <p className="text-4xl mb-3">🏆</p>
            <p className="text-gray-400 font-medium">No active sprint</p>
            <p className="text-gray-600 text-sm mt-1">The next sprint is being prepared. Check back soon.</p>
          </div>
        )}

        {sprint && (
          <>
            {/* Week selector: prev / dots / next */}
            <WeekSelector
              selectedWeek={selectedWeek}
              gwCount={gwCount}
              byWeek={byWeek}
              currentWeek={currentWeek}
              weekHasPicks={weekHasPicks}
              onSelect={setSelectedWeek}
            />

            {/* Week status badge + lock countdown */}
            <div className="flex items-center justify-between px-1">
              <WeekRoleBadge role={weekRole} weekHasPicks={weekHasPicks} weekNum={selectedWeek} />
              {gw && !gwLoading && gw.lock_time && weekRole !== 'results' && weekRole !== 'unavailable' && (
                <p className="text-gray-600 text-[11px]">Locks {fmtFull(gw.lock_time)}</p>
              )}
            </div>

            {/* Did not participate card (finished/locked week, no entry) */}
            {!gwLoading && !effectiveEntry && gw && (gw.status === 'FINISHED' || gw.status === 'LOCKED') && (
              <div className="rounded-2xl px-4 py-3 bg-white/4 border border-white/8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 font-bold text-sm">Did not participate</p>
                    <p className="text-gray-700 text-[11px]">No picks submitted</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-600 font-black text-xl tabular-nums">+0 pts</p>
                    <p className="text-gray-700 text-[10px] -mt-0.5">this week</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/6">
                  <p className="text-gray-500 text-[11px]">Sprint total</p>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-300 font-bold text-sm tabular-nums">{lp} pts</p>
                    {myRank && (
                      <span className="text-[11px] bg-indigo-900/40 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold">
                        #{myRank}{divSize > 0 ? ` / ${divSize}` : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Entry results card (settled weeks) */}
            {!gwLoading && effectiveEntry?.status === 'completed' && (
              effectiveEntry.is_perfect_week ? (
                /* ── Perfect week — spectacular treatment ── */
                <div className="relative rounded-2xl overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #1a1200, #2d1f00, #1a0800)', border: '1px solid rgba(250,204,21,0.45)', boxShadow: '0 0 40px -8px rgba(250,204,21,0.55)' }}>
                  <div className="absolute pointer-events-none inset-0 rounded-2xl"
                    style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(250,204,21,0.12) 0%, transparent 65%)' }} />
                  <div className="relative px-4 pt-4 pb-3">
                    {/* Badge */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl leading-none">⭐</span>
                      <div>
                        <p className="text-yellow-300 font-black text-base leading-none">Perfect Week!</p>
                        <p className="text-yellow-600 text-[10px] font-semibold mt-0.5">6/6 correct · bonus unlocked</p>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="text-yellow-300 font-black text-3xl leading-none tabular-nums">+{effectiveEntry.league_points}</p>
                        <p className="text-yellow-600 text-[10px] font-semibold mt-0.5">LP this week</p>
                      </div>
                    </div>
                    {/* Breakdown */}
                    <div className="rounded-xl bg-black/30 border border-yellow-500/15 px-3 py-2.5 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-yellow-200/60">6 correct picks</span>
                        <span className="text-green-400 font-bold">+6 pts</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-yellow-200/60">⭐ Perfect week bonus</span>
                        <span className="text-yellow-400 font-black">+4 pts</span>
                      </div>
                      <div className="h-px bg-yellow-500/15" />
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-yellow-300 font-bold">Total this week</span>
                        <span className="text-yellow-300 font-black">+{effectiveEntry.league_points} LP</span>
                      </div>
                    </div>
                    {/* Sprint total + rank */}
                    <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-yellow-500/15">
                      <p className="text-yellow-700 text-[11px] font-semibold">Sprint total</p>
                      <div className="flex items-center gap-2">
                        <p className="text-yellow-200 font-bold text-sm tabular-nums">{lp} pts</p>
                        {myRank && (
                          <span className="text-[11px] bg-yellow-900/30 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full font-bold">
                            #{myRank}{divSize > 0 ? ` / ${divSize}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* ── Normal completed week ── */
                <div className="rounded-2xl px-4 py-3 bg-white/4 border border-white/8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-bold text-sm">{effectiveEntry.correct_picks}/6 correct</p>
                      <p className="text-gray-600 text-[10px] mt-0.5">this matchweek</p>
                    </div>
                    <div className="text-right">
                      <p className="text-indigo-400 font-black text-xl tabular-nums">+{effectiveEntry.league_points} pts</p>
                      <p className="text-gray-600 text-[10px] -mt-0.5">LP earned</p>
                    </div>
                  </div>
                </div>
              )
            )}
          </>
        )}
      </div>

      {/* ── Sticky bar (open gameweeks only) ── */}
      {sprint && !effectiveIsLocked && !gwLoading && gw && (
        <div className={`sticky top-0 z-30 backdrop-blur-md border-b transition-colors ${
          submitted
            ? 'bg-green-950/95 border-green-500/20'
            : 'bg-[#0a0d12]/95 border-white/8'
        }`}>
          <div className="max-w-md mx-auto px-4 py-3">
            {submitted ? (
              /* ── Saved state ── */
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-green-400 text-lg">✅</span>
                  <div>
                    <p className="text-green-300 font-bold text-sm leading-tight">Picks saved — you're in!</p>
                    {gw.lock_time && (
                      <p className="text-green-700 text-[11px]">Editable until {fmtFull(gw.lock_time)}</p>
                    )}
                  </div>
                </div>
                <span className="text-green-800 text-[10px] text-right leading-tight">Tap any pick<br/>to update</span>
              </div>
            ) : (
              /* ── Editing state ── */
              <>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-xs">Picks</span>
                    <span className={`font-black text-sm tabular-nums ${pickCount === 6 ? 'text-green-400' : 'text-indigo-400'}`}>
                      {pickCount}/6
                    </span>
                    {picksLocked && (
                      <span className="text-[10px] bg-green-900/30 text-green-400 border border-green-500/25 px-2 py-0.5 rounded-full font-semibold">Ready</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {totalEnergy > 0 && (
                      <span
                        className={`font-black text-xl tabular-nums leading-none ${
                          remainingEnergy <= 0 ? 'text-red-400' :
                          remainingEnergy <= 5 ? 'text-amber-300' :
                          'text-yellow-300'
                        }`}
                        style={remainingEnergy > 0 ? { textShadow: '0 0 14px rgba(253,224,71,0.7)' } : {}}
                      >
                        ⚡{remainingEnergy}
                        <span className="text-xs font-semibold opacity-60 ml-1">left</span>
                      </span>
                    )}
                    {totalEnergy === 0 && (
                      <span className="text-gray-600 text-xs">⚡{totalAvailable} energy</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 mb-2">
                  {Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${
                      i < pickCount ? 'bg-indigo-500' : 'bg-white/10'
                    }`} />
                  ))}
                </div>
                {pickCount === 6 ? (
                  <button
                    onClick={openConfirmModal}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all active:scale-[0.98]"
                  >
                    Save my 6 picks →
                  </button>
                ) : (
                  <p className="text-center text-gray-600 text-xs py-1">
                    Select {6 - pickCount} more pick{6 - pickCount !== 1 ? 's' : ''} to save
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Scrollable content ── */}
      <div className="max-w-md mx-auto px-4 pb-32 space-y-3 mt-3">

        {sprint && (
          <>
            {/* Loading state for week switch */}
            {gwLoading && (
              <div className="flex items-center justify-center py-10 gap-2 text-gray-600 text-sm">
                <div className="w-4 h-4 border border-gray-700 border-t-indigo-400 rounded-full animate-spin" />
                Loading gameweek…
              </div>
            )}

            {/* Week not available (DRAFT or no gameweek defined) */}
            {!gwLoading && weekRole === 'unavailable' && (
              <div className="flex flex-col items-center justify-center py-16 gap-5">
                <div className="w-16 h-16 rounded-full bg-white/4 border border-white/8 flex items-center justify-center">
                  <span className="text-3xl">📅</span>
                </div>
                <div className="text-center space-y-1.5 px-4">
                  <p className="text-white font-bold text-base">Matchweek {selectedWeek} unavailable</p>
                  <p className="text-gray-500 text-sm">No picks have been defined for this week.</p>
                </div>
              </div>
            )}

            {!gwLoading && gw && weekRole !== 'unavailable' && (
              <>
                {/* ── Lock-time deadline banner (open weeks only) ── */}
                {!isLocked && !submitted && gw?.lock_time && (
                  (() => {
                    const countdown = fmtCountdown(gw.lock_time)
                    const diff = new Date(gw.lock_time) - Date.now()
                    const isUrgent = diff > 0 && diff < 24 * 3600000
                    return (
                      <div className={`flex items-start gap-3 px-4 py-3.5 rounded-2xl border ${
                        isUrgent
                          ? 'bg-red-950/25 border-red-500/30'
                          : 'bg-white/4 border-white/8'
                      }`}>
                        <span className="text-xl mt-0.5">{isUrgent ? '⚠️' : '⏰'}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-sm ${isUrgent ? 'text-red-300' : 'text-white'}`}>
                            Pick deadline · {fmtFull(gw.lock_time)}
                          </p>
                          <p className={`text-xs mt-0.5 ${isUrgent ? 'text-red-400' : 'text-gray-500'}`}>
                            {countdown} · Miss this and you lose this week's points
                          </p>
                        </div>
                      </div>
                    )
                  })()
                )}

                {/* ── LOCKED state banner ── */}
                {weekRole === 'locked' && (
                  <div className="flex items-start gap-3 px-4 py-4 rounded-2xl bg-yellow-950/25 border border-yellow-500/30">
                    <span className="text-xl mt-0.5">🔒</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-yellow-300">Picks are locked — matches are live for this week.</p>
                      <p className="text-yellow-600 text-xs mt-0.5">
                        Sit back and watch your predictions become wins or losses.
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Energy availability ── */}
                {!isLocked && (
                  <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-yellow-950/20 border border-yellow-500/15">
                    <div className="flex items-start gap-3">
                      <span className="text-lg mt-0.5">⚡</span>
                      <div>
                        <p className="text-white font-bold text-sm">{remainingEnergy} energy remaining</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="w-24 h-1 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                remainingEnergy <= 5 ? 'bg-red-500' :
                                remainingEnergy <= 10 ? 'bg-amber-400' : 'bg-yellow-400'
                              }`}
                              style={{ width: `${Math.max(0, Math.min(100, (remainingEnergy / totalAvailable) * 100))}%` }}
                            />
                          </div>
                          <span className="text-gray-600 text-[10px]">{baseEnergy} base{extraFromWallet > 0 ? ` +${extraFromWallet} bonus` : ''}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={saveAndGoToStore}
                      className="text-yellow-400 text-xs font-bold border border-yellow-500/30 px-3 py-1.5 rounded-xl bg-yellow-950/30 hover:bg-yellow-950/50 transition-colors flex-shrink-0"
                    >
                      Get more →
                    </button>
                  </div>
                )}

                {/* Events for open gameweek */}
                {!effectiveIsLocked && (
                  submitted && myPickedEvents.length > 0 ? (
                    <>
                      <div className="space-y-2.5">
                        <p className="text-green-500 text-[11px] font-bold tracking-wider uppercase px-1">
                          ✓ Confirmed picks ({myPickedEvents.length})
                        </p>
                        {sortWithLiveFirst(myPickedEvents, liveData)
                          .map(ev => {
                            const liveStatus = computePickLiveStatus(ev, displayPicks[ev.id], liveData[ev.id])
                            const liveEv = liveData[ev.id]
                            return (
                              <div key={ev.id} className="space-y-1">
                                <div className="flex items-center justify-between px-1">
                                  <LivePickBadge status={liveStatus} elapsed={liveEv?.fixture_elapsed} matchTime={ev.match_time} />
                                  {liveEv?.home_goals != null && liveEv?.away_goals != null &&
                                   (LIVE_STATUSES.includes(liveEv.fixture_status_short) || FINISHED_STATUSES.includes(liveEv.fixture_status_short)) && (
                                    <span className="text-[11px] text-gray-400 font-mono font-bold">
                                      {liveEv.home_team?.split(' ').pop() || 'H'} {liveEv.home_goals}–{liveEv.away_goals} {liveEv.away_team?.split(' ').pop() || 'A'}
                                      {liveEv.fixture_status_short === 'PEN' && liveEv.pen_home != null && (
                                        <span className="text-gray-600 font-normal"> ({liveEv.pen_home}–{liveEv.pen_away} pens)</span>
                                      )}
                                    </span>
                                  )}
                                </div>
                                <EventCard event={ev} selectedOptionId={displayPicks[ev.id]}
                                  onSelect={handleSelect} isLocked={false} dimmed={false}
                                  remainingEnergy={remainingEnergy} picksLocked={picksLocked} />
                              </div>
                            )
                          })}
                      </div>
                      {unpickedEvents.length > 0 && (
                        <div className="space-y-2.5 mt-2">
                          {remainingEnergy <= 5 && pickCount < 6 && (
                            <EnergyCTABanner remainingEnergy={remainingEnergy} onSaveAndGo={saveAndGoToStore} />
                          )}
                          <p className="text-gray-700 text-[11px] font-medium tracking-wider uppercase px-1">
                            Other events
                          </p>
                          {unpickedEvents.map(ev => (
                            <EventCard key={ev.id} event={ev} selectedOptionId={null}
                              onSelect={handleSelect} isLocked={false} dimmed={true}
                              remainingEnergy={remainingEnergy} picksLocked={picksLocked} />
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-2.5">
                      <p className="text-gray-600 text-[11px] font-medium tracking-wider uppercase px-1">
                        {effectiveEvents.length} events — choose 6 ({pickCount}/6 selected)
                      </p>
                      {sortWithLiveFirst(eventsWithCounts, liveData).map(ev => (
                        <EventCard key={ev.id} event={ev} selectedOptionId={picks[ev.id]}
                          onSelect={handleSelect} isLocked={false} dimmed={false}
                          remainingEnergy={remainingEnergy} picksLocked={picksLocked} />
                      ))}
                      {remainingEnergy <= 5 && pickCount < 6 && (
                        <EnergyCTABanner remainingEnergy={remainingEnergy} onSaveAndGo={saveAndGoToStore} />
                      )}
                    </div>
                  )
                )}

                {/* Events for locked/finished gameweek */}
                {effectiveIsLocked && (
                  <>
                    {myPickedEvents.length > 0 && (
                      <div className="space-y-2.5">
                        {/* Live tally bar — hidden when perfect week card above already covers results */}
                        {liveTally && !effectiveEntry?.is_perfect_week && (
                          <div className={`rounded-2xl border px-4 py-3 ${
                            liveTally.pending === 0 && liveTally.won === 6
                              ? 'bg-yellow-900/20 border-yellow-500/30'
                              : liveTally.pending === 0
                              ? 'bg-white/4 border-white/8'
                              : 'bg-[#0d1117] border-white/8'
                          }`}>
                            {/* Top row: aciertos/fallos/pendientes + pts semana */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                  <span className="text-green-400 font-black text-lg tabular-nums">{liveTally.won}</span>
                                  <span className="text-green-600 text-xs">✓</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-red-400 font-black text-lg tabular-nums">{liveTally.lost}</span>
                                  <span className="text-red-600 text-xs">✗</span>
                                </div>
                                {liveTally.pending > 0 && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-gray-500 font-black text-lg tabular-nums">{liveTally.pending}</span>
                                    <span className="text-gray-700 text-xs">⏳</span>
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                {liveTally.pending === 0 && liveTally.won === 6
                                  ? <p className="text-yellow-400 font-black text-xl tabular-nums">+10 pts ⭐</p>
                                  : <p className="text-indigo-300 font-black text-xl tabular-nums">+{liveTally.pts} pts</p>
                                }
                                <p className="text-gray-600 text-[10px] -mt-0.5">
                                  this week {liveTally.pending > 0 ? '(provisional)' : '(final)'}
                                </p>
                              </div>
                            </div>
                            {/* Bottom row: sprint total + ranking */}
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/6">
                              <p className="text-gray-500 text-[11px]">Sprint total</p>
                              <div className="flex items-center gap-2">
                                <p className="text-gray-300 font-bold text-sm tabular-nums">{lp} pts</p>
                                {myRank && (
                                  <span className="text-[11px] bg-indigo-900/40 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold">
                                    #{myRank}{divSize > 0 ? ` / ${divSize}` : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        <p className="text-gray-400 text-xs font-semibold tracking-wider uppercase px-1">Your picks</p>
                        {sortWithLiveFirst(myPickedEvents, liveData)
                          .map(ev => {
                            const liveEvData = liveData[ev.id]
                            const liveStatus = computePickLiveStatus(ev, displayPicks[ev.id], liveEvData)
                            const isFixtureLive = liveEvData && LIVE_STATUSES.includes(liveEvData.fixture_status_short)
                            const isMatchLiveOrDone = isFixtureLive || (liveEvData && FINISHED_STATUSES.includes(liveEvData.fixture_status_short))
                            return (
                              <div key={ev.id} className="space-y-0 relative">
                                {/* Animated glow ring for live fixtures */}
                                {isFixtureLive && (
                                  <div className="absolute -inset-[2px] rounded-[18px] bg-gradient-to-r from-green-500/0 via-green-400/30 to-green-500/0 animate-pulse pointer-events-none z-0" />
                                )}
                                <div className={`relative z-10 space-y-0 rounded-2xl overflow-hidden ${isFixtureLive ? 'ring-1 ring-green-500/40' : ''}`}>
                                  {/* Live header bar */}
                                  {isFixtureLive && (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-green-950/60 border-b border-green-500/20">
                                      <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                                      </span>
                                      <span className="text-green-400 font-black text-[11px] tracking-widest uppercase">
                                        {liveEvData.fixture_status_short === 'P' ? 'Penalties' :
                                         liveEvData.fixture_status_short === 'ET' || liveEvData.fixture_status_short === 'BT' ? 'Extra Time' :
                                         liveEvData.fixture_status_short === 'HT' ? 'Half Time' : 'Live'}
                                      </span>
                                      {liveEvData.fixture_elapsed > 0 && liveEvData.fixture_status_short !== 'HT' && liveEvData.fixture_status_short !== 'BT' && liveEvData.fixture_status_short !== 'P' && (
                                        <span className="text-green-500/70 font-bold text-[11px]">{liveEvData.fixture_elapsed}'</span>
                                      )}
                                      {displayPicks[ev.id] && (() => {
                                        const PICK_STATUS_LABEL = { live_winning: 'Favorable', live_neutral: 'Neutral', unlikely: 'At Risk', likely: 'Very likely', won: 'Won', lost: 'Lost' }
                                        const PICK_STATUS_COLOR = { live_winning: 'text-blue-400', live_neutral: 'text-blue-300/60', unlikely: 'text-orange-400', likely: 'text-purple-400', won: 'text-green-400', lost: 'text-red-400' }
                                        const label = PICK_STATUS_LABEL[liveStatus]
                                        if (!label) return null
                                        return (
                                          <>
                                            <span className="text-green-800 text-[11px] font-bold">·</span>
                                            <span className={`text-[10px] font-semibold ${PICK_STATUS_COLOR[liveStatus]}`}>{label}</span>
                                          </>
                                        )
                                      })()}
                                    </div>
                                  )}
                                  {/* Non-live header (badge only — score is now inside the card) */}
                                  {!isFixtureLive && (
                                    <div className="flex items-center px-1 pb-1">
                                      <LivePickBadge status={liveStatus} elapsed={liveEvData?.fixture_elapsed} matchTime={ev.match_time} />
                                    </div>
                                  )}
                                  <EventCard event={ev} selectedOptionId={displayPicks[ev.id]}
                                    onSelect={handleSelect} isLocked={true} dimmed={false}
                                    liveEv={liveEvData} showInsights={true} />
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    )}

                    {myPickedEvents.length === 0 && (
                      <div className="bg-orange-900/15 border border-orange-500/25 rounded-2xl p-5 text-center">
                        <p className="text-3xl mb-2">⏰</p>
                        <p className="text-orange-300 font-semibold text-sm">Too late for this gameweek</p>
                        <p className="text-gray-500 text-xs mt-1">The pick window has closed. Here's what was on the table:</p>
                      </div>
                    )}

                    {unpickedEvents.length > 0 && (
                      <div className="space-y-2.5">
                        {myPickedEvents.length > 0 && (
                          <p className="text-gray-600 text-xs font-medium tracking-wider uppercase px-1">Picks not played</p>
                        )}
                        {sortWithLiveFirst(unpickedEvents, liveData).map(ev => {
                          const liveEvData = liveData[ev.id]
                          const isLive = liveEvData && LIVE_STATUSES.includes(liveEvData.fixture_status_short)
                          const isDone = liveEvData && FINISHED_STATUSES.includes(liveEvData.fixture_status_short)
                          const isMatchLiveOrDone = isLive || isDone
                          return (
                            <div key={ev.id} className="space-y-1">
                              {isLive && (
                                <div className="flex items-center px-1">
                                  <span className="flex items-center gap-1.5 text-[10px] text-green-400 font-bold uppercase tracking-wide">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                    LIVE {liveEvData.fixture_elapsed}'
                                  </span>
                                </div>
                              )}
                              <EventCard event={ev} selectedOptionId={null}
                                onSelect={() => {}} isLocked={true} dimmed={myPickedEvents.length > 0}
                                liveEv={liveEvData} showInsights={true} />
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </>
                )}

                {/* Division standings */}
                <SprintLeaderboard
                  myUserId={myUserId}
                  data={leaderboard}
                  isGwLocked={isLocked}
                />

                {/* Future week preview — only when viewing the current active week */}
                {currentWeek != null && selectedWeek === currentWeek && currentWeek < gwCount && (
                  <FutureWeekSection
                    nextGw={byWeek[currentWeek + 1] || null}
                    nextWeekNum={currentWeek + 1}
                    onGoToNextWeek={() => setSelectedWeek(currentWeek + 1)}
                  />
                )}
              </>
            )}
          </>
        )}

        <div className="text-xs text-gray-700 text-center py-2">
          1 correct pick = +1 pt · 6/6 perfect = +10 pts
        </div>
      </div>



      {/* ── Picks confirmation modal ── */}
      {showConfirm && !effectiveIsLocked && (
        <PicksConfirmModal
          picks={picks}
          effectiveEvents={effectiveEvents}
          totalEnergy={totalEnergy}
          totalAvailable={totalAvailable}
          gw={gw}
          submitting={submitting}
          err={err}
          onConfirm={confirmPicks}
          onClose={() => { if (!submitting) setShowConfirm(false) }}
        />
      )}
    </div>
  )
}
