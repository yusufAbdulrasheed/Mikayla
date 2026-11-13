import { useMemo, useState } from 'react';
import { useSite } from '../lib/SiteContext.jsx';
import { Heading } from '../lib/text.jsx';

const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: '◎', view: 'Post views' },
  { id: 'tiktok', name: 'TikTok', icon: '♪', view: 'Video views' },
  { id: 'x', name: 'X', icon: '𝕏', view: 'Post views' },
  { id: 'medium', name: 'Medium', icon: 'M', view: 'Story views' },
];
const RANGES = [
  { id: 'd7', label: '7 days', long: 'Last 7 days' },
  { id: 'd30', label: '30 days', long: 'Last 30 days' },
  { id: 'd90', label: '90 days', long: 'Last 90 days' },
  { id: 'y1', label: '12 months', long: 'Last 12 months' },
];
const METRICS = [
  { id: 'views', label: 'Views' },
  { id: 'likes', label: 'Likes' },
  { id: 'comments', label: 'Comments' },
  { id: 'engagement', label: 'Engagement' },
  { id: 'gained', label: 'New followers' },
];

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const full = new Intl.NumberFormat('en');
const short = (n) => (Math.abs(n) < 1000 ? full.format(n) : compact.format(n));
const percent = (n) => `${n >= 10 ? n.toFixed(0) : n.toFixed(1)}%`;
const signed = (n) => `${n > 0 ? '+' : ''}${short(n)}`;
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

const read = (a, range, id) => {
  const m = a.ranges?.[range]?.[id] || {};
  return { views: num(m.views), likes: num(m.likes), comments: num(m.comments), gained: num(m.gained) };
};
const hasData = (m) => m.views + m.likes + m.comments !== 0 || m.gained !== 0;
const rate = (m) => (m.views > 0 ? ((m.likes + m.comments) / m.views) * 100 : 0);

const valueOf = (metric, m) => (metric === 'engagement' ? rate(m) : m[metric]);
const fmtMetric = (metric, v) => (metric === 'engagement' ? percent(v) : metric === 'gained' ? signed(v) : short(v));

function Donut({ slices, total }) {
  const R = 74;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <svg className="donut" viewBox="0 0 200 200" role="img" aria-label={slices.map((s) => `${s.name} ${percent((s.value / total) * 100)}`).join(', ')}>
      <circle cx="100" cy="100" r={R} fill="none" stroke="#fce6f0" strokeWidth="28" />
      {slices.map((s) => {
        const len = (s.value / total) * C;
        const el = (
          <circle
            key={s.id} className="donut__arc" cx="100" cy="100" r={R} fill="none" stroke={`var(--c-${s.id})`} strokeWidth="28"
            strokeDasharray={`${Math.max(len - 2, 0)} ${C}`} strokeDashoffset={-offset} transform="rotate(-90 100 100)"
          />
        );
        offset += len;
        return el;
      })}
      <text x="100" y="98" textAnchor="middle" className="donut__big">{short(total)}</text>
      <text x="100" y="122" textAnchor="middle" className="donut__small">FOLLOWERS</text>
    </svg>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric">
      <strong title={full.format(value)}>{short(value)}</strong>
      <span>{label}</span>
    </div>
  );
}

export default function Analytics() {
  const { analytics: a, social } = useSite();
  const [range, setRange] = useState(null);
  const [metric, setMetric] = useState('views');

  const model = useMemo(() => {
    if (!a || a.show === false) return null;
    const ranges = RANGES.filter((r) => PLATFORMS.some((p) => hasData(read(a, r.id, p.id))));
    const active = ranges.some((r) => r.id === range) ? range : (ranges.find((r) => r.id === 'd30') || ranges[0])?.id;
    const rows = PLATFORMS.map((p) => {
      const d = a[p.id] || {};
      const followers = num(d.followers);
      const m = active ? read(a, active, p.id) : { views: 0, likes: 0, comments: 0, gained: 0 };
      const link = social.find((s) => (p.id === 'x' ? /^(x|twitter)/i.test(s.platform.trim()) : s.platform.toLowerCase().includes(p.id)))?.url;
      return { ...p, handle: d.handle, link, followers, m, shown: followers > 0 || hasData(m) };
    }).filter((p) => p.shown);
    if (!rows.length) return null;
    return { ranges, active, rows };
  }, [a, social, range]);

  if (!model) return null;
  const { ranges, active, rows } = model;
  const activeRange = RANGES.find((r) => r.id === active);

  const sum = (key) => rows.reduce((s, p) => s + p.m[key], 0);
  const totalM = { views: sum('views'), likes: sum('likes'), comments: sum('comments'), gained: sum('gained') };
  const totalFollowers = rows.reduce((s, p) => s + p.followers, 0);
  const bars = rows.map((p) => ({ id: p.id, name: p.name, value: valueOf(metric, p.m) }));
  const barMax = Math.max(...bars.map((b) => b.value), 0) || 1;
  const metricName = METRICS.find((m) => m.id === metric).label;

  const periodBars = ranges.map((r) => {
    const m = { views: 0, likes: 0, comments: 0, gained: 0 };
    PLATFORMS.forEach((p) => { const x = read(a, r.id, p.id); m.views += x.views; m.likes += x.likes; m.comments += x.comments; m.gained += x.gained; });
    return { id: r.id, label: r.label, value: valueOf(metric, m) };
  });
  const periodMax = Math.max(...periodBars.map((b) => b.value), 0) || 1;

  const donut = rows.filter((p) => p.followers > 0).map((p) => ({ id: p.id, name: p.name, value: p.followers }));

  return (
    <section className="analytics" id="analytics">
      <div className="wrap">
        <div className="head head--row reveal">
          <div>
            <p className="kicker kicker--light">{a.kicker}</p>
            <Heading heading={a.heading} emphasis={a.emphasis} className="display display--light" />
          </div>
          {ranges.length > 0 && (
            <div className="chips" role="radiogroup" aria-label="Time period">
              {ranges.map((r) => (
                <button key={r.id} type="button" role="radio" aria-checked={r.id === active} className={r.id === active ? 'is-on' : ''} onClick={() => setRange(r.id)}>{r.label}</button>
              ))}
            </div>
          )}
        </div>

        <div className="analytics__totals reveal" key={`t-${active}`}>
          <div><strong>{short(totalFollowers)}</strong><span>Total followers</span></div>
          {active && <div><strong>{short(totalM.views)}</strong><span>Views</span></div>}
          {active && <div><strong>{short(totalM.likes)}</strong><span>Likes</span></div>}
          {active && <div><strong>{short(totalM.comments)}</strong><span>Comments</span></div>}
          {active && totalM.views > 0 && <div><strong>{percent(rate(totalM))}</strong><span>Engagement rate</span></div>}
          {active && totalM.gained !== 0 && <div><strong>{signed(totalM.gained)}</strong><span>New followers</span></div>}
        </div>

        <div className="charts">
          {donut.length > 0 && (
            <figure className="chart chart--donut reveal">
              <figcaption>Where the audience lives</figcaption>
              <div className="chart__donut">
                <Donut slices={donut} total={totalFollowers} />
                <ul className="legend">
                  {donut.map((s) => (
                    <li key={s.id}><i style={{ background: `var(--c-${s.id})` }} />{s.name}<b>{percent((s.value / totalFollowers) * 100)}</b></li>
                  ))}
                </ul>
              </div>
            </figure>
          )}

          {active && (
            <figure className="chart chart--bars reveal">
              <figcaption>
                <span>Compare platforms{activeRange ? ` · ${activeRange.long}` : ''}</span>
                <span className="mtabs" role="tablist" aria-label="Metric">
                  {METRICS.filter((m) => m.id !== 'gained' || rows.some((p) => p.m.gained !== 0)).map((m) => (
                    <button key={m.id} type="button" role="tab" aria-selected={m.id === metric} className={m.id === metric ? 'is-on' : ''} onClick={() => setMetric(m.id)}>{m.label}</button>
                  ))}
                </span>
              </figcaption>
              <ul className="hbars" key={`${active}-${metric}`}>
                {bars.map((b) => (
                  <li key={b.id}>
                    <span className="hbars__name">{b.name}</span>
                    <span className="hbars__track"><i style={{ width: `${Math.max((Math.abs(b.value) / barMax) * 100, b.value ? 3 : 0)}%`, background: `var(--c-${b.id})` }} /></span>
                    <b>{fmtMetric(metric, b.value)}</b>
                  </li>
                ))}
              </ul>
            </figure>
          )}

          {periodBars.length > 1 && (
            <figure className="chart chart--period reveal">
              <figcaption>{metricName} across time periods</figcaption>
              <ul className="vbars" key={`p-${metric}`}>
                {periodBars.map((b) => (
                  <li key={b.id} className={b.id === active ? 'is-on' : ''}>
                    <b>{fmtMetric(metric, b.value)}</b>
                    <span className="vbars__col"><i style={{ height: `${Math.max((Math.abs(b.value) / periodMax) * 100, b.value ? 4 : 0)}%` }} /></span>
                    <span>{b.label}</span>
                  </li>
                ))}
              </ul>
              <p className="chart__note">Totals across all platforms. Longer periods naturally add up to more.</p>
            </figure>
          )}
        </div>

        <div className="analytics__grid">
          {rows.map((c) => {
            const e = rate(c.m);
            const reach = c.followers > 0 && c.m.views > 0 ? c.m.views / c.followers : null;
            const any = c.m.views + c.m.likes + c.m.comments > 0;
            return (
              <article className={`pcard pcard--${c.id} reveal`} key={`${c.id}-${active}`}>
                <header>
                  <span className="pcard__icon" aria-hidden="true">{c.icon}</span>
                  <div>
                    <h3>{c.name}</h3>
                    {c.handle && (c.link
                      ? <a href={c.link} target="_blank" rel="noreferrer">{c.handle}</a>
                      : <p>{c.handle}</p>)}
                  </div>
                  {e > 0 && <span className="pcard__badge" title="Likes and comments, compared with views">{percent(e)} engaged</span>}
                </header>
                <div className="pcard__follow">
                  <strong title={full.format(c.followers)}>{short(c.followers)}</strong>
                  <span>Followers{c.m.gained !== 0 && <em className={c.m.gained > 0 ? 'up' : 'down'}>{c.m.gained > 0 ? '▲' : '▼'} {signed(c.m.gained)}</em>}</span>
                </div>
                {any && (
                  <div className="pcard__metrics">
                    <Metric label={c.view} value={c.m.views} />
                    <Metric label="Likes" value={c.m.likes} />
                    <Metric label="Comments" value={c.m.comments} />
                  </div>
                )}
                {reach !== null && <p className="pcard__foot">Views are <b>{reach >= 10 ? reach.toFixed(0) : reach.toFixed(1)}×</b> the follower count</p>}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
