import { useMemo } from 'react'

const STATUS_WEIGHT = {
  WON: 1.0,
  LIVE_FAVORABLE: 0.75,
  LIVE_NEUTRAL: 0.5,
  LIVE_RISK: 0.25,
  SLEEPING: 0.4,
  LOST: 0.0,
}

export function useMatchupProjection(picks = []) {
  return useMemo(() => {
    const projected_score = picks.reduce(
      (sum, p) => sum + (STATUS_WEIGHT[p.status] ?? 0),
      0
    )

    let outlook = 'EVEN'
    if (projected_score >= picks.length * 0.7) outlook = 'STRONG EDGE'
    else if (projected_score >= picks.length * 0.55) outlook = 'SLIGHT EDGE'
    else if (projected_score <= picks.length * 0.3) outlook = 'AT RISK'

    return { projected_score: parseFloat(projected_score.toFixed(2)), outlook }
  }, [picks])
}
