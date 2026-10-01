const timeFmt = new Intl.DateTimeFormat('id-ID', {
  hour: '2-digit', minute: '2-digit', hour12: false,
})
const dateFmt = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric', month: 'long', year: 'numeric',
})

export const formatTime = (ms: number) => timeFmt.format(ms)
export const formatDate = (ms: number) => dateFmt.format(ms)

export function formatDuration(ms: number) {
  const t = Math.floor(Math.max(0, ms) / 1000)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(Math.floor(t / 3600))}:${p(Math.floor((t % 3600) / 60))}:${p(t % 60)}`
}