import { useCallback, useEffect, useState } from 'react'
import * as d from '../domain/session'
import { sessionStore } from '../data/sessionStore'
import { feedback } from '../device/feedback'

export function useTodaySession() {
  const [session, setSession] = useState<d.Session | null>(null)
  const [now, setNow] = useState(Date.now())
  const active = session?.status === 'active'

  const commit = useCallback(async (next: d.Session) => {
    setSession(next)
    await sessionStore.save(next)
  }, [])

  useEffect(() => {
    sessionStore.getLatest().then(latest => {
      if (!latest) return
      const settled = d.settle(latest)
      if (!d.isCurrent(settled)) return
      setSession(settled)
      if (settled !== latest) sessionStore.save(settled)
    })
  }, [])

  // timer + selesai otomatis 2 jam
  useEffect(() => {
    if (!session || !active) return
    const id = setInterval(() => {
      setNow(Date.now())
      const settled = d.settle(session)
      if (settled !== session) commit(settled)
    }, 1_000)
    return () => clearInterval(id)
  }, [session, active, commit])

  // layar tetap menyala selama sesi
  useEffect(() => {
    if (!active) return
    feedback.keepAwake()
    const onVisible = () =>
      document.visibilityState === 'visible' && feedback.keepAwake()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      feedback.release()
    }
  }, [active])

  return {
    session,
    elapsedMs: session ? now - session.startedAt : 0,
    askConfirm: !!session && d.needsConfirm(session),

    start: () => {
      if (session?.date === d.todayKey()) return // 1 sesi/hari: hapus dulu kalau mau ulang
      feedback.tap()
      commit(d.newSession())
    },
    press: () => {
      if (!session) return
      const next = d.tap(session)
      if (next === session) return
      if (next.status === 'active') {
        next.kicks.length >= d.TARGET ? feedback.complete() : feedback.tap()
      }
      commit(next)
    },
    undo: () => session && commit(d.undo(session)),
    confirm: () => session && commit(d.confirmDone(session)),
    remove: async () => {
      if (session) await sessionStore.remove(session.date)
      setSession(null)
    },
  }
}