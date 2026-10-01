import { useEffect, useState } from 'react'
import { formatDuration } from '../lib/format'

interface Props {
  startedAt: number
  limitMs: number
}

export function Timer({ startedAt, limitMs }: Props) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const elapsed = Math.min(now - startedAt, limitMs)
  return <time>{formatDuration(elapsed)}</time>
}