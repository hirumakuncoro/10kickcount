let ctx: AudioContext | null = null
let muted = false
let lock: WakeLockSentinel | null = null

function beep(freq: number, ms: number, vol = 0.4) {
  if (muted) return
  ctx ??= new AudioContext()
  if (ctx.state === 'suspended') ctx.resume()
  const t = ctx.currentTime + 0.03
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000)
  osc.connect(gain).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + ms / 1000)
}

export const feedback = {
  tap() { navigator.vibrate?.(30); beep(520, 90) },
  complete() { navigator.vibrate?.([60, 40, 60]); beep(780, 250) },
  setMuted(v: boolean) { muted = v },
  async keepAwake() {
    try { lock = await navigator.wakeLock.request('screen') } catch { /* tidak didukung / ditolak */ }
  },
  release() { lock?.release(); lock = null },
}