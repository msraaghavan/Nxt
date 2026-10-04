import type { ChannelId, HookId } from '../config'

export interface Registration {
  id: string
  name: string
  phone: string
  email: string
  college: string
  branch: string
  gradYear: number
  priorAI: boolean
  /** this student's own referral code */
  code: string
  /** registrant or Quest Leader code that brought them in */
  referredBy?: string
  leader?: string
  channel: ChannelId
  source: string
  hook: HookId
  /** campaign day 1..7 */
  day: number
  /** hour of day (0-23, IST) */
  hour: number
  ts: number
  simulated: boolean
}

export interface Leader {
  code: string
  name: string
  college: string
  phone?: string
  day: number
  simulated: boolean
}

/** Aggregated top-of-funnel counters for one day / channel / hook bucket. */
export interface FunnelBucket {
  day: number
  channel: ChannelId
  hook: HookId
  visits: number
  starts: number
  shares: number
}

export interface Attribution {
  ref?: string
  channel: ChannelId
  source: string
  hook: HookId
}
