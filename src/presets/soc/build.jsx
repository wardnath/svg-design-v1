/** @jsx hh */
/** @jsxFrag Frag */
/* The SOC overview as an engineer would build it: CSS grid and flexbox, a fixed
   232px sidebar, fr tracks for the widgets, and inline SVG charts that stretch
   with their containers. Options plant bugs or freeze the grid at 1440 × 960. */
import { hh, Frag, raw, page } from '../../design-kit/html.js';
import { iconHtml, points, smoothPath, arcPath, mapDots, geo, arcBetween, MAP_VB, num, tw } from '../../design-kit/index.js';
import { BRAND, NAV, USER, KPIS, SEVERITY, EVENTS, VECTORS, ATTACKS, ORIGINS, ALERTS, STATUS_COLOR, SEV_COLOR, C } from './data.js';

const UI = `Verdana, 'DejaVu Sans', 'Bitstream Vera Sans', Geneva, sans-serif`;
const MONO = `Consolas, Menlo, 'DejaVu Sans Mono', 'Liberation Mono', monospace`;
const I = (name, size, color, sw) => raw(iconHtml(name, size, color, sw));
const hexA = (hex, a) => hex + Math.round(a * 255).toString(16).padStart(2, '0');

const css = o => `
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%}
body{background:${C.page};color:${C.ink};font-family:${UI};overflow:hidden}
.mono{font-family:${MONO}}
.app{display:grid;grid-template-columns:232px 1fr;height:100vh}
.side{position:relative;background:${C.side};border-right:1px solid ${C.line};padding:18px 12px 0}
.brand{display:flex;align-items:center;height:28px;padding-left:8px}
.logo{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#22D3EE,#6366F1);display:flex;align-items:center;justify-content:center}
.word{margin-left:10px;font-size:17px;line-height:28px;font-weight:700}
.tag{margin-left:8px;width:34px;height:16px;border-radius:4px;background:#1A2740;color:${C.ink2};font-size:10px;line-height:16px;font-weight:600;letter-spacing:.4px;text-align:center}
.nav{margin-top:26px}
.group+.group{margin-top:16px}
.glabel{padding-left:8px;font-size:11px;line-height:16px;font-weight:600;letter-spacing:.6px;color:${C.muted};text-transform:uppercase;margin-bottom:6px}
.items{display:flex;flex-direction:column;gap:2px}
.item{position:relative;height:36px;border-radius:8px;display:flex;align-items:center;padding-left:${o.jitter ? 13 : 12}px;gap:10px;font-size:13.5px;line-height:20px;font-weight:500;color:${C.ink2}}
.item.on{background:#18233A;color:${C.ink};font-weight:600}
.item.on::before{content:"";position:absolute;left:0;top:9px;width:3px;height:18px;border-radius:2px;background:${C.accent}}
.badge{margin-left:auto;margin-right:10px;min-width:24px;height:18px;padding:0 7px;border-radius:9px;background:#3B1D2A;color:#FDA4AF;font-size:11px;line-height:18px;font-weight:600;text-align:center}
.user{position:absolute;left:16px;right:16px;bottom:0;height:72px;border-top:1px solid ${C.line};display:flex;align-items:center;padding-left:4px}
.av{width:32px;height:32px;border-radius:50%;background:#3B2F63;color:#DDD6FE;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex:none}
.who{margin-left:10px}
.who b{display:block;font-size:13px;line-height:18px;font-weight:600}
.who span{display:block;margin-top:1px;font-size:12px;line-height:16px;color:${C.muted}}
.out{margin-left:auto;margin-right:6px;display:flex}
.main{display:flex;flex-direction:column;min-width:0;min-height:0}
.top{flex:none;height:64px;background:${C.top};border-bottom:1px solid ${C.line};display:flex;align-items:center;padding:0 24px}
.top h1{font-size:18px;line-height:26px;font-weight:600;white-space:nowrap}
.search{margin-left:32px;flex:0 1 440px;min-width:160px;height:36px;border-radius:${o.pillSearch ? 18 : 8}px;background:#0A101C;border:1px solid ${C.line2};display:flex;align-items:center;padding-left:11px;gap:10px;color:${C.muted};font-size:13px;line-height:20px;white-space:nowrap;overflow:hidden}
.kbd{margin-left:auto;margin-right:9px;width:20px;height:20px;flex:none;border:1px solid ${C.line2};border-radius:5px;font-size:11px;line-height:18px;text-align:center;font-weight:600}
.tr{margin-left:auto;padding-left:24px;display:flex;align-items:center;gap:12px}
.range{height:36px;border-radius:8px;background:#131D30;border:1px solid ${C.line2};display:flex;align-items:center;padding:0 11px;gap:8px;font-size:13px;line-height:20px;font-weight:500;white-space:nowrap}
.live{height:28px;border-radius:14px;background:#0E2A26;display:flex;align-items:center;padding:0 10px;gap:6px;color:#6EE7B7;font-size:12px;line-height:20px;font-weight:600}
.live i{width:8px;height:8px;border-radius:50%;background:#34D399}
.bell{position:relative;width:36px;height:36px;border-radius:8px;background:#131D30;border:1px solid ${C.line2};display:flex;align-items:center;justify-content:center}
.bell::after{content:"";position:absolute;left:19px;top:3px;width:8px;height:8px;border-radius:50%;background:#F43F5E;border:2px solid #131D30}
.content{flex:1;min-height:0;padding:24px;display:grid;gap:16px;grid-template-rows:${o.fixedGrid ? '112px 251.2px 218.4px 218.4px' : '112px 1.15fr 1fr 1fr'}}
.kpis{display:grid;gap:16px;grid-template-columns:${o.fixedGrid ? 'repeat(4,278px)' : 'repeat(4,1fr)'}}
.row{display:grid;gap:16px;min-height:0;grid-template-columns:${o.fixedGrid ? '762.67px 381.33px' : '2fr 1fr'}}
.card{position:relative;min-height:0;min-width:0;background:${C.card};border:1px solid ${C.line};border-radius:12px;padding:13px 15px 15px;display:flex;flex-direction:column;overflow:hidden}
.ch{flex:none;height:20px;margin-bottom:${o.jitter ? 13 : 12}px;display:flex;align-items:center}
.ch h3{font-size:14px;line-height:20px;font-weight:600;white-space:nowrap}
.cr{margin-left:auto;display:flex;align-items:center;gap:16px;font-size:12px;line-height:20px;font-weight:500;color:${C.ink2};white-space:nowrap}
.muted{color:${C.muted}}
.li{display:flex;align-items:center;gap:6px}
.dot{width:8px;height:8px;border-radius:50%}
.key{width:12px;height:2px;border-radius:1px}
.body{position:relative;flex:1;min-height:0}
.kpi{position:relative;background:${C.card};border:1px solid ${C.line};border-radius:12px;padding:${o.tilePad ? '15px 15px 15px 27px' : '15px'}}
.kl{font-size:13px;line-height:18px;font-weight:500;color:${C.ink2}}
.chip{position:absolute;top:11px;right:15px;width:28px;height:28px;border-radius:7px;display:flex;align-items:center;justify-content:center}
.kv{margin-top:${o.jitter ? 9 : 8}px;display:flex;align-items:center}
.kv b{font-size:26px;line-height:32px;font-weight:600;letter-spacing:-.3px}
.delta{margin-left:10px;height:20px;padding:0 7px;border-radius:10px;font-size:12px;line-height:20px;font-weight:600}
.spark{position:absolute;left:15px;right:15px;top:${o.jitter ? 82 : 81}px;height:18px}
.spark svg,.plot svg,.map svg{display:block;width:100%;height:100%}
.mapbody{display:flex;gap:16px}
.map{position:relative;flex:1;min-width:0}
.map svg{position:absolute;inset:0}
.origins{flex:none;width:${o.wideOrigins ? 240 : 200}px}
.ot{font-size:11px;line-height:16px;font-weight:600;letter-spacing:.6px;color:${C.muted}}
.orow{margin-top:6px;height:27px}
.orow+.orow{margin-top:6px}
.ol{display:flex;justify-content:space-between;font-size:13px;line-height:18px;font-weight:500;color:${C.ink2}}
.ol .mono{font-size:12px;color:${C.ink}}
.track{margin-top:5px;height:4px;border-radius:2px;background:${C.line2};overflow:hidden}
.track i{display:block;height:100%;border-radius:2px}
.sevbody{display:flex;align-items:center}
.donut{position:relative;flex:none;width:${o.smallDonut ? 120 : 150}px;height:${o.smallDonut ? 120 : 150}px}
.donut svg{display:block;width:100%;height:100%}
.dc{position:absolute;left:0;right:0;top:50%;margin-top:-20px;text-align:center}
.dc b{display:block;font-size:22px;line-height:28px;font-weight:600}
.dc span{display:block;margin-top:-2px;font-size:11px;line-height:14px;font-weight:500;color:${C.muted}}
.legend{margin-left:28px;flex:1;min-width:0}
.lrow{height:30px;display:flex;align-items:flex-start}
.sq{margin-top:6px;width:10px;height:10px;border-radius:3px;flex:none}
.lname{margin-left:${o.jitter ? 11 : 10}px;font-size:13px;line-height:22px;font-weight:500;color:${C.ink2}}
.lval{margin-left:auto;font-size:13px;line-height:22px;font-weight:600}
.ylab{position:absolute;left:0;width:34px;text-align:right;font-size:11px;line-height:16px;color:${C.muted}}
.grid{position:absolute;left:44px;right:0;height:1px;background:${C.line}}
.plot{position:absolute;left:44px;right:0;top:6px;bottom:22px}
.xlab{position:absolute;bottom:0;transform:translateX(-50%);font-size:11px;line-height:16px;color:${C.muted}}
.vrows{display:flex;flex-direction:column;gap:7px}
.vl{display:flex;justify-content:space-between;font-size:13px;line-height:16px;font-weight:500;color:${C.ink2}}
.vl .mono{font-size:12px;color:${C.ink}}
.vt{margin-top:4px;height:5px;border-radius:3px;background:${C.line2};overflow:hidden}
.vt i{display:block;height:100%;border-radius:3px}
.view{display:flex;align-items:center;gap:2px;color:${C.accent};font-size:13px;line-height:20px;font-weight:500}
.table{overflow:hidden}
.tr2{display:grid;grid-template-columns:${o.swapCols ? '104px 2.2fr 1.2fr 1fr 128px 110px 72px' : '104px 2.2fr 1.2fr 1fr 110px 128px 72px'};column-gap:16px;align-items:center}
.thead{height:28px;align-items:start;padding-top:4px;font-size:11px;line-height:16px;font-weight:600;letter-spacing:.5px;color:${C.muted}}
.trow{height:31px;border-top:1px solid ${C.line};padding-top:${o.jitter ? 6 : 5}px;align-items:start;font-size:13px;line-height:20px}
.cell{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.right{text-align:right}
.pill{display:inline-flex;align-items:center;height:20px;padding:0 9px 0 8px;border-radius:10px;font-size:11.5px;line-height:20px;font-weight:600}
.pill i{width:6px;height:6px;border-radius:50%;margin-right:5px}
.tech{display:inline-block;margin-top:1px;height:18px;padding:0 6px;border-radius:4px;background:#1A2740;font-size:11px;line-height:18px;font-weight:500;color:${C.ink2}}
.st{display:flex;align-items:center;gap:7px;color:${C.ink2};font-size:12.5px}
.st i{width:7px;height:7px;border-radius:50%;flex:none}
`;

function sparkSvg(k, i) {
  const VB = { x: 0, y: 0, w: 240, h: 18 };
  const lo = Math.min(...k.spark), hi = Math.max(...k.spark);
  const pts = points(k.spark, VB, lo - (hi - lo) * 0.1, hi + (hi - lo) * 0.1);
  const line = smoothPath(pts);
  const area = line + `L240 18L0 18Z`;
  return raw(`<svg viewBox="0 0 240 18" preserveAspectRatio="none"><defs><linearGradient id="sg${i}" x1="0" y1="0" x2="0" y2="18" gradientUnits="userSpaceOnUse"><stop stop-color="${k.tint}" stop-opacity="0.28"/><stop offset="1" stop-color="${k.tint}" stop-opacity="0"/></linearGradient></defs>` +
    `<path d="${area}" fill="url(#sg${i})"/><path d="${line}" fill="none" stroke="${k.tint}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`);
}

function mapSvg() {
  let s = `<svg viewBox="0 0 ${MAP_VB.w} ${MAP_VB.h}" preserveAspectRatio="xMidYMid meet">`;
  for (const [x, y] of mapDots()) s += `<circle cx="${x}" cy="${y}" r="3.4" fill="${C.map}"/>`;
  for (const a of ATTACKS) {
    const col = SEV_COLOR[a.sev], from = geo(...a.from), to = geo(...a.to);
    s += `<path d="${arcBetween(from, to).d}" fill="none" stroke="${col}" stroke-opacity="0.9" stroke-width="1.5" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`;
    s += `<circle cx="${num(from[0])}" cy="${num(from[1])}" r="8" fill="${col}"/>`;
    s += `<circle cx="${num(to[0])}" cy="${num(to[1])}" r="26" fill="none" stroke="${col}" stroke-opacity="0.55" stroke-width="1" vector-effect="non-scaling-stroke"/><circle cx="${num(to[0])}" cy="${num(to[1])}" r="10" fill="${col}"/>`;
  }
  return raw(s + '</svg>');
}

function donutSvg() {
  const total = SEVERITY.reduce((s, x) => s + x.n, 0);
  let a = 0, s = '<svg viewBox="0 0 150 150">';
  for (const v of SEVERITY) {
    const span = (v.n / total) * Math.PI * 2;
    s += `<path d="${arcPath(75, 75, 59, 75, a + 0.0175, a + span - 0.0175)}" fill="${v.color}"/>`;
    a += span;
  }
  return raw(s + '</svg>');
}

function eventsSvg() {
  const VB = { x: 0, y: 0, w: 460, h: 100 };
  let acc = new Array(24).fill(0);
  const layers = EVENTS.series.map(s => { const top = s.v.map((v, i) => acc[i] + v); const r = { s, lo: acc, hi: top }; acc = top; return r; });
  let out = '<svg viewBox="0 0 460 100" preserveAspectRatio="none">';
  for (let k = layers.length - 1; k >= 0; k--) {
    const { s, lo, hi } = layers[k];
    const pt = points(hi, VB, 0, 600), pb = points(lo, VB, 0, 600);
    const area = smoothPath(pt) + 'L' + pb.slice().reverse().map(p => `${num(p[0])} ${num(p[1])}`).join('L') + 'Z';
    out += `<path d="${area}" fill="${s.color}" fill-opacity="0.16"/><path d="${smoothPath(pt)}" fill="none" stroke="${s.color}" stroke-width="1.5" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
  }
  return raw(out + '</svg>');
}

export default function socBuild(o = {}) {
  const total = SEVERITY.reduce((s, x) => s + x.n, 0);
  const cols = o.swapCols ? [0, 1, 2, 3, 5, 4, 6] : [0, 1, 2, 3, 4, 5, 6];
  const heads = ['Severity', 'Alert', 'Source', 'Asset', 'Technique', 'Status', 'Time'];
  const cell = (a, k) => {
    switch (k) {
      case 0: return <span className="pill" style={{ background: hexA(SEV_COLOR[a.sev], 0.15), color: SEV_COLOR[a.sev] }}><i style={{ background: SEV_COLOR[a.sev] }} />{a.sev}</span>;
      case 1: return <span style={{ fontWeight: 500 }}>{a.title}</span>;
      case 2: return <span className="mono" style={{ fontSize: '12px', color: C.ink2 }}>{a.src}</span>;
      case 3: return <span style={{ fontSize: '12.5px', color: C.ink2 }}>{a.asset}</span>;
      case 4: return <span className="tech mono">{a.mitre}</span>;
      case 5: return <span className="st"><i style={{ background: STATUS_COLOR[a.status] }} />{a.status}</span>;
      default: return <span style={{ fontSize: '12px', color: C.muted }}>{a.time}</span>;
    }
  };
  const body = (
    <body>
      <div className="app">
        <aside className="side">
          <div className="brand"><span className="logo">{I('shield', 16, '#FFFFFF', 2)}</span><span className="word">{BRAND}</span><span className="tag">SOC</span></div>
          <nav className="nav">
            {NAV.map(g => (
              <div className="group">
                <div className="glabel">{g.group}</div>
                <div className="items">
                  {g.items.map(([icon, label, active, badge]) => (
                    <a className={'item' + (active ? ' on' : '')}>{I(icon, 18, active ? C.accent : C.ink2)}{label}{badge ? <span className="badge">{badge}</span> : null}</a>
                  ))}
                </div>
              </div>
            ))}
          </nav>
          <div className="user"><span className="av">{USER.initials}</span><span className="who"><b>{USER.name}</b><span>{USER.role}</span></span><span className="out">{I('logout', 18, C.muted)}</span></div>
        </aside>
        <div className="main">
          <header className="top">
            <h1>Security overview</h1>
            <label className="search" data-bug={o.pillSearch ? 'Search field is pill-shaped, spec has 8px corners' : null}>{I('search', 16, C.muted)}Search IPs, hosts, users, hashes<span className="kbd mono">/</span></label>
            <div className="tr">
              <button className="range" style={{ color: C.ink }}>{I('calendar', 16, C.ink2)}Last 24 hours{I('chevronDown', 14, C.ink2)}</button>
              <span className="live"><i />Live</span>
              <span className="bell">{I('bell', 18, C.ink2)}</span>
              <span className="av">{USER.initials}</span>
            </div>
          </header>
          <main className="content">
            <section className="kpis">
              {KPIS.map((k, i) => {
                const good = o.wrongDelta && i === 1 ? true : k.good;
                return (
                  <div className="kpi" data-bug={o.tilePad ? 'KPI tiles have 28px left padding, spec is 16px' : null}>
                    <div className="kl">{k.label}</div>
                    <span className="chip" style={{ background: hexA(k.tint, 0.14) }}>{I(k.icon, 16, k.tint)}</span>
                    <div className="kv"><b>{k.value}</b><span className="delta" data-bug={o.wrongDelta && i === 1 ? 'Incident delta styled as good news (green), spec is red' : null} style={{ background: hexA(good ? '#34D399' : '#F87171', 0.14), color: good ? '#6EE7B7' : '#FCA5A5' }}>{k.delta}</span></div>
                    <div className="spark">{sparkSvg(k, i)}</div>
                  </div>
                );
              })}
            </section>
            <section className="row">
              <div className="card">
                <div className="ch"><h3>Live threat map</h3><div className="cr">{[['Critical', '#F43F5E'], ['High', '#FB923C'], ['Medium', '#FACC15']].map(([n, c]) => <span className="li"><i className="dot" style={{ background: c }} />{n}</span>)}</div></div>
                <div className="body mapbody">
                  <div className="map">{mapSvg()}</div>
                  <div className="origins" data-bug={o.wideOrigins ? 'Top origins column 240px wide, spec is 200px' : null}>
                    <div className="ot">TOP ORIGINS</div>
                    {ORIGINS.map(([name, n, col]) => (
                      <div className="orow"><div className="ol"><span>{name}</span><span className="mono">{n.toLocaleString('en-US')}</span></div><div className="track"><i style={{ width: `${(n / ORIGINS[0][1]) * 100}%`, background: col }} /></div></div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="ch"><h3>Alerts by severity</h3><div className="cr muted">Last 24 hours</div></div>
                <div className="body sevbody">
                  <div className="donut" data-bug={o.smallDonut ? 'Donut 120px, spec is 150px' : null}>{donutSvg()}<div className="dc"><b>{String(total)}</b><span>alerts</span></div></div>
                  <div className="legend">
                    {SEVERITY.map(s => <div className="lrow"><i className="sq" style={{ background: s.color }} /><span className="lname">{s.name}</span><span className="lval mono">{String(s.n)}</span></div>)}
                  </div>
                </div>
              </div>
            </section>
            <section className="row">
              <div className="card">
                <div className="ch"><h3>Events over time</h3><div className="cr">{EVENTS.series.map(s => <span className="li"><i className="key" style={{ background: s.color }} />{s.name}</span>)}</div></div>
                <div className="body">
                  {['600', '400', '200', '0'].map((t, i) => <><div className="grid" style={{ top: `calc(6px + (100% - 28px) * ${num(i / 3)})` }} /><div className="ylab mono" style={{ top: `calc(6px + (100% - 28px) * ${num(i / 3)} - 8px)` }}>{t}</div></>)}
                  <div className="plot">{eventsSvg()}</div>
                  {[0, 4, 8, 12, 16, 20].map(hr => <div className="xlab mono" style={{ left: `calc(44px + (100% - 44px) * ${num(hr / 23)})` }}>{`${String(hr).padStart(2, '0')}:00`}</div>)}
                </div>
              </div>
              <div className="card">
                <div className="ch"><h3>Top attack vectors</h3><div className="cr muted">Share of alerts</div></div>
                <div className="body vrows">
                  {VECTORS.map(([name, pct], i) => <div><div className="vl"><span>{name}</span><span className="mono">{`${pct}%`}</span></div><div className="vt"><i style={{ width: `${(pct / 40) * 100}%`, background: i === 0 ? '#22D3EE' : '#3E7C95' }} /></div></div>)}
                </div>
              </div>
            </section>
            <section className="card">
              <div className="ch"><h3>Recent alerts</h3><a className="view" style={{ marginLeft: 'auto' }}>View all{I('chevronRight', 16, C.accent)}</a></div>
              <div className="body table">
                <div className="tr2 thead">{cols.map(k => <span className={'cell' + (k === 6 ? ' right' : '')} data-bug={o.swapCols && (k === 4 || k === 5) ? `"${heads[k]}" column in the wrong position` : null}>{heads[k].toUpperCase()}</span>)}</div>
                {ALERTS.map(a => <div className="tr2 trow">{cols.map(k => <span className={'cell' + (k === 6 ? ' right' : '')} data-bug={o.swapCols && (k === 4 || k === 5) ? `"${heads[k]}" column in the wrong position` : null}>{cell(a, k)}</span>)}</div>)}
              </div>
            </section>
          </main>
        </div>
      </div>
    </body>
  );
  return page(`<title>Security overview — ${BRAND}</title>\n<style>${css(o)}</style>`, String(body));
}
