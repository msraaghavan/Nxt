import { BUDGET, CHANNELS, CUMULATIVE_TARGET, DAILY_TARGET, WORKSHOP, type ChannelId, type HookId } from '../config'
import { shortName } from './colleges'
import { TEST_DAYS } from './simulate'
import type { Snapshot } from './store'
import type { Registration } from './types'

export const SHOW_UP_WITH_FLOW = 0.42
export const SHOW_UP_BASELINE = 0.25

export function computeMetrics(s: Snapshot) {
  const regs = s.registrations
  const day = s.simDay
  const total = regs.length
  const sum = (k: 'visits' | 'starts' | 'shares', f = s.funnel) => f.reduce((a, b) => a + b[k], 0)
  const visits = sum('visits')
  const starts = sum('starts')
  const shares = sum('shares')

  // per day per channel
  const daily = Array.from({ length: 7 }, (_, i) => {
    const d = i + 1
    const row: Record<ChannelId, number> = { leaders: 0, clubs: 0, referral: 0, organic: 0 }
    for (const r of regs) if (r.day === d) row[r.channel]++
    const count = Object.values(row).reduce((a, b) => a + b, 0)
    return { day: d, ...row, total: count, target: DAILY_TARGET[i], cumTarget: CUMULATIVE_TARGET[i] }
  })
  let run = 0
  const cumulative = daily.map((d) => (run += d.day <= day ? d.total : 0))

  const byChannel = CHANNELS.map((c) => {
    const n = regs.filter((r) => r.channel === c.id).length
    const v = s.funnel.filter((f) => f.channel === c.id).reduce((a, b) => a + b.visits, 0)
    return { ...c, regs: n, visits: v, cvr: v ? n / v : 0, share: total ? n / total : 0 }
  })

  const referral = byChannel.find((c) => c.id === 'referral')!.regs
  const kFactor = total - referral > 0 ? referral / (total - referral) : 0

  // College Wars
  const collegeMap = new Map<string, number>()
  for (const r of regs) collegeMap.set(r.college, (collegeMap.get(r.college) ?? 0) + 1)
  const colleges = [...collegeMap]
    .map(([name, count]) => ({ name, short: shortName(name), count }))
    .sort((a, b) => b.count - a.count)

  // Quest Leaders
  const leaderCounts = new Map<string, number>()
  for (const r of regs) if (r.leader) leaderCounts.set(r.leader, (leaderCounts.get(r.leader) ?? 0) + 1)
  const leaders = s.leaders
    .map((l) => ({ ...l, regs: leaderCounts.get(l.code) ?? 0 }))
    .sort((a, b) => b.regs - a.regs)

  // Squad referrers
  const refCounts = new Map<string, number>()
  for (const r of regs) if (r.referredBy && !r.referredBy.startsWith('QL-')) refCounts.set(r.referredBy, (refCounts.get(r.referredBy) ?? 0) + 1)
  const byCode = new Map(regs.map((r) => [r.code, r]))
  const referrers = [...refCounts]
    .map(([code, count]) => ({ code, count, reg: byCode.get(code) }))
    .filter((x): x is { code: string; count: number; reg: Registration } => Boolean(x.reg))
    .sort((a, b) => b.count - a.count)

  // A/B hook test (days 1..TEST_DAYS)
  const hookStats = (h: HookId) => {
    const f = s.funnel.filter((b) => b.hook === h && b.day <= TEST_DAYS)
    const v = f.reduce((a, b) => a + b.visits, 0)
    const n = regs.filter((r) => r.hook === h && r.day <= TEST_DAYS).length
    return { visits: v, regs: n, cvr: v ? n / v : 0 }
  }
  const A = hookStats('A')
  const B = hookStats('B')
  const p = (A.regs + B.regs) / Math.max(1, A.visits + B.visits)
  const se = Math.sqrt(p * (1 - p) * (1 / Math.max(1, A.visits) + 1 / Math.max(1, B.visits)))
  const z = se ? (B.cvr - A.cvr) / se : 0
  const confidence = normalCdf(Math.abs(z)) * 2 - 1
  const abTest = { A, B, z, confidence, winner: (B.cvr >= A.cvr ? 'B' : 'A') as HookId, decided: day > TEST_DAYS }

  // hours
  const hours = Array.from({ length: 24 }, (_, h) => regs.filter((r) => r.hour === h).length)

  // quality
  const finalYear = regs.filter((r) => r.gradYear === 2027).length
  const csIt = regs.filter((r) => /CSE|IT|AI|Data/.test(r.branch)).length
  const priorAI = regs.filter((r) => r.priorAI).length

  // forecast: recent pace for the remaining days, blended with the plan
  const done = daily.filter((d) => d.day <= day)
  const last2 = done.slice(-2)
  const pace = last2.length ? last2.reduce((a, b) => a + b.total, 0) / last2.length : 0
  const remainingPlan = DAILY_TARGET.slice(day).reduce((a, b) => a + b, 0)
  const remainingDays = 7 - day
  const forecast = Math.round(total + (remainingDays ? 0.6 * pace * remainingDays + 0.4 * remainingPlan : 0))
  const onTrack = total >= CUMULATIVE_TARGET[day - 1] * 0.95

  const spendCommitted = BUDGET.reduce((a, b) => a + b.amount, 0)
  const cpr = total ? spendCommitted / Math.max(total, forecast) : 0

  return {
    day,
    total,
    goal: WORKSHOP.goal,
    visits,
    starts,
    shares,
    cvr: visits ? total / visits : 0,
    formCompletion: starts ? total / starts : 0,
    shareRate: total ? shares / total : 0,
    kFactor,
    daily,
    cumulative,
    byChannel,
    colleges,
    leaders,
    referrers,
    abTest,
    hours,
    quality: { finalYear: total ? finalYear / total : 0, csIt: total ? csIt / total : 0, priorAI: total ? priorAI / total : 0 },
    forecast,
    onTrack,
    target: CUMULATIVE_TARGET[day - 1],
    showUp: Math.round(Math.max(total, forecast) * SHOW_UP_WITH_FLOW),
    showUpBaseline: Math.round(Math.max(total, forecast) * SHOW_UP_BASELINE),
    cpr,
    today: daily[day - 1]?.total ?? 0,
  }
}
export type Metrics = ReturnType<typeof computeMetrics>

function normalCdf(x: number) {
  // Abramowitz-Stegun approximation
  const t = 1 / (1 + 0.2316419 * Math.abs(x))
  const d = 0.3989423 * Math.exp((-x * x) / 2)
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
  return x > 0 ? 1 - prob : prob
}

export function referralsOf(s: Snapshot, code: string) {
  return s.registrations.filter((r) => r.referredBy === code)
}

export function toCSV(regs: Registration[]) {
  const cols: (keyof Registration)[] = ['name', 'phone', 'email', 'college', 'branch', 'gradYear', 'priorAI', 'code', 'referredBy', 'leader', 'channel', 'source', 'hook', 'day', 'hour', 'simulated']
  const esc = (v: unknown) => {
    const str = v === undefined ? '' : String(v)
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
  }
  return [cols.join(','), ...regs.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n')
}
