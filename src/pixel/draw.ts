import { PAL } from './palette'
import { FONT_3x5, SPRITES, type SpriteName } from './sprites'

export type Ctx = CanvasRenderingContext2D

export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function px(ctx: Ctx, x: number, y: number, color: string, w = 1, h = 1) {
  ctx.fillStyle = color
  ctx.fillRect(Math.round(x), Math.round(y), w, h)
}

/** Draw a string-grid sprite. `swap` overrides palette keys (used for character looks). */
export function drawGrid(
  ctx: Ctx,
  rows: readonly string[],
  x: number,
  y: number,
  swap: Partial<Record<string, string>> = {},
  scale = 1,
) {
  const ox = Math.round(x)
  const oy = Math.round(y)
  for (let j = 0; j < rows.length; j++) {
    const row = rows[j]
    for (let i = 0; i < row.length; i++) {
      const ch = row[i]
      if (ch === '.') continue
      ctx.fillStyle = swap[ch] ?? PAL[ch] ?? '#f0f'
      ctx.fillRect(ox + i * scale, oy + j * scale, scale, scale)
    }
  }
}

export function drawSprite(ctx: Ctx, name: SpriteName, x: number, y: number, scale = 1) {
  drawGrid(ctx, SPRITES[name], x, y, {}, scale)
}

export function textWidth3x5(text: string, scale = 1) {
  return text.length * 4 * scale - scale
}

export function drawText3x5(ctx: Ctx, text: string, x: number, y: number, color: string, scale = 1) {
  ctx.fillStyle = color
  let cx = Math.round(x)
  for (const ch of text.toUpperCase()) {
    const glyph = FONT_3x5[ch] ?? FONT_3x5[' ']
    for (let j = 0; j < 5; j++)
      for (let i = 0; i < 3; i++)
        if (glyph[j][i] === '#') ctx.fillRect(cx + i * scale, Math.round(y) + j * scale, scale, scale)
    cx += 4 * scale
  }
}

/** Ordered 4×4 Bayer dithering threshold in [0,1). */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]
export function bayer(x: number, y: number) {
  return BAYER[(y & 3) * 4 + (x & 3)] / 16
}

/** Pre-render a soft pixel glow (dithered rings) for night lights. */
export function makeGlow(radius: number, color: string) {
  const c = document.createElement('canvas')
  c.width = c.height = radius * 2
  const g = c.getContext('2d')!
  g.fillStyle = color
  for (let y = 0; y < radius * 2; y++)
    for (let x = 0; x < radius * 2; x++) {
      const d = Math.hypot(x - radius + 0.5, y - radius + 0.5) / radius
      if (d > 1) continue
      const strength = 1 - d
      if (strength * 1.6 > bayer(x, y) + 0.15) g.fillRect(x, y, 1, 1)
    }
  return c
}
