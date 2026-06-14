import { useEffect, useState } from 'react'

export default function Toast({ message, type = 'success', onDone }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 300)
    }, 2800)
    return () => clearTimeout(t)
  }, [onDone])

  const colors = {
    success: 'var(--accent-green)',
    error: '#f87171',
    info: 'var(--accent-purple)',
  }

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-3 rounded-xl text-sm font-mono transition-all duration-300"
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${colors[type]}`,
        color: colors[type],
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-12px)',
        boxShadow: `0 4px 20px ${colors[type]}30`,
        maxWidth: '90vw',
      }}
    >
      {message}
    </div>
  )
}
