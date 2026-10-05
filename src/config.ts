// Single source of truth for the campaign. The landing page, Command Center,
// simulation and Growth Plan all read from here so the numbers never drift.

export const WORKSHOP = {
  title: 'Build Your First AI Project in 60 Minutes',
  short: 'AI Quest 60',
  org: 'NxtWave',
  project: 'AI Mock-Interview Coach',
  projectPitch:
    'Paste any job description. Your app asks you 5 real interview questions, scores your answers and tells you how to improve.',
  stack: 'Python + a free LLM API, deployed on a free public link',
  // Sunday 11:00 AM IST. If this date has passed, the site rolls forward to the next Sunday.
  baseDateISO: '2026-10-18T11:00:00+05:30',
  durationMin: 60,
  platform: 'Live on Zoom + build-along in your browser',
  goal: 500,
  campaignDays: 7,
  budget: 2000,
  whatsappNumber: '910000000000', // placeholder business number for the demo
}

export function nextWorkshopDate(now = new Date()): Date {
  const d = new Date(WORKSHOP.baseDateISO)
  while (d.getTime() + WORKSHOP.durationMin * 60_000 < now.getTime()) {
    d.setDate(d.getDate() + 7)
  }
  return d
}

// ----- Channels (the only three bets + the loop) -----
// Series colours validated for CVD separation + contrast on the dark dashboard surface.
export type ChannelId = 'leaders' | 'clubs' | 'referral' | 'organic'

export interface ChannelPlan {
  id: ChannelId
  name: string
  short: string
  color: string
  what: string
  why: string
  // funnel math (base case)
  reachLabel: string
  reach: number
  ctr: number // reach -> landing visit
  cvr: number // visit -> registration
  expected: number
}

export const CHANNELS: ChannelPlan[] = [
  {
    id: 'leaders',
    name: 'Quest Leaders → class WhatsApp groups',
    short: 'Quest Leaders',
    color: '#b98a12',
    what: '30 campus ambassadors post a tracked link + Tenglish/Hinglish message into ~4 class & placement WhatsApp groups each, then DM close friends.',
    why: 'Final-years trust a batchmate in their class group far more than a brand ad. Each group is ~65 people who already share placement updates there.',
    reachLabel: '30 leaders × 4 groups × 65 students',
    reach: 7800,
    ctr: 0.1,
    cvr: 0.35,
    expected: 270,
  },
  {
    id: 'clubs',
    name: 'Club & T&P co-hosts',
    short: 'Club co-hosts',
    color: '#1d97bd',
    what: '10 tech clubs / placement cells co-host: “in association with <club>”. They broadcast to final-years through official groups and notice boards.',
    why: 'Clubs need events on their calendar (and for NAAC reports); T&P cells want placement prep. A free, co-branded workshop is an easy yes and carries official credibility.',
    reachLabel: '10 partners × 300 final-years',
    reach: 3000,
    ctr: 0.08,
    cvr: 0.4,
    expected: 100,
  },
  {
    id: 'referral',
    name: 'Squad referral loop',
    short: 'Squad loop',
    color: '#d65586',
    what: 'Every registrant gets a Quest Pass, a personal link and a one-tap WhatsApp share. Rewards unlock at 1, 3 and 5 friends. College Wars leaderboard adds peer pressure.',
    why: 'Students go to workshops with friends. The loop turns ~370 seeded registrations into a distribution channel at zero cost.',
    reachLabel: '370 seed registrants × K-factor 0.4',
    reach: 370,
    ctr: 1,
    cvr: 0.4,
    expected: 150,
  },
  {
    id: 'organic',
    name: 'LinkedIn / Instagram (supporting)',
    short: 'Organic social',
    color: '#5aa437',
    what: 'Quest Leaders and I post the “I’m building an AI project this Sunday” pass. No paid boost.',
    why: 'Cheap social proof that makes the WhatsApp message look legit when people click through. Not counted on to carry the goal.',
    reachLabel: 'posts by leaders',
    reach: 1500,
    ctr: 0.05,
    cvr: 0.4,
    expected: 30,
  },
]

export const EXPECTED_TOTAL = CHANNELS.reduce((s, c) => s + c.expected, 0)

// cumulative target curve the Command Center tracks against (base case = 550)
export const DAILY_TARGET = [30, 70, 95, 90, 85, 90, 90]
export const CUMULATIVE_TARGET = DAILY_TARGET.reduce<number[]>((acc, v) => {
  acc.push((acc.at(-1) ?? 0) + v)
  return acc
}, [])
export const PLAN_B_CHECKPOINT = { day: 3, threshold: 150 }

export const DAY_PLAN = [
  { day: 1, title: 'Recruit & arm', detail: 'Recruit 30 Quest Leaders (NxtWave learner community, club leads, LinkedIn). Send kits: link, messages, poster. Soft-launch to friends.' },
  { day: 2, title: 'Wave 1', detail: 'Leaders post in class + placement groups (7–9 PM, when groups are active). Confirm 10 club / T&P co-hosts.' },
  { day: 3, title: 'Checkpoint', detail: 'Pick the winning hook (A/B). If < 150 registrations, trigger Plan B: +20 leaders and ask NxtWave for owned channels.' },
  { day: 4, title: 'College Wars', detail: 'Post the leaderboard into every group: “CVR is #1, your college is #4”. Competition drives the second wave.' },
  { day: 5, title: 'Social proof', detail: 'Wave 2 message with live count (“370 final-years from 40+ colleges”) + Quest Pass statuses on WhatsApp.' },
  { day: 6, title: 'Squad push', detail: 'Reward unlock reminders to everyone with 0–2 referrals. College Wars closes at midnight.' },
  { day: 7, title: 'Last call', detail: 'Registration closes 10 PM. Switch every channel to show-up mode: setup checklist + reminders.' },
]

// ----- Rewards (all near-zero cost; cash only for top performers) -----
export const SQUAD_REWARDS = [
  { at: 1, name: 'Prompt Scroll', desc: '50 copy-paste prompts for placement prep (HR, DSA, resume)', sprite: 'scroll' },
  { at: 3, name: 'Priority Loot', desc: 'Your project gets reviewed live + Certificate of Excellence', sprite: 'chest' },
  { at: 5, name: 'Legend Badge', desc: '1:1 15-min project review with a NxtWave mentor + LinkedIn shout-out', sprite: 'crown' },
] as const

export const COLLEGE_WARS_PRIZE = 'Winning college gets a free on-campus AI Build Day run by NxtWave'

// ----- Budget: ₹2,000, 75% paid only on results -----
export const BUDGET = [
  { item: 'Quest Leader prizes (top 3: ₹500 / ₹300 / ₹200)', amount: 1000, kind: 'performance' },
  { item: 'Squad prizes (top referrer ₹300 + 2 lucky draws ₹100)', amount: 500, kind: 'performance' },
  { item: 'WhatsApp reminders: ~1,650 utility msgs × ₹0.17 (₹0.145 + GST)', amount: 300, kind: 'fixed' },
  { item: 'QR posters for notice boards (~40 prints)', amount: 200, kind: 'fixed' },
] as const

// ----- Message hooks being A/B tested -----
export const HOOKS = {
  A: {
    label: 'Outcome hook',
    line: 'Build an AI project for your resume in 60 mins. Free, live, this Sunday.',
  },
  B: {
    label: 'Placement hook',
    line: 'Interviewers are asking “have you worked with AI?”. Have a real answer by Sunday.',
  },
} as const
export type HookId = keyof typeof HOOKS

// Shown in the reviewer bar. Edit before submitting.
export const CANDIDATE = {
  name: 'M S Raaghavan',
}
