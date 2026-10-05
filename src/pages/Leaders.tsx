import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Btn, CopyBox, Panel, SectionTitle } from '../components/ui'
import { HOOKS, type HookId } from '../config'
import { computeMetrics } from '../data/analytics'
import { COLLEGES, shortName } from '../data/colleges'
import { addLeader, useStore } from '../data/store'
import { firstName } from '../lib/format'
import { canvasToBlob, download, renderLeaderPoster } from '../lib/images'
import { clubLink, groupPost, LANGS, leaderLink, linkedInPost, personalDM, storyCaption, waUrl, type Lang } from '../lib/share'
import { Sprite } from '../pixel/Sprite'
import type { SpriteName } from '../pixel/sprites'

const PERKS: { sprite: SpriteName; title: string; body: string }[] = [
  { sprite: 'coin', title: '₹500 / ₹300 / ₹200', body: 'Vouchers for the top 3 leaders by registrations. Paid only on results.' },
  { sprite: 'scroll', title: 'LinkedIn recommendation', body: 'From the NxtWave growth team for every leader who brings 10+ students.' },
  { sprite: 'trophy', title: 'Your college wins', body: 'Top college gets a free on-campus AI Build Day, and you get to host it.' },
  { sprite: 'gem', title: '“Growth Lead” certificate', body: 'Real campaign experience with real numbers for your resume.' },
]

const PLAYBOOK = [
  ['Where', 'Your class group, branch group, placement updates group, hostel group. 4 groups, 1 post each.'],
  ['When', '7:30–9 PM. That’s when class groups are most active (see the Command Center hour chart).'],
  ['How', 'Post the message, then DM 10 close friends personally. A personal ask converts far better than a group post.'],
  ['Follow-up', 'Day 4: share the College Wars rank in the same groups. One follow-up only. Never spam.'],
]

type Tab = 'group' | 'dm' | 'linkedin' | 'story'

export default function Leaders() {
  const s = useStore()
  const m = useMemo(() => computeMetrics(s), [s])
  const me = s.myLeader
  const [f, setF] = useState({ name: '', college: '', phone: '' })
  const [err, setErr] = useState('')
  const [tab, setTab] = useState<Tab>('group')
  const [lang, setLang] = useState<Lang>('te')
  const [hook, setHook] = useState<HookId>('B')
  const [poster, setPoster] = useState<string | null>(null)
  const [posterBlob, setPosterBlob] = useState<Blob | null>(null)
  const [club, setClub] = useState('GDG on Campus CVR')

  const link = me ? leaderLink(me.code, hook) : ''
  const myRegs = me ? s.registrations.filter((r) => r.leader === me.code).length : 0
  const rank = me ? m.leaders.findIndex((l) => l.code === me.code) + 1 : 0
  const collegeRank = me ? m.colleges.findIndex((c) => c.name === me.college) + 1 : 0

  useEffect(() => {
    if (!me) return
    let alive = true
    renderLeaderPoster(me, leaderLink(me.code, 'B', 'poster')).then(async (c) => {
      const b = await canvasToBlob(c)
      if (!alive) return
      setPosterBlob(b)
      setPoster(URL.createObjectURL(b))
    })
    return () => {
      alive = false
    }
  }, [me])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (f.name.trim().length < 2 || f.college.trim().length < 3) return setErr('Name and college, please.')
    setErr('')
    addLeader({ name: f.name, college: f.college, phone: f.phone })
  }

  const message =
    tab === 'group'
      ? groupPost(lang, link, hook, collegeRank > 0 && collegeRank <= 10 ? collegeRank : undefined)
      : tab === 'dm'
        ? personalDM(lang, link)
        : tab === 'linkedin'
          ? linkedInPost(leaderLink(me?.code ?? '', hook, 'linkedin'))
          : storyCaption(leaderLink(me?.code ?? '', hook, 'instagram'))

  return (
    <section className="section">
      <div className="wrap">
        <SectionTitle
          tag="Channel #1 · campus ambassadors"
          sprite="flag"
          title="Quest Leader kit"
          sub="30 final-years who post one tracked message in their class WhatsApp groups. The plan’s biggest channel, and this is everything they need in one place."
        />

        {!me ? (
          <div className="grid g2" style={{ alignItems: 'start' }}>
            <Panel>
              <h2>Become a Quest Leader</h2>
              <p className="muted">Get your tracked link, ready-to-post messages in 3 languages and a QR poster. Takes 20 seconds.</p>
              <form onSubmit={submit}>
                <label className="field">
                  <span>Your name</span>
                  <input className="px-input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Ravi Teja" />
                </label>
                <label className="field">
                  <span>College</span>
                  <input className="px-input" list="leader-colleges" value={f.college} onChange={(e) => setF({ ...f, college: e.target.value })} placeholder="Start typing…" />
                  <datalist id="leader-colleges">
                    {COLLEGES.map((c) => (
                      <option key={c.name} value={c.name} />
                    ))}
                  </datalist>
                </label>
                <label className="field">
                  <span>WhatsApp (optional)</span>
                  <input className="px-input" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="For leaderboard updates" />
                </label>
                {err && <p className="err">{err}</p>}
                <Btn type="submit" size="big">
                  ▶ Get my kit
                </Btn>
              </form>
            </Panel>
            <div className="grid g2" style={{ gap: 16 }}>
              {PERKS.map((p) => (
                <Panel key={p.title}>
                  <Sprite name={p.sprite} size={40} />
                  <h3 style={{ marginTop: 10 }}>{p.title}</h3>
                  <p style={{ margin: 0, fontSize: 17 }}>{p.body}</p>
                </Panel>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 1fr)', alignItems: 'start' }} data-stack>
            <div className="stack">
              <Panel>
                <div className="row between">
                  <div>
                    <span className="px-tag">Quest Leader</span>
                    <h2 style={{ margin: '10px 0 0' }}>{firstName(me.name)}’s kit</h2>
                    <div className="muted">{shortName(me.college)} · code {me.code}</div>
                  </div>
                  <div className="row" style={{ gap: 18 }}>
                    <div className="center">
                      <div className="mono" style={{ fontSize: 44, lineHeight: 1 }}>{myRegs}</div>
                      <div className="display" style={{ fontSize: 8 }}>Sign-ups</div>
                    </div>
                    <div className="center">
                      <div className="mono" style={{ fontSize: 44, lineHeight: 1 }}>#{rank || '-'}</div>
                      <div className="display" style={{ fontSize: 8 }}>Rank</div>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 16 }}>
                  <CopyBox text={link} label="Your tracked link" />
                </div>
                <div className="row" style={{ marginTop: 10, gap: 8 }}>
                  <span className="display" style={{ fontSize: 9 }}>Hook test</span>
                  <div className="seg" role="group" aria-label="Message hook">
                    {(['A', 'B'] as HookId[]).map((h) => (
                      <button key={h} type="button" aria-pressed={hook === h} onClick={() => setHook(h)}>
                        {h}: {HOOKS[h].label}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="muted" style={{ fontSize: 15, marginTop: 6 }}>
                  Links carry the hook (h={hook}) so the Command Center can see which message converts. Day 1–3 we split A/B, then everyone switches to
                  the winner.
                </p>
              </Panel>

              <Panel>
                <div className="row between">
                  <h3 style={{ margin: 0 }}>Ready-to-post messages</h3>
                  <div className="seg" role="group" aria-label="Language">
                    {LANGS.map((l) => (
                      <button key={l.id} type="button" aria-pressed={lang === l.id} onClick={() => setLang(l.id)} title={l.note}>
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="seg" role="tablist" style={{ margin: '14px 0' }}>
                  {(
                    [
                      ['group', 'Class group'],
                      ['dm', 'Personal DM'],
                      ['linkedin', 'LinkedIn'],
                      ['story', 'Insta story'],
                    ] as [Tab, string][]
                  ).map(([id, label]) => (
                    <button key={id} type="button" role="tab" aria-pressed={tab === id} aria-selected={tab === id} onClick={() => setTab(id)}>
                      {label}
                    </button>
                  ))}
                </div>
                <CopyBox text={message} rows={6} />
                {(tab === 'group' || tab === 'dm') && (
                  <div style={{ marginTop: 10 }}>
                    <Btn variant="wa" href={waUrl(message)} newTab>
                      <Sprite name="chat" size={20} /> Open in WhatsApp
                    </Btn>
                  </div>
                )}
                {lang !== 'en' && tab !== 'linkedin' && (
                  <p className="muted" style={{ fontSize: 15, marginTop: 10 }}>
                    Written in Roman script because that’s how students actually text in class groups. English copy reads like an ad.
                  </p>
                )}
              </Panel>

              <Panel dark>
                <h3 style={{ color: 'var(--gold)' }}>Leader playbook</h3>
                {PLAYBOOK.map(([k, v]) => (
                  <div key={k} className="row" style={{ alignItems: 'flex-start', flexWrap: 'nowrap', marginBottom: 10 }}>
                    <span className="px-tag" style={{ minWidth: 96, justifyContent: 'center' }}>
                      {k}
                    </span>
                    <span style={{ fontSize: 17 }}>{v}</span>
                  </div>
                ))}
              </Panel>
            </div>

            <div className="stack">
              <Panel tight>
                <div className="row between" style={{ marginBottom: 8 }}>
                  <h3 style={{ margin: 0 }}>Notice-board poster</h3>
                  <Btn size="small" disabled={!posterBlob} onClick={() => posterBlob && download(posterBlob, `ai-quest-poster-${me.code}.png`)}>
                    Download
                  </Btn>
                </div>
                {poster ? (
                  <img src={poster} alt="Printable poster with QR code" style={{ width: '100%', display: 'block', boxShadow: '0 0 0 3px var(--ink)' }} />
                ) : (
                  <div className="center" style={{ padding: 40 }}>
                    <span className="blink display" style={{ fontSize: 11 }}>
                      Printing…
                    </span>
                  </div>
                )}
                <p className="muted" style={{ fontSize: 15, margin: '8px 0 0' }}>
                  A4 · the QR uses utm_source=poster so print traffic is tracked separately.
                </p>
              </Panel>
            </div>
          </div>
        )}

        <div style={{ marginTop: 34 }}>
          <Panel dark>
            <div className="row" style={{ flexWrap: 'nowrap', alignItems: 'flex-start', gap: 16 }}>
              <Sprite name="shield" size={48} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span className="px-tag">Channel #2 · club & T&P co-hosts</span>
                <h3 style={{ color: 'var(--gold)', marginTop: 10 }}>Co-host link generator</h3>
                <p className="muted" style={{ marginTop: -4 }}>
                  Every partner club or placement cell gets its own link (utm_medium=club) so we know which partnerships actually deliver.
                </p>
                <label className="field" style={{ maxWidth: 460 }}>
                  <span>Club or cell name</span>
                  <input className="px-input" value={club} onChange={(e) => setClub(e.target.value)} />
                </label>
                <CopyBox text={clubLink(club || 'club')} dark />
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </section>
  )
}
