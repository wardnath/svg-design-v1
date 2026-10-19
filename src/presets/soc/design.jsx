/** @jsx h */
/** @jsxFrag Fragment */
import { h, Fragment, doc, Text, Box, Icon, Group, tw, mix, num, box, inset, points, smoothPath, areaPath, arcPath, mapFit, mapDots, geo, arcBetween, MAP_VB } from '../../design-kit/index.js';
import { layout, cardBody, SIDE, TOP, PAD, CARD_PAD } from './layout.js';
import { BRAND, NAV, USER, KPIS, SEVERITY, EVENTS, VECTORS, ATTACKS, ORIGINS, ALERTS, STATUS_COLOR, SEV_COLOR, C } from './data.js';

const DOTS = mapDots();

function Card({ D, b, title, right, children }) {
  return (
    <Group id={`Card/${title}`}>
      <Box x={b.x} y={b.y} w={b.w} h={b.h} r={12} fill={C.card} stroke={C.line} />
      <Text x={b.x + CARD_PAD} y={b.y + 14} size={14} lh={20} weight={600} color={C.ink}>{title}</Text>
      {right}
      {children}
    </Group>
  );
}

function Sparkline({ D, b, data, color }) {
  const lo = Math.min(...data), hi = Math.max(...data);
  const pts = points(data, b, lo - (hi - lo) * 0.1, hi + (hi - lo) * 0.1);
  const fill = D.linear(b.x, b.y, b.x, b.y + b.h, [[0, color, 0.28], [1, color, 0]]);
  return (
    <>
      <path d={areaPath(pts, b.y + b.h)} fill={fill} />
      <path d={smoothPath(pts)} stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

function Sidebar({ L, D }) {
  const out = [];
  const logo = D.linear(20, 18, 48, 46, [[0, '#22D3EE'], [1, '#6366F1']]);
  out.push(<Box x={0} y={0} w={SIDE} h={L.H} fill={C.side} />, <rect x={SIDE - 1} width="1" height={L.H} fill={C.line} />);
  out.push(<rect x="20" y="18" width="28" height="28" rx="8" fill={logo} />, <Icon name="shield" x={26} y={24} size={16} color="#FFFFFF" sw={2} />);
  out.push(<Text x={58} y={18} size={17} lh={28} weight={700} color={C.ink}>{BRAND}</Text>);
  const bw = tw(BRAND, 17, 700);
  out.push(<Box x={58 + bw + 8} y={24} w={34} h={16} r={4} fill="#1A2740" />, <Text x={58 + bw + 8} y={24} width={34} align="center" size={10} lh={16} weight={600} color={C.ink2} ls={0.4}>SOC</Text>);
  for (const n of L.nav) {
    out.push(<Text x={n.label.x} y={n.label.y} size={11} lh={16} weight={600} color={C.muted} ls={0.6}>{n.g.group.toUpperCase()}</Text>);
    for (const { it, b } of n.items) {
      const [icon, label, active, badge] = it;
      if (active) out.push(<Box x={b.x} y={b.y} w={b.w} h={b.h} r={8} fill="#18233A" />, <rect x={b.x} y={b.y + 9} width="3" height="18" rx="1.5" fill={C.accent} />);
      out.push(<Icon name={icon} x={b.x + 12} y={b.y + 9} size={18} color={active ? C.accent : C.ink2} />);
      out.push(<Text x={b.x + 40} y={b.y + 8} size={13.5} lh={20} weight={active ? 600 : 500} color={active ? C.ink : C.ink2}>{label}</Text>);
      if (badge) {
        const w = Math.max(24, tw(badge, 11, 600) + 14);
        out.push(<Box x={b.x + b.w - 10 - w} y={b.y + 9} w={w} h={18} r={9} fill="#3B1D2A" />, <Text x={b.x + b.w - 10 - w} y={b.y + 9} width={w} align="center" size={11} lh={18} weight={600} color="#FDA4AF">{badge}</Text>);
      }
    }
  }
  const uy = L.H - 72;
  out.push(<rect x="16" y={uy} width={SIDE - 32} height="1" fill={C.line} />);
  out.push(<circle cx="36" cy={uy + 36} r="16" fill="#3B2F63" />, <Text x={20} y={uy + 26} width={32} align="center" size={12} lh={20} weight={700} color="#DDD6FE">{USER.initials}</Text>);
  out.push(<Text x={62} y={uy + 18} size={13} lh={18} weight={600} color={C.ink}>{USER.name}</Text>, <Text x={62} y={uy + 37} size={12} lh={16} weight={400} color={C.muted}>{USER.role}</Text>);
  out.push(<Icon name="logout" x={SIDE - 40} y={uy + 27} size={18} color={C.muted} />);
  return <Group id="Sidebar">{out}</Group>;
}

function TopBar({ L, D }) {
  const t = L.top;
  return (
    <Group id="Top bar">
      <Box x={t.x} y={0} w={t.w} h={TOP} fill={C.top} />
      <rect x={t.x} y={TOP - 1} width={t.w} height="1" fill={C.line} />
      <Text x={t.x + PAD} y={19} size={18} lh={26} weight={600} color={C.ink}>Security overview</Text>
      <Box x={L.search.x} y={L.search.y} w={L.search.w} h={36} r={8} fill="#0A101C" stroke={C.line2} />
      <Icon name="search" x={L.search.x + 12} y={L.search.y + 10} size={16} color={C.muted} />
      <Text x={L.search.x + 38} y={L.search.y + 8} size={13} lh={20} color={C.muted}>Search IPs, hosts, users, hashes</Text>
      <Box x={L.search.x + L.search.w - 30} y={L.search.y + 8} w={20} h={20} r={5} fill="none" stroke={C.line2} />
      <Text x={L.search.x + L.search.w - 30} y={L.search.y + 8} width={20} align="center" size={11} lh={20} weight={600} family="mono" color={C.muted}>/</Text>
      <Box x={L.range.x} y={L.range.y} w={L.range.w} h={36} r={8} fill="#131D30" stroke={C.line2} />
      <Icon name="calendar" x={L.range.x + 12} y={L.range.y + 10} size={16} color={C.ink2} />
      <Text x={L.range.x + 36} y={L.range.y + 8} size={13} lh={20} weight={500} color={C.ink}>Last 24 hours</Text>
      <Icon name="chevronDown" x={L.range.x + L.range.w - 26} y={L.range.y + 11} size={14} color={C.ink2} />
      <Box x={L.live.x} y={L.live.y} w={L.live.w} h={28} r={14} fill="#0E2A26" />
      <circle cx={L.live.x + 14} cy={L.live.y + 14} r="4" fill="#34D399" />
      <Text x={L.live.x + 24} y={L.live.y + 4} size={12} lh={20} weight={600} color="#6EE7B7">Live</Text>
      <Box x={L.bell.x} y={L.bell.y} w={36} h={36} r={8} fill="#131D30" stroke={C.line2} />
      <Icon name="bell" x={L.bell.x + 9} y={L.bell.y + 9} size={18} color={C.ink2} />
      <circle cx={L.bell.x + 25} cy={L.bell.y + 10} r="4" fill="#F43F5E" stroke="#131D30" strokeWidth="2" />
      <circle cx={L.avatar.x + 16} cy={L.avatar.y + 16} r="16" fill="#3B2F63" />
      <Text x={L.avatar.x} y={L.avatar.y + 6} width={32} align="center" size={12} lh={20} weight={700} color="#DDD6FE">{USER.initials}</Text>
    </Group>
  );
}

function Kpi({ D, b, k }) {
  const vw = tw(k.value, 26, 600);
  const dw = tw(k.delta, 12, 600) + 14;
  const good = k.good;
  return (
    <Group id={`KPI/${k.label}`}>
      <Box x={b.x} y={b.y} w={b.w} h={b.h} r={12} fill={C.card} stroke={C.line} />
      <Text x={b.x + 16} y={b.y + 16} size={13} lh={18} weight={500} color={C.ink2}>{k.label}</Text>
      <Box x={b.x + b.w - 44} y={b.y + 12} w={28} h={28} r={7} fill={k.tint} opacity={0.14} />
      <Icon name={k.icon} x={b.x + b.w - 38} y={b.y + 18} size={16} color={k.tint} />
      <Text x={b.x + 16} y={b.y + 42} size={26} lh={32} weight={600} color={C.ink} ls={-0.3}>{k.value}</Text>
      <Box x={b.x + 16 + vw + 10} y={b.y + 48} w={dw} h={20} r={10} fill={good ? '#34D399' : '#F87171'} opacity={0.14} />
      <Text x={b.x + 16 + vw + 10} y={b.y + 48} width={dw} align="center" size={12} lh={20} weight={600} color={good ? '#6EE7B7' : '#FCA5A5'}>{k.delta}</Text>
      <Sparkline D={D} b={box(b.x + 16, b.y + 82, b.w - 32, 18)} data={k.spark} color={k.tint} />
    </Group>
  );
}

function ThreatMap({ D, b }) {
  const body = cardBody(b);
  const listW = 200;
  const area = box(body.x, body.y, body.w - listW - 16, body.h);
  const f = mapFit(area);
  const P = ([x, y]) => [f.ox + x * f.s, f.oy + y * f.s];
  const dots = DOTS.map(p => { const [x, y] = P(p); return `<circle cx="${num(x)}" cy="${num(y)}" r="${num(3.4 * f.s)}" fill="${C.map}"/>`; }).join('');
  const arcs = [], marks = [];
  for (const a of ATTACKS) {
    const s = geo(...a.from), t = geo(...a.to);
    const arc = arcBetween(s, t);
    const col = SEV_COLOR[a.sev];
    arcs.push(<path d={transformPath(arc.d, f)} stroke={col} strokeWidth="1.5" strokeOpacity="0.9" strokeLinecap="round" />);
    const [sx, sy] = P(s), [tx, ty] = P(t);
    marks.push(<circle cx={sx} cy={sy} r={8 * f.s} fill={col} />);
    marks.push(<circle cx={tx} cy={ty} r={26 * f.s} stroke={col} strokeOpacity="0.55" />, <circle cx={tx} cy={ty} r={10 * f.s} fill={col} />);
  }
  const legend = [['Critical', '#F43F5E'], ['High', '#FB923C'], ['Medium', '#FACC15']];
  let lx = b.x + b.w - CARD_PAD;
  const leg = [];
  for (let i = legend.length - 1; i >= 0; i--) {
    const [n, c] = legend[i];
    const w = tw(n, 12, 500);
    lx -= w;
    leg.push(<Text x={lx} y={b.y + 14} size={12} lh={20} weight={500} color={C.ink2}>{n}</Text>);
    lx -= 6 + 8;
    leg.push(<circle cx={lx + 4} cy={b.y + 24} r="4" fill={c} />);
    lx -= 14;
  }
  const max = ORIGINS[0][1];
  const lst = box(body.x + body.w - listW, body.y, listW, body.h);
  return (
    <Card D={D} b={b} title="Live threat map" right={leg}>
      <Group id="Map">{dots}{arcs}{marks}</Group>
      <Group id="Top origins">
        <Text x={lst.x} y={lst.y} size={11} lh={16} weight={600} color={C.muted} ls={0.6}>TOP ORIGINS</Text>
        {ORIGINS.map(([name, n, col], i) => {
          const y = lst.y + 22 + i * 33;
          return (
            <>
              <Text x={lst.x} y={y} size={13} lh={18} weight={500} color={C.ink2}>{name}</Text>
              <Text x={lst.x + listW} y={y} align="right" size={12} lh={18} weight={500} family="mono" color={C.ink}>{n.toLocaleString('en-US')}</Text>
              <Box x={lst.x} y={y + 23} w={listW} h={4} r={2} fill={C.line2} />
              <Box x={lst.x} y={y + 23} w={listW * n / max} h={4} r={2} fill={col} />
            </>
          );
        })}
      </Group>
    </Card>
  );
}
function transformPath(d, f) {
  let i = 0;
  return d.replace(/-?\d+(?:\.\d+)?/g, m => { const v = +m; const out = i % 2 === 0 ? f.ox + v * f.s : f.oy + v * f.s; i++; return String(num(out)); });
}

function Severity({ D, b }) {
  const body = cardBody(b);
  const total = SEVERITY.reduce((s, x) => s + x.n, 0);
  const d = 150, cx = body.x + d / 2, cy = body.y + body.h / 2;
  const segs = [];
  let a = 0;
  const gap = 0.035;
  for (const s of SEVERITY) {
    const span = (s.n / total) * Math.PI * 2;
    segs.push(<path d={arcPath(cx, cy, d / 2 - 16, d / 2, a + gap / 2, a + span - gap / 2)} fill={s.color} />);
    a += span;
  }
  const lx = body.x + d + 28, lw = body.x + body.w - lx;
  const rowH = 30, ly = cy - (SEVERITY.length * rowH) / 2;
  return (
    <Card D={D} b={b} title="Alerts by severity" right={<Text x={b.x + b.w - CARD_PAD} y={b.y + 14} align="right" size={12} lh={20} weight={500} color={C.muted}>Last 24 hours</Text>}>
      {segs}
      <Text x={cx} y={cy - 20} align="center" size={22} lh={28} weight={600} color={C.ink}>{String(total)}</Text>
      <Text x={cx} y={cy + 6} align="center" size={11} lh={14} weight={500} color={C.muted}>alerts</Text>
      {SEVERITY.map((s, i) => {
        const y = ly + i * rowH;
        return (
          <>
            <Box x={lx} y={y + 6} w={10} h={10} r={3} fill={s.color} />
            <Text x={lx + 20} y={y} size={13} lh={22} weight={500} color={C.ink2}>{s.name}</Text>
            <Text x={lx + lw} y={y} align="right" size={13} lh={22} weight={600} family="mono" color={C.ink}>{String(s.n)}</Text>
          </>
        );
      })}
    </Card>
  );
}

function Events({ D, b }) {
  const body = cardBody(b);
  const plot = box(body.x + 44, body.y + 6, body.w - 44, body.h - 6 - 22);
  const n = EVENTS.hours.length;
  const stacks = [];
  let acc = new Array(n).fill(0);
  for (const s of EVENTS.series) { const top = s.v.map((v, i) => acc[i] + v); stacks.push({ s, lo: acc, hi: top }); acc = top; }
  const hi = 600;
  const grid = [0, 1, 2, 3].map(i => plot.y + (i / 3) * plot.h);
  const lab = ['600', '400', '200', '0'];
  const out = [];
  grid.forEach((y, i) => {
    out.push(<rect x={plot.x} y={y} width={plot.w} height="1" fill={C.line} />);
    out.push(<Text x={body.x + 34} y={y - 8} align="right" size={11} lh={16} family="mono" color={C.muted}>{lab[i]}</Text>);
  });
  for (let k = stacks.length - 1; k >= 0; k--) {
    const { s, lo, hi: top } = stacks[k];
    const pt = points(top, plot, 0, hi), pb = points(lo, plot, 0, hi);
    const area = smoothPath(pt) + 'L' + pb.slice().reverse().map(p => `${num(p[0])} ${num(p[1])}`).join('L') + 'Z';
    out.push(<path d={area} fill={s.color} fillOpacity="0.16" />);
    out.push(<path d={smoothPath(pt)} stroke={s.color} strokeWidth="1.5" strokeLinejoin="round" />);
  }
  for (let hh = 0; hh < 24; hh += 4) {
    const x = plot.x + (hh / (n - 1)) * plot.w;
    out.push(<Text x={x} y={plot.y + plot.h + 6} align="center" size={11} lh={16} family="mono" color={C.muted}>{`${String(hh).padStart(2, '0')}:00`}</Text>);
  }
  let lx = b.x + b.w - CARD_PAD;
  const leg = [];
  for (let i = EVENTS.series.length - 1; i >= 0; i--) {
    const s = EVENTS.series[i];
    lx -= tw(s.name, 12, 500);
    leg.push(<Text x={lx} y={b.y + 14} size={12} lh={20} weight={500} color={C.ink2}>{s.name}</Text>);
    lx -= 6 + 12;
    leg.push(<rect x={lx} y={b.y + 23} width="12" height="2" rx="1" fill={s.color} />);
    lx -= 16;
  }
  return <Card D={D} b={b} title="Events over time" right={leg}>{out}</Card>;
}

function Vectors({ D, b }) {
  const body = cardBody(b);
  return (
    <Card D={D} b={b} title="Top attack vectors" right={<Text x={b.x + b.w - CARD_PAD} y={b.y + 14} align="right" size={12} lh={20} weight={500} color={C.muted}>Share of alerts</Text>}>
      {VECTORS.map(([name, pct], i) => {
        const y = body.y + i * 32;
        return (
          <>
            <Text x={body.x} y={y} size={13} lh={16} weight={500} color={C.ink2}>{name}</Text>
            <Text x={body.x + body.w} y={y} align="right" size={12} lh={16} weight={500} family="mono" color={C.ink}>{`${pct}%`}</Text>
            <Box x={body.x} y={y + 20} w={body.w} h={5} r={2.5} fill={C.line2} />
            <Box x={body.x} y={y + 20} w={body.w * pct / 40} h={5} r={2.5} fill={i === 0 ? '#22D3EE' : '#3E7C95'} />
          </>
        );
      })}
    </Card>
  );
}

function Alerts({ D, b, L }) {
  const body = cardBody(b);
  const cols = L.alertCols;
  const heads = ['SEVERITY', 'ALERT', 'SOURCE', 'ASSET', 'TECHNIQUE', 'STATUS', 'TIME'];
  const clip = D.clip(body);
  const rows = [];
  heads.forEach((t, i) => rows.push(<Text x={i === 6 ? cols[i].x + cols[i].w : cols[i].x} y={body.y + 4} align={i === 6 ? 'right' : 'left'} size={11} lh={16} weight={600} color={C.muted} ls={0.5}>{t}</Text>));
  ALERTS.forEach((a, r) => {
    const y = body.y + 28 + r * 31;
    rows.push(<rect x={body.x} y={y} width={body.w} height="1" fill={C.line} />);
    const sc = SEV_COLOR[a.sev];
    const pw = tw(a.sev, 11.5, 600) + 28;
    rows.push(<Box x={cols[0].x} y={y + 6} w={pw} h={20} r={10} fill={sc} opacity={0.15} />, <circle cx={cols[0].x + 11} cy={y + 16} r="3" fill={sc} />,
      <Text x={cols[0].x + 19} y={y + 6} size={11.5} lh={20} weight={600} color={sc}>{a.sev}</Text>);
    rows.push(<Text x={cols[1].x} y={y + 6} size={13} lh={20} weight={500} color={C.ink}>{a.title}</Text>);
    rows.push(<Text x={cols[2].x} y={y + 6} size={12} lh={20} family="mono" color={C.ink2}>{a.src}</Text>);
    rows.push(<Text x={cols[3].x} y={y + 6} size={12.5} lh={20} color={C.ink2}>{a.asset}</Text>);
    const mw = tw(a.mitre, 11, 500, 'mono') + 12;
    rows.push(<Box x={cols[4].x} y={y + 7} w={mw} h={18} r={4} fill="#1A2740" />, <Text x={cols[4].x} y={y + 7} width={mw} align="center" size={11} lh={18} weight={500} family="mono" color={C.ink2}>{a.mitre}</Text>);
    rows.push(<circle cx={cols[5].x + 3.5} cy={y + 16} r="3.5" fill={STATUS_COLOR[a.status]} />, <Text x={cols[5].x + 14} y={y + 6} size={12.5} lh={20} color={C.ink2}>{a.status}</Text>);
    rows.push(<Text x={cols[6].x + cols[6].w} y={y + 6} align="right" size={12} lh={20} color={C.muted}>{a.time}</Text>);
  });
  const vw = tw('View all', 13, 500);
  return (
    <Card D={D} b={b} title="Recent alerts" right={<><Text x={b.x + b.w - CARD_PAD - 18 - vw} y={b.y + 14} size={13} lh={20} weight={500} color={C.accent}>View all</Text><Icon name="chevronRight" x={b.x + b.w - CARD_PAD - 16} y={b.y + 16} size={16} color={C.accent} /></>}>
      <g clip-path={clip}>{rows}</g>
    </Card>
  );
}

export default function socDesign({ W = 1440, H = 960 } = {}) {
  const L = layout(W, H);
  const D = doc('SOC overview', W, H);
  const content = (
    <>
      <Sidebar L={L} D={D} />
      <TopBar L={L} D={D} />
      <Group id="KPIs">{KPIS.map((k, i) => <Kpi D={D} b={L.kpis[i]} k={k} />)}</Group>
      <ThreatMap D={D} b={L.map} />
      <Severity D={D} b={L.sev} />
      <Events D={D} b={L.events} />
      <Vectors D={D} b={L.vectors} />
      <Alerts D={D} b={L.alerts} L={L} />
    </>
  );
  return D.svg(content, C.page);
}
export { layout };
