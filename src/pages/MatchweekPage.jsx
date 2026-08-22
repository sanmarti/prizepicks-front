import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getFixtureForm, getFixtureStats, getGameweekLive,
} from '../api/glory'
import { getMyLeagues, getLeagueMatchup, submitLeaguePicks } from '../api/leagues'
import Spinner from '../components/ui/Spinner'

// ── Lookup tables ──────────────────────────────────────────────────────────────
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
  'La Liga':'🇪🇸','Serie A':'🇮🇹','Série A':'🇧🇷','Bundesliga':'🇩🇪','Ligue 1':'🇫🇷',
  'Eredivisie':'🇳🇱','Euro':'🇪🇺','Copa America':'🌎','Nations League':'🌐',
}

function getFlag(teamName) {
  if (!teamName) return ''
  const exact = COUNTRY_FLAGS[teamName.trim()]
  if (exact) return exact
  const key = Object.keys(COUNTRY_FLAGS).find(k => teamName.trim().startsWith(k) || k.startsWith(teamName.trim()))
  return key ? COUNTRY_FLAGS[key] : ''
}

const LIVE_STATUSES     = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'SUSP', 'INT', 'LIVE']
const FINISHED_STATUSES = ['FT', 'AET', 'PEN', 'AWD', 'WO']

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
  if (FINISHED_STATUSES.includes(st)) {
    if (pickedOpt.result === 'WON') return 'won'
    if (pickedOpt.result === 'LOST') return 'lost'
    return 'finished_unknown'
  }
  if (!LIVE_STATUSES.includes(st)) return 'upcoming'
  if (pickedOpt.result === 'WON') return 'won'
  if (pickedOpt.result === 'LOST') return 'lost'
  const hGoals = hg ?? 0
  const aGoals = ag ?? 0
  const total  = hGoals + aGoals
  const min    = elapsed ?? 0
  const isLate = min >= 70
  const rk     = pickedOpt.result_key

  if (event.event_type === 'MATCH_RESULT') {
    const homeAhead = hGoals > aGoals, awayAhead = aGoals > hGoals, tied = hGoals === aGoals
    const margin = Math.abs(hGoals - aGoals)
    if (rk === 'HOME_WIN') { if (homeAhead) return (isLate && margin >= 1) ? 'likely' : 'live_winning'; return isLate ? 'unlikely' : 'live_neutral' }
    if (rk === 'AWAY_WIN') { if (awayAhead) return (isLate && margin >= 1) ? 'likely' : 'live_winning'; return isLate ? 'unlikely' : 'live_neutral' }
    if (rk === 'DRAW') { if (tied) return (isLate && min >= 80) ? 'likely' : 'live_winning'; return isLate ? 'unlikely' : 'live_neutral' }
  }
  if (event.event_type === 'BTTS') {
    const bothScored = hGoals > 0 && aGoals > 0
    if (rk === 'BTTS_YES') { if (bothScored) return isLate ? 'likely' : 'live_winning'; if (hGoals > 0 || aGoals > 0) return 'live_neutral'; return isLate ? 'unlikely' : 'live_neutral' }
    if (rk === 'BTTS_NO') { if (bothScored) return isLate ? 'unlikely' : 'live_neutral'; return (isLate && min >= 80) ? 'likely' : 'live_winning' }
  }
  if (event.event_type === 'GOALS') {
    const overMatch  = pickedOpt.label.match(/over\s*([\d.]+)/i)
    const underMatch = pickedOpt.label.match(/under\s*([\d.]+)/i)
    if (overMatch) { const thresh = parseFloat(overMatch[1]); if (total > thresh) return isLate ? 'likely' : 'live_winning'; return isLate ? 'unlikely' : 'live_neutral' }
    if (underMatch) { const thresh = parseFloat(underMatch[1]); if (total < thresh) return isLate ? 'likely' : 'live_winning'; return isLate ? 'unlikely' : 'live_neutral' }
  }
  if (event.event_type === 'WHO_QUALIFIES') {
    const isET = st === 'ET' || st === 'BT' || st === 'P'
    const margin = Math.abs(hGoals - aGoals)
    const pickedTeamAhead = (rk === 'HOME_QUALIFIES' && hGoals > aGoals) || (rk === 'AWAY_QUALIFIES' && aGoals > hGoals)
    const tied = hGoals === aGoals
    if (pickedTeamAhead) return (isLate || isET) && margin >= 1 ? 'likely' : 'live_winning'
    if (tied) return 'live_neutral'
    return 'unlikely'
  }
  return 'live_neutral'
}

const LIVE_STATUS_STYLES = {
  upcoming:         { bg: 'bg-gray-800/50',  text: 'text-gray-500',  border: 'border-gray-700/50',  dot: 'bg-gray-600',  label: 'Starting soon'  },
  live_neutral:     { bg: 'bg-blue-900/25',  text: 'text-blue-300',  border: 'border-blue-700/30',  dot: 'bg-blue-400',  label: 'Live'           },
  live_winning:     { bg: 'bg-green-900/30', text: 'text-green-300', border: 'border-green-700/40', dot: 'bg-green-400', label: 'Favorable'      },
  likely:           { bg: 'bg-green-900/40', text: 'text-green-300', border: 'border-green-600/50', dot: 'bg-green-400', label: 'Looking good ✓' },
  unlikely:         { bg: 'bg-red-900/30',   text: 'text-red-300',   border: 'border-red-700/40',   dot: 'bg-red-400',   label: 'At risk'        },
  won:              { bg: 'bg-green-900/30', text: 'text-green-300', border: 'border-green-700/40', dot: 'bg-green-400', label: 'Won ✓'          },
  lost:             { bg: 'bg-red-900/25',   text: 'text-red-300',   border: 'border-red-700/30',   dot: 'bg-red-400',   label: 'Lost'           },
  finished_unknown: { bg: 'bg-gray-800/50',  text: 'text-gray-500',  border: 'border-gray-700/50',  dot: 'bg-gray-500',  label: 'Settled'        },
}

function LivePickBadge({ status, elapsed, matchTime }) {
  const s    = LIVE_STATUS_STYLES[status] || LIVE_STATUS_STYLES.upcoming
  const isLive = ['live_neutral', 'live_winning', 'likely', 'unlikely'].includes(status)
  let label  = s.label
  if (status === 'upcoming' && matchTime) {
    const today = new Date(), mt = new Date(matchTime)
    const isToday = mt.getFullYear() === today.getFullYear() && mt.getMonth() === today.getMonth() && mt.getDate() === today.getDate()
    label = isToday ? 'Starting soon' : 'Upcoming'
  }
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${s.bg} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot} ${isLive ? 'animate-pulse' : ''}`} />
      <span className={`text-[10px] font-bold ${s.text}`}>{label}</span>
      {isLive && elapsed > 0 && <span className={`text-[9px] font-medium ${s.text} opacity-70`}>{elapsed}'</span>}
    </div>
  )
}

function fmtFull(d)  { return new Date(d).toLocaleString('en-GB', { weekday:'short', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) }
function fmtCountdown(lockTime) {
  if (!lockTime) return null
  const diff = new Date(lockTime) - Date.now()
  if (diff <= 0) return 'Deadline passed'
  const d = Math.floor(diff / 86400000), h = Math.floor((diff % 86400000) / 3600000), m = Math.floor((diff % 3600000) / 60000)
  if (d > 0) return `${d}d ${h}h left`
  if (h > 0) return `${h}h ${m}m left`
  return `${m}m left`
}

// ── Form dropdown ──────────────────────────────────────────────────────────────
function FormDot({ result }) {
  const cfg = result === 'W' ? { bg:'bg-green-500',text:'text-white' } : result === 'D' ? { bg:'bg-gray-600',text:'text-gray-200' } : { bg:'bg-red-500',text:'text-white' }
  return <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${cfg.bg} ${cfg.text}`}>{result}</span>
}

function FormDropdown({ fixtureId, homeTeam, awayTeam, homeFlag, awayFlag }) {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const fetched = useRef(false)
  const toggle = () => {
    setOpen(o => !o)
    if (!fetched.current && fixtureId) { fetched.current = true; setLoading(true); getFixtureForm(fixtureId).then(r => setData(r.data)).catch(() => setData(null)).finally(() => setLoading(false)) }
  }
  return (
    <div className="border-t border-white/6">
      <button onClick={toggle} className="w-full flex items-center justify-between px-4 py-2 text-left hover:bg-white/3 transition-colors">
        <span className="text-[10px] text-gray-600 font-semibold tracking-wide uppercase">Recent form</span>
        <span className={`text-gray-700 text-[9px] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          {loading && <div className="flex items-center gap-2 text-gray-600 text-[10px]"><div className="w-3 h-3 border border-gray-700 border-t-indigo-400 rounded-full animate-spin" />Loading…</div>}
          {!loading && data && [{ logo:data.home_logo,name:homeTeam,flag:homeFlag,form:data.home_form },{ logo:data.away_logo,name:awayTeam,flag:awayFlag,form:data.away_form }].map((team,ti) => (
            <div key={ti} className="flex items-center gap-3">
              <div className="w-6 h-6 flex-shrink-0">{team.logo ? <img src={team.logo} alt="" className="w-full h-full object-contain" onError={e=>{e.target.style.display='none'}} /> : <span className="text-sm">{team.flag}</span>}</div>
              <span className="text-gray-400 text-[11px] font-semibold flex-1 truncate min-w-0">{team.name}</span>
              <div className="flex gap-1 flex-shrink-0">{team.form?.length ? team.form.map((m,i) => <FormDot key={i} result={m.result} />) : <span className="text-gray-700 text-[9px]">No data</span>}</div>
            </div>
          ))}
          {!loading && !data && <p className="text-gray-700 text-[10px]">Form data unavailable</p>}
        </div>
      )}
    </div>
  )
}

// ── Insights dropdown ──────────────────────────────────────────────────────────
function InsightsDropdown({ fixtureId, liveEv }) {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const fetchedRef = useRef(false)
  const prevElapsed = useRef(null)
  const doFetch = useCallback(() => {
    if (!fixtureId) return
    setLoading(true)
    getFixtureStats(fixtureId).then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [fixtureId])
  const toggle = () => { setOpen(o => { const next = !o; if (next && !fetchedRef.current) { fetchedRef.current = true; doFetch() } return next }) }
  useEffect(() => { const el = liveEv?.fixture_elapsed; if (open && el != null && el !== prevElapsed.current) { prevElapsed.current = el; doFetch() } }, [liveEv?.fixture_elapsed, open, doFetch])
  const st = liveEv?.fixture_status_short, elapsed = liveEv?.fixture_elapsed
  const isLive = LIVE_STATUSES.includes(st), isFinished = FINISHED_STATUSES.includes(st)
  const statusTag = isFinished ? 'FT' : isLive && elapsed ? `${elapsed}'` : null
  return (
    <div className="border-t border-white/6">
      <button onClick={toggle} className="w-full flex items-center justify-between px-4 py-2 text-left hover:bg-white/3 transition-colors">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-500 font-semibold tracking-wide uppercase">{isLive ? 'Live insights' : isFinished ? 'Match report' : 'Match insights'}</span>
          {isLive && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse flex-shrink-0" />}
        </div>
        <div className="flex items-center gap-1.5">
          {statusTag && <span className={`text-[9px] font-bold tabular-nums ${isLive ? 'text-blue-400' : 'text-gray-500'}`}>{statusTag}</span>}
          <span className={`text-gray-700 text-[9px] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▼</span>
        </div>
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-2">
          {loading && <div className="flex items-center gap-2 text-gray-600 text-[10px]"><div className="w-3 h-3 border border-gray-700 border-t-blue-400 rounded-full animate-spin" />Loading…</div>}
          {!loading && data && (() => {
            const allGoals = (data.events||[]).filter(e=>e.type==='Goal')
            const allCards = (data.events||[]).filter(e=>e.type==='Card')
            const gameEvents = [...allGoals,...allCards].filter(e=>e.elapsed!=null).sort((a,b)=>(a.elapsed??0)-(b.elapsed??0))
            const shootoutEvents = allGoals.filter(e=>e.elapsed==null)
            const stats = data.statistics||[]
            const [hStats,aStats] = stats.length>=2 ? [stats[0],stats[1]] : [null,null]
            const KEY_STATS = ['Ball Possession','Total Shots','Shots on Goal','Corner Kicks','Fouls']
            const statRows = hStats ? KEY_STATS.map(k=>({ label:k, h:hStats.stats.find(s=>s.type===k)?.value??'—', a:aStats?.stats.find(s=>s.type===k)?.value??'—' })).filter(r=>r.h!=='—'||r.a!=='—') : []
            if (!gameEvents.length && !shootoutEvents.length && !statRows.length) return <p className="text-gray-700 text-[10px]">No data yet</p>
            const renderEvent = (e,i) => {
              const detailLc = e.detail?.toLowerCase()??'', isMissedPen = detailLc.includes('missed'), isOwnGoal = detailLc.includes('own goal'), isPenGoal = e.type==='Goal'&&detailLc.includes('penalty')&&!isMissedPen
              const icon = e.type==='Goal' ? (isMissedPen?'✗':isOwnGoal?'⚽ OG':'⚽') : e.detail==='Yellow Card'?'🟨':e.detail==='Red Card'?'🟥':e.detail?.includes('Second')?'🟨🟥':'📋'
              return <div key={i} className="flex items-center gap-2 text-[11px]">
                {e.elapsed!=null ? <span className="text-gray-600 w-7 text-right font-mono flex-shrink-0">{e.elapsed}{e.extra?`+${e.extra}`:''}</span> : <span className="w-7 flex-shrink-0" />}
                <span className={`flex-shrink-0 text-xs ${isMissedPen?'text-red-400':''}`}>{icon}</span>
                <span className="text-gray-300 truncate flex-1 min-w-0">{e.player}{isPenGoal&&<span className="text-gray-500 text-[9px] ml-1">(pen)</span>}</span>
                <span className="text-gray-600 text-[9px] flex-shrink-0 truncate max-w-[60px]">{e.team?.split(' ').slice(-1)[0]}</span>
              </div>
            }
            return <>
              {gameEvents.length>0 && <div className="space-y-1">{gameEvents.map(renderEvent)}</div>}
              {shootoutEvents.length>0 && <div className="space-y-1"><div className="flex items-center gap-2 pt-1"><div className="flex-1 h-px bg-white/8" /><span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider flex-shrink-0">Penalty shootout</span><div className="flex-1 h-px bg-white/8" /></div>{shootoutEvents.map(renderEvent)}</div>}
              {statRows.length>0 && <div className="space-y-1 pt-2 border-t border-white/5"><div className="flex justify-between text-[9px] text-gray-600 pb-0.5"><span className="truncate max-w-[80px]">{hStats?.team?.split(' ').slice(-1)[0]}</span><span className="truncate max-w-[80px] text-right">{aStats?.team?.split(' ').slice(-1)[0]}</span></div>{statRows.map((r,i)=><div key={i} className="flex items-center gap-2 text-[10px]"><span className="text-gray-200 w-8 text-right font-semibold tabular-nums">{r.h}</span><span className="text-gray-600 flex-1 text-center text-[9px]">{r.label}</span><span className="text-gray-200 w-8 font-semibold tabular-nums">{r.a}</span></div>)}</div>}
            </>
          })()}
          {!loading && !data && <p className="text-gray-700 text-[10px]">Insights unavailable</p>}
        </div>
      )}
    </div>
  )
}

// ── League hero carousel ───────────────────────────────────────────────────────
function LeagueHeroCarousel({ leagues }) {
  const [idx, setIdx] = useState(0)
  const touchX = useRef(null)
  const go = i => setIdx(Math.max(0, Math.min(leagues.length - 1, i)))
  const onTouchStart = e => { touchX.current = e.touches[0].clientX }
  const onTouchEnd   = e => {
    if (touchX.current === null) return
    const dx = e.changedTouches[0].clientX - touchX.current
    if (dx < -40) go(idx + 1); else if (dx > 40) go(idx - 1)
    touchX.current = null
  }
  const l = leagues[idx] || leagues[0]
  if (!l) return null
  return (
    <div className="relative rounded-2xl overflow-hidden select-none" style={{ height: 160 }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {l.image_url ? <img src={l.image_url} alt={l.name} className="absolute inset-0 w-full h-full object-cover object-center" /> : <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-violet-900/60 to-slate-950" />}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
      <div className="absolute inset-x-0 bottom-0 p-4 flex items-end justify-between">
        <div className="min-w-0">
          <p className="text-white/45 text-[10px] font-bold uppercase tracking-widest mb-1">Private League</p>
          <p className="text-white font-black text-xl leading-tight truncate">{l.name}</p>
          <p className="text-white/55 text-[11px] mt-0.5">
            {l.my_position != null ? <><span className="text-white font-bold">#{l.my_position}</span> of {l.member_count} members</> : <>{l.member_count} members</>}
          </p>
        </div>
        <span className="text-4xl leading-none flex-shrink-0 ml-3 drop-shadow-lg">🏆</span>
      </div>
      {leagues.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 pb-0">
          {leagues.map((_, i) => <button key={i} onClick={() => go(i)} className={`rounded-full transition-all duration-200 ${i === idx ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/35'}`} />)}
        </div>
      )}
    </div>
  )
}

// ── VS matchup banner ──────────────────────────────────────────────────────────
function MatchupBanner({ rival, myCorrect, rivalCorrect, week, totalWeeks, isLocked, matchupStatus }) {
  const winning = myCorrect > rivalCorrect
  const drawing = myCorrect === rivalCorrect
  const settled = matchupStatus === 'SETTLED'
  const outlook = settled
    ? (winning ? '🏆 You won this week! +3 pts' : drawing ? '🤝 Draw — +1 pt each' : '😤 Lost — +0 pts')
    : isLocked
    ? (winning ? '↑ Winning' : drawing ? '— Drawing' : '↓ Behind')
    : null

  const outlookColor = winning ? 'text-green-400' : drawing ? 'text-gray-400' : 'text-red-400'
  const myPts = settled ? (winning ? 3 : drawing ? 1 : 0) : null
  const rivalPts = settled ? (winning ? 0 : drawing ? 1 : 3) : null

  return (
    <div className="rounded-2xl overflow-hidden border border-indigo-500/20 bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-950">
      <div className="px-4 py-3 flex items-center gap-3">
        {/* Me */}
        <div className="flex flex-col items-center gap-1 flex-1">
          <div className="w-9 h-9 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 text-sm font-black">Me</div>
          <span className="text-[10px] text-purple-300 font-bold">You</span>
          {isLocked && <p className={`text-2xl font-black tabular-nums leading-none ${winning ? 'text-green-400' : 'text-white'}`}>{myCorrect}</p>}
          {settled && myPts !== null && <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${myPts===3?'text-green-400 bg-green-500/15 border border-green-500/25':myPts===1?'text-gray-400 bg-gray-500/15 border border-gray-500/25':'text-red-400/70 bg-red-500/10 border border-red-500/20'}`}>{myPts===3?'W':myPts===1?'D':'L'}</span>}
        </div>

        {/* Center */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest">vs</p>
          <p className="text-indigo-400/60 text-[10px]">Week {week}</p>
          {outlook && <p className={`text-[10px] font-bold text-center ${outlookColor}`}>{outlook}</p>}
        </div>

        {/* Rival */}
        <div className="flex flex-col items-center gap-1 flex-1">
          {rival?.avatar_url
            ? <img src={rival.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover border border-white/10" />
            : <div className="w-9 h-9 rounded-full bg-white/8 border border-white/12 flex items-center justify-center text-gray-300 text-sm font-black">{(rival?.display_name||'R')[0].toUpperCase()}</div>}
          <span className="text-[10px] text-gray-400 font-semibold truncate max-w-[70px] text-center">{rival?.display_name || 'Rival'}</span>
          {isLocked && <p className={`text-2xl font-black tabular-nums leading-none ${!winning && !drawing ? 'text-green-400' : 'text-white'}`}>{rivalCorrect}</p>}
          {settled && rivalPts !== null && <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${rivalPts===3?'text-green-400 bg-green-500/15 border border-green-500/25':rivalPts===1?'text-gray-400 bg-gray-500/15 border border-gray-500/25':'text-red-400/70 bg-red-500/10 border border-red-500/20'}`}>{rivalPts===3?'W':rivalPts===1?'D':'L'}</span>}
        </div>
      </div>
    </div>
  )
}

// ── EventCard ─────────────────────────────────────────────────────────────────
function EventCard({ event, selectedOptionId, onSelect, isLocked, liveEv, showInsights }) {
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
      pickWon
        ? 'bg-green-950/30 border-green-500/50 shadow-[0_0_12px_rgba(34,197,94,0.12)]'
        : pickLost
          ? 'bg-red-950/20 border-red-500/30'
          : selectedOptionId
            ? 'bg-indigo-950/25 border-indigo-500/40'
            : 'bg-[#0d1117] border-white/8'
    }`}>
      {/* Card header */}
      <div className="w-full px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{typeInfo.icon}</span>
            <span className="text-[10px] text-gray-500 font-semibold tracking-wide uppercase">{typeInfo.label}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px]">{compIcon}</span>
            <span className="text-[10px] text-gray-600">{event.competition}</span>
            {selectedOptionId && (
              pickWon
                ? <span className="text-[10px] bg-green-900/60 text-green-300 border border-green-500/40 px-2 py-0.5 rounded-full ml-1 font-bold">✓ Correct</span>
                : pickLost
                  ? <span className="text-[10px] bg-red-900/40 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full ml-1 font-bold">✗ Wrong</span>
                  : <span className="text-[10px] bg-indigo-900/50 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full ml-1 font-semibold">✓ Picked</span>
            )}
          </div>
        </div>

        {isPlayerScore ? (
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center flex-shrink-0">
              {event.player_team_logo
                ? <img src={event.player_team_logo} alt="" className="w-9 h-9 object-contain" onError={e=>{e.target.style.display='none'}} />
                : <span className="text-xl">⭐</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-base leading-tight truncate text-white">{event.player_name || 'Player'}</p>
              {event.player_team && <p className="text-[11px] text-gray-500 mt-0.5 truncate">{getFlag(event.player_team)} {event.player_team}</p>}
            </div>
          </div>
        ) : (() => {
          const hasScore = liveEv?.home_goals != null && liveEv?.away_goals != null
          const isLiveMatch = hasScore && LIVE_STATUSES.includes(liveEv?.fixture_status_short)
          const isDoneMatch = hasScore && FINISHED_STATUSES.includes(liveEv?.fixture_status_short)
          const isPen = liveEv?.fixture_status_short === 'PEN'
          const ScoreBlock = () => (isLiveMatch || isDoneMatch) ? (
            <div className="flex flex-col items-center flex-shrink-0 min-w-[52px]">
              <span className={`font-black text-xl tabular-nums leading-none ${isLiveMatch ? 'text-green-400' : 'text-white'}`}>{liveEv.home_goals}–{liveEv.away_goals}</span>
              {isDoneMatch && <span className="text-[9px] text-gray-600 font-semibold uppercase tracking-wide mt-0.5">{isPen ? 'pens' : 'FT'}</span>}
              {isPen && liveEv.pen_home != null && <span className="text-[8px] text-gray-700 tabular-nums mt-0.5">({liveEv.pen_home}–{liveEv.pen_away})</span>}
            </div>
          ) : <span className="text-gray-700 text-xs font-semibold flex-shrink-0">vs</span>
          return (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                {event.fixture_home_logo && <img src={event.fixture_home_logo} alt="" className="w-5 h-5 object-contain flex-shrink-0" onError={e=>{e.target.style.display='none'}} />}
                <span className="font-bold text-sm leading-tight truncate text-white">{homeTeam}</span>
              </div>
              <ScoreBlock />
              <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                <span className="font-bold text-sm leading-tight truncate text-right text-white">{awayTeam}</span>
                {event.fixture_away_logo && <img src={event.fixture_away_logo} alt="" className="w-5 h-5 object-contain flex-shrink-0" onError={e=>{e.target.style.display='none'}} />}
              </div>
            </div>
          )
        })()}

        <p className="text-gray-600 text-[10px] mt-1">{fmtFull(event.match_time)}</p>
      </div>

      {/* Dropdowns */}
      {event.fixture_id && !isPlayerScore && (
        showInsights
          ? <InsightsDropdown fixtureId={event.fixture_id} liveEv={liveEv} />
          : <FormDropdown fixtureId={event.fixture_id} homeTeam={homeTeam} awayTeam={awayTeam} homeFlag={homeFlag} awayFlag={awayFlag} />
      )}

      {/* Options */}
      <div className="px-3 pb-3 grid gap-1.5">
        {[...event.options].sort((a, b) => {
          const rk = k => k?.result_key || k?.outcome || ''
          const ORDER = { HOME_WIN: 0, HOME_QUALIFIES: 0, DRAW: 1, AWAY_WIN: 2, AWAY_QUALIFIES: 2 }
          return (ORDER[rk(a)] ?? 3) - (ORDER[rk(b)] ?? 3)
        }).map(opt => {
          const isSelected = opt.id === selectedOptionId
          const won  = opt.result === 'WON'
          const lost = opt.result === 'LOST'
          const userPickedLost = event.options.some(o => o.id === selectedOptionId && o.result === 'LOST')
          const rk = opt.result_key || opt.outcome || ''
          const optFlag = (rk === 'HOME_WIN' || rk === 'HOME_QUALIFIES') ? homeFlag
            : (rk === 'AWAY_WIN' || rk === 'AWAY_QUALIFIES') ? awayFlag
            : ''
          const isDraw = rk === 'DRAW' || opt.label === 'Draw'
          const optTeam = (rk === 'HOME_WIN' || rk === 'HOME_QUALIFIES') ? homeTeam
            : (rk === 'AWAY_WIN' || rk === 'AWAY_QUALIFIES') ? awayTeam
            : null
          const optSubLabel = rk === 'HOME_WIN' ? 'Home win' : rk === 'AWAY_WIN' ? 'Away win'
            : (rk === 'HOME_QUALIFIES' || rk === 'AWAY_QUALIFIES') ? 'Qualifies' : null

          return (
            <button
              key={opt.id}
              onClick={() => { if (isLocked) return; onSelect(event.id, opt.id) }}
              disabled={isLocked}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                won  ? `bg-green-900/30 border border-green-500/40 ${userPickedLost ? 'text-green-600' : 'text-green-300'}` :
                lost ? `bg-red-900/10 border border-red-500/15 ${isSelected ? 'text-red-400' : 'text-red-400/60'}` :
                isSelected
                  ? 'bg-indigo-600 border border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-white/5 border border-white/8 text-gray-200 hover:bg-white/10 hover:border-white/20 active:scale-[0.98]'
              }`}
            >
              <span className="text-xl flex-shrink-0 leading-none">
                {isDraw ? (isSelected && lost ? '❌' : won && !userPickedLost ? '✅' : '') : (isSelected && lost ? '❌' : won && !userPickedLost ? '✅' : optFlag || '')}
              </span>
              <span className="flex-1 text-left font-semibold flex flex-col items-start gap-0.5">
                <span>
                  {optTeam || opt.label}
                  {!(won || lost) && optTeam && optSubLabel && <span className="text-xs font-normal ml-1 opacity-70">{optSubLabel}</span>}
                </span>
                {(won || lost) && (isSelected || won) && <span className="text-[10px] font-bold opacity-80">{isSelected ? 'Your choice' : 'Correct choice'}</span>}
              </span>
              {won  && <span className="text-green-400 font-bold">✓</span>}
              {lost && <span className="text-red-400/60">✗</span>}
              {!won && !lost && isSelected && <span className="text-indigo-200">✓</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Confirm modal ──────────────────────────────────────────────────────────────
function PicksConfirmModal({ picks, events, totalEvents, gw, submitting, err, onConfirm, onClose }) {
  const pickedEvents = events.filter(e => picks[e.id])
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={!submitting ? onClose : undefined} />
      <div className="relative w-full max-w-md bg-[#0d1117] border border-white/10 rounded-t-3xl">
        <div className="flex justify-center pt-3 pb-2"><div className="w-8 h-1 bg-white/15 rounded-full" /></div>
        <div className="px-5 pb-2">
          <h2 className="text-white font-black text-lg">Review your picks</h2>
          <p className="text-gray-500 text-xs mt-0.5">
            {pickedEvents.length}/{totalEvents} picks · {gw?.lock_time ? `Deadline: ${fmtFull(gw.lock_time)}` : 'Check deadline before confirming'}
          </p>
        </div>
        <div className="px-5 py-2 space-y-0 overflow-y-auto" style={{ maxHeight: '40vh' }}>
          {pickedEvents.map((ev, i) => {
            const opt = ev.options?.find(o => o.id === picks[ev.id])
            return (
              <div key={ev.id} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
                <span className="w-5 h-5 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-[10px] font-black flex-shrink-0">{i+1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-400 text-[11px] truncate">{ev.fixture_name || ev.player_name || 'Event'}</p>
                  <p className="text-white font-semibold text-sm truncate">{opt?.label}</p>
                </div>
              </div>
            )
          })}
        </div>
        {pickedEvents.length < totalEvents && (
          <div className="mx-5 mt-2 px-4 py-2.5 bg-amber-950/20 border border-amber-500/15 rounded-xl">
            <p className="text-amber-400 text-xs font-semibold">{totalEvents - pickedEvents.length} fixture{totalEvents - pickedEvents.length !== 1 ? 's' : ''} without a pick — you can still save a partial entry</p>
          </div>
        )}
        {err && <p className="text-red-400 text-xs px-5 mb-2">{err}</p>}
        <div className="px-5 pb-8 pt-3 space-y-2">
          <button onClick={onConfirm} disabled={submitting}
            className="w-full py-4 bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-black text-base rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50">
            {submitting
              ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</span>
              : '✅  Confirm & save picks'}
          </button>
          <button onClick={onClose} disabled={submitting} className="w-full py-3 text-gray-400 hover:text-white text-sm font-medium transition-colors disabled:opacity-40">Keep editing</button>
        </div>
      </div>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────────
// Map backend event options (which use `outcome` column) to EventCard format (which expects `result_key`)
// Also inject `result` (WON/LOST) from the user's pick_status for locked weeks
function mapEventsForDisplay(events, myPicksArr, isLocked) {
  const myPickMap = Object.fromEntries(myPicksArr.map(p => [p.event_id, p]))
  return events.map(ev => ({
    ...ev,
    options: (ev.options || []).map(opt => {
      const myPick = myPickMap[ev.id]
      const isMyPick = myPick?.event_option_id === opt.id
      return {
        ...opt,
        result_key: opt.outcome || opt.result_key || '',
        energy_cost: null,
        // inject won/lost result for locked weeks so EventCard shows green/red
        result: (isLocked && isMyPick)
          ? (myPick.pick_status === 'won' ? 'WON' : myPick.pick_status === 'lost' ? 'LOST' : null)
          : null,
      }
    }),
  }))
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MatchweekPage() {
  const navigate   = useNavigate()
  const [leagues,      setLeagues]      = useState([])
  const [selIdx,       setSelIdx]       = useState(0)
  const [data,         setData]         = useState(null)   // getLeagueMatchup response
  const [loading,      setLoading]      = useState(true)
  const [dataLoading,  setDataLoading]  = useState(false)
  const [picks,        setPicks]        = useState({})
  const [submitted,    setSubmitted]    = useState(false)
  const [showConfirm,  setShowConfirm]  = useState(false)
  const [submitting,   setSubmitting]   = useState(false)
  const [err,          setErr]          = useState('')
  const [liveData,     setLiveData]     = useState({})
  const liveIntervalRef = useRef(null)

  // Load leagues
  useEffect(() => {
    getMyLeagues()
      .then(r => setLeagues(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const activeLeagues = leagues.filter(l => ['active','open'].includes(l.status))
  const league = activeLeagues[selIdx] ?? activeLeagues[0]

  const loadData = useCallback(async (leagueId) => {
    if (!leagueId) return
    setDataLoading(true)
    setPicks({}); setSubmitted(false); setErr('')
    try {
      const r = await getLeagueMatchup(leagueId)
      setData(r.data)
      if (r.data?.my_picks?.length) {
        const existing = {}
        for (const p of r.data.my_picks) existing[p.event_id] = p.event_option_id
        setPicks(existing); setSubmitted(true)
      }
    } catch {}
    finally { setDataLoading(false) }
  }, [])

  useEffect(() => {
    if (league?.id) loadData(league.id)
    else { setData(null); setDataLoading(false) }
  }, [league?.id, loadData])

  // Live polling
  const gwId = data?.gameweek?.id
  const fetchLive = useCallback(() => {
    if (!gwId) return
    getGameweekLive(gwId)
      .then(r => { const byEventId = {}; for (const ev of r.data.events || []) byEventId[ev.event_id] = ev; setLiveData(byEventId) })
      .catch(() => {})
  }, [gwId])

  useEffect(() => {
    if (!gwId) return
    fetchLive()
    liveIntervalRef.current = setInterval(fetchLive, 45000)
    return () => clearInterval(liveIntervalRef.current)
  }, [gwId, fetchLive])

  // Derived state
  const matchup     = data?.matchup
  const gameweek    = data?.gameweek
  const rival       = data?.rival
  const rawEvents   = data?.events || []
  const myPicksArr  = data?.my_picks || []
  const rivalPicksArr = data?.rival_picks || []

  const isLocked = gameweek ? ['LOCKED','FINISHED','SETTLED'].includes(gameweek.status) : false
  const events   = useMemo(() => mapEventsForDisplay(rawEvents, myPicksArr, isLocked), [rawEvents, myPicksArr, isLocked])

  const pickCount   = Object.keys(picks).length
  const totalEvents = events.length
  const allPicked   = pickCount === totalEvents && totalEvents > 0

  const myCorrect    = myPicksArr.filter(p => p.pick_status === 'won').length
  const rivalCorrect = rivalPicksArr.filter(p => p.pick_status === 'won').length

  const liveTally = useMemo(() => {
    if (!isLocked || !myPicksArr.length) return null
    let won = 0, lost = 0
    for (const p of myPicksArr) {
      if (p.pick_status === 'won') won++
      else if (p.pick_status === 'lost') lost++
    }
    const pending = myPicksArr.length - won - lost
    return { won, lost, pending }
  }, [isLocked, myPicksArr])

  const handleSelect = (eventId, optionId) => {
    if (isLocked) return
    setPicks(prev => {
      const n = { ...prev }
      if (n[eventId] === optionId) delete n[eventId]; else n[eventId] = optionId
      return n
    })
    setSubmitted(false); setErr('')
  }

  const confirmPicks = useCallback(async () => {
    if (submitting || !league?.id) return
    const pickList = Object.entries(picks).map(([event_id, event_option_id]) => ({ event_id, event_option_id }))
    setSubmitting(true); setErr('')
    try {
      await submitLeaguePicks(league.id, pickList)
      setSubmitted(true)
      setShowConfirm(false)
      // Refresh data to get updated pick counts
      const r = await getLeagueMatchup(league.id)
      if (r.data) setData(r.data)
    } catch (e) {
      setErr(e.response?.data?.error || e.response?.data?.message || 'Failed to save picks — try again')
    } finally { setSubmitting(false) }
  }, [picks, league?.id, submitting])

  if (loading) return (
    <div className="min-h-screen bg-[#0a0d12] flex items-center justify-center"><Spinner size={32} /></div>
  )

  if (leagues.length === 0) return (
    <div className="min-h-screen bg-[#0a0d12] text-white flex flex-col items-center justify-center px-6 text-center gap-6">
      <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-4xl">🏟</div>
      <div>
        <p className="text-white font-black text-xl">Join a league to play</p>
        <p className="text-gray-500 text-sm mt-2 max-w-xs">You need to be in a private league to make weekly picks.</p>
      </div>
      <button onClick={() => navigate('/leagues')}
        className="px-6 py-3 rounded-xl font-bold text-white text-sm"
        style={{ background: 'linear-gradient(90deg,#6366f1,#4f46e5)' }}>
        Go to Leagues
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0d12] text-white">

      {/* Header area */}
      <div className="max-w-md mx-auto px-4 pt-safe-5 space-y-4">

        {/* League hero */}
        {activeLeagues.length > 0 && <LeagueHeroCarousel leagues={activeLeagues} />}

        {/* League selector chips */}
        {activeLeagues.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {activeLeagues.map((l, i) => (
              <button key={l.id} onClick={() => setSelIdx(i)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  i === selIdx ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/4 border-white/10 text-gray-400'
                }`}>
                {l.name}
              </button>
            ))}
          </div>
        )}

        {dataLoading && <div className="flex items-center justify-center py-10 gap-2 text-gray-600 text-sm"><div className="w-4 h-4 border border-gray-700 border-t-indigo-400 rounded-full animate-spin" />Loading gameweek…</div>}

        {!dataLoading && !data?.matchup && (
          <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-8 text-center">
            <p className="text-4xl mb-3">⏳</p>
            <p className="text-gray-400 font-medium">No active matchup</p>
            <p className="text-gray-600 text-sm mt-1">
              {league?.status === 'open'
                ? 'Waiting for the season to start. The admin will generate the calendar soon.'
                : 'The current week\'s matchup hasn\'t been set up yet.'}
            </p>
          </div>
        )}

        {!dataLoading && data?.matchup && matchup && (
          <>
            {/* VS banner */}
            <MatchupBanner
              rival={rival}
              myCorrect={myCorrect}
              rivalCorrect={rivalCorrect}
              week={matchup.league_week}
              totalWeeks={data.total_weeks}
              isLocked={isLocked}
              matchupStatus={matchup.status}
            />

            {/* Week info bar */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                {isLocked ? (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-widest text-yellow-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse inline-block" />
                    LOCKED · LIVE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-widest text-green-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                    PICKS OPEN{submitted ? ' · ✓ SAVED' : ''}
                  </span>
                )}
              </div>
              {gameweek?.lock_time && !isLocked && (
                <p className="text-gray-600 text-[11px]">Locks {fmtFull(gameweek.lock_time)}</p>
              )}
              {isLocked && gameweek?.lock_time && (
                <p className="text-gray-600 text-[11px]">Locked {fmtFull(gameweek.lock_time)}</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Sticky pick progress bar (open weeks only) */}
      {!dataLoading && data?.matchup && !isLocked && (
        <div className={`sticky top-0 z-30 backdrop-blur-md border-b transition-colors ${submitted ? 'bg-green-950/95 border-green-500/20' : 'bg-[#0a0d12]/95 border-white/8'}`}>
          <div className="max-w-md mx-auto px-4 py-3">
            {submitted ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-green-400 text-lg">✅</span>
                  <div>
                    <p className="text-green-300 font-bold text-sm leading-tight">Picks saved!</p>
                    {gameweek?.lock_time && <p className="text-green-700 text-[11px]">Editable until {fmtFull(gameweek.lock_time)}</p>}
                  </div>
                </div>
                <span className="text-green-800 text-[10px] text-right leading-tight">Tap any pick<br/>to update</span>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-xs">Picks</span>
                    <span className={`font-black text-sm tabular-nums ${allPicked ? 'text-green-400' : 'text-indigo-400'}`}>{pickCount}/{totalEvents}</span>
                    {allPicked && <span className="text-[10px] bg-green-900/30 text-green-400 border border-green-500/25 px-2 py-0.5 rounded-full font-semibold">Ready</span>}
                  </div>
                  <span className="text-gray-500 text-xs">{totalEvents - pickCount} to go</span>
                </div>
                <div className="flex gap-0.5 mb-2">
                  {Array.from({ length: totalEvents }, (_, i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < pickCount ? 'bg-indigo-500' : 'bg-white/10'}`} />
                  ))}
                </div>
                {pickCount > 0 ? (
                  <button onClick={() => { setErr(''); setShowConfirm(true) }}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all active:scale-[0.98]">
                    {allPicked ? `Save all ${totalEvents} picks →` : `Save ${pickCount} picks so far →`}
                  </button>
                ) : (
                  <p className="text-center text-gray-600 text-xs py-1">Tap an option below to make your picks</p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Events list */}
      <div className="max-w-md mx-auto px-4 pb-32 space-y-3 mt-3">
        {!dataLoading && data?.matchup && events.length > 0 && (
          <>
            {/* Locked tally */}
            {isLocked && liveTally && (
              <div className="rounded-2xl border px-4 py-3 bg-[#0d1117] border-white/8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1"><span className="text-green-400 font-black text-lg tabular-nums">{liveTally.won}</span><span className="text-green-600 text-xs">✓</span></div>
                    <div className="flex items-center gap-1"><span className="text-red-400 font-black text-lg tabular-nums">{liveTally.lost}</span><span className="text-red-600 text-xs">✗</span></div>
                    {liveTally.pending > 0 && <div className="flex items-center gap-1"><span className="text-gray-500 font-black text-lg tabular-nums">{liveTally.pending}</span><span className="text-gray-700 text-xs">⏳</span></div>}
                  </div>
                  <div className="text-right">
                    <p className="text-white font-black text-sm">vs rival: {rivalCorrect}</p>
                    <p className="text-gray-600 text-[10px]">{liveTally.pending > 0 ? 'provisional' : 'final'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Lock banner */}
            {isLocked && (
              <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-yellow-950/25 border border-yellow-500/30">
                <span className="text-xl mt-0.5">🔒</span>
                <div>
                  <p className="font-bold text-sm text-yellow-300">Picks locked — matches are live</p>
                  <p className="text-yellow-600 text-xs mt-0.5">Sit back and watch your predictions play out.</p>
                </div>
              </div>
            )}

            {/* Deadline banner for open weeks */}
            {!isLocked && !submitted && gameweek?.lock_time && (() => {
              const countdown = fmtCountdown(gameweek.lock_time)
              const diff = new Date(gameweek.lock_time) - Date.now()
              const isUrgent = diff > 0 && diff < 24 * 3600000
              return (
                <div className={`flex items-start gap-3 px-4 py-3.5 rounded-2xl border ${isUrgent ? 'bg-red-950/25 border-red-500/30' : 'bg-white/4 border-white/8'}`}>
                  <span className="text-xl mt-0.5">{isUrgent ? '⚠️' : '⏰'}</span>
                  <div className="flex-1">
                    <p className={`font-bold text-sm ${isUrgent ? 'text-red-300' : 'text-white'}`}>Pick deadline · {fmtFull(gameweek.lock_time)}</p>
                    <p className={`text-xs mt-0.5 ${isUrgent ? 'text-red-400' : 'text-gray-500'}`}>{countdown} · Miss this and you get 0 pts this matchup</p>
                  </div>
                </div>
              )
            })()}

            {/* Events */}
            <p className="text-gray-600 text-[11px] font-medium tracking-wider uppercase px-1">
              {isLocked ? 'Your picks' : `${totalEvents} fixtures · ${pickCount}/${totalEvents} picked`}
            </p>

            {sortWithLiveFirst(events, liveData).map(ev => {
              const liveEvData = liveData[ev.id]
              const isFixtureLive = liveEvData && LIVE_STATUSES.includes(liveEvData.fixture_status_short)
              const liveStatus = picks[ev.id] ? computePickLiveStatus(ev, picks[ev.id], liveEvData) : null

              return (
                <div key={ev.id} className="space-y-0 relative">
                  {isFixtureLive && (
                    <div className="absolute -inset-[2px] rounded-[18px] bg-gradient-to-r from-green-500/0 via-green-400/30 to-green-500/0 animate-pulse pointer-events-none z-0" />
                  )}
                  <div className={`relative z-10 space-y-0 rounded-2xl overflow-hidden ${isFixtureLive ? 'ring-1 ring-green-500/40' : ''}`}>
                    {isFixtureLive && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-green-950/60 border-b border-green-500/20">
                        <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" /></span>
                        <span className="text-green-400 font-black text-[11px] tracking-widest uppercase">
                          {liveEvData.fixture_status_short === 'P' ? 'Penalties' : liveEvData.fixture_status_short === 'ET' || liveEvData.fixture_status_short === 'BT' ? 'Extra Time' : liveEvData.fixture_status_short === 'HT' ? 'Half Time' : 'Live'}
                        </span>
                        {liveEvData.fixture_elapsed > 0 && !['HT','BT','P'].includes(liveEvData.fixture_status_short) && (
                          <span className="text-green-500/70 font-bold text-[11px]">{liveEvData.fixture_elapsed}'</span>
                        )}
                        {liveStatus && picks[ev.id] && (() => {
                          const PICK_STATUS = { live_winning:'Favorable', live_neutral:'Neutral', unlikely:'At Risk', likely:'Very likely', won:'Won', lost:'Lost' }
                          const PICK_COLOR = { live_winning:'text-blue-400', live_neutral:'text-blue-300/60', unlikely:'text-orange-400', likely:'text-purple-400', won:'text-green-400', lost:'text-red-400' }
                          const label = PICK_STATUS[liveStatus]
                          return label ? <><span className="text-green-800 text-[11px] font-bold">·</span><span className={`text-[10px] font-semibold ${PICK_COLOR[liveStatus]}`}>{label}</span></> : null
                        })()}
                      </div>
                    )}
                    {!isFixtureLive && liveStatus && picks[ev.id] && (
                      <div className="flex items-center px-1 pb-1">
                        <LivePickBadge status={liveStatus} elapsed={liveEvData?.fixture_elapsed} matchTime={ev.match_time} />
                      </div>
                    )}
                    <EventCard
                      event={ev}
                      selectedOptionId={picks[ev.id] ?? null}
                      onSelect={handleSelect}
                      isLocked={isLocked}
                      liveEv={liveEvData}
                      showInsights={isLocked}
                    />
                  </div>
                </div>
              )
            })}

            {myPicksArr.length === 0 && isLocked && (
              <div className="bg-orange-900/15 border border-orange-500/25 rounded-2xl p-5 text-center">
                <p className="text-3xl mb-2">⏰</p>
                <p className="text-orange-300 font-semibold text-sm">Too late for this gameweek</p>
                <p className="text-gray-500 text-xs mt-1">The pick window has closed — +0 pts this matchup.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirm modal */}
      {showConfirm && !isLocked && (
        <PicksConfirmModal
          picks={picks}
          events={events}
          totalEvents={totalEvents}
          gw={gameweek}
          submitting={submitting}
          err={err}
          onConfirm={confirmPicks}
          onClose={() => { if (!submitting) setShowConfirm(false) }}
        />
      )}
    </div>
  )
}
