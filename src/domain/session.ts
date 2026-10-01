export interface Session {
  date: string
  startedAt: number
  endedAt?: number 
  kicks: number[]
  note?: string
  status: 'active' | 'done'
}

export const TARGET = 10
export const LIMIT_MS = 2 * 60 * 60 * 1000

/**
 * Kunci hari kalender LOKAL (YYYY-MM-DD).
 * Locale 'sv-SE' dipakai karena formatnya ISO 8601; bukan soal Swedia.
 * Sengaja tidak pakai toISOString() karena itu UTC (bisa meleset sehari).
 */
export const todayKey = () => new Date().toLocaleDateString('sv-SE')

export const newSession = (now = Date.now()): Session =>
  ({ date: todayKey(), startedAt: now, kicks: [], status: 'active' })

export function settle(s: Session, now = Date.now()): Session {
  if (s.status !== 'active' || now - s.startedAt < LIMIT_MS) return s
  return { ...s, status: 'done', endedAt: s.startedAt + LIMIT_MS }
}

export function tap(s: Session, now = Date.now()): Session {
  s = settle(s, now)
  if (s.status !== 'active' || s.kicks.length >= TARGET) return s
  return { ...s, kicks: [...s.kicks, now] }
}

export const undo = (s: Session): Session =>
  s.status === 'active' ? { ...s, kicks: s.kicks.slice(0, -1) } : s

export const needsConfirm = (s: Session) =>
  s.status === 'active' && s.kicks.length >= TARGET

export const confirmDone = (s: Session): Session =>
  ({ ...s, status: 'done', endedAt: s.kicks[TARGET - 1] })

// sesi yang boleh dianggap "sesi saat ini": hari ini, atau masih berjalan (lewat tengah malam)
export const isCurrent = (s: Session, today = todayKey()) =>
  s.date === today || s.status === 'active'