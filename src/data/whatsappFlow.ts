// Declarative spec for the WhatsApp journey. The simulator on /whatsapp runs
// this exact spec; the same states map 1:1 to an n8n + WhatsApp Cloud API build.
export interface FlowCtx {
  name: string
  college: string
  year: string
  code: string
  link: string
  when: string
  player: number
  liveCount: number
}

export interface FlowNode {
  id: string
  stage: StageId
  /** system divider shown before the node (e.g. a time jump) */
  divider?: string
  bot: (c: FlowCtx) => string[]
  replies?: { label: string; next: string; set?: Partial<FlowCtx> }[]
  input?: { key: 'name' | 'college' | 'url'; placeholder: string; next: string }
}

export type StageId = 'capture' | 'confirm' | 'd1' | 'h1' | 'live' | 'post'

export const STAGES: { id: StageId; title: string; trigger: string; kind: string; cost: number; goal: string }[] = [
  { id: 'capture', title: 'Register in chat', trigger: 'Student taps a Click-to-WhatsApp link (QUEST <code>)', kind: 'Service (user-initiated)', cost: 0, goal: 'Registration without leaving WhatsApp' },
  { id: 'confirm', title: 'Pass + forward kit', trigger: 'Right after registration', kind: 'Service window reply', cost: 0, goal: 'Turn every registrant into a sharer' },
  { id: 'd1', title: 'D-1 setup nudge', trigger: 'Scheduled, day before 7 PM', kind: 'Utility template', cost: 0.17, goal: 'Pre-setup removes day-of friction → higher show-up' },
  { id: 'h1', title: 'H-1 join link', trigger: 'Scheduled, 60 min before', kind: 'Utility template', cost: 0.17, goal: 'The moment of truth: link + commitment' },
  { id: 'live', title: 'Live +10 rescue', trigger: 'Not joined 10 min after start', kind: 'Utility template', cost: 0.17, goal: 'Recover no-shows while it’s still useful' },
  { id: 'post', title: 'Submit → certificate', trigger: 'After the workshop', kind: 'Utility template', cost: 0.17, goal: 'Project links = proof for the next campaign' },
]

const COLLEGE_PICKS = ['CVR', 'VNRVJIET', 'CBIT', 'KLU', 'Other']

export const FLOW: Record<string, FlowNode> = {
  start: {
    id: 'start',
    stage: 'capture',
    bot: (c) => [
      `Hey 👋 I’m QuestBot from NxtWave.\n\n*Build Your First AI Project in 60 Minutes*\n📅 ${c.when} · Live · *Free*\n\nYou’ll build an AI Mock-Interview Coach and put it live on the internet.`,
    ],
    replies: [
      { label: '🚀 Count me in', next: 'ask_name' },
      { label: '🤖 What will I build?', next: 'what' },
      { label: '💸 Really free?', next: 'free' },
    ],
  },
  what: {
    id: 'what',
    stage: 'capture',
    bot: () => [
      'An app that reads any job description, asks you 5 real interview questions and scores your answers.\n\nYou deploy it on a public link + GitHub. Resume-ready in 60 minutes. Then use it for your own placement prep 😉',
    ],
    replies: [
      { label: '🚀 Count me in', next: 'ask_name' },
      { label: '💸 Really free?', next: 'free' },
    ],
  },
  free: {
    id: 'free',
    stage: 'capture',
    bot: () => ['100% free. No card, no catch.\n55 min of building, 5 min on what to learn next (skippable).'],
    replies: [
      { label: '🚀 Count me in', next: 'ask_name' },
      { label: '🤖 What will I build?', next: 'what' },
    ],
  },
  ask_name: {
    id: 'ask_name',
    stage: 'capture',
    bot: () => ['Awesome! What’s your name?'],
    input: { key: 'name', placeholder: 'Type your name…', next: 'ask_college' },
  },
  ask_college: {
    id: 'ask_college',
    stage: 'capture',
    bot: (c) => [`Nice to meet you, ${c.name}! Which college?`],
    replies: COLLEGE_PICKS.map((p) => ({ label: p, next: 'ask_year', set: { college: p } })),
  },
  ask_year: {
    id: 'ask_year',
    stage: 'capture',
    bot: () => ['Which year are you in?'],
    replies: [
      { label: 'Final year (2027)', next: 'confirm', set: { year: '2027' } },
      { label: '3rd year', next: 'confirm', set: { year: '2028' } },
      { label: 'Graduated', next: 'confirm', set: { year: '2026' } },
    ],
  },
  confirm: {
    id: 'confirm',
    stage: 'confirm',
    bot: (c) => [
      `✅ You’re in, ${c.name}! Player #${c.player}.\n\n🎟️ Your Quest Pass: ${c.link}\n📅 ${c.when}\n\nI’ll remind you 1 day before, 1 hour before and when we go live.`,
      `🎁 Bring friends, unlock loot:\n1 friend → Prompt Scroll\n3 friends → Priority Loot + certificate of excellence\n5 friends → 1:1 mentor review\n\nForward the next message to your class group 👇`,
      `Bro, ${c.when} ki FREE AI workshop undi: *Build Your First AI Project in 60 Minutes* 🚀 AI Mock-Interview Coach build chesi deploy chestam. Join avvu 👉 ${c.link}`,
    ],
    replies: [{ label: '⏩ Jump to 1 day before', next: 'd1' }],
  },
  d1: {
    id: 'd1',
    stage: 'd1',
    divider: '1 day before · 7:00 PM',
    bot: (c) => [
      `Tomorrow ${c.when.split(',')[1]?.trim() ?? ''}! 🔥\n\n2-minute setup so you don’t get stuck live:\n1️⃣ Create a free GitHub account\n2️⃣ Get your free API key (link in your kit)\n\nReply *DONE* when ready ✅`,
    ],
    replies: [
      { label: 'DONE ✅', next: 'd1_done' },
      { label: 'Need help', next: 'd1_help' },
    ],
  },
  d1_done: {
    id: 'd1_done',
    stage: 'd1',
    bot: () => ['Legend. You’re already ahead of most of the batch 💪'],
    replies: [{ label: '⏩ Jump to 1 hour before', next: 'h1' }],
  },
  d1_help: {
    id: 'd1_help',
    stage: 'd1',
    bot: () => ['Here’s a 90-second video walkthrough: youtu.be/setup-demo\nStill stuck? A mentor will DM you 🙋'],
    replies: [{ label: '⏩ Jump to 1 hour before', next: 'h1' }],
  },
  h1: {
    id: 'h1',
    stage: 'h1',
    divider: '60 minutes before',
    bot: () => ['We start in 60 minutes 🚀\n\n🔗 Join: zoom.us/j/ai-quest-60\n💻 Laptop + Chrome, charger plugged in\n\nSee you inside!'],
    replies: [
      { label: 'I’m in 🙌', next: 'live' },
      { label: 'Can’t make it', next: 'cant' },
    ],
  },
  cant: {
    id: 'cant',
    stage: 'h1',
    bot: () => ['No worries. I’ll send the recording + starter kit after.\n(Live gets mentor help + the certificate though 😉)'],
    replies: [{ label: '⏩ Workshop is live', next: 'live' }],
  },
  live: {
    id: 'live',
    stage: 'live',
    divider: 'Live · +10 min (sent only to no-shows)',
    bot: (c) => [`We just started and ${c.liveCount} builders are live 🔴\nYou’re missing LVL 1. Jump in → zoom.us/j/ai-quest-60`],
    replies: [{ label: '⏩ After the workshop', next: 'post' }],
  },
  post: {
    id: 'post',
    stage: 'post',
    divider: 'After the workshop',
    bot: (c) => [`GG ${c.name}! 🎉 You shipped an AI app.\n\nReply with your project link (GitHub or live URL) to get your certificate.`],
    input: { key: 'url', placeholder: 'github.com/you/ai-interview-coach', next: 'review' },
  },
  review: {
    id: 'review',
    stage: 'post',
    bot: (c) => [
      `🤖 Auto-review\n✓ Link opens\n✓ README found\n✓ Calls an LLM API\n\nCertificate sent to your email, ${c.name}! 🏆`,
      'Post your build on LinkedIn with #AIQuest60. We reshare the best ones, which is also how next month’s batch finds us 😉',
    ],
    replies: [{ label: '↺ Restart demo', next: 'start' }],
  },
}
