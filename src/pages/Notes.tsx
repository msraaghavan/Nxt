import type { ReactNode } from 'react'
import { Btn, Panel, SectionTitle } from '../components/ui'
import { Sprite } from '../pixel/Sprite'
import type { SpriteName } from '../pixel/sprites'

interface Note {
  n: number
  sprite: SpriteName
  topic: string
  asked: string
  suggested: string
  changed: string
  why: string
}

const NOTES: Note[] = [
  {
    n: 1,
    sprite: 'coin',
    topic: 'Channel mix',
    asked: '“Plan a 7-day campaign to get 500 final-year engineering students to register for a free AI workshop. Budget ₹2,000.”',
    suggested:
      'Split the budget across Instagram/Meta ads targeting engineering students in Hyderabad, LinkedIn posts, a cold email blast to college placement officers, and a Google Form.',
    changed:
      'I did the cost-per-lead math first. Even at an optimistic ₹15–40 per paid student sign-up, ₹2,000 buys 50–130 registrations, and paid sign-ups show up less. So I dropped ads entirely, moved 75% of the budget into prizes paid only on results (Quest Leaders + top referrers), and built the plan on people who already sit inside class WhatsApp groups.',
    why: 'The constraint was never reach. It was trust. A batchmate’s message in the class group gets opened; a brand ad gets scrolled past.',
  },
  {
    n: 2,
    sprite: 'chat',
    topic: 'The WhatsApp message',
    asked: '“Write the WhatsApp message Quest Leaders will post in class groups.”',
    suggested:
      'Polished English copy, lots of emojis, “🚨 LIMITED SEATS! Only 50 spots left, register NOW!”, and a long feature list.',
    changed:
      'Rewrote it in Tenglish and Hinglish (Roman script), which is how students actually text. Killed the fake scarcity: it’s a Zoom call, there’s no real seat limit, and if students catch it, the Quest Leader who forwarded it loses credibility. Replaced it with real deadlines (College Wars closes Day 6, registration closes Day 7). Then, instead of picking one hook, I set up an A/B test between an outcome hook and a placement-pressure hook, tracked through the links.',
    why: 'Copy that sounds like an ad gets treated like an ad. And I’d rather let 600 visits decide than my own opinion.',
  },
  {
    n: 3,
    sprite: 'chest',
    topic: 'Referral rewards',
    asked: '“What rewards should students get for referring friends?”',
    suggested: 'A lucky draw for an iPad / AirPods for anyone who refers 3+ friends, plus Amazon vouchers for every referral.',
    changed:
      'Chose rewards only the target user values: a placement prompt pack, live project review + certificate of excellence, and a 1:1 mentor review. Cash is limited to the top referrer and top 3 Quest Leaders, inside the ₹2,000. The College Wars prize (an on-campus AI Build Day) is itself a growth channel for NxtWave.',
    why: 'An iPad attracts people who want an iPad: fake and duplicate sign-ups that never show up. A self-selecting reward keeps the 500 real.',
  },
]

function Q({ q, children, sprite }: { q: string; children: ReactNode; sprite: SpriteName }) {
  return (
    <Panel>
      <div className="row" style={{ flexWrap: 'nowrap', alignItems: 'flex-start', gap: 14 }}>
        <Sprite name={sprite} size={40} />
        <div>
          <h3>{q}</h3>
          {children}
        </div>
      </div>
    </Panel>
  )
}

export default function Notes() {
  return (
    <section className="section">
      <div className="wrap">
        <div className="row between no-print" style={{ marginBottom: 6 }}>
          <span className="px-tag">Submission · 3 of 4</span>
        </div>
        <SectionTitle
          sprite="scroll"
          title="AI + Learning Notes"
          sub="Three moments where AI gave me a reasonable-sounding answer and I changed it. Format: what I asked → what AI suggested → what I changed → why."
        />

        <div className="stack" style={{ marginBottom: 46 }}>
          {NOTES.map((n) => (
            <Panel key={n.n}>
              <div className="row between" style={{ marginBottom: 12 }}>
                <div className="row" style={{ flexWrap: 'nowrap' }}>
                  <Sprite name={n.sprite} size={40} />
                  <h2 style={{ margin: 0 }}>
                    #{n.n} · {n.topic}
                  </h2>
                </div>
              </div>
              <div className="grid g3" style={{ gap: 14 }}>
                <div className="px-panel inset tight" style={{ margin: 4 }}>
                  <div className="display" style={{ fontSize: 9, marginBottom: 6 }}>
                    I asked
                  </div>
                  {n.asked}
                </div>
                <div className="px-panel inset tight" style={{ margin: 4 }}>
                  <div className="display" style={{ fontSize: 9, marginBottom: 6 }}>
                    AI suggested
                  </div>
                  {n.suggested}
                </div>
                <div className="px-panel gold tight" style={{ margin: 4 }}>
                  <div className="display" style={{ fontSize: 9, marginBottom: 6 }}>
                    What I changed
                  </div>
                  {n.changed}
                </div>
              </div>
              <p style={{ margin: '12px 0 0' }}>
                <b>Why:</b> {n.why}
              </p>
            </Panel>
          ))}
        </div>

        <SectionTitle tag="Show us how you thought" sprite="map" title="The three questions" />
        <div className="stack">
          <Q q="What changed between your first idea and final solution?" sprite="rocket">
            <p>
              <b>First idea:</b> a good-looking landing page, ₹2,000 of Instagram ads and an email blast. Basically “make a nice page and buy traffic”.
            </p>
            <p>
              <b>Final:</b> a peer-distribution system. 30 Quest Leaders posting in class WhatsApp groups, 10 clubs and placement cells co-hosting, and a squad referral loop with College
              Wars, all powered by one asset that tracks every link back to a person.
            </p>
            <p style={{ marginBottom: 0 }}>
              <b>What moved me:</b> (1) the CPL math killed paid ads; (2) I reframed the problem from awareness to trust; (3) I stopped optimising for sign-ups alone. 500 registrations
              with 15% attendance is a failed workshop, so the WhatsApp flow and D-1 setup nudge are part of the plan, not an afterthought. The asset also changed: from “a landing page”
              to the tools each channel needs (leader kit, pass + invites, leaderboard, dashboard).
            </p>
          </Q>
          <Q q="If you had another 24 hours, what would you improve?" sprite="hourglass">
            <ol style={{ margin: 0, paddingLeft: 22 }}>
              <li>
                <b>Test the hook with real students before Day 1.</b> DM both message versions to 20 final-years and check reply rates, instead of discovering the winner mid-campaign.
              </li>
              <li>
                <b>Wire the live backend.</b> Connect the included Google Sheets script (or Supabase via Lovable) so leaderboards update across every device, not just this browser.
              </li>
              <li>
                <b>Build the real WhatsApp bot</b> in n8n + WhatsApp Cloud API from the flow spec that already drives the simulator.
              </li>
              <li>
                <b>Automate project evaluation after the workshop:</b> auto-check submitted repos (link works, README, LLM call), then issue certificates. Every shipped project becomes
                proof for the next cohort’s campaign.
              </li>
              <li>
                <b>Translate the student pages</b> into Telugu and Hindi script, not just the messages.
              </li>
            </ol>
          </Q>
          <Q q="What did AI suggest that you deliberately rejected, and why?" sprite="lock">
            <ul style={{ margin: 0, paddingLeft: 22 }}>
              <li>
                <b>An iPad lucky draw for referrals.</b> It optimises for the wrong person: prize-hunters and duplicate sign-ups who never attend. I kept rewards that only matter to someone who
                actually wants to build.
              </li>
              <li>
                <b>“Only 50 seats left!” urgency.</b> It’s an online session with no real limit. Faking scarcity spends the Quest Leaders’ credibility, which is the plan’s main asset.
                Real deadlines do the same job honestly.
              </li>
              <li>
                <b>Paid Instagram ads</b> with the whole budget. The math doesn’t reach 500, and paid sign-ups attend less.
              </li>
              <li>
                <b>Building an LMS-style platform</b> with logins and AI grading as “the asset”. Impressive, but it doesn’t move registrations, which is the goal of this challenge.
              </li>
            </ul>
          </Q>
        </div>

        <div style={{ marginTop: 40 }}>
          <Panel dark>
            <div className="row between" style={{ gap: 16 }}>
              <div>
                <h3 style={{ color: 'var(--gold)' }}>How AI was used in this build</h3>
                <p className="muted" style={{ margin: 0, maxWidth: 760 }}>
                  Claude Code for building the app (React + TypeScript + canvas pixel art), research checks (e.g. WhatsApp’s Oct 2026 India utility rate), and pressure-testing the plan.
                  Every number in the plan is computed in code from one config file, so the slides, dashboard and simulation can’t disagree.
                </p>
              </div>
              <div className="row" style={{ gap: 6 }}>
                <Btn to="/plan">Growth Plan</Btn>
                <Btn to="/hq" variant="violet">
                  Command Center
                </Btn>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </section>
  )
}
