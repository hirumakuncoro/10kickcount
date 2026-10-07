import { useEffect, useState } from 'react'
import type { Session } from '../domain/session'
import { sessionStore } from '../data/sessionStore'

export function useHistorySessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    sessionStore.getAll().then(all => {
      const sorted = [...all].sort((a, b) => a.date.localeCompare(b.date))
      setSessions(sorted)
      setLoading(false)
    })
  }, [])

  return { sessions, loading }
}
