import { mkUnit, rescue } from './align.js';
import { assign } from './assign.js';
import { attributeLevel, nearest, nodeName } from './attribute.js';
import { dE } from './color.js';
import { KIND_GROUP, emission, gapCost, parentResidual } from './costs.js';
import { AREA, GROW, H_, INTER, OVL, SHIFT, UNIONS, W_ } from './geom.js';
import { xyOrder } from './order.js';
import { LEVEL, scoreUnit } from './score.js';
import { presentInPixels } from './verify.js';

/* ---------------- tree runner ---------------- */
function frameContrast(n) {
  const c = n.fill || n.color, b = n.bg;
  return c && b ? dE(c, b) : 20;
}
/* Segmentation of two renders can fuse neighbours on one side only (four table tags read as
   one paragraph here, as four items there). An unmatched ink element that sits next to a
   matched ink unit, and that lands inside the unit's counterpart when carried by the unit's
   own offset, is folded into that unit instead of being reported as missing or extra. */
function boxGap(a, b) {
  const dx = Math.max(0, Math.max(a.x0, b.x0) - Math.min(a.x1, b.x1));
  const dy = Math.max(0, Math.max(a.y0, b.y0) - Math.min(a.y1, b.y1));
  return Math.hypot(dx, dy);
}
const sizeIoU = (a, b) => { const i = Math.min(W_(a), W_(b)) * Math.min(H_(a), H_(b)); return i / Math.max(1, W_(a) * H_(a) + W_(b) * H_(b) - i); };
function absorb(res) {
  const ink = n => KIND_GROUP[n.kind] !== 'box';
  const inkUnit = u => u.d.every(ink) && u.m.every(ink);
  for (const side of ['D', 'M']) {
    const pool = side === 'D' ? res.delD : res.insM;
    for (let k = pool.length - 1; k >= 0; k--) {
      const n = pool[k];
      if (!ink(n)) continue;
      let best = null, bestCov = 0;
      for (const u of res.units) {
        if (!inkUnit(u)) continue;
        const own = side === 'D' ? u.db : u.mb, other = side === 'D' ? u.mb : u.db;
        if (boxGap(n.box, own) > Math.max(6, 1.2 * Math.min(H_(n.box), H_(own)))) continue;
        const dx = other.x0 - own.x0, dy = other.y0 - own.y0;
        const I = INTER(SHIFT(n.box, dx, dy), GROW(other, 3));
        let cov = I ? AREA(I) / Math.max(1, AREA(n.box)) : 0;
        // or: the two pieces together have the counterpart's size, one alone does not
        const U = UNIONS([own, n.box]);
        const sim = sizeIoU(U, other), sim0 = sizeIoU(own, other);
        if (sim >= 0.75 && sim > sim0 + 0.1) cov = Math.max(cov, sim);
        if (cov > bestCov) { bestCov = cov; best = u; }
      }
      if (best && bestCov >= 0.7) {
        (side === 'D' ? best.d : best.m).push(n);
        best.db = UNIONS(best.d.map(x => x.box)); best.mb = UNIONS(best.m.map(x => x.box));
        best.absorbed = true;
        pool.splice(k, 1);
      }
    }
  }
}
function runTree(segD, segM, ctx) {
  const P = ctx.P, out = [];
  const level = (Dk, Mk, Pd, Pm, depth) => {
    let D = xyOrder(Dk), M = xyOrder(Mk), res;
    const flatD = [], flatM = [];
    for (let round = 0; round < 5; round++) {
      res = ctx.align(D, M, Pd, Pm, P);
      if (P.rescue) rescue(res, Pd, Pm, P);
      if (!P.flatten) break;
      const fd = res.delD.filter(n => n.children && n.children.length);
      const fm = res.insM.filter(n => n.children && n.children.length);
      if (!fd.length && !fm.length) break;
      flatD.push(...fd); flatM.push(...fm);
      D = xyOrder(D.flatMap(n => (fd.includes(n) ? n.children : [n])));
      M = xyOrder(M.flatMap(n => (fm.includes(n) ? n.children : [n])));
    }
    // A flattened frame none of whose contents found a partner is simply missing (or extra):
    // it is reported once, as the whole frame, not as a frame plus each of its children.
    const settle = (flat, pool, side) => {
      const matched = new Set(res.units.flatMap(u => (side === 'D' ? u.d : u.m)));
      const desc = n => { const o = []; const w = x => { for (const c of x.children || []) { o.push(c); w(c); } }; w(n); return o; };
      const whole = [];
      for (const f of flat) {
        if (whole.some(g => desc(g).includes(f))) continue;
        const ds = desc(f);
        if (!ds.some(x => matched.has(x))) whole.push(f);
      }
      const gone = new Set(whole.flatMap(desc));
      for (let k = pool.length - 1; k >= 0; k--) if (gone.has(pool[k])) pool.splice(k, 1);
      pool.push(...whole);
      return flat.filter(f => !gone.has(f) && !whole.includes(f));
    };
    const partD = settle(flatD, res.delD, 'D'), partM = settle(flatM, res.insM, 'M');
    for (const n of partD) {
      const s = frameContrast(n) > 14 ? 2.6 : 1.4;
      out.push({ type: 'frame-missing', sev: s, level: LEVEL(s), title: 'Frame missing (contents found)', name: nodeName(n), dBox: n.box, mBox: null, eBox: SHIFT(n.box, Pm.box.x0 - Pd.box.x0, Pm.box.y0 - Pd.box.y0), dNodes: [n], mNodes: [], depth });
    }
    for (const n of partM) {
      const s = frameContrast(n) > 14 ? 2.6 : 1.4;
      out.push({ type: 'frame-extra', sev: s, level: LEVEL(s), title: 'Extra frame around contents', name: nodeName(n), dBox: null, mBox: n.box, eBox: null, dNodes: [], mNodes: [n], depth });
    }
    if (ctx.flow) absorb(res);
    const units = res.units;
    // recurse first so containers know which children matched (content-explained size)
    for (const u of units) {
      if (u.d.length === 1 && u.m.length === 1 && (u.d[0].children.length || u.m[0].children.length)) {
        u.sub = level(u.d[0].children, u.m[0].children, u.d[0], u.m[0], depth + 1);
        u.kids = u.sub.units;
      }
    }
    attributeLevel(units, res.delD, Pd, Pm, ctx.flow, res.insM, P);
    for (const u of units) out.push(scoreUnit(u, Pd, Pm, ctx, depth, u.sub ? u.sub.delD : null));
    for (const n of res.delD) {
      let e = SHIFT(n.box, Pm.box.x0 - Pd.box.x0, Pm.box.y0 - Pd.box.y0);
      if (ctx.flow) {
        const a = nearest(units, null, v => v.db.y1 <= n.box.y0 + 2 && OVL(v.db.x0, v.db.x1, n.box.x0, n.box.x1) > 0, v => v.db.y1);
        if (a) e = SHIFT(n.box, a.mb.x0 - a.db.x0, a.mb.y1 - a.db.y1);
      }
      if (ctx.verify && presentInPixels(n, e, ctx.imgD, ctx.imgM, Pd.fill || Pd.color, Pm.fill || Pm.color, units.map(v => v.mb), P)) continue;
      const big = AREA(n.box) >= 250 || n.kind === 'text';
      const s = big ? 3 : 1.3;
      out.push({ type: 'missing', sev: s, level: LEVEL(s), title: 'Missing in implementation', name: nodeName(n), dBox: n.box, mBox: null, eBox: e, dNodes: [n], mNodes: [], depth });
    }
    for (const n of res.insM) {
      let e = SHIFT(n.box, Pd.box.x0 - Pm.box.x0, Pd.box.y0 - Pm.box.y0);
      if (ctx.flow) {
        const a = nearest(units, null, v => v.mb.y1 <= n.box.y0 + 2 && OVL(v.mb.x0, v.mb.x1, n.box.x0, n.box.x1) > 0, v => v.mb.y1);
        if (a) e = SHIFT(n.box, a.db.x0 - a.mb.x0, a.db.y1 - a.mb.y1);
      }
      if (ctx.verify && presentInPixels(n, e, ctx.imgM, ctx.imgD, Pm.fill || Pm.color, Pd.fill || Pd.color, units.map(v => v.db), P)) continue;
      const big = AREA(n.box) >= 250 || n.kind === 'text';
      const s = big ? 2.6 : 1.2;
      out.push({ type: 'extra', sev: s, level: LEVEL(s), title: 'Not in the design', name: nodeName(n), dBox: null, mBox: n.box, eBox: null, dNodes: [], mNodes: [n], depth });
    }
    return { units, delD: res.delD, insM: res.insM };
  };
  level(segD.root.children, segM.root.children, segD.root, segM.root, 1);
  return out;
}

function runFlat(segD, segM, ctx) {
  const P = ctx.P, out = [];
  const D = segD.nodes, M = segM.nodes, PD = segD.root, PM = segM.root;
  const cost = (d, m) => {
    const r = parentResidual(d.box, m.box, PD.box, PM.box);
    return emission(d, m, d.box, m.box, P) + Math.min(6, Math.hypot(r.x, r.y) / P.transTau);
  };
  const r = assign(D, M, cost, d => gapCost(d, P) + 1.2, m => gapCost(m, P) + 1.2);
  const units = r.pairs.map(([d, m]) => mkUnit([d], [m]));
  attributeLevel(units, [], PD, PM, false);
  for (const u of units) out.push(scoreUnit(u, PD, PM, ctx, u.d[0].depth || 1, null));
  for (const n of r.delA) {
    const s = AREA(n.box) >= 250 || n.kind === 'text' ? 3 : 1.3;
    out.push({ type: 'missing', sev: s, level: LEVEL(s), title: 'Missing in implementation', name: nodeName(n), dBox: n.box, mBox: null, eBox: n.box, dNodes: [n], mNodes: [], depth: n.depth });
  }
  for (const n of r.insB) {
    const s = AREA(n.box) >= 250 || n.kind === 'text' ? 2.6 : 1.2;
    out.push({ type: 'extra', sev: s, level: LEVEL(s), title: 'Not in the design', name: nodeName(n), dBox: null, mBox: n.box, eBox: null, dNodes: [], mNodes: [n], depth: n.depth });
  }
  return out;
}

export { frameContrast, runTree, runFlat };
