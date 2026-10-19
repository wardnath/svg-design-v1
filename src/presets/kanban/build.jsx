/** @jsx hh */
/** @jsxFrag Frag */
/* The board as built: a header and a toolbar in flex rows, then a flex board whose four
   columns share the width (flex: 1) and stretch to the bottom. Options plant bugs or give
   the columns a fixed width. */
import { hh, Frag, raw, page } from '../../design-kit/html.js';
import { iconHtml } from '../../design-kit/index.js';
import { PROJECT, TABS, PEOPLE, FILTERS, COLUMNS, LABEL, PRI, C } from './data.js';

const UI = `Tahoma, Verdana, 'DejaVu Sans', sans-serif`;
const MONO = `'SF Mono', Menlo, Consolas, 'DejaVu Sans Mono', monospace`;
const I = (name, size, color, sw) => raw(iconHtml(name, size, color, sw));

const css = o => `
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%}
body{background:#FFFFFF;color:${C.ink};font-family:${UI};overflow:hidden}
button{font:inherit;color:inherit;background:none;border:0}
.mono{font-family:${MONO}}
.app{display:flex;flex-direction:column;height:100vh}
header{flex:none;height:60px;display:flex;align-items:center;padding:0 24px;box-shadow:inset 0 -1px 0 ${C.line}}
.pi{width:28px;height:28px;border-radius:7px;background:#DBEAFE;display:flex;align-items:center;justify-content:center;flex:none}
.pn{margin-left:10px;font-size:16px;line-height:24px;font-weight:600;white-space:nowrap}
.star{margin-left:8px;display:flex}
.tabs{margin-left:32px;align-self:stretch;display:flex;gap:24px;font-size:14px;line-height:20px;font-weight:500;color:${C.ink2}}
.tabs a{padding-top:20px;white-space:nowrap}
.tabs a.on{color:${C.ink};box-shadow:inset 0 -2px 0 ${C.accent}}
.people{margin-left:auto;display:flex}
.av{width:28px;height:28px;border-radius:50%;box-shadow:0 0 0 2px #FFFFFF;color:#FFFFFF;font-size:11px;line-height:14px;font-weight:700;display:flex;align-items:center;justify-content:center;flex:none}
.av+.av{margin-left:-8px}
.av.more{background:#E5E7EB;color:${C.ink2}}
.share{margin-left:16px;height:34px;padding:0 13px;border:1px solid ${C.line};border-radius:8px;font-size:13px;line-height:20px;font-weight:600}
.new{margin-left:10px;height:34px;padding:0 14px 0 12px;border-radius:8px;background:${C.accent};color:#FFFFFF;display:flex;align-items:center;gap:6px;font-size:13px;line-height:20px;font-weight:600;white-space:nowrap}
.tools{flex:none;height:52px;display:flex;align-items:center;padding:0 24px}
.search{width:240px;height:32px;border:1px solid ${C.line};border-radius:8px;display:flex;align-items:center;gap:8px;padding-left:9px;font-size:13px;line-height:20px;color:${C.muted}}
.filter{margin-left:8px;height:32px;border:1px solid ${C.line};border-radius:8px;display:flex;align-items:center;gap:6px;padding:0 9px 0 11px;font-size:13px;line-height:20px;font-weight:500;color:${C.ink2};white-space:nowrap}
.search+.filter{margin-left:12px}
.group{margin-left:${o.groupLeft ? '16px' : 'auto'};display:flex;align-items:center;gap:4px;font-size:13px;line-height:20px;color:${C.muted};white-space:nowrap}
.group b{margin-left:2px;font-weight:600;color:${C.ink}}
.board{flex:1;min-height:0;display:flex;gap:${o.colGap ? 28 : 16}px;padding:8px 24px 24px}
.col{${o.fixedCols ? 'flex:none;width:336px' : 'flex:1;min-width:0'};border-radius:12px;background:${C.col};padding:10px}
.ch{height:36px;display:flex;align-items:center;padding:0 6px 0 4px;margin-bottom:4px}
.ch i{width:8px;height:8px;border-radius:50%;flex:none}
.ch b{margin-left:6px;font-size:13.5px;line-height:20px;font-weight:600;white-space:nowrap}
.cnt{margin-left:8px;min-width:20px;height:20px;padding:0 7px;border-radius:10px;background:#E5E7EB;font-size:11.5px;line-height:20px;font-weight:600;color:${C.ink2};text-align:center}
.ch svg{margin-left:auto}
.cards{display:flex;flex-direction:column;gap:10px}
.card{height:134px;border:1px solid ${C.line};border-radius:10px;background:#FFFFFF;padding:13px 13px 0}
.card.p{height:150px}
.r1{height:16px;display:flex;align-items:center}
.id{font-size:11.5px;line-height:16px;font-weight:500;color:${C.muted}}
.done .id{color:#059669}
.r1 .ok{margin-right:4px;display:flex}
.r1 .pri{margin-left:auto;display:flex}
.title{margin-top:6px;font-size:14px;line-height:20px;font-weight:600;white-space:nowrap;overflow:hidden${o.ellipsis ? ';max-width:40%;text-overflow:ellipsis' : ''}}
.labels{margin-top:10px;display:flex;gap:6px}
.lab{height:20px;padding:0 7px;border-radius:6px;font-size:11px;line-height:20px;font-weight:600;white-space:nowrap}
.bar{margin-top:12px;height:4px;border-radius:2px;background:${C.line};overflow:hidden}
.bar i{display:block;height:100%;border-radius:2px;background:${C.accent}}
.foot{margin-top:12px;height:22px;display:flex;align-items:center}
.who{width:22px;height:22px;border-radius:50%;color:#FFFFFF;font-size:9.5px;line-height:14px;font-weight:700;display:flex;align-items:center;justify-content:center}
.due{margin-left:auto;display:flex;align-items:center;gap:6px;font-size:12px;line-height:16px;color:${C.ink2}}
`;

export default function kanbanBuild(o = {}) {
  const cols = COLUMNS.map(c => (o.doneOrder && c.name === 'Done' ? { ...c, cards: c.cards.slice().reverse() } : c));
  const card = (k, ci) => {
    return (
      <div className={'card' + (k.progress != null ? ' p' : '') + (k.done ? ' done' : '')} data-bug={o.doneOrder && ci === 3 ? 'Done column in reverse order' : null}>
        <div className="r1">{k.done ? <span className="ok">{I('check', 14, '#10B981', 2.4)}</span> : null}<span className="id mono">{k.id}</span><span className="pri">{I('flag', 14, PRI[k.pri], 2)}</span></div>
        <div className="title" data-bug={o.ellipsis ? 'Card titles clamped to 40% of the card with an ellipsis' : null}>{k.title}</div>
        <div className="labels">{k.labels.map(([t, c]) => { const [bg, fg] = o.labelBlue && c === 'red' ? LABEL.blue : LABEL[c]; return <span className="lab" style={{ background: bg, color: fg }} data-bug={o.labelBlue && c === 'red' ? 'CVE labels tinted blue, spec is red' : null}>{t}</span>; })}</div>
        {k.progress != null ? <div className="bar"><i style={{ width: `${k.progress * 100}%` }} /></div> : null}
        <div className="foot">{o.noAvatar && k.id === 'SEC-142' ? null : <span className="who" style={{ background: PEOPLE[k.who] }}>{k.who}</span>}<span className="due">{I('calendar', 14, C.muted)}{k.due}</span></div>
      </div>
    );
  };
  const body = (
    <body>
      <div className="app">
        <header>
          <span className="pi">{I('layers', 16, C.accent, 2)}</span>
          <span className="pn">{PROJECT}</span>
          <span className="star">{I('star', 16, C.muted)}</span>
          <nav className="tabs">{TABS.map((t, i) => <a className={i === 0 ? 'on' : null}>{t}</a>)}</nav>
          <div className="people">{['AK', 'MR', 'JL', 'SN'].map(p => <span className="av" style={{ background: PEOPLE[p] }}>{p}</span>)}<span className="av more">+3</span></div>
          <button className="share">Share</button>
          <button className="new">{I('plus', 14, '#FFFFFF', 2.2)}New ticket</button>
        </header>
        <div className="tools">
          <label className="search">{I('search', 14, C.muted)}Filter tickets</label>
          {FILTERS.filter(t => !(o.noLabelsFilter && t === 'Labels')).map(t => <button className="filter">{t}{I('chevronDown', 12, C.ink2, 2)}</button>)}
          <span className="group" data-bug={o.groupLeft ? 'Group by control follows the filters, spec pins it right' : null}>Group by<b>Status</b>{I('chevronDown', 12, C.ink2, 2)}</span>
        </div>
        <main className="board" data-bug={o.colGap ? 'Columns 28px apart, spec is 16px' : null}>
          {cols.map((c, ci) => (
            <section className="col">
              <div className="ch"><i style={{ background: c.color }} /><b>{c.name}</b><span className="cnt">{String(c.cards.length)}</span>{I('plus', 16, C.muted, 2)}</div>
              <div className="cards">{c.cards.map(k => card(k, ci))}</div>
            </section>
          ))}
        </main>
      </div>
    </body>
  );
  return page(`<title>${PROJECT}</title>\n<style>${css(o)}</style>`, String(body));
}
