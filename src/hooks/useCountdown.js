import { useState, useEffect } from 'react'

export function useCountdown(isoTimestamp) {
  const [label, setLabel] = useState('')

  useEffect(() => {
    if (!isoTimestamp) return

    function compute() {
      const diff = new Date(isoTimestamp) - Date.now()
      if (diff <= 0) { setLabel('Locked'); return }
      const totalSecs = Math.floor(diff / 1000)
      const h = Math.floor(totalSecs / 3600)
      const m = Math.floor((totalSecs % 3600) / 60)
      const s = totalSecs % 60
      if (h > 0) setLabel(`${h}h ${m}m`)
      else if (m > 0) setLabel(`${m}m ${s}s`)
      else setLabel(`${s}s`)
    }

    compute()
    const id = setInterval(compute, 1000)
    return () => clearInterval(id)
  }, [isoTimestamp])

  return label
}
