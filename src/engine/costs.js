import { nodeDE } from './color.js';
import { AREA, CX, CY, H_, UNIONS, W_, minAbs } from './geom.js';

/* ---------------- costs ---------------- */
const KIND_GROUP = { container: 'box', shape: 'box', image: 'box', text: 'ink', icon: 'ink', rule: 'rule', root: 'box' };
function kindCost(a, b) {
  if (a === b) return 0;
  const ga = KIND_GROUP[a], gb = KIND_GROUP[b];
  if (ga === gb) return 0.35;
  if (ga === 'rule' || gb === 'rule') return 1.1;
  return 1.6;
}
function parentResidual(db, mb, PD, PM) {
  const ex = [(mb.x0 - PM.x0) - (db.x0 - PD.x0), (CX(mb) - CX(PM)) - (CX(db) - CX(PD)), (mb.x1 - PM.x1) - (db.x1 - PD.x1)];
  const ey = [(mb.y0 - PM.y0) - (db.y0 - PD.y0), (CY(mb) - CY(PM)) - (CY(db) - CY(PD)), (mb.y1 - PM.y1) - (db.y1 - PD.y1)];
  return { x: minAbs(ex), y: minAbs(ey) };
}
/* Emission: how plausible is it that d and m are the same element, ignoring where
   they sit. Text is compared relative to the page-wide font scale (P.ts), which the
   box algorithms estimate in a first pass: a fallback font that makes every label
   6% wider is not evidence, a label that is 17% wider than its peers is. */
function emission(dRep, mRep, db, mb, P) {
  let c = kindCost(dRep.kind, mRep.kind);
  const ink = KIND_GROUP[dRep.kind] === 'ink' && KIND_GROUP[mRep.kind] === 'ink';
  const rw = Math.log(Math.max(1, W_(mb)) / Math.max(1, W_(db)));
  const rh = Math.log(Math.max(1, H_(mb)) / Math.max(1, H_(db)));
  if (ink) {
    const ts = P.ts;
    if (ts && dRep.lines === 1 && mRep.lines === 1) {
      c += 5 * Math.max(0, Math.abs(rw - ts.w) - 0.04) + 2 * Math.max(0, Math.abs(rh - ts.h) - 0.1);
    } else if (ts && dRep.px && mRep.px) {
      c += 1.5 * Math.max(0, Math.abs(Math.log(mRep.px / dRep.px) - ts.m) - 0.15) + 0.5 * Math.max(0, Math.abs(rw) - 0.3);
    } else c += 0.9 * (Math.max(0, Math.abs(rw) - 0.15) + Math.max(0, Math.abs(rh) - 0.3));
  } else c += 1.4 * (Math.max(0, Math.abs(rw) - 0.03) + Math.max(0, Math.abs(rh) - 0.03));
  if (dRep.color && mRep.color) {
    const de = nodeDE(dRep, mRep);
    c += Math.min(1.2, de / 45);
    // a filled box against a box of a clearly different fill (a primary button against a
    // secondary one) is a different element wherever it sits
    if (KIND_GROUP[dRep.kind] === 'box' && KIND_GROUP[mRep.kind] === 'box' && (dRep.filled || mRep.filled) && de > 30) c += Math.min(2, (de - 30) / 30);
  }
  // frames: what is inside them (how many boxes, ink blocks and rules), mildly, since the two
  // renders may group ink differently
  if (dRep.children && mRep.children && (dRep.children.length || mRep.children.length)) {
    const sig = n => { const q = { box: 0, ink: 0, rule: 0 }; for (const k of n.children) q[KIND_GROUP[k.kind] || 'box']++; return q; };
    const a = sig(dRep), b = sig(mRep);
    const diff = Math.abs(a.box - b.box) + Math.abs(a.ink - b.ink) + Math.abs(a.rule - b.rule);
    c += 0.6 * Math.min(1, diff / Math.max(2, dRep.children.length, mRep.children.length));
  }
  return c;
}
const median = a => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y); const k = s.length >> 1; return s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2; };
function estimateTextScale(findings) {
  const w = [], h = [], m = [];
  for (const f of findings) {
    if (!f.dNodes || f.dNodes.length !== 1 || !f.mNodes || f.mNodes.length !== 1) continue;
    const d = f.dNodes[0], n = f.mNodes[0];
    if (d.kind !== 'text' || n.kind !== 'text') continue;
    if (d.px && n.px) m.push(Math.log(n.px / d.px));
    if (d.lines === 1 && n.lines === 1) { w.push(Math.log(W_(n.box) / W_(d.box))); h.push(Math.log(H_(n.box) / H_(d.box))); }
  }
  if (w.length < 3 && m.length < 3) return null;
  return { w: median(w), h: median(h), m: median(m), n: Math.max(w.length, m.length) };
}
/* Transition between consecutive matched units. Consistent displacement is
   free; so is a preserved gap along either flow axis (the previous element
   grew, this one followed). Skipped design elements may close their gap,
   inserted implementation elements may open one. */
function transCost(pu, cu, P, skD, skM) {
  const dxp = pu.mb.x0 - pu.db.x0, dyp = pu.mb.y0 - pu.db.y0;
  const dxc = cu.mb.x0 - cu.db.x0, dyc = cu.mb.y0 - cu.db.y0;
  let best = Math.hypot(dxc - dxp, dyc - dyp);
  if (cu.db.y0 >= pu.db.y1 - 4) {
    const ax = Math.min(
      Math.abs((cu.mb.x0 - pu.mb.x0) - (cu.db.x0 - pu.db.x0)),
      Math.abs((CX(cu.mb) - CX(pu.mb)) - (CX(cu.db) - CX(pu.db))),
      Math.abs((cu.mb.x1 - pu.mb.x1) - (cu.db.x1 - pu.db.x1)));
    const gm = cu.mb.y0 - pu.mb.y1, gd = cu.db.y0 - pu.db.y1;
    let gy = Math.abs(gm - gd);
    const sd = skD && skD.filter(n => n.box.y0 >= pu.db.y1 - 4 && n.box.y1 <= cu.db.y0 + 4);
    if (sd && sd.length) {
      const top = Math.min(...sd.map(n => n.box.y0)), bot = Math.max(...sd.map(n => n.box.y1));
      gy = Math.min(gy, Math.abs(gm - (top - pu.db.y1)), Math.abs(gm - (cu.db.y0 - bot)));
    }
    const sm = skM && skM.filter(n => n.box.y0 >= pu.mb.y1 - 4 && n.box.y1 <= cu.mb.y0 + 4);
    if (sm && sm.length) {
      const bot = Math.max(...sm.map(n => n.box.y1)), top = Math.min(...sm.map(n => n.box.y0));
      gy = Math.min(gy, Math.abs((cu.mb.y0 - bot) - gd), Math.abs((top - pu.mb.y1) - gd));
    }
    best = Math.min(best, Math.hypot(gy, ax));
  }
  if (cu.db.x0 >= pu.db.x1 - 4) {
    const ay = Math.min(
      Math.abs((cu.mb.y0 - pu.mb.y0) - (cu.db.y0 - pu.db.y0)),
      Math.abs((CY(cu.mb) - CY(pu.mb)) - (CY(cu.db) - CY(pu.db))),
      Math.abs((cu.mb.y1 - pu.mb.y1) - (cu.db.y1 - pu.db.y1)));
    const gm = cu.mb.x0 - pu.mb.x1, gd = cu.db.x0 - pu.db.x1;
    let gx = Math.abs(gm - gd);
    const sd = skD && skD.filter(n => n.box.x0 >= pu.db.x1 - 4 && n.box.x1 <= cu.db.x0 + 4);
    if (sd && sd.length) {
      const lf = Math.min(...sd.map(n => n.box.x0)), rt = Math.max(...sd.map(n => n.box.x1));
      gx = Math.min(gx, Math.abs(gm - (lf - pu.db.x1)), Math.abs(gm - (cu.db.x0 - rt)));
    }
    const sm = skM && skM.filter(n => n.box.x0 >= pu.mb.x1 - 4 && n.box.x1 <= cu.mb.x0 + 4);
    if (sm && sm.length) {
      const rt = Math.max(...sm.map(n => n.box.x1)), lf = Math.min(...sm.map(n => n.box.x0));
      gx = Math.min(gx, Math.abs((cu.mb.x0 - rt) - gd), Math.abs((lf - pu.mb.x1) - gd));
    }
    best = Math.min(best, Math.hypot(gx, ay));
  }
  return Math.min(4, best / P.transTau);
}
const gapCost = (n, P) => P.gapBase + 0.22 * Math.log2(1 + AREA(n.box) / 600);
function plausibleMerge(nodes) {
  if (!nodes.every(x => KIND_GROUP[x.kind] === 'ink')) return false;
  const u = UNIONS(nodes.map(n => n.box));
  if (AREA(u) > 1.9 * nodes.reduce((s, n) => s + AREA(n.box), 0) + 400) return false;
  // pieces of one block sit a line gap (or a word gap) apart; a label well below a paragraph
  // is a separate element even when the union is compact
  const s = nodes.slice().sort((a, b) => a.box.y0 - b.box.y0);
  for (let i = 1; i < s.length; i++) {
    const a = s[i - 1].box, b = s[i].box;
    const hmin = Math.min(...s.slice(0, i + 1).map(n => H_(n.box) / Math.max(1, n.lines || 1)));
    const vgap = b.y0 - Math.max(...s.slice(0, i).map(n => n.box.y1));
    if (vgap > Math.max(10, 1.1 * hmin)) return false;
    if (vgap < 0) {
      const hgap = Math.max(a.x0, b.x0) - Math.min(a.x1, b.x1);
      if (hgap > Math.max(16, 2 * hmin)) return false;
    }
  }
  return true;
}

export { KIND_GROUP, kindCost, parentResidual, emission, median, estimateTextScale, transCost, gapCost, plausibleMerge };
