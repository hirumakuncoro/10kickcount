import { LIMIT_MS, TARGET } from '../domain/session'
import { useTodaySession } from '../hooks/useTodaySession'
import { formatDuration, formatTime } from '../lib/format'
import { shareToWhatsApp } from '../lib/share'
import { KickButton } from './KickButton'
import { ConfirmSheet } from './ConfirmSheet'

export function HomePage() {
  const s = useTodaySession()
  const x = s.session
  const running = x?.status === 'active'
  const done = x?.status === 'done'

  return (
    <main>
      {running && <p>Sesi berjalan</p>}
      {running && <time>{formatDuration(Math.min(s.elapsedMs, LIMIT_MS))}</time>}

      {!done && (
        <KickButton
          count={x?.kicks.length ?? 0}
          target={TARGET}
          running={running}
          onPress={running ? s.press : s.start}
        />
      )}

      {running && <button onClick={s.undo}>Undo</button>}
      {s.askConfirm && <ConfirmSheet onNo={s.undo} onYes={s.confirm} />}

      {done && x && (
        <section>
          <p>{x.kicks.length}/{TARGET}</p>
          <p>{formatTime(x.startedAt)} – {formatTime(x.endedAt ?? x.startedAt)}</p>
          <p>{formatDuration((x.endedAt ?? x.startedAt) - x.startedAt)}</p>
          <button onClick={() => shareToWhatsApp(x)}>Bagikan ke WhatsApp</button>
        </section>
      )}

      {x && <button onClick={s.remove}>Hapus sesi</button>}
    </main>
  )
}