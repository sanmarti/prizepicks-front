import { useState } from 'react'

function ShieldIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  )
}

export default function LeaguesPage() {
  const [showJoin, setShowJoin] = useState(false)

  return (
    <div className="min-h-screen bg-[#0a0d12] text-white pb-24">
      <div className="max-w-md mx-auto px-4 pt-safe-5">

        {/* Header */}
        <div className="pt-6 pb-4">
          <h1 className="text-white text-2xl font-black">Leagues</h1>
          <p className="text-gray-500 text-sm mt-1">Compete in private leagues with friends</p>
        </div>

        {/* Empty state */}
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
          <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <ShieldIcon />
          </div>
          <div>
            <p className="text-white font-bold text-lg">No leagues yet</p>
            <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
              Create a private league or join one with an invite code. Compete with friends, track payments and share prizes.
            </p>
          </div>

          <div className="w-full space-y-3 pt-2">
            <button
              className="w-full py-3.5 rounded-2xl font-bold text-sm text-white transition-colors"
              style={{ background: 'linear-gradient(90deg,#6366f1,#4f46e5)', boxShadow: '0 4px 20px rgba(99,102,241,0.3)' }}
              onClick={() => {}}
            >
              + Create a league
            </button>
            <button
              className="w-full py-3.5 rounded-2xl font-bold text-sm text-indigo-400 border border-indigo-500/30 bg-indigo-500/8 hover:bg-indigo-500/14 transition-colors"
              onClick={() => setShowJoin(true)}
            >
              Join with a code
            </button>
          </div>
        </div>

        {/* Global league info card */}
        <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-4 mt-2">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🌍</span>
            <div>
              <p className="text-white font-bold text-sm">OddsRivals Global</p>
              <p className="text-gray-500 text-xs">Open league · everyone participates</p>
            </div>
          </div>
          <p className="text-gray-600 text-xs leading-relaxed">
            The global ranking is where all players compete by default through the Sprints & Divisions system. Private leagues run in parallel — you can be in both at the same time.
          </p>
        </div>

      </div>

      {showJoin && <JoinLeagueModal onClose={() => setShowJoin(false)} />}
    </div>
  )
}

function JoinLeagueModal({ onClose }) {
  const [code, setCode] = useState('')

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4 pb-6 sm:pb-0"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-sm bg-[#0d1117] border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-black text-lg">Join a league</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
        </div>
        <p className="text-gray-500 text-sm">Enter the invite code shared by the league admin.</p>
        <input
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. ABCD-1234"
          maxLength={10}
          className="w-full px-4 py-3 rounded-xl text-white text-center text-lg font-mono font-bold tracking-[0.2em] bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-500 placeholder-gray-700 transition-colors"
        />
        <button
          disabled={code.length < 4}
          className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-colors disabled:opacity-40"
          style={{ background: 'linear-gradient(90deg,#6366f1,#4f46e5)' }}
        >
          Join league
        </button>
      </div>
    </div>
  )
}
