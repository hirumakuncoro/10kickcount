import { useRef, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { TARGET, LIMIT_MS } from '../domain/session'
import { useHistorySessions } from '../hooks/useHistorySessions'
import { formatDuration } from '../lib/format'

const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

function shortDate(dateStr: string) {
  const [, m, d] = dateStr.split('-')
  return `${parseInt(d)}/${parseInt(m)}`
}

function dayLabel(dateStr: string) {
  const day = new Date(dateStr + 'T00:00:00').getDay()
  return DAY_LABELS[day]
}

function durationMin(startedAt: number, endedAt: number | undefined): string {
  if (!endedAt) return '—'
  const mins = Math.round((endedAt - startedAt) / 60000)
  return `${mins}m`
}

function barOpacity(startedAt: number, endedAt: number | undefined): number {
  if (!endedAt) return 1
  return Math.max(0.35, 1 - ((endedAt - startedAt) / LIMIT_MS) * 0.65)
}

const BAR_W = 28
const BAR_GAP = 8
const CHART_H = 160
const LABEL_H = 44
const SVG_H = CHART_H + LABEL_H

interface Props {
  onBack: () => void
}

function PageHeader({ onBack }: { onBack: () => void }) {
  return (
    <header>
      <div>
        <button className="history-back" onClick={onBack} aria-label="Kembali">
          <ArrowLeft size={20} />
        </button>
        Riwayat
      </div>
    </header>
  )
}

export function HistoryPage({ onBack }: Props) {
  const { sessions, loading } = useHistorySessions()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!loading && scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
    }
  }, [loading])

  if (loading) {
    return (
      <>
        <PageHeader onBack={onBack} />
        <main><p style={{ color: 'var(--fg-dim)' }}>Memuat...</p></main>
      </>
    )
  }

  if (sessions.length === 0) {
    return (
      <>
        <PageHeader onBack={onBack} />
        <main>
          <p style={{ color: 'var(--fg-dim)', lineHeight: 1.6 }}>
            Belum ada sesi tercatat.<br />Mulai rekam dari halaman utama.
          </p>
        </main>
      </>
    )
  }

  const maxKicks = Math.max(...sessions.map(s => s.kicks.length), TARGET)
  const svgW = sessions.length * (BAR_W + BAR_GAP) + BAR_GAP

  return (
    <>
      <PageHeader onBack={onBack} />

      <main className="history-main">
        <p className="history-subtitle">{sessions.length} sesi tercatat</p>

        <div className="history-chart-wrap" ref={scrollRef}>
          <svg
            width={svgW}
            height={SVG_H}
            className="history-svg"
            role="img"
            aria-label="Grafik kick count per hari"
          >
            {/* garis target */}
            <line
              x1={0} x2={svgW}
              y1={CHART_H - (TARGET / maxKicks) * CHART_H}
              y2={CHART_H - (TARGET / maxKicks) * CHART_H}
              stroke="var(--border)"
              strokeWidth={1}
              strokeDasharray="4 4"
            />

            {sessions.map((s, i) => {
              const barH = Math.max(4, (s.kicks.length / maxKicks) * CHART_H)
              const x = BAR_GAP + i * (BAR_W + BAR_GAP)
              const y = CHART_H - barH
              const reached = s.kicks.length >= TARGET
              const labelX = x + BAR_W / 2
              const opacity = reached ? barOpacity(s.startedAt, s.endedAt) : 1

              return (
                <g key={s.date}>
                  <rect
                    x={x} y={y}
                    width={BAR_W} height={barH}
                    rx={4}
                    fill={reached ? 'var(--accent)' : 'var(--ring-bg)'}
                    opacity={opacity}
                  />
                  {/* jumlah kicks di atas bar */}
                  <text
                    x={labelX} y={y - 4}
                    textAnchor="middle" fontSize={10}
                    fill="var(--fg-dim)"
                  >
                    {s.kicks.length}
                  </text>
                  {/* tanggal */}
                  <text
                    x={labelX} y={CHART_H + 13}
                    textAnchor="middle" fontSize={10}
                    fill="var(--fg-dim)"
                  >
                    {shortDate(s.date)}
                  </text>
                  {/* hari */}
                  <text
                    x={labelX} y={CHART_H + 25}
                    textAnchor="middle" fontSize={9}
                    fill="var(--border)"
                  >
                    {dayLabel(s.date)}
                  </text>
                  {/* durasi */}
                  <text
                    x={labelX} y={CHART_H + 39}
                    textAnchor="middle" fontSize={9}
                    fill="var(--fg-dim)"
                    opacity={0.7}
                  >
                    {durationMin(s.startedAt, s.endedAt)}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

        {/* Tabel ringkas */}
        <div className="history-list">
          {[...sessions].reverse().map(s => {
            const duration = s.endedAt ? s.endedAt - s.startedAt : null
            const reached = s.kicks.length >= TARGET
            return (
              <div key={s.date} className="history-row">
                <div className="history-row-left">
                  <span className="history-row-date">{s.date}</span>
                  <span className="history-row-duration">
                    {duration ? formatDuration(duration) : '—'}
                  </span>
                </div>
                <span
                  className="history-row-kicks"
                  style={{ color: reached ? 'var(--accent)' : 'var(--fg-dim)' }}
                >
                  {s.kicks.length}/{TARGET}
                </span>
              </div>
            )
          })}
        </div>
      </main>
    </>
  )
}
