import { useEffect, useMemo, useState } from 'react'
import { Bar, Btn, Character, Countdown, Panel, SectionTitle, Typewriter } from '../components/ui'
import { COLLEGE_WARS_PRIZE, SQUAD_REWARDS, WORKSHOP } from '../config'
import { computeMetrics } from '../data/analytics'
import { getAttribution, track, useStore } from '../data/store'
import { fmt, workshopLabel } from '../lib/format'
import { waBotUrl } from '../lib/share'
import { PixelScene } from '../pixel/PixelScene'
import { Sprite } from '../pixel/Sprite'
import type { SpriteName } from '../pixel/sprites'

const LEVELS: { lvl: string; time: string; title: string; body: string; sprite: SpriteName }[] = [
  { lvl: 'LVL 1', time: '0–10 min', title: 'Spawn in', body: 'Open the starter kit in your browser. No installs, no setup drama, no “it works on my machine”.', sprite: 'map' },
  { lvl: 'LVL 2', time: '10–30 min', title: 'Wire up the brain', body: 'Connect a free LLM API so your app reads any job description and asks 5 real interview questions.', sprite: 'robot' },
  { lvl: 'LVL 3', time: '30–50 min', title: 'Make it judge you', body: 'Add scoring + feedback on your answers. You leave with a tool you’ll actually use for your own placements.', sprite: 'potion' },
  { lvl: 'LVL 4', time: '50–60 min', title: 'Ship it', body: 'Deploy to a public link, push to GitHub, and copy the resume bullet we write with you.', sprite: 'rocket' },
]

const LOOT: { sprite: SpriteName; title: string; body: string }[] = [
  { sprite: 'laptop', title: 'Live project link', body: 'Your app on a public URL you can open in an interview.' },
  { sprite: 'scroll', title: 'GitHub repo', body: 'Clean code + README, ready for your resume and LinkedIn.' },
  { sprite: 'sword', title: 'Resume bullet', body: 'A specific, honest line about what you built and how.' },
  { sprite: 'trophy', title: 'Certificate', body: 'For everyone who submits their project link at the end.' },
]

const CLASSES = [
  { look: 1, name: 'The Coder', who: 'CSE / IT', line: 'You know some Python. You’ll leave with your first real AI app.' },
  { look: 6, name: 'The Switcher', who: 'ECE / EEE / Mech', line: 'Aiming for IT roles? This is the project that proves you can build.' },
  { look: 5, name: 'The Rookie', who: 'Barely coded', line: 'Copy-along starter code. If you can use WhatsApp, you can follow along.' },
  { look: 4, name: 'The Speedrunner', who: 'Already builds', line: 'Bonus side-quests: voice mode, a leaderboard, a fancier deploy.' },
]

const FAQ = [
  { q: 'Is it really free?', a: 'Yes. No card, no payment, no “free trial”. You need a laptop, a browser and Wi-Fi.' },
  { q: 'Is this a 60-minute sales pitch?', a: 'No. 55 minutes of building. In the last 5 minutes NxtWave shares what to learn next. Skip it if you want; your project is yours either way.' },
  { q: 'I’m not from CSE. Can I join?', a: 'Yes. The starter kit is copy-along friendly, and this is exactly the kind of project that helps ECE, EEE and Mech students land IT roles.' },
  { q: 'What if I can’t make it live?', a: 'Registered students get the recording and the starter kit. But live is where mentors unblock you, and the certificate needs a submitted project.' },
  { q: 'Why do you want my WhatsApp number?', a: 'Only for the join link and 3 reminders (a day before, an hour before, and when we go live). Reply STOP any time.' },
]

export default function Landing() {
  const s = useStore()
  const m = useMemo(() => computeMetrics(s), [s])
  const [bump, setBump] = useState(0)
  const attr = useMemo(() => getAttribution(), [])
  useEffect(() => track('visit'), [])
  const joined = m.total + bump
  const hookLine =
    attr.hook === 'B'
      ? 'Interviewers keep asking “have you worked with AI?”. Have a real answer by Sunday: a live AI app, a GitHub repo and a resume line.'
      : 'Placement season is here. In 60 minutes you’ll build and ship an AI app, and walk out with a GitHub repo and a resume line.'

  return (
    <>
      <section className="hero">
        <PixelScene className="hero-scene" anchorX={0.72} anchorY={0.5} night={s.night} onEnter={() => setBump((b) => (b < 25 ? b + 1 : b))} />
        <div className="wrap hero-inner">
          <div className="hero-card">
            <Panel>
              <div className="row" style={{ gap: 6, marginBottom: 12 }}>
                <span className="px-tag">Free · Live · 60 min</span>
                <span className="px-tag violet">For final-year engineers</span>
              </div>
              <h1>{WORKSHOP.title}</h1>
              <Typewriter text={hookLine} style={{ fontSize: 20, minHeight: 90 }} />
              <div className="hero-facts">
                <span>
                  <Sprite name="calendar" size={22} /> {workshopLabel(true)}
                </span>
                <span>
                  <Sprite name="hourglass" size={22} /> 60 minutes
                </span>
                <span>
                  <Sprite name="laptop" size={22} /> No setup
                </span>
              </div>
              <div style={{ marginBottom: 6 }} className="row between">
                <span className="display" style={{ fontSize: 10 }}>
                  Final-years joined
                </span>
                <span className="mono" style={{ fontSize: 26 }}>
                  {fmt(joined)} <span className="muted">/ {WORKSHOP.goal}</span>
                </span>
              </div>
              <Bar value={joined} max={WORKSHOP.goal} color="gold" label="Registrations toward the goal" />
              <div className="row" style={{ marginTop: 18, gap: 8 }}>
                <Btn to="/join" size="big">
                  ▶ Press start · Join free
                </Btn>
                <Btn href={waBotUrl(`QUEST ${attr.ref ?? ''}`.trim())} variant="wa" newTab>
                  <Sprite name="chat" size={20} /> Via WhatsApp
                </Btn>
              </div>
              <p className="muted" style={{ fontSize: 15, margin: '10px 0 0' }}>
                30 seconds · no payment · reminders on WhatsApp only
              </p>
            </Panel>
          </div>
        </div>
        <div className="hero-count">
          <Panel tight>
            <div className="display" style={{ fontSize: 9, marginBottom: 8 }}>
              Quest starts in
            </div>
            <Countdown compact />
          </Panel>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <SectionTitle tag="The quest" sprite="map" title="60 minutes. 4 levels. 1 shipped AI app." sub={`You’ll build an ${WORKSHOP.project}. ${WORKSHOP.projectPitch}`} />
          <div className="grid g4">
            {LEVELS.map((l) => (
              <Panel key={l.lvl} className="level">
                <div className="row between" style={{ marginBottom: 10 }}>
                  <span className="lvl">
                    {l.lvl} · {l.time}
                  </span>
                  <Sprite name={l.sprite} size={36} />
                </div>
                <h3>{l.title}</h3>
                <p style={{ margin: 0 }}>{l.body}</p>
              </Panel>
            ))}
          </div>
          <div style={{ marginTop: 34 }}>
            <Panel dark>
              <div className="row between" style={{ gap: 18 }}>
                <h3 style={{ margin: 0, color: 'var(--gold)' }}>Loot you walk out with</h3>
                <span className="muted" style={{ fontSize: 16 }}>Everything is yours to keep.</span>
              </div>
              <div className="grid g4" style={{ marginTop: 16 }}>
                {LOOT.map((l) => (
                  <div key={l.title} className="row" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
                    <Sprite name={l.sprite} size={40} />
                    <div>
                      <b style={{ fontSize: 19 }}>{l.title}</b>
                      <div className="muted" style={{ fontSize: 16 }}>
                        {l.body}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </section>

      <div className="path-band" />

      <section className="section">
        <div className="wrap">
          <SectionTitle tag="Choose your class" sprite="shield" title="Built for every final-year, not just CSE toppers" />
          <div className="grid g4">
            {CLASSES.map((c) => (
              <Panel key={c.name} className="center">
                <div style={{ height: 76, display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>
                  <Character look={c.look} size={72} walk />
                </div>
                <h3 style={{ marginTop: 10 }}>{c.name}</h3>
                <span className="px-tag light">{c.who}</span>
                <p style={{ marginTop: 10, marginBottom: 0 }}>{c.line}</p>
              </Panel>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="loot" style={{ background: 'rgba(43,33,53,0.18)' }}>
        <div className="wrap">
          <SectionTitle tag="Squad loot" sprite="chest" title="Bring your squad. Unlock loot." sub="Everyone gets a personal invite link after registering. Rewards unlock as friends join with your link." />
          <div className="grid g3">
            {SQUAD_REWARDS.map((r) => (
              <Panel key={r.at} className="chest-card">
                <div className="bob" style={{ display: 'inline-block' }}>
                  <Sprite name={r.sprite as SpriteName} size={64} />
                </div>
                <div className="need" style={{ margin: '10px 0' }}>
                  {r.at} friend{r.at > 1 ? 's' : ''} join
                </div>
                <h3>{r.name}</h3>
                <p style={{ margin: 0 }}>{r.desc}</p>
              </Panel>
            ))}
          </div>
          <div style={{ marginTop: 26 }}>
            <Panel gold>
              <div className="row" style={{ flexWrap: 'nowrap', gap: 16 }}>
                <Sprite name="trophy" size={56} />
                <div>
                  <h3 style={{ marginBottom: 6 }}>College Wars</h3>
                  <p style={{ margin: 0 }}>
                    {COLLEGE_WARS_PRIZE}. Top squad builder wins a ₹300 voucher. Right now <b>{m.colleges[0]?.short}</b> leads with{' '}
                    <b>{m.colleges[0]?.count}</b> players.
                  </p>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap grid g2" style={{ alignItems: 'start' }}>
          <div>
            <SectionTitle tag="Live leaderboard" sprite="crown" title="College Wars" />
            <Panel>
              {m.colleges.slice(0, 6).map((c, i) => (
                <div className="lb-row" key={c.name}>
                  <div className="lb-rank">{i === 0 ? <Sprite name="crown" size={26} /> : `#${i + 1}`}</div>
                  <div>
                    <div className="lb-name">{c.short}</div>
                    <Bar value={c.count} max={m.colleges[0].count} color={i === 0 ? 'gold' : 'violet'} />
                  </div>
                  <div className="lb-count">{c.count}</div>
                </div>
              ))}
              <div className="center" style={{ marginTop: 14 }}>
                <Btn to="/wars" variant="paper" size="small">
                  Full leaderboard →
                </Btn>
              </div>
            </Panel>
          </div>
          <div>
            <SectionTitle tag="Real talk" sprite="scroll" title="Not another webinar" />
            <Panel className="faq">
              {FAQ.map((f, i) => (
                <details key={f.q} open={i === 0}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </Panel>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 20 }}>
        <div className="wrap">
          <Panel dark>
            <div className="row between" style={{ gap: 20 }}>
              <div className="row" style={{ flexWrap: 'nowrap', gap: 14 }}>
                <Character look={0} size={64} walk />
                <Character look={3} size={64} walk />
                <Character look={7} size={64} walk />
                <div>
                  <h2 style={{ color: 'var(--gold)', marginBottom: 6 }}>Your squad is waiting.</h2>
                  <p className="muted" style={{ margin: 0 }}>
                    {fmt(joined)} final-years from {m.colleges.length} colleges are in. {workshopLabel(true)}.
                  </p>
                </div>
              </div>
              <Btn to="/join" size="big">
                ▶ Join free
              </Btn>
            </div>
          </Panel>
        </div>
      </section>
    </>
  )
}
