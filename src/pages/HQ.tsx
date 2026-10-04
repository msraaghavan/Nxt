import { useEffect, useMemo, useState } from 'react'
import { CumulativeChart, DailyChart, FunnelBars, HourStrip, Legend } from '../components/Charts'
import { Bar, Btn, Panel, Stat } from '../components/ui'
import { BUDGET, CHANNELS, HOOKS, PLAN_B_CHECKPOINT, WORKSHOP } from '../config'
import { computeMetrics, toCSV, type Metrics } from '../data/analytics'
import { CHANNEL_DAY_PLAN } from '../data/simulate'
import { shortName } from '../data/colleges'
import { CAMPAIGN_START, resetDemo, setSimDay, useStore } from '../data/store'
import { campaignDayLabel, firstName, fmt, pct, rupees } from '../lib/format'
import { waUrl } from '../lib/share'
import { Sprite } from '../pixel/Sprite'
import type { SpriteName } from '../pixel/sprites'

type Tone = 'good' | 'warn' | 'info'
interface Insight {
  tone: Tone
  sprite: SpriteName
  title: string
  body: string
}

function insights(m: Metrics): Insight[] {
  const out: Insight[] = []
  out.push(
    m.onTrack
      ? { tone: 'good', sprite: 'check', title: 'On track', body: `${fmt(m.total)} registered vs plan ${fmt(m.target)} by end of day ${m.day}. Forecast: ${fmt(m.forecast)} by Day 7.` }
      : { tone: 'warn', sprite: 'bolt', title: 'Behind plan', body: `${fmt(m.total)} vs plan ${fmt(m.target)}. Forecast ${fmt(m.forecast)}. Pull Plan B levers now.` },
  )
  if (m.day >= PLAN_B_CHECKPOINT.day) {
    const d3 = m.cumulative[PLAN_B_CHECKPOINT.day - 1]
    out.push(
      d3 >= PLAN_B_CHECKPOINT.threshold
        ? { tone: 'good', sprite: 'flag', title: 'Day-3 checkpoint passed', body: `${d3} ≥ ${PLAN_B_CHECKPOINT.threshold}. Plan B (20 more leaders + NxtWave’s own channels) stays in reserve.` }
        : { tone: 'warn', sprite: 'flag', title: 'Day-3 checkpoint missed', body: `${d3} < ${PLAN_B_CHECKPOINT.threshold}. Trigger Plan B: recruit 20 more leaders, ask for NxtWave owned channels.` },
    )
  } else
    out.push({ tone: 'info', sprite: 'hourglass', title: 'Checkpoint ahead', body: `Need ${PLAN_B_CHECKPOINT.threshold} by end of Day ${PLAN_B_CHECKPOINT.day} or Plan B triggers.` })
  const { A, B, confidence, decided } = m.abTest
  out.push(
    decided
      ? { tone: 'good', sprite: 'potion', title: 'Hook test closed → B wins', body: `Placement hook ${pct(B.cvr, 1)} vs outcome hook ${pct(A.cvr, 1)} (${pct(confidence)} confidence). Good enough for a 7-day sprint: B rolled out to every link from Day 4.` }
      : { tone: 'info', sprite: 'potion', title: 'Hook test running', body: `B ${pct(B.cvr, 1)} vs A ${pct(A.cvr, 1)} so far (${pct(confidence)} confidence). Call it at end of Day 3.` },
  )
  const weak = m.leaders.filter((l) => l.regs < 3 && l.day <= m.day - 2)
  if (weak.length)
    out.push({ tone: 'warn', sprite: 'bolt', title: `${weak.length} leaders stalled`, body: `< 3 sign-ups after 2+ days. Nudge them with their rank, or hand their colleges to the top 5 leaders.` })
  const planRef = CHANNEL_DAY_PLAN.referral.slice(0, m.day).reduce((a, b) => a + b, 0)
  const planK = planRef / Math.max(1, m.target - planRef)
  out.push({
    tone: m.kFactor >= planK * 0.9 ? 'good' : 'warn',
    sprite: 'heart',
    title: 'Squad loop',
    body: `${pct(m.shareRate)} of registrants shared; K-factor ${m.kFactor.toFixed(2)} vs ${planK.toFixed(2)} planned by today (0.40 by Day 7, the loop is back-loaded). Reward reminders go to everyone at 0–2 friends on Day 6.`,
  })
  const peak = m.hours.indexOf(Math.max(...m.hours))
  out.push({ tone: 'info', sprite: 'hourglass', title: `Peak hour ${peak}:00`, body: `Schedule tomorrow’s leader posts for ${peak - 1}:30 so they sit at the top of the group when people check.` })
  out.push({
    tone: m.quality.finalYear >= 0.8 ? 'good' : 'warn',
    sprite: 'shield',
    title: 'Audience quality',
    body: `${pct(m.quality.finalYear)} final-years (target ≥ 80%). Registrations are coming from the right people, not just any people.`,
  })
  return out
}

const toneColor: Record<Tone, string> = { good: '#5aa437', warn: '#e04848', info: '#8a63ff' }

export default function HQ() {
  const s = useStore()
  const m = useMemo(() => computeMetrics(s), [s])
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      const d = s.simDay
      if (d >= 7) setPlaying(false)
      else setSimDay(d + 1)
    }, 1400)
    return () => clearInterval(id)
  }, [playing, s.simDay])

  const exportCsv = () => {
    const blob = new Blob([toCSV(s.registrations)], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `ai-quest-60-registrations-day${s.simDay}.csv`
    a.click()
  }

  const funnel = [
    { label: 'Landing visits', value: m.visits },
    { label: 'Started the form', value: m.starts },
    { label: 'Registered', value: m.total, note: `Form completion ${pct(m.formCompletion)}` },
    { label: 'Shared their invite', value: m.shares },
    { label: 'Friends who joined via invite', value: m.byChannel.find((c) => c.id === 'referral')!.regs },
  ]
  const feed = s.registrations.slice(-8).reverse()
  const spentFixed = BUDGET.filter((b) => b.kind === 'fixed').reduce((a, b) => a + b.amount, 0)
  const perf = BUDGET.filter((b) => b.kind === 'performance').reduce((a, b) => a + b.amount, 0)

  return (
    <div className="night-page">
      <section className="section" style={{ paddingTop: 34 }}>
        <div className="wrap">
          <div className="row between" style={{ marginBottom: 20, gap: 16 }}>
            <div>
              <span className="px-tag violet">Asset · growth ops</span>
              <h1 style={{ color: 'var(--gold)', margin: '12px 0 4px' }}>Growth Command Center</h1>
              <div className="muted">
                Day {s.simDay} of 7 · {campaignDayLabel(CAMPAIGN_START, s.simDay)} · simulated campaign data + anything you register on this device
              </div>
            </div>
            <div className="row" style={{ gap: 6 }}>
              <Btn size="small" variant="ghost-dark" onClick={exportCsv}>
                ⇩ CSV
              </Btn>
              <Btn size="small" variant="ghost-dark" onClick={() => confirm('Reset your demo registrations and leader kit?') && resetDemo()}>
                Reset demo
              </Btn>
            </div>
          </div>

          <Panel dark tight>
            <div className="row between" style={{ gap: 10 }}>
              <div className="row" style={{ gap: 8 }}>
                <span className="display" style={{ fontSize: 9 }}>
                  Replay the campaign
                </span>
                <div className="seg" role="group" aria-label="Campaign day">
                  {Array.from({ length: 7 }, (_, i) => (
                    <button key={i} type="button" aria-pressed={s.simDay === i + 1} onClick={() => { setPlaying(false); setSimDay(i + 1) }}>
                      D{i + 1}
                    </button>
                  ))}
                </div>
              </div>
              <Btn
                size="small"
                onClick={() => {
                  // replay always starts from Day 1 so the whole campaign unfolds
                  if (!playing) setSimDay(1)
                  setPlaying(!playing)
                }}
              >
                {playing ? '❚❚ Pause' : '▶ Play 7 days'}
              </Btn>
            </div>
          </Panel>

          <div className="grid g4" style={{ marginTop: 20, gap: 14 }}>
            <Stat
              label="Registrations"
              value={fmt(m.total)}
              sprite="star"
              sub={
                <>
                  <Bar value={m.total} max={WORKSHOP.goal} color="gold" label="Toward goal" />
                  <span className="muted">
                    {pct(m.total / WORKSHOP.goal)} of {WORKSHOP.goal} goal
                  </span>
                </>
              }
            />
            <Stat label={`Day ${m.day} sign-ups`} value={`+${m.today}`} sprite="bolt" sub={<span className="muted">target {m.daily[m.day - 1].target}</span>} tone={m.today >= m.daily[m.day - 1].target ? 'var(--lime)' : '#ff8f8f'} />
            <Stat label="Day-7 forecast" value={fmt(m.forecast)} sprite="map" sub={<span className="muted">{m.forecast >= WORKSHOP.goal ? 'clears the goal' : 'short of goal'} · pace + plan</span>} tone={m.forecast >= WORKSHOP.goal ? 'var(--lime)' : '#ff8f8f'} />
            <Stat label="Visit → register" value={pct(m.cvr)} sprite="potion" sub={<span className="muted">{fmt(m.visits)} landing visits</span>} />
            <Stat label="K-factor" value={m.kFactor.toFixed(2)} sprite="heart" sub={<span className="muted">friend sign-ups per seeded sign-up</span>} />
            <Stat label="Live builders (est.)" value={fmt(m.showUp)} sprite="laptop" sub={<span className="muted">42% show-up w/ WhatsApp flow vs ~{fmt(m.showUpBaseline)} without (assumed)</span>} />
            <Stat label="Cost / registration" value={rupees(m.cpr)} sprite="coin" sub={<span className="muted">₹2,000 ÷ final count</span>} />
            <Stat label="Colleges reached" value={m.colleges.length} sprite="flag" sub={<span className="muted">{m.leaders.length} Quest Leaders active</span>} />
          </div>

          <div className="grid g2" style={{ marginTop: 20, alignItems: 'start' }}>
            <Panel dark>
              <div className="row between">
                <h3 style={{ color: 'var(--gold)', margin: 0 }}>Daily sign-ups vs target</h3>
                <span className="muted" style={{ fontSize: 14 }}>white bar = plan for the day</span>
              </div>
              <DailyChart m={m} />
              <Legend />
            </Panel>
            <Panel dark>
              <h3 style={{ color: 'var(--gold)', margin: 0 }}>Cumulative vs plan</h3>
              <CumulativeChart m={m} />
            </Panel>
          </div>

          <div className="grid" style={{ marginTop: 20, gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', alignItems: 'start' }} data-stack>
            <Panel dark>
              <h3 style={{ color: 'var(--gold)' }}>Quest log · what to do today</h3>
              <div className="stack">
                {insights(m).map((i) => (
                  <div key={i.title} className="row" style={{ flexWrap: 'nowrap', alignItems: 'flex-start', gap: 12, borderLeft: `4px solid ${toneColor[i.tone]}`, paddingLeft: 10 }}>
                    <Sprite name={i.sprite} size={28} />
                    <div>
                      <b>{i.title}</b>
                      <div style={{ fontSize: 16 }}>{i.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
            <div className="stack">
              <Panel dark>
                <h3 style={{ color: 'var(--gold)' }}>Funnel</h3>
                <FunnelBars steps={funnel} />
              </Panel>
              <Panel dark>
                <h3 style={{ color: 'var(--gold)' }}>A/B: which hook converts?</h3>
                <div className="grid g2" style={{ gap: 12 }}>
                  {(['A', 'B'] as const).map((h) => {
                    const st = m.abTest[h]
                    const win = m.abTest.decided && m.abTest.winner === h
                    return (
                      <div key={h} className={`px-panel tight ${win ? 'gold' : ''}`} style={{ color: 'var(--ink)', margin: 4 }}>
                        <div className="row between">
                          <span className="display" style={{ fontSize: 10 }}>
                            Hook {h}
                          </span>
                          {win && <span className="px-tag">Winner</span>}
                        </div>
                        <div style={{ fontSize: 15, margin: '6px 0' }}>“{HOOKS[h].line}”</div>
                        <div className="mono" style={{ fontSize: 34 }}>
                          {pct(st.cvr, 1)}
                        </div>
                        <div style={{ fontSize: 14 }}>
                          {st.regs} / {st.visits} visits (Days 1–3)
                        </div>
                      </div>
                    )
                  })}
                </div>
                <p className="muted" style={{ fontSize: 14, margin: '8px 0 0' }}>
                  Two-proportion z-test: z = {m.abTest.z.toFixed(2)}, {pct(m.abTest.confidence)} confidence.
                </p>
              </Panel>
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <Panel dark>
              <h3 style={{ color: 'var(--gold)' }}>Channel scoreboard</h3>
              <div className="table-scroll">
                <table className="px-table">
                  <thead>
                    <tr>
                      <th>Channel</th>
                      <th className="num">Visits</th>
                      <th className="num">Sign-ups</th>
                      <th className="num">Conv.</th>
                      <th className="num">Share</th>
                      <th className="num">Plan (7d)</th>
                      <th>Pace</th>
                    </tr>
                  </thead>
                  <tbody>
                    {m.byChannel.map((c) => {
                      const planToDate = CHANNEL_DAY_PLAN[c.id].slice(0, m.day).reduce((a, b) => a + b, 0)
                      const ok = c.regs >= planToDate * 0.9
                      return (
                        <tr key={c.id}>
                          <td>
                            <i style={{ display: 'inline-block', width: 12, height: 12, background: c.color, marginRight: 8, boxShadow: '0 0 0 2px #0e0a1c' }} />
                            {c.name}
                          </td>
                          <td className="num">{fmt(c.visits)}</td>
                          <td className="num">{fmt(c.regs)}</td>
                          <td className="num">{pct(c.cvr)}</td>
                          <td className="num">{pct(c.share)}</td>
                          <td className="num">{c.expected}</td>
                          <td>
                            <span className={`px-tag ${ok ? 'green' : 'red'}`}>{ok ? 'on pace' : 'behind'}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>

          <div className="grid" style={{ marginTop: 20, gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', alignItems: 'start' }} data-stack>
            <Panel dark>
              <div className="row between">
                <h3 style={{ color: 'var(--gold)', margin: 0 }}>Quest Leaders</h3>
                <span className="muted" style={{ fontSize: 14 }}>
                  {m.leaders.filter((l) => l.regs >= 10).length} with 10+ · {m.leaders.filter((l) => l.regs < 3).length} need a nudge
                </span>
              </div>
              <div className="table-scroll" style={{ maxHeight: 420, overflowY: 'auto', marginTop: 8 }}>
                <table className="px-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Leader</th>
                      <th>College</th>
                      <th className="num">Sign-ups</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {m.leaders.map((l, i) => {
                      const status = l.regs >= 15 ? 'star' : l.regs >= 3 ? 'ok' : 'nudge'
                      const top = m.leaders[0]
                      const nudge = `Hey ${firstName(l.name)}! You’re at ${l.regs} sign-ups (#${i + 1} of ${m.leaders.length}). ${firstName(top.name)} from ${shortName(top.college)} is on ${top.regs}. Tip: post in your placement group at 7:30 PM tonight and DM 10 friends. Your link: (from your kit)`
                      return (
                        <tr key={l.code}>
                          <td>{i + 1}</td>
                          <td>
                            {l.name} {!l.simulated && <span className="px-tag violet">you</span>}
                            <div className="mono muted" style={{ fontSize: 15 }}>
                              {l.code}
                            </div>
                          </td>
                          <td>{shortName(l.college)}</td>
                          <td className="num">{l.regs}</td>
                          <td>
                            {status === 'star' ? (
                              <span className="px-tag green">★ star</span>
                            ) : status === 'nudge' ? (
                              <a className="px-tag red" href={waUrl(nudge)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                                Nudge ↗
                              </a>
                            ) : (
                              <span className="px-tag light">ok</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
            <div className="stack">
              <Panel dark>
                <h3 style={{ color: 'var(--gold)' }}>College Wars</h3>
                {m.colleges.slice(0, 8).map((c, i) => (
                  <div key={c.name} className="row" style={{ flexWrap: 'nowrap', gap: 8, marginBottom: 6 }}>
                    <span className="mono" style={{ width: 28, fontSize: 20 }}>
                      {i + 1}
                    </span>
                    <span style={{ width: 110, fontSize: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.short}</span>
                    <div style={{ flex: 1 }}>
                      <Bar value={c.count} max={m.colleges[0].count} color={i === 0 ? 'gold' : 'violet'} />
                    </div>
                    <span className="mono" style={{ width: 36, textAlign: 'right', fontSize: 22 }}>
                      {c.count}
                    </span>
                  </div>
                ))}
              </Panel>
              <Panel dark>
                <h3 style={{ color: 'var(--gold)' }}>When do they register?</h3>
                <HourStrip hours={m.hours} />
              </Panel>
            </div>
          </div>

          <div className="grid g3" style={{ marginTop: 20, alignItems: 'start' }}>
            <Panel dark>
              <h3 style={{ color: 'var(--gold)' }}>Audience quality</h3>
              {[
                ['Final-year (2027)', m.quality.finalYear, 'gold'],
                ['CSE / IT / AI branches', m.quality.csIt, 'violet'],
                ['Built with AI before', m.quality.priorAI, 'cyan'],
              ].map(([l, v, c]) => (
                <div key={l as string} style={{ marginBottom: 10 }}>
                  <div className="row between" style={{ fontSize: 16 }}>
                    <span>{l as string}</span>
                    <b className="mono" style={{ fontSize: 22 }}>
                      {pct(v as number)}
                    </b>
                  </div>
                  <Bar value={(v as number) * 100} max={100} color={c as 'gold'} />
                </div>
              ))}
              <p className="muted" style={{ fontSize: 14, margin: 0 }}>
                Low prior-AI share = the workshop is reaching beginners, so content should stay copy-along.
              </p>
            </Panel>
            <Panel dark>
              <h3 style={{ color: 'var(--gold)' }}>Budget · {rupees(WORKSHOP.budget)}</h3>
              {BUDGET.map((b) => (
                <div key={b.item} style={{ marginBottom: 10 }}>
                  <div className="row between" style={{ fontSize: 15, flexWrap: 'nowrap', gap: 8 }}>
                    <span>{b.item}</span>
                    <b className="mono" style={{ fontSize: 22 }}>
                      {rupees(b.amount)}
                    </b>
                  </div>
                  <Bar value={b.amount} max={WORKSHOP.budget} color={b.kind === 'performance' ? 'green' : 'violet'} />
                </div>
              ))}
              <p className="muted" style={{ fontSize: 14, margin: 0 }}>
                {pct(perf / WORKSHOP.budget)} paid only on results (green). Fixed spend: {rupees(spentFixed)}. No paid ads.
              </p>
            </Panel>
            <Panel dark>
              <h3 style={{ color: 'var(--gold)' }}>Live feed</h3>
              {feed.map((r) => (
                <div key={r.id} className="row between" style={{ flexWrap: 'nowrap', fontSize: 15, borderBottom: '2px dashed #3a3060', padding: '5px 0', gap: 8 }}>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <b>{r.name}</b> · {shortName(r.college)}
                  </span>
                  <span
                    className="px-tag"
                    style={{ background: CHANNELS.find((c) => c.id === r.channel)!.color, color: '#fff', flexShrink: 0 }}
                  >
                    {CHANNELS.find((c) => c.id === r.channel)!.short}
                  </span>
                </div>
              ))}
            </Panel>
          </div>
        </div>
      </section>
    </div>
  )
}
