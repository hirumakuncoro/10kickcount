import { TARGET, type Session } from '../domain/session'
import { formatDate, formatDuration, formatTime } from './format'

export function shareToWhatsApp(s: Session) {
  const end = s.endedAt ?? s.startedAt
  const text =
    `${formatDate(s.startedAt)}\n` +
    `Gerakan: ${s.kicks.length}/${TARGET}\n` +
    `Mulai ${formatTime(s.startedAt)} · Selesai ${formatTime(end)}\n` +
    `Durasi ${formatDuration(end - s.startedAt)}`
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
}