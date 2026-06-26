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

function AvatarPicker({ src, name, uploading, onFile }) {
  const ref = useRef()
  const initial = (name || '?')[0].toUpperCase()
  return (
    <div className="relative w-20 h-20 flex-shrink-0">
      <div
        onClick={() => !uploading && ref.current.click()}
        className="w-20 h-20 rounded-full border-2 border-indigo-500 overflow-hidden cursor-pointer relative group"
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
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files[0]) onFile(e.target.files[0]); e.target.value = '' }} />
    </div>
  )
}

const OUTCOME_ICON = { promoted: '⬆', retained: '=', relegated: '⬇', pending: '⏳' }
const OUTCOME_COLOR = { promoted: 'text-green-400', retained: 'text-gray-400', relegated: 'text-red-400', pending: 'text-indigo-400' }

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
            {/* Battery visual */}
            <div className={`relative flex flex-col justify-end gap-[3px] p-2 rounded-xl border ${
              hasPurchased ? 'bg-yellow-400/8 border-yellow-400/20' : 'bg-white/3 border-white/8'
            }`} style={{ width: 34, height: 50 }}>
              {[1,2,3,4].map(i => (
                <div key={i} className={`w-full rounded-sm ${
                  hasPurchased && i <= Math.max(1, Math.ceil((Math.min(walletBalance, 100) / 100) * 4))
                    ? 'bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.8)]'
                    : 'bg-white/8'
                }`} style={{ height: 7 }} />
              ))}
              <div className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-1.5 rounded-t-sm ${
                hasPurchased ? 'bg-yellow-400/50' : 'bg-white/12'
              }`} />
            </div>
          </div>

          {/* Rules pills */}
          <div className="space-y-2 mb-5">
            <div className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 border ${
              hasPurchased ? 'bg-purple-500/10 border-purple-500/20' : 'bg-white/4 border-white/6'
            }`}>
              <span className="text-base flex-shrink-0">♾️</span>
              <div>
                <p className={`text-xs font-semibold ${hasPurchased ? 'text-purple-200' : 'text-white'}`}>Never expires</p>
                <p className={`text-[11px] ${hasPurchased ? 'text-purple-400/70' : 'text-gray-500'}`}>Your bonus energy stays in your wallet until you use it</p>
              </div>
            </div>
            <div className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 border ${
              hasPurchased ? 'bg-violet-500/10 border-violet-500/20' : 'bg-white/4 border-white/6'
            }`}>
              <span className="text-base flex-shrink-0">📅</span>
              <div>
                <p className={`text-xs font-semibold ${hasPurchased ? 'text-violet-200' : 'text-white'}`}>Any matchweek, any time</p>
                <p className={`text-[11px] ${hasPurchased ? 'text-violet-400/70' : 'text-gray-500'}`}>Use it whenever you want — no deadline or restriction</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 border border-yellow-400/25 bg-yellow-400/8">
              <span className="text-base flex-shrink-0">⚡</span>
              <div>
                <p className="text-yellow-300 text-xs font-semibold">Max 5 bonus units per matchweek</p>
                <p className="text-yellow-500/70 text-[11px]">On top of your 25 base energy · used first from your wallet</p>
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
                <p className="text-3xl mb-2">🛒</p>
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
  const sprintsInDiv = glory?.sprint_history?.filter(s => s.division_name === div?.division_name).length ?? 0

  const TABS = [
    { id: 'stats',   label: 'Stats' },
    { id: 'badges',  label: 'Badges' },
    { id: 'history', label: 'History' },
    { id: 'wallet',  label: 'Wallet' },
    { id: 'account', label: 'Account' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0d12] text-white pb-24">
      <div className="max-w-md mx-auto px-4 pt-5 space-y-4">

        {/* Hero */}
        <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-4">
          <div className="flex items-center gap-4 mb-4">
            <AvatarPicker src={avatarSrc} name={shownName} uploading={uploadingAv} onFile={handleAvatarFile} />
            <div className="min-w-0 flex-1">
              <p className="text-white font-bold text-xl truncate">{shownName}</p>
              <p className="text-gray-500 text-xs truncate">{profile?.email}</p>
              {div && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-lg">{div.icon}</span>
                  <span className="text-gray-300 text-sm">{div.division_name}</span>
                  {sprintsInDiv > 0 && (
                    <span className="text-gray-600 text-xs">· {sprintsInDiv} sprint{sprintsInDiv > 1 ? 's' : ''}</span>
                  )}
                </div>
              )}
            </div>
          </div>
          <InlineMsg status={avatarMsg} />

          {/* Current sprint mini */}
          {sprint && prog && (
            <div className="bg-white/4 rounded-xl px-3 py-2 flex items-center justify-between mt-2">
              <p className="text-gray-400 text-xs">{sprint.name}</p>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-indigo-400 font-bold">{prog.total_league_points} LP</span>
                <span className="text-gray-600">{prog.total_correct_picks} correct</span>
                {prog.perfect_weeks > 0 && <span className="text-yellow-400">{prog.perfect_weeks}⭐</span>}
              </div>
            </div>
          )}
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
            {/* Hero stat — League Points */}
            <StatCard
              label="League Points" value={stats?.lifetime_lp ?? 0} icon="⚡" sub="lifetime"
              gradient="bg-gradient-to-br from-indigo-950 via-violet-900/70 to-indigo-950"
              glow="shadow-[0_0_32px_-6px_rgba(99,102,241,0.5)]"
              border="border-indigo-500/25" textColor="text-indigo-300"
            />

            {/* Row — Correct picks + Accuracy */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Correct picks" value={stats?.lifetime_correct ?? 0} icon="🎯"
                gradient="bg-gradient-to-br from-emerald-950 via-green-900/60 to-emerald-950"
                glow="shadow-[0_0_28px_-6px_rgba(52,211,153,0.45)]"
                border="border-emerald-500/25" textColor="text-emerald-300"
              />
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-amber-950 via-orange-900/60 to-amber-950 shadow-[0_0_28px_-6px_rgba(245,158,11,0.4)] border border-amber-500/25">
                <div className="relative p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xl">📊</span>
                  </div>
                  <p className="font-black text-3xl leading-none mb-1 text-amber-300">{stats?.accuracy_pct ?? 0}%</p>
                  <p className="text-white/40 text-[11px] font-medium mb-2">Accuracy</p>
                  {/* Mini bar */}
                  <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400"
                      style={{ width: `${stats?.accuracy_pct ?? 0}%`, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Row — Perfect weeks + Sprints played */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Perfect weeks" value={stats?.total_perfect_weeks ?? 0} icon="⭐"
                gradient="bg-gradient-to-br from-yellow-950 via-amber-900/60 to-yellow-950"
                glow="shadow-[0_0_28px_-6px_rgba(250,204,21,0.4)]"
                border="border-yellow-500/25" textColor="text-yellow-300"
              />
              <StatCard
                label="Sprints played" value={stats?.sprints_played ?? 0} icon="🏁"
                gradient="bg-gradient-to-br from-sky-950 via-blue-900/60 to-sky-950"
                glow="shadow-[0_0_28px_-6px_rgba(56,189,248,0.35)]"
                border="border-sky-500/25" textColor="text-sky-300"
              />
            </div>

            {/* Best division */}
            {glory?.highest_division && (
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-purple-950 via-fuchsia-900/50 to-purple-950 border border-purple-500/25 shadow-[0_0_28px_-6px_rgba(168,85,247,0.4)]">
                <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full blur-3xl bg-purple-500/20 pointer-events-none" />
                <div className="relative flex items-center gap-4 p-4">
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-3xl flex-shrink-0">
                    {glory.highest_division.icon}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400 mb-0.5">Personal best</p>
                    <p className="text-white font-black text-lg leading-tight">{glory.highest_division.name}</p>
                    <p className="text-purple-300/60 text-xs mt-0.5">Highest division reached</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Badges tab */}
        {activeTab === 'badges' && (
          <Section title={`Badges (${glory?.badges?.length ?? 0})`}>
            {(!glory?.badges?.length) ? (
              <div className="text-center py-8">
                <p className="text-4xl mb-2">🏅</p>
                <p className="text-gray-500 text-sm">No badges yet</p>
                <p className="text-gray-700 text-xs mt-1">Earn them by playing and competing</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {glory.badges.map((b, i) => (
                  <div key={i} className="bg-white/4 rounded-2xl p-3 flex items-center gap-2.5">
                    <span className="text-2xl flex-shrink-0">{b.icon}</span>
                    <div className="min-w-0">
                      <p className="text-white text-xs font-semibold truncate">{b.name}</p>
                      <p className="text-gray-600 text-[10px]">{new Date(b.earned_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* History tab */}
        {activeTab === 'history' && (
          <Section title="Sprint history">
            {(!glory?.sprint_history?.length) ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No completed sprints yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {glory.sprint_history.map((s, i) => (
                  <div key={i} className="flex items-center justify-between bg-white/4 rounded-xl px-3 py-2.5">
                    <div>
                      <p className="text-white text-xs font-semibold">{s.sprint_name}</p>
                      <p className="text-gray-600 text-[10px]">
                        {s.division_icon} {s.division_name || '—'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-indigo-400 font-bold">{s.total_league_points} LP</span>
                      {s.sprint_outcome && (
                        <span className={OUTCOME_COLOR[s.sprint_outcome] || 'text-gray-500'}>
                          {OUTCOME_ICON[s.sprint_outcome]}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
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
