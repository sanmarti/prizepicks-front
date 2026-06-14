import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getEnergy, buyEnergy } from '../api/energy'
import { useEnergyStore } from '../store/energyStore'
import { useAuthStore } from '../store/authStore'
import PackCard from '../components/energy/PackCard'
import BottomNav from '../components/layout/BottomNav'
import Toast from '../components/ui/Toast'
import Avatar from '../components/ui/Avatar'

const PACKS = [
  { id: 'starter', units: 4,  price: '€3.99' },
  { id: 'value',   units: 10, price: '€7.99' },
  { id: 'pro',     units: 20, price: '€14.99' },
]

const HOW_IT_WORKS = [
  'Energy units can only be used when selecting event outcomes',
  'Using energy discounts lowers the cost and slightly improves your odds',
  'Maximum 2 energy units can be applied to a single pick',
  'Maximum 4 energy units can be used in one matchup',
  'Win a matchup and earn +1 energy unit',
]

export default function EnergyShopPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { balance, setBalance, addBalance } = useEnergyStore()
  const [toast, setToast] = useState(null)

  useEffect(() => {
    getEnergy()
      .then(({ data }) => setBalance(data.balance ?? 7))
      .catch(() => setBalance(7))
  }, [setBalance])

  async function handleBuy(pack) {
    try {
      await buyEnergy(pack.id)
      addBalance(pack.units)
      setToast({ message: `+${pack.units} energy units added!`, type: 'success' })
    } catch {
      setToast({ message: 'Purchase failed. Try again.', type: 'error' })
    }
  }

  return (
    <div className="min-h-dvh pb-24" style={{ background: 'var(--bg-primary)' }}>
      <div className="px-4 pt-6">
        {/* Back */}
        <button onClick={() => navigate(-1)} className="text-sm font-mono mb-4" style={{ color: 'var(--text-secondary)' }}>
          ← Back
        </button>

        {/* User header */}
        <div
          className="rounded-2xl p-4 mb-6"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface2)' }}
        >
          <div className="flex items-center gap-3">
            <Avatar name={user?.name ?? 'U'} size={44} />
            <div>
              <h2 className="font-syne font-700 text-base" style={{ color: 'var(--text-primary)' }}>
                {user?.name ?? 'Player'}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-xl font-500" style={{ color: 'var(--accent-green)' }}>
                  ⚡ {balance}
                </span>
                <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                  Energy Units
                </span>
              </div>
              <p className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Use in leagues only
              </p>
            </div>
          </div>
          <div
            className="mt-3 pt-3 text-xs font-mono"
            style={{ borderTop: '1px solid var(--bg-surface2)', color: 'var(--accent-green)' }}
          >
            ✓ Earn 1 energy unit for every matchup win
          </div>
        </div>

        {/* Packs */}
        <h2 className="font-syne font-700 text-base mb-3" style={{ color: 'var(--text-primary)' }}>
          Energy Packs
        </h2>
        <div className="grid grid-cols-1 gap-3 mb-6">
          {PACKS.map((pack) => (
            <PackCard key={pack.id} pack={pack} onBuy={handleBuy} />
          ))}
        </div>

        {/* How it works */}
        <div
          className="rounded-2xl p-4 mb-4"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface2)' }}
        >
          <h3
            className="font-mono text-xs tracking-widest mb-3"
            style={{ color: 'var(--text-muted)' }}
          >
            HOW ENERGY WORKS
          </h3>
          <div className="flex flex-col gap-2">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--accent-green)', flexShrink: 0 }}>+</span>
                <span>{item}</span>
              </div>
            ))}
          </div>

          {/* Example */}
          <div
            className="mt-4 pt-3 text-xs font-mono"
            style={{ borderTop: '1px solid var(--bg-surface2)', color: 'var(--text-muted)' }}
          >
            <p className="mb-1" style={{ color: 'var(--text-secondary)' }}>Example:</p>
            <p>Mbappé to Score · Base cost <span style={{ color: 'var(--accent-green)' }}>8⚡</span></p>
            <p>With 1 unit: <span style={{ color: 'var(--accent-green)' }}>7⚡</span></p>
            <p>With 2 units: <span style={{ color: 'var(--accent-green)' }}>6⚡</span></p>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
      <BottomNav />
    </div>
  )
}
