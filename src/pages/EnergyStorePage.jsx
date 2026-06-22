import { useState, useEffect, useCallback } from 'react'
import { getEnergyPacks, purchaseEnergyPack } from '../api/glory'
import BottomNav from '../components/layout/BottomNav'

const ENERGY_BUDGET = 30

// Themed visual designs for pack cards — cycles by index
const PACK_THEMES = [
  {
    // Electric Blue — Spark
    bg: 'from-blue-950 via-cyan-900/60 to-blue-950',
    glow: 'shadow-[0_0_40px_-8px_rgba(56,189,248,0.5)]',
    border: 'border-cyan-500/30',
    accent: 'text-cyan-300',
    badge: 'bg-cyan-900/60 border-cyan-500/30 text-cyan-300',
    visual: (
      <div className="relative w-full h-full flex items-center justify-center select-none">
        {/* Field lines */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white -translate-x-1/2" />
          <div className="absolute left-1/2 top-1/2 w-16 h-16 rounded-full border border-white -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="relative flex flex-col items-center gap-1">
          <span className="text-5xl drop-shadow-[0_0_12px_rgba(56,189,248,0.9)]">⚡</span>
          <span className="text-2xl -mt-2">⚽</span>
        </div>
        {/* Spark lines */}
        <div className="absolute top-3 right-6 text-cyan-400/50 text-lg font-black rotate-12">⚡</div>
        <div className="absolute bottom-4 left-5 text-cyan-400/30 text-sm rotate-[-20deg]">⚡</div>
      </div>
    ),
  },
  {
    // Purple Gold — Surge
    bg: 'from-purple-950 via-violet-900/60 to-indigo-950',
    glow: 'shadow-[0_0_40px_-8px_rgba(168,85,247,0.5)]',
    border: 'border-purple-500/30',
    accent: 'text-purple-300',
    badge: 'bg-purple-900/60 border-purple-500/30 text-purple-300',
    visual: (
      <div className="relative w-full h-full flex items-center justify-center select-none">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white -translate-x-1/2" />
          <div className="absolute left-1/2 top-1/2 w-16 h-16 rounded-full border border-white -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="relative flex flex-col items-center">
          <span className="text-3xl">⚽</span>
          <span className="text-4xl -mt-1 drop-shadow-[0_0_14px_rgba(168,85,247,0.9)]">⚡</span>
        </div>
        <div className="absolute top-2 left-6 text-purple-400/50 text-lg rotate-[-15deg]">✦</div>
        <div className="absolute bottom-3 right-5 text-yellow-400/50 text-sm">✦</div>
        <div className="absolute top-4 right-4 text-yellow-400/40 text-xs">⭐</div>
      </div>
    ),
  },
  {
    // Fire Orange — Overdrive
    bg: 'from-orange-950 via-red-900/60 to-yellow-950',
    glow: 'shadow-[0_0_40px_-8px_rgba(251,146,60,0.5)]',
    border: 'border-orange-500/30',
    accent: 'text-orange-300',
    badge: 'bg-orange-900/60 border-orange-500/30 text-orange-300',
    visual: (
      <div className="relative w-full h-full flex items-center justify-center select-none">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white -translate-x-1/2" />
          <div className="absolute left-1/2 top-1/2 w-16 h-16 rounded-full border border-white -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="relative flex items-center gap-1">
          <span className="text-4xl drop-shadow-[0_0_14px_rgba(251,146,60,0.9)]">⚡</span>
          <span className="text-3xl">⚽</span>
          <span className="text-4xl drop-shadow-[0_0_14px_rgba(251,146,60,0.9)]">⚡</span>
        </div>
        <div className="absolute top-2 right-4 text-red-400/60 text-xl">🔥</div>
        <div className="absolute bottom-2 left-4 text-orange-400/40 text-sm">🔥</div>
      </div>
    ),
  },
  {
    // Emerald Green — Champion
    bg: 'from-emerald-950 via-green-900/60 to-teal-950',
    glow: 'shadow-[0_0_40px_-8px_rgba(52,211,153,0.5)]',
    border: 'border-emerald-500/30',
    accent: 'text-emerald-300',
    badge: 'bg-emerald-900/60 border-emerald-500/30 text-emerald-300',
    visual: (
      <div className="relative w-full h-full flex items-center justify-center select-none">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white -translate-x-1/2" />
          <div className="absolute left-1/2 top-1/2 w-16 h-16 rounded-full border border-white -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="relative flex flex-col items-center gap-0.5">
          <span className="text-2xl">🏆</span>
          <span className="text-4xl drop-shadow-[0_0_16px_rgba(52,211,153,0.9)]">⚡</span>
          <span className="text-xl -mt-1">⚽</span>
        </div>
        <div className="absolute top-3 left-5 text-emerald-400/50 text-sm">⭐</div>
        <div className="absolute bottom-3 right-5 text-yellow-400/40 text-sm">⭐</div>
      </div>
    ),
  },
]

function PackCard({ pack, idx, onPurchase, purchasing }) {
  const theme = PACK_THEMES[idx % PACK_THEMES.length]
  const originalPrice = pack.discount_pct > 0
    ? (parseFloat(pack.price_euros) / (1 - pack.discount_pct / 100)).toFixed(2)
    : null
  const isBuying = purchasing === pack.id

  return (
    <div className={`relative rounded-2xl border overflow-hidden transition-all hover:scale-[1.01] ${theme.border} ${theme.glow} bg-gradient-to-br ${theme.bg}`}>
      {pack.discount_pct > 0 && (
        <div className="absolute top-3 right-3 z-10 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full tracking-wide">
          -{pack.discount_pct}% OFF
        </div>
      )}

      {/* Visual hero */}
      <div className="h-36 relative overflow-hidden">
        {pack.image_url
          ? <img src={pack.image_url} alt={pack.name} className="w-full h-full object-cover" />
          : theme.visual}
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3">
        <div>
          <p className="text-white font-bold text-sm leading-tight">{pack.name}</p>
          {pack.description && (
            <p className="text-gray-400 text-xs mt-1 leading-relaxed">{pack.description}</p>
          )}
        </div>

        {/* Energy pill */}
        <div className={`inline-flex items-center gap-2 self-start rounded-xl px-3 py-1.5 border text-sm font-black ${theme.badge}`}>
          <span>⚡</span>
          <span>+{pack.energy_amount} energy</span>
        </div>

        {/* Price row + purchase */}
        <div className="flex items-center justify-between pt-1 border-t border-white/8">
          <div>
            {originalPrice && (
              <p className="text-gray-600 text-xs line-through leading-none">€{originalPrice}</p>
            )}
            <p className="text-white font-black text-2xl leading-tight">€{parseFloat(pack.price_euros).toFixed(2)}</p>
          </div>
          <button
            onClick={() => onPurchase(pack)}
            disabled={isBuying}
            className={`flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed text-white ${
              isBuying ? 'bg-white/10' : 'bg-indigo-600 hover:bg-indigo-500'
            }`}
          >
            {isBuying ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Purchasing…
              </>
            ) : 'Purchase'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SuccessToast({ pack, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-green-900/95 border border-green-500/40 backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl">
      <span className="text-2xl">⚡</span>
      <div>
        <p className="text-green-200 font-bold text-sm">+{pack.energy_amount} energy added!</p>
        <p className="text-green-400 text-xs">{pack.name} purchased</p>
      </div>
      <button onClick={onClose} className="text-green-600 hover:text-green-300 ml-2 text-lg leading-none">×</button>
    </div>
  )
}

export default function EnergyStorePage() {
  const [packs, setPacks]           = useState([])
  const [walletBalance, setWalletBalance] = useState(0)
  const [loading, setLoading]       = useState(true)
  const [purchasing, setPurchasing] = useState(null)
  const [successPack, setSuccessPack] = useState(null)

  const load = useCallback(async () => {
    try {
      const res = await getEnergyPacks()
      const d = res.data
      setPacks(d.packs ?? [])
      setWalletBalance(d.wallet_balance ?? 0)
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function handlePurchase(pack) {
    setPurchasing(pack.id)
    try {
      const res = await purchaseEnergyPack(pack.id)
      setWalletBalance(res.data?.new_balance ?? walletBalance + pack.energy_amount)
      setSuccessPack(pack)
    } catch {}
    finally { setPurchasing(null) }
  }

  const totalEnergy = ENERGY_BUDGET + walletBalance

  return (
    <div className="min-h-screen bg-[#0a0d12] text-white">
      {successPack && (
        <SuccessToast pack={successPack} onClose={() => setSuccessPack(null)} />
      )}

      <div className="max-w-2xl mx-auto px-4 pt-12 pb-28">

        {/* Header */}
        <div className="mb-6">
          <p className="text-indigo-400 text-[13px] font-bold tracking-wide uppercase">6 to Glory</p>
          <h1 className="text-white font-black text-2xl mt-0.5">Energy Store</h1>
          <p className="text-gray-500 text-sm mt-1">Top up your weekly energy to unlock more picks</p>
        </div>

        {/* Wallet card */}
        <div className="rounded-2xl bg-gradient-to-br from-indigo-950/80 to-purple-950/60 border border-indigo-500/20 p-5 mb-8 shadow-[0_0_30px_-10px_rgba(99,102,241,0.4)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-widest font-semibold">Total energy this week</p>
              <div className="flex items-end gap-2 mt-1">
                <span className="text-yellow-400 font-black text-4xl leading-none">{totalEnergy}</span>
                <span className="text-gray-500 text-sm mb-0.5">⚡ available</span>
              </div>
              {walletBalance > 0 && (
                <p className="text-xs text-indigo-400 mt-1.5">{ENERGY_BUDGET} base + <span className="text-yellow-400 font-bold">+{walletBalance} from packs</span></p>
              )}
              {walletBalance === 0 && (
                <p className="text-xs text-gray-600 mt-1.5">{ENERGY_BUDGET} base energy — purchase a pack to boost it</p>
              )}
            </div>
            <div className="w-14 h-14 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-3xl flex-shrink-0">
              ⚡
            </div>
          </div>
        </div>

        {/* Packs grid */}
        <p className="text-gray-600 text-xs uppercase tracking-widest font-semibold mb-4">Available packs</p>

        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-64 bg-white/4 border border-white/8 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : packs.length === 0 ? (
          <div className="text-center py-20 bg-white/3 border border-white/8 rounded-2xl">
            <p className="text-4xl mb-3">⚡</p>
            <p className="text-gray-400 font-semibold">No packs available yet</p>
            <p className="text-gray-600 text-sm mt-1">Check back soon</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {packs.map((pack, idx) => (
              <PackCard
                key={pack.id}
                pack={pack}
                idx={idx}
                onPurchase={handlePurchase}
                purchasing={purchasing}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
