import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import LeaguesPage from './pages/LeaguesPage'
import LeagueDetailPage from './pages/LeagueDetailPage'
import CreateLeaguePage from './pages/CreateLeaguePage'
import PickSelectionPage from './pages/PickSelectionPage'
import MatchupPage from './pages/MatchupPage'
import EnergyShopPage from './pages/EnergyShopPage'

function RequireAuth({ children }) {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/" element={<RequireAuth><LeaguesPage /></RequireAuth>} />
      <Route path="/leagues/:id" element={<RequireAuth><LeagueDetailPage /></RequireAuth>} />
      <Route path="/picks/:gameweekId" element={<RequireAuth><PickSelectionPage /></RequireAuth>} />
      <Route path="/matchup/:id" element={<RequireAuth><MatchupPage /></RequireAuth>} />
      <Route path="/create-league" element={<RequireAuth><CreateLeaguePage /></RequireAuth>} />
      <Route path="/energy" element={<RequireAuth><EnergyShopPage /></RequireAuth>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
