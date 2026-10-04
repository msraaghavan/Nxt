import { useSyncExternalStore } from 'react'
import { nextWorkshopDate, type ChannelId, type HookId } from '../config'
import { mulberry32 } from '../pixel/draw'
import { pullAll, pushEvent, pushLeader, pushRegistration } from './remote'
import { normalizeCollege } from './colleges'
import { makeCode, simulate } from './simulate'
import type { Attribution, FunnelBucket, Leader, Registration } from './types'

const KEY = 'aiq60:v1'

export const CAMPAIGN_START = (() => {
  const d = nextWorkshopDate()
  // Day 1 starts 7 days before workshop day at 00:00 IST
  const ist = new Date(d.getTime() + 5.5 * 3600000)
  const midnightIstUtc = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()) - 5.5 * 3600000
  return midnightIstUtc - 7 * 86400000
})()

const SIM = simulate(CAMPAIGN_START)

interface Persisted {
  real: Registration[]
  realLeaders: Leader[]
  realFunnel: FunnelBucket[]
  me?: string
  myLeader?: string
  simDay: number
  night?: boolean
  sound?: boolean
}

function load(): Persisted {
  const empty: Persisted = { real: [], realLeaders: [], realFunnel: [], simDay: 5 }
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty
    return { ...empty, ...JSON.parse(raw) }
  } catch {
    return empty
  }
}

let state = load()
const listeners = new Set<() => void>()
let snapshot = build()

function build() {
  const day = state.simDay
  const registrations = [...SIM.registrations.filter((r) => r.day <= day), ...state.real]
  const leaders = [...SIM.leaders.filter((l) => l.day <= day), ...state.realLeaders]
  const funnel = [...SIM.funnel.filter((f) => f.day <= day), ...state.realFunnel]
  return {
    ...state,
    registrations,
    leaders,
    funnel,
    me: state.real.find((r) => r.id === state.me),
    myLeader: state.realLeaders.find((l) => l.code === state.myLeader),
  }
}
export type Snapshot = ReturnType<typeof build>

function commit(next: Partial<Persisted>) {
  state = { ...state, ...next }
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* private mode: keep in memory */
  }
  snapshot = build()
  listeners.forEach((l) => l())
}

export function useStore(): Snapshot {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => snapshot,
  )
}
export const getSnapshot = () => snapshot

// ---------------- attribution ----------------
const ATTR_KEY = 'aiq60:attr'

function readParams() {
  const p = new URLSearchParams(location.search)
  const hq = location.hash.split('?')[1]
  if (hq) new URLSearchParams(hq).forEach((v, k) => p.set(k, v))
  return p
}

export function getAttribution(): Attribution {
  try {
    const saved = localStorage.getItem(ATTR_KEY)
    if (saved) return JSON.parse(saved)
  } catch {
    /* ignore */
  }
  return captureAttribution()
}

/** First-touch attribution, captured on the first page view. */
export function captureAttribution(): Attribution {
  let existing: Attribution | null = null
  try {
    existing = JSON.parse(localStorage.getItem(ATTR_KEY) ?? 'null')
  } catch {
    /* ignore */
  }
  const p = readParams()
  const ref = p.get('ref')?.toUpperCase() ?? undefined
  if (existing && !ref) return existing
  const src = (p.get('utm_source') ?? '').toLowerCase()
  const med = (p.get('utm_medium') ?? '').toLowerCase()
  let channel: ChannelId = 'organic'
  let source = src || 'direct'
  if (ref?.startsWith('QL-') || med === 'leader') {
    channel = 'leaders'
    source = src || 'whatsapp-group'
  } else if (ref) {
    channel = 'referral'
    source = 'squad-invite'
  } else if (med === 'club' || med === 'tnp') {
    channel = 'clubs'
    source = med === 'tnp' ? 'tnp-notice' : 'club-broadcast'
  }
  const h = p.get('h')?.toUpperCase()
  const hook: HookId = h === 'A' || h === 'B' ? h : Math.random() < 0.5 ? 'A' : 'B'
  const attr: Attribution = { ref, channel, source, hook }
  try {
    localStorage.setItem(ATTR_KEY, JSON.stringify(attr))
  } catch {
    /* ignore */
  }
  return attr
}

// ---------------- events ----------------
const sessionSeen = new Set<string>()

export function track(type: 'visit' | 'start' | 'share') {
  const a = getAttribution()
  const onceKey = `${type}`
  if (type !== 'share') {
    try {
      if (sessionStorage.getItem('aiq60:' + onceKey) || sessionSeen.has(onceKey)) return
      sessionStorage.setItem('aiq60:' + onceKey, '1')
    } catch {
      if (sessionSeen.has(onceKey)) return
    }
    sessionSeen.add(onceKey)
  }
  const day = state.simDay
  const funnel = [...state.realFunnel]
  let b = funnel.find((f) => f.day === day && f.channel === a.channel && f.hook === a.hook)
  if (!b) {
    b = { day, channel: a.channel, hook: a.hook, visits: 0, starts: 0, shares: 0 }
    funnel.push(b)
  }
  if (type === 'visit') b.visits++
  if (type === 'start') b.starts++
  if (type === 'share') b.shares++
  commit({ realFunnel: funnel.map((f) => ({ ...f })) })
  void pushEvent({ type, day, channel: a.channel, hook: a.hook })
}

// ---------------- actions ----------------
const rnd = mulberry32(Date.now() % 100000)

function uniqueCode(prefix: string, name: string) {
  const taken = new Set([...snapshot.registrations.map((r) => r.code), ...snapshot.leaders.map((l) => l.code)])
  let c = prefix + makeCode(name, rnd)
  while (taken.has(c)) c = prefix + makeCode(name, rnd)
  return c
}

export interface RegisterInput {
  name: string
  phone: string
  email: string
  college: string
  branch: string
  gradYear: number
  priorAI: boolean
}

export function register(input: RegisterInput): Registration {
  const a = getAttribution()
  const all = snapshot
  let channel = a.channel
  let leader: string | undefined
  let referredBy: string | undefined
  if (a.ref) {
    if (all.leaders.some((l) => l.code === a.ref)) {
      channel = 'leaders'
      leader = a.ref
      referredBy = a.ref
    } else if (all.registrations.some((r) => r.code === a.ref)) {
      channel = 'referral'
      referredBy = a.ref
    }
  }
  const now = new Date()
  const ist = new Date(now.getTime() + 5.5 * 3600000)
  const reg: Registration = {
    id: `real-${now.getTime()}-${Math.floor(rnd() * 1e6)}`,
    ...input,
    name: input.name.trim(),
    college: normalizeCollege(input.college),
    code: uniqueCode('', input.name.trim().split(' ')[0]),
    referredBy,
    leader,
    channel,
    source: a.source,
    hook: a.hook,
    day: state.simDay,
    hour: ist.getUTCHours(),
    ts: now.getTime(),
    simulated: false,
  }
  commit({ real: [...state.real, reg], me: reg.id })
  void pushRegistration(reg)
  return reg
}

export function addLeader(input: { name: string; college: string; phone?: string }): Leader {
  const leader: Leader = {
    code: uniqueCode('QL-', input.name.trim().split(' ')[0]),
    name: input.name.trim(),
    college: normalizeCollege(input.college),
    phone: input.phone,
    day: state.simDay,
    simulated: false,
  }
  commit({ realLeaders: [...state.realLeaders, leader], myLeader: leader.code })
  void pushLeader(leader)
  return leader
}

const DEMO_FRIENDS = ['Harika', 'Vamsi', 'Keerthi', 'Charan', 'Lahari', 'Yaswanth', 'Sindhu', 'Praneeth']

/** Demo helper for reviewers: a friend joins with your invite link. */
export function demoFriendJoin(code: string) {
  const me = snapshot.registrations.find((r) => r.code === code)
  if (!me) return
  const count = snapshot.registrations.filter((r) => r.referredBy === code).length
  const first = DEMO_FRIENDS[count % DEMO_FRIENDS.length]
  const now = Date.now()
  const reg: Registration = {
    id: `demo-${now}`,
    name: `${first} ${'KMPRSTV'[count % 7]}.`,
    phone: '9000000000',
    email: `${first.toLowerCase()}@example.com`,
    college: me.college,
    branch: me.branch,
    gradYear: 2027,
    priorAI: false,
    code: uniqueCode('', first),
    referredBy: code,
    channel: 'referral',
    source: 'squad-invite',
    hook: me.hook,
    day: state.simDay,
    hour: new Date(now + 5.5 * 3600000).getUTCHours(),
    ts: now,
    simulated: true,
  }
  commit({ real: [...state.real, reg] })
}

export const setSimDay = (simDay: number) => commit({ simDay: Math.max(1, Math.min(7, simDay)) })
export const setNight = (night: boolean) => commit({ night })
export const setSound = (sound: boolean) => commit({ sound })
export const signOut = () => commit({ me: undefined })

export function resetDemo() {
  try {
    localStorage.removeItem(KEY)
    localStorage.removeItem(ATTR_KEY)
    sessionStorage.clear()
  } catch {
    /* ignore */
  }
  state = load()
  snapshot = build()
  listeners.forEach((l) => l())
}

// Merge rows from the optional live backend.
void pullAll().then((remote) => {
  if (!remote) return
  const ids = new Set(state.real.map((r) => r.id))
  const codes = new Set(state.realLeaders.map((l) => l.code))
  commit({
    real: [...state.real, ...remote.registrations.filter((r) => !ids.has(r.id)).map((r) => ({ ...r, simulated: false }))],
    realLeaders: [...state.realLeaders, ...remote.leaders.filter((l) => !codes.has(l.code))],
  })
})
