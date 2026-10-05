import { memo } from 'react'
import { PAL } from './palette'
import { SPRITES, type SpriteName } from './sprites'

// One <path> per colour keeps the DOM small and the edges razor sharp at any size.
const cache = new Map<string, { d: string; fill: string }[]>()

function pathsFor(name: SpriteName) {
  const hit = cache.get(name)
  if (hit) return hit
  const byColor = new Map<string, string[]>()
  SPRITES[name].forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x]
      if (ch === '.') continue
      // merge horizontal runs
      let run = 1
      while (row[x + run] === ch) run++
      const list = byColor.get(ch) ?? []
      list.push(`M${x} ${y}h${run}v1h-${run}z`)
      byColor.set(ch, list)
      x += run - 1
    }
  })
  const out = [...byColor].map(([ch, parts]) => ({ fill: PAL[ch], d: parts.join('') }))
  cache.set(name, out)
  return out
}

interface Props {
  name: SpriteName
  size?: number
  className?: string
  title?: string
}

export const Sprite = memo(function Sprite({ name, size = 32, className, title }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      {pathsFor(name).map((p) => (
        <path key={p.fill} d={p.d} fill={p.fill} />
      ))}
    </svg>
  )
})
