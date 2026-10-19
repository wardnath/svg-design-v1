/** @jsx hh */
/** @jsxFrag Frag */
/* The docs page as built: a header with an absolutely centered search, a three-column
   grid (sidebar, article column, table of contents) whose TOC drops out below 1280px,
   and an article capped at a 720px measure. Options plant bugs or remove the breakpoint. */
import { hh, Frag, raw, page } from '../../design-kit/html.js';
import { iconHtml } from '../../design-kit/index.js';
import { BRAND, TOPLINKS, SIDEBAR, TOC, CRUMBS, LEAD, P1, P2, CALLOUT, TABS, CODE, PARAMS, C } from './data.js';

const UI = `Carlito, Calibri, 'Segoe UI', sans-serif`;
const MONO = `'SF Mono', Menlo, Consolas, 'DejaVu Sans Mono', monospace`;
const I = (name, size, color, sw) => raw(iconHtml(name, size, color, sw));

const css = o => `
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%}
body{background:#FFFFFF;color:${C.ink};font-family:${UI};overflow:hidden}
a{color:inherit;text-decoration:none}
.mono{font-family:${MONO}}
.app{display:grid;grid-template-rows:64px minmax(0,1fr);height:100vh}
header{position:relative;display:flex;align-items:center;padding:0 24px;box-shadow:inset 0 -1px 0 ${C.line}}
.logo{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#4F46E5,#14B8A6);display:flex;align-items:center;justify-content:center;flex:none}
.brand{margin-left:10px;font-size:17px;line-height:28px;font-weight:700;white-space:nowrap}
.brand span{margin-left:8px;font-weight:400;color:${C.muted}}
.ver{margin-left:16px;height:26px;border:1px solid ${C.line};border-radius:13px;display:flex;align-items:center;gap:4px;padding:0 7px 0 9px;font-size:12.5px;line-height:20px;font-weight:600;color:${C.ink2}}
.search{position:absolute;left:50%;top:12px;width:420px;margin-left:-210px;height:40px;border:1px solid ${C.line};border-radius:10px;background:#F9FAFB;display:flex;align-items:center;gap:9px;padding:0 11px 0 12px;font-size:14px;line-height:20px;color:${C.muted}}
.kbd{margin-left:auto;width:24px;height:20px;border:1px solid ${C.line};border-radius:5px;background:#FFFFFF;font-size:11.5px;line-height:18px;font-weight:600;text-align:center}
.links{margin-left:auto;display:flex;gap:24px;font-size:14px;line-height:20px;font-weight:500;color:${C.ink2}}
.gh{margin-left:24px;display:flex}
.body{display:grid;grid-template-columns:${o.wideSidebar ? 300 : 272}px minmax(0,1fr) 240px;min-height:0}
${o.alwaysToc ? '' : '@media (max-width:1279px){.body{grid-template-columns:' + (o.wideSidebar ? 300 : 272) + 'px minmax(0,1fr)}.toc{display:none}}'}
.side{background:${C.side};box-shadow:inset -1px 0 0 ${C.line};padding:24px 12px 0}
.gl{padding-left:12px;font-size:11.5px;line-height:16px;font-weight:600;letter-spacing:.6px;text-transform:uppercase;color:${C.muted}}
.items{margin-top:8px;display:flex;flex-direction:column;gap:2px}
.it{height:32px;border-radius:8px;padding:6px 12px 0;font-size:14px;line-height:20px;color:${C.ink2};white-space:nowrap}
.it.on{background:${C.accentSoft};color:${C.accent};font-weight:600}
.group+.group{margin-top:22px}
.col{padding:40px 56px 0;min-width:0}
article{max-width:720px;margin:0 auto}
.crumbs{font-size:13px;line-height:20px;color:${C.muted};white-space:nowrap}
.crumbs i{font-style:normal;margin:0 8px}
.crumbs b{font-weight:500;color:${C.ink2}}
h1{margin-top:12px;font-size:${o.h1Small ? 28 : 36}px;line-height:${o.h1Small ? 36 : 44}px;font-weight:600;letter-spacing:-.6px}
.lead{margin-top:12px;font-size:17px;line-height:28px;color:${C.ink2}}
h2{margin-top:36px;font-size:22px;line-height:30px;font-weight:600;letter-spacing:-.3px}
h2.first{margin-top:${o.h2Gap ? 52 : 36}px}
.p{margin-top:10px;font-size:15.5px;line-height:26px;color:${C.ink2}}
.code{margin-top:18px;border-radius:10px;overflow:hidden;background:${o.codeLight ? '#F8FAFC' : C.code}${o.codeLight ? ';box-shadow:inset 0 0 0 1px ' + C.line : ''}}
.tabs{height:38px;background:${o.codeLight ? '#EEF2F7' : C.codeBar};display:flex;padding:0 16px;gap:20px;font-size:13px;line-height:20px;font-weight:500;color:#94A3B8}
.tabs span{padding-top:9px}
.tabs .on{color:${o.codeLight ? C.ink : '#F8FAFC'};box-shadow:inset 0 -2px 0 #818CF8}
.copy{margin-left:auto;padding-top:9px;display:flex;align-items:flex-start;gap:6px;font-family:${UI};font-size:12px;font-weight:600}
.copy svg{margin-top:3px}
pre{padding:16px 20px;font-size:13px;line-height:22px;white-space:pre}
.call{margin-top:20px;height:52px;border-radius:8px;background:${C.infoSoft};border-left:3px solid ${C.info};display:flex;align-items:center;gap:12px;padding:0 16px 0 15px;font-size:14.5px;line-height:24px;font-weight:500;color:#1E3A8A;white-space:nowrap}
.tbl{margin-top:18px;border:1px solid ${C.line};border-radius:10px;overflow:hidden}
.row{display:grid;grid-template-columns:150px minmax(0,1fr) 96px}
.row>*{padding-left:14px}
.th{height:40px;background:#F9FAFB;padding-top:11px;font-size:11.5px;line-height:16px;font-weight:600;letter-spacing:.5px;color:${C.muted}}
.tr{height:44px;border-top:1px solid ${C.line};padding-top:10px;font-size:14px;line-height:22px;color:${C.ink2}}
.flag{display:inline-block;height:22px;padding:0 6px;border-radius:5px;background:#F1F5F9;font-size:12.5px;line-height:22px;font-weight:500;color:${C.ink}}
.def{font-size:12.5px}
.toc{box-shadow:inset 1px 0 0 ${C.line};padding:40px 24px 0}
.toc p{font-size:11.5px;line-height:16px;font-weight:600;letter-spacing:.6px;color:${C.muted}}
.toc ul{margin-top:14px;list-style:none;display:flex;flex-direction:column;gap:10px}
.toc li{position:relative;font-size:13.5px;line-height:20px;color:${C.ink2};white-space:nowrap}
.toc li.on{color:${C.accent};font-weight:600}
.toc li.on::before{content:"";position:absolute;left:-12px;top:0;width:2px;height:20px;border-radius:1px;background:${C.accent}}
`;

export default function docsBuild(o = {}) {
  const active = o.wrongActive ? 'Installation' : 'Quickstart';
  const body = (
    <body>
      <div className="app">
        <header>
          <span className="logo">{I('layers', 16, '#FFFFFF', 2)}</span>
          <span className="brand">{BRAND}<span>Docs</span></span>
          <span className="ver">v4.2{I('chevronDown', 12, C.ink2, 2)}</span>
          <label className="search">{I('search', 16, C.muted)}Search docs<span className="kbd mono">/</span></label>
          <nav className="links">{TOPLINKS.map(t => <a>{t}</a>)}</nav>
          <a className="gh">{I('github', 20, C.ink)}</a>
        </header>
        <div className="body">
          <aside className="side" data-bug={o.wideSidebar ? 'Sidebar 300px wide, spec is 272px' : null}>
            {SIDEBAR.map(g => (
              <div className="group">
                <div className="gl">{g.group}</div>
                <div className="items">{g.items.map(it => { const t = Array.isArray(it) ? it[0] : it; return <a className={'it' + (t === active ? ' on' : '')} data-bug={o.wrongActive && (t === 'Installation' || t === 'Quickstart') ? 'Sidebar highlights Installation while on Quickstart' : null}>{t}</a>; })}</div>
              </div>
            ))}
          </aside>
          <main className="col">
            <article>
              <div className="crumbs">{CRUMBS[0]}<i>/</i><b>{CRUMBS[1]}</b></div>
              <h1 data-bug={o.h1Small ? 'Page title set at 28px, spec is 36px' : null}>Quickstart</h1>
              <p className="lead">{LEAD}</p>
              <h2 className="first" data-bug={o.h2Gap ? 'Section heading 52px below the lead, spec is 36px' : null}>Install the CLI</h2>
              <p className="p">{P1}</p>
              <div className="code" data-bug={o.codeLight ? 'Code block in the light theme, spec is dark' : null}>
                <div className="tabs mono">{TABS.map((t, i) => <span className={i === 0 ? 'on' : null}>{t}</span>)}<span className="copy">{I('file', 14, '#94A3B8')}Copy</span></div>
                <pre className="mono">{CODE.map((line, i) => <>{i ? '\n' : ''}{line.map(([t, col]) => <span style={{ color: o.codeLight ? (col === '#E2E8F0' ? C.ink : col === '#FBBF24' ? '#B45309' : col === '#7DD3FC' ? '#0369A1' : col === '#C4B5FD' ? '#6D28D9' : '#64748B') : col }}>{t}</span>)}</>)}</pre>
              </div>
              {o.noCallout ? null : <div className="call">{I('alert', 20, C.info)}{CALLOUT}</div>}
              <h2>Run your first scan</h2>
              <p className="p">{P2}</p>
              <div className="tbl">
                <div className="row th">{['FLAG', 'DESCRIPTION', 'DEFAULT'].map(t => <span>{t}</span>)}</div>
                {PARAMS.map(([f, d, def]) => <div className="row tr"><span><code className="flag mono">{f}</code></span><span>{d}</span><span className="def mono">{def}</span></div>)}
              </div>
            </article>
          </main>
          <aside className="toc">
            <p>ON THIS PAGE</p>
            <ul>{TOC.map(([t, on]) => <li className={on ? 'on' : null}>{t}</li>)}</ul>
          </aside>
        </div>
      </div>
    </body>
  );
  return page(`<title>Quickstart — ${BRAND} Docs</title>\n<style>${css(o)}</style>`, String(body));
}
