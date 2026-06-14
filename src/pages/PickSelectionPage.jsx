import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPicks, submitPicks } from '../api/picks'
import { useEnergyStore } from '../store/energyStore'
import { useCountdown } from '../hooks/useCountdown'
import EnergyBar from '../components/picks/EnergyBar'
import EventCard from '../components/picks/EventCard'
import LockButton from '../components/picks/LockButton'
import PickDetailModal from '../components/picks/PickDetailModal'
import Avatar from '../components/ui/Avatar'
import Toast from '../components/ui/Toast'

const LOCK_AT = new Date(Date.now() + 8100000).toISOString()

const MOCK_EVENTS = Array.from({ length: 12 }, (_, i) => ({
  id: `e${i + 1}`,
  category: ['match', 'goals', 'player', 'cleansheet'][i % 4],
  type: ['Match Result', 'Total Goals', 'Player Score', 'Clean Sheet'][i % 4],
  fixture: ['Real Madrid vs Villarreal', 'Arsenal vs Chelsea', 'Man City vs Liverpool', 'PSG vs Monaco'][i % 4],
  homeTeam: ['Real Madrid', 'Arsenal', 'Man City', 'PSG'][i % 4],
  awayTeam: ['Villarreal', 'Chelsea', 'Liverpool', 'Monaco'][i % 4],
  competition: ['LALIGA', 'EPL', 'EPL', 'SERIEA'][i % 4],
  description: 'Predict the outcome of this match.',
  options: [
    { id: `${i}-1`, label: '1', cost: 4 },
    { id: `${i}-X`, label: 'X', cost: 4 },
    { id: `${i}-2`, label: '2', cost: 5 },
  ],
}))

const ENERGY_TOTAL = 30
const PICKS_REQUIRED = 6
const TOKENS = 1

export default function PickSelectionPage() {
  const { gameweekId } = useParams()
  const navigate = useNavigate()
  const countdown = useCountdown(LOCK_AT)
  const { balance } = useEnergyStore()

  const [events, setEvents] = useState([])
  const [selections, setSelections] = useState({})
  const [energySpent, setEnergySpent] = useState(0)
  const [modalEvent, setModalEvent] = useState(null)
  const [toast, setToast] = useState(null)
  const [locking, setLocking] = useState(false)

  useEffect(() => {
    getPicks(gameweekId)
      .then(({ data }) => setEvents(data.events ?? MOCK_EVENTS))
      .catch(() => setEvents(MOCK_EVENTS))
  }, [gameweekId])

  const energyLeft = ENERGY_TOTAL - energySpent
  const picksSelected = Object.keys(selections).length

  function handleOptionClick(eventId, opt) {
    const prev = selections[eventId]
    if (prev?.id === opt.id) {
      setSelections((s) => { const n = { ...s }; delete n[eventId]; return n })
      setEnergySpent((e) => e - prev.cost)
    } else {
      const cost = TOKENS > 0 && opt.cost > 1 ? opt.cost - 1 : opt.cost
      if (prev) setEnergySpent((e) => e - prev.cost + cost)
      else setEnergySpent((e) => e + cost)
      setSelections((s) => ({ ...s, [eventId]: { ...opt, cost } }))
    }
    setModalEvent(null)
  }

  async function handleLock() {
    setLocking(true)
    const picks = Object.entries(selections).map(([eventId, opt]) => ({
      eventId,
      optionId: opt.id,
      energyCost: opt.cost,
    }))
    try {
      await submitPicks({ gameweekId, picks })
      setToast({ message: '🔒 Picks locked!', type: 'success' })
      setTimeout(() => navigate('/'), 1500)
    } catch {
      setToast({ message: 'Failed to submit picks', type: 'error' })
    } finally {
      setLocking(false)
    }
  }

  const needsEnergy = events.some((ev) => {
    if (selections[ev.id]) return false
    return ev.options?.every((o) => energyLeft < o.cost)
  })

  return (
    <div className="min-h-dvh pb-40" style={{ background: 'var(--bg-primary)' }}>
      {/* TopBar */}
      <header
        className="sticky top-0 z-30 px-4 py-3"
        style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--bg-surface2)' }}
      >
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => navigate(-1)} className="text-lg" style={{ color: 'var(--text-secondary)' }}>←</button>
          <div className="flex flex-col items-center">
            <span className="font-syne font-700 text-sm" style={{ color: 'var(--text-primary)' }}>
              WEEK {gameweekId ?? 12}
            </span>
            <span className="text-[10px] font-mono" style={{ color: '#fb923c' }}>
              🔒 Locks in {countdown}
            </span>
          </div>
          <button
            className="text-xs font-mono px-2 py-1 rounded-lg"
            style={{ background: 'var(--bg-surface2)', color: 'var(--text-secondary)' }}
          >
            ⚡ {energyLeft}
          </button>
        </div>

        {/* Matchup mini */}
        <div className="flex items-center justify-center gap-4 py-2 rounded-xl" style={{ background: 'var(--bg-surface)' }}>
          <div className="flex items-center gap-2">
            <Avatar name="Joan" size={28} />
            <span className="text-xs font-syne font-500" style={{ color: 'var(--text-primary)' }}>Joan</span>
            <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>8-2</span>
          </div>
          <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>vs</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>6-4</span>
            <span className="text-xs font-syne font-500" style={{ color: 'var(--text-primary)' }}>Mike</span>
            <Avatar name="Mike" size={28} />
          </div>
        </div>
      </header>

      <div className="px-4 pt-3">
        {/* Energy bar */}
        <EnergyBar
          spent={energySpent}
          total={ENERGY_TOTAL}
          picksSelected={picksSelected}
          picksTotal={PICKS_REQUIRED}
        />

        {/* Tokens row */}
        <div className="flex items-center justify-between py-2 px-1 my-2">
          <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
            DISCOUNT TOKENS 🔮 {TOKENS}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
              ENERGY UNITS ⚡ {energyLeft}
            </span>
            <button
              className="text-xs font-mono px-2 py-0.5 rounded-lg"
              style={{ background: 'var(--accent-purple-dim)', color: 'var(--accent-purple)' }}
              onClick={() => navigate('/energy')}
            >
              [+]
            </button>
          </div>
        </div>

        {/* Events */}
        {events.map((ev, idx) => (
          <EventCard
            key={ev.id}
            event={ev}
            index={idx + 1}
            selectedOption={selections[ev.id]?.id}
            energyLeft={energyLeft}
            tokens={TOKENS}
            onOptionClick={(eventId, opt) => {
              setModalEvent(ev)
            }}
          />
        ))}

        {/* Energy upsell banner */}
        {needsEnergy && (
          <div
            className="rounded-xl p-3 mb-4 flex flex-col gap-2"
            style={{ background: 'var(--bg-surface)', border: '1px solid rgba(251,146,60,0.3)' }}
          >
            <p className="text-xs font-mono text-center" style={{ color: '#fb923c' }}>
              NEED MORE ENERGY TO LOCK THIS PICK?
            </p>
            <div className="flex gap-2">
              <button
                className="flex-1 py-2 rounded-xl text-xs font-syne font-700 transition-all hover:brightness-110"
                style={{ background: 'var(--accent-purple)', color: '#fff' }}
                onClick={() => navigate('/energy')}
              >
                +4 ENERGY ⚡ €3.99
              </button>
              <button
                className="flex-1 py-2 rounded-xl text-xs font-syne font-700 transition-all hover:brightness-110"
                style={{ background: 'var(--accent-green)', color: '#000' }}
                onClick={() => navigate('/energy')}
              >
                MOST POPULAR: +10 ⚡ €7.99
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pick detail modal */}
      <PickDetailModal
        open={!!modalEvent}
        onClose={() => setModalEvent(null)}
        event={modalEvent}
        selectedOption={modalEvent ? selections[modalEvent.id]?.id : null}
        onSelect={(opt) => modalEvent && handleOptionClick(modalEvent.id, opt)}
        tokens={TOKENS}
      />

      {/* Lock button */}
      <LockButton
        energySpent={energySpent}
        energyTotal={ENERGY_TOTAL}
        picksSelected={picksSelected}
        picksRequired={PICKS_REQUIRED}
        onLock={handleLock}
        loading={locking}
      />

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  )
}
