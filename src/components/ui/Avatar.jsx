export default function Avatar({ name = '', src, size = 40, className = '', borderColor }) {
  const initial = name.charAt(0).toUpperCase()
  const style = {
    width: size,
    height: size,
    minWidth: size,
    border: borderColor ? `2px solid ${borderColor}` : '2px solid var(--bg-surface2)',
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center overflow-hidden font-syne font-700 ${className}`}
      style={{ ...style, background: 'var(--bg-surface2)', color: 'var(--text-primary)', fontSize: size * 0.4 }}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  )
}
