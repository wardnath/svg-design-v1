/* Inferred stretch: what a single exported frame implies about the same design at another
   viewport size. Figma-style constraints are inferred from the segmentation tree alone:
   full-height side panes keep their width, bars span, rows of cards share the extra space
   with fixed gaps, loose items attach to whichever edge or neighbour they sit closest to
   (a springs model), and a card's dominant graphic absorbs extra height. The stretched
   design is then re-composed from the original pixels: frames are 9-sliced, ink is moved
   but never scaled. Everything stays in pixel space, like the rest of the engine. */
import { KIND_GROUP } from './costs.js';
import { B, W_, H_, CX, CY, UNIONS, OVL, clamp } from './geom.js';

const isBox = n => KIND_GROUP[n.kind] === 'box';
const isGraphic = n => n.kind === 'image' || n.kind === 'shape';

/* Group items into rows: y-intervals overlapping by half the smaller height. */
function rowsOf(items) {
  const s = items.slice().sort((a, b) => a.box.y0 - b.box.y0);
  const rows = [];
  for (const it of s) {
    let row = null;
    for (const r of rows) {
      if (r.items.some(o => OVL(o.box.y0, o.box.y1, it.box.y0, it.box.y1) >= 0.5 * Math.min(H_(o.box), H_(it.box)))) { row = r; break; }
    }
    if (row) { row.items.push(it); row.y0 = Math.min(row.y0, it.box.y0); row.y1 = Math.max(row.y1, it.box.y1); }
    else rows.push({ items: [it], y0: it.box.y0, y1: it.box.y1 });
  }
  rows.forEach(r => r.items.sort((a, b) => a.box.x0 - b.box.x0));
  return rows.sort((a, b) => a.y0 - b.y0);
}

/* Springs along one axis: the largest gap (edge-to-item or item-to-item) is where free
   space goes. Items before it stay with the start edge, after it with the end edge; when
   two gaps tie, the items between them stay centred. Returns a delta per item. */
function springs(items, lo, hi, d, get0, get1) {
  const n = items.length;
  if (!n || !d) return items.map(() => 0);
  const gaps = [get0(items[0]) - lo];
  for (let i = 1; i < n; i++) gaps.push(get0(items[i]) - get1(items[i - 1]));
  gaps.push(hi - get1(items[n - 1]));
  const order = gaps.map((g, i) => [g, i]).sort((a, b) => b[0] - a[0]);
  const [g1, i1] = order[0];
  const second = order[1];
  const out = new Array(n).fill(0);
  if (second && second[0] >= 0.85 * g1 && Math.abs(second[1] - i1) > 1) {
    const a = Math.min(i1, second[1]), b = Math.max(i1, second[1]);
    for (let k = 0; k < n; k++) out[k] = k < a ? 0 : k >= b ? d : d / 2;
    return out;
  }
  for (let k = 0; k < n; k++) out[k] = k < i1 ? 0 : d;
  return out;
}

/* Recursive XY-cut of sibling items into a layout tree of rows and columns. */
function cut(items, lo, hi) {
  const s = items.slice().sort((a, b) => lo(a.box) - lo(b.box));
  const groups = [];
  let cur = [], end = -Infinity;
  for (const it of s) {
    if (cur.length && lo(it.box) >= end - 1) { groups.push(cur); cur = []; end = -Infinity; }
    cur.push(it); end = Math.max(end, hi(it.box));
  }
  if (cur.length) groups.push(cur);
  return groups;
}
function xyTree(items) {
  const box = UNIONS(items.map(n => n.box));
  if (items.length === 1) return { type: 'leaf', item: items[0], box };
  const ys = cut(items, b => b.y0, b => b.y1);
  if (ys.length > 1) return { type: 'col', kids: ys.map(xyTree), box };
  const xs = cut(items, b => b.x0, b => b.x1);
  if (xs.length > 1) return { type: 'row', kids: xs.map(xyTree), box };
  return { type: 'stack', kids: items.map(n => ({ type: 'leaf', item: n, box: n.box })), box };
}
const leaves = t => (t.type === 'leaf' ? [t.item] : t.kids.flatMap(leaves));
const isFlexBox = t => leaves(t).every(n => isBox(n) || n.kind === 'image') ||
  (t.type === 'stack' && leaves(t).some(n => n.kind === 'image' || n.kind === 'shape'));

export function inferStretch(seg, W1, H1) {
  const NB = new Map(), mode = new Map();
  const root = seg.root;
  NB.set(root, B(0, 0, W1, H1));
  placeChildren(root, root.box, B(0, 0, W1, H1), true);
  return { boxes: NB, modes: mode };

  function placeChildren(parent, O, N, isRoot) {
    const kids = parent.children || [];
    if (!kids.length) return;
    const dH = H_(N) - H_(O);
    // full-height side panes keep their width, including panes stacked against a pane (an
    // icon rail and the section panel beside it); viewport-height panels keep their margins
    const fullH = kids.filter(n => isBox(n) && H_(n.box) >= 0.85 * H_(O) && W_(n.box) <= 0.4 * W_(O));
    const panes = [];
    for (let edge = O.x0, more = true; more;) {
      more = false;
      for (const n of fullH) if (!panes.includes(n) && Math.abs(n.box.x0 - edge) <= 4) { panes.push(n); edge = n.box.x1; more = true; break; }
    }
    for (let edge = O.x1, more = true; more;) {
      more = false;
      for (const n of fullH) if (!panes.includes(n) && Math.abs(n.box.x1 - edge) <= 4) { panes.push(n); edge = n.box.x0; more = true; break; }
    }
    let rx0 = O.x0, rx1 = O.x1;
    for (const p of panes) {
      const left = CX(p.box) - O.x0 <= O.x1 - CX(p.box);
      const nb = left ? B(N.x0 + (p.box.x0 - O.x0), N.y0 + (p.box.y0 - O.y0), N.x0 + (p.box.x1 - O.x0), N.y1 - (O.y1 - p.box.y1))
        : B(N.x1 - (O.x1 - p.box.x0), N.y0 + (p.box.y0 - O.y0), N.x1 - (O.x1 - p.box.x1), N.y1 - (O.y1 - p.box.y1));
      if (left) rx0 = Math.max(rx0, p.box.x1); else rx1 = Math.min(rx1, p.box.x0);
      p.isPane = true;
      put(p, nb, left ? 'left' : 'right', 'stretch');
    }
    const tall = kids.filter(n => !panes.includes(n) && isBox(n) && n.box.y0 - O.y0 <= 4 && O.y1 - n.box.y1 <= 4 && H_(n.box) >= 0.85 * H_(O));
    const appLike = panes.length > 0 || tall.length > 0 || (!isRoot && parent.appLike);
    // a side pane is laid out like a page column: things at its foot stay at its foot
    if (parent.isPane) isRoot = true;
    const R0 = B(rx0, O.y0, rx1, O.y1);
    const R1 = B(N.x0 + (rx0 - O.x0), N.y0, N.x1 - (O.x1 - rx1), N.y1);
    for (const t of tall) put(t, B(R1.x0 + (t.box.x0 - R0.x0), R1.y0 + (t.box.y0 - R0.y0), R1.x1 - (R0.x1 - t.box.x1), R1.y1 - (R0.y1 - t.box.y1)), 'stretch', 'stretch');
    const rest = kids.filter(n => !panes.includes(n) && !tall.includes(n));
    if (rest.length) place(xyTree(rest), R0, R1, { appLike, isRoot, vFree: appLike ? 'flex' : 'top' });
  }

  function put(n, nb, mx, my) {
    // ink never scales: it keeps its size, placed by its slot's alignment
    if (!isBox(n) && n.kind !== 'rule' && n.kind !== 'image') {
      const w = W_(n.box), h = H_(n.box);
      const x0 = mx === 'right' ? nb.x1 - w : mx === 'center' || mx === 'scale' ? (nb.x0 + nb.x1) / 2 - w / 2 : nb.x0;
      const y0 = my === 'bottom' ? nb.y1 - h : my === 'center' || my === 'scale' ? (nb.y0 + nb.y1) / 2 - h / 2 : nb.y0;
      nb = B(x0, y0, x0 + w, y0 + h);
    } else if (n.kind === 'rule') {
      if (W_(n.box) >= H_(n.box)) { const c = my === 'bottom' ? nb.y1 - H_(n.box) / 2 : my === 'top' ? nb.y0 + H_(n.box) / 2 : (nb.y0 + nb.y1) / 2; nb = B(nb.x0, c - H_(n.box) / 2, nb.x1, c + H_(n.box) / 2); }
      else { const c = (nb.x0 + nb.x1) / 2; nb = B(c - W_(n.box) / 2, nb.y0, c + W_(n.box) / 2, nb.y1); }
    }
    NB.set(n, nb); mode.set(n, { x: mx, y: my });
    if (n.children && n.children.length) { n.appLike = H_(nb) !== H_(n.box); placeChildren(n, n.box, nb, false); }
  }

  /* Place a layout-tree node: old extent A (the space it may use) → new extent Z. */
  function place(t, A, Z, ctx) {
    const dW = W_(Z) - W_(A), dH = H_(Z) - H_(A);
    if (t.type === 'leaf') {
      const n = t.item, b = n.box;
      // horizontal: spans its extent → stretch; else attach to the nearer side; tie → centre
      const L = b.x0 - A.x0, Rr = A.x1 - b.x1, Tt = b.y0 - A.y0, Bb = A.y1 - b.y1;
      const spanX = W_(b) >= 0.9 * W_(A) || (W_(b) >= 0.6 * W_(A) && (isBox(n) || n.kind === 'rule' || n.kind === 'image'));
      const compact = (n.kind === 'image' || n.kind === 'shape') && W_(b) / H_(b) > 0.75 && W_(b) / H_(b) < 1.33 && Math.max(W_(b), H_(b)) <= 400;
      let x0, x1, mx;
      if (spanX && !compact && (isBox(n) || n.kind === 'rule' || n.kind === 'image')) { x0 = Z.x0 + L; x1 = Z.x1 - Rr; mx = 'stretch'; }
      else if (Math.abs(L - Rr) <= Math.max(3, 0.03 * W_(A))) { x0 = Z.x0 + L + dW / 2; x1 = x0 + W_(b); mx = 'center'; }
      else if (L <= Rr) { x0 = Z.x0 + L; x1 = x0 + W_(b); mx = 'left'; }
      else { x1 = Z.x1 - Rr; x0 = x1 - W_(b); mx = 'right'; }
      let y0, y1, my;
      const spanY = H_(b) >= 0.85 * H_(A) && (isBox(n) || n.kind === 'image') && !compact;
      if (spanY && dH) { y0 = Z.y0 + Tt; y1 = Z.y1 - Bb; my = 'stretch'; }
      else if (ctx.vAlign === 'center' || (dH && Math.abs(Tt - Bb) <= Math.max(3, 0.04 * H_(A)) && Tt > 4)) { y0 = Z.y0 + Tt + dH / 2; y1 = y0 + H_(b); my = 'center'; }
      else if (ctx.vAlign === 'bottom') { y1 = Z.y1 - Bb; y0 = y1 - H_(b); my = 'bottom'; }
      else { y0 = Z.y0 + Tt; y1 = y0 + H_(b); my = 'top'; }
      // a graphic that grows taller but not wider keeps its aspect (a map fitted to its box)
      if (my === 'stretch' && mx !== 'stretch' && (n.kind === 'image' || n.kind === 'shape')) {
        const k = (y1 - y0) / H_(b), c = (x0 + x1) / 2, w = W_(b) * k;
        x0 = c - w / 2; x1 = c + w / 2; mx = 'fit';
      }
      put(n, B(x0, y0, x1, y1), mx, my);
      return;
    }
    if (t.type === 'stack') {
      // overlapping items (a plot and its gridlines and labels): scale together
      const kx = W_(Z) / W_(A), ky = H_(Z) / H_(A);
      for (const k of t.kids) {
        const n = k.item, b = n.box;
        const nb = B(Z.x0 + (b.x0 - A.x0) * kx, Z.y0 + (b.y0 - A.y0) * ky, Z.x0 + (b.x1 - A.x0) * kx, Z.y0 + (b.y1 - A.y0) * ky);
        put(n, nb, 'scale', 'scale');
      }
      return;
    }
    if (t.type === 'col' && dW && isGrid(t)) { placeGrid(t, A, Z, ctx); return; }
    const along = t.type === 'row' ? 'x' : 'y';
    const kids = t.kids;
    const lo = b => (along === 'x' ? b.x0 : b.y0), hi = b => (along === 'x' ? b.x1 : b.y1);
    const d = along === 'x' ? dW : dH;
    const a0 = along === 'x' ? A.x0 : A.y0, a1 = along === 'x' ? A.x1 : A.y1, z0 = along === 'x' ? Z.x0 : Z.y0;
    // how the free space d is shared along the axis
    const sizes = kids.map(k => hi(k.box) - lo(k.box));
    let grow = kids.map(() => 0), lead = 0;
    const flexKids = kids.map(k => isFlexBox(k) && (along === 'x' ? W_(k.box) >= 32 : H_(k.box) >= 0.6 * Math.max(...sizes) && H_(k.box) >= 0.12 * H_(A)));
    const allBoxes = kids.every(isFlexBox);
    const wideEnough = (hi(t.box) - lo(t.box)) >= 0.5 * (a1 - a0);
    if (d && along === 'x' && allBoxes && wideEnough) {
      const tot = sizes.reduce((a, b2) => a + b2, 0);
      grow = sizes.map(sz => d * sz / tot);                       // a row of cards shares the width
    } else if (d && along === 'y' && ctx.vFree === 'flex' && flexKids.some(Boolean)) {
      const tot = sizes.reduce((a, b2, i) => a + (flexKids[i] ? b2 : 0), 0);
      grow = sizes.map((sz, i) => (flexKids[i] ? d * sz / tot : 0));   // tall rows of boxes share the height
    } else if (d && along === 'y' && ctx.scaleY) {
      // beside a plot that scales: keep proportional positions (axis labels follow gridlines)
      kids.forEach(k => { k._shift = (lo(k.box) + hi(k.box)) / 2 - a0 === 0 ? 0 : d * (((lo(k.box) + hi(k.box)) / 2 - a0) / (a1 - a0)); });
    } else if (d && along === 'y' && !(ctx.isRoot && ctx.appLike)) {
      lead = 0;                                                      // documents and cards: top-aligned
    } else if (d) {
      // springs: the largest gap (edge or between kids) takes the free space; a tie centres
      const gaps = [lo(kids[0].box) - a0];
      for (let i = 1; i < kids.length; i++) gaps.push(lo(kids[i].box) - hi(kids[i - 1].box));
      gaps.push(a1 - hi(kids[kids.length - 1].box));
      const order = gaps.map((g, i) => [g, i]).sort((p, q) => q[0] - p[0]);
      const [g1, i1] = order[0], sec = order[1];
      if (sec && sec[0] >= 0.85 * g1 && Math.abs(sec[1] - i1) >= 1) {
        const a = Math.min(i1, sec[1]), b2 = Math.max(i1, sec[1]);
        // split the free space between the two springs
        kids.forEach((k, i) => { k._shift = i < a ? 0 : i >= b2 ? d : d / 2; });
      } else kids.forEach((k, i) => { k._shift = i < i1 ? 0 : d; });
    }
    let acc = 0;
    kids.forEach((k, i) => {
      const s0 = lo(k.box) - a0;
      const shift = k._shift != null ? k._shift : acc + lead;
      const n0 = z0 + s0 + shift, n1 = n0 + sizes[i] + grow[i];
      acc += grow[i];
      // the kid's own extent: along the axis its slot; across, the parent's span
      let A2, Z2;
      if (along === 'x') { A2 = B(k.box.x0, A.y0, k.box.x1, A.y1); Z2 = B(n0, Z.y0, n1, Z.y1); }
      else { A2 = B(A.x0, k.box.y0, A.x1, k.box.y1); Z2 = B(Z.x0, n0, Z.x1, n1); }
      delete k._shift;
      // across a row: items keep top, centre or bottom alignment within the row's band
      const cross = along === 'x' ? { ...ctx, vAlign: rowAlign(k.box, t.box), scaleY: kids.some(q => q.type === 'stack') } : { ...ctx, scaleY: false };
      if (k.type === 'leaf' && along === 'x') { place(k, B(A2.x0, t.box.y0, A2.x1, t.box.y1), B(Z2.x0, Z.y0 + (t.box.y0 - A.y0), Z2.x1, Z.y0 + (t.box.y0 - A.y0) + H_(t.box) + (ctx.vFree === 'flex' && isFlexBox(t) ? dH : 0)), cross); }
      else place(k, A2, Z2, cross);
    });
  }
  /* A table: ≥ 3 rows of ≥ 3 items each, whose items fall into shared columns. */
  function gridColumns(t) {
    const rows = t.kids.filter(k => k.type === 'row' || k.type === 'leaf');
    const items = rows.flatMap(leaves);
    const cols = [];
    for (const n of items.slice().sort((p, q) => p.box.x0 - q.box.x0)) {
      const c = cols.find(cc => OVL(cc.x0, cc.x1, n.box.x0, n.box.x1) > 0);
      if (c) { c.items.push(n); c.x0 = Math.min(c.x0, n.box.x0); c.x1 = Math.max(c.x1, n.box.x1); }
      else cols.push({ items: [n], x0: n.box.x0, x1: n.box.x1 });
    }
    return cols.sort((p, q) => p.x0 - q.x0);
  }
  function isGrid(t) {
    // a title or header line above the grid does not disqualify it
    const rows = t.kids.filter(k => k.type === 'row');
    const body = rows.filter(r => r.kids.length >= 3);
    const firstBody = t.kids.findIndex(k => k.type === 'row' && k.kids.length >= 3);
    if (body.length < 3 || t.kids.slice(firstBody).some(k => k.type === 'row' && k.kids.length < 3)) return false;
    const cols = gridColumns(t);
    return cols.length >= 3 && cols.filter(c => c.items.length >= 3).length >= 3;
  }
  function placeGrid(t, A, Z, ctx) {
    // columns move proportionally across the width (fr tracks), right-aligned ones by their right
    // edge; a column of boxes that fill it (heatmap cells, bar tracks) scales with its track
    const cols = gridColumns(t);
    const kx = W_(Z) / W_(A);
    const shift = new Map(), scaled = new Set();
    for (const c of cols) {
      const rightAligned = c.items.every(n => Math.abs(n.box.x1 - c.x1) <= 2) && !c.items.every(n => Math.abs(n.box.x0 - c.x0) <= 2);
      const anchor = rightAligned ? c.x1 : c.x0;
      const d = Z.x0 + (anchor - A.x0) * kx - anchor;
      const fills = c.items.filter(n => (isBox(n) || n.kind === 'rule') && W_(n.box) >= 0.9 * (c.x1 - c.x0));
      for (const n of c.items) { shift.set(n, d); if (fills.length >= 3 && fills.includes(n)) scaled.add(n); }
    }
    // rows made of boxes that fill their height share extra height, like 1fr rows
    const rows = t.kids.map(k => ({ k, box: k.box, items: leaves(k) }));
    const boxRow = r => r.items.filter(n => isBox(n) && H_(n.box) >= 0.8 * H_(r.box)).length >= Math.max(2, 0.5 * r.items.length);
    const dH = H_(Z) - H_(A);
    const share = ctx.vFree === 'flex' && dH > 0 && rows.filter(boxRow).length >= 3;
    const grow = rows.map(r => (share && boxRow(r) ? H_(r.box) : 0));
    const tot = grow.reduce((p, q) => p + q, 0) || 1;
    let dy = Z.y0 - A.y0;
    rows.forEach((r, i) => {
      const g = share ? (dH * grow[i]) / tot : 0;
      for (const n of r.items) {
        const sx = shift.has(n) ? shift.get(n) : Z.x0 - A.x0;
        const fillsRow = g && H_(n.box) >= 0.8 * H_(r.box);
        const y0 = fillsRow ? n.box.y0 + dy : n.box.y0 + dy + g / 2, y1 = fillsRow ? n.box.y1 + dy + g : n.box.y1 + dy + g / 2;
        let nb;
        if (n.kind === 'rule' && W_(n.box) >= 0.6 * W_(A)) nb = B(Z.x0 + (n.box.x0 - A.x0), y0, Z.x1 - (A.x1 - n.box.x1), y1);
        else if (scaled.has(n)) nb = B(Z.x0 + (n.box.x0 - A.x0) * kx, y0, Z.x0 + (n.box.x1 - A.x0) * kx, y1);
        else nb = B(n.box.x0 + sx, y0, n.box.x1 + sx, y1);
        put(n, nb, n.kind === 'rule' || scaled.has(n) ? 'stretch' : 'scale', fillsRow ? 'stretch' : 'top');
      }
      dy += g;
    });
  }
  function rowAlign(b, band) {
    const T = b.y0 - band.y0, Bt = band.y1 - b.y1;
    if (Math.abs(T - Bt) <= 2 && T > 2) return 'center';
    return T <= Bt ? 'top' : 'bottom';
  }
}

/* ---------------- re-composition from the original pixels ---------------- */
function blit(src, sx0, sy0, sw, sh, dst, dx0, dy0, dw, dh, smooth) {
  const SW = src.width, SH = src.height, DW = dst.width, DH = dst.height, s = src.data, d = dst.data;
  const x0 = Math.max(0, Math.floor(dx0)), y0 = Math.max(0, Math.floor(dy0));
  const x1 = Math.min(DW, Math.ceil(dx0 + dw)), y1 = Math.min(DH, Math.ceil(dy0 + dh));
  const kx = sw / Math.max(1e-6, dw), ky = sh / Math.max(1e-6, dh);
  for (let y = y0; y < y1; y++) {
    const fy = sy0 + (y + 0.5 - dy0) * ky - 0.5;
    for (let x = x0; x < x1; x++) {
      const fx = sx0 + (x + 0.5 - dx0) * kx - 0.5;
      const o = (y * DW + x) * 4;
      if (!smooth) {
        const ix = clamp(Math.round(fx), 0, SW - 1), iy = clamp(Math.round(fy), 0, SH - 1), i = (iy * SW + ix) * 4;
        d[o] = s[i]; d[o + 1] = s[i + 1]; d[o + 2] = s[i + 2]; d[o + 3] = 255;
        continue;
      }
      const ax = clamp(Math.floor(fx), 0, SW - 1), ay = clamp(Math.floor(fy), 0, SH - 1);
      const bx = Math.min(SW - 1, ax + 1), by = Math.min(SH - 1, ay + 1);
      const tx = clamp(fx - ax, 0, 1), ty = clamp(fy - ay, 0, 1);
      const i00 = (ay * SW + ax) * 4, i10 = (ay * SW + bx) * 4, i01 = (by * SW + ax) * 4, i11 = (by * SW + bx) * 4;
      for (let c = 0; c < 3; c++) d[o + c] = (s[i00 + c] * (1 - tx) + s[i10 + c] * tx) * (1 - ty) + (s[i01 + c] * (1 - tx) + s[i11 + c] * tx) * ty;
      d[o + 3] = 255;
    }
  }
}
function fillBox(dst, x0, y0, x1, y1, c) {
  const W = dst.width, H = dst.height, d = dst.data;
  for (let y = Math.max(0, Math.round(y0)); y < Math.min(H, Math.round(y1)); y++) for (let x = Math.max(0, Math.round(x0)); x < Math.min(W, Math.round(x1)); x++) {
    const o = (y * W + x) * 4; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
  }
}
/* 9-slice a frame: corners copied, edges stretched from a 1px strip, centre filled. */
function nineSlice(src, a, b, dst, fill) {
  const w0 = W_(a), h0 = H_(a), w1 = W_(b), h1 = H_(b);
  const c = Math.max(3, Math.min(20, Math.floor(Math.min(w0, h0, w1, h1) / 2) - 1));
  const sx = [a.x0, a.x0 + c, a.x1 - c, a.x1], sy = [a.y0, a.y0 + c, a.y1 - c, a.y1];
  const dx = [b.x0, b.x0 + c, b.x1 - c, b.x1], dy = [b.y0, b.y0 + c, b.y1 - c, b.y1];
  const midX = Math.round((a.x0 + a.x1) / 2), midY = Math.round((a.y0 + a.y1) / 2);
  for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) {
    if (i === 1 && j === 1) continue;
    const sw = i === 1 ? 1 : sx[i + 1] - sx[i], sh = j === 1 ? 1 : sy[j + 1] - sy[j];
    const sxx = i === 1 ? midX : sx[i], syy = j === 1 ? midY : sy[j];
    blit(src, sxx, syy, sw, sh, dst, dx[i], dy[j], dx[i + 1] - dx[i], dy[j + 1] - dy[j], false);
  }
  fillBox(dst, dx[1], dy[1], dx[2], dy[2], fill);
}

/* Stretch a frame's background at a seam: copy the region, erase its children (each filled
   with the median colour around it), then repeat (or remove) the smoothest interior column and
   row. Bands, inner borders and corners all survive, which a 9-slice with a flat centre does not. */
function seamStretch(src, a, b, kids, dst) {
  const SW = src.width, s = src.data;
  const ax0 = Math.max(0, Math.round(a.x0)), ay0 = Math.max(0, Math.round(a.y0));
  const w0 = Math.min(SW, Math.round(a.x1)) - ax0, h0 = Math.min(src.height, Math.round(a.y1)) - ay0;
  if (w0 < 4 || h0 < 4) return;
  const buf = new Uint8ClampedArray(w0 * h0 * 3);
  for (let y = 0; y < h0; y++) for (let x = 0; x < w0; x++) { const i = ((ay0 + y) * SW + ax0 + x) * 4, o = (y * w0 + x) * 3; buf[o] = s[i]; buf[o + 1] = s[i + 1]; buf[o + 2] = s[i + 2]; }
  const inKid = new Uint8Array(w0 * h0);
  const rects = kids.map(k => [Math.max(0, Math.floor(k.box.x0) - ax0 - 2), Math.max(0, Math.floor(k.box.y0) - ay0 - 2), Math.min(w0, Math.ceil(k.box.x1) - ax0 + 2), Math.min(h0, Math.ceil(k.box.y1) - ay0 + 2)]);
  for (const [x0, y0, x1, y1] of rects) for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) inKid[y * w0 + x] = 1;
  for (const [x0, y0, x1, y1] of rects) {
    const ring = [[], [], []];
    const take = (x, y) => { if (x < 0 || y < 0 || x >= w0 || y >= h0 || inKid[y * w0 + x]) return; const o = (y * w0 + x) * 3; ring[0].push(buf[o]); ring[1].push(buf[o + 1]); ring[2].push(buf[o + 2]); };
    for (let x = x0 - 1; x <= x1; x++) { take(x, y0 - 1); take(x, y1); }
    for (let y = y0; y < y1; y++) { take(x0 - 1, y); take(x1, y); }
    if (!ring[0].length) continue;
    const med = ring.map(c => c.sort((p, q) => p - q)[c.length >> 1]);
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const o = (y * w0 + x) * 3; buf[o] = med[0]; buf[o + 1] = med[1]; buf[o + 2] = med[2]; }
  }
  const seam = (n, len, at) => {
    // the smoothest line away from the edges, preferring the middle
    const lo = Math.min(n - 2, Math.max(1, Math.round(n * 0.2))), hi = Math.max(lo, Math.round(n * 0.8));
    let best = Math.round(n / 2), bs = Infinity;
    for (let k = lo; k <= hi; k++) {
      let sc = 0;
      for (let t = 0; t < len; t += 2) { const p = at(k, t), q = at(k - 1, t); sc += Math.max(Math.abs(buf[p] - buf[q]), Math.abs(buf[p + 1] - buf[q + 1]), Math.abs(buf[p + 2] - buf[q + 2])); }
      sc += Math.abs(k - n / 2) * 0.02;
      if (sc < bs) { bs = sc; best = k; }
    }
    return best;
  };
  const xs = seam(w0, h0, (x, y) => (y * w0 + x) * 3), ys = seam(h0, w0, (y, x) => (y * w0 + x) * 3);
  const W1 = Math.round(b.x1) - Math.round(b.x0), H1 = Math.round(b.y1) - Math.round(b.y0);
  const dW = W1 - w0, dH = H1 - h0;
  const mapX = x => (x < xs ? x : dW >= 0 ? (x < xs + dW ? xs : x - dW) : Math.min(w0 - 1, x - dW));
  const mapY = y => (y < ys ? y : dH >= 0 ? (y < ys + dH ? ys : y - dH) : Math.min(h0 - 1, y - dH));
  const DW = dst.width, DH = dst.height, d = dst.data, bx0 = Math.round(b.x0), by0 = Math.round(b.y0);
  for (let y = 0; y < H1; y++) {
    const Y = by0 + y; if (Y < 0 || Y >= DH) continue;
    const sy = Math.max(0, Math.min(h0 - 1, mapY(y)));
    for (let x = 0; x < W1; x++) {
      const X = bx0 + x; if (X < 0 || X >= DW) continue;
      const sx = Math.max(0, Math.min(w0 - 1, mapX(x)));
      const o = (Y * DW + X) * 4, i = (sy * w0 + sx) * 3;
      d[o] = buf[i]; d[o + 1] = buf[i + 1]; d[o + 2] = buf[i + 2]; d[o + 3] = 255;
    }
  }
}
const newImage = (W, H) => (typeof ImageData !== 'undefined' ? new ImageData(W, H) : { width: W, height: H, data: new Uint8ClampedArray(W * H * 4) });
export function synthesize(seg, img, boxes, W1, H1) {
  const out = newImage(W1, H1);
  const ancestors = n => { const a = new Set(); for (let p = n.parent; p; p = p.parent) a.add(p); return a; };
  const overlapping = n => {
    const anc = ancestors(n), b0 = n.box;
    return seg.nodes.filter(m => m !== n && !anc.has(m) && m.parent && (m.parent === n || !isDescendant(m, n)) &&
      m.box.x1 > b0.x0 && m.box.x0 < b0.x1 && m.box.y1 > b0.y0 && m.box.y0 < b0.y1 && (m.parent === n || m.depth <= n.depth));
  };
  const isDescendant = (m, n) => { for (let p = m.parent; p; p = p.parent) if (p === n) return true; return false; };
  fillBox(out, 0, 0, W1, H1, seg.root.fill || seg.bg);
  seamStretch(img, seg.root.box, B(0, 0, W1, H1), seg.root.children, out);
  const draw = nodes => {
    // frames first, then what sits on them
    const frames = nodes.filter(isBox), ink = nodes.filter(n => !isBox(n));
    for (const n of frames) {
      const a = n.box, b = boxes.get(n);
      if (!b) continue;
      if (n.children && n.children.length) {
        seamStretch(img, a, b, overlapping(n), out);
        draw(n.children);
      } else blit(img, a.x0, a.y0, W_(a), H_(a), out, b.x0, b.y0, W_(b), H_(b), true);
    }
    for (const n of ink) {
      const a = n.box, b = boxes.get(n);
      if (!b) continue;
      const scale = n.kind === 'rule' || n.kind === 'image';
      if (scale) blit(img, a.x0, a.y0, W_(a), H_(a), out, b.x0, b.y0, W_(b), H_(b), true);
      else blit(img, a.x0 - 1, a.y0 - 1, W_(a) + 2, H_(a) + 2, out, Math.round(b.x0) - 1, Math.round(b.y0) - 1, W_(a) + 2, H_(a) + 2, false);
    }
  };
  draw(seg.root.children);
  return out;
}

/* Fraction of nodes in segmentation `b` that sit exactly (±1px) where some node of the same
   kind sat in segmentation `a`: near 1 for a layout that did not respond to the resize. */
export function frozenShare(a, b) {
  const key = n => `${n.kind}|${Math.round(n.box.x0 / 2)}|${Math.round(n.box.y0 / 2)}|${Math.round(W_(n.box) / 2)}|${Math.round(H_(n.box) / 2)}`;
  const set = new Set(a.nodes.map(key));
  const nb = b.nodes.filter(n => n.depth <= 4);
  if (!nb.length) return 0;
  let same = 0;
  for (const n of nb) if (set.has(key(n))) same++;
  return same / nb.length;
}
