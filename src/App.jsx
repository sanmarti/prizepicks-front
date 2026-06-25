import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

import LoginPage              from './pages/LoginPage'
import RegisterPage           from './pages/RegisterPage'
import MatchweekPage          from './pages/MatchweekPage'
import MySprintsPage          from './pages/MySprintsPage'
import DivisionsPage          from './pages/DivisionsPage'
import ProfilePage            from './pages/ProfilePage'
import UserPublicProfilePage  from './pages/UserPublicProfilePage'
import EnergyStorePage        from './pages/EnergyStorePage'
import ScoresPage             from './pages/ScoresPage'
import AdminPage              from './pages/AdminPage'
import AdminEnergyPacksPage  from './pages/AdminEnergyPacksPage'

function RequireAuth({ children }) {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/"          element={<RequireAuth><MatchweekPage /></RequireAuth>} />
      <Route path="/sprints"   element={<RequireAuth><MySprintsPage /></RequireAuth>} />
      <Route path="/divisions" element={<RequireAuth><DivisionsPage /></RequireAuth>} />
      <Route path="/store"     element={<RequireAuth><EnergyStorePage /></RequireAuth>} />
      <Route path="/scores"    element={<RequireAuth><ScoresPage /></RequireAuth>} />
      <Route path="/profile"   element={<RequireAuth><ProfilePage /></RequireAuth>} />
      <Route path="/users/:id" element={<RequireAuth><UserPublicProfilePage /></RequireAuth>} />

      <Route path="/admin"               element={<AdminPage />} />
      <Route path="/admin/energy-packs" element={<AdminEnergyPacksPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
