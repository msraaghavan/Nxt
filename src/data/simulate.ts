// Deterministic 7-day campaign simulation. It plays the plan's base-case funnel
// with realistic noise so the Command Center has something honest to show:
// the target curve is the plan, the bars are "what actually happened".
import { CHANNELS, type ChannelId, type HookId } from '../config'
import { mulberry32 } from '../pixel/draw'
import { BRANCHES, COLLEGES } from './colleges'
import type { FunnelBucket, Leader, Registration } from './types'

// Planned registrations per channel per day (sums to the plan's 550).
export const CHANNEL_DAY_PLAN: Record<ChannelId, number[]> = {
  leaders: [15, 50, 55, 45, 40, 35, 30],
  clubs: [0, 10, 25, 20, 15, 15, 15],
  referral: [5, 5, 10, 20, 25, 40, 45],
  organic: [10, 5, 5, 5, 5, 0, 0],
}

const FIRST = [
  'Sai', 'Harika', 'Rahul', 'Divya', 'Karthik', 'Sravani', 'Vamsi', 'Keerthi', 'Teja', 'Bhavana', 'Rohith', 'Sneha',
  'Manikanta', 'Pooja', 'Abhishek', 'Lahari', 'Charan', 'Meghana', 'Pavan', 'Anusha', 'Nikhil', 'Sindhu', 'Akhil',
  'Deepika', 'Varun', 'Swathi', 'Srikanth', 'Ramya', 'Harsha', 'Tejaswini', 'Yaswanth', 'Nandini', 'Praneeth',
  'Likhitha', 'Ganesh', 'Navya', 'Rakesh', 'Mounika', 'Ajay', 'Bhargavi', 'Kiran', 'Sahithi', 'Mahesh', 'Hema',
  'Arjun', 'Jahnavi', 'Siddharth', 'Varshini', 'Naveen', 'Ishitha', 'Dinesh', 'Sruthi', 'Prudhvi', 'Akshaya',
]
const LAST = 'ABCDGKMNPRSTVY'

const CVR: Record<ChannelId, number> = { leaders: 0.35, clubs: 0.4, referral: 0.45, organic: 0.3 }
// Traffic is split 50/50 between hooks until the test ends on day 3; the
// placement hook (B) converts better, so it is rolled out to every link after.
const P_B_GIVEN_REG = 0.6
export const TEST_DAYS = 3

export interface Simulation {
  registrations: Registration[]
  leaders: Leader[]
  funnel: FunnelBucket[]
}

export function makeCode(name: string, rnd: () => number) {
  const base = name.replace(/[^a-z]/gi, '').toUpperCase().slice(0, 5) || 'QUEST'
  return `${base}${100 + Math.floor(rnd() * 900)}`
}

export function simulate(startMs: number, seed = 2026): Simulation {
  const rnd = mulberry32(seed)
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rnd() * arr.length)]
  const usedCodes = new Set<string>()
  const uniqueCode = (prefix: string, name: string) => {
    let c = prefix + makeCode(name, rnd)
    while (usedCodes.has(c)) c = prefix + makeCode(name, rnd)
    usedCodes.add(c)
    return c
  }

  // --- Quest Leaders: 24 recruited on day 1, 6 more on day 2 ---
  const leaderColleges = COLLEGES.slice(0, 26)
  const leaders: Leader[] = Array.from({ length: 30 }, (_, i) => {
    const first = FIRST[(i * 7 + 3) % FIRST.length]
    return {
      code: uniqueCode('QL-', first),
      name: `${first} ${LAST[i % LAST.length]}.`,
      college: leaderColleges[i % leaderColleges.length].name,
      day: i < 24 ? 1 : 2,
      simulated: true,
    }
  })
  // some leaders are much stronger than others (power law)
  const leaderWeight = leaders.map((_, i) => 1 / Math.pow(i + 1.5, 0.75))
  const clubColleges = [0, 1, 2, 3, 5, 9, 12, 20, 21, 25].map((i) => COLLEGES[i].name)
  const collegeWeight = COLLEGES.map((_, i) => 1 / Math.pow(i + 2, 0.9))

  const weighted = <T,>(items: T[], w: number[]) => {
    const total = w.reduce((s, v) => s + v, 0)
    let r = rnd() * total
    for (let i = 0; i < items.length; i++) {
      r -= w[i]
      if (r <= 0) return items[i]
    }
    return items[items.length - 1]
  }
  // evening-heavy hour distribution (class WhatsApp groups are busiest 7-11 PM)
  const hours = Array.from({ length: 24 }, (_, h) => h)
  const hourW = hours.map((h) =>
    h < 7 ? 0.15 : h < 10 ? 0.8 : h < 13 ? 1.1 : h < 16 ? 0.9 : h < 19 ? 1.4 : h < 23 ? 3.2 : 0.9,
  )
  const branchW = [45, 10, 12, 18, 7, 5, 3, 0]

  const registrations: Registration[] = []
  const funnel: FunnelBucket[] = []

  for (let day = 1; day <= 7; day++) {
    const activeLeaders = leaders.filter((l) => l.day <= day)
    for (const ch of CHANNELS) {
      const planned = CHANNEL_DAY_PLAN[ch.id][day - 1]
      const noise = 0.86 + rnd() * 0.3
      const n = Math.round(planned * noise)
      const hookFor = (): HookId => (day <= TEST_DAYS ? (rnd() < P_B_GIVEN_REG ? 'B' : 'A') : 'B')
      // registrations
      const dayRegs: Registration[] = []
      for (let k = 0; k < n; k++) {
        const hook = hookFor()
        const first = pick(FIRST)
        const name = `${first} ${pick(LAST.split(''))}.`
        let college = weighted(COLLEGES, collegeWeight).name
        let leader: string | undefined
        let referredBy: string | undefined
        let source = 'direct'
        if (ch.id === 'leaders') {
          const l = weighted(activeLeaders, leaderWeight.slice(0, activeLeaders.length))
          leader = l.code
          referredBy = l.code
          if (rnd() < 0.85) college = l.college
          source = 'whatsapp-group'
        } else if (ch.id === 'clubs') {
          college = pick(clubColleges)
          source = rnd() < 0.6 ? 'club-broadcast' : 'tnp-notice'
        } else if (ch.id === 'referral') {
          const pool = registrations.filter((r) => r.day <= day)
          if (pool.length) {
            // super-sharers: earlier + leader-sourced registrants share more
            const ref = weighted(pool, pool.map((r, i) => (r.channel === 'leaders' ? 1.6 : 1) * (1 + (i % 7 === 0 ? 4 : 0))))
            referredBy = ref.code
            if (rnd() < 0.8) college = ref.college
          }
          source = 'squad-invite'
        } else {
          source = rnd() < 0.6 ? 'linkedin' : 'instagram'
        }
        const hour = weighted(hours, hourW)
        dayRegs.push({
          id: `sim-${day}-${ch.id}-${k}`,
          name,
          phone: `9${Math.floor(100000000 + rnd() * 899999999)}`,
          email: `${first.toLowerCase()}${Math.floor(rnd() * 999)}@example.com`,
          college,
          branch: weighted(BRANCHES, branchW),
          gradYear: rnd() < 0.88 ? 2027 : rnd() < 0.6 ? 2028 : 2026,
          priorAI: rnd() < 0.22,
          code: uniqueCode('', first),
          referredBy,
          leader,
          channel: ch.id,
          source,
          hook,
          day,
          hour,
          ts: startMs + (day - 1) * 86400000 + hour * 3600000 + Math.floor(rnd() * 3600000),
          simulated: true,
        })
      }
      registrations.push(...dayRegs)

      // top-of-funnel counters, split by hook
      const totalVisits = Math.max(n, Math.round(n / (CVR[ch.id] * (0.94 + rnd() * 0.12))))
      for (const hook of ['A', 'B'] as HookId[]) {
        const regsH = dayRegs.filter((r) => r.hook === hook).length
        const visits = Math.max(regsH, day <= TEST_DAYS ? Math.round(totalVisits / 2) : hook === 'B' ? totalVisits : 0)
        if (visits === 0) continue
        funnel.push({
          day,
          channel: ch.id,
          hook,
          visits,
          starts: Math.max(regsH, Math.round(regsH / (0.7 + rnd() * 0.06))),
          shares: Math.round(regsH * (0.34 + rnd() * 0.1)),
        })
      }
    }
  }
  registrations.sort((a, b) => a.ts - b.ts)
  return { registrations, leaders, funnel }
}
