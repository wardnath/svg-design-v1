ç/* =====================================================================
   Redline engine — layout registration from pixels only.
   Both sides are rasterized; nothing below ever reads the DOM of the
   implementation. Segmentation → containment tree → per-level alignment
   → residual attribution (parent + flow) → findings.
   ===================================================================== */
const Engine = (() => {
  'use strict';

  /* ---------------- geometry ---------------- */
  const B = (x0, y0, x1, y1) => ({ x0, y0, x1, y1 });
  const W_ = b => b.x1 - b.x0;
  const H_ = b => b.y1 - b.y0;
  const CX = b => (b.x0 + b.x1) / 2;
  const CY = b => (b.y0 + b.y1) / 2;
  const AREA = b => Math.max(0, W_(b)) * Math.max(0, H_(b));
  const UNION = (a, b) => B(Math.min(a.x0, b.x0), Math.min(a.y0, b.y0), Math.max(a.x1, b.x1), Math.max(a.y1, b.y1));
  const UNIONS = arr => arr.reduce((u, b) => (u ? UNION(u, b) : b), null);
  const INTER = (a, b) => {
    const x0 = Math.max(a.x0, b.x0), y0 = Math.max(a.y0, b.y0), x1 = Math.min(a.x1, b.x1), y1 = Math.min(a.y1, b.y1);
    return x1 > x0 && y1 > y0 ? B(x0, y0, x1, y1) : null;
  };
  const OVL = (a0, a1, b0, b1) => Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));
  const SHIFT = (b, dx, dy) => B(b.x0 + dx, b.y0 + dy, b.x1 + dx, b.y1 + dy);
  const GROW = (b, p) => B(b.x0 - p, b.y0 - p, b.x1 + p, b.y1 + p);
  const minAbs = arr => arr.reduce((m, v) => (Math.abs(v) < Math.abs(m) ? v : m), Infinity);
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  /* ---------------- color ---------------- */
  const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  function lab(rgb) {
    const r = lin(rgb[0]), g = lin(rgb[1]), b = lin(rgb[2]);
    const f = t => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
    const X = f((r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047);
    const Y = f(r * 0.2126 + g * 0.7152 + b * 0.0722);
    const Z = f((r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883);
    return [116 * Y - 16, 500 * (X - Y), 200 * (Y - Z)];
  }
  const dE = (a, b) => { const p = lab(a), q = lab(b); return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); };
  const cdist = (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));
  const hex = c => '#' + c.map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');

  /* ---------------- defaults ---------------- */
  const DEFAULTS = {
    edgeT: 10,          // max-channel step that counts as an edge
    kH: 0.9,            // word/line merge: horizontal gap ≤ kH × glyph height
    kV: 0.45,           // line→paragraph merge: vertical gap ≤ kV × line height (lists stay separate)
    posTol: 6,          // px of unexplained displacement that is still fine
    textPosMul: 1.5,    // text gets extra slack (ascender/line-box differences between fonts)
    textSizeTol: 0.6,   // text ink mass may differ by ±60% (font fallback, weight); reflow is free
    sizeTol: 6,         // px (or 5%) for boxes
    colorTol: 12,       // ΔE76 for fills
    textColorTol: 24,   // ΔE76 for text ink (anti-aliasing, weight)
    transTau: 24,       // px that make one unit of positional cost in matching
    gapBase: 1.4,       // cost to leave an element unmatched
    resetPen: 0.4,      // cost of re-anchoring to the parent mid-sequence
    posPrior: 0.05,     // tie-breaking parent-relative prior inside the emission cost
    window: 6,          // max consecutive skips between linked matches
    merges: true,       // allow 2:1 / 1:2 text block merges
    rescue: true,       // order-free second pass for leftovers (swaps, wraps)
    rescueMax: 2.0,
    flatten: true,      // splice children of unmatched frames into the parent level
    pixT: 40,           // pixel diff threshold (0–255)
    ssimT: 0.72,        // SSIM below this is flagged
  };

  /* ---------------- rasterization ---------------- */
  async function loadImage(url) {
    const img = new Image();
    img.src = url;
    try { await img.decode(); } catch (e) {
      throw new Error('The browser could not decode this input as an image (' + (e && e.message || 'decode failed') + ').');
    }
    return img;
  }
  function toImageData(img, W, H, mode) {
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    if (mode === 'fitWidth') {
      const s = W / img.naturalWidth;
      ctx.drawImage(img, 0, 0, W, img.naturalHeight * s);
    } else ctx.drawImage(img, 0, 0, W, H);
    try { return ctx.getImageData(0, 0, W, H); } catch (e) {
      throw new Error('This browser refuses to read back the rendered HTML (tainted canvas). Use Chrome, or upload a PNG screenshot instead.');
    }
  }
  function svgSize(svgText) {
    const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
    if (doc.getElementsByTagName('parsererror').length) throw new Error('The SVG is not well-formed XML.');
    const svg = doc.documentElement;
    let w = parseFloat(svg.getAttribute('width')), h = parseFloat(svg.getAttribute('height'));
    const vb = (svg.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
    if ((!w || !h) && vb.length === 4) { w = w || vb[2]; h = h || vb[3]; }
    return { w: Math.round(w || 800), h: Math.round(h || 600) };
  }
  function ensureSvgSize(svgText, W, H) {
    const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
    const svg = doc.documentElement;
    if (!svg.getAttribute('width')) svg.setAttribute('width', W);
    if (!svg.getAttribute('height')) svg.setAttribute('height', H);
    return new XMLSerializer().serializeToString(doc);
  }
  const svgUrl = s => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);

  function htmlToXhtml(html, mutate) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll('script, link[rel="stylesheet"], iframe, object, embed').forEach(n => n.remove());
    if (mutate) mutate(doc);
    return new XMLSerializer().serializeToString(doc.documentElement);
  }
  function foreignObjectSvg(xhtml, W, H) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
      `<foreignObject x="0" y="0" width="${W}" height="${H}">${xhtml}</foreignObject></svg>`;
  }
  async function rasterize(src, W, H) {
    if (src.type === 'svg') {
      const img = await loadImage(svgUrl(ensureSvgSize(src.text, W, H)));
      return toImageData(img, W, H);
    }
    if (src.type === 'html') {
      const img = await loadImage(svgUrl(foreignObjectSvg(htmlToXhtml(src.text), W, H)));
      return toImageData(img, W, H);
    }
    if (src.type === 'image') {
      const img = await loadImage(src.url);
      return toImageData(img, W, H, 'fitWidth');
    }
    throw new Error('Unknown source type ' + src.type);
  }
  function nativeSize(src) {
    return new Promise((resolve, reject) => {
      if (src.type === 'svg') return resolve(svgSize(src.text));
      if (src.type === 'image') {
        const img = new Image();
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = () => reject(new Error('Image did not load.'));
        img.src = src.url;
        return;
      }
      resolve(null);
    });
  }

  /* Ground truth for the benchmark. The eval harness (never the algorithms)
     re-renders the implementation with every [data-bug] element painted a
     unique solid color and everything else visibility:hidden — same layout,
     so the marker pixels give exact boxes. */
  async function groundTruth(html, W, H) {
    const labels = [];
    const xhtml = htmlToXhtml(html, doc => {
      const st = doc.createElement('style');
      st.textContent = 'html, html *{visibility:hidden!important;}';
      (doc.head || doc.documentElement).appendChild(st);
      doc.querySelectorAll('[data-bug]').forEach((el, k) => {
        labels.push(el.getAttribute('data-bug'));
        const col = `rgb(${(k * 53 + 31) % 200 + 40},${255 - k},${(k * 97 + 11) % 200 + 40})`;
        el.style.setProperty('visibility', 'visible', 'important');
        el.style.setProperty('background', col, 'important');
        el.style.setProperty('border-color', 'transparent', 'important');
        el.style.setProperty('box-shadow', 'none', 'important');
        el.style.setProperty('outline', 'none', 'important');
        el.style.setProperty('color', 'transparent', 'important');
        el.setAttribute('data-bugk', k);
      });
    });
    if (!labels.length) return [];
    const img = await loadImage(svgUrl(foreignObjectSvg(xhtml, W, H)));
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    ctx.drawImage(img, 0, 0, W, H);
    const d = ctx.getImageData(0, 0, W, H).data;
    const boxes = labels.map(() => null);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const k = 255 - d[i + 1];
      if (k < 0 || k >= labels.length || d[i] === 0) continue;
      const er = (k * 53 + 31) % 200 + 40, eb = (k * 97 + 11) % 200 + 40;
      if (Math.abs(d[i] - er) > 2 || Math.abs(d[i + 2] - eb) > 2) continue;
      const b = boxes[k];
      if (!b) boxes[k] = B(x, y, x + 1, y + 1);
      else { if (x < b.x0) b.x0 = x; if (y < b.y0) b.y0 = y; if (x + 1 > b.x1) b.x1 = x + 1; if (y + 1 > b.y1) b.y1 = y + 1; }
    }
    return labels.map((label, k) => boxes[k] && { label, box: boxes[k], space: 'impl' }).filter(Boolean);
  }

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
      if (hr < 0.28 || sol < 0.6) return null;
      const outside = regionStats(parentRegion[c]).mode;
      const inner = regionStats(big);
      const filled = cdist(inner.mode, outside) > T;
      if (filled) { if (sol < 0.64 || hr < 0.3) return null; }
      else if (sol < 0.85 || hr < 0.5 || w < 20 || h < 14) return null;
      return { filled, fill: filled ? inner.mode : outside, std: inner.std, sol, box };
    }

    let nid = 0;
    const all = [];
    const mk = (kind, box, extra) => { const n = Object.assign({ id: ++nid, kind, box, children: [] }, extra); all.push(n); return n; };

    function groupInk(ink) {
      const n = ink.length;
      if (!n) return [];
      const hs = ink.map(o => H_(o.box)).filter(h => h >= 6).sort((a, b) => a - b);
      const med = hs.length ? hs[hs.length >> 1] : 12;
      const maxH = ink.reduce((m, o) => Math.max(m, H_(o.box)), 0);
      const isRule = o => (H_(o.box) <= 6 && W_(o.box) >= 4 * H_(o.box) && W_(o.box) >= 16) || (W_(o.box) <= 6 && H_(o.box) >= 4 * W_(o.box) && H_(o.box) >= 16);
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
          if (gap <= P.kH * Math.max(ha, hb)) uf.union(idx[ii], idx[jj]);
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
          const g = GROW(l.box, 0.6 * H_(l.box));
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

    function buildLevel(regionList, parentFill, depth, parent) {
      const nodes = [], ink = [];
      const queue = regionList.slice();
      for (let qi = 0; qi < queue.length; qi++) for (const c of compsIn[queue[qi]]) {
        const cls = classify(c);
        if (cls) {
          const node = mk('container', cls.box, { fill: cls.fill, filled: cls.filled, solidity: cls.sol, std: cls.std, depth, parent, bg: parentFill });
          node.children = buildLevel(holesOf[c], cls.fill, depth + 1, node);
          if (!node.children.length) node.kind = cls.std > 26 ? 'image' : 'shape';
          node.color = node.fill;
          nodes.push(node);
        } else {
          ink.push({ c, box: boxOf(comps[c]), n: comps[c].n });
          // Anything enclosed by a non-frame (a glyph counter is empty; a broken outline is not)
          // is promoted to this level rather than dropped.
          for (const h of holesOf[c]) if (compsIn[h].length) queue.push(h);
        }
      }
      for (const blk of groupInk(ink)) {
        const node = mk(blk.kind, blk.box, { lines: blk.lines, parts: blk.parts, px: blk.px, sig: blk.sig, density: blk.density, depth, parent, bg: parentFill });
        node.color = inkColor(data, W, H, blk.box, parentFill);
        nodes.push(node);
      }
      return nodes;
    }

    const root = { id: 0, kind: 'root', box: B(0, 0, W, H), fill: bg, color: bg, depth: 0, children: [] };
    root.children = buildLevel([outer], bg, 1, root);
    const ms = performance.now() - t0;
    return { root, nodes: all, W, H, bg, stats: { edgeComponents: nc, regions: nr, nodes: all.length, ms } };
  }

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
    if (!s.length) return bgc.slice();
    s.sort((a, b) => b[0] - a[0]);
    const k = Math.max(1, Math.round(s.length * 0.12));
    const acc = [0, 0, 0];
    for (let i = 0; i < k; i++) { acc[0] += s[i][1][0]; acc[1] += s[i][1][1]; acc[2] += s[i][1][2]; }
    return acc.map(v => v / k);
  }

  /* ---------------- reading order (recursive XY-cut) ---------------- */
  function cutGroups(items, lo, hi) {
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
  function xyOrder(items) {
    if (items.length <= 1) return items.slice();
    const ys = cutGroups(items, b => b.y0, b => b.y1);
    if (ys.length > 1) return ys.flatMap(xyOrder);
    const xs = cutGroups(items, b => b.x0, b => b.x1);
    if (xs.length > 1) return xs.flatMap(xyOrder);
    return items.slice().sort((a, b) => (a.box.y0 - b.box.y0) || (a.box.x0 - b.box.x0));
  }

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
    if (dRep.color && mRep.color) c += Math.min(1.2, dE(dRep.color, mRep.color) / 45);
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
    return AREA(u) <= 1.9 * nodes.reduce((s, n) => s + AREA(n.box), 0) + 400;
  }

  /* ---------------- Hungarian (min-cost assignment) ---------------- */
  function hungarian(cost) {
    const n = cost.length, m = cost[0].length, INF = 1e18;
    const u = new Float64Array(n + 1), v = new Float64Array(m + 1);
    const p = new Int32Array(m + 1), way = new Int32Array(m + 1);
    const minv = new Float64Array(m + 1), used = new Uint8Array(m + 1);
    for (let i = 1; i <= n; i++) {
      p[0] = i; let j0 = 0;
      minv.fill(INF); used.fill(0);
      do {
        used[j0] = 1;
        const i0 = p[j0], row = cost[i0 - 1];
        let delta = INF, j1 = 0;
        for (let j = 1; j <= m; j++) if (!used[j]) {
          const cur = row[j - 1] - u[i0] - v[j];
          if (cur < minv[j]) { minv[j] = cur; way[j] = j0; }
          if (minv[j] < delta) { delta = minv[j]; j1 = j; }
        }
        for (let j = 0; j <= m; j++) if (used[j]) { u[p[j]] += delta; v[j] -= delta; } else minv[j] -= delta;
        j0 = j1;
      } while (p[j0] !== 0);
      do { const j1 = way[j0]; p[j0] = p[j1]; j0 = j1; } while (j0);
    }
    const ans = new Int32Array(n).fill(-1);
    for (let j = 1; j <= m; j++) if (p[j]) ans[p[j] - 1] = j - 1;
    return ans;
  }
  function assign(A, Bn, costFn, delFn, insFn) {
    const n = A.length, m = Bn.length;
    if (!n || !m) return { pairs: [], delA: A.slice(), insB: Bn.slice() };
    const N = n + m, BIG = 1e9;
    const C = [];
    for (let i = 0; i < N; i++) {
      const row = new Float64Array(N);
      for (let j = 0; j < N; j++) {
        if (i < n && j < m) row[j] = costFn(A[i], Bn[j]);
        else if (i < n) row[j] = j - m === i ? delFn(A[i]) : BIG;
        else if (j < m) row[j] = i - n === j ? insFn(Bn[j]) : BIG;
        else row[j] = 0;
      }
      C.push(row);
    }
    const a = hungarian(C);
    const pairs = [], delA = [], used = new Uint8Array(m);
    for (let i = 0; i < n; i++) {
      if (a[i] >= 0 && a[i] < m) { pairs.push([A[i], Bn[a[i]]]); used[a[i]] = 1; }
      else delA.push(A[i]);
    }
    const insB = Bn.filter((_, j) => !used[j]);
    return { pairs, delA, insB };
  }

  /* ---------------- per-level aligners ---------------- */
  const mkUnit = (dn, mn) => ({ d: dn, m: mn, db: UNIONS(dn.map(x => x.box)), mb: UNIONS(mn.map(x => x.box)) });
  const sameLine = nodes => nodes.every(n => OVL(n.box.y0, n.box.y1, nodes[0].box.y0, nodes[0].box.y1) > 0.5 * Math.min(H_(n.box), H_(nodes[0].box)));
  const rep = nodes => nodes.length === 1 ? nodes[0] : {
    kind: nodes.every(n => KIND_GROUP[n.kind] === 'ink') ? 'text' : nodes[0].kind, color: nodes[0].color,
    lines: nodes.every(n => (n.lines || 1) === 1) && sameLine(nodes) ? 1 : 2, px: nodes.reduce((a, n) => a + (n.px || 0), 0) || null,
  };

  function hungarianAlign(D, M, Pd, Pm, P) {
    const cost = (d, m) => {
      const r = parentResidual(d.box, m.box, Pd.box, Pm.box);
      return emission(d, m, d.box, m.box, P) + Math.min(5, Math.hypot(r.x, r.y) / P.transTau);
    };
    const r = assign(D, M, cost, d => gapCost(d, P) + 1.2, m => gapCost(m, P) + 1.2);
    return { units: r.pairs.map(([d, m]) => mkUnit([d], [m])), delD: r.delA, insM: r.insB };
  }

  function viterbiAlign(D, M, Pd, Pm, P) {
    const n = D.length, k = M.length;
    if (!n || !k) return { units: [], delD: D.slice(), insM: M.slice() };
    const K = n * k > 2500 ? Math.min(4, P.window) : P.window;
    const INF = 1e18;
    const maxMerge = !P.merges ? 1 : n * k > 2500 ? 2 : 3;
    const types = [[1, 1]];
    for (let q = 2; q <= maxMerge; q++) types.push([q, 1], [1, q]);
    const T = types.length, S = (n + 1) * (k + 1);
    const idx = (i, j) => i * (k + 1) + j;
    const dp = types.map(() => new Float64Array(S).fill(INF));
    const bpR = types.map(() => new Uint8Array(S));
    const bpI = types.map(() => new Int32Array(S)), bpJ = types.map(() => new Int32Array(S)), bpT = types.map(() => new Int8Array(S));
    const cache = types.map(() => new Array(S));
    const Rv = new Float64Array(S).fill(INF), Rop = new Int8Array(S).fill(-1);
    const gd = D.map(x => gapCost(x, P)), gm = M.map(x => gapCost(x, P));
    const GD = new Float64Array(n + 1), GM = new Float64Array(k + 1);
    for (let i = 0; i < n; i++) GD[i + 1] = GD[i] + gd[i];
    for (let j = 0; j < k; j++) GM[j + 1] = GM[j] + gm[j];
    function unit(t, i, j) {
      const id = idx(i, j);
      if (cache[t][id] !== undefined) return cache[t][id];
      const [a, b] = types[t];
      const dn = D.slice(i - a, i), mn = M.slice(j - b, j);
      let u = null;
      const many = a > 1 ? dn : b > 1 ? mn : null;
      if (!many || plausibleMerge(many)) {
        u = mkUnit(dn, mn);
        const pr = parentResidual(u.db, u.mb, Pd.box, Pm.box);
        const st = Math.min(4, Math.hypot(pr.x, pr.y) / P.transTau);
        u.st = st;
        let e = emission(rep(dn), rep(mn), u.db, u.mb, P) + P.posPrior * Math.min(1.5, st);
        if (many) {
          // A merge is only plausible when the union on one side has the shape of the single box
          // on the other, after the page-wide font scale is taken out.
          const ts = P.ts || { w: 0, h: 0 };
          const lw = Math.abs(Math.log(Math.max(1, W_(u.mb)) / Math.max(1, W_(u.db))) - ts.w);
          const lh = Math.abs(Math.log(Math.max(1, H_(u.mb)) / Math.max(1, H_(u.db))) - ts.h);
          e += 0.35 * (many.length - 1) + 0.15 + 2.2 * (Math.max(0, lw - 0.12) + Math.max(0, lh - 0.12));
        }
        u.e = e;
      }
      cache[t][id] = u;
      return u;
    }
    Rv[0] = 0;
    for (let i = 0; i <= n; i++) {
      for (let j = 0; j <= k; j++) {
        const id = idx(i, j);
        for (let t = 0; t < T; t++) {
          const [a, b] = types[t];
          if (i < a || j < b) continue;
          const u = unit(t, i, j);
          if (!u) continue;
          const i0 = i - a, j0 = j - b;
          let best = Rv[idx(i0, j0)] + u.st + (i0 > 0 || j0 > 0 ? P.resetPen : 0);
          let fromR = 1, bi = 0, bj = 0, bt = 0;
          for (let pi = i0; pi >= Math.max(1, i0 - K); pi--) {
            for (let pj = j0; pj >= Math.max(1, j0 - K); pj--) {
              const gaps = (GD[i0] - GD[pi]) + (GM[j0] - GM[pj]);
              if (gaps >= best) continue;
              const pid = idx(pi, pj);
              for (let pt = 0; pt < T; pt++) {
                const v = dp[pt][pid];
                if (v >= INF) continue;
                const c = v + gaps + transCost(cache[pt][pid], u, P, i0 > pi ? D.slice(pi, i0) : null, j0 > pj ? M.slice(pj, j0) : null);
                if (c < best) { best = c; fromR = 0; bi = pi; bj = pj; bt = pt; }
              }
            }
          }
          dp[t][id] = u.e + best;
          bpR[t][id] = fromR; bpI[t][id] = bi; bpJ[t][id] = bj; bpT[t][id] = bt;
        }
        if (i === 0 && j === 0) continue;
        let rb = INF, op = -1;
        if (i > 0 && Rv[idx(i - 1, j)] + gd[i - 1] < rb) { rb = Rv[idx(i - 1, j)] + gd[i - 1]; op = 0; }
        if (j > 0 && Rv[idx(i, j - 1)] + gm[j - 1] < rb) { rb = Rv[idx(i, j - 1)] + gm[j - 1]; op = 1; }
        for (let t = 0; t < T; t++) if (dp[t][id] < rb) { rb = dp[t][id]; op = 2 + t; }
        Rv[id] = rb; Rop[id] = op;
      }
    }
    const units = [], delD = [], insM = [];
    let i = n, j = k, mode = 0, t = 0, guard = 0;
    while ((i > 0 || j > 0) && guard++ < 100000) {
      if (mode === 0) {
        const op = Rop[idx(i, j)];
        if (op === 0) { delD.push(D[i - 1]); i--; }
        else if (op === 1) { insM.push(M[j - 1]); j--; }
        else { mode = 1; t = op - 2; }
      } else {
        const id = idx(i, j);
        units.push(cache[t][id]);
        const [a, b] = types[t];
        const i0 = i - a, j0 = j - b;
        if (bpR[t][id]) { i = i0; j = j0; mode = 0; }
        else {
          const pi = bpI[t][id], pj = bpJ[t][id];
          for (let x = pi; x < i0; x++) delD.push(D[x]);
          for (let y = pj; y < j0; y++) insM.push(M[y]);
          t = bpT[t][id]; i = pi; j = pj;
        }
      }
    }
    units.reverse();
    return { units, delD, insM };
  }

  function rescue(res, Pd, Pm, P) {
    if (!res.delD.length || !res.insM.length) return;
    const cost = (d, m) => {
      const r = parentResidual(d.box, m.box, Pd.box, Pm.box);
      return emission(d, m, d.box, m.box, P) + 0.35 * Math.min(6, Math.hypot(r.x, r.y) / P.transTau);
    };
    const r = assign(res.delD, res.insM, cost, () => P.rescueMax, () => P.rescueMax);
    for (const [d, m] of r.pairs) { const u = mkUnit([d], [m]); u.rescued = true; res.units.push(u); }
    res.delD = r.delA; res.insM = r.insB;
  }

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
    for (let k = 0; k < n; k++) {
      if (prev[k] >= 0) continue;
      const chain = [k];
      while (next[chain[chain.length - 1]] >= 0) chain.push(next[chain[chain.length - 1]]);
      if (chain.length === 1) { head[k] = 1; continue; }
      const f = units[chain[0]], l = units[chain[chain.length - 1]];
      const dStart = axis === 'x'
        ? Math.min(Math.abs((f.mb.x0 - PM.x0) - (f.db.x0 - PD.x0)), Math.abs((CX(f.mb) - CX(PM)) - (CX(f.db) - CX(PD))))
        : Math.abs((f.mb.y0 - PM.y0) - (f.db.y0 - PD.y0));
      const dEnd = axis === 'x' ? Math.abs((l.mb.x1 - PM.x1) - (l.db.x1 - PD.x1)) : Math.abs((l.mb.y1 - PM.y1) - (l.db.y1 - PD.y1));
      const rev = dEnd + 1 < dStart;
      head[rev ? chain[chain.length - 1] : chain[0]] = 1;
      for (const c of chain) { backward[c] = rev ? 1 : 0; }
      for (let i = 0; i < chain.length; i++) {
        if (i > 0) linkedFwd[chain[i]] = 1;                 // has an in-chain predecessor
        if (i < chain.length - 1) linkedBack[chain[i]] = 1; // has an in-chain successor
      }
    }
    return { head, backward, linkedFwd, linkedBack, next };
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
        if (ab >= 0) {
          const a = units[ab], f = ab + 1;
          add(EY, f, id, 'y0', a.mb.y1 + (d.y0 - a.db.y1), `flows below ${nm(a)}`, 'flow', penFwd(CYc, k));
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
          add(EX, f, id, 'x0', l.mb.x1 + (d.x0 - l.db.x1), `follows ${nm(l)}`, 'flow', penFwd(CXc, k));
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
        if (ri >= 0) {
          const r = units[ri], f = ri + 1;
          add(EX, f, id, 'x1', r.mb.x0 - (r.db.x0 - d.x1), `precedes ${nm(r)}`, 'flow', penBack(CXc, k));
          if (Math.abs(d.y0 - r.db.y0) <= AL) add(EY, f, id, 'y0', r.mb.y0 + (d.y0 - r.db.y0), `top-aligned with ${nm(r)}`, 'align', BACK);
          if (Math.abs(CY(d) - CY(r.db)) <= AL) add(EY, f, id, 'cy', CY(r.mb) + (CY(d) - CY(r.db)), `middle-aligned with ${nm(r)}`, 'align', BACK);
          if (Math.abs(d.y1 - r.db.y1) <= AL) add(EY, f, id, 'y1', r.mb.y1 + (d.y1 - r.db.y1), `bottom-aligned with ${nm(r)}`, 'align', BACK);
        }
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
    }
    units.forEach((u, k) => {
      u.rx = cx[k + 1]; u.ry = cy[k + 1];
      u.rx.refUnit = u.rx.from ? units[u.rx.from - 1] : null;
      u.ry.refUnit = u.ry.from ? units[u.ry.from - 1] : null;
    });
  }

  /* ---------------- severity ---------------- */
  const LEVEL = s => (s >= 2.5 ? 'major' : s >= 1 ? 'minor' : 'ok');
  function sizeCheck(u, P, contentExplained, missingKids) {
    const d = u.d[0], db = u.db, mb = u.mb;
    const dw = W_(mb) - W_(db), dh = H_(mb) - H_(db);
    const ink = KIND_GROUP[d.kind] === 'ink' || u.d.length > 1;
    if (ink) {
      // Text is compared by ink mass (edge pixels), which survives reflow: the same words wrapped
      // onto more lines keep their mass. Single-line blocks also compare height (≈ font size).
      const pd = u.d.reduce((a, n) => a + (n.px || AREA(n.box) * 0.3), 0), pm = u.m.reduce((a, n) => a + (n.px || AREA(n.box) * 0.3), 0);
      const lr = Math.log(Math.max(1, pm) / Math.max(1, pd)) - (P.ts ? P.ts.m : 0);
      const sMass = Math.max(0, Math.abs(lr) - Math.log(1 + P.textSizeTol)) / Math.log(1.25);
      let sH = 0;
      if (u.d.length === 1 && u.m.length === 1 && u.d[0].lines === 1 && u.m[0].lines === 1) {
        sH = Math.max(0, Math.abs(Math.log(H_(mb) / H_(db)) - (P.ts ? P.ts.h : 0)) - Math.log(1.22)) / Math.log(1.15);
      }
      const s = Math.max(sMass, sH);
      let note;
      if (sH > sMass) note = `glyphs ${H_(mb) > H_(db) ? 'taller' : 'shorter'} (${Math.round(H_(db))}→${Math.round(H_(mb))}px line)`;
      else note = lr > 0 ? `text ${Math.round((Math.exp(lr) - 1) * 100)}% heavier` : `text ${Math.round((1 - Math.exp(lr)) * 100)}% lighter`;
      const reflow = (u.d[0].lines || 1) !== (u.m[0].lines || 1);
      return { s, dw, dh, note, explained: s < 1 ? (reflow ? 'reflowed, same amount of text' : 'within text tolerance') : '' };
    }
    const tw = Math.max(P.sizeTol, 0.05 * W_(db)), th = Math.max(P.sizeTol, 0.05 * H_(db));
    let sx = Math.abs(dw) / tw, sy = Math.abs(dh) / th, explained = '';
    if (contentExplained && u.kids && u.kids.length) {
      // Height may follow content: the change is excused by the growth of the matched children's
      // extent, plus any shift of the topmost child that is already charged to that child.
      const Ud = UNIONS(u.kids.map(k => k.db)), Um = UNIONS(u.kids.map(k => k.mb));
      const top = u.kids.reduce((a, k) => (k.mb.y0 < a.mb.y0 ? k : a));
      const rTop = top.ry && top.ry.kind === 'parent' && top.ry.anchor === 'y0' ? top.ry.v : 0;
      const dContent = H_(Um) - H_(Ud);
      const alt = [Math.abs(dh - dContent - rTop)];
      if (missingKids && missingKids.length) {
        const span = H_(UNIONS(missingKids.map(n => n.box)));
        for (const g of [0, 8, 12, 16, 24]) alt.push(Math.abs(dh - dContent - rTop + span + g));
      }
      const ry = Math.min(...alt);
      if (ry / th < sy) { sy = ry / th; if (Math.abs(dh) > th) explained = 'height follows content'; }
      // Width may hug a single label (buttons, pills, badges).
      // Width of a single-label container (button, pill, badge) may be fixed or hug its label;
      // any change between those two is excused.
      if (u.kids.length === 1 && KIND_GROUP[u.kids[0].d[0].kind] === 'ink') {
        const dc = W_(Um) - W_(Ud);
        const lo = Math.min(0, dc), hi = Math.max(0, dc);
        const rx = dw < lo ? lo - dw : dw > hi ? dw - hi : 0;
        if (rx / tw < sx) { sx = rx / tw; if (Math.abs(dw) > tw) explained = explained ? explained + ', width follows its label' : 'width follows its label'; }
      }
    }
    const parts = [];
    if (Math.abs(dw) >= 2) parts.push(`width ${dw > 0 ? '+' : '−'}${Math.abs(Math.round(dw))}px`);
    if (Math.abs(dh) >= 2) parts.push(`height ${dh > 0 ? '+' : '−'}${Math.abs(Math.round(dh))}px`);
    return { s: Math.max(sx, sy), dw, dh, note: parts.join(', '), explained };
  }
  function fmtVec(x, y) {
    const p = [];
    if (Math.abs(y) >= 1.5) p.push(`${Math.round(Math.abs(y))}px ${y > 0 ? 'down' : 'up'}`);
    if (Math.abs(x) >= 1.5) p.push(`${Math.round(Math.abs(x))}px ${x > 0 ? 'right' : 'left'}`);
    return p.join(', ') || 'in place';
  }
  function expectedBox(db, rx, ry) {
    const x0 = rx.anchor === 'x0' ? rx.exp : rx.anchor === 'cx' ? rx.exp - W_(db) / 2 : rx.exp - W_(db);
    const y0 = ry.anchor === 'y0' ? ry.exp : ry.anchor === 'cy' ? ry.exp - H_(db) / 2 : ry.exp - H_(db);
    return B(x0, y0, x0 + W_(db), y0 + H_(db));
  }

  function scoreUnit(u, Pd, Pm, ctx, depth, missingKids) {
    const P = ctx.P;
    const mb = u.mb, db = u.db;
    const rx = u.rx, ry = u.ry;
    const d = u.d[0], m = u.m[0];
    const ink = KIND_GROUP[d.kind] === 'ink' || u.d.length > 1;
    const ptol = P.posTol * (ink ? P.textPosMul : 1);
    const sPos = Math.hypot(rx.v, ry.v) / ptol;
    const size = sizeCheck(u, P, ctx.flow, missingKids);
    const ctol = ink ? P.textColorTol : P.colorTol;
    const de = d.color && m.color ? dE(rep(u.d).color || d.color, rep(u.m).color || m.color) : 0;
    const sCol = de > ctol ? 1 + (de - ctol) / 12 : de / ctol * 0.9;
    let sShape = 0;
    if (u.d.length === 1 && u.m.length === 1 && d.solidity && m.solidity && Math.min(W_(db), H_(db)) >= 16) {
      sShape = Math.max(0, Math.abs(d.solidity - m.solidity) - 0.05) / 0.04;
    }
    const comps = [['position', sPos], ['size', size.s], ['color', sCol], ['shape', sShape]];
    comps.sort((a, b) => b[1] - a[1]);
    const sev = comps[0][1];
    const top = comps[0][0];
    let title;
    if (sev < 1) title = 'Matches';
    else if (top === 'position') title = `Moved ${fmtVec(rx.v, ry.v)}`;
    else if (top === 'size') title = size.note ? size.note[0].toUpperCase() + size.note.slice(1) : 'Size differs';
    else if (top === 'color') title = `${ink ? 'Text color' : 'Fill color'} off (ΔE ${Math.round(de)})`;
    else title = 'Shape differs (corners or outline)';
    const inherited = { dx: Pm.box.x0 - Pd.box.x0, dy: Pm.box.y0 - Pd.box.y0 };
    const abs = { dx: mb.x0 - db.x0, dy: mb.y0 - db.y0 };
    const eBox = expectedBox(db, rx, ry);
    const issues = comps.filter(c => c[1] >= 1).map(c => c[0]);
    return {
      type: sev < 1 ? 'match' : top, sev, level: LEVEL(sev), title, issues,
      name: unitName(u.d), dBox: db, mBox: mb, eBox,
      dNodes: u.d, mNodes: u.m, depth, rescued: !!u.rescued, merged: u.d.length + u.m.length > 2,
      decomp: {
        abs, inherited,
        explained: { dx: abs.dx - inherited.dx - rx.v, dy: abs.dy - inherited.dy - ry.v },
        residual: { dx: rx.v, dy: ry.v },
        refX: rx.name, refY: ry.name, refXKind: rx.kind, refYKind: ry.kind,
      },
      size, color: { d: rep(u.d).color || d.color, m: rep(u.m).color || m.color, de }, shape: { d: d.solidity, m: m.solidity, s: sShape },
      parts: { position: sPos, size: size.s, color: sCol, shape: sShape },
    };
  }

  /* ---------------- pixel verification of missing / extra ---------------- */
  /* Strong-ink pixels of `img` inside `box`, ignoring pixels covered by `skip` boxes. */
  function inkIn(img, box, bg, skip, T) {
    if (!img || !box) return 0;
    const W = img.width, H = img.height, d = img.data;
    const x0 = clamp(Math.floor(box.x0), 0, W), x1 = clamp(Math.ceil(box.x1), 0, W);
    const y0 = clamp(Math.floor(box.y0), 0, H), y1 = clamp(Math.ceil(box.y1), 0, H);
    let n = 0;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      let covered = false;
      for (const b of skip) if (x >= b.x0 && x < b.x1 && y >= b.y0 && y < b.y1) { covered = true; break; }
      if (covered) continue;
      const i = (y * W + x) * 4;
      if (Math.max(Math.abs(d[i] - bg[0]), Math.abs(d[i + 1] - bg[1]), Math.abs(d[i + 2] - bg[2])) > 2.5 * T) n++;
    }
    return n;
  }
  /* Before calling something missing, look where it should be: if the other render has
     comparable ink there that no matched sibling accounts for, the element is present but
     fused with a neighbour by segmentation (tight padding, touching glyphs). */
  function presentInPixels(n, at, imgSelf, imgOther, fillSelf, fillOther, siblingsOther, P) {
    const own = inkIn(imgSelf, n.box, fillSelf, [], P.edgeT);
    if (own < 12) return false;
    const there = inkIn(imgOther, at, fillOther, siblingsOther, P.edgeT);
    return there >= 0.5 * own;
  }

  /* ---------------- tree runner ---------------- */
  function frameContrast(n) {
    const c = n.fill || n.color, b = n.bg;
    return c && b ? dE(c, b) : 20;
  }
  function runTree(segD, segM, ctx) {
    const P = ctx.P, out = [];
    const level = (Dk, Mk, Pd, Pm, depth) => {
      let D = xyOrder(Dk), M = xyOrder(Mk), res;
      for (let round = 0; round < 5; round++) {
        res = ctx.align(D, M, Pd, Pm, P);
        if (P.rescue) rescue(res, Pd, Pm, P);
        if (!P.flatten) break;
        const fd = res.delD.filter(n => n.children && n.children.length);
        const fm = res.insM.filter(n => n.children && n.children.length);
        if (!fd.length && !fm.length) break;
        for (const n of fd) {
          const s = frameContrast(n) > 14 ? 2.6 : 1.4;
          out.push({ type: 'frame-missing', sev: s, level: LEVEL(s), title: 'Frame missing (contents found)', name: nodeName(n), dBox: n.box, mBox: null, eBox: SHIFT(n.box, Pm.box.x0 - Pd.box.x0, Pm.box.y0 - Pd.box.y0), dNodes: [n], mNodes: [], depth });
        }
        for (const n of fm) {
          const s = frameContrast(n) > 14 ? 2.6 : 1.4;
          out.push({ type: 'frame-extra', sev: s, level: LEVEL(s), title: 'Extra frame around contents', name: nodeName(n), dBox: null, mBox: n.box, eBox: null, dNodes: [], mNodes: [n], depth });
        }
        D = xyOrder(D.flatMap(n => (fd.includes(n) ? n.children : [n])));
        M = xyOrder(M.flatMap(n => (fm.includes(n) ? n.children : [n])));
      }
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

  /* ---------------- pixel baselines ---------------- */
  function blobs(flag, W, H, strength, cell) {
    const gw = Math.ceil(W / cell), gh = Math.ceil(H / cell);
    const cnt = new Float32Array(gw * gh), sum = new Float32Array(gw * gh);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (flag[i]) { const g = ((y / cell) | 0) * gw + ((x / cell) | 0); cnt[g]++; sum[g] += strength[i]; }
    }
    const on = new Uint8Array(gw * gh);
    for (let g = 0; g < gw * gh; g++) on[g] = cnt[g] >= 3 ? 1 : 0;
    const seen = new Uint8Array(gw * gh), out = [];
    for (let s = 0; s < gw * gh; s++) {
      if (!on[s] || seen[s]) continue;
      const st = [s]; seen[s] = 1;
      let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, c = 0, sm = 0;
      while (st.length) {
        const g = st.pop(); const gx = g % gw, gy = (g - gx) / gw;
        x0 = Math.min(x0, gx); x1 = Math.max(x1, gx); y0 = Math.min(y0, gy); y1 = Math.max(y1, gy);
        c += cnt[g]; sm += sum[g];
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
          const nx = gx + dx, ny = gy + dy;
          if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue;
          const q = ny * gw + nx;
          if (on[q] && !seen[q]) { seen[q] = 1; st.push(q); }
        }
      }
      out.push({ box: B(x0 * cell, y0 * cell, Math.min(W, (x1 + 1) * cell), Math.min(H, (y1 + 1) * cell)), px: c, mean: sm / c });
    }
    return out;
  }
  function runPixel(imgD, imgM, ctx) {
    const P = ctx.P, W = imgD.width, H = imgD.height, a = imgD.data, b = imgM.data;
    const N = W * H, flag = new Uint8Array(N), str = new Float32Array(N);
    let nf = 0;
    for (let i = 0; i < N; i++) {
      const k = i * 4;
      const d = Math.max(Math.abs(a[k] - b[k]), Math.abs(a[k + 1] - b[k + 1]), Math.abs(a[k + 2] - b[k + 2]));
      str[i] = d / 255;
      if (d > P.pixT) { flag[i] = 1; nf++; }
    }
    const out = blobs(flag, W, H, str, 6).map(bl => {
      const s = 1 + Math.min(3, bl.mean * 4 * Math.min(1, bl.px / 400));
      return { type: 'pixel', sev: s, level: LEVEL(s), title: `${bl.px} pixels differ`, name: `Region ${Math.round(W_(bl.box))}×${Math.round(H_(bl.box))}`, dBox: bl.box, mBox: bl.box, eBox: null, dNodes: [], mNodes: [], depth: 0 };
    });
    return { findings: out, heat: { W, H, v: str, flag }, score: 100 * (1 - nf / N) };
  }
  function runSSIM(imgD, imgM, ctx) {
    const P = ctx.P, W = imgD.width, H = imgD.height, N = W * H;
    const L = (img) => { const o = new Float64Array(N), d = img.data; for (let i = 0; i < N; i++) o[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]; return o; };
    const x = L(imgD), y = L(imgM);
    const W1 = W + 1, I = n => new Float64Array(W1 * (H + 1));
    const Sx = I(), Sy = I(), Sxx = I(), Syy = I(), Sxy = I();
    for (let r = 0; r < H; r++) {
      let ax = 0, ay = 0, axx = 0, ayy = 0, axy = 0;
      for (let c = 0; c < W; c++) {
        const i = r * W + c, xv = x[i], yv = y[i];
        ax += xv; ay += yv; axx += xv * xv; ayy += yv * yv; axy += xv * yv;
        const o = (r + 1) * W1 + c + 1, u = r * W1 + c + 1;
        Sx[o] = Sx[u] + ax; Sy[o] = Sy[u] + ay; Sxx[o] = Sxx[u] + axx; Syy[o] = Syy[u] + ayy; Sxy[o] = Sxy[u] + axy;
      }
    }
    const rad = 3, C1 = (0.01 * 255) ** 2, C2 = (0.03 * 255) ** 2;
    const ss = new Float32Array(N), flag = new Uint8Array(N), str = new Float32Array(N);
    let tot = 0;
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
      const r0 = Math.max(0, r - rad), r1 = Math.min(H, r + rad + 1), c0 = Math.max(0, c - rad), c1 = Math.min(W, c + rad + 1);
      const n = (r1 - r0) * (c1 - c0);
      const box = S => S[r1 * W1 + c1] - S[r0 * W1 + c1] - S[r1 * W1 + c0] + S[r0 * W1 + c0];
      const mx = box(Sx) / n, my = box(Sy) / n;
      const vx = box(Sxx) / n - mx * mx, vy = box(Syy) / n - my * my, cxy = box(Sxy) / n - mx * my;
      const v = ((2 * mx * my + C1) * (2 * cxy + C2)) / ((mx * mx + my * my + C1) * (vx + vy + C2));
      const i = r * W + c;
      ss[i] = v; tot += v;
      str[i] = clamp((1 - v) / 2, 0, 1);
      if (v < P.ssimT) flag[i] = 1;
    }
    const out = blobs(flag, W, H, str, 6).map(bl => {
      const s = 1 + Math.min(3, bl.mean * 6 * Math.min(1, bl.px / 400));
      return { type: 'pixel', sev: s, level: LEVEL(s), title: `Low structural similarity`, name: `Region ${Math.round(W_(bl.box))}×${Math.round(H_(bl.box))}`, dBox: bl.box, mBox: bl.box, eBox: null, dNodes: [], mNodes: [], depth: 0 };
    });
    return { findings: out, heat: { W, H, v: str, flag }, score: 100 * tot / N };
  }

  /* ---------------- registry ---------------- */
  const ALGOS = [
    { id: 'pixel', name: 'Pixel Δ', short: 'Pixel Δ', family: 'pixel', blurb: 'Per-pixel max-channel difference, blobbed into regions. The baseline everyone starts with: fonts and any shift light up everything.' },
    { id: 'ssim', name: 'SSIM map', short: 'SSIM', family: 'pixel', blurb: 'Windowed structural similarity on luminance. Smarter about contrast, still blind to structure: a 24px shift is a full-page failure.' },
    { id: 'flat', name: 'Flat boxes', short: 'Flat', family: 'box', blurb: 'Segment both renders, flatten every box, solve one global assignment, score absolute coordinates. Every descendant of a moved element is charged again.' },
    { id: 'tree', name: 'Tree · Hungarian', short: 'Tree', family: 'box', blurb: 'Match level by level inside matched parents, score children relative to their parent. Removes parent double jeopardy; siblings in a flow still cascade.' },
    { id: 'viterbi', name: 'Tree · Viterbi', short: 'Viterbi', family: 'box', blurb: 'Same tree, but each level is a monotone Viterbi alignment over reading order with flow-aware transitions, skips and 2:1 text merges. Residuals still parent-relative.' },
    { id: 'viterbi-flow', name: 'Tree · Viterbi + flow', short: 'Viterbi + flow', family: 'box', blurb: 'Full method. Each element is charged only for the displacement no layout reference explains: its parent, the sibling it flows after, a neighbour it was aligned with, the gap a missing sibling left. Rows and columns form flow chains anchored where they moved least. Containers may grow with their content and text may reflow.' },
  ];

  function run(algoId, segD, segM, imgD, imgM, Pin) {
    const P = Object.assign({}, DEFAULTS, Pin || {});
    const t0 = performance.now();
    let findings, heat = null, score = null;
    if (algoId === 'pixel' || algoId === 'ssim') {
      const r = algoId === 'pixel' ? runPixel(imgD, imgM, { P }) : runSSIM(imgD, imgM, { P });
      findings = r.findings; heat = r.heat; score = r.score;
    } else {
      const pass = Q => algoId === 'flat'
        ? runFlat(segD, segM, { P: Q, flow: false })
        : runTree(segD, segM, { P: Q, flow: algoId === 'viterbi-flow', verify: algoId === 'viterbi-flow', imgD, imgM, align: algoId === 'tree' ? hungarianAlign : viterbiAlign });
      findings = pass(P);
      const ts = estimateTextScale(findings);
      if (ts) { P.ts = ts; findings = pass(P); }
    }
    findings.forEach((f, i) => { f.id = i + 1; });
    const flagged = findings.filter(f => f.level !== 'ok');
    if (score === null) {
      // area-weighted conformance over design leaves + extras
      let tot = 0, bad = 0;
      for (const f of findings) {
        const b = f.dBox || f.mBox;
        const w = Math.sqrt(Math.max(16, AREA(b)));
        tot += w;
        bad += w * clamp((f.sev - 0.8) / 2.5, 0, 1);
      }
      score = tot ? 100 * (1 - bad / tot) : 100;
    }
    const counts = { major: 0, minor: 0, ok: 0, missing: 0, extra: 0 };
    for (const f of findings) {
      counts[f.level]++;
      if (f.level !== 'ok' && (f.type === 'missing' || f.type === 'frame-missing')) counts.missing++;
      if (f.level !== 'ok' && (f.type === 'extra' || f.type === 'frame-extra')) counts.extra++;
    }
    return { algo: algoId, findings, flagged, heat, score, counts, ms: performance.now() - t0, P };
  }

  /* ---------------- evaluation ---------------- */
  function overlapsGT(b, g) {
    const I = INTER(GROW(b, 1), GROW(g, 6));
    if (!I) return false;
    const a = AREA(I);
    return a >= 0.5 * AREA(b) || a >= 0.5 * AREA(g);
  }
  function evaluate(findings, gt) {
    const flagged = findings.filter(f => f.level !== 'ok');
    const hit = new Set();
    let tp = 0;
    for (const f of flagged) {
      let any = false;
      gt.forEach((g, gi) => {
        const boxes = g.space === 'design' ? [f.dBox, f.eBox] : [f.mBox, f.eBox, f.type === 'missing' ? f.dBox : null];
        if (boxes.some(b => b && overlapsGT(b, g.box))) { any = true; hit.add(gi); }
      });
      if (any) tp++;
      f.gtHit = any;
    }
    const n = gt.length;
    const recall = n ? hit.size / n : null;
    const precision = flagged.length ? tp / flagged.length : (n ? 0 : 1);
    const f1 = n && (recall + precision) > 0 ? 2 * recall * precision / (recall + precision) : null;
    return { gt: n, found: hit.size, flagged: flagged.length, tp, fp: flagged.length - tp, recall, precision, f1, hit };
  }

  return {
    DEFAULTS, ALGOS, rasterize, nativeSize, segment, run, groundTruth, evaluate, nodeName,
    geom: { B, W_, H_, CX, CY, AREA, UNION, INTER, SHIFT, GROW }, color: { dE, hex },
  };
})();
if (typeof window !== 'undefined') window.Engine = Engine;
if (typeof module !== 'undefined' && module.exports) module.exports = Engine;
