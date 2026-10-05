import { useEffect, useMemo, useState } from 'react'
import { Bar, Btn, CopyBox, Panel } from '../components/ui'
import { SQUAD_REWARDS, WORKSHOP } from '../config'
import { computeMetrics, referralsOf } from '../data/analytics'
import { shortName } from '../data/colleges'
import { demoFriendJoin, signOut, track, useStore } from '../data/store'
import { googleCalendarUrl, downloadIcs } from '../lib/calendar'
import { firstName } from '../lib/format'
import { canvasToBlob, renderQuestPass, shareOrDownload, download } from '../lib/images'
import { friendInvite, inviteLink, LANGS, liUrl, tgUrl, waBotUrl, waUrl, type Lang } from '../lib/share'
import { sfx } from '../lib/sound'
import { Sprite } from '../pixel/Sprite'
import type { SpriteName } from '../pixel/sprites'

export default function Pass() {
  const s = useStore()
  const me = s.me
  const m = useMemo(() => computeMetrics(s), [s])
  const [lang, setLang] = useState<Lang>('en')
  const [img, setImg] = useState<string | null>(null)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [unlocked, setUnlocked] = useState<number | null>(null)

  const link = me ? inviteLink(me.code) : ''
  const squad = me ? referralsOf(s, me.code) : []
  const playerNo = me ? s.registrations.findIndex((r) => r.id === me.id) + 1 : 0

  useEffect(() => {
    if (!me) return
    let alive = true
    renderQuestPass(me, link, playerNo).then(async (c) => {
      if (!alive) return
      const b = await canvasToBlob(c)
      setBlob(b)
      setImg(URL.createObjectURL(b))
    })
    return () => {
      alive = false
    }
  }, [me?.id])

  const prev = useMemo(() => ({ n: squad.length }), [me?.id])
  useEffect(() => {
    const hit = SQUAD_REWARDS.find((r) => r.at === squad.length)
    if (squad.length > prev.n && hit) {
      setUnlocked(hit.at)
      sfx.powerUp()
      const t = setTimeout(() => setUnlocked(null), 2600)
      return () => clearTimeout(t)
    }
  }, [squad.length, prev])

  if (!me)
    return (
      <section className="section">
        <div className="wrap" style={{ maxWidth: 640 }}>
          <Panel className="center">
            <Sprite name="lock" size={56} />
            <h2>No Quest Pass yet</h2>
            <p>Register in 30 seconds to get your pass, your invite link and your squad tracker.</p>
            <Btn to="/join" size="big">
              ▶ Join free
            </Btn>
          </Panel>
        </div>
      </section>
    )

  const message = friendInvite(lang, link)
  const myCollege = m.colleges.findIndex((c) => c.name === me.college)
  const myRank = myCollege + 1
  const ahead = myCollege > 0 ? m.colleges[myCollege - 1] : null
  const myCount = m.colleges[myCollege]?.count ?? 1
  const next = SQUAD_REWARDS.find((r) => r.at > squad.length)

  const shared = () => {
    track('share')
    sfx.coin()
  }

  return (
    <section className="section">
      <div className="wrap">
        <div className="center" style={{ marginBottom: 26 }}>
          <span className="px-tag pop">Quest accepted</span>
          <h1 style={{ color: '#fff', textShadow: '3px 3px 0 var(--ink), -2px -2px 0 var(--ink), 2px -2px 0 var(--ink), -2px 2px 0 var(--ink)', marginTop: 14 }}>
            Welcome, {firstName(me.name)}!
          </h1>
          <p style={{ color: '#fff', textShadow: '2px 2px 0 var(--ink)', fontSize: 20 }}>
            You’re player #{playerNo}. The join link is on its way to your WhatsApp.
          </p>
        </div>

        <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 0.8fr) minmax(0, 1.2fr)', alignItems: 'start' }} data-stack>
          {/* pass image */}
          <div className="stack">
            <Panel tight>
              {img ? (
                <img src={img} alt={`Quest Pass for ${me.name}`} style={{ width: '100%', display: 'block' }} />
              ) : (
                <div className="center" style={{ padding: 60 }}>
                  <span className="blink display" style={{ fontSize: 12 }}>
                    Rendering pass…
                  </span>
                </div>
              )}
            </Panel>
            <div className="row" style={{ gap: 6 }}>
              <Btn
                variant="wa"
                disabled={!blob}
                onClick={async () => {
                  if (!blob) return
                  shared()
                  await shareOrDownload(blob, `quest-pass-${me.code}.png`, message)
                }}
              >
                Share to Status
              </Btn>
              <Btn variant="paper" disabled={!blob} onClick={() => blob && download(blob, `quest-pass-${me.code}.png`)}>
                Download
              </Btn>
            </div>
            <p style={{ color: '#fff', textShadow: '2px 2px 0 var(--ink)', fontSize: 16 }}>
              Post it on WhatsApp Status. Every friend who scans the QR joins your squad.
            </p>
          </div>

          <div className="stack">
            {/* invite */}
            <Panel>
              <div className="row between">
                <h2 style={{ margin: 0 }}>Invite your squad</h2>
                <span className="px-tag light">Code: {me.code}</span>
              </div>
              <p className="muted" style={{ marginTop: 8 }}>
                Students go to workshops with friends. Send this to your class group or your 3 closest friends.
              </p>
              <CopyBox text={link} label="Your invite link" />
              <div style={{ margin: '16px 0 8px' }} className="row between">
                <span className="display" style={{ fontSize: 10 }}>
                  Message
                </span>
                <div className="seg" role="group" aria-label="Message language">
                  {LANGS.map((l) => (
                    <button key={l.id} type="button" aria-pressed={lang === l.id} onClick={() => setLang(l.id)} title={l.note}>
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
              <CopyBox text={message} rows={4} />
              <div className="row" style={{ marginTop: 12, gap: 6 }}>
                <Btn variant="wa" href={waUrl(message)} newTab onClick={shared}>
                  <Sprite name="chat" size={20} /> WhatsApp
                </Btn>
                <Btn variant="paper" href={tgUrl(link, message.split('\n')[0])} newTab onClick={shared}>
                  Telegram
                </Btn>
                <Btn variant="paper" href={liUrl(link)} newTab onClick={shared}>
                  LinkedIn
                </Btn>
              </div>
            </Panel>

            {/* squad */}
            <Panel className={unlocked ? 'pop' : ''}>
              <div className="row between">
                <h2 style={{ margin: 0 }}>Squad loot</h2>
                <span className="mono" style={{ fontSize: 30 }}>
                  {squad.length}/5 <span className="muted" style={{ fontSize: 20 }}>friends</span>
                </span>
              </div>
              <div style={{ margin: '12px 0 18px' }}>
                <Bar value={squad.length} max={5} color="violet" label="Friends joined" />
              </div>
              <div className="grid g3" style={{ gap: 12 }}>
                {SQUAD_REWARDS.map((r) => {
                  const open = squad.length >= r.at
                  return (
                    <div key={r.at} className={`px-panel ${open ? 'gold' : 'inset'} tight center`} style={{ opacity: open ? 1 : 0.85 }}>
                      <div className={open && unlocked === r.at ? 'pop' : ''}>
                        <Sprite name={open ? (r.sprite === 'chest' ? 'chestOpen' : (r.sprite as SpriteName)) : 'lock'} size={44} />
                      </div>
                      <div className="display" style={{ fontSize: 9, margin: '8px 0 4px' }}>
                        {r.at} friend{r.at > 1 ? 's' : ''}
                      </div>
                      <b>{r.name}</b>
                      <div style={{ fontSize: 15 }}>{r.desc}</div>
                    </div>
                  )
                })}
              </div>
              {unlocked && (
                <div className="center pop" style={{ marginTop: 14 }}>
                  <span className="px-tag">★ Loot unlocked: {SQUAD_REWARDS.find((r) => r.at === unlocked)?.name} ★</span>
                </div>
              )}
              <div style={{ marginTop: 16 }}>
                {squad.length ? (
                  <div className="row" style={{ gap: 6 }}>
                    {squad.map((f) => (
                      <span key={f.id} className="px-tag light">
                        ✓ {f.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="muted" style={{ margin: 0 }}>No friends yet. {next && `${next.at} friend${next.at > 1 ? 's' : ''} unlocks ${next.name}.`}</p>
                )}
              </div>
              <div className="px-panel dark tight" style={{ marginTop: 16 }}>
                <div className="row between">
                  <span style={{ fontSize: 16 }}>
                    <b style={{ color: 'var(--gold)' }}>Reviewer demo:</b> pretend a friend opened your link.
                  </span>
                  <Btn size="small" variant="violet" onClick={() => demoFriendJoin(me.code)} disabled={squad.length >= 8}>
                    + Friend joins
                  </Btn>
                </div>
              </div>
            </Panel>

            {/* college wars nudge */}
            <Panel gold>
              <div className="row" style={{ flexWrap: 'nowrap' }}>
                <Sprite name="flag" size={48} />
                <div>
                  <h3 style={{ marginBottom: 6 }}>
                    {shortName(me.college)} is #{myRank} in College Wars
                  </h3>
                  <p style={{ margin: 0 }}>
                    {ahead
                      ? `${myCount} players. ${ahead.count - myCount + 1} more to overtake ${ahead.short}.`
                      : `${myCount} players and leading. Keep the crown!`}{' '}
                    <a href="#/wars">See leaderboard →</a>
                  </p>
                </div>
              </div>
            </Panel>

            {/* show-up prep */}
            <Panel dark>
              <h3 style={{ color: 'var(--gold)' }}>Before {WORKSHOP.short} starts</h3>
              <p className="muted" style={{ marginTop: -4 }}>
                People who do the 2-minute setup early are far more likely to actually show up and finish.
              </p>
              <div className="row" style={{ gap: 6 }}>
                <Btn
                  href={googleCalendarUrl(`Build Your First AI Project in 60 Minutes. Your invite link: ${link}`)}
                  newTab
                  size="small"
                >
                  + Google Calendar
                </Btn>
                <Btn size="small" variant="paper" onClick={() => downloadIcs(`Build Your First AI Project in 60 Minutes. Your invite link: ${link}`)}>
                  .ics file
                </Btn>
                <Btn size="small" variant="wa" href={waBotUrl(`REMIND ${me.code}`)} newTab>
                  WhatsApp reminders
                </Btn>
              </div>
              <ol style={{ margin: '14px 0 0', paddingLeft: 22, fontSize: 17 }}>
                <li>Create a free GitHub account (1 min)</li>
                <li>Get a free LLM API key from the link in your WhatsApp kit (1 min)</li>
                <li>Join 5 minutes early from a laptop with Chrome</li>
              </ol>
            </Panel>
            <div className="center">
              <button className="px-btn paper small" onClick={() => signOut()}>
                Register someone else (demo)
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
