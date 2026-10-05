import { useEffect, useRef } from 'react'
import { clock, getWorld } from './instance'
import { FOCUS, WORLD_H, WORLD_W } from './world'

interface Props {
  /** Where the AI Lab should sit horizontally in the viewport (0 = left, 1 = right). */
  anchorX?: number
  anchorY?: number
  night?: boolean
  onEnter?: () => void
  className?: string
}

/** Integer-scaled canvas view into the shared pixel world. */
export function PixelScene({ anchorX = 0.5, anchorY = 0.45, night = false, onEnter, className }: Props) {
  const wrap = useRef<HTMLDivElement>(null)
  const cv = useRef<HTMLCanvasElement>(null)
  const props = useRef({ anchorX, anchorY, night, onEnter })
  props.current = { anchorX, anchorY, night, onEnter }

  useEffect(() => {
    const world = getWorld()
    const canvas = cv.current!
    const el = wrap.current!
    const ctx = canvas.getContext('2d')!
    let vw = 0
    let vh = 0
    let scale = 2

    const resize = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      scale = w >= 1700 ? 4 : w >= 900 ? 3 : 2
      vw = Math.min(WORLD_W, Math.ceil(w / scale))
      vh = Math.min(WORLD_H, Math.ceil(h / scale))
      canvas.width = vw
      canvas.height = vh
      canvas.style.width = `${vw * scale}px`
      canvas.style.height = `${vh * scale}px`
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(el)

    world.onEnter = () => props.current.onEnter?.()
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let last = performance.now()
    let visible = true
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(el)

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(0.1, (now - last) / 1000)
      if (dt < 1 / 40) return // cap ~40fps; pixel art doesn't need more
      last = now
      if (!visible) return
      if (!reduced) {
        clock.t += dt
        world.update(clock.t, dt)
      }
      const { anchorX: ax, anchorY: ay, night: n } = props.current
      const vx = Math.max(0, Math.min(WORLD_W - vw, FOCUS.x - ax * vw))
      const vy = Math.max(0, Math.min(WORLD_H - vh, FOCUS.y - ay * vh))
      world.render(ctx, vx, vy, vw, vh, clock.t, n)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      world.onEnter = undefined
    }
  }, [])

  return (
    <div ref={wrap} className={className} style={{ overflow: 'hidden' }}>
      <canvas ref={cv} className="pixelated" style={{ display: 'block' }} aria-label="Animated pixel-art campus: students walking into the AI Lab" role="img" />
    </div>
  )
}
