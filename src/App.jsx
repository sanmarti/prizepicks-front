import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { getMyRelevantSprints } from './api/glory'
import SprintClosingPopup from './components/SprintClosingPopup'
import BottomNav from './components/layout/BottomNav'

import LoginPage              from './pages/LoginPage'
import RegisterPage           from './pages/RegisterPage'
import MatchweekPage          from './pages/MatchweekPage'
import MySprintsPage          from './pages/MySprintsPage'
import DivisionsPage          from './pages/DivisionsPage'
import ProfilePage            from './pages/ProfilePage'
import UserPublicProfilePage  from './pages/UserPublicProfilePage'
import EnergyStorePage        from './pages/EnergyStorePage'
import ScoresPage             from './pages/ScoresPage'
import OnboardingPage        from './pages/OnboardingPage'

function RequireAuth({ children }) {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return children
}

const popupSeenKey = (id) => `sprint-popup-seen-${id}`

function SprintPopupController() {
  const [pendingSprint, setPendingSprint]   = useState(null)
  const [nextSprint,    setNextSprint]      = useState(null)
  const token = useAuthStore((s) => s.token)

  useEffect(() => {
    if (!token) return
    getMyRelevantSprints().then(res => {
      const sprints = res.data?.past ?? []
      // Find oldest completed sprint without popup seen (server flag or localStorage guard)
      const unseen = sprints
        .filter(s =>
          s.status === 'completed' &&
          s.closing_popup_seen_at == null &&
          s.sprint_outcome && s.sprint_outcome !== 'pending' &&
          !localStorage.getItem(popupSeenKey(s.id))
        )
        .sort((a, b) => new Date(a.end_date) - new Date(b.end_date))
      if (unseen.length === 0) return

      // Mark locally immediately so re-opening the app never shows it again
      localStorage.setItem(popupSeenKey(unseen[0].id), '1')

      setPendingSprint(unseen[0])

      // Find the next live/scheduled sprint after this completed one as the welcome sprint
      const next = sprints.find(s => s.status === 'live' || s.status === 'scheduled')
      setNextSprint(next ?? null)
    }).catch(() => {})
  }, [token])

  if (!pendingSprint) return null

  return (
    <SprintClosingPopup
      sprint={pendingSprint}
      nextSprint={nextSprint}
      onDismiss={() => setPendingSprint(null)}
    />
  )
}

const NO_NAV_PREFIXES = ['/login', '/register', '/onboarding']

function AppShell() {
  const token = useAuthStore((s) => s.token)
  const { pathname } = useLocation()
  const showNav = !!token && !NO_NAV_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))

  return (
    <>
      {token && <SprintPopupController />}
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

        <Route path="/onboarding" element={<RequireAuth><OnboardingPage /></RequireAuth>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {showNav && <BottomNav />}
    </>
  )
}

export default function App() {
  return <AppShell />
}
