interface Props {
  count: number
  target: number
  running: boolean
  onPress: () => void
}

export function KickButton({ count, target, running, onPress }: Props) {
  // Hitung persentase untuk CSS variable ring progress (misal: count 7, target 10 -> 70%)
  const percentage = running ? Math.min((count / target) * 100, 100) : 0;

  return (
    <div className="kick-button-container">
      {running && (
        <div
          className="kick-ring"
          style={{ '--progress': `${percentage}%` } as React.CSSProperties}
        />
      )}
      <button
        className="kick-button"
        onClick={onPress}
        aria-label="Catat gerakan"
      >
        <img src="/foot.svg" alt="" aria-hidden="true" />
        <div className="kick-button-text">
          {running ? `${count}/${target}` : 'Mulai'}
        </div>
      </button>
    </div>
  )
}