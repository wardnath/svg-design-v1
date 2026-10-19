/** @jsx h */
/** @jsxFrag Fragment */
/* Documentation page as a Figma frame exported to SVG. The frame follows layout(W, H),
   including the breakpoint that drops the table of contents below 1280px. */
import { h, Fragment, doc, Text, Box, Icon, Group, tw, num } from '../../design-kit/index.js';
import { layout, PAGE_H, TOP, SIDE, TOCW } from './layout.js';
import { BRAND, TOPLINKS, SIDEBAR, TOC, CRUMBS, LEAD, P1, P2, CALLOUT, TABS, CODE, PARAMS, C } from './data.js';

function Header({ L, D }) {
  const s = L.search;
  const logo = D.linear(24, 18, 52, 46, [[0, '#4F46E5'], [1, '#14B8A6']]);
  const vw = Math.round(10 + tw('v4.2', 12.5, 600) + 4 + 12 + 8);
  let x = L.W - 24 - 20 - 24;
  const links = [];
  for (let i = TOPLINKS.length - 1; i >= 0; i--) { x -= tw(TOPLINKS[i], 14, 500); links.push(<Text x={x} y={22} size={14} lh={20} weight={500} color={C.ink2}>{TOPLINKS[i]}</Text>); x -= 24; }
  return (
    <Group id="Header">
      <rect x="0" y={TOP - 1} width={L.W} height="1" fill={C.line} />
      <rect x="24" y="18" width="28" height="28" rx="8" fill={logo} />
      <Icon name="layers" x={30} y={24} size={16} color="#FFFFFF" sw={2} />
      <Text x={62} y={18} size={17} lh={28} weight={700} color={C.ink}>{BRAND}</Text>
      <Text x={62 + tw(BRAND, 17, 700) + 8} y={18} size={17} lh={28} weight={400} color={C.muted}>Docs</Text>
      <Box x={L.versionX} y={19} w={vw} h={26} r={13} fill="#FFFFFF" stroke={C.line} />
      <Text x={L.versionX + 10} y={22} size={12.5} lh={20} weight={600} color={C.ink2}>v4.2</Text>
      <Icon name="chevronDown" x={L.versionX + vw - 20} y={26} size={12} color={C.ink2} sw={2} />
      <Box x={s.x} y={s.y} w={s.w} h={40} r={10} fill="#F9FAFB" stroke={C.line} />
      <Icon name="search" x={s.x + 13} y={s.y + 12} size={16} color={C.muted} />
      <Text x={s.x + 38} y={s.y + 10} size={14} lh={20} weight={400} color={C.muted}>Search docs</Text>
      <Box x={s.x + s.w - 36} y={s.y + 10} w={24} h={20} r={5} fill="#FFFFFF" stroke={C.line} />
      <Text x={s.x + s.w - 36} y={s.y + 10} width={24} align="center" size={11.5} lh={20} weight={600} family="mono" color={C.muted}>/</Text>
      {links}
      <Icon name="github" x={L.W - 44} y={22} size={20} color={C.ink} />
    </Group>
  );
}

function Sidebar({ L }) {
  const out = [<Box x={0} y={TOP} w={SIDE} h={L.H - TOP} fill={C.side} />, <rect x={SIDE - 1} y={TOP} width="1" height={L.H - TOP} fill={C.line} />];
  for (const n of L.nav) {
    out.push(<Text x={24} y={n.label.y} size={11.5} lh={16} weight={600} color={C.muted} ls={0.6}>{n.g.group.toUpperCase()}</Text>);
    for (const { it, b } of n.items) {
      const [t, on] = Array.isArray(it) ? it : [it, false];
      if (on) out.push(<Box x={b.x} y={b.y} w={b.w} h={32} r={8} fill={C.accentSoft} />);
      out.push(<Text x={b.x + 12} y={b.y + 6} size={14} lh={20} weight={on ? 600 : 400} color={on ? C.accent : C.ink2}>{t}</Text>);
    }
  }
  return <Group id="Sidebar">{out}</Group>;
}

function Toc({ L }) {
  if (!L.toc) return '';
  const t = L.toc;
  return (
    <Group id="On this page">
      <rect x={L.W - TOCW} y={TOP} width="1" height={L.H - TOP} fill={C.line} />
      <Text x={t.x} y={t.y} size={11.5} lh={16} weight={600} color={C.muted} ls={0.6}>ON THIS PAGE</Text>
      {TOC.map(([s, on], i) => (
        <>
          {on ? <rect x={t.x - 12} y={t.items[i].y} width="2" height="20" rx="1" fill={C.accent} /> : null}
          <Text x={t.x} y={t.items[i].y} size={13.5} lh={20} weight={on ? 600 : 400} color={on ? C.accent : C.ink2}>{s}</Text>
        </>
      ))}
    </Group>
  );
}

function Article({ L, D }) {
  const a = L.a, x = a.x, w = a.w;
  const out = [];
  out.push(<Text x={x} y={a.crumbs} size={13} lh={20} weight={400} color={C.muted}>{CRUMBS[0]}</Text>);
  const cx = x + tw(CRUMBS[0], 13) + 8;
  out.push(<Text x={cx} y={a.crumbs} size={13} lh={20} weight={400} color={C.muted}>/</Text>, <Text x={cx + tw('/', 13) + 8} y={a.crumbs} size={13} lh={20} weight={500} color={C.ink2}>{CRUMBS[1]}</Text>);
  out.push(<Text x={x} y={a.h1} size={36} lh={44} weight={600} color={C.ink} ls={-0.6}>Quickstart</Text>);
  out.push(<Text x={x} y={a.lead} width={w} size={17} lh={28} weight={400} color={C.ink2}>{LEAD}</Text>);
  out.push(<Text x={x} y={a.h2a} size={22} lh={30} weight={600} color={C.ink} ls={-0.3}>Install the CLI</Text>);
  out.push(<Text x={x} y={a.p1} width={w} size={15.5} lh={26} weight={400} color={C.ink2}>{P1}</Text>);
  // code block with tabs
  const cy = a.code;
  out.push(<rect x={num(x)} y={cy} width={num(w)} height={a.codeH} rx="10" fill={C.code} />);
  out.push(<path d={`M${num(x)} ${cy + 10}a10 10 0 0 1 10 -10H${num(x + w - 10)}a10 10 0 0 1 10 10V${cy + 38}H${num(x)}Z`} fill={C.codeBar} />);
  let tx = x + 16;
  TABS.forEach((t, i) => {
    const tw0 = tw(t, 13, 500, 'mono');
    out.push(<Text x={tx} y={cy + 9} size={13} lh={20} weight={500} family="mono" color={i === 0 ? '#F8FAFC' : '#94A3B8'}>{t}</Text>);
    if (i === 0) out.push(<rect x={num(tx)} y={cy + 36} width={num(tw0)} height="2" fill="#818CF8" />);
    tx += tw0 + 20;
  });
  out.push(<Icon name="file" x={x + w - 16 - 14 - 6 - tw('Copy', 12, 600)} y={cy + 12} size={14} color="#94A3B8" />, <Text x={x + w - 16} y={cy + 9} align="right" size={12} lh={20} weight={600} color="#94A3B8">Copy</Text>);
  CODE.forEach((line, i) => {
    let lx = x + 20;
    for (const [t, col] of line) { out.push(<Text x={lx} y={cy + 38 + 16 + i * 22} size={13} lh={22} weight={400} family="mono" color={col}>{t}</Text>); lx += tw(t, 13, 400, 'mono'); }
  });
  // callout
  const ky = a.callout;
  out.push(<Box x={x} y={ky} w={w} h={a.calloutH} r={8} fill={C.infoSoft} />, <rect x={num(x)} y={ky} width="3" height={a.calloutH} fill={C.info} />);
  out.push(<Icon name="alert" x={x + 18} y={ky + 16} size={20} color={C.info} />, <Text x={x + 50} y={ky + 14} size={14.5} lh={24} weight={500} color="#1E3A8A">{CALLOUT}</Text>);
  out.push(<Text x={x} y={a.h2b} size={22} lh={30} weight={600} color={C.ink} ls={-0.3}>Run your first scan</Text>);
  out.push(<Text x={x} y={a.p2} size={15.5} lh={26} weight={400} color={C.ink2}>{P2}</Text>);
  // parameters table
  const ty = a.table, cols = a.cols;
  out.push(<Box x={x} y={ty} w={w} h={174} r={10} fill="#FFFFFF" stroke={C.line} />);
  out.push(<path d={`M${num(x + 1)} ${ty + 10}a9 9 0 0 1 9 -9H${num(x + w - 10)}a9 9 0 0 1 9 9V${ty + 41}H${num(x + 1)}Z`} fill="#F9FAFB" />);
  ['FLAG', 'DESCRIPTION', 'DEFAULT'].forEach((t, i) => out.push(<Text x={cols[i].x + 14} y={ty + 12} size={11.5} lh={16} weight={600} color={C.muted} ls={0.5}>{t}</Text>));
  PARAMS.forEach(([f, d, def], r) => {
    const ry = ty + 41 + r * 44;
    out.push(<rect x={num(x)} y={ry} width={num(w)} height="1" fill={C.line} />);
    const fw = Math.round(tw(f, 12.5, 500, 'mono')) + 12;
    out.push(<Box x={cols[0].x + 14} y={ry + 11} w={fw} h={22} r={5} fill="#F1F5F9" />, <Text x={cols[0].x + 14} y={ry + 11} width={fw} align="center" size={12.5} lh={22} weight={500} family="mono" color={C.ink}>{f}</Text>);
    out.push(<Text x={cols[1].x + 14} y={ry + 11} size={14} lh={22} weight={400} color={C.ink2}>{d}</Text>);
    out.push(<Text x={cols[2].x + 14} y={ry + 11} size={12.5} lh={22} weight={400} family="mono" color={C.ink2}>{def}</Text>);
  });
  return <Group id="Article">{out}</Group>;
}

export default function docsDesign({ W = 1440, H = PAGE_H } = {}) {
  const L = layout(W, H);
  const D = doc('Docs · Quickstart', W, H);
  return D.svg(<><Header L={L} D={D} /><Sidebar L={L} /><Toc L={L} /><Article L={L} D={D} /></>, C.page);
}
export { layout, PAGE_H };
