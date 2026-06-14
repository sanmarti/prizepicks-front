export default function Spinner({ size = 24 }) {
  return (
    <div
      className="inline-block rounded-full border-2 border-t-transparent animate-spin"
      style={{
        width: size,
        height: size,
        borderColor: 'var(--accent-purple)',
        borderTopColor: 'transparent',
      }}
    />
  )
}
