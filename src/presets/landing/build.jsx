/** @jsx hh */
/** @jsxFrag Frag */
/* The Sentinel marketing page as built: a max-width container with gutters, a two-column
   hero grid, a space-between logo row, a three-card feature grid and full-bleed bands.
   Nothing depends on the viewport height. Options plant bugs or pin the container to
   the left at a fixed width. */
import { hh, Frag, raw, page } from '../../design-kit/html.js';
import { iconHtml } from '../../design-kit/index.js';
import { mockMarkup } from './mock.js';
import { BRAND, LINKS, EYEBROW, H1, LEAD, TRUST, AVATARS, LOGOS, FEATURES, STATS, FOOT, C } from './data.js';

const UI = `'Trebuchet MS', 'DejaVu Sans', Verdana, sans-serif`;
const I = (name, size, color, sw) => raw(iconHtml(name, size, color, sw));

const css = o => `
*{box-sizing:border-box;margin:0;padding:0}
body{background:#FFFFFF;color:${C.ink};font-family:${UI};overflow:hidden}
a{color:inherit;text-decoration:none}
button{font:inherit;border:0;background:none;color:inherit}
.wrap{${o.fixedWidth ? 'width:1264px;margin:0 0 0 88px' : 'max-width:1264px;margin:0 auto'};padding:0 32px}
.nav{height:${o.tallNav ? 88 : 72}px;box-shadow:inset 0 -1px 0 ${C.line}}
.banner{height:40px;background:#312E81;color:#E0E7FF;display:flex;align-items:center;justify-content:center;gap:8px;font-size:13.5px;line-height:20px;font-weight:500;white-space:nowrap}
.banner b{color:#FFFFFF;font-weight:600}
.nav .wrap{height:100%;display:flex;align-items:center}
.logo{width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,#6366F1,#22D3EE);display:flex;align-items:center;justify-content:center;flex:none}
.word{margin-left:10px;font-size:20px;line-height:32px;font-weight:700;letter-spacing:-.3px}
.links{margin-left:48px;display:flex;gap:32px;font-size:14.5px;line-height:20px;font-weight:500;color:#334155;white-space:nowrap}
.sign{margin-left:auto;font-size:14.5px;line-height:20px;font-weight:500;white-space:nowrap}
.navcta{margin-left:24px;height:40px;padding:0 18px;border-radius:8px;background:${C.dark};color:#FFFFFF;font-size:14px;line-height:40px;font-weight:600;white-space:nowrap}
.hero{padding:72px 0 88px}
.hero .wrap{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);column-gap:64px;align-items:start}
.eyebrow{display:inline-flex;align-items:center;height:30px;border-radius:15px;background:#EEF2FF;padding:0 12px 0 4px;color:#4338CA;font-size:13px;line-height:20px;font-weight:500;white-space:nowrap}
.eyebrow b{height:22px;padding:0 8px;border-radius:11px;background:${C.accent};color:#FFFFFF;font-size:12px;line-height:22px;font-weight:600;margin-right:8px}
.eyebrow svg{margin-left:6px}
h1{margin-top:24px;font-size:52px;line-height:60px;font-weight:600;letter-spacing:-1.2px;white-space:nowrap}
.lead{margin-top:${o.heroGap ? 44 : 20}px;font-size:18px;line-height:28px;color:${C.ink2};white-space:nowrap}
.ctas{margin-top:36px;display:flex;gap:12px}
.btn{height:48px;border-radius:10px;display:inline-flex;align-items:center;font-size:15px;line-height:20px;font-weight:600;white-space:nowrap}
.btn.pri{background:${C.dark};color:#FFFFFF;padding:0 20px 0 22px;gap:8px${o.ctaPill ? ';border-radius:24px' : ''}}
.btn.sec{background:#FFFFFF;border:1px solid #CBD5E1;padding:0 21px}
.trust{margin-top:28px;height:32px;display:flex;align-items:center}
.av{width:32px;height:32px;border-radius:50%;box-shadow:0 0 0 1px #FFFFFF;color:#FFFFFF;font-size:11px;line-height:16px;font-weight:700;display:flex;align-items:center;justify-content:center;flex:none}
.av+.av{margin-left:-8px}
.trust .tt{margin-left:12px;font-size:14px;line-height:20px;font-weight:500;color:${C.ink2};white-space:nowrap}
.mock{margin-top:8px;border-radius:16px;overflow:hidden;box-shadow:0 24px 48px rgba(15,23,42,.16);line-height:0}
.mock svg{display:block;width:100%;height:auto}
.strip{border-top:1px solid ${C.line};padding:35px 0 64px}
.strip p{text-align:center;font-size:12.5px;line-height:18px;font-weight:600;letter-spacing:1.2px;color:${C.muted}}
.marks{margin-top:24px;height:32px;display:flex;${o.logosLeft ? 'gap:56px' : 'justify-content:space-between'};font-size:22px;line-height:32px;color:#94A3B8;white-space:nowrap}
.feat{padding-bottom:96px}
.feat h2{text-align:${o.h2Left ? 'left' : 'center'};font-size:36px;line-height:44px;font-weight:600;letter-spacing:-.6px}
.feat .sub{margin-top:12px;text-align:center;font-size:17px;line-height:28px;color:${C.ink2}}
.cards{margin-top:48px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}
.card{height:280px;border:1px solid ${C.line};border-radius:16px;padding:27px;display:flex;flex-direction:column}
.tile{flex:none;width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center}
.card h3{flex:none;margin-top:20px;font-size:18px;line-height:26px;font-weight:600}
.card p{flex:none;margin-top:8px;font-size:15px;line-height:24px;color:${C.ink2}}
.more{margin-top:auto;display:flex;align-items:center;gap:6px;font-size:14.5px;line-height:20px;font-weight:600;color:${C.accent}}
.stats{height:168px;background:${C.dark}}
.stats .wrap{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));column-gap:24px;padding-top:44px;text-align:center}
.stats b{display:block;font-size:40px;line-height:48px;font-weight:700;letter-spacing:-.8px;color:${o.statsIndigo ? '#A5B4FC' : '#FFFFFF'}}
.stats span{display:block;margin-top:8px;font-size:14.5px;line-height:20px;color:#94A3B8}
.closing{padding-top:88px}
.cta{height:248px;border-radius:24px;background:linear-gradient(90deg,#4F46E5,#7C3AED);padding-top:52px;text-align:center;color:#FFFFFF}
.cta h2{font-size:32px;line-height:40px;font-weight:600;letter-spacing:-.5px;white-space:nowrap}
.cta p{margin-top:12px;font-size:16.5px;line-height:26px;color:#E0E7FF;white-space:nowrap}
.cta .btn{margin-top:26px;height:46px;padding:0 24px;background:#FFFFFF;color:${C.accent}}
.foot{padding-top:72px;padding-bottom:64px}
.frow{border-top:1px solid ${C.line};padding-top:23px;display:flex;font-size:13.5px;line-height:20px}
.frow span{color:${C.muted}}
.flinks{margin-left:auto;display:flex;gap:28px;font-weight:500;color:${C.ink2}}
`;

export default function landingBuild(o = {}) {
  const body = (
    <body>
      {o.banner ? <div className="banner" data-bug="Announcement bar that is not in the design">{I('zap', 14, '#FDE68A', 2)}<b>Exposure graph is live.</b>Read the launch post{I('arrowRight', 14, '#E0E7FF', 2)}</div> : null}
      <header className="nav" data-bug={o.tallNav ? 'Nav bar 88px tall, spec is 72px' : null}>
        <div className="wrap">
          <span className="logo">{I('shield', 18, '#FFFFFF', 2)}</span><span className="word">{BRAND}</span>
          <nav className="links">{LINKS.map(t => <a>{t}</a>)}</nav>
          <a className="sign">Sign in</a>
          <a className="navcta">Start free trial</a>
        </div>
      </header>
      <section className="hero">
        <div className="wrap">
          <div>
            <a className="eyebrow"><b>{EYEBROW.tag}</b>{EYEBROW.text}{I('arrowRight', 14, '#4338CA', 2)}</a>
            <h1>{H1.map((l, i) => <>{i ? <br /> : null}{l}</>)}</h1>
            <p className="lead" data-bug={o.heroGap ? 'Lead paragraph 44px below the headline, spec is 20px' : null}>{LEAD.map((l, i) => <>{i ? <br /> : null}{l}</>)}</p>
            <div className="ctas">
              <a className="btn pri" data-bug={o.ctaPill ? 'Primary button fully rounded, spec has 10px corners' : o.longCta ? 'Button reads "Start your 14-day free trial", spec is "Start free trial"' : null}>{o.longCta ? 'Start your 14-day free trial' : 'Start free trial'}{I('arrowRight', 18, '#FFFFFF', 2)}</a>
              <a className="btn sec">Book a demo</a>
            </div>
            <div className="trust">{AVATARS.map(([c, ini]) => <span className="av" style={{ background: c }}>{ini}</span>)}<span className="tt">{TRUST}</span></div>
          </div>
          <div className="mock" role="img" aria-label="Product screenshot">{raw(`<svg viewBox="0 0 600 432">${mockMarkup('mockfill')}</svg>`)}</div>
        </div>
      </section>
      <section className="wrap">
        <div className="strip">
          <p>TRUSTED BY SECURITY TEAMS AT</p>
          <div className="marks" data-bug={o.logosLeft ? 'Logos packed to the left, spec spreads them across the row' : null}>{LOGOS.map(([t, w, ls]) => <span style={{ fontWeight: w, letterSpacing: ls ? `${ls}px` : null }}>{t}</span>)}</div>
        </div>
      </section>
      <section className="wrap feat">
        <h2 data-bug={o.h2Left ? 'Section heading left-aligned, spec is centered' : null}>Everything between discovery and fix</h2>
        <p className="sub">One platform from the first scan to the verified fix.</p>
        <div className="cards">
          {FEATURES.map((f, i) => (
            <article className="card">
              <span className="tile" style={{ background: f.bg }}>{I(f.icon, 22, f.tint, 2)}</span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
              {o.noLink3 && i === 2 ? null : <a className="more">Learn more{I('arrowRight', 16, C.accent, 2)}</a>}
            </article>
          ))}
        </div>
      </section>
      <section className="stats" data-bug={o.statsIndigo ? 'Stat values tinted indigo, spec is white' : null}>
        <div className="wrap">{STATS.map(([v, l]) => <div><b>{v}</b><span>{l}</span></div>)}</div>
      </section>
      <section className="wrap closing">
        <div className="cta">
          <h2>Find your exposure before someone else does</h2>
          <p>Start a free scan of your domains. Results in under an hour.</p>
          <a className="btn">Scan my domains</a>
        </div>
      </section>
      <footer className="wrap foot">
        <div className="frow"><span>© 2026 Sentinel Labs, Inc.</span><nav className="flinks">{FOOT.map(t => <a>{t}</a>)}</nav></div>
      </footer>
    </body>
  );
  return page(`<title>${BRAND} — attack surface management</title>\n<style>${css(o)}</style>`, String(body));
}
