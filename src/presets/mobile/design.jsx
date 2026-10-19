/** @jsx h */
/** @jsxFrag Fragment */
/* Mobile security app home screen as a Figma frame exported to SVG. */
import { h, Fragment, doc, Text, Box, Icon, Group, tw, num } from '../../design-kit/index.js';
import { layout, PAGE, SIDE, STATUS_H } from './layout.js';
import { USER, STATUS, ACTIONS, ALERTS, TABS, C } from './data.js';

function StatusBar({ L }) {
  const r = L.w - 24;
  return (
    <Group id="Status bar">
      <Text x={30} y={14} size={15} lh={20} weight={600} color={C.ink}>9:41</Text>
      {[0, 1, 2, 3].map(i => <rect x={r - 66 + i * 5} y={26 - (i + 1) * 3} width="3" height={(i + 1) * 3} rx="1" fill={C.ink} />)}
      <Icon name="wifi" x={r - 44} y={15} size={16} color={C.ink} sw={2.2} />
      <rect x={r - 25} y="16.5" width="22" height="11" rx="3" stroke={C.ink} strokeOpacity="0.4" />
      <rect x={r - 23} y="18.5" width="16" height="7" rx="1.5" fill={C.ink} />
    </Group>
  );
}

function Greeting({ L }) {
  const y = L.head.y;
  return (
    <Group id="Greeting">
      <circle cx={SIDE + 20} cy={y + 22} r="20" fill="#C7D2FE" />
      <Text x={SIDE} y={y + 13} width={40} align="center" size={13} lh={18} weight={700} color="#3730A3">{USER.initials}</Text>
      <Text x={SIDE + 52} y={y + 2} size={13} lh={18} weight={400} color={C.muted}>Good morning,</Text>
      <Text x={SIDE + 52} y={y + 20} size={20} lh={24} weight={600} color={C.ink}>{USER.name}</Text>
      <circle cx={L.w - SIDE - 20} cy={y + 22} r="19.5" fill="#FFFFFF" stroke={C.line} />
      <Icon name="bell" x={L.w - SIDE - 30} y={y + 12} size={20} color={C.ink} />
      <circle cx={L.w - SIDE - 13} cy={y + 13} r="4" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1.5" />
    </Group>
  );
}

function StatusCard({ L, D }) {
  const c = L.card;
  const cx = c.x + c.w / 2, cy = c.y + c.h / 2, len = (c.w + c.h) * Math.SQRT1_2, dx = Math.SQRT1_2 * len / 2;
  const grad = D.linear(cx - dx, cy - dx, cx + dx, cy + dx, [[0, '#4F46E5'], [1, '#7C3AED']]);
  const rx = c.x + c.w - 20 - 28, ry = c.y + 20 + 28, a = Math.PI * 2 * 0.92;
  return (
    <Group id="Status card">
      <rect x={num(c.x)} y={num(c.y)} width={num(c.w)} height={c.h} rx="24" fill={grad} />
      <Box x={c.x + 20} y={c.y + 20} w={44} h={44} r={14} fill="#FFFFFF" opacity={0.18} />
      <Icon name="shieldCheck" x={c.x + 31} y={c.y + 31} size={22} color="#FFFFFF" sw={2} />
      <circle cx={rx} cy={ry} r="24" stroke="#FFFFFF" strokeOpacity="0.25" strokeWidth="6" />
      <path d={`M${num(rx)} ${num(ry - 24)}A24 24 0 1 1 ${num(rx + 24 * Math.sin(a))} ${num(ry - 24 * Math.cos(a))}`} stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />
      <Text x={rx - 24} y={ry - 10} width={48} align="center" size={15} lh={20} weight={700} color="#FFFFFF">{String(STATUS.score)}</Text>
      <Text x={c.x + 20} y={c.y + 84} size={20} lh={26} weight={600} color="#FFFFFF">{STATUS.title}</Text>
      <Text x={c.x + 20} y={c.y + 112} size={13} lh={18} weight={400} color="#E0E7FF">{STATUS.sub}</Text>
      <Box x={c.x + 20} y={c.y + 144} w={c.w - 40} h={6} r={3} fill="#FFFFFF" opacity={0.25} />
      <Box x={c.x + 20} y={c.y + 144} w={(c.w - 40) * 0.92} h={6} r={3} fill="#FFFFFF" />
    </Group>
  );
}

function Section({ x, y, w, title, link }) {
  return (
    <>
      <Text x={x} y={y} size={15} lh={20} weight={600} color={C.ink}>{title}</Text>
      <Text x={x + w} y={y + 1} align="right" size={13} lh={18} weight={500} color={C.accent}>{link}</Text>
    </>
  );
}

function Actions({ L }) {
  return (
    <Group id="Quick actions">
      <Section x={SIDE} y={L.actY} w={L.cw} title="Quick actions" link="Edit" />
      {ACTIONS.map(([icon, label, tint, bg], i) => {
        const b = L.acts[i];
        return (
          <>
            <Box x={b.x} y={b.y} w={b.w} h={b.h} r={16} fill={C.card} stroke={C.line} />
            <Box x={b.x + (b.w - 40) / 2} y={b.y + 14} w={40} h={40} r={12} fill={bg} />
            <Icon name={icon} x={b.x + (b.w - 20) / 2} y={b.y + 24} size={20} color={tint} sw={2} />
            <Text x={b.x} y={b.y + 62} width={b.w} align="center" size={12.5} lh={16} weight={500} color={C.ink2}>{label}</Text>
          </>
        );
      })}
    </Group>
  );
}

function Alerts({ L }) {
  const l = L.list;
  return (
    <Group id="Recent alerts">
      <Section x={SIDE} y={L.listY} w={L.cw} title="Recent alerts" link="See all" />
      <Box x={l.x} y={l.y} w={l.w} h={l.h} r={18} fill={C.card} stroke={C.line} />
      {ALERTS.map((a, i) => {
        const ry = l.y + i * 64;
        return (
          <>
            {i ? <rect x={num(l.x + 64)} y={ry} width={num(l.w - 64)} height="1" fill={C.line} /> : null}
            <Box x={l.x + 16} y={ry + 14} w={36} h={36} r={11} fill={a.bg} />
            <Icon name={a.icon} x={l.x + 25} y={ry + 23} size={18} color={a.tint} sw={2} />
            <Text x={l.x + 64} y={ry + 12} size={14} lh={20} weight={600} color={C.ink}>{a.title}</Text>
            <Text x={l.x + 64} y={ry + 33} size={12.5} lh={18} weight={400} color={C.muted}>{a.sub}</Text>
            <Text x={l.x + l.w - 16 - 14 - 6} y={ry + 23} align="right" size={12} lh={18} weight={400} color={C.muted}>{a.time}</Text>
            <Icon name="chevronRight" x={l.x + l.w - 16 - 14} y={ry + 25} size={14} color={C.muted} sw={2} />
          </>
        );
      })}
    </Group>
  );
}

function TabBar({ L }) {
  const t = L.tabbar;
  return (
    <Group id="Tab bar">
      <Box x={0} y={t.y} w={L.w} h={t.h} fill="#FFFFFF" />
      <rect x="0" y={t.y} width={L.w} height="1" fill={C.line} />
      {TABS.map(([icon, label, on], i) => {
        const c = L.tabs[i];
        return (
          <>
            <Icon name={icon} x={c.x + (c.w - 22) / 2} y={t.y + 10} size={22} color={on ? C.accent : C.muted} sw={2} />
            <Text x={c.x} y={t.y + 36} width={c.w} align="center" size={11} lh={14} weight={on ? 600 : 500} color={on ? C.accent : C.muted}>{label}</Text>
          </>
        );
      })}
      <Box x={(L.w - 134) / 2} y={L.H - 13} w={134} h={5} r={2.5} fill={C.ink} />
    </Group>
  );
}

export default function mobileDesign({ W = PAGE.w, H = PAGE.h } = {}) {
  const L = layout(W, H);
  const D = doc('Mobile · Home', W, H);
  return D.svg(<><StatusBar L={L} /><Greeting L={L} /><StatusCard L={L} D={D} /><Actions L={L} /><Alerts L={L} /><TabBar L={L} /></>, C.page);
}
export { layout, PAGE };
