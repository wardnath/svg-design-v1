/** @jsx h */
/** @jsxFrag Fragment */
/* Attack-surface summary, light theme, as a Figma frame exported to SVG: outlined
   text, layer ids, gradients in <defs>. Every box comes from layout(W, H), so the
   frame can be re-exported at any size the way auto layout resizes it. */
import { h, Fragment, doc, Text, Box, Icon, Group, tw, mix, num, box, points, smoothPath, areaPath, arcPath, tracks } from '../../design-kit/index.js';
import { layout, cardBody, SIDE, RAIL, PANEL, TOP, PAD, CP, CT } from './layout.js';
import { BRAND, USER, RAIL as RAIL_ITEMS, SCORE, STATS, TREND, SERVICES, SEVS, HEAT, ASSETS, ASSET_SEEN, TYPE_COLOR, riskColor, C } from './data.js';

function Card({ b, title, right, children }) {
  return (
    <Group id={`Card/${title}`}>
      <Box x={b.x} y={b.y} w={b.w} h={b.h} r={12} fill={C.card} stroke={C.line} />
      <Text x={b.x + CP} y={b.y + CT} size={14} lh={20} weight={600} color={C.ink}>{title}</Text>
      {right}
      {children}
    </Group>
  );
}
const RightNote = ({ b, children }) => <Text x={b.x + b.w - CP} y={b.y + CT} align="right" size={12} lh={20} weight={500} color={C.muted}>{children}</Text>;

function Rail({ L, D }) {
  const logo = D.linear(16, 16, 48, 48, [[0, '#6366F1'], [1, '#22D3EE']]);
  return (
    <Group id="Rail">
      <Box x={0} y={0} w={RAIL} h={L.H} fill={C.rail} />
      <rect x="16" y="16" width="32" height="32" rx="9" fill={logo} />
      <Icon name="shield" x={23} y={23} size={18} color="#FFFFFF" sw={2} />
      {RAIL_ITEMS.map(([icon, on], i) => (
        <>
          {on ? <Box x={12} y={72 + i * 48} w={40} h={40} r={10} fill={C.railOn} /> : null}
          <Icon name={icon} x={22} y={82 + i * 48} size={20} color={on ? '#A5B4FC' : '#64748B'} />
        </>
      ))}
      <circle cx="32" cy={L.H - 36} r="16" fill="#312E81" />
      <Text x={16} y={L.H - 46} width={32} align="center" size={12} lh={20} weight={700} color="#C7D2FE">{USER.initials}</Text>
    </Group>
  );
}

function Panel({ L }) {
  const out = [];
  out.push(<Box x={RAIL} y={0} w={PANEL} h={L.H} fill={C.panel} />, <rect x={SIDE - 1} width="1" height={L.H} fill={C.line} />);
  out.push(<Text x={RAIL + 20} y={18} size={16} lh={24} weight={600} color={C.ink}>Exposure</Text>);
  for (const n of L.nav) {
    out.push(<Text x={n.label.x} y={n.label.y} size={11} lh={16} weight={600} color={C.muted} ls={0.6}>{n.g.group.toUpperCase()}</Text>);
    for (const { it, b } of n.items) {
      const [icon, label, on, badge, kind] = it;
      if (on) out.push(<Box x={b.x} y={b.y} w={b.w} h={b.h} r={8} fill={C.accentSoft} />);
      out.push(<Icon name={icon} x={b.x + 12} y={b.y + 9} size={16} color={on ? C.accent : '#64748B'} />);
      out.push(<Text x={b.x + 38} y={b.y + 7} size={13} lh={20} weight={on ? 600 : 500} color={on ? '#4338CA' : C.ink2}>{label}</Text>);
      if (badge && kind === 'badge') {
        const w = Math.max(22, Math.round(tw(badge, 11, 600)) + 14);
        out.push(<Box x={b.x + b.w - 10 - w} y={b.y + 8} w={w} h={18} r={9} fill="#FEE2E2" />, <Text x={b.x + b.w - 10 - w} y={b.y + 8} width={w} align="center" size={11} lh={18} weight={600} color="#B91C1C">{badge}</Text>);
      } else if (badge) {
        out.push(<Text x={b.x + b.w - 10} y={b.y + 8} align="right" size={11.5} lh={18} weight={500} family="mono" color={C.muted}>{badge}</Text>);
      }
    }
  }
  const c = L.coverage;
  out.push(<Box x={c.x} y={c.y} w={c.w} h={c.h} r={10} fill="#F8FAFC" stroke={C.line} />);
  out.push(<Text x={c.x + 12} y={c.y + 11} size={12} lh={16} weight={500} color={C.ink2}>Scan coverage</Text>);
  out.push(<Text x={c.x + 12} y={c.y + 31} size={18} lh={24} weight={600} color={C.ink}>92%</Text>);
  out.push(<Text x={c.x + 12 + Math.round(tw('92%', 18, 600)) + 6} y={c.y + 37} size={11} lh={16} weight={400} color={C.muted}>of known assets</Text>);
  out.push(<Box x={c.x + 12} y={c.y + 64} w={c.w - 24} h={6} r={3} fill={C.track} />, <Box x={c.x + 12} y={c.y + 64} w={(c.w - 24) * 0.92} h={6} r={3} fill="#10B981" />);
  return <Group id="Section panel">{out}</Group>;
}

function Header({ L }) {
  const hd = L.header, x0 = SIDE;
  const titleW = tw('Attack surface summary', 18, 600);
  const sx = x0 + PAD + titleW + 16;
  const segs = [];
  let x = hd.seg.x + 4;
  ['7d', '30d', '90d'].forEach((t, i) => {
    const w = hd.segW[i];
    if (i === 1) segs.push(<Box x={x} y={hd.seg.y + 4} w={w} h={24} r={6} fill="#FFFFFF" stroke={C.line2} />);
    segs.push(<Text x={x} y={hd.seg.y + 6} width={w} align="center" size={12.5} lh={20} weight={600} color={i === 1 ? C.ink : C.ink2}>{t}</Text>);
    x += w;
  });
  return (
    <Group id="Header">
      <Box x={x0} y={0} w={L.W - x0} h={TOP} fill="#FFFFFF" />
      <rect x={x0} y={TOP - 1} width={L.W - x0} height="1" fill={C.line} />
      <Text x={x0 + PAD} y={19} size={18} lh={26} weight={600} color={C.ink}>Attack surface summary</Text>
      <circle cx={sx + 4} cy={32} r="4" fill="#10B981" />
      <Text x={sx + 14} y={22} size={12.5} lh={20} weight={400} color={C.muted}>Scanned 4 min ago</Text>
      <Box x={hd.seg.x} y={hd.seg.y} w={hd.seg.w} h={32} r={8} fill="#F1F4F9" />
      {segs}
      <Box x={hd.export.x} y={hd.export.y} w={hd.export.w} h={36} r={8} fill="#FFFFFF" stroke={C.line2} />
      <Icon name="download" x={hd.export.x + 12} y={hd.export.y + 10} size={16} color={C.ink2} />
      <Text x={hd.export.x + 36} y={hd.export.y + 8} size={13} lh={20} weight={600} color={C.ink}>Export</Text>
      <Box x={hd.scan.x} y={hd.scan.y} w={hd.scan.w} h={36} r={8} fill={C.accent} />
      <Icon name="radar" x={hd.scan.x + 12} y={hd.scan.y + 10} size={16} color="#FFFFFF" />
      <Text x={hd.scan.x + 36} y={hd.scan.y + 8} size={13} lh={20} weight={600} color="#FFFFFF">Run scan</Text>
    </Group>
  );
}

function ScoreTile({ t }) {
  const cx = t.x + 18 + 50, cy = t.y + 46 + 50, r = 50;
  const a0 = -Math.PI / 2, a1 = a0 + Math.PI * (SCORE.value / 100);
  const rx = t.x + 138;
  const pw = Math.round(tw(SCORE.label, 12, 600)) + 20;
  return (
    <Group id="Tile/Exposure score">
      <Box x={t.x} y={t.y} w={t.w} h={t.h} r={12} fill={C.card} stroke={C.line} />
      <Text x={t.x + 18} y={t.y + 16} size={13} lh={18} weight={500} color={C.ink2}>Exposure score</Text>
      <path d={arcPath(cx, cy, r - 10, r, -Math.PI / 2, Math.PI / 2)} fill={C.track} />
      <path d={arcPath(cx, cy, r - 10, r, a0, a1)} fill="#F97316" />
      <Text x={t.x + 18} y={t.y + 66} width={100} align="center" size={26} lh={30} weight={600} color={C.ink} ls={-0.3}>{String(SCORE.value)}</Text>
      <Text x={t.x + 18} y={t.y + 100} width={100} align="center" size={11} lh={14} weight={400} color={C.muted}>out of 100</Text>
      <Box x={rx} y={t.y + 50} w={pw} h={22} r={11} fill="#FFEDD5" />
      <Text x={rx} y={t.y + 51} width={pw} align="center" size={12} lh={20} weight={600} color="#C2410C">{SCORE.label}</Text>
      <Icon name="trendUp" x={rx} y={t.y + 84} size={14} color="#DC2626" sw={2} />
      <Text x={rx + 18} y={t.y + 81} size={13} lh={20} weight={600} color="#DC2626">{SCORE.delta}</Text>
      <Text x={rx} y={t.y + 101} size={12} lh={16} weight={400} color={C.muted}>{SCORE.note}</Text>
    </Group>
  );
}

function ringArc(cx, cy, r, f) {
  const a = Math.PI * 2 * Math.min(0.999, f);
  const x = cx + r * Math.sin(a), y = cy - r * Math.cos(a);
  return `M${num(cx)} ${num(cy - r)}A${num(r)} ${num(r)} 0 ${a > Math.PI ? 1 : 0} 1 ${num(x)} ${num(y)}`;
}

function StatTile({ t, s }) {
  const cx = t.x + t.w - 18 - 24, cy = t.y + 54 + 24;
  return (
    <Group id={`Tile/${s.label}`}>
      <Box x={t.x} y={t.y} w={t.w} h={t.h} r={12} fill={C.card} stroke={C.line} />
      <Text x={t.x + 18} y={t.y + 16} size={13} lh={18} weight={500} color={C.ink2}>{s.label}</Text>
      <Text x={t.x + 18} y={t.y + 44} size={26} lh={32} weight={600} color={C.ink} ls={-0.3}>{s.value}</Text>
      <Text x={t.x + 18} y={t.y + 88} size={12} lh={16} weight={500} color={s.subColor}>{s.sub}</Text>
      <circle cx={cx} cy={cy} r="21" stroke={C.track} strokeWidth="6" />
      <path d={ringArc(cx, cy, 21, s.ring)} stroke={s.ringColor} strokeWidth="6" strokeLinecap="round" />
      <Text x={cx - 24} y={cy - 8} width={48} align="center" size={11} lh={16} weight={600} color={C.ink}>{`${Math.round(s.ring * 100)}%`}</Text>
    </Group>
  );
}

function Trend({ D, b }) {
  const body = cardBody(b);
  const plot = box(body.x + 40, body.y + 8, body.w - 40, body.h - 8 - 24);
  const out = [];
  TREND.ylabels.forEach((t, i) => {
    const y = plot.y + (i / 3) * plot.h;
    out.push(<rect x={plot.x} y={y} width={plot.w} height="1" fill={i === 3 ? C.line2 : C.line} />);
    out.push(<Text x={body.x + 30} y={y - 8} align="right" size={11} lh={16} family="mono" color={C.muted}>{t}</Text>);
  });
  for (const s of TREND.series) {
    const pts = points(s.v, plot, 0, TREND.max);
    if (s.area) out.push(<path d={areaPath(pts, plot.y + plot.h)} fill={D.linear(plot.x, plot.y, plot.x, plot.y + plot.h, [[0, s.color, 0.22], [1, s.color, 0]])} />);
    out.push(<path d={smoothPath(pts)} stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />);
  }
  TREND.xlabels.forEach((t, i) => {
    const x = plot.x + ((i * 7) / (TREND.days - 1)) * plot.w;
    out.push(<Text x={x} y={plot.y + plot.h + 8} align="center" size={11} lh={16} color={C.muted}>{t}</Text>);
  });
  let lx = b.x + b.w - CP;
  const leg = [];
  for (let i = TREND.series.length - 1; i >= 0; i--) {
    const s = TREND.series[i];
    lx -= tw(s.name, 12, 500);
    leg.push(<Text x={lx} y={b.y + CT} size={12} lh={20} weight={500} color={C.ink2}>{s.name}</Text>);
    lx -= 6 + 8;
    leg.push(<circle cx={lx + 4} cy={b.y + CT + 10} r="4" fill={s.color} />);
    lx -= 16;
  }
  return <Card b={b} title="Exposure trend" right={leg}>{out}</Card>;
}

function Services({ b, tight }) {
  const body = cardBody(b);
  const pitch = tight ? 38 : 46;
  return (
    <Card b={b} title="Exposed services" right={<RightNote b={b}>by port</RightNote>}>
      {SERVICES.map(([port, name, n, col], i) => {
        const y = body.y + i * pitch;
        const bw = Math.round(tw(port, 11, 500, 'mono')) + 12;
        return (
          <>
            <Box x={body.x} y={y} w={bw} h={18} r={4} fill="#F1F5F9" />
            <Text x={body.x} y={y} width={bw} align="center" size={11} lh={18} weight={500} family="mono" color={C.ink2}>{port}</Text>
            <Text x={body.x + bw + 10} y={y - 1} size={13} lh={20} weight={500} color={C.ink}>{name}</Text>
            <Text x={body.x + body.w} y={y} align="right" size={12} lh={18} weight={600} family="mono" color={C.ink}>{String(n)}</Text>
            <Box x={body.x} y={y + 26} w={body.w} h={6} r={3} fill={C.track} />
            <Box x={body.x} y={y + 26} w={(body.w * n) / 420} h={6} r={3} fill={col} />
          </>
        );
      })}
    </Card>
  );
}

function Heatmap({ b }) {
  const body = cardBody(b);
  const cols = tracks(body.x, body.w, [104, '1fr', '1fr', '1fr', '1fr'], 6);
  const rows = tracks(body.y, body.h, [18, '1fr', '1fr', '1fr', '1fr', '1fr'], 6);
  const max = Math.max(...HEAT.counts.flat());
  const out = [];
  SEVS.forEach(([name], j) => out.push(<Text x={cols[j + 1].x} y={rows[0].x + 1} width={cols[j + 1].w} align="center" size={10.5} lh={16} weight={600} color={C.muted} ls={0.5}>{name.toUpperCase()}</Text>));
  HEAT.groups.forEach((g, i) => {
    const r = rows[i + 1];
    out.push(<Text x={cols[0].x} y={r.x + (r.w - 18) / 2} size={12.5} lh={18} weight={500} color={C.ink2}>{g}</Text>);
    HEAT.counts[i].forEach((n, j) => {
      const c = cols[j + 1], t = 0.1 + 0.8 * (n / max);
      out.push(<Box x={c.x} y={r.x} w={c.w} h={r.w} r={6} fill={mix('#FFFFFF', SEVS[j][1], t)} />);
      out.push(<Text x={c.x} y={r.x + (r.w - 18) / 2} width={c.w} align="center" size={12} lh={18} weight={600} family="mono" color={t > 0.5 ? '#FFFFFF' : C.ink}>{String(n)}</Text>);
    });
  });
  return <Card b={b} title="Findings by asset group" right={<RightNote b={b}>open findings</RightNote>}>{out}</Card>;
}

function Assets({ b, L }) {
  const body = cardBody(b);
  const cols = L.tableCols;
  const heads = ['ASSET', 'TYPE', 'FINDINGS', 'EXPOSURE', 'LAST SEEN'];
  const out = [];
  heads.forEach((t, i) => out.push(<Text x={i === 4 ? cols[i].x + cols[i].w : cols[i].x} y={body.y + 2} align={i === 4 ? 'right' : 'left'} size={11} lh={16} weight={600} color={C.muted} ls={0.5}>{t}</Text>));
  ASSETS.forEach((a, r) => {
    const y = body.y + 26 + r * 38;
    out.push(<rect x={body.x} y={y} width={body.w} height="1" fill={C.line} />);
    out.push(<Text x={cols[0].x} y={y + 9} size={12.5} lh={20} weight={500} family="mono" color={C.ink}>{a.host}</Text>);
    const [bg, fg] = TYPE_COLOR[a.type];
    const pw = Math.round(tw(a.type, 11.5, 600)) + 16;
    out.push(<Box x={cols[1].x} y={y + 9} w={pw} h={20} r={10} fill={bg} />, <Text x={cols[1].x} y={y + 9} width={pw} align="center" size={11.5} lh={20} weight={600} color={fg}>{a.type}</Text>);
    out.push(<Text x={cols[2].x} y={y + 9} size={13} lh={20} weight={600} color={C.ink}>{String(a.findings)}</Text>);
    const bw = cols[3].w - 40;
    out.push(<Box x={cols[3].x} y={y + 16} w={bw} h={6} r={3} fill={C.track} />, <Box x={cols[3].x} y={y + 16} w={(bw * a.risk) / 100} h={6} r={3} fill={riskColor(a.risk)} />);
    out.push(<Text x={cols[3].x + cols[3].w} y={y + 9} align="right" size={12} lh={20} weight={600} family="mono" color={C.ink}>{String(a.risk)}</Text>);
    out.push(<Text x={cols[4].x + cols[4].w} y={y + 9} align="right" size={12} lh={20} weight={400} color={C.muted}>{ASSET_SEEN[r]}</Text>);
  });
  const vw = tw('View all', 13, 500);
  const right = (
    <>
      <Text x={b.x + b.w - CP - 18 - vw} y={b.y + CT} size={13} lh={20} weight={500} color={C.accent}>View all</Text>
      <Icon name="chevronRight" x={b.x + b.w - CP - 16} y={b.y + CT + 2} size={16} color={C.accent} />
    </>
  );
  return <Card b={b} title="Riskiest assets" right={right}>{out}</Card>;
}

export default function asmDesign({ W = 1440, H = 960 } = {}) {
  const L = layout(W, H);
  const D = doc('Attack surface summary', W, H);
  const content = (
    <>
      <Rail L={L} D={D} />
      <Panel L={L} />
      <Header L={L} />
      <Group id="Tiles">
        <ScoreTile t={L.tiles[0]} />
        {STATS.map((s, i) => <StatTile t={L.tiles[i + 1]} s={s} />)}
      </Group>
      <Trend D={D} b={L.trend} />
      <Services b={L.services} />
      <Heatmap b={L.heat} />
      <Assets b={L.assets} L={L} />
    </>
  );
  return D.svg(content, C.page);
}
export { layout };
