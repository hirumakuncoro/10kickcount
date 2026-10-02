interface Props {
  title: string
  onNo: () => void
  onYes: () => void
}

export function ConfirmSheet({ title, onNo, onYes }: Props) {
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onNo()
    }
  }

  return (
    <div className="sheet-overlay" onClick={handleOverlayClick}>
      <div role="dialog" aria-label={title} className="sheet-content">
        <h3>{title}</h3>
        <div className="sheet-actions">
          <button className="btn-secondary" onClick={onNo}>
            Batal
          </button>
          <button className="btn-primary" onClick={onYes}>
            Ya
          </button>
        </div>
      </div>
    </div>
  )
}
