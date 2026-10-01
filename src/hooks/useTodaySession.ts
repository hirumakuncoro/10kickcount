import { useCallback, useEffect, useState } from 'react'
import * as d from '../domain/session'
import { sessionStore } from '../data/sessionStore'
import { feedback } from '../device/feedback'

export function useTodaySession() {
  const [session, setSession] = useState<d.Session | null>(null)
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

  // selesai otomatis 2 jam
  useEffect(() => {
    if (!session || !active) return

    const remaining = d.LIMIT_MS - (Date.now() - session.startedAt)
    if (remaining <= 0) {
      commit(d.settle(session))
      return
    }

    const id = setTimeout(() => {
      commit(d.settle(session))
    }, remaining)

    // Handle visibility changes in case device slept through timeout
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        const settled = d.settle(session)
        if (settled !== session) commit(settled)
      }
    }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      clearTimeout(id)
      document.removeEventListener('visibilitychange', onVis)
    }
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

  const start = useCallback(() => {
    if (session?.date === d.todayKey()) return
    feedback.tap()
    commit(d.newSession())
  }, [session?.date, commit])

  const press = useCallback(() => {
    if (!session) return
    const next = d.tap(session)
    if (next === session) return
    if (next.status === 'active') {
      next.kicks.length >= d.TARGET ? feedback.complete() : feedback.tap()
    }
    commit(next)
  }, [session, commit])

  const undo = useCallback(() => {
    if (session) commit(d.undo(session))
  }, [session, commit])

  const confirm = useCallback(() => {
    if (session) commit(d.confirmDone(session))
  }, [session, commit])

  const remove = useCallback(async () => {
    if (session) await sessionStore.remove(session.date)
    setSession(null)
  }, [session?.date])

  return {
    session,
    askConfirm: !!session && d.needsConfirm(session),
    start,
    press,
    undo,
    confirm,
    remove,
  }
}