// The hero world: a cozy top-down campus where students walk from the
// Placement Cell and the road into the AI Lab. Terrain is generated per-pixel
// (grass texture, smoothed dirt paths, a pond with a sand shore); props are
// drawn procedurally; characters use the hand-drawn sprites.
import { PAL } from './palette'
import { CHAR_FRAMES, LOOKS, type CharLook, type Facing } from './sprites'
import { bayer, drawGrid, drawText3x5, makeGlow, mulberry32, px, textWidth3x5, type Ctx } from './draw'

export const WORLD_W = 1024
export const WORLD_H = 480

const ROAD_Y = 336
const ROAD_H = 32
const LANE_Y = ROAD_Y + 14
export const LAB = { x: 600, y: 112, w: 176, roofH: 62, wallH: 54 }
const LAB_DOOR_X = LAB.x + LAB.w / 2
const LAB_WALL_BOTTOM = LAB.y + LAB.roofH - 2 + LAB.wallH
const COLLEGE_A = { x: 88, y: 132, w: 136, roofH: 52, wallH: 50 }
const COLLEGE_B = { x: 284, y: 150, w: 120, roofH: 44, wallH: 46 }
const POND = { cx: 900, cy: 226, rx: 62, ry: 36 }
const CAMPFIRE = { x: 488, y: 424 }
export const FOCUS = { x: LAB_DOOR_X, y: 236 }

// ---------- colour helpers ----------
function u32(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0
}

const GRASS_D = u32('#56aa4c')
const GRASS = u32('#5fb653')
const GRASS_L = u32('#68bd59')
const GRASS_EDGE = u32('#4a9a42')
const TUFT = u32('#3c8d3f')
const TUFT_L = u32('#8fd36a')
const PATH = u32('#d8b67c')
const PATH_2 = u32('#cfab70')
const PATH_MID = u32('#c49e65')
const PATH_EDGE = u32('#a97f4c')
const PEBBLE = u32('#b08a55')
const PEBBLE_L = u32('#ecd5a6')
const SAND = u32('#ead196')
const SAND_EDGE = u32('#c9a86a')
const FOAM = u32('#e2f5ff')
const SHALLOW = u32('#78c0f0')
const WATER = u32('#4f97e6')
const DEEP = u32('#3f7fd8')
const COBBLE = u32('#cdc6d8')
const COBBLE_L = u32('#e6e0ef')
const MORTAR = u32('#a59cb5')

// ---------- smooth value noise ----------
function makeNoise(seed: number, cell: number) {
  const rnd = mulberry32(seed)
  const gw = Math.ceil(WORLD_W / cell) + 2
  const gh = Math.ceil(WORLD_H / cell) + 2
  const grid = Array.from({ length: gw * gh }, () => rnd())
  const sm = (t: number) => t * t * (3 - 2 * t)
  return (x: number, y: number) => {
    const gx = x / cell
    const gy = y / cell
    const ix = Math.floor(gx)
    const iy = Math.floor(gy)
    const fx = sm(gx - ix)
    const fy = sm(gy - iy)
    const a = grid[iy * gw + ix]
    const b = grid[iy * gw + ix + 1]
    const c = grid[(iy + 1) * gw + ix]
    const d = grid[(iy + 1) * gw + ix + 1]
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy
  }
}

type Rect = { x: number; y: number; w: number; h: number }
type Circle = { cx: number; cy: number; r: number }

const PATH_RECTS: Rect[] = [
  { x: -8, y: ROAD_Y, w: WORLD_W + 16, h: ROAD_H },
  { x: LAB_DOOR_X - 15, y: LAB_WALL_BOTTOM + 22, w: 30, h: ROAD_Y - LAB_WALL_BOTTOM - 18 },
  { x: COLLEGE_A.x + COLLEGE_A.w / 2 - 12, y: 228, w: 24, h: ROAD_Y - 220 },
  { x: COLLEGE_B.x + COLLEGE_B.w / 2 - 11, y: 232, w: 22, h: ROAD_Y - 224 },
  { x: POND.cx - 10, y: POND.cy + POND.ry, w: 20, h: ROAD_Y - POND.cy - POND.ry + 6 },
  { x: CAMPFIRE.x - 9, y: ROAD_Y + ROAD_H - 4, w: 18, h: 40 },
]
const PATH_CIRCLES: Circle[] = [{ cx: CAMPFIRE.x, cy: CAMPFIRE.y, r: 30 }]
const PLAZA: Rect = { x: LAB.x + 40, y: LAB_WALL_BOTTOM + 1, w: LAB.w - 80, h: 26 }

// Things decor must not be scattered onto (buildings + their shadows).
const BLOCKED: Rect[] = [
  { x: LAB.x - 4, y: LAB.y - 20, w: LAB.w + 14, h: LAB.roofH + LAB.wallH + 10 },
  { x: COLLEGE_A.x - 4, y: COLLEGE_A.y - 20, w: COLLEGE_A.w + 14, h: COLLEGE_A.roofH + COLLEGE_A.wallH + 10 },
  { x: COLLEGE_B.x - 4, y: COLLEGE_B.y - 20, w: COLLEGE_B.w + 14, h: COLLEGE_B.roofH + COLLEGE_B.wallH + 10 },
]
const inRect = (x: number, y: number, r: Rect, pad = 0) =>
  x >= r.x - pad && x < r.x + r.w + pad && y >= r.y - pad && y < r.y + r.h + pad

// ---------- world ----------
interface Light {
  x: number
  y: number
  r: number
  color: string
}
interface Npc {
  look: CharLook
  x: number
  y: number
  path: { x: number; y: number }[]
  seg: number
  speed: number
  facing: Facing
  enters: boolean
  done: boolean
  phase: number
}
interface Pop {
  x: number
  y: number
  born: number
}

export class World {
  canvas: HTMLCanvasElement
  private mask = new Uint8Array(WORLD_W * WORLD_H) // 0 grass 1 path 2 water 3 sand 4 plaza
  private rng = mulberry32(60)
  private lights: Light[] = []
  private shimmer: { x: number; y: number; ph: number; len: number }[] = []
  private labWindows: Rect[] = []
  private flowers: { x: number; y: number }[] = []
  private npcs: Npc[] = []
  private pops: Pop[] = []
  private nextSpawn = 0
  private glowWarm: HTMLCanvasElement
  private glowCool: HTMLCanvasElement
  private questMarker = { x: 0, y: 0 }
  private chimney = { x: 0, y: 0 }
  private antenna = { x: 0, y: 0 }
  private flagPos = { x: 0, y: 0 }
  onEnter?: () => void

  constructor() {
    this.canvas = document.createElement('canvas')
    this.canvas.width = WORLD_W
    this.canvas.height = WORLD_H
    this.glowWarm = makeGlow(26, 'rgba(255,210,120,0.55)')
    this.glowCool = makeGlow(30, 'rgba(140,200,255,0.5)')
    this.build()
  }

  // ======================= static layer =======================
  private build() {
    const ctx = this.canvas.getContext('2d')!
    const img = ctx.createImageData(WORLD_W, WORLD_H)
    const buf = new Uint32Array(img.data.buffer)
    const m = this.mask
    const rnd = mulberry32(7)

    // 1. path mask, smoothed with a majority filter so corners look hand-drawn
    const raw = new Uint8Array(WORLD_W * WORLD_H)
    for (const r of PATH_RECTS)
      for (let y = Math.max(0, r.y); y < Math.min(WORLD_H, r.y + r.h); y++)
        for (let x = Math.max(0, r.x); x < Math.min(WORLD_W, r.x + r.w); x++) raw[y * WORLD_W + x] = 1
    for (const c of PATH_CIRCLES)
      for (let y = c.cy - c.r; y <= c.cy + c.r; y++)
        for (let x = c.cx - c.r; x <= c.cx + c.r; x++)
          if (Math.hypot(x - c.cx, (y - c.cy) * 1.25) <= c.r) raw[y * WORLD_W + x] = 1
    for (let y = 0; y < WORLD_H; y++)
      for (let x = 0; x < WORLD_W; x++) {
        let n = 0
        let tot = 0
        for (let dy = -3; dy <= 3; dy++)
          for (let dx = -3; dx <= 3; dx++) {
            const xx = x + dx
            const yy = y + dy
            if (xx < 0 || yy < 0 || xx >= WORLD_W || yy >= WORLD_H) {
              // treat off-map as continuation
              n += raw[Math.min(WORLD_H - 1, Math.max(0, yy)) * WORLD_W + Math.min(WORLD_W - 1, Math.max(0, xx))]
            } else n += raw[yy * WORLD_W + xx]
            tot++
          }
        if (n * 2 > tot) m[y * WORLD_W + x] = 1
      }

    // 2. pond + sand shore
    const pondQ = (x: number, y: number) => {
      const dx = (x - POND.cx) / POND.rx
      const dy = (y - POND.cy) / POND.ry
      const ang = Math.atan2(dy, dx)
      const wob = 1 + 0.07 * Math.sin(ang * 5 + 1.3) + 0.04 * Math.sin(ang * 9)
      return Math.hypot(dx, dy) / wob
    }
    const minR = Math.min(POND.rx, POND.ry)
    for (let y = POND.cy - POND.ry - 12; y < POND.cy + POND.ry + 12; y++)
      for (let x = POND.cx - POND.rx - 12; x < POND.cx + POND.rx + 12; x++) {
        const q = pondQ(x, y)
        if (q < 1) m[y * WORLD_W + x] = 2
        else if (q < 1 + 5 / minR) m[y * WORLD_W + x] = 3
      }

    // 3. plaza
    for (let y = PLAZA.y; y < PLAZA.y + PLAZA.h; y++)
      for (let x = PLAZA.x; x < PLAZA.x + PLAZA.w; x++) m[y * WORLD_W + x] = 4

    // 4. colour every pixel
    const n1 = makeNoise(11, 56)
    const n2 = makeNoise(23, 17)
    const at = (x: number, y: number) =>
      x < 0 || y < 0 || x >= WORLD_W || y >= WORLD_H ? -1 : m[y * WORLD_W + x]
    for (let y = 0; y < WORLD_H; y++)
      for (let x = 0; x < WORLD_W; x++) {
        const i = y * WORLD_W + x
        const t = m[i]
        if (t === 0) {
          const v = n1(x, y) * 0.75 + n2(x, y) * 0.25
          const b = bayer(x, y) * 0.08
          let c = GRASS
          if (v + b > 0.66) c = GRASS_L
          else if (v - b < 0.3) c = GRASS_D
          // inset shadow along paths / plaza
          const up = at(x, y - 1)
          if (up === 1 || up === 4 || at(x - 1, y) === 1 || at(x + 1, y) === 1 || at(x, y + 1) === 1) c = GRASS_EDGE
          buf[i] = c
        } else if (t === 1) {
          let edge = false
          let near = false
          for (let dy = -2; dy <= 2 && !edge; dy++)
            for (let dx = -2; dx <= 2; dx++) {
              const o = at(x + dx, y + dy)
              if (o === 0 || o === 3) {
                if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) edge = true
                else near = true
              }
            }
          let c = n2(x * 3, y * 3) > 0.55 ? PATH_2 : PATH
          if (near) c = PATH_MID
          if (edge) c = PATH_EDGE
          buf[i] = c
        } else if (t === 2) {
          const q = pondQ(x, y)
          const depth = (1 - q) * minR
          let c = WATER
          if (depth < 1.2) c = FOAM
          else if (depth < 5 + bayer(x, y) * 2) c = SHALLOW
          else if (q < 0.55 + bayer(x, y) * 0.08) c = DEEP
          buf[i] = c
        } else if (t === 3) {
          buf[i] = at(x, y + 1) === 0 || at(x, y - 1) === 0 || at(x + 1, y) === 0 || at(x - 1, y) === 0 ? SAND_EDGE : SAND
        } else {
          const lx = x - PLAZA.x
          const ly = y - PLAZA.y
          const row = Math.floor(ly / 7)
          const off = row % 2 ? 5 : 0
          const isMortar = ly % 7 === 6 || (lx + off) % 10 === 9
          const isTop = ly % 7 === 0
          buf[i] = isMortar ? MORTAR : isTop ? COBBLE_L : COBBLE
          if (lx === 0 || ly === PLAZA.h - 1 || lx === PLAZA.w - 1) buf[i] = MORTAR
        }
      }

    // 5. grass tufts + pebbles straight into the buffer
    const blocked = (x: number, y: number) => BLOCKED.some((r) => inRect(x, y, r))
    for (let k = 0; k < 3600; k++) {
      const x = 2 + Math.floor(rnd() * (WORLD_W - 4))
      const y = 2 + Math.floor(rnd() * (WORLD_H - 4))
      if (at(x, y) !== 0 || at(x + 2, y) !== 0 || at(x + 1, y + 1) !== 0 || blocked(x, y)) continue
      buf[y * WORLD_W + x] = TUFT
      buf[y * WORLD_W + x + 2] = TUFT
      buf[(y + 1) * WORLD_W + x + 1] = TUFT
      if (rnd() < 0.5) buf[(y - 1) * WORLD_W + x] = TUFT_L
    }
    for (let k = 0; k < 500; k++) {
      const x = 2 + Math.floor(rnd() * (WORLD_W - 4))
      const y = 2 + Math.floor(rnd() * (WORLD_H - 4))
      if (at(x, y) !== 1 || at(x + 1, y) !== 1 || at(x, y + 1) !== 1) continue
      buf[y * WORLD_W + x] = PEBBLE_L
      buf[y * WORLD_W + x + 1] = PEBBLE
      buf[(y + 1) * WORLD_W + x] = PEBBLE
    }
    ctx.putImageData(img, 0, 0)

    // 6. flowers (clusters)
    const petals = ['#ffffff', '#ff7aa8', '#ffd23f', '#b99bff', '#ff9a5c']
    for (let c = 0; c < 46; c++) {
      const cx = rnd() * WORLD_W
      const cy = 90 + rnd() * (WORLD_H - 90)
      const col = petals[Math.floor(rnd() * petals.length)]
      const count = 3 + Math.floor(rnd() * 6)
      for (let f = 0; f < count; f++) {
        const x = Math.round(cx + (rnd() - 0.5) * 30)
        const y = Math.round(cy + (rnd() - 0.5) * 20)
        let ok = true
        for (let dy = -1; dy <= 2; dy++) for (let dx = -1; dx <= 1; dx++) if (at(x + dx, y + dy) !== 0) ok = false
        if (!ok || blocked(x, y)) continue
        px(ctx, x, y + 1, '#2f7a35')
        px(ctx, x - 1, y, col)
        px(ctx, x + 1, y, col)
        px(ctx, x, y - 1, col)
        px(ctx, x, y, '#ffd23f')
        this.flowers.push({ x, y })
      }
    }

    // 7. props, y-sorted
    const props: { y: number; draw: () => void }[] = []
    const add = (y: number, draw: () => void) => props.push({ y, draw })

    // forest edge along the top
    for (let x = -10; x < WORLD_W + 10; x += 13 + rnd() * 9) {
      const pine = rnd() < 0.45
      const y = 44 + rnd() * 42
      const xx = x
      if (pine) add(y, () => this.pine(ctx, xx, y, 34 + rnd() * 12))
      else add(y, () => this.tree(ctx, xx, y, 11 + rnd() * 4))
    }
    for (let x = -6; x < WORLD_W + 10; x += 15 + rnd() * 10) {
      const y = 16 + rnd() * 24
      const xx = x
      add(y, () => (rnd() < 0.5 ? this.pine(ctx, xx, y, 36) : this.tree(ctx, xx, y, 12)))
    }
    // bottom edge bushes
    for (let x = 0; x < WORLD_W; x += 22 + rnd() * 18) {
      const xx = x
      const y = WORLD_H - 4 - rnd() * 6
      add(y, () => this.bush(ctx, xx, y, 7 + rnd() * 3, rnd() < 0.3))
    }
    // scattered trees (avoid paths/buildings)
    const treeSpots = [
      [36, 214], [250, 126], [262, 288], [452, 196], [520, 236], [548, 164], [810, 140], [800, 300],
      [990, 150], [1004, 316], [60, 300], [430, 300], [60, 430], [190, 452], [330, 410], [610, 450],
      [700, 470], [780, 420], [870, 450], [960, 410], [1010, 470], [140, 400],
    ]
    for (const [x, y] of treeSpots) add(y, () => this.tree(ctx, x, y, 9 + rnd() * 4))
    const bushSpots = [
      [80, 236], [232, 240], [276, 244], [416, 250], [588, 250], [790, 250], [560, 300], [628, 312],
      [740, 316], [400, 470], [250, 380], [930, 300], [840, 300], [972, 260],
    ]
    for (const [x, y] of bushSpots) add(y, () => this.bush(ctx, x, y, 6 + rnd() * 2, rnd() < 0.4))
    const rocks = [[110, 316], [470, 318], [826, 192], [955, 196], [598, 400], [300, 456], [890, 392]]
    for (const [x, y] of rocks) add(y, () => this.rock(ctx, x, y, 7 + rnd() * 4))

    // buildings
    add(COLLEGE_A.y + COLLEGE_A.roofH + COLLEGE_A.wallH, () =>
      this.building(ctx, COLLEGE_A, { roof: 'red', wall: 'brick', sign: 'CSE DEPT', chimney: true, flag: true }),
    )
    add(COLLEGE_B.y + COLLEGE_B.roofH + COLLEGE_B.wallH, () =>
      this.building(ctx, COLLEGE_B, { roof: 'blue', wall: 'wood', sign: 'PLACEMENTS' }),
    )
    add(LAB_WALL_BOTTOM, () => this.building(ctx, LAB, { roof: 'violet', wall: 'stone', sign: 'AI LAB', lab: true }))

    // road furniture
    for (const lx of [40, 200, 360, 530, 832, 990]) add(ROAD_Y - 2, () => this.lamp(ctx, lx, ROAD_Y - 2))
    add(ROAD_Y - 4, () => this.questBoard(ctx, LAB_DOOR_X - 66, ROAD_Y - 6))
    add(ROAD_Y - 4, () => this.signpost(ctx, LAB_DOOR_X + 26, ROAD_Y - 4, 'AI LAB'))
    add(ROAD_Y + ROAD_H + 18, () => this.signpost(ctx, 26, ROAD_Y + ROAD_H + 18, 'CAMPUS'))
    // fences
    add(244, () => this.fence(ctx, 60, 244, 70))
    add(244, () => this.fence(ctx, 196, 244, 56))
    add(318, () => this.fence(ctx, 828, 318, 40))
    add(318, () => this.fence(ctx, 914, 318, 60))
    // campfire area
    add(CAMPFIRE.y + 4, () => this.campfireBase(ctx, CAMPFIRE.x, CAMPFIRE.y))
    add(CAMPFIRE.y - 14, () => this.log(ctx, CAMPFIRE.x - 12, CAMPFIRE.y - 16))
    add(CAMPFIRE.y + 22, () => this.log(ctx, CAMPFIRE.x - 12, CAMPFIRE.y + 18))
    add(CAMPFIRE.y + 2, () => this.bench(ctx, CAMPFIRE.x - 38, CAMPFIRE.y + 2))
    add(CAMPFIRE.y + 2, () => this.bench(ctx, CAMPFIRE.x + 22, CAMPFIRE.y + 2))
    this.lights.push({ x: CAMPFIRE.x, y: CAMPFIRE.y - 2, r: 26, color: 'warm' })
    // pond details
    add(POND.cy, () => this.pondDetails(ctx))

    props.sort((a, b) => a.y - b.y)
    for (const p of props) p.draw()

    // water shimmer points
    for (let k = 0; k < 90; k++) {
      const x = POND.cx + (rnd() - 0.5) * POND.rx * 1.6
      const y = POND.cy + (rnd() - 0.5) * POND.ry * 1.5
      if (at(Math.round(x), Math.round(y)) === 2 && pondQ(x, y) < 0.82)
        this.shimmer.push({ x: Math.round(x), y: Math.round(y), ph: rnd() * Math.PI * 2, len: 2 + Math.floor(rnd() * 3) })
    }
  }

  // ---------- prop painters ----------
  private shadow(ctx: Ctx, cx: number, cy: number, rx: number, ry: number) {
    ctx.fillStyle = '#3d8a3a'
    for (let y = -ry; y <= ry; y++)
      for (let x = -rx; x <= rx; x++)
        if ((x / rx) ** 2 + (y / ry) ** 2 <= 1 && bayer(cx + x, cy + y) < 0.62) {
          const gx = Math.round(cx + x)
          const gy = Math.round(cy + y)
          if (gx >= 0 && gy >= 0 && gx < WORLD_W && gy < WORLD_H && this.mask[gy * WORLD_W + gx] === 0)
            ctx.fillRect(gx, gy, 1, 1)
        }
  }

  private blob(
    ctx: Ctx,
    circles: Circle[],
    light: { x: number; y: number; scale: number },
    tones: string[],
    outline: string,
    rnd: () => number,
  ) {
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const c of circles) {
      minX = Math.min(minX, c.cx - c.r)
      minY = Math.min(minY, c.cy - c.r)
      maxX = Math.max(maxX, c.cx + c.r)
      maxY = Math.max(maxY, c.cy + c.r)
    }
    minX = Math.floor(minX) - 1
    minY = Math.floor(minY) - 1
    maxX = Math.ceil(maxX) + 1
    maxY = Math.ceil(maxY) + 1
    const inside = (x: number, y: number) => circles.some((c) => Math.hypot(x + 0.5 - c.cx, y + 0.5 - c.cy) <= c.r)
    for (let y = minY; y <= maxY; y++)
      for (let x = minX; x <= maxX; x++) {
        if (!inside(x, y)) continue
        const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1)
        if (edge) {
          px(ctx, x, y, outline)
          continue
        }
        const d = Math.hypot(x - light.x, y - light.y) / light.scale
        const v = 1 - d + (rnd() - 0.5) * 0.12 + (bayer(x, y) - 0.5) * 0.14
        const idx = v > 0.62 ? 0 : v > 0.36 ? 1 : v > 0.12 ? 2 : 3
        px(ctx, x, y, tones[idx])
      }
  }

  private tree(ctx: Ctx, cx: number, baseY: number, r: number) {
    cx = Math.round(cx)
    baseY = Math.round(baseY)
    const cy = baseY - 7 - r
    this.shadow(ctx, cx + 2, baseY - 1, Math.round(r * 0.95), Math.max(3, Math.round(r * 0.35)))
    // trunk
    const top = Math.round(cy + r * 0.4)
    for (let y = top; y < baseY; y++) {
      px(ctx, cx - 3, y, PAL.k)
      px(ctx, cx - 2, y, '#a8703c')
      px(ctx, cx - 1, y, '#8c5a2e', 2, 1)
      px(ctx, cx + 1, y, '#5a3520')
      px(ctx, cx + 2, y, PAL.k)
    }
    px(ctx, cx - 4, baseY - 1, PAL.k)
    px(ctx, cx + 3, baseY - 1, PAL.k)
    px(ctx, cx - 3, baseY - 1, '#8c5a2e', 6, 1)
    const circles: Circle[] = [
      { cx: cx + 0.5, cy, r },
      { cx: cx - r * 0.6, cy: cy + r * 0.3, r: r * 0.66 },
      { cx: cx + r * 0.62, cy: cy + r * 0.28, r: r * 0.64 },
      { cx: cx + 0.5, cy: cy - r * 0.42, r: r * 0.7 },
    ]
    this.blob(ctx, circles, { x: cx - r * 0.45, y: cy - r * 0.55, scale: r * 1.9 }, ['#8fd36a', '#5fb653', '#3c8d3f', '#2a6233'], '#1d3f24', this.rng)
    // a few leaf highlights
    for (let k = 0; k < Math.round(r / 2); k++) {
      const a = this.rng() * Math.PI * 2
      const d = this.rng() * r * 0.6
      const x = Math.round(cx - r * 0.2 + Math.cos(a) * d)
      const y = Math.round(cy - r * 0.2 + Math.sin(a) * d * 0.7)
      px(ctx, x, y, '#b5ec84')
      px(ctx, x + 1, y, '#8fd36a')
    }
  }

  private pine(ctx: Ctx, cx: number, baseY: number, h: number) {
    cx = Math.round(cx)
    baseY = Math.round(baseY)
    h = Math.round(h)
    this.shadow(ctx, cx + 2, baseY - 1, 9, 3)
    for (let y = baseY - 5; y < baseY; y++) {
      px(ctx, cx - 2, y, PAL.k)
      px(ctx, cx - 1, y, '#8c5a2e', 2, 1)
      px(ctx, cx + 1, y, '#5a3520')
      px(ctx, cx + 2, y, PAL.k)
    }
    const tiers = 3
    for (let i = 0; i < tiers; i++) {
      const top = baseY - h + i * (h * 0.24)
      const th = h * 0.44
      const maxHalf = 7 + i * 3
      for (let yy = 0; yy < th; yy++) {
        const y = Math.round(top + yy)
        const half = Math.round((yy / th) * maxHalf) + 1
        for (let x = -half; x <= half; x++) {
          const edge = x === -half || x === half || yy >= th - 1
          let col = x < -1 ? '#3e9a57' : x < 2 ? '#2f7d4a' : '#215f3a'
          if (x < -half + 3 && yy > 2 && bayer(cx + x, y) < 0.5) col = '#5bb86a'
          px(ctx, cx + x, y, edge ? '#143823' : col)
        }
      }
    }
  }

  private bush(ctx: Ctx, cx: number, baseY: number, r: number, berries: boolean) {
    cx = Math.round(cx)
    baseY = Math.round(baseY)
    const cy = baseY - r
    this.shadow(ctx, cx + 1, baseY, Math.round(r * 1.1), 2)
    this.blob(
      ctx,
      [
        { cx: cx - r * 0.45, cy: cy + 1, r: r * 0.8 },
        { cx: cx + r * 0.5, cy: cy + 1, r: r * 0.75 },
        { cx, cy: cy - r * 0.25, r: r * 0.8 },
      ],
      { x: cx - r * 0.5, y: cy - r * 0.6, scale: r * 2.1 },
      ['#8fd36a', '#5fb653', '#3c8d3f', '#2a6233'],
      '#1d3f24',
      this.rng,
    )
    if (berries)
      for (let k = 0; k < 4; k++) {
        const x = Math.round(cx + (this.rng() - 0.5) * r * 1.3)
        const y = Math.round(cy + (this.rng() - 0.3) * r * 0.9)
        px(ctx, x, y, '#e04848')
        px(ctx, x, y - 1, '#ffb3b3')
      }
  }

  private rock(ctx: Ctx, cx: number, baseY: number, r: number) {
    this.blob(
      ctx,
      [
        { cx, cy: baseY - r * 0.55, r: r * 0.7 },
        { cx: cx + r * 0.35, cy: baseY - r * 0.4, r: r * 0.55 },
      ],
      { x: cx - r * 0.4, y: baseY - r, scale: r * 1.6 },
      ['#e3e6ee', '#b9bfcc', '#8b91a6', '#666c82'],
      '#3d3550',
      this.rng,
    )
  }

  private building(
    ctx: Ctx,
    b: { x: number; y: number; w: number; roofH: number; wallH: number },
    o: { roof: 'red' | 'blue' | 'violet'; wall: 'brick' | 'wood' | 'stone'; sign: string; chimney?: boolean; flag?: boolean; lab?: boolean },
  ) {
    const roofs = {
      red: ['#f07a5f', '#e04848', '#a32d3d', '#7a2030'],
      blue: ['#7aa6ef', '#3f7fd8', '#2a5aa8', '#1f3f7a'],
      violet: ['#b49cff', '#8a63ff', '#6a45dd', '#46309a'],
    }[o.roof]
    const wallTop = b.y + b.roofH - 2
    const wx = b.x + 4
    const ww = b.w - 8
    // shadow on the right / bottom
    ctx.fillStyle = '#3d8a3a'
    for (let y = b.y + 10; y < wallTop + b.wallH + 4; y++)
      for (let x = b.x + b.w; x < b.x + b.w + 7; x++) if (bayer(x, y) < 0.65) ctx.fillRect(x, y, 1, 1)
    for (let y = wallTop + b.wallH; y < wallTop + b.wallH + 4; y++)
      for (let x = wx + 4; x < b.x + b.w + 7; x++)
        if (bayer(x, y) < 0.65 && this.mask[y * WORLD_W + x] === 0) ctx.fillRect(x, y, 1, 1)

    // wall
    for (let y = 0; y < b.wallH; y++)
      for (let x = 0; x < ww; x++) {
        let c: string
        if (o.wall === 'brick') {
          const row = Math.floor(y / 4)
          const joint = y % 4 === 3 || (x + (row % 2 ? 4 : 0)) % 8 === 7
          c = joint ? '#b86a4b' : (x + row) % 11 === 0 ? '#e9a07d' : '#d98663'
        } else if (o.wall === 'wood') {
          c = x % 7 === 6 ? '#a8703c' : y % 13 === 12 && x % 7 === 3 ? '#a8703c' : '#d9a066'
          if (x % 7 === 0) c = '#e8b67c'
        } else {
          const row = Math.floor(y / 6)
          const joint = y % 6 === 5 || (x + (row % 2 ? 6 : 0)) % 12 === 11
          c = joint ? '#b9b0cc' : '#ece7f6'
          if (y % 6 === 0 && !joint) c = '#f7f4fc'
        }
        if (y >= b.wallH - 3) c = y === b.wallH - 1 ? '#5d6378' : '#8b91a6'
        px(ctx, wx + x, wallTop + y, c)
      }
    // wall outline
    ctx.fillStyle = PAL.k
    ctx.fillRect(wx - 1, wallTop, 1, b.wallH)
    ctx.fillRect(wx + ww, wallTop, 1, b.wallH)
    ctx.fillRect(wx - 1, wallTop + b.wallH, ww + 2, 1)

    // windows
    const doorW = o.lab ? 20 : 14
    const doorH = o.lab ? 24 : 20
    const doorX = Math.round(b.x + b.w / 2 - doorW / 2)
    const doorY = wallTop + b.wallH - doorH
    const winW = o.lab ? 18 : 12
    const winH = o.lab ? 16 : 12
    const winY = wallTop + 8
    const spots: number[] = []
    const left = wx + 8
    const right = wx + ww - 8 - winW
    const leftOfDoor = doorX - 8 - winW
    const rightOfDoor = doorX + doorW + 8
    spots.push(left)
    if (leftOfDoor - left > winW + 6) spots.push(leftOfDoor)
    if (right - rightOfDoor > winW + 6) spots.push(rightOfDoor)
    spots.push(right)
    for (const sx of spots) {
      const glass = o.lab ? '#5a4bd6' : '#9be3ff'
      px(ctx, sx - 1, winY - 1, PAL.k, winW + 2, winH + 2)
      px(ctx, sx, winY, '#5a3520', winW, winH)
      px(ctx, sx + 1, winY + 1, glass, winW - 2, winH - 2)
      if (o.lab) {
        this.labWindows.push({ x: sx + 1, y: winY + 1, w: winW - 2, h: winH - 2 })
        this.lights.push({ x: sx + winW / 2, y: winY + winH / 2, r: 30, color: 'cool' })
      } else {
        px(ctx, sx + Math.floor(winW / 2) - 0.5, winY + 1, '#5a3520', 1, winH - 2)
        px(ctx, sx + 1, winY + Math.floor(winH / 2), '#5a3520', winW - 2, 1)
        px(ctx, sx + 2, winY + 2, '#ffffff', 2, 1)
        px(ctx, sx + 2, winY + 3, '#ffffff', 1, 1)
        this.lights.push({ x: sx + winW / 2, y: winY + winH / 2, r: 22, color: 'warm' })
      }
      // flower box
      px(ctx, sx - 1, winY + winH + 1, PAL.k, winW + 2, 4)
      px(ctx, sx, winY + winH + 1, '#a8703c', winW, 3)
      for (let f = 1; f < winW - 1; f += 3) {
        px(ctx, sx + f, winY + winH, o.lab ? '#4de1ff' : f % 2 ? '#ff7aa8' : '#ffd23f')
        px(ctx, sx + f + 1, winY + winH, '#3c8d3f')
      }
    }

    // door
    px(ctx, doorX - 1, doorY - 1, PAL.k, doorW + 2, doorH + 1)
    px(ctx, doorX, doorY, o.lab ? '#46309a' : '#8c5a2e', doorW, doorH)
    for (let x = 2; x < doorW; x += 4) px(ctx, doorX + x, doorY + 1, o.lab ? '#6a45dd' : '#a8703c', 1, doorH - 1)
    if (o.lab) {
      px(ctx, doorX + doorW / 2, doorY, PAL.k, 1, doorH)
      px(ctx, doorX + 3, doorY + 3, '#4de1ff', doorW / 2 - 5, 6)
      px(ctx, doorX + doorW / 2 + 2, doorY + 3, '#4de1ff', doorW / 2 - 5, 6)
    }
    px(ctx, doorX + doorW - 4, doorY + doorH / 2, '#ffd23f', 2, 2)
    px(ctx, doorX - 2, doorY + doorH, '#9aa0b5', doorW + 4, 2)
    px(ctx, doorX - 2, doorY + doorH + 2, '#5d6378', doorW + 4, 1)

    // roof with shingles
    for (let y = 0; y < b.roofH; y++)
      for (let x = 0; x < b.w; x++) {
        const row = Math.floor(y / 5)
        const off = row % 2 ? 4 : 0
        let c = roofs[1]
        if (y % 5 === 4) c = roofs[2]
        else if ((x + off) % 8 === 0) c = roofs[2]
        else if (y % 5 === 0) c = roofs[0]
        const ridge = Math.round(b.roofH * 0.38)
        if (y < ridge && c === roofs[1]) c = roofs[0]
        if (y === ridge) c = roofs[3]
        if (y === ridge + 1) c = roofs[0]
        if (y < 3) c = y === 0 ? roofs[3] : roofs[0]
        if (y >= b.roofH - 2) c = roofs[3]
        if (x < 2 || x >= b.w - 2) c = roofs[2]
        px(ctx, b.x + x, b.y + y, c)
      }
    ctx.fillStyle = PAL.k
    ctx.fillRect(b.x - 1, b.y - 1, b.w + 2, 1)
    ctx.fillRect(b.x - 1, b.y, 1, b.roofH)
    ctx.fillRect(b.x + b.w, b.y, 1, b.roofH)
    ctx.fillRect(b.x - 1, b.y + b.roofH, b.w + 2, 1)
    // eave shadow on the wall
    for (let x = wx; x < wx + ww; x++) if (bayer(x, wallTop + b.roofH) < 0.7) px(ctx, x, b.y + b.roofH + 1, '#00000033')

    // sign board above the door
    const tw = textWidth3x5(o.sign)
    const sw = tw + 8
    const sx = Math.round(b.x + b.w / 2 - sw / 2)
    const sy = doorY - 12
    px(ctx, sx - 1, sy - 1, PAL.k, sw + 2, 11)
    px(ctx, sx, sy, o.lab ? '#2b2135' : '#c58a4e', sw, 9)
    px(ctx, sx, sy + 8, o.lab ? '#46309a' : '#8c5a2e', sw, 1)
    drawText3x5(ctx, o.sign, sx + 4, sy + 2, o.lab ? '#ffd23f' : '#2b2135')

    if (o.chimney) {
      const cx = b.x + b.w - 30
      const cy = b.y - 6
      px(ctx, cx - 1, cy - 1, PAL.k, 12, 16)
      for (let y = 0; y < 14; y++)
        for (let x = 0; x < 10; x++) px(ctx, cx + x, cy + y, y % 3 === 2 || (x + (Math.floor(y / 3) % 2 ? 2 : 0)) % 5 === 4 ? '#7a3a30' : '#b8574a')
      px(ctx, cx - 1, cy - 2, PAL.k, 12, 2)
      this.chimney = { x: cx + 5, y: cy - 3 }
    }
    if (o.flag) {
      const fx = b.x + 18
      const fy = b.y - 26
      px(ctx, fx, fy, PAL.k, 1, 28)
      px(ctx, fx - 1, fy - 1, '#ffd23f', 3, 2)
      this.flagPos = { x: fx + 1, y: fy + 1 }
    }
    if (o.lab) {
      // satellite dish + antenna on the roof
      const dx = b.x + 24
      const dy = b.y + 8
      this.blob(
        ctx,
        [{ cx: dx, cy: dy, r: 8 }],
        { x: dx - 4, y: dy - 5, scale: 14 },
        ['#ffffff', '#d5d9e5', '#9aa0b5', '#6d7389'],
        PAL.k,
        this.rng,
      )
      px(ctx, dx - 1, dy - 1, '#5d6378', 3, 3)
      px(ctx, dx + 4, dy - 6, PAL.k, 1, 6)
      const ax = b.x + b.w - 28
      const ay = b.y - 22
      px(ctx, ax - 1, ay, PAL.k, 3, 26)
      px(ctx, ax, ay + 1, '#9aa0b5', 1, 24)
      px(ctx, ax - 5, ay + 8, PAL.k, 11, 1)
      px(ctx, ax - 3, ay + 14, PAL.k, 7, 1)
      this.antenna = { x: ax, y: ay - 2 }
      this.lights.push({ x: ax, y: ay - 1, r: 14, color: 'warm' })
    }
  }

  private lamp(ctx: Ctx, x: number, baseY: number) {
    px(ctx, x - 2, baseY - 2, PAL.k, 5, 2)
    px(ctx, x - 1, baseY - 22, PAL.k, 3, 21)
    px(ctx, x, baseY - 21, '#5d6378', 1, 19)
    px(ctx, x - 3, baseY - 29, PAL.k, 7, 8)
    px(ctx, x - 2, baseY - 28, '#ffe9a0', 5, 6)
    px(ctx, x - 2, baseY - 28, '#fff6d0', 2, 2)
    px(ctx, x - 4, baseY - 30, PAL.k, 9, 2)
    this.lights.push({ x, y: baseY - 25, r: 26, color: 'warm' })
  }

  private questBoard(ctx: Ctx, x: number, baseY: number) {
    const w = 30
    // posts
    px(ctx, x + 2, baseY - 24, PAL.k, 4, 24)
    px(ctx, x + 3, baseY - 23, '#8c5a2e', 2, 23)
    px(ctx, x + w - 6, baseY - 24, PAL.k, 4, 24)
    px(ctx, x + w - 5, baseY - 23, '#8c5a2e', 2, 23)
    // board
    px(ctx, x - 1, baseY - 27, PAL.k, w + 2, 18)
    px(ctx, x, baseY - 26, '#c58a4e', w, 16)
    for (let yy = 0; yy < 16; yy += 4) px(ctx, x, baseY - 26 + yy, '#a8703c', w, 1)
    // pinned notes
    const notes = [
      [x + 3, baseY - 24, '#fff6e0'],
      [x + 12, baseY - 23, '#ffd23f'],
      [x + 21, baseY - 24, '#fff6e0'],
    ] as const
    for (const [nx, ny, col] of notes) {
      px(ctx, nx - 1, ny - 1, PAL.k, 8, 11)
      px(ctx, nx, ny, col, 6, 9)
      px(ctx, nx + 1, ny + 3, '#9aa0b5', 4, 1)
      px(ctx, nx + 1, ny + 5, '#9aa0b5', 3, 1)
      px(ctx, nx + 2, ny, '#e04848', 2, 1)
    }
    // little roof
    px(ctx, x - 3, baseY - 31, PAL.k, w + 6, 5)
    px(ctx, x - 2, baseY - 30, '#a32d3d', w + 4, 3)
    px(ctx, x - 2, baseY - 30, '#e04848', w + 4, 1)
    this.questMarker = { x: x + w / 2, y: baseY - 43 }
    this.lights.push({ x: x + w / 2, y: baseY - 40, r: 18, color: 'warm' })
  }

  private signpost(ctx: Ctx, x: number, baseY: number, text: string) {
    const tw = textWidth3x5(text)
    px(ctx, x - 1, baseY - 18, PAL.k, 4, 18)
    px(ctx, x, baseY - 17, '#8c5a2e', 2, 17)
    const bw = tw + 8
    px(ctx, x - 4, baseY - 21, PAL.k, bw + 2, 11)
    px(ctx, x - 3, baseY - 20, '#d9a066', bw, 9)
    px(ctx, x - 3, baseY - 12, '#a8703c', bw, 1)
    // arrow tip
    px(ctx, x - 2 + bw, baseY - 19, PAL.k, 2, 7)
    px(ctx, x + bw, baseY - 17, PAL.k, 2, 3)
    drawText3x5(ctx, text, x + 1, baseY - 18, PAL.k)
  }

  private fence(ctx: Ctx, x: number, baseY: number, len: number) {
    px(ctx, x, baseY - 8, PAL.k, len, 2)
    px(ctx, x, baseY - 7, '#c58a4e', len, 1)
    px(ctx, x, baseY - 4, PAL.k, len, 2)
    px(ctx, x, baseY - 3, '#a8703c', len, 1)
    for (let p = 0; p <= len - 4; p += 10) {
      px(ctx, x + p - 1, baseY - 11, PAL.k, 5, 11)
      px(ctx, x + p, baseY - 10, '#d9a066', 3, 10)
      px(ctx, x + p + 2, baseY - 10, '#8c5a2e', 1, 10)
    }
  }

  private bench(ctx: Ctx, x: number, baseY: number) {
    px(ctx, x - 1, baseY - 8, PAL.k, 18, 5)
    px(ctx, x, baseY - 7, '#c58a4e', 16, 2)
    px(ctx, x, baseY - 5, '#8c5a2e', 16, 1)
    px(ctx, x + 1, baseY - 4, PAL.k, 2, 4)
    px(ctx, x + 13, baseY - 4, PAL.k, 2, 4)
  }

  private log(ctx: Ctx, x: number, y: number) {
    px(ctx, x - 1, y - 1, PAL.k, 26, 8)
    px(ctx, x, y, '#a8703c', 24, 6)
    px(ctx, x, y, '#c58a4e', 24, 2)
    px(ctx, x + 23, y, '#e8b67c', 1, 6)
    px(ctx, x + 22, y + 2, '#8c5a2e', 1, 2)
  }

  private campfireBase(ctx: Ctx, cx: number, cy: number) {
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * Math.PI * 2
      const sx = Math.round(cx + Math.cos(a) * 9)
      const sy = Math.round(cy + Math.sin(a) * 5)
      px(ctx, sx - 2, sy - 2, PAL.k, 5, 4)
      px(ctx, sx - 1, sy - 1, '#b9bfcc', 3, 2)
      px(ctx, sx - 1, sy - 1, '#e3e6ee', 1, 1)
    }
    px(ctx, cx - 6, cy - 2, PAL.k, 13, 4)
    px(ctx, cx - 5, cy - 1, '#8c5a2e', 11, 2)
    px(ctx, cx - 2, cy - 4, PAL.k, 5, 7)
    px(ctx, cx - 1, cy - 3, '#5a3520', 3, 5)
  }

  private pondDetails(ctx: Ctx) {
    const pads = [
      [POND.cx - 30, POND.cy - 12],
      [POND.cx + 24, POND.cy + 14],
      [POND.cx + 36, POND.cy - 8],
      [POND.cx - 14, POND.cy + 18],
    ]
    for (const [x, y] of pads) {
      this.blob(ctx, [{ cx: x, cy: y, r: 4 }], { x: x - 2, y: y - 2, scale: 6 }, ['#9be564', '#5fb653', '#3c8d3f', '#2a6233'], '#1d3f24', this.rng)
      px(ctx, x, y - 3, '#4f97e6', 1, 3)
    }
    px(ctx, POND.cx + 24, POND.cy + 11, '#ff7aa8', 2, 2)
    // reeds on the shore
    for (const [x, y] of [
      [POND.cx - POND.rx + 6, POND.cy - 6],
      [POND.cx - POND.rx + 10, POND.cy + 10],
      [POND.cx + POND.rx - 8, POND.cy - 14],
      [POND.cx + POND.rx - 4, POND.cy + 4],
    ]) {
      for (let r = 0; r < 4; r++) {
        const h = 6 + ((r * 7) % 5)
        px(ctx, x + r * 2, y - h, '#2a6233', 1, h)
        if (r % 2 === 0) px(ctx, x + r * 2, y - h - 2, '#8c5a2e', 1, 3)
      }
    }
  }

  // ======================= dynamic layer =======================
  private spawn(t: number) {
    const look = LOOKS[Math.floor(Math.random() * LOOKS.length)]
    const r = Math.random()
    const lane = LANE_Y + Math.round((Math.random() - 0.5) * 12)
    const doorX = LAB_DOOR_X + Math.round((Math.random() - 0.5) * 8)
    const into = [
      { x: doorX, y: lane },
      { x: doorX, y: LAB_WALL_BOTTOM + 2 },
    ]
    let path: { x: number; y: number }[]
    let enters = true
    if (r < 0.2) {
      // from the CSE department
      const sx = COLLEGE_A.x + COLLEGE_A.w / 2
      path = [{ x: sx, y: 232 }, { x: sx, y: lane }, ...into]
    } else if (r < 0.38) {
      const sx = COLLEGE_B.x + COLLEGE_B.w / 2
      path = [{ x: sx, y: 236 }, { x: sx, y: lane }, ...into]
    } else {
      const fromLeft = Math.random() < 0.55
      const sx = fromLeft ? -10 : WORLD_W + 10
      enters = Math.random() < 0.75
      path = enters ? [{ x: sx, y: lane }, ...into] : [{ x: sx, y: lane }, { x: fromLeft ? WORLD_W + 10 : -10, y: lane }]
    }
    this.npcs.push({
      look,
      x: path[0].x,
      y: path[0].y,
      path,
      seg: 1,
      speed: 22 + Math.random() * 10,
      facing: 'down',
      enters,
      done: false,
      phase: Math.random() * 10,
    })
    this.nextSpawn = t + 1.3 + Math.random() * 2.2
  }

  update(t: number, dt: number) {
    if (t >= this.nextSpawn && this.npcs.length < 10) this.spawn(t)
    for (const n of this.npcs) {
      const target = n.path[n.seg]
      if (!target) {
        n.done = true
        continue
      }
      const dx = target.x - n.x
      const dy = target.y - n.y
      const d = Math.hypot(dx, dy)
      const step = n.speed * dt
      if (Math.abs(dx) > Math.abs(dy)) n.facing = dx > 0 ? 'right' : 'left'
      else n.facing = dy > 0 ? 'down' : 'up'
      if (d <= step) {
        n.x = target.x
        n.y = target.y
        n.seg++
        if (n.seg >= n.path.length) {
          n.done = true
          if (n.enters) {
            this.pops.push({ x: n.x, y: n.y - 18, born: t })
            this.onEnter?.()
          }
        }
      } else {
        n.x += (dx / d) * step
        n.y += (dy / d) * step
      }
    }
    this.npcs = this.npcs.filter((n) => !n.done)
    this.pops = this.pops.filter((p) => t - p.born < 1.4)
  }

  render(ctx: Ctx, vx: number, vy: number, vw: number, vh: number, t: number, night: boolean) {
    vx = Math.round(vx)
    vy = Math.round(vy)
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, vw, vh)
    ctx.drawImage(this.canvas, vx, vy, vw, vh, 0, 0, vw, vh)
    ctx.save()
    ctx.translate(-vx, -vy)

    // water shimmer
    for (const s of this.shimmer) {
      const v = Math.sin(t * 1.6 + s.ph)
      if (v > 0.55) px(ctx, s.x, s.y, '#bfe6ff', s.len, 1)
      else if (v > 0.2) px(ctx, s.x + 1, s.y, '#8fcff7', Math.max(1, s.len - 1), 1)
    }
    // ducks
    for (let d = 0; d < 2; d++) {
      const a = t * 0.18 + d * Math.PI
      const x = Math.round(POND.cx + Math.cos(a) * (POND.rx * 0.5))
      const y = Math.round(POND.cy + Math.sin(a) * (POND.ry * 0.45))
      const dir = -Math.sin(a) > 0 ? 1 : -1
      this.duck(ctx, x, y, dir, t)
    }
    // lab window "code" scrolling
    for (const w of this.labWindows) {
      for (let line = 0; line < 4; line++) {
        const yy = w.y + ((Math.floor(t * 6) + line * 4) % w.h)
        const len = 3 + ((line * 5 + Math.floor(t * 2)) % (w.w - 4))
        px(ctx, w.x + 2, yy, line % 2 ? '#4de1ff' : '#b49cff', Math.min(len, w.w - 3), 1)
      }
    }
    // antenna blink
    if (Math.floor(t * 1.6) % 2 === 0) {
      px(ctx, this.antenna.x - 1, this.antenna.y - 1, '#e04848', 3, 3)
      px(ctx, this.antenna.x, this.antenna.y - 1, '#ffb3b3', 1, 1)
    } else px(ctx, this.antenna.x - 1, this.antenna.y - 1, '#7a2030', 3, 3)
    // flag
    const f = Math.floor(t * 4) % 2
    px(ctx, this.flagPos.x, this.flagPos.y, PAL.k, 14, 9)
    px(ctx, this.flagPos.x, this.flagPos.y + 1, '#e04848', 13, 7)
    px(ctx, this.flagPos.x + 1, this.flagPos.y + 2, '#ffd23f', 3, 2)
    if (f) px(ctx, this.flagPos.x + 8, this.flagPos.y + 1, '#a32d3d', 5, 1)
    else px(ctx, this.flagPos.x + 6, this.flagPos.y + 7, '#a32d3d', 7, 1)
    // chimney smoke
    for (let k = 0; k < 4; k++) {
      const life = (t * 0.5 + k * 0.25) % 1
      const sx = Math.round(this.chimney.x + Math.sin(life * 6 + k) * 3 + life * 6)
      const sy = Math.round(this.chimney.y - life * 26)
      const r = 1 + Math.round(life * 3)
      ctx.fillStyle = life > 0.7 ? '#e6e3ee88' : '#f4f2f8cc'
      ctx.fillRect(sx - r, sy - r + 1, r * 2, r * 2 - 2)
      ctx.fillRect(sx - r + 1, sy - r, r * 2 - 2, r * 2)
    }
    // campfire
    this.flames(ctx, CAMPFIRE.x, CAMPFIRE.y - 3, t)
    // quest marker
    const bob = Math.round(Math.sin(t * 4) * 1.5)
    this.marker(ctx, this.questMarker.x, this.questMarker.y + bob)

    // butterflies by day, fireflies by night
    for (let b = 0; b < 6; b++) {
      const fl = this.flowers[(b * 37) % Math.max(1, this.flowers.length)]
      if (!fl) continue
      const bx = Math.round(fl.x + Math.sin(t * 0.9 + b * 2) * 14 + Math.sin(t * 2.3 + b) * 4)
      const by = Math.round(fl.y - 8 + Math.cos(t * 1.1 + b) * 7)
      if (night) {
        if (Math.sin(t * 3 + b * 1.7) > -0.2) {
          px(ctx, bx, by, '#fff3a0')
          px(ctx, bx - 1, by, '#c7e86455')
          px(ctx, bx + 1, by, '#c7e86455')
        }
      } else {
        const open = Math.floor(t * 8 + b) % 2 === 0
        const col = ['#ffffff', '#ffd23f', '#ff7aa8'][b % 3]
        px(ctx, bx, by, PAL.k)
        if (open) {
          px(ctx, bx - 2, by - 1, col, 2, 2)
          px(ctx, bx + 1, by - 1, col, 2, 2)
        } else {
          px(ctx, bx - 1, by - 1, col, 1, 2)
          px(ctx, bx + 1, by - 1, col, 1, 2)
        }
      }
    }

    // characters (y-sorted)
    const sorted = [...this.npcs].sort((a, b) => a.y - b.y)
    for (const n of sorted) {
      const frame = Math.floor((t + n.phase) * 6) % 2
      const rows = CHAR_FRAMES[n.facing][frame]
      const x = Math.round(n.x - 6)
      const y = Math.round(n.y - 15 - (frame ? 1 : 0))
      ctx.fillStyle = 'rgba(30,40,20,0.25)'
      ctx.fillRect(Math.round(n.x - 4), Math.round(n.y), 8, 2)
      drawGrid(ctx, rows, x, y, n.look)
    }
    // "+1" pops at the lab door
    for (const p of this.pops) {
      const age = t - p.born
      const yy = Math.round(p.y - age * 14)
      if (age < 0.5) {
        const s = Math.floor(age * 8) % 2
        px(ctx, p.x - 1, p.y + 6 - s, '#ffd23f', 3, 1)
        px(ctx, p.x, p.y + 5 - s, '#ffd23f', 1, 3)
      }
      ctx.fillStyle = PAL.k
      drawText3x5(ctx, '+1', p.x - 3, yy + 1, PAL.k)
      drawText3x5(ctx, '+1', p.x - 4, yy, '#ffd23f')
    }

    if (night) {
      ctx.restore()
      ctx.save()
      ctx.globalCompositeOperation = 'multiply'
      ctx.fillStyle = '#4a4a9a'
      ctx.fillRect(0, 0, vw, vh)
      ctx.globalCompositeOperation = 'lighter'
      ctx.translate(-vx, -vy)
      for (const l of this.lights) {
        const g = l.color === 'cool' ? this.glowCool : this.glowWarm
        const r = l.r
        const flicker = l.color === 'warm' ? 1 + Math.sin(t * 9 + l.x) * 0.03 : 1
        const s = Math.round(r * 2 * flicker)
        ctx.drawImage(g, Math.round(l.x - s / 2), Math.round(l.y - s / 2), s, s)
      }
    }
    ctx.restore()
  }

  private duck(ctx: Ctx, x: number, y: number, dir: number, t: number) {
    const bob = Math.floor(t * 2) % 2
    const rows = ['..kk...', '.kwwk..', 'kwwwwkk', 'kwwwwwo', '.kwwwk.', '..kkk..']
    const r = dir > 0 ? rows.map((s) => s.split('').reverse().join('')) : rows
    px(ctx, x - 4, y + 3, '#bfe6ff', 9, 1)
    drawGrid(ctx, r, x - 3, y - 3 + bob, { o: '#f28c28' })
    px(ctx, dir > 0 ? x + 1 : x - 2, y - 2 + bob, PAL.k)
  }

  private flames(ctx: Ctx, x: number, y: number, t: number) {
    const f = Math.floor(t * 8) % 3
    const shapes = [
      ['..y..', '.yoy.', '.ooo.', 'orrro', '.rrr.'],
      ['.y...', '.yy..', '.oyo.', 'orroo', '.rrr.'],
      ['...y.', '..yy.', '.oyo.', 'oorro', '.rrr.'],
    ][f]
    drawGrid(ctx, shapes, x - 2, y - 4, { r: '#e04848', o: '#f28c28', y: '#ffd23f' })
    const sp = (t * 1.5) % 1
    px(ctx, Math.round(x + Math.sin(t * 5) * 3), Math.round(y - 6 - sp * 10), '#ffd23f')
  }

  private marker(ctx: Ctx, x: number, y: number) {
    const rows = ['.kkk.', 'kyyyk', 'kyyyk', 'kyyyk', 'kyyyk', '.kyk.', '.kkk.', 'kyyyk', '.kkk.']
    drawGrid(ctx, rows, x - 2, y)
  }
}
