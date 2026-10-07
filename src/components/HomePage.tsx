import { useState } from 'react'
import { Volume2, VolumeX, Info, RotateCcw } from 'lucide-react'
import { LIMIT_MS, TARGET } from '../domain/session'
import { useTodaySession } from '../hooks/useTodaySession'
import { usePreferences } from '../hooks/usePreferences'
import { formatDuration, formatTime } from '../lib/format'
import { shareToWhatsApp } from '../lib/share'
import { KickButton } from './KickButton'
import { ConfirmSheet } from './ConfirmSheet'
import { InfoSheet } from './InfoSheet'
import { Timer } from './Timer'

interface Props {
  onNavigate: (page: 'home' | 'history') => void
}

export function HomePage({ onNavigate }: Props) {
  const s = useTodaySession()
  const { muted, toggleMuted } = usePreferences()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  const x = s.session
  const running = x?.status === 'active'
  const done = x?.status === 'done'

  return (
    <>
      <header>
        <div>
          <img src="/foot.svg" alt="" aria-hidden="true" />
          Baby Kick Count
        </div>
      </header>

      <main>
        {running ? <div className="status-text">Sesi berjalan</div> : null}
        {running && x ? <Timer startedAt={x.startedAt} limitMs={LIMIT_MS} /> : null}

        {!done ? (
          <KickButton
            count={x?.kicks.length ?? 0}
            target={TARGET}
            running={running}
            onPress={running ? s.press : s.start}
          />
        ) : null}

        {done && x ? (
          <section className="summary-card">
            <h2>{x.kicks.length}/{TARGET}</h2>
            <p>{formatTime(x.startedAt)} – {formatTime(x.endedAt ?? x.startedAt)}</p>
            <p>Durasi: {formatDuration((x.endedAt ?? x.startedAt) - x.startedAt)}</p>
            <button className="btn-primary" onClick={() => shareToWhatsApp(x)}>Bagikan ke WhatsApp</button>
            <button
              className="btn-secondary"
              onClick={() => setShowDeleteConfirm(true)}
              style={{ marginTop: '16px' }}
            >
              Hapus sesi
            </button>
          </section>
        ) : null}

        {s.askConfirm ? (
          <ConfirmSheet
            title="Selesai?"
            onNo={s.undo}
            onYes={s.confirm}
          />
        ) : null}

        {showDeleteConfirm ? (
          <ConfirmSheet
            title="Hapus sesi hari ini?"
            onNo={() => setShowDeleteConfirm(false)}
            onYes={() => {
              setShowDeleteConfirm(false)
              s.remove()
            }}
          />
        ) : null}

        {showInfo ? (
          <InfoSheet
            onClose={() => setShowInfo(false)}
            onHistory={() => onNavigate('history')}
          />
        ) : null}
      </main>

      <footer>
        <div className="footer-links">
          <button onClick={toggleMuted} title={muted ? 'Hidupkan suara' : 'Matikan suara'} aria-label={muted ? 'Hidupkan suara' : 'Matikan suara'}>
            {muted ? <VolumeX size={24} /> : <Volume2 size={24} />}
          </button>
          <button onClick={() => setShowInfo(true)} title="Informasi" aria-label="Informasi">
            <Info size={24} />
          </button>
          {running ? (
            <button className="btn-secondary" onClick={s.undo} title="Batalkan gerakan terakhir" aria-label="Undo">
              <RotateCcw size={20} />
              <span>Undo</span>
            </button>
          ) : null}
        </div>
      </footer>
    </>
  )
}
