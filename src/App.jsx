import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import BottomNav from './components/layout/BottomNav'

import LoginPage             from './pages/LoginPage'
import RegisterPage          from './pages/RegisterPage'
import MatchweekPage         from './pages/MatchweekPage'
import DivisionsPage         from './pages/DivisionsPage'
import ProfilePage           from './pages/ProfilePage'
import UserPublicProfilePage from './pages/UserPublicProfilePage'
import LeaguesPage           from './pages/LeaguesPage'
import LeagueDetailPage      from './pages/LeagueDetailPage'
import ScoresPage            from './pages/ScoresPage'
import MatchupPage           from './pages/MatchupPage'
import OnboardingPage        from './pages/OnboardingPage'

function RequireAuth({ children }) {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return children
}

const NO_NAV_PREFIXES = ['/login', '/register', '/onboarding']

function AppShell() {
  const token = useAuthStore((s) => s.token)
  const { pathname } = useLocation()
  const showNav = !!token && !NO_NAV_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))

  return (
    <>
      <Routes>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/"               element={<RequireAuth><MatchweekPage /></RequireAuth>} />
        <Route path="/matchup"        element={<RequireAuth><MatchupPage /></RequireAuth>} />
        <Route path="/scores"         element={<RequireAuth><ScoresPage /></RequireAuth>} />
        <Route path="/leagues"        element={<RequireAuth><LeaguesPage /></RequireAuth>} />
        <Route path="/leagues/:id"    element={<RequireAuth><LeagueDetailPage /></RequireAuth>} />
        <Route path="/profile"        element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path="/users/:id"      element={<RequireAuth><UserPublicProfilePage /></RequireAuth>} />
        <Route path="/divisions"      element={<RequireAuth><DivisionsPage /></RequireAuth>} />
        <Route path="/onboarding"     element={<RequireAuth><OnboardingPage /></RequireAuth>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {showNav && <BottomNav />}
    </>
  )
}

export default function App() {
  return <AppShell />
}
