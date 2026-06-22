import { useState, useEffect, useCallback } from 'react'
import { getEnergyPacks, purchaseEnergyPack } from '../api/glory'

const ENERGY_BUDGET = 30

function PackCard({ pack, walletBalance, onPurchase, purchasing }) {
  const originalPrice = pack.discount_pct > 0
    ? (parseFloat(pack.price_euros) / (1 - pack.discount_pct / 100)).toFixed(2)
    : null

  return (
    <div className="relative bg-white/4 border border-white/8 rounded-2xl overflow-hidden">
      {pack.discount_pct > 0 && (
        <div className="absolute top-3 right-3 z-10 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
          -{pack.discount_pct}%
        </div>
      )}

      {/* Hero */}
      <div className="h-28 bg-gradient-to-br from-yellow-950/60 to-amber-900/30 flex items-center justify-center overflow-hidden">
        {pack.image_url
          ? <img src={pack.image_url} alt={pack.name} className="w-full h-full object-cover" />
          : <span className="text-5xl drop-shadow-lg">⚡</span>}
      </div>

      <div className="p-4 flex flex-col gap-3">
        <div>
          <p className="text-white font-bold text-sm">{pack.name}</p>
          {pack.description && (
            <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{pack.description}</p>
          )}
        </div>

        {/* Energy amount */}
        <div className="flex items-center gap-2 bg-yellow-900/20 border border-yellow-500/20 rounded-xl px-3 py-2">
          <span className="text-yellow-400 text-lg">⚡</span>
          <span className="text-yellow-300 font-black text-xl">+{pack.energy_amount}</span>
          <span className="text-yellow-600 text-xs ml-auto">extra energy</span>
        </div>

        {/* Price + buy */}
        <div className="flex items-center justify-between">
          <div>
            {originalPrice && (
              <p className="text-gray-600 text-xs line-through">€{originalPrice}</p>
            )}
            <p className="text-green-400 font-black text-xl">€{parseFloat(pack.price_euros).toFixed(2)}</p>
          </div>
          <button
            onClick={() => onPurchase(pack)}
            disabled={purchasing === pack.id}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-all active:scale-95"
          >
            {purchasing === pack.id ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Buying…
              </>
            ) : 'Buy'}
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
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-green-900/90 border border-green-500/40 backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
      <span className="text-2xl">⚡</span>
      <div>
        <p className="text-green-200 font-bold text-sm">+{pack.energy_amount} energy added!</p>
        <p className="text-green-400 text-xs">{pack.name} purchased</p>
      </div>
      <button onClick={onClose} className="text-green-600 hover:text-green-300 ml-2 text-lg">×</button>
    </div>
  )
}

export default function EnergyStorePage() {
  const [packs, setPacks]         = useState([])
  const [walletBalance, setWalletBalance] = useState(0)
  const [loading, setLoading]     = useState(true)
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
      const d = res.data
      setWalletBalance(d.new_balance ?? walletBalance + pack.energy_amount)
      setSuccessPack(pack)
    } catch {}
    finally { setPurchasing(null) }
  }

  const totalEnergy = ENERGY_BUDGET + walletBalance

  return (
    <div className="min-h-screen bg-[#0a0d12] pb-24">
      {successPack && (
        <SuccessToast pack={successPack} onClose={() => setSuccessPack(null)} />
      )}

      {/* Header */}
      <div className="px-4 pt-14 pb-6">
        <h1 className="text-white font-black text-2xl tracking-tight">Energy Store</h1>
        <p className="text-gray-500 text-sm mt-1">Top up your weekly energy to make more picks</p>
      </div>

      {/* Wallet card */}
      <div className="mx-4 mb-6 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-950/70 to-purple-950/50 border border-indigo-500/20 p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-gray-400 text-xs uppercase tracking-widest font-bold">Your energy this week</p>
          <span className="text-indigo-400 text-xs bg-indigo-900/40 border border-indigo-500/20 px-2 py-0.5 rounded-full">Week budget</span>
        </div>
        <div className="flex items-end gap-3">
          <span className="text-yellow-400 font-black text-4xl">{totalEnergy}</span>
          <span className="text-gray-500 text-sm mb-1">⚡ total</span>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
          <span className="text-gray-400">{ENERGY_BUDGET} base</span>
          {walletBalance > 0 && (
            <>
              <span>+</span>
              <span className="text-yellow-400 font-bold">+{walletBalance} from packs</span>
            </>
          )}
        </div>
      </div>

      {/* Packs */}
      <div className="px-4">
        <p className="text-gray-600 text-xs uppercase tracking-widest font-bold mb-4">Available packs</p>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-56 bg-white/4 border border-white/8 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : packs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">⚡</p>
            <p className="text-gray-400 font-semibold">No packs available yet</p>
            <p className="text-gray-600 text-sm mt-1">Check back soon</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {packs.map(pack => (
              <PackCard
                key={pack.id}
                pack={pack}
                walletBalance={walletBalance}
                onPurchase={handlePurchase}
                purchasing={purchasing}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
