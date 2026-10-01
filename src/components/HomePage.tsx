import { LIMIT_MS, TARGET } from '../domain/session'
import { useTodaySession } from '../hooks/useTodaySession'
import { formatDuration, formatTime } from '../lib/format'
import { shareToWhatsApp } from '../lib/share'
import { KickButton } from './KickButton'
import { ConfirmSheet } from './ConfirmSheet'
import { Timer } from './Timer'

export function HomePage() {
  const s = useTodaySession()
  const x = s.session
  const running = x?.status === 'active'
  const done = x?.status === 'done'

  return (
    <main>
      {running ? <p>Sesi berjalan</p> : null}
      {running && x ? <Timer startedAt={x.startedAt} limitMs={LIMIT_MS} /> : null}

      {!done ? (
        <KickButton
          count={x?.kicks.length ?? 0}
          target={TARGET}
          running={running}
          onPress={running ? s.press : s.start}
        />
      ) : null}

      {running ? <button onClick={s.undo}>Undo</button> : null}
      {s.askConfirm ? <ConfirmSheet onNo={s.undo} onYes={s.confirm} /> : null}

      {done && x ? (
        <section>
          <p>{x.kicks.length}/{TARGET}</p>
          <p>{formatTime(x.startedAt)} – {formatTime(x.endedAt ?? x.startedAt)}</p>
          <p>{formatDuration((x.endedAt ?? x.startedAt) - x.startedAt)}</p>
          <button onClick={() => shareToWhatsApp(x)}>Bagikan ke WhatsApp</button>
        </section>
      ) : null}

      {x ? <button onClick={s.remove}>Hapus sesi</button> : null}
    </main>
  )
}