import { KIND_GROUP } from './costs.js';
import { CX, CY, H_, OVL, W_ } from './geom.js';
import { DEFAULTS } from './params.js';

/* ---------------- residual attribution ---------------- */
const KIND_NAME = { container: 'Container', shape: 'Shape', image: 'Image', text: 'Text', icon: 'Icon', rule: 'Rule', root: 'Page' };
function nodeName(n) {
  if (!n) return '—';
  const k = KIND_NAME[n.kind] || n.kind;
  const s = `${Math.round(W_(n.box))}×${Math.round(H_(n.box))}`;
  if (n.kind === 'text' && n.lines > 1) return `${k} · ${n.lines} lines`;
  return `${k} ${s}`;
}
const unitName = (nodes) => nodes.length === 1 ? nodeName(nodes[0]) : `Text · ${nodes.length} blocks merged`;

function nearest(units, u, pred, score) {
  let best = null, bs = -Infinity;
  for (const v of units) if (v !== u && pred(v)) { const s = score(v); if (s > bs) { bs = s; best = v; } }
  return best;
}

/* Minimum-cost arborescence (Chu–Liu/Edmonds). Node 0 is the parent; every
   edge is "u's position is explained by reference r" with weight = the
   residual it leaves. The optimum charges each unexplained displacement
   exactly once and never lets two siblings exonerate each other. */
function edmonds(n, root, edges) {
  const inE = new Array(n).fill(null);
  for (const e of edges) if (e.to !== root && e.from !== e.to && (!inE[e.to] || e.w < inE[e.to].w)) inE[e.to] = e;
  for (let v = 0; v < n; v++) if (v !== root && !inE[v]) return null;
  const id = new Array(n).fill(-1), vis = new Array(n).fill(-1);
  let cnt = 0;
  for (let v = 0; v < n; v++) {
    let u = v;
    while (u !== root && vis[u] !== v && id[u] === -1) { vis[u] = v; u = inE[u].from; }
    if (u !== root && id[u] === -1 && vis[u] === v) {
      for (let x = inE[u].from; x !== u; x = inE[x].from) id[x] = cnt;
      id[u] = cnt++;
    }
  }
  if (!cnt) return inE;
  for (let v = 0; v < n; v++) if (id[v] === -1) id[v] = cnt++;
  const ne = [];
  for (const e of edges) {
    const a = id[e.from], b = id[e.to];
    if (a !== b) ne.push({ from: a, to: b, w: e.w - inE[e.to].w, orig: e });
  }
  const sub = edmonds(cnt, id[root], ne);
  if (!sub) return null;
  const res = inE.slice();
  for (let c = 0; c < cnt; c++) {
    if (c === id[root] || !sub[c]) continue;
    const e = sub[c].orig;
    res[e.to] = e;
  }
  return res;
}

/* Flow chains: siblings in a row (x) or column (y) linked by regular gaps, e.g. nav links,
   a card's stacked contents, a right-aligned footer group. Each chain is anchored at the end
   that moved least; only that head may take its position from the parent, and position
   propagates away from it. Off-chain references stay available, at a penalty, so strong
   evidence can still override the prior. */
function flowChains(units, near, axis, PD, PM) {
  const n = units.length;
  const next = new Int32Array(n).fill(-1), prev = new Int32Array(n).fill(-1);
  for (let k = 0; k < n; k++) {
    const j = axis === 'x' ? near[k].ri : near[k].be;
    if (j < 0) continue;
    const back = axis === 'x' ? near[j].le : near[j].ab;
    if (back !== k) continue;
    const a = units[k].db, b = units[j].db;
    const gap = axis === 'x' ? b.x0 - a.x1 : b.y0 - a.y1;
    const size = axis === 'x' ? Math.min(H_(a), H_(b)) : Math.min(H_(a), H_(b));
    if (gap <= Math.max(48, 3 * size)) { next[k] = j; prev[j] = k; }
  }
  const head = new Uint8Array(n), backward = new Uint8Array(n), linkedFwd = new Uint8Array(n), linkedBack = new Uint8Array(n);
  const rows = [];
  for (let k = 0; k < n; k++) {
    if (prev[k] >= 0) continue;
    const chain = [k];
    while (next[chain[chain.length - 1]] >= 0) chain.push(next[chain[chain.length - 1]]);
    if (chain.length === 1) { head[k] = 1; continue; }
    rows.push(chain.slice());
    const f = units[chain[0]], l = units[chain[chain.length - 1]];
    const dStart = axis === 'x'
      ? Math.min(Math.abs((f.mb.x0 - PM.x0) - (f.db.x0 - PD.x0)), Math.abs((CX(f.mb) - CX(PM)) - (CX(f.db) - CX(PD))))
      : Math.abs((f.mb.y0 - PM.y0) - (f.db.y0 - PD.y0));
    const dEnd = axis === 'x' ? Math.abs((l.mb.x1 - PM.x1) - (l.db.x1 - PD.x1)) : Math.abs((l.mb.y1 - PM.y1) - (l.db.y1 - PD.y1));
    // Both ends sit on their parent anchors (content stacked from the top, a tab bar pinned to
    // the bottom): the chain is two chains joined by a spring, the link whose gap changed most.
    // Each part is anchored at its own end and the spring is no constraint.
    let split = -1;
    if (chain.length >= 3 && dStart <= 3 && dEnd <= 3) {
      let big = 3;
      for (let i = 0; i + 1 < chain.length; i++) {
        const a = units[chain[i]], b = units[chain[i + 1]];
        const dg = Math.abs(axis === 'x' ? (b.mb.x0 - a.mb.x1) - (b.db.x0 - a.db.x1) : (b.mb.y0 - a.mb.y1) - (b.db.y0 - a.db.y1));
        if (dg > big) { big = dg; split = i; }
      }
    }
    const parts = split >= 0 ? [[chain.slice(0, split + 1), false], [chain.slice(split + 1), true]] : [[chain, dEnd + 1 < dStart]];
    if (split >= 0) next[chain[split]] = -1;
    if (typeof globalThis !== 'undefined' && globalThis.DBG_CHAINS) console.log('DBG chain', axis, chain.map(i => `${units[i].d[0].kind}@${Math.round(units[i].db.x0)},${Math.round(units[i].db.y0)}`).join(' > '), 'dStart', dStart.toFixed(1), 'dEnd', dEnd.toFixed(1), split >= 0 ? `SPLIT@${split}` : parts[0][1] ? 'REV' : '');
    for (const [part, rev] of parts) {
      head[rev ? part[part.length - 1] : part[0]] = 1;
      for (const c of part) backward[c] = rev ? 1 : 0;
      for (let i = 0; i < part.length; i++) {
        if (i > 0) linkedFwd[part[i]] = 1;                // has an in-chain predecessor
        if (i < part.length - 1) linkedBack[part[i]] = 1; // has an in-chain successor
      }
    }
  }
  return { head, backward, linkedFwd, linkedBack, next, rows };
}

function attributeLevel(units, missing, Pd, Pm, flow, extras, P0) {
  extras = extras || [];
  P0 = P0 || DEFAULTS;
  const n = units.length;
  if (!n) return;
  const PD = Pd.box, PM = Pm.box, AL = 3, PEN = 15, BACK = 2;
  const EX = [], EY = [];
  const actX = u => ({ x0: u.mb.x0, cx: CX(u.mb), x1: u.mb.x1 });
  const actY = u => ({ y0: u.mb.y0, cy: CY(u.mb), y1: u.mb.y1 });
  const add = (E, from, to, anchor, exp, name, kind, pen) => {
    const u = units[to - 1];
    const a = (E === EX ? actX(u) : actY(u))[anchor];
    // An element sitting exactly on a parent anchor is never charged; the chain prior only
    // breaks ties between imperfect explanations.
    if (kind === 'parent' && Math.abs(a - exp) <= 2) pen = 0;
    E.push({ from, to, v: a - exp, w: Math.abs(a - exp) + (pen || 0), anchor, exp, name, kind });
  };
  const nm = v => unitName(v.d).toLowerCase();
  let near = null, CXc = null, CYc = null;
  if (flow) {
    const pickNear = (k, pred, score) => {
      let best = -1, bs = -Infinity;
      units.forEach((v, j) => { if (j !== k && pred(v)) { const s = score(v); if (s > bs) { bs = s; best = j; } } });
      return best;
    };
    const xo = (a, b) => OVL(a.x0, a.x1, b.x0, b.x1) > 0.15 * Math.min(W_(a), W_(b));
    const yo = (a, b) => OVL(a.y0, a.y1, b.y0, b.y1) > 0.15 * Math.min(H_(a), H_(b));
    near = units.map((u, k) => {
      const d = u.db;
      return {
        ab: pickNear(k, v => v.db.y1 <= d.y0 + 2 && xo(v.db, d), v => v.db.y1),
        be: pickNear(k, v => v.db.y0 >= d.y1 - 2 && xo(v.db, d), v => -v.db.y0),
        le: pickNear(k, v => v.db.x1 <= d.x0 + 2 && yo(v.db, d), v => v.db.x1),
        ri: pickNear(k, v => v.db.x0 >= d.x1 - 2 && yo(v.db, d), v => -v.db.x0),
      };
    });
    CXc = flowChains(units, near, 'x', PD, PM);
    CYc = flowChains(units, near, 'y', PD, PM);
  }
  // penalty for a reference along an axis, given the unit's chain role
  const penParent = (C, k) => (C && !C.head[k] ? PEN : 0);
  const penFwd = (C, k) => (C && C.linkedFwd[k] && !C.backward[k] ? 0 : C && C.linkedFwd[k] ? BACK : PEN);
  const penBack = (C, k) => (C && C.linkedBack[k] && C.backward[k] ? 0 : C && C.linkedBack[k] ? PEN : PEN);
  units.forEach((u, k) => {
    const id = k + 1, d = u.db;
    add(EX, 0, id, 'x0', PM.x0 + (d.x0 - PD.x0), 'parent left edge', 'parent', penParent(CXc, k));
    add(EX, 0, id, 'cx', CX(PM) + (CX(d) - CX(PD)), 'parent center', 'parent', penParent(CXc, k));
    add(EX, 0, id, 'x1', PM.x1 + (d.x1 - PD.x1), 'parent right edge', 'parent', penParent(CXc, k));
    add(EY, 0, id, 'y0', PM.y0 + (d.y0 - PD.y0), 'parent top edge', 'parent', penParent(CYc, k));
    add(EY, 0, id, 'cy', CY(PM) + (CY(d) - CY(PD)), 'parent middle', 'parent', penParent(CYc, k));
    add(EY, 0, id, 'y1', PM.y1 + (d.y1 - PD.y1), 'parent bottom edge', 'parent', penParent(CYc, k));
  });
  if (flow) {
    units.forEach((u, k) => {
      const id = k + 1, d = u.db;
      const { ab, be, le, ri } = near[k];
      // A predecessor that spans this element across the flow (a full-width rule or band above
      // it, a full-height column beside it) is what it is laid out after, chain or no chain.
      const spansX = v => v.db.x0 <= d.x0 + 2 && v.db.x1 >= d.x1 - 2, spansY = v => v.db.y0 <= d.y0 + 2 && v.db.y1 >= d.y1 - 2;
      if (ab >= 0) {
        const a = units[ab], f = ab + 1;
        add(EY, f, id, 'y0', a.mb.y1 + (d.y0 - a.db.y1), `flows below ${nm(a)}`, 'flow', spansX(a) ? Math.min(BACK, penFwd(CYc, k)) : penFwd(CYc, k));
        if (Math.abs(d.x0 - a.db.x0) <= AL) add(EX, f, id, 'x0', a.mb.x0 + (d.x0 - a.db.x0), `left-aligned with ${nm(a)}`, 'align');
        if (Math.abs(CX(d) - CX(a.db)) <= AL) add(EX, f, id, 'cx', CX(a.mb) + (CX(d) - CX(a.db)), `centered on ${nm(a)}`, 'align');
        if (Math.abs(d.x1 - a.db.x1) <= AL) add(EX, f, id, 'x1', a.mb.x1 + (d.x1 - a.db.x1), `right-aligned with ${nm(a)}`, 'align');
        const gm = missing.filter(m => m.box.y0 >= a.db.y1 - 2 && m.box.y1 <= d.y0 + 2 && OVL(m.box.x0, m.box.x1, d.x0, d.x1) > 0);
        if (gm.length) {
          const top = Math.min(...gm.map(m => m.box.y0)), bot = Math.max(...gm.map(m => m.box.y1));
          add(EY, f, id, 'y0', a.mb.y1 + (top - a.db.y1), 'closes the gap of a missing element', 'collapse');
          add(EY, f, id, 'y0', a.mb.y1 + (d.y0 - bot), 'closes the gap of a missing element', 'collapse');
        }
        const ge = extras.filter(m => m.box.y0 >= a.mb.y1 - 2 && m.box.y1 <= u.mb.y0 + 2 && OVL(m.box.x0, m.box.x1, u.mb.x0, u.mb.x1) > 0);
        if (ge.length) {
          const bot = Math.max(...ge.map(m => m.box.y1));
          add(EY, f, id, 'y0', bot + (d.y0 - a.db.y1), 'flows below an extra element', 'collapse');
        }
      } else {
        const gm = missing.filter(m => m.box.y1 <= d.y0 + 2 && OVL(m.box.x0, m.box.x1, d.x0, d.x1) > 0);
        if (gm.length) {
          const top = Math.min(...gm.map(m => m.box.y0));
          add(EY, 0, id, 'y0', PM.y0 + (top - PD.y0), 'took the place of a missing element', 'collapse');
        }
        // an element inserted above the first one (a banner) pushes it down by its own height
        const ge = extras.filter(m => m.box.y1 <= u.mb.y0 + 2 && OVL(m.box.x0, m.box.x1, u.mb.x0, u.mb.x1) > 0);
        if (ge.length) {
          const top = Math.min(...ge.map(m => m.box.y0)), bot = Math.max(...ge.map(m => m.box.y1));
          add(EY, 0, id, 'y0', PM.y0 + (d.y0 - PD.y0) + (bot - top), 'pushed down by an extra element', 'collapse');
          add(EY, 0, id, 'y0', bot + (d.y0 - PD.y0), 'pushed down by an extra element', 'collapse');
        }
      }
      if (be >= 0) {
        const b = units[be], f = be + 1;
        add(EY, f, id, 'y1', b.mb.y0 - (b.db.y0 - d.y1), `sits above ${nm(b)}`, 'flow', penBack(CYc, k));
        if (Math.abs(d.x0 - b.db.x0) <= AL) add(EX, f, id, 'x0', b.mb.x0 + (d.x0 - b.db.x0), `left-aligned with ${nm(b)}`, 'align', BACK);
        if (Math.abs(CX(d) - CX(b.db)) <= AL) add(EX, f, id, 'cx', CX(b.mb) + (CX(d) - CX(b.db)), `centered on ${nm(b)}`, 'align', BACK);
        if (Math.abs(d.x1 - b.db.x1) <= AL) add(EX, f, id, 'x1', b.mb.x1 + (d.x1 - b.db.x1), `right-aligned with ${nm(b)}`, 'align', BACK);
      }
      if (le >= 0) {
        const l = units[le], f = le + 1;
        add(EX, f, id, 'x0', l.mb.x1 + (d.x0 - l.db.x1), `follows ${nm(l)}`, 'flow', spansY(l) ? Math.min(BACK, penFwd(CXc, k)) : penFwd(CXc, k));
        const gx = extras.filter(m => m.box.x0 >= l.mb.x1 - 2 && m.box.x1 <= u.mb.x0 + 2 && OVL(m.box.y0, m.box.y1, u.mb.y0, u.mb.y1) > 0);
        if (gx.length) add(EX, f, id, 'x0', Math.max(...gx.map(m => m.box.x1)) + (d.x0 - l.db.x1), 'follows an extra element', 'collapse');
        if (Math.abs(d.y0 - l.db.y0) <= AL) add(EY, f, id, 'y0', l.mb.y0 + (d.y0 - l.db.y0), `top-aligned with ${nm(l)}`, 'align');
        if (Math.abs(CY(d) - CY(l.db)) <= AL) add(EY, f, id, 'cy', CY(l.mb) + (CY(d) - CY(l.db)), `middle-aligned with ${nm(l)}`, 'align');
        if (Math.abs(d.y1 - l.db.y1) <= AL) add(EY, f, id, 'y1', l.mb.y1 + (d.y1 - l.db.y1), `bottom-aligned with ${nm(l)}`, 'align');
        const gm = missing.filter(m => m.box.x0 >= l.db.x1 - 2 && m.box.x1 <= d.x0 + 2 && OVL(m.box.y0, m.box.y1, d.y0, d.y1) > 0);
        if (gm.length) {
          const lf = Math.min(...gm.map(m => m.box.x0)), rt = Math.max(...gm.map(m => m.box.x1));
          add(EX, f, id, 'x0', l.mb.x1 + (lf - l.db.x1), 'closes the gap of a missing element', 'collapse');
          add(EX, f, id, 'x0', l.mb.x1 + (d.x0 - rt), 'closes the gap of a missing element', 'collapse');
        }
      }
      const yov = m => OVL(m.box.y0, m.box.y1, d.y0, d.y1) > 0, xov = m => OVL(m.box.x0, m.box.x1, d.x0, d.x1) > 0;
      const yovM = m => OVL(m.box.y0, m.box.y1, u.mb.y0, u.mb.y1) > 0;
      if (le < 0) {
        // a missing element used to sit between the parent's left edge and this one
        const gm = missing.filter(m => m.box.x1 <= d.x0 + 2 && yov(m));
        if (gm.length) add(EX, 0, id, 'x0', PM.x0 + (Math.min(...gm.map(m => m.box.x0)) - PD.x0), 'took the place of a missing element', 'collapse');
        // an element inserted before the first one pushes it right
        const ge = extras.filter(m => m.box.x1 <= u.mb.x0 + 2 && yovM(m));
        if (ge.length) {
          const lf = Math.min(...ge.map(m => m.box.x0)), rt = Math.max(...ge.map(m => m.box.x1));
          add(EX, 0, id, 'x0', PM.x0 + (d.x0 - PD.x0) + (rt - lf), 'pushed right by an extra element', 'collapse');
          add(EX, 0, id, 'x0', rt + (d.x0 - PD.x0), 'pushed right by an extra element', 'collapse');
        }
      }
      if (ri < 0) {
        // right-aligned group that lost its last member: this one moves into its place
        const gm = missing.filter(m => m.box.x0 >= d.x1 - 2 && yov(m));
        if (gm.length) add(EX, 0, id, 'x1', PM.x1 + (Math.max(...gm.map(m => m.box.x1)) - PD.x1), 'took the place of a missing element', 'collapse');
        // ... or gained one at its end: this one moves left by the newcomer and a row gap
        const ge = extras.filter(m => m.box.x0 >= u.mb.x1 - 2 && yovM(m));
        if (ge.length) {
          const g = le >= 0 ? Math.max(0, d.x0 - units[le].db.x1) : 8;
          add(EX, 0, id, 'x1', Math.min(...ge.map(m => m.box.x0)) - g, 'pushed left by an extra element', 'collapse');
        }
      }
      if (be < 0) {
        const gm = missing.filter(m => m.box.y0 >= d.y1 - 2 && xov(m));
        if (gm.length) add(EY, 0, id, 'y1', PM.y1 + (Math.max(...gm.map(m => m.box.y1)) - PD.y1), 'took the place of a missing element', 'collapse');
      }
      if (ri >= 0) {
        const r = units[ri], f = ri + 1;
        add(EX, f, id, 'x1', r.mb.x0 - (r.db.x0 - d.x1), `precedes ${nm(r)}`, 'flow', penBack(CXc, k));
        const gm = missing.filter(m => m.box.x0 >= d.x1 - 2 && m.box.x1 <= r.db.x0 + 2 && yov(m));
        if (gm.length) {
          const lf = Math.min(...gm.map(m => m.box.x0)), rt = Math.max(...gm.map(m => m.box.x1));
          add(EX, f, id, 'x1', r.mb.x0 - (r.db.x0 - rt), 'closes the gap of a missing element', 'collapse');
          add(EX, f, id, 'x1', r.mb.x0 - (lf - d.x1), 'closes the gap of a missing element', 'collapse');
        }
        if (Math.abs(d.y0 - r.db.y0) <= AL) add(EY, f, id, 'y0', r.mb.y0 + (d.y0 - r.db.y0), `top-aligned with ${nm(r)}`, 'align', BACK);
        if (Math.abs(CY(d) - CY(r.db)) <= AL) add(EY, f, id, 'cy', CY(r.mb) + (CY(d) - CY(r.db)), `middle-aligned with ${nm(r)}`, 'align', BACK);
        if (Math.abs(d.y1 - r.db.y1) <= AL) add(EY, f, id, 'y1', r.mb.y1 + (d.y1 - r.db.y1), `bottom-aligned with ${nm(r)}`, 'align', BACK);
      }
    });
  }
  if (flow) {
    // Centered in the free span between two bounds (a neighbour or the parent's edge on each
    // side): a map or a chart centered in the space left over by a sidebar column follows that
    // column. Only offered when the design shows it centered there with room to spare.
    units.forEach((u, k) => {
      const id = k + 1, d = u.db;
      const { ab, be, le, ri } = near[k];
      const span = (lo, hi, isX) => {
        if (lo < 0 && hi < 0) return;
        const L = lo >= 0 ? units[lo] : null, R2 = hi >= 0 ? units[hi] : null;
        const ld = L ? (isX ? L.db.x1 : L.db.y1) : (isX ? PD.x0 : PD.y0);
        const lm = L ? (isX ? L.mb.x1 : L.mb.y1) : (isX ? PM.x0 : PM.y0);
        const rd = R2 ? (isX ? R2.db.x0 : R2.db.y0) : (isX ? PD.x1 : PD.y1);
        const rm = R2 ? (isX ? R2.mb.x0 : R2.mb.y0) : (isX ? PM.x1 : PM.y1);
        const c = isX ? CX(d) : CY(d), size = isX ? W_(d) : H_(d);
        const off = c - (ld + rd) / 2;
        if (Math.abs(off) > AL || rd - ld < size + 16) return;
        // the bound that moved more is the one this position depends on
        const from = !L ? hi + 1 : !R2 ? lo + 1 : Math.abs(rm - rd) >= Math.abs(lm - ld) ? hi + 1 : lo + 1;
        const nmB = (U, side) => (U ? nm(U) : `the parent's ${side} edge`);
        add(isX ? EX : EY, from, id, isX ? 'cx' : 'cy', (lm + rm) / 2 + off,
          `centered between ${nmB(L, isX ? 'left' : 'top')} and ${nmB(R2, isX ? 'right' : 'bottom')}`, 'center', BACK);
      };
      span(le, ri, true);
      span(ab, be, false);
    });
  }
  const cx = edmonds(n + 1, 0, EX), cy = edmonds(n + 1, 0, EY);
  if (flow) {
    // Every in-chain gap is a layout constraint. If one changed beyond tolerance and neither
    // neighbour's chosen reference runs through it, charge the element after it (in the chain's
    // direction) through that gap, so a coincidence elsewhere cannot hide it.
    const enforce = (C, E, chosen, flowWord, backWord) => {
      for (let k = 0; k < n; k++) {
        const j = C.next[k];
        if (j < 0) continue;
        const succ = C.backward[k] ? k : j, pred = C.backward[k] ? j : k;
        const uses = e => e && e.from === pred + 1 && e.to === succ + 1 && e.kind === 'flow';
        const usesRev = e => e && e.from === succ + 1 && e.to === pred + 1 && e.kind === 'flow';
        if (uses(chosen[succ + 1]) || usesRev(chosen[pred + 1])) continue;
        // Only when the element is explained by the neighbour on its far side (against the
        // chain's direction); parent anchors and alignments are legitimate (flex spacers, pins).
        const cur = chosen[succ + 1];
        if (!cur || cur.kind !== 'flow' || cur.from === pred + 1) continue;
        const g = E.find(e => e.from === pred + 1 && e.to === succ + 1 && e.kind === 'flow');
        const tol = P0.posTol * (KIND_GROUP[units[succ].d[0].kind] === 'ink' ? P0.textPosMul : 1);
        if (g && Math.abs(g.v) > tol && Math.abs(g.v) > Math.abs(cur.v) + tol) {
          chosen[succ + 1] = Object.assign({}, g, { name: g.name + ' (gap changed)' });
        }
      }
    };
    enforce(CXc, EX, cx); enforce(CYc, EY, cy);
    // A row (column) of boxes whose gaps all changed by the same amount has a spacing
    // mismatch, even when flexible widths absorbed it and every box still meets a parent
    // anchor. Text rows are exempt: there the widths change with the font and the gaps of
    // a spread-out row change with them. Charged once, on the box after the first gap.
    const uniform = (C, E, chosen, isX) => {
      // every full row or column, before any split at a spring, in its natural order
      for (const chain of C.rows) {
        if (chain.length < 3 || !chain.every(i => units[i].d.every(x => KIND_GROUP[x.kind] === 'box') && units[i].m.every(x => KIND_GROUP[x.kind] === 'box'))) continue;
        const dg = [];
        for (let i = 1; i < chain.length; i++) {
          const a = units[chain[i - 1]], b = units[chain[i]];
          dg.push(isX ? (b.mb.x0 - a.mb.x1) - (b.db.x0 - a.db.x1) : (b.mb.y0 - a.mb.y1) - (b.db.y0 - a.db.y1));
        }
        const mean = dg.reduce((p, q) => p + q, 0) / dg.length;
        if (Math.abs(mean) <= P0.posTol || dg.some(v => Math.abs(v - mean) > 2)) continue;
        const succ = chain[1], g = E.find(e => e.from === chain[0] + 1 && e.to === succ + 1 && e.kind === 'flow');
        if (g && Math.abs(g.v) > Math.abs(chosen[succ + 1].v)) {
          const gapNote = `${dg.length === 2 ? 'Both' : `All ${dg.length}`} gaps in the ${isX ? 'row' : 'column'} ${Math.round(Math.abs(mean))}px ${mean > 0 ? 'wider' : 'narrower'}`;
          chosen[succ + 1] = Object.assign({}, g, { name: g.name + ` (all ${dg.length} gaps ${mean > 0 ? 'wider' : 'narrower'} by ${Math.round(Math.abs(mean))}px)`, gapNote });
        }
      }
    };
    uniform(CXc, EX, cx, true); uniform(CYc, EY, cy, false);
  }
  units.forEach((u, k) => {
    u.rx = cx[k + 1]; u.ry = cy[k + 1];
    u.rx.refUnit = u.rx.from ? units[u.rx.from - 1] : null;
    u.ry.refUnit = u.ry.from ? units[u.ry.from - 1] : null;
  });
  // Per-edge explanations: the smallest residual any reference leaves on each edge, counting
  // only references that do not themselves hang off this unit (a legend that follows a donut
  // cannot also excuse the donut's size). A box whose two edges along an axis are both
  // explained is sized by its layout, not by a defect of its own.
  if (flow) {
    units.forEach((u, k) => {
      const id = k + 1;
      // the neighbour must itself be pinned to the parent: a label that merely flows below
      // a row of tiles moves with them and cannot excuse their growth
      // ... and a box must have kept its own size on that axis (siblings that all grew line up
      // with each other); a text's size follows its font and is judged on its own
      const stable = (v, isX) => units[v].d.some(x => KIND_GROUP[x.kind] === 'ink') ||
        Math.abs(isX ? W_(units[v].mb) - W_(units[v].db) : H_(units[v].mb) - H_(units[v].db)) <= Math.max(2, 0.03 * (isX ? W_(units[v].db) : H_(units[v].db)));
      const indep = (e, chosen, isX) => e.from === 0 || (chosen[e.from] && chosen[e.from].kind === 'parent' && chosen[e.from].from === 0 && stable(e.from - 1, isX));
      const best = (E, chosen, anchor, isX) => {
        let m = Infinity;
        for (const e of E) if (e.to === id && e.anchor === anchor && e.kind !== 'center' && indep(e, chosen, isX)) m = Math.min(m, Math.abs(e.v));
        return m;
      };
      u.edges = { x0: best(EX, cx, 'x0', true), x1: best(EX, cx, 'x1', true), y0: best(EY, cy, 'y0', false), y1: best(EY, cy, 'y1', false) };
    });
  }
}

export { KIND_NAME, nodeName, unitName, nearest, edmonds, flowChains, attributeLevel };
