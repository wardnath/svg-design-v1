import { cdist, lab } from './color.js';
import { B, CX, CY, GROW, H_, OVL, UNION, W_, clamp } from './geom.js';
import { DEFAULTS } from './params.js';

/* ---------------- segmentation ---------------- */
/* The page background is what lies "outside" the frame, so it is sampled on the
   frame border (a nav or sidebar may touch one edge, the page touches the most). */
function pageBackground(data, W, H) {
  const cnt = new Map();
  let top = 0xffffff, topN = 0;
  const visit = (x, y) => {
    const i = (y * W + x) * 4;
    const exact = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
    const v = (cnt.get(exact) || 0) + 1;
    cnt.set(exact, v);
    if (v > topN) { topN = v; top = exact; }
  };
  for (let x = 0; x < W; x++) { visit(x, 0); visit(x, H - 1); }
  for (let y = 1; y < H - 1; y++) { visit(0, y); visit(W - 1, y); }
  return [(top >> 16) & 255, (top >> 8) & 255, top & 255];
}

class UF {
  constructor(n) { this.p = new Int32Array(n); for (let i = 0; i < n; i++) this.p[i] = i; }
  find(a) { const p = this.p; while (p[a] !== a) { p[a] = p[p[a]]; a = p[a]; } return a; }
  union(a, b) { a = this.find(a); b = this.find(b); if (a !== b) this.p[b] = a; }
}

function segment(img, Pin) {
  const P = Object.assign({}, DEFAULTS, Pin || {});
  const t0 = performance.now();
  const { width: W, height: H, data } = img;
  const W2 = W + 2, H2 = H + 2, N = W2 * H2;
  const bg = pageBackground(data, W, H);
  const R = new Uint8Array(N).fill(bg[0]), G = new Uint8Array(N).fill(bg[1]), Bc = new Uint8Array(N).fill(bg[2]);
  for (let y = 0; y < H; y++) {
    let si = y * W * 4, di = (y + 1) * W2 + 1;
    for (let x = 0; x < W; x++, si += 4, di++) { R[di] = data[si]; G[di] = data[si + 1]; Bc[di] = data[si + 2]; }
  }
  // Edge map: compare each pixel with its 1- and 2-step right/down neighbours, mark both sides.
  const T = P.edgeT;
  const E = new Uint8Array(N);
  for (let y = 0; y < H2; y++) {
    const row = y * W2;
    for (let x = 0; x < W2; x++) {
      const i = row + x;
      const r = R[i], g = G[i], b = Bc[i];
      // 1- and 2-step comparisons, marking every pixel they span. Edges come out ~4px
      // thick: glyph strokes fill in solid, anti-aliased low-contrast corners still close.
      if (x + 1 < W2) {
        const j = i + 1;
        const d = Math.max(Math.abs(r - R[j]), Math.abs(g - G[j]), Math.abs(b - Bc[j]));
        if (d > T) { E[i] = 1; E[j] = 1; }
        if (x + 2 < W2) {
          const k = i + 2;
          const d2 = Math.max(Math.abs(r - R[k]), Math.abs(g - G[k]), Math.abs(b - Bc[k]));
          if (d2 > T) { E[i] = 1; E[j] = 1; E[k] = 1; }
        }
      }
      if (y + 1 < H2) {
        const j = i + W2;
        const d = Math.max(Math.abs(r - R[j]), Math.abs(g - G[j]), Math.abs(b - Bc[j]));
        if (d > T) { E[i] = 1; E[j] = 1; }
        if (y + 2 < H2) {
          const k = j + W2;
          const d2 = Math.max(Math.abs(r - R[k]), Math.abs(g - G[k]), Math.abs(b - Bc[k]));
          if (d2 > T) { E[i] = 1; E[j] = 1; E[k] = 1; }
        }
      }
    }
  }
  // The padding ring is never an edge, so "outside" stays one region that surrounds
  // everything, even when a full-width rule spans the frame edge to edge.
  for (let x = 0; x < W2; x++) { E[x] = 0; E[(H2 - 1) * W2 + x] = 0; }
  for (let y = 0; y < H2; y++) { E[y * W2] = 0; E[y * W2 + W2 - 1] = 0; }
  // Connected components of edges (8-conn) and of non-edge regions (4-conn).
  const lab = new Int32Array(N), rl = new Int32Array(N), stack = new Int32Array(N);
  const comps = [null], regs = [null];
  for (let s = 0; s < N; s++) {
    if (!E[s] || lab[s]) continue;
    const id = comps.length;
    let sp = 0; stack[sp++] = s; lab[s] = id;
    let n = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    while (sp) {
      const p = stack[--sp]; n++;
      const px = p % W2, py = (p - px) / W2;
      if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py;
      const yA = py > 0 ? -1 : 0, yB = py < H2 - 1 ? 1 : 0, xA = px > 0 ? -1 : 0, xB = px < W2 - 1 ? 1 : 0;
      for (let dy = yA; dy <= yB; dy++) for (let dx = xA; dx <= xB; dx++) {
        const q = p + dy * W2 + dx;
        if (E[q] && !lab[q]) { lab[q] = id; stack[sp++] = q; }
      }
    }
    comps.push({ id, n, px0: x0, py0: y0, px1: x1, py1: y1 });
  }
  for (let s = 0; s < N; s++) {
    if (E[s] || rl[s]) continue;
    const id = regs.length;
    let sp = 0; stack[sp++] = s; rl[s] = id;
    let n = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    while (sp) {
      const p = stack[--sp]; n++;
      const px = p % W2, py = (p - px) / W2;
      if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py;
      if (px > 0) { const q = p - 1; if (!E[q] && !rl[q]) { rl[q] = id; stack[sp++] = q; } }
      if (px < W2 - 1) { const q = p + 1; if (!E[q] && !rl[q]) { rl[q] = id; stack[sp++] = q; } }
      if (py > 0) { const q = p - W2; if (!E[q] && !rl[q]) { rl[q] = id; stack[sp++] = q; } }
      if (py < H2 - 1) { const q = p + W2; if (!E[q] && !rl[q]) { rl[q] = id; stack[sp++] = q; } }
    }
    regs.push({ id, n, px0: x0, py0: y0, px1: x1, py1: y1 });
  }
  const nc = comps.length - 1, nr = regs.length - 1;
  // Bipartite adjacency edge-component ↔ region.
  const adjC = Array.from({ length: nc + 1 }, () => []);
  const adjR = Array.from({ length: nr + 1 }, () => []);
  const lastR = new Int32Array(nc + 1);
  const link = (c, r) => {
    if (!r || lastR[c] === r) return;
    lastR[c] = r;
    const a = adjC[c];
    for (let k = 0; k < a.length; k++) if (a[k] === r) return;
    a.push(r); adjR[r].push(c);
  };
  for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) {
    const i = y * W2 + x, c = lab[i];
    if (!c) continue;
    if (x > 0) link(c, rl[i - 1]);
    if (x < W2 - 1) link(c, rl[i + 1]);
    if (y > 0) link(c, rl[i - W2]);
    if (y < H2 - 1) link(c, rl[i + W2]);
  }
  // Containment tree by BFS from the outer region (alternating region/component layers).
  const outer = rl[0];
  const parentRegion = new Int32Array(nc + 1).fill(-1);
  const encl = new Int32Array(nr + 1).fill(-1);
  encl[outer] = 0;
  const queue = [outer], order = [];
  for (let qi = 0; qi < queue.length; qi++) {
    const r = queue[qi];
    for (const c of adjR[r]) {
      if (parentRegion[c] !== -1) continue;
      parentRegion[c] = r; order.push(c);
      for (const r2 of adjC[c]) if (encl[r2] === -1) { encl[r2] = c; queue.push(r2); }
    }
  }
  const holesOf = Array.from({ length: nc + 1 }, () => []);
  for (let r = 1; r <= nr; r++) if (encl[r] > 0) holesOf[encl[r]].push(r);
  const compsIn = Array.from({ length: nr + 1 }, () => []);
  for (const c of order) compsIn[parentRegion[c]].push(c);
  const encA = new Float64Array(nc + 1), holeA = new Float64Array(nr + 1);
  for (let k = order.length - 1; k >= 0; k--) {
    const c = order[k];
    let s = comps[c].n;
    for (const h of holesOf[c]) {
      let ha = regs[h].n;
      for (const c2 of compsIn[h]) ha += encA[c2];
      holeA[h] = ha; s += ha;
    }
    encA[c] = s;
  }
  // Region color statistics (mode + spread), lazily.
  const QH = new Uint32Array(32768), QR = new Float64Array(32768), QG = new Float64Array(32768), QB = new Float64Array(32768);
  const regionInfo = new Map();
  function regionStats(r) {
    if (regionInfo.has(r)) return regionInfo.get(r);
    const g = regs[r];
    const w = g.px1 - g.px0 + 1, h = g.py1 - g.py0 + 1;
    let step = Math.max(1, Math.floor(Math.sqrt((w * h) / 9000)));
    let res = null;
    for (let attempt = 0; attempt < 2 && !res; attempt++, step = 1) {
      const touched = [];
      let n = 0, sr = 0, sg = 0, sb = 0, sr2 = 0, sg2 = 0, sb2 = 0;
      for (let y = g.py0; y <= g.py1; y += step) for (let x = g.px0; x <= g.px1; x += step) {
        const i = y * W2 + x;
        if (rl[i] !== r) continue;
        const rr = R[i], gg = G[i], bb = Bc[i];
        const k = ((rr >> 3) << 10) | ((gg >> 3) << 5) | (bb >> 3);
        if (!QH[k]) touched.push(k);
        QH[k]++; QR[k] += rr; QG[k] += gg; QB[k] += bb;
        n++; sr += rr; sg += gg; sb += bb; sr2 += rr * rr; sg2 += gg * gg; sb2 += bb * bb;
      }
      if (!n) continue;
      let bk = touched[0];
      for (const k of touched) if (QH[k] > QH[bk]) bk = k;
      const mode = [QR[bk] / QH[bk], QG[bk] / QH[bk], QB[bk] / QH[bk]];
      const v = (sr2 / n - (sr / n) ** 2) + (sg2 / n - (sg / n) ** 2) + (sb2 / n - (sb / n) ** 2);
      res = { mode, std: Math.sqrt(Math.max(0, v) / 3), share: QH[bk] / n };
      for (const k of touched) { QH[k] = 0; QR[k] = 0; QG[k] = 0; QB[k] = 0; }
    }
    res = res || { mode: bg.slice(), std: 0, share: 1 };
    regionInfo.set(r, res);
    return res;
  }
  const boxOf = c => B(c.px0 - 1, c.py0 - 1, c.px1, c.py1); // padded → image coords, exclusive max

  /* ---- frames ---- */
  function classify(c) {
    const cc = comps[c];
    const box = boxOf(cc);
    const w = W_(box), h = H_(box);
    if (w < 10 || h < 10 || !holesOf[c].length) return null;
    const A = (cc.px1 - cc.px0 + 1) * (cc.py1 - cc.py0 + 1);
    const sol = encA[c] / A;
    let hsum = 0, big = 0, bigA = 0;
    for (const hh of holesOf[c]) { hsum += holeA[hh]; if (holeA[hh] > bigA) { bigA = holeA[hh]; big = hh; } }
    const hr = hsum / A;
    if (P.debugAt && box.x0 <= P.debugAt[0] && box.x1 >= P.debugAt[0] && box.y0 <= P.debugAt[1] && box.y1 >= P.debugAt[1]) console.log('DBG classify', JSON.stringify({ box, w, h, A, encA: encA[c], sol: +sol.toFixed(3), hr: +hr.toFixed(3), holes: holesOf[c].map(hh => [holeA[hh], regs[hh].n]) }));
    if (hr < 0.28 || sol < 0.6) return null;
    const outside = regionStats(parentRegion[c]).mode;
    const inner = regionStats(big);
    const filled = cdist(inner.mode, outside) > T;
    // a filled frame shows its fill somewhere in depth: the interior of a bold glyph stroke is
    // a sliver a few pixels wide, a button, a card or an avatar has room inside
    if (filled) { if (sol < 0.64 || hr < 0.3 || !deep(big)) return null; }
    else if (sol < 0.85 || hr < 0.5 || w < 20 || h < 14) return null;
    return { filled, fill: filled ? inner.mode : outside, std: inner.std, sol, box };
  }

  /* Does a region have depth: some pixels 3px from its border in all four directions? */
  function deep(hh) {
    const g = regs[hh];
    let n = 0;
    for (let y = g.py0 + 3; y <= g.py1 - 3; y++) for (let x = g.px0 + 3; x <= g.px1 - 3; x++) {
      const i = y * W2 + x;
      if (rl[i] === hh && rl[i - 3] === hh && rl[i + 3] === hh && rl[i - 3 * W2] === hh && rl[i + 3 * W2] === hh && ++n >= 12) return true;
    }
    return false;
  }

  /* Pixel sets: the pixels of one edge component, or a piece split out of one. */
  const setOfComp = c => {
    const cc = comps[c], out = [];
    for (let y = cc.py0; y <= cc.py1; y++) for (let x = cc.px0; x <= cc.px1; x++) { const i = y * W2 + x; if (lab[i] === c) out.push(i); }
    return out;
  };
  const MARK = new Int32Array(N);
  let markGen = 0;
  const bboxOf = idx => {
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    for (const i of idx) { const x = i % W2, y = (i - x) / W2; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    return { px0: x0, py0: y0, px1: x1, py1: y1 };
  };
  /* 8-connected pieces of a pixel set. */
  function pieces(idx) {
    const g = ++markGen;
    for (const i of idx) MARK[i] = g;
    const out = [];
    for (const s0 of idx) {
      if (MARK[s0] !== g) continue;
      const st = [s0], mine = [];
      MARK[s0] = -g;
      while (st.length) {
        const p = st.pop(); mine.push(p);
        const px = p % W2;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (px + dx < 0 || px + dx >= W2) continue;
          const q = p + dy * W2 + dx;
          if (q >= 0 && q < N && MARK[q] === g) { MARK[q] = -g; st.push(q); }
        }
      }
      out.push(Object.assign({ idx: mine, n: mine.length }, bboxOf(mine)));
    }
    return out;
  }
  /* A closed band running along the set's bounding box with a uniform fill inside it is a
     frame, even when content touches the band (tight padding in pills, badges, buttons).
     Returns the fill and the content pixels peeled off the band, or null. */
  function peel(set) {
    const b = set.px0 != null ? set : bboxOf(set.idx);
    const x0 = b.px0, y0 = b.py0, x1 = b.px1, y1 = b.py1;
    const w = x1 - x0 + 1, h = y1 - y0 + 1;
    if (w < 18 || h < 14) return null;
    const g = ++markGen;
    for (const i of set.idx) MARK[i] = g;
    const mine = i => MARK[i] === g;
    // corners are skipped by the measured radius (not half the height), so a short badge
    // with square-ish corners still gets its left and right sides checked
    const rad = cornerRadius(mine, x0, y0, x1, y1);
    for (const i of set.idx) MARK[i] = g;
    const MAXB = 6, r = Math.max(3, Math.min(14, Math.floor(Math.min(w, h) / 2), Math.ceil(rad) + 2));
    const fills = [];
    let bandMax = 1;
    const scan = (from, step, count) => {
      let k = 0, i = from;
      while (k < count && mine(i)) { i += step; k++; }
      if (k >= 1 && k <= MAXB && k < count && !E[i]) { bandMax = Math.max(bandMax, k); fills.push(i); return 1; }
      return 0;
    };
    // each side: coverage, and the failures must come in at most two runs (a fusion point
    // is local; text fails at every stem)
    const side = (n, at) => {
      let ok = 0, runs = 0, prev = 1;
      for (let k = 0; k < n; k++) { const v = at(k); ok += v; if (!v && prev) runs++; prev = v; }
      return { n, ok, runs };
    };
    const flatX = x1 - r - (x0 + r) + 1, flatY = y1 - r - (y0 + r) + 1;
    if (flatX < 6) return null;
    const top = side(flatX, k => scan(y0 * W2 + x0 + r + k, W2, h));
    const bot = side(flatX, k => scan(y1 * W2 + x0 + r + k, -W2, h));
    const sides = [top, bot];
    if (flatY >= 3) {
      sides.push(side(flatY, k => scan((y0 + r + k) * W2 + x0, 1, w)));
      sides.push(side(flatY, k => scan((y0 + r + k) * W2 + x1, -1, w)));
    }
    const dbg = P.debugAt && x0 - 1 <= P.debugAt[0] && x1 >= P.debugAt[0] && y0 - 1 <= P.debugAt[1] && y1 >= P.debugAt[1];
    if (dbg) console.log('DBG peel', JSON.stringify({ x0: x0 - 1, y0: y0 - 1, x1, y1, r, flatX, flatY, sides }));
    // every side clean, or one side clean and its opposite broken in at most two places
    // (content sitting close to the band in a small badge)
    const clean = sd => sd.ok >= 0.8 * sd.n && sd.runs <= 2;
    const partial = sd => sd.ok >= 0.3 * sd.n && sd.runs <= 2;
    const pairOk = (a2, b2) => (clean(a2) && (clean(b2) || partial(b2))) || (clean(b2) && partial(a2));
    // a tight badge: text set close to its top or bottom touches the band at every stem, so
    // accept two clean opposite sides (or three clean sides) when every side is band for at
    // least some of its length
    const loose = sd => clean(sd) || sd.ok >= 0.15 * sd.n;
    const tight = (sides.length === 4 && sides.every(loose) &&
      (sides.filter(clean).length >= 3 || (clean(sides[2]) && clean(sides[3])) || (clean(sides[0]) && clean(sides[1])))) ||
      // a short pill whose corners leave no straight side to check: one clean long side and
      // the other band for most of its length, wherever the text touches it
      (sides.length === 2 && h <= 40 && ((clean(sides[0]) && sides[1].ok >= 0.6 * sides[1].n) || (clean(sides[1]) && sides[0].ok >= 0.6 * sides[0].n)));
    if (!tight) {
      if (!pairOk(sides[0], sides[1])) return null;
      if (sides.length > 2 && !pairOk(sides[2], sides[3])) return null;
    }
    // uniform fill just inside the band
    const fr = fills.map(i => R[i]), fg = fills.map(i => G[i]), fb = fills.map(i => Bc[i]);
    const med = a => a.slice().sort((p, q) => p - q)[a.length >> 1];
    const fill = [med(fr), med(fg), med(fb)];
    let agree = 0;
    for (let k = 0; k < fills.length; k++) if (Math.max(Math.abs(fr[k] - fill[0]), Math.abs(fg[k] - fill[1]), Math.abs(fb[k] - fill[2])) <= T) agree++;
    if (agree < 0.8 * fills.length) return null;
    // band pixels: near the sides, or near the corner arcs
    const ring = [], content = [];
    const cxL = x0 + r, cxR = x1 - r, cyT = y0 + r, cyB = y1 - r;
    for (const i of set.idx) {
      const x = i % W2, y = (i - x) / W2;
      let inBand;
      const inCX = x < cxL || x > cxR, inCY = y < cyT || y > cyB;
      if (inCX && inCY) {
        const ccx = x < cxL ? cxL : cxR, ccy = y < cyT ? cyT : cyB;
        inBand = Math.hypot(x - ccx, y - ccy) >= r - bandMax - 1.5;
      } else inBand = Math.min(x - x0, x1 - x, y - y0, y1 - y) <= bandMax;
      (inBand ? ring : content).push(i);
    }
    return { fill, bandMax, ring, content };
  }
  /* Long thin lines fused with whatever touches them (table row borders and the pills
     sitting under them, gridlines crossed by a chart) are split back into rules. */
  function splitRules(set) {
    const { px0: x0, py0: y0, px1: x1, py1: y1 } = set;
    const w = x1 - x0 + 1, h = y1 - y0 + 1;
    if ((w < 60 || h < 14) && (h < 60 || w < 14)) return null;
    const g = ++markGen;
    for (const i of set.idx) MARK[i] = g;
    const rowsFull = [], colsFull = [];
    if (w >= 40 && h > 6) for (let y = y0; y <= y1; y++) { let n = 0; for (let x = x0; x <= x1; x++) if (MARK[y * W2 + x] === g) n++; if (n >= 0.92 * w) rowsFull.push(y); }
    if (h >= 40 && w > 6) for (let x = x0; x <= x1; x++) { let n = 0; for (let y = y0; y <= y1; y++) if (MARK[y * W2 + x] === g) n++; if (n >= 0.92 * h) colsFull.push(x); }
    const bands = arr => { const out = []; for (const v of arr) { const l = out[out.length - 1]; if (l && v === l[1] + 1) l[1] = v; else out.push([v, v]); } return out.filter(([a, b2]) => b2 - a + 1 <= 10); };
    const cov = (y, isRow) => { let n = 0; if (isRow) { for (let x = x0; x <= x1; x++) if (MARK[y * W2 + x] === g) n++; return n / w; } for (let yy = y0; yy <= y1; yy++) if (MARK[yy * W2 + y] === g) n++; return n / h; };
    const lineLike = (a, b2, isRow) => {
      const c = Array.from({ length: b2 - a + 1 }, (_, k) => isRow ? transitions((a + k) * W2 + x0, 1, w) : transitions(y0 * W2 + a + k, W2, h)).sort((p, q) => p - q);
      return c[c.length >> 1] <= Math.max(6, (isRow ? w : h) / 30);
    };
    // a line's edge band is a few rows of full coverage plus at most a couple of partial
    // (anti-aliased) rows; growing further would eat content that hugs the line
    const grow = (bnd, isRow, lo, hi) => { let [a, b2] = bnd; for (let k = 0; k < 2 && a - 1 >= lo && cov(a - 1, isRow) >= 0.5; k++) a--; for (let k = 0; k < 2 && b2 + 1 <= hi && cov(b2 + 1, isRow) >= 0.5; k++) b2++; return [a, b2]; };
    const hb = w >= 60 ? bands(rowsFull).filter(([a, b2]) => h >= b2 - a + 5 && lineLike(a, b2, true)).map(bd => grow(bd, true, y0, y1)) : [];
    const vb = h >= 60 ? bands(colsFull).filter(([a, b2]) => w >= b2 - a + 5 && lineLike(a, b2, false)).map(bd => grow(bd, false, x0, x1)) : [];
    const inH = y => hb.some(([a, b2]) => y >= a && y <= b2), inV = x => vb.some(([a, b2]) => x >= a && x <= b2);
    if (!hb.length && !vb.length) return null;
    const rest = [];
    for (const i of set.idx) { const x = i % W2, y = (i - x) / W2; if (!inH(y) && !inV(x)) rest.push(i); }
    const rules = [...hb.map(([a, b2]) => ({ px0: x0, py0: a, px1: x1, py1: b2, n: w * (b2 - a + 1), rule: true })),
      ...vb.map(([a, b2]) => ({ px0: a, py0: y0, px1: b2, py1: y1, n: h * (b2 - a + 1), rule: true }))];
    // nothing but rules (a page's border network: a header line and two column dividers)
    if (rest.length < 6) return { rules, frameLike: false, bands: hb, rest: [] };
    // what is left must be content in its own right, not the inside of a bar
    const rb = bboxOf(rest);
    if ((hb.length && rb.py1 - rb.py0 < 5) || (vb.length && rb.px1 - rb.px0 < 5)) return null;
    // top and bottom bands plus closed sides: a frame whose content touches it, not two rules
    const sideCov = x => { let n = 0; for (let y = y0; y <= y1; y++) if (MARK[y * W2 + x] === g) n++; return n / h; };
    const frameLike = hb.length >= 2 && hb[0][0] <= y0 + 1 && hb[hb.length - 1][1] >= y1 - 1 && !vb.length &&
      Math.max(sideCov(x0), sideCov(x0 + 1), sideCov(x0 + 2)) >= 0.8 && Math.max(sideCov(x1), sideCov(x1 - 1), sideCov(x1 - 2)) >= 0.8 && h <= 60;
    return { rules, frameLike, bands: hb, rest: pieces(rest).filter(p => p.n >= 12 && p.px1 - p.px0 >= 4 && p.py1 - p.py0 >= 4) };
  }

  let nid = 0;
  const all = [];
  const mk = (kind, box, extra) => { const n = Object.assign({ id: ++nid, kind, box, children: [] }, extra); all.push(n); return n; };
  const pbox = p => B(p.px0 - 1, p.py0 - 1, p.px1, p.py1);

  function groupInk(ink0) {
    // specks of a few pixels (a faint gradient crossing the edge threshold) are noise
    const ink = ink0.filter(o => o.rule || o.n > 4 || Math.max(W_(o.box), H_(o.box)) > 3);
    const n = ink.length;
    if (!n) return [];
    if (P.debugInk) { const R0 = P.debugInk; for (const o of ink) if (o.box.x1 > R0[0] && o.box.x0 < R0[2] && o.box.y1 > R0[1] && o.box.y0 < R0[3]) console.log('DBG ink', JSON.stringify({ box: [o.box.x0, o.box.y0, o.box.x1, o.box.y1], n: o.n, rule: !!o.rule })); }
    const hs = ink.map(o => H_(o.box)).filter(h => h >= 6).sort((a, b) => a - b);
    const med = hs.length ? hs[hs.length >> 1] : 12;
    const maxH = ink.reduce((m, o) => Math.max(m, H_(o.box)), 0);
    const ruleCache = new Map();
    const isRule = o => {
      if (o.rule) return true;
      if (ruleCache.has(o)) return ruleCache.get(o);
      const w = W_(o.box), h = H_(o.box);
      let v = false;
      if (h <= 12 && w >= 5 * h && w >= 24) v = lineRuns(o.box, true) <= Math.max(6, w / 30);
      else if (w <= 12 && h >= 5 * w && h >= 24) v = lineRuns(o.box, false) <= Math.max(6, h / 30);
      ruleCache.set(o, v);
      return v;
    };
    const uf = new UF(n);
    const idx = [...Array(n).keys()].sort((a, b) => ink[a].box.x0 - ink[b].box.x0);
    for (let ii = 0; ii < n; ii++) {
      const a = ink[idx[ii]];
      if (isRule(a)) continue;
      const ha = H_(a.box);
      const reach = P.kH * Math.max(ha, maxH);
      for (let jj = ii + 1; jj < n; jj++) {
        const b = ink[idx[jj]];
        if (b.box.x0 - a.box.x1 > reach) break;
        if (isRule(b)) continue;
        const hb = H_(b.box);
        const vov = OVL(a.box.y0, a.box.y1, b.box.y0, b.box.y1);
        if (vov < 0.5 * Math.min(ha, hb)) continue;
        const gap = Math.max(a.box.x0, b.box.x0) - Math.min(a.box.x1, b.box.x1);
        // a hairline sliver much taller than its neighbour is the edge of a graphic (a chart's
        // fill against its axis), not a glyph of the label beside it
        const sliver = o => W_(o.box) <= 6 && H_(o.box) >= 3.5 * W_(o.box);
        if ((sliver(a) && ha > 1.6 * hb) || (sliver(b) && hb > 1.6 * ha)) continue;
        // very different heights (a graphic beside a legend): the smaller one sets the reach
        const hr = Math.max(ha, hb) > 2.5 * Math.min(ha, hb) ? Math.min(ha, hb) : Math.max(ha, hb);
        if (gap <= P.kH * hr) uf.union(idx[ii], idx[jj]);
      }
    }
    const gmap = new Map();
    for (let i = 0; i < n; i++) {
      const r = uf.find(i);
      if (!gmap.has(r)) gmap.set(r, { box: ink[i].box, members: [i], px: ink[i].n });
      else { const g = gmap.get(r); g.box = UNION(g.box, ink[i].box); g.members.push(i); g.px += ink[i].n; }
    }
    let lines = [...gmap.values()];
    // satellites (dots, accents, stray marks) join the nearest line that surrounds them
    const tiny = l => l.members.length === 1 && Math.max(W_(l.box), H_(l.box)) <= 0.45 * med && !isRule(ink[l.members[0]]);
    const big = lines.filter(l => !tiny(l));
    for (const t of lines.filter(tiny)) {
      let best = null, bd = Infinity;
      const cx = CX(t.box), cy = CY(t.box);
      for (const l of big) {
        // accents, dots and underscores sit within a third of a line height of it
        const g = { x0: l.box.x0 - 0.6 * H_(l.box), x1: l.box.x1 + 0.6 * H_(l.box), y0: l.box.y0 - 0.35 * H_(l.box), y1: l.box.y1 + 0.35 * H_(l.box) };
        if (cx < g.x0 || cx > g.x1 || cy < g.y0 || cy > g.y1) continue;
        const d = Math.hypot(clamp(cx, l.box.x0, l.box.x1) - cx, clamp(cy, l.box.y0, l.box.y1) - cy);
        if (d < bd) { bd = d; best = l; }
      }
      if (best) { best.box = UNION(best.box, t.box); best.members.push(...t.members); best.px += t.px; t.dead = true; }
    }
    lines = lines.filter(l => !l.dead);
    lines.forEach(l => { l.rule = l.members.length === 1 && isRule(ink[l.members[0]]); });
    // lines → paragraphs
    const m = lines.length;
    const uf2 = new UF(m);
    const ord = [...Array(m).keys()].sort((a, b) => lines[a].box.y0 - lines[b].box.y0);
    for (let ii = 0; ii < m; ii++) {
      const a = lines[ord[ii]];
      if (a.rule) continue;
      for (let jj = ii + 1; jj < m; jj++) {
        const b = lines[ord[jj]];
        if (b.box.y0 - a.box.y1 > P.kV * maxH + 4) break;
        if (b.rule) continue;
        const ha = H_(a.box), hb = H_(b.box), hmin = Math.min(ha, hb), hmax = Math.max(ha, hb);
        if (hmax / hmin > 1.6) continue;
        // a long single-component line is a graphic (sparkline, bar), not a line of text
        if ((a.members.length === 1 && W_(a.box) >= 6 * ha) || (b.members.length === 1 && W_(b.box) >= 6 * hb)) continue;
        const da = a.px / Math.max(1, W_(a.box) * ha), db = b.px / Math.max(1, W_(b.box) * hb);
        if (Math.max(da, db) / Math.max(1e-6, Math.min(da, db)) > 2.5) continue;
        const vgap = b.box.y0 - a.box.y1;
        if (vgap < -0.3 * hmin || vgap > P.kV * hmin) continue;
        const xo = OVL(a.box.x0, a.box.x1, b.box.x0, b.box.x1);
        const tol = 0.6 * hmax;
        const aligned = Math.abs(a.box.x0 - b.box.x0) <= tol || Math.abs(CX(a.box) - CX(b.box)) <= tol || Math.abs(a.box.x1 - b.box.x1) <= tol;
        if (xo < 0.25 * Math.min(W_(a.box), W_(b.box)) && !aligned) continue;
        uf2.union(ord[ii], ord[jj]);
      }
    }
    const pmap = new Map();
    for (let i = 0; i < m; i++) {
      const r = uf2.find(i);
      const l = lines[i];
      if (!pmap.has(r)) pmap.set(r, { box: l.box, lines: 1, parts: l.members.length, px: l.px, rule: l.rule, members: l.members.slice() });
      else { const p = pmap.get(r); p.box = UNION(p.box, l.box); p.lines++; p.parts += l.members.length; p.px += l.px; p.rule = false; p.members.push(...l.members); }
    }
    return [...pmap.values()].map(p => {
      const w = W_(p.box), h = H_(p.box);
      let kind = 'text';
      if (p.rule) kind = 'rule';
      else if (p.lines === 1 && p.parts <= 2 && w / h > 0.6 && w / h < 1.6 && h <= 2.4 * med) kind = 'icon';
      else if (p.lines === 1 && p.parts === 1 && w >= 40 && h >= 40) kind = 'image';
      else if (p.lines <= 2 && p.parts <= 3 && w >= 40 && h >= 3 * med) kind = 'image';
      else if (p.members.some(k => { const o = ink[k]; const oh = H_(o.box), ow = W_(o.box); return oh >= 2.5 * med && ow >= 2.5 * med && o.n / Math.max(1, ow * oh) <= 0.25; })) kind = 'image';
      // Word-shape signature: normalized widths of the horizontal runs (≈ words) of a one-line block.
      let sig = null;
      if (kind === 'text' && p.lines === 1) {
        const iv = p.members.map(k => [ink[k].box.x0, ink[k].box.x1]).sort((a, b) => a[0] - b[0]);
        const runs = [];
        for (const [a, b] of iv) { const last = runs[runs.length - 1]; if (last && a <= last[1] + 1) last[1] = Math.max(last[1], b); else runs.push([a, b]); }
        sig = runs.map(([a, b]) => (b - a) / Math.max(1, w));
      }
      return { kind, box: p.box, lines: p.lines, parts: p.parts, px: p.px, sig, density: p.px / Math.max(1, w * h) };
    });
  }

  /* Fewest color runs along any row (column) of a box: a rule or a bar has a handful,
     a line of text has dozens. */
  function lineRuns(box, isRow) {
    const x0 = Math.max(1, Math.floor(box.x0) + 1), x1 = Math.min(W2 - 2, Math.ceil(box.x1));
    const y0 = Math.max(1, Math.floor(box.y0) + 1), y1 = Math.min(H2 - 2, Math.ceil(box.y1));
    const counts = [];
    if (isRow) for (let y = y0; y <= y1; y++) counts.push(transitions(y * W2 + x0, 1, x1 - x0 + 1));
    else for (let x = x0; x <= x1; x++) counts.push(transitions(y0 * W2 + x, W2, y1 - y0 + 1));
    counts.sort((a, b) => a - b);
    return counts.length ? counts[counts.length >> 1] : Infinity;
  }
  /* Color transitions along a row or column: a rule or a bar has a handful, text has dozens. */
  function transitions(from, step, count) {
    let n = 0;
    for (let k = 1, i = from + step; k < count; k++, i += step) {
      const p = i - step;
      if (Math.max(Math.abs(R[i] - R[p]), Math.abs(G[i] - G[p]), Math.abs(Bc[i] - Bc[p])) > T) n++;
    }
    return n;
  }

  /* Corner radius from the empty run along each corner's diagonal (a rounded corner of radius
     r leaves r(1 − 1/√2) px of diagonal empty). Median of the four corners. */
  function cornerRadius(mine, x0, y0, x1, y1) {
    // empty area cut off each corner: r²(1 − π/4) for a corner of radius r
    const L = Math.min(30, Math.floor(Math.min(x1 - x0, y1 - y0) / 2));
    const g = ++markGen;
    const rs = [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]].map(([cx, cy, sx, sy]) => {
      const st = [[0, 0]];
      let n = 0;
      const seen = new Set(['0,0']);
      if (mine(cy * W2 + cx)) return 0;
      while (st.length) {
        const [a, b2] = st.pop(); n++;
        for (const [da, db] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
          const na = a + da, nb = b2 + db;
          if (na < 0 || nb < 0 || na >= L || nb >= L) continue;
          const key = na + ',' + nb;
          if (seen.has(key)) continue;
          seen.add(key);
          if (mine((cy + sy * nb) * W2 + cx + sx * na)) continue;
          st.push([na, nb]);
        }
      }
      return Math.sqrt(n / 0.2146);
    }).sort((a, b2) => a - b2);
    return (rs[1] + rs[2]) / 2;
  }

  /* A panel is a rectilinear hole: its outline is flat along each side once the corners are
     skipped. The spread (10th–90th percentile) of the first region pixel seen from each side
     stays within a pixel or two for a panel and follows the curve for a chart band. */
  function rectilinear(hh) {
    const g = regs[hh];
    const w = g.px1 - g.px0 + 1, h = g.py1 - g.py0 + 1;
    const mx = Math.min(16, Math.floor(w / 4)), my = Math.min(16, Math.floor(h / 4));
    const spread = a => { if (a.length < 4) return 0; a.sort((p, q) => p - q); return a[Math.floor(a.length * 0.9)] - a[Math.floor(a.length * 0.1)]; };
    const tops = [], bots = [], lefts = [], rights = [];
    for (let x = g.px0 + mx; x <= g.px1 - mx; x++) {
      let y = g.py0; while (y <= g.py1 && rl[y * W2 + x] !== hh) y++;
      if (y > g.py1) continue;
      tops.push(y);
      let y2 = g.py1; while (y2 >= g.py0 && rl[y2 * W2 + x] !== hh) y2--;
      bots.push(y2);
    }
    for (let y = g.py0 + my; y <= g.py1 - my; y++) {
      let x = g.px0; while (x <= g.px1 && rl[y * W2 + x] !== hh) x++;
      if (x > g.px1) continue;
      lefts.push(x);
      let x2 = g.px1; while (x2 >= g.px0 && rl[y * W2 + x2] !== hh) x2--;
      rights.push(x2);
    }
    const lim = 6;
    return spread(tops) <= lim && spread(bots) <= lim && spread(lefts) <= lim && spread(rights) <= lim;
  }

  /* Containers built from peeled pixel sets have no region structure of their own; ink
     at this level whose box sits inside one is handed to it as a child. */
  function virtualFrame(pv, set, parentFill, depth, parent) {
    const box = pbox(set);
    const filled = cdist(pv.fill, parentFill) > T;
    // solidity from the outline: per row, the span between the outermost band pixels
    const span = new Map();
    for (const i of pv.ring) { const x = i % W2, y = (i - x) / W2; const r = span.get(y); if (!r) span.set(y, [x, x]); else { if (x < r[0]) r[0] = x; if (x > r[1]) r[1] = x; } }
    let area = 0;
    for (const [, [a, b2]] of span) area += b2 - a + 1;
    const sol = area / ((set.px1 - set.px0 + 1) * (set.py1 - set.py0 + 1));
    const node = mk('container', box, { fill: filled ? pv.fill : parentFill, filled, solidity: sol, std: 0, depth, parent, bg: parentFill, peeled: true });
    { const g2 = ++markGen; for (const i of set.idx) MARK[i] = g2; node.radius = cornerRadius(i => MARK[i] === g2, set.px0, set.py0, set.px1, set.py1); }
    node._ink = pieces(pv.content).filter(p => p.n >= 3).map(p => ({ box: pbox(p), n: p.n }));
    node.color = node.fill;
    return node;
  }

  function buildLevel(regionList, parentFill, depth, parent, extraInk) {
    const nodes = [], ink = extraInk ? extraInk.slice() : [];
    const virtual = [];
    const queue = regionList.slice();
    for (let qi = 0; qi < queue.length; qi++) for (const c of compsIn[queue[qi]]) {
      const cls = classify(c);
      if (cls) {
        const node = mk('container', cls.box, { fill: cls.fill, filled: cls.filled, solidity: cls.sol, std: cls.std, depth, parent, bg: parentFill });
        { const cc = comps[c]; node.radius = cornerRadius(i => lab[i] === c, cc.px0, cc.py0, cc.px1, cc.py1); }
        // several large holes = several panels sharing one border network: one cell each
        const A = W_(cls.box) * H_(cls.box);
        const sig = holesOf[c].filter(hh => { const g = regs[hh]; return holeA[hh] >= 0.02 * A && g.px1 - g.px0 >= 24 && g.py1 - g.py0 >= 16; });
        if (sig.length >= 2 && sig.some(hh => !rectilinear(hh))) {
          // holes bounded by curves (the bands of a stacked area chart) make a graphic, not a
          // set of panels: one picture, compared by its box
          node.kind = 'image'; node.graphic = true; node.children = []; node.color = node.fill;
          nodes.push(node);
          continue;
        }
        if (sig.length >= 2) {
          const kids = [];
          for (const hh of sig) {
            const g = regs[hh], st = regionStats(hh);
            const cell = mk('container', B(g.px0 - 1, g.py0 - 1, g.px1, g.py1), { fill: st.mode, filled: cdist(st.mode, cls.fill) > T, solidity: 1, std: st.std, depth: depth + 1, parent: node, bg: cls.fill, cell: true });
            cell.children = buildLevel([hh], st.mode, depth + 2, cell);
            if (!cell.children.length) cell.kind = st.std > 26 ? 'image' : 'shape';
            cell.color = cell.fill;
            kids.push(cell);
          }
          node.children = kids.concat(buildLevel(holesOf[c].filter(hh => !sig.includes(hh)), cls.fill, depth + 1, node));
        } else node.children = buildLevel(holesOf[c], cls.fill, depth + 1, node);
        if (!node.children.length) node.kind = cls.std > 26 ? 'image' : 'shape';
        node.color = node.fill;
        nodes.push(node);
        continue;
      }
      // A border network that is not a frame itself (an app shell: rail, section panel and
      // header sharing their borders around the page) still encloses panels: each large
      // rectilinear hole becomes a container of its own; the borders carry no content.
      const shell = holesOf[c].filter(hh => { const g = regs[hh]; return holeA[hh] >= 4000 && g.px1 - g.px0 >= 40 && g.py1 - g.py0 >= 24 && rectilinear(hh); });
      if (shell.length) {
        for (const hh of shell) {
          const g = regs[hh], st = regionStats(hh);
          const cell = mk('container', B(g.px0 - 1, g.py0 - 1, g.px1, g.py1), { fill: st.mode, filled: cdist(st.mode, parentFill) > T, solidity: 1, std: st.std, depth, parent, bg: parentFill, cell: true });
          cell.children = buildLevel([hh], st.mode, depth + 1, cell);
          if (!cell.children.length) cell.kind = st.std > 26 ? 'image' : 'shape';
          cell.color = cell.fill;
          nodes.push(cell);
        }
        for (const h of holesOf[c]) if (!shell.includes(h) && compsIn[h].length) queue.push(h);
        continue;
      }
      // not a frame by holes: a frame with fused content, rules fused with content, or ink
      for (const h of holesOf[c]) if (compsIn[h].length) queue.push(h);
      const cc = comps[c];
      const big = cc.px1 - cc.px0 >= 17 && cc.py1 - cc.py0 >= 13;
      const long = cc.px1 - cc.px0 >= 39 || cc.py1 - cc.py0 >= 39;
      const dbgC = P.debugAt && cc.px0 - 1 <= P.debugAt[0] && cc.px1 >= P.debugAt[0] && cc.py0 - 1 <= P.debugAt[1] && cc.py1 >= P.debugAt[1];
      if (dbgC) console.log('DBG comp', JSON.stringify({ box: boxOf(cc), n: cc.n, big, long, holes: holesOf[c].length }));
      if (!big && !long) { ink.push({ c, box: boxOf(cc), n: cc.n }); continue; }
      const set = Object.assign({ idx: setOfComp(c) }, cc);
      // an outline with nothing inside it on the parent's own color is a glyph (a bold "o")
      const pv0 = big ? peel(set) : null;
      const pv = pv0 && (cdist(pv0.fill, parentFill) > T || pv0.content.length >= 12) ? pv0 : null;
      if (dbgC) { const sr0 = pv ? null : splitRules(set); console.log('DBG comp-split', JSON.stringify({ peeled: !!pv, sr: sr0 && { rules: sr0.rules.map(r => [r.px0 - 1, r.py0 - 1, r.px1, r.py1]), frameLike: sr0.frameLike, bands: sr0.bands, rest: sr0.rest.map(p => [p.px0 - 1, p.py0 - 1, p.px1, p.py1, p.n]) } })); }
      if (pv) { const vf = virtualFrame(pv, set, parentFill, depth, parent); vf._src = { box: boxOf(cc), n: cc.n, c }; virtual.push(vf); continue; }
      const sr = splitRules(set);
      if (!sr) { ink.push({ c, box: boxOf(cc), n: cc.n }); continue; }
      if (sr.frameLike) {
        // fill: median of the non-edge pixels between the bands
        const top = sr.bands[0][1] + 1, bot = sr.bands[sr.bands.length - 1][0] - 1;
        const fr = [], fg = [], fb = [];
        for (let y = top; y <= bot; y++) for (let x = cc.px0 + 2; x <= cc.px1 - 2; x++) { const i = y * W2 + x; if (!E[i]) { fr.push(R[i]); fg.push(G[i]); fb.push(Bc[i]); } }
        if (fr.length >= 6) {
          const md = a2 => a2.sort((p2, q) => p2 - q)[a2.length >> 1];
          const ring = [], content = [];
          const g2 = ++markGen;
          // pieces hugging the left or right end are the frame's sides, not content
          const sideBand = p2 => p2.px1 - p2.px0 <= 6 && (p2.px0 <= cc.px0 + 1 || p2.px1 >= cc.px1 - 1);
          for (const p2 of sr.rest) if (!sideBand(p2)) for (const i of p2.idx) MARK[i] = g2;
          for (const i of set.idx) (MARK[i] === g2 ? content : ring).push(i);
          virtual.push(virtualFrame({ fill: [md(fr), md(fg), md(fb)], bandMax: 3, ring, content }, set, parentFill, depth, parent));
          continue;
        }
      }
      for (const r of sr.rules) ink.push({ box: pbox(r), n: r.n, rule: true });
      for (const p of sr.rest) {
        const pv2 = p.px1 - p.px0 >= 17 && p.py1 - p.py0 >= 13 ? peel(p) : null;
        if (pv2) virtual.push(virtualFrame(pv2, p, parentFill, depth, parent));
        else ink.push({ box: pbox(p), n: p.n });
      }
    }
    // A peeled outline that sits tight against ink of its own height is a run of fused bold
    // glyphs ("you" in a 52px headline), not a badge: badges keep a gap and stand taller
    // than the text beside them.
    for (let k = virtual.length - 1; k >= 0; k--) {
      const v = virtual[k];
      if (!v._src) continue;
      const hv = H_(v.box);
      const glued = ink.some(o => {
        const ho = H_(o.box);
        if (OVL(o.box.y0, o.box.y1, v.box.y0, v.box.y1) < 0.6 * Math.min(hv, ho) || Math.max(hv, ho) > 1.4 * Math.min(hv, ho)) return false;
        const gap = Math.max(o.box.x0, v.box.x0) - Math.min(o.box.x1, v.box.x1);
        return gap <= 0.2 * hv;
      });
      if (glued) { ink.push({ c: v._src.c, box: v._src.box, n: v._src.n }); all.splice(all.indexOf(v), 1); virtual.splice(k, 1); }
    }
    // hand ink that sits inside a virtual frame to that frame
    for (const v of virtual) {
      const inside = [];
      for (let k = ink.length - 1; k >= 0; k--) {
        const b = ink[k].box;
        if (b.x0 >= v.box.x0 - 1 && b.y0 >= v.box.y0 - 1 && b.x1 <= v.box.x1 + 1 && b.y1 <= v.box.y1 + 1) { inside.push(ink[k]); ink.splice(k, 1); }
      }
      const kids = groupInk(v._ink.concat(inside));
      v.children = kids.map(blk => {
        const n = mk(blk.kind, blk.box, { lines: blk.lines, parts: blk.parts, px: blk.px, sig: blk.sig, density: blk.density, depth: depth + 1, parent: v, bg: v.fill });
        const ic = inkColor(data, W, H, blk.box, v.fill); n.color = ic.color; n.palette = ic.palette;
        if (blk.kind === 'text' && blk.lines === 1) n.prof = inkProfile(data, W, H, blk.box, v.fill);
        if (blk.kind === 'icon') n.mask = glyphMask(data, W, H, blk.box, v.fill);
        return n;
      });
      delete v._ink;
      if (!v.children.length) v.kind = 'shape';
      nodes.push(v);
    }
    for (const blk of groupInk(ink)) {
      // specks (a few pixels where a faint gradient crosses the edge threshold) are noise
      if (blk.kind === 'text' && W_(blk.box) <= 3 && H_(blk.box) <= 3) continue;
      const node = mk(blk.kind, blk.box, { lines: blk.lines, parts: blk.parts, px: blk.px, sig: blk.sig, density: blk.density, depth, parent, bg: parentFill });
      const ic = inkColor(data, W, H, blk.box, parentFill);
      node.color = ic.color; node.palette = ic.palette;
      if (blk.kind === 'text' && blk.lines === 1) node.prof = inkProfile(data, W, H, blk.box, parentFill);
      if (blk.kind === 'icon') node.mask = glyphMask(data, W, H, blk.box, parentFill);
      nodes.push(node);
    }
    return nodes;
  }

  const root = { id: 0, kind: 'root', box: B(0, 0, W, H), fill: bg, color: bg, depth: 0, children: [] };
  root.children = buildLevel([outer], bg, 1, root);
  // an icon's height against the page's single-line text: real icons stand taller than the
  // text beside them, while digits and initials that look like icons do not
  { const th = all.filter(n => n.kind === 'text' && n.lines === 1).map(n => H_(n.box)).sort((a, b2) => a - b2);
    const tm = th.length ? th[th.length >> 1] : 14;
    for (const n of all) if (n.kind === 'icon') n.tall = H_(n.box) / tm; }
  const ms = performance.now() - t0;
  return { root, nodes: all, W, H, bg, stats: { edgeComponents: nc, regions: nr, nodes: all.length, ms } };
}

/* Ink color of a block: the mean of its most contrasting pixels, plus a small palette of
   the distinct colors among its strong pixels (a legend mixes colored dots with gray text). */
function inkColor(data, W, H, box, bgc) {
  const x0 = clamp(Math.floor(box.x0), 0, W - 1), x1 = clamp(Math.ceil(box.x1), 1, W);
  const y0 = clamp(Math.floor(box.y0), 0, H - 1), y1 = clamp(Math.ceil(box.y1), 1, H);
  const step = Math.max(1, Math.floor(Math.sqrt(((x1 - x0) * (y1 - y0)) / 5000)));
  const s = [];
  for (let y = y0; y < y1; y += step) for (let x = x0; x < x1; x += step) {
    const i = (y * W + x) * 4;
    const c = [data[i], data[i + 1], data[i + 2]];
    const d = cdist(c, bgc);
    if (d > 24) s.push([d, c]);
  }
  if (!s.length) return { color: bgc.slice(), palette: [[bgc.slice(), 1]] };
  s.sort((a, b) => b[0] - a[0]);
  const k = Math.max(1, Math.round(s.length * 0.12));
  const acc = [0, 0, 0];
  for (let i = 0; i < k; i++) { acc[0] += s[i][1][0]; acc[1] += s[i][1][1]; acc[2] += s[i][1][2]; }
  const color = acc.map(v => v / k);
  // palette: pixels at least ~half as contrasting as the strongest few, binned at 3 bits per
  // channel, bins of ≥ 12% weight. A fixed share of pixels would let faint texture (the dots of
  // a map) outvote the marks drawn on it whenever anti-aliasing moves a few across the cut.
  const p95 = s[Math.min(s.length - 1, Math.floor(s.length * 0.05))][0];
  let strong = s.filter(x => x[0] >= 0.45 * p95);
  if (strong.length > Math.round(s.length * 0.35)) strong = strong.slice(0, Math.max(1, Math.round(s.length * 0.35)));
  if (strong.length < 4) strong = s.slice(0, Math.max(1, Math.round(s.length * 0.35)));
  const bins = new Map();
  for (const [, c] of strong) {
    const key = ((c[0] >> 5) << 6) | ((c[1] >> 5) << 3) | (c[2] >> 5);
    const b = bins.get(key) || { n: 0, r: 0, g: 0, b: 0 };
    b.n++; b.r += c[0]; b.g += c[1]; b.b += c[2];
    bins.set(key, b);
  }
  const tot = strong.length;
  let palette = [...bins.values()].filter(b => b.n >= 0.12 * tot).sort((a, b) => b.n - a.n).slice(0, 4).map(b => [[b.r / b.n, b.g / b.n, b.b / b.n], b.n / tot]);
  if (!palette.length) palette = [[color, 1]];
  const ws = palette.reduce((a, p) => a + p[1], 0);
  palette.forEach(p => { p[1] /= ws; });
  return { color, palette };
}

/* Left-to-right profile of a line of text: in each of eight bins, how much ink, how dark it
   is, and how tall. Fonts change glyph shapes but not the order of words, their color or
   their size, so two renders of one line agree bin by bin up to a small shift. */
function inkProfile(data, W, H, box, bgc) {
  const x0 = clamp(Math.floor(box.x0), 0, W - 1), x1 = clamp(Math.ceil(box.x1), 1, W);
  const y0 = clamp(Math.floor(box.y0), 0, H - 1), y1 = clamp(Math.ceil(box.y1), 1, H);
  const N = 8, n = new Array(N).fill(0), lum = new Array(N).fill(0), top = new Array(N).fill(1), bot = new Array(N).fill(0);
  const bw = (x1 - x0) / N, bh = Math.max(1, y1 - y0);
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const i = (y * W + x) * 4;
    const c = [data[i], data[i + 1], data[i + 2]];
    if (cdist(c, bgc) <= 48) continue;
    const k = Math.min(N - 1, Math.floor((x - x0) / bw));
    n[k]++; lum[k] += 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
    const t = (y - y0) / bh; if (t < top[k]) top[k] = t; if (t > bot[k]) bot[k] = t;
  }
  return { n, lum: lum.map((v, k) => (n[k] ? v / n[k] : null)), ext: top.map((t, k) => (n[k] ? bot[k] - t : null)) };
}

/* Where the ink of a small glyph sits: in each cell of a 12 × 12 grid over its box, how much
   ink there is (each pixel weighted by its contrast with the background). Icons come from the
   same set on both sides, so a swapped icon shows up as a different pattern even when its
   size, color and weight match. */
function glyphMask(data, W, H, box, bgc) {
  const x0 = clamp(Math.floor(box.x0), 0, W - 1), x1 = clamp(Math.ceil(box.x1), 1, W);
  const y0 = clamp(Math.floor(box.y0), 0, H - 1), y1 = clamp(Math.ceil(box.y1), 1, H);
  const N = 12, cnt = new Array(N * N).fill(0), tot = new Array(N * N).fill(0);
  const bw = (x1 - x0) / N, bh = (y1 - y0) / N;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const i = (y * W + x) * 4;
    const k = Math.min(N - 1, Math.floor((y - y0) / bh)) * N + Math.min(N - 1, Math.floor((x - x0) / bw));
    tot[k]++;
    cnt[k] += Math.min(1, cdist([data[i], data[i + 1], data[i + 2]], bgc) / 160);
  }
  return cnt.map((c, k) => (tot[k] ? c / tot[k] : 0));
}

export { pageBackground, UF, segment, inkColor, inkProfile, glyphMask };
