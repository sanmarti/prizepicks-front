import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import OnboardingModal from '../components/onboarding/OnboardingModal'

function getIsDark() {
  const saved = localStorage.getItem('or-theme')
  if (saved) return saved === 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export default function OnboardingPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [isDark, setIsDark] = useState(getIsDark)

  useEffect(() => {
    if (localStorage.getItem('oddsrivals_onboarding_done')) {
      navigate('/', { replace: true })
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = e => setIsDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [navigate])

  function finish() {
    localStorage.setItem('oddsrivals_onboarding_done', '1')
    navigate('/', { replace: true })
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: isDark
        ? 'linear-gradient(160deg, #05080f 0%, #070c14 60%, #040810 100%)'
        : 'linear-gradient(160deg, #f0f4ff 0%, #e8eef8 60%, #edf2fc 100%)',
    }}>
      <OnboardingModal
        onClose={finish}
        onFinish={finish}
        userName={user?.name}
        finalLabel="MAKE YOUR PICKS →"
        finalGreen
        dark={isDark}
      />
    </div>
  )
}
