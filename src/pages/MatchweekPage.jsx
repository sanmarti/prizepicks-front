import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getGloryStatus, getGloryGameweek, submitGloryPicks,
  getGloryLeaderboard, getCommunityPicks, getFixtureForm, getGameweekLive, getEnergyPacks,
} from '../api/glory'
import BottomNav from '../components/layout/BottomNav'

const EVENT_TYPE_LABELS = {
  MATCH_RESULT:  { label: 'Match Result',       icon: '⚽' },
  GOALS:         { label: 'Goals Over/Under',   icon: '🥅' },
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
  'Sweden':'🇸🇪','Wales':'🏴󠁧󠁢󠁷󠁬󠁳󠁿','Scotland':'🏴󠁧󠁢󠁳󠁣󠁴󠁿','Turkey':'🇹🇷',
  'Ukraine':'🇺🇦','Romania':'🇷🇴','Slovakia':'🇸🇰','Hungary':'🇭🇺',
  'Czechia':'🇨🇿','Czech Republic':'🇨🇿','Slovenia':'🇸🇮','Albania':'🇦🇱',
  'Georgia':'🇬🇪','New Zealand':'🇳🇿','Bolivia':'🇧🇴','Paraguay':'🇵🇾',
  'Peru':'🇵🇪','Chile':'🇨🇱','Venezuela':'🇻🇪','Egypt':'🇪🇬',
  'Nigeria':'🇳🇬','Algeria':'🇩🇿','Mali':'🇲🇱','South Africa':'🇿🇦',
  'Angola':'🇦🇴','Qatar':'🇶🇦','Kuwait':'🇰🇼','Indonesia':'🇮🇩',
  'United States':'🇺🇸','Honduras':'🇭🇳','El Salvador':'🇸🇻','Haiti':'🇭🇹',
  'Trinidad and Tobago':'🇹🇹','Russia':'🇷🇺','Israel':'🇮🇱','Wales':'🏴󠁧󠁢󠁷󠁬󠁳󠁿',
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

const ENERGY_BUDGET = 30

const LIVE_STATUSES     = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'SUSP', 'INT', 'LIVE']
const FINISHED_STATUSES = ['FT', 'AET', 'PEN', 'AWD', 'WO']

// Compute the live color for a user's picked option given live fixture data
function computePickLiveStatus(event, pickedOptionId, liveEvent) {
  if (!liveEvent) return 'upcoming'
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
      // Check if any goals conceded — if away team scored (home conceded) or vice versa
      const homeConceded = aGoals > 0
      const awayConceded = hGoals > 0
      const conceded = homeCS ? homeConceded : awayConceded
      if (!conceded) return (isLate && min >= 75) ? 'likely' : 'live_winning'
      return isLate ? 'unlikely' : 'live_neutral'
    }
  }

  // Default for LIVE
  return 'live_neutral'
}

const LIVE_STATUS_STYLES = {
  upcoming:         { bg: 'bg-gray-800/50',      text: 'text-gray-500',    border: 'border-gray-700/50',    dot: 'bg-gray-600',     label: 'Starting soon'    },
  live_neutral:     { bg: 'bg-blue-900/25',       text: 'text-blue-300',    border: 'border-blue-700/30',    dot: 'bg-blue-400',     label: 'Live'             },
  live_winning:     { bg: 'bg-blue-900/25',       text: 'text-blue-300',    border: 'border-blue-700/30',    dot: 'bg-blue-400',     label: 'On track'         },
  likely:           { bg: 'bg-purple-900/30',     text: 'text-purple-300',  border: 'border-purple-700/40',  dot: 'bg-purple-400',   label: 'Very likely ✓'   },
  unlikely:         { bg: 'bg-orange-900/25',     text: 'text-orange-300',  border: 'border-orange-700/30',  dot: 'bg-orange-400',   label: 'At risk'          },
  won:              { bg: 'bg-green-900/30',       text: 'text-green-300',   border: 'border-green-700/40',   dot: 'bg-green-400',    label: 'Won ✓'            },
  lost:             { bg: 'bg-red-900/25',         text: 'text-red-300',     border: 'border-red-700/30',     dot: 'bg-red-400',      label: 'Lost'             },
  finished_unknown: { bg: 'bg-gray-800/50',       text: 'text-gray-500',    border: 'border-gray-700/50',    dot: 'bg-gray-500',     label: 'Settled'          },
}

function LivePickBadge({ status, elapsed }) {
  const s = LIVE_STATUS_STYLES[status] || LIVE_STATUS_STYLES.upcoming
  const isLive = ['live_neutral', 'live_winning', 'likely', 'unlikely'].includes(status)
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${s.bg} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot} ${isLive ? 'animate-pulse' : ''}`} />
      <span className={`text-[10px] font-bold ${s.text}`}>{s.label}</span>
      {isLive && elapsed > 0 && (
        <span className={`text-[9px] font-medium ${s.text} opacity-70`}>{elapsed}'</span>
      )}
    </div>
  )
}

function fmt(d, opts) { return new Date(d).toLocaleString('en-GB', opts) }
function fmtFull(d)   { return fmt(d, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }
function fmtShort(d)  { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }

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

// ── Week navigation bar ────────────────────────────────────────────────────────
function weekStatusInfo(gw, weekNum, weekHasPicks) {
  if (!gw || gw.status === 'DRAFT') return { label: 'Upcoming', color: 'text-gray-700', dot: 'bg-gray-800', canClick: false }
  if (gw.status === 'FINISHED') return { label: 'Closed', color: 'text-gray-600', dot: 'bg-gray-600', canClick: true }
  if (gw.status === 'LOCKED' || (gw.lock_time && new Date() > new Date(gw.lock_time)))
    return { label: 'Picks Locked', color: 'text-yellow-600', dot: 'bg-yellow-500', canClick: true }
  if (gw.status === 'PUBLISHED') {
    if (weekHasPicks[weekNum]) return { label: 'Confirmed ✓', color: 'text-green-400', dot: 'bg-green-500', canClick: true }
    return { label: 'Awaiting', color: 'text-amber-500', dot: 'bg-amber-500', canClick: true }
  }
  return { label: 'Upcoming', color: 'text-gray-700', dot: 'bg-gray-800', canClick: false }
}

function WeekNav({ gwCount, byWeek, selectedWeek, onSelect, weekHasPicks }) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: gwCount }, (_, i) => i + 1).map(w => {
        const gw         = byWeek[w]
        const isSelected = w === selectedWeek
        const { label, color, dot, canClick } = weekStatusInfo(gw, w, weekHasPicks)

        return (
          <button
            key={w}
            onClick={() => canClick && onSelect(w)}
            disabled={!canClick}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-all ${
              isSelected
                ? 'bg-indigo-600/20 border-indigo-500/50'
                : canClick
                  ? 'bg-white/4 border-white/8 hover:bg-white/8'
                  : 'bg-white/2 border-transparent cursor-not-allowed'
            }`}
          >
            <span className={`text-[12px] font-black ${isSelected ? 'text-indigo-300' : canClick ? 'text-gray-300' : 'text-gray-700'}`}>
              W{w}
            </span>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
            <span className={`text-[8px] font-bold tracking-wide leading-none text-center ${isSelected ? 'text-indigo-400' : color}`}>
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ── Single event pick card ─────────────────────────────────────────────────────
function EventCard({ event, selectedOptionId, onSelect, isLocked, dimmed, remainingEnergy, picksLocked }) {
  const [open, setOpen] = useState(!dimmed)

  const [homeTeam, awayTeam] = (event.fixture_name || '').split(' vs ').map(s => s?.trim())
  const homeFlag = getFlag(homeTeam)
  const awayFlag = getFlag(awayTeam)
  const compIcon = COMPETITION_ICONS[event.competition] || '🏆'
  const typeInfo = EVENT_TYPE_LABELS[event.event_type] || { label: event.event_type, icon: '📋' }
  const isPlayerScore = event.event_type === 'PLAYER_SCORE'

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${
      dimmed
        ? 'bg-white/2 border-white/5 opacity-60'
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
              <span className="text-[10px] bg-indigo-900/50 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full ml-1 font-semibold">✓ Picked</span>
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
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className="text-2xl flex-shrink-0">{homeFlag}</span>
              <span className={`font-bold text-sm leading-tight truncate ${dimmed ? 'text-gray-500' : 'text-white'}`}>{homeTeam}</span>
            </div>
            <span className="text-gray-700 text-xs font-semibold flex-shrink-0">vs</span>
            <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
              <span className={`font-bold text-sm leading-tight truncate text-right ${dimmed ? 'text-gray-500' : 'text-white'}`}>{awayTeam}</span>
              <span className="text-2xl flex-shrink-0">{awayFlag}</span>
            </div>
          </div>
        )}

        {/* Match time + venue */}
        <p className="text-gray-600 text-[10px] mt-1">
          {fmtFull(event.match_time)}
          {event.venue_name && <span className="text-gray-700"> · 🏟 {event.venue_name}</span>}
        </p>
      </button>

      {/* Form dropdown — only for fixture-based events */}
      {event.fixture_id && !isPlayerScore && (
        <FormDropdown
          fixtureId={event.fixture_id}
          homeTeam={homeTeam} awayTeam={awayTeam}
          homeFlag={homeFlag} awayFlag={awayFlag}
        />
      )}

      {/* Options */}
      {(!dimmed || open) && (
        <div className="px-3 pb-3 grid gap-1.5">
          {event.options.map(opt => {
            const isSelected = opt.id === selectedOptionId
            const won  = opt.result === 'WON'
            const lost = opt.result === 'LOST'
            const pct  = event.total_picks > 0 ? Math.round((opt.pick_count || 0) / event.total_picks * 100) : null
            const notEnoughEnergy = !isSelected && !won && !lost && !dimmed
              && remainingEnergy !== undefined && opt.energy_cost != null
              && opt.energy_cost > remainingEnergy
            const lockBlocked = !isSelected && !won && !lost && !dimmed && picksLocked
            const isUnavailable = notEnoughEnergy || lockBlocked

            // Add flag to option label
            const optTeam = Object.keys(COUNTRY_FLAGS).find(k => opt.label.startsWith(k + ' '))
            const optFlag = optTeam ? COUNTRY_FLAGS[optTeam] : ''
            const optLabelClean = optTeam ? opt.label.slice(optTeam.length).trim() : opt.label
            const isDraw = opt.label === 'Draw'
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
                  won  ? 'bg-green-900/30 border border-green-500/40 text-green-300' :
                  lost ? 'bg-red-900/10 border border-red-500/15 text-red-400/60' :
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
                  {isDraw ? '🤝' : optFlag || (won ? '✅' : '')}
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

// ── Sprint leaderboard (compact) ───────────────────────────────────────────────
function SprintLeaderboard({ sprintId, myUserId, myDivisionId }) {
  const [data, setData] = useState(null)
  useEffect(() => {
    if (!sprintId || !myDivisionId) return
    getGloryLeaderboard({ sprint_id: sprintId, division_id: myDivisionId })
      .then(r => setData(r.data))
      .catch(() => {})
  }, [sprintId, myDivisionId])

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

      {promPts && (
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
            <div key={r.user_id} className={`px-4 py-3 border-b border-white/5 last:border-0 ${isMe ? 'bg-indigo-900/15' : ''}`}>
              <div className="flex items-center gap-3">
                {/* Rank */}
                <span className={`w-6 text-center text-xs font-black flex-shrink-0 ${
                  rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-gray-300' : rank === 3 ? 'text-amber-600' : 'text-gray-600'
                }`}>{rank}</span>

                {/* Avatar */}
                {r.avatar_url
                  ? <img src={r.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  : <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      isMe ? 'bg-indigo-700 text-white' : 'bg-white/8 text-gray-400'
                    }`}>
                      {(r.display_name || '?')[0].toUpperCase()}
                    </div>
                }

                {/* Name + stats row */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-semibold truncate ${isMe ? 'text-white' : 'text-gray-300'}`}>
                      {r.display_name || 'Player'}
                    </span>
                    {isMe && <span className="text-indigo-400 text-[10px] font-bold flex-shrink-0">YOU</span>}
                    {r.is_rookie && <span className="text-[9px] bg-blue-900/40 text-blue-400 px-1.5 py-0.5 rounded-full flex-shrink-0">ROOKIE</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {r.gameweeks_participated > 0 && (
                      <span className="text-[10px] text-green-400 font-semibold">
                        {r.total_correct_picks}✓ correct
                      </span>
                    )}
                    {r.total_incorrect_picks > 0 && (
                      <span className="text-[10px] text-red-400/70">
                        {r.total_incorrect_picks}✗
                      </span>
                    )}
                    {accuracy !== null && (
                      <span className="text-[10px] text-gray-500">{accuracy}% acc</span>
                    )}
                    {r.perfect_weeks > 0 && (
                      <span className="text-[10px] text-yellow-400">⭐{r.perfect_weeks} perfect</span>
                    )}
                    {r.gameweeks_participated > 0 && (
                      <span className="text-[10px] text-gray-600">{r.gameweeks_participated}wk</span>
                    )}
                  </div>
                </div>

                {/* Points */}
                <div className="text-right flex-shrink-0">
                  <p className={`text-base font-black tabular-nums ${isPromo ? 'text-green-400' : isRel ? 'text-red-400' : isMe ? 'text-indigo-300' : 'text-gray-400'}`}>
                    {r.total_league_points}
                  </p>
                  <p className="text-[9px] text-gray-700 -mt-0.5">pts</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {end < data.rows.length && <p className="text-center text-gray-700 text-xs py-1.5">· · · {data.rows.length - end} below · · ·</p>}

      {relPts !== null && (
        <div className="px-4 py-2 bg-red-900/10 border-t border-red-500/10 flex items-center justify-between text-xs">
          <span className="text-red-400 font-semibold">⬇ Relegation ≤{relPts} pts</span>
          {myPts <= relPts && <span className="text-red-400 font-bold animate-pulse">⚠ You're at risk!</span>}
        </div>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function MatchweekPage() {
  const [status,      setStatus]      = useState(null)
  const [gwData,      setGwData]      = useState(null)
  const [community,   setCommunity]   = useState(null)
  const [picks,       setPicks]       = useState({})
  const [submitting,  setSubmitting]  = useState(false)
  const [submitted,   setSubmitted]   = useState(false)
  const [msg,         setMsg]         = useState('')
  const [err,         setErr]         = useState('')
  const [loading,     setLoading]     = useState(true)
  const [gwLoading,   setGwLoading]   = useState(false)
  const [selectedWeek, setSelectedWeek] = useState(null)
  const [weekHasPicks, setWeekHasPicks] = useState({})
  const [liveData,    setLiveData]    = useState({})
  const [walletBalance, setWalletBalance] = useState(0)
  const liveIntervalRef = useRef(null)

  const loadStatus = useCallback(() =>
    getGloryStatus().then(r => { setStatus(r.data); return r.data }).catch(() => null)
  , [])

  const loadGw = useCallback((gwId) => {
    if (!gwId) return
    setGwLoading(true)
    setPicks({}); setSubmitted(false); setCommunity(null); setErr(''); setMsg('')
    getGloryGameweek(gwId).then(r => {
      setGwData(r.data)
      if (r.data.my_picks?.length) {
        const existing = {}
        for (const p of r.data.my_picks) existing[p.event_id] = p.event_option_id
        setPicks(existing); setSubmitted(true)
        const sprintWeek = r.data.gameweek?.sprint_week
        if (sprintWeek) setWeekHasPicks(prev => ({ ...prev, [sprintWeek]: true }))
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
      // Prefer backend current_gameweek; fallback: active PUBLISHED (future lock), LOCKED, last FINISHED
      let targetGw = st.current_gameweek
      if (!targetGw || !targetGw.id) {
        const now = new Date()
        const pubRows = gws.filter(g => g.status === 'PUBLISHED')
        targetGw = pubRows.find(g => new Date(g.lock_time) > now)
          ?? pubRows[pubRows.length - 1]
          ?? gws.find(g => g.status === 'LOCKED')
          ?? [...gws].reverse().find(g => g.status === 'FINISHED')
          ?? gws[0]
          ?? null
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
    else { setGwData(null) }
  }, [selectedWeek]) // eslint-disable-line react-hooks/exhaustive-deps

  const sprint   = status?.sprint
  const div      = status?.division
  const prog     = status?.sprint_progress
  const lp       = prog?.total_league_points ?? 0
  const gwCount  = sprint?.gameweek_count || 4
  const gwList   = sprint?.gameweeks || []
  const byWeek   = useMemo(() => Object.fromEntries(gwList.map(g => [g.sprint_week, g])), [gwList])
  const currentWeek = status?.current_gameweek?.sprint_week

  const gw       = gwData?.gameweek
  const isLocked = gwData?.is_locked ?? false
  const entry    = gwData?.my_entry
  const events   = gw?.events || []
  const pickCount = Object.keys(picks).length

  const totalEnergy = useMemo(() => {
    let sum = 0
    for (const ev of events) {
      const opt = ev.options?.find(o => o.id === picks[ev.id])
      if (opt?.energy_cost) sum += opt.energy_cost
    }
    return sum
  }, [picks, events])

  const remainingEnergy = ENERGY_BUDGET + walletBalance - totalEnergy
  const picksLocked = pickCount === 6 && !isLocked

  const eventsWithCounts = useMemo(() => {
    if (!community) return events
    const byId = {}
    for (const ce of community.events) {
      const total = ce.options.reduce((s, o) => s + (o.pick_count || 0), 0)
      byId[ce.id] = { options: ce.options, total_picks: total }
    }
    return events.map(e => {
      const c = byId[e.id]
      if (!c) return e
      return { ...e, options: e.options.map(o => { const co = c.options.find(x => x.id === o.id); return { ...o, pick_count: co?.pick_count ?? 0 } }), total_picks: c.total_picks }
    })
  }, [events, community])

  const myPickedEvents = eventsWithCounts.filter(e => picks[e.id])
  const unpickedEvents = eventsWithCounts.filter(e => !picks[e.id])

  const handleSelect = (eventId, optionId) => {
    if (isLocked) return
    // If 6 picks locked and trying to pick a new event, block (only allow deselect)
    if (picksLocked && !picks[eventId]) return
    setPicks(prev => { const n = { ...prev }; if (n[eventId] === optionId) delete n[eventId]; else n[eventId] = optionId; return n })
    setSubmitted(false)
    setMsg('')
  }

  const savePicks = useCallback(() => {
    if (submitting || !gw?.id || pickCount < 4) return
    const pickList = Object.entries(picks).map(([event_id, event_option_id]) => ({ event_id, event_option_id }))
    setSubmitting(true); setErr(''); setMsg('')
    submitGloryPicks(gw.id, pickList)
      .then(() => {
        setSubmitted(true); setMsg('✓ Picks saved!'); setTimeout(() => setMsg(''), 3000)
        if (gw.sprint_week) setWeekHasPicks(prev => ({ ...prev, [gw.sprint_week]: true }))
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
        <div className="flex items-center justify-between">
          <div>
            <p className="text-indigo-400 text-[13px] font-bold tracking-wide">{sprint?.name || '6 to Glory'}</p>
            <h1 className="text-white text-xl font-bold mt-0.5">{div?.icon} {div?.division_name || 'Academy'}</h1>
          </div>
          <div className="text-right">
            <p className="text-indigo-400 font-black text-2xl">{lp}</p>
            <p className="text-gray-600 text-[11px]">Points</p>
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
            {/* Week navigation */}
            <WeekNav
              gwCount={gwCount}
              byWeek={byWeek}
              selectedWeek={selectedWeek}
              onSelect={setSelectedWeek}
              weekHasPicks={weekHasPicks}
            />

            {/* Week header with prev/next */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => setSelectedWeek(w => Math.max(1, w - 1))}
                disabled={selectedWeek <= 1 || byWeek[selectedWeek - 1]?.status === 'DRAFT' || !byWeek[selectedWeek - 1]}
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-gray-400 disabled:opacity-25 hover:bg-white/10 transition-colors flex-shrink-0"
              >
                ←
              </button>
              <div className="flex-1 text-center">
                <p className="text-white font-bold text-base">Gameweek {selectedWeek}</p>
                {selectedWeek === currentWeek && !isLocked && (
                  <p className="text-green-400 text-[10px] font-semibold tracking-widest">PICKS OPEN</p>
                )}
                {selectedWeek === currentWeek && isLocked && (
                  <p className="text-yellow-400 text-[10px] font-semibold tracking-widest">LOCKED</p>
                )}
                {selectedWeek !== currentWeek && gw && (
                  <p className={`text-[10px] font-semibold tracking-widest ${
                    gw.status === 'FINISHED' ? 'text-purple-400' :
                    gw.status === 'LOCKED'   ? 'text-yellow-400' :
                    gw.status === 'PUBLISHED' ? 'text-green-400' : 'text-gray-600'
                  }`}>{gw.status}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedWeek(w => Math.min(gwCount, w + 1))}
                disabled={selectedWeek >= gwCount || !byWeek[selectedWeek + 1] || byWeek[selectedWeek + 1]?.status === 'DRAFT'}
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-gray-400 disabled:opacity-25 hover:bg-white/10 transition-colors flex-shrink-0"
              >
                →
              </button>
            </div>

            {/* Lock time row */}
            {gw && !gwLoading && (
              <div className="flex items-center justify-between px-1">
                <p className="text-gray-600 text-[11px]">Locks: {fmtFull(gw.lock_time)}</p>
                {/* Settled entry results */}
                {entry?.status === 'completed' && (
                  <div className={`flex items-center gap-3 rounded-xl px-3 py-1.5 ${
                    entry.is_perfect_week ? 'bg-yellow-900/20 border border-yellow-500/30' : 'bg-white/5'
                  }`}>
                    {entry.is_perfect_week && <span className="text-yellow-400 text-xs">⭐ Perfect</span>}
                    <span className="text-[11px] text-gray-500">{entry.correct_picks}/6 correct</span>
                    <span className="text-[11px] text-indigo-400 font-bold">+{entry.league_points} pts</span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Sticky pick counter (only when gameweek is open for picks) ── */}
      {sprint && !isLocked && !gwLoading && gw && (
        <div className="sticky top-0 z-30 bg-[#0a0d12]/95 backdrop-blur-md border-b border-white/8">
          <div className="max-w-md mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-xs">Picks</span>
                <span className={`font-black text-sm tabular-nums ${pickCount === 6 ? 'text-green-400' : 'text-indigo-400'}`}>
                  {pickCount}/6
                </span>
                {picksLocked && (
                  <span className="text-[10px] bg-green-900/30 text-green-400 border border-green-500/25 px-2 py-0.5 rounded-full font-semibold">
                    {submitting ? 'Saving…' : submitted ? '✓ Saved' : 'Locked'}
                  </span>
                )}
                {!picksLocked && submitting && (
                  <div className="w-3 h-3 border border-gray-600 border-t-indigo-400 rounded-full animate-spin" />
                )}
              </div>
              <div className="flex items-center gap-3">
                {totalEnergy > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-mono font-bold ${
                      remainingEnergy <= 10 ? 'text-red-400' :
                      remainingEnergy <= 20 ? 'text-yellow-400' : 'text-yellow-500'
                    }`}>⚡{remainingEnergy}</span>
                    <span className="text-gray-700 text-[10px]">left</span>
                  </div>
                )}
                {totalEnergy === 0 && (
                  <span className="text-gray-600 text-[11px]">⚡{ENERGY_BUDGET + walletBalance} energy</span>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i < pickCount
                    ? picksLocked ? 'bg-green-500' : 'bg-indigo-500'
                    : 'bg-white/10'
                }`} />
              ))}
            </div>
            {pickCount >= 4 && (
              <button
                onClick={savePicks}
                disabled={submitting}
                className={`mt-2 w-full py-2 rounded-xl text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-50 ${
                  submitted
                    ? 'bg-green-700/50 text-green-300 border border-green-600/40'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                {submitting ? 'Saving…' : submitted ? `✓ Saved (${pickCount} picks)` : `Save ${pickCount} picks`}
              </button>
            )}
            {err && <p className="text-red-400 text-[11px] mt-2">{err}</p>}
            {msg && <p className="text-green-400 text-[11px] mt-2">{msg}</p>}
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

            {/* Week not yet set up */}
            {!gwLoading && !gw && (
              <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-8 text-center">
                <p className="text-gray-500 text-sm font-medium">Gameweek {selectedWeek} not yet set up</p>
                <p className="text-gray-700 text-xs mt-1">Events will appear here once the admin publishes this week</p>
              </div>
            )}

            {!gwLoading && gw && (
              <>
                {/* Events for open gameweek */}
                {!isLocked && (
                  submitted && myPickedEvents.length > 0 ? (
                    <>
                      <div className="space-y-2.5">
                        <p className="text-green-500 text-[11px] font-bold tracking-wider uppercase px-1">
                          ✓ Confirmed picks ({myPickedEvents.length})
                        </p>
                        {[...myPickedEvents]
                          .sort((a, b) => {
                            const PRIO = { likely: 0, live_winning: 1, live_neutral: 2, unlikely: 3, upcoming: 4, won: 5, lost: 6, finished_unknown: 7 }
                            const as_ = computePickLiveStatus(a, picks[a.id], liveData[a.id])
                            const bs_ = computePickLiveStatus(b, picks[b.id], liveData[b.id])
                            return (PRIO[as_] ?? 4) - (PRIO[bs_] ?? 4) || new Date(a.match_time) - new Date(b.match_time)
                          })
                          .map(ev => {
                            const liveStatus = computePickLiveStatus(ev, picks[ev.id], liveData[ev.id])
                            const liveEv = liveData[ev.id]
                            return (
                              <div key={ev.id} className="space-y-1">
                                <div className="flex items-center justify-between px-1">
                                  <LivePickBadge status={liveStatus} elapsed={liveEv?.fixture_elapsed} />
                                  {liveEv?.home_goals != null && liveEv?.away_goals != null && LIVE_STATUSES.includes(liveEv.fixture_status_short) && (
                                    <span className="text-[11px] text-gray-400 font-mono font-bold">
                                      {liveEv.home_team?.split(' ').pop() || 'H'} {liveEv.home_goals}–{liveEv.away_goals} {liveEv.away_team?.split(' ').pop() || 'A'}
                                    </span>
                                  )}
                                </div>
                                <EventCard event={ev} selectedOptionId={picks[ev.id]}
                                  onSelect={handleSelect} isLocked={false} dimmed={false}
                                  remainingEnergy={remainingEnergy} picksLocked={picksLocked} />
                              </div>
                            )
                          })}
                      </div>
                      {unpickedEvents.length > 0 && (
                        <div className="space-y-2.5 mt-2">
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
                        {events.length} events — choose {pickCount >= 4 ? `${pickCount}/6` : '4–6'}
                      </p>
                      {eventsWithCounts.map(ev => (
                        <EventCard key={ev.id} event={ev} selectedOptionId={picks[ev.id]}
                          onSelect={handleSelect} isLocked={false} dimmed={false}
                          remainingEnergy={remainingEnergy} picksLocked={picksLocked} />
                      ))}
                    </div>
                  )
                )}

                {/* Events for locked/finished gameweek */}
                {isLocked && (
                  <>
                    {myPickedEvents.length > 0 && (
                      <div className="space-y-2.5">
                        <p className="text-gray-400 text-xs font-semibold tracking-wider uppercase px-1">Your picks</p>
                        {[...myPickedEvents]
                          .sort((a, b) => {
                            const PRIO = { likely: 0, live_winning: 1, live_neutral: 2, unlikely: 3, upcoming: 4, won: 5, lost: 6, finished_unknown: 7 }
                            const as_ = computePickLiveStatus(a, picks[a.id], liveData[a.id])
                            const bs_ = computePickLiveStatus(b, picks[b.id], liveData[b.id])
                            return (PRIO[as_] ?? 4) - (PRIO[bs_] ?? 4) || new Date(a.match_time) - new Date(b.match_time)
                          })
                          .map(ev => {
                            const liveStatus = computePickLiveStatus(ev, picks[ev.id], liveData[ev.id])
                            const liveEv = liveData[ev.id]
                            return (
                              <div key={ev.id} className="space-y-1">
                                <div className="flex items-center justify-between px-1">
                                  <LivePickBadge status={liveStatus} elapsed={liveEv?.fixture_elapsed} />
                                  {liveEv?.home_goals != null && liveEv?.away_goals != null && LIVE_STATUSES.includes(liveEv?.fixture_status_short || '') && (
                                    <span className="text-[11px] text-gray-400 font-mono font-bold">
                                      {liveEv.home_team?.split(' ').pop() || 'H'} {liveEv.home_goals}–{liveEv.away_goals} {liveEv.away_team?.split(' ').pop() || 'A'}
                                    </span>
                                  )}
                                </div>
                                <EventCard event={ev} selectedOptionId={picks[ev.id]}
                                  onSelect={handleSelect} isLocked={true} dimmed={false} />
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
                          <p className="text-gray-600 text-xs font-medium tracking-wider uppercase px-1">Other events this week</p>
                        )}
                        {unpickedEvents.map(ev => (
                          <EventCard key={ev.id} event={ev} selectedOptionId={null}
                            onSelect={() => {}} isLocked={true} dimmed={myPickedEvents.length > 0} />
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Division standings */}
                <SprintLeaderboard
                  sprintId={sprint?.id}
                  myUserId={status?.user?.id}
                  myDivisionId={div?.division_id}
                />
              </>
            )}
          </>
        )}

        <div className="text-xs text-gray-700 text-center py-2">
          1 correct pick = +1 pt · 6/6 perfect = +10 pts
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
