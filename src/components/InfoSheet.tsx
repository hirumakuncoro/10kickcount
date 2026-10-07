import { GitBranch, History, X } from 'lucide-react'

interface Props {
  onClose: () => void
  onHistory: () => void
}

export function InfoSheet({ onClose, onHistory }: Props) {
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }

  return (
    <div
      className="sheet-overlay"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
    >
      <div role="dialog" aria-label="Informasi aplikasi" className="sheet-content info-sheet-content">
        <div className="info-sheet-header">
          <h3>Baby Kick Count</h3>
          <button
            className="info-sheet-close"
            onClick={onClose}
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
        </div>

        <p className="info-sheet-desc">
          Pencatat gerakan bayi harian.
        </p>

        <ol className="info-sheet-steps">
          <li>Tekan tombol untuk mulai sesi.</li>
          <li>Tekan setiap kali bayi bergerak.</li>
          <li>Sesi selesai di gerakan ke-10, atau otomatis setelah 2 jam.</li>
          <li>Satu sesi per hari. Hasil bisa dibagikan ke WhatsApp.</li>
        </ol>

        <div className="sheet-actions">
          <a
            className="btn-secondary info-sheet-btn"
            href="https://github.com/hirumakuncoro/10kickcount"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GitBranch size={18} />
            GitHub
          </a>
          <button
            className="btn-primary info-sheet-btn"
            onClick={() => { onClose(); onHistory() }}
          >
            <History size={18} />
            Riwayat
          </button>
        </div>
      </div>
    </div>
  )
}
