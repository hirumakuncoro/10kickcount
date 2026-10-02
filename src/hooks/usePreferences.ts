import { useState, useCallback, useEffect } from 'react'
import { feedback } from '../device/feedback'

export function usePreferences() {
  const [muted, setMutedState] = useState(() => localStorage.getItem('kc-muted') === '1')

  useEffect(() => {
    feedback.setMuted(muted)
  }, [muted])

  const toggleMuted = useCallback(() => {
    setMutedState(m => {
      const next = !m
      localStorage.setItem('kc-muted', next ? '1' : '0')
      feedback.setMuted(next)
      return next
    })
  }, [])

  return { muted, toggleMuted }
}
