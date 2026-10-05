import { useMemo, useRef, useState, type FormEvent } from 'react'
import { Btn, Character, Panel } from '../components/ui'
import { WORKSHOP } from '../config'
import { BRANCHES, COLLEGES, shortName } from '../data/colleges'
import { getAttribution, register, track, useStore } from '../data/store'
import { firstName, workshopLabel } from '../lib/format'
import { navigate } from '../lib/router'
import { sfx } from '../lib/sound'
import { Sprite } from '../pixel/Sprite'

const YEARS = [
  { v: 2027, label: 'Final year (2027)' },
  { v: 2028, label: '3rd year (2028)' },
  { v: 2026, label: 'Graduated (2026)' },
]

export default function Join() {
  const s = useStore()
  const attr = useMemo(() => getAttribution(), [])
  const inviter = useMemo(() => {
    if (!attr.ref) return null
    const l = s.leaders.find((x) => x.code === attr.ref)
    if (l) return { name: firstName(l.name), college: shortName(l.college), leader: true }
    const r = s.registrations.find((x) => x.code === attr.ref)
    return r ? { name: firstName(r.name), college: shortName(r.college), leader: false } : null
  }, [attr.ref, s.leaders, s.registrations])

  const [f, setF] = useState({ name: '', phone: '', email: '', college: '', branch: 'CSE', gradYear: 2027, priorAI: false, consent: true })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [shake, setShake] = useState(false)
  const started = useRef(false)
  const onStart = () => {
    if (started.current) return
    started.current = true
    track('start')
  }

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const err: Record<string, string> = {}
    if (f.name.trim().length < 2) err.name = 'Tell us your name'
    const digits = f.phone.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '')
    if (!/^[6-9]\d{9}$/.test(digits)) err.phone = 'Enter a 10-digit Indian mobile number'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) err.email = 'Enter a valid email'
    if (f.college.trim().length < 3) err.college = 'Pick or type your college'
    if (!f.consent) err.consent = 'We need this to send you the join link'
    setErrors(err)
    if (Object.keys(err).length) {
      sfx.error()
      setShake(true)
      setTimeout(() => setShake(false), 420)
      return
    }
    register({ name: f.name, phone: digits, email: f.email.trim(), college: f.college.trim(), branch: f.branch, gradYear: f.gradYear, priorAI: f.priorAI })
    sfx.powerUp()
    navigate('/pass')
  }

  if (s.me)
    return (
      <section className="section">
        <div className="wrap" style={{ maxWidth: 640 }}>
          <Panel className="center">
            <Sprite name="check" size={56} />
            <h2>You’re already in, {firstName(s.me.name)}!</h2>
            <p>Your Quest Pass and invite link are waiting.</p>
            <Btn to="/pass" size="big">
              Open my Quest Pass
            </Btn>
          </Panel>
        </div>
      </section>
    )

  return (
    <section className="section">
      <div className="wrap grid" style={{ gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)', alignItems: 'start' }} data-stack>
        <div className={shake ? 'shake' : ''}>
          <Panel>
            {inviter && (
              <div className="px-panel gold tight" style={{ marginBottom: 18 }}>
                <div className="row" style={{ flexWrap: 'nowrap' }}>
                  <Sprite name="chestOpen" size={36} />
                  <div style={{ fontSize: 18 }}>
                    <b>{inviter.name}</b> from {inviter.college} invited you{inviter.leader ? ' (Quest Leader)' : ''}. You’re joining their squad.
                  </div>
                </div>
              </div>
            )}
            <span className="px-tag">New game</span>
            <h1 style={{ marginTop: 12 }}>Create your player</h1>
            <p className="muted">30 seconds. You’ll get a Quest Pass, your invite link and the join link on WhatsApp.</p>
            <form onSubmit={submit} onFocus={onStart} noValidate>
              <label className="field">
                <span>Name</span>
                <input className="px-input" autoComplete="name" value={f.name} onChange={(e) => set('name', e.target.value)} aria-invalid={!!errors.name} placeholder="Sai Kiran" />
                {errors.name && <em className="err">{errors.name}</em>}
              </label>
              <div className="grid g2" style={{ gap: 12 }}>
                <label className="field">
                  <span>WhatsApp number</span>
                  <input className="px-input" inputMode="tel" autoComplete="tel" value={f.phone} onChange={(e) => set('phone', e.target.value)} aria-invalid={!!errors.phone} placeholder="98xxxxxx21" />
                  {errors.phone && <em className="err">{errors.phone}</em>}
                </label>
                <label className="field">
                  <span>Email</span>
                  <input className="px-input" type="email" autoComplete="email" value={f.email} onChange={(e) => set('email', e.target.value)} aria-invalid={!!errors.email} placeholder="you@college.edu" />
                  {errors.email && <em className="err">{errors.email}</em>}
                </label>
              </div>
              <label className="field">
                <span>College</span>
                <input className="px-input" list="colleges" value={f.college} onChange={(e) => set('college', e.target.value)} aria-invalid={!!errors.college} placeholder="Start typing… e.g. CVR, VNR, KL" />
                <datalist id="colleges">
                  {COLLEGES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.short} · {c.city}
                    </option>
                  ))}
                </datalist>
                {errors.college ? <em className="err">{errors.college}</em> : <small>Your registration counts toward your college in College Wars.</small>}
              </label>
              <div className="grid g2" style={{ gap: 12 }}>
                <label className="field">
                  <span>Branch</span>
                  <select className="px-select" value={f.branch} onChange={(e) => set('branch', e.target.value)}>
                    {BRANCHES.map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </select>
                </label>
                <div className="field">
                  <span>Built anything with AI yet?</span>
                  <div className="seg" role="group" aria-label="Built anything with AI yet?">
                    <button type="button" aria-pressed={!f.priorAI} onClick={() => set('priorAI', false)}>
                      Not yet
                    </button>
                    <button type="button" aria-pressed={f.priorAI} onClick={() => set('priorAI', true)}>
                      A little
                    </button>
                  </div>
                </div>
              </div>
              <div className="field">
                <span>Year</span>
                <div className="seg" role="group" aria-label="Graduation year">
                  {YEARS.map((y) => (
                    <button type="button" key={y.v} aria-pressed={f.gradYear === y.v} onClick={() => set('gradYear', y.v)}>
                      {y.label}
                    </button>
                  ))}
                </div>
              </div>
              <label className="px-check" style={{ margin: '8px 0 6px' }}>
                <input type="checkbox" checked={f.consent} onChange={(e) => set('consent', e.target.checked)} />
                <span>Send me the join link + 3 reminders on WhatsApp. No spam, reply STOP any time.</span>
              </label>
              {errors.consent && <em className="err">{errors.consent}</em>}
              <div style={{ marginTop: 18 }}>
                <Btn type="submit" size="big">
                  ▶ Accept quest
                </Btn>
              </div>
              <p className="muted" style={{ fontSize: 14, marginTop: 12 }}>
                Demo note: this prototype stores entries in your browser only. Feel free to use test details.
              </p>
            </form>
          </Panel>
        </div>
        <div className="stack">
          <Panel dark>
            <h3 style={{ color: 'var(--gold)' }}>What happens next</h3>
            {[
              ['star', 'Your Quest Pass + invite link, instantly'],
              ['chat', 'Join link on WhatsApp + reminders (1 day, 1 hour, live)'],
              ['chest', 'Unlock loot as friends join with your link'],
              ['laptop', `${workshopLabel(true)}: build live for 60 min`],
              ['trophy', 'Submit your project link → certificate'],
            ].map(([sp, t], i) => (
              <div key={t} className="row" style={{ flexWrap: 'nowrap', marginBottom: 10 }}>
                <span className="mono" style={{ fontSize: 24, color: 'var(--gold)', width: 18 }}>
                  {i + 1}
                </span>
                <Sprite name={sp as 'star'} size={28} />
                <span>{t}</span>
              </div>
            ))}
          </Panel>
          <Panel>
            <div className="row" style={{ flexWrap: 'nowrap' }}>
              <Character look={2} size={64} walk />
              <p style={{ margin: 0 }}>
                “I had a copied project on my resume. Building something real in an hour felt doable, not scary.” <br />
                <span className="muted" style={{ fontSize: 15 }}>The feeling we’re designing {WORKSHOP.short} for</span>
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </section>
  )
}
