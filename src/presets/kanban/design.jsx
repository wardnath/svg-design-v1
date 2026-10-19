/** @jsx h */
/** @jsxFrag Fragment */
/* Remediation board as a Figma frame exported to SVG, laid out by layout(W, H). */
import { h, Fragment, doc, Text, Box, Icon, Group, tw } from '../../design-kit/index.js';
import { layout, PAGE_H, HEAD, CPAD } from './layout.js';
import { PROJECT, TABS, PEOPLE, FILTERS, COLUMNS, LABEL, PRI, C } from './data.js';

function Avatar({ x, y, d, who, ring }) {
  return (
    <>
      {ring ? <circle cx={x + d / 2} cy={y + d / 2} r={d / 2 + 2} fill="#FFFFFF" /> : null}
      <circle cx={x + d / 2} cy={y + d / 2} r={d / 2} fill={PEOPLE[who] || '#E5E7EB'} />
      <Text x={x} y={y + (d - 14) / 2} width={d} align="center" size={d > 24 ? 11 : 9.5} lh={14} weight={700} color="#FFFFFF">{who}</Text>
    </>
  );
}

function Header({ L }) {
  const nameW = tw(PROJECT, 16, 600);
  const av = L.avatars;
  return (
    <Group id="Header">
      <rect x="0" y={HEAD - 1} width={L.W} height="1" fill={C.line} />
      <Box x={24} y={16} w={28} h={28} r={7} fill="#DBEAFE" />
      <Icon name="layers" x={30} y={22} size={16} color={C.accent} sw={2} />
      <Text x={62} y={18} size={16} lh={24} weight={600} color={C.ink}>{PROJECT}</Text>
      <Icon name="star" x={62 + nameW + 8} y={22} size={16} color={C.muted} />
      {TABS.map((t, i) => (
        <>
          <Text x={L.tabs[i].x} y={20} size={14} lh={20} weight={500} color={i === 0 ? C.ink : C.ink2}>{t}</Text>
          {i === 0 ? <rect x={L.tabs[i].x} y={HEAD - 2} width={L.tabs[i].w} height="2" fill={C.accent} /> : null}
        </>
      ))}
      {['AK', 'MR', 'JL', 'SN'].map((p, i) => <Avatar x={av.x + i * 20} y={av.y} d={28} who={p} ring />)}
      <circle cx={av.x + 80 + 14} cy={av.y + 14} r="16" fill="#FFFFFF" />
      <circle cx={av.x + 80 + 14} cy={av.y + 14} r="14" fill="#E5E7EB" />
      <Text x={av.x + 80} y={av.y + 7} width={28} align="center" size={11} lh={14} weight={700} color={C.ink2}>+3</Text>
      <Box x={L.share.x} y={L.share.y} w={L.share.w} h={34} r={8} fill="#FFFFFF" stroke={C.line} />
      <Text x={L.share.x} y={L.share.y + 7} width={L.share.w} align="center" size={13} lh={20} weight={600} color={C.ink}>Share</Text>
      <Box x={L.newB.x} y={L.newB.y} w={L.newB.w} h={34} r={8} fill={C.accent} />
      <Icon name="plus" x={L.newB.x + 12} y={L.newB.y + 10} size={14} color="#FFFFFF" sw={2.2} />
      <Text x={L.newB.x + 32} y={L.newB.y + 7} size={13} lh={20} weight={600} color="#FFFFFF">New ticket</Text>
    </Group>
  );
}

function Toolbar({ L }) {
  const s = L.search, g = L.group;
  return (
    <Group id="Toolbar">
      <Box x={s.x} y={s.y} w={s.w} h={32} r={8} fill="#FFFFFF" stroke={C.line} />
      <Icon name="search" x={s.x + 10} y={s.y + 9} size={14} color={C.muted} />
      <Text x={s.x + 32} y={s.y + 6} size={13} lh={20} weight={400} color={C.muted}>Filter tickets</Text>
      {FILTERS.map((t, i) => {
        const b = L.filters[i];
        return (
          <>
            <Box x={b.x} y={b.y} w={b.w} h={32} r={8} fill="#FFFFFF" stroke={C.line} />
            <Text x={b.x + 12} y={b.y + 6} size={13} lh={20} weight={500} color={C.ink2}>{t}</Text>
            <Icon name="chevronDown" x={b.x + b.w - 22} y={b.y + 10} size={12} color={C.ink2} sw={2} />
          </>
        );
      })}
      <Text x={g.x} y={g.y} size={13} lh={20} weight={400} color={C.muted}>Group by</Text>
      <Text x={g.x + tw('Group by', 13) + 6} y={g.y} size={13} lh={20} weight={600} color={C.ink}>Status</Text>
      <Icon name="chevronDown" x={g.x + g.w - 12} y={g.y + 4} size={12} color={C.ink2} sw={2} />
    </Group>
  );
}

function Card({ b, k }) {
  const out = [];
  out.push(<Box x={b.x} y={b.y} w={b.w} h={b.h} r={10} fill="#FFFFFF" stroke={C.line} />);
  const x = b.x + 14;
  if (k.done) out.push(<Icon name="check" x={x} y={b.y + 15} size={14} color="#10B981" sw={2.4} />);
  out.push(<Text x={k.done ? x + 18 : x} y={b.y + 14} size={11.5} lh={16} weight={500} family="mono" color={k.done ? '#059669' : C.muted}>{k.id}</Text>);
  out.push(<Icon name="flag" x={b.x + b.w - 28} y={b.y + 15} size={14} color={PRI[k.pri]} sw={2} />);
  out.push(<Text x={x} y={b.y + 36} size={14} lh={20} weight={600} color={C.ink}>{k.title}</Text>);
  let lx = x;
  for (const [t, c] of k.labels) {
    const w = Math.round(tw(t, 11, 600)) + 14, [bg, fg] = LABEL[c];
    out.push(<Box x={lx} y={b.y + 66} w={w} h={20} r={6} fill={bg} />, <Text x={lx} y={b.y + 66} width={w} align="center" size={11} lh={20} weight={600} color={fg}>{t}</Text>);
    lx += w + 6;
  }
  let fy = b.y + 98;
  if (k.progress != null) {
    out.push(<Box x={x} y={b.y + 98} w={b.w - 28} h={4} r={2} fill={C.line} />, <Box x={x} y={b.y + 98} w={(b.w - 28) * k.progress} h={4} r={2} fill={C.accent} />);
    fy += 16;
  }
  out.push(<Avatar x={x} y={fy} d={22} who={k.who} />);
  const dw = tw(k.due, 12, 400);
  out.push(<Icon name="calendar" x={b.x + b.w - 14 - dw - 6 - 14} y={fy + 4} size={14} color={C.muted} />, <Text x={b.x + b.w - 14} y={fy + 3} align="right" size={12} lh={16} weight={400} color={C.ink2}>{k.due}</Text>);
  return <Group id={`Card/${k.id}`}>{out}</Group>;
}

function Board({ L }) {
  return (
    <Group id="Board">
      {L.cols.map(({ col, cards }, i) => {
        const c = COLUMNS[i];
        const nw = tw(c.name, 13.5, 600);
        const cw = Math.max(20, Math.round(tw(String(c.cards.length), 11.5, 600)) + 14);
        return (
          <Group id={`Column/${c.name}`}>
            <Box x={col.x} y={col.y} w={col.w} h={col.h} r={12} fill={C.col} />
            <circle cx={col.x + CPAD + 8} cy={col.y + CPAD + 18} r="4" fill={c.color} />
            <Text x={col.x + CPAD + 18} y={col.y + CPAD + 8} size={13.5} lh={20} weight={600} color={C.ink}>{c.name}</Text>
            <Box x={col.x + CPAD + 18 + nw + 8} y={col.y + CPAD + 8} w={cw} h={20} r={10} fill="#E5E7EB" />
            <Text x={col.x + CPAD + 18 + nw + 8} y={col.y + CPAD + 8} width={cw} align="center" size={11.5} lh={20} weight={600} color={C.ink2}>{String(c.cards.length)}</Text>
            <Icon name="plus" x={col.x + col.w - CPAD - 22} y={col.y + CPAD + 10} size={16} color={C.muted} sw={2} />
            {cards.map((b, j) => <Card b={b} k={c.cards[j]} />)}
          </Group>
        );
      })}
    </Group>
  );
}

export default function kanbanDesign({ W = 1440, H = PAGE_H } = {}) {
  const L = layout(W, H);
  const D = doc('Remediation board', W, H);
  return D.svg(<><Header L={L} /><Toolbar L={L} /><Board L={L} /></>, C.page);
}
export { layout, PAGE_H };
