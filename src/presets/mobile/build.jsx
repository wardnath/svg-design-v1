/** @jsx hh */
/** @jsxFrag Frag */
/* The phone screen as built: a full-width column with 20px padding, a four-column actions
   grid, and an absolutely positioned tab bar at the bottom. Options plant bugs or freeze
   the layout at 390px. */
import { hh, Frag, raw, page } from '../../design-kit/html.js';
import { iconHtml, num } from '../../design-kit/index.js';
import { USER, STATUS, ACTIONS, ALERTS, TABS, C } from './data.js';

const UI = `Roboto, 'Liberation Sans', Arial, sans-serif`;
const I = (name, size, color, sw) => raw(iconHtml(name, size, color, sw));

const css = o => `
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%}
body{background:${C.page};color:${C.ink};font-family:${UI};overflow:hidden}
.screen{position:relative;height:100vh;${o.fixedWidth ? 'width:390px' : ''}}
.sb{height:47px;display:flex;align-items:flex-start;padding:14px 24px 0 30px}
.sb b{font-size:15px;line-height:20px;font-weight:600}
.sb .ic{margin-left:auto;display:flex;align-items:center;gap:6px;margin-top:2px}
.bars{display:flex;align-items:flex-end;gap:2px;height:12px}
.bars i{width:3px;border-radius:1px;background:${C.ink}}
.bat{position:relative;width:22px;height:11px;border:1px solid rgba(15,23,42,.4);border-radius:3px}
.bat i{position:absolute;left:1px;top:1px;width:16px;height:7px;border-radius:1.5px;background:${C.ink}}
.wrap{padding:8px 20px 0}
.hi{height:44px;display:flex;align-items:center}
.me{width:40px;height:40px;border-radius:50%;background:#C7D2FE;color:#3730A3;font-size:13px;line-height:18px;font-weight:700;display:flex;align-items:center;justify-content:center;flex:none}
.greet{margin-left:12px}
.greet span{display:block;font-size:13px;line-height:18px;color:${C.muted}}
.greet b{display:block;font-size:20px;line-height:24px;font-weight:600}
.bell{position:relative;margin-left:${o.bellLeft ? '16px' : 'auto'};width:40px;height:40px;border-radius:50%;background:#FFFFFF;border:1px solid ${C.line};display:flex;align-items:center;justify-content:center}
.bell::after{content:"";position:absolute;right:6px;top:4px;width:8px;height:8px;border-radius:50%;background:#EF4444;box-shadow:0 0 0 1.5px #FFFFFF}
.status{position:relative;margin-top:16px;height:168px;border-radius:${o.cardRadius ? 8 : 24}px;background:linear-gradient(135deg,#4F46E5,#7C3AED);padding:20px;color:#FFFFFF}
.st{width:44px;height:44px;border-radius:14px;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center}
.ring{position:absolute;right:17px;top:17px;width:62px;height:62px}
.ring b{position:absolute;left:0;right:0;top:21px;text-align:center;font-size:15px;line-height:20px;font-weight:700}
.status h2{margin-top:20px;font-size:20px;line-height:26px;font-weight:600;white-space:nowrap}
.status p{margin-top:2px;font-size:13px;line-height:18px;color:#E0E7FF;white-space:nowrap}
.prog{margin-top:14px;height:6px;border-radius:3px;background:rgba(255,255,255,.25)}
.prog i{display:block;width:92%;height:100%;border-radius:3px;background:#FFFFFF}
.sec{margin-top:24px;height:20px;display:flex;align-items:baseline}
.sec b{font-size:15px;line-height:20px;font-weight:600}
.sec a{margin-left:auto;font-size:13px;line-height:18px;font-weight:500;color:${C.accent}}
.acts{margin-top:8px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.act{height:${o.tallTiles ? 100 : 88}px;border-radius:16px;background:#FFFFFF;border:1px solid ${C.line};padding-top:13px;text-align:center}
.ai{width:40px;height:40px;margin:0 auto;border-radius:12px;display:flex;align-items:center;justify-content:center}
.act .lbl{display:block;margin-top:8px;font-size:12.5px;line-height:16px;font-weight:500;color:${C.ink2}}
.list{margin-top:8px;border-radius:18px;background:#FFFFFF;border:1px solid ${C.line}}
.row{position:relative;height:64px;display:flex;align-items:flex-start;padding:13px 15px 0}
.row+.row::before{content:"";position:absolute;left:63px;right:-1px;top:-1px;height:1px;background:${C.line}}
.row+.row{margin-top:0}
.ri{width:36px;height:36px;border-radius:11px;display:flex;align-items:center;justify-content:center;flex:none;margin-top:0}
.rt{margin-left:12px;min-width:0}
.rt b{display:block;margin-top:-2px;font-size:14px;line-height:20px;font-weight:600;white-space:nowrap}
.rt span{display:block;margin-top:1px;font-size:12.5px;line-height:18px;color:${C.muted};white-space:nowrap}
.time{margin-left:auto;margin-top:9px;font-size:12px;line-height:18px;color:${C.muted}}
.row .chev{margin:11px 0 0 6px;display:flex}
.tabbar{position:absolute;left:0;right:0;bottom:0;height:84px;background:#FFFFFF;box-shadow:inset 0 1px 0 ${C.line};display:grid;grid-template-columns:repeat(4,minmax(0,1fr))}
.tab{padding-top:10px;text-align:center;font-size:11px;line-height:14px;font-weight:500;color:${C.muted}}
.tab svg{display:block;margin:0 auto 4px}
.tab.on{color:${C.accent};font-weight:600}
.home{position:absolute;left:50%;bottom:8px;width:134px;height:5px;margin-left:-67px;border-radius:2.5px;background:${C.ink}}
`;

export default function mobileBuild(o = {}) {
  const ringSvg = () => { const a = Math.PI * 2 * 0.92, x = 31 + 24 * Math.sin(a), y = 31 - 24 * Math.cos(a); return raw(`<svg viewBox="0 0 62 62" width="62" height="62"><circle cx="31" cy="31" r="24" fill="none" stroke="#FFFFFF" stroke-opacity="0.25" stroke-width="6"/><path d="M31 7A24 24 0 1 1 ${num(x)} ${num(y)}" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round"/></svg>`); };
  const body = (
    <body>
      <div className="screen">
        <div className="sb"><b>9:41</b><span className="ic"><span className="bars">{[3, 6, 9, 12].map(hgt => <i style={{ height: `${hgt}px` }} />)}</span>{I('wifi', 16, C.ink, 2.2)}<span className="bat"><i /></span></span></div>
        <div className="wrap">
          <div className="hi"><span className="me">{USER.initials}</span><span className="greet"><span>Good morning,</span><b>{USER.name}</b></span><span className="bell" data-bug={o.bellLeft ? 'Bell sits after the greeting, spec pins it to the right' : null}>{I('bell', 20, C.ink)}</span></div>
          <section className="status" data-bug={o.cardRadius ? 'Status card corners 8px, spec is 24px' : null}>
            <span className="st">{I('shieldCheck', 22, '#FFFFFF', 2)}</span>
            <span className="ring">{ringSvg()}<b>{String(STATUS.score)}</b></span>
            <h2>{STATUS.title}</h2>
            <p>{STATUS.sub}</p>
            <div className="prog"><i /></div>
          </section>
          <div className="sec"><b>Quick actions</b><a>Edit</a></div>
          <div className="acts" data-bug={o.tallTiles ? 'Quick action tiles 100px tall, spec is 88px' : null}>
            {ACTIONS.map(([icon, label, tint, bg], i) => {
              const wrong = o.wrongIcon && i === 1;
              return <div className="act"><span className="ai" style={{ background: bg }} data-bug={wrong ? 'Passwords tile shows a lock icon, spec is a key' : null}>{I(wrong ? 'lock' : icon, 20, tint, 2)}</span><span className="lbl">{label}</span></div>;
            })}
          </div>
          <div className="sec"><b>Recent alerts</b><a>See all</a></div>
          <div className="list">
            {ALERTS.map((a, i) => {
              const amber = o.alertAmber && i === 0;
              return (
                <div className="row">
                  <span className="ri" style={{ background: amber ? '#FEF3C7' : a.bg }} data-bug={amber ? 'Breach alert icon amber, spec is red' : null}>{I(a.icon, 18, amber ? '#D97706' : a.tint, 2)}</span>
                  <span className="rt"><b>{a.title}</b><span>{a.sub}</span></span>
                  <span className="time">{a.time}</span>
                  {o.noChevrons ? null : <span className="chev">{I('chevronRight', 14, C.muted, 2)}</span>}
                </div>
              );
            })}
          </div>
        </div>
        <nav className="tabbar">
          {TABS.map(([icon, label, on], i) => {
            const active = o.tabWrong ? i === 2 : !!on;
            return <a className={'tab' + (active ? ' on' : '')} data-bug={o.tabWrong && (i === 0 || i === 2) ? 'Alerts tab highlighted on the Home screen' : null}>{I(icon, 22, active ? C.accent : C.muted, 2)}{label}</a>;
          })}
          <span className="home" />
        </nav>
      </div>
    </body>
  );
  return page(`<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>Home</title>\n<style>${css(o)}</style>`, String(body));
}
