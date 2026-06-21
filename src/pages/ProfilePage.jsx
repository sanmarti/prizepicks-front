import { useEffect, useRef, useState } from 'react'
import { getProfile, updateProfile, changePassword } from '../api/users'
import { getGloryProfile, getGloryStatus } from '../api/glory'
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

function Stat({ label, value, color = 'text-white' }) {
  return (
    <div className="flex-1 bg-white/4 rounded-2xl p-3 text-center">
      <p className={`font-black text-xl ${color}`}>{value ?? '—'}</p>
      <p className="text-gray-600 text-[10px] mt-0.5 leading-tight">{label}</p>
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
  const [activeTab,    setActiveTab]    = useState('stats') // stats | badges | history | account

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
        <div className="flex gap-1 bg-white/3 border border-white/8 rounded-2xl p-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${
                activeTab === t.id ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Stats tab */}
        {activeTab === 'stats' && (
          <div className="space-y-4">
            <Section title="Lifetime stats">
              <div className="flex gap-2 mb-3">
                <Stat label="League Points" value={stats?.lifetime_lp ?? 0} color="text-indigo-400" />
                <Stat label="Correct picks" value={stats?.lifetime_correct ?? 0} color="text-green-400" />
                <Stat label="Accuracy" value={`${stats?.accuracy_pct ?? 0}%`} color="text-white" />
              </div>
              <div className="flex gap-2">
                <Stat label="Perfect weeks" value={stats?.total_perfect_weeks ?? 0} color="text-yellow-400" />
                <Stat label="Sprints played" value={stats?.sprints_played ?? 0} color="text-white" />
              </div>
            </Section>

            {glory?.highest_division && (
              <Section title="Best division reached">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{glory.highest_division.icon}</span>
                  <div>
                    <p className="text-white font-semibold">{glory.highest_division.name}</p>
                    <p className="text-gray-500 text-sm">Personal best</p>
                  </div>
                </div>
              </Section>
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
