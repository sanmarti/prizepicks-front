import { useState, useEffect, useCallback } from 'react'
import { getEnergyPacks, purchaseEnergyPack } from '../api/glory'
import BottomNav from '../components/layout/BottomNav'

const ENERGY_BUDGET = 25

// ── Themed visuals ────────────────────────────────────────────────────────────
const PACK_THEMES = [
  {
    bg: 'from-blue-950 via-cyan-900/60 to-blue-950',
    glow: 'shadow-[0_0_40px_-8px_rgba(56,189,248,0.5)]',
    border: 'border-cyan-500/30',
    accent: 'text-cyan-300',
    badge: 'bg-cyan-900/60 border-cyan-500/30 text-cyan-300',
    btn: 'bg-cyan-600 hover:bg-cyan-500 shadow-[0_4px_14px_-4px_rgba(6,182,212,0.7)]',
    visual: (
      <div className="relative w-full h-full flex items-center justify-center select-none">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white -translate-x-1/2" />
          <div className="absolute left-1/2 top-1/2 w-16 h-16 rounded-full border border-white -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="relative flex flex-col items-center gap-1">
          <span className="text-5xl drop-shadow-[0_0_12px_rgba(56,189,248,0.9)]">⚡</span>
          <span className="text-2xl -mt-2">⚽</span>
        </div>
        <div className="absolute top-3 right-6 text-cyan-400/50 text-lg font-black rotate-12">⚡</div>
        <div className="absolute bottom-4 left-5 text-cyan-400/30 text-sm rotate-[-20deg]">⚡</div>
      </div>
    ),
  },
  {
    bg: 'from-purple-950 via-violet-900/60 to-indigo-950',
    glow: 'shadow-[0_0_40px_-8px_rgba(168,85,247,0.5)]',
    border: 'border-purple-500/30',
    accent: 'text-purple-300',
    badge: 'bg-purple-900/60 border-purple-500/30 text-purple-300',
    btn: 'bg-violet-600 hover:bg-violet-500 shadow-[0_4px_14px_-4px_rgba(139,92,246,0.7)]',
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
      </div>
    ),
  },
  {
    bg: 'from-orange-950 via-red-900/60 to-yellow-950',
    glow: 'shadow-[0_0_40px_-8px_rgba(251,146,60,0.5)]',
    border: 'border-orange-500/30',
    accent: 'text-orange-300',
    badge: 'bg-orange-900/60 border-orange-500/30 text-orange-300',
    btn: 'bg-orange-600 hover:bg-orange-500 shadow-[0_4px_14px_-4px_rgba(234,88,12,0.7)]',
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
    bg: 'from-emerald-950 via-green-900/60 to-teal-950',
    glow: 'shadow-[0_0_40px_-8px_rgba(52,211,153,0.5)]',
    border: 'border-emerald-500/30',
    accent: 'text-emerald-300',
    badge: 'bg-emerald-900/60 border-emerald-500/30 text-emerald-300',
    btn: 'bg-emerald-600 hover:bg-emerald-500 shadow-[0_4px_14px_-4px_rgba(16,185,129,0.7)]',
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

// ── Payment modal ─────────────────────────────────────────────────────────────
function PaymentModal({ pack, onClose, onPay }) {
  const [method,     setMethod]     = useState('card')
  const [processing, setProcessing] = useState(false)
  const [cardName,   setCardName]   = useState('')
  const [cardNum,    setCardNum]    = useState('')
  const [expiry,     setExpiry]     = useState('')
  const [cvc,        setCvc]        = useState('')

  const isApplePay = typeof window !== 'undefined' && 'ApplePaySession' in window

  function fmtCard(v)   { return v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim() }
  function fmtExpiry(v) { const d=v.replace(/\D/g,'').slice(0,4); return d.length>2?d.slice(0,2)+'/'+d.slice(2):d }

  async function submit() {
    setProcessing(true)
    try { await onPay() } finally { setProcessing(false) }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm"
      style={{ animation: 'fadeIn 0.18s ease both' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <style>{`
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
      `}</style>

      <div className="w-full max-w-md bg-[#0f1219] rounded-t-3xl border border-white/8 border-b-0 px-5 pt-4 pb-10"
        style={{ animation: 'slideUp 0.3s cubic-bezier(0.32,0.72,0,1) both' }}>

        {/* Handle */}
        <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-5" />

        {/* Pack summary */}
        <div className="flex items-center gap-4 mb-6 p-4 rounded-2xl bg-white/4 border border-white/8">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-2xl flex-shrink-0">⚡</div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm">{pack.name}</p>
            <p className="text-gray-500 text-xs mt-0.5">+{pack.energy_amount} energy added to wallet</p>
          </div>
          <p className="text-white font-black text-xl flex-shrink-0">€{parseFloat(pack.price_euros).toFixed(2)}</p>
        </div>

        {/* Method tabs */}
        <p className="text-gray-600 text-[11px] uppercase tracking-widest font-semibold mb-3">Payment method</p>
        <div className="grid grid-cols-3 gap-2 mb-5">
          {isApplePay && (
            <button onClick={() => setMethod('apple')}
              className={`py-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${method==='apple' ? 'bg-white text-black border-white' : 'bg-white/4 border-white/10 text-white/50'}`}>
              <span className="text-base"></span> Pay
            </button>
          )}
          <button onClick={() => setMethod('google')}
            className={`py-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${method==='google' ? 'bg-white text-black border-white' : 'bg-white/4 border-white/10 text-white/50'}`}>
            <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/></svg>
            Pay
          </button>
          <button onClick={() => setMethod('card')}
            className={`py-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${method==='card' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/4 border-white/10 text-white/50'}`}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            Card
          </button>
        </div>

        {/* Card form */}
        {method === 'card' && (
          <div className="flex flex-col gap-3 mb-5">
            <input
              value={cardName} onChange={e => setCardName(e.target.value)}
              placeholder="Cardholder name"
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 outline-none focus:border-indigo-500/60 transition-colors"
            />
            <div className="relative">
              <input
                value={cardNum} onChange={e => setCardNum(fmtCard(e.target.value))}
                placeholder="1234 5678 9012 3456" maxLength={19} inputMode="numeric"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 outline-none focus:border-indigo-500/60 transition-colors tracking-widest"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1.5 opacity-40">
                <svg width="26" height="17" viewBox="0 0 780 500"><rect width="780" height="500" rx="40" fill="#1a1f71"/><circle cx="300" cy="250" r="150" fill="#eb001b"/><circle cx="480" cy="250" r="150" fill="#f79e1b"/><path d="M390 141a150 150 0 0 1 0 218 150 150 0 0 1 0-218z" fill="#ff5f00"/></svg>
              </div>
            </div>
            <div className="flex gap-3">
              <input
                value={expiry} onChange={e => setExpiry(fmtExpiry(e.target.value))}
                placeholder="MM/YY" maxLength={5} inputMode="numeric"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 outline-none focus:border-indigo-500/60 transition-colors"
              />
              <input
                value={cvc} onChange={e => setCvc(e.target.value.replace(/\D/g,'').slice(0,4))}
                placeholder="CVC" maxLength={4} inputMode="numeric"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 outline-none focus:border-indigo-500/60 transition-colors"
              />
            </div>
          </div>
        )}

        {/* Apple/Google info */}
        {(method === 'apple' || method === 'google') && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/3 border border-white/8 mb-5">
            <span className="text-2xl">{method === 'apple' ? '' : '🔒'}</span>
            <p className="text-gray-400 text-sm leading-relaxed">
              {method === 'apple'
                ? "You'll authenticate with Face ID or Touch ID via Apple Pay to complete the payment."
                : "You'll be redirected to Google Pay to complete the payment securely."}
            </p>
          </div>
        )}

        {/* Pay button */}
        <button
          onClick={submit}
          disabled={processing}
          className={`w-full py-4 rounded-2xl font-black text-base transition-all active:scale-[0.98] ${
            processing
              ? 'bg-white/8 text-white/30 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_4px_24px_-4px_rgba(99,102,241,0.55)]'
          }`}
        >
          {processing
            ? <span className="flex items-center justify-center gap-2"><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Processing…</span>
            : `Pay €${parseFloat(pack.price_euros).toFixed(2)}`
          }
        </button>

        <p className="text-center text-gray-700 text-[11px] mt-3">🔒 Secure payment · Energy added instantly</p>
      </div>
    </div>
  )
}

// ── Pack card ─────────────────────────────────────────────────────────────────
function PackCard({ pack, idx, onBuy }) {
  const theme = PACK_THEMES[idx % PACK_THEMES.length]
  const originalPrice = pack.discount_pct > 0
    ? (parseFloat(pack.price_euros) / (1 - pack.discount_pct / 100)).toFixed(2)
    : null

  return (
    <div className={`relative rounded-2xl border overflow-hidden transition-all hover:scale-[1.005] ${theme.border} ${theme.glow} bg-gradient-to-br ${theme.bg}`}>
      {pack.discount_pct > 0 && (
        <div className="absolute top-3 right-3 z-10 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full tracking-wide">
          -{pack.discount_pct}% OFF
        </div>
      )}

      <div className="flex items-stretch">
        {/* Visual */}
        <div className="w-28 flex-shrink-0 relative overflow-hidden">
          {pack.image_url
            ? <img src={pack.image_url} alt={pack.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full">{theme.visual}</div>}
          <div className="absolute top-0 right-0 bottom-0 w-6 bg-gradient-to-r from-transparent to-black/30" />
        </div>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col gap-2.5 min-w-0">
          <div>
            <p className="text-white font-bold text-sm leading-tight">{pack.name}</p>
            {pack.description && (
              <p className="text-gray-500 text-xs mt-0.5 leading-relaxed line-clamp-2">{pack.description}</p>
            )}
          </div>
          <div className={`inline-flex items-center gap-1.5 self-start rounded-lg px-2.5 py-1 border text-xs font-black ${theme.badge}`}>
            <span>⚡</span><span>+{pack.energy_amount} energy</span>
          </div>
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/8">
            <div className="leading-none">
              {originalPrice && <p className="text-gray-600 text-[11px] line-through">€{originalPrice}</p>}
              <p className="text-white font-black text-xl">€{parseFloat(pack.price_euros).toFixed(2)}</p>
            </div>
            <button
              onClick={() => onBuy(pack)}
              className={`flex items-center gap-2 font-bold text-sm px-5 py-2 rounded-xl transition-all active:scale-95 text-white ${theme.btn}`}
            >
              Purchase
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Success toast ─────────────────────────────────────────────────────────────
function SuccessToast({ pack, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t) }, [onClose])
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

// ── Wallet card ───────────────────────────────────────────────────────────────
function WalletCard({ walletBalance }) {
  const hasPurchased = walletBalance > 0
  const weeksAvailable = walletBalance > 0 ? Math.floor(walletBalance / 5) : 0

  return (
    <div className={`relative rounded-2xl overflow-hidden mb-8 ${
      hasPurchased
        ? 'bg-gradient-to-br from-orange-950 via-red-900/60 to-yellow-950 shadow-[0_0_40px_-8px_rgba(251,146,60,0.55)]'
        : 'bg-gradient-to-br from-[#130d06] via-[#100c06] to-[#0a0804] shadow-[0_0_40px_-8px_rgba(251,146,60,0.15)]'
    }`}>
      {/* Glow blob top-right */}
      <div className={`absolute -top-10 -right-10 w-56 h-56 rounded-full blur-3xl pointer-events-none ${
        hasPurchased ? 'bg-yellow-500/25' : 'bg-orange-600/10'
      }`} />
      {/* Scan lines */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, white 2px, white 3px)', backgroundSize: '100% 3px' }} />

      <div className={`relative border rounded-2xl p-5 ${
        hasPurchased ? 'border-orange-500/30' : 'border-orange-900/40'
      }`}>
        {/* Balance row */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 text-white/50">Bonus Energy Wallet</p>
            <div className="flex items-end gap-2">
              <span className={`font-black leading-none ${
                hasPurchased
                  ? 'text-5xl text-yellow-400 drop-shadow-[0_0_22px_rgba(250,204,21,0.7)]'
                  : 'text-5xl text-white/20'
              }`}>{walletBalance}</span>
              <span className={`text-xl mb-0.5 ${hasPurchased ? 'text-yellow-400/80' : 'text-white/20'}`}>⚡</span>
            </div>
            {hasPurchased && weeksAvailable > 0 && (
              <p className="text-white/50 text-xs mt-1">≈ {weeksAvailable} matchweek{weeksAvailable !== 1 ? 's' : ''} covered</p>
            )}
          </div>
          {/* Battery visual */}
          <div className={`relative flex flex-col justify-end gap-[3px] p-2 rounded-xl border ${
            hasPurchased ? 'bg-yellow-400/10 border-yellow-400/25' : 'bg-orange-950/60 border-orange-800/30'
          }`} style={{ width: 34, height: 50 }}>
            {[1,2,3,4].map(i => (
              <div key={i} className={`w-full rounded-sm ${
                hasPurchased && i <= Math.max(1, Math.ceil((Math.min(walletBalance, 100) / 100) * 4))
                  ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.9)]'
                  : 'bg-orange-950'
              }`} style={{ height: 7 }} />
            ))}
            <div className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-1.5 rounded-t-sm ${
              hasPurchased ? 'bg-yellow-400/60' : 'bg-orange-900/50'
            }`} />
          </div>
        </div>

        {/* Value props */}
        <div className="space-y-2">
          {/* Mini pick demo */}
          <div className={`rounded-xl px-3 py-3 border ${
            hasPurchased ? 'bg-purple-500/10 border-purple-500/20' : 'bg-white/4 border-white/6'
          }`}>
            <p className="text-xs font-semibold text-white mb-2">🔒 Unlock the pick you actually want</p>
            <div className="flex gap-1.5 items-center">
              <div className="flex flex-col items-center justify-center rounded-lg px-3 py-1.5 bg-white/5 border border-white/10 min-w-[52px]">
                <span className="text-xs font-mono text-gray-300">Home</span>
                <span className="text-[10px] text-gray-500 mt-0.5">3⚡</span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-lg px-3 py-1.5 bg-white/5 border border-white/10 min-w-[52px]">
                <span className="text-xs font-mono text-gray-300">Draw</span>
                <span className="text-[10px] text-gray-500 mt-0.5">6⚡</span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-lg px-3 py-1.5 min-w-[52px] border border-white/10" style={{ background: 'rgba(15,15,20,0.6)' }}>
                <span className="text-base">🔒</span>
                <span className="text-[9px] text-gray-600 mt-0.5">Away 8⚡</span>
              </div>
            </div>
            <p className="text-[11px] text-white/40 mt-2">
              Safer outcomes cost more energy. Run out and the best picks get locked.
            </p>
          </div>

          <div className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 border ${
            hasPurchased ? 'bg-violet-500/10 border-violet-500/20' : 'bg-white/4 border-white/6'
          }`}>
            <span className="text-lg flex-shrink-0">🎯</span>
            <div>
              <p className="text-xs font-semibold text-white">Back all 6 events every week</p>
              <p className="text-[11px] text-white/40">{ENERGY_BUDGET} base energy fills fast. Bonus energy keeps you in the game for every pick.</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 border border-yellow-400/25 bg-yellow-400/8">
            <span className="text-lg flex-shrink-0">♾️</span>
            <div>
              <p className="text-yellow-300 text-xs font-semibold">Never expires · use up to +5⚡ per matchweek</p>
              <p className="text-yellow-500/70 text-[11px]">Stays in your wallet until you need it — no rush, no deadline.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function EnergyStorePage() {
  const [packs,         setPacks]         = useState([])
  const [walletBalance, setWalletBalance] = useState(0)
  const [loading,       setLoading]       = useState(true)
  const [payingPack,    setPayingPack]    = useState(null)
  const [successPack,   setSuccessPack]   = useState(null)

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

  async function handlePay() {
    const res = await purchaseEnergyPack(payingPack.id)
    setWalletBalance(res.data?.new_balance ?? walletBalance + payingPack.energy_amount)
    setSuccessPack(payingPack)
    setPayingPack(null)
  }

  return (
    <div className="min-h-screen bg-[#0a0d12] text-white">
      {successPack && <SuccessToast pack={successPack} onClose={() => setSuccessPack(null)} />}
      {payingPack  && <PaymentModal pack={payingPack} onClose={() => setPayingPack(null)} onPay={handlePay} />}

      <div className="max-w-md mx-auto px-4 pt-12 pb-28">

        {/* Header */}
        <div className="mb-6">
          <p className="text-indigo-400 text-[13px] font-bold tracking-wide uppercase">OddsRivals</p>
          <h1 className="text-white font-black text-2xl mt-0.5">Energy Store</h1>
          <p className="text-gray-500 text-sm mt-1">Add bonus energy to your wallet and unlock more picks</p>
        </div>

        <WalletCard walletBalance={walletBalance} />

        {/* Packs */}
        <p className="text-gray-600 text-xs uppercase tracking-widest font-semibold mb-4">Available packs</p>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white/4 border border-white/8 rounded-2xl animate-pulse" />)}
          </div>
        ) : packs.length === 0 ? (
          <div className="text-center py-20 bg-white/3 border border-white/8 rounded-2xl">
            <p className="text-4xl mb-3">⚡</p>
            <p className="text-gray-400 font-semibold">No packs available yet</p>
            <p className="text-gray-600 text-sm mt-1">Check back soon</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {packs.map((pack, idx) => (
              <PackCard key={pack.id} pack={pack} idx={idx} onBuy={setPayingPack} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
