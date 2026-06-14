import Avatar from '../ui/Avatar'

const RANK_COLORS = { 1: '#f5c518', 2: '#9ca3af', 3: '#cd7f32' }

function RankHex({ rank }) {
  const color = RANK_COLORS[rank] ?? 'var(--bg-surface2)'
  return (
    <div
      className="flex items-center justify-center font-syne font-700 text-sm"
      style={{
        width: 28,
        height: 28,
        background: color,
        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        color: rank <= 3 ? '#000' : 'var(--text-primary)',
        fontSize: 11,
      }}
    >
      {rank}
    </div>
  )
}

function LastThree({ results = [] }) {
  const colors = { W: '#39e07b', L: '#f87171', D: '#fb923c' }
  return (
    <div className="flex gap-1">
      {results.slice(0, 3).map((r, i) => (
        <span
          key={i}
          className="text-[10px] font-mono px-1.5 py-0.5 rounded"
          style={{ background: `${colors[r]}22`, color: colors[r] }}
        >
          {r}
        </span>
      ))}
    </div>
  )
}

export default function StandingsTable({ standings = [], playoffLine, currentUserId }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
        <thead>
          <tr style={{ color: 'var(--text-muted)' }}>
            <th className="py-2 px-2 text-left font-normal">RANK</th>
            <th className="py-2 px-2 text-left font-normal">PLAYER</th>
            <th className="py-2 px-2 text-center font-normal">RECORD</th>
            <th className="py-2 px-2 text-center font-normal">PTS</th>
            <th className="py-2 px-2 text-center font-normal">LAST 3</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, idx) => {
            const isUser = row.userId === currentUserId
            const isPlayoffBoundary = playoffLine && row.rank === playoffLine

            return (
              <>
                {isPlayoffBoundary && (
                  <tr key={`playoff-line-${idx}`}>
                    <td colSpan={5} className="py-1 px-2">
                      <div
                        className="w-full border-t text-[9px] text-center pt-1"
                        style={{
                          borderColor: 'var(--accent-purple)',
                          borderStyle: 'dashed',
                          color: 'var(--accent-purple)',
                        }}
                      >
                        PLAYOFF LINE
                      </div>
                    </td>
                  </tr>
                )}
                <tr
                  key={row.userId ?? idx}
                  className="transition-colors"
                  style={
                    isUser
                      ? {
                          outline: '1px solid var(--accent-green)',
                          borderRadius: 8,
                          color: 'var(--accent-green)',
                        }
                      : { color: 'var(--text-primary)' }
                  }
                >
                  <td className="py-2 px-2">
                    <RankHex rank={row.rank} />
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-2">
                      <Avatar name={row.name} size={28} />
                      <div>
                        <p className="font-syne font-500 text-xs leading-tight">{row.name}</p>
                        {row.teamName && (
                          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            {row.teamName}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-2 px-2 text-center" style={{ color: 'var(--text-secondary)' }}>
                    {row.wins ?? 0}-{row.losses ?? 0}-{row.draws ?? 0}
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span className="font-syne font-700" style={{ color: isUser ? 'var(--accent-green)' : 'var(--accent-purple)' }}>
                      {row.points ?? 0}
                    </span>
                  </td>
                  <td className="py-2 px-2">
                    <LastThree results={row.lastThree ?? []} />
                  </td>
                </tr>
              </>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
