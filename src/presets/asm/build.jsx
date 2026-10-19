/** @jsx hh */
/** @jsxFrag Frag */
/* The attack-surface summary as built: a three-column app grid (rail, section panel,
   main), a header row with its actions pushed right by an auto margin, CSS grid rows
   in fr units, and charts as inline SVG that stretch with their cards. Options plant
   bugs or cap the content width. */
import { hh, Frag, raw, page } from '../../design-kit/html.js';
import { iconHtml, points, smoothPath, areaPath, arcPath, mix, num } from '../../design-kit/index.js';
import { BRAND, USER, RAIL, NAV, SCORE, STATS, TREND, SERVICES, SEVS, HEAT, ASSETS, ASSET_SEEN, TYPE_COLOR, riskColor, C } from './data.js';

const UI = `Arial, Helvetica, 'Liberation Sans', sans-serif`;
const MONO = `'SF Mono', Menlo, Consolas, 'DejaVu Sans Mono', monospace`;
const I = (name, size, color, sw) => raw(iconHtml(name, size, color, sw));
const fr = s => s.split(' ').map(t => (t.endsWith('fr') ? `minmax(0,${t})` : t)).join(' ');

const css = o => `
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%}
body{background:${C.page};color:${C.ink};font-family:${UI};overflow:hidden}
button{font:inherit;color:inherit;border:0;background:none}
.mono{font-family:${MONO}}
.app{display:grid;grid-template-columns:64px 208px minmax(0,1fr);height:100vh}
.rail{position:relative;background:${C.rail};padding-top:16px;display:flex;flex-direction:column;align-items:center}
.logo{width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,#6366F1,#22D3EE);display:flex;align-items:center;justify-content:center}
.rnav{margin-top:24px;display:flex;flex-direction:column;gap:8px}
.rb{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center}
.rb.on{background:${C.railOn}}
.me{position:absolute;left:16px;bottom:20px;width:32px;height:32px;border-radius:50%;background:#312E81;color:#C7D2FE;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center}
.panel{position:relative;background:${C.panel};box-shadow:inset -1px 0 0 ${C.line};padding:18px 10px 0}
.panel h2{padding-left:10px;font-size:16px;line-height:24px;font-weight:600}
.pnav{margin-top:22px}
.group+.group{margin-top:18px}
.gl{padding-left:10px;margin-bottom:6px;font-size:11px;line-height:16px;font-weight:600;letter-spacing:.6px;text-transform:uppercase;color:${C.muted}}
.items{display:flex;flex-direction:column;gap:2px}
.it{height:34px;border-radius:8px;display:flex;align-items:center;gap:10px;padding:0 10px 0 12px;font-size:13px;line-height:20px;font-weight:500;color:${C.ink2}}
.it.on{background:${C.accentSoft};color:#4338CA;font-weight:600}
.badge{margin-left:auto;min-width:22px;height:18px;padding:0 7px;border-radius:9px;background:#FEE2E2;color:#B91C1C;font-size:11px;line-height:18px;font-weight:600;text-align:center}
.count{margin-left:auto;font-size:11.5px;line-height:18px;color:${C.muted}}
.cov{position:absolute;left:12px;right:12px;bottom:16px;height:84px;border:1px solid ${C.line};border-radius:10px;background:#F8FAFC;padding:10px 11px 0}
.cov .t{font-size:12px;line-height:16px;font-weight:500;color:${C.ink2}}
.cov .v{margin-top:4px;display:flex;align-items:baseline;gap:6px}
.cov .v b{font-size:18px;line-height:24px;font-weight:600}
.cov .v span{font-size:11px;line-height:16px;color:${C.muted}}
.cov .bar{margin-top:9px;height:6px;border-radius:3px;background:${C.track};overflow:hidden}
.cov .bar i{display:block;width:92%;height:100%;border-radius:3px;background:#10B981}
.main{display:flex;flex-direction:column;min-width:0;min-height:0}
.top{flex:none;height:${o.tallHeader ? 72 : 64}px;background:#FFFFFF;border-bottom:1px solid ${C.line};display:flex;align-items:center;padding:0 24px}
.top h1{font-size:18px;line-height:26px;font-weight:600;white-space:nowrap}
.status{margin-left:16px;display:flex;align-items:center;gap:6px;font-size:12.5px;line-height:20px;color:${C.muted};white-space:nowrap}
.status i{width:8px;height:8px;border-radius:50%;background:#10B981}
.acts{margin-left:auto;display:flex;align-items:center;gap:12px}
.seg{height:32px;border-radius:8px;background:#F1F4F9;padding:4px;display:flex}
.seg button{height:24px;padding:0 11px;border-radius:6px;font-size:12.5px;line-height:22px;font-weight:600;color:${C.ink2};border:1px solid transparent}
.seg button.on{background:#FFFFFF;border-color:${C.line2};color:${C.ink}}
.btn{height:36px;border-radius:8px;display:flex;align-items:center;gap:8px;padding:0 13px 0 11px;font-size:13px;line-height:20px;font-weight:600;white-space:nowrap}
.btn.sec{background:#FFFFFF;border:1px solid ${C.line2}}
.btn.pri{background:${C.accent};color:#FFFFFF;padding:0 14px 0 12px}
.content{flex:1;min-height:0;padding:24px;display:grid;gap:16px;grid-template-rows:${fr('132px 1.2fr 1fr')}${o.capWidth ? ';width:100%;max-width:1168px' : ''}}
.row{display:grid;gap:16px;min-height:0}
.tiles{grid-template-columns:${fr(o.swapTiles ? '1.4fr 1fr 1fr 1fr' : '1.4fr 1fr 1fr 1fr')}}
.mid{grid-template-columns:${fr('2fr 1fr')}}
.low{grid-template-columns:${fr('1fr 1.4fr')}}
.tile{position:relative;background:${C.card};border:1px solid ${C.line};border-radius:12px;min-width:0;overflow:hidden}
.tl{position:absolute;left:17px;top:15px;font-size:13px;line-height:18px;font-weight:500;color:${C.ink2};white-space:nowrap}
.gauge{position:absolute;left:17px;top:45px;width:100px;height:50px}
.score{position:absolute;left:17px;top:65px;width:100px;text-align:center;font-size:26px;line-height:30px;font-weight:600;letter-spacing:-.3px}
.of{position:absolute;left:17px;top:99px;width:100px;text-align:center;font-size:11px;line-height:14px;color:${C.muted}}
.sr{position:absolute;left:137px;top:49px}
.pill{display:inline-block;height:22px;padding:0 10px;border-radius:11px;background:#FFEDD5;color:#C2410C;font-size:12px;line-height:22px;font-weight:600}
.dl{position:absolute;left:137px;top:80px;display:flex;align-items:center;gap:4px;color:#DC2626;font-size:13px;line-height:20px;font-weight:600;white-space:nowrap}
.note{position:absolute;left:137px;top:100px;font-size:12px;line-height:16px;color:${C.muted};white-space:nowrap}
.kv{position:absolute;left:17px;top:43px;font-size:26px;line-height:32px;font-weight:600;letter-spacing:-.3px}
.ks{position:absolute;left:17px;top:87px;font-size:12px;line-height:16px;font-weight:500;white-space:nowrap}
.ring{position:absolute;right:17px;top:53px;width:48px;height:48px}
.ring svg{display:block}
.ring b{position:absolute;left:0;right:0;top:16px;text-align:center;font-size:11px;line-height:16px;font-weight:600}
.card{position:relative;min-width:0;min-height:0;background:${C.card};border:1px solid ${C.line};border-radius:12px;padding:15px 17px 17px;display:flex;flex-direction:column;overflow:hidden}
.ch{flex:none;height:20px;margin-bottom:14px;display:flex;align-items:center}
.ch h3{font-size:14px;line-height:20px;font-weight:600;white-space:nowrap}
.cr{margin-left:auto;display:flex;align-items:center;gap:16px;font-size:12px;line-height:20px;font-weight:500;color:${C.ink2};white-space:nowrap}
.cr.muted{color:${C.muted}}
.li{display:flex;align-items:center;gap:6px}
.li i{width:8px;height:8px;border-radius:50%}
.body{position:relative;flex:1;min-height:0}
.ylab{position:absolute;left:0;width:30px;text-align:right;font-size:11px;line-height:16px;color:${C.muted}}
.grid{position:absolute;left:40px;right:0;height:1px;background:${C.line}}
.grid.base{background:${C.line2}}
.plot{position:absolute;left:40px;right:0;top:8px;bottom:24px}
.plot svg{display:block;width:100%;height:100%}
.xlab{position:absolute;bottom:0;transform:translateX(-50%);font-size:11px;line-height:16px;color:${C.muted};white-space:nowrap}
.svc{display:flex;flex-direction:column;gap:${o.tightServices ? 6 : 14}px}
.sl{height:18px;display:flex;align-items:center;gap:10px}
.port{height:18px;padding:0 6px;border-radius:4px;background:#F1F5F9;font-size:11px;line-height:18px;font-weight:500;color:${C.ink2}}
.sn{font-size:13px;line-height:20px;font-weight:500}
.sc{margin-left:auto;font-size:12px;line-height:18px;font-weight:600}
.st{margin-top:8px;height:6px;border-radius:3px;background:${C.track};overflow:hidden}
.st i{display:block;height:100%;border-radius:3px}
.heat{height:100%;display:grid;gap:6px;grid-template-columns:${fr('104px 1fr 1fr 1fr 1fr')};grid-template-rows:${fr('18px 1fr 1fr 1fr 1fr 1fr')}}
.hh{padding-top:1px;text-align:center;font-size:10.5px;line-height:16px;font-weight:600;letter-spacing:.5px;color:${C.muted}}
.hg{display:flex;align-items:center;font-size:12.5px;line-height:18px;font-weight:500;color:${C.ink2};white-space:nowrap}
.hc{border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:12px;line-height:18px;font-weight:600}
.view{margin-left:auto;display:flex;align-items:center;gap:2px;color:${C.accent};font-size:13px;line-height:20px;font-weight:500}
.tr{display:grid;grid-template-columns:${fr('1.7fr 92px 80px 1fr 72px')};column-gap:16px}
.thead{height:26px;padding-top:2px;font-size:11px;line-height:16px;font-weight:600;letter-spacing:.5px;color:${C.muted}}
.trow{height:38px;border-top:1px solid ${C.line};padding-top:8px;align-items:start;font-size:13px;line-height:20px}
.cell{min-width:0;white-space:nowrap;overflow:hidden}
.right{text-align:right}
.host{font-size:12.5px;font-weight:500}
.tpc{display:flex}
.tp{display:block;height:20px;padding:0 8px;border-radius:10px;font-size:11.5px;line-height:20px;font-weight:600}
.risk{height:20px;display:flex;align-items:center}
.rt{flex:1;height:6px;border-radius:3px;background:${C.track};overflow:hidden;margin-right:12px}
.rt i{display:block;height:100%;border-radius:3px}
.rv{width:28px;text-align:right;font-size:12px;font-weight:600}
`;

function gaugeSvg(color) {
  return raw(`<svg viewBox="0 0 100 50" width="100" height="50"><path d="${arcPath(50, 50, 40, 50, -Math.PI / 2, Math.PI / 2)}" fill="${C.track}"/><path d="${arcPath(50, 50, 40, 50, -Math.PI / 2, -Math.PI / 2 + Math.PI * (SCORE.value / 100))}" fill="${color}"/></svg>`);
}
function ringSvg(f, color) {
  const a = Math.PI * 2 * Math.min(0.999, f), x = 24 + 21 * Math.sin(a), y = 24 - 21 * Math.cos(a);
  return raw(`<svg viewBox="0 0 48 48" width="48" height="48"><circle cx="24" cy="24" r="21" fill="none" stroke="${C.track}" stroke-width="6"/><path d="M24 3A21 21 0 ${a > Math.PI ? 1 : 0} 1 ${num(x)} ${num(y)}" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round"/></svg>`);
}
function trendSvg() {
  const VB = { x: 0, y: 0, w: 600, h: 200 };
  let s = '<svg viewBox="0 0 600 200" preserveAspectRatio="none"><defs><linearGradient id="ta" x1="0" y1="0" x2="0" y2="200" gradientUnits="userSpaceOnUse">' +
    `<stop stop-color="${TREND.series[0].color}" stop-opacity="0.22"/><stop offset="1" stop-color="${TREND.series[0].color}" stop-opacity="0"/></linearGradient></defs>`;
  for (const t of TREND.series) {
    const pts = points(t.v, VB, 0, TREND.max);
    if (t.area) s += `<path d="${areaPath(pts, 200)}" fill="url(#ta)"/>`;
    s += `<path d="${smoothPath(pts)}" fill="none" stroke="${t.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`;
  }
  return raw(s + '</svg>');
}

export default function asmBuild(o = {}) {
  const max = Math.max(...HEAT.counts.flat());
  const stats = o.swapTiles ? [STATS[1], STATS[0], STATS[2]] : STATS;
  const body = (
    <body>
      <div className="app">
        <nav className="rail" aria-label="Product">
          <span className="logo">{I('shield', 18, '#FFFFFF', 2)}</span>
          <div className="rnav">{RAIL.map(([icon, on]) => <a className={'rb' + (on ? ' on' : '')}>{I(icon, 20, on ? '#A5B4FC' : '#64748B')}</a>)}</div>
          <span className="me">{USER.initials}</span>
        </nav>
        <aside className="panel">
          <h2>Exposure</h2>
          <div className="pnav">
            {NAV.map(g => (
              <div className="group">
                <div className="gl">{g.group}</div>
                <div className="items">
                  {g.items.map(([icon, label, on, badge, kind]) => (
                    <a className={'it' + (on ? ' on' : '')}>{I(icon, 16, on ? C.accent : '#64748B')}{label}{badge ? <span className={kind === 'badge' ? 'badge' : 'count mono'}>{badge}</span> : null}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="cov"><div className="t">Scan coverage</div><div className="v"><b>92%</b><span>of known assets</span></div><div className="bar"><i /></div></div>
        </aside>
        <div className="main">
          <header className="top" data-bug={o.tallHeader ? 'Header bar 72px tall, spec is 64px' : null}>
            <h1>Attack surface summary</h1>
            <span className="status"><i />Scanned 4 min ago</span>
            <div className="acts">
              <div className="seg">{['7d', '30d', '90d'].map((t, i) => <button className={i === 1 ? 'on' : null}>{t}</button>)}</div>
              <button className="btn sec">{I('download', 16, C.ink2)}Export</button>
              {o.dropScan ? null : <button className="btn pri">{I('radar', 16, '#FFFFFF')}Run scan</button>}
            </div>
          </header>
          <main className="content">
            <section className="row tiles">
              <div className="tile">
                <div className="tl">Exposure score</div>
                <div className="gauge" data-bug={o.gaugeColor ? 'Gauge drawn in green, spec is orange for a high score' : null}>{gaugeSvg(o.gaugeColor ? '#10B981' : '#F97316')}</div>
                <div className="score">{String(SCORE.value)}</div>
                <div className="of">out of 100</div>
                <div className="sr"><span className="pill">{SCORE.label}</span></div>
                <div className="dl">{I('trendUp', 14, '#DC2626', 2)}{SCORE.delta}</div>
                <div className="note">{SCORE.note}</div>
              </div>
              {stats.map((s, i) => (
                <div className="tile" data-bug={o.swapTiles && i < 2 ? 'First two stat tiles in swapped order' : null}>
                  <div className="tl">{s.label}</div>
                  <div className="kv">{s.value}</div>
                  <div className="ks" style={{ color: s.subColor }}>{s.sub}</div>
                  <div className="ring">{ringSvg(s.ring, s.ringColor)}<b>{`${Math.round(s.ring * 100)}%`}</b></div>
                </div>
              ))}
            </section>
            <section className="row mid">
              <div className="card">
                <div className="ch"><h3>Exposure trend</h3><div className="cr">{TREND.series.map(s => <span className="li"><i style={{ background: s.color }} />{s.name}</span>)}</div></div>
                <div className="body">
                  {TREND.ylabels.map((t, i) => <><div className={'grid' + (i === 3 ? ' base' : '')} style={{ top: `calc(8px + (100% - 32px) * ${num(i / 3)})` }} /><div className="ylab mono" style={{ top: `calc(8px + (100% - 32px) * ${num(i / 3)} - 8px)` }}>{t}</div></>)}
                  <div className="plot">{trendSvg()}</div>
                  {TREND.xlabels.map((t, i) => <div className="xlab" style={{ left: `calc(40px + (100% - 40px) * ${num((i * 7) / (TREND.days - 1))})` }}>{t}</div>)}
                </div>
              </div>
              <div className="card">
                <div className="ch"><h3>Exposed services</h3><div className="cr muted">by port</div></div>
                <div className="body svc" data-bug={o.tightServices ? 'Service rows spaced 38px apart, spec is 46px' : null}>
                  {SERVICES.map(([port, name, n, col]) => (
                    <div><div className="sl"><span className="port mono">{port}</span><span className="sn">{name}</span><span className="sc mono">{String(n)}</span></div><div className="st"><i style={{ width: `${(n / 420) * 100}%`, background: col }} /></div></div>
                  ))}
                </div>
              </div>
            </section>
            <section className="row low">
              <div className="card">
                <div className="ch"><h3>Findings by asset group</h3><div className="cr muted">open findings</div></div>
                <div className="body">
                  <div className="heat">
                    <span />
                    {SEVS.map(([n]) => <span className="hh">{n.toUpperCase()}</span>)}
                    {HEAT.groups.map((g, i) => (
                      <>
                        <span className="hg">{g}</span>
                        {HEAT.counts[i].map((n, j) => { const t = 0.1 + 0.8 * (n / max); return <span className="hc mono" style={{ background: mix('#FFFFFF', SEVS[j][1], t), color: t > 0.5 ? '#FFFFFF' : C.ink }}>{String(n)}</span>; })}
                      </>
                    ))}
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="ch"><h3>Riskiest assets</h3><a className="view">View all{I('chevronRight', 16, C.accent)}</a></div>
                <div className="body">
                  <div className="tr thead">{['Asset', 'Type', 'Findings', 'Exposure', 'Last seen'].map((t, i) => <span className={'cell' + (i === 4 ? ' right' : '')}>{t.toUpperCase()}</span>)}</div>
                  {ASSETS.map((a, r) => {
                    const [bg, fg] = TYPE_COLOR[a.type];
                    return (
                      <div className="tr trow">
                        <span className="cell host mono">{a.host}</span>
                        <span className="cell tpc"><span className="tp" style={{ background: bg, color: fg }}>{a.type}</span></span>
                        <span className="cell" style={{ fontWeight: 600 }}>{String(a.findings)}</span>
                        <span className="cell risk"><span className="rt"><i style={{ width: `${a.risk}%`, background: riskColor(a.risk) }} /></span><span className="rv mono">{String(a.risk)}</span></span>
                        <span className="cell right" style={{ fontSize: '12px', color: C.muted }}>{ASSET_SEEN[r]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </body>
  );
  return page(`<title>Attack surface summary — ${BRAND}</title>\n<style>${css(o)}</style>`, String(body));
}
