import { useMemo } from 'react'
import { Bar, Btn, Panel, SectionTitle } from '../components/ui'
import { COLLEGE_WARS_PRIZE } from '../config'
import { computeMetrics } from '../data/analytics'
import { shortName } from '../data/colleges'
import { useStore } from '../data/store'
import { firstName } from '../lib/format'
import { Sprite } from '../pixel/Sprite'

const medal = (i: number) => (i === 0 ? <Sprite name="crown" size={26} /> : i === 1 ? <Sprite name="trophy" size={24} /> : i === 2 ? <Sprite name="star" size={24} /> : `#${i + 1}`)

export default function Wars() {
  const s = useStore()
  const m = useMemo(() => computeMetrics(s), [s])
  const top = m.colleges[0]?.count ?? 1
  const warsOver = s.simDay >= 7

  return (
    <section className="section">
      <div className="wrap">
        <SectionTitle
          tag={warsOver ? 'Final standings' : `Day ${s.simDay} of 7 · closes end of day 6`}
          sprite="flag"
          title="College Wars"
          sub="Every registration counts for your college. Squads, leaders and colleges, all live."
        />
        <div style={{ marginBottom: 26 }}>
          <Panel gold>
            <div className="row between" style={{ gap: 16 }}>
              <div className="row" style={{ flexWrap: 'nowrap' }}>
                <Sprite name="trophy" size={52} />
                <div>
                  <h3 style={{ marginBottom: 4 }}>The prize</h3>
                  <div style={{ fontSize: 19 }}>{COLLEGE_WARS_PRIZE}.</div>
                </div>
              </div>
              {!s.me && (
                <Btn to="/join">
                  ▶ Add your college
                </Btn>
              )}
            </div>
          </Panel>
        </div>

        <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)', alignItems: 'start' }} data-stack>
          <Panel>
            <div className="row between" style={{ marginBottom: 6 }}>
              <h3 style={{ margin: 0 }}>Colleges</h3>
              <span className="muted">{m.colleges.length} colleges · {m.total} players</span>
            </div>
            {m.colleges.slice(0, 15).map((c, i) => (
              <div key={c.name} className={`lb-row ${s.me?.college === c.name ? 'me' : ''}`}>
                <div className="lb-rank">{medal(i)}</div>
                <div>
                  <div className="lb-name" title={c.name}>
                    {c.short} <span className="muted" style={{ fontSize: 15 }}>{c.name !== c.short ? `· ${c.name}` : ''}</span>
                  </div>
                  <Bar value={c.count} max={top} color={i === 0 ? 'gold' : i < 3 ? 'violet' : 'cyan'} />
                </div>
                <div className="lb-count">{c.count}</div>
              </div>
            ))}
          </Panel>

          <div className="stack">
            <Panel>
              <h3>Top squad builders</h3>
              <p className="muted" style={{ marginTop: -4, fontSize: 16 }}>
                Students who brought the most friends. #1 wins a ₹300 voucher.
              </p>
              {m.referrers.slice(0, 8).map((r, i) => (
                <div key={r.code} className={`lb-row ${s.me?.code === r.code ? 'me' : ''}`}>
                  <div className="lb-rank">{medal(i)}</div>
                  <div className="lb-name">
                    {firstName(r.reg.name)} {r.reg.name.split(' ')[1] ?? ''} <span className="muted" style={{ fontSize: 15 }}>· {shortName(r.reg.college)}</span>
                  </div>
                  <div className="lb-count">{r.count}</div>
                </div>
              ))}
            </Panel>
            <Panel dark>
              <h3 style={{ color: 'var(--gold)' }}>Quest Leaders</h3>
              <p className="muted" style={{ marginTop: -4, fontSize: 16 }}>
                Campus ambassadors. Top 3 win ₹500 / ₹300 / ₹200 + a LinkedIn recommendation.
              </p>
              {m.leaders.slice(0, 6).map((l, i) => (
                <div key={l.code} className="lb-row">
                  <div className="lb-rank">{medal(i)}</div>
                  <div className="lb-name">
                    {l.name} <span className="muted" style={{ fontSize: 15 }}>· {shortName(l.college)}</span>
                  </div>
                  <div className="lb-count" style={{ color: 'var(--gold)' }}>
                    {l.regs}
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 12 }}>
                <Btn to="/leaders" size="small">
                  Become a Quest Leader
                </Btn>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </section>
  )
}
