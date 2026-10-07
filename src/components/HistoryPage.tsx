import { useRef, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { TARGET } from '../domain/session'
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

const BAR_W = 28
const BAR_GAP = 8
const CHART_H = 160
const LABEL_H = 32
const SVG_H = CHART_H + LABEL_H

interface Props {
  onBack: () => void
}

export function HistoryPage({ onBack }: Props) {
  const { sessions, loading } = useHistorySessions()
  const scrollRef = useRef<HTMLDivElement>(null)

  // scroll ke kanan (data terbaru) saat load
  useEffect(() => {
    if (!loading && scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
    }
  }, [loading])

  if (loading) {
    return (
      <>
        <header>
          <div>
            <button className="history-back" onClick={onBack} aria-label="Kembali">
              <ArrowLeft size={20} />
            </button>
            Riwayat
          </div>
        </header>
        <main>
          <p style={{ color: 'var(--fg-dim)' }}>Memuat...</p>
        </main>
      </>
    )
  }

  if (sessions.length === 0) {
    return (
      <>
        <header>
          <div>
            <button className="history-back" onClick={onBack} aria-label="Kembali">
              <ArrowLeft size={20} />
            </button>
            Riwayat
          </div>
        </header>
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
      <header>
        <div>
          <button className="history-back" onClick={onBack} aria-label="Kembali">
            <ArrowLeft size={20} />
          </button>
          Riwayat
        </div>
      </header>

      <main className="history-main">
        <p className="history-subtitle">
          {sessions.length} sesi tercatat
        </p>

        {/* Chart */}
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
              x1={0}
              x2={svgW}
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

              return (
                <g key={s.date}>
                  <rect
                    x={x}
                    y={y}
                    width={BAR_W}
                    height={barH}
                    rx={4}
                    fill={reached ? 'var(--accent)' : 'var(--ring-bg)'}
                  />
                  {/* jumlah kicks di atas bar */}
                  <text
                    x={labelX}
                    y={y - 4}
                    textAnchor="middle"
                    fontSize={10}
                    fill="var(--fg-dim)"
                  >
                    {s.kicks.length}
                  </text>
                  {/* tanggal */}
                  <text
                    x={labelX}
                    y={CHART_H + 14}
                    textAnchor="middle"
                    fontSize={10}
                    fill="var(--fg-dim)"
                  >
                    {shortDate(s.date)}
                  </text>
                  {/* hari */}
                  <text
                    x={labelX}
                    y={CHART_H + 28}
                    textAnchor="middle"
                    fontSize={9}
                    fill="var(--border)"
                  >
                    {dayLabel(s.date)}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="history-legend">
          <span className="history-legend-item">
            <span className="history-legend-dot history-legend-dot--accent" />
            Tercapai 10
          </span>
          <span className="history-legend-item">
            <span className="history-legend-dot history-legend-dot--dim" />
            Belum tercapai
          </span>
          <span className="history-legend-item history-legend-dashed">
            — Target
          </span>
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
                  <span className="history-row-duration" style={{ color: 'var(--fg-dim)' }}>
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
