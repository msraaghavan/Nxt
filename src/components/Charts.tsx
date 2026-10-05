import { useState, type ReactNode } from 'react'
import { CHANNELS, WORKSHOP, type ChannelId } from '../config'
import type { Metrics } from '../data/analytics'
import { fmt, pct } from '../lib/format'

const INK = '#0e0a1c'
const GRID = '#3a3060'
const SURFACE = '#261e40'

/** Tooltip anchored at `at` (0..1 across the chart width), clamped inside the chart. */
function Tip({ at, y, children }: { at: number; y: number; children: ReactNode }) {
  return (
    <div
      className="px-panel tight"
      style={{
        position: 'absolute',
        left: `clamp(0px, calc(${(at * 100).toFixed(2)}% - 100px), calc(100% - 200px))`,
        top: y,
        width: 200,
        pointerEvents: 'none',
        fontSize: 15,
        lineHeight: 1.3,
        zIndex: 5,
        margin: 0,
      }}
    >
      {children}
    </div>
  )
}

export function Legend({ extra }: { extra?: ReactNode }) {
  return (
    <div className="legend">
      {CHANNELS.map((c) => (
        <span key={c.id}>
          <i style={{ background: c.color }} />
          {c.short}
        </span>
      ))}
      {extra}
    </div>
  )
}

/** Daily registrations, stacked by channel, with the plan's daily target as a marker. */
export function DailyChart({ m }: { m: Metrics }) {
  const [hover, setHover] = useState<number | null>(null)
  const W = 640
  const H = 260
  const pad = { l: 40, r: 10, t: 14, b: 30 }
  const max = Math.ceil(Math.max(...m.daily.map((d) => Math.max(d.total, d.target))) / 20) * 20 + 10
  const bw = (W - pad.l - pad.r) / 7
  const y = (v: number) => H - pad.b - (v / max) * (H - pad.t - pad.b)
  const order: ChannelId[] = ['leaders', 'clubs', 'referral', 'organic']
  const ticks = [0, max / 2, max].map((v) => Math.round(v))
  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" shapeRendering="crispEdges" role="img" aria-label="Daily registrations by channel versus daily target" onMouseLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={2} strokeDasharray={t ? '4 6' : undefined} />
            <text x={pad.l - 8} y={y(t) + 5} textAnchor="end" className="chart-axis">
              {t}
            </text>
          </g>
        ))}
        {m.daily.map((d, i) => {
          const x = pad.l + i * bw + bw * 0.18
          const w = bw * 0.64
          const future = d.day > m.day
          let acc = 0
          return (
            <g key={d.day} onMouseEnter={() => setHover(i)}>
              <rect x={pad.l + i * bw} y={pad.t} width={bw} height={H - pad.t - pad.b} fill={hover === i ? 'rgba(255,255,255,0.05)' : 'transparent'} />
              {future ? (
                <rect x={x} y={y(d.target)} width={w} height={y(0) - y(d.target)} fill="none" stroke="#5d4f8a" strokeWidth={2} strokeDasharray="6 4" />
              ) : (
                order.map((ch) => {
                  const v = d[ch]
                  if (!v) return null
                  const y0 = y(acc)
                  acc += v
                  const y1 = y(acc)
                  return <rect key={ch} x={x} y={y1} width={w} height={Math.max(0, y0 - y1 - 2)} fill={CHANNELS.find((c) => c.id === ch)!.color} />
                })
              )}
              {/* target marker */}
              <rect x={x - 6} y={y(d.target) - 2} width={w + 12} height={4} fill="#efe8ff" opacity={future ? 0.5 : 0.95} />
              <text x={pad.l + i * bw + bw / 2} y={H - 8} textAnchor="middle" className="chart-axis" style={{ fill: d.day === m.day ? '#ffd23f' : undefined }}>
                D{d.day}
              </text>
              {!future && (
                <text x={pad.l + i * bw + bw / 2} y={y(Math.max(d.total, d.target)) - 8} textAnchor="middle" className="chart-axis" style={{ fill: '#efe8ff' }}>
                  {d.total}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      {hover !== null && (
        <Tip at={(pad.l + hover * bw + bw / 2) / W} y={10}>
          <b>Day {m.daily[hover].day}</b>
          {m.daily[hover].day > m.day ? (
            <div>Not played yet · target {m.daily[hover].target}</div>
          ) : (
            <>
              {order.map((ch) => (
                <div key={ch} className="row between" style={{ gap: 6, flexWrap: 'nowrap' }}>
                  <span>
                    <i style={{ display: 'inline-block', width: 10, height: 10, background: CHANNELS.find((c) => c.id === ch)!.color, marginRight: 6 }} />
                    {CHANNELS.find((c) => c.id === ch)!.short}
                  </span>
                  <b>{m.daily[hover][ch]}</b>
                </div>
              ))}
              <div className="row between" style={{ borderTop: '2px dashed #ccc', marginTop: 4 }}>
                <span>Total vs target</span>
                <b>
                  {m.daily[hover].total} / {m.daily[hover].target}
                </b>
              </div>
            </>
          )}
        </Tip>
      )}
    </div>
  )
}

/** Cumulative registrations vs plan, with the 500 goal line. */
export function CumulativeChart({ m }: { m: Metrics }) {
  const [hover, setHover] = useState<number | null>(null)
  const W = 640
  const H = 260
  const pad = { l: 44, r: 54, t: 14, b: 30 }
  const max = 600
  const x = (i: number) => pad.l + (i / 6) * (W - pad.l - pad.r)
  const y = (v: number) => H - pad.b - (v / max) * (H - pad.t - pad.b)
  const plan = m.daily.map((d) => d.cumTarget)
  const actual = m.cumulative.slice(0, m.day)
  const step = (pts: number[]) => pts.map((v, i) => `${i ? 'L' : 'M'}${x(i)} ${y(v)}`).join(' ')
  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Cumulative registrations versus plan and goal" onMouseLeave={() => setHover(null)}>
        {[0, 200, 400, 600].map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={2} strokeDasharray={t ? '4 6' : undefined} />
            <text x={pad.l - 8} y={y(t) + 5} textAnchor="end" className="chart-axis">
              {t}
            </text>
          </g>
        ))}
        <line x1={pad.l} x2={W - pad.r} y1={y(WORKSHOP.goal)} y2={y(WORKSHOP.goal)} stroke="#e04848" strokeWidth={2} />
        <text x={W - pad.r + 6} y={y(WORKSHOP.goal) + 5} className="chart-axis" style={{ fill: '#ff8f8f' }}>
          GOAL
        </text>
        <path d={step(plan)} fill="none" stroke="#8a7fb0" strokeWidth={2} strokeDasharray="6 5" />
        <text x={W - pad.r + 6} y={y(plan[6]) + 5} className="chart-axis">
          PLAN
        </text>
        <path d={step(actual)} fill="none" stroke="#ffd23f" strokeWidth={3} />
        {actual.map((v, i) => (
          <rect key={i} x={x(i) - 5} y={y(v) - 5} width={10} height={10} fill="#ffd23f" stroke={SURFACE} strokeWidth={2} />
        ))}
        {actual.length > 0 && (
          <text x={x(actual.length - 1)} y={y(actual[actual.length - 1]) - 14} textAnchor="middle" className="chart-axis" style={{ fill: '#ffd23f' }}>
            {actual[actual.length - 1]}
          </text>
        )}
        {m.daily.map((d, i) => (
          <g key={d.day}>
            <text x={x(i)} y={H - 8} textAnchor="middle" className="chart-axis">
              D{d.day}
            </text>
            <rect x={x(i) - 30} y={pad.t} width={60} height={H - pad.t - pad.b} fill="transparent" onMouseEnter={() => setHover(i)} />
          </g>
        ))}
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} stroke="#efe8ff" strokeWidth={1} opacity={0.5} />}
      </svg>
      {hover !== null && (
        <Tip at={x(hover) / W} y={20}>
          <b>End of day {hover + 1}</b>
          <div className="row between">
            <span>Actual</span>
            <b>{hover < m.day ? fmt(m.cumulative[hover]) : '–'}</b>
          </div>
          <div className="row between">
            <span>Plan</span>
            <b>{fmt(plan[hover])}</b>
          </div>
          {hover < m.day && (
            <div className="row between">
              <span>vs plan</span>
              <b>{pct(m.cumulative[hover] / plan[hover] - 1)}</b>
            </div>
          )}
        </Tip>
      )}
      <div className="legend" style={{ marginTop: 6 }}>
        <span>
          <i style={{ background: '#ffd23f' }} />
          Actual
        </span>
        <span>
          <i style={{ background: '#8a7fb0' }} />
          Plan (base case 550)
        </span>
        <span>
          <i style={{ background: '#e04848' }} />
          Goal 500
        </span>
      </div>
    </div>
  )
}

export function FunnelBars({ steps }: { steps: { label: string; value: number; note?: string }[] }) {
  const max = Math.max(...steps.map((s) => s.value), 1)
  return (
    <div className="stack">
      {steps.map((s, i) => (
        <div key={s.label}>
          <div className="row between" style={{ fontSize: 16, flexWrap: 'nowrap' }}>
            <span>{s.label}</span>
            <span>
              <b className="mono" style={{ fontSize: 22 }}>
                {fmt(s.value)}
              </b>
              {i > 0 && <span className="muted"> · {pct(s.value / Math.max(1, steps[i - 1].value))}</span>}
            </span>
          </div>
          <div style={{ height: 18, background: INK, padding: 3 }}>
            <div style={{ height: '100%', width: `${(s.value / max) * 100}%`, background: i === steps.length - 1 ? '#d65586' : '#8a63ff', minWidth: 4 }} />
          </div>
          {s.note && (
            <div className="muted" style={{ fontSize: 13 }}>
              {s.note}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export function HourStrip({ hours }: { hours: number[] }) {
  const max = Math.max(...hours, 1)
  const [hover, setHover] = useState<number | null>(null)
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', gap: 2, alignItems: 'end', height: 90 }} onMouseLeave={() => setHover(null)}>
        {hours.map((v, h) => (
          <div
            key={h}
            onMouseEnter={() => setHover(h)}
            title={`${h}:00 – ${v} registrations`}
            style={{ height: `${Math.max(4, (v / max) * 100)}%`, background: hover === h ? '#ffd23f' : h >= 19 && h <= 22 ? '#8a63ff' : '#4c3f78' }}
          />
        ))}
      </div>
      <div className="row between chart-axis" style={{ fontFamily: 'var(--font-mono)', fontSize: 15, color: '#a99cc8' }}>
        <span>12 AM</span>
        <span>6 AM</span>
        <span>12 PM</span>
        <span>6 PM</span>
        <span>11 PM</span>
      </div>
      <div style={{ fontSize: 15, minHeight: 22 }}>
        {hover !== null ? (
          <span>
            {hover}:00–{hover + 1}:00 · <b>{hours[hover]}</b> registrations
          </span>
        ) : (
          <span className="muted">Hover an hour. Violet = 7–11 PM, when class groups are busiest.</span>
        )}
      </div>
    </div>
  )
}
