import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import OnboardingModal from '../components/onboarding/OnboardingModal'

export default function OnboardingPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (localStorage.getItem('oddsrivals_onboarding_done')) {
      navigate('/', { replace: true })
    }
  }, [navigate])

  function finish() {
    localStorage.setItem('oddsrivals_onboarding_done', '1')
    navigate('/', { replace: true })
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #05080f 0%, #070c14 60%, #040810 100%)',
    }}>
      <OnboardingModal
        onClose={finish}
        onFinish={finish}
        userName={user?.name}
        finalLabel="MAKE YOUR PICKS →"
        finalGreen
      />
    </div>
  )
}
