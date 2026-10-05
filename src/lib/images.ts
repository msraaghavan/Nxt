// Shareable images rendered client-side in the same pixel style:
// - Quest Pass (1080×1920) for WhatsApp Status / Instagram Story
// - Quest Leader poster (A4 @150dpi) with a QR for notice boards
import QRCode from 'qrcode'
import { WORKSHOP } from '../config'
import { shortName } from '../data/colleges'
import type { Leader, Registration } from '../data/types'
import { drawSprite } from '../pixel/draw'
import { clock, getWorld } from '../pixel/instance'
import { PAL } from '../pixel/palette'
import { FOCUS } from '../pixel/world'
import { workshopLabel } from './format'

type Ctx = CanvasRenderingContext2D
const DISPLAY = '"Press Start 2P", monospace'
const BODY = '"Pixelify Sans", sans-serif'

async function fontsReady() {
  try {
    await Promise.all([document.fonts.load(`32px ${DISPLAY}`), document.fonts.load(`32px ${BODY}`), document.fonts.load(`600 32px ${BODY}`)])
  } catch {
    /* fall back to system fonts */
  }
}

function panel(ctx: Ctx, x: number, y: number, w: number, h: number, bg: string, edge = PAL.k, u = 8) {
  ctx.fillStyle = edge
  ctx.fillRect(x + u, y, w - 2 * u, h)
  ctx.fillRect(x, y + u, w, h - 2 * u)
  ctx.fillStyle = bg
  ctx.fillRect(x + u, y + u, w - 2 * u, h - 2 * u)
}

function text(ctx: Ctx, s: string, x: number, y: number, size: number, color: string, font = DISPLAY, align: CanvasTextAlign = 'left', shadow?: string) {
  ctx.font = `${size}px ${font}`
  ctx.textAlign = align
  ctx.textBaseline = 'top'
  if (shadow) {
    ctx.fillStyle = shadow
    ctx.fillText(s, x + Math.max(3, size / 8), y + Math.max(3, size / 8))
  }
  ctx.fillStyle = color
  ctx.fillText(s, x, y)
}

function wrap(ctx: Ctx, s: string, maxW: number, size: number, font = DISPLAY) {
  ctx.font = `${size}px ${font}`
  const words = s.split(' ')
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const t = line ? `${line} ${w}` : w
    if (ctx.measureText(t).width > maxW && line) {
      lines.push(line)
      line = w
    } else line = t
  }
  if (line) lines.push(line)
  return lines
}

function qr(ctx: Ctx, data: string, x: number, y: number, size: number, dark = PAL.k, light = PAL.W) {
  const code = QRCode.create(data, { errorCorrectionLevel: 'M' })
  const n = code.modules.size
  const quiet = 2
  const cell = Math.floor(size / (n + quiet * 2))
  const total = cell * (n + quiet * 2)
  ctx.fillStyle = light
  ctx.fillRect(x, y, total, total)
  ctx.fillStyle = dark
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) if (code.modules.get(r, c)) ctx.fillRect(x + (c + quiet) * cell, y + (r + quiet) * cell, cell, cell)
  return total
}

function worldSnapshot(ctx: Ctx, dx: number, dy: number, dw: number, dh: number, scale: number) {
  const world = getWorld()
  const vw = Math.round(dw / scale)
  const vh = Math.round(dh / scale)
  const off = document.createElement('canvas')
  off.width = vw
  off.height = vh
  world.render(off.getContext('2d')!, FOCUS.x - vw / 2, FOCUS.y - vh * 0.55, vw, vh, clock.t, false)
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(off, 0, 0, vw, vh, dx, dy, vw * scale, vh * scale)
}

export async function renderQuestPass(reg: Registration, link: string, playerNo: number) {
  await fontsReady()
  const W = 1080
  const H = 1920
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')!
  ctx.imageSmoothingEnabled = false

  worldSnapshot(ctx, 0, 0, W, 1000, 4)
  // dark band + title
  ctx.fillStyle = 'rgba(27,21,48,0.78)'
  ctx.fillRect(0, 0, W, 210)
  text(ctx, 'AI QUEST 60', W / 2, 62, 64, PAL.y, DISPLAY, 'center', PAL.k)
  text(ctx, 'QUEST ACCEPTED!', W / 2, 152, 26, '#ffffff', DISPLAY, 'center')

  // the card
  const cx = 60
  const cy = 820
  const cw = W - 120
  const ch = 1040
  panel(ctx, cx + 14, cy + 14, cw, ch, 'rgba(43,33,53,0.45)', 'rgba(43,33,53,0.45)', 12)
  panel(ctx, cx, cy, cw, ch, PAL.W, PAL.k, 12)
  ctx.fillStyle = PAL.P
  ctx.fillRect(cx + 12, cy + ch - 24, cw - 24, 12)
  // ribbon
  panel(ctx, cx + 40, cy - 34, 420, 72, PAL.v, PAL.k, 8)
  text(ctx, 'QUEST PASS', cx + 250, cy - 10, 30, '#fff', DISPLAY, 'center', PAL.V)
  text(ctx, `PLAYER #${String(playerNo).padStart(4, '0')}`, cx + cw - 40, cy + 64, 26, PAL.V, DISPLAY, 'right')

  const name = reg.name.length > 18 ? reg.name.split(' ')[0] : reg.name
  text(ctx, name.toUpperCase(), cx + 60, cy + 130, name.length > 12 ? 44 : 58, PAL.k)
  text(ctx, `${shortName(reg.college)} · ${reg.branch.split(' ')[0]} · ${reg.gradYear}`, cx + 60, cy + 222, 40, '#6b5c84', BODY)

  ctx.fillStyle = PAL.k
  for (let x = cx + 60; x < cx + cw - 60; x += 24) ctx.fillRect(x, cy + 300, 14, 6)

  const lines = wrap(ctx, WORKSHOP.title.toUpperCase(), cw - 120, 34)
  lines.forEach((l, i) => text(ctx, l, cx + 60, cy + 346 + i * 54, 34, PAL.k))
  const after = cy + 346 + lines.length * 54 + 16
  text(ctx, `${workshopLabel(true)} · LIVE · FREE`, cx + 60, after, 38, PAL.R, BODY)

  // QR + call to action
  const qy = after + 90
  const size = qr(ctx, link, cx + 60, qy, 330)
  ctx.strokeStyle = PAL.k
  ctx.lineWidth = 8
  ctx.strokeRect(cx + 56, qy - 4, size + 8, size + 8)
  const tx = cx + 60 + size + 50
  text(ctx, 'JOIN MY', tx, qy + 20, 34, PAL.k)
  text(ctx, 'SQUAD', tx, qy + 70, 34, PAL.k)
  text(ctx, 'Scan or use code', tx, qy + 140, 36, '#6b5c84', BODY)
  panel(ctx, tx, qy + 194, 330, 84, PAL.y, PAL.k, 8)
  text(ctx, reg.code, tx + 165, qy + 220, 34, PAL.k, DISPLAY, 'center')

  // sprites
  const sprites = ['robot', 'laptop', 'rocket', 'trophy'] as const
  sprites.forEach((s, i) => drawSprite(ctx, s, W - 140 - i * 90, cy + ch - 120, 5))

  return c
}

export async function renderLeaderPoster(leader: Leader, link: string) {
  await fontsReady()
  const W = 1240
  const H = 1754
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  ctx.fillStyle = PAL.W
  ctx.fillRect(0, 0, W, H)
  worldSnapshot(ctx, 0, 0, W, 560, 4)
  ctx.fillStyle = 'rgba(27,21,48,0.72)'
  ctx.fillRect(0, 380, W, 180)
  text(ctx, 'FREE LIVE WORKSHOP', W / 2, 412, 34, PAL.y, DISPLAY, 'center', PAL.k)
  text(ctx, 'FOR FINAL-YEAR ENGINEERS', W / 2, 482, 26, '#fff', DISPLAY, 'center')

  const lines = wrap(ctx, WORKSHOP.title.toUpperCase(), W - 160, 52)
  lines.forEach((l, i) => text(ctx, l, W / 2, 620 + i * 76, 52, PAL.k, DISPLAY, 'center'))
  let y = 620 + lines.length * 76 + 30
  text(ctx, workshopLabel(), W / 2, y, 46, PAL.R, BODY, 'center')
  y += 100
  const bullets = [
    'Build an AI Mock-Interview Coach',
    'Deploy it live + GitHub repo for your resume',
    'No setup. Just a laptop & browser',
    'Certificate for everyone who ships',
  ]
  bullets.forEach((b, i) => {
    drawSprite(ctx, 'check', 170, y + i * 74 - 6, 4)
    text(ctx, b, 250, y + i * 74, 42, PAL.k, BODY)
  })
  y += bullets.length * 74 + 40
  const size = qr(ctx, link, 140, y, 420)
  ctx.strokeStyle = PAL.k
  ctx.lineWidth = 10
  ctx.strokeRect(135, y - 5, size + 10, size + 10)
  text(ctx, 'SCAN TO', 640, y + 40, 44, PAL.k)
  text(ctx, 'REGISTER', 640, y + 104, 44, PAL.k)
  text(ctx, '(free, 30 seconds)', 640, y + 180, 40, '#6b5c84', BODY)
  text(ctx, `Ask ${leader.name.split(' ')[0]} · ${leader.code}`, 640, y + 250, 36, PAL.V, BODY)
  drawSprite(ctx, 'robot', W - 260, y + 300, 8)
  ctx.fillStyle = PAL.k
  ctx.fillRect(0, H - 70, W, 70)
  text(ctx, 'AI QUEST 60 · NXTWAVE', W / 2, H - 50, 26, PAL.y, DISPLAY, 'center')
  return c
}

export function canvasToBlob(c: HTMLCanvasElement) {
  return new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('toBlob failed'))), 'image/png'))
}

export function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 3000)
}

/** On phones this opens the native share sheet (WhatsApp Status, Instagram…). */
export async function shareOrDownload(blob: Blob, filename: string, text: string) {
  const file = new File([blob], filename, { type: 'image/png' })
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
  if (nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], text })
      return 'shared'
    } catch {
      /* user cancelled: fall through to download */
    }
  }
  download(blob, filename)
  return 'downloaded'
}
