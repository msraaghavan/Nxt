import { useEffect, useState } from 'react'
import { CANDIDATE, WORKSHOP } from '../config'
import { shortName } from '../data/colleges'
import { setNight, setSimDay, setSound, useStore } from '../data/store'
import { firstName } from '../lib/format'
import { href, useRoute } from '../lib/router'
import { sfx } from '../lib/sound'
import { Sprite } from '../pixel/Sprite'
import { Btn } from './ui'

const REVIEW_LINKS = [
  { to: '/plan', label: 'Growth Plan' },
  { to: '/hq', label: 'Command Center' },
  { to: '/whatsapp', label: 'WhatsApp Flow' },
  { to: '/leaders', label: 'Leader Kit' },
  { to: '/notes', label: 'AI Notes' },
]

export function ReviewerBar() {
  const s = useStore()
  const route = useRoute()
  return (
    <div className="reviewer-bar">
      <div className="wrap row between" style={{ gap: 8, flexWrap: 'nowrap' }}>
        <div className="row" style={{ gap: 10, flexWrap: 'nowrap', minWidth: 0 }}>
          <span className="px-tag" style={{ background: 'var(--violet)', color: '#fff' }}>
            Prototype
          </span>
          <span className="rb-title">NxtWave Growth Challenge · by {CANDIDATE.name}</span>
        </div>
        <nav className="rb-links" aria-label="Reviewer tour">
          {REVIEW_LINKS.map((l) => (
            <a key={l.to} href={href(l.to)} aria-current={route === l.to ? 'page' : undefined}>
              {l.label}
            </a>
          ))}
          <label className="rb-day" title="The campaign is simulated. Pick which day of the 7-day campaign you are viewing.">
            <span>Sim day</span>
            <select value={s.simDay} onChange={(e) => setSimDay(Number(e.target.value))} aria-label="Simulated campaign day">
              {Array.from({ length: 7 }, (_, i) => (
                <option key={i} value={i + 1}>
                  {i + 1}/7
                </option>
              ))}
            </select>
          </label>
        </nav>
      </div>
    </div>
  )
}

const NAV = [
  { to: '/', label: 'Quest' },
  { to: '/#loot', label: 'Loot' },
  { to: '/wars', label: 'College Wars' },
  { to: '/leaders', label: 'Quest Leaders' },
]

export function Nav() {
  const s = useStore()
  const route = useRoute()
  const [open, setOpen] = useState(false)
  useEffect(() => setOpen(false), [route])
  const go = (to: string) => {
    if (to === '/#loot') {
      if (route !== '/') location.hash = '/'
      setTimeout(() => document.getElementById('loot')?.scrollIntoView({ behavior: 'smooth' }), 60)
      return
    }
    location.hash = to
    window.scrollTo({ top: 0 })
  }
  return (
    <header className="nav">
      <div className="wrap row between" style={{ flexWrap: 'nowrap' }}>
        <a href={href('/')} className="logo" aria-label={`${WORKSHOP.short} home`}>
          <Sprite name="robot" size={34} />
          <span>
            AI QUEST <b>60</b>
          </span>
        </a>
        <nav className={`nav-links ${open ? 'open' : ''}`} aria-label="Main">
          {NAV.map((n) => (
            <a
              key={n.to}
              href={href(n.to === '/#loot' ? '/' : n.to)}
              onClick={(e) => {
                e.preventDefault()
                sfx.click()
                go(n.to)
              }}
              aria-current={route === n.to ? 'page' : undefined}
            >
              {n.label}
            </a>
          ))}
        </nav>
        <div className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
          <button className="icon-btn" onClick={() => setNight(!s.night)} aria-label={s.night ? 'Switch to day' : 'Switch to night'} title="Day / night">
            {s.night ? '☾' : '☀'}
          </button>
          <button className="icon-btn" onClick={() => { setSound(!s.sound); if (!s.sound) setTimeout(() => sfx.coin(), 30) }} aria-label={s.sound ? 'Mute sound' : 'Turn on 8-bit sound'} title="8-bit sound">
            {s.sound ? '♪' : '✕'}
          </button>
          {s.me ? (
            <Btn to="/pass" size="small" variant="violet">
              My Pass
            </Btn>
          ) : (
            <Btn to="/join" size="small">
              Join free
            </Btn>
          )}
          <button className="icon-btn burger" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Menu">
            ≡
          </button>
        </div>
      </div>
    </header>
  )
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="path-band" />
      <div className="wrap" style={{ padding: '28px 16px 40px' }}>
        <div className="row between" style={{ alignItems: 'flex-start', gap: 24 }}>
          <div style={{ maxWidth: 520 }}>
            <div className="logo" style={{ marginBottom: 10 }}>
              <Sprite name="robot" size={28} />
              <span>
                AI QUEST <b>60</b>
              </span>
            </div>
            <p className="muted" style={{ fontSize: 16 }}>
              A concept campaign prototype built for the NxtWave Growth Intern challenge. It is a simulation: registrations, leaders and colleges in the
              dashboards are generated data, and it is not an official NxtWave page.
            </p>
          </div>
          <div className="row" style={{ gap: 28, alignItems: 'flex-start' }}>
            <div className="stack" style={{ fontSize: 17 }}>
              <div className="display" style={{ fontSize: 9 }}>Students</div>
              <a href={href('/join')}>Register</a>
              <a href={href('/wars')}>College Wars</a>
              <a href={href('/pass')}>My Quest Pass</a>
            </div>
            <div className="stack" style={{ fontSize: 17 }}>
              <div className="display" style={{ fontSize: 9 }}>Growth team</div>
              <a href={href('/leaders')}>Quest Leader kit</a>
              <a href={href('/whatsapp')}>WhatsApp flow</a>
              <a href={href('/hq')}>Command Center</a>
            </div>
            <div className="stack" style={{ fontSize: 17 }}>
              <div className="display" style={{ fontSize: 9 }}>Submission</div>
              <a href={href('/plan')}>Growth Plan</a>
              <a href={href('/notes')}>AI + Learning Notes</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

/** Social-proof toasts built from the latest registrations. */
export function Toasts() {
  const s = useStore()
  const route = useRoute()
  const [i, setI] = useState(-1)
  const recent = s.registrations.slice(-24).reverse()
  const enabled = route === '/' || route === '/join' || route === '/wars'
  useEffect(() => {
    if (!enabled) return
    const first = setTimeout(() => setI(0), 6000)
    const id = setInterval(() => setI((v) => v + 1), 14000)
    return () => {
      clearTimeout(first)
      clearInterval(id)
    }
  }, [enabled])
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (i < 0 || !enabled) return
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 5200)
    return () => clearTimeout(t)
  }, [i, enabled])
  if (!enabled || i < 0 || !recent.length) return null
  const r = recent[i % recent.length]
  const mins = 2 + ((i * 7) % 23)
  return (
    <div className={`toast ${visible ? 'in' : ''}`} aria-live="polite">
      <div className="px-panel tight" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <Sprite name="star" size={28} />
        <div style={{ fontSize: 16, lineHeight: 1.25 }}>
          <b>{firstName(r.name)}</b> from <b>{shortName(r.college)}</b> joined the quest
          <div className="muted" style={{ fontSize: 14 }}>
            {r.referredBy && !r.referredBy.startsWith('QL-') ? 'via a friend’s invite · ' : ''}
            {mins} min ago
          </div>
        </div>
      </div>
    </div>
  )
}
