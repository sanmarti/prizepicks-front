import { useEffect, useRef, useState, useCallback } from 'react'
import { getProfile, updateProfile, changePassword } from '../api/users'
import { getGloryProfile, getGloryStatus, getPurchaseHistory } from '../api/glory'
import { useAuthStore } from '../store/authStore'
import BottomNav from '../components/layout/BottomNav'
import Spinner from '../components/ui/Spinner'

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 220
      const scale = Math.min(MAX / img.width, MAX / img.height, 1)
      const canvas = document.createElement('canvas')
      canvas.width  = Math.round(img.width  * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Bad image')) }
    img.src = url
  })
}

const INP = "w-full px-4 py-3 rounded-xl text-white text-sm bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-500 transition-colors placeholder-gray-600"

function StatCard({ label, value, icon, gradient, glow, textColor, border, sub }) {
  return (
    <div className={`relative rounded-2xl overflow-hidden ${gradient} ${glow} border ${border}`}>
      <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-40 pointer-events-none"
        style={{ background: 'white' }} />
      <div className="relative p-4">
        <div className="flex items-start justify-between mb-2">
          <span className="text-xl">{icon}</span>
          {sub && <span className="text-[10px] text-white/40 font-semibold uppercase tracking-widest">{sub}</span>}
        </div>
        <p className={`font-black text-3xl leading-none mb-1 ${textColor}`}>{value ?? '—'}</p>
        <p className="text-white/40 text-[11px] font-medium">{label}</p>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-[#0d1117] border border-white/8 rounded-2xl overflow-hidden">
      {title && (
        <div className="px-4 py-3 border-b border-white/5">
          <p className="text-gray-500 text-[11px] font-semibold tracking-widest uppercase">{title}</p>
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  )
}

function InlineMsg({ status }) {
  if (!status) return null
  const ok = status.type !== 'error'
  return (
    <div className={`mt-3 px-4 py-2.5 rounded-xl text-xs text-center ${
      ok ? 'bg-green-900/20 border border-green-500/25 text-green-400'
         : 'bg-red-900/20 border border-red-500/25 text-red-400'
    }`}>{status.msg}</div>
  )
}

function AvatarTierBadge({ tier, size = 'lg' }) {
  if (!tier) return null
  const BG = { gold: 'linear-gradient(135deg,#78350f,#b45309)', silver: 'linear-gradient(135deg,#1e293b,#475569)', bronze: 'linear-gradient(135deg,#431407,#9a3412)' }
  const cls = size === 'lg'
    ? 'absolute bottom-0 left-0 w-6 h-6 text-sm border-2'
    : 'absolute -bottom-0.5 -right-0.5 w-[15px] h-[15px] text-[9px] border'
  return (
    <span
      className={`${cls} rounded-full border-[#0a0d12] flex items-center justify-center leading-none pointer-events-none`}
      style={{ background: BG[tier.color] }}
      title={tier.label}
    >
      {tier.icon}
    </span>
  )
}

const AWARD_BADGES = [
  {
    key: 'perfect',
    icon: '⭐',
    label: 'Perfect\nweeks',
    bg: 'linear-gradient(135deg, #1a1200, #2d1f00, #1a0e00)',
    border: 'rgba(250,204,21,0.45)',
    shadow: '0 0 18px -4px rgba(250,204,21,0.4)',
    numColor: '#fde047',
    shine: 'rgba(250,204,21,0.08)',
  },
  {
    key: 'sprints',
    icon: '🏆',
    label: 'Sprints\ncompleted',
    bg: 'linear-gradient(135deg, #050d1a, #0c1f3a, #060f1f)',
    border: 'rgba(56,189,248,0.45)',
    shadow: '0 0 18px -4px rgba(56,189,248,0.4)',
    numColor: '#7dd3fc',
    shine: 'rgba(56,189,248,0.08)',
  },
  {
    key: 'matchweeks',
    icon: '📅',
    label: 'Matchweeks\nplayed',
    bg: 'linear-gradient(135deg, #0d0520, #1a0a3a, #0a041a)',
    border: 'rgba(167,139,250,0.45)',
    shadow: '0 0 18px -4px rgba(167,139,250,0.4)',
    numColor: '#c4b5fd',
    shine: 'rgba(167,139,250,0.08)',
  },
]

const ALL_BADGES_STATIC = [
  { code: 'FIRST_GAMEWEEK',    name: 'First Gameweek',      description: 'Completed your first Gameweek',                        icon: '🎮' },
  { code: 'FIRST_CORRECT',     name: 'First Correct Pick',  description: 'Got your first correct prediction',                    icon: '✅' },
  { code: 'PERFECT_WEEK',      name: 'Perfect Week',        description: '6/6 picks correct in one Gameweek',                    icon: '⭐' },
  { code: 'PERFECT_MONTH',     name: 'Perfect Month',       description: 'Perfect Week in all 4 Gameweeks of a Sprint',          icon: '🌟' },
  { code: 'CONSISTENT_PLAYER', name: 'Consistent Player',   description: 'Completed all 4 Gameweeks in a Sprint',                icon: '🗓️' },
  { code: 'FIRST_PROMOTION',   name: 'First Promotion',     description: 'Promoted to a higher division for the first time',     icon: '⬆️' },
  { code: 'COMEBACK',          name: 'Comeback Promotion',  description: 'Promoted after being relegated',                       icon: '💪' },
  { code: 'THREE_PROMOTIONS',  name: 'Rising Star',         description: 'Promoted 3 times total',                               icon: '🚀' },
  { code: 'REACHED_DIV1',      name: 'Elite Climber',       description: 'Reached Division 1',                                   icon: '🏅' },
  { code: 'REACHED_CHAMPIONS', name: 'Champion',            description: 'Reached Champions / Legend',                           icon: '👑' },
]

const BADGE_ACCENTS = {
  FIRST_GAMEWEEK:      { glow: '#34d399', border: 'rgba(52,211,153,0.35)',  text: 'text-emerald-400' },
  PERFECT_WEEK:        { glow: '#facc15', border: 'rgba(250,204,21,0.4)',   text: 'text-yellow-400'  },
  CONSISTENT_PLAYER:   { glow: '#fb923c', border: 'rgba(251,146,60,0.35)',  text: 'text-orange-400'  },
  PERFECT_MONTH:       { glow: '#fbbf24', border: 'rgba(251,191,36,0.35)',  text: 'text-amber-400'   },
  FIRST_PROMOTION:     { glow: '#818cf8', border: 'rgba(129,140,248,0.35)', text: 'text-indigo-400'  },
  COMEBACK:            { glow: '#fb7185', border: 'rgba(251,113,133,0.35)', text: 'text-rose-400'    },
  THREE_PROMOTIONS:    { glow: '#a78bfa', border: 'rgba(167,139,250,0.35)', text: 'text-violet-400'  },
  REACHED_DIV1:        { glow: '#38bdf8', border: 'rgba(56,189,248,0.35)',  text: 'text-sky-400'     },
  REACHED_CHAMPIONS:   { glow: '#fde047', border: 'rgba(253,224,71,0.45)', text: 'text-yellow-300'  },
  DIV_CHAMP_ACADEMY:   { glow: '#6ee7b7', border: 'rgba(110,231,183,0.35)', text: 'text-emerald-300' },
  DIV_CHAMP_SUNDAY:    { glow: '#fca5a5', border: 'rgba(252,165,165,0.35)', text: 'text-red-300'     },
  DIV_CHAMP_DIV3:      { glow: '#cd7f32', border: 'rgba(205,127,50,0.45)',  text: 'text-amber-600'   },
  DIV_CHAMP_DIV2:      { glow: '#94a3b8', border: 'rgba(148,163,184,0.45)', text: 'text-slate-300'   },
  DIV_CHAMP_DIV1:      { glow: '#fbbf24', border: 'rgba(251,191,36,0.45)',  text: 'text-yellow-400'  },
  DIV_CHAMP_CHAMPIONS: { glow: '#fde047', border: 'rgba(253,224,71,0.55)',  text: 'text-yellow-200'  },
}

function AwardBadge({ cfg, count }) {
  return (
    <div className="relative flex-shrink-0 flex flex-col items-center justify-center gap-1 rounded-2xl overflow-hidden"
      style={{
        width: 78, paddingTop: 14, paddingBottom: 14,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        boxShadow: cfg.shadow,
      }}>
      {/* glow blob */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${cfg.shine} 0%, transparent 70%)` }} />
      {/* notch at top (medal ribbon feel) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-b-full"
        style={{ background: cfg.border }} />
      <span className="relative text-2xl leading-none">{cfg.icon}</span>
      <span className="relative font-black text-xl leading-none tabular-nums" style={{ color: cfg.numColor }}>
        {count ?? 0}
      </span>
      <span className="relative text-center leading-tight whitespace-pre-line"
        style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        {cfg.label}
      </span>
    </div>
  )
}

function AvatarPicker({ src, name, uploading, onFile, ringClass = 'border-indigo-500', tier = null }) {
  const ref = useRef()
  const initial = (name || '?')[0].toUpperCase()
  return (
    <div className="relative w-20 h-20 flex-shrink-0">
      <div
        onClick={() => !uploading && ref.current.click()}
        className={`w-20 h-20 rounded-full border-2 ${ringClass} overflow-hidden cursor-pointer relative group`}
      >
        {src
          ? <img src={src} alt={name} className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-indigo-900/40 flex items-center justify-center text-indigo-300 text-3xl font-bold">{initial}</div>
        }
        <div className={`absolute inset-0 bg-indigo-600/60 flex items-center justify-center rounded-full transition-opacity ${uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          {uploading ? <Spinner size={20} /> : <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>}
        </div>
      </div>
      <button
        onClick={() => !uploading && ref.current.click()}
        className="absolute bottom-0 right-0 w-6 h-6 bg-indigo-600 rounded-full border-2 border-[#0a0d12] flex items-center justify-center"
      >
        <svg width="10" height="10" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <AvatarTierBadge tier={tier} size="lg" />
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files[0]) onFile(e.target.files[0]); e.target.value = '' }} />
    </div>
  )
}

const OUTCOME_ICON = { promoted: '⬆', retained: '=', relegated: '⬇', pending: '⏳' }
const OUTCOME_COLOR = { promoted: 'text-green-400', retained: 'text-gray-400', relegated: 'text-red-400', pending: 'text-indigo-400' }

const TIERS = [
  { min: 90, label: 'Gold Predictor',   icon: '🥇', color: 'gold',
    accentColor: '#f59e0b',
    heroBg: 'linear-gradient(135deg, #1c1505 0%, #2d1a00 45%, #0a0d12 100%)',
    heroShadow: '0 0 70px -10px rgba(250,204,21,0.45)',
    heroBorder: 'rgba(250,204,21,0.35)',
    avatarRing: 'border-yellow-400',
    badgeBg: 'linear-gradient(135deg, #1c1505, #2d1a00)',
    badgeBorder: 'rgba(250,204,21,0.5)',
    badgeShadow: '0 0 26px -4px rgba(250,204,21,0.7)',
    badgeText: 'text-yellow-300',
    barFrom: '#eab308', barTo: '#fbbf24',
    desc: '90%+ accuracy · exceptional predictor',
  },
  { min: 80, label: 'Silver Predictor', icon: '🥈', color: 'silver',
    accentColor: '#94a3b8',
    heroBg: 'linear-gradient(135deg, #1e293b 0%, #15202b 45%, #0a0d12 100%)',
    heroShadow: '0 0 70px -10px rgba(148,163,184,0.4)',
    heroBorder: 'rgba(148,163,184,0.35)',
    avatarRing: 'border-slate-300',
    badgeBg: 'linear-gradient(135deg, #1e293b, #334155)',
    badgeBorder: 'rgba(203,213,225,0.45)',
    badgeShadow: '0 0 26px -4px rgba(148,163,184,0.6)',
    badgeText: 'text-slate-200',
    barFrom: '#94a3b8', barTo: '#e2e8f0',
    desc: '80%+ accuracy · elite predictor',
  },
  { min: 70, label: 'Bronze Predictor', icon: '🥉', color: 'bronze',
    accentColor: '#f97316',
    heroBg: 'linear-gradient(135deg, #1c0a00 0%, #2d1500 45%, #0a0d12 100%)',
    heroShadow: '0 0 70px -10px rgba(249,115,22,0.4)',
    heroBorder: 'rgba(249,115,22,0.35)',
    avatarRing: 'border-orange-400',
    badgeBg: 'linear-gradient(135deg, #1c0a00, #2d1500)',
    badgeBorder: 'rgba(249,115,22,0.5)',
    badgeShadow: '0 0 26px -4px rgba(249,115,22,0.65)',
    badgeText: 'text-orange-300',
    barFrom: '#f97316', barTo: '#fbbf24',
    desc: '70%+ accuracy · skilled predictor',
  },
]
function getAccuracyTier(pct) {
  if (!pct || pct < 70) return null
  return TIERS.find(t => pct >= t.min) ?? null
}

const MAX_ENERGY_PER_WEEK = 5

// ── Wallet tab ─────────────────────────────────────────────────────────────────
function WalletTab({ walletBalance, transactions, loadingWallet, onGoToStore }) {
  const [showHistory, setShowHistory] = useState(false)
  const hasPurchased = walletBalance > 0 || transactions.length > 0
  const weeksAvailable = walletBalance > 0 ? Math.floor(walletBalance / MAX_ENERGY_PER_WEEK) : 0
  const purchaseTxs = transactions.filter(t => t.type === 'PURCHASE')
  const usageTxs    = transactions.filter(t => t.type !== 'PURCHASE')

  return (
    <div className="space-y-4">
      {/* Main wallet card */}
      <div className={`relative rounded-2xl overflow-hidden shadow-[0_0_40px_-8px_rgba(168,85,247,0.4)] ${
        hasPurchased ? 'bg-gradient-to-br from-purple-950 via-violet-900/60 to-indigo-950'
                     : 'bg-gradient-to-br from-[#0e0c18] via-[#0a0c16] to-[#080910]'
      }`}>
        {/* Glow blob */}
        <div className={`absolute -top-10 -right-10 w-52 h-52 rounded-full blur-3xl pointer-events-none ${
          hasPurchased ? 'bg-yellow-500/15' : 'bg-violet-600/8'
        }`} />
        {/* Scan lines */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, white 2px, white 3px)', backgroundSize: '100% 3px' }} />

        <div className={`relative border rounded-2xl p-5 ${
          hasPurchased ? 'border-purple-500/30' : 'border-white/6'
        }`}>
          {/* Balance row */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${
                hasPurchased ? 'text-violet-400' : 'text-gray-600'
              }`}>Bonus Energy Wallet</p>
              <div className="flex items-end gap-2">
                <span className={`font-black leading-none ${
                  hasPurchased
                    ? 'text-5xl text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.55)]'
                    : 'text-5xl text-gray-700'
                }`}>{walletBalance}</span>
                <span className={`text-xl mb-0.5 ${hasPurchased ? 'text-yellow-400/70' : 'text-gray-700'}`}>⚡</span>
              </div>
              {hasPurchased && weeksAvailable > 0 && (
                <p className="text-violet-400/70 text-xs mt-1">≈ {weeksAvailable} matchweek{weeksAvailable !== 1 ? 's' : ''} covered</p>
              )}
            </div>
          </div>

          {/* Value props */}
          <div className="space-y-2 mb-5">
            {/* Mini pick demo */}
            <div className={`rounded-xl px-3 py-3 border ${
              hasPurchased ? 'bg-purple-500/10 border-purple-500/20' : 'bg-white/4 border-white/6'
            }`}>
              <p className={`text-xs font-semibold mb-2 ${hasPurchased ? 'text-purple-200' : 'text-white'}`}>
                🔒 Unlock the pick you actually want
              </p>
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
              <p className={`text-[11px] mt-2 ${hasPurchased ? 'text-purple-400/70' : 'text-gray-500'}`}>
                Safer outcomes cost more energy. Run out and the best picks get locked.
              </p>
            </div>

            <div className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 border ${
              hasPurchased ? 'bg-violet-500/10 border-violet-500/20' : 'bg-white/4 border-white/6'
            }`}>
              <span className="text-lg flex-shrink-0">🎯</span>
              <div>
                <p className={`text-xs font-semibold ${hasPurchased ? 'text-violet-200' : 'text-white'}`}>Back all 6 events every week</p>
                <p className={`text-[11px] ${hasPurchased ? 'text-violet-400/70' : 'text-gray-500'}`}>25 base energy fills fast. Bonus energy keeps you in the game for every pick.</p>
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

          {!hasPurchased ? (
            <button onClick={onGoToStore}
              className="w-full py-3 rounded-xl bg-yellow-500/15 border border-yellow-400/25 text-yellow-400 text-sm font-semibold hover:bg-yellow-500/25 transition-colors">
              ⚡ Get bonus energy
            </button>
          ) : (
            <button onClick={onGoToStore}
              className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm font-semibold hover:bg-white/8 transition-colors">
              ⚡ Buy more energy
            </button>
          )}
        </div>
      </div>

      {/* Purchase history */}
      <div className="bg-[#0d1117] border border-white/8 rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowHistory(h => !h)}
          className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-white/3 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-base">🧾</span>
            <div>
              <p className="text-white text-sm font-semibold">Purchase history</p>
              {purchaseTxs.length > 0 && (
                <p className="text-gray-600 text-[11px]">{purchaseTxs.length} purchase{purchaseTxs.length !== 1 ? 's' : ''}</p>
              )}
            </div>
          </div>
          <svg className={`w-4 h-4 text-gray-600 transition-transform ${showHistory ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {showHistory && (
          <div className="border-t border-white/5">
            {loadingWallet ? (
              <div className="flex justify-center py-6"><Spinner size={20} /></div>
            ) : purchaseTxs.length === 0 ? (
              <div className="text-center py-8 px-4">
                <p className="text-3xl mb-2">⚡</p>
                <p className="text-gray-500 text-sm">No purchases yet</p>
                <p className="text-gray-700 text-xs mt-1">Visit the Energy Store to get bonus energy</p>
              </div>
            ) : (
              <div className="divide-y divide-white/4">
                {purchaseTxs.map((tx, i) => (
                  <div key={tx.id ?? i} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-white text-xs font-semibold">{tx.description?.replace('Purchased: ', '') || 'Energy pack'}</p>
                      <p className="text-gray-600 text-[10px] mt-0.5">
                        {new Date(tx.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' · '}
                        {new Date(tx.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className="text-yellow-400 font-black text-sm">+{tx.amount}⚡</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Usage history (if any consumption txs exist) */}
      {usageTxs.length > 0 && (
        <div className="bg-[#0d1117] border border-white/8 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5">
            <p className="text-gray-500 text-[11px] font-semibold tracking-widest uppercase">Energy used</p>
          </div>
          <div className="divide-y divide-white/4">
            {usageTxs.map((tx, i) => (
              <div key={tx.id ?? i} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-white text-xs font-semibold">{tx.description || 'Energy used'}</p>
                  <p className="text-gray-600 text-[10px] mt-0.5">
                    {new Date(tx.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <span className="text-red-400 font-black text-sm">{tx.amount}⚡</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProfilePage() {
  const { user: jwt, logout } = useAuthStore()

  const [profile,      setProfile]      = useState(null)
  const [avatarSrc,    setAvatarSrc]    = useState(null)
  const [glory,        setGlory]        = useState(null)
  const [status,       setStatus]       = useState(null)

  const [displayName,  setDisplayName]  = useState('')
  const [savingInfo,   setSavingInfo]   = useState(false)
  const [infoMsg,      setInfoMsg]      = useState(null)
  const [uploadingAv,  setUploadingAv]  = useState(false)
  const [avatarMsg,    setAvatarMsg]    = useState(null)
  const [curPw,        setCurPw]        = useState('')
  const [newPw,        setNewPw]        = useState('')
  const [newPw2,       setNewPw2]       = useState('')
  const [showPw,       setShowPw]       = useState(false)
  const [savingPw,     setSavingPw]     = useState(false)
  const [pwMsg,        setPwMsg]        = useState(null)
  const [activeTab,    setActiveTab]    = useState('stats') // stats | badges | history | wallet | account

  const [walletBalance,    setWalletBalance]    = useState(0)
  const [walletTxs,        setWalletTxs]        = useState([])
  const [loadingWallet,    setLoadingWallet]    = useState(false)
  const [walletLoaded,     setWalletLoaded]     = useState(false)

  const loadWallet = useCallback(async () => {
    if (walletLoaded) return
    setLoadingWallet(true)
    try {
      const { data } = await getPurchaseHistory()
      setWalletBalance(data.wallet_balance ?? 0)
      setWalletTxs(data.transactions ?? [])
      setWalletLoaded(true)
    } catch {}
    finally { setLoadingWallet(false) }
  }, [walletLoaded])

  useEffect(() => {
    const emailPrefix = (jwt?.email ?? '').split('@')[0]
    const fallback    = jwt?.display_name ?? jwt?.name ?? emailPrefix
    setProfile({ email: jwt?.email ?? '', display_name: fallback })
    setDisplayName(fallback)

    getProfile().then(({ data }) => {
      setProfile(data.user)
      setDisplayName(data.user.display_name || (data.user.email ?? '').split('@')[0])
      setAvatarSrc(data.user.avatar_url || null)
    }).catch(() => {})

    getGloryProfile().then(r => setGlory(r.data)).catch(() => {})
    getGloryStatus().then(r => setStatus(r.data)).catch(() => {})
  }, [jwt])

  useEffect(() => {
    if (activeTab === 'wallet') loadWallet()
  }, [activeTab, loadWallet])

  async function handleAvatarFile(file) {
    setUploadingAv(true); setAvatarMsg(null)
    try {
      const base64 = await compressImage(file)
      const { data } = await updateProfile({ avatar_url: base64 })
      setAvatarSrc(data.user.avatar_url)
      setAvatarMsg({ type: 'ok', msg: 'Profile picture updated ✓' })
    } catch (err) {
      setAvatarMsg({ type: 'error', msg: err.response?.data?.error ?? 'Upload failed' })
    } finally { setUploadingAv(false) }
  }

  async function handleSaveInfo(e) {
    e.preventDefault()
    const name = displayName.trim()
    if (name.length < 2) { setInfoMsg({ type: 'error', msg: 'Name must be at least 2 characters' }); return }
    setSavingInfo(true); setInfoMsg(null)
    try {
      const { data } = await updateProfile({ display_name: name })
      setProfile(p => ({ ...p, display_name: data.user.display_name }))
      setInfoMsg({ type: 'ok', msg: 'Name updated ✓' })
    } catch (err) { setInfoMsg({ type: 'error', msg: err.response?.data?.error ?? 'Update failed' }) }
    finally { setSavingInfo(false) }
  }

  async function handleChangePw(e) {
    e.preventDefault()
    if (newPw !== newPw2) { setPwMsg({ type: 'error', msg: 'Passwords do not match' }); return }
    if (newPw.length < 8) { setPwMsg({ type: 'error', msg: 'Minimum 8 characters' }); return }
    setSavingPw(true); setPwMsg(null)
    try {
      await changePassword({ current_password: curPw, new_password: newPw })
      setPwMsg({ type: 'ok', msg: 'Password updated ✓' })
      setCurPw(''); setNewPw(''); setNewPw2('')
    } catch (err) { setPwMsg({ type: 'error', msg: err.response?.data?.error ?? 'Check current password' }) }
    finally { setSavingPw(false) }
  }

  const shownName = profile?.display_name || (profile?.email ?? '').split('@')[0] || 'Player'
  const div       = glory?.division || status?.division
  const stats     = glory?.lifetime_stats
  const sprint    = status?.sprint
  const prog      = status?.sprint_progress
  const divRank   = status?.division_rank
  const divTotal  = status?.division_total
  const sprintsInDiv = glory?.sprint_history?.filter(s => s.division_name === div?.division_name).length ?? 0

  const badgeEarnedMap   = Object.fromEntries((glory?.badges ?? []).map(b => [b.code, b]))
  const DIV_BADGE_ORDER  = ['DIV_CHAMP_ACADEMY','DIV_CHAMP_SUNDAY','DIV_CHAMP_DIV3','DIV_CHAMP_DIV2','DIV_CHAMP_DIV1','DIV_CHAMP_CHAMPIONS']
  const rawBadgeList     = glory?.badges?.length
    ? glory.badges
    : ALL_BADGES_STATIC.map(b => ({ ...b, earned_count: 0, last_earned_at: null }))
  const badgeList = [...rawBadgeList].sort((a, b) => {
    const ai = DIV_BADGE_ORDER.indexOf(a.code), bi = DIV_BADGE_ORDER.indexOf(b.code)
    const aDivision = ai !== -1, bDivision = bi !== -1
    if (aDivision && bDivision) return ai - bi       // both division: fixed tier order
    if (aDivision) return 1                          // division goes after non-division
    if (bDivision) return -1
    const ae = (a.earned_count ?? 0) > 0 ? 0 : 1    // non-division: earned first
    const be = (b.earned_count ?? 0) > 0 ? 0 : 1
    return ae - be
  })
  const badgeEarnedCount = badgeList.filter(b => (badgeEarnedMap[b.code]?.earned_count ?? b.earned_count ?? 0) > 0).length
  const tier      = getAccuracyTier(stats?.accuracy_pct)

  const TABS = [
    { id: 'stats',   label: 'My Stats' },
    { id: 'wallet',  label: 'Wallet' },
    { id: 'guide',   label: 'Guide' },
    { id: 'account', label: 'Account' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0d12] text-white pb-24">
      <div className="max-w-md mx-auto px-4 pt-5 space-y-4">

        {/* Hero */}
        <div
          className="relative rounded-2xl p-4 overflow-hidden"
          style={{
            background: tier ? tier.heroBg : 'linear-gradient(135deg, #0d1117, #0a0d14)',
            boxShadow: tier ? tier.heroShadow : undefined,
            border: `1px solid ${tier ? tier.heroBorder : 'rgba(255,255,255,0.08)'}`,
          }}
        >
          {/* Glow blob */}
          <div className="absolute -top-8 -left-8 w-36 h-36 rounded-full blur-3xl pointer-events-none"
            style={{ background: tier ? tier.accentColor : '#6366f1', opacity: tier ? 0.18 : 0.1 }} />

          {/* Tier label banner */}
          {tier && (
            <div className="flex items-center gap-1.5 mb-3">
              <span className="text-base leading-none">{tier.icon}</span>
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${tier.badgeText}`}>{tier.label}</span>
              <div className="flex-1 h-px ml-1" style={{ background: `linear-gradient(to right, ${tier.accentColor}40, transparent)` }} />
            </div>
          )}

          <div className="relative flex items-center gap-4 mb-4">
            <AvatarPicker src={avatarSrc} name={shownName} uploading={uploadingAv} onFile={handleAvatarFile}
              ringClass={tier ? tier.avatarRing : 'border-indigo-500'} tier={tier} />
            <div className="min-w-0 flex-1">
              <p className="text-white font-bold text-xl truncate">{shownName}</p>
              <p className="text-gray-500 text-xs truncate">{profile?.email}</p>
              {div && (
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-base">{div.icon}</span>
                  <span className="text-gray-300 text-sm">{div.division_name}</span>
                  {sprintsInDiv > 0 && (
                    <span className="text-gray-600 text-xs">· {sprintsInDiv} sprint{sprintsInDiv > 1 ? 's' : ''}</span>
                  )}
                </div>
              )}
            </div>

            {/* Accuracy badge */}
            {stats?.accuracy_pct != null && (
              <div
                className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-2xl"
                style={{
                  background: tier ? tier.badgeBg : 'linear-gradient(135deg, #1c0f00, #2d1900)',
                  border: `1px solid ${tier ? tier.badgeBorder : 'rgba(245,158,11,0.35)'}`,
                  boxShadow: tier ? tier.badgeShadow : '0 0 18px -4px rgba(245,158,11,0.4)',
                }}
              >
                {tier
                  ? <span className="text-lg leading-none mb-0.5">{tier.icon}</span>
                  : <span className="text-amber-500/70 text-[9px] font-semibold uppercase tracking-wider mb-0.5">accuracy</span>
                }
                <span className={`font-black text-xl leading-none ${tier ? tier.badgeText : 'text-amber-300'}`}>
                  {stats.accuracy_pct}%
                </span>
                {tier && <span className={`text-[8px] font-bold uppercase tracking-wider mt-0.5 ${tier.badgeText} opacity-50`}>{tier.color}</span>}
              </div>
            )}
          </div>
          <InlineMsg status={avatarMsg} />
        </div>

        {/* Tab nav */}
        <div className="flex gap-1 bg-white/3 border border-white/8 rounded-2xl p-1 overflow-x-auto scrollbar-none">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex-shrink-0 flex-1 min-w-0 py-2 px-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === t.id ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Stats tab */}
        {activeTab === 'stats' && (
          <div className="space-y-3">

            {/* ── Hero: Accuracy (most important) ── */}
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                background: tier ? tier.badgeBg : 'linear-gradient(135deg, #1c1000, #2d1900 50%, #1c0a00)',
                border: `1px solid ${tier ? tier.badgeBorder : 'rgba(245,158,11,0.3)'}`,
                boxShadow: tier ? tier.badgeShadow : '0 0 22px -6px rgba(245,158,11,0.35)',
              }}
            >
              <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full blur-3xl pointer-events-none"
                style={{ background: tier ? tier.accentColor : '#f59e0b', opacity: 0.18 }} />
              <div className="relative p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{tier ? tier.icon : '📊'}</span>
                    {tier
                      ? <span className={`text-[10px] font-black uppercase tracking-[0.18em] ${tier.badgeText}`}>{tier.label}</span>
                      : <span className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-500/60">Prediction accuracy</span>
                    }
                  </div>
                  <span className="text-white/25 text-[10px] font-semibold uppercase tracking-widest">lifetime</span>
                </div>
                <p className={`font-black leading-none mb-1 ${tier ? tier.badgeText : 'text-amber-300'}`}
                  style={{ fontSize: 56 }}>
                  {stats?.accuracy_pct ?? 0}<span style={{ fontSize: 28, opacity: 0.55 }}>%</span>
                </p>
                <p className="text-white/35 text-[11px] font-medium mb-3">
                  {stats?.lifetime_correct ?? 0} correct out of {stats?.total_picks ?? 0} picks
                </p>
                {/* Tier progress bar */}
                <div className="h-2 rounded-full bg-white/8 overflow-hidden mb-1.5">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(stats?.accuracy_pct ?? 0, 100)}%`,
                      background: tier
                        ? `linear-gradient(to right, ${tier.barFrom}, ${tier.barTo})`
                        : 'linear-gradient(to right, #f59e0b, #fbbf24)',
                    }} />
                </div>
                {/* Tier milestones */}
                <div className="flex justify-between text-[9px] text-white/20 font-semibold">
                  <span>0%</span><span>🥉 70%</span><span>🥈 80%</span><span>🥇 90%</span>
                </div>
              </div>
            </div>

            {/* ── Current division ── */}
            {div && (
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-950 via-violet-900/50 to-indigo-950 border border-indigo-500/25 shadow-[0_0_18px_-6px_rgba(99,102,241,0.3)]">
                <div className="relative flex items-center justify-between p-4 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-2xl flex-shrink-0">
                      {div.icon}
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-indigo-400 mb-0.5">Current division</p>
                      <p className="text-white font-black text-lg leading-tight">{div.division_name}</p>
                      {sprintsInDiv > 0 && <p className="text-indigo-300/40 text-xs">{sprintsInDiv} sprint{sprintsInDiv > 1 ? 's' : ''} here</p>}
                    </div>
                  </div>
                  {status?.next_division && (
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-white/20 text-[9px] uppercase tracking-widest">next up</span>
                      <span className="text-2xl">{status.next_division.icon}</span>
                      <span className="text-indigo-300/60 text-[10px] font-semibold">{status.next_division.name}</span>
                    </div>
                  )}
                </div>
                {sprint && prog && (
                  <div className="relative border-t border-indigo-500/15 mx-4 mb-4 pt-3">
                    <p className="text-indigo-300/40 text-[10px] font-semibold uppercase tracking-widest mb-2">{sprint.name}</p>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="bg-indigo-500/8 rounded-xl py-2.5">
                        <p className="text-indigo-400 font-black text-xl leading-none">{prog.total_league_points}</p>
                        <p className="text-white/25 text-[10px] uppercase tracking-wider mt-1">LP</p>
                      </div>
                      <div className="bg-indigo-500/8 rounded-xl py-2.5">
                        <p className="text-emerald-400 font-black text-xl leading-none">{prog.total_correct_picks}</p>
                        <p className="text-white/25 text-[10px] uppercase tracking-wider mt-1">Correct</p>
                      </div>
                      <div className="bg-indigo-500/8 rounded-xl py-2.5">
                        <p className="text-yellow-400 font-black text-xl leading-none">{prog.perfect_weeks ?? 0}</p>
                        <p className="text-white/25 text-[10px] uppercase tracking-wider mt-1">Perfect</p>
                      </div>
                      <div className="bg-indigo-500/8 rounded-xl py-2.5">
                        <p className="text-white font-black text-xl leading-none">
                          {divRank != null ? `#${divRank}` : '—'}
                        </p>
                        <p className="text-white/25 text-[10px] uppercase tracking-wider mt-1">
                          {divTotal != null ? `of ${divTotal}` : 'Rank'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Row: LP + Total picks ── */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="League Points" value={stats?.lifetime_lp ?? 0} icon="⚡" sub="lifetime"
                gradient="bg-gradient-to-br from-violet-950 via-purple-900/60 to-violet-950"
                glow="shadow-[0_0_16px_-4px_rgba(139,92,246,0.28)]"
                border="border-violet-500/25" textColor="text-violet-300"
              />
              <StatCard
                label="Picks made" value={stats?.total_picks ?? 0} icon="🎮" sub="total"
                gradient="bg-gradient-to-br from-cyan-950 via-teal-900/50 to-cyan-950"
                glow="shadow-[0_0_16px_-4px_rgba(6,182,212,0.22)]"
                border="border-cyan-500/25" textColor="text-cyan-300"
              />
            </div>

            {/* ── Row: Correct + Incorrect ── */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Correct picks" value={stats?.lifetime_correct ?? 0} icon="✅"
                gradient="bg-gradient-to-br from-emerald-950 via-green-900/60 to-emerald-950"
                glow="shadow-[0_0_16px_-4px_rgba(52,211,153,0.28)]"
                border="border-emerald-500/25" textColor="text-emerald-300"
              />
              <StatCard
                label="Incorrect picks" value={stats?.lifetime_incorrect ?? 0} icon="❌"
                gradient="bg-gradient-to-br from-rose-950 via-red-900/40 to-rose-950"
                glow="shadow-[0_0_16px_-4px_rgba(244,63,94,0.18)]"
                border="border-rose-500/20" textColor="text-rose-400"
              />
            </div>

            {/* ── Row: Perfect weeks + Sprints ── */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Perfect weeks" value={stats?.total_perfect_weeks ?? 0} icon="⭐"
                gradient="bg-gradient-to-br from-yellow-950 via-amber-900/60 to-yellow-950"
                glow="shadow-[0_0_16px_-4px_rgba(250,204,21,0.22)]"
                border="border-yellow-500/25" textColor="text-yellow-300"
              />
              <StatCard
                label="Sprints played" value={stats?.sprints_played ?? 0} icon="🏁"
                gradient="bg-gradient-to-br from-sky-950 via-blue-900/60 to-sky-950"
                glow="shadow-[0_0_16px_-4px_rgba(56,189,248,0.2)]"
                border="border-sky-500/25" textColor="text-sky-300"
              />
            </div>

            {/* ── Best division reached ── */}
            {glory?.highest_division && (
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-purple-950 via-fuchsia-900/50 to-purple-950 border border-purple-500/25 shadow-[0_0_16px_-4px_rgba(168,85,247,0.22)]">
                <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full blur-3xl bg-purple-500/18 pointer-events-none" />
                <div className="relative flex items-center gap-4 p-4">
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-3xl flex-shrink-0">
                    {glory.highest_division.icon}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400 mb-0.5">Personal best</p>
                    <p className="text-white font-black text-lg leading-tight">{glory.highest_division.name}</p>
                    <p className="text-purple-300/50 text-xs mt-0.5">Highest division reached</p>
                  </div>
                </div>
              </div>
            )}

            {/* Achievement badges — always shown, earned colorful / unearned dim */}
            <Section title={`Achievements (${badgeEarnedCount}/${badgeList.length})`}>
              <div className="space-y-2">
                {badgeList.map((b, i) => {
                  const live   = badgeEarnedMap[b.code] ?? b
                  const count  = live.earned_count ?? 0
                  const earned = count > 0
                  const ac     = BADGE_ACCENTS[b.code] ?? { glow: '#6366f1', border: 'rgba(99,102,241,0.35)', text: 'text-indigo-400' }
                  return (
                    <div key={i} className="relative rounded-2xl overflow-hidden"
                      style={{
                        background: earned ? 'rgba(255,255,255,0.055)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${earned ? ac.border : 'rgba(255,255,255,0.06)'}`,
                        boxShadow: earned ? `0 0 26px -4px ${ac.glow}55` : 'none',
                        opacity: earned ? 1 : 0.45,
                      }}>
                      {earned && <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full blur-3xl pointer-events-none" style={{ background: ac.glow, opacity: 0.2 }} />}
                      <div className="relative flex items-center gap-4 p-4">
                        <span className="text-5xl flex-shrink-0 leading-none">{b.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className={`font-black text-lg leading-tight ${earned ? 'text-white' : 'text-white/25'}`}>{b.name}</p>
                          <p className="text-white/50 text-xs mt-0.5">{b.description}</p>
                          {earned && live.last_earned_at && (
                            <p className={`text-[10px] mt-1 ${ac.text} opacity-70`}>{new Date(live.last_earned_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          )}
                        </div>
                        <div className="flex-shrink-0 flex flex-col items-end gap-1">
                          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: earned ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.12)' }}>
                            {earned ? 'earned' : 'locked'}
                          </span>
                          {count > 1 && <span className={`text-xs font-black ${ac.text}`}>×{count}</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Section>

            {/* 4. Division champion badges */}
            {!!glory?.division_championships?.length && (
              <Section title={`Division Champion (${glory.division_championships.length})`}>
                <div className="grid grid-cols-2 gap-2">
                  {glory.division_championships.map((dc, i) => (
                    <div key={i} className="relative rounded-2xl overflow-hidden p-3"
                      style={{ background: 'rgba(255,255,255,0.05)', border: 'rgba(250,204,21,0.3) solid 1px', boxShadow: '0 0 18px -5px rgba(250,204,21,0.35)' }}>
                      <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl pointer-events-none bg-yellow-400/20" />
                      <div className="relative">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="text-xl leading-none">{dc.division_icon}</span>
                          <p className="text-white text-[11px] font-bold leading-tight truncate">{dc.division_name}</p>
                        </div>
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-yellow-400 font-black text-xl leading-none">👑 {dc.championships}</p>
                            <p className="text-yellow-500/50 text-[10px]">{dc.championships === 1 ? 'title' : 'titles'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-white/40 font-semibold text-xs leading-none">{dc.sprints_in_division}</p>
                            <p className="text-gray-700 text-[10px]">sprints</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* 5. Competition badges */}
            {!!glory?.competition_stats?.length && (
              <Section title={`Competition Badges (${glory.competition_stats.length})`}>
                <div className="space-y-2">
                  {glory.competition_stats.map((comp, i) => {
                    const LEAGUE_FLAGS = { 1:'🌍', 2:'⭐', 3:'🏅', 848:'🥉', 5:'🌐', 39:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', 140:'🇪🇸', 78:'🇩🇪', 135:'🇮🇹', 61:'🇫🇷', 88:'🇳🇱', 94:'🇵🇹', 144:'🇧🇪', 179:'🏴󠁧󠁢󠁳󠁣󠁴󠁿', 45:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', 143:'🇪🇸', 137:'🇮🇹', 15:'🌐', 253:'🇺🇸' }
                    const flag = LEAGUE_FLAGS[comp.api_league_id] ?? '🏆'
                    const accuracy = comp.total > 0 ? Math.round((comp.correct / comp.total) * 100) : 0
                    return (
                      <div key={i} className="relative rounded-2xl overflow-hidden"
                        style={{ background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(52,211,153,0.25)', boxShadow: '0 0 26px -4px rgba(52,211,153,0.3)' }}>
                        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full blur-3xl pointer-events-none bg-emerald-400/15" />
                        <div className="relative flex items-center gap-4 p-4">
                          <span className="text-5xl flex-shrink-0 leading-none">{flag}</span>
                          <div className="min-w-0 flex-1">
                            <p className="font-black text-lg leading-tight text-white">{comp.competition_name}</p>
                            <p className="text-white/50 text-xs mt-0.5">{comp.correct} correct picks · {comp.total} total</p>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className="text-emerald-400 font-black text-xl leading-none tabular-nums">{accuracy}%</p>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/20 mt-0.5">accuracy</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Section>
            )}
          </div>
        )}

        {/* Wallet tab */}
        {activeTab === 'wallet' && (
          <WalletTab
            walletBalance={walletBalance}
            transactions={walletTxs}
            loadingWallet={loadingWallet}
            onGoToStore={() => window.location.href = '/store'}
          />
        )}

        {/* Guide tab */}
        {activeTab === 'guide' && (
          <div className="space-y-3">

            {/* Header */}
            <div className="text-center pt-1 pb-2">
              <p className="text-white font-black text-xl">How to play</p>
              <p className="text-gray-600 text-xs mt-1">OddsRivals · season format</p>
            </div>

            {/* Step 1 — Make picks */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-950 via-violet-900/50 to-indigo-950 border border-indigo-500/25 shadow-[0_0_18px_-6px_rgba(99,102,241,0.3)]">
              <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full blur-3xl bg-indigo-400/15 pointer-events-none" />
              <div className="relative p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 font-black text-sm flex-shrink-0">01</div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">🎯</span>
                      <p className="text-white font-black text-base">Choose your picks</p>
                    </div>
                    <p className="text-indigo-200/60 text-xs leading-relaxed">Every Monday a pool of <span className="text-indigo-300 font-bold">15 picks</span> goes live — drawn from the biggest matches in world football. EPL, La Liga, Champions League, World Cup and more. Pick types vary: match outcome, over/under goals, player to score, clean sheets… back the ones you feel most confident about.</p>
                  </div>
                </div>
                {/* Pick type pills */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Match outcome', icon: '⚽', sel: true },
                    { label: 'Over / Under', icon: '📊', sel: false },
                    { label: 'Player to score', icon: '🥅', sel: true },
                    { label: 'Clean sheet', icon: '🧤', sel: false },
                  ].map(({ label, icon, sel }) => (
                    <div key={label} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border ${
                      sel
                        ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300'
                        : 'bg-white/4 border-white/10 text-gray-500'
                    }`}>
                      <span>{icon}</span><span>{label}</span>
                      {sel && <span className="text-emerald-400 font-black">✓</span>}
                    </div>
                  ))}
                </div>
                {/* Competition badges */}
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {['🏴󠁧󠁢󠁥󠁮󠁧󠁿 EPL', '🇪🇸 La Liga', '🌍 World Cup', '⭐ UCL'].map(c => (
                    <span key={c} className="text-[9px] font-bold text-indigo-400/60 bg-indigo-500/8 border border-indigo-400/15 px-2 py-0.5 rounded-full">{c}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 2 — Energy */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-yellow-950 via-amber-900/50 to-yellow-950 border border-yellow-500/25 shadow-[0_0_18px_-6px_rgba(250,204,21,0.22)]">
              <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full blur-3xl bg-yellow-400/12 pointer-events-none" />
              <div className="relative p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-yellow-500/20 border border-yellow-400/30 flex items-center justify-center text-yellow-300 font-black text-sm flex-shrink-0">02</div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">⚡</span>
                      <p className="text-white font-black text-base">Energy = picks</p>
                    </div>
                    <p className="text-yellow-200/60 text-xs leading-relaxed">Every pick costs energy. You get <span className="text-yellow-300 font-bold">25⚡ base energy</span> each matchweek — resets every week automatically.</p>
                  </div>
                </div>
                <div className="bg-black/30 rounded-xl p-3 flex items-center gap-3">
                  <span className="text-yellow-400 font-black text-sm">⚡25</span>
                  <div className="flex-1 h-2 rounded-full bg-white/8 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-amber-400" style={{ width: '100%' }} />
                  </div>
                  <span className="text-yellow-400/40 text-[10px] font-semibold">weekly base</span>
                </div>
              </div>
            </div>

            {/* Step 3 — Score */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-950 via-green-900/50 to-emerald-950 border border-emerald-500/25 shadow-[0_0_18px_-6px_rgba(52,211,153,0.22)]">
              <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full blur-3xl bg-emerald-400/12 pointer-events-none" />
              <div className="relative p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 font-black text-sm flex-shrink-0">03</div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">📈</span>
                      <p className="text-white font-black text-base">Earn League Points</p>
                    </div>
                    <p className="text-emerald-200/60 text-xs leading-relaxed">Correct picks earn <span className="text-emerald-300 font-bold">LP</span>. Get every pick right in a week and unlock a <span className="text-yellow-300 font-bold">Perfect Week ⭐</span> bonus.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 rounded-xl bg-emerald-500/12 border border-emerald-400/20 px-2 py-2.5 text-center">
                    <p className="text-emerald-300 font-black text-base">+LP</p>
                    <p className="text-emerald-400/45 text-[10px] mt-0.5">correct pick</p>
                  </div>
                  <div className="flex-1 rounded-xl bg-yellow-500/12 border border-yellow-400/20 px-2 py-2.5 text-center">
                    <p className="text-yellow-300 font-black text-base">⭐ bonus</p>
                    <p className="text-yellow-400/45 text-[10px] mt-0.5">all correct</p>
                  </div>
                  <div className="flex-1 rounded-xl bg-rose-500/10 border border-rose-400/15 px-2 py-2.5 text-center">
                    <p className="text-rose-400 font-black text-base">×0</p>
                    <p className="text-rose-400/45 text-[10px] mt-0.5">wrong pick</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 — Sprints */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-sky-950 via-blue-900/50 to-sky-950 border border-sky-500/25 shadow-[0_0_18px_-6px_rgba(56,189,248,0.2)]">
              <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full blur-3xl bg-sky-400/12 pointer-events-none" />
              <div className="relative p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300 font-black text-sm flex-shrink-0">04</div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">🏁</span>
                      <p className="text-white font-black text-base">Sprints</p>
                    </div>
                    <p className="text-sky-200/60 text-xs leading-relaxed">A sprint spans <span className="text-sky-300 font-bold">several matchweeks</span>. Your total LP at the end sets your final rank in the division.</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {['Week 1','Week 2','Week 3','Final'].map((w, i) => (
                    <div key={i} className={`flex-1 rounded-lg py-2 text-center text-[10px] font-bold border ${
                      i < 3
                        ? 'bg-sky-500/18 border-sky-400/25 text-sky-300'
                        : 'bg-sky-500/35 border-sky-400/50 text-sky-200'
                    }`}>{w}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 5 — Divisions */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-purple-950 via-fuchsia-900/50 to-purple-950 border border-purple-500/25 shadow-[0_0_18px_-6px_rgba(168,85,247,0.22)]">
              <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full blur-3xl bg-purple-400/12 pointer-events-none" />
              <div className="relative p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 font-black text-sm flex-shrink-0">05</div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">🏆</span>
                      <p className="text-white font-black text-base">Division system</p>
                    </div>
                    <p className="text-purple-200/60 text-xs leading-relaxed">You compete within your division. At sprint end, top players get <span className="text-green-400 font-bold">promoted ⬆</span>, bottom players get <span className="text-red-400 font-bold">relegated ⬇</span>. Reach the top!</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between rounded-xl bg-green-500/10 border border-green-400/20 px-3 py-2">
                    <span className="text-green-400 text-xs font-bold">🏆 Top players</span>
                    <span className="text-green-300 text-xs font-black">⬆ Promoted</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-white/4 border border-white/8 px-3 py-2">
                    <span className="text-gray-400 text-xs font-bold">🤝 Mid table</span>
                    <span className="text-gray-400 text-xs font-black">= Stay</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-red-500/10 border border-red-400/15 px-3 py-2">
                    <span className="text-red-400 text-xs font-bold">😰 Bottom players</span>
                    <span className="text-red-300 text-xs font-black">⬇ Relegated</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 6 — Bonus energy */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-orange-950 via-amber-900/40 to-orange-950 border border-orange-500/25 shadow-[0_0_18px_-6px_rgba(249,115,22,0.22)]">
              <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full blur-3xl bg-orange-400/12 pointer-events-none" />
              <div className="relative p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-400/30 flex items-center justify-center text-orange-300 font-black text-sm flex-shrink-0">06</div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">🔮</span>
                      <p className="text-white font-black text-base">Bonus energy</p>
                    </div>
                    <p className="text-orange-200/60 text-xs leading-relaxed">Want more picks? Buy bonus energy from the <span className="text-orange-300 font-bold">Energy Store</span>. It stays in your wallet until you spend it — you can use up to <span className="text-orange-300 font-bold">+5⚡ extra per matchweek</span>.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Go play CTA */}
            <button
              onClick={() => window.location.href = '/matchweek'}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 transition-colors text-white font-bold text-sm"
            >
              🏟 Play this matchweek
            </button>
          </div>
        )}

        {/* Account tab */}
        {activeTab === 'account' && (
          <div className="space-y-4">
            <Section title="Edit profile">
              <form onSubmit={handleSaveInfo} className="space-y-3">
                <div>
                  <label className="text-gray-500 text-[11px] mb-1 block tracking-wider">DISPLAY NAME</label>
                  <input
                    value={displayName}
                    onChange={e => { setDisplayName(e.target.value); setInfoMsg(null) }}
                    placeholder="Your name"
                    className={INP}
                  />
                </div>
                <div>
                  <label className="text-gray-500 text-[11px] mb-1 block tracking-wider">EMAIL</label>
                  <input value={profile?.email ?? ''} disabled className={`${INP} opacity-30 cursor-not-allowed`} />
                </div>
                <button type="submit" disabled={savingInfo}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors">
                  {savingInfo ? 'Saving…' : 'Save changes'}
                </button>
                <InlineMsg status={infoMsg} />
              </form>
            </Section>

            <Section title="Change password">
              <form onSubmit={handleChangePw} className="space-y-3">
                <div>
                  <label className="text-gray-500 text-[11px] mb-1 block tracking-wider">CURRENT PASSWORD</label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} value={curPw}
                      onChange={e => { setCurPw(e.target.value); setPwMsg(null) }}
                      placeholder="••••••••" className={`${INP} pr-12`} />
                    <button type="button" onClick={() => setShowPw(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                      {showPw ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-gray-500 text-[11px] mb-1 block tracking-wider">NEW PASSWORD</label>
                  <input type={showPw ? 'text' : 'password'} value={newPw}
                    onChange={e => { setNewPw(e.target.value); setPwMsg(null) }}
                    placeholder="min. 8 characters" className={INP} />
                </div>
                <div>
                  <label className="text-gray-500 text-[11px] mb-1 block tracking-wider">CONFIRM PASSWORD</label>
                  <input type={showPw ? 'text' : 'password'} value={newPw2}
                    onChange={e => { setNewPw2(e.target.value); setPwMsg(null) }}
                    placeholder="repeat new password"
                    className={`${INP} ${newPw2 && newPw !== newPw2 ? 'border-red-500/50' : ''}`} />
                  {newPw2 && newPw !== newPw2 && (
                    <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                  )}
                </div>
                <button type="submit" disabled={savingPw}
                  className="w-full py-3 bg-white/8 hover:bg-white/12 disabled:opacity-50 text-gray-300 rounded-xl text-sm font-semibold transition-colors border border-white/10">
                  {savingPw ? 'Updating…' : 'Update password'}
                </button>
                <InlineMsg status={pwMsg} />
              </form>
            </Section>

            <Section>
              <button onClick={logout}
                className="w-full py-3 bg-red-900/20 hover:bg-red-900/30 border border-red-500/20 text-red-400 rounded-xl text-sm font-semibold transition-colors">
                Sign out
              </button>
            </Section>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
