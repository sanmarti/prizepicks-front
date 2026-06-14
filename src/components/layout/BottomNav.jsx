import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/',          icon: '🏆', label: 'Leagues' },
  { to: '/matchup/1', icon: '⚔️',  label: 'Matchup' },
  { to: '/picks/1',   icon: '📋', label: 'Picks' },
  { to: '/?live=1',   icon: '📡', label: 'Live',    dot: true },
  { to: '/profile',   icon: '👤', label: 'Profile' },
]

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center"
      style={{
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--bg-surface2)',
        height: 64,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-mono transition-colors ${
              isActive ? 'text-[var(--accent-purple)]' : 'text-[var(--text-muted)]'
            }`
          }
        >
          <div className="relative text-lg leading-none">
            {tab.icon}
            {tab.dot && (
              <span
                className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full"
                style={{ background: '#f87171' }}
              />
            )}
          </div>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
