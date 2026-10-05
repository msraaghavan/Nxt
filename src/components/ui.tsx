import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { nextWorkshopDate } from '../config'
import { PAL } from '../pixel/palette'
import { CHAR_FRAMES, LOOKS, type Facing } from '../pixel/sprites'
import { Sprite } from '../pixel/Sprite'
import type { SpriteName } from '../pixel/sprites'
import { navigate } from '../lib/router'
import { sfx } from '../lib/sound'

export function Btn({
  children,
  to,
  href,
  onClick,
  variant,
  size,
  type = 'button',
  disabled,
  className = '',
  newTab,
  title,
}: {
  children: ReactNode
  to?: string
  href?: string
  onClick?: () => void
  variant?: 'wa' | 'violet' | 'paper' | 'red' | 'ghost-dark'
  size?: 'big' | 'small'
  type?: 'button' | 'submit'
  disabled?: boolean
  className?: string
  newTab?: boolean
  title?: string
}) {
  const cls = `px-btn ${variant ?? ''} ${size ?? ''} ${className}`
  const click = () => {
    sfx.click()
    onClick?.()
    if (to) navigate(to)
  }
  if (href)
    return (
      <a className={cls} href={href} onClick={click} target={newTab ? '_blank' : undefined} rel={newTab ? 'noopener noreferrer' : undefined} title={title}>
        {children}
      </a>
    )
  return (
    <button className={cls} type={type} onClick={type === 'submit' ? onClick : click} disabled={disabled} title={title}>
      {children}
    </button>
  )
}

export function Panel({ children, className = '', dark, gold, inset, tight, shadow = true, id }: { children: ReactNode; className?: string; dark?: boolean; gold?: boolean; inset?: boolean; tight?: boolean; shadow?: boolean; id?: string }) {
  const cls = ['px-panel', dark && 'dark', gold && 'gold', inset && 'inset', tight && 'tight', className].filter(Boolean).join(' ')
  const inner = (
    <div className={cls} id={id}>
      {children}
    </div>
  )
  return shadow ? <div className="px-shadow">{inner}</div> : inner
}

export function Bar({ value, max, color, label }: { value: number; max: number; color?: 'gold' | 'green' | 'violet' | 'cyan'; label?: string }) {
  const w = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100))
  return (
    <div className={`px-bar ${color ?? ''}`} role="progressbar" aria-valuenow={value} aria-valuemax={max} aria-label={label}>
      <i style={{ width: `${w}%` }} />
    </div>
  )
}

export function SectionTitle({ tag, title, sprite, sub, light }: { tag?: string; title: string; sprite?: SpriteName; sub?: string; light?: boolean }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <div className="section-title">
        {sprite && <Sprite name={sprite} size={44} />}
        <div>
          {tag && <span className="px-tag" style={{ marginBottom: 10 }}>{tag}</span>}
          <h2 style={light ? { color: 'var(--ink)', textShadow: 'none' } : undefined}>{title}</h2>
        </div>
      </div>
      {sub && (
        <p style={{ maxWidth: 720, color: light ? 'var(--ink)' : '#fff', textShadow: light ? 'none' : '2px 2px 0 var(--ink)', fontSize: 20 }}>{sub}</p>
      )}
    </div>
  )
}

export function useCopy() {
  const [copied, setCopied] = useState<string | null>(null)
  const copy = async (text: string, key = 'x') => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    sfx.coin()
    setCopied(key)
    setTimeout(() => setCopied((c) => (c === key ? null : c)), 1600)
  }
  return { copied, copy }
}

export function CopyBox({ text, label, dark, rows }: { text: string; label?: string; dark?: boolean; rows?: number }) {
  const { copied, copy } = useCopy()
  const multiline = text.includes('\n') || (rows ?? 0) > 1
  return (
    <div>
      {label && (
        <div className="display" style={{ fontSize: 10, marginBottom: 6 }}>
          {label}
        </div>
      )}
      <div className="row" style={{ alignItems: 'stretch', flexWrap: 'nowrap', flexDirection: multiline ? 'column' : 'row', gap: multiline ? 4 : 12 }}>
        <div
          className={`px-panel inset tight ${dark ? 'dark' : ''}`}
          style={{
            flex: 1,
            minWidth: 0,
            fontFamily: multiline ? 'var(--font-body)' : 'var(--font-mono)',
            fontSize: multiline ? 17 : 21,
            whiteSpace: multiline ? 'pre-wrap' : 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            wordBreak: multiline ? 'break-word' : undefined,
            margin: 4,
          }}
        >
          {text}
        </div>
        <div style={{ alignSelf: multiline ? 'flex-start' : 'stretch', display: 'flex' }}>
          <Btn size="small" onClick={() => copy(text)} variant={copied ? 'wa' : undefined}>
            {copied ? '✓ Copied' : multiline ? 'Copy message' : 'Copy'}
          </Btn>
        </div>
      </div>
    </div>
  )
}

export function useCountdown(target: Date) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const ms = Math.max(0, target.getTime() - now)
  return {
    d: Math.floor(ms / 86400000),
    h: Math.floor((ms / 3600000) % 24),
    m: Math.floor((ms / 60000) % 60),
    s: Math.floor((ms / 1000) % 60),
  }
}

export function Countdown({ compact }: { compact?: boolean }) {
  const target = useMemo(() => nextWorkshopDate(), [])
  const { d, h, m, s } = useCountdown(target)
  const cells: [number, string][] = [
    [d, 'DAYS'],
    [h, 'HRS'],
    [m, 'MIN'],
    [s, 'SEC'],
  ]
  return (
    <div className="row" style={{ gap: compact ? 6 : 10, flexWrap: 'nowrap' }} aria-label={`Workshop starts in ${d} days ${h} hours ${m} minutes`}>
      {cells.map(([v, l]) => (
        <div key={l} className="center">
          <div
            className="mono"
            style={{
              background: 'var(--ink)',
              color: 'var(--gold)',
              fontSize: compact ? 26 : 38,
              lineHeight: 1,
              padding: compact ? '4px 8px' : '6px 12px',
              minWidth: compact ? 44 : 62,
              boxShadow: '0 -3px 0 0 var(--ink), 0 3px 0 0 var(--ink), -3px 0 0 0 var(--ink), 3px 0 0 0 var(--ink), inset 0 -4px 0 0 #1b1530',
            }}
          >
            {String(v).padStart(2, '0')}
          </div>
          <div className="display" style={{ fontSize: 8, marginTop: 6 }}>
            {l}
          </div>
        </div>
      ))}
    </div>
  )
}

/** RPG-style text that types itself out (full text stays available to screen readers). */
export function Typewriter({ text, speed = 22, className, style }: { text: string; speed?: number; className?: string; style?: React.CSSProperties }) {
  const [n, setN] = useState(0)
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  useEffect(() => {
    if (reduced) return setN(text.length)
    setN(0)
    const id = setInterval(() => setN((v) => (v >= text.length ? (clearInterval(id), v) : v + 1)), speed)
    return () => clearInterval(id)
  }, [text, speed, reduced])
  return (
    <p className={className} style={style}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {text.slice(0, n)}
        <span className="blink" style={{ visibility: n >= text.length ? 'visible' : 'hidden' }}>
          ▼
        </span>
      </span>
    </p>
  )
}

/** A character sprite rendered as crisp SVG (optionally walking in place). */
export function Character({ look = 0, size = 48, facing = 'down', walk = false }: { look?: number; size?: number; facing?: Facing; walk?: boolean }) {
  const [frame, setFrame] = useState(0)
  useEffect(() => {
    if (!walk) return
    const id = setInterval(() => setFrame((f) => 1 - f), 260)
    return () => clearInterval(id)
  }, [walk])
  const rows = CHAR_FRAMES[facing][frame]
  const swap: Record<string, string> = LOOKS[look % LOOKS.length]
  const rects: ReactNode[] = []
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x]
      if (ch === '.') continue
      let run = 1
      while (row[x + run] === ch) run++
      rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={run} height={1} fill={swap[ch] ?? PAL[ch]} />)
      x += run - 1
    }
  })
  return (
    <svg width={size * 0.75} height={size} viewBox="0 0 12 16" shapeRendering="crispEdges" aria-hidden>
      {rects}
    </svg>
  )
}

export function Stat({ label, value, sub, sprite, tone }: { label: string; value: ReactNode; sub?: ReactNode; sprite?: SpriteName; tone?: string }) {
  return (
    <Panel dark tight>
      <div className="row between" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0 }}>
          <div className="display muted" style={{ fontSize: 9, marginBottom: 8 }}>
            {label}
          </div>
          <div className="mono" style={{ fontSize: 44, lineHeight: 0.9, color: tone ?? 'var(--gold)' }}>
            {value}
          </div>
          {sub && <div style={{ fontSize: 15, marginTop: 6 }}>{sub}</div>}
        </div>
        {sprite && <Sprite name={sprite} size={36} />}
      </div>
    </Panel>
  )
}

export function useOnce(fn: () => void) {
  const done = useRef(false)
  useEffect(() => {
    if (done.current) return
    done.current = true
    fn()
  }, [fn])
}
