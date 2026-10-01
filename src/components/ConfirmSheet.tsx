interface Props { onNo: () => void; onYes: () => void }

export function ConfirmSheet({ onNo, onYes }: Props) {
  return (
    <div role="dialog" aria-label="Selesai?" className="confirm-sheet">
      <p>Selesai?</p>
      <button onClick={onNo}>Belum</button>
      <button onClick={onYes}>Ya</button>
    </div>
  )
}