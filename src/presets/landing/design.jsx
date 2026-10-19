/** @jsx h */
/** @jsxFrag Fragment */
/* Sentinel marketing page as a Figma frame exported to SVG. The 1200px container and
   full-bleed bands follow layout(W, H); the hero illustration is the same vector art
   the build inlines, placed with a transform. */
import { h, Fragment, doc, Text, Box, Icon, Group, tw, num } from '../../design-kit/index.js';
import { layout, PAGE_H, NAV_H } from './layout.js';
import { mockMarkup, MOCK } from './mock.js';
import { BRAND, LINKS, EYEBROW, H1, LEAD, TRUST, AVATARS, LOGOS, FEATURES, STATS, FOOT, C } from './data.js';

function Nav({ L, D }) {
  const c = L.c;
  const logo = D.linear(c.x, 20, c.x + 32, 52, [[0, '#6366F1'], [1, '#22D3EE']]);
  return (
    <Group id="Nav">
      <rect x="0" y={NAV_H - 1} width={L.W} height="1" fill={C.line} />
      <rect x={c.x} y="20" width="32" height="32" rx="9" fill={logo} />
      <Icon name="shield" x={c.x + 7} y={27} size={18} color="#FFFFFF" sw={2} />
      <Text x={c.x + 42} y={20} size={20} lh={32} weight={700} color={C.ink} ls={-0.3}>{BRAND}</Text>
      {LINKS.map((t, i) => <Text x={L.links[i].x} y={26} size={14.5} lh={20} weight={500} color="#334155">{t}</Text>)}
      <Text x={L.sign.x} y={26} size={14.5} lh={20} weight={500} color={C.ink}>Sign in</Text>
      <Box x={L.cta.x} y={L.cta.y} w={L.cta.w} h={40} r={8} fill={C.dark} />
      <Text x={L.cta.x} y={L.cta.y + 10} width={L.cta.w} align="center" size={14} lh={20} weight={600} color="#FFFFFF">Start free trial</Text>
    </Group>
  );
}

function Hero({ L, D }) {
  const hr = L.hero, e = hr.eyebrow;
  const etx = e.x + 4 + hr.tagW + 8, etw = tw(EYEBROW.text, 13, 500);
  const b1tw = tw('Start free trial', 15, 600);
  const m = hr.mock, s = m.w / MOCK.w;
  const shadow = D.shadow({ x: m.x, y: m.y, w: m.w, h: m.h }, [{ dy: 24, blur: 48, color: '#0F172A', opacity: 0.16 }]);
  const tx = hr.trust.x;
  return (
    <Group id="Hero">
      <Box x={e.x} y={e.y} w={e.w} h={30} r={15} fill="#EEF2FF" />
      <Box x={e.x + 4} y={e.y + 4} w={hr.tagW} h={22} r={11} fill={C.accent} />
      <Text x={e.x + 4} y={e.y + 4} width={hr.tagW} align="center" size={12} lh={22} weight={600} color="#FFFFFF">{EYEBROW.tag}</Text>
      <Text x={etx} y={e.y + 5} size={13} lh={20} weight={500} color="#4338CA">{EYEBROW.text}</Text>
      <Icon name="arrowRight" x={etx + etw + 6} y={e.y + 8} size={14} color="#4338CA" sw={2} />
      <Text x={hr.h1.x} y={hr.h1.y} size={52} lh={60} weight={600} color={C.ink} ls={-1.2}>{H1.join('\n')}</Text>
      <Text x={hr.lead.x} y={hr.lead.y} size={18} lh={28} weight={400} color={C.ink2}>{LEAD.join('\n')}</Text>
      <Box x={hr.cta1.x} y={hr.cta1.y} w={hr.cta1.w} h={48} r={10} fill={C.dark} />
      <Text x={hr.cta1.x + 22} y={hr.cta1.y + 14} size={15} lh={20} weight={600} color="#FFFFFF">Start free trial</Text>
      <Icon name="arrowRight" x={hr.cta1.x + 22 + b1tw + 8} y={hr.cta1.y + 15} size={18} color="#FFFFFF" sw={2} />
      <Box x={hr.cta2.x} y={hr.cta2.y} w={hr.cta2.w} h={48} r={10} fill="#FFFFFF" stroke="#CBD5E1" />
      <Text x={hr.cta2.x} y={hr.cta2.y + 14} width={hr.cta2.w} align="center" size={15} lh={20} weight={600} color={C.ink}>Book a demo</Text>
      {AVATARS.map(([col, ini], i) => (
        <>
          <circle cx={tx + i * 24 + 16} cy={hr.trust.y + 16} r="17" fill="#FFFFFF" />
          <circle cx={tx + i * 24 + 16} cy={hr.trust.y + 16} r="16" fill={col} />
          <Text x={tx + i * 24} y={hr.trust.y + 8} width={32} align="center" size={11} lh={16} weight={700} color="#FFFFFF">{ini}</Text>
        </>
      ))}
      <Text x={tx + 92} y={hr.trust.y + 6} size={14} lh={20} weight={500} color={C.ink2}>{TRUST}</Text>
      <g filter={shadow}><rect x={num(m.x)} y={num(m.y)} width={num(m.w)} height={num(m.h)} rx={num(16 * s)} fill="#0B1220" /></g>
      <g id="Product_screenshot" transform={`translate(${num(m.x)} ${num(m.y)}) scale(${+s.toFixed(5)})`}>{mockMarkup('paint_mock_' + D.node)}</g>
    </Group>
  );
}

function Logos({ L }) {
  const c = L.c, lg = L.logos;
  const ws = LOGOS.map(([t, wgt, ls]) => tw(t, 22, wgt, 'inter', ls));
  const gap = (c.w - ws.reduce((a, b) => a + b, 0)) / (LOGOS.length - 1);
  let x = c.x;
  return (
    <Group id="Logos">
      <rect x={c.x} y={lg.rule} width={c.w} height="1" fill={C.line} />
      <Text x={c.x} y={lg.label.y} width={c.w} align="center" size={12.5} lh={18} weight={600} color={C.muted} ls={1.2}>TRUSTED BY SECURITY TEAMS AT</Text>
      {LOGOS.map(([t, wgt, ls], i) => { const el = <Text x={x} y={lg.y} size={22} lh={32} weight={wgt} color="#94A3B8" ls={ls}>{t}</Text>; x += ws[i] + gap; return el; })}
    </Group>
  );
}

function Features({ L }) {
  const c = L.c, f = L.f;
  return (
    <Group id="Features">
      <Text x={c.x} y={f.head.y} width={c.w} align="center" size={36} lh={44} weight={600} color={C.ink} ls={-0.6}>Everything between discovery and fix</Text>
      <Text x={c.x} y={f.sub.y} width={c.w} align="center" size={17} lh={28} weight={400} color={C.ink2}>One platform from the first scan to the verified fix.</Text>
      {FEATURES.map((ft, i) => {
        const b = f.cards[i];
        const lw = tw('Learn more', 14.5, 600);
        return (
          <Group id={`Feature/${ft.title}`}>
            <Box x={b.x} y={b.y} w={b.w} h={b.h} r={16} fill="#FFFFFF" stroke={C.line} />
            <Box x={b.x + 28} y={b.y + 28} w={44} h={44} r={12} fill={ft.bg} />
            <Icon name={ft.icon} x={b.x + 39} y={b.y + 39} size={22} color={ft.tint} sw={2} />
            <Text x={b.x + 28} y={b.y + 92} size={18} lh={26} weight={600} color={C.ink}>{ft.title}</Text>
            <Text x={b.x + 28} y={b.y + 126} width={b.w - 56} size={15} lh={24} weight={400} color={C.ink2}>{ft.text}</Text>
            <Text x={b.x + 28} y={b.y + b.h - 48} size={14.5} lh={20} weight={600} color={C.accent}>Learn more</Text>
            <Icon name="arrowRight" x={b.x + 28 + lw + 6} y={b.y + b.h - 46} size={16} color={C.accent} sw={2} />
          </Group>
        );
      })}
    </Group>
  );
}

function Stats({ L }) {
  const st = L.stats;
  return (
    <Group id="Stats">
      <Box x={0} y={st.band.y} w={L.W} h={st.band.h} fill={C.dark} />
      {STATS.map(([v, l], i) => (
        <>
          <Text x={st.cols[i].x} y={st.band.y + 44} width={st.cols[i].w} align="center" size={40} lh={48} weight={700} color="#FFFFFF" ls={-0.8}>{v}</Text>
          <Text x={st.cols[i].x} y={st.band.y + 100} width={st.cols[i].w} align="center" size={14.5} lh={20} weight={400} color="#94A3B8">{l}</Text>
        </>
      ))}
    </Group>
  );
}

function Closing({ L, D }) {
  const b = L.ctaCard;
  const bw = Math.round(tw('Scan my domains', 15, 600)) + 48;
  const grad = D.linear(b.x, b.y, b.x + b.w, b.y, [[0, '#4F46E5'], [1, '#7C3AED']]);
  return (
    <Group id="Call to action">
      <rect x={num(b.x)} y={num(b.y)} width={num(b.w)} height={num(b.h)} rx="24" fill={grad} />
      <Text x={b.x} y={b.y + 52} width={b.w} align="center" size={32} lh={40} weight={600} color="#FFFFFF" ls={-0.5}>Find your exposure before someone else does</Text>
      <Text x={b.x} y={b.y + 104} width={b.w} align="center" size={16.5} lh={26} weight={400} color="#E0E7FF">Start a free scan of your domains. Results in under an hour.</Text>
      <Box x={b.x + (b.w - bw) / 2} y={b.y + 156} w={bw} h={46} r={10} fill="#FFFFFF" />
      <Text x={b.x + (b.w - bw) / 2} y={b.y + 169} width={bw} align="center" size={15} lh={20} weight={600} color={C.accent}>Scan my domains</Text>
    </Group>
  );
}

function Footer({ L }) {
  const c = L.c, f = L.foot;
  let x = c.x + c.w;
  const links = [];
  for (let i = FOOT.length - 1; i >= 0; i--) {
    x -= tw(FOOT[i], 13.5, 500);
    links.push(<Text x={x} y={f.row.y} size={13.5} lh={20} weight={500} color={C.ink2}>{FOOT[i]}</Text>);
    x -= 28;
  }
  return (
    <Group id="Footer">
      <rect x={c.x} y={f.rule} width={c.w} height="1" fill={C.line} />
      <Text x={c.x} y={f.row.y} size={13.5} lh={20} weight={400} color={C.muted}>© 2026 Sentinel Labs, Inc.</Text>
      {links}
    </Group>
  );
}

export default function landingDesign({ W = 1440, H = PAGE_H } = {}) {
  const L = layout(W, H);
  const D = doc('Sentinel landing page', W, H);
  return D.svg(<><Nav L={L} D={D} /><Hero L={L} D={D} /><Logos L={L} /><Features L={L} /><Stats L={L} /><Closing L={L} D={D} /><Footer L={L} /></>, C.page);
}
export { layout, PAGE_H };
