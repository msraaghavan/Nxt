import { useEffect, useMemo, useRef, useState } from 'react'
import { Btn, Panel, SectionTitle } from '../components/ui'
import { computeMetrics, SHOW_UP_BASELINE, SHOW_UP_WITH_FLOW } from '../data/analytics'
import { useStore } from '../data/store'
import { FLOW, STAGES, type FlowCtx, type StageId } from '../data/whatsappFlow'
import { fmt, pct, rupees, weekdayTime } from '../lib/format'
import { inviteLink } from '../lib/share'
import { sfx } from '../lib/sound'
import { Sprite } from '../pixel/Sprite'

interface Msg {
  from: 'bot' | 'me' | 'system'
  text: string
  stage: StageId
}

/** WhatsApp-style *bold* */
const waFormat = (text: string) => text.split(/(\*[^*\n]+\*)/g).map((part, i) => (part.startsWith('*') && part.endsWith('*') && part.length > 2 ? <b key={i}>{part.slice(1, -1)}</b> : part))

const stamp = () => new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })

export default function WhatsApp() {
  const s = useStore()
  const m = useMemo(() => computeMetrics(s), [s])
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [node, setNode] = useState('start')
  const [typing, setTyping] = useState(false)
  const [input, setInput] = useState('')
  const ctx = useRef<FlowCtx>({ name: 'Sai', college: '', year: '', code: 'SAI777', link: '', when: weekdayTime(), player: 0, liveCount: 0 })
  const chatRef = useRef<HTMLDivElement>(null)
  const timers = useRef<number[]>([])

  const play = (id: string, userText?: string) => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    const n = FLOW[id]
    ctx.current.player = m.total + 1
    ctx.current.liveCount = m.showUp
    const code = (ctx.current.name.replace(/[^a-z]/gi, '').toUpperCase().slice(0, 5) || 'QUEST') + '777'
    ctx.current.code = code
    ctx.current.link = inviteLink(code)
    const add: Msg[] = []
    if (userText) add.push({ from: 'me', text: userText, stage: n.stage })
    if (n.divider) add.push({ from: 'system', text: n.divider, stage: n.stage })
    setMsgs((p) => [...p, ...add])
    setNode(id)
    const lines = n.bot(ctx.current)
    setTyping(true)
    lines.forEach((text, i) => {
      timers.current.push(
        window.setTimeout(() => {
          setMsgs((p) => [...p, { from: 'bot', text, stage: n.stage }])
          sfx.click()
          if (i === lines.length - 1) setTyping(false)
        }, 550 + i * 900),
      )
    })
  }

  const restart = () => {
    ctx.current = { ...ctx.current, name: 'Sai', college: '', year: '' }
    setMsgs([{ from: 'me', text: 'QUEST', stage: 'capture' }])
    play('start')
  }

  useEffect(() => {
    restart()
    return () => timers.current.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight })
  }, [msgs, typing])

  const n = FLOW[node]
  const activeStage = n.stage

  const totalRegs = Math.max(m.total, m.forecast)
  // D-1 + H-1 go to everyone; the live rescue goes to no-shows and the submit nudge to attendees → 3 per registrant
  const msgCount = Math.round(totalRegs * 3)
  const cost = msgCount * 0.17

  return (
    <section className="section">
      <div className="wrap">
        <SectionTitle
          tag="Asset · WhatsApp automation"
          sprite="chat"
          title="The WhatsApp journey"
          sub="Register without leaving WhatsApp, forward to your class group in one tap, then 4 nudges that protect show-up. Try it on the phone."
        />
        <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 0.9fr) minmax(0, 1.1fr)', alignItems: 'start' }} data-stack>
          <div>
            <div className="phone">
              <div className="phone-top">
                <Sprite name="robot" size={30} />
                <div style={{ lineHeight: 1.1 }}>
                  <b>QuestBot · NxtWave</b>
                  <div style={{ fontSize: 13, opacity: 0.85 }}>{typing ? 'typing…' : 'online'}</div>
                </div>
              </div>
              <div className="chat" ref={chatRef} aria-live="polite">
                {msgs.map((msg, i) => (
                  <div key={i} className={`msg ${msg.from}`}>
                    {waFormat(msg.text)}
                    {msg.from !== 'system' && <span className="time">{stamp()}</span>}
                  </div>
                ))}
                {typing && (
                  <div className="msg bot">
                    <span className="blink">● ● ●</span>
                  </div>
                )}
              </div>
              <div className="quick">
                {!typing && n.replies?.map((r) => (
                  <button
                    key={r.label}
                    onClick={() => {
                      if (r.set) Object.assign(ctx.current, r.set)
                      if (r.next === 'start') return restart()
                      play(r.next, r.label.startsWith('⏩') ? undefined : r.label)
                    }}
                  >
                    {r.label}
                  </button>
                ))}
                {!typing && n.input && (
                  <form
                    style={{ display: 'flex', gap: 6, width: '100%' }}
                    onSubmit={(e) => {
                      e.preventDefault()
                      const v = input.trim() || (n.input!.key === 'url' ? 'github.com/sai/ai-interview-coach' : 'Sai')
                      if (n.input!.key === 'name') ctx.current.name = v.split(' ')[0]
                      setInput('')
                      play(n.input!.next, v)
                    }}
                  >
                    <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={n.input.placeholder} aria-label={n.input.placeholder} />
                    <button type="submit">Send</button>
                  </form>
                )}
              </div>
            </div>
            <div className="center" style={{ marginTop: 18 }}>
              <Btn variant="paper" size="small" onClick={restart}>
                ↺ Restart chat
              </Btn>
            </div>
          </div>

          <div className="stack">
            <Panel>
              <h3>Journey & cost</h3>
              <div className="table-scroll">
                <table className="px-table">
                  <thead>
                    <tr>
                      <th>Step</th>
                      <th>Trigger</th>
                      <th>Meta category</th>
                      <th className="num">₹/msg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {STAGES.map((st) => (
                      <tr key={st.id} style={st.id === activeStage ? { background: 'rgba(255,210,63,0.45)' } : undefined}>
                        <td>
                          <b>{st.title}</b>
                          <div className="muted" style={{ fontSize: 14 }}>
                            {st.goal}
                          </div>
                        </td>
                        <td style={{ fontSize: 15 }}>{st.trigger}</td>
                        <td style={{ fontSize: 15 }}>{st.kind}</td>
                        <td className="num">{st.cost ? st.cost.toFixed(2) : 'free'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="muted" style={{ fontSize: 14, marginTop: 10 }}>
                India utility template rate from Oct 2026: ₹0.145 + 18% GST ≈ ₹0.17. Chats the student starts (Click-to-WhatsApp) are service conversations and free.
              </p>
            </Panel>

            <div className="grid g3" style={{ gap: 12 }}>
              <Panel dark tight>
                <div className="display muted" style={{ fontSize: 8 }}>Messages</div>
                <div className="mono" style={{ fontSize: 40, color: 'var(--gold)' }}>
                  {fmt(msgCount)}
                </div>
                <div style={{ fontSize: 14 }}>for {fmt(totalRegs)} registrants</div>
              </Panel>
              <Panel dark tight>
                <div className="display muted" style={{ fontSize: 8 }}>Cost</div>
                <div className="mono" style={{ fontSize: 40, color: 'var(--gold)' }}>
                  {rupees(cost)}
                </div>
                <div style={{ fontSize: 14 }}>of the ₹300 budget line</div>
              </Panel>
              <Panel dark tight>
                <div className="display muted" style={{ fontSize: 8 }}>Show-up</div>
                <div className="mono" style={{ fontSize: 40, color: 'var(--lime)' }}>
                  {pct(SHOW_UP_WITH_FLOW)}
                </div>
                <div style={{ fontSize: 14 }}>target vs ~{pct(SHOW_UP_BASELINE)} with email only</div>
              </Panel>
            </div>

            <Panel dark>
              <h3 style={{ color: 'var(--gold)' }}>How it would be built (free stack)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 6 }}>
                {[
                  ['chat', 'WhatsApp Cloud API', 'Direct from Meta, no BSP markup'],
                  ['bolt', 'n8n (self-hosted)', 'Webhook → this flow spec → replies'],
                  ['scroll', 'Google Sheet', 'Same rows the landing page writes'],
                  ['hourglass', 'n8n Cron', 'D-1 / H-1 / live / post templates'],
                ].map(([sp, t, d], i) => (
                  <div key={t} className="px-panel tight" style={{ color: 'var(--ink)', margin: 4 }}>
                    <div className="row between">
                      <Sprite name={sp as 'chat'} size={28} />
                      <span className="display" style={{ fontSize: 10, color: 'var(--violet-d)' }}>
                        {i + 1}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>{t}</div>
                    <div style={{ fontSize: 14 }}>{d}</div>
                  </div>
                ))}
              </div>
              <p className="muted" style={{ fontSize: 15, marginTop: 12, marginBottom: 0 }}>
                The chat on the left runs from <code>src/data/whatsappFlow.ts</code>, a declarative state machine that maps 1:1 to n8n nodes.
              </p>
            </Panel>
          </div>
        </div>
      </div>
    </section>
  )
}
