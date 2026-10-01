interface Props {
  count: number
  target: number
  running: boolean
  onPress: () => void
}

export function KickButton({ count, target, running, onPress }: Props) {
  return (
    <button className="kick-button" onClick={onPress} aria-label="Catat gerakan">
      {running ? `${count}/${target}` : 'Mulai'}
    </button>
  )
}