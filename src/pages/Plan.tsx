import type { ReactNode } from 'react'
import { Btn, Character } from '../components/ui'
import { BUDGET, CHANNELS, CUMULATIVE_TARGET, DAY_PLAN, EXPECTED_TOTAL, HOOKS, PLAN_B_CHECKPOINT, WORKSHOP } from '../config'
import { fmt, pct } from '../lib/format'
import { Sprite } from '../pixel/Sprite'
import type { SpriteName } from '../pixel/sprites'

function Slide({ n, title, kicker, children }: { n: number; title: string; kicker: string; children: ReactNode }) {
  return (
    <div className="px-shadow slide-shell" style={{ marginBottom: 36 }}>
      <div className="px-panel" style={{ padding: 0 }}>
        <div className="slide">
          <div className="slide-inner">
            <div className="row between" style={{ flexWrap: 'nowrap', marginBottom: '0.6cqw', gap: 12 }}>
              <span className="px-tag">{kicker}</span>
              <span className="display" style={{ fontSize: 'max(9px, 0.85cqw)', opacity: 0.75 }}>
                AI Quest 60 · Growth Plan
              </span>
            </div>
            <h2>{title}</h2>
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: '1cqw' }}>{children}</div>
          </div>
          <div className="slide-num">{n} / 5</div>
        </div>
      </div>
    </div>
  )
}

function Box({ title, sprite, children, tone }: { title?: string; sprite?: SpriteName; children: ReactNode; tone?: 'dark' | 'gold' | 'inset' }) {
  return (
    <div className={`px-panel ${tone ?? 'inset'}`} style={{ margin: 4, height: 'calc(100% - 8px)' }}>
      {title && (
        <div className="row" style={{ gap: 8, flexWrap: 'nowrap', marginBottom: '0.5cqw' }}>
          {sprite && <Sprite name={sprite} size={26} />}
          <h3 style={{ margin: 0, color: tone === 'dark' ? 'var(--gold)' : undefined }}>{title}</h3>
        </div>
      )}
      {children}
    </div>
  )
}

const ul = { margin: 0, paddingLeft: '1.3em' }

export default function Plan() {
  const leaders = CHANNELS.find((c) => c.id === 'leaders')!
  const clubs = CHANNELS.find((c) => c.id === 'clubs')!
  const organic = CHANNELS.find((c) => c.id === 'organic')!
  const perf = BUDGET.filter((b) => b.kind === 'performance').reduce((a, b) => a + b.amount, 0)

  return (
    <section className="section print-deck">
      <div className="wrap">
        <div className="row between no-print" style={{ marginBottom: 24, gap: 12 }}>
          <div>
            <span className="px-tag">Submission · 1 of 4</span>
            <h1 style={{ color: '#fff', textShadow: '3px 3px 0 var(--ink)', margin: '10px 0 0' }}>Growth Plan · 5 slides</h1>
          </div>
          <div className="row" style={{ gap: 6 }}>
            <Btn variant="paper" onClick={() => window.print()}>
              ⎙ Save as PDF
            </Btn>
            <Btn to="/hq">Open the dashboard →</Btn>
          </div>
        </div>

        {/* ---------------- 1 ---------------- */}
        <Slide n={1} kicker="1 · Understand the student" title="Final-years in placement season, at Tier-2/3 colleges in Telangana & AP">
          <div className="grid slide-cols" style={{ gridTemplateColumns: '1.05fr 1fr 1fr', gap: '1.2cqw', flex: 1 }}>
            <Box title="Who exactly" sprite="map">
              <div className="row" style={{ flexWrap: 'nowrap', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ flexShrink: 0 }}>
                  <Character look={1} size={54} />
                </div>
                <div>
                  <b>Sai, 21.</b> B.Tech CSE, 2027 batch, JNTU-affiliated college. Campus drives in Nov–Jan. Resume project: copied from YouTube. Has sat through “free webinars”
                  that were sales pitches. Lives in WhatsApp: class, placement, hostel groups.
                </div>
              </div>
              <p style={{ margin: '0.8cqw 0 0' }}>
                <b>Primary:</b> final-year (2027) CSE/IT/AI-ML. <b>Secondary:</b> ECE/EEE/Mech students switching to IT roles.
              </p>
              <p style={{ margin: '0.5cqw 0 0' }} className="muted">
                Why first: NxtWave’s home market, and the year a real project changes an interview.
              </p>
            </Box>
            <Box title="Why they’d care" sprite="heart">
              <ol style={ul}>
                <li>
                  <b>Interview pressure.</b> “Tell me about your project” and, now, “have you worked with AI?”
                </li>
                <li>
                  <b>Resume gap.</b> No real, deployed project they can open and defend.
                </li>
                <li>
                  <b>AI FOMO.</b> Everyone talks about AI; almost nobody in their batch has built with it.
                </li>
              </ol>
            </Box>
            <Box title="What makes them register" sprite="chestOpen">
              <ol style={ul}>
                <li>
                  <b>A concrete outcome:</b> a live AI app + GitHub repo + resume line in 60 min. Not “learn AI”.
                </li>
                <li>
                  <b>A trusted invite:</b> a batchmate in the class group beats any brand ad.
                </li>
                <li>
                  <b>Zero risk:</b> free, Sunday, no setup, honest about the 5-minute pitch.
                </li>
                <li>
                  <b>Status:</b> squad rewards + College Wars.
                </li>
              </ol>
            </Box>
          </div>
          <div className="px-panel dark tight" style={{ margin: 4 }}>
            <b style={{ color: 'var(--gold)' }}>Insight →</b> the bottleneck isn’t awareness, it’s <b>trust</b>. Students ignore brand webinars; they open what a batchmate forwards. So the plan buys
            distribution through people, not impressions.
          </div>
        </Slide>

        {/* ---------------- 2 ---------------- */}
        <Slide n={2} kicker="2 · The campaign" title="3 channels + 1 loop. Prioritised, and what I’m deliberately NOT doing">
          <div className="grid slide-cols" style={{ gridTemplateColumns: '1.65fr 1fr', gap: '1.2cqw', flex: 1 }}>
            <div className="stack" style={{ display: 'flex', flexDirection: 'column', gap: '0.8cqw' }}>
              {CHANNELS.filter((c) => c.id !== 'organic').map((c, i) => (
                <div key={c.id} className="px-panel inset" style={{ margin: 4 }}>
                  <div className="row between" style={{ flexWrap: 'nowrap', gap: 10 }}>
                    <h3 style={{ margin: 0 }}>
                      <span style={{ color: c.color }}>■</span> #{i + 1} {c.name}
                    </h3>
                    <span className="mono" style={{ fontSize: '1.7cqw', whiteSpace: 'nowrap' }}>
                      ~{c.expected}
                    </span>
                  </div>
                  <div style={{ marginTop: '0.3cqw' }}>
                    <b>Do:</b> {c.what}
                  </div>
                  <div className="muted">
                    <b>Why it works:</b> {c.why}
                  </div>
                </div>
              ))}
              <div className="muted" style={{ fontSize: '1.12cqw', paddingLeft: 6 }}>
                + {organic.name}: ~{organic.expected}. {organic.why}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8cqw' }}>
              <Box title="Not doing (and why)" sprite="lock" tone="dark">
                <ul style={{ ...ul, color: '#efe8ff' }}>
                  <li>
                    <b>Paid Instagram/Meta ads.</b> At realistic student CPLs (~₹15–40), ₹2,000 buys 50–130 sign-ups with weak show-up.
                  </li>
                  <li>
                    <b>Cash / iPad lucky draws.</b> They attract people who want the prize, not the workshop.
                  </li>
                  <li>
                    <b>Fake scarcity.</b> “Only 50 seats” on a Zoom call burns the trust the plan runs on.
                  </li>
                  <li>
                    <b>Cold-emailing T&P officers.</b> Too slow for 7 days; reach them through student club leads instead.
                  </li>
                </ul>
              </Box>
              <Box title="Message: A/B test, not a guess" sprite="potion">
                <div>
                  <b>A</b> · {HOOKS.A.line}
                </div>
                <div style={{ marginTop: '0.3cqw' }}>
                  <b>B</b> · {HOOKS.B.line}
                </div>
                <div className="muted" style={{ marginTop: '0.3cqw' }}>
                  Split Days 1–3 via tracked links, then roll the winner out. Copy in Tenglish/Hinglish, as students actually text.
                </div>
              </Box>
            </div>
          </div>
        </Slide>

        {/* ---------------- 3 ---------------- */}
        <Slide n={3} kicker="3 · How 500 comes in" title={`The math: base case ${EXPECTED_TOTAL} (10% buffer), with a Day-3 tripwire`}>
          <div className="grid slide-cols" style={{ gridTemplateColumns: '1.35fr 1fr', gap: '1.2cqw', flex: 1 }}>
            <div>
              <table className="px-table">
                <thead>
                  <tr>
                    <th>Channel</th>
                    <th className="num">Reach</th>
                    <th className="num">Click</th>
                    <th className="num">Visits</th>
                    <th className="num">Conv.</th>
                    <th className="num">Sign-ups</th>
                  </tr>
                </thead>
                <tbody>
                  {[leaders, clubs, organic].map((c) => (
                    <tr key={c.id}>
                      <td>
                        <span style={{ color: c.color }}>■</span> {c.short}
                        <div className="muted" style={{ fontSize: '0.95cqw' }}>
                          {c.reachLabel}
                        </div>
                      </td>
                      <td className="num">{fmt(c.reach)}</td>
                      <td className="num">{pct(c.ctr)}</td>
                      <td className="num">{fmt(c.reach * c.ctr)}</td>
                      <td className="num">{pct(c.cvr)}</td>
                      <td className="num">{c.expected}</td>
                    </tr>
                  ))}
                  <tr>
                    <td>
                      <span style={{ color: CHANNELS[2].color }}>■</span> Squad loop
                      <div className="muted" style={{ fontSize: '0.95cqw' }}>
                        ~370 seeded sign-ups × K-factor 0.4
                      </div>
                    </td>
                    <td className="num" colSpan={4} style={{ textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: '1.05cqw' }}>
                      35% share their pass · ~1.2 friends join per sharer
                    </td>
                    <td className="num">150</td>
                  </tr>
                  <tr style={{ background: 'rgba(255,210,63,0.4)' }}>
                    <td>
                      <b>Total</b>
                    </td>
                    <td colSpan={4} className="muted" style={{ fontSize: '1.05cqw' }}>
                      goal {WORKSHOP.goal} · buffer +{EXPECTED_TOTAL - WORKSHOP.goal}
                    </td>
                    <td className="num">
                      <b>{EXPECTED_TOTAL}</b>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div style={{ marginTop: '1cqw' }}>
                <div className="display" style={{ fontSize: '0.8cqw', marginBottom: '0.4cqw' }}>
                  Cumulative target the dashboard tracks
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, alignItems: 'end', height: '6cqw', minHeight: 60 }}>
                  {CUMULATIVE_TARGET.map((v, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                      <div className="mono center" style={{ fontSize: '1.2cqw', lineHeight: 1 }}>
                        {v}
                      </div>
                      <div style={{ height: `${(v / 560) * 75}%`, background: v >= 500 ? 'var(--gold-d)' : 'var(--violet)', boxShadow: '0 0 0 2px var(--ink)' }} />
                      <div className="center display" style={{ fontSize: '0.75cqw', marginTop: 4 }}>
                        D{i + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8cqw' }}>
              <Box title="Downside case" sprite="bolt">
                If WhatsApp click-through halves and the loop stalls (K 0.25), we land near <b>~300</b>. That’s why there’s a tripwire.
              </Box>
              <Box title={`Day-${PLAN_B_CHECKPOINT.day} tripwire: < ${PLAN_B_CHECKPOINT.threshold}?`} sprite="flag" tone="gold">
                Plan B: +20 Quest Leaders from NxtWave’s learner community, ask for NxtWave’s own Instagram/YouTube/email, and extend College Wars by a day.
              </Box>
              <Box title="Design for show-up, not just sign-ups" sprite="laptop" tone="dark">
                <span style={{ color: '#efe8ff' }}>
                  500 sign-ups with 15% attendance is a failed workshop. WhatsApp reminders + a D-1 setup nudge target <b>~40%</b> show-up → <b>~230 live builders</b>.
                </span>
              </Box>
            </div>
          </div>
        </Slide>

        {/* ---------------- 4 ---------------- */}
        <Slide n={4} kicker="4 · Execution" title="7 days, ₹2,000, measured daily">
          <div className="grid slide-cols" style={{ gridTemplateColumns: '1.25fr 1fr', gap: '1.2cqw', flex: 1 }}>
            <div>
              <table className="px-table">
                <tbody>
                  {DAY_PLAN.map((d) => (
                    <tr key={d.day}>
                      <td style={{ width: '12%' }}>
                        <span className="px-tag">D{d.day}</span>
                      </td>
                      <td style={{ width: '22%' }}>
                        <b>{d.title}</b>
                        <div className="mono muted" style={{ fontSize: '1.12cqw' }}>
                          target {CUMULATIVE_TARGET[d.day - 1]}
                        </div>
                      </td>
                      <td style={{ fontSize: '1.15cqw' }}>{d.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: '0.8cqw' }}>
                <div className="px-panel inset tight" style={{ margin: 4 }}>
                  <div className="row" style={{ gap: 8, flexWrap: 'nowrap', marginBottom: '0.4cqw' }}>
                    <Sprite name="shield" size={22} />
                    <h3 style={{ margin: 0 }}>Risks → mitigations</h3>
                  </div>
                  <ul style={ul}>
                    <li>Group admins mute forwards → leaders post as a personal note + DM friends</li>
                    <li>Sign-ups don’t show → D-1 setup nudge, H-1 link, live +10 rescue</li>
                    <li>Junk / duplicate sign-ups → phone dedupe, year field, quality metric</li>
                  </ul>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8cqw' }}>
              <Box title="Budget · ₹2,000" sprite="coin">
                <table className="px-table">
                  <tbody>
                    {BUDGET.map((b) => (
                      <tr key={b.item}>
                        <td style={{ fontSize: '1.08cqw' }}>
                          {b.kind === 'performance' ? '★ ' : ''}
                          {b.item}
                        </td>
                        <td className="num">₹{fmt(b.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: '0.4cqw' }}>
                  ★ = paid only on results: <b>{pct(perf / WORKSHOP.budget)}</b> of budget. ≈ <b>₹{(WORKSHOP.budget / EXPECTED_TOTAL).toFixed(1)}</b> per registration.
                </div>
              </Box>
              <Box title="Daily scoreboard → decisions" sprite="map" tone="dark">
                <ul style={{ ...ul, color: '#efe8ff' }}>
                  <li>Sign-ups vs curve · conversion by channel · K-factor</li>
                  <li>Leader &lt; 3 sign-ups after 2 days → nudge or reassign</li>
                  <li>Hook winner by end of D3 → every link switches</li>
                  <li>Quality: ≥ 80% final-years, or fix targeting</li>
                </ul>
              </Box>
            </div>
          </div>
        </Slide>

        {/* ---------------- 5 ---------------- */}
        <Slide n={5} kicker="5 · What I built" title="Not just a landing page: the engine that runs all three channels">
          <div className="grid slide-cols" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1cqw' }}>
            {(
              [
                ['star', 'Register + attribution', 'Every visit carries ref code, UTM and A/B hook bucket. Registration in 30 s.'],
                ['chestOpen', 'Quest Pass + squad loop', 'Shareable pass image (QR) for WhatsApp Status, invite copy in English / Tenglish / Hinglish, rewards at 1/3/5.'],
                ['crown', 'College Wars', 'Live college, squad and leader leaderboards: the peer-pressure engine for days 4–6.'],
                ['flag', 'Quest Leader kit', 'Tracked links, ready-to-post messages, printable QR poster, club co-host link generator.'],
                ['chat', 'WhatsApp journey', 'Register in chat + D-1 / H-1 / live / post nudges. Simulator runs the same spec n8n would.'],
                ['map', 'Command Center', 'Funnel, channel pace vs plan, A/B significance, forecast, leader nudges, CSV export.'],
              ] as [SpriteName, string, string][]
            ).map(([sp, t, d]) => (
              <div key={t} className="px-panel inset" style={{ margin: 4 }}>
                <div className="row" style={{ flexWrap: 'nowrap', gap: 8 }}>
                  <Sprite name={sp} size={28} />
                  <h3 style={{ margin: 0 }}>{t}</h3>
                </div>
                <div style={{ marginTop: '0.4cqw', fontSize: '1.2cqw' }}>{d}</div>
              </div>
            ))}
          </div>
          <div className="px-panel inset tight" style={{ margin: 4 }}>
            <div className="display" style={{ fontSize: '0.8cqw', marginBottom: '0.6cqw' }}>
              One loop, every step tracked
            </div>
            <div className="row" style={{ gap: '0.5cqw', flexWrap: 'wrap', fontSize: '1.08cqw' }}>
              {(
                [
                  ['flag', 'Leader posts tracked link'],
                  ['map', 'Student lands (ref + UTM + hook)'],
                  ['star', 'Registers in 30 s'],
                  ['chestOpen', 'Shares Quest Pass'],
                  ['heart', 'Friends join → loot'],
                  ['crown', 'College climbs Wars'],
                  ['chat', 'WhatsApp nudges'],
                  ['laptop', 'Shows up & ships'],
                ] as [SpriteName, string][]
              ).map(([sp, t], i, arr) => (
                <span key={t} className="row" style={{ gap: '0.4cqw', flexWrap: 'nowrap' }}>
                  <Sprite name={sp} size={20} />
                  <span>{t}</span>
                  {i < arr.length - 1 && <b style={{ color: 'var(--violet-d)' }}>→</b>}
                </span>
              ))}
            </div>
          </div>
          <div className="grid slide-cols" style={{ gridTemplateColumns: '1fr 1fr', gap: '1cqw' }}>
            <div className="px-panel dark tight" style={{ margin: 4 }}>
              <b style={{ color: 'var(--gold)' }}>First idea → final:</b> a pretty landing page + Instagram ads → a peer-distribution system, after the CPL math showed ₹2,000 can’t buy 500 sign-ups,
              and that trust, not reach, is the bottleneck.
            </div>
            <div className="px-panel gold tight" style={{ margin: 4 }}>
              <b>Rejected AI suggestions:</b> iPad lucky draw (wrong incentive), “only 50 seats left” (dishonest for Zoom), paid ads (math). Details on the AI Notes page.
            </div>
          </div>
        </Slide>
      </div>
    </section>
  )
}
