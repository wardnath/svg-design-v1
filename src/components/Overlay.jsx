import React from 'react';
import { E } from '../pipeline.js';
import { useWidth } from '../hooks.js';
const { W_, H_, CX, CY } = E.geom;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

/* Overlays sit on light and dark UI renders alike, so their colours are fixed. */
export const OV = { major: '#D03B3B', minor: '#E39400', ok: '#0E9F0E', design: '#0087B8', build: '#C2187A', sel: '#0F1318' };
export function colorOf(f) {
  if (f.type === 'missing' || f.type === 'frame-missing') return OV.design;
  if (f.type === 'extra' || f.type === 'frame-extra') return OV.build;
  return f.level === 'major' ? OV.major : f.level === 'minor' ? OV.minor : OV.ok;
}
const r0 = Math.round;
export function shortTag(f) {
  switch (f.type) {
    case 'missing': return 'missing';
    case 'extra': return 'extra';
    case 'frame-missing': return 'no frame';
    case 'frame-extra': return 'extra frame';
    case 'pixel': return '';
    case 'position': {
      const r = f.decomp.residual;
      return [Math.abs(r.dy) >= 2 ? (r.dy > 0 ? '↓' : '↑') + r0(Math.abs(r.dy)) : '', Math.abs(r.dx) >= 2 ? (r.dx > 0 ? '→' : '←') + r0(Math.abs(r.dx)) : ''].filter(Boolean).join(' ');
    }
    case 'size': {
      const n = f.size && f.size.note;
      if (!n) return 'size';
      if (/^line (longer|shorter)/.test(n)) return n.startsWith('line longer') ? 'longer line' : 'shorter line';
      if (/^words rearranged/.test(n)) return 'reordered';
      if (/^text set (larger|smaller)/.test(n)) return n.match(/^text set (larger|smaller)/)[1];
      return n.replace('width ', 'w ').replace('height ', 'h ').replace('length ', 'len ').replace(/^text /, '').replace(/^glyphs /, '');
    }
    case 'color': return 'ΔE ' + r0(f.color.de);
    case 'shape': return 'shape';
    default: return '';
  }
}
const grow = (b, p) => ({ x0: b.x0 - p, y0: b.y0 - p, x1: b.x1 + p, y1: b.y1 + p });

export default function Overlay({ findings, W, H, side, sel, onSelect, spot, family, hover, setHover }) {
  const [ref, width] = useWidth();
  const k = W / Math.max(1, width || W);
  const id = React.useId().replace(/:/g, '');
  const flagged = findings.filter(f => f.level !== 'ok');
  const sorted = findings.slice().sort((a, b) => (a.level === 'ok') - (b.level === 'ok') || a.sev - b.sev);
  const tags = [];
  // an expected position can land outside the frame when its references moved a lot; draw only
  // the part inside the frame, and nothing when none of it is
  const clip = b => {
    if (!b) return null;
    const x0 = Math.max(0, b.x0), y0 = Math.max(0, b.y0), x1 = Math.min(W, b.x1), y1 = Math.min(H, b.y1);
    return x1 - x0 >= 1 && y1 - y0 >= 1 ? { x0, y0, x1, y1 } : null;
  };
  const R = (b, o, key) => <rect key={key} className="box" x={b.x0} y={b.y0} width={Math.max(1, W_(b))} height={Math.max(1, H_(b))} rx={3 * k} fill="none" vectorEffect="non-scaling-stroke" {...o} />;
  const groups = sorted.map(f => {
    const col = colorOf(f);
    const isSel = f.id === sel, isHover = f.id === hover;
    const sw = (f.level === 'major' ? 2.5 : f.level === 'minor' ? 1.75 : 1) + (isSel || isHover ? 1 : 0);
    const parts = [];
    let anchor = null;
    if (f.type === 'missing' || f.type === 'frame-missing') {
      const b = clip(side === 'design' ? f.dBox : (f.eBox || f.dBox));
      if (b && (side !== 'build' || f.eBox)) { parts.push(R(b, { fill: 'rgba(0,135,184,0.10)', stroke: col, strokeWidth: sw, strokeDasharray: '6 4' }, 'b')); anchor = b; }
    } else if (f.type === 'extra' || f.type === 'frame-extra') {
      if (side !== 'design') { parts.push(R(f.mBox, { fill: 'rgba(194,24,122,0.10)', stroke: col, strokeWidth: sw, strokeDasharray: '6 4' }, 'b')); anchor = f.mBox; }
    } else if (f.type === 'pixel') {
      parts.push(R(f.mBox, { stroke: col, strokeWidth: 1.25 }, 'b')); anchor = f.mBox;
    } else {
      const b = side === 'design' ? f.dBox : f.mBox;
      const ok = f.level === 'ok';
      const eb = clip(f.eBox);
      if (side === 'diff' && !ok && eb) {
        const rr = f.decomp.residual;
        const moved = Math.hypot(rr.dx, rr.dy) >= 2;
        if (moved || f.issues.includes('size')) parts.push(R(eb, { stroke: OV.design, strokeWidth: 1.25, strokeDasharray: '4 3' }, 'e'));
        const a = { x: CX(eb), y: CY(eb) }, z = { x: CX(f.mBox), y: CY(f.mBox) };
        if (moved && Math.hypot(z.x - a.x, z.y - a.y) > 6 * k) parts.push(<line key="l" x1={a.x} y1={a.y} x2={z.x} y2={z.y} stroke={col} strokeWidth="1.75" vectorEffect="non-scaling-stroke" markerEnd={`url(#${id}-ah-${f.level})`} />);
      }
      parts.push(R(b, { fill: ok ? 'none' : f.level === 'major' ? 'rgba(208,59,59,0.12)' : 'rgba(227,148,0,0.12)', stroke: col, strokeWidth: sw, strokeOpacity: ok ? 0.65 : 1 }, 'b'));
      anchor = ok ? null : b;
    }
    if ((isSel || isHover) && anchor) parts.push(R(grow(anchor, 5 * k), { stroke: OV.sel, strokeWidth: 1.5, strokeDasharray: '2 3' }, 's'));
    if (anchor && (f.level === 'major' || isSel || (f.level === 'minor' && family === 'box')) && side !== 'design') {
      const t = shortTag(f);
      if (t) tags.push({ f, t, b: anchor, col });
    }
    return (
      <g key={f.id} className="hit" onClick={e => { e.stopPropagation(); onSelect(f.id); }} onMouseEnter={() => setHover(f.id)} onMouseLeave={() => setHover(null)}>
        {parts}<title>{`${f.title} · ${f.name}`}</title>
      </g>
    );
  });
  // constant-size tags, placed most severe first just above or below their box and kept inside
  // the frame; a tag with no free spot nearby is dropped (its box and tooltip remain)
  const placed = [];
  const byRank = tags.slice().sort((a, b) => (b.f.id === sel) - (a.f.id === sel) || b.f.sev - a.f.sev);
  const tagEls = byRank.map(({ f, t, b, col }) => {
    const fs = 11 * k, w = (t.length * 6.9 + 10) * k, h = 17 * k, step = h + 2 * k;
    const x = clamp(b.x0, 0, W - w), up = b.y0 - h - 3 * k, down = b.y1 + 3 * k;
    const free = y => y >= 0 && y + h <= H && !placed.some(p => x < p.x + p.w && x + w > p.x && y < p.y + p.h && y + h > p.y);
    let y = null;
    for (let i = 0; i < 3 && y === null; i++) for (const c of [up - i * step, down + i * step]) if (y === null && free(c)) y = c;
    if (y === null) {
      if (f.id !== sel) return null;
      y = clamp(up, 0, H - h);
    }
    placed.push({ x, y, w, h });
    return (
      <g key={'t' + f.id} pointerEvents="none">
        <rect x={x} y={y} width={w} height={h} rx={3 * k} fill={col} />
        <text x={x + 5 * k} y={y + 12.2 * k} fontSize={fs} fontFamily="JetBrains Mono, ui-monospace, Menlo, monospace" fontWeight="600" fill="#fff">{t}</text>
      </g>
    );
  });
  let mask = null, dims = null;
  if (side === 'diff') {
    const on = spot && flagged.length > 0;
    const maskRef = on ? `url(#${id}-m)` : undefined;
    if (on) {
      mask = (
        <mask id={`${id}-m`}>
          <rect x={-10} y={-10} width={W + 20} height={H + 20} fill="#fff" />
          {flagged.flatMap(f => [f.mBox, f.eBox].filter(Boolean).map((b, i) => <rect key={f.id + '-' + i} x={b.x0 - 10 * k} y={b.y0 - 10 * k} width={W_(b) + 20 * k} height={H_(b) + 20 * k} rx={6 * k} fill="#000" />))}
        </mask>
      );
    }
    dims = (
      <>
        <rect x={0} y={0} width={W} height={H} fill="rgba(255,255,255,0.45)" mask={maskRef} pointerEvents="none" />
        {on ? <rect x={0} y={0} width={W} height={H} fill="rgba(15,19,24,0.36)" mask={maskRef} pointerEvents="none" /> : null}
      </>
    );
  }
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={side === 'diff' ? 'Findings over the build' : side === 'design' ? 'Design overlay' : 'Build overlay'}>
      <defs>
        {Object.entries({ major: OV.major, minor: OV.minor, ok: OV.ok }).map(([nm, c]) => (
          <marker key={nm} id={`${id}-ah-${nm}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
            <path d="M0 0L10 5L0 10Z" fill={c} transform={`translate(8 5) scale(${k}) translate(-8 -5)`} />
          </marker>
        ))}
        {mask}
      </defs>
      {dims}
      {groups}
      {tagEls}
    </svg>
  );
}
