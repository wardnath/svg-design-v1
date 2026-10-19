(() => {
  var __defProp = Object.defineProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // src/engine/index.js
  var engine_exports = {};
  __export(engine_exports, {
    ALGOS: () => ALGOS,
    DEFAULTS: () => DEFAULTS,
    color: () => color,
    evaluate: () => evaluate,
    foreignObjectSvg: () => foreignObjectSvg,
    frozenShare: () => frozenShare,
    geom: () => geom,
    groundTruth: () => groundTruth,
    htmlToXhtml: () => htmlToXhtml,
    inferStretch: () => inferStretch,
    loadImage: () => loadImage,
    nativeSize: () => nativeSize,
    nodeName: () => nodeName,
    rasterize: () => rasterize,
    run: () => run,
    segment: () => segment,
    svgSize: () => svgSize,
    svgUrl: () => svgUrl,
    synthesize: () => synthesize
  });

  // src/engine/params.js
  var DEFAULTS = {
    edgeT: 10,
    // max-channel step that counts as an edge
    kH: 0.9,
    // word/line merge: horizontal gap ≤ kH × glyph height
    kV: 0.45,
    // line→paragraph merge: vertical gap ≤ kV × line height (lists stay separate)
    posTol: 6,
    // px of unexplained displacement that is still fine
    textPosMul: 1.5,
    // text gets extra slack (ascender/line-box differences between fonts)
    textSizeTol: 0.6,
    // text ink mass may differ by ±60% (font fallback, weight); reflow is free
    sizeTol: 6,
    // px (or 5%) for boxes
    colorTol: 12,
    // ΔE76 for fills
    textColorTol: 24,
    // ΔE76 for text ink (anti-aliasing, weight)
    transTau: 24,
    // px that make one unit of positional cost in matching
    gapBase: 1.4,
    // cost to leave an element unmatched
    resetPen: 0.4,
    // cost of re-anchoring to the parent mid-sequence
    posPrior: 0.05,
    // tie-breaking parent-relative prior inside the emission cost
    window: 6,
    // max consecutive skips between linked matches
    merges: true,
    // allow 2:1 / 1:2 text block merges
    rescue: true,
    // order-free second pass for leftovers (swaps, wraps)
    rescueMax: 2,
    flatten: true,
    // splice children of unmatched frames into the parent level
    pixT: 40,
    // pixel diff threshold (0–255)
    ssimT: 0.72
    // SSIM below this is flagged
  };

  // src/engine/geom.js
  var geom_exports = {};
  __export(geom_exports, {
    AREA: () => AREA,
    B: () => B,
    CX: () => CX,
    CY: () => CY,
    GROW: () => GROW,
    H_: () => H_,
    INTER: () => INTER,
    OVL: () => OVL,
    SHIFT: () => SHIFT,
    UNION: () => UNION,
    UNIONS: () => UNIONS,
    W_: () => W_,
    clamp: () => clamp,
    minAbs: () => minAbs
  });
  var B = (x0, y0, x1, y1) => ({ x0, y0, x1, y1 });
  var W_ = (b) => b.x1 - b.x0;
  var H_ = (b) => b.y1 - b.y0;
  var CX = (b) => (b.x0 + b.x1) / 2;
  var CY = (b) => (b.y0 + b.y1) / 2;
  var AREA = (b) => Math.max(0, W_(b)) * Math.max(0, H_(b));
  var UNION = (a, b) => B(Math.min(a.x0, b.x0), Math.min(a.y0, b.y0), Math.max(a.x1, b.x1), Math.max(a.y1, b.y1));
  var UNIONS = (arr) => arr.reduce((u, b) => u ? UNION(u, b) : b, null);
  var INTER = (a, b) => {
    const x0 = Math.max(a.x0, b.x0), y0 = Math.max(a.y0, b.y0), x1 = Math.min(a.x1, b.x1), y1 = Math.min(a.y1, b.y1);
    return x1 > x0 && y1 > y0 ? B(x0, y0, x1, y1) : null;
  };
  var OVL = (a0, a1, b0, b1) => Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));
  var SHIFT = (b, dx, dy) => B(b.x0 + dx, b.y0 + dy, b.x1 + dx, b.y1 + dy);
  var GROW = (b, p) => B(b.x0 - p, b.y0 - p, b.x1 + p, b.y1 + p);
  var minAbs = (arr) => arr.reduce((m, v) => Math.abs(v) < Math.abs(m) ? v : m, Infinity);
  var clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  // src/engine/raster.js
  async function loadImage(url) {
    const img = new Image();
    img.src = url;
    try {
      await img.decode();
    } catch (e) {
      throw new Error("The browser could not decode this input as an image (" + (e && e.message || "decode failed") + ").");
    }
    return img;
  }
  function toImageData(img, W, H, mode) {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);
    if (mode === "fitWidth") {
      const s = W / img.naturalWidth;
      ctx.drawImage(img, 0, 0, W, img.naturalHeight * s);
    } else ctx.drawImage(img, 0, 0, W, H);
    try {
      return ctx.getImageData(0, 0, W, H);
    } catch (e) {
      throw new Error("This browser refuses to read back the rendered HTML (tainted canvas). Use Chrome, or upload a PNG screenshot instead.");
    }
  }
  function svgSize(svgText) {
    const doc2 = new DOMParser().parseFromString(svgText, "image/svg+xml");
    if (doc2.getElementsByTagName("parsererror").length) throw new Error("The SVG is not well-formed XML.");
    const svg = doc2.documentElement;
    let w = parseFloat(svg.getAttribute("width")), h2 = parseFloat(svg.getAttribute("height"));
    const vb = (svg.getAttribute("viewBox") || "").trim().split(/[\s,]+/).map(Number);
    if ((!w || !h2) && vb.length === 4) {
      w = w || vb[2];
      h2 = h2 || vb[3];
    }
    return { w: Math.round(w || 800), h: Math.round(h2 || 600) };
  }
  function ensureSvgSize(svgText, W, H) {
    const doc2 = new DOMParser().parseFromString(svgText, "image/svg+xml");
    const svg = doc2.documentElement;
    if (!svg.getAttribute("width")) svg.setAttribute("width", W);
    if (!svg.getAttribute("height")) svg.setAttribute("height", H);
    return new XMLSerializer().serializeToString(doc2);
  }
  var svgUrl = (s) => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s);
  function htmlToXhtml(html, mutate) {
    const doc2 = new DOMParser().parseFromString(html, "text/html");
    doc2.querySelectorAll('script, link[rel="stylesheet"], iframe, object, embed').forEach((n) => n.remove());
    if (mutate) mutate(doc2);
    return new XMLSerializer().serializeToString(doc2.documentElement);
  }
  function foreignObjectSvg(xhtml, W, H) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><foreignObject x="0" y="0" width="${W}" height="${H}">${xhtml}</foreignObject></svg>`;
  }
  async function rasterize(src, W, H) {
    if (src.type === "svg") {
      const img = await loadImage(svgUrl(ensureSvgSize(src.text, W, H)));
      return toImageData(img, W, H);
    }
    if (src.type === "html") {
      const img = await loadImage(svgUrl(foreignObjectSvg(htmlToXhtml(src.text), W, H)));
      return toImageData(img, W, H);
    }
    if (src.type === "image") {
      const img = await loadImage(src.url);
      return toImageData(img, W, H, "fitWidth");
    }
    throw new Error("Unknown source type " + src.type);
  }
  function nativeSize(src) {
    return new Promise((resolve, reject) => {
      if (src.type === "svg") return resolve(svgSize(src.text));
      if (src.type === "image") {
        const img = new Image();
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = () => reject(new Error("Image did not load."));
        img.src = src.url;
        return;
      }
      resolve(null);
    });
  }
  async function groundTruth(html, W, H) {
    const labels = [];
    const xhtml = htmlToXhtml(html, (doc2) => {
      const st = doc2.createElement("style");
      st.textContent = "html, html *{visibility:hidden!important;}";
      (doc2.head || doc2.documentElement).appendChild(st);
      doc2.querySelectorAll("[data-bug]").forEach((el, k) => {
        labels.push(el.getAttribute("data-bug"));
        const col = `rgb(${(k * 53 + 31) % 200 + 40},${255 - k},${(k * 97 + 11) % 200 + 40})`;
        el.style.setProperty("visibility", "visible", "important");
        el.style.setProperty("background", col, "important");
        el.style.setProperty("border-color", "transparent", "important");
        el.style.setProperty("box-shadow", "none", "important");
        el.style.setProperty("outline", "none", "important");
        el.style.setProperty("color", "transparent", "important");
        el.setAttribute("data-bugk", k);
      });
    });
    if (!labels.length) return [];
    const img = await loadImage(svgUrl(foreignObjectSvg(xhtml, W, H)));
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
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
      else {
        if (x < b.x0) b.x0 = x;
        if (y < b.y0) b.y0 = y;
        if (x + 1 > b.x1) b.x1 = x + 1;
        if (y + 1 > b.y1) b.y1 = y + 1;
      }
    }
    return labels.map((label, k) => boxes[k] && { label, box: boxes[k], space: "impl" }).filter(Boolean);
  }

  // src/engine/color.js
  var color_exports = {};
  __export(color_exports, {
    cdist: () => cdist,
    dE: () => dE,
    hex: () => hex,
    lab: () => lab,
    lin: () => lin,
    nodeDE: () => nodeDE,
    paletteDE: () => paletteDE
  });
  var lin = (c) => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  function lab(rgb) {
    const r = lin(rgb[0]), g = lin(rgb[1]), b = lin(rgb[2]);
    const f = (t) => t > 8856e-6 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
    const X = f((r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047);
    const Y = f(r * 0.2126 + g * 0.7152 + b * 0.0722);
    const Z = f((r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883);
    return [116 * Y - 16, 500 * (X - Y), 200 * (Y - Z)];
  }
  var dE = (a, b) => {
    const p = lab(a), q = lab(b);
    return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
  };
  var cdist = (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));
  var hex = (c) => "#" + c.map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("");
  function paletteDE(a, b) {
    const one = (p, q) => p.reduce((s, [c, w]) => s + w * Math.min(...q.map(([d]) => dE(c, d))), 0);
    return 0.5 * (one(a, b) + one(b, a));
  }
  var nodeDE = (a, b) => a.palette && b.palette ? paletteDE(a.palette, b.palette) : a.color && b.color ? dE(a.color, b.color) : 0;

  // src/engine/segment.js
  function pageBackground(data, W, H) {
    const cnt = /* @__PURE__ */ new Map();
    let top = 16777215, topN = 0;
    const visit = (x, y) => {
      const i = (y * W + x) * 4;
      const exact = data[i] << 16 | data[i + 1] << 8 | data[i + 2];
      const v = (cnt.get(exact) || 0) + 1;
      cnt.set(exact, v);
      if (v > topN) {
        topN = v;
        top = exact;
      }
    };
    for (let x = 0; x < W; x++) {
      visit(x, 0);
      visit(x, H - 1);
    }
    for (let y = 1; y < H - 1; y++) {
      visit(0, y);
      visit(W - 1, y);
    }
    return [top >> 16 & 255, top >> 8 & 255, top & 255];
  }
  var UF = class {
    constructor(n) {
      this.p = new Int32Array(n);
      for (let i = 0; i < n; i++) this.p[i] = i;
    }
    find(a) {
      const p = this.p;
      while (p[a] !== a) {
        p[a] = p[p[a]];
        a = p[a];
      }
      return a;
    }
    union(a, b) {
      a = this.find(a);
      b = this.find(b);
      if (a !== b) this.p[b] = a;
    }
  };
  function segment(img, Pin) {
    const P = Object.assign({}, DEFAULTS, Pin || {});
    const t0 = performance.now();
    const { width: W, height: H, data } = img;
    const W2 = W + 2, H2 = H + 2, N = W2 * H2;
    const bg = pageBackground(data, W, H);
    const R4 = new Uint8Array(N).fill(bg[0]), G2 = new Uint8Array(N).fill(bg[1]), Bc = new Uint8Array(N).fill(bg[2]);
    for (let y = 0; y < H; y++) {
      let si = y * W * 4, di = (y + 1) * W2 + 1;
      for (let x = 0; x < W; x++, si += 4, di++) {
        R4[di] = data[si];
        G2[di] = data[si + 1];
        Bc[di] = data[si + 2];
      }
    }
    const T2 = P.edgeT;
    const E = new Uint8Array(N);
    for (let y = 0; y < H2; y++) {
      const row = y * W2;
      for (let x = 0; x < W2; x++) {
        const i = row + x;
        const r = R4[i], g = G2[i], b = Bc[i];
        if (x + 1 < W2) {
          const j = i + 1;
          const d = Math.max(Math.abs(r - R4[j]), Math.abs(g - G2[j]), Math.abs(b - Bc[j]));
          if (d > T2) {
            E[i] = 1;
            E[j] = 1;
          }
          if (x + 2 < W2) {
            const k = i + 2;
            const d2 = Math.max(Math.abs(r - R4[k]), Math.abs(g - G2[k]), Math.abs(b - Bc[k]));
            if (d2 > T2) {
              E[i] = 1;
              E[j] = 1;
              E[k] = 1;
            }
          }
        }
        if (y + 1 < H2) {
          const j = i + W2;
          const d = Math.max(Math.abs(r - R4[j]), Math.abs(g - G2[j]), Math.abs(b - Bc[j]));
          if (d > T2) {
            E[i] = 1;
            E[j] = 1;
          }
          if (y + 2 < H2) {
            const k = j + W2;
            const d2 = Math.max(Math.abs(r - R4[k]), Math.abs(g - G2[k]), Math.abs(b - Bc[k]));
            if (d2 > T2) {
              E[i] = 1;
              E[j] = 1;
              E[k] = 1;
            }
          }
        }
      }
    }
    for (let x = 0; x < W2; x++) {
      E[x] = 0;
      E[(H2 - 1) * W2 + x] = 0;
    }
    for (let y = 0; y < H2; y++) {
      E[y * W2] = 0;
      E[y * W2 + W2 - 1] = 0;
    }
    const lab2 = new Int32Array(N), rl = new Int32Array(N), stack = new Int32Array(N);
    const comps = [null], regs = [null];
    for (let s = 0; s < N; s++) {
      if (!E[s] || lab2[s]) continue;
      const id = comps.length;
      let sp = 0;
      stack[sp++] = s;
      lab2[s] = id;
      let n = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
      while (sp) {
        const p = stack[--sp];
        n++;
        const px = p % W2, py = (p - px) / W2;
        if (px < x0) x0 = px;
        if (px > x1) x1 = px;
        if (py < y0) y0 = py;
        if (py > y1) y1 = py;
        const yA = py > 0 ? -1 : 0, yB = py < H2 - 1 ? 1 : 0, xA = px > 0 ? -1 : 0, xB = px < W2 - 1 ? 1 : 0;
        for (let dy = yA; dy <= yB; dy++) for (let dx = xA; dx <= xB; dx++) {
          const q = p + dy * W2 + dx;
          if (E[q] && !lab2[q]) {
            lab2[q] = id;
            stack[sp++] = q;
          }
        }
      }
      comps.push({ id, n, px0: x0, py0: y0, px1: x1, py1: y1 });
    }
    for (let s = 0; s < N; s++) {
      if (E[s] || rl[s]) continue;
      const id = regs.length;
      let sp = 0;
      stack[sp++] = s;
      rl[s] = id;
      let n = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
      while (sp) {
        const p = stack[--sp];
        n++;
        const px = p % W2, py = (p - px) / W2;
        if (px < x0) x0 = px;
        if (px > x1) x1 = px;
        if (py < y0) y0 = py;
        if (py > y1) y1 = py;
        if (px > 0) {
          const q = p - 1;
          if (!E[q] && !rl[q]) {
            rl[q] = id;
            stack[sp++] = q;
          }
        }
        if (px < W2 - 1) {
          const q = p + 1;
          if (!E[q] && !rl[q]) {
            rl[q] = id;
            stack[sp++] = q;
          }
        }
        if (py > 0) {
          const q = p - W2;
          if (!E[q] && !rl[q]) {
            rl[q] = id;
            stack[sp++] = q;
          }
        }
        if (py < H2 - 1) {
          const q = p + W2;
          if (!E[q] && !rl[q]) {
            rl[q] = id;
            stack[sp++] = q;
          }
        }
      }
      regs.push({ id, n, px0: x0, py0: y0, px1: x1, py1: y1 });
    }
    const nc = comps.length - 1, nr = regs.length - 1;
    const adjC = Array.from({ length: nc + 1 }, () => []);
    const adjR = Array.from({ length: nr + 1 }, () => []);
    const lastR = new Int32Array(nc + 1);
    const link = (c, r) => {
      if (!r || lastR[c] === r) return;
      lastR[c] = r;
      const a = adjC[c];
      for (let k = 0; k < a.length; k++) if (a[k] === r) return;
      a.push(r);
      adjR[r].push(c);
    };
    for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) {
      const i = y * W2 + x, c = lab2[i];
      if (!c) continue;
      if (x > 0) link(c, rl[i - 1]);
      if (x < W2 - 1) link(c, rl[i + 1]);
      if (y > 0) link(c, rl[i - W2]);
      if (y < H2 - 1) link(c, rl[i + W2]);
    }
    const outer = rl[0];
    const parentRegion = new Int32Array(nc + 1).fill(-1);
    const encl = new Int32Array(nr + 1).fill(-1);
    encl[outer] = 0;
    const queue = [outer], order = [];
    for (let qi = 0; qi < queue.length; qi++) {
      const r = queue[qi];
      for (const c of adjR[r]) {
        if (parentRegion[c] !== -1) continue;
        parentRegion[c] = r;
        order.push(c);
        for (const r2 of adjC[c]) if (encl[r2] === -1) {
          encl[r2] = c;
          queue.push(r2);
        }
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
      for (const h2 of holesOf[c]) {
        let ha = regs[h2].n;
        for (const c2 of compsIn[h2]) ha += encA[c2];
        holeA[h2] = ha;
        s += ha;
      }
      encA[c] = s;
    }
    const QH = new Uint32Array(32768), QR = new Float64Array(32768), QG = new Float64Array(32768), QB = new Float64Array(32768);
    const regionInfo = /* @__PURE__ */ new Map();
    function regionStats(r) {
      if (regionInfo.has(r)) return regionInfo.get(r);
      const g = regs[r];
      const w = g.px1 - g.px0 + 1, h2 = g.py1 - g.py0 + 1;
      let step = Math.max(1, Math.floor(Math.sqrt(w * h2 / 9e3)));
      let res = null;
      for (let attempt = 0; attempt < 2 && !res; attempt++, step = 1) {
        const touched = [];
        let n = 0, sr = 0, sg = 0, sb = 0, sr2 = 0, sg2 = 0, sb2 = 0;
        for (let y = g.py0; y <= g.py1; y += step) for (let x = g.px0; x <= g.px1; x += step) {
          const i = y * W2 + x;
          if (rl[i] !== r) continue;
          const rr = R4[i], gg = G2[i], bb = Bc[i];
          const k = rr >> 3 << 10 | gg >> 3 << 5 | bb >> 3;
          if (!QH[k]) touched.push(k);
          QH[k]++;
          QR[k] += rr;
          QG[k] += gg;
          QB[k] += bb;
          n++;
          sr += rr;
          sg += gg;
          sb += bb;
          sr2 += rr * rr;
          sg2 += gg * gg;
          sb2 += bb * bb;
        }
        if (!n) continue;
        let bk = touched[0];
        for (const k of touched) if (QH[k] > QH[bk]) bk = k;
        const mode = [QR[bk] / QH[bk], QG[bk] / QH[bk], QB[bk] / QH[bk]];
        const v = sr2 / n - (sr / n) ** 2 + (sg2 / n - (sg / n) ** 2) + (sb2 / n - (sb / n) ** 2);
        res = { mode, std: Math.sqrt(Math.max(0, v) / 3), share: QH[bk] / n };
        for (const k of touched) {
          QH[k] = 0;
          QR[k] = 0;
          QG[k] = 0;
          QB[k] = 0;
        }
      }
      res = res || { mode: bg.slice(), std: 0, share: 1 };
      regionInfo.set(r, res);
      return res;
    }
    const boxOf = (c) => B(c.px0 - 1, c.py0 - 1, c.px1, c.py1);
    function classify(c) {
      const cc = comps[c];
      const box2 = boxOf(cc);
      const w = W_(box2), h2 = H_(box2);
      if (w < 10 || h2 < 10 || !holesOf[c].length) return null;
      const A = (cc.px1 - cc.px0 + 1) * (cc.py1 - cc.py0 + 1);
      const sol = encA[c] / A;
      let hsum = 0, big = 0, bigA = 0;
      for (const hh2 of holesOf[c]) {
        hsum += holeA[hh2];
        if (holeA[hh2] > bigA) {
          bigA = holeA[hh2];
          big = hh2;
        }
      }
      const hr = hsum / A;
      if (P.debugAt && box2.x0 <= P.debugAt[0] && box2.x1 >= P.debugAt[0] && box2.y0 <= P.debugAt[1] && box2.y1 >= P.debugAt[1]) console.log("DBG classify", JSON.stringify({ box: box2, w, h: h2, A, encA: encA[c], sol: +sol.toFixed(3), hr: +hr.toFixed(3), holes: holesOf[c].map((hh2) => [holeA[hh2], regs[hh2].n]) }));
      if (hr < 0.28 || sol < 0.6) return null;
      const outside = regionStats(parentRegion[c]).mode;
      const inner = regionStats(big);
      const filled = cdist(inner.mode, outside) > T2;
      if (filled) {
        if (sol < 0.64 || hr < 0.3 || !deep(big)) return null;
      } else if (sol < 0.85 || hr < 0.5 || w < 20 || h2 < 14) return null;
      return { filled, fill: filled ? inner.mode : outside, std: inner.std, sol, box: box2 };
    }
    function deep(hh2) {
      const g = regs[hh2];
      let n = 0;
      for (let y = g.py0 + 3; y <= g.py1 - 3; y++) for (let x = g.px0 + 3; x <= g.px1 - 3; x++) {
        const i = y * W2 + x;
        if (rl[i] === hh2 && rl[i - 3] === hh2 && rl[i + 3] === hh2 && rl[i - 3 * W2] === hh2 && rl[i + 3 * W2] === hh2 && ++n >= 12) return true;
      }
      return false;
    }
    const setOfComp = (c) => {
      const cc = comps[c], out = [];
      for (let y = cc.py0; y <= cc.py1; y++) for (let x = cc.px0; x <= cc.px1; x++) {
        const i = y * W2 + x;
        if (lab2[i] === c) out.push(i);
      }
      return out;
    };
    const MARK = new Int32Array(N);
    let markGen = 0;
    const bboxOf = (idx) => {
      let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
      for (const i of idx) {
        const x = i % W2, y = (i - x) / W2;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
      return { px0: x0, py0: y0, px1: x1, py1: y1 };
    };
    function pieces(idx) {
      const g = ++markGen;
      for (const i of idx) MARK[i] = g;
      const out = [];
      for (const s0 of idx) {
        if (MARK[s0] !== g) continue;
        const st = [s0], mine = [];
        MARK[s0] = -g;
        while (st.length) {
          const p = st.pop();
          mine.push(p);
          const px = p % W2;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (px + dx < 0 || px + dx >= W2) continue;
            const q = p + dy * W2 + dx;
            if (q >= 0 && q < N && MARK[q] === g) {
              MARK[q] = -g;
              st.push(q);
            }
          }
        }
        out.push(Object.assign({ idx: mine, n: mine.length }, bboxOf(mine)));
      }
      return out;
    }
    function peel(set) {
      const b = set.px0 != null ? set : bboxOf(set.idx);
      const x0 = b.px0, y0 = b.py0, x1 = b.px1, y1 = b.py1;
      const w = x1 - x0 + 1, h2 = y1 - y0 + 1;
      if (w < 18 || h2 < 14) return null;
      const g = ++markGen;
      for (const i of set.idx) MARK[i] = g;
      const mine = (i) => MARK[i] === g;
      const rad = cornerRadius(mine, x0, y0, x1, y1);
      for (const i of set.idx) MARK[i] = g;
      const MAXB = 6, r = Math.max(3, Math.min(14, Math.floor(Math.min(w, h2) / 2), Math.ceil(rad) + 2));
      const fills = [];
      let bandMax = 1;
      const scan = (from, step, count) => {
        let k = 0, i = from;
        while (k < count && mine(i)) {
          i += step;
          k++;
        }
        if (k >= 1 && k <= MAXB && k < count && !E[i]) {
          bandMax = Math.max(bandMax, k);
          fills.push(i);
          return 1;
        }
        return 0;
      };
      const side = (n, at) => {
        let ok = 0, runs = 0, prev = 1;
        for (let k = 0; k < n; k++) {
          const v = at(k);
          ok += v;
          if (!v && prev) runs++;
          prev = v;
        }
        return { n, ok, runs };
      };
      const flatX = x1 - r - (x0 + r) + 1, flatY = y1 - r - (y0 + r) + 1;
      if (flatX < 6) return null;
      const top = side(flatX, (k) => scan(y0 * W2 + x0 + r + k, W2, h2));
      const bot = side(flatX, (k) => scan(y1 * W2 + x0 + r + k, -W2, h2));
      const sides = [top, bot];
      if (flatY >= 3) {
        sides.push(side(flatY, (k) => scan((y0 + r + k) * W2 + x0, 1, w)));
        sides.push(side(flatY, (k) => scan((y0 + r + k) * W2 + x1, -1, w)));
      }
      const dbg = P.debugAt && x0 - 1 <= P.debugAt[0] && x1 >= P.debugAt[0] && y0 - 1 <= P.debugAt[1] && y1 >= P.debugAt[1];
      if (dbg) console.log("DBG peel", JSON.stringify({ x0: x0 - 1, y0: y0 - 1, x1, y1, r, flatX, flatY, sides }));
      const clean = (sd) => sd.ok >= 0.8 * sd.n && sd.runs <= 2;
      const partial = (sd) => sd.ok >= 0.3 * sd.n && sd.runs <= 2;
      const pairOk = (a2, b2) => clean(a2) && (clean(b2) || partial(b2)) || clean(b2) && partial(a2);
      const loose = (sd) => clean(sd) || sd.ok >= 0.15 * sd.n;
      const tight = sides.length === 4 && sides.every(loose) && (sides.filter(clean).length >= 3 || clean(sides[2]) && clean(sides[3]) || clean(sides[0]) && clean(sides[1])) || // a short pill whose corners leave no straight side to check: one clean long side and
      // the other band for most of its length, wherever the text touches it
      sides.length === 2 && h2 <= 40 && (clean(sides[0]) && sides[1].ok >= 0.6 * sides[1].n || clean(sides[1]) && sides[0].ok >= 0.6 * sides[0].n);
      if (!tight) {
        if (!pairOk(sides[0], sides[1])) return null;
        if (sides.length > 2 && !pairOk(sides[2], sides[3])) return null;
      }
      const fr2 = fills.map((i) => R4[i]), fg = fills.map((i) => G2[i]), fb = fills.map((i) => Bc[i]);
      const med = (a) => a.slice().sort((p, q) => p - q)[a.length >> 1];
      const fill = [med(fr2), med(fg), med(fb)];
      let agree = 0;
      for (let k = 0; k < fills.length; k++) if (Math.max(Math.abs(fr2[k] - fill[0]), Math.abs(fg[k] - fill[1]), Math.abs(fb[k] - fill[2])) <= T2) agree++;
      if (agree < 0.8 * fills.length) return null;
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
    function splitRules(set) {
      const { px0: x0, py0: y0, px1: x1, py1: y1 } = set;
      const w = x1 - x0 + 1, h2 = y1 - y0 + 1;
      if ((w < 60 || h2 < 14) && (h2 < 60 || w < 14)) return null;
      const g = ++markGen;
      for (const i of set.idx) MARK[i] = g;
      const rowsFull = [], colsFull = [];
      if (w >= 40 && h2 > 6) for (let y = y0; y <= y1; y++) {
        let n = 0;
        for (let x = x0; x <= x1; x++) if (MARK[y * W2 + x] === g) n++;
        if (n >= 0.92 * w) rowsFull.push(y);
      }
      if (h2 >= 40 && w > 6) for (let x = x0; x <= x1; x++) {
        let n = 0;
        for (let y = y0; y <= y1; y++) if (MARK[y * W2 + x] === g) n++;
        if (n >= 0.92 * h2) colsFull.push(x);
      }
      const bands = (arr) => {
        const out = [];
        for (const v of arr) {
          const l = out[out.length - 1];
          if (l && v === l[1] + 1) l[1] = v;
          else out.push([v, v]);
        }
        return out.filter(([a, b2]) => b2 - a + 1 <= 10);
      };
      const cov = (y, isRow) => {
        let n = 0;
        if (isRow) {
          for (let x = x0; x <= x1; x++) if (MARK[y * W2 + x] === g) n++;
          return n / w;
        }
        for (let yy = y0; yy <= y1; yy++) if (MARK[yy * W2 + y] === g) n++;
        return n / h2;
      };
      const lineLike = (a, b2, isRow) => {
        const c = Array.from({ length: b2 - a + 1 }, (_, k) => isRow ? transitions((a + k) * W2 + x0, 1, w) : transitions(y0 * W2 + a + k, W2, h2)).sort((p, q) => p - q);
        return c[c.length >> 1] <= Math.max(6, (isRow ? w : h2) / 30);
      };
      const grow = (bnd, isRow, lo, hi) => {
        let [a, b2] = bnd;
        for (let k = 0; k < 2 && a - 1 >= lo && cov(a - 1, isRow) >= 0.5; k++) a--;
        for (let k = 0; k < 2 && b2 + 1 <= hi && cov(b2 + 1, isRow) >= 0.5; k++) b2++;
        return [a, b2];
      };
      const hb = w >= 60 ? bands(rowsFull).filter(([a, b2]) => h2 >= b2 - a + 5 && lineLike(a, b2, true)).map((bd) => grow(bd, true, y0, y1)) : [];
      const vb = h2 >= 60 ? bands(colsFull).filter(([a, b2]) => w >= b2 - a + 5 && lineLike(a, b2, false)).map((bd) => grow(bd, false, x0, x1)) : [];
      const inH = (y) => hb.some(([a, b2]) => y >= a && y <= b2), inV = (x) => vb.some(([a, b2]) => x >= a && x <= b2);
      if (!hb.length && !vb.length) return null;
      const rest = [];
      for (const i of set.idx) {
        const x = i % W2, y = (i - x) / W2;
        if (!inH(y) && !inV(x)) rest.push(i);
      }
      const rules = [
        ...hb.map(([a, b2]) => ({ px0: x0, py0: a, px1: x1, py1: b2, n: w * (b2 - a + 1), rule: true })),
        ...vb.map(([a, b2]) => ({ px0: a, py0: y0, px1: b2, py1: y1, n: h2 * (b2 - a + 1), rule: true }))
      ];
      if (rest.length < 6) return { rules, frameLike: false, bands: hb, rest: [] };
      const rb = bboxOf(rest);
      if (hb.length && rb.py1 - rb.py0 < 5 || vb.length && rb.px1 - rb.px0 < 5) return null;
      const sideCov = (x) => {
        let n = 0;
        for (let y = y0; y <= y1; y++) if (MARK[y * W2 + x] === g) n++;
        return n / h2;
      };
      const frameLike = hb.length >= 2 && hb[0][0] <= y0 + 1 && hb[hb.length - 1][1] >= y1 - 1 && !vb.length && Math.max(sideCov(x0), sideCov(x0 + 1), sideCov(x0 + 2)) >= 0.8 && Math.max(sideCov(x1), sideCov(x1 - 1), sideCov(x1 - 2)) >= 0.8 && h2 <= 60;
      return { rules, frameLike, bands: hb, rest: pieces(rest).filter((p) => p.n >= 12 && p.px1 - p.px0 >= 4 && p.py1 - p.py0 >= 4) };
    }
    let nid = 0;
    const all = [];
    const mk = (kind, box2, extra) => {
      const n = Object.assign({ id: ++nid, kind, box: box2, children: [] }, extra);
      all.push(n);
      return n;
    };
    const pbox = (p) => B(p.px0 - 1, p.py0 - 1, p.px1, p.py1);
    function groupInk(ink0) {
      const ink = ink0.filter((o) => o.rule || o.n > 4 || Math.max(W_(o.box), H_(o.box)) > 3);
      const n = ink.length;
      if (!n) return [];
      if (P.debugInk) {
        const R0 = P.debugInk;
        for (const o of ink) if (o.box.x1 > R0[0] && o.box.x0 < R0[2] && o.box.y1 > R0[1] && o.box.y0 < R0[3]) console.log("DBG ink", JSON.stringify({ box: [o.box.x0, o.box.y0, o.box.x1, o.box.y1], n: o.n, rule: !!o.rule }));
      }
      const hs = ink.map((o) => H_(o.box)).filter((h2) => h2 >= 6).sort((a, b) => a - b);
      const med = hs.length ? hs[hs.length >> 1] : 12;
      const maxH = ink.reduce((m2, o) => Math.max(m2, H_(o.box)), 0);
      const ruleCache = /* @__PURE__ */ new Map();
      const isRule = (o) => {
        if (o.rule) return true;
        if (ruleCache.has(o)) return ruleCache.get(o);
        const w = W_(o.box), h2 = H_(o.box);
        let v = false;
        if (h2 <= 12 && w >= 5 * h2 && w >= 24) v = lineRuns(o.box, true) <= Math.max(6, w / 30);
        else if (w <= 12 && h2 >= 5 * w && h2 >= 24) v = lineRuns(o.box, false) <= Math.max(6, h2 / 30);
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
          const sliver = (o) => W_(o.box) <= 6 && H_(o.box) >= 3.5 * W_(o.box);
          if (sliver(a) && ha > 1.6 * hb || sliver(b) && hb > 1.6 * ha) continue;
          const hr = Math.max(ha, hb) > 2.5 * Math.min(ha, hb) ? Math.min(ha, hb) : Math.max(ha, hb);
          if (gap <= P.kH * hr) uf.union(idx[ii], idx[jj]);
        }
      }
      const gmap = /* @__PURE__ */ new Map();
      for (let i = 0; i < n; i++) {
        const r = uf.find(i);
        if (!gmap.has(r)) gmap.set(r, { box: ink[i].box, members: [i], px: ink[i].n });
        else {
          const g = gmap.get(r);
          g.box = UNION(g.box, ink[i].box);
          g.members.push(i);
          g.px += ink[i].n;
        }
      }
      let lines = [...gmap.values()];
      const tiny = (l) => l.members.length === 1 && Math.max(W_(l.box), H_(l.box)) <= 0.45 * med && !isRule(ink[l.members[0]]);
      const big = lines.filter((l) => !tiny(l));
      for (const t of lines.filter(tiny)) {
        let best = null, bd = Infinity;
        const cx = CX(t.box), cy = CY(t.box);
        for (const l of big) {
          const g = { x0: l.box.x0 - 0.6 * H_(l.box), x1: l.box.x1 + 0.6 * H_(l.box), y0: l.box.y0 - 0.35 * H_(l.box), y1: l.box.y1 + 0.35 * H_(l.box) };
          if (cx < g.x0 || cx > g.x1 || cy < g.y0 || cy > g.y1) continue;
          const d = Math.hypot(clamp(cx, l.box.x0, l.box.x1) - cx, clamp(cy, l.box.y0, l.box.y1) - cy);
          if (d < bd) {
            bd = d;
            best = l;
          }
        }
        if (best) {
          best.box = UNION(best.box, t.box);
          best.members.push(...t.members);
          best.px += t.px;
          t.dead = true;
        }
      }
      lines = lines.filter((l) => !l.dead);
      lines.forEach((l) => {
        l.rule = l.members.length === 1 && isRule(ink[l.members[0]]);
      });
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
          if (a.members.length === 1 && W_(a.box) >= 6 * ha || b.members.length === 1 && W_(b.box) >= 6 * hb) continue;
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
      const pmap = /* @__PURE__ */ new Map();
      for (let i = 0; i < m; i++) {
        const r = uf2.find(i);
        const l = lines[i];
        if (!pmap.has(r)) pmap.set(r, { box: l.box, lines: 1, parts: l.members.length, px: l.px, rule: l.rule, members: l.members.slice() });
        else {
          const p = pmap.get(r);
          p.box = UNION(p.box, l.box);
          p.lines++;
          p.parts += l.members.length;
          p.px += l.px;
          p.rule = false;
          p.members.push(...l.members);
        }
      }
      return [...pmap.values()].map((p) => {
        const w = W_(p.box), h2 = H_(p.box);
        let kind = "text";
        if (p.rule) kind = "rule";
        else if (p.lines === 1 && p.parts <= 2 && w / h2 > 0.6 && w / h2 < 1.6 && h2 <= 2.4 * med) kind = "icon";
        else if (p.lines === 1 && p.parts === 1 && w >= 40 && h2 >= 40) kind = "image";
        else if (p.lines <= 2 && p.parts <= 3 && w >= 40 && h2 >= 3 * med) kind = "image";
        else if (p.members.some((k) => {
          const o = ink[k];
          const oh = H_(o.box), ow = W_(o.box);
          return oh >= 2.5 * med && ow >= 2.5 * med && o.n / Math.max(1, ow * oh) <= 0.25;
        })) kind = "image";
        let sig = null;
        if (kind === "text" && p.lines === 1) {
          const iv = p.members.map((k) => [ink[k].box.x0, ink[k].box.x1]).sort((a, b) => a[0] - b[0]);
          const runs = [];
          for (const [a, b] of iv) {
            const last = runs[runs.length - 1];
            if (last && a <= last[1] + 1) last[1] = Math.max(last[1], b);
            else runs.push([a, b]);
          }
          sig = runs.map(([a, b]) => (b - a) / Math.max(1, w));
        }
        return { kind, box: p.box, lines: p.lines, parts: p.parts, px: p.px, sig, density: p.px / Math.max(1, w * h2) };
      });
    }
    function lineRuns(box2, isRow) {
      const x0 = Math.max(1, Math.floor(box2.x0) + 1), x1 = Math.min(W2 - 2, Math.ceil(box2.x1));
      const y0 = Math.max(1, Math.floor(box2.y0) + 1), y1 = Math.min(H2 - 2, Math.ceil(box2.y1));
      const counts = [];
      if (isRow) for (let y = y0; y <= y1; y++) counts.push(transitions(y * W2 + x0, 1, x1 - x0 + 1));
      else for (let x = x0; x <= x1; x++) counts.push(transitions(y0 * W2 + x, W2, y1 - y0 + 1));
      counts.sort((a, b) => a - b);
      return counts.length ? counts[counts.length >> 1] : Infinity;
    }
    function transitions(from, step, count) {
      let n = 0;
      for (let k = 1, i = from + step; k < count; k++, i += step) {
        const p = i - step;
        if (Math.max(Math.abs(R4[i] - R4[p]), Math.abs(G2[i] - G2[p]), Math.abs(Bc[i] - Bc[p])) > T2) n++;
      }
      return n;
    }
    function cornerRadius(mine, x0, y0, x1, y1) {
      const L = Math.min(30, Math.floor(Math.min(x1 - x0, y1 - y0) / 2));
      const g = ++markGen;
      const rs = [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]].map(([cx, cy, sx, sy]) => {
        const st = [[0, 0]];
        let n = 0;
        const seen = /* @__PURE__ */ new Set(["0,0"]);
        if (mine(cy * W2 + cx)) return 0;
        while (st.length) {
          const [a, b2] = st.pop();
          n++;
          for (const [da, db] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
            const na = a + da, nb = b2 + db;
            if (na < 0 || nb < 0 || na >= L || nb >= L) continue;
            const key = na + "," + nb;
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
    function rectilinear(hh2) {
      const g = regs[hh2];
      const w = g.px1 - g.px0 + 1, h2 = g.py1 - g.py0 + 1;
      const mx = Math.min(16, Math.floor(w / 4)), my = Math.min(16, Math.floor(h2 / 4));
      const spread = (a) => {
        if (a.length < 4) return 0;
        a.sort((p, q) => p - q);
        return a[Math.floor(a.length * 0.9)] - a[Math.floor(a.length * 0.1)];
      };
      const tops = [], bots = [], lefts = [], rights = [];
      for (let x = g.px0 + mx; x <= g.px1 - mx; x++) {
        let y = g.py0;
        while (y <= g.py1 && rl[y * W2 + x] !== hh2) y++;
        if (y > g.py1) continue;
        tops.push(y);
        let y2 = g.py1;
        while (y2 >= g.py0 && rl[y2 * W2 + x] !== hh2) y2--;
        bots.push(y2);
      }
      for (let y = g.py0 + my; y <= g.py1 - my; y++) {
        let x = g.px0;
        while (x <= g.px1 && rl[y * W2 + x] !== hh2) x++;
        if (x > g.px1) continue;
        lefts.push(x);
        let x2 = g.px1;
        while (x2 >= g.px0 && rl[y * W2 + x2] !== hh2) x2--;
        rights.push(x2);
      }
      const lim = 6;
      return spread(tops) <= lim && spread(bots) <= lim && spread(lefts) <= lim && spread(rights) <= lim;
    }
    function virtualFrame(pv, set, parentFill, depth, parent) {
      const box2 = pbox(set);
      const filled = cdist(pv.fill, parentFill) > T2;
      const span = /* @__PURE__ */ new Map();
      for (const i of pv.ring) {
        const x = i % W2, y = (i - x) / W2;
        const r = span.get(y);
        if (!r) span.set(y, [x, x]);
        else {
          if (x < r[0]) r[0] = x;
          if (x > r[1]) r[1] = x;
        }
      }
      let area = 0;
      for (const [, [a, b2]] of span) area += b2 - a + 1;
      const sol = area / ((set.px1 - set.px0 + 1) * (set.py1 - set.py0 + 1));
      const node = mk("container", box2, { fill: filled ? pv.fill : parentFill, filled, solidity: sol, std: 0, depth, parent, bg: parentFill, peeled: true });
      {
        const g2 = ++markGen;
        for (const i of set.idx) MARK[i] = g2;
        node.radius = cornerRadius((i) => MARK[i] === g2, set.px0, set.py0, set.px1, set.py1);
      }
      node._ink = pieces(pv.content).filter((p) => p.n >= 3).map((p) => ({ box: pbox(p), n: p.n }));
      node.color = node.fill;
      return node;
    }
    function buildLevel(regionList, parentFill, depth, parent, extraInk) {
      const nodes = [], ink = extraInk ? extraInk.slice() : [];
      const virtual = [];
      const queue2 = regionList.slice();
      for (let qi = 0; qi < queue2.length; qi++) for (const c of compsIn[queue2[qi]]) {
        const cls = classify(c);
        if (cls) {
          const node = mk("container", cls.box, { fill: cls.fill, filled: cls.filled, solidity: cls.sol, std: cls.std, depth, parent, bg: parentFill });
          {
            const cc2 = comps[c];
            node.radius = cornerRadius((i) => lab2[i] === c, cc2.px0, cc2.py0, cc2.px1, cc2.py1);
          }
          const A = W_(cls.box) * H_(cls.box);
          const sig = holesOf[c].filter((hh2) => {
            const g = regs[hh2];
            return holeA[hh2] >= 0.02 * A && g.px1 - g.px0 >= 24 && g.py1 - g.py0 >= 16;
          });
          if (sig.length >= 2 && sig.some((hh2) => !rectilinear(hh2))) {
            node.kind = "image";
            node.graphic = true;
            node.children = [];
            node.color = node.fill;
            nodes.push(node);
            continue;
          }
          if (sig.length >= 2) {
            const kids = [];
            for (const hh2 of sig) {
              const g = regs[hh2], st = regionStats(hh2);
              const cell = mk("container", B(g.px0 - 1, g.py0 - 1, g.px1, g.py1), { fill: st.mode, filled: cdist(st.mode, cls.fill) > T2, solidity: 1, std: st.std, depth: depth + 1, parent: node, bg: cls.fill, cell: true });
              cell.children = buildLevel([hh2], st.mode, depth + 2, cell);
              if (!cell.children.length) cell.kind = st.std > 26 ? "image" : "shape";
              cell.color = cell.fill;
              kids.push(cell);
            }
            node.children = kids.concat(buildLevel(holesOf[c].filter((hh2) => !sig.includes(hh2)), cls.fill, depth + 1, node));
          } else node.children = buildLevel(holesOf[c], cls.fill, depth + 1, node);
          if (!node.children.length) node.kind = cls.std > 26 ? "image" : "shape";
          node.color = node.fill;
          nodes.push(node);
          continue;
        }
        const shell = holesOf[c].filter((hh2) => {
          const g = regs[hh2];
          return holeA[hh2] >= 4e3 && g.px1 - g.px0 >= 40 && g.py1 - g.py0 >= 24 && rectilinear(hh2);
        });
        if (shell.length) {
          for (const hh2 of shell) {
            const g = regs[hh2], st = regionStats(hh2);
            const cell = mk("container", B(g.px0 - 1, g.py0 - 1, g.px1, g.py1), { fill: st.mode, filled: cdist(st.mode, parentFill) > T2, solidity: 1, std: st.std, depth, parent, bg: parentFill, cell: true });
            cell.children = buildLevel([hh2], st.mode, depth + 1, cell);
            if (!cell.children.length) cell.kind = st.std > 26 ? "image" : "shape";
            cell.color = cell.fill;
            nodes.push(cell);
          }
          for (const h2 of holesOf[c]) if (!shell.includes(h2) && compsIn[h2].length) queue2.push(h2);
          continue;
        }
        for (const h2 of holesOf[c]) if (compsIn[h2].length) queue2.push(h2);
        const cc = comps[c];
        const big = cc.px1 - cc.px0 >= 17 && cc.py1 - cc.py0 >= 13;
        const long = cc.px1 - cc.px0 >= 39 || cc.py1 - cc.py0 >= 39;
        const dbgC = P.debugAt && cc.px0 - 1 <= P.debugAt[0] && cc.px1 >= P.debugAt[0] && cc.py0 - 1 <= P.debugAt[1] && cc.py1 >= P.debugAt[1];
        if (dbgC) console.log("DBG comp", JSON.stringify({ box: boxOf(cc), n: cc.n, big, long, holes: holesOf[c].length }));
        if (!big && !long) {
          ink.push({ c, box: boxOf(cc), n: cc.n });
          continue;
        }
        const set = Object.assign({ idx: setOfComp(c) }, cc);
        const pv0 = big ? peel(set) : null;
        const pv = pv0 && (cdist(pv0.fill, parentFill) > T2 || pv0.content.length >= 12) ? pv0 : null;
        if (dbgC) {
          const sr0 = pv ? null : splitRules(set);
          console.log("DBG comp-split", JSON.stringify({ peeled: !!pv, sr: sr0 && { rules: sr0.rules.map((r) => [r.px0 - 1, r.py0 - 1, r.px1, r.py1]), frameLike: sr0.frameLike, bands: sr0.bands, rest: sr0.rest.map((p) => [p.px0 - 1, p.py0 - 1, p.px1, p.py1, p.n]) } }));
        }
        if (pv) {
          const vf = virtualFrame(pv, set, parentFill, depth, parent);
          vf._src = { box: boxOf(cc), n: cc.n, c };
          virtual.push(vf);
          continue;
        }
        const sr = splitRules(set);
        if (!sr) {
          ink.push({ c, box: boxOf(cc), n: cc.n });
          continue;
        }
        if (sr.frameLike) {
          const top = sr.bands[0][1] + 1, bot = sr.bands[sr.bands.length - 1][0] - 1;
          const fr2 = [], fg = [], fb = [];
          for (let y = top; y <= bot; y++) for (let x = cc.px0 + 2; x <= cc.px1 - 2; x++) {
            const i = y * W2 + x;
            if (!E[i]) {
              fr2.push(R4[i]);
              fg.push(G2[i]);
              fb.push(Bc[i]);
            }
          }
          if (fr2.length >= 6) {
            const md = (a2) => a2.sort((p2, q) => p2 - q)[a2.length >> 1];
            const ring = [], content = [];
            const g2 = ++markGen;
            const sideBand = (p2) => p2.px1 - p2.px0 <= 6 && (p2.px0 <= cc.px0 + 1 || p2.px1 >= cc.px1 - 1);
            for (const p2 of sr.rest) if (!sideBand(p2)) for (const i of p2.idx) MARK[i] = g2;
            for (const i of set.idx) (MARK[i] === g2 ? content : ring).push(i);
            virtual.push(virtualFrame({ fill: [md(fr2), md(fg), md(fb)], bandMax: 3, ring, content }, set, parentFill, depth, parent));
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
      for (let k = virtual.length - 1; k >= 0; k--) {
        const v = virtual[k];
        if (!v._src) continue;
        const hv = H_(v.box);
        const glued = ink.some((o) => {
          const ho = H_(o.box);
          if (OVL(o.box.y0, o.box.y1, v.box.y0, v.box.y1) < 0.6 * Math.min(hv, ho) || Math.max(hv, ho) > 1.4 * Math.min(hv, ho)) return false;
          const gap = Math.max(o.box.x0, v.box.x0) - Math.min(o.box.x1, v.box.x1);
          return gap <= 0.2 * hv;
        });
        if (glued) {
          ink.push({ c: v._src.c, box: v._src.box, n: v._src.n });
          all.splice(all.indexOf(v), 1);
          virtual.splice(k, 1);
        }
      }
      for (const v of virtual) {
        const inside = [];
        for (let k = ink.length - 1; k >= 0; k--) {
          const b = ink[k].box;
          if (b.x0 >= v.box.x0 - 1 && b.y0 >= v.box.y0 - 1 && b.x1 <= v.box.x1 + 1 && b.y1 <= v.box.y1 + 1) {
            inside.push(ink[k]);
            ink.splice(k, 1);
          }
        }
        const kids = groupInk(v._ink.concat(inside));
        v.children = kids.map((blk) => {
          const n = mk(blk.kind, blk.box, { lines: blk.lines, parts: blk.parts, px: blk.px, sig: blk.sig, density: blk.density, depth: depth + 1, parent: v, bg: v.fill });
          const ic = inkColor(data, W, H, blk.box, v.fill);
          n.color = ic.color;
          n.palette = ic.palette;
          if (blk.kind === "text" && blk.lines === 1) n.prof = inkProfile(data, W, H, blk.box, v.fill);
          if (blk.kind === "icon") n.mask = glyphMask(data, W, H, blk.box, v.fill);
          return n;
        });
        delete v._ink;
        if (!v.children.length) v.kind = "shape";
        nodes.push(v);
      }
      for (const blk of groupInk(ink)) {
        if (blk.kind === "text" && W_(blk.box) <= 3 && H_(blk.box) <= 3) continue;
        const node = mk(blk.kind, blk.box, { lines: blk.lines, parts: blk.parts, px: blk.px, sig: blk.sig, density: blk.density, depth, parent, bg: parentFill });
        const ic = inkColor(data, W, H, blk.box, parentFill);
        node.color = ic.color;
        node.palette = ic.palette;
        if (blk.kind === "text" && blk.lines === 1) node.prof = inkProfile(data, W, H, blk.box, parentFill);
        if (blk.kind === "icon") node.mask = glyphMask(data, W, H, blk.box, parentFill);
        nodes.push(node);
      }
      return nodes;
    }
    const root = { id: 0, kind: "root", box: B(0, 0, W, H), fill: bg, color: bg, depth: 0, children: [] };
    root.children = buildLevel([outer], bg, 1, root);
    {
      const th = all.filter((n) => n.kind === "text" && n.lines === 1).map((n) => H_(n.box)).sort((a, b2) => a - b2);
      const tm = th.length ? th[th.length >> 1] : 14;
      for (const n of all) if (n.kind === "icon") n.tall = H_(n.box) / tm;
    }
    const ms = performance.now() - t0;
    return { root, nodes: all, W, H, bg, stats: { edgeComponents: nc, regions: nr, nodes: all.length, ms } };
  }
  function inkColor(data, W, H, box2, bgc) {
    const x0 = clamp(Math.floor(box2.x0), 0, W - 1), x1 = clamp(Math.ceil(box2.x1), 1, W);
    const y0 = clamp(Math.floor(box2.y0), 0, H - 1), y1 = clamp(Math.ceil(box2.y1), 1, H);
    const step = Math.max(1, Math.floor(Math.sqrt((x1 - x0) * (y1 - y0) / 5e3)));
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
    for (let i = 0; i < k; i++) {
      acc[0] += s[i][1][0];
      acc[1] += s[i][1][1];
      acc[2] += s[i][1][2];
    }
    const color2 = acc.map((v) => v / k);
    const p95 = s[Math.min(s.length - 1, Math.floor(s.length * 0.05))][0];
    let strong = s.filter((x) => x[0] >= 0.45 * p95);
    if (strong.length > Math.round(s.length * 0.35)) strong = strong.slice(0, Math.max(1, Math.round(s.length * 0.35)));
    if (strong.length < 4) strong = s.slice(0, Math.max(1, Math.round(s.length * 0.35)));
    const bins = /* @__PURE__ */ new Map();
    for (const [, c] of strong) {
      const key = c[0] >> 5 << 6 | c[1] >> 5 << 3 | c[2] >> 5;
      const b = bins.get(key) || { n: 0, r: 0, g: 0, b: 0 };
      b.n++;
      b.r += c[0];
      b.g += c[1];
      b.b += c[2];
      bins.set(key, b);
    }
    const tot = strong.length;
    let palette = [...bins.values()].filter((b) => b.n >= 0.12 * tot).sort((a, b) => b.n - a.n).slice(0, 4).map((b) => [[b.r / b.n, b.g / b.n, b.b / b.n], b.n / tot]);
    if (!palette.length) palette = [[color2, 1]];
    const ws = palette.reduce((a, p) => a + p[1], 0);
    palette.forEach((p) => {
      p[1] /= ws;
    });
    return { color: color2, palette };
  }
  function inkProfile(data, W, H, box2, bgc) {
    const x0 = clamp(Math.floor(box2.x0), 0, W - 1), x1 = clamp(Math.ceil(box2.x1), 1, W);
    const y0 = clamp(Math.floor(box2.y0), 0, H - 1), y1 = clamp(Math.ceil(box2.y1), 1, H);
    const N = 8, n = new Array(N).fill(0), lum = new Array(N).fill(0), top = new Array(N).fill(1), bot = new Array(N).fill(0);
    const bw = (x1 - x0) / N, bh = Math.max(1, y1 - y0);
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const i = (y * W + x) * 4;
      const c = [data[i], data[i + 1], data[i + 2]];
      if (cdist(c, bgc) <= 48) continue;
      const k = Math.min(N - 1, Math.floor((x - x0) / bw));
      n[k]++;
      lum[k] += 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
      const t = (y - y0) / bh;
      if (t < top[k]) top[k] = t;
      if (t > bot[k]) bot[k] = t;
    }
    return { n, lum: lum.map((v, k) => n[k] ? v / n[k] : null), ext: top.map((t, k) => n[k] ? bot[k] - t : null) };
  }
  function glyphMask(data, W, H, box2, bgc) {
    const x0 = clamp(Math.floor(box2.x0), 0, W - 1), x1 = clamp(Math.ceil(box2.x1), 1, W);
    const y0 = clamp(Math.floor(box2.y0), 0, H - 1), y1 = clamp(Math.ceil(box2.y1), 1, H);
    const N = 12, cnt = new Array(N * N).fill(0), tot = new Array(N * N).fill(0);
    const bw = (x1 - x0) / N, bh = (y1 - y0) / N;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const i = (y * W + x) * 4;
      const k = Math.min(N - 1, Math.floor((y - y0) / bh)) * N + Math.min(N - 1, Math.floor((x - x0) / bw));
      tot[k]++;
      cnt[k] += Math.min(1, cdist([data[i], data[i + 1], data[i + 2]], bgc) / 160);
    }
    return cnt.map((c, k) => tot[k] ? c / tot[k] : 0);
  }

  // src/engine/assign.js
  function hungarian(cost) {
    const n = cost.length, m = cost[0].length, INF = 1e18;
    const u = new Float64Array(n + 1), v = new Float64Array(m + 1);
    const p = new Int32Array(m + 1), way = new Int32Array(m + 1);
    const minv = new Float64Array(m + 1), used = new Uint8Array(m + 1);
    for (let i = 1; i <= n; i++) {
      p[0] = i;
      let j0 = 0;
      minv.fill(INF);
      used.fill(0);
      do {
        used[j0] = 1;
        const i0 = p[j0], row = cost[i0 - 1];
        let delta = INF, j1 = 0;
        for (let j = 1; j <= m; j++) if (!used[j]) {
          const cur = row[j - 1] - u[i0] - v[j];
          if (cur < minv[j]) {
            minv[j] = cur;
            way[j] = j0;
          }
          if (minv[j] < delta) {
            delta = minv[j];
            j1 = j;
          }
        }
        for (let j = 0; j <= m; j++) if (used[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else minv[j] -= delta;
        j0 = j1;
      } while (p[j0] !== 0);
      do {
        const j1 = way[j0];
        p[j0] = p[j1];
        j0 = j1;
      } while (j0);
    }
    const ans = new Int32Array(n).fill(-1);
    for (let j = 1; j <= m; j++) if (p[j]) ans[p[j] - 1] = j - 1;
    return ans;
  }
  function assign(A, Bn, costFn, delFn, insFn) {
    const n = A.length, m = Bn.length;
    if (!n || !m) return { pairs: [], delA: A.slice(), insB: Bn.slice() };
    const N = n + m, BIG = 1e9;
    const C9 = [];
    for (let i = 0; i < N; i++) {
      const row = new Float64Array(N);
      for (let j = 0; j < N; j++) {
        if (i < n && j < m) row[j] = costFn(A[i], Bn[j]);
        else if (i < n) row[j] = j - m === i ? delFn(A[i]) : BIG;
        else if (j < m) row[j] = i - n === j ? insFn(Bn[j]) : BIG;
        else row[j] = 0;
      }
      C9.push(row);
    }
    const a = hungarian(C9);
    const pairs = [], delA = [], used = new Uint8Array(m);
    for (let i = 0; i < n; i++) {
      if (a[i] >= 0 && a[i] < m) {
        pairs.push([A[i], Bn[a[i]]]);
        used[a[i]] = 1;
      } else delA.push(A[i]);
    }
    const insB = Bn.filter((_, j) => !used[j]);
    return { pairs, delA, insB };
  }

  // src/engine/costs.js
  var KIND_GROUP = { container: "box", shape: "box", image: "box", text: "ink", icon: "ink", rule: "rule", root: "box" };
  function kindCost(a, b) {
    if (a === b) return 0;
    const ga = KIND_GROUP[a], gb = KIND_GROUP[b];
    if (ga === gb) return 0.35;
    if (ga === "rule" || gb === "rule") return 1.1;
    return 1.6;
  }
  function parentResidual(db, mb, PD, PM) {
    const ex = [mb.x0 - PM.x0 - (db.x0 - PD.x0), CX(mb) - CX(PM) - (CX(db) - CX(PD)), mb.x1 - PM.x1 - (db.x1 - PD.x1)];
    const ey = [mb.y0 - PM.y0 - (db.y0 - PD.y0), CY(mb) - CY(PM) - (CY(db) - CY(PD)), mb.y1 - PM.y1 - (db.y1 - PD.y1)];
    return { x: minAbs(ex), y: minAbs(ey) };
  }
  function emission(dRep, mRep, db, mb, P) {
    let c = kindCost(dRep.kind, mRep.kind);
    const ink = KIND_GROUP[dRep.kind] === "ink" && KIND_GROUP[mRep.kind] === "ink";
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
      if (KIND_GROUP[dRep.kind] === "box" && KIND_GROUP[mRep.kind] === "box" && (dRep.filled || mRep.filled) && de > 30) c += Math.min(2, (de - 30) / 30);
    }
    if (dRep.children && mRep.children && (dRep.children.length || mRep.children.length)) {
      const sig = (n) => {
        const q = { box: 0, ink: 0, rule: 0 };
        for (const k of n.children) q[KIND_GROUP[k.kind] || "box"]++;
        return q;
      };
      const a = sig(dRep), b = sig(mRep);
      const diff = Math.abs(a.box - b.box) + Math.abs(a.ink - b.ink) + Math.abs(a.rule - b.rule);
      c += 0.6 * Math.min(1, diff / Math.max(2, dRep.children.length, mRep.children.length));
    }
    return c;
  }
  var median = (a) => {
    if (!a.length) return 0;
    const s = a.slice().sort((x, y) => x - y);
    const k = s.length >> 1;
    return s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2;
  };
  function estimateTextScale(findings) {
    const w = [], h2 = [], m = [];
    for (const f of findings) {
      if (!f.dNodes || f.dNodes.length !== 1 || !f.mNodes || f.mNodes.length !== 1) continue;
      const d = f.dNodes[0], n = f.mNodes[0];
      if (d.kind !== "text" || n.kind !== "text") continue;
      if (d.px && n.px) m.push(Math.log(n.px / d.px));
      if (d.lines === 1 && n.lines === 1) {
        w.push(Math.log(W_(n.box) / W_(d.box)));
        h2.push(Math.log(H_(n.box) / H_(d.box)));
      }
    }
    if (w.length < 3 && m.length < 3) return null;
    return { w: median(w), h: median(h2), m: median(m), n: Math.max(w.length, m.length) };
  }
  function transCost(pu, cu, P, skD, skM) {
    const dxp = pu.mb.x0 - pu.db.x0, dyp = pu.mb.y0 - pu.db.y0;
    const dxc = cu.mb.x0 - cu.db.x0, dyc = cu.mb.y0 - cu.db.y0;
    let best = Math.hypot(dxc - dxp, dyc - dyp);
    if (cu.db.y0 >= pu.db.y1 - 4) {
      const ax = Math.min(
        Math.abs(cu.mb.x0 - pu.mb.x0 - (cu.db.x0 - pu.db.x0)),
        Math.abs(CX(cu.mb) - CX(pu.mb) - (CX(cu.db) - CX(pu.db))),
        Math.abs(cu.mb.x1 - pu.mb.x1 - (cu.db.x1 - pu.db.x1))
      );
      const gm = cu.mb.y0 - pu.mb.y1, gd = cu.db.y0 - pu.db.y1;
      let gy = Math.abs(gm - gd);
      const sd = skD && skD.filter((n) => n.box.y0 >= pu.db.y1 - 4 && n.box.y1 <= cu.db.y0 + 4);
      if (sd && sd.length) {
        const top = Math.min(...sd.map((n) => n.box.y0)), bot = Math.max(...sd.map((n) => n.box.y1));
        gy = Math.min(gy, Math.abs(gm - (top - pu.db.y1)), Math.abs(gm - (cu.db.y0 - bot)));
      }
      const sm = skM && skM.filter((n) => n.box.y0 >= pu.mb.y1 - 4 && n.box.y1 <= cu.mb.y0 + 4);
      if (sm && sm.length) {
        const bot = Math.max(...sm.map((n) => n.box.y1)), top = Math.min(...sm.map((n) => n.box.y0));
        gy = Math.min(gy, Math.abs(cu.mb.y0 - bot - gd), Math.abs(top - pu.mb.y1 - gd));
      }
      best = Math.min(best, Math.hypot(gy, ax));
    }
    if (cu.db.x0 >= pu.db.x1 - 4) {
      const ay = Math.min(
        Math.abs(cu.mb.y0 - pu.mb.y0 - (cu.db.y0 - pu.db.y0)),
        Math.abs(CY(cu.mb) - CY(pu.mb) - (CY(cu.db) - CY(pu.db))),
        Math.abs(cu.mb.y1 - pu.mb.y1 - (cu.db.y1 - pu.db.y1))
      );
      const gm = cu.mb.x0 - pu.mb.x1, gd = cu.db.x0 - pu.db.x1;
      let gx = Math.abs(gm - gd);
      const sd = skD && skD.filter((n) => n.box.x0 >= pu.db.x1 - 4 && n.box.x1 <= cu.db.x0 + 4);
      if (sd && sd.length) {
        const lf = Math.min(...sd.map((n) => n.box.x0)), rt = Math.max(...sd.map((n) => n.box.x1));
        gx = Math.min(gx, Math.abs(gm - (lf - pu.db.x1)), Math.abs(gm - (cu.db.x0 - rt)));
      }
      const sm = skM && skM.filter((n) => n.box.x0 >= pu.mb.x1 - 4 && n.box.x1 <= cu.mb.x0 + 4);
      if (sm && sm.length) {
        const rt = Math.max(...sm.map((n) => n.box.x1)), lf = Math.min(...sm.map((n) => n.box.x0));
        gx = Math.min(gx, Math.abs(cu.mb.x0 - rt - gd), Math.abs(lf - pu.mb.x1 - gd));
      }
      best = Math.min(best, Math.hypot(gx, ay));
    }
    return Math.min(4, best / P.transTau);
  }
  var gapCost = (n, P) => P.gapBase + 0.22 * Math.log2(1 + AREA(n.box) / 600);
  function plausibleMerge(nodes) {
    if (!nodes.every((x) => KIND_GROUP[x.kind] === "ink")) return false;
    const u = UNIONS(nodes.map((n) => n.box));
    if (AREA(u) > 1.9 * nodes.reduce((s2, n) => s2 + AREA(n.box), 0) + 400) return false;
    const s = nodes.slice().sort((a, b) => a.box.y0 - b.box.y0);
    for (let i = 1; i < s.length; i++) {
      const a = s[i - 1].box, b = s[i].box;
      const hmin = Math.min(...s.slice(0, i + 1).map((n) => H_(n.box) / Math.max(1, n.lines || 1)));
      const vgap = b.y0 - Math.max(...s.slice(0, i).map((n) => n.box.y1));
      if (vgap > Math.max(10, 1.1 * hmin)) return false;
      if (vgap < 0) {
        const hgap = Math.max(a.x0, b.x0) - Math.min(a.x1, b.x1);
        if (hgap > Math.max(16, 2 * hmin)) return false;
      }
    }
    return true;
  }

  // src/engine/align.js
  var mkUnit = (dn, mn) => ({ d: dn, m: mn, db: UNIONS(dn.map((x) => x.box)), mb: UNIONS(mn.map((x) => x.box)) });
  var sameLine = (nodes) => nodes.every((n) => OVL(n.box.y0, n.box.y1, nodes[0].box.y0, nodes[0].box.y1) > 0.5 * Math.min(H_(n.box), H_(nodes[0].box)));
  var rep = (nodes) => {
    if (nodes.length === 1) return nodes[0];
    const wsum = nodes.reduce((a, n) => a + (n.px || 1), 0);
    const palette = nodes.every((n) => n.palette) ? nodes.flatMap((n) => n.palette.map(([c, w]) => [c, w * (n.px || 1) / wsum])) : null;
    return {
      kind: nodes.every((n) => KIND_GROUP[n.kind] === "ink") ? "text" : nodes[0].kind,
      color: nodes[0].color,
      palette,
      lines: nodes.every((n) => (n.lines || 1) === 1) && sameLine(nodes) ? 1 : 2,
      px: nodes.reduce((a, n) => a + (n.px || 0), 0) || null
    };
  };
  function hungarianAlign(D, M, Pd, Pm, P) {
    const cost = (d, m) => {
      const r2 = parentResidual(d.box, m.box, Pd.box, Pm.box);
      return emission(d, m, d.box, m.box, P) + Math.min(5, Math.hypot(r2.x, r2.y) / P.transTau);
    };
    const r = assign(D, M, cost, (d) => gapCost(d, P) + 1.2, (m) => gapCost(m, P) + 1.2);
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
    const T2 = types.length, S = (n + 1) * (k + 1);
    const idx = (i2, j2) => i2 * (k + 1) + j2;
    const dp = types.map(() => new Float64Array(S).fill(INF));
    const bpR = types.map(() => new Uint8Array(S));
    const bpI = types.map(() => new Int32Array(S)), bpJ = types.map(() => new Int32Array(S)), bpT = types.map(() => new Int8Array(S));
    const cache = types.map(() => new Array(S));
    const Rv = new Float64Array(S).fill(INF), Rop = new Int8Array(S).fill(-1);
    const gd = D.map((x) => gapCost(x, P)), gm = M.map((x) => gapCost(x, P));
    const GD = new Float64Array(n + 1), GM = new Float64Array(k + 1);
    for (let i2 = 0; i2 < n; i2++) GD[i2 + 1] = GD[i2] + gd[i2];
    for (let j2 = 0; j2 < k; j2++) GM[j2 + 1] = GM[j2] + gm[j2];
    function unit(t2, i2, j2) {
      const id = idx(i2, j2);
      if (cache[t2][id] !== void 0) return cache[t2][id];
      const [a, b] = types[t2];
      const dn = D.slice(i2 - a, i2), mn = M.slice(j2 - b, j2);
      let u = null;
      const many = a > 1 ? dn : b > 1 ? mn : null;
      if (!many || plausibleMerge(many)) {
        u = mkUnit(dn, mn);
        const pr = parentResidual(u.db, u.mb, Pd.box, Pm.box);
        const st = Math.min(4, Math.hypot(pr.x, pr.y) / P.transTau);
        u.st = st;
        let e = emission(rep(dn), rep(mn), u.db, u.mb, P) + P.posPrior * Math.min(1.5, st);
        if (many) {
          const ts = P.ts || { w: 0, h: 0 };
          const lw = Math.abs(Math.log(Math.max(1, W_(u.mb)) / Math.max(1, W_(u.db))) - ts.w);
          const lh = Math.abs(Math.log(Math.max(1, H_(u.mb)) / Math.max(1, H_(u.db))) - ts.h);
          e += 0.35 * (many.length - 1) + 0.15 + 2.2 * (Math.max(0, lw - 0.12) + Math.max(0, lh - 0.12));
        }
        u.e = e;
      }
      cache[t2][id] = u;
      return u;
    }
    Rv[0] = 0;
    for (let i2 = 0; i2 <= n; i2++) {
      for (let j2 = 0; j2 <= k; j2++) {
        const id = idx(i2, j2);
        for (let t2 = 0; t2 < T2; t2++) {
          const [a, b] = types[t2];
          if (i2 < a || j2 < b) continue;
          const u = unit(t2, i2, j2);
          if (!u) continue;
          const i0 = i2 - a, j0 = j2 - b;
          let best = Rv[idx(i0, j0)] + u.st + (i0 > 0 || j0 > 0 ? P.resetPen : 0);
          let fromR = 1, bi = 0, bj = 0, bt = 0;
          for (let pi = i0; pi >= Math.max(1, i0 - K); pi--) {
            for (let pj = j0; pj >= Math.max(1, j0 - K); pj--) {
              const gaps = GD[i0] - GD[pi] + (GM[j0] - GM[pj]);
              if (gaps >= best) continue;
              const pid = idx(pi, pj);
              for (let pt = 0; pt < T2; pt++) {
                const v = dp[pt][pid];
                if (v >= INF) continue;
                const c = v + gaps + transCost(cache[pt][pid], u, P, i0 > pi ? D.slice(pi, i0) : null, j0 > pj ? M.slice(pj, j0) : null);
                if (c < best) {
                  best = c;
                  fromR = 0;
                  bi = pi;
                  bj = pj;
                  bt = pt;
                }
              }
            }
          }
          dp[t2][id] = u.e + best;
          bpR[t2][id] = fromR;
          bpI[t2][id] = bi;
          bpJ[t2][id] = bj;
          bpT[t2][id] = bt;
        }
        if (i2 === 0 && j2 === 0) continue;
        let rb = INF, op = -1;
        if (i2 > 0 && Rv[idx(i2 - 1, j2)] + gd[i2 - 1] < rb) {
          rb = Rv[idx(i2 - 1, j2)] + gd[i2 - 1];
          op = 0;
        }
        if (j2 > 0 && Rv[idx(i2, j2 - 1)] + gm[j2 - 1] < rb) {
          rb = Rv[idx(i2, j2 - 1)] + gm[j2 - 1];
          op = 1;
        }
        for (let t2 = 0; t2 < T2; t2++) if (dp[t2][id] < rb) {
          rb = dp[t2][id];
          op = 2 + t2;
        }
        Rv[id] = rb;
        Rop[id] = op;
      }
    }
    const units = [], delD = [], insM = [];
    let i = n, j = k, mode = 0, t = 0, guard = 0;
    while ((i > 0 || j > 0) && guard++ < 1e5) {
      if (mode === 0) {
        const op = Rop[idx(i, j)];
        if (op === 0) {
          delD.push(D[i - 1]);
          i--;
        } else if (op === 1) {
          insM.push(M[j - 1]);
          j--;
        } else {
          mode = 1;
          t = op - 2;
        }
      } else {
        const id = idx(i, j);
        units.push(cache[t][id]);
        const [a, b] = types[t];
        const i0 = i - a, j0 = j - b;
        if (bpR[t][id]) {
          i = i0;
          j = j0;
          mode = 0;
        } else {
          const pi = bpI[t][id], pj = bpJ[t][id];
          for (let x = pi; x < i0; x++) delD.push(D[x]);
          for (let y = pj; y < j0; y++) insM.push(M[y]);
          t = bpT[t][id];
          i = pi;
          j = pj;
        }
      }
    }
    units.reverse();
    return { units, delD, insM };
  }
  function rescue(res, Pd, Pm, P) {
    if (!res.delD.length || !res.insM.length) return;
    const cost = (d, m) => {
      const r2 = parentResidual(d.box, m.box, Pd.box, Pm.box);
      return emission(d, m, d.box, m.box, P) + 0.35 * Math.min(6, Math.hypot(r2.x, r2.y) / P.transTau);
    };
    const r = assign(res.delD, res.insM, cost, () => P.rescueMax, () => P.rescueMax);
    for (const [d, m] of r.pairs) {
      const u = mkUnit([d], [m]);
      u.rescued = true;
      res.units.push(u);
    }
    res.delD = r.delA;
    res.insM = r.insB;
  }

  // src/engine/attribute.js
  var KIND_NAME = { container: "Container", shape: "Shape", image: "Image", text: "Text", icon: "Icon", rule: "Rule", root: "Page" };
  function nodeName(n) {
    if (!n) return "—";
    const k = KIND_NAME[n.kind] || n.kind;
    const s = `${Math.round(W_(n.box))}×${Math.round(H_(n.box))}`;
    if (n.kind === "text" && n.lines > 1) return `${k} · ${n.lines} lines`;
    return `${k} ${s}`;
  }
  var unitName = (nodes) => nodes.length === 1 ? nodeName(nodes[0]) : `Text · ${nodes.length} blocks merged`;
  function nearest(units, u, pred, score) {
    let best = null, bs = -Infinity;
    for (const v of units) if (v !== u && pred(v)) {
      const s = score(v);
      if (s > bs) {
        bs = s;
        best = v;
      }
    }
    return best;
  }
  function edmonds(n, root, edges) {
    const inE = new Array(n).fill(null);
    for (const e of edges) if (e.to !== root && e.from !== e.to && (!inE[e.to] || e.w < inE[e.to].w)) inE[e.to] = e;
    for (let v = 0; v < n; v++) if (v !== root && !inE[v]) return null;
    const id = new Array(n).fill(-1), vis = new Array(n).fill(-1);
    let cnt = 0;
    for (let v = 0; v < n; v++) {
      let u = v;
      while (u !== root && vis[u] !== v && id[u] === -1) {
        vis[u] = v;
        u = inE[u].from;
      }
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
  function flowChains(units, near, axis, PD, PM) {
    const n = units.length;
    const next = new Int32Array(n).fill(-1), prev = new Int32Array(n).fill(-1);
    for (let k = 0; k < n; k++) {
      const j = axis === "x" ? near[k].ri : near[k].be;
      if (j < 0) continue;
      const back = axis === "x" ? near[j].le : near[j].ab;
      if (back !== k) continue;
      const a = units[k].db, b = units[j].db;
      const gap = axis === "x" ? b.x0 - a.x1 : b.y0 - a.y1;
      const size = axis === "x" ? Math.min(H_(a), H_(b)) : Math.min(H_(a), H_(b));
      if (gap <= Math.max(48, 3 * size)) {
        next[k] = j;
        prev[j] = k;
      }
    }
    const head = new Uint8Array(n), backward = new Uint8Array(n), linkedFwd = new Uint8Array(n), linkedBack = new Uint8Array(n);
    const rows = [];
    for (let k = 0; k < n; k++) {
      if (prev[k] >= 0) continue;
      const chain = [k];
      while (next[chain[chain.length - 1]] >= 0) chain.push(next[chain[chain.length - 1]]);
      if (chain.length === 1) {
        head[k] = 1;
        continue;
      }
      rows.push(chain.slice());
      const f = units[chain[0]], l = units[chain[chain.length - 1]];
      const dStart = axis === "x" ? Math.min(Math.abs(f.mb.x0 - PM.x0 - (f.db.x0 - PD.x0)), Math.abs(CX(f.mb) - CX(PM) - (CX(f.db) - CX(PD)))) : Math.abs(f.mb.y0 - PM.y0 - (f.db.y0 - PD.y0));
      const dEnd = axis === "x" ? Math.abs(l.mb.x1 - PM.x1 - (l.db.x1 - PD.x1)) : Math.abs(l.mb.y1 - PM.y1 - (l.db.y1 - PD.y1));
      let split = -1;
      if (chain.length >= 3 && dStart <= 3 && dEnd <= 3) {
        let big = 3;
        for (let i = 0; i + 1 < chain.length; i++) {
          const a = units[chain[i]], b = units[chain[i + 1]];
          const dg = Math.abs(axis === "x" ? b.mb.x0 - a.mb.x1 - (b.db.x0 - a.db.x1) : b.mb.y0 - a.mb.y1 - (b.db.y0 - a.db.y1));
          if (dg > big) {
            big = dg;
            split = i;
          }
        }
      }
      const parts = split >= 0 ? [[chain.slice(0, split + 1), false], [chain.slice(split + 1), true]] : [[chain, dEnd + 1 < dStart]];
      if (split >= 0) next[chain[split]] = -1;
      if (typeof globalThis !== "undefined" && globalThis.DBG_CHAINS) console.log("DBG chain", axis, chain.map((i) => `${units[i].d[0].kind}@${Math.round(units[i].db.x0)},${Math.round(units[i].db.y0)}`).join(" > "), "dStart", dStart.toFixed(1), "dEnd", dEnd.toFixed(1), split >= 0 ? `SPLIT@${split}` : parts[0][1] ? "REV" : "");
      for (const [part, rev] of parts) {
        head[rev ? part[part.length - 1] : part[0]] = 1;
        for (const c of part) backward[c] = rev ? 1 : 0;
        for (let i = 0; i < part.length; i++) {
          if (i > 0) linkedFwd[part[i]] = 1;
          if (i < part.length - 1) linkedBack[part[i]] = 1;
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
    const actX = (u) => ({ x0: u.mb.x0, cx: CX(u.mb), x1: u.mb.x1 });
    const actY = (u) => ({ y0: u.mb.y0, cy: CY(u.mb), y1: u.mb.y1 });
    const add = (E, from, to, anchor, exp, name, kind, pen) => {
      const u = units[to - 1];
      const a = (E === EX ? actX(u) : actY(u))[anchor];
      if (kind === "parent" && Math.abs(a - exp) <= 2) pen = 0;
      E.push({ from, to, v: a - exp, w: Math.abs(a - exp) + (pen || 0), anchor, exp, name, kind });
    };
    const nm = (v) => unitName(v.d).toLowerCase();
    let near = null, CXc = null, CYc = null;
    if (flow) {
      const pickNear = (k, pred, score) => {
        let best = -1, bs = -Infinity;
        units.forEach((v, j) => {
          if (j !== k && pred(v)) {
            const s = score(v);
            if (s > bs) {
              bs = s;
              best = j;
            }
          }
        });
        return best;
      };
      const xo = (a, b) => OVL(a.x0, a.x1, b.x0, b.x1) > 0.15 * Math.min(W_(a), W_(b));
      const yo = (a, b) => OVL(a.y0, a.y1, b.y0, b.y1) > 0.15 * Math.min(H_(a), H_(b));
      near = units.map((u, k) => {
        const d = u.db;
        return {
          ab: pickNear(k, (v) => v.db.y1 <= d.y0 + 2 && xo(v.db, d), (v) => v.db.y1),
          be: pickNear(k, (v) => v.db.y0 >= d.y1 - 2 && xo(v.db, d), (v) => -v.db.y0),
          le: pickNear(k, (v) => v.db.x1 <= d.x0 + 2 && yo(v.db, d), (v) => v.db.x1),
          ri: pickNear(k, (v) => v.db.x0 >= d.x1 - 2 && yo(v.db, d), (v) => -v.db.x0)
        };
      });
      CXc = flowChains(units, near, "x", PD, PM);
      CYc = flowChains(units, near, "y", PD, PM);
    }
    const penParent = (C9, k) => C9 && !C9.head[k] ? PEN : 0;
    const penFwd = (C9, k) => C9 && C9.linkedFwd[k] && !C9.backward[k] ? 0 : C9 && C9.linkedFwd[k] ? BACK : PEN;
    const penBack = (C9, k) => C9 && C9.linkedBack[k] && C9.backward[k] ? 0 : C9 && C9.linkedBack[k] ? PEN : PEN;
    units.forEach((u, k) => {
      const id = k + 1, d = u.db;
      add(EX, 0, id, "x0", PM.x0 + (d.x0 - PD.x0), "parent left edge", "parent", penParent(CXc, k));
      add(EX, 0, id, "cx", CX(PM) + (CX(d) - CX(PD)), "parent center", "parent", penParent(CXc, k));
      add(EX, 0, id, "x1", PM.x1 + (d.x1 - PD.x1), "parent right edge", "parent", penParent(CXc, k));
      add(EY, 0, id, "y0", PM.y0 + (d.y0 - PD.y0), "parent top edge", "parent", penParent(CYc, k));
      add(EY, 0, id, "cy", CY(PM) + (CY(d) - CY(PD)), "parent middle", "parent", penParent(CYc, k));
      add(EY, 0, id, "y1", PM.y1 + (d.y1 - PD.y1), "parent bottom edge", "parent", penParent(CYc, k));
    });
    if (flow) {
      units.forEach((u, k) => {
        const id = k + 1, d = u.db;
        const { ab, be, le, ri } = near[k];
        const spansX = (v) => v.db.x0 <= d.x0 + 2 && v.db.x1 >= d.x1 - 2, spansY = (v) => v.db.y0 <= d.y0 + 2 && v.db.y1 >= d.y1 - 2;
        if (ab >= 0) {
          const a = units[ab], f = ab + 1;
          add(EY, f, id, "y0", a.mb.y1 + (d.y0 - a.db.y1), `flows below ${nm(a)}`, "flow", spansX(a) ? Math.min(BACK, penFwd(CYc, k)) : penFwd(CYc, k));
          if (Math.abs(d.x0 - a.db.x0) <= AL) add(EX, f, id, "x0", a.mb.x0 + (d.x0 - a.db.x0), `left-aligned with ${nm(a)}`, "align");
          if (Math.abs(CX(d) - CX(a.db)) <= AL) add(EX, f, id, "cx", CX(a.mb) + (CX(d) - CX(a.db)), `centered on ${nm(a)}`, "align");
          if (Math.abs(d.x1 - a.db.x1) <= AL) add(EX, f, id, "x1", a.mb.x1 + (d.x1 - a.db.x1), `right-aligned with ${nm(a)}`, "align");
          const gm = missing.filter((m) => m.box.y0 >= a.db.y1 - 2 && m.box.y1 <= d.y0 + 2 && OVL(m.box.x0, m.box.x1, d.x0, d.x1) > 0);
          if (gm.length) {
            const top = Math.min(...gm.map((m) => m.box.y0)), bot = Math.max(...gm.map((m) => m.box.y1));
            add(EY, f, id, "y0", a.mb.y1 + (top - a.db.y1), "closes the gap of a missing element", "collapse");
            add(EY, f, id, "y0", a.mb.y1 + (d.y0 - bot), "closes the gap of a missing element", "collapse");
          }
          const ge = extras.filter((m) => m.box.y0 >= a.mb.y1 - 2 && m.box.y1 <= u.mb.y0 + 2 && OVL(m.box.x0, m.box.x1, u.mb.x0, u.mb.x1) > 0);
          if (ge.length) {
            const bot = Math.max(...ge.map((m) => m.box.y1));
            add(EY, f, id, "y0", bot + (d.y0 - a.db.y1), "flows below an extra element", "collapse");
          }
        } else {
          const gm = missing.filter((m) => m.box.y1 <= d.y0 + 2 && OVL(m.box.x0, m.box.x1, d.x0, d.x1) > 0);
          if (gm.length) {
            const top = Math.min(...gm.map((m) => m.box.y0));
            add(EY, 0, id, "y0", PM.y0 + (top - PD.y0), "took the place of a missing element", "collapse");
          }
          const ge = extras.filter((m) => m.box.y1 <= u.mb.y0 + 2 && OVL(m.box.x0, m.box.x1, u.mb.x0, u.mb.x1) > 0);
          if (ge.length) {
            const top = Math.min(...ge.map((m) => m.box.y0)), bot = Math.max(...ge.map((m) => m.box.y1));
            add(EY, 0, id, "y0", PM.y0 + (d.y0 - PD.y0) + (bot - top), "pushed down by an extra element", "collapse");
            add(EY, 0, id, "y0", bot + (d.y0 - PD.y0), "pushed down by an extra element", "collapse");
          }
        }
        if (be >= 0) {
          const b = units[be], f = be + 1;
          add(EY, f, id, "y1", b.mb.y0 - (b.db.y0 - d.y1), `sits above ${nm(b)}`, "flow", penBack(CYc, k));
          if (Math.abs(d.x0 - b.db.x0) <= AL) add(EX, f, id, "x0", b.mb.x0 + (d.x0 - b.db.x0), `left-aligned with ${nm(b)}`, "align", BACK);
          if (Math.abs(CX(d) - CX(b.db)) <= AL) add(EX, f, id, "cx", CX(b.mb) + (CX(d) - CX(b.db)), `centered on ${nm(b)}`, "align", BACK);
          if (Math.abs(d.x1 - b.db.x1) <= AL) add(EX, f, id, "x1", b.mb.x1 + (d.x1 - b.db.x1), `right-aligned with ${nm(b)}`, "align", BACK);
        }
        if (le >= 0) {
          const l = units[le], f = le + 1;
          add(EX, f, id, "x0", l.mb.x1 + (d.x0 - l.db.x1), `follows ${nm(l)}`, "flow", spansY(l) ? Math.min(BACK, penFwd(CXc, k)) : penFwd(CXc, k));
          const gx = extras.filter((m) => m.box.x0 >= l.mb.x1 - 2 && m.box.x1 <= u.mb.x0 + 2 && OVL(m.box.y0, m.box.y1, u.mb.y0, u.mb.y1) > 0);
          if (gx.length) add(EX, f, id, "x0", Math.max(...gx.map((m) => m.box.x1)) + (d.x0 - l.db.x1), "follows an extra element", "collapse");
          if (Math.abs(d.y0 - l.db.y0) <= AL) add(EY, f, id, "y0", l.mb.y0 + (d.y0 - l.db.y0), `top-aligned with ${nm(l)}`, "align");
          if (Math.abs(CY(d) - CY(l.db)) <= AL) add(EY, f, id, "cy", CY(l.mb) + (CY(d) - CY(l.db)), `middle-aligned with ${nm(l)}`, "align");
          if (Math.abs(d.y1 - l.db.y1) <= AL) add(EY, f, id, "y1", l.mb.y1 + (d.y1 - l.db.y1), `bottom-aligned with ${nm(l)}`, "align");
          const gm = missing.filter((m) => m.box.x0 >= l.db.x1 - 2 && m.box.x1 <= d.x0 + 2 && OVL(m.box.y0, m.box.y1, d.y0, d.y1) > 0);
          if (gm.length) {
            const lf = Math.min(...gm.map((m) => m.box.x0)), rt = Math.max(...gm.map((m) => m.box.x1));
            add(EX, f, id, "x0", l.mb.x1 + (lf - l.db.x1), "closes the gap of a missing element", "collapse");
            add(EX, f, id, "x0", l.mb.x1 + (d.x0 - rt), "closes the gap of a missing element", "collapse");
          }
        }
        const yov = (m) => OVL(m.box.y0, m.box.y1, d.y0, d.y1) > 0, xov = (m) => OVL(m.box.x0, m.box.x1, d.x0, d.x1) > 0;
        const yovM = (m) => OVL(m.box.y0, m.box.y1, u.mb.y0, u.mb.y1) > 0;
        if (le < 0) {
          const gm = missing.filter((m) => m.box.x1 <= d.x0 + 2 && yov(m));
          if (gm.length) add(EX, 0, id, "x0", PM.x0 + (Math.min(...gm.map((m) => m.box.x0)) - PD.x0), "took the place of a missing element", "collapse");
          const ge = extras.filter((m) => m.box.x1 <= u.mb.x0 + 2 && yovM(m));
          if (ge.length) {
            const lf = Math.min(...ge.map((m) => m.box.x0)), rt = Math.max(...ge.map((m) => m.box.x1));
            add(EX, 0, id, "x0", PM.x0 + (d.x0 - PD.x0) + (rt - lf), "pushed right by an extra element", "collapse");
            add(EX, 0, id, "x0", rt + (d.x0 - PD.x0), "pushed right by an extra element", "collapse");
          }
        }
        if (ri < 0) {
          const gm = missing.filter((m) => m.box.x0 >= d.x1 - 2 && yov(m));
          if (gm.length) add(EX, 0, id, "x1", PM.x1 + (Math.max(...gm.map((m) => m.box.x1)) - PD.x1), "took the place of a missing element", "collapse");
          const ge = extras.filter((m) => m.box.x0 >= u.mb.x1 - 2 && yovM(m));
          if (ge.length) {
            const g = le >= 0 ? Math.max(0, d.x0 - units[le].db.x1) : 8;
            add(EX, 0, id, "x1", Math.min(...ge.map((m) => m.box.x0)) - g, "pushed left by an extra element", "collapse");
          }
        }
        if (be < 0) {
          const gm = missing.filter((m) => m.box.y0 >= d.y1 - 2 && xov(m));
          if (gm.length) add(EY, 0, id, "y1", PM.y1 + (Math.max(...gm.map((m) => m.box.y1)) - PD.y1), "took the place of a missing element", "collapse");
        }
        if (ri >= 0) {
          const r = units[ri], f = ri + 1;
          add(EX, f, id, "x1", r.mb.x0 - (r.db.x0 - d.x1), `precedes ${nm(r)}`, "flow", penBack(CXc, k));
          const gm = missing.filter((m) => m.box.x0 >= d.x1 - 2 && m.box.x1 <= r.db.x0 + 2 && yov(m));
          if (gm.length) {
            const lf = Math.min(...gm.map((m) => m.box.x0)), rt = Math.max(...gm.map((m) => m.box.x1));
            add(EX, f, id, "x1", r.mb.x0 - (r.db.x0 - rt), "closes the gap of a missing element", "collapse");
            add(EX, f, id, "x1", r.mb.x0 - (lf - d.x1), "closes the gap of a missing element", "collapse");
          }
          if (Math.abs(d.y0 - r.db.y0) <= AL) add(EY, f, id, "y0", r.mb.y0 + (d.y0 - r.db.y0), `top-aligned with ${nm(r)}`, "align", BACK);
          if (Math.abs(CY(d) - CY(r.db)) <= AL) add(EY, f, id, "cy", CY(r.mb) + (CY(d) - CY(r.db)), `middle-aligned with ${nm(r)}`, "align", BACK);
          if (Math.abs(d.y1 - r.db.y1) <= AL) add(EY, f, id, "y1", r.mb.y1 + (d.y1 - r.db.y1), `bottom-aligned with ${nm(r)}`, "align", BACK);
        }
      });
    }
    if (flow) {
      units.forEach((u, k) => {
        const id = k + 1, d = u.db;
        const { ab, be, le, ri } = near[k];
        const span = (lo, hi, isX) => {
          if (lo < 0 && hi < 0) return;
          const L = lo >= 0 ? units[lo] : null, R22 = hi >= 0 ? units[hi] : null;
          const ld = L ? isX ? L.db.x1 : L.db.y1 : isX ? PD.x0 : PD.y0;
          const lm = L ? isX ? L.mb.x1 : L.mb.y1 : isX ? PM.x0 : PM.y0;
          const rd = R22 ? isX ? R22.db.x0 : R22.db.y0 : isX ? PD.x1 : PD.y1;
          const rm = R22 ? isX ? R22.mb.x0 : R22.mb.y0 : isX ? PM.x1 : PM.y1;
          const c = isX ? CX(d) : CY(d), size = isX ? W_(d) : H_(d);
          const off = c - (ld + rd) / 2;
          if (Math.abs(off) > AL || rd - ld < size + 16) return;
          const from = !L ? hi + 1 : !R22 ? lo + 1 : Math.abs(rm - rd) >= Math.abs(lm - ld) ? hi + 1 : lo + 1;
          const nmB = (U, side) => U ? nm(U) : `the parent's ${side} edge`;
          add(
            isX ? EX : EY,
            from,
            id,
            isX ? "cx" : "cy",
            (lm + rm) / 2 + off,
            `centered between ${nmB(L, isX ? "left" : "top")} and ${nmB(R22, isX ? "right" : "bottom")}`,
            "center",
            BACK
          );
        };
        span(le, ri, true);
        span(ab, be, false);
      });
    }
    const cx = edmonds(n + 1, 0, EX), cy = edmonds(n + 1, 0, EY);
    if (flow) {
      const enforce = (C9, E, chosen, flowWord, backWord) => {
        for (let k = 0; k < n; k++) {
          const j = C9.next[k];
          if (j < 0) continue;
          const succ = C9.backward[k] ? k : j, pred = C9.backward[k] ? j : k;
          const uses = (e) => e && e.from === pred + 1 && e.to === succ + 1 && e.kind === "flow";
          const usesRev = (e) => e && e.from === succ + 1 && e.to === pred + 1 && e.kind === "flow";
          if (uses(chosen[succ + 1]) || usesRev(chosen[pred + 1])) continue;
          const cur = chosen[succ + 1];
          if (!cur || cur.kind !== "flow" || cur.from === pred + 1) continue;
          const g = E.find((e) => e.from === pred + 1 && e.to === succ + 1 && e.kind === "flow");
          const tol = P0.posTol * (KIND_GROUP[units[succ].d[0].kind] === "ink" ? P0.textPosMul : 1);
          if (g && Math.abs(g.v) > tol && Math.abs(g.v) > Math.abs(cur.v) + tol) {
            chosen[succ + 1] = Object.assign({}, g, { name: g.name + " (gap changed)" });
          }
        }
      };
      enforce(CXc, EX, cx);
      enforce(CYc, EY, cy);
      const uniform = (C9, E, chosen, isX) => {
        for (const chain of C9.rows) {
          if (chain.length < 3 || !chain.every((i) => units[i].d.every((x) => KIND_GROUP[x.kind] === "box") && units[i].m.every((x) => KIND_GROUP[x.kind] === "box"))) continue;
          const dg = [];
          for (let i = 1; i < chain.length; i++) {
            const a = units[chain[i - 1]], b = units[chain[i]];
            dg.push(isX ? b.mb.x0 - a.mb.x1 - (b.db.x0 - a.db.x1) : b.mb.y0 - a.mb.y1 - (b.db.y0 - a.db.y1));
          }
          const mean = dg.reduce((p, q) => p + q, 0) / dg.length;
          if (Math.abs(mean) <= P0.posTol || dg.some((v) => Math.abs(v - mean) > 2)) continue;
          const succ = chain[1], g = E.find((e) => e.from === chain[0] + 1 && e.to === succ + 1 && e.kind === "flow");
          if (g && Math.abs(g.v) > Math.abs(chosen[succ + 1].v)) {
            const gapNote = `${dg.length === 2 ? "Both" : `All ${dg.length}`} gaps in the ${isX ? "row" : "column"} ${Math.round(Math.abs(mean))}px ${mean > 0 ? "wider" : "narrower"}`;
            chosen[succ + 1] = Object.assign({}, g, { name: g.name + ` (all ${dg.length} gaps ${mean > 0 ? "wider" : "narrower"} by ${Math.round(Math.abs(mean))}px)`, gapNote });
          }
        }
      };
      uniform(CXc, EX, cx, true);
      uniform(CYc, EY, cy, false);
    }
    units.forEach((u, k) => {
      u.rx = cx[k + 1];
      u.ry = cy[k + 1];
      u.rx.refUnit = u.rx.from ? units[u.rx.from - 1] : null;
      u.ry.refUnit = u.ry.from ? units[u.ry.from - 1] : null;
    });
    if (flow) {
      units.forEach((u, k) => {
        const id = k + 1;
        const stable = (v, isX) => units[v].d.some((x) => KIND_GROUP[x.kind] === "ink") || Math.abs(isX ? W_(units[v].mb) - W_(units[v].db) : H_(units[v].mb) - H_(units[v].db)) <= Math.max(2, 0.03 * (isX ? W_(units[v].db) : H_(units[v].db)));
        const indep = (e, chosen, isX) => e.from === 0 || chosen[e.from] && chosen[e.from].kind === "parent" && chosen[e.from].from === 0 && stable(e.from - 1, isX);
        const best = (E, chosen, anchor, isX) => {
          let m = Infinity;
          for (const e of E) if (e.to === id && e.anchor === anchor && e.kind !== "center" && indep(e, chosen, isX)) m = Math.min(m, Math.abs(e.v));
          return m;
        };
        u.edges = { x0: best(EX, cx, "x0", true), x1: best(EX, cx, "x1", true), y0: best(EY, cy, "y0", false), y1: best(EY, cy, "y1", false) };
      });
    }
  }

  // src/engine/score.js
  var LEVEL = (s) => s >= 2.5 ? "major" : s >= 1 ? "minor" : "ok";
  function sizeCheck(u, P, contentExplained, missingKids) {
    const d = u.d[0], db = u.db, mb = u.mb;
    const dw = W_(mb) - W_(db), dh = H_(mb) - H_(db);
    if (u.d.every((n) => n.kind === "rule") && u.m.every((n) => n.kind === "rule")) {
      const horiz = W_(db) >= H_(db);
      const ld = horiz ? W_(db) : H_(db), lm = horiz ? W_(mb) : H_(mb);
      const s = Math.abs(lm - ld) / Math.max(P.sizeTol, 0.05 * ld);
      return { s, dw, dh, note: `${horiz ? "length" : "height"} ${lm > ld ? "+" : "−"}${Math.abs(Math.round(lm - ld))}px`, explained: "" };
    }
    const ink = KIND_GROUP[d.kind] === "ink" || u.d.length > 1;
    if (ink) {
      const pd = u.d.reduce((a, n) => a + (n.px || AREA(n.box) * 0.3), 0), pm = u.m.reduce((a, n) => a + (n.px || AREA(n.box) * 0.3), 0);
      const lr = Math.log(Math.max(1, pm) / Math.max(1, pd)) - (P.ts ? P.ts.m : 0);
      const sMass = Math.max(0, Math.abs(lr) - Math.log(1 + P.textSizeTol)) / Math.log(1.25);
      let sH = 0, sZ = 0, zNote = "";
      const glyphH = (n, bh) => {
        if (!n.prof) return null;
        const e = n.prof.ext.filter((v, i) => v != null && n.prof.n[i] >= 4).map((v) => v * bh).sort((p, q) => p - q);
        return e.length >= 3 ? e[e.length >> 1] : null;
      };
      const gd = u.d.length === 1 ? glyphH(u.d[0], H_(db)) : null, gm = u.m.length === 1 ? glyphH(u.m[0], H_(mb)) : null;
      const dGlyph = gd && gm ? Math.log(gm / gd) - (P.ts ? P.ts.h : 0) : null;
      if (u.d.length === 1 && u.m.length === 1 && u.d[0].lines === 1 && u.m[0].lines === 1) {
        const dh2 = Math.log(H_(mb) / H_(db)) - (P.ts ? P.ts.h : 0), dw2 = Math.log(W_(mb) / W_(db)) - (P.ts ? P.ts.w : 0);
        sH = Math.max(0, Math.abs(dh2) - Math.log(1.22)) / Math.log(1.15);
        const zh = dh2 / Math.max(0.07, 1.2 / Math.min(H_(db), H_(mb))), zw = dw2 / 0.08;
        const glyphsKept = dGlyph != null && Math.abs(dGlyph) < Math.max(0.08, 0.4 * Math.abs(dh2));
        if (Math.sign(dh2) === Math.sign(dw2) && Math.min(Math.abs(zh), Math.abs(zw)) >= 1 && !glyphsKept) {
          const z = Math.hypot(zh, zw);
          sZ = Math.max(0, z - 2.4) / 0.8;
          zNote = `text set ${dh2 > 0 ? "larger" : "smaller"} (≈${Math.round(Math.abs(Math.exp((dh2 + dw2) / 2) - 1) * 100)}%)`;
        }
      }
      let sW = 0, wNote = "";
      if (u.d.length === 1 && u.m.length === 1 && u.d[0].lines === 1 && u.m[0].lines === 1) {
        const dh2 = Math.log(H_(mb) / H_(db)) - (P.ts ? P.ts.h : 0), dw2 = Math.log(W_(mb) / W_(db)) - (P.ts ? P.ts.w : 0);
        const glyphsKept = dGlyph != null && Math.abs(dGlyph) < Math.max(0.08, 0.4 * Math.abs(dh2));
        if (Math.abs(dh2) < 0.12 || glyphsKept) {
          sW = Math.max(0, Math.abs(dw2) - 0.24) / 0.12;
          wNote = `line ${dw2 > 0 ? "longer" : "shorter"} than the font explains (${Math.round(W_(db))}→${Math.round(W_(mb))}px)`;
        }
      }
      const s = Math.max(sMass, sH, sZ, sW);
      let note;
      if (sW >= Math.max(sH, sMass, sZ) && sW >= 1) note = wNote;
      else if (sZ >= Math.max(sH, sMass) && sZ > 0) note = zNote;
      else if (sH > sMass) note = `glyphs ${H_(mb) > H_(db) ? "taller" : "shorter"} (${Math.round(H_(db))}→${Math.round(H_(mb))}px line)`;
      else note = lr > 0 ? `text ${Math.round((Math.exp(lr) - 1) * 100)}% heavier` : `text ${Math.round((1 - Math.exp(lr)) * 100)}% lighter`;
      const reflow = (u.d[0].lines || 1) !== (u.m[0].lines || 1);
      let sP = 0;
      if (u.d.length === 1 && u.m.length === 1 && u.d[0].prof && u.m[0].prof) {
        const a = u.d[0].prof, b = u.m[0].prof;
        let best = Infinity;
        for (const sh of [-1, 0, 1]) {
          let dl = 0, de = 0, k = 0;
          for (let i = 0; i < 8; i++) {
            const j = i + sh;
            if (j < 0 || j > 7 || a.n[i] < 4 || b.n[j] < 4) continue;
            dl += Math.abs(a.lum[i] - b.lum[j]) / 255;
            de += Math.abs(a.ext[i] - b.ext[j]);
            k++;
          }
          if (k >= 4) best = Math.min(best, Math.max(0, dl / k - 0.14) / 0.08 + Math.max(0, de / k - 0.22) / 0.12);
        }
        if (best < Infinity) sP = best;
      }
      if (sP > s && sP >= 1) return { s: sP, dw, dh, note: "words rearranged or restyled within the line", explained: "" };
      return { s, dw, dh, note, explained: s < 1 ? reflow ? "reflowed, same amount of text" : "within text tolerance" : "" };
    }
    const tw2 = Math.max(P.sizeTol, 0.05 * W_(db)), th = Math.max(P.sizeTol, 0.05 * H_(db));
    let sx = Math.abs(dw) / tw2, sy = Math.abs(dh) / th, explained = "";
    if (contentExplained && u.kids && u.kids.length) {
      const Ud = UNIONS(u.kids.map((k) => k.db)), Um = UNIONS(u.kids.map((k) => k.mb));
      const top = u.kids.reduce((a, k) => k.mb.y0 < a.mb.y0 ? k : a);
      const rTop = top.ry && top.ry.kind === "parent" && top.ry.anchor === "y0" ? top.ry.v : 0;
      const dContent = H_(Um) - H_(Ud);
      const alt = [Math.abs(dh - dContent - rTop)];
      if (missingKids && missingKids.length) {
        const span = H_(UNIONS(missingKids.map((n) => n.box)));
        for (const g of [0, 8, 12, 16, 24]) alt.push(Math.abs(dh - dContent - rTop + span + g));
      }
      const ry = Math.min(...alt);
      if (ry / th < sy) {
        sy = ry / th;
        if (Math.abs(dh) > th) explained = "height follows content";
      }
      if (u.kids.length === 1 && KIND_GROUP[u.kids[0].d[0].kind] === "ink") {
        const dc = W_(Um) - W_(Ud);
        const lo = Math.min(0, dc), hi = Math.max(0, dc);
        const rx = dw < lo ? lo - dw : dw > hi ? dw - hi : 0;
        if (rx / tw2 < sx) {
          sx = rx / tw2;
          if (Math.abs(dw) > tw2) explained = explained ? explained + ", width follows its label" : "width follows its label";
        }
      }
    }
    if (contentExplained && u.edges) {
      const ex = Math.max(u.edges.x0, u.edges.x1), ey = Math.max(u.edges.y0, u.edges.y1);
      if (ex / tw2 < sx) {
        sx = ex / tw2;
        if (Math.abs(dw) > tw2) explained = explained ? explained + ", width set by its neighbours" : "width set by its neighbours";
      }
      if (ey / th < sy) {
        sy = ey / th;
        if (Math.abs(dh) > th) explained = explained ? explained + ", height set by its neighbours" : "height set by its neighbours";
      }
    }
    const parts = [];
    if (Math.abs(dw) >= 2) parts.push(`width ${dw > 0 ? "+" : "−"}${Math.abs(Math.round(dw))}px`);
    if (Math.abs(dh) >= 2) parts.push(`height ${dh > 0 ? "+" : "−"}${Math.abs(Math.round(dh))}px`);
    return { s: Math.max(sx, sy), dw, dh, note: parts.join(", "), explained };
  }
  function maskCorr(a, b, n) {
    const k = 12 / n, pa = new Array(n * n).fill(0), pb = new Array(n * n).fill(0);
    for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) {
      const c = Math.floor(y / k) * n + Math.floor(x / k);
      pa[c] += a[y * 12 + x];
      pb[c] += b[y * 12 + x];
    }
    const N = n * n, ma = pa.reduce((p, q) => p + q, 0) / N, mb = pb.reduce((p, q) => p + q, 0) / N;
    let s = 0, sa = 0, sb = 0;
    for (let i = 0; i < N; i++) {
      s += (pa[i] - ma) * (pb[i] - mb);
      sa += (pa[i] - ma) ** 2;
      sb += (pb[i] - mb) ** 2;
    }
    return sa && sb ? s / Math.sqrt(sa * sb) : 1;
  }
  function fmtVec(x, y) {
    const p = [];
    if (Math.abs(y) >= 1.5) p.push(`${Math.round(Math.abs(y))}px ${y > 0 ? "down" : "up"}`);
    if (Math.abs(x) >= 1.5) p.push(`${Math.round(Math.abs(x))}px ${x > 0 ? "right" : "left"}`);
    return p.join(", ") || "in place";
  }
  function expectedBox(db, rx, ry) {
    const x0 = rx.anchor === "x0" ? rx.exp : rx.anchor === "cx" ? rx.exp - W_(db) / 2 : rx.exp - W_(db);
    const y0 = ry.anchor === "y0" ? ry.exp : ry.anchor === "cy" ? ry.exp - H_(db) / 2 : ry.exp - H_(db);
    return B(x0, y0, x0 + W_(db), y0 + H_(db));
  }
  function scoreUnit(u, Pd, Pm, ctx, depth, missingKids) {
    const P = ctx.P;
    const mb = u.mb, db = u.db;
    const rx = u.rx, ry = u.ry;
    const d = u.d[0], m = u.m[0];
    const ink = KIND_GROUP[d.kind] === "ink" || u.d.length > 1;
    const ptol = P.posTol * (ink ? P.textPosMul : 1);
    const sPos = Math.hypot(rx.v, ry.v) / ptol;
    const size = sizeCheck(u, P, ctx.flow, missingKids);
    const ctol = ink ? P.textColorTol : P.colorTol;
    const sameGroup = KIND_GROUP[d.kind] === KIND_GROUP[m.kind] || (u.d.length > 1 || u.m.length > 1);
    const de = d.color && m.color && sameGroup ? nodeDE(rep(u.d), rep(u.m)) : 0;
    const sCol = de > ctol ? 1 + (de - ctol) / 12 : de / ctol * 0.9;
    let sShape = 0, shapeNote = "Shape differs (corners or outline)";
    if (u.d.length === 1 && u.m.length === 1 && d.solidity && m.solidity && !d.graphic && !m.graphic && Math.min(W_(db), H_(db)) >= 16) {
      sShape = Math.max(0, Math.abs(d.solidity - m.solidity) - 0.05) / 0.04;
      if (d.radius != null && m.radius != null) {
        const rs = Math.max(0, Math.abs(d.radius - m.radius) - 2) / 2.5;
        if (rs > sShape) {
          sShape = rs;
          shapeNote = `Corner radius ≈${Math.round(d.radius)}px → ≈${Math.round(m.radius)}px`;
        }
      }
    }
    if (u.d.length === 1 && u.m.length === 1 && d.kind === "icon" && m.kind === "icon" && d.mask && m.mask && d.tall >= 1.2 && m.tall >= 1.2) {
      const c4 = maskCorr(d.mask, m.mask, 4), c6 = maskCorr(d.mask, m.mask, 6);
      const sG = c4 < 0.45 && c6 < 0.6 ? Math.max(0, 0.62 - c4) / 0.06 : 0;
      if (sG > sShape) {
        sShape = sG;
        shapeNote = "Different icon";
      }
    }
    const comps = [["position", sPos], ["size", size.s], ["color", sCol], ["shape", sShape]];
    comps.sort((a, b) => b[1] - a[1]);
    const sev = comps[0][1];
    const top = comps[0][0];
    let title;
    if (sev < 1) title = "Matches";
    else if (top === "position") title = rx.gapNote && Math.abs(rx.v) >= Math.abs(ry.v) ? rx.gapNote : ry.gapNote && Math.abs(ry.v) >= Math.abs(rx.v) ? ry.gapNote : `Moved ${fmtVec(rx.v, ry.v)}`;
    else if (top === "size") title = size.note ? size.note[0].toUpperCase() + size.note.slice(1) : "Size differs";
    else if (top === "color") title = `${ink ? "Text color" : "Fill color"} off (ΔE ${Math.round(de)})`;
    else title = shapeNote;
    const inherited = { dx: Pm.box.x0 - Pd.box.x0, dy: Pm.box.y0 - Pd.box.y0 };
    const abs = { dx: mb.x0 - db.x0, dy: mb.y0 - db.y0 };
    const eBox = expectedBox(db, rx, ry);
    const issues = comps.filter((c) => c[1] >= 1).map((c) => c[0]);
    return {
      type: sev < 1 ? "match" : top,
      sev,
      level: LEVEL(sev),
      title,
      issues,
      name: unitName(u.d),
      dBox: db,
      mBox: mb,
      eBox,
      dNodes: u.d,
      mNodes: u.m,
      depth,
      rescued: !!u.rescued,
      merged: u.d.length + u.m.length > 2,
      decomp: {
        abs,
        inherited,
        explained: { dx: abs.dx - inherited.dx - rx.v, dy: abs.dy - inherited.dy - ry.v },
        residual: { dx: rx.v, dy: ry.v },
        refX: rx.name,
        refY: ry.name,
        refXKind: rx.kind,
        refYKind: ry.kind
      },
      size,
      color: { d: rep(u.d).color || d.color, m: rep(u.m).color || m.color, de },
      shape: { d: d.solidity, m: m.solidity, s: sShape },
      parts: { position: sPos, size: size.s, color: sCol, shape: sShape }
    };
  }

  // src/engine/pixel.js
  function blobs(flag, W, H, strength, cell) {
    const gw = Math.ceil(W / cell), gh = Math.ceil(H / cell);
    const cnt = new Float32Array(gw * gh), sum = new Float32Array(gw * gh);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (flag[i]) {
        const g = (y / cell | 0) * gw + (x / cell | 0);
        cnt[g]++;
        sum[g] += strength[i];
      }
    }
    const on = new Uint8Array(gw * gh);
    for (let g = 0; g < gw * gh; g++) on[g] = cnt[g] >= 3 ? 1 : 0;
    const seen = new Uint8Array(gw * gh), out = [];
    for (let s = 0; s < gw * gh; s++) {
      if (!on[s] || seen[s]) continue;
      const st = [s];
      seen[s] = 1;
      let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, c = 0, sm = 0;
      while (st.length) {
        const g = st.pop();
        const gx = g % gw, gy = (g - gx) / gw;
        x0 = Math.min(x0, gx);
        x1 = Math.max(x1, gx);
        y0 = Math.min(y0, gy);
        y1 = Math.max(y1, gy);
        c += cnt[g];
        sm += sum[g];
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
          const nx = gx + dx, ny = gy + dy;
          if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue;
          const q = ny * gw + nx;
          if (on[q] && !seen[q]) {
            seen[q] = 1;
            st.push(q);
          }
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
      if (d > P.pixT) {
        flag[i] = 1;
        nf++;
      }
    }
    const out = blobs(flag, W, H, str, 6).map((bl) => {
      const s = 1 + Math.min(3, bl.mean * 4 * Math.min(1, bl.px / 400));
      return { type: "pixel", sev: s, level: LEVEL(s), title: `${bl.px} pixels differ`, name: `Region ${Math.round(W_(bl.box))}×${Math.round(H_(bl.box))}`, dBox: bl.box, mBox: bl.box, eBox: null, dNodes: [], mNodes: [], depth: 0 };
    });
    return { findings: out, heat: { W, H, v: str, flag }, score: 100 * (1 - nf / N) };
  }
  function runSSIM(imgD, imgM, ctx) {
    const P = ctx.P, W = imgD.width, H = imgD.height, N = W * H;
    const L = (img) => {
      const o = new Float64Array(N), d = img.data;
      for (let i = 0; i < N; i++) o[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
      return o;
    };
    const x = L(imgD), y = L(imgM);
    const W1 = W + 1, I8 = (n) => new Float64Array(W1 * (H + 1));
    const Sx = I8(), Sy = I8(), Sxx = I8(), Syy = I8(), Sxy = I8();
    for (let r = 0; r < H; r++) {
      let ax = 0, ay = 0, axx = 0, ayy = 0, axy = 0;
      for (let c = 0; c < W; c++) {
        const i = r * W + c, xv = x[i], yv = y[i];
        ax += xv;
        ay += yv;
        axx += xv * xv;
        ayy += yv * yv;
        axy += xv * yv;
        const o = (r + 1) * W1 + c + 1, u = r * W1 + c + 1;
        Sx[o] = Sx[u] + ax;
        Sy[o] = Sy[u] + ay;
        Sxx[o] = Sxx[u] + axx;
        Syy[o] = Syy[u] + ayy;
        Sxy[o] = Sxy[u] + axy;
      }
    }
    const rad = 3, C1 = (0.01 * 255) ** 2, C22 = (0.03 * 255) ** 2;
    const ss = new Float32Array(N), flag = new Uint8Array(N), str = new Float32Array(N);
    let tot = 0;
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
      const r0 = Math.max(0, r - rad), r1 = Math.min(H, r + rad + 1), c0 = Math.max(0, c - rad), c1 = Math.min(W, c + rad + 1);
      const n = (r1 - r0) * (c1 - c0);
      const box2 = (S) => S[r1 * W1 + c1] - S[r0 * W1 + c1] - S[r1 * W1 + c0] + S[r0 * W1 + c0];
      const mx = box2(Sx) / n, my = box2(Sy) / n;
      const vx = box2(Sxx) / n - mx * mx, vy = box2(Syy) / n - my * my, cxy = box2(Sxy) / n - mx * my;
      const v = (2 * mx * my + C1) * (2 * cxy + C22) / ((mx * mx + my * my + C1) * (vx + vy + C22));
      const i = r * W + c;
      ss[i] = v;
      tot += v;
      str[i] = clamp((1 - v) / 2, 0, 1);
      if (v < P.ssimT) flag[i] = 1;
    }
    const out = blobs(flag, W, H, str, 6).map((bl) => {
      const s = 1 + Math.min(3, bl.mean * 6 * Math.min(1, bl.px / 400));
      return { type: "pixel", sev: s, level: LEVEL(s), title: `Low structural similarity`, name: `Region ${Math.round(W_(bl.box))}×${Math.round(H_(bl.box))}`, dBox: bl.box, mBox: bl.box, eBox: null, dNodes: [], mNodes: [], depth: 0 };
    });
    return { findings: out, heat: { W, H, v: str, flag }, score: 100 * tot / N };
  }

  // src/engine/order.js
  function cutGroups(items, lo, hi) {
    const s = items.slice().sort((a, b) => lo(a.box) - lo(b.box));
    const groups = [];
    let cur = [], end = -Infinity;
    for (const it of s) {
      if (cur.length && lo(it.box) >= end - 1) {
        groups.push(cur);
        cur = [];
        end = -Infinity;
      }
      cur.push(it);
      end = Math.max(end, hi(it.box));
    }
    if (cur.length) groups.push(cur);
    return groups;
  }
  function xyOrder(items) {
    if (items.length <= 1) return items.slice();
    const ys = cutGroups(items, (b) => b.y0, (b) => b.y1);
    if (ys.length > 1) return ys.flatMap(xyOrder);
    const xs = cutGroups(items, (b) => b.x0, (b) => b.x1);
    if (xs.length > 1) return xs.flatMap(xyOrder);
    return items.slice().sort((a, b) => a.box.y0 - b.box.y0 || a.box.x0 - b.box.x0);
  }

  // src/engine/verify.js
  function inkIn(img, box2, bg, skip, T2) {
    if (!img || !box2) return 0;
    const W = img.width, H = img.height, d = img.data;
    const x0 = clamp(Math.floor(box2.x0), 0, W), x1 = clamp(Math.ceil(box2.x1), 0, W);
    const y0 = clamp(Math.floor(box2.y0), 0, H), y1 = clamp(Math.ceil(box2.y1), 0, H);
    let n = 0;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      let covered = false;
      for (const b of skip) if (x >= b.x0 && x < b.x1 && y >= b.y0 && y < b.y1) {
        covered = true;
        break;
      }
      if (covered) continue;
      const i = (y * W + x) * 4;
      if (Math.max(Math.abs(d[i] - bg[0]), Math.abs(d[i + 1] - bg[1]), Math.abs(d[i + 2] - bg[2])) > 2.5 * T2) n++;
    }
    return n;
  }
  function presentInPixels(n, at, imgSelf, imgOther, fillSelf, fillOther, siblingsOther, P) {
    const own = inkIn(imgSelf, n.box, fillSelf, [], P.edgeT);
    if (own < 12) return false;
    const there = inkIn(imgOther, at, fillOther, siblingsOther, P.edgeT);
    return there >= 0.5 * own;
  }

  // src/engine/tree.js
  function frameContrast(n) {
    const c = n.fill || n.color, b = n.bg;
    return c && b ? dE(c, b) : 20;
  }
  function boxGap(a, b) {
    const dx = Math.max(0, Math.max(a.x0, b.x0) - Math.min(a.x1, b.x1));
    const dy = Math.max(0, Math.max(a.y0, b.y0) - Math.min(a.y1, b.y1));
    return Math.hypot(dx, dy);
  }
  var sizeIoU = (a, b) => {
    const i = Math.min(W_(a), W_(b)) * Math.min(H_(a), H_(b));
    return i / Math.max(1, W_(a) * H_(a) + W_(b) * H_(b) - i);
  };
  function absorb(res) {
    const ink = (n) => KIND_GROUP[n.kind] !== "box";
    const inkUnit = (u) => u.d.every(ink) && u.m.every(ink);
    for (const side of ["D", "M"]) {
      const pool = side === "D" ? res.delD : res.insM;
      for (let k = pool.length - 1; k >= 0; k--) {
        const n = pool[k];
        if (!ink(n)) continue;
        let best = null, bestCov = 0;
        for (const u of res.units) {
          if (!inkUnit(u)) continue;
          const own = side === "D" ? u.db : u.mb, other = side === "D" ? u.mb : u.db;
          if (boxGap(n.box, own) > Math.max(6, 1.2 * Math.min(H_(n.box), H_(own)))) continue;
          const dx = other.x0 - own.x0, dy = other.y0 - own.y0;
          const I8 = INTER(SHIFT(n.box, dx, dy), GROW(other, 3));
          let cov = I8 ? AREA(I8) / Math.max(1, AREA(n.box)) : 0;
          const U = UNIONS([own, n.box]);
          const sim = sizeIoU(U, other), sim0 = sizeIoU(own, other);
          if (sim >= 0.75 && sim > sim0 + 0.1) cov = Math.max(cov, sim);
          if (cov > bestCov) {
            bestCov = cov;
            best = u;
          }
        }
        if (best && bestCov >= 0.7) {
          (side === "D" ? best.d : best.m).push(n);
          best.db = UNIONS(best.d.map((x) => x.box));
          best.mb = UNIONS(best.m.map((x) => x.box));
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
        const fd = res.delD.filter((n) => n.children && n.children.length);
        const fm = res.insM.filter((n) => n.children && n.children.length);
        if (!fd.length && !fm.length) break;
        flatD.push(...fd);
        flatM.push(...fm);
        D = xyOrder(D.flatMap((n) => fd.includes(n) ? n.children : [n]));
        M = xyOrder(M.flatMap((n) => fm.includes(n) ? n.children : [n]));
      }
      const settle = (flat3, pool, side) => {
        const matched = new Set(res.units.flatMap((u) => side === "D" ? u.d : u.m));
        const desc = (n) => {
          const o = [];
          const w = (x) => {
            for (const c of x.children || []) {
              o.push(c);
              w(c);
            }
          };
          w(n);
          return o;
        };
        const whole = [];
        for (const f of flat3) {
          if (whole.some((g) => desc(g).includes(f))) continue;
          const ds = desc(f);
          if (!ds.some((x) => matched.has(x))) whole.push(f);
        }
        const gone = new Set(whole.flatMap(desc));
        for (let k = pool.length - 1; k >= 0; k--) if (gone.has(pool[k])) pool.splice(k, 1);
        pool.push(...whole);
        return flat3.filter((f) => !gone.has(f) && !whole.includes(f));
      };
      const partD = settle(flatD, res.delD, "D"), partM = settle(flatM, res.insM, "M");
      for (const n of partD) {
        const s = frameContrast(n) > 14 ? 2.6 : 1.4;
        out.push({ type: "frame-missing", sev: s, level: LEVEL(s), title: "Frame missing (contents found)", name: nodeName(n), dBox: n.box, mBox: null, eBox: SHIFT(n.box, Pm.box.x0 - Pd.box.x0, Pm.box.y0 - Pd.box.y0), dNodes: [n], mNodes: [], depth });
      }
      for (const n of partM) {
        const s = frameContrast(n) > 14 ? 2.6 : 1.4;
        out.push({ type: "frame-extra", sev: s, level: LEVEL(s), title: "Extra frame around contents", name: nodeName(n), dBox: null, mBox: n.box, eBox: null, dNodes: [], mNodes: [n], depth });
      }
      if (ctx.flow) absorb(res);
      const units = res.units;
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
          const a = nearest(units, null, (v) => v.db.y1 <= n.box.y0 + 2 && OVL(v.db.x0, v.db.x1, n.box.x0, n.box.x1) > 0, (v) => v.db.y1);
          if (a) e = SHIFT(n.box, a.mb.x0 - a.db.x0, a.mb.y1 - a.db.y1);
        }
        if (ctx.verify && presentInPixels(n, e, ctx.imgD, ctx.imgM, Pd.fill || Pd.color, Pm.fill || Pm.color, units.map((v) => v.mb), P)) continue;
        const big = AREA(n.box) >= 250 || n.kind === "text";
        const s = big ? 3 : 1.3;
        out.push({ type: "missing", sev: s, level: LEVEL(s), title: "Missing in implementation", name: nodeName(n), dBox: n.box, mBox: null, eBox: e, dNodes: [n], mNodes: [], depth });
      }
      for (const n of res.insM) {
        let e = SHIFT(n.box, Pd.box.x0 - Pm.box.x0, Pd.box.y0 - Pm.box.y0);
        if (ctx.flow) {
          const a = nearest(units, null, (v) => v.mb.y1 <= n.box.y0 + 2 && OVL(v.mb.x0, v.mb.x1, n.box.x0, n.box.x1) > 0, (v) => v.mb.y1);
          if (a) e = SHIFT(n.box, a.db.x0 - a.mb.x0, a.db.y1 - a.mb.y1);
        }
        if (ctx.verify && presentInPixels(n, e, ctx.imgM, ctx.imgD, Pm.fill || Pm.color, Pd.fill || Pd.color, units.map((v) => v.db), P)) continue;
        const big = AREA(n.box) >= 250 || n.kind === "text";
        const s = big ? 2.6 : 1.2;
        out.push({ type: "extra", sev: s, level: LEVEL(s), title: "Not in the design", name: nodeName(n), dBox: null, mBox: n.box, eBox: null, dNodes: [], mNodes: [n], depth });
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
      const r2 = parentResidual(d.box, m.box, PD.box, PM.box);
      return emission(d, m, d.box, m.box, P) + Math.min(6, Math.hypot(r2.x, r2.y) / P.transTau);
    };
    const r = assign(D, M, cost, (d) => gapCost(d, P) + 1.2, (m) => gapCost(m, P) + 1.2);
    const units = r.pairs.map(([d, m]) => mkUnit([d], [m]));
    attributeLevel(units, [], PD, PM, false);
    for (const u of units) out.push(scoreUnit(u, PD, PM, ctx, u.d[0].depth || 1, null));
    for (const n of r.delA) {
      const s = AREA(n.box) >= 250 || n.kind === "text" ? 3 : 1.3;
      out.push({ type: "missing", sev: s, level: LEVEL(s), title: "Missing in implementation", name: nodeName(n), dBox: n.box, mBox: null, eBox: n.box, dNodes: [n], mNodes: [], depth: n.depth });
    }
    for (const n of r.insB) {
      const s = AREA(n.box) >= 250 || n.kind === "text" ? 2.6 : 1.2;
      out.push({ type: "extra", sev: s, level: LEVEL(s), title: "Not in the design", name: nodeName(n), dBox: null, mBox: n.box, eBox: null, dNodes: [], mNodes: [n], depth: n.depth });
    }
    return out;
  }

  // src/engine/run.js
  var ALGOS = [
    { id: "pixel", name: "Pixel Δ", short: "Pixel Δ", family: "pixel", blurb: "Per-pixel max-channel difference, blobbed into regions. The baseline everyone starts with: fonts and any shift light up everything." },
    { id: "ssim", name: "SSIM map", short: "SSIM", family: "pixel", blurb: "Windowed structural similarity on luminance. Smarter about contrast, still blind to structure: a 24px shift is a full-page failure." },
    { id: "flat", name: "Flat boxes", short: "Flat", family: "box", blurb: "Segment both renders, flatten every box, solve one global assignment, score absolute coordinates. Every descendant of a moved element is charged again." },
    { id: "tree", name: "Tree · Hungarian", short: "Tree", family: "box", blurb: "Match level by level inside matched parents, score children relative to their parent. Removes parent double jeopardy; siblings in a flow still cascade." },
    { id: "viterbi", name: "Tree · Viterbi", short: "Viterbi", family: "box", blurb: "Same tree, but each level is a monotone Viterbi alignment over reading order with flow-aware transitions, skips and 2:1 text merges. Residuals still parent-relative." },
    { id: "viterbi-flow", name: "Tree · Viterbi + flow", short: "Viterbi + flow", family: "box", blurb: "Full method. Each element is charged only for the displacement no layout reference explains: its parent, the sibling it flows after, a neighbour it was aligned with, the gap a missing sibling left. Rows and columns form flow chains anchored where they moved least. Containers may grow with their content and text may reflow." }
  ];
  function run(algoId, segD, segM, imgD, imgM, Pin) {
    const P = Object.assign({}, DEFAULTS, Pin || {});
    const t0 = performance.now();
    let findings, heat = null, score = null;
    if (algoId === "pixel" || algoId === "ssim") {
      const r = algoId === "pixel" ? runPixel(imgD, imgM, { P }) : runSSIM(imgD, imgM, { P });
      findings = r.findings;
      heat = r.heat;
      score = r.score;
    } else {
      const pass = (Q) => algoId === "flat" ? runFlat(segD, segM, { P: Q, flow: false }) : runTree(segD, segM, { P: Q, flow: algoId === "viterbi-flow", verify: algoId === "viterbi-flow", imgD, imgM, align: algoId === "tree" ? hungarianAlign : viterbiAlign });
      findings = pass(P);
      const ts = estimateTextScale(findings);
      if (ts) {
        P.ts = ts;
        findings = pass(P);
      }
    }
    findings.forEach((f, i) => {
      f.id = i + 1;
    });
    const flagged = findings.filter((f) => f.level !== "ok");
    if (score === null) {
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
      if (f.level !== "ok" && (f.type === "missing" || f.type === "frame-missing")) counts.missing++;
      if (f.level !== "ok" && (f.type === "extra" || f.type === "frame-extra")) counts.extra++;
    }
    return { algo: algoId, findings, flagged, heat, score, counts, ms: performance.now() - t0, P };
  }
  function overlapsGT(b, g) {
    const I8 = INTER(GROW(b, 1), GROW(g, 6));
    if (!I8) return false;
    const a = AREA(I8);
    return a >= 0.5 * AREA(b) || a >= 0.5 * AREA(g);
  }
  function evaluate(findings, gt) {
    const flagged = findings.filter((f) => f.level !== "ok");
    const labels = [...new Set(gt.map((g) => g.label))];
    const hitLabels = /* @__PURE__ */ new Set();
    let tp = 0;
    for (const f of flagged) {
      let any = false;
      for (const g of gt) {
        const boxes = g.space === "design" ? [f.dBox, f.eBox] : [f.mBox, f.eBox, f.type === "missing" ? f.dBox : null];
        if (boxes.some((b) => b && overlapsGT(b, g.box))) {
          any = true;
          hitLabels.add(g.label);
        }
      }
      if (any) tp++;
      f.gtHit = any;
    }
    const n = labels.length;
    const recall = n ? hitLabels.size / n : null;
    const precision = flagged.length ? tp / flagged.length : n ? 0 : 1;
    const f1 = n && recall + precision > 0 ? 2 * recall * precision / (recall + precision) : null;
    return { gt: n, found: hitLabels.size, flagged: flagged.length, tp, fp: flagged.length - tp, recall, precision, f1, labels, hitLabels };
  }

  // src/engine/stretch.js
  var isBox = (n) => KIND_GROUP[n.kind] === "box";
  function cut(items, lo, hi) {
    const s = items.slice().sort((a, b) => lo(a.box) - lo(b.box));
    const groups = [];
    let cur = [], end = -Infinity;
    for (const it of s) {
      if (cur.length && lo(it.box) >= end - 1) {
        groups.push(cur);
        cur = [];
        end = -Infinity;
      }
      cur.push(it);
      end = Math.max(end, hi(it.box));
    }
    if (cur.length) groups.push(cur);
    return groups;
  }
  function xyTree(items) {
    const box2 = UNIONS(items.map((n) => n.box));
    if (items.length === 1) return { type: "leaf", item: items[0], box: box2 };
    const ys = cut(items, (b) => b.y0, (b) => b.y1);
    if (ys.length > 1) return { type: "col", kids: ys.map(xyTree), box: box2 };
    const xs = cut(items, (b) => b.x0, (b) => b.x1);
    if (xs.length > 1) return { type: "row", kids: xs.map(xyTree), box: box2 };
    return { type: "stack", kids: items.map((n) => ({ type: "leaf", item: n, box: n.box })), box: box2 };
  }
  var leaves = (t) => t.type === "leaf" ? [t.item] : t.kids.flatMap(leaves);
  var isFlexBox = (t) => leaves(t).every((n) => isBox(n) || n.kind === "image") || t.type === "stack" && leaves(t).some((n) => n.kind === "image" || n.kind === "shape");
  function inferStretch(seg, W1, H12) {
    const NB = /* @__PURE__ */ new Map(), mode = /* @__PURE__ */ new Map();
    const root = seg.root;
    NB.set(root, B(0, 0, W1, H12));
    placeChildren(root, root.box, B(0, 0, W1, H12), true);
    return { boxes: NB, modes: mode };
    function placeChildren(parent, O, N, isRoot) {
      const kids = parent.children || [];
      if (!kids.length) return;
      const dH = H_(N) - H_(O);
      const fullH = kids.filter((n) => isBox(n) && H_(n.box) >= 0.85 * H_(O) && W_(n.box) <= 0.4 * W_(O));
      const panes = [];
      for (let edge = O.x0, more = true; more; ) {
        more = false;
        for (const n of fullH) if (!panes.includes(n) && Math.abs(n.box.x0 - edge) <= 4) {
          panes.push(n);
          edge = n.box.x1;
          more = true;
          break;
        }
      }
      for (let edge = O.x1, more = true; more; ) {
        more = false;
        for (const n of fullH) if (!panes.includes(n) && Math.abs(n.box.x1 - edge) <= 4) {
          panes.push(n);
          edge = n.box.x0;
          more = true;
          break;
        }
      }
      let rx0 = O.x0, rx1 = O.x1;
      for (const p of panes) {
        const left = CX(p.box) - O.x0 <= O.x1 - CX(p.box);
        const nb = left ? B(N.x0 + (p.box.x0 - O.x0), N.y0 + (p.box.y0 - O.y0), N.x0 + (p.box.x1 - O.x0), N.y1 - (O.y1 - p.box.y1)) : B(N.x1 - (O.x1 - p.box.x0), N.y0 + (p.box.y0 - O.y0), N.x1 - (O.x1 - p.box.x1), N.y1 - (O.y1 - p.box.y1));
        if (left) rx0 = Math.max(rx0, p.box.x1);
        else rx1 = Math.min(rx1, p.box.x0);
        p.isPane = true;
        put(p, nb, left ? "left" : "right", "stretch");
      }
      const tall = kids.filter((n) => !panes.includes(n) && isBox(n) && n.box.y0 - O.y0 <= 4 && O.y1 - n.box.y1 <= 4 && H_(n.box) >= 0.85 * H_(O));
      const appLike = panes.length > 0 || tall.length > 0 || !isRoot && parent.appLike;
      if (parent.isPane) isRoot = true;
      const R0 = B(rx0, O.y0, rx1, O.y1);
      const R1 = B(N.x0 + (rx0 - O.x0), N.y0, N.x1 - (O.x1 - rx1), N.y1);
      for (const t of tall) put(t, B(R1.x0 + (t.box.x0 - R0.x0), R1.y0 + (t.box.y0 - R0.y0), R1.x1 - (R0.x1 - t.box.x1), R1.y1 - (R0.y1 - t.box.y1)), "stretch", "stretch");
      const rest = kids.filter((n) => !panes.includes(n) && !tall.includes(n));
      if (rest.length) place(xyTree(rest), R0, R1, { appLike, isRoot, vFree: appLike ? "flex" : "top" });
    }
    function put(n, nb, mx, my) {
      if (!isBox(n) && n.kind !== "rule" && n.kind !== "image") {
        const w = W_(n.box), h2 = H_(n.box);
        const x0 = mx === "right" ? nb.x1 - w : mx === "center" || mx === "scale" ? (nb.x0 + nb.x1) / 2 - w / 2 : nb.x0;
        const y0 = my === "bottom" ? nb.y1 - h2 : my === "center" || my === "scale" ? (nb.y0 + nb.y1) / 2 - h2 / 2 : nb.y0;
        nb = B(x0, y0, x0 + w, y0 + h2);
      } else if (n.kind === "rule") {
        if (W_(n.box) >= H_(n.box)) {
          const c = my === "bottom" ? nb.y1 - H_(n.box) / 2 : my === "top" ? nb.y0 + H_(n.box) / 2 : (nb.y0 + nb.y1) / 2;
          nb = B(nb.x0, c - H_(n.box) / 2, nb.x1, c + H_(n.box) / 2);
        } else {
          const c = (nb.x0 + nb.x1) / 2;
          nb = B(c - W_(n.box) / 2, nb.y0, c + W_(n.box) / 2, nb.y1);
        }
      }
      NB.set(n, nb);
      mode.set(n, { x: mx, y: my });
      if (n.children && n.children.length) {
        n.appLike = H_(nb) !== H_(n.box);
        placeChildren(n, n.box, nb, false);
      }
    }
    function place(t, A, Z, ctx) {
      const dW = W_(Z) - W_(A), dH = H_(Z) - H_(A);
      if (t.type === "leaf") {
        const n = t.item, b = n.box;
        const L = b.x0 - A.x0, Rr = A.x1 - b.x1, Tt = b.y0 - A.y0, Bb = A.y1 - b.y1;
        const spanX = W_(b) >= 0.9 * W_(A) || W_(b) >= 0.6 * W_(A) && (isBox(n) || n.kind === "rule" || n.kind === "image");
        const compact = (n.kind === "image" || n.kind === "shape") && W_(b) / H_(b) > 0.75 && W_(b) / H_(b) < 1.33 && Math.max(W_(b), H_(b)) <= 400;
        let x0, x1, mx;
        if (spanX && !compact && (isBox(n) || n.kind === "rule" || n.kind === "image")) {
          x0 = Z.x0 + L;
          x1 = Z.x1 - Rr;
          mx = "stretch";
        } else if (Math.abs(L - Rr) <= Math.max(3, 0.03 * W_(A))) {
          x0 = Z.x0 + L + dW / 2;
          x1 = x0 + W_(b);
          mx = "center";
        } else if (L <= Rr) {
          x0 = Z.x0 + L;
          x1 = x0 + W_(b);
          mx = "left";
        } else {
          x1 = Z.x1 - Rr;
          x0 = x1 - W_(b);
          mx = "right";
        }
        let y0, y1, my;
        const spanY = H_(b) >= 0.85 * H_(A) && (isBox(n) || n.kind === "image") && !compact;
        if (spanY && dH) {
          y0 = Z.y0 + Tt;
          y1 = Z.y1 - Bb;
          my = "stretch";
        } else if (ctx.vAlign === "center" || dH && Math.abs(Tt - Bb) <= Math.max(3, 0.04 * H_(A)) && Tt > 4) {
          y0 = Z.y0 + Tt + dH / 2;
          y1 = y0 + H_(b);
          my = "center";
        } else if (ctx.vAlign === "bottom") {
          y1 = Z.y1 - Bb;
          y0 = y1 - H_(b);
          my = "bottom";
        } else {
          y0 = Z.y0 + Tt;
          y1 = y0 + H_(b);
          my = "top";
        }
        if (my === "stretch" && mx !== "stretch" && (n.kind === "image" || n.kind === "shape")) {
          const k = (y1 - y0) / H_(b), c = (x0 + x1) / 2, w = W_(b) * k;
          x0 = c - w / 2;
          x1 = c + w / 2;
          mx = "fit";
        }
        put(n, B(x0, y0, x1, y1), mx, my);
        return;
      }
      if (t.type === "stack") {
        const kx = W_(Z) / W_(A), ky = H_(Z) / H_(A);
        for (const k of t.kids) {
          const n = k.item, b = n.box;
          const nb = B(Z.x0 + (b.x0 - A.x0) * kx, Z.y0 + (b.y0 - A.y0) * ky, Z.x0 + (b.x1 - A.x0) * kx, Z.y0 + (b.y1 - A.y0) * ky);
          put(n, nb, "scale", "scale");
        }
        return;
      }
      if (t.type === "col" && dW && isGrid(t)) {
        placeGrid(t, A, Z, ctx);
        return;
      }
      const along = t.type === "row" ? "x" : "y";
      const kids = t.kids;
      const lo = (b) => along === "x" ? b.x0 : b.y0, hi = (b) => along === "x" ? b.x1 : b.y1;
      const d = along === "x" ? dW : dH;
      const a0 = along === "x" ? A.x0 : A.y0, a1 = along === "x" ? A.x1 : A.y1, z0 = along === "x" ? Z.x0 : Z.y0;
      const sizes = kids.map((k) => hi(k.box) - lo(k.box));
      let grow = kids.map(() => 0), lead = 0;
      const flexKids = kids.map((k) => isFlexBox(k) && (along === "x" ? W_(k.box) >= 32 : H_(k.box) >= 0.6 * Math.max(...sizes) && H_(k.box) >= 0.12 * H_(A)));
      const allBoxes = kids.every(isFlexBox);
      const wideEnough = hi(t.box) - lo(t.box) >= 0.5 * (a1 - a0);
      if (d && along === "x" && allBoxes && wideEnough) {
        const tot = sizes.reduce((a, b2) => a + b2, 0);
        grow = sizes.map((sz) => d * sz / tot);
      } else if (d && along === "y" && ctx.vFree === "flex" && flexKids.some(Boolean)) {
        const tot = sizes.reduce((a, b2, i) => a + (flexKids[i] ? b2 : 0), 0);
        grow = sizes.map((sz, i) => flexKids[i] ? d * sz / tot : 0);
      } else if (d && along === "y" && ctx.scaleY) {
        kids.forEach((k) => {
          k._shift = (lo(k.box) + hi(k.box)) / 2 - a0 === 0 ? 0 : d * (((lo(k.box) + hi(k.box)) / 2 - a0) / (a1 - a0));
        });
      } else if (d && along === "y" && !(ctx.isRoot && ctx.appLike)) {
        lead = 0;
      } else if (d) {
        const gaps = [lo(kids[0].box) - a0];
        for (let i = 1; i < kids.length; i++) gaps.push(lo(kids[i].box) - hi(kids[i - 1].box));
        gaps.push(a1 - hi(kids[kids.length - 1].box));
        const order = gaps.map((g, i) => [g, i]).sort((p, q) => q[0] - p[0]);
        const [g1, i1] = order[0], sec = order[1];
        if (sec && sec[0] >= 0.85 * g1 && Math.abs(sec[1] - i1) >= 1) {
          const a = Math.min(i1, sec[1]), b2 = Math.max(i1, sec[1]);
          kids.forEach((k, i) => {
            k._shift = i < a ? 0 : i >= b2 ? d : d / 2;
          });
        } else kids.forEach((k, i) => {
          k._shift = i < i1 ? 0 : d;
        });
      }
      let acc = 0;
      kids.forEach((k, i) => {
        const s0 = lo(k.box) - a0;
        const shift = k._shift != null ? k._shift : acc + lead;
        const n0 = z0 + s0 + shift, n1 = n0 + sizes[i] + grow[i];
        acc += grow[i];
        let A2, Z2;
        if (along === "x") {
          A2 = B(k.box.x0, A.y0, k.box.x1, A.y1);
          Z2 = B(n0, Z.y0, n1, Z.y1);
        } else {
          A2 = B(A.x0, k.box.y0, A.x1, k.box.y1);
          Z2 = B(Z.x0, n0, Z.x1, n1);
        }
        delete k._shift;
        const cross = along === "x" ? { ...ctx, vAlign: rowAlign(k.box, t.box), scaleY: kids.some((q) => q.type === "stack") } : { ...ctx, scaleY: false };
        if (k.type === "leaf" && along === "x") {
          place(k, B(A2.x0, t.box.y0, A2.x1, t.box.y1), B(Z2.x0, Z.y0 + (t.box.y0 - A.y0), Z2.x1, Z.y0 + (t.box.y0 - A.y0) + H_(t.box) + (ctx.vFree === "flex" && isFlexBox(t) ? dH : 0)), cross);
        } else place(k, A2, Z2, cross);
      });
    }
    function gridColumns(t) {
      const rows = t.kids.filter((k) => k.type === "row" || k.type === "leaf");
      const items = rows.flatMap(leaves);
      const cols = [];
      for (const n of items.slice().sort((p, q) => p.box.x0 - q.box.x0)) {
        const c = cols.find((cc) => OVL(cc.x0, cc.x1, n.box.x0, n.box.x1) > 0);
        if (c) {
          c.items.push(n);
          c.x0 = Math.min(c.x0, n.box.x0);
          c.x1 = Math.max(c.x1, n.box.x1);
        } else cols.push({ items: [n], x0: n.box.x0, x1: n.box.x1 });
      }
      return cols.sort((p, q) => p.x0 - q.x0);
    }
    function isGrid(t) {
      const rows = t.kids.filter((k) => k.type === "row");
      const body = rows.filter((r) => r.kids.length >= 3);
      const firstBody = t.kids.findIndex((k) => k.type === "row" && k.kids.length >= 3);
      if (body.length < 3 || t.kids.slice(firstBody).some((k) => k.type === "row" && k.kids.length < 3)) return false;
      const cols = gridColumns(t);
      return cols.length >= 3 && cols.filter((c) => c.items.length >= 3).length >= 3;
    }
    function placeGrid(t, A, Z, ctx) {
      const cols = gridColumns(t);
      const kx = W_(Z) / W_(A);
      const shift = /* @__PURE__ */ new Map(), scaled = /* @__PURE__ */ new Set();
      for (const c of cols) {
        const rightAligned = c.items.every((n) => Math.abs(n.box.x1 - c.x1) <= 2) && !c.items.every((n) => Math.abs(n.box.x0 - c.x0) <= 2);
        const anchor = rightAligned ? c.x1 : c.x0;
        const d = Z.x0 + (anchor - A.x0) * kx - anchor;
        const fills = c.items.filter((n) => (isBox(n) || n.kind === "rule") && W_(n.box) >= 0.9 * (c.x1 - c.x0));
        for (const n of c.items) {
          shift.set(n, d);
          if (fills.length >= 3 && fills.includes(n)) scaled.add(n);
        }
      }
      const rows = t.kids.map((k) => ({ k, box: k.box, items: leaves(k) }));
      const boxRow = (r) => r.items.filter((n) => isBox(n) && H_(n.box) >= 0.8 * H_(r.box)).length >= Math.max(2, 0.5 * r.items.length);
      const dH = H_(Z) - H_(A);
      const share = ctx.vFree === "flex" && dH > 0 && rows.filter(boxRow).length >= 3;
      const grow = rows.map((r) => share && boxRow(r) ? H_(r.box) : 0);
      const tot = grow.reduce((p, q) => p + q, 0) || 1;
      let dy = Z.y0 - A.y0;
      rows.forEach((r, i) => {
        const g = share ? dH * grow[i] / tot : 0;
        for (const n of r.items) {
          const sx = shift.has(n) ? shift.get(n) : Z.x0 - A.x0;
          const fillsRow = g && H_(n.box) >= 0.8 * H_(r.box);
          const y0 = fillsRow ? n.box.y0 + dy : n.box.y0 + dy + g / 2, y1 = fillsRow ? n.box.y1 + dy + g : n.box.y1 + dy + g / 2;
          let nb;
          if (n.kind === "rule" && W_(n.box) >= 0.6 * W_(A)) nb = B(Z.x0 + (n.box.x0 - A.x0), y0, Z.x1 - (A.x1 - n.box.x1), y1);
          else if (scaled.has(n)) nb = B(Z.x0 + (n.box.x0 - A.x0) * kx, y0, Z.x0 + (n.box.x1 - A.x0) * kx, y1);
          else nb = B(n.box.x0 + sx, y0, n.box.x1 + sx, y1);
          put(n, nb, n.kind === "rule" || scaled.has(n) ? "stretch" : "scale", fillsRow ? "stretch" : "top");
        }
        dy += g;
      });
    }
    function rowAlign(b, band) {
      const T2 = b.y0 - band.y0, Bt = band.y1 - b.y1;
      if (Math.abs(T2 - Bt) <= 2 && T2 > 2) return "center";
      return T2 <= Bt ? "top" : "bottom";
    }
  }
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
          d[o] = s[i];
          d[o + 1] = s[i + 1];
          d[o + 2] = s[i + 2];
          d[o + 3] = 255;
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
      const o = (y * W + x) * 4;
      d[o] = c[0];
      d[o + 1] = c[1];
      d[o + 2] = c[2];
      d[o + 3] = 255;
    }
  }
  function seamStretch(src, a, b, kids, dst) {
    const SW = src.width, s = src.data;
    const ax0 = Math.max(0, Math.round(a.x0)), ay0 = Math.max(0, Math.round(a.y0));
    const w0 = Math.min(SW, Math.round(a.x1)) - ax0, h0 = Math.min(src.height, Math.round(a.y1)) - ay0;
    if (w0 < 4 || h0 < 4) return;
    const buf = new Uint8ClampedArray(w0 * h0 * 3);
    for (let y = 0; y < h0; y++) for (let x = 0; x < w0; x++) {
      const i = ((ay0 + y) * SW + ax0 + x) * 4, o = (y * w0 + x) * 3;
      buf[o] = s[i];
      buf[o + 1] = s[i + 1];
      buf[o + 2] = s[i + 2];
    }
    const inKid = new Uint8Array(w0 * h0);
    const rects = kids.map((k) => [Math.max(0, Math.floor(k.box.x0) - ax0 - 2), Math.max(0, Math.floor(k.box.y0) - ay0 - 2), Math.min(w0, Math.ceil(k.box.x1) - ax0 + 2), Math.min(h0, Math.ceil(k.box.y1) - ay0 + 2)]);
    for (const [x0, y0, x1, y1] of rects) for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) inKid[y * w0 + x] = 1;
    for (const [x0, y0, x1, y1] of rects) {
      const ring = [[], [], []];
      const take = (x, y) => {
        if (x < 0 || y < 0 || x >= w0 || y >= h0 || inKid[y * w0 + x]) return;
        const o = (y * w0 + x) * 3;
        ring[0].push(buf[o]);
        ring[1].push(buf[o + 1]);
        ring[2].push(buf[o + 2]);
      };
      for (let x = x0 - 1; x <= x1; x++) {
        take(x, y0 - 1);
        take(x, y1);
      }
      for (let y = y0; y < y1; y++) {
        take(x0 - 1, y);
        take(x1, y);
      }
      if (!ring[0].length) continue;
      const med = ring.map((c) => c.sort((p, q) => p - q)[c.length >> 1]);
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        const o = (y * w0 + x) * 3;
        buf[o] = med[0];
        buf[o + 1] = med[1];
        buf[o + 2] = med[2];
      }
    }
    const seam = (n, len, at) => {
      const lo = Math.min(n - 2, Math.max(1, Math.round(n * 0.2))), hi = Math.max(lo, Math.round(n * 0.8));
      let best = Math.round(n / 2), bs = Infinity;
      for (let k = lo; k <= hi; k++) {
        let sc = 0;
        for (let t = 0; t < len; t += 2) {
          const p = at(k, t), q = at(k - 1, t);
          sc += Math.max(Math.abs(buf[p] - buf[q]), Math.abs(buf[p + 1] - buf[q + 1]), Math.abs(buf[p + 2] - buf[q + 2]));
        }
        sc += Math.abs(k - n / 2) * 0.02;
        if (sc < bs) {
          bs = sc;
          best = k;
        }
      }
      return best;
    };
    const xs = seam(w0, h0, (x, y) => (y * w0 + x) * 3), ys = seam(h0, w0, (y, x) => (y * w0 + x) * 3);
    const W1 = Math.round(b.x1) - Math.round(b.x0), H12 = Math.round(b.y1) - Math.round(b.y0);
    const dW = W1 - w0, dH = H12 - h0;
    const mapX = (x) => x < xs ? x : dW >= 0 ? x < xs + dW ? xs : x - dW : Math.min(w0 - 1, x - dW);
    const mapY = (y) => y < ys ? y : dH >= 0 ? y < ys + dH ? ys : y - dH : Math.min(h0 - 1, y - dH);
    const DW = dst.width, DH = dst.height, d = dst.data, bx0 = Math.round(b.x0), by0 = Math.round(b.y0);
    for (let y = 0; y < H12; y++) {
      const Y = by0 + y;
      if (Y < 0 || Y >= DH) continue;
      const sy = Math.max(0, Math.min(h0 - 1, mapY(y)));
      for (let x = 0; x < W1; x++) {
        const X = bx0 + x;
        if (X < 0 || X >= DW) continue;
        const sx = Math.max(0, Math.min(w0 - 1, mapX(x)));
        const o = (Y * DW + X) * 4, i = (sy * w0 + sx) * 3;
        d[o] = buf[i];
        d[o + 1] = buf[i + 1];
        d[o + 2] = buf[i + 2];
        d[o + 3] = 255;
      }
    }
  }
  var newImage = (W, H) => typeof ImageData !== "undefined" ? new ImageData(W, H) : { width: W, height: H, data: new Uint8ClampedArray(W * H * 4) };
  function synthesize(seg, img, boxes, W1, H12) {
    const out = newImage(W1, H12);
    const ancestors = (n) => {
      const a = /* @__PURE__ */ new Set();
      for (let p = n.parent; p; p = p.parent) a.add(p);
      return a;
    };
    const overlapping = (n) => {
      const anc = ancestors(n), b0 = n.box;
      return seg.nodes.filter((m) => m !== n && !anc.has(m) && m.parent && (m.parent === n || !isDescendant(m, n)) && m.box.x1 > b0.x0 && m.box.x0 < b0.x1 && m.box.y1 > b0.y0 && m.box.y0 < b0.y1 && (m.parent === n || m.depth <= n.depth));
    };
    const isDescendant = (m, n) => {
      for (let p = m.parent; p; p = p.parent) if (p === n) return true;
      return false;
    };
    fillBox(out, 0, 0, W1, H12, seg.root.fill || seg.bg);
    seamStretch(img, seg.root.box, B(0, 0, W1, H12), seg.root.children, out);
    const draw = (nodes) => {
      const frames = nodes.filter(isBox), ink = nodes.filter((n) => !isBox(n));
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
        const scale = n.kind === "rule" || n.kind === "image";
        if (scale) blit(img, a.x0, a.y0, W_(a), H_(a), out, b.x0, b.y0, W_(b), H_(b), true);
        else blit(img, a.x0 - 1, a.y0 - 1, W_(a) + 2, H_(a) + 2, out, Math.round(b.x0) - 1, Math.round(b.y0) - 1, W_(a) + 2, H_(a) + 2, false);
      }
    };
    draw(seg.root.children);
    return out;
  }
  function frozenShare(a, b) {
    const key = (n) => `${n.kind}|${Math.round(n.box.x0 / 2)}|${Math.round(n.box.y0 / 2)}|${Math.round(W_(n.box) / 2)}|${Math.round(H_(n.box) / 2)}`;
    const set = new Set(a.nodes.map(key));
    const nb = b.nodes.filter((n) => n.depth <= 4);
    if (!nb.length) return 0;
    let same = 0;
    for (const n of nb) if (set.has(key(n))) same++;
    return same / nb.length;
  }

  // src/engine/index.js
  var geom = geom_exports;
  var color = color_exports;

  // src/presets/index.js
  var presets_exports = {};
  __export(presets_exports, {
    BUILDS: () => BUILDS,
    CATEGORIES: () => CATEGORIES,
    DESIGNS: () => DESIGNS,
    GALLERY: () => GALLERY,
    MAKERS: () => MAKERS,
    imageCopyHtml: () => imageCopyHtml
  });

  // src/design-kit/svg.js
  var KEBAB = /* @__PURE__ */ new Set([
    "strokeWidth",
    "strokeLinecap",
    "strokeLinejoin",
    "strokeDasharray",
    "strokeDashoffset",
    "strokeOpacity",
    "strokeMiterlimit",
    "fillOpacity",
    "fillRule",
    "clipRule",
    "clipPath",
    "stopColor",
    "stopOpacity",
    "floodOpacity",
    "floodColor",
    "colorInterpolationFilters",
    "fontFamily",
    "fontSize",
    "fontWeight",
    "textAnchor",
    "dominantBaseline",
    "letterSpacing",
    "vectorEffect",
    "shapeRendering",
    "mixBlendMode",
    "maskType"
  ]);
  var attrName = (k) => k === "className" ? "class" : KEBAB.has(k) ? k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase()) : k;
  var esc = (v) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  var flat = (arr) => {
    const out = [];
    const walk3 = (a) => {
      for (const x of a) {
        if (Array.isArray(x)) walk3(x);
        else if (x != null && x !== false && x !== true) out.push(x);
      }
    };
    walk3(arr);
    return out;
  };
  var num = (v) => {
    if (typeof v !== "number") return v;
    const r = Math.round(v * 100) / 100;
    return Object.is(r, -0) ? 0 : r;
  };
  function h(tag, props, ...children) {
    const kids = flat(children);
    if (typeof tag === "function") return tag({ ...props || {}, children: kids });
    let attrs = "";
    if (props) for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false || k === "children" || k === "key") continue;
      attrs += ` ${attrName(k)}="${esc(typeof v === "number" ? num(v) : v)}"`;
    }
    const inner = kids.join("");
    return inner ? `<${tag}${attrs}>${inner}</${tag}>` : `<${tag}${attrs}/>`;
  }
  var Fragment = ({ children }) => flat(children || []).join("");
  var escapeText = esc;
  var docSeq = 40;
  function doc(name, W, H) {
    const node = `${++docSeq}_${docSeq * 7 % 97}`;
    const defs = [];
    let nPaint = 0, nFilter = 0, nClip = 1;
    const clipId = `clip0_${node}`;
    const d = {
      W,
      H,
      name,
      node,
      linear(x1, y1, x2, y2, stops) {
        const id = `paint${nPaint++}_linear_${node}`;
        defs.push(`<linearGradient id="${id}" x1="${num(x1)}" y1="${num(y1)}" x2="${num(x2)}" y2="${num(y2)}" gradientUnits="userSpaceOnUse">` + stops.map(([o, c, a]) => `<stop${o ? ` offset="${num(o)}"` : ""} stop-color="${c}"${a != null && a !== 1 ? ` stop-opacity="${num(a)}"` : ""}/>`).join("") + "</linearGradient>");
        return `url(#${id})`;
      },
      radial(cx, cy, r, stops) {
        const id = `paint${nPaint++}_radial_${node}`;
        defs.push(`<radialGradient id="${id}" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(${num(cx)} ${num(cy)}) scale(${num(r)})">` + stops.map(([o, c, a]) => `<stop${o ? ` offset="${num(o)}"` : ""} stop-color="${c}"${a != null && a !== 1 ? ` stop-opacity="${num(a)}"` : ""}/>`).join("") + "</radialGradient>");
        return `url(#${id})`;
      },
      /* Figma drop shadow, exported as its usual flood/matrix/offset/blur/blend chain. */
      shadow(box2, layers) {
        const id = `filter${nFilter++}_d_${node}`;
        const ext = layers.reduce((m, l) => Math.max(m, (l.blur || 0) * 2 + Math.abs(l.dy || 0) + (l.spread || 0)), 0);
        const x = box2.x - ext, y = box2.y - ext, w = box2.w + 2 * ext, hh2 = box2.h + 2 * ext;
        let f = `<filter id="${id}" x="${num(x)}" y="${num(y)}" width="${num(w)}" height="${num(hh2)}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/>`;
        let prev = "BackgroundImageFix";
        layers.forEach((l, i) => {
          const [r, g, b] = hexRgb(l.color || "#101828");
          f += `<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>`;
          if (l.spread) f += `<feMorphology radius="${num(Math.abs(l.spread))}" operator="${l.spread > 0 ? "dilate" : "erode"}" in="SourceAlpha" result="effect${i + 1}_dropShadow_${node}"/>`;
          f += `<feOffset dy="${num(l.dy || 0)}"/>`;
          if (l.blur) f += `<feGaussianBlur stdDeviation="${num(l.blur / 2)}"/>`;
          f += `<feColorMatrix type="matrix" values="0 0 0 0 ${num(r / 255)} 0 0 0 0 ${num(g / 255)} 0 0 0 0 ${num(b / 255)} 0 0 0 ${num(l.opacity ?? 0.1)} 0"/>`;
          f += `<feBlend mode="normal" in2="${prev}" result="effect${i + 1}_dropShadow_${node}"/>`;
          prev = `effect${i + 1}_dropShadow_${node}`;
        });
        f += `<feBlend mode="normal" in="SourceGraphic" in2="${prev}" result="shape"/></filter>`;
        defs.push(f);
        return `url(#${id})`;
      },
      clip(box2, r = 0) {
        const id = `clip${nClip++}_${node}`;
        defs.push(`<clipPath id="${id}"><rect x="${num(box2.x)}" y="${num(box2.y)}" width="${num(box2.w)}" height="${num(box2.h)}"${r ? ` rx="${num(r)}"` : ""} fill="white"/></clipPath>`);
        return `url(#${id})`;
      },
      svg(content, bg = "#FFFFFF") {
        defs.push(`<clipPath id="${clipId}"><rect width="${W}" height="${H}" fill="white"/></clipPath>`);
        return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="${esc(name)}" clip-path="url(#${clipId})">
<rect width="${W}" height="${H}" fill="${bg}"/>
${content}
</g>
<defs>
${defs.join("\n")}
</defs>
</svg>
`;
      }
    };
    return d;
  }
  function hexRgb(hex2) {
    const h2 = hex2.replace("#", "");
    const v = h2.length === 3 ? h2.split("").map((c) => c + c).join("") : h2;
    return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
  }
  function mix(a, b, t) {
    const p = hexRgb(a), q = hexRgb(b);
    return "#" + p.map((v, i) => Math.round(v + (q[i] - v) * t).toString(16).padStart(2, "0")).join("").toUpperCase();
  }

  // src/design-kit/glyphs.js
  var glyphs_default = { "inter-400": { "upm": 2048, "asc": 1984, "desc": -494, "lineGap": 0, "typoAsc": 1984, "typoDesc": -494, "capH": 1490, "xH": 1118, "glyphs": { "0": [1292, "m646-20l0 0q-166 0-283 90q-117 90-179 261q-62 170-62 413l0 0q0 242 63 413q62 171 179 262q117 91 282 91l0 0q165 0 283-91q117-91 179-262q62-171 62-413l0 0q0-242-61-413q-62-171-179-261q-117-90-284-90zm0 166l0 0q109 0 185 71q76 71 116 205q40 133 40 322l0 0q0 190-40 325q-40 134-116 205q-76 71-185 71l0 0q-109 0-185-71q-76-72-116-206q-40-134-40-324l0 0q0-189 40-322q40-134 116-205q76-71 185-71z"], "1": [833, "m420 1490l233 0l0-1490l-187 0l0 1314l-10 0l-360-267l0 204l324 239z"], "2": [1249, "m1103 0l-949 0l0 137l495 537q83 90 138 158q55 68 83 130q28 61 28 130l0 0q0 78-37 135q-37 57-100 88q-63 30-143 30l0 0q-85 0-147-34q-63-35-97-97q-34-63-34-147l0 0l-182 0q0 132 61 232q61 100 166 156q105 55 238 55l0 0q133 0 236-55q102-56 161-150q58-94 58-211l0 0q0-81-29-157q-29-77-102-174q-73-97-205-237l0 0l-326-347l0-12l687 0l0-167z"], "3": [1265, "m635-20l0 0q-146 0-259 50q-113 50-179 139q-67 89-72 207l0 0l192 0q6-71 49-122q42-52 112-79q69-28 154-28l0 0q94 0 167 33q72 32 114 91q42 59 42 136l0 0q0 81-40 143q-41 61-118 96q-77 35-188 35l0 0l-121 0l0 165l121 0q87 0 154 32q66 31 103 88q37 57 37 134l0 0q0 74-32 129q-33 55-93 86q-60 30-141 30l0 0q-76 0-142-27q-67-28-109-79q-43-51-46-124l0 0l-183 0q4 117 70 206q66 89 175 139q108 50 239 50l0 0q139 0 240-56q100-56 154-147q54-91 54-197l0 0q0-126-66-214q-67-88-181-122l0 0l0-12q95-15 163-64q67-49 103-124q35-75 35-169l0 0q0-122-66-218q-66-96-181-151q-115-56-261-56z"], "4": [1323, "m821 303l-701 0l0 155l652 1032l231 0l0-1020l202 0l0-167l-202 0l0-303l-182 0l0 303zm-498 167l499 0l0 782l-12 0l-487-770l0-12z"], "5": [1215, "m596-20l0 0q-131 0-235 52q-104 51-166 141q-62 89-67 203l0 0l184 0q6-66 45-118q39-52 102-81q62-30 137-30l0 0q90 0 161 42q70 42 110 116q40 74 40 168l0 0q0 96-42 172q-42 76-114 120q-73 43-167 43l0 0q-69 0-140-22q-71-22-115-56l0 0l-178 22l88 738l784 0l0-167l-624 0l-51-435l8 0q46 38 116 63q70 24 147 24l0 0q102 0 189-37q86-37 150-104q64-68 100-159q35-91 35-199l0 0q0-143-64-255q-65-112-177-176q-112-65-256-65z"], "6": [1270, "m646-20l0 0q-93 0-186 34q-93 34-169 114q-77 80-123 217q-46 137-46 343l0 0q0 197 38 350q37 152 109 258q71 105 172 160q101 54 228 54l0 0q125 0 224-50q99-50 162-139q63-89 81-206l0 0l-186 0q-25 97-95 162q-70 65-186 65l0 0q-114 0-196-67q-83-67-127-193q-44-127-44-306l0 0l12 0q40 62 96 107q56 44 125 68q69 23 146 23l0 0q128 0 234-63q106-63 170-174q63-112 63-256l0 0q0-139-62-252q-62-114-175-181q-113-68-265-68zm0 167l0 0q90 0 162 45q72 45 114 121q42 75 42 168l0 0q0 91-40 166q-41 74-112 118q-71 44-161 44l0 0q-68 0-126-26q-59-27-103-73q-44-47-68-106q-25-60-25-125l0 0q0-88 41-163q41-76 113-122q72-47 163-47z"], "7": [1159, "m400 0l-200 0l662 1311l0 12l-764 0l0 167l963 0l0-177l-661-1313z"], "8": [1267, "m633-20l0 0q-151 0-266 54q-116 53-180 147q-65 94-65 215l0 0q0 94 38 175q38 80 104 134q66 54 149 69l0 0l0 8q-109 28-173 121q-64 93-64 211l0 0q0 114 59 204q59 89 162 141q103 51 236 51l0 0q131 0 234-51q103-52 163-141q59-90 59-204l0 0q0-118-64-211q-65-93-171-121l0 0l0-8q81-15 147-69q66-54 105-134q39-81 39-175l0 0q0-121-65-215q-66-94-181-147q-116-54-266-54zm0 165l0 0q99 0 171 33q72 32 112 91q39 58 39 137l0 0q0 83-42 147q-42 63-115 100q-73 36-165 36l0 0q-94 0-167-36q-73-37-115-100q-42-64-42-147l0 0q0-79 39-137q39-59 112-91q73-33 173-33zm0 703l0 0q79 0 140 32q61 31 97 88q35 57 35 132l0 0q0 75-34 130q-34 55-95 86q-62 30-143 30l0 0q-82 0-143-30q-62-31-96-86q-34-55-34-130l0 0q0-75 35-132q34-57 96-88q62-32 142-32z"], "9": [1270, "m603-20l0 0q-127 0-226 50q-99 50-162 140q-63 90-81 209l0 0l188 0q23-99 93-165q70-66 188-66l0 0q114 0 196 67q82 67 127 194q44 127 44 307l0 0l-12 0q-40-61-96-105q-56-45-124-69q-69-25-147-25l0 0q-128 0-235 64q-107 63-170 175q-64 111-64 254l0 0q0 139 63 254q63 114 177 182q113 67 266 64l0 0q92-1 184-35q92-35 168-114q76-79 122-215q46-136 46-342l0 0q0-198-37-351q-38-153-109-258q-71-106-172-160q-101-55-227-55zm16 703l0 0q68 0 127 27q59 27 103 74q44 46 69 106q25 59 25 125l0 0q0 86-41 161q-42 74-113 121q-72 46-164 46l0 0q-90 0-161-44q-72-45-114-120q-42-76-42-168l0 0q0-91 41-165q40-75 110-119q70-44 160-44z"], " ": [576, ""], "!": [589, "m383 479l-179 0l-12 1011l204 0l-13-1011zm-88-492l0 0q-56 0-95 40q-40 39-40 94l0 0q0 56 40 96q39 39 95 39l0 0q56 0 95-39q39-40 39-96l0 0q0-55-39-94q-39-40-95-40z"], '"': [954, "m382 923l-150 0l-22 567l194 0l-22-567zm340 0l-150 0l-22 567l194 0l-22-567z"], "#": [1297, "m864 0l-153 0l68 411l-372 0l-67-411l-151 0l67 411l-222 0l25 150l222 0l60 366l-219 0l25 152l219 0l67 411l151 0l-67-411l372 0l68 411l151 0l-67-411l220 0l-23-152l-222 0l-60-366l219 0l-25-150l-219 0l-67-411zm-372 927l-60-366l372 0l60 366l-372 0z"], "$": [1314, "m717-218l-120 0l0 194q-124 8-219 50l0 0q-119 52-186 146q-67 93-76 218l0 0l195 0q8-84 57-138q49-55 126-81l0 0q49-18 103-24l0 0l0 538l-59 17q-180 51-280 146q-100 95-100 243l0 0q0 126 68 221q68 94 184 146l0 0q86 38 187 48l0 0l0 202l120 0l0-199q118-7 213-51l0 0q113-52 179-141q65-90 69-203l0 0l-186 0q-13 109-104 169l0 0q-72 47-171 56l0 0l0-505l59-16q60-16 133-44q72-28 138-74q66-47 109-118q42-72 42-176l0 0q0-122-63-220q-64-98-185-155l0 0q-99-47-233-55l0 0l0-194zm0 869l0-504q66 7 122 30l0 0q80 33 127 93q47 60 47 139l0 0q0 72-40 117q-41 45-108 74q-67 29-147 51l0 0l-1 0zm-120 217l0 0l0 470q-55-8-101-27l0 0q-73-32-113-86q-40-55-40-125l0 0q0-78 49-125q48-48 115-74l0 0q48-20 90-33z"], "%": [2011, "m523 831l0 0q-95 0-160 42q-66 41-99 110q-34 69-34 151l0 0l0 78q0 82 34 151q34 68 100 110q65 41 159 41l0 0q96 0 161-41q64-42 97-110q33-69 33-151l0 0l0-78q0-82-33-151q-34-69-98-110q-65-42-160-42zm0 131l0 0q76 0 107 53q31 52 31 119l0 0l0 78q0 66-30 119q-30 53-108 53l0 0q-75 0-107-53q-33-53-33-119l0 0l0-78q0-67 32-119q31-53 108-53zm967-991l0 0q-95 0-160 42q-66 41-99 110q-34 69-34 151l0 0l0 78q0 82 34 151q34 68 100 110q65 41 159 41l0 0q96 0 161-41q65-42 98-110q32-69 32-151l0 0l0-78q0-82-33-151q-34-69-98-110q-65-42-160-42zm0 131l0 0q76 0 107 53q31 52 31 119l0 0l0 78q0 66-30 119q-30 53-108 53l0 0q-75 0-107-53q-33-53-33-119l0 0l0-78q0-67 32-119q31-53 108-53zm-917-102l-169 0l1024 1490l169 0l-1024-1490z"], "&": [1319, "m580-20l0 0q-147 0-254 55q-107 54-164 147q-58 92-58 207l0 0q0 98 40 169q40 71 111 132l0 0q64 56 144 116l0 0q-19 24-37 46l0 0q-64 76-100 151q-37 75-37 164l0 0q0 99 45 175q45 76 128 119q82 43 192 43l0 0q112 0 193-43q81-44 125-116q44-73 44-162l0 0q0-68-25-126q-26-58-70-107q-45-49-103-92l0 0l-108-80l319-387q12 24 23 51l0 0q38 96 38 216l0 0l173 0q0-148-34-243q-34-95-77-150l0 0q-5-6-10-12l0 0l209-253l-217 0l-103 124q-70-69-170-105l0 0q-110-39-217-39zm279 273l-352 422l-51-38q-92-68-129-126q-38-59-38-128l0 0q0-73 35-128q35-56 98-87q63-31 145-31l0 0q89 0 171 37l0 0q66 29 121 79l0 0zm-321 656l0 0l97 71q27 20 59 48q32 28 55 67q22 39 22 91l0 0q0 71-47 117q-48 46-129 46l0 0q-56 0-99-23q-43-23-66-63q-24-41-24-95l0 0q0-56 26-107q25-51 69-106l0 0q18-22 37-46z"], "'": [614, "m382 923l-150 0l-22 567l194 0l-22-567z"], "(": [747, "m218 607l0 0q0 163 34 342q33 178 91 344q58 165 133 288l0 0l175 0q-77-157-133-327q-57-170-87-335q-30-166-30-312l0 0q0-133 27-269q26-136 82-287q55-152 141-330l0 0l-175 0q-127 217-192 442q-66 225-66 444z"], ")": [747, "m271-279l-175 0q89 183 144 336q55 152 81 287q25 135 25 263l0 0q0 146-30 312q-30 165-86 335q-56 170-134 327l0 0l175 0q75-123 134-288q58-166 91-345q33-179 33-341l0 0q0-223-66-448q-67-225-192-438l0 0z"], "*": [1026, "m585 652l-144 0l13 317l-268-171l-72 126l282 146l-282 146l72 128l268-171l-13 317l144 0l-12-317l267 171l72-128l-282-146l282-146l-72-126l-267 171l12-317z"], "+": [1355, "m762 100l-169 0l0 404l-398 0l0 159l398 0l0 403l169 0l0-403l398 0l0-159l-398 0l0-404z"], ",": [590, "m266-359l-138 0l88 567l206 0l-156-567z"], "-": [942, "m144 719l654 0l0-166l-654 0l0 166z"], ".": [590, "m295-13l0 0q-56 0-95 40q-40 39-40 95l0 0q0 56 40 96q39 39 95 39l0 0q56 0 96-39q39-40 39-96l0 0q0-56-39-95q-40-40-96-40z"], "/": [738, "m526 1560l166 0l-480-1784l-166 0l480 1784z"], ":": [590, "m295-13l0 0q-56 0-95 40q-40 39-40 95l0 0q0 56 40 96q39 39 95 39l0 0q56 0 96-39q39-40 39-96l0 0q0-56-39-95q-40-40-96-40zm0 809l0 0q-56 0-95 40q-40 39-40 95l0 0q0 56 40 96q39 39 95 39l0 0q56 0 96-39q39-40 39-96l0 0q0-56-39-95q-40-40-96-40z"], ";": [618, "m266-359l-138 0l88 567l206 0l-156-567zm57 1155l0 0q-56 0-95 40q-40 39-40 95l0 0q0 56 40 96q39 39 95 39l0 0q56 0 96-39q39-40 39-96l0 0q0-56-39-95q-40-40-96-40z"], "<": [1355, "m1118 44l-944 476l0 126l944 476l0-196l-712-338l0-12l712-338l0-194z"], "=": [1355, "m1130 717l-904 0l0 166l904 0l0-166zm0-434l-904 0l0 166l904 0l0-166z"], ">": [1355, "m1181 646l0-126l-944-476l0 194l712 338l0 12l-712 338l0 196l944-476z"], "?": [1047, "m564 449l-181 0l0 11q0 137 27 212q26 74 76 118q50 43 119 84l0 0q66 40 111 102q45 61 45 148l0 0q0 70-32 121q-33 50-88 78q-55 28-123 28l0 0q-59 0-113-24q-55-25-91-77q-36-52-42-135l0 0l-190 0q5 126 65 214q59 88 156 135q97 46 215 46l0 0q130 0 226-50q95-51 148-140q53-89 53-203l0 0q0-121-53-207q-53-86-150-145l0 0q-64-39-103-75q-40-37-57-89q-18-52-18-141l0 0l0-11zm-88-462l0 0q-56 0-95 40q-40 39-40 94l0 0q0 56 40 96q39 39 95 39l0 0q56 0 95-39q39-40 39-96l0 0q0-55-39-94q-39-40-95-40z"], "@": [1978, "m1044-395l0 0q-223 0-395 61q-172 61-289 179q-118 117-178 289q-60 171-60 391l0 0q0 213 61 382q61 169 178 288q116 118 283 181q167 62 379 62l0 0q206 0 362-66q155-67 260-180q105-114 158-257q53-143 53-295l0 0q0-107-11-214q-11-108-45-197q-35-90-103-144q-69-55-185-55l0 0q-52 0-113 16q-61 16-107 53q-47 37-56 99l0 0l-8 0q-26-64-93-112q-67-49-180-49l0 0q-133 0-222 66q-90 66-135 179q-46 112-46 253l0 0q0 134 54 240q53 106 147 168q93 61 212 61l0 0q96 0 161-35q64-35 91-73l0 0l10 0l0 84l158 0l0-659q0-60 34-105q33-45 97-45l0 0q73 0 112 50q39 50 54 154q15 104 15 267l0 0q0 124-41 241q-42 116-126 209q-84 93-212 148q-128 54-301 54l0 0q-172 0-307-52q-135-53-229-153q-94-100-143-243q-49-144-49-326l0 0q0-184 49-327q49-144 146-242q97-99 239-150q142-51 328-51l0 0q80 0 157 15q76 15 136 34q60 18 89 28l0 0l43-140q-46-19-118-38q-73-19-155-31q-83-13-159-13zm-82 585l0 0q97 0 157 39q59 39 87 118q27 78 27 196l0 0q0 120-30 188q-30 67-89 95q-60 27-147 27l0 0q-82 0-140-42q-58-43-89-113q-31-71-31-155l0 0q0-92 25-173q25-81 81-130q56-50 149-50z"], "A": [1413, "m254 0l-202 0l541 1490l220 0l548-1490l-200 0l-149 416l-614 0l-144-416zm202 582l497 0l-108 302q-29 82-67 205l0 0q-32 101-76 249l0 0q-43-150-75-253l0 0q-40-125-66-201l0 0l-105-302z"], "B": [1340, "m725 0l-545 0l0 1490l528 0q156 0 258-53q101-54 151-143q49-90 49-199l0 0q0-96-34-158q-34-63-89-100q-56-37-121-55l0 0l0-14q70-4 140-48q69-44 116-125q46-81 46-198l0 0q0-112-51-202q-52-90-162-142q-110-53-286-53l0 0zm-355 676l0-508l350 0q174 0 248 67q73 67 73 164l0 0q0 75-38 138q-38 63-107 101q-70 38-166 38l0 0l-360 0zm0 646l0-486l328 0q80 0 145 32q65 31 103 89q38 57 38 134l0 0q0 97-67 164q-68 67-213 67l0 0l-334 0z"], "C": [1496, "m783-20l0 0q-191 0-340 93q-150 92-235 264q-86 171-86 407l0 0q0 237 86 409q85 171 235 264q149 93 340 93l0 0q113 0 214-33q100-33 180-96q80-64 134-154q53-91 73-206l0 0l-190 0q-16 77-54 135q-39 58-94 98q-56 40-123 60q-67 20-140 20l0 0q-134 0-242-68q-108-68-171-199q-63-132-63-323l0 0q0-190 64-321q63-132 171-199q108-68 241-68l0 0q73 0 140 21q67 20 123 60q55 39 94 98q38 58 54 134l0 0l190 0q-19-114-72-204q-54-90-134-154q-80-64-180-97q-101-34-215-34z"], "D": [1478, "m645 0l0 0l-465 0l0 1490l484 0q218 0 373-89q154-89 237-255q82-167 82-398l0 0q0-233-83-400q-83-168-242-258q-159-90-386-90zm-275 1322l0-1154l263 0q182 0 302 70q119 69 178 199q59 130 59 311l0 0q0 179-58 308q-59 128-174 197q-116 69-289 69l0 0l-281 0z"], "E": [1231, "m1097 0l-917 0l0 1490l908 0l0-168l-718 0l0-486l669 0l0-168l-669 0l0-500l727 0l0-168z"], "F": [1209, "m370 0l-190 0l0 1490l901 0l0-168l-711 0l0-510l643 0l0-168l-643 0l0-644z"], "G": [1528, "m789-20l0 0q-199 0-349 93q-150 93-234 265q-84 171-84 406l0 0q0 237 84 409q84 171 232 264q148 93 339 93l0 0q118 0 221-35q102-35 183-100q81-65 135-154q53-90 73-198l0 0l-196 0q-23 72-61 129q-38 57-90 98q-53 41-119 63q-66 21-145 21l0 0q-131 0-238-67q-107-68-170-199q-63-132-63-324l0 0q0-190 64-321q63-131 172-199q109-68 246-68l0 0q126 0 222 54q96 53 150 152l0 0q51 94 53 221l0 0l-386 0l0 166l572 0l0-163q0-185-79-321q-79-136-216-210q-138-75-316-75z"], "H": [1522, "m370 0l-190 0l0 1490l190 0l0-644l782 0l0 644l190 0l0-1490l-190 0l0 678l-782 0l0-678z"], "I": [550, "m180 1490l190 0l0-1490l-190 0l0 1490z"], "J": [1169, "m545-20l0 0q-197 0-321 116q-124 116-124 330l0 0l0 80l190 0l0-80q0-136 70-207q70-72 185-72l0 0q114 0 184 72q70 71 70 207l0 0l0 1064l190 0l0-1064q0-214-123-330q-124-116-321-116z"], "K": [1376, "m370 0l-190 0l0 1490l190 0l0-510l-3-274q23 29 45 57l0 0q50 64 103 125q53 61 109 121l0 0l445 481l249 0l-602-645l603-845l-225 0l-509 716l-215-227l0-489z"], "L": [1158, "m1060 0l-880 0l0 1490l190 0l0-1322l690 0l0-168z"], "M": [1850, "m361 0l-181 0l0 1490l270 0l367-940q13-33 30-82q16-50 35-108q18-58 35-115l0 0q5-18 10-35l0 0q4 15 9 31l0 0q17 56 36 115q18 58 35 109q17 51 30 85l0 0l362 940l271 0l0-1490l-187 0l0 851q0 46 1 105q0 59 2 124q1 65 3 132l0 0q0 38 1 75l0 0q-13-42-27-85l0 0q-24-72-46-138q-23-67-43-122q-20-55-34-91l0 0l-333-851l-165 0l-338 851q-14 35-33 89q-19 53-41 119q-23 65-47 138l0 0q-14 43-29 87l0 0q1-31 2-63l0 0q1-65 2-131q1-67 2-128q1-62 1-111l0 0l0-851z"], "N": [1543, "m371 0l-191 0l0 1490l224 0l606-953q24-37 58-95q34-58 74-131l0 0q22-41 43-85l0 0q-4 48-6 94l0 0q-4 78-5 144q-1 66-1 112l0 0l0 914l190 0l0-1490l-226 0l-540 848q-37 59-74 122q-38 62-86 148l0 0q-35 61-81 144l0 0q3-73 6-138l0 0q4-94 7-164q2-70 2-110l0 0l0-850z"], "O": [1566, "m784-20l0 0q-191 0-340 93q-150 92-236 264q-86 171-86 407l0 0q0 237 86 409q86 171 236 264q149 93 340 93l0 0q191 0 340-93q149-93 235-264q85-172 85-409l0 0q0-236-85-407q-86-172-235-264q-149-93-340-93zm0 176l0 0q133 0 241 68q107 67 171 199q63 131 63 321l0 0q0 192-63 324q-64 131-171 199q-108 67-241 67l0 0q-134 0-242-68q-108-68-171-199q-64-132-64-323l0 0q0-190 64-321q63-131 171-199q108-68 242-68z"], "P": [1308, "m370 0l-190 0l0 1490l510 0q174 0 287-63q112-64 167-171q54-107 54-240q0-133-54-241q-55-108-167-172q-112-64-286-64l0 0l-321 0l0-539zm0 1323l0-617l312 0q118 0 190 41q72 40 105 111q32 70 32 158q0 88-32 158q-33 69-105 109q-73 40-192 40l0 0l-310 0z"], "Q": [1566, "m784-20l0 0q-191 0-340 93q-150 92-236 264q-86 171-86 407l0 0q0 237 86 409q86 171 236 264q149 93 340 93q191 0 340-93q149-93 235-264q85-172 85-409l0 0q0-236-85-407l0 0q-68-136-175-222l0 0l192-255l-198 0l-129 173q-120-53-265-53zm154 202l-216 284l198 0l156-205q72 63 120 162l0 0q63 131 63 321l0 0q0 192-63 324q-64 131-171 199q-108 67-241 67l0 0q-134 0-242-68q-108-68-171-199q-64-132-64-323l0 0q0-190 64-321q63-131 171-199q108-68 242-68l0 0q82 0 154 26l0 0z"], "R": [1318, "m370 0l-190 0l0 1490l510 0q174 0 287-59q112-60 167-164q54-104 54-237q0-133-54-235q-55-102-167-159l0 0q-26-14-55-24l0 0l334-612l-220 0l-310 579q-17-1-35-1l0 0l-321 0l0-578zm0 1323l0-576l312 0q118 0 190 35q71 34 104 98q33 63 33 150l0 0q0 89-33 155q-33 65-105 102q-72 36-191 36l0 0l-310 0z"], "S": [1314, "m657-26l0 0q-161 0-279 52q-119 52-186 146q-67 93-76 218l0 0l195 0q8-84 57-138q49-55 126-81q76-27 163-27l0 0q101 0 182 33q80 33 127 93q47 60 47 139l0 0q0 72-40 117q-41 45-108 74q-67 29-147 51l0 0l-180 51q-180 51-280 146q-100 95-100 243l0 0q0 126 68 221q68 94 184 146q116 52 260 52l0 0q147 0 260-52q113-52 179-141q65-90 69-203l0 0l-186 0q-13 109-104 169q-91 59-224 59l0 0q-96 0-168-31q-73-32-113-86q-40-55-40-125l0 0q0-78 49-125q48-48 115-74q66-27 120-42l0 0l149-41q60-16 133-44q72-28 138-74q66-47 109-118q42-72 42-176l0 0q0-122-63-220q-64-98-185-155q-121-57-293-57z"], "T": [1322, "m567 1322l-469 0l0 168l1126 0l0-168l-467 0l0-1322l-190 0l0 1322z"], "U": [1524, "m763-24l0 0q-176 0-307 69q-132 69-204 189q-72 120-72 273l0 0l0 983l190 0l0-968q0-107 48-190q47-84 135-132q88-48 210-48l0 0q122 0 210 48q87 48 134 132q47 83 47 190l0 0l0 968l190 0l0-983q0-153-72-273q-72-120-202-189q-131-69-307-69z"], "V": [1413, "m819 0l-219 0l-548 1490l200 0l315-884q27-76 68-203l0 0q33-104 75-249l0 0q43 149 76 252l0 0q40 124 66 200l0 0l307 884l202 0l-542-1490z"], "W": [2018, "m680 0l-222 0l-406 1490l194 0l236-914q19-73 36-148q17-76 33-153l0 0q10-48 19-97l0 0q9 49 19 97l0 0q16 77 34 153q18 75 37 148l0 0l241 914l216 0l239-914q20-73 38-148q17-76 34-153l0 0q10-45 19-91l0 0q9 46 18 91l0 0q16 77 34 153q18 75 36 148l0 0l235 914l196 0l-408-1490l-221 0l-256 944q-25 92-48 201l0 0q-13 60-25 131l0 0q-12-64-23-120l0 0q-21-106-50-212l0 0l-255-944z"], "X": [1397, "m273 0l-216 0l534 763l-501 727l220 0l215-316q48-70 79-118q30-48 56-94l0 0q18-34 41-78l0 0q22 43 41 77l0 0q25 46 57 95q31 48 79 118l0 0l219 316l215 0l-501-720l529-770l-219 0l-261 378q-42 62-71 107q-29 44-54 89l0 0q-17 29-36 66l0 0q-18-35-34-63l0 0q-26-45-55-90q-30-46-74-109l0 0l-263-378z"], "Y": [1390, "m790 0l-190 0l0 610l-548 880l220 0l295-481q50-81 89-154l0 0q20-39 41-89l0 0q21 52 42 92l0 0q39 74 86 151l0 0l294 481l219 0l-548-880l0-610z"], "Z": [1288, "m1166 0l-1036 0l0 134l666 991q45 67 96 135l0 0q26 33 51 67l0 0q-56-3-113-3l0 0q-93-2-185-2l0 0l-523 0l0 168l1036 0l0-136l-656-975q-48-71-101-142l0 0q-29-37-57-74l0 0q57 3 113 4l0 0q91 1 183 1l0 0l526 0l0-168z"], "[": [747, "m624-279l-398 0l0 1860l398 0l0-153l-226 0l0-1554l226 0l0-153z"], "\\": [738, "m692-224l-166 0l-480 1784l166 0l480-1784z"], "]": [747, "m521-279l-398 0l0 153l226 0l0 1554l-226 0l0 153l398 0l0-1860z"], "^": [965, "m261 814l-179 0l301 629l199 0l301-629l-177 0l-217 471l-13 0l-215-471z"], "_": [934, "m0 0l934 0l0-166l-934 0l0 166z"], "`": [661, "m491 1264l-148 0l-193 294l201 0l140-294z"], "a": [1150, "m471-26l0 0q-106 0-192 40q-87 40-138 117q-51 77-51 187l0 0q0 96 38 156q38 60 102 95q63 34 140 51q77 17 155 27l0 0q100 13 163 20q63 7 94 24q30 17 30 58l0 0l0 6q0 70-26 119q-26 48-78 74q-52 26-130 26l0 0q-80 0-137-25q-57-25-92-62q-36-38-54-77l0 0l-173 57q43 102 116 160q73 57 161 81q88 24 174 24l0 0q56 0 128-13q71-14 138-54q66-40 110-118q43-79 43-210l0 0l0-737l-177 0l0 152l-12 0q-19-39-61-80q-42-42-109-70q-67-28-162-28zm31 159l0 0q100 0 169 39q69 39 105 102q36 62 36 130l0 0l0 155q-11-13-48-23q-37-11-84-19q-48-8-92-13q-45-6-71-9l0 0q-65-8-121-27q-57-20-91-57q-34-38-34-102l0 0q0-58 30-97q30-39 82-59q52-20 119-20z"], "b": [1254, "m677-24l0 0q-106 0-171 37q-65 36-100 83q-35 46-54 77l0 0l-20 0l0-173l-174 0l0 1490l180 0l0-551l14 0q19 30 53 76q34 45 98 81q64 36 173 36l0 0q140 0 247-70q106-70 167-199q60-130 60-307l0 0q0-178-60-308q-60-130-166-201q-107-71-247-71zm-27 161l0 0q105 0 176 57q70 56 106 152q35 95 35 212l0 0q0 116-35 210q-35 93-105 148q-71 55-177 55l0 0q-103 0-173-52q-70-52-105-144q-36-93-36-217l0 0q0-124 36-219q36-95 107-148q70-54 171-54z"], "c": [1170, "m613-24l0 0q-152 0-266 72q-115 72-179 202q-64 130-64 302l0 0q0 175 64 306q64 130 179 202q114 72 266 72l0 0q81 0 153-21q72-21 132-60q59-40 102-97q43-58 66-131l0 0l-173-49q-12 43-37 79q-25 36-60 63q-36 26-82 41q-46 14-101 14l0 0q-112 0-184-58q-72-59-107-154q-35-95-35-207l0 0q0-110 35-204q35-95 107-153q72-58 184-58l0 0q56 0 103 15q47 15 84 43q36 27 61 65q25 38 37 83l0 0l172-49q-22-75-65-133q-44-59-104-100q-60-42-133-63q-73-22-155-22z"], "d": [1254, "m577-24l0 0q-139 0-246 71q-107 71-167 201q-60 130-60 308l0 0q0 177 61 307q60 129 167 199q107 70 246 70l0 0q109 0 173-36q64-36 99-81q34-46 52-76l0 0l14 0l0 551l180 0l0-1490l-174 0l0 173l-20 0q-18-31-53-77q-36-47-100-83q-65-37-172-37zm27 161l0 0q102 0 172 54q70 53 106 148q36 95 36 219l0 0q0 124-35 217q-36 92-106 144q-70 52-173 52l0 0q-106 0-176-55q-71-55-106-148q-35-94-35-210l0 0q0-117 36-212q35-96 106-152q71-57 175-57z"], "e": [1194, "m628-24l0 0q-162 0-279 72q-118 72-181 201q-64 129-64 301q0 172 62 303q62 131 176 205q113 74 265 74l0 0q89 0 176-29q86-30 157-95q70-66 112-173q42-107 42-262l0 0l0-75l-808 0q4-108 43-186l0 0q43-87 121-131q77-45 179-45l0 0q66 0 120 19q54 19 93 58q39 38 60 95l0 0l174-48q-26-84-88-148q-62-64-153-100q-92-36-207-36zm-341 674l0 0l624 0q-7 76-32 140l0 0q-35 85-103 134q-68 48-169 48q-101 0-173-49q-72-50-110-129l0 0q-32-68-37-144z"], "f": [758, "m420 1118l258 0l0-154l-258 0l0-964l-180 0l0 964l-220 0l0 154l220 0l0 149q0 97 46 162q45 65 118 98q73 33 154 33l0 0q64 0 106-10q42-11 62-20l0 0l-50-154q-14 5-36 11q-23 6-61 6l0 0q-83 0-121-42q-38-43-38-124l0 0l0-109z"], "g": [1256, "m611-442l0 0q-124 0-214 32q-91 31-151 83q-60 52-95 113l0 0l146 94q24-32 60-71q35-39 96-66q60-28 158-28l0 0q134 0 221 64q86 64 86 202l0 0l0 224l-17 0q-19-32-53-76q-35-44-99-77q-65-34-173-34l0 0q-134 0-241 64q-107 63-169 185q-62 122-62 297l0 0q0 173 61 301q61 127 169 197q107 70 246 70l0 0q108 0 173-35q64-36 99-82q35-46 54-76l0 0l17 0l0 179l175 0l0-1147q0-144-65-235q-65-92-175-135q-111-43-247-43zm-5 620l0 0q102 0 172 47q70 46 106 134q36 87 36 209l0 0q0 119-35 210q-36 90-106 142q-70 51-173 51l0 0q-106 0-177-54q-71-55-106-146q-36-91-36-203l0 0q0-115 36-203q36-88 107-137q71-50 176-50z"], "h": [1211, "m338 670l0 0l0-670l-180 0l0 1490l180 0l0-565q46 95 115 142l0 0q94 65 221 65l0 0q113 0 199-46q85-47 133-140q47-94 47-236l0 0l0-710l-181 0l0 695q0 129-67 202q-68 73-185 73l0 0q-80 0-144-35q-64-35-101-102q-37-67-37-163z"], "i": [496, "m338 0l-180 0l0 1118l180 0l0-1118zm-89 1301l0 0q-51 0-88 35q-37 35-37 84l0 0q0 50 37 85q37 34 88 34l0 0q52 0 89-34q37-35 37-85l0 0q0-49-37-84q-37-35-89-35z"], "j": [496, "m157-80l0 1198l181 0l0-1198q1-106-36-182q-37-76-110-116q-73-40-182-40l0 0l-36 0l0 166l33 0q78 0 114 45q36 44 36 127l0 0zm91 1381l0 0q-51 0-88 35q-37 35-37 84l0 0q0 50 37 85q37 34 88 34l0 0q52 0 89-34q37-35 37-85l0 0q0-49-37-84q-37-35-89-35z"], "k": [1124, "m338 0l-180 0l0 1490l180 0l0-865l22 0l478 493l223 0l-468-480l503-638l-231 0l-409 523l-118-111l0-412z"], "l": [496, "m158 1490l180 0l0-1490l-180 0l0 1490z"], "m": [1794, "m338 0l-180 0l0 1118l175 0l1-205q22 62 59 106l0 0q49 59 116 89q66 30 138 30l0 0q122 0 198-75l0 0q61-61 87-152l0 0q21 56 59 100l0 0q53 61 129 94q75 33 164 33l0 0q97 0 177-42q80-42 128-127q47-85 47-215l0 0l0-754l-180 0l0 749q0 121-68 173q-68 52-158 52l0 0q-75 0-129-31q-55-32-84-87q-30-55-30-126l0 0l0-730l-180 0l0 767q0 93-62 150q-62 57-157 57l0 0q-65 0-122-30q-58-31-93-91q-35-60-35-149l0 0l0-704z"], "n": [1210, "m338 670l0 0l0-670l-180 0l0 1118l173 0l1-207q47 105 121 156l0 0q94 65 221 65l0 0q113 0 198-46q85-47 133-140q47-94 47-236l0 0l0-710l-180 0l0 695q0 129-67 202q-68 73-185 73l0 0q-80 0-144-35q-64-35-101-102q-37-67-37-163z"], "o": [1228, "m613-24l0 0q-152 0-266 72q-115 72-179 202q-64 130-64 302l0 0q0 175 64 306q64 130 179 202q114 72 266 72l0 0q153 0 268-72q115-72 179-202q64-131 64-306l0 0q0-172-64-302q-64-130-179-202q-115-72-268-72zm0 161l0 0q113 0 186 58q73 58 108 153q35 94 35 204l0 0q0 111-35 207q-35 95-108 154q-73 58-186 58l0 0q-112 0-184-58q-72-59-107-154q-35-95-35-207l0 0q0-110 35-204q35-95 107-153q72-58 184-58z"], "p": [1254, "m338-418l-180 0l0 1536l174 0l0-179l20 0q19 30 53 76q34 45 98 81q64 36 173 36l0 0q140 0 247-70q106-70 167-199q60-130 60-307l0 0q0-178-60-308q-60-130-166-201q-107-71-247-71l0 0q-106 0-171 37q-65 36-100 83q-35 46-54 77l0 0l-14 0l0-591zm312 555l0 0q105 0 176 57q70 56 106 152q35 95 35 212l0 0q0 116-35 210q-35 93-105 148q-71 55-177 55l0 0q-103 0-173-52q-70-52-105-144q-36-93-36-217l0 0q0-124 36-219q36-95 107-148q70-54 171-54z"], "q": [1254, "m1096 1118l0-1536l-180 0l0 591l-14 0q-18-31-53-77q-36-47-100-83q-65-37-172-37l0 0q-139 0-246 71q-107 71-167 201q-60 130-60 308l0 0q0 177 61 307q60 129 167 199q107 70 246 70l0 0q109 0 173-36q64-36 99-81q34-46 52-76l0 0l20 0l0 179l174 0zm-492-981l0 0q102 0 172 54q70 53 106 148q36 95 36 219l0 0q0 124-35 217q-36 92-106 144q-70 52-173 52l0 0q-106 0-176-55q-71-55-106-148q-35-94-35-210l0 0q0-117 36-212q35-96 106-152q71-57 175-57z"], "r": [771, "m338 0l-180 0l0 1118l174 0l0-172l12 0q31 85 111 137q79 51 179 51l0 0q20 0 48-1q27-1 43-2l0 0l0-181q-8 2-40 6q-32 4-68 4l0 0q-80 0-143-33q-64-34-100-92q-36-59-36-135l0 0l0-700z"], "s": [1081, "m538-24l0 0q-115 0-204 34q-90 33-148 99q-58 66-78 162l0 0l171 41q24-92 91-135q66-43 166-43l0 0q117 0 187 50q69 50 69 119l0 0q0 58-40 97q-41 38-124 57l0 0l-186 44q-152 36-226 112q-74 75-74 193l0 0q0 96 54 170q54 73 148 115q93 41 212 41l0 0q115 0 196-34q80-35 131-95q50-61 75-140l0 0l-163-42q-23 60-76 109q-54 49-162 49l0 0q-100 0-166-46q-67-46-67-116l0 0q0-62 45-99q45-38 143-61l0 0l169-40q152-36 225-111q73-76 73-191l0 0q0-98-55-174q-56-77-155-121q-100-44-231-44z"], "t": [670, "m368 1118l230 0l0-154l-230 0l0-674q0-75 31-109q30-35 101-35l0 0q17 0 44 4q26 4 48 8l0 0l37-152q-28-10-63-15q-36-5-71-5l0 0q-145 0-226 77q-81 76-81 213l0 0l0 688l-168 0l0 154l168 0l0 266l180 0l0-266z"], "u": [1211, "m537-14l0 0q-113 0-198 47q-86 46-133 140q-48 94-48 235l0 0l0 710l180 0l0-695q0-129 68-202q68-73 185-73l0 0q80 0 144 35q63 35 100 103q37 67 37 162l0 0l0 670l181 0l0-1118l-174 0l0 209q-48-109-123-159l0 0q-96-64-219-64z"], "v": [1151, "m670 0l-189 0l-427 1118l197 0l238-663q38-103 65-205l0 0q11-43 22-85l0 0q11 42 23 85l0 0q26 102 63 205l0 0l238 663l197 0l-427-1118z"], "w": [1676, "m588 0l-179 0l-339 1118l191 0l136-488q28-100 60-226l0 0q24-96 48-210l0 0q22 109 45 203l0 0q31 127 60 233l0 0l134 488l192 0l132-488q28-103 59-229l0 0q22-95 45-205l0 0q23 109 47 203l0 0q31 126 60 231l0 0l136 488l191 0l-339-1118l-179 0l-145 506q-22 77-43 157q-21 80-41 164l0 0q-10 43-21 87l0 0q-10-43-20-86l0 0q-21-85-42-166q-21-81-43-156l0 0l-145-506z"], "x": [1118, "m273 0l-208 0l393 574l-370 544l210 0l139-217q54-84 94-157l0 0q16-31 34-62l0 0q16 31 32 62l0 0q35 73 90 157l0 0l142 217l206 0l-374-554l392-564l-209 0l-164 251q-53 82-91 153l0 0q-16 28-32 55l0 0q-15-27-29-55l0 0q-35-71-89-153l0 0l-166-251z"], "y": [1151, "m140-405l0 0l46 156l19-5q55-14 100-7q45 6 81 44q36 38 63 118l0 0l32 93l-427 1124l197 0l238-663q38-104 64-206l0 0q11-42 22-84l0 0q11 42 23 85l0 0q26 102 63 205l0 0l240 663l196 0l-491-1285q-34-89-81-146q-48-58-111-85q-63-28-142-28l0 0q-48 0-83 7q-35 7-49 14z"], "z": [1131, "m1005 0l-879 0l0 134l627 806l0 11l-607 0l0 167l839 0l0-143l-609-797l0-11l629 0l0-167z"], "{": [873, "m750-130l0-149q-107 0-181 23q-75 22-120 70q-46 47-66 121q-21 74-21 177l0 0l0 228q0 119-48 170l0 0q-41 44-137 50l0 0l-33 0l0 182l33 0q96 6 137 50l0 0q48 50 48 168l0 0l0 230q0 102 21 176q20 74 66 122q45 47 120 70q74 23 181 23l0 0l0-151q-127 1-174-57q-48-59-48-186l0 0l0-286q0-57-15-103q-15-47-56-81q-41-34-116-52l0 0q-9-3-18-4l0 0l0-20q9-2 18-4l0 0q75-19 116-53q41-35 56-82q15-47 15-103l0 0l0-284q0-127 48-186q47-59 174-59l0 0z"], "|": [681, "m262 1970l157 0l0-2450l-157 0l0 2450z"], "}": [873, "m123-279l0 0l0 149q128 0 175 59q47 59 47 186l0 0l0 284q0 56 15 103q15 47 56 82q41 34 117 53l0 0q7 2 16 4l0 0l0 20q-9 2-16 4l0 0q-76 18-117 52q-41 34-56 81q-15 46-15 103l0 0l0 286q0 126-47 185q-47 58-175 58l0 0l0 151q107 0 181-23q74-23 120-70q45-48 66-122q20-74 20-176l0 0l0-230q0-118 49-168l0 0q47-50 164-51l0 0l6 0l0-180q-123-1-171-52q-48-51-48-169l0 0l0-228q0-103-20-177q-21-74-66-121q-46-48-120-70q-74-23-181-23z"], "~": [1355, "m332 439l-164 0q-2 124 40 199q41 75 109 109q67 33 141 33l0 0q74 0 135-31q61-31 142-102l0 0q53-46 85-65q32-19 70-19l0 0q62 0 98 45q35 45 35 132l0 0l164 0q2-123-40-198q-42-75-109-108q-67-34-141-34l0 0q-76 0-138 33q-62 32-139 99l0 0q-54 47-85 66q-32 18-70 18l0 0q-58 0-96-41q-38-41-37-136l0 0z"], "·": [590, "m295 573l0 0q-56 0-95 40q-40 39-40 95l0 0q0 56 40 96q39 39 95 39l0 0q56 0 96-39q39-40 39-96l0 0q0-56-39-95q-40-40-96-40z"], "•": [1152, "m576 274l0 0q-88 0-161 43q-73 43-116 116q-43 73-43 161l0 0q0 89 43 162q43 72 116 115q73 43 161 43l0 0q89 0 162-43q72-43 115-115q43-73 43-162l0 0q0-88-43-161q-43-73-115-116q-73-43-162-43z"], "—": [2048, "m0 719l2048 0l0-166l-2048 0l0 166z"], "–": [1024, "m0 719l1024 0l0-166l-1024 0l0 166z"], "’": [534, "m298 923l-138 0l88 567l206 0l-156-567z"], "‘": [534, "m366 923l-206 0l156 567l138 0l-88-567z"], "“": [902, "m366 923l-206 0l156 567l138 0l-88-567zm368 0l-206 0l156 567l138 0l-88-567z"], "”": [902, "m298 923l-138 0l88 567l206 0l-156-567zm368 0l-138 0l88 567l206 0l-156-567z"], "…": [1770, "m295-13l0 0q-56 0-95 40q-40 39-40 95l0 0q0 56 40 96q39 39 95 39l0 0q56 0 96-39q39-40 39-96l0 0q0-56-39-95q-40-40-96-40zm590 0l0 0q-56 0-95 40q-40 39-40 95l0 0q0 56 40 96q39 39 95 39l0 0q56 0 96-39q39-40 39-96l0 0q0-56-39-95q-40-40-96-40zm590 0l0 0q-56 0-95 40q-40 39-40 95l0 0q0 56 40 96q39 39 95 39l0 0q56 0 96-39q39-40 39-96l0 0q0-56-39-95q-40-40-96-40z"], "×": [1355, "m1150 228l-116-116l-354 354l-354-354l-116 116l354 354l-354 354l116 118l354-355l354 355l116-118l-354-354l354-354z"], "±": [1355, "m594 658l-388 0l0 168l388 0l0 295l169 0l0-295l387 0l0-168l-387 0l0-294l-169 0l0 294zm556-589l-944 0l0 168l944 0l0-168z"], "©": [1872, "m512 744l0 0q0 120 58 218q58 98 157 156q98 58 217 58l0 0q104 0 192-44q87-45 145-121q57-76 71-173l0 0l-176 0q-15 74-81 122q-67 48-151 48l0 0q-72 0-132-35q-60-36-96-96q-36-60-36-133l0 0q0-72 36-131q36-60 96-95q60-36 132-36l0 0q84 0 143 48q58 47 73 122l0 0l176 0q-13-97-67-174q-54-77-137-121q-84-45-188-45l0 0q-119 0-217 59q-99 58-157 156q-58 98-58 217zm424-767l0 0q-159 0-298 60q-139 59-245 165q-106 106-165 245q-60 139-60 298l0 0q0 159 60 298q59 139 165 245q106 106 245 166q139 59 298 59l0 0q159 0 298-59q139-60 245-166q106-106 166-245q59-139 59-298l0 0q0-159-59-298q-60-139-166-245q-106-106-245-165q-139-60-298-60zm0 174l0 0q123 0 231 46q107 46 189 128q82 82 128 190q46 107 46 230l0 0q0 123-46 231q-46 107-128 189q-82 82-189 128q-108 46-231 46l0 0q-123 0-230-46q-108-46-190-128q-82-82-128-189q-46-108-46-231l0 0q0-123 46-230q46-108 128-190q82-82 190-128q107-46 230-46z"], "®": [1364, "m682 346l0 0q-120 0-225 46q-106 45-186 125q-80 80-125 186q-46 105-46 225q0 120 46 226q45 105 125 185q80 80 186 126q105 45 225 45l0 0q121 0 227-45q105-46 185-126q80-80 125-185q45-106 45-226q0-120-45-225q-45-106-125-186q-80-80-185-125q-106-46-227-46zm0 141l0 0q122 0 222 60q100 59 160 159q59 100 59 222q0 122-59 222q-60 100-160 160q-100 59-222 59l0 0q-121 0-221-59q-101-60-160-160q-60-100-60-222q0-122 60-222q59-100 160-159q100-60 221-60zm256 174l-132 0l-94 182l-115 0l0-182l-120 0l0 536l272 0q34 0 73-18q39-19 67-56q27-38 27-96l0 0q0-59-28-100l0 0q-25-37-59-57l0 0l109-209zm-341 449l0-178l108 0q25 0 53 24q27 23 27 71q0 48-28 66q-28 17-50 17l0 0l-110 0z"], "™": [1251, "m903 954l-52 0l-159 361l0-361l-95 0l0 536l116 0l163-391l164 391l117 0l0-536l-97 0l0 360l-157-360zm-562 0l-97 0l0 452l-162 0l0 84l421 0l0-84l-162 0l0-452z"], "€": [1365, "m441 963l629 0l-68-145l-581 0q-2-36-2-74l0 0q0-37 2-72l0 0l522 0l-67-147l-434 0q13-56 33-103l0 0q56-132 153-199q97-67 219-67l0 0q65 0 122 17q56 17 105 46q49 29 90 63l0 0l75-157q-76-72-178-108q-102-37-214-37l0 0q-179 0-318 93q-139 92-217 264l0 0q-40 86-60 188l0 0l-200 0l53 147l130 0q-2 35-2 72l0 0q0 38 2 74l0 0l-183 0l53 145l147 0q20 103 60 190l0 0q78 171 217 264q139 93 318 93l0 0q113 0 214-38q101-39 182-115l0 0l-73-159q-44 40-94 71q-51 30-108 48q-57 17-121 17l0 0q-122 0-219-67q-97-68-153-199l0 0q-21-48-34-105l0 0z"], "£": [1251, "m880 0l-770 0l0 167q89 0 128 51q38 51 35 148l0 0l-9 304l-154 0l0 150l149 0l-7 230q-4 131 51 235q54 104 157 165q103 60 245 60l0 0q114 0 206-46q91-46 151-129q59-84 76-197l0 0l-173-28q-19 107-85 170q-67 63-174 63l0 0q-95 0-157-38q-62-39-91-104q-29-65-27-146l0 0l7-235l483 0l0-150l-478 0l9-297q2-67-24-112q-26-46-68-74l0 0q-17-11-35-20l0 0l561 0q46 0 65 20q19 19 19 64l0 0l0 62l169 0l0-47q0-133-62-199q-63-67-197-67l0 0z"], "°": [933, "m468 829l0 0q-93 0-169 45q-77 45-123 122q-46 76-46 168l0 0q0 93 46 170q46 77 123 123q76 45 169 45l0 0q92 0 168-45q76-46 122-123q45-77 45-170l0 0q0-92-45-168q-46-77-122-122q-76-45-168-45zm0 150l0 0q51 0 93 25q42 25 67 67q25 42 25 93l0 0q0 52-25 94q-25 42-67 68q-42 25-93 25l0 0q-52 0-94-25q-43-26-68-68q-25-42-25-94l0 0q0-51 25-93q25-42 68-67q42-25 94-25z"], "−": [1355, "m210 669l937 0l0-172l-937 0l0 172z"], "↑": [1708, "m318 746l-116 116l652 652l652-652l-116-116l-210 211q-51 52-107 117q-56 65-108 131l0 0q-30 37-56 70l0 0q7-32 12-64l0 0q7-42 12-83q4-42 4-84l0 0l0-1044l-166 0l0 1044q0 42 5 84q4 41 12 83l0 0q5 31 11 63l0 0q-14-18-30-38l0 0q-37-47-78-97q-42-50-83-96q-42-47-80-86l0 0l-210-211z"], "↓": [1708, "m1390 744l116-116l-652-652l-652 652l116 116l210-211q51-51 108-116q56-66 108-131l0 0q30-37 55-70l0 0q-6 32-11 65l0 0q-8 41-12 83q-5 41-5 82l0 0l0 1044l166 0l0-1044q0-41-4-82q-5-42-12-83l0 0q-5-32-12-65l0 0q14 19 30 39l0 0q37 46 79 96q41 50 83 97q41 46 79 85l0 0l210 211z"] }, "kern": { "24": -32, "41": -40, "70": -32, "73": -34, "74": -119, "75": -20, "76": -32, "77": 40, "78": -29, "79": -20, "97": -40, '"&': -69, '",': -168, '".': -168, '"4': -128, '"…': -168, "%’": -139, "%‘": -128, "%“": -128, "%”": -139, '&"': -69, "&'": -69, "&\\": -128, "&‘": -186, "&“": -186, "&®": -46, "&™": -81, "'&": -69, "',": -168, "'.": -168, "'4": -128, "'…": -168, ")‘": -69, ")“": -69, "*&": -69, "*,": -279, "*.": -279, "*4": -93, "*@": -23, "*_": -139, "*…": -279, "*©": -23, "+2": -69, "+3": -23, "+7": -46, "+\\": -104, "+‘": -128, "+“": -128, ',"': -168, ",'": -168, ",0": -52, ",1": -177, ",3": -55, ",5": -29, ",6": -52, ",7": -29, ",8": -46, ",9": -14, ",?": -180, ",@": -90, ",’": -116, ",”": -116, ",©": -90, "-2": -69, "-3": -23, "-7": -46, "-\\": -104, "-‘": -128, "-“": -128, '."': -168, ".'": -168, ".0": -52, ".1": -177, ".3": -55, ".5": -29, ".6": -52, ".7": -29, ".8": -46, ".9": -14, ".?": -180, ".@": -90, ".’": -116, ".”": -116, ".©": -90, "/,": -81, "/.": -81, "/…": -81, "0,": -52, "0.": -52, "07": -40, "0\\": -20, "0_": -93, "0‘": -93, "0“": -93, "0…": -52, "3*": -30, "3,": -46, "3.": -46, "3^": -30, "3…": -46, "3°": -30, "4*": -40, "4,": -69, "4.": -69, "4^": -40, "4…": -69, "4®": -11, "4°": -40, "5,": -55, "5.": -55, "5…": -55, "5®": -11, "6,": -69, "6.": -69, "6_": -93, "6…": -69, "7#": -116, "7&": -93, "7,": -256, "7.": -256, "7:": -69, "7;": -69, "7<": -186, "7_": -325, "7…": -256, "8*": -30, "8,": -46, "8.": -46, "8^": -30, "8…": -46, "8°": -30, "9,": -52, "9.": -52, "9\\": -20, "9_": -93, "9‘": -93, "9“": -93, "9…": -52, ":\\": -128, ":‘": -93, ":“": -93, ";\\": -128, ";‘": -93, ";“": -93, "=\\": -139, "=‘": -116, "=“": -116, ">7": -151, ">\\": -151, ">‘": -197, ">“": -197, "@,": -90, "@.": -90, "@/": -81, "@\\": -69, "@_": -81, "@‘": -69, "@“": -69, "@…": -90, "@®": -11, '\\"': -162, "\\'": -162, "\\*": -162, "\\+": -69, "\\-": -69, "\\/": 40, "\\1": -69, "\\=": -104, "\\?": -128, "\\@": -70, "\\\\": -100, "\\^": -162, "\\~": -69, "\\·": -69, "\\•": -69, "\\’": -116, "\\‘": -87, "\\“": -87, "\\”": -116, "\\×": -69, "\\±": -104, "\\©": -70, "\\®": -145, "\\™": -151, "\\°": -162, "\\−": -69, "]‘": -69, "]“": -69, "^&": -69, "^,": -279, "^.": -279, "^4": -93, "^@": -23, "^_": -139, "^…": -279, "^©": -23, "_*": -139, "_0": -93, "_1": -221, "_3": -93, "_4": -116, "_5": -93, "_6": -93, "_8": -93, "_9": -93, "_@": -81, "_\\": -162, "_^": -139, "_|": 69, "_‘": -81, "_“": -81, "_©": -81, "_°": -139, "}‘": -69, "}“": -69, "~2": -69, "~3": -23, "~7": -46, "~\\": -104, "~‘": -128, "~“": -128, "·2": -69, "·3": -23, "·7": -46, "·\\": -81, "·‘": -128, "·“": -128, "•\\": -81, "’#": -256, "’&": -139, "’+": -128, "’,": -203, "’-": -128, "’.": -203, "’/": -290, "’0": -93, "’4": -197, "’6": -93, "’7": -128, "’8": -81, "’:": -116, "’;": -116, "’<": -197, "’=": -116, "’@": -116, "’_": -81, "’~": -93, "’·": -128, "’…": -203, "’±": -116, "’©": -116, "’−": -128, "‘&": -128, "‘,": -174, "‘.": -174, "‘/": -197, "‘4": -128, "‘…": -174, "“&": -128, "“,": -174, "“.": -174, "“/": -197, "“4": -128, "“…": -174, "”#": -256, "”&": -139, "”+": -128, "”,": -203, "”-": -128, "”.": -203, "”/": -290, "”0": -93, "”4": -197, "”6": -93, "”7": -128, "”8": -81, "”:": -116, "”;": -116, "”<": -197, "”=": -116, "”@": -116, "”_": -81, "”~": -93, "”·": -128, "”…": -203, "”±": -116, "”©": -116, "”−": -128, '…"': -168, "…'": -168, "…0": -52, "…1": -177, "…3": -55, "…5": -29, "…6": -52, "…7": -29, "…8": -46, "…9": -14, "…?": -180, "…@": -90, "…’": -116, "…”": -116, "…©": -90, "×\\": -81, "±\\": -139, "±‘": -116, "±“": -116, "©,": -90, "©.": -90, "©/": -81, "©\\": -69, "©_": -81, "©‘": -69, "©“": -69, "©…": -90, "©®": -11, "®&": -69, "®4": -101, "®@": -11, "®©": -11, "™&": -81, "°&": -69, "°,": -279, "°.": -279, "°4": -93, "°@": -23, "°_": -139, "°…": -279, "°©": -23, "−2": -69, "−3": -23, "−7": -46, "−\\": -104, "−‘": -128, "−“": -128 } }, "inter-500": { "upm": 2048, "asc": 1984, "desc": -494, "lineGap": 0, "typoAsc": 1984, "typoDesc": -494, "capH": 1490, "xH": 1118, "glyphs": { "0": [1322, "m661-20l0 0q-174 0-296 90q-122 90-187 261q-65 170-65 413l0 0q0 242 65 413q65 171 188 262q122 91 295 91l0 0q172 0 295-91q123-91 188-262q65-171 65-413l0 0q0-242-64-413q-65-171-187-261q-123-90-297-90zm0 195l0 0q103 0 175 68q72 67 110 194q37 127 37 307l0 0q0 181-37 309q-38 128-110 196q-72 67-175 67l0 0q-103 0-175-68q-72-68-110-195q-38-128-38-309l0 0q0-180 38-307q38-127 110-194q72-68 175-68z"], "1": [850, "m421 1490l264 0l0-1490l-226 0l0 1283l-10 0l-354-258l0 229l326 236z"], "2": [1262, "m1128 0l-984 0l0 165l506 523q78 82 130 145q52 63 79 121q27 58 27 124l0 0q0 75-34 129q-35 54-94 83q-60 29-136 29l0 0q-79 0-138-32q-59-33-91-92q-32-59-32-139l0 0l-219 0q0 136 63 239q63 102 172 159q109 56 249 56l0 0q142 0 250-56q107-56 168-151q61-96 61-217l0 0q0-82-30-160q-31-78-107-176q-77-98-216-238l0 0l-292-305l0-12l668 0l0-195z"], "3": [1284, "m643-20l0 0q-151 0-268 52q-118 52-186 144q-69 92-73 214l0 0l231 0q5-66 45-114q39-48 104-74q65-26 145-26l0 0q88 0 155 30q67 30 106 85q38 54 38 126l0 0q0 75-38 132q-38 56-110 88q-72 32-175 32l0 0l-127 0l0 186l127 0q82 0 145 30q63 29 98 82q35 53 35 124l0 0q0 69-31 120q-31 51-87 80q-56 28-132 28l0 0q-72 0-134-26q-63-27-102-75q-39-48-42-116l0 0l-220 0q4 121 72 213q67 92 180 144q112 51 250 51l0 0q143 0 249-56q105-56 162-148q57-93 57-202l0 0q0-126-70-212q-70-87-187-118l0 0l0-11q99-15 169-63q70-49 106-123q36-74 36-168l0 0q0-123-68-220q-68-97-187-153q-120-56-273-56z"], "4": [1344, "m819 290l-705 0l0 184l642 1016l282 0l0-1006l196 0l0-194l-196 0l0-290l-219 0l0 290zm-467 194l469 0l0 735l-12 0l-457-723l0-12z"], "5": [1235, "m607-20l0 0q-139 0-248 53q-109 53-173 146q-65 93-70 211l0 0l222 0q5-63 42-112q37-50 97-78q59-28 130-28l0 0q85 0 151 39q66 39 104 109q37 69 37 158l0 0q0 90-39 162q-39 71-107 111q-68 40-156 40l0 0q-68 0-136-23q-68-24-109-61l0 0l-210 30l83 753l823 0l0-195l-632 0l-47-416l8 0q44 43 117 71q73 28 156 28l0 0q102 0 188-36q86-37 150-104q63-67 99-157q35-91 35-199l0 0q0-145-66-258q-66-114-182-179q-117-65-267-65z"], "6": [1290, "m659-20l0 0q-100 0-197 36q-98 35-176 117q-79 81-126 219q-47 138-47 343l0 0q0 194 39 345q39 151 113 256q74 105 178 160q104 54 235 54l0 0q132 0 236-52q103-53 169-145q65-92 81-211l0 0l-224 0q-23 91-89 150q-67 58-173 58l0 0q-109 0-186-64q-78-64-118-183q-41-120-41-289l0 0l11 0q38 63 94 109q56 45 127 69q70 24 148 24l0 0q130 0 235-62q105-63 168-174q62-111 62-253l0 0q0-143-65-258q-65-115-181-182q-117-67-273-67zm-1 192l0 0q85 0 152 42q67 42 107 113q39 70 39 157l0 0q0 86-38 156q-38 69-104 110q-67 41-152 41l0 0q-64 0-118-24q-55-25-96-68q-41-44-64-99q-23-56-23-118l0 0q0-83 39-153q38-71 106-114q67-43 152-43z"], "7": [1170, "m431 0l-239 0l648 1283l0 12l-750 0l0 195l989 0l0-203l-648-1287z"], "8": [1289, "m644-20l0 0q-156 0-276 54q-120 54-187 149q-68 94-68 214l0 0q0 94 40 174q39 80 107 134q68 53 154 68l0 0l0 8q-113 27-180 120q-67 92-67 212l0 0q0 114 62 204q61 90 169 142q107 51 246 51l0 0q137 0 245-51q108-52 170-142q62-90 62-204l0 0q0-120-68-212q-68-93-177-120l0 0l0-8q83-15 152-68q68-54 108-134q40-80 40-174l0 0q0-120-68-214q-68-95-188-149q-120-54-276-54zm0 185l0 0q92 0 159 31q67 31 104 87q37 55 37 129l0 0q0 77-39 137q-39 59-107 93q-68 34-154 34l0 0q-87 0-155-34q-68-34-107-93q-39-59-39-137l0 0q0-74 37-129q36-56 104-87q68-31 160-31zm0 692l0 0q74 0 131 30q57 29 91 83q33 53 33 122l0 0q0 70-32 122q-32 52-89 81q-58 28-134 28l0 0q-76 0-133-28q-58-29-90-81q-32-52-32-122l0 0q0-69 32-122q32-54 90-83q58-30 133-30z"], "9": [1290, "m614-21l0 0q-134 0-237 53q-104 52-169 146q-65 93-82 213l0 0l226 0q21-93 88-152q66-60 174-60l0 0q109 0 186 64q77 64 118 185q41 120 41 289l0 0l-11 0q-38-62-94-107q-56-45-126-70q-70-25-149-25l0 0q-130 0-236 63q-106 63-168 174q-62 111-62 252l0 0q0 143 65 259q65 115 183 183q117 67 274 65l0 0q99-1 196-37q96-36 175-116q78-81 125-218q47-138 47-344l0 0q0-194-39-346q-40-152-113-257q-74-105-178-159q-104-55-234-55zm14 721l0 0q64 0 119 25q55 25 96 69q41 43 65 99q23 55 23 118l0 0q0 81-39 151q-39 70-106 113q-67 43-153 43l0 0q-84 0-151-41q-68-42-107-112q-39-71-39-157l0 0q0-86 38-155q38-70 104-111q66-42 150-42z"], " ": [546, ""], "!": [623, "m417 477l-212 0l-16 1013l244 0l-16-1013zm-105-492l0 0q-63 0-106 42q-43 42-43 104l0 0q0 62 43 104q43 42 106 42l0 0q64 0 106-42q42-42 42-104l0 0q0-62-42-104q-42-42-106-42z"], '"': [1012, "m408 905l-176 0l-25 585l226 0l-25-585zm372 0l-176 0l-25 585l226 0l-25-585z"], "#": [1308, "m882 0l-178 0l66 398l-347 0l-65-398l-176 0l65 398l-217 0l30 176l216 0l56 341l-215 0l30 177l214 0l65 398l176 0l-65-398l347 0l66 398l176 0l-65-398l215 0l-28-177l-216 0l-56-341l214 0l-29-176l-214 0l-65-398zm-374 915l-56-341l347 0l56 341l-347 0z"], "$": [1323, "m725-212l-120 0l0 189q-130 8-230 51l0 0q-123 53-192 152q-70 98-77 234l0 0l229 0q7-81 53-134q45-53 118-79l0 0q47-17 99-23l0 0l0 490l-70 19q-183 49-285 145q-103 96-103 249l0 0q0 129 70 226q69 96 189 150l0 0q90 40 199 50l0 0l0 195l120 0l0-193q122-8 220-52l0 0q116-54 183-147q66-93 69-212l0 0l-222 0q-11 102-94 158l0 0q-65 43-156 53l0 0l0-460l63-17q71-18 147-48q75-31 139-79q64-49 104-120q39-72 39-173l0 0q0-126-65-225q-65-99-188-155l0 0q-102-47-239-55l0 0l0-189zm0 847l0-457q59 7 108 27l0 0q73 29 116 84q43 54 43 126l0 0q0 65-37 107q-38 41-101 69l0 0q-58 24-129 44l0 0zm-120 246l0 0l0 427q-50-7-91-24l0 0q-67-28-103-77q-37-50-37-113l0 0q0-71 44-114q43-44 106-69l0 0q41-18 81-30z"], "%": [2034, "m519 814l0 0q-99 0-166 43q-68 42-103 113q-35 71-35 155l0 0l0 78q0 85 36 156q35 70 103 113q68 42 165 42l0 0q99 0 166-42q67-43 102-113q34-71 34-156l0 0l0-78q0-85-35-155q-35-71-102-113q-67-43-165-43zm0 148l0 0q73 0 102 50q29 50 29 113l0 0l0 78q0 62-28 113q-28 51-103 51l0 0q-72 0-102-51q-30-51-30-113l0 0l0-78q0-63 30-113q29-50 102-50zm997-990l0 0q-98 0-166 43q-68 42-102 113q-35 71-35 155l0 0l0 78q0 85 35 156q35 70 103 113q68 42 165 42l0 0q100 0 168-42q67-43 101-113q34-71 34-156l0 0l0-78q0-84-35-155q-35-71-102-113q-67-43-166-43zm0 148l0 0q73 0 102 50q29 50 29 113l0 0l0 78q0 62-28 113q-28 51-103 51l0 0q-72 0-102-51q-30-51-30-113l0 0l0-78q0-63 30-113q29-50 102-50zm-925-120l-182 0l1024 1490l182 0l-1024-1490z"], "&": [1338, "m580-21l0 0q-150 0-258 55q-109 55-167 148q-59 93-59 208l0 0q0 96 39 166q38 70 107 130l0 0q63 55 143 113l0 0q-15 18-29 35l0 0q-62 75-98 153q-37 77-37 168l0 0q0 102 47 181q46 79 131 124q85 45 199 45l0 0q115 0 198-44q82-45 127-120q45-75 45-167l0 0q0-68-25-127q-25-59-69-109q-45-50-104-94l0 0l-102-75l297-354q13 25 24 52l0 0q37 95 37 212l0 0l199 0q0-144-32-243q-33-100-79-163l0 0q-7-9-14-18l0 0l214-255l-250 0l-100 117q-72-67-172-101l0 0q-108-37-212-37zm261 283l-333 390l-38-28q-82-60-117-114q-36-54-36-120l0 0q0-67 33-118q32-51 90-79q58-28 134-28l0 0q86 0 167 36l0 0q53 24 100 61l0 0zm-294 653l0 0l92 65q28 20 58 47q29 27 49 63q20 36 20 82l0 0q0 64-43 107q-44 42-121 42l0 0q-52 0-91-21q-40-21-61-58q-22-37-22-87l0 0q0-54 25-104q25-50 69-104l0 0q12-16 25-32z"], "'": [641, "m408 905l-176 0l-25 585l226 0l-25-585z"], "(": [755, "m202 607l0 0q0 164 34 343q33 178 91 344q58 165 133 287l0 0l209 0q-75-156-130-325q-55-170-84-336q-29-166-29-313l0 0q0-132 26-267q25-135 79-286q54-152 138-333l0 0l-209 0q-127 215-192 440q-66 225-66 446z"], ")": [755, "m296-279l-210 0q87 185 141 338q53 152 78 286q25 134 25 262l0 0q0 147-29 313q-30 166-84 336q-55 169-131 325l0 0l210 0q75-122 134-287q58-166 91-345q33-179 33-342l0 0q0-224-66-449q-67-225-192-437l0 0z"], "*": [1066, "m613 652l-160 0l15 306l-258-167l-81 140l274 139l-274 139l81 142l258-167l-15 306l160 0l-14-306l257 167l80-142l-273-139l273-139l-80-140l-257 167l14-306z"], "+": [1367, "m782 94l-197 0l0 400l-394 0l0 186l394 0l0 400l197 0l0-400l394 0l0-186l-394 0l0-400z"], ",": [621, "m285-371l-160 0l88 585l237 0l-165-585z"], "-": [947, "m143 723l662 0l0-190l-662 0l0 190z"], ".": [621, "m311-15l0 0q-62 0-105 43q-43 43-43 104l0 0q0 62 43 105q43 42 105 42l0 0q61 0 104-42q43-43 43-105l0 0q0-61-43-104q-43-43-104-43z"], "/": [757, "m520 1560l197 0l-480-1784l-197 0l480 1784z"], ":": [621, "m311-15l0 0q-62 0-105 43q-43 43-43 104l0 0q0 62 43 105q43 42 105 42l0 0q61 0 104-42q43-43 43-105l0 0q0-61-43-104q-43-43-104-43zm0 787l0 0q-62 0-105 43q-43 43-43 104l0 0q0 62 43 105q43 42 105 42l0 0q61 0 104-42q43-43 43-105l0 0q0-61-43-104q-43-43-104-43z"], ";": [646, "m285-371l-160 0l88 585l237 0l-165-585zm51 1143l0 0q-62 0-105 43q-43 43-43 104l0 0q0 62 43 105q43 42 105 42l0 0q61 0 104-42q43-43 43-105l0 0q0-61-43-104q-43-43-104-43z"], "<": [1367, "m1140 36l-969 468l0 166l969 469l0-227l-705-320l0-12l705-319l0-225z"], "=": [1367, "m1151 714l-935 0l0 195l935 0l0-195zm0-449l-935 0l0 195l935 0l0-195z"], ">": [1367, "m1195 670l0-166l-969-468l0 225l706 318l0 14l-706 319l0 227l969-469z"], "?": [1080, "m595 452l-210 0l0 15q0 134 26 208q25 74 73 118q47 43 113 83l0 0q67 41 112 99q45 58 45 140l0 0q0 64-29 111q-30 46-80 72q-51 25-113 25l0 0q-56 0-106-23q-51-23-84-71q-33-49-38-125l0 0l-223 0q4 133 66 223q61 90 162 137q101 46 223 46l0 0q135 0 235-49q100-50 157-139q56-90 56-208l0 0q0-123-55-209q-56-86-155-145l0 0q-62-38-101-73q-39-36-56-86q-18-50-18-134l0 0l0-15zm-103-467l0 0q-63 0-106 42q-43 42-43 104l0 0q0 62 43 104q43 42 106 42l0 0q64 0 107-42q42-42 42-104l0 0q0-62-42-104q-43-42-107-42z"], "@": [2012, "m1050-406l0 0q-225 0-399 62q-175 61-295 180q-120 119-181 292q-62 172-62 394l0 0q0 214 62 386q61 171 180 293q118 121 289 186q171 65 389 65l0 0q210 0 371-66q161-66 272-180q110-115 167-262q57-148 57-310l0 0q0-113-15-221q-15-108-54-194q-40-87-112-138q-72-52-187-52l0 0q-56 0-116 17q-60 16-104 53q-44 37-53 98l0 0l-8 0q-27-68-97-116q-71-48-186-48l0 0q-134 0-226 65q-92 65-139 178q-47 112-47 256l0 0q0 138 54 247q54 108 149 170q95 62 218 62l0 0q96 0 163-35q66-35 94-79l0 0l10 0l0 90l174 0l0-664q0-56 30-95q30-40 88-40l0 0q69 0 108 47q38 47 54 144q15 97 15 249l0 0q0 132-42 250q-42 117-126 208q-84 90-211 142q-127 52-299 52l0 0q-173 0-308-51q-136-52-229-150q-93-98-141-239q-49-141-49-319l0 0q0-181 49-321q48-141 144-237q96-96 237-146q140-50 324-50l0 0q81 0 157 14q76 14 137 33q60 18 93 30l0 0l55-162q-47-21-121-41q-74-21-161-34q-87-13-172-13zm-68 612l0 0q92 0 150 37q58 37 85 111q27 74 27 185l0 0q0 112-29 177q-29 64-87 92q-58 27-142 27l0 0q-80 0-136-40q-57-40-87-107q-30-67-30-149l0 0q0-89 26-165q25-76 80-122q54-46 143-46z"], "A": [1452, "m298 0l-247 0l530 1490l280 0l540-1490l-247 0l-137 393l-586 0l-133-393zm198 583l454 0l-86 246q-34 101-74 238l0 0q-32 106-70 244l0 0q-38-140-69-247l0 0q-41-139-72-235l0 0l-83-246z"], "B": [1345, "m738 0l-573 0l0 1490l549 0q159 0 263-52q104-52 155-140q51-89 51-199l0 0q0-93-34-156q-34-64-91-102q-58-39-127-57l0 0l0-15q75-3 146-47q71-45 118-125q46-81 46-196l0 0q0-113-53-204q-54-91-165-144q-111-53-285-53l0 0zm-345 669l0-473l322 0q160 0 230 62q70 62 70 154l0 0q0 72-35 130q-36 58-101 93q-65 34-155 34l0 0l-331 0zm0 626l0-450l299 0q75 0 136 29q61 29 96 82q35 53 35 124l0 0q0 92-64 154q-64 61-197 61l0 0l-305 0z"], "C": [1502, "m784-20l0 0q-193 0-345 92q-152 91-239 263q-87 171-87 409l0 0q0 239 87 411q87 171 239 263q152 92 345 92l0 0q118 0 222-34q103-34 185-99q81-65 135-158q53-93 72-211l0 0l-229 0q-14 71-49 126q-36 54-87 92q-51 38-114 57q-63 19-133 19l0 0q-128 0-229-64q-102-65-160-189q-58-125-58-305l0 0q0-180 59-304q59-125 160-188q101-64 228-64l0 0q70 0 133 20q62 19 114 57q51 37 87 92q35 55 49 125l0 0l230 0q-17-110-69-201q-52-92-133-160q-81-68-185-104q-105-37-228-37z"], "D": [1478, "m649 0l0 0l-484 0l0 1490l499 0q220 0 377-89q157-89 241-255q84-167 84-399l0 0q0-233-84-400q-85-167-245-257q-161-90-388-90zm-256 1290l0-1090l244 0q169 0 281 63q112 63 168 186q56 122 56 298l0 0q0 175-55 296q-56 121-165 184q-110 63-273 63l0 0l-256 0z"], "E": [1235, "m1109 0l-944 0l0 1490l938 0l0-196l-710 0l0-444l659 0l0-195l-659 0l0-459l716 0l0-196z"], "F": [1207, "m393 0l-228 0l0 1490l927 0l0-196l-699 0l0-479l632 0l0-195l-632 0l0-620z"], "G": [1531, "m791-20l0 0q-202 0-354 93q-153 93-238 265q-86 171-86 406l0 0q0 238 87 410q86 171 237 264q151 92 344 92l0 0q120 0 225-35q104-36 187-101q82-66 136-156q53-91 71-199l0 0l-234 0q-20 65-55 118q-35 52-83 89q-49 37-110 57q-62 19-135 19l0 0q-126 0-226-64q-101-64-159-188q-59-125-59-305q0-180 59-304q58-124 160-188q102-65 234-65l0 0q120 0 210 49q89 48 139 138l0 0q47 85 49 201l0 0l-365 0l0 188l588 0l0-171q0-188-80-325q-81-138-221-213q-140-75-321-75z"], "H": [1525, "m393 0l-228 0l0 1490l228 0l0-630l738 0l0 630l229 0l0-1490l-229 0l0 664l-738 0l0-664z"], "I": [558, "m165 1490l228 0l0-1490l-228 0l0 1490z"], "J": [1178, "m552-20l0 0q-208 0-335 118q-128 118-128 335l0 0l0 83l229 0l0-84q0-127 64-193q64-66 170-66l0 0q106 0 170 66q64 66 64 193l0 0l0 1058l227 0l0-1056q0-218-126-336q-126-118-335-118z"], "K": [1408, "m393 0l-228 0l0 1490l228 0l0-476l-4-298q18 25 36 49l0 0q48 66 101 130q53 64 113 132l0 0l418 463l290 0l-586-646l592-844l-270 0l-481 692l-209-225l0-467z"], "L": [1158, "m1068 0l-903 0l0 1490l228 0l0-1294l675 0l0-196z"], "M": [1869, "m387 0l-222 0l0 1490l336 0l325-855q14-38 32-96q17-58 36-126q19-68 36-134l0 0q3-13 6-25l0 0q3 11 6 22l0 0q17 65 36 133q19 68 37 128q18 60 32 98l0 0l320 855l338 0l0-1490l-227 0l0 802q0 46 1 110q1 64 3 136q1 71 3 144l0 0q0 39 1 76l0 0q-12-43-25-86l0 0q-24-78-46-150q-23-72-43-131q-21-60-35-99l0 0l-305-802l-195 0l-309 802q-15 38-34 97q-20 58-43 130q-23 71-47 149l0 0q-13 41-26 83l0 0q1-30 2-61l0 0q1-72 3-145q1-73 3-138q1-66 1-115l0 0l0-802z"], "N": [1549, "m396 0l-231 0l0 1490l263 0l561-887q28-44 63-105q35-61 74-137l0 0q21-41 41-86l0 0q-3 44-5 88l0 0q-5 83-7 156q-2 73-2 123l0 0l0 848l231 0l0-1490l-264 0l-503 793q-40 65-78 131q-39 66-85 153l0 0q-33 59-75 137l0 0q4-69 7-132l0 0q5-96 8-169q2-74 2-118l0 0l0-795z"], "O": [1570, "m786-20l0 0q-193 0-345 92q-153 91-240 263q-88 171-88 409l0 0q0 239 88 411q87 171 240 263q152 92 345 92l0 0q193 0 345-92q151-92 239-263q87-172 87-411l0 0q0-238-87-409q-88-172-239-263q-152-92-345-92zm0 208l0 0q127 0 228 64q100 63 159 188q58 124 58 304l0 0q0 182-58 307q-59 124-159 188q-101 63-228 63l0 0q-128 0-229-64q-101-64-159-188q-59-125-59-306l0 0q0-180 59-304q58-124 159-188q101-64 229-64z"], "P": [1314, "m393 0l-228 0l0 1490l534 0q172 0 287-64q115-64 172-173q57-109 57-247q0-138-57-247q-58-110-173-173q-115-64-288-64l0 0l-304 0l0-522zm0 1295l0-580l282 0q110 0 178 38q68 38 100 104q31 66 31 149l0 0q0 84-31 150q-32 65-100 102q-69 37-180 37l0 0l-280 0z"], "Q": [1574, "m786-20l0 0q-193 0-345 92q-153 91-240 263q-88 171-88 409l0 0q0 239 88 411q87 171 240 263q152 92 345 92q193 0 345-92q151-92 239-263q87-172 87-411l0 0q0-238-87-409l0 0q-65-126-163-209l0 0l199-261l-227 0l-127 166q-121-51-266-51zm135 228l-208 273l219 0l141-183q60 56 100 142l0 0q58 124 58 304l0 0q0 182-58 307q-59 124-159 188q-101 63-228 63l0 0q-128 0-229-64q-101-64-159-188q-59-125-59-306l0 0q0-180 59-304q58-124 159-188q101-64 229-64l0 0q72 0 135 20l0 0z"], "R": [1327, "m393 0l-228 0l0 1490l534 0q172 0 287-59q115-60 172-166q57-106 57-243l0 0q0-138-57-241q-58-104-173-161l0 0q-20-10-42-18l0 0l328-602l-259 0l-302 563q-6 0-13 0l0 0l-304 0l0-563zm0 1295l0-537l282 0q110 0 178 32q67 31 99 90q32 59 32 142l0 0q0 84-32 145q-32 61-100 95q-68 33-179 33l0 0l-280 0z"], "S": [1323, "m665-25l0 0q-167 0-290 53q-123 53-192 152q-70 98-77 234l0 0l229 0q7-81 53-134q45-53 118-79q73-26 158-26l0 0q95 0 169 30q73 29 116 84q43 54 43 126l0 0q0 65-37 107q-38 41-101 69q-64 27-145 48l0 0l-174 48q-183 49-285 145q-103 96-103 249l0 0q0 129 70 226q69 96 189 150q119 53 269 53l0 0q153 0 270-53q116-54 183-147q66-93 69-212l0 0l-222 0q-11 102-94 158q-84 56-211 56l0 0q-90 0-156-28q-67-28-103-77q-37-50-37-113l0 0q0-71 44-114q43-44 106-69q62-26 119-41l0 0l145-38q71-18 147-48q75-31 139-79q64-49 104-120q39-72 39-173l0 0q0-126-65-225q-65-99-188-155q-124-57-299-57z"], "T": [1337, "m555 1294l-465 0l0 196l1157 0l0-196l-463 0l0-1294l-229 0l0 1294z"], "U": [1516, "m759-23l0 0q-179 0-313 69q-134 69-207 190q-74 120-74 276l0 0l0 978l228 0l0-959q0-101 45-179q44-78 126-123q82-45 195-45l0 0q112 0 194 45q81 45 125 123q44 78 44 179l0 0l0 959l229 0l0-978q0-156-73-276q-74-121-207-190q-134-69-312-69z"], "V": [1452, "m869 0l-279 0l-539 1490l246 0l290-829q32-96 74-235l0 0q31-107 70-243l0 0q38 139 70 245l0 0q40 137 71 233l0 0l282 829l247 0l-532-1490z"], "W": [2054, "m719 0l-264 0l-404 1490l240 0l215-854q20-79 37-164q17-85 34-172l0 0q7-40 14-81l0 0q8 41 16 81l0 0q17 87 35 172q18 85 39 164l0 0l221 854l250 0l219-854q21-79 39-164q18-85 36-172l0 0q7-39 15-77l0 0l14 77q16 87 35 172q18 85 36 164l0 0l215 854l242 0l-406-1490l-263 0l-237 883q-27 104-50 226l0 0q-11 57-22 118l0 0q-9-56-18-109l0 0q-21-119-52-235l0 0l-236-883z"], "X": [1435, "m317 0l-262 0l535 763l-497 727l265 0l197-294q48-70 78-121q30-51 55-99l0 0q15-29 32-62l0 0q17 33 33 61l0 0q25 48 56 100q31 51 78 121l0 0l201 294l259 0l-495-720l528-770l-266 0l-243 356q-42 62-70 107q-28 44-51 87l0 0q-15 27-32 59l0 0q-16-31-31-57l0 0q-24-43-52-88q-28-45-72-108l0 0l-246-356z"], "Y": [1426, "m828 0l-228 0l0 593l-549 897l266 0l280-475q47-78 83-150l0 0q18-37 36-82l0 0q19 47 38 85l0 0q35 72 79 147l0 0l277 475l265 0l-547-897l0-593z"], "Z": [1312, "m1193 0l-1068 0l0 150l645 945q49 71 106 142l0 0q24 31 49 62l0 0q-53-3-105-3l0 0q-96-2-190-2l0 0l-511 0l0 196l1068 0l0-152l-635-929q-52-75-110-149l0 0q-27-35-55-69l0 0q54 3 107 4l0 0q96 1 192 1l0 0l507 0l0-196z"], "[": [755, "m639-279l-428 0l0 1860l428 0l0-178l-217 0l0-1504l217 0l0-178z"], "\\": [757, "m717-224l-197 0l-480 1784l197 0l480-1784z"], "]": [755, "m544-279l-428 0l0 178l217 0l0 1504l-217 0l0 178l428 0l0-1860z"], "^": [976, "m274 814l-196 0l303 633l214 0l303-633l-195 0l-209 460l-12 0l-208-460z"], "_": [948, "m0 0l948 0l0-188l-948 0l0 188z"], "`": [690, "m520 1263l-169 0l-197 299l226 0l140-299z"], "a": [1163, "m461-25l0 0q-106 0-192 40q-86 39-136 115q-50 76-50 186l0 0q0 95 37 156q36 61 99 97q62 36 139 54q76 18 155 27l0 0q99 12 161 20q62 7 92 25q29 17 29 56l0 0l0 6q0 63-24 106q-24 43-71 67q-48 23-119 23l0 0q-73 0-125-22q-53-23-85-58q-33-35-49-73l0 0l-207 54q38 100 109 161q71 61 163 89q92 28 190 28l0 0q68 0 144-16q76-16 143-58q67-42 109-118q42-76 42-198l0 0l0-742l-213 0l0 153l-11 0q-22-43-65-84q-43-41-108-67q-66-27-157-27zm49 177l0 0q90 0 154 35q64 35 98 93q34 58 34 123l0 0l0 143q-12-12-45-21q-34-10-77-17q-43-8-83-13q-40-5-66-8l0 0q-62-8-113-27q-52-19-82-54q-31-35-31-93l0 0q0-53 28-89q27-36 74-54q47-18 109-18z"], "b": [1266, "m703-22l0 0q-101 0-165 35q-65 34-101 80q-37 46-57 82l0 0l-18 0l0-175l-214 0l0 1490l220 0l0-554l12 0q20 35 56 81q35 46 99 81q63 34 168 34l0 0q134 0 240-68q105-68 166-197q61-129 61-311l0 0q0-180-60-309q-60-130-165-199q-106-70-242-70zm-49 187l0 0q96 0 161 52q65 52 98 141q32 89 32 200l0 0q0 110-32 198q-33 87-97 138q-65 51-162 51l0 0q-94 0-159-48q-65-49-98-135q-33-87-33-204l0 0q0-116 34-204q33-89 98-139q65-50 158-50z"], "c": [1182, "m618-23l0 0q-158 0-275 72q-117 72-182 202q-65 130-65 302l0 0q0 174 65 305q65 130 182 202q117 72 275 72l0 0q87 0 163-22q76-23 138-65q61-43 104-104q42-62 63-139l0 0l-209-50q-11 43-34 79q-23 35-55 61q-33 26-75 40q-43 14-94 14l0 0q-101 0-167-53q-67-54-99-143q-33-89-33-197l0 0q0-107 33-195q32-89 99-142q66-53 167-53l0 0q52 0 95 15q43 14 77 41q34 26 57 64q23 37 33 82l0 0l208-50q-20-79-63-141q-43-63-104-107q-62-44-139-67q-77-23-165-23z"], "d": [1266, "m564-22l0 0q-136 0-242 70q-106 69-166 199q-60 129-60 309l0 0q0 182 61 311q61 129 167 197q106 68 240 68l0 0q104 0 168-34q63-35 99-81q36-46 55-81l0 0l12 0l0 554l220 0l0-1490l-214 0l0 175l-18 0q-19-36-56-82q-37-46-101-80q-64-35-165-35zm48 187l0 0q94 0 159 50q64 50 98 139q33 88 33 204l0 0q0 117-33 204q-33 86-97 135q-65 48-160 48l0 0q-97 0-161-51q-65-51-97-138q-33-88-33-198l0 0q0-111 33-200q33-89 98-141q65-52 160-52z"], "e": [1203, "m630-23l0 0q-165 0-285 71q-120 71-184 200q-65 129-65 303l0 0q0 172 64 303q63 131 179 205q116 73 272 73l0 0q96 0 185-31q89-32 160-99q71-67 113-173q41-107 41-259l0 0l0-78l-793 0q4-101 40-172l0 0q39-80 110-120q71-41 165-41l0 0q62 0 112 18q50 17 87 53q36 35 55 87l0 0l207-49q-27-86-90-152q-64-66-158-102q-95-37-215-37zm-312 679l0 0l574 0q-7 70-30 128l0 0q-32 78-94 122q-63 44-157 44l0 0q-93 0-159-45q-66-45-100-118l0 0q-29-61-34-131z"], "f": [777, "m452 1118l250 0l0-179l-250 0l0-939l-220 0l0 939l-212 0l0 179l212 0l0 128q0 104 47 174q46 70 122 105q76 35 164 35l0 0q67 0 115-11q47-11 69-19l0 0l-51-178q-16 5-39 11q-24 5-59 5l0 0q-78 0-113-39q-35-39-35-113l0 0l0-98z"], "g": [1269, "m615-442l0 0q-129 0-224 33q-95 33-156 88q-62 55-94 122l0 0l184 87q20-32 54-67q33-36 90-61q57-25 146-25l0 0q128 0 208 61q79 60 79 189l0 0l0 218l-19 0q-20-37-55-80q-36-43-99-74q-64-32-166-32l0 0q-132 0-237 62q-106 62-168 184q-62 122-62 300l0 0q0 178 62 306q61 127 168 195q106 68 240 68l0 0q103 0 168-34q64-34 101-80q36-47 55-82l0 0l16 0l0 182l215 0l0-1134q0-147-66-241q-67-95-181-140q-115-45-259-45zm-1 642l0 0q94 0 159 44q64 43 97 126q33 82 33 196l0 0q0 113-33 198q-33 85-97 133q-65 48-159 48l0 0q-97 0-162-50q-65-51-98-136q-33-86-33-193l0 0q0-109 33-191q33-83 99-129q65-46 161-46z"], "h": [1232, "m368 662l0 0l0-662l-220 0l0 1490l218 0l0-572q45 94 113 145l0 0q93 69 225 69l0 0q114 0 200-48q85-48 133-141q47-94 47-233l0 0l0-710l-220 0l0 683q0 121-63 189q-63 68-173 68l0 0q-74 0-133-32q-59-33-93-95q-34-62-34-151z"], "i": [516, "m368 0l-220 0l0 1118l220 0l0-1118zm-109 1289l0 0q-57 0-97 38q-41 38-41 92l0 0q0 55 41 93q40 38 97 38l0 0q57 0 98-38q41-38 41-93l0 0q0-54-41-92q-41-38-98-38z"], "j": [516, "m147-71l0 1189l221 0l0-1190q1-114-40-191q-42-77-122-116q-80-39-196-39l0 0l-44 0l0 189l35 0q78 0 112 41q34 40 34 117l0 0zm111 1360l0 0q-57 0-97 38q-41 38-41 92l0 0q0 55 41 93q40 38 97 38l0 0q57 0 98-38q41-38 41-93l0 0q0-54-41-92q-41-38-98-38z"], "k": [1145, "m368 0l-220 0l0 1490l220 0l0-844l20 0l441 472l264 0l-450-482l481-636l-272 0l-377 501l-107-107l0-394z"], "l": [516, "m148 1490l220 0l0-1490l-220 0l0 1490z"], "m": [1819, "m368 0l-220 0l0 1118l209 0l5-208q22 61 58 105l0 0q50 61 117 92q67 30 140 30l0 0q122 0 197-75l0 0q60-61 89-159l0 0q22 59 60 104l0 0q54 64 131 97q76 33 163 33l0 0q99 0 180-43q80-43 127-128q47-85 47-212l0 0l0-754l-220 0l0 732q0 112-62 162q-63 50-148 50l0 0q-69 0-119-29q-50-29-77-80q-27-52-27-119l0 0l0-716l-217 0l0 746q0 90-57 144q-58 54-147 54l0 0q-61 0-113-28q-53-29-84-84q-32-56-32-137l0 0l0-695z"], "n": [1232, "m368 662l0 0l0-662l-220 0l0 1118l210 0l2-214q46 105 119 159l0 0q93 69 225 69l0 0q114 0 199-48q85-48 133-141q48-94 48-233l0 0l0-710l-220 0l0 683q0 121-63 189q-63 68-173 68l0 0q-74 0-133-32q-59-33-93-95q-34-62-34-151z"], "o": [1237, "m618-23l0 0q-157 0-274 72q-118 72-183 202q-65 130-65 302l0 0q0 174 65 305q65 130 183 202q117 72 274 72l0 0q158 0 276-72q117-72 182-202q65-131 65-305l0 0q0-172-65-302q-65-130-182-202q-118-72-276-72zm0 186l0 0q102 0 169 54q66 53 99 142q32 88 32 194l0 0q0 107-32 197q-33 89-99 143q-67 53-169 53l0 0q-101 0-167-53q-66-54-98-143q-33-89-33-197l0 0q0-106 33-194q32-89 98-142q66-54 167-54z"], "p": [1266, "m368-418l-220 0l0 1536l214 0l0-182l18 0q20 35 56 81q35 46 99 81q63 34 168 34l0 0q134 0 240-68q105-68 166-197q61-129 61-311l0 0q0-180-60-309q-60-130-165-199q-106-70-242-70l0 0q-101 0-165 35q-65 34-101 80q-37 46-57 82l0 0l-12 0l0-593zm286 583l0 0q96 0 161 52q65 52 98 141q32 89 32 200l0 0q0 110-32 198q-33 87-97 138q-65 51-162 51l0 0q-94 0-159-48q-65-49-98-135q-33-87-33-204l0 0q0-116 34-204q33-89 98-139q65-50 158-50z"], "q": [1266, "m1118 1118l0-1536l-220 0l0 593l-12 0q-19-36-56-82q-37-46-101-80q-64-35-165-35l0 0q-136 0-242 70q-106 69-166 199q-60 129-60 309l0 0q0 182 61 311q61 129 167 197q106 68 240 68l0 0q104 0 168-34q63-35 99-81q36-46 55-81l0 0l18 0l0 182l214 0zm-506-953l0 0q94 0 159 50q64 50 98 139q33 88 33 204l0 0q0 117-33 204q-33 86-97 135q-65 48-160 48l0 0q-97 0-161-51q-65-51-97-138q-33-88-33-198l0 0q0-111 33-200q33-89 98-141q65-52 160-52z"], "r": [792, "m368 0l-220 0l0 1118l213 0l0-180l12 0q31 92 108 144q77 52 175 52l0 0q21 0 48-1q27-2 45-5l0 0l0-210q-12 4-46 8q-34 4-69 4l0 0q-76 0-137-32q-61-32-95-88q-34-57-34-131l0 0l0-679z"], "s": [1103, "m549-23l0 0q-121 0-215 35q-95 35-155 104q-61 68-81 167l0 0l207 43q23-87 86-129q63-42 160-42l0 0q106 0 169 45q63 44 63 106l0 0q0 54-38 89q-39 35-119 52l0 0l-188 43q-156 35-232 112q-76 77-76 197l0 0q0 100 56 175q56 75 153 117q97 41 224 41l0 0q121 0 207-35q86-35 140-98q53-63 76-146l0 0l-197-43q-21 59-73 104q-52 44-151 44l0 0q-91 0-152-41q-61-41-61-104l0 0q0-56 41-90q40-35 132-56l0 0l180-40q155-35 230-110q75-75 75-192l0 0q0-102-58-180q-59-79-162-123q-104-45-241-45z"], "t": [697, "m403 1118l223 0l0-179l-223 0l0-637q0-67 29-98q28-32 93-32l0 0q17 0 45 4q28 4 48 8l0 0l39-176q-35-12-75-17q-40-6-79-6l0 0q-152 0-236 79q-84 78-84 220l0 0l0 655l-163 0l0 179l163 0l0 266l220 0l0-266z"], "u": [1232, "m529-14l0 0q-114 0-200 48q-86 48-133 142q-48 94-48 232l0 0l0 710l220 0l0-683q0-121 64-189q63-68 172-68l0 0q75 0 134 33q58 32 92 95q34 62 34 150l0 0l0 662l220 0l0-1118l-210 0l-1 218q-46-109-122-164l0 0q-94-68-222-68z"], "v": [1177, "m708 0l-240 0l-422 1118l238 0l221-635q37-105 63-210l0 0q11-43 22-86l0 0q10 43 21 86l0 0q26 105 62 210l0 0l221 635l236 0l-422-1118z"], "w": [1698, "m614 0l-221 0l-336 1118l232 0l123-463q27-104 58-231l0 0q23-94 44-204l0 0q22 106 44 198l0 0q31 128 59 237l0 0l123 463l220 0l121-463q28-106 59-234l0 0q22-93 43-200l0 0q21 106 43 198l0 0q30 128 58 236l0 0l123 463l234 0l-337-1118l-221 0l-138 481q-21 73-41 153q-20 79-39 162l0 0q-8 35-16 70l0 0q-8-35-16-69l0 0q-20-84-40-164q-20-81-41-152l0 0l-138-481z"], "x": [1141, "m302 0l-245 0l382 574l-359 544l248 0l126-204q52-84 92-161l0 0q14-29 30-58l0 0q14 29 28 58l0 0q36 77 90 161l0 0l129 204l244 0l-364-552l381-566l-247 0l-150 238q-52 83-91 158l0 0q-14 27-28 53l0 0q-13-26-26-53l0 0q-36-75-88-158l0 0l-152-238z"], "y": [1178, "m133-402l0 0l54 179l25-6q57-15 103-8q45 7 79 43q33 35 53 107l0 0l24 82l-425 1123l238 0l221-635q37-106 62-211l0 0q9-41 19-82l0 0q11 41 22 83l0 0q26 105 63 210l0 0l225 635l236 0l-486-1273q-34-90-83-150q-50-60-118-90q-68-31-158-31l0 0q-52 0-93 8q-41 7-61 16z"], "z": [1145, "m1021 0l-897 0l0 150l602 766l0 10l-583 0l0 192l858 0l0-162l-579-754l0-10l599 0l0-192z"], "{": [902, "m786-104l0-175q-108 0-188 20q-80 20-132 66q-53 45-78 122q-26 76-26 188l0 0l0 210q0 117-48 168l0 0q-41 44-138 50l0 0l-33 0l0 212l33 0q97 6 138 50l0 0q48 50 48 166l0 0l0 212q0 112 26 188q25 76 78 122q52 45 132 66q80 20 188 20l0 0l0-176q-128 0-174-55q-46-56-46-177l0 0l0-263q0-57-16-105q-17-49-62-85q-45-36-128-56l0 0q-4-2-9-3l0 0l0-20q5-1 9-2l0 0q83-21 128-58q45-37 62-86q16-49 16-104l0 0l0-262q0-120 46-176q46-57 174-57l0 0z"], "|": [708, "m254 1970l199 0l0-2450l-199 0l0 2450z"], "}": [902, "m116-279l0 0l0 175q129 0 175 57q46 56 46 176l0 0l0 262q0 55 16 104q16 49 61 86q45 37 128 58l0 0q4 1 9 2l0 0l0 20q-5 1-9 3l0 0q-83 20-128 56q-45 36-61 85q-16 48-16 105l0 0l0 263q0 120-46 176q-46 56-175 56l0 0l0 176q108 0 188-20q79-21 132-66q52-46 78-122q25-76 25-188l0 0l0-212q0-116 49-166l0 0q48-50 165-51l0 0l6 0l0-210q-123-1-171-52q-49-51-49-167l0 0l0-210q0-112-25-188q-26-77-78-122q-53-46-132-66q-80-20-188-20z"], "~": [1367, "m351 428l-187 0q-2 128 39 210q40 81 109 119q69 38 150 38l0 0q72 0 134-30q61-30 142-101l0 0q49-43 80-62q31-19 69-19l0 0q59 0 94 44q35 43 34 130l0 0l187 0q3-128-38-209q-41-81-110-119q-69-39-149-39l0 0q-75 0-137 32q-63 32-140 98l0 0q-51 46-81 64q-30 18-68 18l0 0q-56 0-92-40q-37-41-36-134l0 0z"], "·": [621, "m311 560l0 0q-62 0-105 43q-43 43-43 104l0 0q0 62 43 105q43 42 105 42l0 0q61 0 104-42q43-43 43-105l0 0q0-61-43-104q-43-43-104-43z"], "•": [1092, "m546 274l0 0q-88 0-161 43q-73 43-116 116q-43 73-43 161l0 0q0 89 43 162q43 72 116 115q73 43 161 43l0 0q89 0 162-43q72-43 115-115q43-73 43-162l0 0q0-88-43-161q-43-73-115-116q-73-43-162-43z"], "—": [2048, "m0 723l2048 0l0-190l-2048 0l0 190z"], "–": [1024, "m0 723l1024 0l0-190l-1024 0l0 190z"], "’": [568, "m322 905l-160 0l88 585l237 0l-165-585z"], "‘": [568, "m399 905l-237 0l165 585l160 0l-88-585z"], "“": [970, "m399 905l-237 0l165 585l160 0l-88-585zm402 0l-237 0l165 585l160 0l-88-585z"], "”": [964, "m322 905l-160 0l88 585l237 0l-165-585zm396 0l-160 0l88 585l237 0l-165-585z"], "…": [1864, "m311-15l0 0q-62 0-105 43q-43 43-43 104l0 0q0 62 43 105q43 42 105 42l0 0q61 0 104-42q43-43 43-105l0 0q0-61-43-104q-43-43-104-43zm621 0l0 0q-62 0-105 43q-43 43-43 104l0 0q0 62 43 105q43 42 105 42l0 0q61 0 104-42q43-43 43-105l0 0q0-61-43-104q-43-43-104-43zm622 0l0 0q-62 0-105 43q-43 43-43 104l0 0q0 62 43 105q43 42 105 42l0 0q61 0 104-42q43-43 43-105l0 0q0-61-43-104q-43-43-104-43z"], "×": [1367, "m1174 237l-139-139l-349 349l-350-349l-139 139l349 349l-349 349l139 141l350-350l349 350l139-141l-349-349l349-349z"], "±": [1367, "m585 659l-386 0l0 190l386 0l0 282l198 0l0-282l385 0l0-190l-385 0l0-281l-198 0l0 281zm583-594l-969 0l0 192l969 0l0-192z"], "©": [1872, "m518 744l0 0q0 118 57 215q57 96 154 154q97 57 215 57l0 0q102 0 189-44q86-45 143-120q56-76 70-172l0 0l-188 0q-14 68-75 112q-62 44-139 44l0 0q-67 0-123-33q-56-33-89-89q-34-56-34-124l0 0q0-67 34-122q33-56 89-89q56-33 123-33l0 0q77 0 132 44q55 43 69 112l0 0l187 0q-12-96-65-172q-54-77-137-121q-84-44-186-44l0 0q-118 0-215 58q-97 57-154 154q-57 96-57 213zm418-767l0 0q-159 0-298 60q-139 59-245 165q-106 106-165 245q-60 139-60 298l0 0q0 159 60 298q59 139 165 245q106 106 245 166q139 59 298 59l0 0q159 0 298-59q139-60 245-166q106-106 166-245q59-139 59-298l0 0q0-159-59-298q-60-139-166-245q-106-106-245-165q-139-60-298-60zm0 195l0 0q119 0 223 45q103 44 182 123q79 79 124 183q44 103 44 222l0 0q0 119-44 223q-45 103-124 182q-79 79-182 124q-104 44-223 44l0 0q-119 0-222-44q-104-45-183-124q-79-79-123-182q-45-104-45-223l0 0q0-119 45-222q44-104 123-183q79-79 183-123q103-45 222-45z"], "®": [1361, "m681 346l0 0q-120 0-225 46q-106 45-186 125q-80 80-125 186q-46 105-46 225q0 120 46 226q45 105 125 185q80 80 186 126q105 45 225 45l0 0q121 0 227-45q105-46 185-126q80-80 125-185q45-106 45-226q0-120-45-225q-45-106-125-186q-80-80-185-125q-106-46-227-46zm0 145l0 0q121 0 220 59q99 59 158 158q59 99 59 220q0 121-59 220q-59 99-158 158q-99 59-220 59l0 0q-120 0-219-59q-100-59-159-158q-59-99-59-220q0-121 59-220q59-99 159-158q99-59 219-59zm256 171l-139 0l-91 182l-107 0l0-182l-126 0l0 536l269 0q39 0 79-19q40-19 67-57q27-38 27-96q0-58-28-99l0 0q-24-37-58-57l0 0l107-208zm-337 444l0-173l102 0q26 0 52 23q26 23 26 69q0 46-26 64q-26 17-51 17l0 0l-103 0z"], "™": [1271, "m923 954l-60 0l-147 344l0-344l-107 0l0 536l130 0l153-380l154 380l131 0l0-536l-109 0l0 342l-145-342zm-570 0l-109 0l0 443l-162 0l0 93l433 0l0-93l-162 0l0-443z"], "€": [1377, "m487 967l593 0l-69-149l-546 0q-2-36-2-74l0 0q0-37 2-72l0 0l485 0l-71-152l-392 0q11-46 28-85l0 0q51-124 142-185q90-62 205-62l0 0q65 0 120 17q55 17 102 45q46 27 82 56l0 0l88-185q-77-70-178-105q-102-36-214-36l0 0q-182 0-323 92q-142 92-222 263l0 0q-39 84-59 185l0 0l-204 0l55 152l130 0q-2 35-2 72l0 0q0 38 2 74l0 0l-185 0l55 149l148 0q20 101 60 187l0 0q80 171 222 264q141 92 323 92l0 0q114 0 215-37q100-37 182-110l0 0l-87-187q-39 34-86 63q-48 28-104 46q-56 17-120 17l0 0q-115 0-205-62q-91-63-142-187l0 0q-17-40-28-86l0 0z"], "£": [1270, "m886 0l-781 0l0 196q87 0 128 47q40 47 36 138l0 0l-10 282l-154 0l0 164l148 0l-7 208q-6 140 51 247q57 107 164 168q107 61 251 61l0 0q118 0 214-47q95-47 157-132q61-86 79-203l0 0l-209-33q-17 102-78 161q-61 58-161 58l0 0q-88 0-145-35q-57-36-83-97q-27-61-25-140l0 0l7-216l452 0l0-164l-447 0l8-263q3-70-27-116q-30-47-77-74l0 0q-14-8-28-14l0 0l537 0q41 0 58 18q17 17 17 56l0 0l0 60l205 0l0-50q0-139-69-209q-69-71-211-71l0 0z"], "°": [936, "m469 816l0 0q-95 0-173 46q-78 45-124 123q-47 78-47 172l0 0q0 95 47 174q46 78 124 124q78 46 173 46l0 0q94 0 172-46q77-46 124-124q46-79 46-174l0 0q0-94-46-172q-47-78-124-123q-78-46-172-46zm0 167l0 0q48 0 88 24q39 23 63 63q23 39 23 87l0 0q0 49-23 89q-24 39-63 63q-40 24-88 24l0 0q-49 0-89-24q-40-24-63-63q-24-40-24-89l0 0q0-48 24-87q23-40 63-63q40-24 89-24z"], "−": [1367, "m203 687l962 0l0-200l-962 0l0 200z"], "↑": [1757, "m334 707l-132 132l676 676l677-676l-132-132l-218 218q-52 53-108 121q-57 67-109 134l0 0q-23 28-43 54l0 0q5-24 9-48l0 0q8-47 14-94q6-48 6-93l0 0l0-999l-191 0l0 999q0 45 6 93q5 47 14 94l0 0q4 24 8 47l0 0q-8-11-17-22l0 0q-37-48-79-99q-42-52-84-100q-42-48-79-87l0 0l-218-218z"], "↓": [1757, "m1422 783l133-132l-677-676l-676 676l132 132l217-218q52-52 110-120q57-68 109-134l0 0q22-28 41-53l0 0q-4 23-8 48l0 0q-9 46-14 94q-6 47-6 91l0 0l0 999l191 0l0-999q0-44-6-91q-6-48-14-94l0 0q-4-26-9-50l0 0q9 12 18 24l0 0q37 47 79 99q41 51 83 99q42 48 80 87l0 0l217 218z"] }, "kern": { "24": -32, "41": -53, "70": -32, "73": -34, "74": -119, "75": -20, "76": -32, "77": 40, "78": -29, "79": -20, "97": -40, '"&': -69, '",': -173, '".': -173, '"4': -128, '"…': -173, "%’": -139, "%‘": -128, "%“": -128, "%”": -139, '&"': -69, "&'": -69, "&\\": -128, "&‘": -186, "&“": -186, "&®": -46, "&™": -81, "'&": -69, "',": -173, "'.": -173, "'4": -128, "'…": -173, "(|": 12, ")‘": -69, ")“": -69, "*&": -69, "*,": -279, "*.": -279, "*4": -93, "*@": -27, "*_": -139, "*…": -279, "*©": -27, "+2": -61, "+3": -19, "+7": -50, "+\\": -100, "+‘": -105, "+“": -105, ", ": -21, ",!": -8, ',"': -180, ",'": -180, ",0": -55, ",1": -180, ",3": -52, ",5": -24, ",6": -55, ",7": -37, ",8": -50, ",9": -18, ",?": -180, ",@": -90, ",’": -142, ",”": -142, ",©": -90, "-2": -61, "-3": -19, "-7": -50, "-\\": -100, "-‘": -105, "-“": -105, ". ": -21, ".!": -8, '."': -180, ".'": -180, ".0": -55, ".1": -180, ".3": -52, ".5": -24, ".6": -55, ".7": -37, ".8": -50, ".9": -18, ".?": -180, ".@": -90, ".’": -142, ".”": -142, ".©": -90, "/,": -81, "/.": -81, "/\\": 5, "/…": -81, "0,": -55, "0.": -55, "07": -40, "0\\": -31, "0_": -93, "0‘": -93, "0“": -93, "0…": -55, "1)": 12, "1]": 12, "1_": 12, "1}": 12, "3*": -25, "3,": -45, "3.": -45, "3^": -25, "3…": -45, "3°": -25, "4*": -51, "4,": -69, "4.": -69, "4^": -51, "4…": -69, "4®": -11, "4°": -51, "5*": -4, "5,": -52, "5.": -52, "5^": -4, "5…": -52, "5®": -11, "5°": -4, "6,": -66, "6.": -66, "6_": -93, "6…": -66, "7#": -116, "7&": -93, "7,": -256, "7.": -256, "7:": -69, "7;": -69, "7<": -186, "7_": -325, "7…": -256, "8*": -25, "8,": -45, "8.": -45, "8^": -25, "8…": -45, "8°": -25, "9,": -55, "9.": -55, "9\\": -31, "9_": -93, "9‘": -93, "9“": -93, "9…": -55, ":\\": -128, ":‘": -93, ":“": -93, ";\\": -128, ";‘": -93, ";“": -93, "=\\": -139, "=‘": -116, "=“": -116, ">7": -151, ">\\": -151, ">‘": -197, ">“": -197, "@,": -90, "@.": -90, "@/": -81, "@\\": -73, "@_": -81, "@‘": -69, "@“": -69, "@…": -90, "@®": -11, "[|": 12, '\\"': -162, "\\$": -10, "\\'": -162, "\\*": -173, "\\+": -69, "\\-": -69, "\\/": 35, "\\1": -80, "\\<": -26, "\\=": -104, "\\?": -128, "\\@": -75, "\\\\": -100, "\\^": -173, "\\~": -69, "\\·": -69, "\\•": -69, "\\’": -116, "\\‘": -87, "\\“": -87, "\\”": -116, "\\×": -69, "\\±": -104, "\\©": -75, "\\®": -145, "\\™": -151, "\\°": -173, "\\−": -69, "]‘": -69, "]“": -69, "^&": -69, "^,": -279, "^.": -279, "^4": -93, "^@": -27, "^_": -139, "^…": -279, "^©": -27, "_*": -139, "_0": -93, "_1": -221, "_3": -93, "_4": -116, "_5": -93, "_6": -93, "_8": -93, "_9": -93, "_@": -81, "_\\": -162, "_^": -139, "_|": 69, "_‘": -81, "_“": -81, "_©": -81, "_°": -139, "{|": 12, "|)": 12, "|]": 12, "|_": 12, "|}": 12, "}‘": -69, "}“": -69, "~2": -61, "~3": -19, "~7": -50, "~\\": -100, "~‘": -105, "~“": -105, "·2": -61, "·3": -19, "·7": -50, "·\\": -81, "·‘": -105, "·“": -105, "•\\": -81, "’#": -256, "’&": -139, "’+": -122, "’,": -224, "’-": -122, "’.": -224, "’/": -290, "’0": -93, "’4": -197, "’6": -93, "’7": -128, "’8": -81, "’:": -116, "’;": -116, "’<": -197, "’=": -116, "’@": -116, "’_": -81, "’~": -93, "’·": -122, "’…": -224, "’±": -116, "’©": -116, "’−": -122, "‘&": -128, "‘,": -189, "‘.": -189, "‘/": -197, "‘4": -128, "‘…": -189, "“&": -128, "“,": -189, "“.": -189, "“/": -197, "“4": -128, "“…": -189, "”#": -256, "”&": -139, "”+": -122, "”,": -224, "”-": -122, "”.": -224, "”/": -290, "”0": -93, "”4": -197, "”6": -93, "”7": -128, "”8": -81, "”:": -116, "”;": -116, "”<": -197, "”=": -116, "”@": -116, "”_": -81, "”~": -93, "”·": -122, "”…": -224, "”±": -116, "”©": -116, "”−": -122, "… ": -21, "…!": -8, '…"': -180, "…'": -180, "…0": -55, "…1": -180, "…3": -52, "…5": -24, "…6": -55, "…7": -37, "…8": -50, "…9": -18, "…?": -180, "…@": -90, "…’": -142, "…”": -142, "…©": -90, "×\\": -81, "±\\": -139, "±‘": -116, "±“": -116, "©,": -90, "©.": -90, "©/": -81, "©\\": -73, "©_": -81, "©‘": -69, "©“": -69, "©…": -90, "©®": -11, "®&": -69, "®4": -101, "®@": -11, "®©": -11, "™&": -81, "°&": -69, "°,": -279, "°.": -279, "°4": -93, "°@": -27, "°_": -139, "°…": -279, "°©": -27, "−2": -61, "−3": -19, "−7": -50, "−\\": -100, "−‘": -105, "−“": -105 } }, "inter-600": { "upm": 2048, "asc": 1984, "desc": -494, "lineGap": 0, "typoAsc": 1984, "typoDesc": -494, "capH": 1490, "xH": 1118, "glyphs": { "0": [1351, "m675-20l0 0q-180 0-308 91q-128 90-196 261q-68 170-68 412l0 0q0 242 69 413q68 171 196 262q127 91 307 91l0 0q181 0 309-91q128-91 196-262q68-171 68-413l0 0q0-242-67-412q-68-171-196-261q-128-91-310-91zm1 224l0 0q97 0 165 64q67 63 103 184q35 120 35 292l0 0q0 173-35 294q-36 121-103 185q-68 64-165 64l0 0q-98 0-165-64q-68-64-103-185q-36-121-36-294l0 0q0-172 35-292q35-121 103-184q68-64 166-64z"], "1": [866, "m421 1490l296 0l0-1490l-265 0l0 1252l-10 0l-348-250l0 254l327 234z"], "2": [1276, "m1153 0l-1019 0l0 192l517 509q73 75 123 133q49 58 75 113q25 54 25 118l0 0q0 70-32 121q-33 51-88 79q-56 27-127 27l0 0q-75 0-130-30q-56-30-86-85q-30-56-30-133l0 0l-255 0q0 141 65 246q64 105 178 163q113 57 261 57l0 0q149 0 262-56q113-56 176-153q63-98 63-223l0 0q0-83-31-162q-31-79-111-178q-80-100-226-240l0 0l-259-264l0-11l649 0l0-223z"], "3": [1303, "m651-20l0 0q-157 0-278 54q-122 54-192 150q-70 95-74 220l0 0l269 0q4-61 41-106q36-45 97-69q61-25 137-25l0 0q80 0 142 28q61 28 97 79q35 50 35 116l0 0q0 68-36 120q-36 52-103 82q-67 29-162 29l0 0l-132 0l0 206l132 0q78 0 137 28q59 27 92 76q33 49 33 114l0 0q0 63-28 110q-29 47-81 74q-53 26-123 26l0 0q-69 0-127-24q-58-25-94-70q-36-45-38-109l0 0l-257 0q2 125 72 220q69 94 186 148q116 53 260 53l0 0q149 0 259-56q110-56 171-149q60-94 60-207l0 0q0-126-74-211q-74-85-195-112l0 0l0-12q104-14 176-61q72-48 110-122q37-74 37-167l0 0q0-125-71-223q-71-98-194-154q-124-56-284-56z"], "4": [1364, "m816 277l-709 0l0 213l633 1000l332 0l0-993l192 0l0-220l-192 0l0-277l-256 0l0 277zm-436 220l441 0l0 689l-12 0l-429-677l0-12z"], "5": [1254, "m618-20l0 0q-146 0-260 55q-115 54-182 150q-67 96-71 219l0 0l260 0q3-61 38-107q35-47 91-73q56-27 124-27l0 0q80 0 142 37q61 36 97 101q35 64 35 148l0 0q0 85-36 151q-37 66-100 104q-64 37-146 37l0 0q-68 0-132-25q-65-26-103-67l0 0l-242 39l78 768l862 0l0-224l-641 0l-42-396l8 0q42 49 118 81q75 31 165 31l0 0q101 0 187-36q86-37 150-103q63-67 98-157q35-90 35-197l0 0q0-148-68-262q-68-115-188-181q-120-66-277-66z"], "6": [1310, "m671-20l0 0q-106 0-207 37q-102 36-183 120q-82 83-130 222q-48 138-48 343l0 0q0 192 41 342q40 149 117 253q76 104 184 159q108 54 242 54l0 0q139 0 248-55q108-55 175-150q67-95 83-216l0 0l-262 0q-21 86-84 138q-63 52-160 52l0 0q-104 0-176-61q-73-61-110-174q-38-114-38-272l0 0l11 0q36 65 93 111q56 46 128 71q71 24 150 24l0 0q131 0 236-62q104-63 165-172q61-110 61-252l0 0q0-146-67-262q-67-116-187-183q-121-67-282-67zm-1 217l0 0q79 0 142 39q63 38 100 104q36 66 36 147l0 0q0 80-35 145q-36 65-98 103q-62 38-142 38l0 0q-59 0-110-22q-51-23-89-63q-39-40-60-92q-21-52-21-110l0 0q0-78 36-144q36-66 99-105q63-40 142-40z"], "7": [1180, "m463 0l-278 0l634 1256l0 10l-736 0l0 224l1014 0l0-230l-634-1260z"], "8": [1311, "m655-20l0 0q-161 0-286 55q-125 54-195 149q-71 94-71 215l0 0q0 93 41 172q41 79 112 132q70 53 158 68l0 0l0 9q-115 26-186 119q-71 92-71 212l0 0q0 115 65 205q64 90 177 142q112 52 256 52l0 0q143 0 256-52q112-52 177-142q65-90 65-205l0 0q0-120-71-212q-72-93-185-119l0 0l0-9q87-15 158-68q70-53 112-132q41-79 41-172l0 0q0-121-71-215q-71-95-196-149q-125-55-286-55zm0 206l0 0q84 0 146 29q62 29 97 82q34 52 34 121l0 0q0 72-36 127q-36 54-98 86q-63 32-143 32l0 0q-80 0-143-31q-63-32-99-87q-36-55-36-127l0 0q0-69 34-121q34-52 97-81q63-30 147-30zm0 679l0 0q69 0 122 28q53 28 84 78q31 49 31 114l0 0q0 65-30 113q-30 48-83 75q-54 27-124 27l0 0q-71 0-124-27q-54-27-83-75q-30-48-30-113l0 0q0-65 30-114q30-50 84-78q54-28 123-28z"], "9": [1310, "m625-21l0 0q-140 0-248 55q-109 55-176 151q-67 96-84 218l0 0l264 0q20-86 83-139q62-54 161-54l0 0q104 0 176 61q72 61 110 175q37 114 37 273l0 0l-10 0q-36-64-92-110q-57-46-128-71q-71-25-152-25l0 0q-130 0-235 63q-106 62-167 172q-61 110-61 250l0 0q0 147 68 264q68 117 189 184q121 67 282 65l0 0q106 0 207-37q100-37 181-120q81-83 129-221q48-139 48-344l0 0q0-192-40-342q-41-150-117-254q-77-105-184-159q-108-55-241-55zm12 739l0 0q60 0 112 23q51 23 89 63q38 40 60 92q21 52 21 111l0 0q0 77-36 142q-36 65-98 105q-63 39-144 39l0 0q-79 0-141-38q-63-39-100-104q-37-66-37-147l0 0q0-80 36-145q36-65 98-103q61-38 140-38z"], " ": [516, ""], "!": [658, "m451 474l-246 0l-18 1016l283 0l-19-1016zm-122-491l0 0q-71 0-117 45q-46 44-46 112l0 0q0 69 46 114q46 44 117 44l0 0q71 0 117-44q46-45 46-114l0 0q0-68-46-112q-46-45-117-45z"], '"': [1071, "m435 887l-203 0l-27 603l257 0l-27-603zm404 0l-203 0l-27 603l257 0l-27-603z"], "#": [1318, "m899 0l-202 0l63 385l-321 0l-63-385l-202 0l63 385l-211 0l34 202l210 0l52 315l-209 0l34 203l208 0l63 385l202 0l-63-385l322 0l63 385l202 0l-63-385l210 0l-33-203l-211 0l-51-315l210 0l-34-202l-210 0l-63-385zm-375 902l-52-315l322 0l51 315l-321 0z"], "$": [1332, "m732-206l-120 0l0 185q-135 8-239 52l0 0q-128 54-200 157q-72 103-78 250l0 0l263 0q7-78 49-130q42-52 111-77l0 0q44-17 94-23l0 0l0 442l-80 21q-187 48-291 145q-105 97-105 255l0 0q0 132 71 231q71 99 194 154l0 0q96 42 211 51l0 0l0 189l120 0l0-188q127-7 227-53l0 0q120-55 188-152q67-97 70-221l0 0l-259 0q-10 96-85 149l0 0q-58 39-141 49l0 0l0-417l67-17q83-20 161-53q78-33 141-83q62-51 99-123q37-72 37-169l0 0q0-131-67-230q-67-100-193-155l0 0q-105-47-245-54l0 0l0-185zm0 825l0-410q51 6 95 23l0 0q67 27 105 76q38 48 38 112l0 0q0 58-33 96q-34 38-94 65l0 0q-49 21-111 38l0 0zm-120 277l0 0l0 383q-44-6-80-21l0 0q-61-26-93-70q-33-44-33-101l0 0q0-62 39-102q38-40 97-64l0 0q34-14 70-25z"], "%": [2057, "m515 796l0 0q-102 0-172 44q-70 44-106 117q-37 73-37 159l0 0l0 78q0 87 37 160q37 72 108 116q70 44 170 44l0 0q103 0 173-44q69-44 105-116q35-73 35-160l0 0l0-78q0-87-36-160q-36-73-105-116q-70-44-172-44zm0 166l0 0q70 0 97 48q26 47 26 106l0 0l0 78q0 58-25 107q-26 48-98 48l0 0q-69 0-96-49q-28-49-28-106l0 0l0-78q0-59 27-106q27-48 97-48zm1028-989l0 0q-102 0-172 44q-71 43-107 116q-36 73-36 160l0 0l0 78q0 87 37 160q37 72 107 116q70 44 171 44l0 0q103 0 173-44q69-44 105-116q35-73 35-160l0 0l0-78q0-87-36-160q-36-73-106-116q-70-44-171-44zm0 166l0 0q70 0 97 48q26 47 26 106l0 0l0 78q0 58-25 107q-26 48-98 48l0 0q-69 0-97-49q-28-49-28-106l0 0l0-78q0-59 28-106q27-48 97-48zm-934-139l-195 0l1024 1490l195 0l-1024-1490z"], "&": [1357, "m579-21l0 0q-151 0-261 55q-111 55-170 149q-59 94-59 209l0 0q0 92 37 162q36 69 102 127l0 0q63 55 143 112l0 0q-10 12-20 25l0 0q-60 73-97 152q-38 79-38 173l0 0q0 104 49 187q48 82 136 130q88 47 206 47l0 0q116 0 201-46q84-47 130-124q46-77 46-172l0 0q0-68-25-128q-25-60-69-111q-44-51-104-95l0 0l-96-70l275-321q13 25 24 53l0 0q38 93 38 207l0 0l225 0q0-141-31-245q-32-104-81-175l0 0q-9-12-18-24l0 0l219-256l-284 0l-95 109q-75-64-173-96l0 0q-107-34-210-34zm241 293l-311 357l-25-18q-71-53-104-102q-34-49-34-111q0-62 30-108q29-47 82-72q53-26 123-26l0 0q84 0 164 37l0 0q39 18 75 43l0 0zm-263 648l0 0l86 59q29 21 57 47q27 26 44 59q17 32 17 72l0 0q0 58-40 98q-40 39-111 39l0 0q-48 0-84-19q-37-20-57-54q-20-34-20-80l0 0q0-51 25-100q25-49 69-103l0 0q7-9 14-18z"], "'": [667, "m435 887l-203 0l-27 603l257 0l-27-603z"], "(": [764, "m186 607l0 0q0 165 33 344q33 179 91 344q58 165 134 286l0 0l243 0q-73-156-126-324q-54-169-82-335q-29-166-29-315l0 0q0-132 25-265q24-134 77-285q52-152 135-336l0 0l-243 0q-127 213-192 438q-66 225-66 448z"], ")": [764, "m320-279l-243 0q85 188 137 340q52 152 76 285q24 132 24 261l0 0q0 149-28 315q-29 166-82 335q-53 168-127 324l0 0l243 0q76-121 134-286q58-165 91-344q33-180 33-344l0 0q0-225-66-450q-66-226-192-436l0 0z"], "*": [1105, "m640 652l-176 0l17 295l-247-163l-89 154l265 132l-265 132l89 156l247-163l-17 295l176 0l-16-295l248 163l88-156l-264-132l264-132l-88-154l-248 163l16-295z"], "+": [1378, "m802 88l-226 0l0 397l-389 0l0 213l389 0l0 396l226 0l0-396l390 0l0-213l-390 0l0-397z"], ",": [653, "m305-383l-182 0l88 603l268 0l-174-603z"], "-": [953, "m141 728l670 0l0-215l-670 0l0 215z"], ".": [653, "m326-17l0 0q-67 0-113 46q-47 46-47 114l0 0q0 67 47 113q46 46 113 46l0 0q68 0 115-46q46-46 46-113l0 0q0-68-46-114q-47-46-115-46z"], "/": [776, "m514 1560l228 0l-480-1784l-228 0l480 1784z"], ":": [653, "m326-17l0 0q-67 0-113 46q-47 46-47 114l0 0q0 67 47 113q46 46 113 46l0 0q68 0 115-46q46-46 46-113l0 0q0-68-46-114q-47-46-115-46zm0 764l0 0q-67 0-113 46q-47 46-47 114l0 0q0 67 47 113q46 46 113 46l0 0q68 0 115-46q46-46 46-113l0 0q0-68-46-114q-47-46-115-46z"], ";": [674, "m305-383l-182 0l88 603l268 0l-174-603zm43 1130l0 0q-67 0-113 46q-47 46-47 114l0 0q0 67 47 113q46 46 113 46l0 0q68 0 115-46q46-46 46-113l0 0q0-68-46-114q-47-46-115-46z"], "<": [1378, "m1163 27l-994 461l0 206l994 461l0-258l-699-300l0-14l699-300l0-256z"], "=": [1378, "m1172 712l-965 0l0 222l965 0l0-222zm0-465l-965 0l0 224l965 0l0-224z"], ">": [1378, "m1209 694l0-206l-993-461l0 256l700 301l0 12l-700 301l0 258l993-461z"], "?": [1113, "m627 455l-239 0l0 19q0 131 24 205q23 73 69 117q45 43 109 82l0 0q67 42 113 97q45 54 45 132l0 0q0 58-27 100q-28 42-73 66q-46 23-103 23l0 0q-51 0-98-22q-47-22-77-67q-31-45-35-113l0 0l-255 0q3 138 67 231q63 92 168 139q105 46 231 46l0 0q139 0 245-48q105-49 164-139q59-90 59-212l0 0q0-125-57-210q-58-86-159-146l0 0q-60-37-98-72q-38-35-55-83q-18-48-18-126l0 0l0-19zm-118-472l0 0q-71 0-117 45q-47 44-47 112l0 0q0 69 47 114q46 44 117 44l0 0q71 0 117-44q46-45 46-114l0 0q0-68-46-112q-46-45-117-45z"], "@": [2046, "m1056-417l0 0q-227 0-404 63q-178 62-300 182q-123 119-186 294q-63 174-63 397l0 0q0 215 62 389q62 174 183 299q120 124 295 191q175 67 401 67l0 0q213 0 380-65q166-65 282-180q116-115 177-267q60-152 60-326l0 0q0-119-19-226q-19-108-63-192q-45-84-120-132q-75-49-188-49l0 0q-61 0-120 17q-59 17-100 54q-42 37-52 96l0 0l-8 0q-26-71-101-118q-75-48-191-48l0 0q-136 0-229 64q-94 64-143 177q-49 112-49 259l0 0q0 143 55 254q54 110 151 173q97 62 222 62l0 0q97 0 166-35q69-35 97-84l0 0l11 0l0 96l190 0l0-670q0-52 26-85q25-34 77-34l0 0q67 0 105 44q37 43 53 134q15 90 15 231l0 0q0 138-41 257q-42 118-126 207q-84 88-211 137q-127 49-296 49l0 0q-176 0-311-50q-135-51-227-147q-93-96-140-234q-48-138-48-313l0 0q0-177 48-314q47-138 142-232q95-94 234-142q139-48 322-48l0 0q81 0 157 13q75 13 137 31q61 18 98 33l0 0l67-185q-49-23-124-44q-76-22-167-36q-91-14-186-14zm-54 639l0 0q88 0 144 36q55 35 82 105q27 69 27 171l0 0q0 105-28 167q-29 61-84 88q-56 27-137 27l0 0q-78 0-133-36q-55-37-84-100q-29-64-29-145l0 0q0-87 25-158q25-71 79-113q54-42 138-42z"], "A": [1490, "m342 0l-292 0l520 1490l339 0l532-1490l-293 0l-126 369l-558 0l-122-369zm193 584l413 0l-65 190q-39 120-81 272l0 0q-30 108-65 237l0 0q-33-131-62-240l0 0q-41-153-77-269l0 0l-63-190z"], "B": [1350, "m751 0l-601 0l0 1490l570 0q161 0 268-51q107-51 160-138q53-87 53-198l0 0q0-91-35-155q-35-65-93-105q-59-40-132-57l0 0l0-15q79-4 152-48q73-44 120-124q46-80 46-193l0 0q0-116-56-208q-56-92-168-145q-113-53-284-53l0 0zm-334 662l0-439l292 0q148 0 214 57q65 57 65 146l0 0q0 67-33 121q-33 53-93 84q-61 31-144 31l0 0l-301 0zm0 606l0-413l269 0q71 0 127 26q56 26 89 74q32 48 32 114l0 0q0 87-61 143q-61 56-181 56l0 0l-275 0z"], "C": [1509, "m785-20l0 0q-196 0-350 91q-154 91-243 262q-89 171-89 411l0 0q0 241 90 413q89 171 244 262q154 91 348 91l0 0q122 0 229-34q106-35 190-101q83-67 137-163q54-96 72-218l0 0l-269 0q-13 67-44 118q-32 51-79 87q-47 35-106 54q-59 18-126 18l0 0q-122 0-216-61q-95-62-148-179q-54-118-54-287l0 0q0-171 54-288q54-117 149-177q94-60 214-60l0 0q67 0 126 19q59 18 107 54q47 35 79 87q32 51 44 117l0 0l270 0q-15-107-65-200q-51-94-133-165q-82-71-190-111q-109-40-241-40z"], "D": [1479, "m654 0l0 0l-504 0l0 1490l514 0q222 0 381-89q159-89 245-256q85-167 85-398l0 0q0-233-85-400q-86-168-247-257q-162-90-389-90zm-237 1259l0-1028l224 0q156 0 261 58q104 57 157 172q53 114 53 286l0 0q0 170-53 284q-53 114-155 171q-103 57-256 57l0 0l-231 0z"], "E": [1240, "m1122 0l-972 0l0 1490l968 0l0-225l-701 0l0-402l649 0l0-222l-649 0l0-416l705 0l0-225z"], "F": [1204, "m417 0l-267 0l0 1490l954 0l0-225l-687 0l0-447l620 0l0-222l-620 0l0-596z"], "G": [1534, "m793-20l0 0q-206 0-361 93q-155 93-242 264q-87 171-87 406l0 0q0 241 90 413q89 171 243 263q154 91 349 91l0 0q123 0 230-36q106-36 190-102q83-67 137-158q53-91 70-200l0 0l-273 0q-18 60-49 107q-32 47-76 81q-45 34-101 52q-57 17-125 17l0 0q-120 0-214-61q-95-61-149-178q-54-117-54-287l0 0q0-168 54-285q54-118 149-179q95-62 220-62l0 0q114 0 198 44q83 44 129 125l0 0q43 77 45 181l0 0l-344 0l0 210l603 0l0-179q0-191-81-330q-82-140-224-215q-143-75-327-75z"], "H": [1527, "m417 0l-267 0l0 1490l267 0l0-616l693 0l0 616l267 0l0-1490l-267 0l0 649l-693 0l0-649z"], "I": [567, "m150 1490l267 0l0-1490l-267 0l0 1490z"], "J": [1187, "m560-20l0 0q-221 0-351 120q-131 119-131 340l0 0l0 85l267 0l0-87q0-117 59-177q58-61 156-61l0 0q97 0 155 61q58 60 58 177l0 0l0 1052l265 0l0-1049q0-221-129-341q-130-120-349-120z"], "K": [1440, "m417 0l-267 0l0 1490l267 0l0-442l-4-319q12 19 25 38l0 0q46 68 99 135q52 67 117 142l0 0l391 446l332 0l-572-645l582-845l-315 0l-452 669l-203-221l0-448z"], "L": [1158, "m1075 0l-925 0l0 1490l267 0l0-1265l658 0l0-225z"], "M": [1889, "m412 0l-262 0l0 1490l402 0l283-769q15-43 34-110q18-68 38-146q19-78 37-152l0 0q1-6 2-12l0 0q1 5 3 10l0 0q17 73 37 152q19 78 38 146q18 68 32 112l0 0l280 769l403 0l0-1490l-266 0l0 752q0 48 1 116q1 68 3 146q2 78 4 158l0 0q1 39 1 76l0 0q-11-43-23-86l0 0q-24-83-47-160q-23-78-43-143q-21-65-36-107l0 0l-275-752l-227 0l-279 752q-15 42-35 106q-21 63-44 140q-24 77-47 161l0 0q-12 41-23 81l0 0q0-30 1-62l0 0q2-79 4-158q1-79 3-148q1-70 1-120l0 0l0-752z"], "N": [1555, "m422 0l-272 0l0 1490l302 0l515-821q32-51 68-115q36-65 75-144l0 0q20-42 40-87l0 0q-3 41-5 83l0 0q-6 88-8 168q-3 79-3 134l0 0l0 782l271 0l0-1490l-303 0l-465 739q-44 71-83 140q-39 69-84 156l0 0q-29 57-67 128l0 0q4-64 7-124l0 0q5-98 9-175q3-77 3-124l0 0l0-740z"], "O": [1574, "m788-20l0 0q-196 0-351 91q-155 91-244 262q-90 171-90 411l0 0q0 241 90 413q89 171 244 262q155 91 351 91l0 0q195 0 350-91q154-91 244-262q89-172 89-413l0 0q0-240-89-411q-90-172-244-262q-155-91-350-91zm0 239l0 0q121 0 215 61q93 60 146 178q53 117 53 286l0 0q0 171-53 289q-53 117-146 178q-94 60-215 60l0 0q-122 0-216-61q-94-61-147-178q-54-118-54-288l0 0q0-169 54-286q53-117 147-178q94-61 216-61z"], "P": [1321, "m417 0l-267 0l0 1490l557 0q171 0 288-64q117-64 177-175q60-112 60-254l0 0q0-143-60-254q-61-111-179-175q-118-64-290-64l0 0l-286 0l0-504zm0 1266l0-542l251 0q101 0 166 35q64 35 95 97q30 62 30 141q0 79-30 140q-31 61-96 95q-65 34-167 34l0 0l-249 0z"], "Q": [1583, "m788-20l0 0q-196 0-351 91q-155 91-244 262q-90 171-90 411l0 0q0 241 90 413q89 171 244 262q155 91 351 91l0 0q195 0 350-91q154-91 244-262q89-172 89-413l0 0q0-240-89-411l0 0q-61-117-153-197l0 0l207-265l-256 0l-125 159q-122-50-267-50zm115 254l-199 263l240 0l125-162q48 50 80 123l0 0q53 117 53 286l0 0q0 171-53 289q-53 117-146 178q-94 60-215 60l0 0q-122 0-216-61q-94-61-147-178q-54-118-54-288l0 0q0-169 54-286q53-117 147-178q94-61 216-61l0 0q61 0 115 15l0 0z"], "R": [1336, "m417 0l-267 0l0 1490l557 0q171 0 288-60q117-60 177-167q60-108 60-250q0-142-60-247q-61-105-179-162l0 0q-14-7-29-13l0 0l323-591l-299 0l-293 547l-278 0l0-547zm0 1266l0-498l251 0q101 0 165 29q64 28 95 83q31 55 31 133l0 0q0 80-31 137q-31 56-95 86q-65 30-167 30l0 0l-249 0z"], "S": [1332, "m673-23l0 0q-173 0-300 54q-128 54-200 157q-72 103-78 250l0 0l263 0q7-78 49-130q42-52 111-77q69-26 153-26l0 0q88 0 156 27q67 27 105 76q38 48 38 112l0 0q0 58-33 96q-34 38-94 65q-61 26-142 46l0 0l-169 44q-187 48-291 145q-105 97-105 255l0 0q0 132 71 231q71 99 194 154q123 54 279 54l0 0q159 0 279-55q120-55 188-152q67-97 70-221l0 0l-259 0q-10 96-85 149q-76 52-197 52l0 0q-84 0-144-25q-61-26-93-70q-33-44-33-101l0 0q0-62 39-102q38-40 97-64q58-24 118-39l0 0l139-36q83-20 161-53q78-33 141-83q62-51 99-123q37-72 37-169l0 0q0-131-67-230q-67-100-193-155q-126-56-304-56z"], "T": [1352, "m543 1265l-460 0l0 225l1186 0l0-225l-459 0l0-1265l-267 0l0 1265z"], "U": [1507, "m754-22l0 0q-182 0-318 69q-136 68-211 190q-75 121-75 280l0 0l0 973l267 0l0-951q0-93 42-166q41-73 117-114q75-42 178-42l0 0q103 0 179 42q75 41 117 114q41 73 41 166l0 0l0 951l267 0l0-973q0-159-75-280q-76-122-211-190q-136-69-318-69z"], "V": [1490, "m919 0l-338 0l-531 1490l293 0l264-774q37-116 80-267l0 0q31-108 65-236l0 0q34 130 64 237l0 0q41 150 77 266l0 0l256 774l292 0l-522-1490z"], "W": [2089, "m758 0l-306 0l-402 1490l287 0l194-793q20-86 38-181q17-95 34-191l0 0q5-32 10-65l0 0q6 33 12 65l0 0q17 96 36 191q19 95 40 181l0 0l202 793l283 0l201-793q22-86 41-181q18-95 36-191l0 0q5-31 11-62l0 0q5 31 11 62l0 0q16 96 34 191q18 95 38 181l0 0l193 793l288 0l-403-1490l-306 0l-217 823q-30 115-52 250l0 0q-9 50-18 103l0 0q-8-49-15-95l0 0q-20-133-53-258l0 0l-217-823z"], "X": [1474, "m360 0l-307 0l535 762l-492 728l309 0l181-272q46-70 76-124q30-54 55-104l0 0q11-23 23-47l0 0q12 24 23 46l0 0q25 50 56 105q30 54 77 124l0 0l184 272l302 0l-489-720l528-770l-314 0l-226 334q-41 63-67 107q-27 44-49 85l0 0q-13 24-28 52l0 0q-14-27-27-50l0 0q-22-41-49-86q-27-45-71-108l0 0l-230-334z"], "Y": [1461, "m867 0l-267 0l0 577l-550 913l312 0l266-470q42-74 75-144l0 0q16-34 32-75l0 0q17 42 33 77l0 0q32 71 72 142l0 0l261 470l310 0l-544-913l0-577z"], "Z": [1336, "m1221 0l-1101 0l0 166l625 900q52 74 114 149l0 0q22 27 45 55l0 0q-47-3-94-3l0 0q-98-2-196-2l0 0l-498 0l0 225l1100 0l0-168l-614-884q-55-78-119-156l0 0q-26-31-52-62l0 0q51 3 101 4l0 0q100 1 200 1l0 0l489 0l0-225z"], "[": [764, "m655-279l-459 0l0 1860l459 0l0-203l-208 0l0-1454l208 0l0-203z"], "\\": [776, "m742-224l-228 0l-480 1784l228 0l480-1784z"], "]": [764, "m567-279l-458 0l0 203l208 0l0 1454l-208 0l0 203l458 0l0-1860z"], "^": [986, "m287 814l-214 0l305 637l230 0l305-637l-213 0l-201 448l-12 0l-200-448z"], "_": [961, "m0 0l961 0l0-209l-961 0l0 209z"], "`": [719, "m549 1261l-190 0l-202 306l253 0l139-306z"], "a": [1176, "m450-23l0 0q-106 0-191 39q-85 38-134 113q-49 75-49 185l0 0q0 95 36 157q35 62 96 99q60 37 136 56q76 19 158 27l0 0q97 11 158 19q61 8 90 26q28 18 28 56l0 0l0 5q0 55-22 94q-22 38-65 59q-44 20-108 20l0 0q-65 0-112-20q-48-20-78-52q-30-32-44-69l0 0l-241 49q33 99 102 164q69 64 165 96q95 32 207 32l0 0q79 0 160-18q80-19 147-63q67-44 108-118q41-74 41-186l0 0l0-747l-249 0l0 154l-10 0q-25-47-68-87q-44-41-108-65q-65-25-153-25zm67 193l0 0q81 0 140 32q58 32 91 85q32 52 32 114l0 0l0 132q-13-10-43-19q-31-9-68-16q-38-7-74-12q-37-5-62-8l0 0q-58-8-105-26q-47-18-73-50q-27-33-27-85l0 0q0-48 25-80q24-33 67-50q42-17 97-17z"], "b": [1278, "m728-20l0 0q-95 0-159 33q-64 32-102 78q-38 46-58 86l0 0l-17 0l0-177l-254 0l0 1490l260 0l0-557l11 0q20 40 57 86q37 46 101 80q63 33 162 33l0 0q130 0 234-66q104-66 166-194q61-129 61-315l0 0q0-184-60-313q-60-129-164-196q-105-68-238-68zm-70 214l0 0q87 0 146 48q59 47 89 130q30 82 30 186l0 0q0 104-29 186q-30 81-89 128q-59 46-147 46l0 0q-86 0-145-45q-59-45-89-125q-31-81-31-190l0 0q0-109 31-191q30-82 90-127q59-46 144-46z"], "c": [1193, "m623-23l0 0q-163 0-283 73q-120 72-185 202q-66 129-66 301l0 0q0 174 66 305q65 130 185 202q120 72 283 72l0 0q93 0 173-24q80-24 143-69q63-46 106-111q42-65 60-147l0 0l-243-51q-11 43-31 79q-21 35-51 60q-30 25-69 39q-39 13-86 13l0 0q-91 0-151-48q-60-49-90-131q-30-83-30-188l0 0q0-103 30-186q30-83 90-131q60-49 151-49l0 0q48 0 88 14q39 14 70 40q30 26 51 63q21 37 31 82l0 0l243-51q-18-84-60-150q-43-66-106-112q-64-47-144-72q-81-25-175-25z"], "d": [1278, "m550-20l0 0q-132 0-236 68q-105 67-165 196q-60 129-60 313l0 0q0 186 62 315q61 128 166 194q104 66 232 66l0 0q100 0 164-33q63-34 101-80q37-46 56-86l0 0l11 0l0 557l260 0l0-1490l-255 0l0 177l-16 0q-20-40-58-86q-39-46-102-78q-63-33-160-33zm71 214l0 0q85 0 144 46q59 45 90 127q31 82 31 191l0 0q0 109-30 190q-31 80-90 125q-60 45-145 45l0 0q-88 0-147-46q-59-47-89-128q-30-82-30-186l0 0q0-104 30-186q30-83 90-130q59-48 146-48z"], "e": [1211, "m632-23l0 0q-169 0-290 71q-122 71-187 200q-66 129-66 304l0 0q0 173 65 303q64 130 183 204q118 73 278 73l0 0q102 0 195-33q92-33 164-102q71-69 112-175q40-107 40-254l0 0l0-82l-779 0q4-92 36-158l0 0q36-73 101-110q65-37 151-37l0 0q57 0 104 17q46 16 80 49q34 32 51 79l0 0l239-49q-27-90-92-157q-65-68-162-105q-98-38-223-38zm-284 686l0 0l525 0q-6 62-27 114l0 0q-29 71-86 111q-58 40-144 40q-86 0-146-40q-60-41-91-108l0 0q-25-54-31-117z"], "f": [796, "m484 1118l242 0l0-204l-242 0l0-914l-259 0l0 914l-205 0l0 204l205 0l0 107q0 112 47 186q46 74 126 112q79 37 174 37l0 0q69 0 122-11q53-11 78-20l0 0l-53-202q-17 5-41 11q-25 5-58 5l0 0q-73 0-104-36q-32-36-32-102l0 0l0-87z"], "g": [1281, "m620-442l0 0q-134 0-233 34q-100 34-163 93q-64 58-92 132l0 0l220 79q18-31 50-64q31-33 84-54q52-22 133-22l0 0q121 0 194 57q73 56 73 176l0 0l0 211l-22 0q-19-40-56-82q-37-43-99-72q-63-29-160-29l0 0q-128 0-232 61q-105 60-166 181q-62 121-62 303l0 0q0 184 62 311q62 127 167 193q104 66 233 66l0 0q99 0 163-33q64-33 102-79q38-47 58-87l0 0l14 0l0 185l255 0l0-1121q0-149-68-246q-68-98-186-145q-118-48-269-48zm2 664l0 0q85 0 144 41q59 40 90 117q31 77 31 184l0 0q0 106-30 186q-31 79-90 124q-59 44-145 44l0 0q-88 0-147-46q-60-47-90-126q-30-80-30-182l0 0q0-103 31-180q30-77 90-119q59-43 146-43z"], "h": [1254, "m398 655l0 0l0-655l-260 0l0 1490l256 0l0-578q43 94 111 148l0 0q91 72 228 72l0 0q115 0 202-49q86-49 134-143q47-94 47-229l0 0l0-711l-261 0l0 671q0 112-58 176q-58 64-160 64l0 0q-69 0-123-30q-54-30-85-87q-31-58-31-139z"], "i": [536, "m398 0l-260 0l0 1118l260 0l0-1118zm-130 1276l0 0q-62 0-106 42q-45 42-45 100l0 0q0 60 45 102q44 41 106 41l0 0q63 0 108-41q44-42 44-101l0 0q0-59-44-101q-45-42-108-42z"], "j": [536, "m137-62l0 1180l261 0l0-1183q0-121-45-199q-46-78-133-116q-87-38-209-38l0 0l-53 0l0 213l38 0q76 0 109 37q32 36 32 106l0 0zm130 1338l0 0q-62 0-106 42q-45 42-45 100l0 0q0 60 45 102q44 41 106 41l0 0q63 0 108-41q44-42 44-101l0 0q0-59-44-101q-45-42-108-42z"], "k": [1166, "m398 0l-260 0l0 1490l260 0l0-823l19 0l403 451l305 0l-434-484l460-634l-312 0l-344 479l-97-103l0-376z"], "l": [536, "m138 1490l260 0l0-1490l-260 0l0 1490z"], "m": [1844, "m398 0l-260 0l0 1118l244 0l8-212q22 62 58 106l0 0q50 63 118 94q67 30 141 30l0 0q121 0 196-76l0 0q59-61 91-167l0 0q23 63 62 110l0 0q55 66 132 100q76 33 163 33l0 0q101 0 181-44q80-44 127-128q47-85 47-210l0 0l0-754l-260 0l0 714q0 104-57 152q-57 48-137 48l0 0q-62 0-108-27q-46-27-70-74q-25-48-25-111l0 0l0-702l-254 0l0 726q0 85-53 137q-53 51-136 51l0 0q-57 0-104-26q-48-26-76-77q-28-51-28-126l0 0l0-685z"], "n": [1253, "m398 655l0 0l0-655l-260 0l0 1118l246 0l3-222q45 105 118 164l0 0q91 72 228 72l0 0q115 0 201-49q86-49 134-143q47-94 47-229l0 0l0-711l-260 0l0 671q0 112-58 176q-58 64-160 64l0 0q-69 0-123-30q-54-30-85-87q-31-58-31-139z"], "o": [1247, "m623-23l0 0q-163 0-283 73q-120 72-185 202q-66 129-66 301l0 0q0 174 66 305q65 130 185 202q120 72 283 72l0 0q164 0 284-72q120-72 186-202q65-131 65-305l0 0q0-172-65-301q-66-130-186-202q-120-73-284-73zm0 211l0 0q91 0 152 49q60 49 90 132q29 83 29 185l0 0q0 103-29 186q-30 83-90 132q-61 49-152 49l0 0q-91 0-150-49q-60-49-89-131q-30-83-30-187l0 0q0-102 30-185q29-83 89-132q59-49 150-49z"], "p": [1278, "m398-418l-260 0l0 1536l254 0l0-185l17 0q20 40 57 86q37 46 101 80q63 33 162 33l0 0q130 0 234-66q104-66 166-194q61-129 61-315l0 0q0-184-60-313q-60-129-164-196q-105-68-238-68l0 0q-95 0-159 33q-64 32-102 78q-38 46-58 86l0 0l-11 0l0-595zm260 612l0 0q87 0 146 48q59 47 89 130q30 82 30 186l0 0q0 104-29 186q-30 81-89 128q-59 46-147 46l0 0q-86 0-145-45q-59-45-89-125q-31-81-31-190l0 0q0-109 31-191q30-82 90-127q59-46 144-46z"], "q": [1278, "m1141 1118l0-1536l-260 0l0 595l-11 0q-20-40-58-86q-39-46-102-78q-63-33-160-33l0 0q-132 0-236 68q-105 67-165 196q-60 129-60 313l0 0q0 186 62 315q61 128 166 194q104 66 232 66l0 0q100 0 164-33q63-34 101-80q37-46 56-86l0 0l16 0l0 185l255 0zm-520-924l0 0q85 0 144 46q59 45 90 127q31 82 31 191l0 0q0 109-30 190q-31 80-90 125q-60 45-145 45l0 0q-88 0-147-46q-59-47-89-128q-30-82-30-186l0 0q0-104 30-186q30-83 90-130q59-48 146-48z"], "r": [813, "m398 0l-260 0l0 1118l252 0l0-187l12 0q30 97 105 150q75 52 171 52l0 0q22 0 49-2q27-2 46-5l0 0l0-239q-16 5-52 9q-36 4-71 4l0 0q-72 0-129-31q-58-31-90-85q-33-55-33-126l0 0l0-658z"], "s": [1125, "m561-23l0 0q-129 0-228 37q-99 37-162 108q-64 71-83 172l0 0l243 46q23-83 82-123q58-41 153-41l0 0q96 0 153 39q56 38 56 95l0 0q0 48-37 80q-37 31-114 48l0 0l-191 41q-158 34-236 112q-78 78-78 201l0 0q0 104 57 180q57 76 159 118q101 42 235 42l0 0q127 0 219-36q91-36 148-100q56-65 78-152l0 0l-232-46q-19 59-69 100q-50 40-141 40l0 0q-83 0-138-36q-56-37-56-94l0 0q0-49 37-81q37-32 122-50l0 0l190-40q159-34 236-109q77-75 77-193l0 0q0-106-61-186q-61-81-169-126q-109-46-250-46z"], "t": [723, "m439 1118l216 0l0-204l-216 0l0-599q0-61 26-89q26-29 85-29l0 0q18 0 48 5q29 4 47 8l0 0l41-201q-43-13-88-18q-45-6-86-6l0 0q-161 0-247 80q-86 80-86 228l0 0l0 621l-159 0l0 204l159 0l0 266l260 0l0-266z"], "u": [1254, "m521-14l0 0q-115 0-201 49q-87 49-134 144q-48 94-48 228l0 0l0 711l260 0l0-671q0-112 59-176q58-64 160-64l0 0q69 0 123 30q54 30 85 88q30 58 30 138l0 0l0 655l261 0l0-1118l-247 0l-2 223q-45-107-120-165l0 0q-92-72-226-72z"], "v": [1202, "m746 0l-291 0l-416 1118l278 0l204-608q36-107 62-215l0 0q10-43 21-86l0 0q10 43 21 86l0 0q25 108 60 215l0 0l203 608l276 0l-418-1118z"], "w": [1719, "m640 0l-263 0l-333 1118l274 0l110-438q25-108 55-237l0 0q21-91 41-196l0 0q19 102 41 193l0 0q31 129 59 240l0 0l113 438l248 0l110-438q27-109 58-238l0 0q21-92 41-196l0 0q19 103 40 194l0 0q28 129 55 240l0 0l110 438l276 0l-334-1118l-263 0l-131 456q-20 69-39 148q-19 79-37 162l0 0q-6 27-12 54l0 0q-6-27-12-54l0 0q-19-83-37-163q-19-80-39-147l0 0l-131-456z"], "x": [1165, "m331 0l-281 0l370 574l-348 544l286 0l114-190q50-85 89-166l0 0q13-27 26-53l0 0q12 26 25 53l0 0q37 81 88 166l0 0l118 190l280 0l-354-550l371-568l-284 0l-138 224q-50 85-89 165l0 0q-13 25-25 49l0 0q-12-24-23-49l0 0q-37-80-87-165l0 0l-138-224z"], "y": [1205, "m127-399l0 0l61 203l31-8q59-15 105-8q46 6 77 40q31 33 44 97l0 0l16 71l-422 1122l278 0l204-608q36-108 59-215l0 0q8-39 17-78l0 0q10 39 20 79l0 0q27 107 63 214l0 0l211 608l275 0l-480-1262q-34-89-85-152q-51-64-125-97q-74-33-175-33l0 0q-55 0-101 8q-47 8-73 19z"], "z": [1159, "m1037 0l-915 0l0 166l577 726l0 9l-559 0l0 217l878 0l0-180l-550-712l0-9l569 0l0-217z"], "{": [931, "m822-79l0-200q-108 0-194 18q-86 17-145 61q-59 43-90 122q-31 78-31 200l0 0l0 192q0 115-48 166l0 0q-42 44-140 50l0 0l-33 0l0 242l33 0q98 6 140 50l0 0q48 50 48 164l0 0l0 194q0 121 31 200q31 78 90 122q59 44 145 62q86 17 194 17l0 0l0-202q-128 1-173-52q-46-54-46-168l0 0l0-241q0-56-17-106q-18-50-66-89q-49-39-140-61l0 0q-1-1-2-1l0 0l0-20q1-1 2-1l0 0q91-23 140-62q48-39 66-89q17-51 17-107l0 0l0-239q0-114 46-168q45-54 173-54l0 0z"], "|": [735, "m246 1970l242 0l0-2450l-242 0l0 2450z"], "}": [931, "m109-279l0 0l0 200q129 0 174 54q45 54 45 168l0 0l0 239q0 56 18 107q17 50 66 89q49 39 140 62l0 0l0 22q-91 22-140 61q-49 39-66 89q-18 50-18 106l0 0l0 241q0 114-45 167q-45 53-174 53l0 0l0 202q109 0 194-17q85-18 145-62q59-44 90-122q30-79 30-200l0 0l0-194q0-114 49-164l0 0q48-50 168-51l0 0l5 0l0-240q-125-1-173-52q-49-51-49-165l0 0l0-192q0-122-30-200q-31-79-90-122q-60-44-145-61q-85-18-194-18z"], "~": [1378, "m371 416l-210 0q-4 133 36 221q39 87 110 130q70 43 159 43l0 0q71 0 133-29q61-29 141-100l0 0q47-40 77-59q30-20 68-20l0 0q55 0 90 43q34 42 33 129l0 0l210 0q3-132-37-219q-41-88-111-131q-70-43-158-43l0 0q-74 0-137 31q-63 31-138 97l0 0q-49 43-77 61q-29 18-67 18l0 0q-53 0-88-40q-36-40-34-132l0 0z"], "·": [653, "m326 547l0 0q-67 0-113 46q-47 46-47 114l0 0q0 67 47 113q46 46 113 46l0 0q68 0 115-46q46-46 46-113l0 0q0-68-46-114q-47-46-115-46z"], "•": [1031, "m516 274l0 0q-88 0-161 43q-73 43-116 116q-43 73-43 161l0 0q0 89 43 162q43 72 116 115q73 43 161 43l0 0q89 0 162-43q72-43 115-115q43-73 43-162l0 0q0-88-43-161q-43-73-115-116q-73-43-162-43z"], "—": [2048, "m0 728l2048 0l0-215l-2048 0l0 215z"], "–": [1024, "m0 728l1024 0l0-215l-1024 0l0 215z"], "’": [602, "m346 887l-182 0l88 603l268 0l-174-603z"], "‘": [602, "m432 887l-268 0l174 603l182 0l-88-603z"], "“": [1038, "m432 887l-268 0l174 603l182 0l-88-603zm436 0l-268 0l174 603l182 0l-88-603z"], "”": [1027, "m346 887l-182 0l88 603l268 0l-174-603zm425 0l-182 0l88 603l268 0l-174-603z"], "…": [1958, "m326-17l0 0q-67 0-113 46q-47 46-47 114l0 0q0 67 47 113q46 46 113 46l0 0q68 0 115-46q46-46 46-113l0 0q0-68-46-114q-47-46-115-46zm653 0l0 0q-67 0-113 46q-47 46-47 114l0 0q0 67 47 113q46 46 113 46l0 0q68 0 115-46q46-46 46-113l0 0q0-68-46-114q-47-46-115-46zm652 0l0 0q-67 0-113 46q-47 46-47 114l0 0q0 67 47 113q46 46 113 46l0 0q68 0 115-46q46-46 46-113l0 0q0-68-46-114q-47-46-115-46z"], "×": [1378, "m1198 245l-162-162l-345 344l-344-344l-163 162l344 345l-344 344l163 165l344-346l345 346l162-165l-344-344l344-345z"], "±": [1378, "m577 660l-385 0l0 212l385 0l0 269l225 0l0-269l384 0l0-212l-384 0l0-268l-225 0l0 268zm609-599l-994 0l0 217l994 0l0-217z"], "©": [1872, "m524 744l0 0q0 116 57 211q56 95 152 152q95 56 210 56l0 0q102 0 187-44q85-44 141-119q56-75 68-171l0 0l-200 0q-13 63-69 103q-56 40-127 40l0 0q-62 0-113-30q-52-31-83-82q-32-52-32-115l0 0q0-63 32-114q31-51 83-82q51-31 113-31l0 0q71 0 122 40q51 40 64 102l0 0l200 0q-12-95-65-171q-54-76-136-119q-83-44-185-44l0 0q-115 0-210 57q-96 56-152 151q-57 95-57 210zm412-767l0 0q-159 0-298 60q-139 59-245 165q-106 106-165 245q-60 139-60 298l0 0q0 159 60 298q59 139 165 245q106 106 245 166q139 59 298 59l0 0q159 0 298-59q139-60 245-166q106-106 166-245q59-139 59-298l0 0q0-159-59-298q-60-139-166-245q-106-106-245-165q-139-60-298-60zm0 216l0 0q114 0 214 43q100 42 177 119q76 76 119 176q42 100 42 214l0 0q0 114-42 214q-43 100-119 177q-77 76-177 119q-100 42-214 42l0 0q-114 0-214-42q-100-43-176-119q-77-77-119-177q-43-100-43-214l0 0q0-114 43-214q42-100 119-176q76-77 176-119q100-43 214-43z"], "®": [1359, "m679 346l0 0q-120 0-225 46q-106 45-185 125q-80 80-125 186q-46 105-46 225q0 120 46 226q45 105 125 185q79 80 185 126q105 45 225 45l0 0q121 0 227-45q105-46 185-126q80-80 125-185q45-106 45-226q0-120-45-225q-45-106-125-186q-80-80-185-125q-106-46-227-46zm0 149l0 0q120 0 219 59q98 58 157 156q58 98 58 218q0 120-58 218q-59 98-157 157q-99 58-219 58l0 0q-119 0-217-58q-99-59-157-157q-59-98-59-218l0 0q0-119 59-217q58-99 157-157q98-59 217-59zm256 168l-146 0l-87 181l-99 0l0-181l-132 0l0 536l266 0q45 0 86-20q41-20 67-58q26-39 26-96l0 0q0-58-27-98l0 0q-24-36-59-57l0 0l105-207zm-332 440l0-168l95 0q29 0 53 22q24 22 24 66q0 44-24 62q-25 18-52 18l0 0l-96 0z"], "™": [1291, "m942 954l-66 0l-136 328l0-328l-119 0l0 536l143 0l144-368l145 368l144 0l0-536l-120 0l0 327l-135-327zm-577 0l-121 0l0 435l-162 0l0 101l445 0l0-101l-162 0l0-435z"], "€": [1390, "m533 971l558 0l-70-153l-511 0q-2-36-2-75l0 0q0-37 2-71l0 0l446 0l-74-157l-348 0q9-35 21-65l0 0q47-117 130-173q83-57 192-57l0 0q65 0 119 17q53 17 97 43q43 26 75 50l0 0l102-213q-78-68-179-102q-101-35-214-35l0 0q-186 0-329 91q-144 91-225 262l0 0q-40 83-60 182l0 0l-207 0l57 157l130 0q-2 35-2 71l0 0q0 38 2 75l0 0l-187 0l57 153l149 0q21 100 61 184l0 0q81 171 225 263q143 92 329 92l0 0q115 0 216-36q100-36 181-106l0 0l-100-215q-34 28-78 55q-45 26-99 44q-55 17-120 17l0 0q-109 0-192-57q-83-58-130-174l0 0q-13-31-22-67l0 0z"], "£": [1289, "m891 0l-792 0l0 225l1 0q85 0 128 44q42 43 38 127l0 0l-11 260l-156 0l0 178l148 0l-8 185q-7 149 53 260q59 110 170 171q111 61 257 61l0 0q123 0 222-47q98-48 163-135q64-88 83-209l0 0l-245-38q-16 97-71 151q-56 53-148 53l0 0q-81 0-133-32q-53-32-77-89q-24-57-22-134l0 0l7-197l422 0l0-178l-417 0l8-229q2-73-31-120q-33-47-86-73l0 0q-10-5-19-9l0 0l512 0q34 0 49 16q15 15 15 49l0 0l0 58l243 0l0-53q0-145-75-220q-76-75-228-75l0 0z"], "°": [938, "m470 802l0 0q-96 0-175 47q-80 47-127 126q-48 79-48 175l0 0q0 97 48 177q47 79 127 127q79 47 175 47l0 0q96 0 175-47q79-48 126-127q47-80 47-177l0 0q0-96-47-175q-47-79-126-126q-79-47-175-47zm0 185l0 0q45 0 83 22q37 22 59 59q22 37 22 82l0 0q0 46-22 83q-22 37-59 60q-38 22-83 22l0 0q-45 0-82-22q-38-23-60-60q-22-37-22-83l0 0q0-45 22-82q22-37 60-59q37-22 82-22z"], "−": [1378, "m196 705l987 0l0-228l-987 0l0 228z"], "↑": [1805, "m350 668l-148 148l701 701l700-701l-147-148l-226 225q-52 53-110 123q-58 70-110 138l0 0q-15 19-28 37l0 0q3-14 6-30l0 0q9-51 16-105q6-54 6-101l0 0l0-955l-215 0l0 955q0 47 7 101q6 54 16 105l0 0q3 16 6 31l0 0q-2-3-5-6l0 0q-37-49-79-102q-42-54-84-103q-43-50-81-88l0 0l-225-225z"], "↓": [1805, "m1455 822l148-148l-701-701l-700 701l148 148l225-225q53-53 111-123q57-70 109-138l0 0q15-20 29-39l0 0q-3 16-6 33l0 0q-10 51-16 105q-7 54-7 100l0 0l0 955l215 0l0-955q0-46-6-100q-7-54-16-105l0 0q-4-17-7-32l0 0q3 3 6 7l0 0q36 48 79 102q42 53 84 103q42 49 80 87l0 0l225 225z"] }, "kern": { "24": -32, "41": -65, "70": -32, "73": -34, "74": -119, "75": -20, "76": -32, "77": 40, "78": -29, "79": -20, "97": -40, '"&': -69, '",': -178, '".': -178, '"4': -128, '"…': -178, "%’": -139, "%‘": -128, "%“": -128, "%”": -139, '&"': -69, "&'": -69, "&\\": -128, "&‘": -186, "&“": -186, "&®": -46, "&™": -81, "'&": -69, "',": -178, "'.": -178, "'4": -128, "'…": -178, "(|": 25, ")‘": -69, ")“": -69, "*&": -69, "*,": -279, "*.": -279, "*4": -93, "*@": -31, "*_": -139, "*…": -279, "*©": -31, "+2": -52, "+3": -15, "+7": -54, "+\\": -96, "+‘": -82, "+“": -82, ", ": -42, ",!": -17, ',"': -191, ",'": -191, ",0": -57, ",1": -182, ",3": -50, ",5": -19, ",6": -57, ",7": -44, ",8": -54, ",9": -22, ",?": -180, ",@": -90, ",’": -168, ",”": -168, ",©": -90, "-2": -52, "-3": -15, "-7": -54, "-\\": -96, "-‘": -82, "-“": -82, ". ": -42, ".!": -17, '."': -191, ".'": -191, ".0": -57, ".1": -182, ".3": -50, ".5": -19, ".6": -57, ".7": -44, ".8": -54, ".9": -22, ".?": -180, ".@": -90, ".’": -168, ".”": -168, ".©": -90, "/,": -81, "/.": -81, "/\\": 10, "/…": -81, "0,": -57, "0.": -57, "07": -40, "0\\": -42, "0_": -93, "0‘": -93, "0“": -93, "0…": -57, "1)": 25, "1]": 25, "1_": 25, "1}": 25, "3*": -19, "3,": -44, "3.": -44, "3^": -19, "3…": -44, "3°": -19, "4*": -62, "4,": -69, "4.": -69, "4^": -62, "4…": -69, "4®": -11, "4°": -62, "5*": -7, "5,": -50, "5.": -50, "5^": -7, "5…": -50, "5®": -11, "5°": -7, "6,": -64, "6.": -64, "6_": -93, "6…": -64, "7#": -116, "7&": -93, "7,": -256, "7.": -256, "7:": -69, "7;": -69, "7<": -186, "7_": -325, "7…": -256, "8*": -19, "8,": -44, "8.": -44, "8^": -19, "8…": -44, "8°": -19, "9,": -57, "9.": -57, "9\\": -42, "9_": -93, "9‘": -93, "9“": -93, "9…": -57, ":\\": -128, ":‘": -93, ":“": -93, ";\\": -128, ";‘": -93, ";“": -93, "=\\": -139, "=‘": -116, "=“": -116, ">7": -151, ">\\": -151, ">‘": -197, ">“": -197, "@,": -90, "@.": -90, "@/": -81, "@\\": -78, "@_": -81, "@‘": -69, "@“": -69, "@…": -90, "@®": -11, "[|": 25, '\\"': -162, "\\$": -21, "\\'": -162, "\\*": -183, "\\+": -69, "\\-": -69, "\\/": 29, "\\1": -91, "\\<": -52, "\\=": -104, "\\?": -128, "\\@": -81, "\\\\": -100, "\\^": -183, "\\~": -69, "\\·": -69, "\\•": -69, "\\’": -116, "\\‘": -87, "\\“": -87, "\\”": -116, "\\×": -69, "\\±": -104, "\\©": -81, "\\®": -145, "\\™": -151, "\\°": -183, "\\−": -69, "]‘": -69, "]“": -69, "^&": -69, "^,": -279, "^.": -279, "^4": -93, "^@": -31, "^_": -139, "^…": -279, "^©": -31, "_*": -139, "_0": -93, "_1": -221, "_3": -93, "_4": -116, "_5": -93, "_6": -93, "_8": -93, "_9": -93, "_@": -81, "_\\": -162, "_^": -139, "_|": 69, "_‘": -81, "_“": -81, "_©": -81, "_°": -139, "{|": 25, "|)": 25, "|]": 25, "|_": 25, "|}": 25, "}‘": -69, "}“": -69, "~2": -52, "~3": -15, "~7": -54, "~\\": -96, "~‘": -82, "~“": -82, "·2": -52, "·3": -15, "·7": -54, "·\\": -81, "·‘": -82, "·“": -82, "•\\": -81, "’#": -256, "’&": -139, "’+": -115, "’,": -244, "’-": -115, "’.": -244, "’/": -290, "’0": -93, "’4": -197, "’6": -93, "’7": -128, "’8": -81, "’:": -116, "’;": -116, "’<": -197, "’=": -116, "’@": -116, "’_": -81, "’~": -93, "’·": -115, "’…": -244, "’±": -116, "’©": -116, "’−": -115, "‘&": -128, "‘,": -204, "‘.": -204, "‘/": -197, "‘4": -128, "‘…": -204, "“&": -128, "“,": -204, "“.": -204, "“/": -197, "“4": -128, "“…": -204, "”#": -256, "”&": -139, "”+": -115, "”,": -244, "”-": -115, "”.": -244, "”/": -290, "”0": -93, "”4": -197, "”6": -93, "”7": -128, "”8": -81, "”:": -116, "”;": -116, "”<": -197, "”=": -116, "”@": -116, "”_": -81, "”~": -93, "”·": -115, "”…": -244, "”±": -116, "”©": -116, "”−": -115, "… ": -42, "…!": -17, '…"': -191, "…'": -191, "…0": -57, "…1": -182, "…3": -50, "…5": -19, "…6": -57, "…7": -44, "…8": -54, "…9": -22, "…?": -180, "…@": -90, "…’": -168, "…”": -168, "…©": -90, "×\\": -81, "±\\": -139, "±‘": -116, "±“": -116, "©,": -90, "©.": -90, "©/": -81, "©\\": -78, "©_": -81, "©‘": -69, "©“": -69, "©…": -90, "©®": -11, "®&": -69, "®4": -101, "®@": -11, "®©": -11, "™&": -81, "°&": -69, "°,": -279, "°.": -279, "°4": -93, "°@": -31, "°_": -139, "°…": -279, "°©": -31, "−2": -52, "−3": -15, "−7": -54, "−\\": -96, "−‘": -82, "−“": -82 } }, "inter-700": { "upm": 2048, "asc": 1984, "desc": -494, "lineGap": 0, "typoAsc": 1984, "typoDesc": -494, "capH": 1490, "xH": 1118, "glyphs": { "0": [1381, "m690-20l0 0q-188 0-321 91q-133 90-204 261q-71 170-71 412l0 0q0 241 71 413q71 171 204 262q133 91 321 91l0 0q188 0 322-91q133-92 204-263q71-171 71-412l0 0q0-242-70-412q-71-171-204-261q-134-91-323-91zm0 253l0 0q92 0 156 60q63 60 97 174q33 114 33 277l0 0q0 164-33 279q-34 115-97 175q-64 60-156 60l0 0q-91 0-155-60q-64-61-97-175q-33-115-33-279l0 0q0-163 33-277q33-114 97-174q64-60 155-60z"], "1": [883, "m422 1490l327 0l0-1490l-305 0l0 1221l-10 0l-341-242l0 280l329 231z"], "2": [1290, "m1178 0l-1054 0l0 220l528 495q68 66 115 120q46 53 71 105q24 51 24 111l0 0q0 67-30 115q-30 48-82 74q-52 26-119 26l0 0q-69 0-121-28q-52-28-80-80q-28-52-28-125l0 0l-292 0q0 145 67 253q66 107 184 166q118 58 272 58l0 0q158 0 276-56q118-57 184-156q65-99 65-228l0 0q0-83-32-164q-33-81-116-181q-84-101-237-241l0 0l-225-222l0-11l630 0l0-251z"], "3": [1322, "m659-20l0 0q-162 0-287 56q-126 55-198 154q-73 99-75 228l0 0l307 0q3-56 37-97q33-42 90-65q57-23 127-23l0 0q74 0 130 26q56 25 88 71q32 46 32 107l0 0q0 62-33 109q-34 47-96 74q-62 26-149 26l0 0l-138 0l0 227l138 0q73 0 128 26q55 25 87 70q31 44 31 104l0 0q0 58-27 101q-27 43-75 68q-49 24-114 24l0 0q-65 0-119-23q-54-24-87-66q-33-42-34-100l0 0l-294 0q2 127 73 225q70 98 191 153q121 55 272 55l0 0q153 0 268-56q115-56 179-151q63-95 63-211l0 0q0-125-77-209q-78-84-202-108l0 0l0-11q108-14 183-61q74-47 112-120q38-73 38-166l0 0q0-126-73-225q-73-99-201-155q-129-57-295-57z"], "4": [1385, "m814 265l-713 0l0 241l623 984l383 0l0-979l186 0l0-246l-186 0l0-265l-293 0l0 265zm-405 246l411 0l0 643l-12 0l-399-631l0-12z"], "5": [1274, "m628-20l0 0q-153 0-272 57q-120 56-189 155q-70 99-74 226l0 0l298 0q3-58 36-102q32-45 85-69q53-25 116-25l0 0q75 0 133 34q57 33 90 93q33 60 33 139l0 0q0 79-33 141q-34 61-92 95q-59 34-136 34l0 0q-67 0-128-26q-62-27-96-72l0 0l-274 48l71 782l902 0l0-252l-649 0l-38-377l8 0q40 54 119 89q78 35 174 35l0 0q101 0 187-36q85-36 148-101q63-66 98-156q35-90 35-197l0 0q0-150-69-266q-70-116-194-182q-125-67-289-67z"], "6": [1330, "m684-20l0 0q-113 0-219 38q-106 38-189 123q-84 84-133 224q-49 140-49 345l0 0q0 188 42 336q42 148 121 252q79 104 190 158q111 54 248 54l0 0q147 0 260-57q113-58 183-155q69-98 83-221l0 0l-300 0q-19 79-78 125q-60 45-148 45l0 0q-98 0-165-58q-68-58-102-164q-34-107-34-254l0 0l10 0q34 65 91 112q56 47 129 72q73 24 154 24l0 0q132 0 236-61q103-62 163-171q60-109 60-249l0 0q0-151-70-268q-70-117-194-183q-124-67-289-67zm-2 242l0 0q74 0 132 36q58 35 92 96q34 60 34 136l0 0q0 75-33 135q-33 60-91 96q-58 35-132 35l0 0q-55 0-102-21q-47-21-82-58q-36-37-55-85q-20-48-20-103l0 0q0-73 33-133q33-61 92-97q58-37 132-37z"], "7": [1191, "m494 0l-317 0l620 1228l0 10l-722 0l0 252l1041 0l0-256l-622-1234z"], "8": [1333, "m666-20l0 0q-167 0-296 55q-129 55-202 150q-74 95-74 215l0 0q0 93 43 172q42 78 115 131q72 52 163 67l0 0l0 9q-119 25-193 117q-74 92-74 214l0 0q0 115 67 206q67 90 184 142q117 52 267 52l0 0q149 0 267-52q117-52 185-142q67-91 67-206l0 0q0-122-75-214q-75-92-191-117l0 0l0-9q89-15 162-67q72-53 116-131q43-79 43-172l0 0q0-120-74-215q-74-95-203-150q-130-55-297-55zm0 226l0 0q77 0 134 28q57 27 89 77q32 49 32 113l0 0q0 66-33 117q-33 50-90 80q-58 29-132 29l0 0q-74 0-131-29q-58-29-91-79q-33-51-33-118l0 0q0-64 32-113q31-49 89-77q58-28 134-28zm0 668l0 0q64 0 114 26q49 26 78 72q28 46 28 105l0 0q0 60-28 105q-28 45-77 70q-50 25-115 25l0 0q-65 0-114-25q-50-25-78-70q-28-45-28-105l0 0q0-59 28-105q28-46 78-72q50-26 114-26z"], "9": [1330, "m636-22l0 0q-147 0-260 58q-114 58-183 157q-69 99-84 222l0 0l302 0q18-80 77-127q59-47 148-47l0 0q98 0 166 59q67 58 102 166q34 107 34 254l0 0l-10 0q-34-64-90-111q-57-47-129-72q-73-26-155-26l0 0q-132 0-236 62q-105 62-164 171q-60 109-60 249l0 0q0 151 70 269q70 117 195 185q125 67 290 65l0 0q113 0 218-38q105-39 189-123q83-85 132-225q49-140 49-345l0 0q0-189-42-337q-43-149-121-253q-79-104-190-158q-111-55-248-55zm11 757l0 0q55 0 103 22q47 21 82 58q35 36 55 84q20 48 20 104l0 0q0 72-33 132q-34 60-92 97q-58 36-133 36l0 0q-73 0-131-35q-59-36-93-96q-34-61-34-136l0 0q0-75 34-135q33-60 91-95q57-36 131-36z"], " ": [485, ""], "!": [692, "m485 472l-279 0l-22 1018l323 0l-22-1018zm-139-491l0 0q-78 0-127 47q-50 47-50 122l0 0q0 76 50 123q49 47 127 47l0 0q79 0 129-47q49-47 49-123l0 0q0-75-49-122q-50-47-129-47z"], '"': [1130, "m461 870l-228 0l-31 620l289 0l-30-620zm436 0l-228 0l-31 620l289 0l-30-620z"], "#": [1329, "m917 0l-227 0l61 373l-296 0l-61-373l-227 0l61 373l-206 0l39 226l204 0l48 291l-205 0l38 227l204 0l61 373l227 0l-61-373l297 0l61 373l227 0l-61-373l205 0l-38-227l-205 0l-48-291l206 0l-39-226l-204 0l-61-373zm-377 890l-48-291l296 0l48 291l-296 0z"], "$": [1341, "m740-201l-120 0l0 181q-141 8-250 53l0 0q-133 55-207 163q-74 108-78 266l0 0l297 0q6-75 45-125q39-51 104-76l0 0q41-16 89-22l0 0l0 394l-92 23q-189 46-296 145q-107 98-107 260l0 0q0 135 73 236q72 101 199 157l0 0q100 45 223 54l0 0l0 183l120 0l0-183q131-8 233-54l0 0q123-57 192-157q69-101 71-232l0 0l-295 0q-8 90-76 139l0 0q-51 36-125 45l0 0l0-372l71-17q94-21 175-57q81-36 142-88q61-53 95-125q33-72 33-166l0 0q0-135-68-235q-68-101-197-156l0 0q-107-46-251-53l0 0l0-181zm0 804l0-363q44 5 81 20l0 0q60 23 94 66q34 43 34 100l0 0q0 51-30 86q-31 34-88 59l0 0q-39 17-91 32l0 0zm-120 306l0 0l0 340q-39-5-70-18l0 0q-55-22-83-61q-29-39-29-89l0 0q0-55 33-91q33-37 88-59l0 0q29-13 61-22z"], "%": [2080, "m511 779l0 0q-106 0-178 45q-73 45-110 120q-37 75-37 163l0 0l0 78q0 90 38 165q38 74 111 119q72 45 176 45l0 0q106 0 179-45q72-45 109-119q37-75 37-165l0 0l0-78q0-90-37-164q-38-75-110-119q-73-45-178-45zm0 183l0 0q67 0 92 45q24 45 24 100l0 0l0 78q0 54-23 101q-24 46-93 46l0 0q-66 0-91-47q-26-48-26-100l0 0l0-78q0-55 26-100q25-45 91-45zm1058-988l0 0q-105 0-177 45q-73 45-110 120q-38 75-38 163l0 0l0 78q0 90 38 165q38 74 111 119q73 45 176 45l0 0q107 0 179-45q72-45 109-119q37-75 37-165l0 0l0-78q0-89-37-164q-38-75-110-119q-73-45-178-45zm0 183l0 0q67 0 92 46q24 45 24 99l0 0l0 78q0 54-23 101q-24 46-93 46l0 0q-66 0-91-47q-25-47-25-100l0 0l0-78q0-54 25-99q25-46 91-46zm-943-157l-207 0l1024 1490l207 0l-1024-1490z"], "&": [1376, "m579-22l0 0q-154 0-266 56q-112 56-172 150q-60 94-60 209l0 0q0 90 36 158q35 68 99 126l0 0q61 55 140 110l0 0q-6 6-11 13l0 0q-58 72-96 154q-38 81-38 177l0 0q0 107 51 193q50 85 141 135q91 49 212 49l0 0q119 0 205-47q86-48 133-127q47-80 47-177l0 0q0-69-24-130q-25-61-69-113q-44-52-105-97l0 0l-89-64l251-290q14 26 26 55l0 0q37 92 37 204l0 0l251 0q0-138-30-246q-30-109-82-188l0 0q-11-16-22-31l0 0l223-257l-316 0l-90 101q-78-61-177-91l0 0q-105-32-205-32zm219 305l-289 323l-11-8q-61-45-92-89q-32-45-32-104l0 0q0-56 27-98q27-42 75-64q48-23 112-23l0 0q82 0 160 36l0 0q25 12 50 27l0 0zm-232 643l0 0l80 53q31 20 56 46q25 25 40 55q14 29 14 63l0 0q0 51-36 87q-36 36-103 36l0 0q-44 0-77-17q-33-17-51-48q-18-31-18-73l0 0q0-49 25-97q24-49 67-102l0 0q1-2 3-3z"], "'": [694, "m461 870l-228 0l-31 620l289 0l-30-620z"], "(": [772, "m169 607l0 0q0 166 34 345q33 179 91 344q58 165 133 285l0 0l279 0q-72-155-124-323q-52-169-79-335q-28-166-28-316l0 0q0-131 24-263q23-133 74-284q51-151 133-339l0 0l-279 0q-127 211-192 437q-66 225-66 449z"], ")": [772, "m345-279l-278 0q83 190 134 342q50 151 73 283q23 132 23 261l0 0q0 150-27 316q-28 166-79 335q-52 168-124 323l0 0l278 0q76-120 134-285q58-165 91-344q33-180 33-345l0 0q0-226-66-451q-66-226-192-435l0 0z"], "*": [1145, "m668 652l-192 0l19 284l-238-159l-97 168l257 125l-257 125l97 170l238-159l-19 284l192 0l-18-284l238 159l95-170l-255-125l255-125l-95-168l-238 159l18-284z"], "+": [1390, "m822 82l-254 0l0 393l-385 0l0 240l385 0l0 393l254 0l0-393l386 0l0-240l-386 0l0-393z"], ",": [684, "m323-395l-204 0l88 620l300 0l-184-620z"], "-": [958, "m140 733l678 0l0-240l-678 0l0 240z"], ".": [684, "m342-19l0 0q-73 0-123 50q-50 49-50 122l0 0q0 73 50 123q50 49 123 49l0 0q73 0 123-49q50-50 50-123l0 0q0-73-50-122q-50-50-123-50z"], "/": [795, "m508 1560l260 0l-480-1784l-260 0l480 1784z"], ":": [684, "m342-19l0 0q-73 0-123 50q-50 49-50 122l0 0q0 73 50 123q50 49 123 49l0 0q73 0 123-49q50-50 50-123l0 0q0-73-50-122q-50-50-123-50zm0 742l0 0q-73 0-123 50q-50 49-50 122l0 0q0 73 50 123q50 49 123 49l0 0q73 0 123-49q50-50 50-123l0 0q0-73-50-122q-50-50-123-50z"], ";": [702, "m323-395l-204 0l88 620l300 0l-184-620zm37 1118l0 0q-73 0-123 50q-50 49-50 122l0 0q0 73 50 123q50 49 123 49l0 0q73 0 123-49q50-50 50-123l0 0q0-73-50-122q-50-50-123-50z"], "<": [1390, "m1185 19l-1019 452l0 247l1019 454l0-289l-693-282l0-14l693-281l0-287z"], "=": [1390, "m1194 709l-997 0l0 251l997 0l0-251zm0-479l-997 0l0 252l997 0l0-252z"], ">": [1390, "m1224 718l0-247l-1019-452l0 287l694 281l0 14l-694 282l0 289l1019-454z"], "?": [1146, "m658 458l-268 0l0 24q0 127 23 200q22 73 65 117q42 43 104 80l0 0q67 44 113 95q46 51 46 124l0 0q0 52-24 90q-25 38-66 59q-41 21-92 21l0 0q-48 0-91-21q-43-21-70-62q-28-41-31-102l0 0l-288 0q2 144 68 239q65 94 174 141q109 47 239 47l0 0q144 0 254-48q110-48 173-138q62-90 62-216l0 0q0-128-60-213q-60-85-163-146l0 0q-57-34-94-68q-38-35-56-81q-18-46-18-118l0 0l0-24zm-133-477l0 0q-78 0-128 47q-50 47-50 122l0 0q0 76 50 123q50 47 128 47l0 0q79 0 128-47q49-47 49-123l0 0q0-75-49-122q-49-47-128-47z"], "@": [2081, "m1062-428l0 0q-230 0-409 63q-180 63-305 184q-125 121-189 297q-65 175-65 400l0 0q0 216 63 393q62 176 184 304q122 128 302 197q179 69 411 69l0 0q217 0 390-64q172-65 294-181q121-116 185-272q64-157 64-341l0 0q0-125-23-233q-23-108-72-189q-50-81-128-126q-79-46-191-46l0 0q-65 0-123 18q-58 17-97 55q-39 37-49 94l0 0l-8 0q-27-75-105-121q-79-47-197-47l0 0q-137 0-233 63q-96 63-146 176q-51 112-51 261l0 0q0 147 55 260q55 112 154 176q98 63 227 63l0 0q98 0 169-35q70-35 99-90l0 0l11 0l0 102l206 0l0-675q0-48 22-76q22-28 68-28l0 0q63 0 100 41q37 40 53 124q16 83 16 213l0 0q0 146-42 266q-42 119-126 205q-84 86-210 133q-126 46-294 46l0 0q-177 0-312-49q-136-50-228-144q-92-94-138-229q-47-136-47-307l0 0q0-174 48-308q47-135 141-226q93-92 231-139q137-47 318-47l0 0q82 0 157 12q75 12 137 30q62 18 103 35l0 0l79-208q-49-24-127-47q-78-23-173-37q-95-15-199-15zm-40 667l0 0q83 0 137 33q54 33 81 98q26 65 26 160l0 0q0 96-27 155q-28 59-82 86q-54 27-132 27l0 0q-76 0-129-34q-54-34-82-94q-28-60-28-139l0 0q0-84 26-150q25-66 78-104q52-38 132-38z"], "A": [1529, "m386 0l-337 0l509 1490l400 0l522-1490l-339 0l-115 346l-529 0l-111-346zm187 585l374 0l-45 134q-43 139-87 305l0 0q-29 107-60 226l0 0q-30-121-56-228l0 0q-42-167-83-303l0 0l-43-134z"], "B": [1355, "m764 0l-629 0l0 1490l591 0q164 0 274-49q109-50 164-136q54-86 54-198l0 0q0-88-35-153q-35-66-95-107q-61-42-138-60l0 0l0-15q84-3 159-47q74-45 121-124q46-80 46-190l0 0q0-118-58-211q-58-93-171-146q-114-54-283-54l0 0zm-324 655l0-404l264 0q134 0 196 52q62 52 62 137l0 0q0 63-30 112q-31 48-87 76q-56 27-133 27l0 0l-272 0zm0 586l0-377l241 0q65 0 117 24q52 23 82 67q29 43 29 103l0 0q0 81-57 132q-58 51-165 51l0 0l-247 0z"], "C": [1515, "m786-20l0 0q-198 0-354 90q-157 90-247 261q-91 171-91 413l0 0q0 243 91 415q91 171 248 261q157 90 353 90l0 0q127 0 237-35q109-36 194-104q85-68 139-166q54-99 71-225l0 0l-309 0q-10 62-38 110q-29 47-71 81q-43 33-98 51q-55 17-119 17l0 0q-116 0-203-58q-88-58-136-168q-49-111-49-269l0 0q0-161 49-271q49-110 136-166q87-56 202-56l0 0q64 0 119 18q54 17 98 51q43 33 72 81q28 48 39 109l0 0l309 0q-12-104-61-199q-50-95-132-170q-82-75-195-118q-113-43-254-43z"], "D": [1479, "m659 0l0 0l-524 0l0 1490l529 0q224 0 386-89q161-90 248-256q87-167 87-399l0 0q0-233-87-400q-87-167-249-256q-163-90-390-90zm-219 1227l0-964l204 0q144 0 242 51q97 51 146 158q49 107 49 274l0 0q0 166-49 273q-50 106-146 157q-97 51-240 51l0 0l-206 0z"], "E": [1244, "m1134 0l-999 0l0 1490l997 0l0-253l-692 0l0-360l640 0l0-249l-640 0l0-375l694 0l0-253z"], "F": [1202, "m440 0l-305 0l0 1490l980 0l0-253l-675 0l0-416l609 0l0-249l-609 0l0-572z"], "G": [1537, "m795-20l0 0q-209 0-366 93q-158 92-246 264q-89 171-89 406l0 0q0 242 92 414q92 171 249 262q157 91 353 91l0 0q126 0 235-36q108-37 193-104q84-67 138-158q53-92 69-203l0 0l-310 0q-16 54-44 97q-29 42-69 72q-41 30-93 46q-52 15-114 15l0 0q-115 0-203-57q-88-58-137-168q-49-110-49-268q0-158 49-268q48-111 136-169q88-58 208-58l0 0q108 0 185 39q77 39 119 112l0 0q39 69 41 160l0 0l-324 0l0 232l620 0l0-186q0-196-83-336q-83-141-228-216q-145-76-332-76z"], "H": [1530, "m440 0l-305 0l0 1490l305 0l0-602l649 0l0 602l306 0l0-1490l-306 0l0 635l-649 0l0-635z"], "I": [575, "m135 1490l305 0l0-1490l-305 0l0 1490z"], "J": [1197, "m567-20l0 0q-232 0-365 122q-134 121-134 346l0 0l0 87l305 0l0-92q0-107 53-162q52-55 141-55l0 0q89 0 141 55q52 55 52 163l0 0l0 1046l302 0l0-1041q0-226-132-347q-132-122-363-122z"], "K": [1473, "m440 0l-305 0l0 1490l305 0l0-407l-4-338q7 12 14 23l0 0q44 70 97 141q53 70 121 153l0 0l365 428l373 0l-557-645l573-845l-361 0l-424 644l-197-218l0-426z"], "L": [1158, "m1083 0l-948 0l0 1490l305 0l0-1237l643 0l0-253z"], "M": [1908, "m438 0l-303 0l0 1490l468 0l242-684q15-48 35-124q19-76 39-164l0 0q20-86 37-167l0 0q17 80 36 165l0 0q20 88 40 165q19 77 34 125l0 0l238 684l470 0l0-1490l-307 0l0 702q0 49 2 122q1 73 4 158q2 84 4 170l0 0q1 38 2 75l0 0q-11-42-22-85l0 0q-23-89-46-172q-24-83-45-152q-21-70-36-116l0 0l-247-702l-257 0l-251 702q-15 46-36 115q-21 68-44 151q-24 83-48 172l0 0q-10 38-20 76l0 0q0-29 1-60l0 0q2-85 5-170q2-86 4-159q1-74 1-125l0 0l0-702z"], "N": [1561, "m447 0l-312 0l0 1490l340 0l471-754q36-58 73-126q37-68 76-151l0 0q19-41 37-87l0 0q-2 38-4 77l0 0q-6 94-10 180q-4 86-4 146l0 0l0 715l312 0l0-1490l-341 0l-428 684q-47 77-87 150q-40 72-83 160l0 0q-27 53-60 120l0 0q4-61 7-118l0 0q6-99 10-179q3-81 3-132l0 0l0-685z"], "O": [1578, "m789-20l0 0q-197 0-354 90q-158 90-249 261q-92 171-92 413l0 0q0 243 92 415q91 171 249 261q157 90 354 90l0 0q198 0 355-90q157-90 249-261q91-172 91-415l0 0q0-242-91-413q-92-171-249-261q-157-90-355-90zm0 271l0 0q116 0 203 57q86 56 134 167q48 110 48 269l0 0q0 161-48 272q-48 110-134 167q-87 56-203 56l0 0q-115 0-202-57q-87-57-135-167q-48-111-48-271l0 0q0-159 48-269q48-110 135-167q87-57 202-57z"], "P": [1327, "m440 0l-305 0l0 1490l581 0q170 0 289-64q119-65 182-178q62-114 62-261l0 0q0-148-63-260q-64-113-184-176q-121-64-293-64l0 0l-269 0l0-487zm0 1238l0-505l220 0q94 0 155 33q60 32 90 89q29 57 29 132q0 75-29 132q-30 56-91 88q-61 31-155 31l0 0l-219 0z"], "Q": [1591, "m789-20l0 0q-197 0-354 90q-158 90-249 261q-92 171-92 413l0 0q0 243 92 415q91 171 249 261q157 90 354 90l0 0q198 0 355-90q157-90 249-261q91-172 91-415l0 0q0-242-91-413l0 0q-58-108-142-183l0 0l215-272l-285 0l-123 153q-123-49-269-49zm96 282l-190 250l261 0l109-139q36 43 61 102l0 0q48 110 48 269l0 0q0 161-48 272q-48 110-134 167q-87 56-203 56l0 0q-115 0-202-57q-87-57-135-167q-48-111-48-271l0 0q0-159 48-269q48-110 135-167q87-57 202-57l0 0q51 0 96 11l0 0z"], "R": [1345, "m440 0l-305 0l0 1490l581 0q170 0 289-60q119-60 182-169q62-109 62-256q0-147-63-253q-64-107-184-163l0 0q-9-4-17-8l0 0l317-581l-338 0l-285 532l-239 0l0-532zm0 1238l0-459l220 0q94 0 154 26q60 25 90 76q30 50 30 124l0 0q0 76-30 128q-30 51-90 78q-61 27-155 27l0 0l-219 0z"], "S": [1341, "m681-22l0 0q-179 0-311 55q-133 55-207 163q-74 108-78 266l0 0l297 0q6-75 45-125q39-51 104-76q65-25 147-25l0 0q82 0 143 24q60 23 94 66q34 43 34 100l0 0q0 51-30 86q-31 34-88 59q-57 25-139 44l0 0l-164 41q-189 46-296 145q-107 98-107 260l0 0q0 135 73 236q72 101 199 157q126 56 288 56l0 0q165 0 288-56q123-57 192-157q69-101 71-232l0 0l-295 0q-8 90-76 139q-69 49-183 49l0 0q-77 0-132-22q-55-22-83-61q-29-39-29-89l0 0q0-55 33-91q33-37 88-59q55-23 117-38l0 0l135-33q94-21 175-57q81-36 142-88q61-53 95-125q33-72 33-166l0 0q0-135-68-235q-68-101-197-156q-129-55-310-55z"], "T": [1367, "m531 1237l-456 0l0 253l1217 0l0-253l-455 0l0-1237l-306 0l0 1237z"], "U": [1499, "m749-21l0 0q-184 0-322 69q-139 68-215 190q-77 122-77 285l0 0l0 967l305 0l0-942q0-87 39-154q38-68 108-106q69-39 162-39l0 0q94 0 164 39q69 38 108 106q38 67 38 154l0 0l0 942l306 0l0-967q0-163-77-285q-77-122-215-190q-139-69-324-69z"], "V": [1529, "m970 0l-399 0l-522 1490l339 0l238-719q43-136 87-299l0 0q29-107 59-227l0 0q31 121 58 228l0 0q42 162 83 298l0 0l230 719l337 0l-510-1490z"], "W": [2125, "m798 0l-349 0l-400 1490l333 0l173-733q21-92 39-196q17-105 34-210l0 0q4-23 7-45l0 0q4 22 8 45l0 0q18 105 37 210q19 104 42 196l0 0l182 733l317 0l181-733q23-92 42-196q19-105 38-210l0 0q3-22 7-42l0 0q3 20 7 42l0 0q16 105 35 210q18 104 38 196l0 0l173 733l334 0l-401-1490l-348 0l-198 762q-32 127-54 275l0 0q-7 43-14 86l0 0q-6-40-11-80l0 0q-20-146-55-281l0 0l-197-762z"], "X": [1512, "m404 0l-353 0l535 762l-487 728l354 0l163-250q46-71 76-127q29-57 54-109l0 0q6-15 14-30l0 0q7 15 14 29l0 0q25 52 55 109q30 57 76 128l0 0l166 250l346 0l-482-719l526-771l-362 0l-207 312q-41 63-66 107q-26 44-46 84l0 0q-11 20-24 44l0 0q-12-23-23-43l0 0q-21-40-47-84q-26-45-68-108l0 0l-214-312z"], "Y": [1497, "m905 0l-304 0l0 560l-552 930l357 0l252-464q39-70 69-139l0 0q14-32 28-69l0 0q14 38 27 70l0 0q29 69 66 138l0 0l244 464l356 0l-543-930l0-560z"], "Z": [1360, "m1248 0l-1133 0l0 183l604 853q56 78 123 157l0 0q21 24 42 48l0 0q-42-2-84-2l0 0q-101-2-201-2l0 0l-487 0l0 253l1133 0l0-184l-593-838q-59-82-128-163l0 0q-24-28-48-56l0 0q47 2 94 3l0 0q104 1 208 1l0 0l470 0l0-253z"], "[": [772, "m670-279l-488 0l0 1860l488 0l0-228l-199 0l0-1404l199 0l0-228z"], "\\": [795, "m768-224l-260 0l-480 1784l260 0l480-1784z"], "]": [772, "m591-279l-489 0l0 228l199 0l0 1404l-199 0l0 228l489 0l0-1860z"], "^": [997, "m300 814l-231 0l307 641l245 0l307-641l-231 0l-192 437l-13 0l-192-437z"], "_": [975, "m0 0l975 0l0-231l-975 0l0 231z"], "`": [748, "m578 1260l-211 0l-206 311l278 0l139-311z"], "a": [1189, "m440-22l0 0q-106 0-190 38q-85 37-133 112q-49 74-49 185l0 0q0 93 35 156q34 63 94 101q59 38 135 58q75 20 158 28l0 0q97 10 157 19q59 8 87 27q27 18 27 54l0 0l0 5q0 48-20 81q-20 33-59 51q-40 17-96 17l0 0q-58 0-101-17q-43-18-70-47q-27-29-40-65l0 0l-275 45q29 98 96 166q67 68 167 104q99 36 224 36l0 0q90 0 175-21q85-22 153-67q67-45 107-117q39-73 39-174l0 0l0-753l-284 0l0 155l-10 0q-27-52-72-91q-45-40-108-63q-64-23-147-23zm85 211l0 0q71 0 125 28q53 28 83 76q30 48 30 107l0 0l0 121q-13-10-40-18q-27-8-60-14q-33-6-65-11q-32-5-57-8l0 0q-55-8-97-26q-42-18-65-47q-23-30-23-76l0 0q0-43 22-72q22-30 60-45q38-15 87-15z"], "b": [1291, "m754-19l0 0q-91 0-154 31q-63 31-102 77q-40 45-61 90l0 0l-14 0l0-179l-295 0l0 1490l300 0l0-560l9 0q21 44 60 91q38 47 101 79q63 32 158 32l0 0q124 0 227-64q103-64 165-192q61-128 61-319l0 0q0-186-60-314q-60-129-163-195q-103-67-232-67zm-92 241l0 0q78 0 132 43q53 43 81 119q27 76 27 174l0 0q0 98-27 173q-28 75-81 118q-53 43-132 43l0 0q-77 0-131-41q-54-42-82-116q-28-75-28-177l0 0q0-101 29-176q28-76 82-118q54-42 130-42z"], "c": [1205, "m628-22l0 0q-169 0-291 73q-123 72-189 202q-67 129-67 301l0 0q0 174 67 304q66 129 189 202q122 72 291 72l0 0q99 0 183-26q84-26 149-74q65-48 107-117q42-69 58-155l0 0l-279-52q-9 44-28 79q-19 34-46 59q-27 24-62 37q-36 13-79 13l0 0q-80 0-134-43q-55-43-82-120q-28-77-28-178l0 0q0-99 28-176q27-77 82-121q54-44 134-44l0 0q43 0 79 14q36 13 64 39q28 25 47 61q19 36 27 81l0 0l279-51q-16-89-58-158q-42-70-107-120q-65-50-149-76q-85-26-185-26z"], "d": [1291, "m536-19l0 0q-128 0-231 67q-104 66-164 195q-60 128-60 314l0 0q0 191 62 319q62 128 165 192q103 64 227 64l0 0q95 0 158-32q63-32 102-79q39-47 58-91l0 0l10 0l0 560l300 0l0-1490l-295 0l0 179l-15 0q-20-45-59-90q-40-46-103-77q-63-31-155-31zm93 241l0 0q76 0 130 42q54 42 82 118q28 75 28 176l0 0q0 102-27 177q-28 74-82 116q-54 41-131 41l0 0q-79 0-132-43q-54-43-81-118q-27-75-27-173l0 0q0-98 28-174q27-76 81-119q53-43 131-43z"], "e": [1220, "m633-22l0 0q-171 0-295 70q-124 70-190 199q-67 129-67 306l0 0q0 173 66 303q66 130 187 203q121 73 284 73l0 0q110 0 205-35q95-35 167-105q72-71 113-177q40-106 40-250l0 0l0-84l-765 0q3-85 33-145l0 0q32-66 91-99q58-33 136-33l0 0q53 0 96 15q43 15 74 45q30 29 46 72l0 0l272-51q-27-92-94-161q-67-70-167-108q-101-38-232-38zm-253 691l0 0l474 0q-6 56-24 102l0 0q-27 64-79 100q-53 35-130 35l0 0q-78 0-132-36q-55-36-83-97l0 0q-21-47-26-104z"], "f": [815, "m516 1118l234 0l0-229l-234 0l0-889l-299 0l0 889l-197 0l0 229l197 0l0 86q0 119 48 198q47 79 129 119q82 39 186 39l0 0q71 0 130-11q58-12 85-20l0 0l-54-226q-19 5-44 10q-26 5-56 5l0 0q-68 0-96-32q-29-33-29-92l0 0l0-76z"], "g": [1294, "m625-442l0 0q-140 0-244 36q-104 35-169 97q-65 62-90 141l0 0l258 72q14-31 44-60q29-30 78-49q49-19 121-19l0 0q115 0 181 53q65 52 65 163l0 0l0 206l-23 0q-20-45-58-87q-38-42-99-68q-62-27-153-27l0 0q-126 0-229 59q-103 59-164 180q-62 121-62 306l0 0q0 189 63 316q62 127 166 191q103 64 227 64l0 0q94 0 158-31q64-32 104-79q39-48 59-92l0 0l13 0l0 188l295 0l0-1109q0-151-69-251q-70-100-192-150q-122-50-280-50zm5 686l0 0q77 0 131 38q53 38 81 110q28 71 28 171l0 0q0 99-28 173q-28 74-81 115q-54 41-131 41l0 0q-79 0-132-42q-54-43-81-117q-28-74-28-170l0 0q0-98 28-169q27-72 81-111q54-39 132-39z"], "h": [1275, "m428 647l0 0l0-647l-300 0l0 1490l294 0l0-587q42 95 110 153l0 0q89 76 231 76l0 0q116 0 203-50q86-51 134-145q48-95 48-226l0 0l0-711l-301 0l0 659q0 104-53 163q-54 59-149 59l0 0q-63 0-112-27q-50-28-77-80q-28-52-28-127z"], "i": [555, "m428 0l-300 0l0 1118l300 0l0-1118zm-150 1264l0 0q-68 0-116 45q-48 45-48 109l0 0q0 64 48 109q48 45 116 45l0 0q68 0 117-44q48-45 48-110l0 0q0-64-48-109q-49-45-117-45z"], "j": [555, "m127-53l0 1171l301 0l0-1175q0-128-50-207q-50-80-143-117q-94-37-224-37l0 0l-61 0l0 236l40 0q76 0 107 33q30 32 30 96l0 0zm151 1317l0 0q-68 0-116 45q-48 45-48 109l0 0q0 64 48 109q48 45 116 45l0 0q68 0 117-44q48-45 48-110l0 0q0-64-48-109q-49-45-117-45z"], "k": [1188, "m428 0l-300 0l0 1490l300 0l0-802l17 0l366 430l347 0l-418-486l439-632l-353 0l-312 455l-86-96l0-359z"], "l": [555, "m128 1490l300 0l0-1490l-300 0l0 1490z"], "m": [1869, "m428 0l-300 0l0 1118l278 0l12-217q23 62 58 107l0 0q50 65 118 96q68 31 143 31l0 0q121 0 195-76l0 0q59-61 93-174l0 0q24 66 63 114l0 0q56 69 134 103q77 33 162 33l0 0q103 0 184-45q80-45 127-129q46-85 46-207l0 0l0-754l-300 0l0 697q0 95-51 141q-52 46-127 46l0 0q-56 0-97-24q-42-25-64-69q-23-44-23-103l0 0l0-688l-290 0l0 705q0 82-48 131q-49 48-126 48l0 0q-53 0-95-24q-43-24-67-70q-25-47-25-114l0 0l0-676z"], "n": [1275, "m428 647l0 0l0-647l-300 0l0 1118l283 0l4-231q43 106 117 169l0 0q89 76 231 76l0 0q116 0 203-50q86-51 134-145q47-95 47-226l0 0l0-711l-300 0l0 659q0 104-53 163q-54 59-149 59l0 0q-63 0-112-27q-50-28-77-80q-28-52-28-127z"], "o": [1256, "m628-22l0 0q-168 0-291 73q-123 72-189 202q-67 129-67 301l0 0q0 174 67 304q66 129 189 202q123 72 291 72l0 0q169 0 292-72q122-73 189-202q66-130 66-304l0 0q0-172-66-301q-67-130-189-202q-123-73-292-73zm0 236l0 0q80 0 134 45q54 44 81 122q27 77 27 174l0 0q0 99-27 176q-27 77-81 121q-54 44-134 44l0 0q-80 0-133-44q-54-44-81-121q-27-77-27-176l0 0q0-97 27-174q27-78 81-122q53-45 133-45z"], "p": [1291, "m428-418l-300 0l0 1536l295 0l0-188l14 0q21 44 60 91q38 47 101 79q63 32 158 32l0 0q124 0 227-64q103-64 165-192q61-128 61-319l0 0q0-186-60-314q-60-129-163-195q-103-67-232-67l0 0q-91 0-154 31q-63 31-102 77q-40 45-61 90l0 0l-9 0l0-597zm234 640l0 0q78 0 132 43q53 43 81 119q27 76 27 174l0 0q0 98-27 173q-28 75-81 118q-53 43-132 43l0 0q-77 0-131-41q-54-42-82-116q-28-75-28-177l0 0q0-101 29-176q28-76 82-118q54-42 130-42z"], "q": [1291, "m1163 1118l0-1536l-300 0l0 597l-10 0q-20-45-59-90q-40-46-103-77q-63-31-155-31l0 0q-128 0-231 67q-104 66-164 195q-60 128-60 314l0 0q0 191 62 319q62 128 165 192q103 64 227 64l0 0q95 0 158-32q63-32 102-79q39-47 58-91l0 0l15 0l0 188l295 0zm-534-896l0 0q76 0 130 42q54 42 82 118q28 75 28 176l0 0q0 102-27 177q-28 74-82 116q-54 41-131 41l0 0q-79 0-132-43q-54-43-81-118q-27-75-27-173l0 0q0-98 28-174q27-76 81-119q53-43 131-43z"], "r": [834, "m428 0l-300 0l0 1118l290 0l0-195l12 0q31 104 104 157q72 53 166 53l0 0q23 0 50-2q27-3 47-8l0 0l0-268q-20 7-58 11q-38 4-72 4l0 0q-68 0-123-29q-55-30-85-82q-31-53-31-123l0 0l0-636z"], "s": [1147, "m572-22l0 0q-135 0-239 39q-104 38-170 112q-66 73-85 177l0 0l279 48q22-78 77-117q55-39 147-39l0 0q86 0 136 33q49 32 49 82l0 0q0 44-35 72q-36 28-109 43l0 0l-193 40q-162 33-242 113q-80 79-80 204l0 0q0 108 59 186q59 77 164 119q105 42 247 42l0 0q132 0 229-36q97-37 157-104q60-67 80-158l0 0l-266-47q-17 57-65 94q-49 36-131 36l0 0q-74 0-124-31q-50-31-50-83l0 0q0-42 33-71q32-29 111-45l0 0l201-40q162-33 241-107q79-75 79-195l0 0q0-110-64-192q-64-83-176-129q-113-46-260-46z"], "t": [750, "m474 1118l209 0l0-229l-209 0l0-562q0-53 24-78q23-26 78-26l0 0q17 0 48 5q31 4 47 8l0 0l43-225q-50-15-99-21q-50-6-95-6l0 0q-168 0-257 82q-89 82-89 235l0 0l0 588l-154 0l0 229l154 0l0 266l300 0l0-266z"], "u": [1275, "m513-14l0 0q-116 0-203 51q-87 50-134 145q-48 94-48 225l0 0l0 711l300 0l0-659q0-104 54-163q54-59 148-59l0 0q64 0 113 28q49 27 77 80q27 52 27 126l0 0l0 647l301 0l0-1118l-284 0l-3 233q-43-108-118-171l0 0q-91-76-230-76z"], "v": [1228, "m784 0l-341 0l-412 1118l319 0l188-580q34-109 60-220l0 0q9-43 19-87l0 0q10 44 20 87l0 0q25 111 59 220l0 0l186 580l315 0l-413-1118z"], "w": [1741, "m666 0l-305 0l-330 1118l315 0l97-413q25-111 54-241l0 0q20-89 37-189l0 0q18 98 39 186l0 0q31 131 58 244l0 0l102 413l276 0l100-413q25-113 56-243l0 0q21-89 40-188l0 0q17 99 36 187l0 0q27 130 53 244l0 0l97 413l319 0l-332-1118l-305 0l-124 431q-18 65-36 144q-18 78-35 160l0 0q-4 19-8 38l0 0q-4-19-8-38l0 0q-18-82-36-161q-18-79-36-143l0 0l-124-431z"], "x": [1188, "m360 0l-318 0l360 574l-338 544l324 0l101-176q48-87 87-171l0 0q10-24 21-48l0 0q11 23 22 47l0 0q38 85 88 172l0 0l105 176l318 0l-345-548l361-570l-322 0l-124 210q-49 86-88 171l0 0q-11 23-22 46l0 0q-10-23-20-46l0 0q-38-85-86-171l0 0l-124-210z"], "y": [1233, "m120-396l0 0l69 226l37-9q60-16 107-9q47 7 76 38q28 31 34 87l0 0l8 60l-420 1121l319 0l188-580q34-110 56-220l0 0q7-37 15-75l0 0q9 38 18 76l0 0q27 110 63 219l0 0l196 580l315 0l-475-1250q-34-90-87-156q-53-66-132-102q-79-36-191-36l0 0q-60 0-112 9q-52 8-84 21z"], "z": [1173, "m1053 0l-933 0l0 182l551 686l0 8l-534 0l0 242l897 0l0-199l-520-669l0-8l539 0l0-242z"], "{": [960, "m859-53l0-226q-110 0-201 15q-92 14-158 56q-66 42-101 123q-36 80-36 213l0 0l0 174q0 112-49 163l0 0q-42 44-140 50l0 0l-34 0l0 272l34 0q98 6 140 50l0 0q49 50 49 162l0 0l0 175q0 132 36 213q35 81 101 123q66 41 158 56q91 15 201 15l0 0l0-227q-130 0-174-50q-44-51-44-159l0 0l0-218q0-55-19-107q-19-53-71-94l0 0q-51-40-145-64l0 0l0-22q94-24 145-64l0 0q52-42 71-94q19-53 19-108l0 0l0-217q0-107 44-158q44-52 174-52l0 0z"], "|": [761, "m238 1970l284 0l0-2450l-284 0l0 2450z"], "}": [960, "m102-279l0 0l0 226q130 0 174 52q44 51 44 158l0 0l0 217q0 55 19 108q18 52 71 94l0 0q50 40 144 64l0 0l0 22q-94 24-144 64l0 0q-53 41-71 94q-19 52-19 107l0 0l0 218q0 108-44 159q-44 50-174 50l0 0l0 227q110 0 201-15q91-15 157-56q66-42 102-123q35-81 35-213l0 0l0-175q0-112 50-162l0 0q48-50 168-51l0 0l5 0l0-270q-125-1-174-51q-49-51-49-163l0 0l0-174q0-133-35-213q-36-81-102-123q-66-42-157-56q-91-15-201-15z"], "~": [1390, "m390 405l-233 0q-4 137 35 231q38 94 110 142q72 47 168 47l0 0q69 0 131-28q62-28 142-99l0 0q43-37 72-56q29-20 67-20l0 0q53 0 86 41q33 41 32 128l0 0l233 0q4-137-35-231q-40-94-112-141q-72-48-166-48l0 0q-73 0-136 31q-64 30-139 95l0 0q-47 41-73 59q-27 18-64 18l0 0q-52 0-86-39q-34-39-32-130l0 0z"], "·": [684, "m342 535l0 0q-73 0-123 50q-50 49-50 122l0 0q0 73 50 123q50 49 123 49l0 0q73 0 123-49q50-50 50-123l0 0q0-73-50-122q-50-50-123-50z"], "•": [971, "m485 274l0 0q-88 0-161 43q-73 43-116 116q-43 73-43 161l0 0q0 89 43 162q43 72 116 115q73 43 161 43l0 0q89 0 162-43q72-43 115-115q43-73 43-162l0 0q0-88-43-161q-43-73-115-116q-73-43-162-43z"], "—": [2048, "m0 733l2048 0l0-240l-2048 0l0 240z"], "–": [1024, "m0 733l1024 0l0-240l-1024 0l0 240z"], "’": [636, "m369 870l-204 0l88 620l300 0l-184-620z"], "‘": [636, "m465 870l-300 0l184 620l204 0l-88-620z"], "“": [1106, "m465 870l-300 0l184 620l204 0l-88-620zm470 0l-300 0l184 620l204 0l-88-620z"], "”": [1089, "m369 870l-204 0l88 620l300 0l-184-620zm453 0l-204 0l88 620l300 0l-184-620z"], "…": [2052, "m342-19l0 0q-73 0-123 50q-50 49-50 122l0 0q0 73 50 123q50 49 123 49l0 0q73 0 123-49q50-50 50-123l0 0q0-73-50-122q-50-50-123-50zm684 0l0 0q-73 0-123 50q-50 49-50 122l0 0q0 73 50 123q50 49 123 49l0 0q73 0 123-49q50-50 50-123l0 0q0-73-50-122q-50-50-123-50zm684 0l0 0q-73 0-123 50q-50 49-50 122l0 0q0 73 50 123q50 49 123 49l0 0q73 0 123-49q50-50 50-123l0 0q0-73-50-122q-50-50-123-50z"], "×": [1390, "m1222 254l-185-185l-340 339l-340-339l-186 185l340 340l-340 339l186 188l340-341l340 341l185-188l-339-339l339-340z"], "±": [1390, "m568 661l-383 0l0 234l383 0l0 256l254 0l0-256l382 0l0-234l-382 0l0-255l-254 0l0 255zm636-604l-1019 0l0 241l1019 0l0-241z"], "©": [1872, "m530 744l0 0q0 115 56 208q55 93 149 149q94 56 208 56l0 0q100 0 185-44q84-44 139-118q54-75 66-170l0 0l-212 0q-12 57-63 93q-51 36-115 36l0 0q-57 0-105-28q-48-28-76-75q-29-48-29-106l0 0q0-57 29-104q28-48 76-76q48-29 105-29l0 0q64 0 112 36q47 36 59 92l0 0l211 0q-11-94-64-169q-53-76-135-119q-83-43-183-43l0 0q-114 0-208 56q-94 55-149 149q-56 93-56 206zm406-767l0 0q-159 0-298 60q-139 59-245 165q-106 106-165 245q-60 139-60 298l0 0q0 159 60 298q59 139 165 245q106 106 245 166q139 59 298 59l0 0q159 0 298-59q139-60 245-166q106-106 166-245q59-139 59-298l0 0q0-159-59-298q-60-139-166-245q-106-106-245-165q-139-60-298-60zm0 237l0 0q110 0 206 41q96 41 170 115q73 73 114 169q41 96 41 206l0 0q0 110-41 206q-41 96-114 170q-74 73-170 114q-96 41-206 41l0 0q-110 0-206-41q-96-41-169-114q-74-74-115-170q-41-96-41-206l0 0q0-110 41-206q41-96 115-169q73-74 169-115q96-41 206-41z"], "®": [1356, "m678 346l0 0q-120 0-225 46q-106 45-186 125q-80 80-125 186q-45 105-45 225q0 120 45 226q45 105 125 185q80 80 186 126q105 45 225 45l0 0q121 0 227-45q105-46 185-126q80-80 125-185q45-106 45-226q0-120-45-225q-45-106-125-186q-80-80-185-125q-106-46-227-46zm0 153l0 0q119 0 217 58q97 58 155 155q57 97 57 216q0 119-58 216q-58 97-155 155q-97 58-216 58l0 0q-118 0-215-58q-98-58-156-155q-58-97-58-216l0 0q0-118 58-215q58-98 156-156q97-58 215-58zm256 165l-153 0l-84 181l-91 0l0-181l-138 0l0 536l263 0q50 0 92-20q42-21 68-60q25-39 25-96q0-57-26-97l0 0q-24-36-59-56l0 0l103-207zm-328 435l0-163l89 0q30 0 53 21q22 21 22 64l0 0q0 42-22 60q-23 18-52 18l0 0l-90 0z"], "™": [1311, "m962 954l-74 0l-124 309l0-309l-131 0l0 536l157 0l135-357l134 357l158 0l0-536l-132 0l0 308l-123-308zm-585 0l-133 0l0 426l-162 0l0 110l457 0l0-110l-162 0l0-426z"], "€": [1402, "m579 975l522 0l-71-157l-476 0q-2-36-2-75l0 0q0-37 2-71l0 0l409 0l-77-162l-307 0q7-25 16-47l0 0q42-109 119-160q76-51 178-51l0 0q65 0 118 17q52 17 93 41q40 24 67 44l0 0l115-241q-79-66-179-99q-101-34-214-34l0 0q-189 0-335 91q-146 90-229 261l0 0q-39 81-60 178l0 0l-210 0l59 162l130 0q-2 35-2 71l0 0q0 38 2 75l0 0l-189 0l59 157l150 0q21 98 61 181l0 0q83 171 229 263q146 91 335 91l0 0q116 0 216-34q100-35 182-102l0 0l-114-243q-29 22-71 47q-42 24-95 42q-53 17-118 17l0 0q-102 0-178-52q-77-53-119-162l0 0q-9-23-16-48l0 0z"], "£": [1308, "m897 0l-803 0l0 254q83 0 128 40q44 39 40 116l0 0l-12 238l-156 0l0 194l147 0l-8 162q-9 158 53 272q62 113 177 175q115 61 263 61l0 0q127 0 230-48q102-49 169-139q66-90 86-213l0 0l-281-44q-14 92-64 141q-50 49-135 49l0 0q-74 0-121-28q-48-29-69-83q-22-54-20-128l0 0l6-177l392 0l0-194l-386 0l7-193q3-77-34-124q-37-48-95-74l0 0q-4-2-7-3l0 0l483 0q29 0 42 14q13 13 13 41l0 0l0 56l279 0l0-56q0-151-82-230q-82-79-242-79l0 0z"], "°": [941, "m472 788l0 0q-99 0-180 48q-81 48-129 129q-48 81-48 178l0 0q0 99 48 180q48 81 129 129q81 48 179 48l0 0q98 0 179-48q80-48 128-129q48-81 48-180l0 0q0-97-48-178q-48-81-128-129q-81-48-178-48zm-1 202l0 0q43 1 78 22q34 20 55 55q20 34 20 76l0 0q0 43-20 78q-21 34-56 55q-35 20-77 20l0 0q-42 0-77-20q-35-21-55-55q-21-35-21-77l0 0q0-42 21-77q20-35 55-55q35-21 77-22z"], "−": [1390, "m189 722l1013 0l0-255l-1013 0l0 255z"], "↑": [1854, "m367 628l-165 165l725 725l725-725l-164-165l-232 233q-54 54-112 127q-59 72-110 142l0 0q-9 10-16 21l0 0q1-7 3-15l0 0q10-56 18-116q8-60 8-110l0 0l0-910l-240 0l0 910q0 50 8 110q8 60 19 116l0 0q1 7 2 14l0 0q-33-45-71-94l0 0q-43-55-86-106q-43-51-80-89l0 0l-232-233z"], "↓": [1854, "m1487 862l165-165l-726-725l-724 725l164 165l232-233q54-54 113-126q58-73 110-142l0 0q8-10 15-20l0 0q-1 7-2 14l0 0q-11 56-19 116q-8 59-8 109l0 0l0 910l240 0l0-910q0-50-8-109q-8-60-18-116l0 0q-2-8-3-15l0 0q33 45 72 94l0 0q42 55 85 106q43 51 80 89l0 0l232 233z"] }, "kern": { "24": -32, "41": -78, "70": -32, "73": -34, "74": -119, "75": -20, "76": -32, "77": 40, "78": -29, "79": -20, "97": -40, '"&': -69, '",': -184, '".': -184, '"4': -128, '"…': -184, "%’": -139, "%‘": -128, "%“": -128, "%”": -139, '&"': -69, "&'": -69, "&\\": -128, "&‘": -186, "&“": -186, "&®": -46, "&™": -81, "'&": -69, "',": -184, "'.": -184, "'4": -128, "'…": -184, "(|": 37, ")‘": -69, ")“": -69, "*&": -69, "*,": -279, "*.": -279, "*4": -93, "*@": -35, "*_": -139, "*…": -279, "*©": -35, "+2": -44, "+3": -11, "+7": -58, "+\\": -92, "+‘": -59, "+“": -59, ", ": -63, ",!": -25, ',"': -203, ",'": -203, ",0": -60, ",1": -185, ",3": -47, ",5": -13, ",6": -60, ",7": -52, ",8": -58, ",9": -26, ",?": -180, ",@": -90, ",’": -194, ",”": -194, ",©": -90, "-2": -44, "-3": -11, "-7": -58, "-\\": -92, "-‘": -59, "-“": -59, ". ": -63, ".!": -25, '."': -203, ".'": -203, ".0": -60, ".1": -185, ".3": -47, ".5": -13, ".6": -60, ".7": -52, ".8": -58, ".9": -26, ".?": -180, ".@": -90, ".’": -194, ".”": -194, ".©": -90, "/,": -81, "/.": -81, "/\\": 16, "/…": -81, "0,": -60, "0.": -60, "07": -40, "0\\": -52, "0_": -93, "0‘": -93, "0“": -93, "0…": -60, "1)": 37, "1]": 37, "1_": 37, "1}": 37, "3*": -14, "3,": -43, "3.": -43, "3^": -14, "3…": -43, "3°": -14, "4*": -72, "4,": -69, "4.": -69, "4^": -72, "4…": -69, "4®": -11, "4°": -72, "5*": -11, "5,": -47, "5.": -47, "5^": -11, "5…": -47, "5®": -11, "5°": -11, "6,": -61, "6.": -61, "6_": -93, "6…": -61, "7#": -116, "7&": -93, "7,": -256, "7.": -256, "7:": -69, "7;": -69, "7<": -186, "7_": -325, "7…": -256, "8*": -14, "8,": -43, "8.": -43, "8^": -14, "8…": -43, "8°": -14, "9,": -60, "9.": -60, "9\\": -52, "9_": -93, "9‘": -93, "9“": -93, "9…": -60, ":\\": -128, ":‘": -93, ":“": -93, ";\\": -128, ";‘": -93, ";“": -93, "=\\": -139, "=‘": -116, "=“": -116, ">7": -151, ">\\": -151, ">‘": -197, ">“": -197, "@,": -90, "@.": -90, "@/": -81, "@\\": -82, "@_": -81, "@‘": -69, "@“": -69, "@…": -90, "@®": -11, "[|": 37, '\\"': -162, "\\$": -31, "\\'": -162, "\\*": -194, "\\+": -69, "\\-": -69, "\\/": 24, "\\1": -102, "\\<": -78, "\\=": -104, "\\?": -128, "\\@": -86, "\\\\": -100, "\\^": -194, "\\~": -69, "\\·": -69, "\\•": -69, "\\’": -116, "\\‘": -87, "\\“": -87, "\\”": -116, "\\×": -69, "\\±": -104, "\\©": -86, "\\®": -145, "\\™": -151, "\\°": -194, "\\−": -69, "]‘": -69, "]“": -69, "^&": -69, "^,": -279, "^.": -279, "^4": -93, "^@": -35, "^_": -139, "^…": -279, "^©": -35, "_*": -139, "_0": -93, "_1": -221, "_3": -93, "_4": -116, "_5": -93, "_6": -93, "_8": -93, "_9": -93, "_@": -81, "_\\": -162, "_^": -139, "_|": 69, "_‘": -81, "_“": -81, "_©": -81, "_°": -139, "{|": 37, "|)": 37, "|]": 37, "|_": 37, "|}": 37, "}‘": -69, "}“": -69, "~2": -44, "~3": -11, "~7": -58, "~\\": -92, "~‘": -59, "~“": -59, "·2": -44, "·3": -11, "·7": -58, "·\\": -81, "·‘": -59, "·“": -59, "•\\": -81, "’#": -256, "’&": -139, "’+": -109, "’,": -265, "’-": -109, "’.": -265, "’/": -290, "’0": -93, "’4": -197, "’6": -93, "’7": -128, "’8": -81, "’:": -116, "’;": -116, "’<": -197, "’=": -116, "’@": -116, "’_": -81, "’~": -93, "’·": -109, "’…": -265, "’±": -116, "’©": -116, "’−": -109, "‘&": -128, "‘,": -218, "‘.": -218, "‘/": -197, "‘4": -128, "‘…": -218, "“&": -128, "“,": -218, "“.": -218, "“/": -197, "“4": -128, "“…": -218, "”#": -256, "”&": -139, "”+": -109, "”,": -265, "”-": -109, "”.": -265, "”/": -290, "”0": -93, "”4": -197, "”6": -93, "”7": -128, "”8": -81, "”:": -116, "”;": -116, "”<": -197, "”=": -116, "”@": -116, "”_": -81, "”~": -93, "”·": -109, "”…": -265, "”±": -116, "”©": -116, "”−": -109, "… ": -63, "…!": -25, '…"': -203, "…'": -203, "…0": -60, "…1": -185, "…3": -47, "…5": -13, "…6": -60, "…7": -52, "…8": -58, "…9": -26, "…?": -180, "…@": -90, "…’": -194, "…”": -194, "…©": -90, "×\\": -81, "±\\": -139, "±‘": -116, "±“": -116, "©,": -90, "©.": -90, "©/": -81, "©\\": -82, "©_": -81, "©‘": -69, "©“": -69, "©…": -90, "©®": -11, "®&": -69, "®4": -101, "®@": -11, "®©": -11, "™&": -81, "°&": -69, "°,": -279, "°.": -279, "°4": -93, "°@": -35, "°_": -139, "°…": -279, "°©": -35, "−2": -44, "−3": -11, "−7": -58, "−\\": -92, "−‘": -59, "−“": -59 } }, "mono-400": { "upm": 1e3, "asc": 1020, "desc": -300, "lineGap": 0, "typoAsc": 1020, "typoDesc": -300, "capH": 730, "xH": 550, "glyphs": { "0": [600, "m300-10l0 0q-67 0-116 27q-50 26-77 75q-27 48-27 113l0 0l0 320q0 66 27 114q27 48 77 75q49 26 116 26l0 0q68 0 117-26q49-27 76-75q27-48 27-114l0 0l0-320q0-65-27-113q-27-49-76-75q-50-27-117-27zm0 77l0 0q60 0 97 39q36 38 36 99l0 0l0 320q0 61-36 100q-37 38-97 38l0 0q-60 0-96-38q-37-39-37-100l0 0l0-320q0-61 37-99q36-39 96-39zm0 239l0 0q-27 0-43 17q-17 17-17 45l0 0q0 27 17 44q16 16 43 16l0 0q27 0 44-16q16-17 16-44l0 0q0-28-16-45q-17-17-44-17z"], "1": [600, "m540 0l-450 0l0 82l198 0l0 573l-198-148l0 100l165 123l123 0l0-648l162 0l0-82z"], "2": [600, "m526 0l-434 0l0 92l223 237q57 61 83 109q26 47 26 91l0 0q0 61-33 96q-34 35-92 35l0 0q-64 0-100-36q-37-36-37-99l0 0l-90 0q2 66 31 115q28 48 79 74q50 26 117 26l0 0q66 0 115-25q48-26 74-73q26-47 26-112l0 0q0-62-33-123q-33-61-108-139l0 0l-180-186l333 0l0-82z"], "3": [600, "m289-10l0 0q-66 0-115 27q-50 26-77 73q-27 47-27 110l0 0l90 0q0-61 35-95q34-35 95-35l0 0q62 0 96 36q34 36 34 94l0 0l0 52q0 62-34 96q-34 34-96 34l0 0l-75 0l0 90l181 176l-296 0l0 82l387 0l0-90l-184-178q92-3 148-57l0 0q59-57 59-153l0 0l0-52q0-63-27-110q-28-47-78-73q-50-27-116-27z"], "4": [600, "m500 0l-90 0l0 160l-330 0l0 141l289 429l98 0l-297-448l0-40l240 0l0 178l90 0l0-420z"], "5": [600, "m298-10l0 0q-89 0-146 46q-57 46-67 124l0 0l90 0q5-43 37-66q32-24 87-24l0 0q63 0 95 34q31 34 31 96l0 0l0 71q0 62-31 96q-32 34-94 34l0 0q-39 0-68-20q-29-21-42-55l0 0l-90 0l5 404l384 0l0-82l-297 0l-3-243l3 0q8 29 35 48l0 0q37 27 100 27l0 0q89 1 139-54q49-56 49-155l0 0l0-71q0-97-57-153q-57-57-160-57z"], "6": [600, "m301-10l0 0q-70 0-122 30q-53 29-82 82q-29 53-29 123l0 0q0 55 16 108q15 53 46 102l0 0l183 295l100 0l-207-332l4-3q19 28 52 43q33 15 74 15l0 0q60 0 104-28q44-28 68-79q24-51 24-121l0 0q0-70-29-123q-29-53-80-82q-52-30-122-30zm-1 80l0 0q64 0 103 43q39 42 39 112l0 0q0 70-39 113q-39 42-103 42l0 0q-64 0-103-42q-39-43-39-113l0 0q0-70 39-112q39-43 103-43z"], "7": [600, "m282 0l-97 0l261 648l-276 0l0-108l-90 0l0 190l455 0l0-88l-253-642z"], "8": [600, "m300-10l0 0q-67 0-116 24q-50 23-77 67q-27 44-27 103l0 0q0 65 36 112l0 0q34 46 109 82l0 0q-63 35-94 73l0 0q-36 45-36 108l0 0q0 56 25 97q25 41 71 63q46 22 109 22q63 0 109-22q46-22 71-63q25-41 25-97l0 0q0-63-36-107l0 0q-30-38-94-73l0 0q75-36 109-81l0 0q36-48 36-114l0 0q0-89-59-141q-60-53-161-53zm0 80l0 0q61 0 97 32q35 31 35 84l0 0q0 43-23 78q-23 35-66 56l0 0l-43 21l-46-22q-41-20-63-54q-23-35-23-77l0 0q0-54 36-86q35-32 96-32zm-29 358l28-13l26 12q44 21 68 55q24 34 24 75l0 0q0 48-31 76q-32 28-86 28q-54 0-85-28q-32-29-32-77l0 0q0-40 24-74q23-34 64-54l0 0z"], "9": [600, "m287 0l-100 0l207 332l-4 3q-19-28-52-43q-33-15-74-15l0 0q-59 0-103 28q-45 28-69 80q-24 51-24 120l0 0q0 71 29 124q29 52 81 82q52 29 121 29l0 0q70 0 123-29q52-30 81-82q29-53 29-124l0 0q0-55-15-108q-16-53-47-102l0 0l-183-295zm13 350l0 0q64 0 103 43q39 42 39 112l0 0q0 70-39 113q-39 42-103 42l0 0q-64 0-103-42q-39-43-39-113l0 0q0-70 39-112q39-43 103-43z"], " ": [600, ""], "!": [600, "m332 215l-64 0l-21 395l0 120l106 0l0-120l-21-395zm-17-220l-30 0q-26 0-43 17q-17 17-17 43l0 0q0 26 17 43q17 17 43 17l0 0l30 0q29 0 45-16q15-17 15-43l0 0q0-26-17-43q-17-18-43-18l0 0z"], '"': [600, "m439 430l-74 0l-12 210l0 90l97 0l0-90l-11-210zm-203 0l-74 0l-12 210l0 90l97 0l0-90l-11-210z"], "#": [600, "m153 0l-70 0l37 200l-85 0l0 65l97 0l36 200l-98 0l0 65l110 0l37 200l70 0l-37-200l160 0l37 200l70 0l-37-200l85 0l0-65l-97 0l-36-200l98 0l0-65l-110 0l-37-200l-70 0l37 200l-160 0l-37-200zm85 465l-36-200l160 0l36 200l-160 0z"], "$": [600, "m335-140l-60 0l0 131q-94 8-147 61q-54 52-56 138l0 0l90 0q0-49 30-80q29-31 83-38l0 0l0 262l-27 8q-75 23-115 77q-41 54-41 127l0 0q0 80 50 132q49 52 133 60l0 0l0 132l60 0l0-131q83-8 133-60q50-52 51-134l0 0l-90 0q0 47-24 77q-25 29-70 36l0 0l0-248l40-13q73-23 113-78q40-55 40-129l0 0q0-82-52-136q-53-54-141-63l0 0l0-131zm0 455l0-243q49 8 76 38q27 30 27 78l0 0q0 44-23 77q-24 33-68 46l0 0l-12 4zm-60 114l0 0l0 229q-44-7-68-34q-25-27-25-70l0 0q0-52 32-87l0 0q23-26 61-38z"], "%": [600, "m88 0l-74 0l498 730l74 0l-498-730zm357-5l0 0q-63 0-101 36q-38 36-38 99l0 0l0 65q0 63 38 99q38 36 101 36l0 0q63 0 101-36q38-36 38-99l0 0l0-65q0-63-38-99q-38-36-101-36zm0 69l0 0q65 0 65 66l0 0l0 65q0 67-65 67l0 0q-65 0-65-67l0 0l0-65q0-66 65-66zm-290 336l0 0q-63 0-101 36q-38 36-38 99l0 0l0 65q0 63 38 99q38 36 101 36l0 0q63 0 101-36q38-36 38-99l0 0l0-65q0-63-38-99q-38-36-101-36zm0 68l0 0q65 0 65 67l0 0l0 65q0 67-65 67l0 0q-32 0-48-16q-17-17-17-51l0 0l0-65q0-34 17-50q16-17 48-17z"], "&": [600, "m230-10l0 0q-82 0-128 44q-47 44-47 121l0 0l0 125q0 53 28 90q27 36 78 51l0 0l-7 10q-31 42-45 78q-14 36-14 72l0 0q0 48 23 84q22 36 63 56q40 19 94 19l0 0q58 0 101-21q42-21 65-59q23-38 23-91l0 0l-90 0q0 29-12 50q-12 21-34 32q-22 11-53 11l0 0q-27 0-47-10q-21-10-32-28q-11-19-11-45l0 0q0-25 11-54q10-29 29-55l0 0l172-237l71 127l94 0l-113-199l117-161l-99 0l-63 87q-74-97-174-97zm5 80l0 0q34 0 66 23q31 22 53 62l0 0l-147 203q-31-5-46-25q-16-20-16-53l0 0l0-125q0-40 24-62q23-23 66-23z"], "'": [600, "m332 430l-74 0l-12 150l0 150l97 0l0-150l-11-150z"], "(": [600, "m485-31l0-89q-142 35-221 138q-79 103-79 252l0 0l0 180q0 98 37 178q36 79 104 134q67 55 159 78l0 0l0-85q-64-15-111-57q-47-43-73-106q-26-63-26-142l0 0l0-180q0-77 26-140q25-63 73-104q47-42 111-57l0 0z"], ")": [600, "m115-120l0 0l0 89q65 15 112 57q47 41 73 104q25 63 25 140l0 0l0 180q0 79-26 142q-26 63-73 106q-47 42-111 57l0 0l0 85q93-23 160-78q67-55 104-134q36-80 36-178l0 0l0-180q0-149-79-252q-79-103-221-138z"], "*": [600, "m235 172l-54-78l-72 50l54 78q13 19 31 38q18 18 37 35q18 16 32 28l0 0l-3 7q-19 2-43 5q-24 2-48 8q-25 5-46 12l0 0l-88 32l30 83l88-32q21-7 44-19q22-13 43-26q21-14 36-26l0 0l5 4q-5 19-11 44q-6 24-10 51q-4 26-4 49l0 0l0 95l88 0l0-95q0-23-4-49q-4-27-10-51q-6-25-12-44l0 0l5-4q16 12 37 26q20 13 43 26q22 12 43 19l0 0l89 32l30-83l-89-32q-20-7-44-12q-25-6-49-8q-24-3-43-5l0 0l-4-8q15-12 34-28q18-17 36-35q17-19 29-37l0 0l55-78l-72-50l-55 78q-12 18-23 41q-12 23-21 46q-10 23-16 41l0 0l-7 0q-6-18-15-41q-10-23-21-46q-12-23-25-41l0 0z"], "+": [600, "m344 95l-88 0l0 195l-191 0l0 80l191 0l0 195l88 0l0-195l191 0l0-80l-191 0l0-195z"], ",": [600, "m245-160l-80 0l80 311l130 0l-130-311z"], "-": [600, "m460 290l-320 0l0 80l320 0l0-80z"], ".": [600, "m300-10l0 0q-38 0-60 22q-23 22-23 59l0 0q0 39 23 62q22 23 60 23l0 0q38 0 61-23q22-23 22-62l0 0q0-37-22-59q-23-22-61-22z"], "/": [600, "m170-110l-95 0l355 940l95 0l-355-940z"], ":": [600, "m300 410l0 0q-37 0-60 21q-23 20-23 54l0 0q0 34 23 55q23 20 60 20l0 0q38 0 61-20q22-21 22-55l0 0q0-34-22-54q-23-21-61-21zm0-420l0 0q-37 0-60 21q-23 20-23 54l0 0q0 34 23 55q23 20 60 20l0 0q38 0 61-20q22-21 22-55l0 0q0-34-22-54q-23-21-61-21z"], ";": [600, "m250-160l-80 0l80 311l130 0l-130-311zm60 570l-20 0q-33 0-54 21q-21 21-21 54l0 0q0 32 22 54q21 21 53 21l0 0l20 0q32 0 54-21q21-22 21-54l0 0q0-33-21-54q-21-21-54-21l0 0z"], "<": [600, "m515 155l0-90l-430 215l0 100l430 215l0-87l-310-152q-19-9-35-15q-17-7-25-9l0 0q9-2 26-8q17-7 34-16l0 0l310-153z"], "=": [600, "m515 410l-430 0l0 80l430 0l0-80zm0-240l-430 0l0 80l430 0l0-80z"], ">": [600, "m515 280l-430-215l0 87l310 152q19 9 36 16q16 6 24 8l0 0q-9 2-26 9q-17 6-34 15l0 0l-310 153l0 90l430-215l0-100z"], "?": [600, "m301 205l-90 0l0 180l50 0q64 0 102 36q37 35 37 94l0 0q0 59-37 95q-38 35-103 35l0 0l-125 0l0 85l125 0q70 0 122-26q51-27 80-75q28-48 28-114l0 0q0-57-24-102q-24-46-66-73q-43-27-99-30l0 0l0-105zm-31-210l-30 0q-26 0-43 17q-17 17-17 43l0 0q0 26 17 43q17 17 43 17l0 0l30 0q29 0 45-16q15-17 15-43l0 0q0-26-17-43q-17-18-43-18l0 0z"], "@": [600, "m395-180l-70 0q-85 0-148 36q-63 35-97 101q-35 65-35 153l0 0l0 340q0 90 33 155q32 65 93 100q60 35 144 35l0 0q76 0 131-29q55-30 85-85q29-55 29-131l0 0l0-430l-71 0l0 55l-11 0q-6-25-27-41l0 0q-29-24-77-24l0 0q-65 0-99 40q-35 39-35 115l0 0l0 120q0 76 35 116q34 39 99 39l0 0q48 0 77-23l0 0q21-17 27-42l0 0l12 0l-10 70l0 5q0 57-19 96q-19 39-55 59q-37 20-91 20l0 0q-90 0-140-58q-50-58-50-162l0 0l0-340q0-100 54-157q53-58 146-58l0 0l70 0l0-75zm5 298l0 0q41 0 61 25q19 25 19 77l0 0l0 111q0 47-19 69q-20 22-61 22l0 0q-40 0-60-22q-20-23-20-70l0 0l0-120q0-47 20-69q20-23 60-23z"], "A": [600, "m142 0l-92 0l190 730l121 0l189-730l-91 0l-48 194l-221 0l-48-194zm122 496l-56-226l184 0l-56 225q-16 64-25 107q-9 43-11 56l0 0q-2-13-11-56q-9-43-25-106l0 0z"], "B": [600, "m315 0l-222 0l0 730l207 0q100 0 157-50q56-50 56-139l0 0q0-50-21-87q-21-37-59-57l0 0q-14-7-29-11l0 0q19-6 37-15l0 0q42-23 66-66q23-43 23-102l0 0q0-62-26-108q-26-46-74-70q-48-25-115-25l0 0zm-134 341l0-260l124 0q63 0 100 34q36 33 36 91l0 0q0 60-36 98q-37 37-100 37l0 0l-124 0zm0 308l0-230l118 0q58 0 92 31q33 31 33 84q0 53-33 84q-33 31-91 31l0 0l-119 0z"], "C": [600, "m304-10l0 0q-66 0-114 25q-49 25-75 73q-27 47-27 112l0 0l0 330q0 66 27 113q26 47 75 72q48 25 114 25l0 0q66 0 114-25q48-26 74-73q26-47 26-112l0 0l-90 0q0 62-32 96q-33 33-92 33l0 0q-59 0-92-33q-34-33-34-95l0 0l0-331q0-62 34-95q33-34 92-34l0 0q59 0 92 34q32 33 32 95l0 0l90 0q0-64-26-111q-26-48-74-73q-48-26-114-26z"], "D": [600, "m281 0l-189 0l0 730l189 0q71 0 123-27q51-27 80-76q28-49 28-116l0 0l0-291q0-67-28-116q-29-50-80-77q-52-27-123-27l0 0zm-99 650l0-570l99 0q66 0 104 37q37 37 37 103l0 0l0 291q0 65-37 102q-38 37-104 37l0 0l-99 0z"], "E": [600, "m520 0l-420 0l0 730l420 0l0-82l-331 0l0-226l296 0l0-81l-296 0l0-259l331 0l0-82z"], "F": [600, "m185 0l-90 0l0 731l430 0l0-82l-342 0l0-243l316 0l0-82l-314 0l0-324z"], "G": [600, "m304-10l0 0q-66 0-114 25q-49 25-75 73q-27 47-27 112l0 0l0 330q0 66 27 113q26 47 75 72q48 25 114 25l0 0q66 0 114-25q48-26 74-73q26-47 26-112l0 0l-90 0q0 62-32 96q-33 33-92 33l0 0q-59 0-92-33q-34-33-34-95l0 0l0-331q0-62 34-96q33-34 92-34l0 0q59 0 92 34q32 34 32 96l0 0l0 90l-148 0l0 82l238 0l0-172q0-64-26-111q-26-48-74-73q-48-26-114-26z"], "H": [600, "m183 0l-90 0l0 730l90 0l0-312l234 0l0 312l90 0l0-730l-90 0l0 336l-234 0l0-336z"], "I": [600, "m495 0l-390 0l0 82l149 0l0 566l-149 0l0 82l390 0l0-82l-149 0l0-566l149 0l0-82z"], "J": [600, "m270-10l0 0q-105 0-165 59q-60 59-60 161l0 0l90 0q0-67 36-103q35-37 99-37l0 0q64 0 100 37q35 36 35 103l0 0l0 438l-175 0l0 82l265 0l0-520q0-102-60-161q-61-59-165-59z"], "K": [600, "m182 0l-90 0l0 730l90 0l0-313l108 0l162 313l98 0l-181-351l191-379l-103 0l-170 338l-105 0l0-338z"], "L": [600, "m535 0l-420 0l0 730l90 0l0-648l330 0l0-82z"], "M": [600, "m164 0l-88 0l0 730l118 0l76-236q11-32 20-63q9-32 13-49l0 0q5 17 13 49q8 31 18 64l0 0l72 235l118 0l0-730l-88 0l0 265q0 44 3 100q3 56 8 115q5 58 11 112q5 53 9 93l0 0l-118-365l-95 0l-119 365q5-39 10-90q5-52 9-109q4-58 7-115q3-57 3-106l0 0l0-265z"], "N": [600, "m177 0l-87 0l0 730l120 0l223-625q-2 25-4 62q-3 36-4 77q-2 40-2 76l0 0l0 410l87 0l0-730l-120 0l-222 625q2-24 4-60q2-37 4-77q1-41 1-78l0 0l0-410z"], "O": [600, "m300-10l0 0q-66 0-113 25q-48 25-73 73q-26 47-26 112l0 0l0 330q0 66 26 113q25 47 73 72q47 25 113 25l0 0q66 0 114-25q47-25 73-72q25-47 25-112l0 0l0-331q0-65-25-112q-26-48-73-73q-48-25-114-25zm0 81l0 0q59 0 91 34q31 33 31 95l0 0l0 330q0 62-31 96q-32 33-91 33l0 0q-58 0-90-33q-32-34-32-96l0 0l0-330q0-62 32-95q32-34 90-34z"], "P": [600, "m182 0l-90 0l0 730l235 0q68 0 118-26q50-27 78-75q27-48 27-114l0 0q0-65-27-113q-28-49-78-75q-50-27-118-27l0 0l-145 0l0-300zm0 649l0-268l145 0q59 0 95 37q35 36 35 97l0 0q0 62-35 98q-36 36-95 36l0 0l-145 0z"], "Q": [600, "m526-180l-104 0l-103 171q-2 0-4 0l0 0q-7-1-15-1l0 0q-67 0-116 27q-50 26-77 75q-27 48-27 113l0 0l0 320q0 66 27 114q27 48 77 75q49 26 116 26l0 0q68 0 117-26q49-27 76-75q27-48 27-114l0 0l0-320q0-67-29-117q-29-50-82-75l0 0l117-193zm-226 250l0 0q59 0 95 37q35 37 35 98l0 0l0 320q0 62-35 99q-36 36-95 36q-59 0-94-36q-36-37-36-99l0 0l0-320q0-61 36-98q35-37 94-37z"], "R": [600, "m182 0l-90 0l0 730l226 0q65 0 114-26q49-27 76-74q27-47 27-110l0 0q0-74-38-127q-39-53-105-73l0 0l153-320l-106 0l-140 310l-117 0l0-310zm0 649l0-258l136 0q56 0 90 36q34 35 34 93l0 0q0 59-34 94q-34 35-90 35l0 0l-136 0z"], "S": [600, "m304-10l0 0q-72 0-123 24q-52 24-80 69q-28 45-29 107l0 0l90 0q0-55 38-87q37-32 104-32l0 0q63 0 99 31q35 31 35 86l0 0q0 44-23 77q-24 33-68 46l0 0l-99 31q-75 23-115 77q-41 54-41 127l0 0q0 59 27 103q26 43 74 68q48 24 113 24l0 0q96 0 154-53q58-54 59-143l0 0l-90 0q0 54-32 85q-33 30-92 30l0 0q-58 0-90-28q-33-28-33-78l0 0q0-45 24-78q24-33 69-47l0 0l100-32q73-23 113-78q40-55 40-129l0 0q0-60-28-105q-28-45-78-70q-51-25-118-25z"], "T": [600, "m345 0l-90 0l0 649l-200 0l0 82l490 0l0-82l-200 0l0-649z"], "U": [600, "m300-10l0 0q-102 0-156 57q-54 56-54 153l0 0l0 530l90 0l0-530q0-60 30-95q29-35 90-35l0 0q60 0 90 35q30 35 30 95l0 0l0 530l90 0l0-530q0-98-53-154q-54-56-157-56z"], "V": [600, "m361 0l-123 0l-188 730l93 0l124-496q13-52 22-96q9-45 13-68l0 0q4 23 13 68q8 44 21 96l0 0l123 496l91 0l-189-730z"], "W": [600, "m222 0l-113 0l-84 730l86 0l55-540q2-22 4-45q2-24 4-45q1-21 1-35l0 0q2 14 4 35q1 21 4 45q2 23 5 45l0 0l68 540l93 0l62-540q3-22 6-45q2-24 5-45q2-21 3-35l0 0l3 35q1 21 4 45q2 23 4 45l0 0l57 540l82 0l-86-730l-113 0l-62 550q-2 23-4 45q-3 22-5 41q-2 19-3 31l0 0q-1-12-3-31q-3-19-5-41q-2-22-5-45l0 0l-67-550z"], "X": [600, "m140 0l-100 0l210 370l-199 360l104 0l113-216q9-17 19-36q9-20 15-31l0 0q5 11 15 31q9 19 18 36l0 0l115 216l99 0l-199-354l210-376l-103 0l-125 232q-9 17-18 37q-10 19-15 31l0 0q-5-12-14-31q-10-19-19-36l0 0l-126-233z"], "Y": [600, "m345 0l-90 0l0 273l-220 457l93 0l145-300q12-25 19-42q7-18 9-26l0 0q2 8 10 26q7 17 19 42l0 0l142 300l93 0l-220-457l0-273z"], "Z": [600, "m515 0l-430 0l0 90l329 558l-324 0l0 82l415 0l0-90l-329-558l339 0l0-82z"], "[": [600, "m450-110l-245 0l0 940l245 0l0-80l-155 0l0-780l155 0l0-80z"], "\\": [600, "m525-110l-95 0l-355 940l95 0l355-940z"], "]": [600, "m395-110l-245 0l0 80l155 0l0 780l-155 0l0 80l245 0l0-940z"], "^": [600, "m161 340l-81 0l179 390l84 0l177-390l-81 0l-112 258q-8 20-14 39q-7 18-10 28l0 0q-4-10-11-28q-7-19-16-39l0 0l-115-258z"], "_": [600, "m540-100l-480 0l0 75l480 0l0-75z"], "`": [600, "m392 645l-95 0l-115 140l100 0l110-140z"], "a": [600, "m252-10l0 0q-87 0-137 45q-50 44-50 120l0 0q0 77 50 121q50 44 135 44l0 0l170 0l0 55q0 51-30 79q-31 27-87 27l0 0q-49 0-82-20q-33-21-38-56l0 0l-90 0q9 71 67 113q58 42 145 42l0 0q95 0 150-49q55-49 55-133l0 0l0-378l-88 0l0 105l-1 0q-5-49-45-80l0 0q-47-35-124-35zm22 71l0 0q64 0 105 32q41 32 41 82l0 0l0 78l-168 0q-45 0-71-25q-26-25-26-68l0 0q0-46 32-72q31-27 87-27z"], "b": [600, "m332-10l0 0q-68 0-109 37l0 0q-34 30-40 78l0 0l-1 0l0-105l-90 0l0 730l90 0l0-160l-2-125l3 0q6 47 41 78l0 0q41 37 108 37l0 0q83 0 133-55q50-55 50-150l0 0l0-161q0-94-50-149q-50-55-133-55zm-30 78l0 0q57 0 90 34q33 34 33 98l0 0l0 150q0 64-33 98q-33 34-90 34l0 0q-55 0-87-35q-33-35-33-97l0 0l0-150q0-62 33-97q32-35 87-35z"], "c": [600, "m304-10l0 0q-66 0-115 25q-50 25-77 73q-27 47-27 112l0 0l0 150q0 66 27 113q27 47 77 72q49 25 115 25l0 0q95 0 153-51q58-51 61-139l0 0l-90 0q-3 53-35 82q-33 28-89 28l0 0q-59 0-94-33q-35-34-35-96l0 0l0-151q0-62 35-96q35-34 94-34l0 0q56 0 89 29q32 29 35 81l0 0l90 0q-3-88-61-139q-58-51-153-51z"], "d": [600, "m268-10l0 0q-82 0-132 55q-51 55-51 149l0 0l0 161q0 95 50 150q50 55 133 55l0 0q68 0 109-37l0 0q34-31 40-78l0 0l3 0l-2 125l0 160l90 0l0-730l-90 0l0 105l-1 0q-6-48-40-78l0 0q-41-37-109-37zm30 78l0 0q56 0 88 35q32 35 32 97l0 0l0 150q0 62-32 97q-32 35-88 35l0 0q-57 0-90-34q-33-34-33-98l0 0l0-150q0-64 33-98q33-34 90-34z"], "e": [600, "m300-10l0 0q-65 0-113 26q-49 26-75 74q-27 47-27 110l0 0l0 150q0 64 27 111q26 47 75 73q48 26 113 26q65 0 114-26q48-26 75-73q26-47 26-111l0 0l0-97l-342 0l0-53q0-65 33-99q33-35 94-35l0 0q52 0 84 19q32 18 39 55l0 0l90 0q-9-69-67-109q-59-41-146-41zm-127 331l254 0l0 29q0 65-32 100q-33 35-95 35l0 0q-61 0-94-35q-33-35-33-100l0 0l0-29z"], "f": [600, "m310 0l-90 0l0 413l-160 0l0 82l160 0l0 95q0 65 41 103q41 37 113 37l0 0l161 0l0-82l-161 0q-31 0-47-14q-17-15-17-44l0 0l0-95l225 0l0-82l-225 0l0-413z"], "g": [600, "m335-180l-174 0l0 82l175 0q42 0 62 19q19 19 19 59l0 0l0 70l2 100l-2 0q-4-49-39-80l0 0q-40-35-107-35l0 0q-85 0-134 56q-49 55-49 149l0 0l0 116q0 94 49 149q49 55 134 55l0 0q67 0 107-35l0 0q35-31 39-80l0 0l1 0l0 105l89 0l0-570q0-74-45-117q-46-43-127-43l0 0zm-37 293l0 0q56 0 88 35q32 35 32 97l0 0l0 105q0 62-32 97q-32 35-88 35l0 0q-57 0-88-34q-32-34-32-98l0 0l0-105q0-64 32-98q31-34 88-34z"], "h": [600, "m182 0l-90 0l0 730l90 0l0-285l1 0q6 50 38 80l0 0q39 35 108 35l0 0q83 0 132-51q49-51 49-139l0 0l0-370l-90 0l0 360q0 59-31 92q-32 32-86 32l0 0q-56 0-88-35q-33-35-33-99l0 0l0-350z"], "i": [600, "m555 0l-470 0l0 82l195 0l0 386l-170 0l0 82l260 0l0-468l185 0l0-82zm-240 649l0 0q-33 0-52 17q-19 17-19 46l0 0q0 30 19 48q19 17 52 17l0 0q33 0 52-17q19-18 19-48l0 0q0-29-19-46q-19-17-52-17z"], "j": [600, "m214-180l-129 0l0 83l129 0q62 0 97 34q34 33 34 94l0 0l0 437l-230 0l0 82l320 0l0-519q0-97-60-154q-60-57-161-57l0 0zm171 829l0 0q-33 0-52 17q-19 17-19 46l0 0q0 30 19 48q19 17 52 17l0 0q33 0 52-17q19-18 19-48l0 0q0-29-19-46q-19-17-52-17z"], "k": [600, "m185 0l-90 0l0 730l90 0l0-407l106 0l160 227l103 0l-185-262l188-288l-105 0l-160 245l-107 0l0-245z"], "l": [600, "m550 0l-175 0q-48 0-84 19q-36 19-56 54q-20 35-20 82l0 0l0 493l-185 0l0 82l275 0l0-575q0-34 19-53q19-20 51-20l0 0l175 0l0-82z"], "m": [600, "m149 0l-83 0l0 550l79 0l0-66l6 0q5 29 23 49l0 0q24 27 66 27l0 0q46 0 71-34l0 0q13-17 19-42l0 0l4 0q5 29 24 49l0 0q25 27 67 27l0 0q52 0 81-39q28-39 28-103l0 0l0-418l-83 0l0 419q0 34-14 53q-15 19-43 19l0 0q-27 0-42-18q-16-19-16-53l0 0l0-420l-72 0l0 419q0 35-15 54q-16 18-44 18q-28 0-42-18q-14-19-14-53l0 0l0-420z"], "n": [600, "m182 0l-90 0l0 550l90 0l0-105l1 0q6 50 38 80l0 0q39 35 108 35l0 0q83 0 132-51q49-51 49-139l0 0l0-370l-90 0l0 360q0 59-31 91q-32 31-86 31l0 0q-56 0-88-34q-33-34-33-98l0 0l0-350z"], "o": [600, "m300-8l0 0q-66 0-114 25q-48 25-74 73q-27 47-27 112l0 0l0 146q0 66 27 113q26 47 74 72q48 25 114 25l0 0q66 0 114-25q48-25 75-72q26-47 26-112l0 0l0-147q0-65-26-112q-27-48-75-73q-48-25-114-25zm0 80l0 0q59 0 92 33q33 33 33 97l0 0l0 146q0 64-33 97q-33 33-92 33l0 0q-58 0-91-33q-34-33-34-97l0 0l0-146q0-64 34-97q33-33 91-33z"], "p": [600, "m182-180l-90 0l0 730l90 0l0-105l1 0q6 48 41 79l0 0q41 36 109 36l0 0q83 0 133-54q49-55 49-150l0 0l0-161q0-63-22-109q-23-46-63-71q-41-25-97-25l0 0q-67 0-109 37l0 0q-35 31-41 78l0 0l-3 0l2-125l0-160zm121 248l0 0q57 0 90 34q32 34 32 98l0 0l0 150q0 64-32 98q-33 34-90 34l0 0q-55 0-88-35q-33-35-33-97l0 0l0-150q0-62 33-97q33-35 88-35z"], "q": [600, "m508-180l-90 0l0 160l2 125l-3 0q-6-47-40-78l0 0q-41-37-109-37l0 0q-83 0-131 55q-49 55-49 150l0 0l0 161q0 95 49 150q49 54 131 54l0 0q68 0 109-36l0 0q34-31 40-79l0 0l1 0l0 105l90 0l0-730zm-210 248l0 0q56 0 88 35q32 35 32 97l0 0l0 150q0 62-32 97q-32 35-88 35l0 0q-57 0-88-34q-32-34-32-98l0 0l0-150q0-64 32-98q31-34 88-34z"], "r": [600, "m201 0l-90 0l0 550l88 0l0-98q10 38 31 63l0 0q38 45 114 45l0 0q87 0 139-54q51-55 51-148l0 0l0-33l-90 0l0 25q0 65-31 100q-32 34-90 34l0 0q-57 0-89-35q-33-35-33-99l0 0l0-350z"], "s": [600, "m325-8l-42 0q-56 0-97 18q-42 17-66 49q-25 32-30 76l0 0l90 0q6-29 33-46q26-17 70-17l0 0l42 0q53 0 79 22q26 21 26 57l0 0q0 35-23 56q-24 20-70 27l0 0l-74 12q-81 14-120 51q-40 36-40 106l0 0q0 74 47 115q47 40 141 40l0 0l38 0q79 0 127-37q48-37 58-100l0 0l-90 0q-6 26-30 42q-24 15-65 15l0 0l-38 0q-51 0-74-19q-24-19-24-57l0 0q0-34 20-50q20-16 63-23l0 0l74-12q89-14 130-52q40-38 40-110l0 0q0-76-48-119q-49-44-147-44l0 0z"], "t": [600, "m510 0l-150 0q-71 0-110 38q-40 38-40 107l0 0l0 323l-155 0l0 82l155 0l0 155l90 0l0-155l220 0l0-82l-220 0l0-323q0-63 60-63l0 0l150 0l0-82z"], "u": [600, "m299-10l0 0q-95 0-152 57q-57 56-57 153l0 0l0 350l90 0l0-350q0-62 32-96q32-35 87-35l0 0q56 0 89 35q32 34 32 96l0 0l0 350l90 0l0-350q0-97-58-153q-58-57-153-57z"], "v": [600, "m361 0l-122 0l-184 550l92 0l122-370q11-33 20-63q9-31 13-48l0 0q5 17 14 48q9 30 19 63l0 0l119 370l91 0l-184-550z"], "w": [600, "m222 0l-99 0l-88 550l80 0l55-390q3-22 7-47q3-26 5-43l0 0q2 17 7 43q4 25 7 47l0 0l61 390l86 0l61-390q3-22 8-47q4-26 6-43l0 0q2 17 7 43q4 25 7 47l0 0l57 390l76 0l-92-550l-99 0l-59 380q-4 28-9 56q-5 28-7 44l0 0q-2-16-6-44q-4-28-9-56l0 0l-62-380z"], "x": [600, "m155 0l-105 0l195 283l-183 267l106 0l109-170q7-11 14-24l0 0l10-21q3 8 10 21q6 13 13 24l0 0l110 170l105 0l-183-268l194-282l-106 0l-118 180q-7 11-13 26q-7 14-12 23l0 0q-4-9-11-23q-8-15-16-26l0 0l-119-180z"], "y": [600, "m274-180l-96 0l81 214l-204 516l100 0l128-340q7-17 13-40q6-24 10-40l0 0q4 16 10 40q6 23 12 40l0 0l120 340l97 0l-271-730z"], "z": [600, "m510 0l-420 0l0 90l308 378l-300 0l0 82l401 0l0-90l-314-378l325 0l0-82z"], "{": [600, "m515-110l-45 0q-59 0-101 20q-43 19-65 57q-22 37-19 89l0 0l10 164q3 53-16 77q-19 23-84 23l0 0l-110 0l0 80l110 0q65 0 84 24q19 23 16 76l0 0l-10 164q-3 53 19 90q22 37 65 57q42 19 101 19l0 0l45 0l0-80l-45 0q-47 0-72-21q-25-22-23-65l0 0l10-164q4-65-31-103l0 0q-26-29-69-37l0 0q42-7 69-36l0 0q35-39 31-104l0 0l-10-164q-2-43 23-64q25-22 72-22l0 0l45 0l0-80z"], "|": [600, "m345-110l-90 0l0 940l90 0l0-940z"], "}": [600, "m130-110l-45 0l0 80l45 0q47 0 72 22q25 21 23 64l0 0l-10 164q-4 65 32 104l0 0q26 29 68 36l0 0q-43 8-69 37l0 0q-35 38-31 103l0 0l10 164q2 43-23 65q-25 21-72 21l0 0l-45 0l0 80l45 0q59 0 102-19q42-20 64-57q22-37 19-90l0 0l-10-164q-3-53 16-76q19-24 84-24l0 0l110 0l0-80l-110 0q-64 0-83-23q-20-24-17-77l0 0l10-164q3-52-19-89q-22-38-64-57q-43-20-102-20l0 0z"], "~": [600, "m150 255l-85 0l0 70q0 59 36 95q36 35 94 35l0 0q37 0 63-13q26-13 45-32q18-20 33-39q15-20 31-33q16-13 36-13l0 0q23 0 35 14q12 14 12 41l0 0l0 70l85 0l0-70q0-58-35-94q-36-36-95-36l0 0q-37 0-63 13q-26 13-44 33q-19 19-34 39q-15 19-31 32q-16 13-36 13l0 0q-22 0-34-14q-13-14-13-41l0 0l0-70z"], "·": [600, "m300 260l0 0q-38 0-60 22q-23 22-23 59l0 0q0 39 23 62q22 23 60 23l0 0q38 0 61-23q22-23 22-62l0 0q0-37-22-59q-23-22-61-22z"], "•": [600, "m300 245l0 0q-52 0-86 34q-34 34-34 86l0 0q0 53 34 87q34 33 86 33l0 0q53 0 87-33q33-34 33-87l0 0q0-52-33-86q-34-34-87-34z"], "—": [600, "m600 290l-600 0l0 80l600 0l0-80z"], "–": [600, "m520 290l-440 0l0 80l440 0l0-80z"], "’": [600, "m240 465l-80 0l80 311l130 0l-130-311z"], "‘": [600, "m360 775l80 0l-80-311l-130 0l130 311z"], "“": [600, "m435 465l-130 0l130 311l80 0l-80-311zm-230 0l-130 0l130 311l80 0l-80-311z"], "”": [600, "m395 465l-80 0l80 311l130 0l-130-311zm-230 0l-80 0l80 311l130 0l-130-311z"], "…": [600, "m490-10l0 0q-22 0-36 15q-14 15-14 40l0 0l0 70q0 25 14 40q14 15 36 15l0 0q23 0 37-15q13-15 13-40l0 0l0-70q0-25-13-40q-14-15-37-15zm-380 0l0 0q-22 0-36 15q-14 15-14 40l0 0l0 70q0 25 14 40q14 15 36 15l0 0q23 0 37-15q13-15 13-40l0 0l0-70q0-25-13-40q-14-15-37-15zm190 0l0 0q-22 0-36 15q-14 15-14 40l0 0l0 70q0 25 14 40q14 15 36 15l0 0q23 0 37-15q13-15 13-40l0 0l0-70q0-25-13-40q-14-15-37-15z"], "×": [600, "m298 278l-142-142l-51 52l141 141l-141 142l51 51l142-141l145 145l51-52l-145-145l142-141l-52-52l-141 142z"], "±": [600, "m530 0l-460 0l0 70l186 0l0 225l-191 0l0 80l191 0l0 195l88 0l0-195l191 0l0-80l-191 0l0-225l186 0l0-70z"], "©": [600, "m300 110l0 0q-76 0-133 30q-58 30-90 84q-32 54-32 126l0 0l0 150q0 72 32 126q32 54 90 84q57 30 133 30l0 0q77 0 134-30q57-30 89-84q32-54 32-126l0 0l0-150q0-72-32-126q-32-54-89-84q-57-30-134-30zm0 50l0 0q60 0 105 24q45 23 70 66q25 43 25 100l0 0l0 150q0 57-25 100q-25 42-70 66q-45 24-105 24l0 0q-60 0-105-24q-45-24-70-66q-25-43-25-100l0 0l0-150q0-57 25-100q25-43 70-66q45-24 105-24zm5 85l0 0q-56 0-90 32q-35 31-35 83l0 0l0 130q0 52 35 84q34 31 90 31l0 0q56 0 90-31q34-32 34-84l0 0l-65 0q0 27-16 44q-17 16-43 16l0 0q-27 0-43-16q-17-17-17-44l0 0l0-130q0-27 17-43q16-17 43-17l0 0q26 0 43 17q16 16 16 43l0 0l65 0q0-52-34-83q-34-32-90-32z"], "®": [600, "m300 110l0 0q-76 0-133 30q-58 30-90 84q-32 54-32 126l0 0l0 150q0 72 32 126q32 54 90 84q57 30 133 30l0 0q77 0 134-30q57-30 89-84q32-54 32-126l0 0l0-150q0-72-32-126q-32-54-89-84q-57-30-134-30zm0 50l0 0q60 0 105 24q45 23 70 66q25 43 25 100l0 0l0 150q0 57-25 100q-25 42-70 66q-45 24-105 24q-60 0-105-24q-45-24-70-66q-25-43-25-100l0 0l0-150q0-57 25-100q25-43 70-66q45-24 105-24zm127 90l-64 0l-59 140q0 0 0 0l0 0l-54 0l0-140l-60 0l0 350l114 0q54 0 86-28q31-29 31-77q0-48-31-76l0 0q-13-12-29-19l0 0l66-150zm-177 300l0-110l54 0q26 0 41 15q15 14 15 40q0 26-15 41q-15 14-41 14l0 0l-54 0z"], "™": [600, "m175 370l-60 0l0 310l-100 0l0 50l260 0l0-50l-100 0l0-310zm190 0l-55 0l0 360l80 0l34-102q5-14 10-35q4-22 6-36l0 0q2 14 6 36q3 21 8 35l0 0l33 102l78 0l0-360l-55 0l0 221q0 19 1 40q1 20 3 39q2 18 3 30l0 0q-6-20-13-45q-7-26-10-35l0 0l-30-103l-51 0l-33 104q-3 9-10 34q-7 25-13 45l0 0q2-12 4-30q1-19 3-39q1-21 1-40l0 0l0-221z"], "€": [600, "m320-10l0 0q-67 0-116 27q-50 26-77 75q-27 48-27 113l0 0l0 40l-81 0l0 65l81 0l0 100l-81 0l0 65l81 0l0 40q0 66 27 114q27 48 77 75q49 26 116 26l0 0q62 0 109-23q47-24 76-67q28-44 35-105l0 0l-90 0q-6 54-40 85q-35 30-90 30l0 0q-60 0-95-36q-35-36-35-99l0 0l0-40l165 0l0-65l-165 0l0-100l165 0l0-65l-165 0l0-40q0-63 35-99q34-36 95-36l0 0q55 0 90 31q34 30 40 84l0 0l90 0q-7-61-35-104q-29-44-76-67q-47-24-109-24z"], "£": [600, "m535 0l-460 0l0 100q24 19 49 46q25 26 43 55q17 28 17 53l0 0q0 28-4 51l0 0l-105 0l0 80l75 0q0 1 0 1l0 0q-15 26-29 50q-15 24-25 53q-10 28-10 66l0 0q0 57 26 99q26 41 74 64q48 22 114 22q66 0 114-22q48-23 74-65q26-43 27-103l0 0l-95 0q0 50-33 80q-33 30-88 30l0 0q-58 0-90-28q-32-29-32-82l0 0q0-31 10-54q10-24 25-46q14-22 29-47l0 0q4-9 9-18l0 0l185 0l0-80l-162 0q2-19 2-42l0 0q0-43-17-79q-18-37-43-63q-26-27-50-41l0 0l370 0l0-80z"], "°": [600, "m300 450l0 0q-67 0-108 40q-42 40-42 105l0 0q0 65 42 105q41 40 108 40l0 0q68 0 109-40q41-40 41-105l0 0q0-65-41-105q-41-40-109-40zm-1 51l0 0q41 0 66 26q25 26 25 68l0 0q0 43-25 69q-25 26-66 26l0 0q-40 0-64-26q-25-26-25-69l0 0q0-42 25-68q24-26 64-26z"], "−": [600, "m460 290l-320 0l0 80l320 0l0-80z"], "↑": [600, "m345 0l-90 0l0 520q0 22 2 45q2 22 3 35l0 0l-10 0q-10-15-55-54l0 0l-185-158l0 105l291 247l289-246l0-105l-186 158q-22 19-35 33q-14 14-19 20l0 0l-10 0q2-13 4-35q1-23 1-45l0 0l0-520z"], "↓": [600, "m590 237l-291-247l-289 246l0 105l186-158q22-19 36-33q14-14 18-20l0 0l10 0q-1 13-3 36q-2 22-2 44l0 0l0 520l90 0l0-520q0-22-1-44q-2-23-4-36l0 0l10 0q10 15 55 54l0 0l185 158l0-105z"] }, "kern": {} }, "mono-500": { "upm": 1e3, "asc": 1020, "desc": -300, "lineGap": 0, "typoAsc": 1020, "typoDesc": -300, "capH": 730, "xH": 550, "glyphs": { "0": [600, "m300-10l0 0q-69 0-119 27q-51 27-79 76q-28 48-28 113l0 0l0 318q0 66 28 114q27 48 78 75q51 27 120 27l0 0q70 0 121-27q50-27 78-75q27-48 27-114l0 0l0-318q0-65-28-113q-28-49-78-76q-51-27-120-27zm0 93l0 0q56 0 90 34q33 34 33 89l0 0l0 318q0 55-33 89q-34 34-90 34l0 0q-56 0-89-34q-34-34-34-89l0 0l0-318q0-55 34-89q33-34 89-34zm0 220l0 0q-28 0-45 18q-18 18-18 47l0 0q0 28 18 46q17 17 45 17l0 0q28 0 46-17q17-18 17-46l0 0q0-29-17-47q-18-18-46-18z"], "1": [600, "m546 0l-459 0l0 96l194 0l0 540l-195-145l0 117l167 122l136 0l0-634l157 0l0-96z"], "2": [600, "m531 0l-446 0l0 107l226 233q52 54 77 98q24 43 24 86l0 0q0 56-30 88q-31 32-84 32l0 0q-58 0-91-33q-34-34-34-92l0 0l-108 0q2 68 31 118q29 49 81 76q52 27 122 27l0 0q67 0 117-26q50-26 77-73q27-47 27-111l0 0q0-65-33-127q-34-62-110-138l0 0l-165-167l319 0l0-98z"], "3": [600, "m291-10l0 0q-69 0-120 26q-51 26-78 74q-28 47-28 110l0 0l108 0q0-55 32-86q31-31 87-31l0 0q57 0 88 32q31 32 31 85l0 0l0 54q0 56-31 87q-31 30-88 30l0 0l-78 0l0 102l170 162l-288 0l0 95l398 0l0-102l-174-164q85-6 138-56l0 0q61-57 61-153l0 0l0-55q0-63-28-110q-28-48-79-74q-52-26-121-26z"], "4": [600, "m507 0l-107 0l0 152l-327 0l0 162l284 416l120 0l-300-442l0-39l223 0l0 171l107 0l0-420z"], "5": [600, "m298-10l0 0q-95 0-154 49q-59 48-66 130l0 0l107 0q5-40 34-62q29-22 80-22l0 0q57 0 87 31q29 30 29 85l0 0l0 71q0 56-29 87q-29 30-86 30l0 0q-36 0-62-16q-26-17-38-46l0 0l-107 0l5 403l398 0l0-98l-295 0l-2-227l2 0q8 29 34 48l0 0q37 27 99 27l0 0q89 0 139-54q49-55 49-154l0 0l0-71q0-97-59-154q-59-57-165-57z"], "6": [600, "m301-10l0 0q-72 0-126 30q-54 30-84 85q-30 54-30 125l0 0q0 54 17 109q16 54 47 104l0 0l178 287l120 0l-212-336l5-3q20 29 54 45q33 15 74 15l0 0q59 0 103-28q44-28 68-78q24-51 24-120l0 0q0-70-30-123q-30-53-83-82q-53-30-125-30zm-1 93l0 0q60 0 96 39q36 39 36 103l0 0q0 64-36 103q-36 39-96 39l0 0q-60 0-96-39q-36-39-36-103l0 0q0-64 36-103q36-39 96-39z"], "7": [600, "m286 0l-116 0l262 631l-255 0l0-107l-107 0l0 206l469 0l0-104l-253-626z"], "8": [600, "m300-10l0 0q-70 0-121 24q-51 24-79 69q-28 44-28 103l0 0q0 66 36 113l0 0q34 44 103 78l0 0q-59 31-90 70l0 0q-36 45-36 108l0 0q0 55 27 97q26 42 74 66q48 23 114 23q66 0 114-23q48-24 74-66q26-42 26-97l0 0q0-64-35-108l0 0q-31-37-89-70l0 0q70-35 103-78l0 0q35-48 35-113l0 0q0-90-61-143q-62-53-167-53zm0 94l0 0q56 0 89 30q33 29 33 77l0 0q0 39-22 73q-22 33-61 52l0 0l-39 18l-41-19q-38-18-59-51q-22-33-22-71l0 0q0-49 33-79q33-30 89-30zm-27 347l27-12l24 11q40 19 62 51q22 31 22 69l0 0q0 45-29 71q-29 26-79 26q-50 0-79-26q-30-27-30-72l0 0q0-37 22-68q22-32 60-50l0 0z"], "9": [600, "m297 0l-120 0l212 336l-5 3q-20-29-53-44q-34-16-75-16l0 0q-59 0-103 28q-44 28-68 79q-24 51-24 119l0 0q0 71 30 124q30 52 84 82q53 29 124 29l0 0q72 0 126-30q54-30 84-84q30-54 30-126l0 0q0-53-16-108q-17-55-48-105l0 0l-178-287zm3 363l0 0q60 0 96 39q36 39 36 103l0 0q0 64-36 103q-36 39-96 39l0 0q-60 0-96-39q-36-39-36-103l0 0q0-64 36-103q36-39 96-39z"], " ": [600, ""], "!": [600, "m339 224l-78 0l-22 377l0 129l122 0l0-129l-22-377zm-24-229l-30 0q-28 0-46 18q-18 17-18 45l0 0q0 28 18 46q18 17 46 17l0 0l30 0q30 0 47-17q17-18 17-45l0 0q0-28-18-46q-18-18-46-18l0 0z"], '"': [600, "m450 430l-88 0l-12 189l0 111l112 0l0-111l-12-189zm-211 0l-88 0l-13 189l0 111l112 0l0-111l-11-189z"], "#": [600, "m160 0l-81 0l35 191l-83 0l0 75l96 0l35 198l-98 0l0 75l112 0l34 191l81 0l-35-191l150 0l34 191l81 0l-35-191l83 0l0-75l-96 0l-35-198l98 0l0-75l-112 0l-34-191l-81 0l35 191l-150 0l-34-191zm83 464l-35-198l149 0l35 198l-149 0z"], "$": [600, "m333-140l-61 0l0 131q-96 8-151 62q-55 53-56 140l0 0l107 0q0-43 27-70q26-28 73-35l0 0l0 236l-23 6q-80 23-123 79q-44 55-44 132l0 0q0 83 51 136q51 53 139 61l0 0l0 132l61 0l0-131q88-8 140-60q52-53 53-137l0 0l-108 0q0 41-22 68q-22 26-63 33l0 0l0-225l36-11q80-22 123-78q43-56 43-134l0 0q0-85-54-140q-55-55-148-64l0 0l0-131zm0 443l0-216q45 7 70 34q25 27 25 70l0 0q0 44-27 75l0 0q-25 28-68 37l0 0zm-61 134l0 0l0 206q-40-7-61-31q-22-25-22-64l0 0q0-48 32-80l0 0q20-21 51-31z"], "%": [600, "m88 0l-83 0l507 730l83 0l-507-730zm356-5l0 0q-64 0-103 37q-40 36-40 98l0 0l0 65q0 62 40 99q39 36 103 36l0 0q63 0 103-36q39-37 39-99l0 0l0-65q0-62-39-98q-40-37-103-37zm0 73l0 0q60 0 60 62l0 0l0 65q0 63-60 63l0 0q-61 0-61-63l0 0l0-65q0-62 61-62zm-288 332l0 0q-63 0-102 36q-40 36-40 99l0 0l0 65q0 63 40 99q39 36 102 36l0 0q63 0 103-36q40-36 40-99l0 0l0-65q0-63-40-99q-40-36-103-36zm0 72l0 0q61 0 61 63l0 0l0 65q0 63-61 63l0 0q-29 0-44-15q-16-16-16-48l0 0l0-65q0-32 16-47q15-16 44-16z"], "&": [600, "m231-10l0 0q-86 0-134 47q-48 47-48 130l0 0l0 109q0 60 31 100l0 0q26 34 72 48l0 0q-28 39-42 76l0 0q-15 38-15 76l0 0q0 49 23 86q23 37 65 58q42 20 98 20l0 0q59 0 103-22q43-22 67-61q24-39 24-94l0 0l-104 0q0 27-11 47q-11 19-31 29q-20 10-48 10l0 0q-25 0-44-9q-20-10-30-27q-10-18-10-43l0 0q0-24 12-53q11-29 31-57l0 0l155-216l63 116l108 0l-110-201l114-159l-112 0l-55 76q-72-86-172-86zm8 92l0 0q31 0 60 19q28 19 48 53l0 0l-142 197q-26-6-38-25q-13-20-13-50l0 0l0-109q0-40 23-62q22-23 62-23z"], "'": [600, "m341 430l-88 0l-13 147l0 153l112 0l0-153l-11-147z"], "(": [600, "m485-12l0-108q-147 37-228 140q-81 102-81 250l0 0l0 180q0 97 38 176q37 79 107 135q69 55 164 79l0 0l0-104q-62-15-107-54q-45-40-69-99q-25-59-25-133l0 0l0-180q0-72 25-131q24-59 69-97q45-39 107-54l0 0z"], ")": [600, "m115-120l0 0l0 108q62 15 107 54q45 38 70 97q24 59 24 131l0 0l0 180q0 74-24 133q-25 59-70 99q-45 39-107 54l0 0l0 104q96-24 165-79q69-56 107-135q37-79 37-176l0 0l0-180q0-148-81-250q-81-103-228-140z"], "*": [600, "m233 159l-47-69l-82 58l47 68q14 20 34 40q20 20 41 38q20 17 36 29l0 0l-3 6q-20 1-46 4q-27 2-54 7q-27 5-49 13l0 0l-77 28l34 95l77-28q23-8 47-22q24-14 47-29q22-16 37-29l0 0l5 4q-5 20-12 47q-8 26-13 55q-5 28-5 53l0 0l0 83l100 0l0-83q0-25-5-53q-5-29-12-55q-7-27-14-47l0 0l5-4q16 13 38 29q22 15 46 29q24 14 47 22l0 0l78 28l34-95l-78-28q-21-8-48-13q-27-5-53-7q-27-3-47-4l0 0l-3-7q16-12 37-29q20-18 40-37q20-20 33-40l0 0l48-68l-82-58l-49 69q-13 19-25 45q-12 26-21 52q-10 25-16 44l0 0l-7 0q-5-19-15-44q-10-26-22-52q-12-26-26-45l0 0z"], "+": [600, "m353 94l-106 0l0 187l-185 0l0 98l185 0l0 187l106 0l0-187l185 0l0-98l-185 0l0-187z"], ",": [600, "m252-160l-94 0l80 311l144 0l-130-311z"], "-": [600, "m460 281l-320 0l0 98l320 0l0-98z"], ".": [600, "m300-10l0 0q-40 0-64 24q-24 23-24 63l0 0q0 41 24 66q24 24 64 24l0 0q41 0 65-24q23-25 23-66l0 0q0-40-23-63q-24-24-65-24z"], "/": [600, "m180-110l-112 0l352 940l112 0l-352-940z"], ":": [600, "m300 401l0 0q-39 0-63 22q-25 22-25 58l0 0q0 36 25 58q24 21 63 21l0 0q40 0 64-21q24-22 24-58l0 0q0-36-24-58q-24-22-64-22zm0-411l0 0q-39 0-63 22q-25 22-25 57l0 0q0 37 25 59q24 21 63 21l0 0q40 0 64-21q24-22 24-59l0 0q0-35-24-57q-24-22-64-22z"], ";": [600, "m257-160l-94 0l80 311l144 0l-130-311zm53 561l-20 0q-35 0-57 23q-22 22-22 57l0 0q0 34 23 57q22 22 56 22l0 0l20 0q34 0 57-22q22-23 22-57l0 0q0-35-22-57q-22-23-57-23l0 0z"], "<": [600, "m519 164l0-104l-438 213l0 113l438 213l0-101l-299-143q-20-9-38-15q-18-7-27-9l0 0q10-2 29-8q18-6 36-15l0 0l299-144z"], "=": [600, "m516 403l-432 0l0 97l432 0l0-97zm0-243l-432 0l0 97l432 0l0-97z"], ">": [600, "m519 273l-438-213l0 102l299 143q20 9 38 15q18 6 27 8l0 0q-10 2-28 9q-19 6-37 15l0 0l-299 143l0 104l438-213l0-113z"], "?": [600, "m302 211l-100 0l-1 190l64 0q58 0 92 31q33 31 33 83l0 0q0 52-34 83q-34 31-92 31l0 0l-136 0l0 101l133 0q73 0 126-26q52-27 81-75q29-48 29-114l0 0q0-59-24-105q-25-46-68-72q-44-27-103-29l0 0l0-98zm-36-216l-29 0q-29 0-47 18q-18 17-18 45l0 0q0 28 18 46q18 17 47 17l0 0l30 0q30 0 47-17q17-18 17-45l0 0q0-28-18-46q-18-18-47-18l0 0z"], "@": [600, "m395-180l-70 0q-87 0-151 36q-65 35-100 101q-35 65-35 153l0 0l0 340q0 90 34 155q33 65 95 100q61 35 147 35l0 0q78 0 135-30q56-30 86-85q30-55 30-129l0 0l0-431l-83 0l3 55l-15 0q-6-24-26-40l0 0q-30-25-78-25l0 0q-64 0-98 41q-35 40-35 117l0 0l0 117q0 77 35 118q34 40 98 40l0 0q48 0 78-24l0 0q21-18 27-44l0 0l15 0l-13 69l0 7q0 51-18 88q-19 36-54 56q-35 20-87 20l0 0q-87 0-135-55q-49-55-49-155l0 0l0-340q0-96 52-150q51-54 142-54l0 0l70 0l0-86zm5 305l0 0q38 0 56 23q18 22 18 72l0 0l0 111q0 44-18 66q-19 21-56 21q-37 0-55-22q-19-22-19-66l0 0l0-117q0-46 19-67q18-21 55-21z"], "A": [600, "m153 0l-110 0l186 730l142 0l186-730l-109 0l-44 185l-207 0l-44-185zm114 486l-50-212l166 0l-50 211q-13 56-21 98q-9 41-12 56l0 0q-3-15-11-56q-8-42-22-97l0 0z"], "B": [600, "m314 0l-229 0l0 730l215 0q104 0 163-50q59-50 59-138l0 0q0-50-21-86q-22-37-60-57l0 0q-18-9-39-14l0 0q25-5 47-16l0 0q42-22 66-64q24-42 24-100l0 0q0-62-27-108q-28-47-78-72q-51-25-120-25l0 0zm-124 334l0-241l115 0q58 0 92 31q34 31 34 86l0 0q0 56-34 90q-34 34-92 34l0 0l-115 0zm0 303l0-213l109 0q54 0 85 29q31 29 31 78q0 49-31 78q-31 28-84 28l0 0l-110 0z"], "C": [600, "m304-10l0 0q-68 0-118 26q-51 25-78 74q-28 48-28 113l0 0l0 324q0 66 28 114q27 48 78 74q50 25 118 25l0 0q68 0 118-26q50-26 78-73q27-48 27-114l0 0l-108 0q0 57-30 87q-30 30-85 30l0 0q-55 0-85-30q-31-30-31-86l0 0l0-325q0-56 31-86q30-31 85-31l0 0q55 0 85 31q30 30 30 86l0 0l108 0q0-65-27-113q-28-48-78-74q-50-26-118-26z"], "D": [600, "m287 0l-204 0l0 730l204 0q72 0 125-27q53-28 83-78q29-50 29-118l0 0l0-283q0-67-29-118q-30-51-83-78q-53-28-125-28l0 0zm-96 632l0-534l96 0q60 0 95 34q34 33 34 92l0 0l0 283q0 58-34 92q-35 33-95 33l0 0l-96 0z"], "E": [600, "m523 0l-429 0l0 730l429 0l0-96l-323 0l0-207l288 0l0-95l-288 0l0-236l323 0l0-96z"], "F": [600, "m195 0l-107 0l0 731l441 0l0-100l-336 0l0-218l310 0l0-100l-308 0l0-313z"], "G": [600, "m304-10l0 0q-68 0-118 26q-51 25-78 74q-28 48-28 113l0 0l0 324q0 66 28 114q27 48 78 74q50 25 118 25l0 0q68 0 118-26q50-26 78-73q27-48 27-114l0 0l-108 0q0 57-30 87q-30 30-85 30l0 0q-55 0-85-30q-31-30-31-86l0 0l0-325q0-56 31-87q30-31 85-31l0 0q55 0 85 31q30 31 30 87l0 0l0 82l-136 0l0 95l244 0l0-177q0-65-27-113q-28-48-78-74q-50-26-118-26z"], "H": [600, "m193 0l-108 0l0 730l108 0l0-302l214 0l0 302l108 0l0-730l-108 0l0 328l-214 0l0-328z"], "I": [600, "m502 0l-404 0l0 96l147 0l0 538l-147 0l0 96l404 0l0-96l-147 0l0-538l147 0l0-96z"], "J": [600, "m270-10l0 0q-108 0-170 60q-62 60-62 163l0 0l107 0q0-61 33-94q33-34 92-34l0 0q59 0 92 34q33 33 33 93l0 0l0 419l-172 0l0 99l279 0l0-518q0-103-62-162q-63-60-170-60z"], "K": [600, "m192 0l-108 0l0 730l108 0l0-304l97 0l149 304l118 0l-172-350l180-380l-121 0l-156 329l-95 0l0-329z"], "L": [600, "m536 0l-427 0l0 730l108 0l0-631l319 0l0-99z"], "M": [600, "m168 0l-102 0l0 730l133 0l73-234q11-33 19-63q8-31 11-46l0 0q4 15 12 46q7 30 17 63l0 0l70 234l133 0l0-730l-102 0l0 246q0 47 3 105q2 57 7 116q5 58 10 112q5 53 9 93l0 0l-108-355l-104 0l-110 355q5-39 10-90q5-52 9-110q4-58 7-116q3-59 3-110l0 0l0-246z"], "N": [600, "m181 0l-100 0l0 730l136 0l213-607q-2 29-5 69q-3 40-4 83q-2 43-2 78l0 0l0 377l100 0l0-730l-136 0l-212 607q2-26 5-65q2-39 4-81q1-42 1-78l0 0l0-383z"], "O": [600, "m300-10l0 0q-68 0-117 26q-50 25-76 74q-27 48-27 113l0 0l0 324q0 66 27 114q26 48 76 74q49 25 117 25l0 0q68 0 118-25q49-26 76-74q26-48 26-113l0 0l0-325q0-65-26-113q-27-49-76-74q-50-26-118-26zm0 96l0 0q55 0 84 31q28 30 28 86l0 0l0 324q0 57-28 87q-29 30-84 30l0 0q-54 0-83-30q-29-30-29-87l0 0l0-324q0-56 29-86q29-31 83-31z"], "P": [600, "m192 0l-108 0l0 730l239 0q71 0 124-27q52-27 81-76q28-50 28-117l0 0q0-66-29-116q-29-50-81-77q-52-27-123-27l0 0l-131 0l0-290zm0 633l0-246l131 0q56 0 90 34q33 33 33 89l0 0q0 57-33 90q-34 33-90 33l0 0l-131 0z"], "Q": [600, "m535-180l-120 0l-103 170q-5 0-12 0l0 0q-68 0-119 27q-51 27-79 76q-28 48-28 113l0 0l0 318q0 66 28 114q28 48 79 75q51 27 119 27l0 0q69 0 120-27q50-27 78-75q28-48 28-114l0 0l0-318q0-66-28-116q-29-50-82-75l0 0l119-195zm-235 265l0 0q55 0 87 33q31 33 31 88l0 0l0 318q0 56-31 89q-32 32-87 32l0 0q-54 0-86-32q-32-33-32-89l0 0l0-318q0-55 32-88q31-33 86-33z"], "R": [600, "m192 0l-108 0l0 730l229 0q69 0 120-26q51-27 80-75q28-48 28-113l0 0q0-73-37-126q-38-54-102-76l0 0l149-314l-123 0l-133 300l-103 0l0-300zm0 634l0-239l121 0q54 0 86 33q32 32 32 86l0 0q0 56-32 88q-32 32-86 32l0 0l-121 0z"], "S": [600, "m303-10l0 0q-74 0-127 25q-53 24-82 70q-29 45-29 108l0 0l107 0q0-50 35-78q35-29 97-29l0 0q58 0 91 28q33 28 33 77l0 0q0 41-22 71q-23 30-65 41l0 0l-92 27q-80 23-123 79q-44 55-44 132l0 0q0 60 27 105q27 45 77 70q50 25 118 25l0 0q100 0 161-54q60-54 61-145l0 0l-108 0q0 48-30 76q-31 27-86 27l0 0q-53 0-83-25q-30-26-30-72l0 0q0-41 23-71q22-30 64-42l0 0l93-28q80-22 123-78q43-56 43-134l0 0q0-61-29-107q-29-47-81-72q-52-26-122-26z"], "T": [600, "m354 0l-108 0l0 631l-195 0l0 100l498 0l0-100l-195 0l0-631z"], "U": [600, "m300-10l0 0q-105 0-162 58q-57 57-57 156l0 0l0 526l108 0l0-526q0-55 28-87q27-32 83-32l0 0q55 0 83 32q28 32 28 87l0 0l0 526l108 0l0-526q0-99-57-156q-57-58-162-58z"], "V": [600, "m371 0l-143 0l-185 730l111 0l117-486q11-43 20-85q8-43 12-67l0 0q4 24 12 67q7 42 18 86l0 0l116 485l108 0l-186-730z"], "W": [600, "m226 0l-126 0l-79 730l97 0l49-524q2-20 4-44q1-24 3-47q1-23 1-40l0 0q2 17 4 40q2 23 5 47q2 24 5 44l0 0l63 524l100 0l59-524q2-20 5-44q2-24 5-47q3-23 4-40l0 0q1 17 3 40q1 23 3 47q2 24 4 44l0 0l50 524l94 0l-82-730l-125 0l-59 531q-2 21-4 45q-2 23-4 46q-2 22-4 37l0 0q-1-15-3-37q-2-23-4-46q-2-24-5-45l0 0l-63-531z"], "X": [600, "m152 0l-118 0l206 372l-194 358l122 0l102-199l18-38q9-19 14-29l0 0q4 10 13 29l0 0l18 38l104 199l117 0l-194-354l206-376l-122 0l-113 216q-10 19-19 39q-9 19-14 30l0 0q-4-11-13-30l0 0l-18-38l-115-217z"], "Y": [600, "m354 0l-108 0l0 269l-217 461l112 0l129-276q13-27 21-50q8-24 11-37l0 0q2 13 11 37q8 23 20 50l0 0l126 276l112 0l-217-461l0-269z"], "Z": [600, "m518 0l-436 0l0 105l311 526l-305 0l0 99l420 0l0-105l-311-526l321 0l0-99z"], "[": [600, "m457-110l-262 0l0 940l262 0l0-98l-155 0l0-744l155 0l0-98z"], "\\": [600, "m532-110l-113 0l-352 940l113 0l352-940z"], "]": [600, "m405-110l-262 0l0 98l155 0l0 744l-155 0l0 98l262 0l0-940z"], "^": [600, "m173 340l-99 0l176 390l102 0l174-390l-99 0l-102 244q-8 21-14 40q-6 18-9 28l0 0q-3-10-9-28q-7-19-16-40l0 0l-104-244z"], "_": [600, "m540-119l-480 0l0 94l480 0l0-94z"], "`": [600, "m400 645l-112 0l-116 140l120 0l108-140z"], "a": [600, "m245-10l0 0q-86 0-135 45q-50 44-50 121l0 0q0 78 53 123q52 44 144 44l0 0l153 0l0 51q0 45-28 70q-28 25-79 25l0 0q-45 0-75-19q-30-20-35-52l0 0l-106 0q9 74 69 118q59 44 150 44l0 0q98 0 155-49q57-50 57-135l0 0l0-376l-105 0l0 101l-1 0q-7-46-45-75l0 0q-46-36-122-36zm32 83l0 0q58 0 96 30q37 29 37 75l0 0l0 72l-151 0q-42 0-66-23q-25-23-25-63l0 0q0-42 29-66q29-25 80-25z"], "b": [600, "m339-10l0 0q-68 0-108 38l0 0q-32 29-38 77l0 0l-2 0l0-105l-107 0l0 730l108 0l0-157l-3-128l4 0q6 48 39 78l0 0q40 37 107 37l0 0q83 0 133-56q50-56 50-152l0 0l0-155q0-95-50-151q-50-56-133-56zm-37 94l0 0q53 0 83 31q30 30 30 88l0 0l0 144q0 58-30 89q-30 30-83 30l0 0q-51 0-80-31q-30-32-30-88l0 0l0-144q0-56 30-87q29-32 80-32z"], "c": [600, "m304-10l0 0q-68 0-119 26q-52 25-79 74q-28 48-28 113l0 0l0 144q0 66 28 114q27 48 79 74q51 25 119 25l0 0q99 0 159-52q60-52 63-142l0 0l-108 0q-3 47-33 73q-30 26-81 26l0 0q-55 0-87-30q-32-31-32-87l0 0l0-145q0-56 32-87q32-31 87-31l0 0q51 0 81 26q30 26 33 73l0 0l108 0q-3-90-63-142q-60-52-159-52z"], "d": [600, "m261-10l0 0q-83 0-133 56q-50 56-50 151l0 0l0 155q0 96 50 152q50 56 133 56l0 0q68 0 108-37l0 0q32-30 38-78l0 0l4 0l-3 128l0 157l108 0l0-730l-107 0l0 105l-2 0q-6-48-38-77l0 0q-40-38-108-38zm37 94l0 0q51 0 81 32q29 31 29 87l0 0l0 144q0 56-29 88q-30 31-81 31l0 0q-53 0-83-30q-30-31-30-89l0 0l0-144q0-58 30-88q30-31 83-31z"], "e": [600, "m300-10l0 0q-67 0-117 27q-51 26-78 74q-27 48-27 112l0 0l0 144q0 65 27 113q27 47 78 74q50 26 117 26l0 0q68 0 118-26q50-27 77-74q27-48 27-113l0 0l0-98l-340 0l0-46q0-61 31-93q30-32 88-32l0 0q47 0 76 17q29 16 36 48l0 0l107 0q-12-70-72-111q-60-42-148-42zm-118 332l236 1l0 25q0 60-30 93q-30 33-88 33l0 0q-57 0-87-33q-31-33-31-94l0 0l0-25z"], "f": [600, "m320 0l-107 0l0 394l-156 0l0 98l156 0l0 89q0 69 44 109q44 40 120 40l0 0l161 0l0-96l-159 0q-28 0-43-14q-16-14-16-40l0 0l0-88l218 0l0-98l-218 0l0-394z"], "g": [600, "m326-180l-170 0l0 93l169 0q42 0 63 20q20 20 20 59l0 0l0 55l2 102l-2 0q-5-49-38-79l0 0q-40-36-107-36l0 0q-85 0-134 56q-49 56-49 151l0 0l0 112q0 95 49 151q49 56 134 56l0 0q67 0 107-36l0 0q32-31 38-79l0 0l1 0l-1 105l107 0l0-560q0-79-50-124q-50-46-139-46l0 0zm-28 307l0 0q51 0 81 32q29 31 29 87l0 0l0 101q0 56-29 88q-30 31-81 31l0 0q-53 0-81-30q-29-31-29-89l0 0l0-101q0-57 29-88q28-31 81-31z"], "h": [600, "m192 0l-108 0l0 730l108 0l0-180l-1-105l2 0q6 48 37 78l0 0q39 37 108 37l0 0q82 0 131-52q49-53 49-142l0 0l0-366l-108 0l0 354q0 54-29 84q-29 30-79 30l0 0q-51 0-80-31q-30-32-30-90l0 0l0-347z"], "i": [600, "m556 0l-475 0l0 98l193 0l0 354l-168 0l0 98l273 0l0-452l177 0l0-98zm-240 645l0 0q-35 0-56 19q-21 18-21 49l0 0q0 32 21 51q21 18 56 18l0 0q35 0 56-18q21-19 21-51l0 0q0-31-21-49q-21-19-56-19z"], "j": [600, "m225-180l-141 0l0 100l138 0q55 0 86 30q31 30 31 85l0 0l0 416l-225 0l0 99l333 0l0-516q0-99-60-156q-60-58-162-58l0 0zm163 825l0 0q-35 0-56 19q-21 18-21 49l0 0q0 32 21 51q21 18 56 18l0 0q35 0 56-18q21-19 21-51l0 0q0-31-21-49q-21-19-56-19z"], "k": [600, "m195 0l-108 0l0 730l108 0l0-401l97 0l146 221l122 0l-175-264l178-286l-124 0l-147 236l-97 0l0-236z"], "l": [600, "m554 0l-175 0q-51 0-89 21q-38 20-59 58q-22 38-22 88l0 0l0 465l-180 0l0 98l288 0l0-563q0-32 18-50q18-19 49-19l0 0l170 0l0-98z"], "m": [600, "m156 0l-97 0l0 550l90 0l0-70l6 0q5 32 24 53l0 0q25 27 67 27l0 0q45 0 70-35l0 0q13-19 19-45l0 0l4 0q5 32 25 53l0 0q25 27 68 27l0 0q51 0 80-38q29-39 29-103l0 0l0-419l-96 0l0 416q0 31-13 48q-14 17-39 17q-25 0-38-16q-14-17-14-48l0 0l0-417l-81 0l0 416q0 32-14 49q-14 16-40 16l0 0q-25 0-37-16q-13-17-13-48l0 0l0-417z"], "n": [600, "m192 0l-108 0l0 550l107 0l0-105l2 0q6 48 37 78l0 0q39 37 108 37l0 0q82 0 131-52q49-53 49-142l0 0l0-366l-108 0l0 354q0 54-29 83q-29 29-79 29l0 0q-51 0-80-30q-30-31-30-89l0 0l0-347z"], "o": [600, "m300-9l0 0q-68 0-118 26q-50 26-77 74q-27 48-27 113l0 0l0 142q0 66 27 114q27 47 77 73q50 26 118 26l0 0q68 0 118-26q50-26 77-73q27-48 27-114l0 0l0-142q0-65-27-113q-27-48-77-74q-50-26-118-26zm0 95l0 0q55 0 85 31q30 30 30 87l0 0l0 142q0 58-30 88q-30 30-85 30l0 0q-54 0-84-30q-31-30-31-88l0 0l0-142q0-57 31-87q30-31 84-31z"], "p": [600, "m192-180l-108 0l0 730l107 0l0-105l2 0q6 48 39 78l0 0q40 37 108 37l0 0q83 0 133-55q49-56 49-152l0 0l0-155q0-64-22-110q-23-47-63-72q-41-26-97-26l0 0q-67 0-108 38l0 0q-33 29-39 77l0 0l-4 0l3-128l0-157zm111 264l0 0q53 0 83 31q29 30 29 88l0 0l0 144q0 58-29 89q-30 30-83 30l0 0q-51 0-81-31q-30-32-30-88l0 0l0-144q0-56 30-87q30-32 81-32z"], "q": [600, "m516-180l-108 0l0 157l3 128l-4 0q-6-48-38-77l0 0q-40-38-108-38l0 0q-83 0-132 56q-49 56-49 152l0 0l0 155q0 96 49 152q49 55 132 55l0 0q68 0 108-37l0 0q32-30 38-78l0 0l2 0l0 105l107 0l0-730zm-218 264l0 0q51 0 81 32q29 31 29 87l0 0l0 144q0 56-29 88q-30 31-81 31l0 0q-53 0-81-30q-29-31-29-89l0 0l0-144q0-58 29-88q28-31 81-31z"], "r": [600, "m210 0l-108 0l0 550l104 0l0-102q10 40 32 67l0 0q39 45 116 45l0 0q88 0 140-54q51-55 51-150l0 0l0-37l-111 0l0 28q0 59-29 91q-30 31-83 31q-53 0-82-32q-30-32-30-90l0 0l0-347z"], "s": [600, "m324-9l-43 0q-59 0-103 19q-45 19-70 53q-26 33-30 79l0 0l108 0q4-27 29-43q25-17 66-17l0 0l43 0q49 0 74 20q25 20 25 53l0 0q0 32-22 51q-23 18-67 24l0 0l-71 11q-88 14-129 51q-42 36-42 108l0 0q0 76 50 118q49 41 146 41l0 0l38 0q86 0 138-39q51-40 58-106l0 0l-108 0q-4 24-26 39q-23 15-62 15l0 0l-38 0q-47 0-68-17q-22-18-22-52l0 0q0-30 19-45q19-15 59-21l0 0l73-12q93-13 137-51q43-39 43-112l0 0q0-79-51-123q-52-44-154-44l0 0z"], "t": [600, "m514 0l-154 0q-75 0-117 41q-42 41-42 114l0 0l0 297l-152 0l0 98l152 0l0 155l108 0l0-155l215 0l0-98l-215 0l0-297q0-57 55-57l0 0l150 0l0-98z"], "u": [600, "m299-10l0 0q-99 0-158 58q-59 57-59 156l0 0l0 346l108 0l0-346q0-57 29-88q29-32 80-32l0 0q52 0 82 32q29 31 29 88l0 0l0 346l108 0l0-346q0-99-59-156q-60-58-160-58z"], "v": [600, "m371 0l-142 0l-182 550l110 0l113-352q11-31 20-62q8-32 12-50l0 0q5 18 14 50q8 31 17 62l0 0l111 352l109 0l-182-550z"], "w": [600, "m228 0l-115 0l-85 550l91 0l51-363q4-25 8-55q3-31 5-51l0 0q2 20 7 50q4 30 8 56l0 0l57 363l91 0l56-363q4-26 9-56q4-31 6-51l0 0q2 21 7 52q4 30 8 55l0 0l52 363l88 0l-88-550l-114 0l-54 359q-4 28-9 60q-5 31-7 50l0 0q-3-19-7-50l0 0l-9-60l-56-359z"], "x": [600, "m166 0l-123 0l193 284l-181 266l124 0l97-152q7-12 14-25q7-14 11-23l0 0q3 9 10 23q7 13 14 25l0 0l97 152l124 0l-181-267l192-283l-124 0l-107 165q-7 12-14 27q-7 15-11 24l0 0q-4-9-11-24q-8-15-16-27l0 0l-108-165z"], "y": [600, "m286-180l-114 0l79 212l-205 518l119 0l115-310q7-20 14-48q7-28 12-46l0 0q4 18 11 46q7 28 14 48l0 0l108 310l115 0l-268-730z"], "z": [600, "m516 0l-432 0l0 102l297 352l-288 0l0 96l412 0l0-102l-301-352l312 0l0-96z"], "{": [600, "m518-110l-57 0q-57 0-99 21q-43 20-65 59q-23 38-19 91l0 0l10 159q2 46-17 69q-19 22-75 22l0 0l-114 0l0 98l114 0q56 0 75 22q19 22 17 69l0 0l-10 160q-3 53 19 92q22 38 64 58q42 20 100 20l0 0l57 0l0-98l-48 0q-41 0-64-19q-23-19-21-59l0 0l10-160q4-62-33-99l0 0q-27-27-72-35l0 0q44-7 72-34l0 0q37-38 33-100l0 0l-10-160q-1-38 22-58q22-20 63-20l0 0l48 0l0-98z"], "|": [600, "m354-110l-108 0l0 940l108 0l0-940z"], "}": [600, "m139-110l-57 0l0 98l48 0q41 0 64 20q23 20 21 58l0 0l-10 160q-4 62 34 100l0 0q27 27 71 34l0 0q-45 8-72 35l0 0q-37 37-33 99l0 0l10 160q2 40-20 59q-23 19-65 19l0 0l-48 0l0 98l57 0q58 0 100-20q42-20 65-58q22-39 18-92l0 0l-10-160q-2-47 18-69q19-22 74-22l0 0l114 0l0-98l-114 0q-55 0-74-22q-20-23-18-69l0 0l10-159q4-53-18-91q-23-39-65-59q-42-21-100-21l0 0z"], "~": [600, "m153 255l-95 0l0 74q0 61 38 97q37 36 99 36l0 0q39 0 66-13q26-13 45-33q18-20 33-40q14-20 30-33q15-14 35-14l0 0q21 0 32 13q11 13 11 37l0 0l0 71l95 0l0-74q0-60-37-96q-37-37-100-37l0 0q-39 0-65 13q-27 13-45 33q-19 20-33 40q-15 20-30 34q-16 13-36 13l0 0q-21 0-32-12q-11-13-11-38l0 0l0-71z"], "·": [600, "m300 258l0 0q-40 0-64 24q-24 23-24 63l0 0q0 41 24 66q24 24 64 24l0 0q41 0 65-24q23-25 23-66l0 0q0-40-23-63q-24-24-65-24z"], "•": [600, "m300 241l0 0q-54 0-89 35q-35 35-35 89l0 0q0 55 35 90q35 34 89 34l0 0q55 0 90-34q34-35 34-90l0 0q0-54-34-89q-35-35-90-35z"], "—": [600, "m600 281l-600 0l0 98l600 0l0-98z"], "–": [600, "m521 281l-442 0l0 98l442 0l0-98z"], "’": [600, "m247 465l-94 0l80 311l144 0l-130-311z"], "‘": [600, "m353 775l94 0l-80-311l-144 0l130 311z"], "“": [600, "m447 465l-145 0l130 311l95 0l-80-311zm-239 0l-145 0l130 311l95 0l-80-311z"], "”": [600, "m407 465l-95 0l80 311l145 0l-130-311zm-239 0l-95 0l80 311l145 0l-130-311z"], "…": [600, "m490-10l0 0q-24 0-39 16q-15 16-15 42l0 0l0 67q0 26 15 42q15 16 39 16l0 0q25 0 40-16q14-16 14-42l0 0l0-67q0-26-14-42q-15-16-40-16zm-380 0l0 0q-24 0-39 16q-15 16-15 42l0 0l0 67q0 26 15 42q15 16 39 16l0 0q25 0 40-16q14-16 14-42l0 0l0-67q0-26-14-42q-15-16-40-16zm190 0l0 0q-24 0-39 16q-15 16-15 42l0 0l0 67q0 26 15 42q15 16 39 16l0 0q25 0 40-16q14-16 14-42l0 0l0-67q0-26-14-42q-15-16-40-16z"], "×": [600, "m299 261l-136-136l-66 67l134 135l-134 136l66 66l136-135l137 138l67-67l-138-138l136-135l-68-67l-134 136z"], "±": [600, "m531 0l-462 0l0 82l179 0l0 203l-184 0l0 97l184 0l0 188l107 0l0-188l184 0l0-97l-184 0l0-203l176 0l0-82z"], "©": [600, "m300 110l0 0q-76 0-133 30q-58 30-90 84q-32 54-32 126l0 0l0 150q0 72 32 126q32 54 90 84q57 30 133 30l0 0q77 0 134-30q57-30 89-84q32-54 32-126l0 0l0-150q0-72-32-126q-32-54-89-84q-57-30-134-30zm0 50l0 0q60 0 105 24q45 23 70 66q25 43 25 100l0 0l0 150q0 57-25 100q-25 42-70 66q-45 24-105 24l0 0q-60 0-105-24q-45-24-70-66q-25-43-25-100l0 0l0-150q0-57 25-100q25-43 70-66q45-24 105-24zm5 85l0 0q-57 0-92 33q-36 32-36 85l0 0l0 124q0 53 36 86q35 32 92 32l0 0q57 0 92-32q35-33 35-86l0 0l-71 0q0 26-15 42q-16 15-41 15l0 0q-26 0-41-15q-16-16-16-42l0 0l0-124q0-26 16-41q15-16 41-16l0 0q25 0 41 16q15 15 15 41l0 0l71 0q0-53-35-85q-35-33-92-33z"], "®": [600, "m300 110l0 0q-76 0-133 30q-58 30-90 84q-32 54-32 126l0 0l0 150q0 72 32 126q32 54 90 84q57 30 133 30l0 0q77 0 134-30q57-30 89-84q32-54 32-126l0 0l0-150q0-72-32-126q-32-54-89-84q-57-30-134-30zm0 50l0 0q60 0 105 24q45 23 70 66q25 43 25 100l0 0l0 150q0 57-25 100q-25 42-70 66q-45 24-105 24q-60 0-105-24q-45-24-70-66q-25-43-25-100l0 0l0-150q0-57 25-100q25-43 70-66q45-24 105-24zm130 90l-70 0l-57 139l-50 0l0-139l-66 0l0 350l117 0q55 0 88-29q32-29 32-77l0 0q0-49-32-77l0 0q-12-10-27-16l0 0l65-151zm-177 297l0-104l51 0q25 0 39 14q14 14 14 38q0 24-14 38q-14 14-39 14l0 0l-51 0z"], "™": [600, "m176 370l-62 0l0 306l-99 0l0 54l261 0l0-54l-100 0l0-306zm190 0l-58 0l0 360l82 0l33-102q5-14 10-35q4-22 6-36l0 0q2 14 6 36q4 21 8 35l0 0l32 102l80 0l0-360l-58 0l0 201q0 19 2 43q1 23 4 47q2 23 3 39l0 0q-5-20-12-47q-8-28-12-42l0 0l-27-94l-54 0l-30 95q-5 14-12 41q-7 26-13 46l0 0q3-16 5-38q2-22 4-45q1-24 1-43l0 0l0-203z"], "€": [600, "m320-10l0 0q-70 0-121 27q-52 27-80 76q-29 49-29 115l0 0l0 31l-74 0l0 74l74 0l0 94l-74 0l0 74l74 0l0 31q0 67 29 116q28 48 80 75q52 27 121 27l0 0q66 0 116-25q50-25 79-70q29-46 34-109l0 0l-108 0q-4 51-36 80q-32 28-85 28l0 0q-56 0-89-32q-33-33-33-90l0 0l0-31l160 0l0-74l-160 0l0-94l160 0l0-74l-160 0l0-31q0-57 33-89q32-33 89-33l0 0q52 0 85 29q32 28 36 79l0 0l108 0q-5-63-34-108q-30-46-79-71q-50-25-116-25z"], "£": [600, "m535 0l-460 0l0 118q24 16 49 40q25 24 43 51q17 26 17 51l0 0q0 21-3 39l0 0l-109 0l0 92l71 0q-14 22-29 43l0 0q-16 23-27 51q-11 28-11 66l0 0q0 56 28 99q27 43 77 67q50 23 119 23l0 0q67 0 117-23q49-24 77-68q27-44 29-105l0 0l-111 0q-1 45-32 73q-31 28-82 28l0 0q-53 0-83-27q-30-27-30-73l0 0q0-30 11-51q10-22 25-42q15-21 30-45l0 0q5-8 9-16l0 0l175 0l0-92l-149 0q1-14 1-30l0 0q0-43-19-77q-20-35-48-59q-28-24-55-35l0 0l370 0l0-98z"], "°": [600, "m300 450l0 0q-67 0-108 40q-42 40-42 105l0 0q0 65 42 105q41 40 108 40l0 0q68 0 109-40q41-40 41-105l0 0q0-65-41-105q-41-40-109-40zm-1 55l0 0q39 0 63 25q24 25 24 65l0 0q0 41-24 66q-24 25-63 25l0 0q-38 0-61-25q-24-25-24-66l0 0q0-40 24-65q23-25 61-25z"], "−": [600, "m460 281l-320 0l0 98l320 0l0-98z"], "↑": [600, "m345 0l-90 0l0 520q0 22 2 45q2 22 3 35l0 0l-10 0q-10-15-55-54l0 0l-185-158l0 105l291 247l289-246l0-105l-186 158q-22 19-35 33q-14 14-19 20l0 0l-10 0q2-13 4-35q1-23 1-45l0 0l0-520z"], "↓": [600, "m590 237l-291-247l-289 246l0 105l186-158q22-19 36-33q14-14 18-20l0 0l10 0q-1 13-3 36q-2 22-2 44l0 0l0 520l90 0l0-520q0-22-1-44q-2-23-4-36l0 0l10 0q10 15 55 54l0 0l185 158l0-105z"] }, "kern": {} }, "mono-600": { "upm": 1e3, "asc": 1020, "desc": -300, "lineGap": 0, "typoAsc": 1020, "typoDesc": -300, "capH": 730, "xH": 550, "glyphs": { "0": [600, "m300-10l0 0q-70 0-121 27q-52 27-80 76q-28 49-28 114l0 0l0 316q0 66 28 115q28 48 80 75q51 27 121 27l0 0q71 0 122-27q51-27 79-75q28-49 28-115l0 0l0-316q0-65-28-114q-28-49-79-76q-52-27-122-27zm0 100l0 0q54 0 86 33q32 32 32 84l0 0l0 316q0 52-32 85q-32 32-86 32l0 0q-54 0-86-32q-32-33-32-85l0 0l0-316q0-52 32-84q32-33 86-33zm0 212l0 0q-29 0-46 18q-18 18-18 48l0 0q0 29 18 47q17 17 46 17l0 0q29 0 47-17q17-18 17-47l0 0q0-30-17-48q-18-18-47-18z"], "1": [600, "m549 0l-463 0l0 103l191 0l0 525l-192-144l0 124l167 122l142 0l0-627l155 0l0-103z"], "2": [600, "m533 0l-451 0l0 114l227 231q50 52 74 94q23 41 23 83l0 0q0 53-29 84q-29 30-79 30l0 0q-56 0-87-32q-32-32-32-88l0 0l-117 0q1 69 31 119q29 50 82 78q53 27 124 27l0 0q68 0 119-26q50-26 78-73q27-47 27-111l0 0q0-66-34-129q-34-63-110-138l0 0l-159-158l313 0l0-105z"], "3": [600, "m292-10l0 0q-70 0-121 26q-52 26-80 74q-29 47-29 110l0 0l117 0q0-52 30-81q30-29 84-29l0 0q55 0 85 30q29 30 29 80l0 0l0 56q0 52-30 81q-30 29-84 29l0 0l-80 0l0 107l166 156l-285 0l0 101l403 0l0-107l-169-158q82-7 134-55l0 0q61-57 61-154l0 0l0-56q0-63-28-110q-28-48-80-74q-53-26-123-26z"], "4": [600, "m511 0l-116 0l0 148l-326 0l0 172l282 410l130 0l-300-440l0-38l214 0l0 168l116 0l0-420z"], "5": [600, "m298-10l0 0q-97 0-157 50q-61 49-67 133l0 0l116 0q4-38 32-59q28-22 77-22l0 0q55 0 83 29q28 29 28 81l0 0l0 71q0 53-28 82q-28 28-82 28l0 0q-34 0-59-15q-25-15-37-40l0 0l-114 0l5 402l405 0l0-105l-294 0l-3-220l3 0q8 29 34 48l0 0q36 27 98 27l0 0q89 0 139-54q49-55 49-153l0 0l0-71q0-98-60-155q-60-57-168-57z"], "6": [600, "m301-10l0 0q-73 0-128 31q-55 30-85 85q-30 54-30 127l0 0q0 52 17 108q17 56 48 106l0 0l175 283l129 0l-213-338l5-4q20 30 54 46q34 16 75 16l0 0q59 0 103-28q43-28 67-78q24-50 24-119l0 0q0-70-30-123q-30-53-84-82q-54-30-127-30zm-1 100l0 0q57 0 92 37q35 37 35 98l0 0q0 61-35 98q-35 37-92 37l0 0q-57 0-92-37q-35-37-35-98l0 0q0-61 35-98q35-37 92-37z"], "7": [600, "m287 0l-125 0l263 622l-244 0l0-106l-116 0l0 214l477 0l0-111l-255-619z"], "8": [600, "m300-10l0 0q-71 0-123 25q-52 24-80 69q-29 44-29 104l0 0q0 66 37 113l0 0q33 43 99 76l0 0q-57 30-88 69l0 0q-36 44-36 106l0 0q0 56 27 99q27 42 77 66q49 24 116 24q67 0 116-24q49-24 76-66q27-43 27-99l0 0q0-63-35-107l0 0q-31-38-88-68l0 0q68-34 101-77l0 0q35-48 35-112l0 0q0-91-62-144q-63-54-170-54zm0 100l0 0q54 0 86 29q32 29 32 75l0 0q0 37-22 70q-22 32-60 50l0 0l-36 17l-38-18q-37-17-58-49q-22-32-22-68l0 0q0-48 32-77q32-29 86-29zm-25 342l25-11l23 10q38 18 60 49q21 30 21 67l0 0q0 43-28 68q-28 25-76 25q-48 0-76-25q-29-26-29-69l0 0q0-36 22-66q21-30 58-48l0 0z"], "9": [600, "m302 0l-129 0l213 338l-5 4q-20-30-54-46q-34-16-75-16l0 0q-59 0-102 28q-44 28-68 79q-24 50-24 118l0 0q0 71 30 124q30 52 85 82q54 29 126 29l0 0q74 0 129-30q54-31 84-85q30-54 30-128l0 0q0-52-16-108q-17-56-49-106l0 0l-175-283zm-2 370l0 0q57 0 92 37q35 37 35 98l0 0q0 61-35 98q-35 37-92 37l0 0q-57 0-92-37q-35-37-35-98l0 0q0-61 35-98q35-37 92-37z"], " ": [600, ""], "!": [600, "m343 228l-86 0l-22 369l0 133l130 0l0-133l-22-369zm-28-233l-30 0q-30 0-48 18q-19 18-19 46l0 0q0 29 19 47q18 18 48 18l0 0l30 0q31 0 49-17q18-18 18-47l0 0q0-29-18-47q-19-18-49-18l0 0z"], '"': [600, "m456 430l-95 0l-13 179l0 121l120 0l0-121l-12-179zm-216 0l-95 0l-13 179l0 121l120 0l0-121l-12-179z"], "#": [600, "m163 0l-86 0l34 187l-83 0l0 80l97 0l35 196l-99 0l0 80l113 0l33 187l86 0l-34-187l145 0l33 187l86 0l-34-187l83 0l0-80l-97 0l-35-196l99 0l0-80l-113 0l-33-187l-86 0l34 187l-145 0l-33-187zm82 463l-35-196l145 0l35 196l-145 0z"], "$": [600, "m332-140l-62 0l0 131q-97 8-152 63q-56 54-57 140l0 0l116 0q0-39 25-65q24-27 68-34l0 0l0 224l-20 5q-83 23-128 80q-45 56-45 134l0 0q0 84 52 138q52 54 141 62l0 0l0 132l62 0l0-131q90-8 143-61q53-53 54-137l0 0l-117 0q0 38-20 63q-21 24-60 31l0 0l0-213l35-10q83-22 128-78q44-56 44-137l0 0q0-86-56-141q-56-56-151-65l0 0l0-131zm0 439l0-205q43 7 67 33q24 25 24 66l0 0q0 43-29 73l0 0q-23 24-62 33l0 0zm-62 142l0 0l0 194q-37-7-57-30q-20-23-20-59l0 0q0-47 31-78l0 0q19-19 46-27z"], "%": [600, "m88 0l-87 0l511 730l87 0l-511-730zm355-5l0 0q-64 0-104 37q-40 36-40 98l0 0l0 65q0 62 40 99q40 36 104 36l0 0q64 0 104-36q40-37 40-99l0 0l0-65q0-62-40-98q-40-37-104-37zm0 76l0 0q59 0 59 59l0 0l0 65q0 60-59 60l0 0q-59 0-59-60l0 0l0-65q0-59 59-59zm-286 329l0 0q-63 0-103 36q-41 36-41 99l0 0l0 65q0 63 41 99q40 36 103 36l0 0q63 0 104-36q40-36 40-99l0 0l0-65q0-63-40-99q-41-36-104-36zm0 75l0 0q59 0 59 60l0 0l0 65q0 60-59 60l0 0q-29 0-44-14q-15-15-15-46l0 0l0-65q0-31 15-45q15-15 44-15z"], "&": [600, "m232-10l0 0q-88 0-137 49q-49 48-49 134l0 0l0 100q0 64 32 105l0 0q26 34 71 48l0 0q-24 36-38 70l0 0q-16 39-16 78l0 0q0 50 24 87q23 37 66 58q42 21 99 21l0 0q60 0 104-22q44-23 68-63q24-40 24-94l0 0l-110 0q0 25-10 44q-11 18-30 28q-20 10-46 10l0 0q-24 0-43-9q-19-10-28-27q-10-17-10-41q0-24 12-53q12-29 33-58l0 0l146-205l59 110l114 0l-108-202l113-158l-118 0l-51 71q-71-81-171-81zm9 98l0 0q30 0 57 18q26 17 45 47l0 0l-139 195q-23-7-34-26q-12-19-12-49l0 0l0-100q0-41 22-63q22-22 61-22z"], "'": [600, "m345 430l-95 0l-13 146l0 154l120 0l0-154l-12-146z"], "(": [600, "m485-3l0-117q-150 39-231 141q-82 101-82 249l0 0l0 180q0 97 38 176q37 78 108 134q70 55 167 80l0 0l0-114q-60-14-104-52q-45-39-69-96q-24-57-24-128l0 0l0-180q0-70 24-126q24-57 69-95q44-38 104-52l0 0z"], ")": [600, "m115-120l0 0l0 117q61 14 105 52q44 38 68 95q24 56 24 126l0 0l0 180q0 71-24 128q-24 57-68 96q-44 38-105 52l0 0l0 114q98-25 168-80q70-56 108-134q37-79 37-176l0 0l0-180q0-148-81-249q-82-102-232-141z"], "*": [600, "m232 152l-44-63l-87 60l44 64q15 21 36 42q21 20 43 38q21 18 37 30l0 0l-3 5q-20 1-47 3q-28 2-56 8q-29 5-52 13l0 0l-72 26l37 100l72-26q23-8 48-23q25-15 48-31q23-16 39-29l0 0l5 4q-6 20-14 47q-8 27-13 57q-6 30-6 56l0 0l0 77l106 0l0-77q0-26-5-56q-6-30-13-57q-8-27-15-47l0 0l4-4q17 14 40 30q22 15 47 30q25 15 48 23l0 0l73 26l37-100l-73-26q-23-8-51-13q-28-6-55-8q-27-2-48-3l0 0l-3-6q16-12 38-30q21-18 42-38q21-21 35-41l0 0l44-64l-87-60l-44 63q-14 21-26 48q-13 27-22 54q-10 26-16 46l0 0l-7 0q-5-20-15-46q-10-27-22-54q-12-27-27-48l0 0z"], "+": [600, "m358 93l-116 0l0 184l-181 0l0 106l181 0l0 184l116 0l0-184l181 0l0-106l-181 0l0-184z"], ",": [600, "m256-160l-102 0l80 311l152 0l-130-311z"], "-": [600, "m460 277l-320 0l0 106l320 0l0-106z"], ".": [600, "m300-10l0 0q-42 0-66 25q-25 24-25 65l0 0q0 42 25 67q24 25 66 25l0 0q42 0 67-25q24-25 24-67l0 0q0-41-24-65q-25-25-67-25z"], "/": [600, "m185-110l-121 0l351 940l121 0l-351-940z"], ":": [600, "m300 397l0 0q-41 0-66 23q-25 22-25 58l0 0q0 37 25 60q25 22 66 22l0 0q41 0 66-22q25-23 25-60l0 0q0-36-25-58q-25-23-66-23zm0-407l0 0q-41 0-66 23q-25 22-25 59l0 0q0 37 25 59q25 22 66 22l0 0q41 0 66-22q25-22 25-59l0 0q0-37-25-59q-25-23-66-23z"], ";": [600, "m261-160l-102 0l80 311l152 0l-130-311zm49 557l-20 0q-36 0-59 23q-23 23-23 58l0 0q0 35 24 59q23 23 58 23l0 0l20 0q35 0 59-23q23-24 23-59l0 0q0-35-23-58q-23-23-59-23l0 0z"], "<": [600, "m522 169l0-111l-444 212l0 119l444 212l0-108l-295-139q-20-9-39-15q-19-6-29-8l0 0q11-2 30-8q19-6 38-15l0 0l295-139z"], "=": [600, "m517 399l-434 0l0 106l434 0l0-106zm0-244l-434 0l0 106l434 0l0-106z"], ">": [600, "m522 270l-444-212l0 109l295 138q20 9 39 15q19 6 29 8l0 0q-11 2-30 9q-19 6-38 15l0 0l-295 138l0 111l444-212l0-119z"], "?": [600, "m303 214l-105 0l-2 195l72 0q53 0 85 29q32 29 32 77l0 0q0 48-32 77q-32 29-86 29l0 0l-143 0l0 109l138 0q73 0 127-26q53-27 83-75q29-48 29-114l0 0q0-60-25-106q-25-46-69-73q-45-27-104-28l0 0l0-94zm-38-219l-30 0q-29 0-48 18q-19 18-19 46l0 0q0 29 19 47q19 18 48 18l0 0l30 0q31 0 49-17q18-18 18-47l0 0q0-29-18-47q-19-18-49-18l0 0z"], "@": [600, "m395-180l-70 0q-89 0-153 36q-65 35-100 101q-36 65-36 153l0 0l0 340q0 90 34 155q33 65 96 100q62 35 149 35l0 0q79 0 136-30q57-30 88-85q30-55 30-128l0 0l0-432l-89 0l5 55l-17 0q-7-23-26-40l0 0q-30-25-79-25l0 0q-63 0-97 42q-35 41-35 117l0 0l0 116q0 77 35 118q34 41 97 41l0 0q49 0 79-24l0 0q21-18 27-45l0 0l17 0l-15 69l0 8q0 48-18 84q-19 35-53 55q-35 19-85 19l0 0q-86 0-133-54q-48-54-48-151l0 0l0-340q0-94 51-146q50-53 140-53l0 0l70 0l0-91zm5 308l0 0q37 0 54 22q17 22 17 70l0 0l0 111q0 43-17 65q-18 21-54 21l0 0q-35 0-53-22q-18-22-18-65l0 0l0-116q0-45 18-65q18-21 53-21z"], "A": [600, "m158 0l-119 0l185 730l152 0l185-730l-118 0l-43 181l-200 0l-42-181zm111 481l-48-204l157 0l-46 203q-12 52-20 93q-9 41-12 57l0 0q-3-16-11-56q-8-41-20-93l0 0z"], "B": [600, "m313 0l-232 0l0 730l219 0q105 0 166-50q61-50 61-138l0 0q0-49-22-85q-22-37-60-57l0 0q-21-11-45-16l0 0q29-5 54-17l0 0q41-21 65-62q24-41 24-98l0 0q0-63-28-110q-28-47-79-72q-52-25-123-25l0 0zm-119 331l0-232l111 0q56 0 89 30q33 30 33 83l0 0q0 54-33 87q-33 32-89 32l0 0l-111 0zm0 300l0-204l105 0q52 0 82 28q29 27 29 74l0 0q0 48-29 75q-30 27-81 27l0 0l-106 0z"], "C": [600, "m304-10l0 0q-69 0-120 26q-52 26-80 75q-28 48-28 113l0 0l0 322q0 66 28 114q28 48 80 74q51 26 120 26l0 0q70 0 121-26q50-27 78-74q28-48 28-114l0 0l-116 0q0 54-29 83q-29 28-82 28l0 0q-53 0-82-28q-30-29-30-83l0 0l0-322q0-53 30-82q29-29 82-29l0 0q53 0 82 29q29 29 29 82l0 0l116 0q0-64-28-112q-28-49-78-75q-51-27-121-27z"], "D": [600, "m289 0l-210 0l0 730l210 0q74 0 128-28q53-28 83-78q30-51 30-120l0 0l0-277q0-69-30-120q-30-51-83-79q-54-28-128-28l0 0zm-93 623l0-516l93 0q58 0 91 32q33 32 33 88l0 0l0 277q0 55-33 87q-33 32-91 32l0 0l-93 0z"], "E": [600, "m524 0l-433 0l0 730l433 0l0-102l-318 0l0-199l283 0l0-102l-283 0l0-225l318 0l0-102z"], "F": [600, "m200 0l-116 0l0 731l448 0l0-108l-334 0l0-207l308 0l0-108l-306 0l0-308z"], "G": [600, "m304-10l0 0q-69 0-120 26q-52 26-80 75q-28 48-28 113l0 0l0 322q0 66 28 114q28 48 80 74q51 26 120 26l0 0q70 0 121-26q50-27 78-74q28-48 28-114l0 0l-116 0q0 54-29 83q-29 28-82 28l0 0q-53 0-82-28q-30-29-30-83l0 0l0-322q0-53 30-82q29-30 82-30l0 0q53 0 82 30q29 29 29 83l0 0l0 77l-131 0l0 102l247 0l0-180q0-65-28-113q-28-48-78-74q-51-27-121-27z"], "H": [600, "m198 0l-117 0l0 730l117 0l0-298l204 0l0 298l117 0l0-730l-117 0l0 324l-204 0l0-324z"], "I": [600, "m506 0l-412 0l0 103l147 0l0 524l-147 0l0 103l412 0l0-103l-147 0l0-524l147 0l0-103z"], "J": [600, "m270-10l0 0q-109 0-172 61q-64 60-64 163l0 0l116 0q0-57 32-89q32-33 88-33l0 0q56 0 88 32q32 32 32 90l0 0l0 408l-171 0l0 108l287 0l0-516q0-104-63-164q-64-60-173-60z"], "K": [600, "m197 0l-117 0l0 730l117 0l0-300l91 0l144 300l126 0l-167-350l176-380l-131 0l-149 325l-90 0l0-325z"], "L": [600, "m537 0l-431 0l0 730l117 0l0-622l314 0l0-108z"], "M": [600, "m171 0l-110 0l0 730l141 0l72-233q11-34 18-63q7-30 10-44l0 0q3 14 10 44q7 29 17 63l0 0l69 233l141 0l0-730l-110 0l0 236q0 49 3 107q3 58 8 117q4 59 10 113q5 53 9 92l0 0l-103-349l-110 0l-105 349q5-38 10-89q5-52 10-110q4-59 7-118q3-59 3-112l0 0l0-236z"], "N": [600, "m184 0l-107 0l0 730l144 0l208-598q-2 30-5 72q-4 41-6 86q-2 44-2 79l0 0l0 361l107 0l0-730l-144 0l-207 598q3-27 6-67q2-40 4-82q2-43 2-79l0 0l0-370z"], "O": [600, "m300-10l0 0q-69 0-119 26q-51 26-78 75q-27 48-27 113l0 0l0 322q0 66 27 114q27 48 78 74q50 26 119 26l0 0q70 0 120-26q50-26 77-74q27-48 27-114l0 0l0-322q0-65-27-113q-27-49-77-75q-50-26-120-26zm0 103l0 0q53 0 81 29q27 29 27 82l0 0l0 322q0 54-27 83q-28 28-81 28l0 0q-53 0-80-28q-28-29-28-83l0 0l0-322q0-53 28-82q28-29 80-29z"], "P": [600, "m197 0l-117 0l0 730l242 0q72 0 125-27q53-28 83-78q29-50 29-118l0 0q0-66-29-116q-30-51-83-78q-53-28-125-28l0 0l-125 0l0-285zm0 625l0-235l125 0q54 0 87 32q32 32 32 85l0 0q0 55-32 87q-33 31-87 31l0 0l-125 0z"], "Q": [600, "m539-180l-127 0l-103 170q-4 0-9 0l0 0q-69 0-120 27q-52 27-80 76q-29 49-29 114l0 0l0 316q0 66 29 115q28 48 80 75q51 27 120 27l0 0q70 0 121-27q51-27 80-75q28-49 28-115l0 0l0-316q0-66-28-115q-29-50-81-76l0 0l119-196zm-239 273l0 0q54 0 83 31q29 30 29 83l0 0l0 316q0 54-30 85q-30 30-82 30q-52 0-82-30q-30-31-30-85l0 0l0-316q0-53 30-83q29-31 82-31z"], "R": [600, "m196 0l-116 0l0 730l230 0q71 0 124-26q52-27 81-75q29-49 29-114l0 0q0-73-37-127q-37-55-100-77l0 0l147-311l-131 0l-131 295l-96 0l0-295zm0 627l0-229l114 0q53 0 85 31q31 30 31 83l0 0q0 53-31 84q-32 31-85 31l0 0l-114 0z"], "S": [600, "m302-10l0 0q-74 0-128 25q-54 25-83 71q-30 46-30 108l0 0l116 0q0-47 34-74q34-27 93-27l0 0q55 0 87 27q32 26 32 73l0 0q0 39-22 68q-22 28-63 38l0 0l-88 25q-83 23-128 80q-45 56-45 134l0 0q0 62 28 107q27 45 78 71q50 25 119 25l0 0q104 0 165-54q61-55 62-146l0 0l-117 0q0 45-29 71q-29 26-82 26l0 0q-51 0-79-24q-29-25-29-68l0 0q0-40 22-68q21-28 61-40l0 0l91-26q83-22 128-78q44-56 44-137l0 0q0-62-29-108q-30-47-83-73q-53-26-125-26z"], "T": [600, "m358 0l-116 0l0 623l-194 0l0 108l504 0l0-108l-194 0l0-623z"], "U": [600, "m300-10l0 0q-106 0-164 58q-59 58-59 158l0 0l0 524l116 0l0-523q0-54 27-84q27-31 80-31l0 0q52 0 80 31q27 30 27 84l0 0l0 523l116 0l0-524q0-100-58-158q-58-58-165-58z"], "V": [600, "m376 0l-152 0l-185 730l120 0l114-481q10-39 18-80q8-41 12-66l0 0q4 25 12 66q7 41 17 81l0 0l112 480l117 0l-185-730z"], "W": [600, "m228 0l-133 0l-77 730l103 0l47-517q1-18 3-42q1-25 3-49q1-24 1-42l0 0q2 18 4 42q2 24 5 49q3 24 5 42l0 0l62 517l102 0l58-517q2-18 5-42q2-25 5-49q3-24 4-42l0 0q1 18 3 42q1 24 3 49q2 24 3 42l0 0l47 517l101 0l-81-730l-132 0l-56 521q-2 21-4 45l0 0l-4 48q-2 24-4 41l0 0q-1-17-3-41l0 0l-4-48q-2-24-5-45l0 0l-61-521z"], "X": [600, "m158 0l-127 0l204 373l-192 357l131 0l97-191q10-19 19-38q8-19 12-29l0 0q4 10 12 29q8 19 18 38l0 0l99 191l126 0l-192-354l204-376l-131 0l-108 209q-10 19-18 39q-9 19-14 30l0 0q-4-11-12-30q-9-19-19-38l0 0l-109-210z"], "Y": [600, "m358 0l-116 0l0 267l-216 463l121 0l122-265q13-28 22-54q8-26 11-41l0 0q3 15 12 41q8 26 20 54l0 0l119 265l121 0l-216-463l0-267z"], "Z": [600, "m519 0l-438 0l0 112l302 510l-296 0l0 108l422 0l0-112l-302-510l312 0l0-108z"], "[": [600, "m461-110l-271 0l0 940l271 0l0-107l-155 0l0-726l155 0l0-107z"], "\\": [600, "m536-110l-122 0l-351 940l122 0l351-940z"], "]": [600, "m410-110l-271 0l0 107l155 0l0 726l-155 0l0 107l271 0l0-940z"], "^": [600, "m179 340l-108 0l174 390l112 0l172-390l-108 0l-97 237q-8 21-13 40q-6 19-9 29l0 0q-3-10-9-29q-6-19-15-40l0 0l-99-237z"], "_": [600, "m540-129l-480 0l0 104l480 0l0-104z"], "`": [600, "m404 645l-120 0l-116 140l129 0l107-140z"], "a": [600, "m242-10l0 0q-85 0-134 45q-50 44-50 121l0 0q0 80 54 124q53 44 148 44l0 0l145 0l0 49q0 42-27 66q-27 24-75 24l0 0q-43 0-71-18q-29-19-34-51l0 0l-114 0q9 76 70 121q60 45 152 45l0 0q100 0 158-50q58-50 58-136l0 0l0-374l-114 0l0 98l-1 0q-7-44-44-72l0 0q-46-36-121-36zm37 88l0 0q55 0 91 29q35 28 35 72l0 0l0 70l-143 0q-40 0-64-22q-24-23-24-61l0 0q0-41 28-64q28-24 77-24z"], "b": [600, "m343-10l0 0q-68 0-108 38l0 0q-31 30-38 77l0 0l-2 0l0-105l-115 0l0 730l117 0l0-156l-3-129l3 0q7 47 39 77l0 0q40 38 107 38l0 0q83 0 133-56q50-57 50-153l0 0l0-152q0-96-50-152q-50-57-133-57zm-41 101l0 0q51 0 80 30q28 29 28 83l0 0l0 142q0 54-28 84q-29 29-80 29l0 0q-48 0-76-30q-29-30-29-83l0 0l0-142q0-53 29-83q28-30 76-30z"], "c": [600, "m304-10l0 0q-70 0-121 26q-52 26-80 75q-29 48-29 113l0 0l0 142q0 66 29 114q28 48 80 74q51 26 121 26l0 0q101 0 162-53q61-53 64-144l0 0l-116 0q-3 45-32 70q-29 25-78 25l0 0q-53 0-83-29q-31-29-31-83l0 0l0-142q0-53 31-82q30-30 83-30l0 0q49 0 78 25q29 25 32 70l0 0l116 0q-3-91-64-144q-61-53-162-53z"], "d": [600, "m257-10l0 0q-83 0-133 57q-50 56-50 152l0 0l0 152q0 96 50 153q50 56 133 56l0 0q68 0 108-38l0 0q31-30 38-77l0 0l3 0l-3 129l0 156l117 0l0-730l-115 0l0 105l-2 0q-7-47-38-77l0 0q-40-38-108-38zm41 101l0 0q49 0 77 30q28 30 28 83l0 0l0 142q0 53-28 83q-28 30-77 30l0 0q-51 0-79-29q-29-30-29-84l0 0l0-142q0-54 29-83q28-30 79-30z"], "e": [600, "m300-10l0 0q-68 0-119 27q-51 26-79 75q-28 48-28 112l0 0l0 142q0 64 28 113q28 48 79 75q51 26 119 26l0 0q69 0 120-26q50-27 78-75q28-49 28-113l0 0l0-99l-340 0l0-43q0-59 30-90q29-31 85-31l0 0q45 0 73 16q27 16 34 45l0 0l115 0q-13-70-74-112q-61-42-149-42zm-114 333l228 1l0 22q0 59-28 91q-29 31-86 31l0 0q-55 0-84-32q-30-32-30-90l0 0l0-23z"], "f": [600, "m325 0l-116 0l0 385l-154 0l0 106l154 0l0 86q0 70 46 112q46 41 124 41l0 0l161 0l0-103l-159 0q-26 0-41-13q-15-14-15-39l0 0l0-84l215 0l0-106l-215 0l0-385z"], "g": [600, "m322-180l-168 0l0 99l166 0q42 0 63 20q21 20 21 58l0 0l0 49l2 102l-2 0q-7-48-38-78l0 0q-40-37-107-37l0 0q-85 0-134 57q-49 56-49 152l0 0l0 109q0 96 49 153q49 56 134 56l0 0q67 0 107-37l0 0q31-30 38-78l0 0l1 0l-2 105l116 0l0-555q0-81-52-128q-53-47-145-47l0 0zm-24 314l0 0q49 0 77 30q28 30 28 83l0 0l0 99q0 53-28 83q-28 30-77 30l0 0q-51 0-78-29q-28-30-28-84l0 0l0-99q0-54 28-83q27-30 78-30z"], "h": [600, "m197 0l-117 0l0 730l117 0l0-180l-2-105l2 0q6 48 38 78l0 0q39 37 107 37l0 0q82 0 131-53q49-53 49-144l0 0l0-363l-117 0l0 351q0 52-27 81q-28 28-76 28l0 0q-49 0-77-30q-28-30-28-84l0 0l0-346z"], "i": [600, "m557 0l-479 0l0 106l193 0l0 339l-168 0l0 105l280 0l0-444l174 0l0-106zm-240 644l0 0q-37 0-58 19q-21 18-21 50l0 0q0 33 21 52q21 19 58 19l0 0q37 0 58-19q21-19 21-52l0 0q0-32-21-50q-21-19-58-19z"], "j": [600, "m230-180l-147 0l0 108l143 0q52 0 81 29q29 28 29 80l0 0l0 405l-223 0l0 108l340 0l0-515q0-99-60-157q-60-58-163-58l0 0zm159 824l0 0q-37 0-58 19q-21 18-21 50l0 0q0 33 21 52q21 19 58 19l0 0q37 0 58-19q21-19 21-52l0 0q0-32-21-50q-21-19-58-19z"], "k": [600, "m200 0l-117 0l0 730l117 0l0-399l92 0l140 219l131 0l-171-265l174-285l-133 0l-141 232l-92 0l0-232z"], "l": [600, "m557 0l-175 0q-53 0-92 22q-40 21-62 60q-22 39-22 91l0 0l0 452l-178 0l0 105l295 0l0-557q0-31 18-49q17-19 47-19l0 0l169 0l0-105z"], "m": [600, "m159 0l-104 0l0 550l97 0l0-72l5 0q5 33 25 55l0 0q25 27 66 27l0 0q45 0 70-35l0 0q13-20 19-47l0 0l4 0q5 33 25 55l0 0q26 27 69 27l0 0q51 0 81-38q29-39 29-103l0 0l0-419l-103 0l0 415q0 29-12 45q-13 16-37 16q-24 0-37-15q-13-16-13-45l0 0l0-416l-86 0l0 415q0 30-13 46q-13 15-37 15q-24 0-36-15q-12-16-12-45l0 0l0-416z"], "n": [600, "m197 0l-117 0l0 550l115 0l0-105l2 0q6 48 38 78l0 0q39 37 107 37l0 0q82 0 131-53q49-53 49-144l0 0l0-363l-117 0l0 351q0 52-27 80q-28 28-76 28l0 0q-49 0-77-29q-28-30-28-84l0 0l0-346z"], "o": [600, "m300-9l0 0q-69 0-119 26q-51 26-79 75q-28 48-28 114l0 0l0 138q0 66 28 115q28 48 79 74q50 26 119 26l0 0q70 0 120-26q50-26 78-74q28-49 28-114l0 0l0-139q0-66-28-114q-28-49-78-75q-50-26-120-26zm0 102l0 0q52 0 81 29q29 29 29 84l0 0l0 138q0 56-29 85q-29 28-81 28l0 0q-51 0-80-28q-30-29-30-85l0 0l0-138q0-55 30-84q29-29 80-29z"], "p": [600, "m197-180l-117 0l0 730l115 0l0-105l2 0q7 47 39 77l0 0q40 38 108 38l0 0q83 0 133-56q49-57 49-153l0 0l0-152q0-63-22-110q-23-48-63-73q-41-26-97-26l0 0q-68 0-108 38l0 0q-32 30-39 77l0 0l-3 0l3-129l0-156zm106 271l0 0q50 0 79 30q28 29 28 83l0 0l0 142q0 55-28 84q-29 29-79 29l0 0q-49 0-77-30q-29-30-29-83l0 0l0-142q0-53 29-83q28-30 77-30z"], "q": [600, "m520-180l-117 0l0 156l3 129l-4 0q-6-47-37-77l0 0q-40-38-108-38l0 0q-83 0-132 57q-49 56-49 152l0 0l0 152q0 96 49 153q49 56 132 56l0 0q68 0 108-38l0 0q31-30 37-77l0 0l3 0l0 105l115 0l0-730zm-222 271l0 0q49 0 77 30q28 30 28 83l0 0l0 142q0 53-28 83q-28 30-77 30l0 0q-51 0-78-29q-28-29-28-84l0 0l0-142q0-54 28-83q27-30 78-30z"], "r": [600, "m215 0l-117 0l0 550l111 0l0-105l0 0q10 42 34 70l0 0q39 45 116 45l0 0q89 0 140-54q51-55 51-152l0 0l0-38l-121 0l0 30q0 56-28 86q-29 30-79 30l0 0q-51 0-79-30q-28-31-28-86l0 0l0-346z"], "s": [600, "m323-9l-43 0q-61 0-106 20q-46 19-72 54q-27 34-30 81l0 0l117 0q3-27 28-43q24-16 63-16l0 0l43 0q48 0 72 19q24 19 24 51l0 0q0 30-21 48q-22 17-65 23l0 0l-70 10q-91 14-133 51q-43 36-43 109l0 0q0 77 51 119q50 42 149 42l0 0l38 0q89 0 142-40q53-40 59-108l0 0l-117 0q-3 23-25 38q-22 14-59 14l0 0l-38 0q-45 0-65-16q-21-17-21-49l0 0q0-29 18-43q18-15 57-21l0 0l72-10q95-14 140-52q45-39 45-113l0 0q0-80-52-124q-53-44-158-44l0 0z"], "t": [600, "m517 0l-157 0q-77 0-120 43q-43 42-43 117l0 0l0 285l-151 0l0 105l151 0l0 155l116 0l0-155l214 0l0-105l-214 0l0-285q0-55 54-55l0 0l150 0l0-105z"], "u": [600, "m299-10l0 0q-102 0-161 58q-60 58-60 158l0 0l0 344l117 0l0-343q0-55 28-85q27-30 76-30l0 0q50 0 78 30q28 30 28 85l0 0l0 343l117 0l0-344q0-100-60-158q-61-58-163-58z"], "v": [600, "m376 0l-151 0l-182 550l119 0l109-343q10-31 19-62q8-32 12-50l0 0q5 18 14 50q8 31 16 62l0 0l107 343l118 0l-181-550z"], "w": [600, "m230 0l-122 0l-84 550l98 0l48-350q4-27 8-60q3-33 5-54l0 0q2 21 7 54q5 33 9 60l0 0l54 350l94 0l54-350q4-27 9-60q5-33 7-55l0 0q2 22 7 55q4 33 8 60l0 0l50 350l94 0l-87-550l-122 0l-51 349q-4 28-9 61q-5 33-7 53l0 0q-3-20-7-53q-5-33-9-61l0 0l-54-349z"], "x": [600, "m172 0l-133 0l193 284l-180 266l133 0l91-143q7-12 14-26q7-15 11-24l0 0q3 9 10 24q7 14 14 26l0 0l91 143l133 0l-180-267l192-283l-133 0l-102 158q-7 12-14 27q-7 15-11 25l0 0q-4-10-11-25q-8-15-16-27l0 0l-102-158z"], "y": [600, "m292-180l-123 0l78 211l-205 519l128 0l108-296q8-21 16-51l0 0l12-50q4 20 12 50q7 30 14 51l0 0l103 296l123 0l-266-730z"], "z": [600, "m519 0l-438 0l0 108l292 339l-283 0l0 103l418 0l0-108l-296-339l307 0l0-103z"], "{": [600, "m519-110l-62 0q-57 0-99 21q-43 21-65 60q-23 39-19 93l0 0l10 156q2 43-17 65q-19 21-70 21l0 0l-116 0l0 107l116 0q51 0 70 22q19 21 17 65l0 0l-10 158q-3 54 19 93q22 38 64 59q42 20 100 20l0 0l62 0l0-107l-49 0q-39 0-60-18q-22-18-20-56l0 0l10-158q4-61-34-97l0 0q-28-27-73-34l0 0q44-7 73-34l0 0q38-37 34-98l0 0l-10-157q-1-36 21-55q21-20 59-20l0 0l49 0l0-106z"], "|": [600, "m358-110l-116 0l0 940l116 0l0-940z"], "}": [600, "m143-110l-62 0l0 106l49 0q38 0 60 20q22 19 20 55l0 0l-10 157q-4 61 35 98l0 0q28 27 72 34l0 0q-44 7-72 34l0 0q-39 36-35 97l0 0l10 158q2 38-19 56q-22 18-61 18l0 0l-49 0l0 107l62 0q58 0 100-20q42-21 65-59q22-39 18-93l0 0l-10-158q-2-44 18-65q19-22 69-22l0 0l116 0l0-107l-116 0q-50 0-69-21q-20-22-18-65l0 0l10-156q4-54-18-93q-23-39-65-60q-42-21-100-21l0 0z"], "~": [600, "m154 255l-100 0l0 77q0 61 39 98q39 36 102 36l0 0q40 0 67-13q27-14 46-34q18-20 33-40q14-20 29-33q15-14 35-14l0 0q20 0 31 12q10 12 10 34l0 0l0 72l100 0l0-77q0-60-38-97q-39-37-103-37l0 0q-40 0-67 14q-27 13-45 33q-19 20-33 40q-15 20-30 34q-15 13-35 13l0 0q-20 0-30-11q-11-12-11-35l0 0l0-72z"], "·": [600, "m300 256l0 0q-42 0-66 25q-25 24-25 65l0 0q0 42 25 67q24 25 66 25l0 0q42 0 67-25q24-25 24-67l0 0q0-41-24-65q-25-25-67-25z"], "•": [600, "m300 238l0 0q-56 0-91 36q-36 35-36 91l0 0q0 56 36 92q35 35 91 35l0 0q56 0 92-35q35-36 35-92l0 0q0-56-35-91q-36-36-92-36z"], "—": [600, "m600 277l-600 0l0 106l600 0l0-106z"], "–": [600, "m522 277l-444 0l0 106l444 0l0-106z"], "’": [600, "m251 465l-102 0l80 311l152 0l-130-311z"], "‘": [600, "m349 775l102 0l-80-311l-152 0l130 311z"], "“": [600, "m453 465l-152 0l130 311l102 0l-80-311zm-244 0l-152 0l130 311l102 0l-80-311z"], "”": [600, "m413 465l-102 0l80 311l152 0l-130-311zm-244 0l-102 0l80 311l152 0l-130-311z"], "…": [600, "m490-10l0 0q-25 0-41 17q-16 16-16 42l0 0l0 66q0 27 16 43q16 16 41 16l0 0q26 0 42-16q15-16 15-43l0 0l0-66q0-26-15-42q-16-17-42-17zm-380 0l0 0q-25 0-41 17q-16 16-16 42l0 0l0 66q0 27 16 43q16 16 41 16l0 0q26 0 42-16q15-16 15-43l0 0l0-66q0-26-15-42q-16-17-42-17zm190 0l0 0q-25 0-41 17q-16 16-16 42l0 0l0 66q0 27 16 43q16 16 41 16l0 0q26 0 42-16q15-16 15-43l0 0l0-66q0-26-15-42q-16-17-42-17z"], "×": [600, "m299 253l-132-133l-74 75l131 131l-131 133l74 74l132-132l134 134l74-75l-135-134l133-131l-74-75l-132 133z"], "±": [600, "m532 0l-464 0l0 88l176 0l0 192l-181 0l0 106l181 0l0 184l116 0l0-184l182 0l0-106l-182 0l0-192l172 0l0-88z"], "©": [600, "m300 110l0 0q-76 0-133 30q-58 30-90 84q-32 54-32 126l0 0l0 150q0 72 32 126q32 54 90 84q57 30 133 30l0 0q77 0 134-30q57-30 89-84q32-54 32-126l0 0l0-150q0-72-32-126q-32-54-89-84q-57-30-134-30zm0 50l0 0q60 0 105 24q45 23 70 66q25 43 25 100l0 0l0 150q0 57-25 100q-25 42-70 66q-45 24-105 24l0 0q-60 0-105-24q-45-24-70-66q-25-43-25-100l0 0l0-150q0-57 25-100q25-43 70-66q45-24 105-24zm5 85l0 0q-58 0-93 33q-36 33-36 86l0 0l0 122q0 53 36 86q35 33 93 33l0 0q58 0 93-33q35-33 35-86l0 0l-73 0q0 25-15 40q-16 15-40 15l0 0q-25 0-40-15q-16-15-16-40l0 0l0-122q0-25 16-40q15-15 40-15l0 0q24 0 40 15q15 15 15 40l0 0l73 0q0-53-35-86q-35-33-93-33z"], "®": [600, "m300 110l0 0q-76 0-133 30q-58 30-90 84q-32 54-32 126l0 0l0 150q0 72 32 126q32 54 90 84q57 30 133 30l0 0q77 0 134-30q57-30 89-84q32-54 32-126l0 0l0-150q0-72-32-126q-32-54-89-84q-57-30-134-30zm0 50l0 0q60 0 105 24q45 23 70 66q25 43 25 100l0 0l0 150q0 57-25 100q-25 42-70 66q-45 24-105 24q-60 0-105-24q-45-24-70-66q-25-43-25-100l0 0l0-150q0-57 25-100q25-43 70-66q45-24 105-24zm131 90l-72 0l-57 138l-48 0l0-138l-68 0l0 350l118 0q55 0 88-29q33-29 33-78q0-49-33-77l0 0q-11-10-25-16l0 0l64-150zm-177 296l0-102l50 0q24 0 38 14q14 14 14 37q0 23-14 37q-14 14-38 14l0 0l-50 0z"], "™": [600, "m177 370l-64 0l0 303l-98 0l0 57l262 0l0-57l-100 0l0-303zm190 0l-60 0l0 360l83 0l32-102q5-14 10-35q4-22 7-36l0 0q2 14 6 36q4 21 8 35l0 0l31 102l81 0l0-360l-59 0l0 192q0 19 2 44q1 25 4 50q2 25 4 44l0 0q-5-20-12-48q-8-29-13-45l0 0l-26-90l-55 0l-29 90q-5 17-12 44q-7 27-13 47l0 0q3-17 5-41q2-24 4-48q2-25 2-45l0 0l0-194z"], "€": [600, "m320-10l0 0q-71 0-123 27q-53 27-82 77q-29 50-29 115l0 0l0 27l-71 0l0 78l71 0l0 92l-71 0l0 78l71 0l0 27q0 66 29 116q29 49 82 76q52 27 123 27l0 0q68 0 119-25q51-26 81-72q29-47 33-111l0 0l-116 0q-4 49-35 77q-31 27-82 27l0 0q-55 0-86-30q-32-31-32-85l0 0l0-27l157 0l0-78l-157 0l0-92l157 0l0-78l-157 0l0-27q0-54 31-84q31-31 87-31l0 0q51 0 82 28q31 27 35 76l0 0l116 0q-4-63-33-110q-30-47-81-72q-51-26-119-26z"], "£": [600, "m535 0l-460 0l0 127q24 15 49 38q25 22 43 48q17 25 17 50l0 0q0 18-2 33l0 0l-111 0l0 98l69 0q-14 20-29 40l0 0q-17 22-28 49q-12 27-12 65l0 0q0 57 28 100q28 43 80 68q51 24 121 24l0 0q68 0 119-24q50-25 78-69q28-45 30-106l0 0l-119 0q-2 43-31 70q-30 27-79 27l0 0q-52 0-80-26q-29-26-29-70l0 0q0-28 11-49q10-21 26-41q15-20 30-43l0 0q4-7 8-15l0 0l171 0l0-98l-143 0q1-11 1-24l0 0q0-43-20-77q-21-34-50-56q-30-22-58-32l0 0l370 0l0-107z"], "°": [600, "m300 450l0 0q-67 0-108 40q-42 40-42 105l0 0q0 65 42 105q41 40 108 40l0 0q68 0 109-40q41-40 41-105l0 0q0-65-41-105q-41-40-109-40zm-1 57l0 0q38 0 61 25q23 24 23 63l0 0q0 40-23 64q-23 24-61 24l0 0q-37 0-59-24q-23-24-23-64l0 0q0-39 23-63q22-25 59-25z"], "−": [600, "m460 277l-320 0l0 106l320 0l0-106z"], "↑": [600, "m345 0l-90 0l0 520q0 22 2 45q2 22 3 35l0 0l-10 0q-10-15-55-54l0 0l-185-158l0 105l291 247l289-246l0-105l-186 158q-22 19-35 33q-14 14-19 20l0 0l-10 0q2-13 4-35q1-23 1-45l0 0l0-520z"], "↓": [600, "m590 237l-291-247l-289 246l0 105l186-158q22-19 36-33q14-14 18-20l0 0l10 0q-1 13-3 36q-2 22-2 44l0 0l0 520l90 0l0-520q0-22-1-44q-2-23-4-36l0 0l10 0q10 15 55 54l0 0l185 158l0-105z"] }, "kern": {} } };

  // src/design-kit/text.js
  var WEIGHTS = { inter: [400, 500, 600, 700], mono: [400, 500, 600] };
  function fontKey(family, weight) {
    const fam = family === "mono" ? "mono" : "inter";
    const w = WEIGHTS[fam].reduce((a, b) => Math.abs(b - weight) < Math.abs(a - weight) ? b : a);
    return `${fam}-${w}`;
  }
  var decoded = /* @__PURE__ */ new Map();
  function glyph(fk, ch) {
    const key = fk + ch;
    if (decoded.has(key)) return decoded.get(key);
    const f = glyphs_default[fk];
    const g = f.glyphs[ch] || f.glyphs["?"];
    const cmds = [];
    const re = /([mlqcz])([^mlqcz]*)/g;
    let m, x = 0, y = 0;
    while (m = re.exec(g[1])) {
      const t = m[1];
      const n = (m[2].match(/-?\d+/g) || []).map(Number);
      if (t === "z") {
        cmds.push(["Z"]);
        continue;
      }
      if (t === "m" || t === "l") {
        x += n[0];
        y += n[1];
        cmds.push([t.toUpperCase(), x, y]);
      } else if (t === "q") {
        const x1 = x + n[0], y1 = y + n[1];
        x += n[2];
        y += n[3];
        cmds.push(["Q", x1, y1, x, y]);
      } else if (t === "c") {
        const x1 = x + n[0], y1 = y + n[1], x2 = x + n[2], y2 = y + n[3];
        x += n[4];
        y += n[5];
        cmds.push(["C", x1, y1, x2, y2, x, y]);
      }
    }
    const r = { adv: g[0], cmds };
    decoded.set(key, r);
    return r;
  }
  function measure(text, { size = 14, weight = 400, family = "inter", ls = 0 } = {}) {
    const fk = fontKey(family, weight), f = glyphs_default[fk], s = size / f.upm;
    let w = 0, prev = null, n = 0;
    for (const ch of String(text)) {
      w += glyph(fk, ch).adv;
      if (prev) w += f.kern[prev + ch] || 0;
      prev = ch;
      n++;
    }
    return w * s + ls * Math.max(0, n - 1);
  }
  function wrap(text, maxWidth, opts) {
    const words = String(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let cur = "";
    for (const w of words) {
      const t = cur ? cur + " " + w : w;
      if (!cur || measure(t, opts) <= maxWidth + 0.01) cur = t;
      else {
        lines.push(cur);
        cur = w;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  }
  function textPath(text, { x = 0, y = 0, size = 14, weight = 400, family = "inter", ls = 0, lh, align = "left", width, lines } = {}) {
    const fk = fontKey(family, weight), f = glyphs_default[fk], s = size / f.upm;
    const L = lh || Math.round(size * 1.4);
    const ls_ = lines || (width ? wrap(text, width, { size, weight, family, ls }) : String(text).split("\n"));
    const asc = f.asc * s, desc = -f.desc * s;
    let d = "";
    let maxW = 0;
    ls_.forEach((line, i) => {
      const lw = measure(line, { size, weight, family, ls });
      maxW = Math.max(maxW, lw);
      const boxW = width != null ? width : 0;
      let x0 = x;
      if (align === "center") x0 = width != null ? x + (boxW - lw) / 2 : x - lw / 2;
      else if (align === "right") x0 = width != null ? x + boxW - lw : x - lw;
      const base2 = y + i * L + (L - (asc + desc)) / 2 + asc;
      let pen = 0, prev = null;
      for (const ch of line) {
        const g = glyph(fk, ch);
        if (prev) pen += f.kern[prev + ch] || 0;
        for (const c of g.cmds) {
          if (c[0] === "Z") {
            d += "Z";
            continue;
          }
          d += c[0];
          for (let k = 1; k < c.length; k += 2) {
            const X = x0 + (pen + c[k]) * s, Y = base2 - c[k + 1] * s;
            d += (k > 1 ? " " : "") + num(X) + " " + num(Y);
          }
        }
        pen += g.adv + ls / s;
        prev = ch;
      }
    });
    return { d, width: width != null ? width : maxW, textWidth: maxW, height: ls_.length * L, lines: ls_.length, lh: L };
  }

  // src/design-kit/icons.js
  var ICONS = {
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    shield: '<path d="M12 3l7 3v5c0 4.6-3 8.2-7 10-4-1.8-7-5.4-7-10V6z"/>',
    shieldCheck: '<path d="M12 3l7 3v5c0 4.6-3 8.2-7 10-4-1.8-7-5.4-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
    alert: '<path d="M10.3 4.6L2.9 17.5A2 2 0 0 0 4.6 20.5h14.8a2 2 0 0 0 1.7-3L13.7 4.6a2 2 0 0 0-3.4 0z"/><path d="M12 9.5v4"/><path d="M12 17h.01"/>',
    bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 21h4"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.8 2.6 4 5.6 4 9s-1.2 6.4-4 9c-2.8-2.6-4-5.6-4-9s1.2-6.4 4-9z"/>',
    server: '<rect x="4" y="4" width="16" height="7" rx="2"/><rect x="4" y="13" width="16" height="7" rx="2"/><path d="M8 7.5h.01M8 16.5h.01"/>',
    activity: '<path d="M3 12h4l3-7 4 14 3-7h4"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c.8-3.6 3.8-5.5 7.5-5.5s6.7 1.9 7.5 5.5"/>',
    users: '<circle cx="9" cy="8.5" r="3.5"/><path d="M2.5 20c.6-3.3 3.1-5 6.5-5s5.9 1.7 6.5 5"/><path d="M16 5.2a3.5 3.5 0 0 1 0 6.6"/><path d="M18 15.4c2 .6 3.2 2.1 3.5 4.6"/>',
    sliders: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
    file: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/>',
    bars: '<path d="M6 20v-8M12 20V5M18 20v-5"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    cpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3"/>',
    share: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.3 10.8l7.4-3.6M8.3 13.2l7.4 3.6"/>',
    eye: '<path d="M2.5 12C5 7 8.3 5 12 5s7 2 9.5 7c-2.5 5-5.8 7-9.5 7S5 17 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    filter: '<path d="M4 5h16l-6 8v6l-4-2v-4z"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    chevronDown: '<path d="M6 9l6 6 6-6"/>',
    chevronRight: '<path d="M9 6l6 6-6 6"/>',
    chevronLeft: '<path d="M15 6l-6 6 6 6"/>',
    more: '<path d="M5 12h.01M12 12h.01M19 12h.01" stroke-width="3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    home: '<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-5h4v5"/>',
    inbox: '<path d="M3 13l3-8h12l3 8v6H3z"/><path d="M3 13h5l1.5 2.5h5L16 13h5"/>',
    star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z"/>',
    cart: '<path d="M3 4h2.5l2.2 11h10.6L20.5 7H6.4"/><circle cx="9" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    book: '<path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5c-.8 0-1.5-.7-1.5-1.5z"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H13v16h5.5c.8 0 1.5-.7 1.5-1.5z"/>',
    code: '<path d="M9 7l-5 5 5 5M15 7l5 5-5 5"/>',
    terminal: '<path d="M5 7l5 5-5 5M12 18h7"/>',
    calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v4M16 3v4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    zap: '<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>',
    database: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l8-8M16 7l2 2M14 9l2 2"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    bug: '<rect x="7" y="8" width="10" height="12" rx="5"/><path d="M12 12v8M3 13h4M17 13h4M4 7l3 2M20 7l-3 2M4 19l3-2M20 19l-3-2M9 5l1.5 2M15 5l-1.5 2"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
    radar: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 12l6-6"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.6-4.5L4 8M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.6 4.5L20 16M20 20v-4h-4"/>',
    trendUp: '<path d="M4 17l6-6 4 4 6-7"/><path d="M15 8h5v5"/>',
    trendDown: '<path d="M4 7l6 6 4-4 6 7"/><path d="M15 16h5v-5"/>',
    heart: '<path d="M12 20s-8-4.6-8-10.3A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8 2.7C20 15.4 12 20 12 20z"/>',
    truck: '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="1.8"/><circle cx="17.5" cy="18" r="1.8"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
    message: '<path d="M4 5h16v11H9l-5 4z"/>',
    logout: '<path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9"/>',
    github: '<path d="M9 19c-4 1.4-4-2-6-2.5M15 21v-3.5c0-1 .1-1.5-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6 0C6.8 2.8 5.8 3.1 5.8 3.1a4.3 4.3 0 0 0-.1 3.2A4.6 4.6 0 0 0 4.4 9.5c0 4.6 2.7 5.7 5.5 6-.6.5-.6 1.1-.5 2V21"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    wifi: '<path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.5 16a5 5 0 0 1 7 0"/><path d="M12 19.5h.01"/>',
    cloud: '<path d="M7 18a4.5 4.5 0 0 1-.5-9A6 6 0 0 1 18 9.5a4.3 4.3 0 0 1-.5 8.5z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5l8.5 6 8.5-6"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.4"/>',
    minus: '<path d="M5 12h14"/>',
    hash: '<path d="M5 9h14M5 15h14M10 4L8 20M16 4l-2 16"/>'
  };
  function iconSvg(name, x, y, size = 20, color2 = "#000", sw = 1.75) {
    const k = size / 24;
    return `<g id="icon/${name}" transform="translate(${num(x)} ${num(y)}) scale(${num(k)})" stroke="${color2}" stroke-width="${num(sw / k)}" stroke-linecap="round" stroke-linejoin="round" fill="none">${ICONS[name] || ""}</g>`;
  }
  function iconHtml(name, size = 20, color2 = "currentColor", sw = 1.75, cls = "ic") {
    return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color2}" stroke-width="${num(sw * 24 / size)}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;
  }

  // src/design-kit/worldmask.js
  var COLS = 132;
  var ROWS = 58;
  var LAT0 = 82;
  var LAT1 = -56;
  var ROWS_HEX = ["00000001ffbffff8000008000c0000000", "0000001abdffffe003800000018000000", "0000058c800fffe0000000e00bf004000", "000006058807ffc000000200fff800000", "800005f17f1ffffffc000617ffffffc00", "ffffffffffffffffff00ff20000000000", "1ffffffffffffffffe024008000000000", "01fffffff1c1e03003feffffffffffffe", "07ffffff0700c0000f3fffffffffffffc", "01e1fffe07a000000f9fffffffffffe40", "00c07fff83e00000873ffffffffff81c0", "00003ffff7f8000144fffffffffff0180", "00001ffff7fc0003effffffffffffe100", "00001fffffe400003ffffffffffffe000", "00000fffffc200007ffffffffffff8000", "000007ffffa000003ffae7fffffff0000", "00000fffff000001e27067ffffffc6000", "00000ffffe000001c5eff7fffffd84000", "000007fffc000001c12ff3fffff884000", "000003fffc0000007c01fffffffc9c000", "000001fff8000001fc01fffffffc40000", "0000017ff0000003fffffffffffe00000", "000000fe00000003fffff7fffffe00000", "0000003c08000007fffff1fffffc00000", "0000005c0000000ffffefe1ffffa00000", "0000001c4400000fffffff0fcfa000000", "0000000e4180000fffff7e078f8000000", "00000003c000000fffff3807038200000", "00000000e000000fffffb00603c200000", "000000002100000fffffc80202c000000", "0000000013f00007fffff803008000000", "0000000007f80003fffff001000100000", "0000000003fe00010ffff000050800000", "0000000007fe000003ffe000031800000", "0000000007ff000007ffc000013800000", "000000000fffc00003ff800001ba08000", "000000000ffff00003ff000000800e000", "0000000007fff80001ff0000006007000", "0000000007fff80001ff8000000100800", "0000000003fff00001ff8000000000000", "0000000003fff00003ff80000000f2000", "0000000001fff00003ff30000fffffffe", "0000000000ffe00001fe30000001ff000", "0000000000ffe00001fe3000000fff800", "0000000000ff800001fe2000000fffc00", "0000000000ff000000fc0000000fffc00", "0000000000ff000000fc0000000fffc00", "0000000000fe000000780000000fffc00", "0000000000fe000000700000000e17c00", "0000000001f8000000000000000007800", "0000000001f8000000000000000003002", "0000000001e0000000000000000000002", "0000000001c0000000000000000001004", "000000000180000000000000000000018", "0000000003c0000000000000000000000", "000000000380000000000000000000000", "000000000100000000000000000000000", "0000000000c0000000000000000000000"];
  function landAt(c, r) {
    const h2 = ROWS_HEX[r];
    if (!h2) return false;
    const nib = parseInt(h2[c >> 2], 16);
    return (nib >> 3 - (c & 3) & 1) === 1;
  }
  function project(lon, lat) {
    return [(lon + 180) / 360 * COLS, (LAT0 - lat) / (LAT0 - LAT1) * ROWS];
  }

  // src/design-kit/charts.js
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a |= 0;
      a = a + 1831565813 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function points(series2, box2, lo, hi) {
    const n = series2.length;
    return series2.map((v, i) => [box2.x + (n === 1 ? box2.w / 2 : i / (n - 1) * box2.w), box2.y + box2.h - (v - lo) / (hi - lo) * box2.h]);
  }
  var linePath = (pts) => pts.map((p, i) => `${i ? "L" : "M"}${num(p[0])} ${num(p[1])}`).join("");
  function smoothPath(pts) {
    const n = pts.length;
    if (n < 3) return linePath(pts);
    const dx = [], dy = [], m = [], t = [];
    for (let i = 0; i < n - 1; i++) {
      dx[i] = pts[i + 1][0] - pts[i][0];
      dy[i] = pts[i + 1][1] - pts[i][1];
      m[i] = dy[i] / dx[i];
    }
    t[0] = m[0];
    t[n - 1] = m[n - 2];
    for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : 3 * (dx[i - 1] + dx[i]) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]);
    let d = `M${num(pts[0][0])} ${num(pts[0][1])}`;
    for (let i = 0; i < n - 1; i++) {
      const h2 = dx[i] / 3;
      d += `C${num(pts[i][0] + h2)} ${num(pts[i][1] + h2 * t[i])} ${num(pts[i + 1][0] - h2)} ${num(pts[i + 1][1] - h2 * t[i + 1])} ${num(pts[i + 1][0])} ${num(pts[i + 1][1])}`;
    }
    return d;
  }
  var areaPath = (pts, baseY, smooth = true) => (smooth ? smoothPath(pts) : linePath(pts)) + `L${num(pts[pts.length - 1][0])} ${num(baseY)}L${num(pts[0][0])} ${num(baseY)}Z`;
  function arcPath(cx, cy, r0, r1, a0, a1) {
    const p = (r, a) => [cx + r * Math.sin(a), cy - r * Math.cos(a)];
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const [x0, y0] = p(r1, a0), [x1, y1] = p(r1, a1), [x2, y2] = p(r0, a1), [x3, y3] = p(r0, a0);
    return `M${num(x0)} ${num(y0)}A${num(r1)} ${num(r1)} 0 ${large} 1 ${num(x1)} ${num(y1)}L${num(x2)} ${num(y2)}A${num(r0)} ${num(r0)} 0 ${large} 0 ${num(x3)} ${num(y3)}Z`;
  }
  var MAP_VB = { w: COLS * 10, h: ROWS * 10 };
  function mapFit(box2) {
    const s = Math.min(box2.w / MAP_VB.w, box2.h / MAP_VB.h);
    return { s, ox: box2.x + (box2.w - MAP_VB.w * s) / 2, oy: box2.y + (box2.h - MAP_VB.h * s) / 2 };
  }
  function mapDots() {
    const out = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (landAt(c, r)) out.push([c * 10 + 5, r * 10 + 5]);
    return out;
  }
  var geo = (lon, lat) => {
    const [c, r] = project(lon, lat);
    return [c * 10, r * 10];
  };
  function arcBetween(a, b, bow = 0.28) {
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return { d: `M${num(a[0])} ${num(a[1])}Q${num(mx)} ${num(my - len * bow)} ${num(b[0])} ${num(b[1])}`, c: [mx, my - len * bow] };
  }
  function tracks(start, length, spec, gap = 0) {
    const fixed = spec.reduce((s, t) => s + (typeof t === "number" ? t : 0), 0);
    const fr2 = spec.reduce((s, t) => s + (typeof t === "string" ? parseFloat(t) : 0), 0);
    const free = Math.max(0, length - fixed - gap * (spec.length - 1));
    const out = [];
    let x = start;
    for (const t of spec) {
      const w = typeof t === "number" ? t : free * parseFloat(t) / fr2;
      out.push({ x, w });
      x += w + gap;
    }
    return out;
  }
  var box = (x, y, w, h2) => ({ x, y, w, h: h2 });

  // src/design-kit/index.js
  var layerId = (s) => String(s).replace(/[^A-Za-z0-9 ._-]/g, "").trim().replace(/\s+/g, "_").slice(0, 40) || "Text";
  function Text({ x = 0, y = 0, size = 14, weight = 400, color: color2 = "#000", family = "inter", ls = 0, lh, align = "left", width, opacity, id, children }) {
    const s = Array.isArray(children) ? children.join("") : String(children ?? "");
    const t = textPath(s, { x, y, size, weight, family, ls, lh, align, width });
    return `<path id="${escapeText(id || layerId(s))}" d="${t.d}" fill="${color2}"${opacity != null ? ` fill-opacity="${num(opacity)}"` : ""}/>`;
  }
  var tw = (s, size = 14, weight = 400, family = "inter", ls = 0) => measure(s, { size, weight, family, ls });
  function Box({ x, y, w, h: hh2, r = 0, fill, stroke, sw = 1, opacity, filter, id, dash }) {
    const inset2 = stroke ? sw / 2 : 0;
    const a = [`x="${num(x + inset2)}"`, `y="${num(y + inset2)}"`, `width="${num(w - 2 * inset2)}"`, `height="${num(hh2 - 2 * inset2)}"`];
    if (r) a.push(`rx="${num(Math.max(0, r - inset2))}"`);
    a.push(`fill="${fill || "none"}"`);
    if (opacity != null) a.push(`fill-opacity="${num(opacity)}"`);
    if (stroke) {
      a.push(`stroke="${stroke}"`);
      if (sw !== 1) a.push(`stroke-width="${num(sw)}"`);
    }
    if (dash) a.push(`stroke-dasharray="${dash}"`);
    const rect = `<rect ${id ? `id="${escapeText(id)}" ` : ""}${a.join(" ")}/>`;
    return filter ? `<g filter="${filter}">${rect}</g>` : rect;
  }
  var Icon = ({ name, x, y, size = 20, color: color2 = "#000", sw = 1.75 }) => iconSvg(name, x, y, size, color2, sw);
  var Group = ({ id, children, ...rest }) => h("g", { id: id ? layerId(id) : void 0, ...rest }, children);

  // src/presets/soc/data.js
  var BRAND = "Halberd";
  var NAV = [
    { group: "Monitor", items: [["grid", "Overview", true], ["alert", "Alerts", false, "24"], ["flag", "Incidents"], ["globe", "Threat map"]] },
    { group: "Investigate", items: [["search", "Hunting"], ["server", "Assets"], ["users", "Identities"], ["bug", "Vulnerabilities"]] },
    { group: "Respond", items: [["zap", "Playbooks"], ["file", "Reports"]] }
  ];
  var USER = { initials: "RK", name: "Rina Kato", role: "Tier 2 analyst" };
  var R = rng(7);
  var walk = (n, start, vol, drift = 0) => {
    let v = start;
    return Array.from({ length: n }, () => v = Math.max(1, v + (R() - 0.5) * vol + drift));
  };
  var KPIS = [
    { label: "Threats blocked", value: "12,847", delta: "+8.2%", up: true, good: true, icon: "shieldCheck", tint: "#22D3EE", spark: walk(24, 40, 14, 0.8) },
    { label: "Active incidents", value: "23", delta: "+3", up: true, good: false, icon: "flag", tint: "#F87171", spark: walk(24, 18, 6, 0.2) },
    { label: "Mean time to respond", value: "18m", delta: "−12%", up: false, good: true, icon: "clock", tint: "#A78BFA", spark: walk(24, 30, 8, -0.5) },
    { label: "Assets at risk", value: "142", delta: "+5", up: true, good: false, icon: "server", tint: "#FBBF24", spark: walk(24, 22, 7, 0.3) }
  ];
  var SEVERITY = [
    { name: "Critical", n: 18, color: "#F43F5E" },
    { name: "High", n: 64, color: "#FB923C" },
    { name: "Medium", n: 211, color: "#FACC15" },
    { name: "Low", n: 486, color: "#38BDF8" }
  ];
  var base = walk(24, 120, 40, 0);
  var EVENTS = {
    hours: Array.from({ length: 24 }, (_, i) => i),
    series: [
      { name: "Blocked", color: "#22D3EE", v: base.map((v) => v * 1) },
      { name: "Detected", color: "#A78BFA", v: base.map((v, i) => v * 0.45 + 20 * Math.sin(i / 3) + 30) },
      { name: "Escalated", color: "#F43F5E", v: base.map((v, i) => 6 + (i > 13 && i < 18 ? 28 : 4) + R() * 6) }
    ]
  };
  var VECTORS = [
    ["Phishing", 34],
    ["Brute force", 22],
    ["Malware C2", 18],
    ["SQL injection", 11],
    ["Lateral movement", 8]
  ];
  var ATTACKS = [
    { from: [37.6, 55.8], to: [-77, 38.9], sev: "Critical" },
    { from: [116.4, 39.9], to: [-122.4, 37.8], sev: "High" },
    { from: [126.9, 37.5], to: [8.7, 50.1], sev: "High" },
    { from: [-46.6, -23.5], to: [-0.1, 51.5], sev: "Medium" },
    { from: [28.9, 41], to: [2.35, 48.86], sev: "Medium" },
    { from: [77.2, 28.6], to: [139.7, 35.7], sev: "Medium" },
    { from: [3.4, 6.5], to: [-74, 40.7], sev: "High" }
  ];
  var ORIGINS = [["Russia", 2841, "#F43F5E"], ["China", 1972, "#FB923C"], ["Brazil", 1205, "#FACC15"], ["Nigeria", 884, "#FB923C"], ["Turkey", 612, "#FACC15"]];
  var ALERTS = [
    { sev: "Critical", title: "Credential dumping via LSASS access", id: "ALR-20931", src: "185.220.101.47", asset: "dc-prod-02", mitre: "T1003.001", status: "Investigating", time: "2m ago" },
    { sev: "High", title: "Impossible travel sign-in", id: "ALR-20928", src: "102.89.34.12", asset: "okta / m.ortiz", mitre: "T1078", status: "Open", time: "9m ago" },
    { sev: "High", title: "Beaconing to known C2 domain", id: "ALR-20925", src: "10.4.12.77", asset: "wks-fin-114", mitre: "T1071.001", status: "Contained", time: "14m ago" },
    { sev: "Medium", title: "Password spray against VPN", id: "ALR-20919", src: "45.155.205.233", asset: "vpn-edge-01", mitre: "T1110.003", status: "Open", time: "31m ago" },
    { sev: "Low", title: "New admin added to S3 policy", id: "ALR-20911", src: "iam.amazonaws.com", asset: "aws / prod", mitre: "T1098", status: "Resolved", time: "1h ago" }
  ];
  var STATUS_COLOR = { Investigating: "#A78BFA", Open: "#FB923C", Contained: "#22D3EE", Resolved: "#34D399" };
  var SEV_COLOR = Object.fromEntries(SEVERITY.map((s) => [s.name, s.color]));
  var C = {
    page: "#090D16",
    side: "#0E1422",
    top: "#0E1422",
    card: "#111A2B",
    line: "#1E2A3F",
    line2: "#253248",
    ink: "#E6EDF7",
    ink2: "#9AA7BD",
    muted: "#64718A",
    map: "#2A3953",
    accent: "#22D3EE"
  };

  // src/presets/soc/layout.js
  var SIDE = 232;
  var TOP = 64;
  var PAD = 24;
  var GAP = 16;
  var CARD_PAD = 16;
  var HEAD = 20;
  var ROW_SPEC = [112, "1.15fr", "1fr", "1fr"];
  var ALERT_COLS = [104, "2.2fr", "1.2fr", "1fr", 110, 128, 72];
  function cardBody(c) {
    return box(c.x + CARD_PAD, c.y + 14 + HEAD + 12, c.w - 2 * CARD_PAD, c.h - 14 - HEAD - 12 - CARD_PAD);
  }
  function layout(W, H) {
    const side = box(0, 0, SIDE, H);
    const top = box(SIDE, 0, W - SIDE, TOP);
    const content = box(SIDE + PAD, TOP + PAD, W - SIDE - 2 * PAD, H - TOP - 2 * PAD);
    const rows = tracks(content.y, content.h, ROW_SPEC, GAP);
    const kc = tracks(content.x, content.w, ["1fr", "1fr", "1fr", "1fr"], GAP);
    const two = tracks(content.x, content.w, ["2fr", "1fr"], GAP);
    const kpis = kc.map((c) => box(c.x, rows[0].x, c.w, rows[0].w));
    const map = box(two[0].x, rows[1].x, two[0].w, rows[1].w);
    const sev = box(two[1].x, rows[1].x, two[1].w, rows[1].w);
    const events = box(two[0].x, rows[2].x, two[0].w, rows[2].w);
    const vectors = box(two[1].x, rows[2].x, two[1].w, rows[2].w);
    const alerts = box(content.x, rows[3].x, content.w, rows[3].w);
    const titleW = measure("Security overview", { size: 18, weight: 600 });
    const rangeW = 12 + 16 + 8 + measure("Last 24 hours", { size: 13, weight: 500 }) + 8 + 14 + 12;
    const liveW = 10 + 8 + 6 + measure("Live", { size: 12, weight: 600 }) + 10;
    const rightW = rangeW + 12 + liveW + 12 + 36 + 12 + 32;
    const inner = top.w - 2 * PAD;
    const searchW = Math.max(160, Math.min(440, inner - titleW - 32 - 24 - rightW));
    const search = box(top.x + PAD + titleW + 32, 14, searchW, 36);
    let rx = top.x + top.w - PAD - rightW;
    const range = box(rx, 14, rangeW, 36);
    rx += rangeW + 12;
    const live = box(rx, 18, liveW, 28);
    rx += liveW + 12;
    const bell = box(rx, 14, 36, 36);
    rx += 36 + 12;
    const avatar = box(rx, 16, 32, 32);
    const nav = [];
    let y = 72;
    for (const g of NAV) {
      const label = box(20, y, 192, 16);
      y += 16 + 6;
      const items = g.items.map((it) => {
        const b = box(12, y, SIDE - 24, 36);
        y += 36 + 2;
        return { it, b };
      });
      nav.push({ g, label, items });
      y += 14;
    }
    return {
      W,
      H,
      side,
      top,
      content,
      rows,
      kpis,
      map,
      sev,
      events,
      vectors,
      alerts,
      search,
      range,
      live,
      bell,
      avatar,
      titleW,
      nav,
      alertCols: tracks(alerts.x + CARD_PAD, alerts.w - 2 * CARD_PAD, ALERT_COLS, 16),
      kpiData: KPIS
    };
  }

  // src/presets/soc/design.jsx
  var DOTS = mapDots();
  function Card({ D, b, title, right, children }) {
    return /* @__PURE__ */ h(Group, { id: `Card/${title}` }, /* @__PURE__ */ h(Box, { x: b.x, y: b.y, w: b.w, h: b.h, r: 12, fill: C.card, stroke: C.line }), /* @__PURE__ */ h(Text, { x: b.x + CARD_PAD, y: b.y + 14, size: 14, lh: 20, weight: 600, color: C.ink }, title), right, children);
  }
  function Sparkline({ D, b, data, color: color2 }) {
    const lo = Math.min(...data), hi = Math.max(...data);
    const pts = points(data, b, lo - (hi - lo) * 0.1, hi + (hi - lo) * 0.1);
    const fill = D.linear(b.x, b.y, b.x, b.y + b.h, [[0, color2, 0.28], [1, color2, 0]]);
    return /* @__PURE__ */ h(Fragment, null, /* @__PURE__ */ h("path", { d: areaPath(pts, b.y + b.h), fill }), /* @__PURE__ */ h("path", { d: smoothPath(pts), stroke: color2, strokeWidth: "1.75", strokeLinecap: "round", strokeLinejoin: "round" }));
  }
  function Sidebar({ L, D }) {
    const out = [];
    const logo = D.linear(20, 18, 48, 46, [[0, "#22D3EE"], [1, "#6366F1"]]);
    out.push(/* @__PURE__ */ h(Box, { x: 0, y: 0, w: SIDE, h: L.H, fill: C.side }), /* @__PURE__ */ h("rect", { x: SIDE - 1, width: "1", height: L.H, fill: C.line }));
    out.push(/* @__PURE__ */ h("rect", { x: "20", y: "18", width: "28", height: "28", rx: "8", fill: logo }), /* @__PURE__ */ h(Icon, { name: "shield", x: 26, y: 24, size: 16, color: "#FFFFFF", sw: 2 }));
    out.push(/* @__PURE__ */ h(Text, { x: 58, y: 18, size: 17, lh: 28, weight: 700, color: C.ink }, BRAND));
    const bw = tw(BRAND, 17, 700);
    out.push(/* @__PURE__ */ h(Box, { x: 58 + bw + 8, y: 24, w: 34, h: 16, r: 4, fill: "#1A2740" }), /* @__PURE__ */ h(Text, { x: 58 + bw + 8, y: 24, width: 34, align: "center", size: 10, lh: 16, weight: 600, color: C.ink2, ls: 0.4 }, "SOC"));
    for (const n of L.nav) {
      out.push(/* @__PURE__ */ h(Text, { x: n.label.x, y: n.label.y, size: 11, lh: 16, weight: 600, color: C.muted, ls: 0.6 }, n.g.group.toUpperCase()));
      for (const { it, b } of n.items) {
        const [icon, label, active, badge] = it;
        if (active) out.push(/* @__PURE__ */ h(Box, { x: b.x, y: b.y, w: b.w, h: b.h, r: 8, fill: "#18233A" }), /* @__PURE__ */ h("rect", { x: b.x, y: b.y + 9, width: "3", height: "18", rx: "1.5", fill: C.accent }));
        out.push(/* @__PURE__ */ h(Icon, { name: icon, x: b.x + 12, y: b.y + 9, size: 18, color: active ? C.accent : C.ink2 }));
        out.push(/* @__PURE__ */ h(Text, { x: b.x + 40, y: b.y + 8, size: 13.5, lh: 20, weight: active ? 600 : 500, color: active ? C.ink : C.ink2 }, label));
        if (badge) {
          const w = Math.max(24, tw(badge, 11, 600) + 14);
          out.push(/* @__PURE__ */ h(Box, { x: b.x + b.w - 10 - w, y: b.y + 9, w, h: 18, r: 9, fill: "#3B1D2A" }), /* @__PURE__ */ h(Text, { x: b.x + b.w - 10 - w, y: b.y + 9, width: w, align: "center", size: 11, lh: 18, weight: 600, color: "#FDA4AF" }, badge));
        }
      }
    }
    const uy = L.H - 72;
    out.push(/* @__PURE__ */ h("rect", { x: "16", y: uy, width: SIDE - 32, height: "1", fill: C.line }));
    out.push(/* @__PURE__ */ h("circle", { cx: "36", cy: uy + 36, r: "16", fill: "#3B2F63" }), /* @__PURE__ */ h(Text, { x: 20, y: uy + 26, width: 32, align: "center", size: 12, lh: 20, weight: 700, color: "#DDD6FE" }, USER.initials));
    out.push(/* @__PURE__ */ h(Text, { x: 62, y: uy + 18, size: 13, lh: 18, weight: 600, color: C.ink }, USER.name), /* @__PURE__ */ h(Text, { x: 62, y: uy + 37, size: 12, lh: 16, weight: 400, color: C.muted }, USER.role));
    out.push(/* @__PURE__ */ h(Icon, { name: "logout", x: SIDE - 40, y: uy + 27, size: 18, color: C.muted }));
    return /* @__PURE__ */ h(Group, { id: "Sidebar" }, out);
  }
  function TopBar({ L, D }) {
    const t = L.top;
    return /* @__PURE__ */ h(Group, { id: "Top bar" }, /* @__PURE__ */ h(Box, { x: t.x, y: 0, w: t.w, h: TOP, fill: C.top }), /* @__PURE__ */ h("rect", { x: t.x, y: TOP - 1, width: t.w, height: "1", fill: C.line }), /* @__PURE__ */ h(Text, { x: t.x + PAD, y: 19, size: 18, lh: 26, weight: 600, color: C.ink }, "Security overview"), /* @__PURE__ */ h(Box, { x: L.search.x, y: L.search.y, w: L.search.w, h: 36, r: 8, fill: "#0A101C", stroke: C.line2 }), /* @__PURE__ */ h(Icon, { name: "search", x: L.search.x + 12, y: L.search.y + 10, size: 16, color: C.muted }), /* @__PURE__ */ h(Text, { x: L.search.x + 38, y: L.search.y + 8, size: 13, lh: 20, color: C.muted }, "Search IPs, hosts, users, hashes"), /* @__PURE__ */ h(Box, { x: L.search.x + L.search.w - 30, y: L.search.y + 8, w: 20, h: 20, r: 5, fill: "none", stroke: C.line2 }), /* @__PURE__ */ h(Text, { x: L.search.x + L.search.w - 30, y: L.search.y + 8, width: 20, align: "center", size: 11, lh: 20, weight: 600, family: "mono", color: C.muted }, "/"), /* @__PURE__ */ h(Box, { x: L.range.x, y: L.range.y, w: L.range.w, h: 36, r: 8, fill: "#131D30", stroke: C.line2 }), /* @__PURE__ */ h(Icon, { name: "calendar", x: L.range.x + 12, y: L.range.y + 10, size: 16, color: C.ink2 }), /* @__PURE__ */ h(Text, { x: L.range.x + 36, y: L.range.y + 8, size: 13, lh: 20, weight: 500, color: C.ink }, "Last 24 hours"), /* @__PURE__ */ h(Icon, { name: "chevronDown", x: L.range.x + L.range.w - 26, y: L.range.y + 11, size: 14, color: C.ink2 }), /* @__PURE__ */ h(Box, { x: L.live.x, y: L.live.y, w: L.live.w, h: 28, r: 14, fill: "#0E2A26" }), /* @__PURE__ */ h("circle", { cx: L.live.x + 14, cy: L.live.y + 14, r: "4", fill: "#34D399" }), /* @__PURE__ */ h(Text, { x: L.live.x + 24, y: L.live.y + 4, size: 12, lh: 20, weight: 600, color: "#6EE7B7" }, "Live"), /* @__PURE__ */ h(Box, { x: L.bell.x, y: L.bell.y, w: 36, h: 36, r: 8, fill: "#131D30", stroke: C.line2 }), /* @__PURE__ */ h(Icon, { name: "bell", x: L.bell.x + 9, y: L.bell.y + 9, size: 18, color: C.ink2 }), /* @__PURE__ */ h("circle", { cx: L.bell.x + 25, cy: L.bell.y + 10, r: "4", fill: "#F43F5E", stroke: "#131D30", strokeWidth: "2" }), /* @__PURE__ */ h("circle", { cx: L.avatar.x + 16, cy: L.avatar.y + 16, r: "16", fill: "#3B2F63" }), /* @__PURE__ */ h(Text, { x: L.avatar.x, y: L.avatar.y + 6, width: 32, align: "center", size: 12, lh: 20, weight: 700, color: "#DDD6FE" }, USER.initials));
  }
  function Kpi({ D, b, k }) {
    const vw = tw(k.value, 26, 600);
    const dw = tw(k.delta, 12, 600) + 14;
    const good = k.good;
    return /* @__PURE__ */ h(Group, { id: `KPI/${k.label}` }, /* @__PURE__ */ h(Box, { x: b.x, y: b.y, w: b.w, h: b.h, r: 12, fill: C.card, stroke: C.line }), /* @__PURE__ */ h(Text, { x: b.x + 16, y: b.y + 16, size: 13, lh: 18, weight: 500, color: C.ink2 }, k.label), /* @__PURE__ */ h(Box, { x: b.x + b.w - 44, y: b.y + 12, w: 28, h: 28, r: 7, fill: k.tint, opacity: 0.14 }), /* @__PURE__ */ h(Icon, { name: k.icon, x: b.x + b.w - 38, y: b.y + 18, size: 16, color: k.tint }), /* @__PURE__ */ h(Text, { x: b.x + 16, y: b.y + 42, size: 26, lh: 32, weight: 600, color: C.ink, ls: -0.3 }, k.value), /* @__PURE__ */ h(Box, { x: b.x + 16 + vw + 10, y: b.y + 48, w: dw, h: 20, r: 10, fill: good ? "#34D399" : "#F87171", opacity: 0.14 }), /* @__PURE__ */ h(Text, { x: b.x + 16 + vw + 10, y: b.y + 48, width: dw, align: "center", size: 12, lh: 20, weight: 600, color: good ? "#6EE7B7" : "#FCA5A5" }, k.delta), /* @__PURE__ */ h(Sparkline, { D, b: box(b.x + 16, b.y + 82, b.w - 32, 18), data: k.spark, color: k.tint }));
  }
  function ThreatMap({ D, b }) {
    const body = cardBody(b);
    const listW = 200;
    const area = box(body.x, body.y, body.w - listW - 16, body.h);
    const f = mapFit(area);
    const P = ([x, y]) => [f.ox + x * f.s, f.oy + y * f.s];
    const dots = DOTS.map((p) => {
      const [x, y] = P(p);
      return `<circle cx="${num(x)}" cy="${num(y)}" r="${num(3.4 * f.s)}" fill="${C.map}"/>`;
    }).join("");
    const arcs = [], marks = [];
    for (const a of ATTACKS) {
      const s = geo(...a.from), t = geo(...a.to);
      const arc = arcBetween(s, t);
      const col = SEV_COLOR[a.sev];
      arcs.push(/* @__PURE__ */ h("path", { d: transformPath(arc.d, f), stroke: col, strokeWidth: "1.5", strokeOpacity: "0.9", strokeLinecap: "round" }));
      const [sx, sy] = P(s), [tx, ty] = P(t);
      marks.push(/* @__PURE__ */ h("circle", { cx: sx, cy: sy, r: 8 * f.s, fill: col }));
      marks.push(/* @__PURE__ */ h("circle", { cx: tx, cy: ty, r: 26 * f.s, stroke: col, strokeOpacity: "0.55" }), /* @__PURE__ */ h("circle", { cx: tx, cy: ty, r: 10 * f.s, fill: col }));
    }
    const legend = [["Critical", "#F43F5E"], ["High", "#FB923C"], ["Medium", "#FACC15"]];
    let lx = b.x + b.w - CARD_PAD;
    const leg = [];
    for (let i = legend.length - 1; i >= 0; i--) {
      const [n, c] = legend[i];
      const w = tw(n, 12, 500);
      lx -= w;
      leg.push(/* @__PURE__ */ h(Text, { x: lx, y: b.y + 14, size: 12, lh: 20, weight: 500, color: C.ink2 }, n));
      lx -= 6 + 8;
      leg.push(/* @__PURE__ */ h("circle", { cx: lx + 4, cy: b.y + 24, r: "4", fill: c }));
      lx -= 14;
    }
    const max = ORIGINS[0][1];
    const lst = box(body.x + body.w - listW, body.y, listW, body.h);
    return /* @__PURE__ */ h(Card, { D, b, title: "Live threat map", right: leg }, /* @__PURE__ */ h(Group, { id: "Map" }, dots, arcs, marks), /* @__PURE__ */ h(Group, { id: "Top origins" }, /* @__PURE__ */ h(Text, { x: lst.x, y: lst.y, size: 11, lh: 16, weight: 600, color: C.muted, ls: 0.6 }, "TOP ORIGINS"), ORIGINS.map(([name, n, col], i) => {
      const y = lst.y + 22 + i * 33;
      return /* @__PURE__ */ h(Fragment, null, /* @__PURE__ */ h(Text, { x: lst.x, y, size: 13, lh: 18, weight: 500, color: C.ink2 }, name), /* @__PURE__ */ h(Text, { x: lst.x + listW, y, align: "right", size: 12, lh: 18, weight: 500, family: "mono", color: C.ink }, n.toLocaleString("en-US")), /* @__PURE__ */ h(Box, { x: lst.x, y: y + 23, w: listW, h: 4, r: 2, fill: C.line2 }), /* @__PURE__ */ h(Box, { x: lst.x, y: y + 23, w: listW * n / max, h: 4, r: 2, fill: col }));
    })));
  }
  function transformPath(d, f) {
    let i = 0;
    return d.replace(/-?\d+(?:\.\d+)?/g, (m) => {
      const v = +m;
      const out = i % 2 === 0 ? f.ox + v * f.s : f.oy + v * f.s;
      i++;
      return String(num(out));
    });
  }
  function Severity({ D, b }) {
    const body = cardBody(b);
    const total = SEVERITY.reduce((s, x) => s + x.n, 0);
    const d = 150, cx = body.x + d / 2, cy = body.y + body.h / 2;
    const segs = [];
    let a = 0;
    const gap = 0.035;
    for (const s of SEVERITY) {
      const span = s.n / total * Math.PI * 2;
      segs.push(/* @__PURE__ */ h("path", { d: arcPath(cx, cy, d / 2 - 16, d / 2, a + gap / 2, a + span - gap / 2), fill: s.color }));
      a += span;
    }
    const lx = body.x + d + 28, lw = body.x + body.w - lx;
    const rowH = 30, ly = cy - SEVERITY.length * rowH / 2;
    return /* @__PURE__ */ h(Card, { D, b, title: "Alerts by severity", right: /* @__PURE__ */ h(Text, { x: b.x + b.w - CARD_PAD, y: b.y + 14, align: "right", size: 12, lh: 20, weight: 500, color: C.muted }, "Last 24 hours") }, segs, /* @__PURE__ */ h(Text, { x: cx, y: cy - 20, align: "center", size: 22, lh: 28, weight: 600, color: C.ink }, String(total)), /* @__PURE__ */ h(Text, { x: cx, y: cy + 6, align: "center", size: 11, lh: 14, weight: 500, color: C.muted }, "alerts"), SEVERITY.map((s, i) => {
      const y = ly + i * rowH;
      return /* @__PURE__ */ h(Fragment, null, /* @__PURE__ */ h(Box, { x: lx, y: y + 6, w: 10, h: 10, r: 3, fill: s.color }), /* @__PURE__ */ h(Text, { x: lx + 20, y, size: 13, lh: 22, weight: 500, color: C.ink2 }, s.name), /* @__PURE__ */ h(Text, { x: lx + lw, y, align: "right", size: 13, lh: 22, weight: 600, family: "mono", color: C.ink }, String(s.n)));
    }));
  }
  function Events({ D, b }) {
    const body = cardBody(b);
    const plot = box(body.x + 44, body.y + 6, body.w - 44, body.h - 6 - 22);
    const n = EVENTS.hours.length;
    const stacks = [];
    let acc = new Array(n).fill(0);
    for (const s of EVENTS.series) {
      const top = s.v.map((v, i) => acc[i] + v);
      stacks.push({ s, lo: acc, hi: top });
      acc = top;
    }
    const hi = 600;
    const grid = [0, 1, 2, 3].map((i) => plot.y + i / 3 * plot.h);
    const lab2 = ["600", "400", "200", "0"];
    const out = [];
    grid.forEach((y, i) => {
      out.push(/* @__PURE__ */ h("rect", { x: plot.x, y, width: plot.w, height: "1", fill: C.line }));
      out.push(/* @__PURE__ */ h(Text, { x: body.x + 34, y: y - 8, align: "right", size: 11, lh: 16, family: "mono", color: C.muted }, lab2[i]));
    });
    for (let k = stacks.length - 1; k >= 0; k--) {
      const { s, lo, hi: top } = stacks[k];
      const pt = points(top, plot, 0, hi), pb = points(lo, plot, 0, hi);
      const area = smoothPath(pt) + "L" + pb.slice().reverse().map((p) => `${num(p[0])} ${num(p[1])}`).join("L") + "Z";
      out.push(/* @__PURE__ */ h("path", { d: area, fill: s.color, fillOpacity: "0.16" }));
      out.push(/* @__PURE__ */ h("path", { d: smoothPath(pt), stroke: s.color, strokeWidth: "1.5", strokeLinejoin: "round" }));
    }
    for (let hh2 = 0; hh2 < 24; hh2 += 4) {
      const x = plot.x + hh2 / (n - 1) * plot.w;
      out.push(/* @__PURE__ */ h(Text, { x, y: plot.y + plot.h + 6, align: "center", size: 11, lh: 16, family: "mono", color: C.muted }, `${String(hh2).padStart(2, "0")}:00`));
    }
    let lx = b.x + b.w - CARD_PAD;
    const leg = [];
    for (let i = EVENTS.series.length - 1; i >= 0; i--) {
      const s = EVENTS.series[i];
      lx -= tw(s.name, 12, 500);
      leg.push(/* @__PURE__ */ h(Text, { x: lx, y: b.y + 14, size: 12, lh: 20, weight: 500, color: C.ink2 }, s.name));
      lx -= 6 + 12;
      leg.push(/* @__PURE__ */ h("rect", { x: lx, y: b.y + 23, width: "12", height: "2", rx: "1", fill: s.color }));
      lx -= 16;
    }
    return /* @__PURE__ */ h(Card, { D, b, title: "Events over time", right: leg }, out);
  }
  function Vectors({ D, b }) {
    const body = cardBody(b);
    return /* @__PURE__ */ h(Card, { D, b, title: "Top attack vectors", right: /* @__PURE__ */ h(Text, { x: b.x + b.w - CARD_PAD, y: b.y + 14, align: "right", size: 12, lh: 20, weight: 500, color: C.muted }, "Share of alerts") }, VECTORS.map(([name, pct], i) => {
      const y = body.y + i * 32;
      return /* @__PURE__ */ h(Fragment, null, /* @__PURE__ */ h(Text, { x: body.x, y, size: 13, lh: 16, weight: 500, color: C.ink2 }, name), /* @__PURE__ */ h(Text, { x: body.x + body.w, y, align: "right", size: 12, lh: 16, weight: 500, family: "mono", color: C.ink }, `${pct}%`), /* @__PURE__ */ h(Box, { x: body.x, y: y + 20, w: body.w, h: 5, r: 2.5, fill: C.line2 }), /* @__PURE__ */ h(Box, { x: body.x, y: y + 20, w: body.w * pct / 40, h: 5, r: 2.5, fill: i === 0 ? "#22D3EE" : "#3E7C95" }));
    }));
  }
  function Alerts({ D, b, L }) {
    const body = cardBody(b);
    const cols = L.alertCols;
    const heads = ["SEVERITY", "ALERT", "SOURCE", "ASSET", "TECHNIQUE", "STATUS", "TIME"];
    const clip = D.clip(body);
    const rows = [];
    heads.forEach((t, i) => rows.push(/* @__PURE__ */ h(Text, { x: i === 6 ? cols[i].x + cols[i].w : cols[i].x, y: body.y + 4, align: i === 6 ? "right" : "left", size: 11, lh: 16, weight: 600, color: C.muted, ls: 0.5 }, t)));
    ALERTS.forEach((a, r) => {
      const y = body.y + 28 + r * 31;
      rows.push(/* @__PURE__ */ h("rect", { x: body.x, y, width: body.w, height: "1", fill: C.line }));
      const sc = SEV_COLOR[a.sev];
      const pw = tw(a.sev, 11.5, 600) + 28;
      rows.push(
        /* @__PURE__ */ h(Box, { x: cols[0].x, y: y + 6, w: pw, h: 20, r: 10, fill: sc, opacity: 0.15 }),
        /* @__PURE__ */ h("circle", { cx: cols[0].x + 11, cy: y + 16, r: "3", fill: sc }),
        /* @__PURE__ */ h(Text, { x: cols[0].x + 19, y: y + 6, size: 11.5, lh: 20, weight: 600, color: sc }, a.sev)
      );
      rows.push(/* @__PURE__ */ h(Text, { x: cols[1].x, y: y + 6, size: 13, lh: 20, weight: 500, color: C.ink }, a.title));
      rows.push(/* @__PURE__ */ h(Text, { x: cols[2].x, y: y + 6, size: 12, lh: 20, family: "mono", color: C.ink2 }, a.src));
      rows.push(/* @__PURE__ */ h(Text, { x: cols[3].x, y: y + 6, size: 12.5, lh: 20, color: C.ink2 }, a.asset));
      const mw = tw(a.mitre, 11, 500, "mono") + 12;
      rows.push(/* @__PURE__ */ h(Box, { x: cols[4].x, y: y + 7, w: mw, h: 18, r: 4, fill: "#1A2740" }), /* @__PURE__ */ h(Text, { x: cols[4].x, y: y + 7, width: mw, align: "center", size: 11, lh: 18, weight: 500, family: "mono", color: C.ink2 }, a.mitre));
      rows.push(/* @__PURE__ */ h("circle", { cx: cols[5].x + 3.5, cy: y + 16, r: "3.5", fill: STATUS_COLOR[a.status] }), /* @__PURE__ */ h(Text, { x: cols[5].x + 14, y: y + 6, size: 12.5, lh: 20, color: C.ink2 }, a.status));
      rows.push(/* @__PURE__ */ h(Text, { x: cols[6].x + cols[6].w, y: y + 6, align: "right", size: 12, lh: 20, color: C.muted }, a.time));
    });
    const vw = tw("View all", 13, 500);
    return /* @__PURE__ */ h(Card, { D, b, title: "Recent alerts", right: /* @__PURE__ */ h(Fragment, null, /* @__PURE__ */ h(Text, { x: b.x + b.w - CARD_PAD - 18 - vw, y: b.y + 14, size: 13, lh: 20, weight: 500, color: C.accent }, "View all"), /* @__PURE__ */ h(Icon, { name: "chevronRight", x: b.x + b.w - CARD_PAD - 16, y: b.y + 16, size: 16, color: C.accent })) }, /* @__PURE__ */ h("g", { "clip-path": clip }, rows));
  }
  function socDesign({ W = 1440, H = 960 } = {}) {
    const L = layout(W, H);
    const D = doc("SOC overview", W, H);
    const content = /* @__PURE__ */ h(Fragment, null, /* @__PURE__ */ h(Sidebar, { L, D }), /* @__PURE__ */ h(TopBar, { L, D }), /* @__PURE__ */ h(Group, { id: "KPIs" }, KPIS.map((k, i) => /* @__PURE__ */ h(Kpi, { D, b: L.kpis[i], k }))), /* @__PURE__ */ h(ThreatMap, { D, b: L.map }), /* @__PURE__ */ h(Severity, { D, b: L.sev }), /* @__PURE__ */ h(Events, { D, b: L.events }), /* @__PURE__ */ h(Vectors, { D, b: L.vectors }), /* @__PURE__ */ h(Alerts, { D, b: L.alerts, L }));
    return D.svg(content, C.page);
  }

  // src/design-kit/html.js
  var VOID = /* @__PURE__ */ new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
  var Markup = class {
    constructor(s) {
      this.s = s;
    }
    toString() {
      return this.s;
    }
  };
  var raw = (s) => new Markup(String(s));
  var esc2 = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  var escA = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  var flat2 = (arr, out = []) => {
    for (const x of arr) {
      if (Array.isArray(x)) flat2(x, out);
      else if (x != null && x !== false && x !== true) out.push(x);
    }
    return out;
  };
  var KEBAB_SVG = /* @__PURE__ */ new Set(["strokeWidth", "strokeLinecap", "strokeLinejoin", "strokeDasharray", "strokeOpacity", "fillOpacity", "fillRule", "stopColor", "stopOpacity", "vectorEffect", "textAnchor", "fontSize", "fontWeight"]);
  var attrName2 = (k) => k === "className" ? "class" : k === "htmlFor" ? "for" : KEBAB_SVG.has(k) ? k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase()) : k;
  var styleStr = (o) => Object.entries(o).filter(([, v]) => v != null && v !== false).map(([k, v]) => `${k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())}:${v}`).join(";");
  function hh(tag, props, ...children) {
    const kids = flat2(children);
    if (typeof tag === "function") return tag({ ...props || {}, children: kids });
    let attrs = "";
    if (props) for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false || k === "children" || k === "key") continue;
      const val = k === "style" && typeof v === "object" ? styleStr(v) : v;
      attrs += v === true ? ` ${attrName2(k)}` : ` ${attrName2(k)}="${escA(val)}"`;
    }
    const inner = kids.map((c) => c instanceof Markup ? c.s : esc2(c)).join("");
    return new Markup(VOID.has(tag) ? `<${tag}${attrs}>` : `<${tag}${attrs}>${inner}</${tag}>`);
  }
  var Frag = ({ children }) => new Markup(flat2(children || []).map((c) => c instanceof Markup ? c.s : esc2(c)).join(""));
  var page = (head, body, lang = "en") => `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
${head}
</head>
${body}
</html>
`;

  // src/presets/soc/build.jsx
  var UI = `Verdana, 'DejaVu Sans', 'Bitstream Vera Sans', Geneva, sans-serif`;
  var MONO = `Consolas, Menlo, 'DejaVu Sans Mono', 'Liberation Mono', monospace`;
  var I = (name, size, color2, sw) => raw(iconHtml(name, size, color2, sw));
  var hexA = (hex2, a) => hex2 + Math.round(a * 255).toString(16).padStart(2, "0");
  var css = (o) => `
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%}
body{background:${C.page};color:${C.ink};font-family:${UI};overflow:hidden}
.mono{font-family:${MONO}}
.app{display:grid;grid-template-columns:232px 1fr;height:100vh}
.side{position:relative;background:${C.side};border-right:1px solid ${C.line};padding:18px 12px 0}
.brand{display:flex;align-items:center;height:28px;padding-left:8px}
.logo{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#22D3EE,#6366F1);display:flex;align-items:center;justify-content:center}
.word{margin-left:10px;font-size:17px;line-height:28px;font-weight:700}
.tag{margin-left:8px;width:34px;height:16px;border-radius:4px;background:#1A2740;color:${C.ink2};font-size:10px;line-height:16px;font-weight:600;letter-spacing:.4px;text-align:center}
.nav{margin-top:26px}
.group+.group{margin-top:16px}
.glabel{padding-left:8px;font-size:11px;line-height:16px;font-weight:600;letter-spacing:.6px;color:${C.muted};text-transform:uppercase;margin-bottom:6px}
.items{display:flex;flex-direction:column;gap:2px}
.item{position:relative;height:36px;border-radius:8px;display:flex;align-items:center;padding-left:${o.jitter ? 13 : 12}px;gap:10px;font-size:13.5px;line-height:20px;font-weight:500;color:${C.ink2}}
.item.on{background:#18233A;color:${C.ink};font-weight:600}
.item.on::before{content:"";position:absolute;left:0;top:9px;width:3px;height:18px;border-radius:2px;background:${C.accent}}
.badge{margin-left:auto;margin-right:10px;min-width:24px;height:18px;padding:0 7px;border-radius:9px;background:#3B1D2A;color:#FDA4AF;font-size:11px;line-height:18px;font-weight:600;text-align:center}
.user{position:absolute;left:16px;right:16px;bottom:0;height:72px;border-top:1px solid ${C.line};display:flex;align-items:center;padding-left:4px}
.av{width:32px;height:32px;border-radius:50%;background:#3B2F63;color:#DDD6FE;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex:none}
.who{margin-left:10px}
.who b{display:block;font-size:13px;line-height:18px;font-weight:600}
.who span{display:block;margin-top:1px;font-size:12px;line-height:16px;color:${C.muted}}
.out{margin-left:auto;margin-right:6px;display:flex}
.main{display:flex;flex-direction:column;min-width:0;min-height:0}
.top{flex:none;height:64px;background:${C.top};border-bottom:1px solid ${C.line};display:flex;align-items:center;padding:0 24px}
.top h1{font-size:18px;line-height:26px;font-weight:600;white-space:nowrap}
.search{margin-left:32px;flex:0 1 440px;min-width:160px;height:36px;border-radius:${o.pillSearch ? 18 : 8}px;background:#0A101C;border:1px solid ${C.line2};display:flex;align-items:center;padding-left:11px;gap:10px;color:${C.muted};font-size:13px;line-height:20px;white-space:nowrap;overflow:hidden}
.kbd{margin-left:auto;margin-right:9px;width:20px;height:20px;flex:none;border:1px solid ${C.line2};border-radius:5px;font-size:11px;line-height:18px;text-align:center;font-weight:600}
.tr{margin-left:auto;padding-left:24px;display:flex;align-items:center;gap:12px}
.range{height:36px;border-radius:8px;background:#131D30;border:1px solid ${C.line2};display:flex;align-items:center;padding:0 11px;gap:8px;font-size:13px;line-height:20px;font-weight:500;white-space:nowrap}
.live{height:28px;border-radius:14px;background:#0E2A26;display:flex;align-items:center;padding:0 10px;gap:6px;color:#6EE7B7;font-size:12px;line-height:20px;font-weight:600}
.live i{width:8px;height:8px;border-radius:50%;background:#34D399}
.bell{position:relative;width:36px;height:36px;border-radius:8px;background:#131D30;border:1px solid ${C.line2};display:flex;align-items:center;justify-content:center}
.bell::after{content:"";position:absolute;left:19px;top:3px;width:8px;height:8px;border-radius:50%;background:#F43F5E;border:2px solid #131D30}
.content{flex:1;min-height:0;padding:24px;display:grid;gap:16px;grid-template-rows:${o.fixedGrid ? "112px 251.2px 218.4px 218.4px" : "112px 1.15fr 1fr 1fr"}}
.kpis{display:grid;gap:16px;grid-template-columns:${o.fixedGrid ? "repeat(4,278px)" : "repeat(4,1fr)"}}
.row{display:grid;gap:16px;min-height:0;grid-template-columns:${o.fixedGrid ? "762.67px 381.33px" : "2fr 1fr"}}
.card{position:relative;min-height:0;min-width:0;background:${C.card};border:1px solid ${C.line};border-radius:12px;padding:13px 15px 15px;display:flex;flex-direction:column;overflow:hidden}
.ch{flex:none;height:20px;margin-bottom:${o.jitter ? 13 : 12}px;display:flex;align-items:center}
.ch h3{font-size:14px;line-height:20px;font-weight:600;white-space:nowrap}
.cr{margin-left:auto;display:flex;align-items:center;gap:16px;font-size:12px;line-height:20px;font-weight:500;color:${C.ink2};white-space:nowrap}
.muted{color:${C.muted}}
.li{display:flex;align-items:center;gap:6px}
.dot{width:8px;height:8px;border-radius:50%}
.key{width:12px;height:2px;border-radius:1px}
.body{position:relative;flex:1;min-height:0}
.kpi{position:relative;background:${C.card};border:1px solid ${C.line};border-radius:12px;padding:${o.tilePad ? "15px 15px 15px 27px" : "15px"}}
.kl{font-size:13px;line-height:18px;font-weight:500;color:${C.ink2}}
.chip{position:absolute;top:11px;right:15px;width:28px;height:28px;border-radius:7px;display:flex;align-items:center;justify-content:center}
.kv{margin-top:${o.jitter ? 9 : 8}px;display:flex;align-items:center}
.kv b{font-size:26px;line-height:32px;font-weight:600;letter-spacing:-.3px}
.delta{margin-left:10px;height:20px;padding:0 7px;border-radius:10px;font-size:12px;line-height:20px;font-weight:600}
.spark{position:absolute;left:15px;right:15px;top:${o.jitter ? 82 : 81}px;height:18px}
.spark svg,.plot svg,.map svg{display:block;width:100%;height:100%}
.mapbody{display:flex;gap:16px}
.map{position:relative;flex:1;min-width:0}
.map svg{position:absolute;inset:0}
.origins{flex:none;width:${o.wideOrigins ? 240 : 200}px}
.ot{font-size:11px;line-height:16px;font-weight:600;letter-spacing:.6px;color:${C.muted}}
.orow{margin-top:6px;height:27px}
.orow+.orow{margin-top:6px}
.ol{display:flex;justify-content:space-between;font-size:13px;line-height:18px;font-weight:500;color:${C.ink2}}
.ol .mono{font-size:12px;color:${C.ink}}
.track{margin-top:5px;height:4px;border-radius:2px;background:${C.line2};overflow:hidden}
.track i{display:block;height:100%;border-radius:2px}
.sevbody{display:flex;align-items:center}
.donut{position:relative;flex:none;width:${o.smallDonut ? 120 : 150}px;height:${o.smallDonut ? 120 : 150}px}
.donut svg{display:block;width:100%;height:100%}
.dc{position:absolute;left:0;right:0;top:50%;margin-top:-20px;text-align:center}
.dc b{display:block;font-size:22px;line-height:28px;font-weight:600}
.dc span{display:block;margin-top:-2px;font-size:11px;line-height:14px;font-weight:500;color:${C.muted}}
.legend{margin-left:28px;flex:1;min-width:0}
.lrow{height:30px;display:flex;align-items:flex-start}
.sq{margin-top:6px;width:10px;height:10px;border-radius:3px;flex:none}
.lname{margin-left:${o.jitter ? 11 : 10}px;font-size:13px;line-height:22px;font-weight:500;color:${C.ink2}}
.lval{margin-left:auto;font-size:13px;line-height:22px;font-weight:600}
.ylab{position:absolute;left:0;width:34px;text-align:right;font-size:11px;line-height:16px;color:${C.muted}}
.grid{position:absolute;left:44px;right:0;height:1px;background:${C.line}}
.plot{position:absolute;left:44px;right:0;top:6px;bottom:22px}
.xlab{position:absolute;bottom:0;transform:translateX(-50%);font-size:11px;line-height:16px;color:${C.muted}}
.vrows{display:flex;flex-direction:column;gap:7px}
.vl{display:flex;justify-content:space-between;font-size:13px;line-height:16px;font-weight:500;color:${C.ink2}}
.vl .mono{font-size:12px;color:${C.ink}}
.vt{margin-top:4px;height:5px;border-radius:3px;background:${C.line2};overflow:hidden}
.vt i{display:block;height:100%;border-radius:3px}
.view{display:flex;align-items:center;gap:2px;color:${C.accent};font-size:13px;line-height:20px;font-weight:500}
.table{overflow:hidden}
.tr2{display:grid;grid-template-columns:${o.swapCols ? "104px 2.2fr 1.2fr 1fr 128px 110px 72px" : "104px 2.2fr 1.2fr 1fr 110px 128px 72px"};column-gap:16px;align-items:center}
.thead{height:28px;align-items:start;padding-top:4px;font-size:11px;line-height:16px;font-weight:600;letter-spacing:.5px;color:${C.muted}}
.trow{height:31px;border-top:1px solid ${C.line};padding-top:${o.jitter ? 6 : 5}px;align-items:start;font-size:13px;line-height:20px}
.cell{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.right{text-align:right}
.pill{display:inline-flex;align-items:center;height:20px;padding:0 9px 0 8px;border-radius:10px;font-size:11.5px;line-height:20px;font-weight:600}
.pill i{width:6px;height:6px;border-radius:50%;margin-right:5px}
.tech{display:inline-block;margin-top:1px;height:18px;padding:0 6px;border-radius:4px;background:#1A2740;font-size:11px;line-height:18px;font-weight:500;color:${C.ink2}}
.st{display:flex;align-items:center;gap:7px;color:${C.ink2};font-size:12.5px}
.st i{width:7px;height:7px;border-radius:50%;flex:none}
`;
  function sparkSvg(k, i) {
    const VB = { x: 0, y: 0, w: 240, h: 18 };
    const lo = Math.min(...k.spark), hi = Math.max(...k.spark);
    const pts = points(k.spark, VB, lo - (hi - lo) * 0.1, hi + (hi - lo) * 0.1);
    const line = smoothPath(pts);
    const area = line + `L240 18L0 18Z`;
    return raw(`<svg viewBox="0 0 240 18" preserveAspectRatio="none"><defs><linearGradient id="sg${i}" x1="0" y1="0" x2="0" y2="18" gradientUnits="userSpaceOnUse"><stop stop-color="${k.tint}" stop-opacity="0.28"/><stop offset="1" stop-color="${k.tint}" stop-opacity="0"/></linearGradient></defs><path d="${area}" fill="url(#sg${i})"/><path d="${line}" fill="none" stroke="${k.tint}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`);
  }
  function mapSvg() {
    let s = `<svg viewBox="0 0 ${MAP_VB.w} ${MAP_VB.h}" preserveAspectRatio="xMidYMid meet">`;
    for (const [x, y] of mapDots()) s += `<circle cx="${x}" cy="${y}" r="3.4" fill="${C.map}"/>`;
    for (const a of ATTACKS) {
      const col = SEV_COLOR[a.sev], from = geo(...a.from), to = geo(...a.to);
      s += `<path d="${arcBetween(from, to).d}" fill="none" stroke="${col}" stroke-opacity="0.9" stroke-width="1.5" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`;
      s += `<circle cx="${num(from[0])}" cy="${num(from[1])}" r="8" fill="${col}"/>`;
      s += `<circle cx="${num(to[0])}" cy="${num(to[1])}" r="26" fill="none" stroke="${col}" stroke-opacity="0.55" stroke-width="1" vector-effect="non-scaling-stroke"/><circle cx="${num(to[0])}" cy="${num(to[1])}" r="10" fill="${col}"/>`;
    }
    return raw(s + "</svg>");
  }
  function donutSvg() {
    const total = SEVERITY.reduce((s2, x) => s2 + x.n, 0);
    let a = 0, s = '<svg viewBox="0 0 150 150">';
    for (const v of SEVERITY) {
      const span = v.n / total * Math.PI * 2;
      s += `<path d="${arcPath(75, 75, 59, 75, a + 0.0175, a + span - 0.0175)}" fill="${v.color}"/>`;
      a += span;
    }
    return raw(s + "</svg>");
  }
  function eventsSvg() {
    const VB = { x: 0, y: 0, w: 460, h: 100 };
    let acc = new Array(24).fill(0);
    const layers = EVENTS.series.map((s) => {
      const top = s.v.map((v, i) => acc[i] + v);
      const r = { s, lo: acc, hi: top };
      acc = top;
      return r;
    });
    let out = '<svg viewBox="0 0 460 100" preserveAspectRatio="none">';
    for (let k = layers.length - 1; k >= 0; k--) {
      const { s, lo, hi } = layers[k];
      const pt = points(hi, VB, 0, 600), pb = points(lo, VB, 0, 600);
      const area = smoothPath(pt) + "L" + pb.slice().reverse().map((p) => `${num(p[0])} ${num(p[1])}`).join("L") + "Z";
      out += `<path d="${area}" fill="${s.color}" fill-opacity="0.16"/><path d="${smoothPath(pt)}" fill="none" stroke="${s.color}" stroke-width="1.5" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
    }
    return raw(out + "</svg>");
  }
  function socBuild(o = {}) {
    const total = SEVERITY.reduce((s, x) => s + x.n, 0);
    const cols = o.swapCols ? [0, 1, 2, 3, 5, 4, 6] : [0, 1, 2, 3, 4, 5, 6];
    const heads = ["Severity", "Alert", "Source", "Asset", "Technique", "Status", "Time"];
    const cell = (a, k) => {
      switch (k) {
        case 0:
          return /* @__PURE__ */ hh("span", { className: "pill", style: { background: hexA(SEV_COLOR[a.sev], 0.15), color: SEV_COLOR[a.sev] } }, /* @__PURE__ */ hh("i", { style: { background: SEV_COLOR[a.sev] } }), a.sev);
        case 1:
          return /* @__PURE__ */ hh("span", { style: { fontWeight: 500 } }, a.title);
        case 2:
          return /* @__PURE__ */ hh("span", { className: "mono", style: { fontSize: "12px", color: C.ink2 } }, a.src);
        case 3:
          return /* @__PURE__ */ hh("span", { style: { fontSize: "12.5px", color: C.ink2 } }, a.asset);
        case 4:
          return /* @__PURE__ */ hh("span", { className: "tech mono" }, a.mitre);
        case 5:
          return /* @__PURE__ */ hh("span", { className: "st" }, /* @__PURE__ */ hh("i", { style: { background: STATUS_COLOR[a.status] } }), a.status);
        default:
          return /* @__PURE__ */ hh("span", { style: { fontSize: "12px", color: C.muted } }, a.time);
      }
    };
    const body = /* @__PURE__ */ hh("body", null, /* @__PURE__ */ hh("div", { className: "app" }, /* @__PURE__ */ hh("aside", { className: "side" }, /* @__PURE__ */ hh("div", { className: "brand" }, /* @__PURE__ */ hh("span", { className: "logo" }, I("shield", 16, "#FFFFFF", 2)), /* @__PURE__ */ hh("span", { className: "word" }, BRAND), /* @__PURE__ */ hh("span", { className: "tag" }, "SOC")), /* @__PURE__ */ hh("nav", { className: "nav" }, NAV.map((g) => /* @__PURE__ */ hh("div", { className: "group" }, /* @__PURE__ */ hh("div", { className: "glabel" }, g.group), /* @__PURE__ */ hh("div", { className: "items" }, g.items.map(([icon, label, active, badge]) => /* @__PURE__ */ hh("a", { className: "item" + (active ? " on" : "") }, I(icon, 18, active ? C.accent : C.ink2), label, badge ? /* @__PURE__ */ hh("span", { className: "badge" }, badge) : null)))))), /* @__PURE__ */ hh("div", { className: "user" }, /* @__PURE__ */ hh("span", { className: "av" }, USER.initials), /* @__PURE__ */ hh("span", { className: "who" }, /* @__PURE__ */ hh("b", null, USER.name), /* @__PURE__ */ hh("span", null, USER.role)), /* @__PURE__ */ hh("span", { className: "out" }, I("logout", 18, C.muted)))), /* @__PURE__ */ hh("div", { className: "main" }, /* @__PURE__ */ hh("header", { className: "top" }, /* @__PURE__ */ hh("h1", null, "Security overview"), /* @__PURE__ */ hh("label", { className: "search", "data-bug": o.pillSearch ? "Search field is pill-shaped, spec has 8px corners" : null }, I("search", 16, C.muted), "Search IPs, hosts, users, hashes", /* @__PURE__ */ hh("span", { className: "kbd mono" }, "/")), /* @__PURE__ */ hh("div", { className: "tr" }, /* @__PURE__ */ hh("button", { className: "range", style: { color: C.ink } }, I("calendar", 16, C.ink2), "Last 24 hours", I("chevronDown", 14, C.ink2)), /* @__PURE__ */ hh("span", { className: "live" }, /* @__PURE__ */ hh("i", null), "Live"), /* @__PURE__ */ hh("span", { className: "bell" }, I("bell", 18, C.ink2)), /* @__PURE__ */ hh("span", { className: "av" }, USER.initials))), /* @__PURE__ */ hh("main", { className: "content" }, /* @__PURE__ */ hh("section", { className: "kpis" }, KPIS.map((k, i) => {
      const good = o.wrongDelta && i === 1 ? true : k.good;
      return /* @__PURE__ */ hh("div", { className: "kpi", "data-bug": o.tilePad ? "KPI tiles have 28px left padding, spec is 16px" : null }, /* @__PURE__ */ hh("div", { className: "kl" }, k.label), /* @__PURE__ */ hh("span", { className: "chip", style: { background: hexA(k.tint, 0.14) } }, I(k.icon, 16, k.tint)), /* @__PURE__ */ hh("div", { className: "kv" }, /* @__PURE__ */ hh("b", null, k.value), /* @__PURE__ */ hh("span", { className: "delta", "data-bug": o.wrongDelta && i === 1 ? "Incident delta styled as good news (green), spec is red" : null, style: { background: hexA(good ? "#34D399" : "#F87171", 0.14), color: good ? "#6EE7B7" : "#FCA5A5" } }, k.delta)), /* @__PURE__ */ hh("div", { className: "spark" }, sparkSvg(k, i)));
    })), /* @__PURE__ */ hh("section", { className: "row" }, /* @__PURE__ */ hh("div", { className: "card" }, /* @__PURE__ */ hh("div", { className: "ch" }, /* @__PURE__ */ hh("h3", null, "Live threat map"), /* @__PURE__ */ hh("div", { className: "cr" }, [["Critical", "#F43F5E"], ["High", "#FB923C"], ["Medium", "#FACC15"]].map(([n, c]) => /* @__PURE__ */ hh("span", { className: "li" }, /* @__PURE__ */ hh("i", { className: "dot", style: { background: c } }), n)))), /* @__PURE__ */ hh("div", { className: "body mapbody" }, /* @__PURE__ */ hh("div", { className: "map" }, mapSvg()), /* @__PURE__ */ hh("div", { className: "origins", "data-bug": o.wideOrigins ? "Top origins column 240px wide, spec is 200px" : null }, /* @__PURE__ */ hh("div", { className: "ot" }, "TOP ORIGINS"), ORIGINS.map(([name, n, col]) => /* @__PURE__ */ hh("div", { className: "orow" }, /* @__PURE__ */ hh("div", { className: "ol" }, /* @__PURE__ */ hh("span", null, name), /* @__PURE__ */ hh("span", { className: "mono" }, n.toLocaleString("en-US"))), /* @__PURE__ */ hh("div", { className: "track" }, /* @__PURE__ */ hh("i", { style: { width: `${n / ORIGINS[0][1] * 100}%`, background: col } }))))))), /* @__PURE__ */ hh("div", { className: "card" }, /* @__PURE__ */ hh("div", { className: "ch" }, /* @__PURE__ */ hh("h3", null, "Alerts by severity"), /* @__PURE__ */ hh("div", { className: "cr muted" }, "Last 24 hours")), /* @__PURE__ */ hh("div", { className: "body sevbody" }, /* @__PURE__ */ hh("div", { className: "donut", "data-bug": o.smallDonut ? "Donut 120px, spec is 150px" : null }, donutSvg(), /* @__PURE__ */ hh("div", { className: "dc" }, /* @__PURE__ */ hh("b", null, String(total)), /* @__PURE__ */ hh("span", null, "alerts"))), /* @__PURE__ */ hh("div", { className: "legend" }, SEVERITY.map((s) => /* @__PURE__ */ hh("div", { className: "lrow" }, /* @__PURE__ */ hh("i", { className: "sq", style: { background: s.color } }), /* @__PURE__ */ hh("span", { className: "lname" }, s.name), /* @__PURE__ */ hh("span", { className: "lval mono" }, String(s.n)))))))), /* @__PURE__ */ hh("section", { className: "row" }, /* @__PURE__ */ hh("div", { className: "card" }, /* @__PURE__ */ hh("div", { className: "ch" }, /* @__PURE__ */ hh("h3", null, "Events over time"), /* @__PURE__ */ hh("div", { className: "cr" }, EVENTS.series.map((s) => /* @__PURE__ */ hh("span", { className: "li" }, /* @__PURE__ */ hh("i", { className: "key", style: { background: s.color } }), s.name)))), /* @__PURE__ */ hh("div", { className: "body" }, ["600", "400", "200", "0"].map((t, i) => /* @__PURE__ */ hh(Frag, null, /* @__PURE__ */ hh("div", { className: "grid", style: { top: `calc(6px + (100% - 28px) * ${num(i / 3)})` } }), /* @__PURE__ */ hh("div", { className: "ylab mono", style: { top: `calc(6px + (100% - 28px) * ${num(i / 3)} - 8px)` } }, t))), /* @__PURE__ */ hh("div", { className: "plot" }, eventsSvg()), [0, 4, 8, 12, 16, 20].map((hr) => /* @__PURE__ */ hh("div", { className: "xlab mono", style: { left: `calc(44px + (100% - 44px) * ${num(hr / 23)})` } }, `${String(hr).padStart(2, "0")}:00`)))), /* @__PURE__ */ hh("div", { className: "card" }, /* @__PURE__ */ hh("div", { className: "ch" }, /* @__PURE__ */ hh("h3", null, "Top attack vectors"), /* @__PURE__ */ hh("div", { className: "cr muted" }, "Share of alerts")), /* @__PURE__ */ hh("div", { className: "body vrows" }, VECTORS.map(([name, pct], i) => /* @__PURE__ */ hh("div", null, /* @__PURE__ */ hh("div", { className: "vl" }, /* @__PURE__ */ hh("span", null, name), /* @__PURE__ */ hh("span", { className: "mono" }, `${pct}%`)), /* @__PURE__ */ hh("div", { className: "vt" }, /* @__PURE__ */ hh("i", { style: { width: `${pct / 40 * 100}%`, background: i === 0 ? "#22D3EE" : "#3E7C95" } }))))))), /* @__PURE__ */ hh("section", { className: "card" }, /* @__PURE__ */ hh("div", { className: "ch" }, /* @__PURE__ */ hh("h3", null, "Recent alerts"), /* @__PURE__ */ hh("a", { className: "view", style: { marginLeft: "auto" } }, "View all", I("chevronRight", 16, C.accent))), /* @__PURE__ */ hh("div", { className: "body table" }, /* @__PURE__ */ hh("div", { className: "tr2 thead" }, cols.map((k) => /* @__PURE__ */ hh("span", { className: "cell" + (k === 6 ? " right" : ""), "data-bug": o.swapCols && (k === 4 || k === 5) ? `"${heads[k]}" column in the wrong position` : null }, heads[k].toUpperCase()))), ALERTS.map((a) => /* @__PURE__ */ hh("div", { className: "tr2 trow" }, cols.map((k) => /* @__PURE__ */ hh("span", { className: "cell" + (k === 6 ? " right" : ""), "data-bug": o.swapCols && (k === 4 || k === 5) ? `"${heads[k]}" column in the wrong position` : null }, cell(a, k)))))))))));
    return page(`<title>Security overview — ${BRAND}</title>
<style>${css(o)}</style>`, String(body));
  }

  // src/presets/asm/data.js
  var BRAND2 = "Perimeter";
  var USER2 = { initials: "JM" };
  var RAIL = [["home"], ["radar", true], ["shield"], ["bug"], ["file"], ["sliders"]];
  var NAV2 = [
    { group: "Monitor", items: [["grid", "Summary", true], ["server", "Assets", false, "1,284", "count"], ["globe", "Domains"], ["lock", "Certificates"], ["cloud", "Cloud accounts"]] },
    { group: "Findings", items: [["bug", "Vulnerabilities", false, "37", "badge"], ["sliders", "Misconfigs", false, "12", "badge"], ["key", "Leaked credentials"]] },
    { group: "Reports", items: [["calendar", "Scheduled"], ["file", "Compliance"]] }
  ];
  var SCORE = { value: 72, label: "High", delta: "+6 pts", note: "vs last week" };
  var STATS = [
    { label: "Internet-facing assets", value: "1,284", sub: "+38 new this week", subColor: "#4F46E5", ring: 0.68, ringColor: "#6366F1" },
    { label: "Critical CVEs open", value: "37", sub: "9 past SLA", subColor: "#DC2626", ring: 0.24, ringColor: "#F43F5E" },
    { label: "Certificates expiring", value: "12", sub: "within 30 days", subColor: "#64748B", ring: 0.41, ringColor: "#F59E0B" }
  ];
  var R2 = rng(31);
  var walk2 = (n, start, vol, drift = 0) => {
    let v = start;
    return Array.from({ length: n }, () => v = Math.max(1, v + (R2() - 0.5) * vol + drift));
  };
  var TREND = {
    days: 30,
    max: 600,
    series: [
      { name: "Exposed services", color: "#6366F1", v: walk2(30, 360, 34, 2.4), area: true },
      { name: "New findings", color: "#F43F5E", v: walk2(30, 150, 40, -1.2) }
    ],
    xlabels: ["Sep 10", "Sep 17", "Sep 24", "Oct 1", "Oct 8"],
    ylabels: ["600", "400", "200", "0"]
  };
  var SERVICES = [
    ["443", "HTTPS", 412, "#6366F1"],
    ["22", "SSH", 96, "#8B5CF6"],
    ["3389", "RDP", 41, "#F43F5E"],
    ["445", "SMB", 18, "#F59E0B"],
    ["23", "Telnet", 7, "#F43F5E"]
  ];
  var SEVS = [["Critical", "#E11D48"], ["High", "#F97316"], ["Medium", "#EAB308"], ["Low", "#0EA5E9"]];
  var HEAT = {
    groups: ["Web apps", "APIs", "Cloud storage", "VPN & edge", "Endpoints"],
    counts: [
      [9, 21, 34, 18],
      [6, 14, 22, 30],
      [11, 8, 12, 9],
      [4, 17, 9, 5],
      [7, 25, 41, 52]
    ]
  };
  var ASSETS = [
    { host: "vpn-gw-02", type: "VPN", findings: 14, risk: 91 },
    { host: "api.payments", type: "API", findings: 11, risk: 84 },
    { host: "crm-legacy-01", type: "Web app", findings: 19, risk: 79 },
    { host: "s3://exports", type: "Storage", findings: 6, risk: 66 },
    { host: "jenkins-ci", type: "Web app", findings: 8, risk: 58 }
  ];
  var ASSET_SEEN = ["4m ago", "12m ago", "1h ago", "3h ago", "6h ago"];
  var TYPE_COLOR = { VPN: ["#EEF2FF", "#4338CA"], API: ["#ECFEFF", "#0E7490"], "Web app": ["#F5F3FF", "#6D28D9"], Storage: ["#FFF7ED", "#C2410C"] };
  var riskColor = (r) => r >= 80 ? "#E11D48" : r >= 65 ? "#F97316" : "#EAB308";
  var C2 = {
    page: "#F3F5F9",
    rail: "#0B1220",
    railOn: "#1E293B",
    panel: "#FFFFFF",
    card: "#FFFFFF",
    line: "#E3E8EF",
    line2: "#D5DCE6",
    ink: "#0F172A",
    ink2: "#475569",
    muted: "#8391A7",
    accent: "#4F46E5",
    accentSoft: "#EEF2FF",
    track: "#EEF1F6"
  };

  // src/presets/asm/layout.js
  var RAIL2 = 64;
  var PANEL = 208;
  var SIDE2 = RAIL2 + PANEL;
  var TOP2 = 64;
  var PAD2 = 24;
  var GAP2 = 16;
  var CP = 18;
  var CT = 16;
  var HEAD2 = 20;
  var HGAP = 14;
  var ROWS2 = [132, "1.2fr", "1fr"];
  var TILE_COLS = ["1.4fr", "1fr", "1fr", "1fr"];
  var MID_COLS = ["2fr", "1fr"];
  var LOW_COLS = ["1fr", "1.4fr"];
  var TABLE_COLS = ["1.7fr", 92, 80, "1fr", 72];
  var cardBody2 = (c) => box(c.x + CP, c.y + CT + HEAD2 + HGAP, c.w - 2 * CP, c.h - CT - HEAD2 - HGAP - CP);
  function layout2(W, H) {
    const content = box(SIDE2 + PAD2, TOP2 + PAD2, W - SIDE2 - 2 * PAD2, H - TOP2 - 2 * PAD2);
    const rows = tracks(content.y, content.h, ROWS2, GAP2);
    const at = (cols, r) => tracks(content.x, content.w, cols, GAP2).map((c) => box(c.x, rows[r].x, c.w, rows[r].w));
    const tiles = at(TILE_COLS, 0);
    const [trend, services] = at(MID_COLS, 1);
    const [heat, assets] = at(LOW_COLS, 2);
    const segW = [["7d", 0], ["30d", 1], ["90d", 2]].map(([t]) => Math.round(measure(t, { size: 12.5, weight: 600 })) + 24);
    const seg = segW.reduce((a, b) => a + b, 0) + 8;
    const exportW = Math.round(12 + 16 + 8 + measure("Export", { size: 13, weight: 600 }) + 14);
    const scanW = Math.round(12 + 16 + 8 + measure("Run scan", { size: 13, weight: 600 }) + 14);
    let rx = W - PAD2 - (seg + 12 + exportW + 12 + scanW);
    const header = { seg: box(rx, 16, seg, 32), segW };
    rx += seg + 12;
    header.export = box(rx, 14, exportW, 36);
    rx += exportW + 12;
    header.scan = box(rx, 14, scanW, 36);
    const nav = [];
    let y = 64;
    for (const g of NAV2) {
      const label = box(RAIL2 + 20, y, PANEL - 40, 16);
      y += 16 + 6;
      const items = g.items.map((it) => {
        const b = box(RAIL2 + 10, y, PANEL - 20, 34);
        y += 34 + 2;
        return { it, b };
      });
      nav.push({ g, label, items });
      y += 16;
    }
    const coverage = box(RAIL2 + 12, H - 16 - 84, PANEL - 24, 84);
    return {
      W,
      H,
      content,
      rows,
      tiles,
      trend,
      services,
      heat,
      assets,
      header,
      nav,
      coverage,
      tableCols: tracks(assets.x + CP, assets.w - 2 * CP, TABLE_COLS, 16)
    };
  }

  // src/presets/asm/design.jsx
  function Card2({ b, title, right, children }) {
    return /* @__PURE__ */ h(Group, { id: `Card/${title}` }, /* @__PURE__ */ h(Box, { x: b.x, y: b.y, w: b.w, h: b.h, r: 12, fill: C2.card, stroke: C2.line }), /* @__PURE__ */ h(Text, { x: b.x + CP, y: b.y + CT, size: 14, lh: 20, weight: 600, color: C2.ink }, title), right, children);
  }
  var RightNote = ({ b, children }) => /* @__PURE__ */ h(Text, { x: b.x + b.w - CP, y: b.y + CT, align: "right", size: 12, lh: 20, weight: 500, color: C2.muted }, children);
  function Rail({ L, D }) {
    const logo = D.linear(16, 16, 48, 48, [[0, "#6366F1"], [1, "#22D3EE"]]);
    return /* @__PURE__ */ h(Group, { id: "Rail" }, /* @__PURE__ */ h(Box, { x: 0, y: 0, w: RAIL2, h: L.H, fill: C2.rail }), /* @__PURE__ */ h("rect", { x: "16", y: "16", width: "32", height: "32", rx: "9", fill: logo }), /* @__PURE__ */ h(Icon, { name: "shield", x: 23, y: 23, size: 18, color: "#FFFFFF", sw: 2 }), RAIL.map(([icon, on], i) => /* @__PURE__ */ h(Fragment, null, on ? /* @__PURE__ */ h(Box, { x: 12, y: 72 + i * 48, w: 40, h: 40, r: 10, fill: C2.railOn }) : null, /* @__PURE__ */ h(Icon, { name: icon, x: 22, y: 82 + i * 48, size: 20, color: on ? "#A5B4FC" : "#64748B" }))), /* @__PURE__ */ h("circle", { cx: "32", cy: L.H - 36, r: "16", fill: "#312E81" }), /* @__PURE__ */ h(Text, { x: 16, y: L.H - 46, width: 32, align: "center", size: 12, lh: 20, weight: 700, color: "#C7D2FE" }, USER2.initials));
  }
  function Panel({ L }) {
    const out = [];
    out.push(/* @__PURE__ */ h(Box, { x: RAIL2, y: 0, w: PANEL, h: L.H, fill: C2.panel }), /* @__PURE__ */ h("rect", { x: SIDE2 - 1, width: "1", height: L.H, fill: C2.line }));
    out.push(/* @__PURE__ */ h(Text, { x: RAIL2 + 20, y: 18, size: 16, lh: 24, weight: 600, color: C2.ink }, "Exposure"));
    for (const n of L.nav) {
      out.push(/* @__PURE__ */ h(Text, { x: n.label.x, y: n.label.y, size: 11, lh: 16, weight: 600, color: C2.muted, ls: 0.6 }, n.g.group.toUpperCase()));
      for (const { it, b } of n.items) {
        const [icon, label, on, badge, kind] = it;
        if (on) out.push(/* @__PURE__ */ h(Box, { x: b.x, y: b.y, w: b.w, h: b.h, r: 8, fill: C2.accentSoft }));
        out.push(/* @__PURE__ */ h(Icon, { name: icon, x: b.x + 12, y: b.y + 9, size: 16, color: on ? C2.accent : "#64748B" }));
        out.push(/* @__PURE__ */ h(Text, { x: b.x + 38, y: b.y + 7, size: 13, lh: 20, weight: on ? 600 : 500, color: on ? "#4338CA" : C2.ink2 }, label));
        if (badge && kind === "badge") {
          const w = Math.max(22, Math.round(tw(badge, 11, 600)) + 14);
          out.push(/* @__PURE__ */ h(Box, { x: b.x + b.w - 10 - w, y: b.y + 8, w, h: 18, r: 9, fill: "#FEE2E2" }), /* @__PURE__ */ h(Text, { x: b.x + b.w - 10 - w, y: b.y + 8, width: w, align: "center", size: 11, lh: 18, weight: 600, color: "#B91C1C" }, badge));
        } else if (badge) {
          out.push(/* @__PURE__ */ h(Text, { x: b.x + b.w - 10, y: b.y + 8, align: "right", size: 11.5, lh: 18, weight: 500, family: "mono", color: C2.muted }, badge));
        }
      }
    }
    const c = L.coverage;
    out.push(/* @__PURE__ */ h(Box, { x: c.x, y: c.y, w: c.w, h: c.h, r: 10, fill: "#F8FAFC", stroke: C2.line }));
    out.push(/* @__PURE__ */ h(Text, { x: c.x + 12, y: c.y + 11, size: 12, lh: 16, weight: 500, color: C2.ink2 }, "Scan coverage"));
    out.push(/* @__PURE__ */ h(Text, { x: c.x + 12, y: c.y + 31, size: 18, lh: 24, weight: 600, color: C2.ink }, "92%"));
    out.push(/* @__PURE__ */ h(Text, { x: c.x + 12 + Math.round(tw("92%", 18, 600)) + 6, y: c.y + 37, size: 11, lh: 16, weight: 400, color: C2.muted }, "of known assets"));
    out.push(/* @__PURE__ */ h(Box, { x: c.x + 12, y: c.y + 64, w: c.w - 24, h: 6, r: 3, fill: C2.track }), /* @__PURE__ */ h(Box, { x: c.x + 12, y: c.y + 64, w: (c.w - 24) * 0.92, h: 6, r: 3, fill: "#10B981" }));
    return /* @__PURE__ */ h(Group, { id: "Section panel" }, out);
  }
  function Header({ L }) {
    const hd = L.header, x0 = SIDE2;
    const titleW = tw("Attack surface summary", 18, 600);
    const sx = x0 + PAD2 + titleW + 16;
    const segs = [];
    let x = hd.seg.x + 4;
    ["7d", "30d", "90d"].forEach((t, i) => {
      const w = hd.segW[i];
      if (i === 1) segs.push(/* @__PURE__ */ h(Box, { x, y: hd.seg.y + 4, w, h: 24, r: 6, fill: "#FFFFFF", stroke: C2.line2 }));
      segs.push(/* @__PURE__ */ h(Text, { x, y: hd.seg.y + 6, width: w, align: "center", size: 12.5, lh: 20, weight: 600, color: i === 1 ? C2.ink : C2.ink2 }, t));
      x += w;
    });
    return /* @__PURE__ */ h(Group, { id: "Header" }, /* @__PURE__ */ h(Box, { x: x0, y: 0, w: L.W - x0, h: TOP2, fill: "#FFFFFF" }), /* @__PURE__ */ h("rect", { x: x0, y: TOP2 - 1, width: L.W - x0, height: "1", fill: C2.line }), /* @__PURE__ */ h(Text, { x: x0 + PAD2, y: 19, size: 18, lh: 26, weight: 600, color: C2.ink }, "Attack surface summary"), /* @__PURE__ */ h("circle", { cx: sx + 4, cy: 32, r: "4", fill: "#10B981" }), /* @__PURE__ */ h(Text, { x: sx + 14, y: 22, size: 12.5, lh: 20, weight: 400, color: C2.muted }, "Scanned 4 min ago"), /* @__PURE__ */ h(Box, { x: hd.seg.x, y: hd.seg.y, w: hd.seg.w, h: 32, r: 8, fill: "#F1F4F9" }), segs, /* @__PURE__ */ h(Box, { x: hd.export.x, y: hd.export.y, w: hd.export.w, h: 36, r: 8, fill: "#FFFFFF", stroke: C2.line2 }), /* @__PURE__ */ h(Icon, { name: "download", x: hd.export.x + 12, y: hd.export.y + 10, size: 16, color: C2.ink2 }), /* @__PURE__ */ h(Text, { x: hd.export.x + 36, y: hd.export.y + 8, size: 13, lh: 20, weight: 600, color: C2.ink }, "Export"), /* @__PURE__ */ h(Box, { x: hd.scan.x, y: hd.scan.y, w: hd.scan.w, h: 36, r: 8, fill: C2.accent }), /* @__PURE__ */ h(Icon, { name: "radar", x: hd.scan.x + 12, y: hd.scan.y + 10, size: 16, color: "#FFFFFF" }), /* @__PURE__ */ h(Text, { x: hd.scan.x + 36, y: hd.scan.y + 8, size: 13, lh: 20, weight: 600, color: "#FFFFFF" }, "Run scan"));
  }
  function ScoreTile({ t }) {
    const cx = t.x + 18 + 50, cy = t.y + 46 + 50, r = 50;
    const a0 = -Math.PI / 2, a1 = a0 + Math.PI * (SCORE.value / 100);
    const rx = t.x + 138;
    const pw = Math.round(tw(SCORE.label, 12, 600)) + 20;
    return /* @__PURE__ */ h(Group, { id: "Tile/Exposure score" }, /* @__PURE__ */ h(Box, { x: t.x, y: t.y, w: t.w, h: t.h, r: 12, fill: C2.card, stroke: C2.line }), /* @__PURE__ */ h(Text, { x: t.x + 18, y: t.y + 16, size: 13, lh: 18, weight: 500, color: C2.ink2 }, "Exposure score"), /* @__PURE__ */ h("path", { d: arcPath(cx, cy, r - 10, r, -Math.PI / 2, Math.PI / 2), fill: C2.track }), /* @__PURE__ */ h("path", { d: arcPath(cx, cy, r - 10, r, a0, a1), fill: "#F97316" }), /* @__PURE__ */ h(Text, { x: t.x + 18, y: t.y + 66, width: 100, align: "center", size: 26, lh: 30, weight: 600, color: C2.ink, ls: -0.3 }, String(SCORE.value)), /* @__PURE__ */ h(Text, { x: t.x + 18, y: t.y + 100, width: 100, align: "center", size: 11, lh: 14, weight: 400, color: C2.muted }, "out of 100"), /* @__PURE__ */ h(Box, { x: rx, y: t.y + 50, w: pw, h: 22, r: 11, fill: "#FFEDD5" }), /* @__PURE__ */ h(Text, { x: rx, y: t.y + 51, width: pw, align: "center", size: 12, lh: 20, weight: 600, color: "#C2410C" }, SCORE.label), /* @__PURE__ */ h(Icon, { name: "trendUp", x: rx, y: t.y + 84, size: 14, color: "#DC2626", sw: 2 }), /* @__PURE__ */ h(Text, { x: rx + 18, y: t.y + 81, size: 13, lh: 20, weight: 600, color: "#DC2626" }, SCORE.delta), /* @__PURE__ */ h(Text, { x: rx, y: t.y + 101, size: 12, lh: 16, weight: 400, color: C2.muted }, SCORE.note));
  }
  function ringArc(cx, cy, r, f) {
    const a = Math.PI * 2 * Math.min(0.999, f);
    const x = cx + r * Math.sin(a), y = cy - r * Math.cos(a);
    return `M${num(cx)} ${num(cy - r)}A${num(r)} ${num(r)} 0 ${a > Math.PI ? 1 : 0} 1 ${num(x)} ${num(y)}`;
  }
  function StatTile({ t, s }) {
    const cx = t.x + t.w - 18 - 24, cy = t.y + 54 + 24;
    return /* @__PURE__ */ h(Group, { id: `Tile/${s.label}` }, /* @__PURE__ */ h(Box, { x: t.x, y: t.y, w: t.w, h: t.h, r: 12, fill: C2.card, stroke: C2.line }), /* @__PURE__ */ h(Text, { x: t.x + 18, y: t.y + 16, size: 13, lh: 18, weight: 500, color: C2.ink2 }, s.label), /* @__PURE__ */ h(Text, { x: t.x + 18, y: t.y + 44, size: 26, lh: 32, weight: 600, color: C2.ink, ls: -0.3 }, s.value), /* @__PURE__ */ h(Text, { x: t.x + 18, y: t.y + 88, size: 12, lh: 16, weight: 500, color: s.subColor }, s.sub), /* @__PURE__ */ h("circle", { cx, cy, r: "21", stroke: C2.track, strokeWidth: "6" }), /* @__PURE__ */ h("path", { d: ringArc(cx, cy, 21, s.ring), stroke: s.ringColor, strokeWidth: "6", strokeLinecap: "round" }), /* @__PURE__ */ h(Text, { x: cx - 24, y: cy - 8, width: 48, align: "center", size: 11, lh: 16, weight: 600, color: C2.ink }, `${Math.round(s.ring * 100)}%`));
  }
  function Trend({ D, b }) {
    const body = cardBody2(b);
    const plot = box(body.x + 40, body.y + 8, body.w - 40, body.h - 8 - 24);
    const out = [];
    TREND.ylabels.forEach((t, i) => {
      const y = plot.y + i / 3 * plot.h;
      out.push(/* @__PURE__ */ h("rect", { x: plot.x, y, width: plot.w, height: "1", fill: i === 3 ? C2.line2 : C2.line }));
      out.push(/* @__PURE__ */ h(Text, { x: body.x + 30, y: y - 8, align: "right", size: 11, lh: 16, family: "mono", color: C2.muted }, t));
    });
    for (const s of TREND.series) {
      const pts = points(s.v, plot, 0, TREND.max);
      if (s.area) out.push(/* @__PURE__ */ h("path", { d: areaPath(pts, plot.y + plot.h), fill: D.linear(plot.x, plot.y, plot.x, plot.y + plot.h, [[0, s.color, 0.22], [1, s.color, 0]]) }));
      out.push(/* @__PURE__ */ h("path", { d: smoothPath(pts), stroke: s.color, strokeWidth: "2", strokeLinejoin: "round", strokeLinecap: "round" }));
    }
    TREND.xlabels.forEach((t, i) => {
      const x = plot.x + i * 7 / (TREND.days - 1) * plot.w;
      out.push(/* @__PURE__ */ h(Text, { x, y: plot.y + plot.h + 8, align: "center", size: 11, lh: 16, color: C2.muted }, t));
    });
    let lx = b.x + b.w - CP;
    const leg = [];
    for (let i = TREND.series.length - 1; i >= 0; i--) {
      const s = TREND.series[i];
      lx -= tw(s.name, 12, 500);
      leg.push(/* @__PURE__ */ h(Text, { x: lx, y: b.y + CT, size: 12, lh: 20, weight: 500, color: C2.ink2 }, s.name));
      lx -= 6 + 8;
      leg.push(/* @__PURE__ */ h("circle", { cx: lx + 4, cy: b.y + CT + 10, r: "4", fill: s.color }));
      lx -= 16;
    }
    return /* @__PURE__ */ h(Card2, { b, title: "Exposure trend", right: leg }, out);
  }
  function Services({ b, tight }) {
    const body = cardBody2(b);
    const pitch = tight ? 38 : 46;
    return /* @__PURE__ */ h(Card2, { b, title: "Exposed services", right: /* @__PURE__ */ h(RightNote, { b }, "by port") }, SERVICES.map(([port, name, n, col], i) => {
      const y = body.y + i * pitch;
      const bw = Math.round(tw(port, 11, 500, "mono")) + 12;
      return /* @__PURE__ */ h(Fragment, null, /* @__PURE__ */ h(Box, { x: body.x, y, w: bw, h: 18, r: 4, fill: "#F1F5F9" }), /* @__PURE__ */ h(Text, { x: body.x, y, width: bw, align: "center", size: 11, lh: 18, weight: 500, family: "mono", color: C2.ink2 }, port), /* @__PURE__ */ h(Text, { x: body.x + bw + 10, y: y - 1, size: 13, lh: 20, weight: 500, color: C2.ink }, name), /* @__PURE__ */ h(Text, { x: body.x + body.w, y, align: "right", size: 12, lh: 18, weight: 600, family: "mono", color: C2.ink }, String(n)), /* @__PURE__ */ h(Box, { x: body.x, y: y + 26, w: body.w, h: 6, r: 3, fill: C2.track }), /* @__PURE__ */ h(Box, { x: body.x, y: y + 26, w: body.w * n / 420, h: 6, r: 3, fill: col }));
    }));
  }
  function Heatmap({ b }) {
    const body = cardBody2(b);
    const cols = tracks(body.x, body.w, [104, "1fr", "1fr", "1fr", "1fr"], 6);
    const rows = tracks(body.y, body.h, [18, "1fr", "1fr", "1fr", "1fr", "1fr"], 6);
    const max = Math.max(...HEAT.counts.flat());
    const out = [];
    SEVS.forEach(([name], j) => out.push(/* @__PURE__ */ h(Text, { x: cols[j + 1].x, y: rows[0].x + 1, width: cols[j + 1].w, align: "center", size: 10.5, lh: 16, weight: 600, color: C2.muted, ls: 0.5 }, name.toUpperCase())));
    HEAT.groups.forEach((g, i) => {
      const r = rows[i + 1];
      out.push(/* @__PURE__ */ h(Text, { x: cols[0].x, y: r.x + (r.w - 18) / 2, size: 12.5, lh: 18, weight: 500, color: C2.ink2 }, g));
      HEAT.counts[i].forEach((n, j) => {
        const c = cols[j + 1], t = 0.1 + 0.8 * (n / max);
        out.push(/* @__PURE__ */ h(Box, { x: c.x, y: r.x, w: c.w, h: r.w, r: 6, fill: mix("#FFFFFF", SEVS[j][1], t) }));
        out.push(/* @__PURE__ */ h(Text, { x: c.x, y: r.x + (r.w - 18) / 2, width: c.w, align: "center", size: 12, lh: 18, weight: 600, family: "mono", color: t > 0.5 ? "#FFFFFF" : C2.ink }, String(n)));
      });
    });
    return /* @__PURE__ */ h(Card2, { b, title: "Findings by asset group", right: /* @__PURE__ */ h(RightNote, { b }, "open findings") }, out);
  }
  function Assets({ b, L }) {
    const body = cardBody2(b);
    const cols = L.tableCols;
    const heads = ["ASSET", "TYPE", "FINDINGS", "EXPOSURE", "LAST SEEN"];
    const out = [];
    heads.forEach((t, i) => out.push(/* @__PURE__ */ h(Text, { x: i === 4 ? cols[i].x + cols[i].w : cols[i].x, y: body.y + 2, align: i === 4 ? "right" : "left", size: 11, lh: 16, weight: 600, color: C2.muted, ls: 0.5 }, t)));
    ASSETS.forEach((a, r) => {
      const y = body.y + 26 + r * 38;
      out.push(/* @__PURE__ */ h("rect", { x: body.x, y, width: body.w, height: "1", fill: C2.line }));
      out.push(/* @__PURE__ */ h(Text, { x: cols[0].x, y: y + 9, size: 12.5, lh: 20, weight: 500, family: "mono", color: C2.ink }, a.host));
      const [bg, fg] = TYPE_COLOR[a.type];
      const pw = Math.round(tw(a.type, 11.5, 600)) + 16;
      out.push(/* @__PURE__ */ h(Box, { x: cols[1].x, y: y + 9, w: pw, h: 20, r: 10, fill: bg }), /* @__PURE__ */ h(Text, { x: cols[1].x, y: y + 9, width: pw, align: "center", size: 11.5, lh: 20, weight: 600, color: fg }, a.type));
      out.push(/* @__PURE__ */ h(Text, { x: cols[2].x, y: y + 9, size: 13, lh: 20, weight: 600, color: C2.ink }, String(a.findings)));
      const bw = cols[3].w - 40;
      out.push(/* @__PURE__ */ h(Box, { x: cols[3].x, y: y + 16, w: bw, h: 6, r: 3, fill: C2.track }), /* @__PURE__ */ h(Box, { x: cols[3].x, y: y + 16, w: bw * a.risk / 100, h: 6, r: 3, fill: riskColor(a.risk) }));
      out.push(/* @__PURE__ */ h(Text, { x: cols[3].x + cols[3].w, y: y + 9, align: "right", size: 12, lh: 20, weight: 600, family: "mono", color: C2.ink }, String(a.risk)));
      out.push(/* @__PURE__ */ h(Text, { x: cols[4].x + cols[4].w, y: y + 9, align: "right", size: 12, lh: 20, weight: 400, color: C2.muted }, ASSET_SEEN[r]));
    });
    const vw = tw("View all", 13, 500);
    const right = /* @__PURE__ */ h(Fragment, null, /* @__PURE__ */ h(Text, { x: b.x + b.w - CP - 18 - vw, y: b.y + CT, size: 13, lh: 20, weight: 500, color: C2.accent }, "View all"), /* @__PURE__ */ h(Icon, { name: "chevronRight", x: b.x + b.w - CP - 16, y: b.y + CT + 2, size: 16, color: C2.accent }));
    return /* @__PURE__ */ h(Card2, { b, title: "Riskiest assets", right }, out);
  }
  function asmDesign({ W = 1440, H = 960 } = {}) {
    const L = layout2(W, H);
    const D = doc("Attack surface summary", W, H);
    const content = /* @__PURE__ */ h(Fragment, null, /* @__PURE__ */ h(Rail, { L, D }), /* @__PURE__ */ h(Panel, { L }), /* @__PURE__ */ h(Header, { L }), /* @__PURE__ */ h(Group, { id: "Tiles" }, /* @__PURE__ */ h(ScoreTile, { t: L.tiles[0] }), STATS.map((s, i) => /* @__PURE__ */ h(StatTile, { t: L.tiles[i + 1], s }))), /* @__PURE__ */ h(Trend, { D, b: L.trend }), /* @__PURE__ */ h(Services, { b: L.services }), /* @__PURE__ */ h(Heatmap, { b: L.heat }), /* @__PURE__ */ h(Assets, { b: L.assets, L }));
    return D.svg(content, C2.page);
  }

  // src/presets/asm/build.jsx
  var UI2 = `Arial, Helvetica, 'Liberation Sans', sans-serif`;
  var MONO2 = `'SF Mono', Menlo, Consolas, 'DejaVu Sans Mono', monospace`;
  var I2 = (name, size, color2, sw) => raw(iconHtml(name, size, color2, sw));
  var fr = (s) => s.split(" ").map((t) => t.endsWith("fr") ? `minmax(0,${t})` : t).join(" ");
  var css2 = (o) => `
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%}
body{background:${C2.page};color:${C2.ink};font-family:${UI2};overflow:hidden}
button{font:inherit;color:inherit;border:0;background:none}
.mono{font-family:${MONO2}}
.app{display:grid;grid-template-columns:64px 208px minmax(0,1fr);height:100vh}
.rail{position:relative;background:${C2.rail};padding-top:16px;display:flex;flex-direction:column;align-items:center}
.logo{width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,#6366F1,#22D3EE);display:flex;align-items:center;justify-content:center}
.rnav{margin-top:24px;display:flex;flex-direction:column;gap:8px}
.rb{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center}
.rb.on{background:${C2.railOn}}
.me{position:absolute;left:16px;bottom:20px;width:32px;height:32px;border-radius:50%;background:#312E81;color:#C7D2FE;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center}
.panel{position:relative;background:${C2.panel};box-shadow:inset -1px 0 0 ${C2.line};padding:18px 10px 0}
.panel h2{padding-left:10px;font-size:16px;line-height:24px;font-weight:600}
.pnav{margin-top:22px}
.group+.group{margin-top:18px}
.gl{padding-left:10px;margin-bottom:6px;font-size:11px;line-height:16px;font-weight:600;letter-spacing:.6px;text-transform:uppercase;color:${C2.muted}}
.items{display:flex;flex-direction:column;gap:2px}
.it{height:34px;border-radius:8px;display:flex;align-items:center;gap:10px;padding:0 10px 0 12px;font-size:13px;line-height:20px;font-weight:500;color:${C2.ink2}}
.it.on{background:${C2.accentSoft};color:#4338CA;font-weight:600}
.badge{margin-left:auto;min-width:22px;height:18px;padding:0 7px;border-radius:9px;background:#FEE2E2;color:#B91C1C;font-size:11px;line-height:18px;font-weight:600;text-align:center}
.count{margin-left:auto;font-size:11.5px;line-height:18px;color:${C2.muted}}
.cov{position:absolute;left:12px;right:12px;bottom:16px;height:84px;border:1px solid ${C2.line};border-radius:10px;background:#F8FAFC;padding:10px 11px 0}
.cov .t{font-size:12px;line-height:16px;font-weight:500;color:${C2.ink2}}
.cov .v{margin-top:4px;display:flex;align-items:baseline;gap:6px}
.cov .v b{font-size:18px;line-height:24px;font-weight:600}
.cov .v span{font-size:11px;line-height:16px;color:${C2.muted}}
.cov .bar{margin-top:9px;height:6px;border-radius:3px;background:${C2.track};overflow:hidden}
.cov .bar i{display:block;width:92%;height:100%;border-radius:3px;background:#10B981}
.main{display:flex;flex-direction:column;min-width:0;min-height:0}
.top{flex:none;height:${o.tallHeader ? 72 : 64}px;background:#FFFFFF;border-bottom:1px solid ${C2.line};display:flex;align-items:center;padding:0 24px}
.top h1{font-size:18px;line-height:26px;font-weight:600;white-space:nowrap}
.status{margin-left:16px;display:flex;align-items:center;gap:6px;font-size:12.5px;line-height:20px;color:${C2.muted};white-space:nowrap}
.status i{width:8px;height:8px;border-radius:50%;background:#10B981}
.acts{margin-left:auto;display:flex;align-items:center;gap:12px}
.seg{height:32px;border-radius:8px;background:#F1F4F9;padding:4px;display:flex}
.seg button{height:24px;padding:0 11px;border-radius:6px;font-size:12.5px;line-height:22px;font-weight:600;color:${C2.ink2};border:1px solid transparent}
.seg button.on{background:#FFFFFF;border-color:${C2.line2};color:${C2.ink}}
.btn{height:36px;border-radius:8px;display:flex;align-items:center;gap:8px;padding:0 13px 0 11px;font-size:13px;line-height:20px;font-weight:600;white-space:nowrap}
.btn.sec{background:#FFFFFF;border:1px solid ${C2.line2}}
.btn.pri{background:${C2.accent};color:#FFFFFF;padding:0 14px 0 12px}
.content{flex:1;min-height:0;padding:24px;display:grid;gap:16px;grid-template-rows:${fr("132px 1.2fr 1fr")}${o.capWidth ? ";width:100%;max-width:1168px" : ""}}
.row{display:grid;gap:16px;min-height:0}
.tiles{grid-template-columns:${fr(o.swapTiles ? "1.4fr 1fr 1fr 1fr" : "1.4fr 1fr 1fr 1fr")}}
.mid{grid-template-columns:${fr("2fr 1fr")}}
.low{grid-template-columns:${fr("1fr 1.4fr")}}
.tile{position:relative;background:${C2.card};border:1px solid ${C2.line};border-radius:12px;min-width:0;overflow:hidden}
.tl{position:absolute;left:17px;top:15px;font-size:13px;line-height:18px;font-weight:500;color:${C2.ink2};white-space:nowrap}
.gauge{position:absolute;left:17px;top:45px;width:100px;height:50px}
.score{position:absolute;left:17px;top:65px;width:100px;text-align:center;font-size:26px;line-height:30px;font-weight:600;letter-spacing:-.3px}
.of{position:absolute;left:17px;top:99px;width:100px;text-align:center;font-size:11px;line-height:14px;color:${C2.muted}}
.sr{position:absolute;left:137px;top:49px}
.pill{display:inline-block;height:22px;padding:0 10px;border-radius:11px;background:#FFEDD5;color:#C2410C;font-size:12px;line-height:22px;font-weight:600}
.dl{position:absolute;left:137px;top:80px;display:flex;align-items:center;gap:4px;color:#DC2626;font-size:13px;line-height:20px;font-weight:600;white-space:nowrap}
.note{position:absolute;left:137px;top:100px;font-size:12px;line-height:16px;color:${C2.muted};white-space:nowrap}
.kv{position:absolute;left:17px;top:43px;font-size:26px;line-height:32px;font-weight:600;letter-spacing:-.3px}
.ks{position:absolute;left:17px;top:87px;font-size:12px;line-height:16px;font-weight:500;white-space:nowrap}
.ring{position:absolute;right:17px;top:53px;width:48px;height:48px}
.ring svg{display:block}
.ring b{position:absolute;left:0;right:0;top:16px;text-align:center;font-size:11px;line-height:16px;font-weight:600}
.card{position:relative;min-width:0;min-height:0;background:${C2.card};border:1px solid ${C2.line};border-radius:12px;padding:15px 17px 17px;display:flex;flex-direction:column;overflow:hidden}
.ch{flex:none;height:20px;margin-bottom:14px;display:flex;align-items:center}
.ch h3{font-size:14px;line-height:20px;font-weight:600;white-space:nowrap}
.cr{margin-left:auto;display:flex;align-items:center;gap:16px;font-size:12px;line-height:20px;font-weight:500;color:${C2.ink2};white-space:nowrap}
.cr.muted{color:${C2.muted}}
.li{display:flex;align-items:center;gap:6px}
.li i{width:8px;height:8px;border-radius:50%}
.body{position:relative;flex:1;min-height:0}
.ylab{position:absolute;left:0;width:30px;text-align:right;font-size:11px;line-height:16px;color:${C2.muted}}
.grid{position:absolute;left:40px;right:0;height:1px;background:${C2.line}}
.grid.base{background:${C2.line2}}
.plot{position:absolute;left:40px;right:0;top:8px;bottom:24px}
.plot svg{display:block;width:100%;height:100%}
.xlab{position:absolute;bottom:0;transform:translateX(-50%);font-size:11px;line-height:16px;color:${C2.muted};white-space:nowrap}
.svc{display:flex;flex-direction:column;gap:${o.tightServices ? 6 : 14}px}
.sl{height:18px;display:flex;align-items:center;gap:10px}
.port{height:18px;padding:0 6px;border-radius:4px;background:#F1F5F9;font-size:11px;line-height:18px;font-weight:500;color:${C2.ink2}}
.sn{font-size:13px;line-height:20px;font-weight:500}
.sc{margin-left:auto;font-size:12px;line-height:18px;font-weight:600}
.st{margin-top:8px;height:6px;border-radius:3px;background:${C2.track};overflow:hidden}
.st i{display:block;height:100%;border-radius:3px}
.heat{height:100%;display:grid;gap:6px;grid-template-columns:${fr("104px 1fr 1fr 1fr 1fr")};grid-template-rows:${fr("18px 1fr 1fr 1fr 1fr 1fr")}}
.hh{padding-top:1px;text-align:center;font-size:10.5px;line-height:16px;font-weight:600;letter-spacing:.5px;color:${C2.muted}}
.hg{display:flex;align-items:center;font-size:12.5px;line-height:18px;font-weight:500;color:${C2.ink2};white-space:nowrap}
.hc{border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:12px;line-height:18px;font-weight:600}
.view{margin-left:auto;display:flex;align-items:center;gap:2px;color:${C2.accent};font-size:13px;line-height:20px;font-weight:500}
.tr{display:grid;grid-template-columns:${fr("1.7fr 92px 80px 1fr 72px")};column-gap:16px}
.thead{height:26px;padding-top:2px;font-size:11px;line-height:16px;font-weight:600;letter-spacing:.5px;color:${C2.muted}}
.trow{height:38px;border-top:1px solid ${C2.line};padding-top:8px;align-items:start;font-size:13px;line-height:20px}
.cell{min-width:0;white-space:nowrap;overflow:hidden}
.right{text-align:right}
.host{font-size:12.5px;font-weight:500}
.tpc{display:flex}
.tp{display:block;height:20px;padding:0 8px;border-radius:10px;font-size:11.5px;line-height:20px;font-weight:600}
.risk{height:20px;display:flex;align-items:center}
.rt{flex:1;height:6px;border-radius:3px;background:${C2.track};overflow:hidden;margin-right:12px}
.rt i{display:block;height:100%;border-radius:3px}
.rv{width:28px;text-align:right;font-size:12px;font-weight:600}
`;
  function gaugeSvg(color2) {
    return raw(`<svg viewBox="0 0 100 50" width="100" height="50"><path d="${arcPath(50, 50, 40, 50, -Math.PI / 2, Math.PI / 2)}" fill="${C2.track}"/><path d="${arcPath(50, 50, 40, 50, -Math.PI / 2, -Math.PI / 2 + Math.PI * (SCORE.value / 100))}" fill="${color2}"/></svg>`);
  }
  function ringSvg(f, color2) {
    const a = Math.PI * 2 * Math.min(0.999, f), x = 24 + 21 * Math.sin(a), y = 24 - 21 * Math.cos(a);
    return raw(`<svg viewBox="0 0 48 48" width="48" height="48"><circle cx="24" cy="24" r="21" fill="none" stroke="${C2.track}" stroke-width="6"/><path d="M24 3A21 21 0 ${a > Math.PI ? 1 : 0} 1 ${num(x)} ${num(y)}" fill="none" stroke="${color2}" stroke-width="6" stroke-linecap="round"/></svg>`);
  }
  function trendSvg() {
    const VB = { x: 0, y: 0, w: 600, h: 200 };
    let s = `<svg viewBox="0 0 600 200" preserveAspectRatio="none"><defs><linearGradient id="ta" x1="0" y1="0" x2="0" y2="200" gradientUnits="userSpaceOnUse"><stop stop-color="${TREND.series[0].color}" stop-opacity="0.22"/><stop offset="1" stop-color="${TREND.series[0].color}" stop-opacity="0"/></linearGradient></defs>`;
    for (const t of TREND.series) {
      const pts = points(t.v, VB, 0, TREND.max);
      if (t.area) s += `<path d="${areaPath(pts, 200)}" fill="url(#ta)"/>`;
      s += `<path d="${smoothPath(pts)}" fill="none" stroke="${t.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`;
    }
    return raw(s + "</svg>");
  }
  function asmBuild(o = {}) {
    const max = Math.max(...HEAT.counts.flat());
    const stats = o.swapTiles ? [STATS[1], STATS[0], STATS[2]] : STATS;
    const body = /* @__PURE__ */ hh("body", null, /* @__PURE__ */ hh("div", { className: "app" }, /* @__PURE__ */ hh("nav", { className: "rail", "aria-label": "Product" }, /* @__PURE__ */ hh("span", { className: "logo" }, I2("shield", 18, "#FFFFFF", 2)), /* @__PURE__ */ hh("div", { className: "rnav" }, RAIL.map(([icon, on]) => /* @__PURE__ */ hh("a", { className: "rb" + (on ? " on" : "") }, I2(icon, 20, on ? "#A5B4FC" : "#64748B")))), /* @__PURE__ */ hh("span", { className: "me" }, USER2.initials)), /* @__PURE__ */ hh("aside", { className: "panel" }, /* @__PURE__ */ hh("h2", null, "Exposure"), /* @__PURE__ */ hh("div", { className: "pnav" }, NAV2.map((g) => /* @__PURE__ */ hh("div", { className: "group" }, /* @__PURE__ */ hh("div", { className: "gl" }, g.group), /* @__PURE__ */ hh("div", { className: "items" }, g.items.map(([icon, label, on, badge, kind]) => /* @__PURE__ */ hh("a", { className: "it" + (on ? " on" : "") }, I2(icon, 16, on ? C2.accent : "#64748B"), label, badge ? /* @__PURE__ */ hh("span", { className: kind === "badge" ? "badge" : "count mono" }, badge) : null)))))), /* @__PURE__ */ hh("div", { className: "cov" }, /* @__PURE__ */ hh("div", { className: "t" }, "Scan coverage"), /* @__PURE__ */ hh("div", { className: "v" }, /* @__PURE__ */ hh("b", null, "92%"), /* @__PURE__ */ hh("span", null, "of known assets")), /* @__PURE__ */ hh("div", { className: "bar" }, /* @__PURE__ */ hh("i", null)))), /* @__PURE__ */ hh("div", { className: "main" }, /* @__PURE__ */ hh("header", { className: "top", "data-bug": o.tallHeader ? "Header bar 72px tall, spec is 64px" : null }, /* @__PURE__ */ hh("h1", null, "Attack surface summary"), /* @__PURE__ */ hh("span", { className: "status" }, /* @__PURE__ */ hh("i", null), "Scanned 4 min ago"), /* @__PURE__ */ hh("div", { className: "acts" }, /* @__PURE__ */ hh("div", { className: "seg" }, ["7d", "30d", "90d"].map((t, i) => /* @__PURE__ */ hh("button", { className: i === 1 ? "on" : null }, t))), /* @__PURE__ */ hh("button", { className: "btn sec" }, I2("download", 16, C2.ink2), "Export"), o.dropScan ? null : /* @__PURE__ */ hh("button", { className: "btn pri" }, I2("radar", 16, "#FFFFFF"), "Run scan"))), /* @__PURE__ */ hh("main", { className: "content" }, /* @__PURE__ */ hh("section", { className: "row tiles" }, /* @__PURE__ */ hh("div", { className: "tile" }, /* @__PURE__ */ hh("div", { className: "tl" }, "Exposure score"), /* @__PURE__ */ hh("div", { className: "gauge", "data-bug": o.gaugeColor ? "Gauge drawn in green, spec is orange for a high score" : null }, gaugeSvg(o.gaugeColor ? "#10B981" : "#F97316")), /* @__PURE__ */ hh("div", { className: "score" }, String(SCORE.value)), /* @__PURE__ */ hh("div", { className: "of" }, "out of 100"), /* @__PURE__ */ hh("div", { className: "sr" }, /* @__PURE__ */ hh("span", { className: "pill" }, SCORE.label)), /* @__PURE__ */ hh("div", { className: "dl" }, I2("trendUp", 14, "#DC2626", 2), SCORE.delta), /* @__PURE__ */ hh("div", { className: "note" }, SCORE.note)), stats.map((s, i) => /* @__PURE__ */ hh("div", { className: "tile", "data-bug": o.swapTiles && i < 2 ? "First two stat tiles in swapped order" : null }, /* @__PURE__ */ hh("div", { className: "tl" }, s.label), /* @__PURE__ */ hh("div", { className: "kv" }, s.value), /* @__PURE__ */ hh("div", { className: "ks", style: { color: s.subColor } }, s.sub), /* @__PURE__ */ hh("div", { className: "ring" }, ringSvg(s.ring, s.ringColor), /* @__PURE__ */ hh("b", null, `${Math.round(s.ring * 100)}%`))))), /* @__PURE__ */ hh("section", { className: "row mid" }, /* @__PURE__ */ hh("div", { className: "card" }, /* @__PURE__ */ hh("div", { className: "ch" }, /* @__PURE__ */ hh("h3", null, "Exposure trend"), /* @__PURE__ */ hh("div", { className: "cr" }, TREND.series.map((s) => /* @__PURE__ */ hh("span", { className: "li" }, /* @__PURE__ */ hh("i", { style: { background: s.color } }), s.name)))), /* @__PURE__ */ hh("div", { className: "body" }, TREND.ylabels.map((t, i) => /* @__PURE__ */ hh(Frag, null, /* @__PURE__ */ hh("div", { className: "grid" + (i === 3 ? " base" : ""), style: { top: `calc(8px + (100% - 32px) * ${num(i / 3)})` } }), /* @__PURE__ */ hh("div", { className: "ylab mono", style: { top: `calc(8px + (100% - 32px) * ${num(i / 3)} - 8px)` } }, t))), /* @__PURE__ */ hh("div", { className: "plot" }, trendSvg()), TREND.xlabels.map((t, i) => /* @__PURE__ */ hh("div", { className: "xlab", style: { left: `calc(40px + (100% - 40px) * ${num(i * 7 / (TREND.days - 1))})` } }, t)))), /* @__PURE__ */ hh("div", { className: "card" }, /* @__PURE__ */ hh("div", { className: "ch" }, /* @__PURE__ */ hh("h3", null, "Exposed services"), /* @__PURE__ */ hh("div", { className: "cr muted" }, "by port")), /* @__PURE__ */ hh("div", { className: "body svc", "data-bug": o.tightServices ? "Service rows spaced 38px apart, spec is 46px" : null }, SERVICES.map(([port, name, n, col]) => /* @__PURE__ */ hh("div", null, /* @__PURE__ */ hh("div", { className: "sl" }, /* @__PURE__ */ hh("span", { className: "port mono" }, port), /* @__PURE__ */ hh("span", { className: "sn" }, name), /* @__PURE__ */ hh("span", { className: "sc mono" }, String(n))), /* @__PURE__ */ hh("div", { className: "st" }, /* @__PURE__ */ hh("i", { style: { width: `${n / 420 * 100}%`, background: col } }))))))), /* @__PURE__ */ hh("section", { className: "row low" }, /* @__PURE__ */ hh("div", { className: "card" }, /* @__PURE__ */ hh("div", { className: "ch" }, /* @__PURE__ */ hh("h3", null, "Findings by asset group"), /* @__PURE__ */ hh("div", { className: "cr muted" }, "open findings")), /* @__PURE__ */ hh("div", { className: "body" }, /* @__PURE__ */ hh("div", { className: "heat" }, /* @__PURE__ */ hh("span", null), SEVS.map(([n]) => /* @__PURE__ */ hh("span", { className: "hh" }, n.toUpperCase())), HEAT.groups.map((g, i) => /* @__PURE__ */ hh(Frag, null, /* @__PURE__ */ hh("span", { className: "hg" }, g), HEAT.counts[i].map((n, j) => {
      const t = 0.1 + 0.8 * (n / max);
      return /* @__PURE__ */ hh("span", { className: "hc mono", style: { background: mix("#FFFFFF", SEVS[j][1], t), color: t > 0.5 ? "#FFFFFF" : C2.ink } }, String(n));
    })))))), /* @__PURE__ */ hh("div", { className: "card" }, /* @__PURE__ */ hh("div", { className: "ch" }, /* @__PURE__ */ hh("h3", null, "Riskiest assets"), /* @__PURE__ */ hh("a", { className: "view" }, "View all", I2("chevronRight", 16, C2.accent))), /* @__PURE__ */ hh("div", { className: "body" }, /* @__PURE__ */ hh("div", { className: "tr thead" }, ["Asset", "Type", "Findings", "Exposure", "Last seen"].map((t, i) => /* @__PURE__ */ hh("span", { className: "cell" + (i === 4 ? " right" : "") }, t.toUpperCase()))), ASSETS.map((a, r) => {
      const [bg, fg] = TYPE_COLOR[a.type];
      return /* @__PURE__ */ hh("div", { className: "tr trow" }, /* @__PURE__ */ hh("span", { className: "cell host mono" }, a.host), /* @__PURE__ */ hh("span", { className: "cell tpc" }, /* @__PURE__ */ hh("span", { className: "tp", style: { background: bg, color: fg } }, a.type)), /* @__PURE__ */ hh("span", { className: "cell", style: { fontWeight: 600 } }, String(a.findings)), /* @__PURE__ */ hh("span", { className: "cell risk" }, /* @__PURE__ */ hh("span", { className: "rt" }, /* @__PURE__ */ hh("i", { style: { width: `${a.risk}%`, background: riskColor(a.risk) } })), /* @__PURE__ */ hh("span", { className: "rv mono" }, String(a.risk))), /* @__PURE__ */ hh("span", { className: "cell right", style: { fontSize: "12px", color: C2.muted } }, ASSET_SEEN[r]));
    }))))))));
    return page(`<title>Attack surface summary — ${BRAND2}</title>
<style>${css2(o)}</style>`, String(body));
  }

  // src/presets/landing/data.js
  var BRAND3 = "Sentinel";
  var LINKS = ["Product", "Solutions", "Pricing", "Docs", "Company"];
  var EYEBROW = { tag: "New", text: "Exposure graph is live" };
  var H1 = ["See your attack", "surface the way", "attackers see it."];
  var LEAD = ["Sentinel maps every internet-facing asset you own,", "ranks what an attacker could exploit today, and", "tells your team exactly what to fix first."];
  var TRUST = "Trusted by 2,400+ security teams";
  var AVATARS = [["#F59E0B", "AK"], ["#10B981", "MR"], ["#6366F1", "JL"]];
  var LOGOS = [["Northwind", 700, 0], ["Contoso", 600, -0.4], ["FABRIKAM", 700, 1.2], ["Tailspin", 500, 0], ["Woodgrove", 600, 0], ["LITWARE", 700, 0.8]];
  var FEATURES = [
    { icon: "radar", tint: "#6366F1", bg: "#EEF2FF", title: "Continuous discovery", text: "Find shadow IT, forgotten subdomains and exposed cloud storage within minutes of them going live, without agents." },
    { icon: "target", tint: "#F43F5E", bg: "#FFF1F2", title: "Exploitability first", text: "Every finding is tested from the outside and ranked by what an attacker could actually reach, not by CVSS alone." },
    { icon: "zap", tint: "#F59E0B", bg: "#FFFBEB", title: "Fixes that ship", text: "Route each issue to its owner in Jira or Slack with the evidence attached, and verify the fix automatically." }
  ];
  var STATS2 = [["4.2M", "assets monitored"], ["11 min", "median time to detect"], ["63%", "less alert noise"], ["99.95%", "platform uptime"]];
  var FOOT = ["Privacy", "Terms", "Status", "Security"];
  var C3 = {
    page: "#FFFFFF",
    ink: "#0F172A",
    ink2: "#475569",
    muted: "#94A3B8",
    line: "#E2E8F0",
    accent: "#4F46E5",
    dark: "#0F172A"
  };

  // src/presets/landing/mock.js
  var MOCK = { w: 600, h: 432 };
  var R3 = rng(5);
  var series = Array.from({ length: 18 }, (_, i) => 40 + 30 * Math.sin(i / 2.6) + i * 3 + R3() * 10);
  function mockMarkup(gid = "mk") {
    const s = [];
    const rect = (x, y, w, h2, r, fill, extra = "") => s.push(`<rect x="${num(x)}" y="${num(y)}" width="${num(w)}" height="${num(h2)}"${r ? ` rx="${num(r)}"` : ""} fill="${fill}"${extra}/>`);
    rect(0, 0, 600, 432, 16, "#0B1220");
    ["#F87171", "#FBBF24", "#34D399"].forEach((c, i) => s.push(`<circle cx="${22 + i * 16}" cy="20" r="5" fill="${c}"/>`));
    rect(0, 40, 600, 1, 0, "#1E293B");
    rect(0, 41, 128, 391, 0, "#111B30");
    [0, 1, 2, 3, 4, 5].forEach((i) => rect(16, 64 + i * 30, i === 1 ? 96 : 72 - i % 3 * 10, 10, 5, i === 1 ? "#6366F1" : "#1E293B"));
    const kx = 148, kw = 136;
    [["#22D3EE", 0.72], ["#F43F5E", 0.38], ["#A78BFA", 0.55]].forEach(([c, f], i) => {
      const x = kx + i * (kw + 10);
      rect(x, 60, kw, 76, 10, "#172238");
      rect(x + 12, 74, 48, 6, 3, "#334155");
      rect(x + 12, 90, 70, 14, 4, "#E2E8F0");
      rect(x + 12, 118, kw - 24, 6, 3, "#2A3650");
      rect(x + 12, 118, (kw - 24) * f, 6, 3, c);
    });
    rect(148, 148, 428, 170, 10, "#172238");
    rect(164, 162, 80, 8, 4, "#334155");
    const plot = { x: 164, y: 188, w: 396, h: 112 };
    [0, 1, 2].forEach((i) => rect(plot.x, plot.y + i * 56, plot.w, 1, 0, "#2A3650"));
    const pts = points(series, plot, 0, 140);
    s.push(`<defs><linearGradient id="${gid}" x1="0" y1="${plot.y}" x2="0" y2="${plot.y + plot.h}" gradientUnits="userSpaceOnUse"><stop stop-color="#6366F1" stop-opacity="0.45"/><stop offset="1" stop-color="#6366F1" stop-opacity="0"/></linearGradient></defs>`);
    s.push(`<path d="${areaPath(pts, plot.y + plot.h)}" fill="url(#${gid})"/>`);
    s.push(`<path d="${smoothPath(pts)}" fill="none" stroke="#818CF8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`);
    rect(148, 330, 428, 84, 10, "#172238");
    [["#F43F5E", 210], ["#FB923C", 168], ["#FACC15", 132]].forEach(([c, w], i) => {
      const y = 346 + i * 22;
      s.push(`<circle cx="168" cy="${y + 5}" r="4" fill="${c}"/>`);
      rect(182, y, w, 10, 5, "#334155");
      rect(520, y, 40, 10, 5, "#2A3650");
    });
    return s.join("");
  }

  // src/presets/landing/layout.js
  var MAXW = 1200;
  var GUT = 32;
  var NAV_H = 72;
  var HERO_TOP = 72;
  var HERO_BOTTOM = 88;
  function container(W) {
    const w = Math.min(MAXW, W - 2 * GUT);
    return { x: (W - w) / 2, w };
  }
  function layout3(W, H, o = {}) {
    const c = o.fixedWidth ? { x: 120, w: MAXW } : container(W);
    const logoW = 32 + 10 + measure("Sentinel", { size: 20, weight: 700 });
    let lx = c.x + logoW + 48;
    const links = LINKS.map((t) => {
      const w = measure(t, { size: 14.5, weight: 500 });
      const b = box(lx, 26, w, 20);
      lx += w + 32;
      return b;
    });
    const ctaW = Math.round(measure("Start free trial", { size: 14, weight: 600 })) + 36;
    const cta = box(c.x + c.w - ctaW, 16, ctaW, 40);
    const signW = measure("Sign in", { size: 14.5, weight: 500 });
    const sign = box(cta.x - 24 - signW, 26, signW, 20);
    const y0 = NAV_H + HERO_TOP;
    const [lc, rc] = tracks(c.x, c.w, ["1fr", "1.1fr"], 64);
    const tagW = Math.round(measure("New", { size: 12, weight: 600 })) + 16;
    const eyebrowW = Math.round(4 + tagW + 8 + measure("Exposure graph is live", { size: 13, weight: 500 }) + 6 + 14 + 12);
    const hero = {
      left: box(lc.x, y0, lc.w, 0),
      eyebrow: box(lc.x, y0, eyebrowW, 30),
      tagW,
      h1: box(lc.x, y0 + 30 + 24, lc.w, 180),
      lead: box(lc.x, y0 + 30 + 24 + 180 + 20, lc.w, 84)
    };
    const ctaY = hero.lead.y + 84 + 36;
    const b1W = Math.round(measure("Start free trial", { size: 15, weight: 600 })) + 68;
    const b2W = Math.round(measure("Book a demo", { size: 15, weight: 600 })) + 44;
    hero.cta1 = box(lc.x, ctaY, b1W, 48);
    hero.cta2 = box(lc.x + b1W + 12, ctaY, b2W, 48);
    hero.trust = box(lc.x, ctaY + 48 + 28, lc.w, 32);
    const mockW = rc.w, mockH = rc.w * MOCK.h / MOCK.w;
    hero.mock = box(rc.x, y0 + 8, mockW, mockH);
    const heroEnd = Math.max(hero.trust.y + 32, hero.mock.y + mockH) + HERO_BOTTOM;
    const logos = { label: box(c.x, heroEnd + 36, c.w, 18), y: heroEnd + 36 + 18 + 24, rule: heroEnd };
    const logoEnd = logos.y + 32 + 64;
    const f = { head: box(c.x, logoEnd, c.w, 44), sub: box(c.x, logoEnd + 44 + 12, c.w, 28) };
    const cardsY = f.sub.y + 28 + 48;
    f.cards = tracks(c.x, c.w, ["1fr", "1fr", "1fr"], 24).map((t) => box(t.x, cardsY, t.w, 280));
    const featEnd = cardsY + 280 + 96;
    const stats = { band: box(0, featEnd, W, 168), cols: tracks(c.x, c.w, ["1fr", "1fr", "1fr", "1fr"], 24) };
    const ctaCard = box(c.x, featEnd + 168 + 88, c.w, 248);
    const footY = ctaCard.y + 248 + 72;
    const foot = { rule: footY, row: box(c.x, footY + 24, c.w, 20) };
    const total = foot.row.y + 20 + 64;
    return { W, H, c, links, cta, sign, hero, logos, f, stats, ctaCard, foot, total };
  }
  var PAGE_H = Math.ceil(layout3(1440, 0).total);

  // src/presets/landing/design.jsx
  function Nav({ L, D }) {
    const c = L.c;
    const logo = D.linear(c.x, 20, c.x + 32, 52, [[0, "#6366F1"], [1, "#22D3EE"]]);
    return /* @__PURE__ */ h(Group, { id: "Nav" }, /* @__PURE__ */ h("rect", { x: "0", y: NAV_H - 1, width: L.W, height: "1", fill: C3.line }), /* @__PURE__ */ h("rect", { x: c.x, y: "20", width: "32", height: "32", rx: "9", fill: logo }), /* @__PURE__ */ h(Icon, { name: "shield", x: c.x + 7, y: 27, size: 18, color: "#FFFFFF", sw: 2 }), /* @__PURE__ */ h(Text, { x: c.x + 42, y: 20, size: 20, lh: 32, weight: 700, color: C3.ink, ls: -0.3 }, BRAND3), LINKS.map((t, i) => /* @__PURE__ */ h(Text, { x: L.links[i].x, y: 26, size: 14.5, lh: 20, weight: 500, color: "#334155" }, t)), /* @__PURE__ */ h(Text, { x: L.sign.x, y: 26, size: 14.5, lh: 20, weight: 500, color: C3.ink }, "Sign in"), /* @__PURE__ */ h(Box, { x: L.cta.x, y: L.cta.y, w: L.cta.w, h: 40, r: 8, fill: C3.dark }), /* @__PURE__ */ h(Text, { x: L.cta.x, y: L.cta.y + 10, width: L.cta.w, align: "center", size: 14, lh: 20, weight: 600, color: "#FFFFFF" }, "Start free trial"));
  }
  function Hero({ L, D }) {
    const hr = L.hero, e = hr.eyebrow;
    const etx = e.x + 4 + hr.tagW + 8, etw = tw(EYEBROW.text, 13, 500);
    const b1tw = tw("Start free trial", 15, 600);
    const m = hr.mock, s = m.w / MOCK.w;
    const shadow = D.shadow({ x: m.x, y: m.y, w: m.w, h: m.h }, [{ dy: 24, blur: 48, color: "#0F172A", opacity: 0.16 }]);
    const tx = hr.trust.x;
    return /* @__PURE__ */ h(Group, { id: "Hero" }, /* @__PURE__ */ h(Box, { x: e.x, y: e.y, w: e.w, h: 30, r: 15, fill: "#EEF2FF" }), /* @__PURE__ */ h(Box, { x: e.x + 4, y: e.y + 4, w: hr.tagW, h: 22, r: 11, fill: C3.accent }), /* @__PURE__ */ h(Text, { x: e.x + 4, y: e.y + 4, width: hr.tagW, align: "center", size: 12, lh: 22, weight: 600, color: "#FFFFFF" }, EYEBROW.tag), /* @__PURE__ */ h(Text, { x: etx, y: e.y + 5, size: 13, lh: 20, weight: 500, color: "#4338CA" }, EYEBROW.text), /* @__PURE__ */ h(Icon, { name: "arrowRight", x: etx + etw + 6, y: e.y + 8, size: 14, color: "#4338CA", sw: 2 }), /* @__PURE__ */ h(Text, { x: hr.h1.x, y: hr.h1.y, size: 52, lh: 60, weight: 600, color: C3.ink, ls: -1.2 }, H1.join("\n")), /* @__PURE__ */ h(Text, { x: hr.lead.x, y: hr.lead.y, size: 18, lh: 28, weight: 400, color: C3.ink2 }, LEAD.join("\n")), /* @__PURE__ */ h(Box, { x: hr.cta1.x, y: hr.cta1.y, w: hr.cta1.w, h: 48, r: 10, fill: C3.dark }), /* @__PURE__ */ h(Text, { x: hr.cta1.x + 22, y: hr.cta1.y + 14, size: 15, lh: 20, weight: 600, color: "#FFFFFF" }, "Start free trial"), /* @__PURE__ */ h(Icon, { name: "arrowRight", x: hr.cta1.x + 22 + b1tw + 8, y: hr.cta1.y + 15, size: 18, color: "#FFFFFF", sw: 2 }), /* @__PURE__ */ h(Box, { x: hr.cta2.x, y: hr.cta2.y, w: hr.cta2.w, h: 48, r: 10, fill: "#FFFFFF", stroke: "#CBD5E1" }), /* @__PURE__ */ h(Text, { x: hr.cta2.x, y: hr.cta2.y + 14, width: hr.cta2.w, align: "center", size: 15, lh: 20, weight: 600, color: C3.ink }, "Book a demo"), AVATARS.map(([col, ini], i) => /* @__PURE__ */ h(Fragment, null, /* @__PURE__ */ h("circle", { cx: tx + i * 24 + 16, cy: hr.trust.y + 16, r: "17", fill: "#FFFFFF" }), /* @__PURE__ */ h("circle", { cx: tx + i * 24 + 16, cy: hr.trust.y + 16, r: "16", fill: col }), /* @__PURE__ */ h(Text, { x: tx + i * 24, y: hr.trust.y + 8, width: 32, align: "center", size: 11, lh: 16, weight: 700, color: "#FFFFFF" }, ini))), /* @__PURE__ */ h(Text, { x: tx + 92, y: hr.trust.y + 6, size: 14, lh: 20, weight: 500, color: C3.ink2 }, TRUST), /* @__PURE__ */ h("g", { filter: shadow }, /* @__PURE__ */ h("rect", { x: num(m.x), y: num(m.y), width: num(m.w), height: num(m.h), rx: num(16 * s), fill: "#0B1220" })), /* @__PURE__ */ h("g", { id: "Product_screenshot", transform: `translate(${num(m.x)} ${num(m.y)}) scale(${+s.toFixed(5)})` }, mockMarkup("paint_mock_" + D.node)));
  }
  function Logos({ L }) {
    const c = L.c, lg = L.logos;
    const ws = LOGOS.map(([t, wgt, ls]) => tw(t, 22, wgt, "inter", ls));
    const gap = (c.w - ws.reduce((a, b) => a + b, 0)) / (LOGOS.length - 1);
    let x = c.x;
    return /* @__PURE__ */ h(Group, { id: "Logos" }, /* @__PURE__ */ h("rect", { x: c.x, y: lg.rule, width: c.w, height: "1", fill: C3.line }), /* @__PURE__ */ h(Text, { x: c.x, y: lg.label.y, width: c.w, align: "center", size: 12.5, lh: 18, weight: 600, color: C3.muted, ls: 1.2 }, "TRUSTED BY SECURITY TEAMS AT"), LOGOS.map(([t, wgt, ls], i) => {
      const el = /* @__PURE__ */ h(Text, { x, y: lg.y, size: 22, lh: 32, weight: wgt, color: "#94A3B8", ls }, t);
      x += ws[i] + gap;
      return el;
    }));
  }
  function Features({ L }) {
    const c = L.c, f = L.f;
    return /* @__PURE__ */ h(Group, { id: "Features" }, /* @__PURE__ */ h(Text, { x: c.x, y: f.head.y, width: c.w, align: "center", size: 36, lh: 44, weight: 600, color: C3.ink, ls: -0.6 }, "Everything between discovery and fix"), /* @__PURE__ */ h(Text, { x: c.x, y: f.sub.y, width: c.w, align: "center", size: 17, lh: 28, weight: 400, color: C3.ink2 }, "One platform from the first scan to the verified fix."), FEATURES.map((ft, i) => {
      const b = f.cards[i];
      const lw = tw("Learn more", 14.5, 600);
      return /* @__PURE__ */ h(Group, { id: `Feature/${ft.title}` }, /* @__PURE__ */ h(Box, { x: b.x, y: b.y, w: b.w, h: b.h, r: 16, fill: "#FFFFFF", stroke: C3.line }), /* @__PURE__ */ h(Box, { x: b.x + 28, y: b.y + 28, w: 44, h: 44, r: 12, fill: ft.bg }), /* @__PURE__ */ h(Icon, { name: ft.icon, x: b.x + 39, y: b.y + 39, size: 22, color: ft.tint, sw: 2 }), /* @__PURE__ */ h(Text, { x: b.x + 28, y: b.y + 92, size: 18, lh: 26, weight: 600, color: C3.ink }, ft.title), /* @__PURE__ */ h(Text, { x: b.x + 28, y: b.y + 126, width: b.w - 56, size: 15, lh: 24, weight: 400, color: C3.ink2 }, ft.text), /* @__PURE__ */ h(Text, { x: b.x + 28, y: b.y + b.h - 48, size: 14.5, lh: 20, weight: 600, color: C3.accent }, "Learn more"), /* @__PURE__ */ h(Icon, { name: "arrowRight", x: b.x + 28 + lw + 6, y: b.y + b.h - 46, size: 16, color: C3.accent, sw: 2 }));
    }));
  }
  function Stats({ L }) {
    const st = L.stats;
    return /* @__PURE__ */ h(Group, { id: "Stats" }, /* @__PURE__ */ h(Box, { x: 0, y: st.band.y, w: L.W, h: st.band.h, fill: C3.dark }), STATS2.map(([v, l], i) => /* @__PURE__ */ h(Fragment, null, /* @__PURE__ */ h(Text, { x: st.cols[i].x, y: st.band.y + 44, width: st.cols[i].w, align: "center", size: 40, lh: 48, weight: 700, color: "#FFFFFF", ls: -0.8 }, v), /* @__PURE__ */ h(Text, { x: st.cols[i].x, y: st.band.y + 100, width: st.cols[i].w, align: "center", size: 14.5, lh: 20, weight: 400, color: "#94A3B8" }, l))));
  }
  function Closing({ L, D }) {
    const b = L.ctaCard;
    const bw = Math.round(tw("Scan my domains", 15, 600)) + 48;
    const grad = D.linear(b.x, b.y, b.x + b.w, b.y, [[0, "#4F46E5"], [1, "#7C3AED"]]);
    return /* @__PURE__ */ h(Group, { id: "Call to action" }, /* @__PURE__ */ h("rect", { x: num(b.x), y: num(b.y), width: num(b.w), height: num(b.h), rx: "24", fill: grad }), /* @__PURE__ */ h(Text, { x: b.x, y: b.y + 52, width: b.w, align: "center", size: 32, lh: 40, weight: 600, color: "#FFFFFF", ls: -0.5 }, "Find your exposure before someone else does"), /* @__PURE__ */ h(Text, { x: b.x, y: b.y + 104, width: b.w, align: "center", size: 16.5, lh: 26, weight: 400, color: "#E0E7FF" }, "Start a free scan of your domains. Results in under an hour."), /* @__PURE__ */ h(Box, { x: b.x + (b.w - bw) / 2, y: b.y + 156, w: bw, h: 46, r: 10, fill: "#FFFFFF" }), /* @__PURE__ */ h(Text, { x: b.x + (b.w - bw) / 2, y: b.y + 169, width: bw, align: "center", size: 15, lh: 20, weight: 600, color: C3.accent }, "Scan my domains"));
  }
  function Footer({ L }) {
    const c = L.c, f = L.foot;
    let x = c.x + c.w;
    const links = [];
    for (let i = FOOT.length - 1; i >= 0; i--) {
      x -= tw(FOOT[i], 13.5, 500);
      links.push(/* @__PURE__ */ h(Text, { x, y: f.row.y, size: 13.5, lh: 20, weight: 500, color: C3.ink2 }, FOOT[i]));
      x -= 28;
    }
    return /* @__PURE__ */ h(Group, { id: "Footer" }, /* @__PURE__ */ h("rect", { x: c.x, y: f.rule, width: c.w, height: "1", fill: C3.line }), /* @__PURE__ */ h(Text, { x: c.x, y: f.row.y, size: 13.5, lh: 20, weight: 400, color: C3.muted }, "© 2026 Sentinel Labs, Inc."), links);
  }
  function landingDesign({ W = 1440, H = PAGE_H } = {}) {
    const L = layout3(W, H);
    const D = doc("Sentinel landing page", W, H);
    return D.svg(/* @__PURE__ */ h(Fragment, null, /* @__PURE__ */ h(Nav, { L, D }), /* @__PURE__ */ h(Hero, { L, D }), /* @__PURE__ */ h(Logos, { L }), /* @__PURE__ */ h(Features, { L }), /* @__PURE__ */ h(Stats, { L }), /* @__PURE__ */ h(Closing, { L, D }), /* @__PURE__ */ h(Footer, { L })), C3.page);
  }

  // src/presets/landing/build.jsx
  var UI3 = `'Trebuchet MS', 'DejaVu Sans', Verdana, sans-serif`;
  var I3 = (name, size, color2, sw) => raw(iconHtml(name, size, color2, sw));
  var css3 = (o) => `
*{box-sizing:border-box;margin:0;padding:0}
body{background:#FFFFFF;color:${C3.ink};font-family:${UI3};overflow:hidden}
a{color:inherit;text-decoration:none}
button{font:inherit;border:0;background:none;color:inherit}
.wrap{${o.fixedWidth ? "width:1264px;margin:0 0 0 88px" : "max-width:1264px;margin:0 auto"};padding:0 32px}
.nav{height:${o.tallNav ? 88 : 72}px;box-shadow:inset 0 -1px 0 ${C3.line}}
.banner{height:40px;background:#312E81;color:#E0E7FF;display:flex;align-items:center;justify-content:center;gap:8px;font-size:13.5px;line-height:20px;font-weight:500;white-space:nowrap}
.banner b{color:#FFFFFF;font-weight:600}
.nav .wrap{height:100%;display:flex;align-items:center}
.logo{width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,#6366F1,#22D3EE);display:flex;align-items:center;justify-content:center;flex:none}
.word{margin-left:10px;font-size:20px;line-height:32px;font-weight:700;letter-spacing:-.3px}
.links{margin-left:48px;display:flex;gap:32px;font-size:14.5px;line-height:20px;font-weight:500;color:#334155;white-space:nowrap}
.sign{margin-left:auto;font-size:14.5px;line-height:20px;font-weight:500;white-space:nowrap}
.navcta{margin-left:24px;height:40px;padding:0 18px;border-radius:8px;background:${C3.dark};color:#FFFFFF;font-size:14px;line-height:40px;font-weight:600;white-space:nowrap}
.hero{padding:72px 0 88px}
.hero .wrap{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);column-gap:64px;align-items:start}
.eyebrow{display:inline-flex;align-items:center;height:30px;border-radius:15px;background:#EEF2FF;padding:0 12px 0 4px;color:#4338CA;font-size:13px;line-height:20px;font-weight:500;white-space:nowrap}
.eyebrow b{height:22px;padding:0 8px;border-radius:11px;background:${C3.accent};color:#FFFFFF;font-size:12px;line-height:22px;font-weight:600;margin-right:8px}
.eyebrow svg{margin-left:6px}
h1{margin-top:24px;font-size:52px;line-height:60px;font-weight:600;letter-spacing:-1.2px;white-space:nowrap}
.lead{margin-top:${o.heroGap ? 44 : 20}px;font-size:18px;line-height:28px;color:${C3.ink2};white-space:nowrap}
.ctas{margin-top:36px;display:flex;gap:12px}
.btn{height:48px;border-radius:10px;display:inline-flex;align-items:center;font-size:15px;line-height:20px;font-weight:600;white-space:nowrap}
.btn.pri{background:${C3.dark};color:#FFFFFF;padding:0 20px 0 22px;gap:8px${o.ctaPill ? ";border-radius:24px" : ""}}
.btn.sec{background:#FFFFFF;border:1px solid #CBD5E1;padding:0 21px}
.trust{margin-top:28px;height:32px;display:flex;align-items:center}
.av{width:32px;height:32px;border-radius:50%;box-shadow:0 0 0 1px #FFFFFF;color:#FFFFFF;font-size:11px;line-height:16px;font-weight:700;display:flex;align-items:center;justify-content:center;flex:none}
.av+.av{margin-left:-8px}
.trust .tt{margin-left:12px;font-size:14px;line-height:20px;font-weight:500;color:${C3.ink2};white-space:nowrap}
.mock{margin-top:8px;border-radius:16px;overflow:hidden;box-shadow:0 24px 48px rgba(15,23,42,.16);line-height:0}
.mock svg{display:block;width:100%;height:auto}
.strip{border-top:1px solid ${C3.line};padding:35px 0 64px}
.strip p{text-align:center;font-size:12.5px;line-height:18px;font-weight:600;letter-spacing:1.2px;color:${C3.muted}}
.marks{margin-top:24px;height:32px;display:flex;${o.logosLeft ? "gap:56px" : "justify-content:space-between"};font-size:22px;line-height:32px;color:#94A3B8;white-space:nowrap}
.feat{padding-bottom:96px}
.feat h2{text-align:${o.h2Left ? "left" : "center"};font-size:36px;line-height:44px;font-weight:600;letter-spacing:-.6px}
.feat .sub{margin-top:12px;text-align:center;font-size:17px;line-height:28px;color:${C3.ink2}}
.cards{margin-top:48px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}
.card{height:280px;border:1px solid ${C3.line};border-radius:16px;padding:27px;display:flex;flex-direction:column}
.tile{flex:none;width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center}
.card h3{flex:none;margin-top:20px;font-size:18px;line-height:26px;font-weight:600}
.card p{flex:none;margin-top:8px;font-size:15px;line-height:24px;color:${C3.ink2}}
.more{margin-top:auto;display:flex;align-items:center;gap:6px;font-size:14.5px;line-height:20px;font-weight:600;color:${C3.accent}}
.stats{height:168px;background:${C3.dark}}
.stats .wrap{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));column-gap:24px;padding-top:44px;text-align:center}
.stats b{display:block;font-size:40px;line-height:48px;font-weight:700;letter-spacing:-.8px;color:${o.statsIndigo ? "#A5B4FC" : "#FFFFFF"}}
.stats span{display:block;margin-top:8px;font-size:14.5px;line-height:20px;color:#94A3B8}
.closing{padding-top:88px}
.cta{height:248px;border-radius:24px;background:linear-gradient(90deg,#4F46E5,#7C3AED);padding-top:52px;text-align:center;color:#FFFFFF}
.cta h2{font-size:32px;line-height:40px;font-weight:600;letter-spacing:-.5px;white-space:nowrap}
.cta p{margin-top:12px;font-size:16.5px;line-height:26px;color:#E0E7FF;white-space:nowrap}
.cta .btn{margin-top:26px;height:46px;padding:0 24px;background:#FFFFFF;color:${C3.accent}}
.foot{padding-top:72px;padding-bottom:64px}
.frow{border-top:1px solid ${C3.line};padding-top:23px;display:flex;font-size:13.5px;line-height:20px}
.frow span{color:${C3.muted}}
.flinks{margin-left:auto;display:flex;gap:28px;font-weight:500;color:${C3.ink2}}
`;
  function landingBuild(o = {}) {
    const body = /* @__PURE__ */ hh("body", null, o.banner ? /* @__PURE__ */ hh("div", { className: "banner", "data-bug": "Announcement bar that is not in the design" }, I3("zap", 14, "#FDE68A", 2), /* @__PURE__ */ hh("b", null, "Exposure graph is live."), "Read the launch post", I3("arrowRight", 14, "#E0E7FF", 2)) : null, /* @__PURE__ */ hh("header", { className: "nav", "data-bug": o.tallNav ? "Nav bar 88px tall, spec is 72px" : null }, /* @__PURE__ */ hh("div", { className: "wrap" }, /* @__PURE__ */ hh("span", { className: "logo" }, I3("shield", 18, "#FFFFFF", 2)), /* @__PURE__ */ hh("span", { className: "word" }, BRAND3), /* @__PURE__ */ hh("nav", { className: "links" }, LINKS.map((t) => /* @__PURE__ */ hh("a", null, t))), /* @__PURE__ */ hh("a", { className: "sign" }, "Sign in"), /* @__PURE__ */ hh("a", { className: "navcta" }, "Start free trial"))), /* @__PURE__ */ hh("section", { className: "hero" }, /* @__PURE__ */ hh("div", { className: "wrap" }, /* @__PURE__ */ hh("div", null, /* @__PURE__ */ hh("a", { className: "eyebrow" }, /* @__PURE__ */ hh("b", null, EYEBROW.tag), EYEBROW.text, I3("arrowRight", 14, "#4338CA", 2)), /* @__PURE__ */ hh("h1", null, H1.map((l, i) => /* @__PURE__ */ hh(Frag, null, i ? /* @__PURE__ */ hh("br", null) : null, l))), /* @__PURE__ */ hh("p", { className: "lead", "data-bug": o.heroGap ? "Lead paragraph 44px below the headline, spec is 20px" : null }, LEAD.map((l, i) => /* @__PURE__ */ hh(Frag, null, i ? /* @__PURE__ */ hh("br", null) : null, l))), /* @__PURE__ */ hh("div", { className: "ctas" }, /* @__PURE__ */ hh("a", { className: "btn pri", "data-bug": o.ctaPill ? "Primary button fully rounded, spec has 10px corners" : o.longCta ? 'Button reads "Start your 14-day free trial", spec is "Start free trial"' : null }, o.longCta ? "Start your 14-day free trial" : "Start free trial", I3("arrowRight", 18, "#FFFFFF", 2)), /* @__PURE__ */ hh("a", { className: "btn sec" }, "Book a demo")), /* @__PURE__ */ hh("div", { className: "trust" }, AVATARS.map(([c, ini]) => /* @__PURE__ */ hh("span", { className: "av", style: { background: c } }, ini)), /* @__PURE__ */ hh("span", { className: "tt" }, TRUST))), /* @__PURE__ */ hh("div", { className: "mock", role: "img", "aria-label": "Product screenshot" }, raw(`<svg viewBox="0 0 600 432">${mockMarkup("mockfill")}</svg>`)))), /* @__PURE__ */ hh("section", { className: "wrap" }, /* @__PURE__ */ hh("div", { className: "strip" }, /* @__PURE__ */ hh("p", null, "TRUSTED BY SECURITY TEAMS AT"), /* @__PURE__ */ hh("div", { className: "marks", "data-bug": o.logosLeft ? "Logos packed to the left, spec spreads them across the row" : null }, LOGOS.map(([t, w, ls]) => /* @__PURE__ */ hh("span", { style: { fontWeight: w, letterSpacing: ls ? `${ls}px` : null } }, t))))), /* @__PURE__ */ hh("section", { className: "wrap feat" }, /* @__PURE__ */ hh("h2", { "data-bug": o.h2Left ? "Section heading left-aligned, spec is centered" : null }, "Everything between discovery and fix"), /* @__PURE__ */ hh("p", { className: "sub" }, "One platform from the first scan to the verified fix."), /* @__PURE__ */ hh("div", { className: "cards" }, FEATURES.map((f, i) => /* @__PURE__ */ hh("article", { className: "card" }, /* @__PURE__ */ hh("span", { className: "tile", style: { background: f.bg } }, I3(f.icon, 22, f.tint, 2)), /* @__PURE__ */ hh("h3", null, f.title), /* @__PURE__ */ hh("p", null, f.text), o.noLink3 && i === 2 ? null : /* @__PURE__ */ hh("a", { className: "more" }, "Learn more", I3("arrowRight", 16, C3.accent, 2)))))), /* @__PURE__ */ hh("section", { className: "stats", "data-bug": o.statsIndigo ? "Stat values tinted indigo, spec is white" : null }, /* @__PURE__ */ hh("div", { className: "wrap" }, STATS2.map(([v, l]) => /* @__PURE__ */ hh("div", null, /* @__PURE__ */ hh("b", null, v), /* @__PURE__ */ hh("span", null, l))))), /* @__PURE__ */ hh("section", { className: "wrap closing" }, /* @__PURE__ */ hh("div", { className: "cta" }, /* @__PURE__ */ hh("h2", null, "Find your exposure before someone else does"), /* @__PURE__ */ hh("p", null, "Start a free scan of your domains. Results in under an hour."), /* @__PURE__ */ hh("a", { className: "btn" }, "Scan my domains"))), /* @__PURE__ */ hh("footer", { className: "wrap foot" }, /* @__PURE__ */ hh("div", { className: "frow" }, /* @__PURE__ */ hh("span", null, "© 2026 Sentinel Labs, Inc."), /* @__PURE__ */ hh("nav", { className: "flinks" }, FOOT.map((t) => /* @__PURE__ */ hh("a", null, t))))));
    return page(`<title>${BRAND3} — attack surface management</title>
<style>${css3(o)}</style>`, String(body));
  }

  // src/presets/product/data.js
  var BRAND4 = "NORTHBOUND";
  var PROMO = "Free shipping on orders over $75 · 30-day returns";
  var NAV3 = [["New"], ["Men"], ["Women"], ["Packs"], ["Camp"], ["Sale", true]];
  var CRUMBS = ["Home", "Packs", "Daypacks", "Ridgeline 28L"];
  var PRODUCT = {
    kicker: "DAYPACKS",
    title: "Ridgeline 28L Daypack",
    rating: 4.6,
    reviews: "1,284 reviews",
    price: "$136",
    was: "$170",
    save: "Save 20%",
    color: "Slate blue"
  };
  var SWATCHES = [["Slate blue", "#4B6584"], ["Olive", "#6B7A3A"], ["Rust", "#B4532A"], ["Charcoal", "#2F3237"], ["Sand", "#CDBB98"]];
  var SIZES = [["S/M", 'Torso 15–18"'], ["M/L", 'Torso 17–20"'], ["L/XL", 'Torso 19–22"', true]];
  var PERKS = [["truck", "Free delivery by Thu, Oct 16"], ["refresh", "Free 30-day returns"], ["shield", "Lifetime warranty"]];
  var FOLDS = ["Details", "Materials & care", "Reviews (1,284)"];
  var C4 = {
    page: "#FFFFFF",
    promo: "#1C1917",
    ink: "#1C1917",
    ink2: "#57534E",
    muted: "#A8A29E",
    line: "#E7E5E4",
    soft: "#F5F5F4",
    accent: "#1C1917",
    sale: "#B91C1C",
    green: "#15803D",
    greenSoft: "#DCFCE7"
  };

  // src/presets/product/layout.js
  var MAXW2 = 1440;
  var GUT2 = 48;
  var PROMO_H = 36;
  var HEAD_H = 72;
  var INFO_W = 480;
  var COL_GAP = 64;
  function layout4(W, H) {
    const outer = Math.min(W, MAXW2);
    const c = { x: (W - outer) / 2 + GUT2, w: outer - 2 * GUT2 };
    const hy = PROMO_H;
    const logoW = measure("NORTHBOUND", { size: 18, weight: 700, ls: 2.5 });
    let lx = c.x + logoW + 56;
    const links = NAV3.map(([t]) => {
      const w = measure(t, { size: 14.5, weight: 500 });
      const b = box(lx, hy + 26, w, 20);
      lx += w + 28;
      return b;
    });
    const right = c.x + c.w;
    const icons = [box(right - 22, hy + 25, 22, 22), box(right - 64, hy + 25, 22, 22), box(right - 106, hy + 25, 22, 22)];
    const search = box(right - 106 - 24 - 260, hy + 16, 260, 40);
    const crumbY = PROMO_H + HEAD_H + 24;
    const top = crumbY + 20 + 24;
    const gal = box(c.x, top, c.w - INFO_W - COL_GAP, 0);
    const imgW = gal.w - 72 - 16;
    const img = box(gal.x + 88, top, imgW, imgW);
    const thumbs = [0, 1, 2, 3].map((i) => box(gal.x, top + i * 100, 72, 88));
    const ix = c.x + c.w - INFO_W;
    const info = {
      x: ix,
      w: INFO_W,
      kicker: top,
      title: top + 24,
      rating: top + 76,
      price: top + 116,
      rule: top + 176,
      colorLabel: top + 201,
      swatches: top + 233,
      sizeLabel: top + 297,
      sizes: top + 329,
      cart: top + 405,
      perks: top + 481,
      folds: top + 641
    };
    info.sizeCells = tracks(ix, INFO_W, SIZES.map(() => "1fr"), 10);
    return { W, H, c, links, icons, search, crumbY, gal, img, thumbs, info };
  }
  var PAGE_H2 = 1024;

  // src/presets/product/art.js
  var ART = { w: 400, h: 500 };
  function backpack(color2) {
    const dark = mix(color2, "#000000", 0.22), light = mix(color2, "#FFFFFF", 0.14);
    return [
      `<ellipse cx="200" cy="472" rx="124" ry="14" fill="#000000" fill-opacity="0.08"/>`,
      `<path d="M168 76Q200 26 232 76" stroke="${dark}" stroke-width="12" stroke-linecap="round" fill="none"/>`,
      `<rect x="68" y="196" width="26" height="206" rx="11" fill="${dark}"/>`,
      `<rect x="306" y="196" width="26" height="206" rx="11" fill="${dark}"/>`,
      `<rect x="90" y="70" width="220" height="392" rx="72" fill="${color2}"/>`,
      `<rect x="90" y="70" width="220" height="124" rx="62" fill="${dark}"/>`,
      `<rect x="188" y="150" width="24" height="70" rx="6" fill="${dark}"/>`,
      `<rect x="182" y="208" width="36" height="20" rx="5" fill="#292524"/>`,
      `<rect x="120" y="270" width="160" height="152" rx="40" fill="${light}"/>`,
      `<rect x="142" y="292" width="116" height="5" rx="2.5" fill="${dark}"/>`,
      `<rect x="180" y="344" width="40" height="24" rx="5" fill="#292524"/>`
    ].join("");
  }
  function starsMarkup(value, gid) {
    const pts = (cx) => Array.from({ length: 10 }, (_, k) => {
      const r = k % 2 ? 3.4 : 8, a = Math.PI / 5 * k - Math.PI / 2;
      return `${num(cx + r * Math.cos(a))},${num(8.6 + r * Math.sin(a))}`;
    }).join(" ");
    let s = "";
    for (let i = 0; i < 5; i++) {
      const cx = 8 + i * 18, f = Math.max(0, Math.min(1, value - i));
      if (f >= 1) s += `<polygon points="${pts(cx)}" fill="#F59E0B"/>`;
      else if (f <= 0) s += `<polygon points="${pts(cx)}" fill="#E7E5E4"/>`;
      else {
        const x0 = cx - 8, x1 = cx + 8, at = num(x0 + 16 * f);
        s += `<defs><linearGradient id="${gid}" x1="${num(x0)}" y1="0" x2="${num(x1)}" y2="0" gradientUnits="userSpaceOnUse"><stop offset="${num(f)}" stop-color="#F59E0B"/><stop offset="${num(f)}" stop-color="#E7E5E4"/></linearGradient></defs><polygon points="${pts(cx)}" fill="url(#${gid})"/>`;
        void at;
      }
    }
    return s;
  }

  // src/presets/product/design.jsx
  function Top({ L }) {
    const c = L.c, y = PROMO_H;
    const s = L.search;
    return /* @__PURE__ */ h(Group, { id: "Header" }, /* @__PURE__ */ h(Box, { x: 0, y: 0, w: L.W, h: PROMO_H, fill: C4.promo }), /* @__PURE__ */ h(Text, { x: 0, y: 8, width: L.W, align: "center", size: 12.5, lh: 20, weight: 500, color: "#FAFAF9" }, PROMO), /* @__PURE__ */ h("rect", { x: "0", y: PROMO_H + HEAD_H - 1, width: L.W, height: "1", fill: C4.line }), /* @__PURE__ */ h(Text, { x: c.x, y: y + 22, size: 18, lh: 28, weight: 700, color: C4.ink, ls: 2.5 }, BRAND4), NAV3.map(([t, sale], i) => /* @__PURE__ */ h(Text, { x: L.links[i].x, y: y + 26, size: 14.5, lh: 20, weight: 500, color: sale ? C4.sale : C4.ink }, t)), /* @__PURE__ */ h(Box, { x: s.x, y: s.y, w: s.w, h: 40, r: 10, fill: C4.soft }), /* @__PURE__ */ h(Icon, { name: "search", x: s.x + 14, y: s.y + 11, size: 18, color: C4.ink2 }), /* @__PURE__ */ h(Text, { x: s.x + 42, y: s.y + 10, size: 14, lh: 20, weight: 400, color: C4.muted }, "Search gear"), /* @__PURE__ */ h(Icon, { name: "user", x: L.icons[2].x, y: L.icons[2].y, size: 22, color: C4.ink }), /* @__PURE__ */ h(Icon, { name: "heart", x: L.icons[1].x, y: L.icons[1].y, size: 22, color: C4.ink }), /* @__PURE__ */ h(Icon, { name: "cart", x: L.icons[0].x, y: L.icons[0].y, size: 22, color: C4.ink }), /* @__PURE__ */ h("circle", { cx: L.icons[0].x + 21, cy: L.icons[0].y + 1, r: "8", fill: C4.sale }), /* @__PURE__ */ h(Text, { x: L.icons[0].x + 13, y: L.icons[0].y - 6, width: 16, align: "center", size: 10, lh: 14, weight: 700, color: "#FFFFFF" }, "2"));
  }
  function Crumbs({ L }) {
    let x = L.c.x;
    const out = [];
    CRUMBS.forEach((t, i) => {
      const last = i === CRUMBS.length - 1;
      out.push(/* @__PURE__ */ h(Text, { x, y: L.crumbY, size: 13, lh: 20, weight: last ? 500 : 400, color: last ? C4.ink : C4.ink2 }, t));
      x += tw(t, 13, last ? 500 : 400);
      if (!last) {
        out.push(/* @__PURE__ */ h(Text, { x: x + 8, y: L.crumbY, size: 13, lh: 20, weight: 400, color: C4.muted }, "/"));
        x += 8 + tw("/", 13) + 8;
      }
    });
    return /* @__PURE__ */ h(Group, { id: "Breadcrumb" }, out);
  }
  function Gallery({ L, D }) {
    const im = L.img, s = Math.min(im.w / ART.w, im.h / ART.h) * 0.78;
    const ox = im.x + (im.w - ART.w * s) / 2, oy = im.y + (im.h - ART.h * s) / 2;
    return /* @__PURE__ */ h(Group, { id: "Gallery" }, L.thumbs.map((t, i) => {
      const ts = Math.min(t.w / ART.w, t.h / ART.h) * 0.8;
      return /* @__PURE__ */ h(Fragment, null, /* @__PURE__ */ h(Box, { x: t.x, y: t.y, w: t.w, h: t.h, r: 10, fill: C4.soft, stroke: i === 0 ? C4.ink : null, sw: 2 }), /* @__PURE__ */ h("g", { transform: `translate(${num(t.x + (t.w - ART.w * ts) / 2)} ${num(t.y + (t.h - ART.h * ts) / 2)}) scale(${+ts.toFixed(5)})` }, backpack(SWATCHES[i][1])));
    }), /* @__PURE__ */ h(Box, { x: im.x, y: im.y, w: im.w, h: im.h, r: 16, fill: C4.soft }), /* @__PURE__ */ h("g", { id: "Product_photo", transform: `translate(${num(ox)} ${num(oy)}) scale(${+s.toFixed(5)})` }, backpack(SWATCHES[0][1])), /* @__PURE__ */ h(Box, { x: im.x + 20, y: im.y + 20, w: Math.round(tw("−20%", 12.5, 600)) + 24, h: 28, r: 14, fill: C4.sale }), /* @__PURE__ */ h(Text, { x: im.x + 20, y: im.y + 24, width: Math.round(tw("−20%", 12.5, 600)) + 24, align: "center", size: 12.5, lh: 20, weight: 600, color: "#FFFFFF" }, "−20%"), /* @__PURE__ */ h("circle", { cx: im.x + im.w - 40, cy: im.y + 40, r: "20", fill: "#FFFFFF" }), /* @__PURE__ */ h(Icon, { name: "heart", x: im.x + im.w - 50, y: im.y + 30, size: 20, color: C4.ink }));
  }
  function Info({ L, D }) {
    const f = L.info, x = f.x, w = INFO_W;
    const out = [];
    out.push(/* @__PURE__ */ h(Text, { x, y: f.kicker, size: 12, lh: 16, weight: 600, color: C4.muted, ls: 1.4 }, PRODUCT.kicker));
    out.push(/* @__PURE__ */ h(Text, { x, y: f.title, size: 32, lh: 40, weight: 600, color: C4.ink, ls: -0.6 }, PRODUCT.title));
    out.push(/* @__PURE__ */ h("g", { transform: `translate(${num(x)} ${num(f.rating + 2)})` }, starsMarkup(PRODUCT.rating, "paint_star_" + D.node)));
    const rx = x + 88 + 8;
    out.push(/* @__PURE__ */ h(Text, { x: rx, y: f.rating, size: 13.5, lh: 20, weight: 600, color: C4.ink }, String(PRODUCT.rating)));
    const r2 = rx + tw(String(PRODUCT.rating), 13.5, 600) + 6;
    out.push(/* @__PURE__ */ h(Text, { x: r2, y: f.rating, size: 13.5, lh: 20, weight: 400, color: C4.muted }, "·"));
    const r3 = r2 + tw("·", 13.5) + 6, rw = tw(PRODUCT.reviews, 13.5);
    out.push(/* @__PURE__ */ h(Text, { x: r3, y: f.rating, size: 13.5, lh: 20, weight: 400, color: C4.ink2 }, PRODUCT.reviews), /* @__PURE__ */ h("rect", { x: num(r3), y: f.rating + 17, width: num(rw), height: "1", fill: C4.ink2 }));
    const pw = tw(PRODUCT.price, 28, 600), ww = tw(PRODUCT.was, 18, 400);
    out.push(/* @__PURE__ */ h(Text, { x, y: f.price, size: 28, lh: 36, weight: 600, color: C4.ink }, PRODUCT.price));
    out.push(/* @__PURE__ */ h(Text, { x: x + pw + 12, y: f.price, size: 18, lh: 36, weight: 400, color: C4.muted }, PRODUCT.was), /* @__PURE__ */ h("rect", { x: num(x + pw + 12), y: f.price + 18, width: num(ww), height: "1.5", fill: C4.muted }));
    const sw = Math.round(tw(PRODUCT.save, 12.5, 600)) + 20;
    out.push(/* @__PURE__ */ h(Box, { x: x + pw + 12 + ww + 12, y: f.price + 5, w: sw, h: 26, r: 13, fill: C4.greenSoft }), /* @__PURE__ */ h(Text, { x: x + pw + 12 + ww + 12, y: f.price + 8, width: sw, align: "center", size: 12.5, lh: 20, weight: 600, color: C4.green }, PRODUCT.save));
    out.push(/* @__PURE__ */ h("rect", { x: num(x), y: f.rule, width: w, height: "1", fill: C4.line }));
    out.push(/* @__PURE__ */ h(Text, { x, y: f.colorLabel, size: 13.5, lh: 20, weight: 600, color: C4.ink }, "Color"));
    out.push(/* @__PURE__ */ h(Text, { x: x + tw("Color", 13.5, 600) + 6, y: f.colorLabel, size: 13.5, lh: 20, weight: 400, color: C4.ink2 }, `— ${PRODUCT.color}`));
    SWATCHES.forEach(([, col], i) => {
      const cx = x + 18 + i * 48, cy2 = f.swatches + 18;
      if (i === 0) out.push(/* @__PURE__ */ h("circle", { cx, cy: cy2, r: "21", stroke: C4.ink, strokeWidth: "2" }));
      out.push(/* @__PURE__ */ h("circle", { cx, cy: cy2, r: "18", fill: col }));
    });
    out.push(/* @__PURE__ */ h(Text, { x, y: f.sizeLabel, size: 13.5, lh: 20, weight: 600, color: C4.ink }, "Size"));
    const gw = tw("Size guide", 13, 400);
    out.push(/* @__PURE__ */ h(Text, { x: x + w, y: f.sizeLabel, align: "right", size: 13, lh: 20, weight: 400, color: C4.ink2 }, "Size guide"), /* @__PURE__ */ h("rect", { x: num(x + w - gw), y: f.sizeLabel + 17, width: num(gw), height: "1", fill: C4.ink2 }));
    SIZES.forEach(([t, sub, off], i) => {
      const b = f.sizeCells[i], on = i === 1;
      out.push(/* @__PURE__ */ h(Box, { x: b.x, y: f.sizes, w: b.w, h: 52, r: 10, fill: off ? C4.soft : "#FFFFFF", stroke: on ? C4.ink : C4.line, sw: on ? 2 : 1 }));
      out.push(/* @__PURE__ */ h(Text, { x: b.x, y: f.sizes + 8, width: b.w, align: "center", size: 14, lh: 20, weight: 600, color: off ? C4.muted : C4.ink }, t));
      out.push(/* @__PURE__ */ h(Text, { x: b.x, y: f.sizes + 28, width: b.w, align: "center", size: 11.5, lh: 16, weight: 400, color: C4.muted }, sub));
    });
    const cy = f.cart;
    out.push(/* @__PURE__ */ h(Box, { x, y: cy, w: 128, h: 52, r: 10, fill: "#FFFFFF", stroke: C4.line }));
    out.push(/* @__PURE__ */ h(Icon, { name: "minus", x: x + 16, y: cy + 17, size: 18, color: C4.ink2 }), /* @__PURE__ */ h(Text, { x, y: cy + 16, width: 128, align: "center", size: 15, lh: 20, weight: 600, color: C4.ink }, "1"), /* @__PURE__ */ h(Icon, { name: "plus", x: x + 128 - 34, y: cy + 17, size: 18, color: C4.ink2 }));
    const bx = x + 128 + 12, bw = w - 128 - 12 - 12 - 52;
    out.push(/* @__PURE__ */ h(Box, { x: bx, y: cy, w: bw, h: 52, r: 10, fill: C4.accent }), /* @__PURE__ */ h(Text, { x: bx, y: cy + 16, width: bw, align: "center", size: 15, lh: 20, weight: 600, color: "#FFFFFF" }, `Add to cart · ${PRODUCT.price}`));
    out.push(/* @__PURE__ */ h(Box, { x: x + w - 52, y: cy, w: 52, h: 52, r: 10, fill: "#FFFFFF", stroke: C4.line }), /* @__PURE__ */ h(Icon, { name: "heart", x: x + w - 37, y: cy + 15, size: 22, color: C4.ink }));
    const py = f.perks;
    out.push(/* @__PURE__ */ h(Box, { x, y: py, w, h: 142, r: 12, fill: "#FFFFFF", stroke: C4.line }));
    PERKS.forEach(([icon, t], i) => {
      const ry = py + 1 + i * 47;
      if (i) out.push(/* @__PURE__ */ h("rect", { x: num(x + 16), y: ry - 1, width: w - 32, height: "1", fill: C4.line }));
      out.push(/* @__PURE__ */ h(Icon, { name: icon, x: x + 16, y: ry + 13, size: 20, color: C4.ink2 }), /* @__PURE__ */ h(Text, { x: x + 48, y: ry + 13, size: 13.5, lh: 20, weight: 500, color: C4.ink }, t));
    });
    FOLDS.forEach((t, i) => {
      const ry = f.folds + i * 52;
      out.push(/* @__PURE__ */ h(Text, { x, y: ry + 15, size: 15, lh: 22, weight: 600, color: C4.ink }, t), /* @__PURE__ */ h(Icon, { name: "chevronDown", x: x + w - 20, y: ry + 16, size: 20, color: C4.ink2 }));
      out.push(/* @__PURE__ */ h("rect", { x: num(x), y: ry + 51, width: w, height: "1", fill: C4.line }));
    });
    return /* @__PURE__ */ h(Group, { id: "Buy box" }, out);
  }
  function productDesign({ W = 1440, H = PAGE_H2 } = {}) {
    const L = layout4(W, H);
    const D = doc("Ridgeline 28L product page", W, H);
    return D.svg(/* @__PURE__ */ h(Fragment, null, /* @__PURE__ */ h(Top, { L }), /* @__PURE__ */ h(Crumbs, { L }), /* @__PURE__ */ h(Gallery, { L, D }), /* @__PURE__ */ h(Info, { L, D })), C4.page);
  }

  // src/presets/product/build.jsx
  var UI4 = `'Avenir Next', Poppins, 'Century Gothic', sans-serif`;
  var I4 = (name, size, color2, sw) => raw(iconHtml(name, size, color2, sw));
  var art = (color2, cls) => raw(`<svg class="${cls}" viewBox="0 0 400 500">${backpack(color2)}</svg>`);
  var css4 = (o) => `
*{box-sizing:border-box;margin:0;padding:0}
body{background:#FFFFFF;color:${C4.ink};font-family:${UI4};overflow:hidden}
a{color:inherit;text-decoration:none}
button{font:inherit;color:inherit;background:none;border:0}
.promo{height:36px;background:${C4.promo};color:#FAFAF9;text-align:center;font-size:12.5px;line-height:36px;font-weight:500}
.wrap{max-width:1440px;margin:0 auto;padding:0 48px}
header{height:72px;box-shadow:inset 0 -1px 0 ${C4.line}}
header .wrap{height:100%;display:flex;align-items:center}
.logo{font-size:18px;line-height:28px;font-weight:700;letter-spacing:2.5px;white-space:nowrap}
.nav{margin-left:56px;display:flex;gap:28px;font-size:14.5px;line-height:20px;font-weight:500;white-space:nowrap}
.nav .sale{color:${C4.sale}}
.search{margin-left:auto;width:260px;height:40px;border-radius:10px;background:${C4.soft};display:flex;align-items:center;gap:10px;padding-left:14px;font-size:14px;line-height:20px;color:${C4.muted};white-space:nowrap}
.icons{margin-left:24px;display:flex;gap:20px}
.cart{position:relative;display:flex}
.cart b{position:absolute;left:13px;top:-7px;width:16px;height:16px;border-radius:50%;background:${C4.sale};color:#FFFFFF;font-size:10px;line-height:16px;font-weight:700;text-align:center}
.crumbs{padding-top:24px;height:44px;display:flex;font-size:13px;line-height:20px;color:${C4.ink2};white-space:nowrap}
.crumbs i{font-style:normal;color:${C4.muted};margin:0 8px}
.crumbs span:last-child{color:${C4.ink};font-weight:500}
.main{margin-top:24px;display:grid;grid-template-columns:minmax(0,1fr) 480px;column-gap:64px;align-items:start}
.gallery{display:flex;gap:16px;align-items:flex-start}
.thumbs{display:flex;flex-direction:column;gap:12px;flex:none}
.thumb{width:72px;height:88px;border-radius:10px;background:${C4.soft};display:flex;align-items:center;justify-content:center}
.thumb.on{box-shadow:inset 0 0 0 2px ${C4.ink}}
.thumb svg{width:57.6px;height:70.4px}
.photo{position:relative;flex:1;min-width:0;${o.fixedImage ? "height:712px" : "aspect-ratio:1/1"};border-radius:16px;background:${C4.soft};display:flex;align-items:center;justify-content:center}
.photo svg{width:78%;height:78%}
.disc{position:absolute;left:20px;top:20px;height:28px;padding:0 12px;border-radius:14px;background:${C4.sale};color:#FFFFFF;font-size:12.5px;line-height:28px;font-weight:600}
.fav{position:absolute;right:20px;top:20px;width:40px;height:40px;border-radius:50%;background:#FFFFFF;display:flex;align-items:center;justify-content:center}
.kicker{font-size:12px;line-height:16px;font-weight:600;letter-spacing:1.4px;color:${C4.muted}}
h1{margin-top:8px;font-size:32px;line-height:40px;font-weight:600;letter-spacing:-.6px;white-space:nowrap}
.rating{margin-top:12px;height:20px;display:flex;align-items:center;font-size:13.5px;line-height:20px;white-space:nowrap}
.rating svg{margin:2px 8px 0 0}
.rating b{font-weight:600}
.rating i{font-style:normal;color:${C4.muted};margin:0 6px}
.rating u{color:${C4.ink2};text-underline-offset:3px}
.price{margin-top:20px;height:36px;display:flex;align-items:center;gap:12px;white-space:nowrap}
.price b{font-size:28px;line-height:36px;font-weight:600}
.price s{font-size:18px;line-height:36px;color:${C4.muted}}
.save{height:26px;padding:0 10px;border-radius:13px;background:${C4.greenSoft};color:${C4.green};font-size:12.5px;line-height:26px;font-weight:600}
hr{margin-top:24px;border:0;height:1px;background:${C4.line}}
.label{margin-top:24px;display:flex;font-size:13.5px;line-height:20px;white-space:nowrap}
.label b{font-weight:600;margin-right:6px}
.label span{color:${C4.ink2}}
.label u{margin-left:auto;font-size:13px;color:${C4.ink2};text-underline-offset:3px}
.swatches{margin-top:12px;display:flex;gap:12px}
.sw{width:36px;height:36px;border-radius:${o.swatchSquare ? "8px" : "50%"};flex:none}
.sw.on{box-shadow:0 0 0 2px #FFFFFF,0 0 0 4px ${C4.ink}}
.stock{margin-top:12px;display:flex;align-items:center;gap:6px;font-size:13px;line-height:18px;font-weight:600;color:#B45309}
.stock i{width:7px;height:7px;border-radius:50%;background:#F59E0B}
.sizes{margin-top:12px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:${o.sizeGap ? 4 : o.sizeGapWide ? 22 : 10}px}
.size{height:52px;border-radius:10px;border:1px solid ${C4.line};padding-top:7px;text-align:center}
.size.on{border:2px solid ${C4.ink};padding-top:6px}
.size.off{background:${C4.soft};color:${C4.muted}}
.size b{display:block;font-size:14px;line-height:20px;font-weight:600}
.size span{display:block;font-size:11.5px;line-height:16px;color:${C4.muted}}
.buy{margin-top:24px;display:flex;gap:12px}
.qty{width:128px;height:52px;border:1px solid ${C4.line};border-radius:10px;display:flex;align-items:center;justify-content:space-between;padding:0 15px;font-size:15px;line-height:20px;font-weight:600}
.add{flex:1;height:52px;border-radius:10px;background:${o.cartBlue ? "#2563EB" : C4.accent};color:#FFFFFF;font-size:15px;line-height:20px;font-weight:600}
.wish{width:52px;height:52px;border:1px solid ${C4.line};border-radius:10px;display:flex;align-items:center;justify-content:center;flex:none}
.perks{margin-top:24px;border:1px solid ${C4.line};border-radius:12px;padding:0 16px}
.perk{height:46px;display:flex;align-items:center;gap:12px;font-size:13.5px;line-height:20px;font-weight:500;white-space:nowrap}
.perk+.perk{height:47px;border-top:1px solid ${C4.line}}
.folds{margin-top:18px}
.fold{height:52px;border-bottom:1px solid ${C4.line};padding-top:15px;display:flex;font-size:15px;line-height:22px;font-weight:600}
.fold svg{margin:1px 0 0 auto}
`;
  function productBuild(o = {}) {
    const priceRow = [/* @__PURE__ */ hh("b", null, PRODUCT.price), /* @__PURE__ */ hh("s", null, PRODUCT.was)];
    const body = /* @__PURE__ */ hh("body", null, /* @__PURE__ */ hh("div", { className: "promo" }, PROMO), /* @__PURE__ */ hh("header", null, /* @__PURE__ */ hh("div", { className: "wrap" }, /* @__PURE__ */ hh("a", { className: "logo" }, BRAND4), /* @__PURE__ */ hh("nav", { className: "nav" }, NAV3.map(([t, sale]) => /* @__PURE__ */ hh("a", { className: sale ? "sale" : null }, t))), /* @__PURE__ */ hh("label", { className: "search" }, I4("search", 18, C4.ink2), "Search gear"), /* @__PURE__ */ hh("div", { className: "icons" }, I4("user", 22, C4.ink), I4("heart", 22, C4.ink), /* @__PURE__ */ hh("span", { className: "cart" }, I4("cart", 22, C4.ink), /* @__PURE__ */ hh("b", null, "2"))))), /* @__PURE__ */ hh("div", { className: "wrap" }, /* @__PURE__ */ hh("nav", { className: "crumbs" }, CRUMBS.map((t, i) => /* @__PURE__ */ hh(Frag, null, i ? /* @__PURE__ */ hh("i", null, "/") : null, /* @__PURE__ */ hh("span", null, t)))), /* @__PURE__ */ hh("div", { className: "main" }, /* @__PURE__ */ hh("div", { className: "gallery" }, /* @__PURE__ */ hh("div", { className: "thumbs" }, SWATCHES.slice(0, 4).map(([, col], i) => /* @__PURE__ */ hh("span", { className: "thumb" + (i === 0 ? " on" : "") }, art(col, "")))), /* @__PURE__ */ hh("div", { className: "photo" }, art(SWATCHES[0][1], ""), /* @__PURE__ */ hh("span", { className: "disc" }, "−20%"), /* @__PURE__ */ hh("span", { className: "fav" }, I4("heart", 20, C4.ink)))), /* @__PURE__ */ hh("div", { className: "info" }, /* @__PURE__ */ hh("div", { className: "kicker" }, PRODUCT.kicker), /* @__PURE__ */ hh("h1", null, PRODUCT.title), /* @__PURE__ */ hh("div", { className: "rating" }, raw(`<svg width="88" height="16" viewBox="0 0 88 16">${starsMarkup(PRODUCT.rating, "starfill")}</svg>`), /* @__PURE__ */ hh("b", null, String(PRODUCT.rating)), /* @__PURE__ */ hh("i", null, "·"), /* @__PURE__ */ hh("u", null, PRODUCT.reviews)), /* @__PURE__ */ hh("div", { className: "price", "data-bug": o.priceOrder ? "Old price shown before the current price" : null }, o.priceOrder ? priceRow.slice().reverse() : priceRow, /* @__PURE__ */ hh("span", { className: "save" }, PRODUCT.save)), /* @__PURE__ */ hh("hr", null), /* @__PURE__ */ hh("div", { className: "label" }, /* @__PURE__ */ hh("b", null, "Color"), /* @__PURE__ */ hh("span", null, `— ${PRODUCT.color}`)), /* @__PURE__ */ hh("div", { className: "swatches", "data-bug": o.swatchSquare ? "Swatches drawn as rounded squares, spec is circles" : null }, SWATCHES.map(([n, col], i) => /* @__PURE__ */ hh("span", { className: "sw" + (i === 0 ? " on" : ""), style: { background: col }, title: n }))), o.stockNote ? /* @__PURE__ */ hh("div", { className: "stock", "data-bug": "Low-stock note that is not in the design" }, /* @__PURE__ */ hh("i", null), "Only 3 left in Glacier") : null, /* @__PURE__ */ hh("div", { className: "label", style: { marginTop: "28px" } }, /* @__PURE__ */ hh("b", null, "Size"), /* @__PURE__ */ hh("u", null, "Size guide")), /* @__PURE__ */ hh("div", { className: "sizes", "data-bug": o.sizeGap ? "Size buttons 4px apart, spec is 10px" : o.sizeGapWide ? "Size buttons 22px apart, spec is 10px" : null }, SIZES.map(([t, sub, off], i) => /* @__PURE__ */ hh("button", { className: "size" + (i === 1 ? " on" : "") + (off ? " off" : "") }, /* @__PURE__ */ hh("b", null, t), /* @__PURE__ */ hh("span", null, sub)))), /* @__PURE__ */ hh("div", { className: "buy" }, /* @__PURE__ */ hh("div", { className: "qty" }, I4("minus", 18, C4.ink2), "1", I4("plus", 18, C4.ink2)), /* @__PURE__ */ hh("button", { className: "add", "data-bug": o.cartBlue ? "Add to cart button blue, spec is near-black" : null }, `Add to cart · ${PRODUCT.price}`), /* @__PURE__ */ hh("button", { className: "wish" }, I4("heart", 22, C4.ink))), /* @__PURE__ */ hh("div", { className: "perks" }, PERKS.filter((p, i) => !(o.noWarranty && i === 2)).map(([icon, t]) => /* @__PURE__ */ hh("div", { className: "perk" }, I4(icon, 20, C4.ink2), t))), /* @__PURE__ */ hh("div", { className: "folds" }, FOLDS.map((t) => /* @__PURE__ */ hh("div", { className: "fold" }, t, I4("chevronDown", 20, C4.ink2))))))));
    return page(`<title>${PRODUCT.title} — ${BRAND4}</title>
<style>${css4(o)}</style>`, String(body));
  }

  // src/presets/docs/data.js
  var BRAND5 = "Corvid";
  var TOPLINKS = ["Guides", "API", "Changelog"];
  var SIDEBAR = [
    { group: "Getting started", items: ["Introduction", "Installation", ["Quickstart", true]] },
    { group: "Core concepts", items: ["Assets", "Scans", "Findings", "Policies"] },
    { group: "Integrations", items: ["Slack", "Jira", "Webhooks"] },
    { group: "Reference", items: ["CLI", "REST API"] }
  ];
  var TOC = [["Install the CLI", true], ["Authenticate"], ["Run your first scan"], ["Scan options"], ["Next steps"]];
  var CRUMBS2 = ["Getting started", "Quickstart"];
  var LEAD2 = "Install the Corvid CLI, connect it to your workspace and run a first external scan of a domain you own. The whole walkthrough takes about five minutes.";
  var P1 = "The CLI is a single static binary for macOS, Linux and Windows. Pick the package manager you already use; every channel ships the same build within an hour of a release.";
  var P2 = "Point the scanner at a domain you own. It maps subdomains, ports and certificates.";
  var CALLOUT = "Scans only touch assets you have verified. Add a DNS TXT record before your first scan.";
  var TABS = ["npm", "brew", "curl"];
  var CODE = [
    [["$ ", "#64748B"], ["npm install", "#E2E8F0"], [" -g ", "#7DD3FC"], ["@corvid/cli", "#FBBF24"]],
    [["$ ", "#64748B"], ["corvid login", "#E2E8F0"], [" --workspace ", "#7DD3FC"], ["acme-sec", "#FBBF24"]],
    [["$ ", "#64748B"], ["corvid scan", "#E2E8F0"], [" example.com", "#FBBF24"], [" --depth ", "#7DD3FC"], ["2", "#C4B5FD"]]
  ];
  var PARAMS = [
    ["--depth", "How many levels of subdomains to follow", "1"],
    ["--ports", "Port set to probe: top100, top1000 or a list", "top100"],
    ["--format", "Output as table, json or sarif", "table"]
  ];
  var C5 = {
    page: "#FFFFFF",
    side: "#FAFAFA",
    ink: "#0F172A",
    ink2: "#475569",
    muted: "#94A3B8",
    line: "#E5E7EB",
    accent: "#4F46E5",
    accentSoft: "#EEF2FF",
    code: "#0F172A",
    codeBar: "#1E293B",
    info: "#2563EB",
    infoSoft: "#EFF6FF"
  };

  // src/presets/docs/layout.js
  var TOP3 = 64;
  var SIDE3 = 272;
  var TOCW = 240;
  var MEASURE = 720;
  var BREAK = 1280;
  function layout5(W, H, o = {}) {
    const showToc = o.alwaysToc || W >= BREAK;
    const colX = SIDE3, colW = W - SIDE3 - (showToc ? TOCW : 0);
    const aw = Math.min(MEASURE, colW - 112);
    const ax = colX + 56 + (colW - 112 - aw) / 2;
    const searchW = 420, search = box((W - searchW) / 2, 12, searchW, 40);
    const versionX = 24 + 28 + 10 + measure("Corvid", { size: 17, weight: 700 }) + 8 + measure("Docs", { size: 17, weight: 400 }) + 16;
    const nav = [];
    let y = TOP3 + 24;
    for (const g of SIDEBAR) {
      const label = box(24, y, SIDE3 - 48, 16);
      y += 16 + 8;
      const items = g.items.map((it) => {
        const b = box(12, y, SIDE3 - 24, 32);
        y += 32 + 2;
        return { it, b };
      });
      nav.push({ g, label, items });
      y += 20;
    }
    const lines = (t, size, w) => wrap(t, w, { size }).length;
    const a = { x: ax, w: aw };
    a.crumbs = TOP3 + 40;
    a.h1 = a.crumbs + 20 + 12;
    a.lead = a.h1 + 44 + 12;
    a.leadH = 28 * lines(LEAD2, 17, aw);
    a.h2a = a.lead + a.leadH + 36;
    a.p1 = a.h2a + 30 + 10;
    a.p1H = 26 * lines(P1, 15.5, aw);
    a.code = a.p1 + a.p1H + 18;
    a.codeH = 38 + 16 + 3 * 22 + 16;
    a.callout = a.code + a.codeH + 20;
    a.calloutH = 52;
    a.h2b = a.callout + a.calloutH + 36;
    a.p2 = a.h2b + 30 + 10;
    a.table = a.p2 + 26 + 18;
    a.cols = tracks(ax, aw, [150, "1fr", 96], 0);
    const toc = showToc ? { x: W - TOCW + 24, y: TOP3 + 40, items: TOC.map((t, i) => box(W - TOCW + 24, TOP3 + 40 + 16 + 14 + i * 30, TOCW - 48, 20)) } : null;
    return { W, H, showToc, colX, colW, search, versionX, nav, a, toc };
  }
  var PAGE_H3 = 1e3;

  // src/presets/docs/design.jsx
  function Header2({ L, D }) {
    const s = L.search;
    const logo = D.linear(24, 18, 52, 46, [[0, "#4F46E5"], [1, "#14B8A6"]]);
    const vw = Math.round(10 + tw("v4.2", 12.5, 600) + 4 + 12 + 8);
    let x = L.W - 24 - 20 - 24;
    const links = [];
    for (let i = TOPLINKS.length - 1; i >= 0; i--) {
      x -= tw(TOPLINKS[i], 14, 500);
      links.push(/* @__PURE__ */ h(Text, { x, y: 22, size: 14, lh: 20, weight: 500, color: C5.ink2 }, TOPLINKS[i]));
      x -= 24;
    }
    return /* @__PURE__ */ h(Group, { id: "Header" }, /* @__PURE__ */ h("rect", { x: "0", y: TOP3 - 1, width: L.W, height: "1", fill: C5.line }), /* @__PURE__ */ h("rect", { x: "24", y: "18", width: "28", height: "28", rx: "8", fill: logo }), /* @__PURE__ */ h(Icon, { name: "layers", x: 30, y: 24, size: 16, color: "#FFFFFF", sw: 2 }), /* @__PURE__ */ h(Text, { x: 62, y: 18, size: 17, lh: 28, weight: 700, color: C5.ink }, BRAND5), /* @__PURE__ */ h(Text, { x: 62 + tw(BRAND5, 17, 700) + 8, y: 18, size: 17, lh: 28, weight: 400, color: C5.muted }, "Docs"), /* @__PURE__ */ h(Box, { x: L.versionX, y: 19, w: vw, h: 26, r: 13, fill: "#FFFFFF", stroke: C5.line }), /* @__PURE__ */ h(Text, { x: L.versionX + 10, y: 22, size: 12.5, lh: 20, weight: 600, color: C5.ink2 }, "v4.2"), /* @__PURE__ */ h(Icon, { name: "chevronDown", x: L.versionX + vw - 20, y: 26, size: 12, color: C5.ink2, sw: 2 }), /* @__PURE__ */ h(Box, { x: s.x, y: s.y, w: s.w, h: 40, r: 10, fill: "#F9FAFB", stroke: C5.line }), /* @__PURE__ */ h(Icon, { name: "search", x: s.x + 13, y: s.y + 12, size: 16, color: C5.muted }), /* @__PURE__ */ h(Text, { x: s.x + 38, y: s.y + 10, size: 14, lh: 20, weight: 400, color: C5.muted }, "Search docs"), /* @__PURE__ */ h(Box, { x: s.x + s.w - 36, y: s.y + 10, w: 24, h: 20, r: 5, fill: "#FFFFFF", stroke: C5.line }), /* @__PURE__ */ h(Text, { x: s.x + s.w - 36, y: s.y + 10, width: 24, align: "center", size: 11.5, lh: 20, weight: 600, family: "mono", color: C5.muted }, "/"), links, /* @__PURE__ */ h(Icon, { name: "github", x: L.W - 44, y: 22, size: 20, color: C5.ink }));
  }
  function Sidebar2({ L }) {
    const out = [/* @__PURE__ */ h(Box, { x: 0, y: TOP3, w: SIDE3, h: L.H - TOP3, fill: C5.side }), /* @__PURE__ */ h("rect", { x: SIDE3 - 1, y: TOP3, width: "1", height: L.H - TOP3, fill: C5.line })];
    for (const n of L.nav) {
      out.push(/* @__PURE__ */ h(Text, { x: 24, y: n.label.y, size: 11.5, lh: 16, weight: 600, color: C5.muted, ls: 0.6 }, n.g.group.toUpperCase()));
      for (const { it, b } of n.items) {
        const [t, on] = Array.isArray(it) ? it : [it, false];
        if (on) out.push(/* @__PURE__ */ h(Box, { x: b.x, y: b.y, w: b.w, h: 32, r: 8, fill: C5.accentSoft }));
        out.push(/* @__PURE__ */ h(Text, { x: b.x + 12, y: b.y + 6, size: 14, lh: 20, weight: on ? 600 : 400, color: on ? C5.accent : C5.ink2 }, t));
      }
    }
    return /* @__PURE__ */ h(Group, { id: "Sidebar" }, out);
  }
  function Toc({ L }) {
    if (!L.toc) return "";
    const t = L.toc;
    return /* @__PURE__ */ h(Group, { id: "On this page" }, /* @__PURE__ */ h("rect", { x: L.W - TOCW, y: TOP3, width: "1", height: L.H - TOP3, fill: C5.line }), /* @__PURE__ */ h(Text, { x: t.x, y: t.y, size: 11.5, lh: 16, weight: 600, color: C5.muted, ls: 0.6 }, "ON THIS PAGE"), TOC.map(([s, on], i) => /* @__PURE__ */ h(Fragment, null, on ? /* @__PURE__ */ h("rect", { x: t.x - 12, y: t.items[i].y, width: "2", height: "20", rx: "1", fill: C5.accent }) : null, /* @__PURE__ */ h(Text, { x: t.x, y: t.items[i].y, size: 13.5, lh: 20, weight: on ? 600 : 400, color: on ? C5.accent : C5.ink2 }, s))));
  }
  function Article({ L, D }) {
    const a = L.a, x = a.x, w = a.w;
    const out = [];
    out.push(/* @__PURE__ */ h(Text, { x, y: a.crumbs, size: 13, lh: 20, weight: 400, color: C5.muted }, CRUMBS2[0]));
    const cx = x + tw(CRUMBS2[0], 13) + 8;
    out.push(/* @__PURE__ */ h(Text, { x: cx, y: a.crumbs, size: 13, lh: 20, weight: 400, color: C5.muted }, "/"), /* @__PURE__ */ h(Text, { x: cx + tw("/", 13) + 8, y: a.crumbs, size: 13, lh: 20, weight: 500, color: C5.ink2 }, CRUMBS2[1]));
    out.push(/* @__PURE__ */ h(Text, { x, y: a.h1, size: 36, lh: 44, weight: 600, color: C5.ink, ls: -0.6 }, "Quickstart"));
    out.push(/* @__PURE__ */ h(Text, { x, y: a.lead, width: w, size: 17, lh: 28, weight: 400, color: C5.ink2 }, LEAD2));
    out.push(/* @__PURE__ */ h(Text, { x, y: a.h2a, size: 22, lh: 30, weight: 600, color: C5.ink, ls: -0.3 }, "Install the CLI"));
    out.push(/* @__PURE__ */ h(Text, { x, y: a.p1, width: w, size: 15.5, lh: 26, weight: 400, color: C5.ink2 }, P1));
    const cy = a.code;
    out.push(/* @__PURE__ */ h("rect", { x: num(x), y: cy, width: num(w), height: a.codeH, rx: "10", fill: C5.code }));
    out.push(/* @__PURE__ */ h("path", { d: `M${num(x)} ${cy + 10}a10 10 0 0 1 10 -10H${num(x + w - 10)}a10 10 0 0 1 10 10V${cy + 38}H${num(x)}Z`, fill: C5.codeBar }));
    let tx = x + 16;
    TABS.forEach((t, i) => {
      const tw0 = tw(t, 13, 500, "mono");
      out.push(/* @__PURE__ */ h(Text, { x: tx, y: cy + 9, size: 13, lh: 20, weight: 500, family: "mono", color: i === 0 ? "#F8FAFC" : "#94A3B8" }, t));
      if (i === 0) out.push(/* @__PURE__ */ h("rect", { x: num(tx), y: cy + 36, width: num(tw0), height: "2", fill: "#818CF8" }));
      tx += tw0 + 20;
    });
    out.push(/* @__PURE__ */ h(Icon, { name: "file", x: x + w - 16 - 14 - 6 - tw("Copy", 12, 600), y: cy + 12, size: 14, color: "#94A3B8" }), /* @__PURE__ */ h(Text, { x: x + w - 16, y: cy + 9, align: "right", size: 12, lh: 20, weight: 600, color: "#94A3B8" }, "Copy"));
    CODE.forEach((line, i) => {
      let lx = x + 20;
      for (const [t, col] of line) {
        out.push(/* @__PURE__ */ h(Text, { x: lx, y: cy + 38 + 16 + i * 22, size: 13, lh: 22, weight: 400, family: "mono", color: col }, t));
        lx += tw(t, 13, 400, "mono");
      }
    });
    const ky = a.callout;
    out.push(/* @__PURE__ */ h(Box, { x, y: ky, w, h: a.calloutH, r: 8, fill: C5.infoSoft }), /* @__PURE__ */ h("rect", { x: num(x), y: ky, width: "3", height: a.calloutH, fill: C5.info }));
    out.push(/* @__PURE__ */ h(Icon, { name: "alert", x: x + 18, y: ky + 16, size: 20, color: C5.info }), /* @__PURE__ */ h(Text, { x: x + 50, y: ky + 14, size: 14.5, lh: 24, weight: 500, color: "#1E3A8A" }, CALLOUT));
    out.push(/* @__PURE__ */ h(Text, { x, y: a.h2b, size: 22, lh: 30, weight: 600, color: C5.ink, ls: -0.3 }, "Run your first scan"));
    out.push(/* @__PURE__ */ h(Text, { x, y: a.p2, size: 15.5, lh: 26, weight: 400, color: C5.ink2 }, P2));
    const ty = a.table, cols = a.cols;
    out.push(/* @__PURE__ */ h(Box, { x, y: ty, w, h: 174, r: 10, fill: "#FFFFFF", stroke: C5.line }));
    out.push(/* @__PURE__ */ h("path", { d: `M${num(x + 1)} ${ty + 10}a9 9 0 0 1 9 -9H${num(x + w - 10)}a9 9 0 0 1 9 9V${ty + 41}H${num(x + 1)}Z`, fill: "#F9FAFB" }));
    ["FLAG", "DESCRIPTION", "DEFAULT"].forEach((t, i) => out.push(/* @__PURE__ */ h(Text, { x: cols[i].x + 14, y: ty + 12, size: 11.5, lh: 16, weight: 600, color: C5.muted, ls: 0.5 }, t)));
    PARAMS.forEach(([f, d, def], r) => {
      const ry = ty + 41 + r * 44;
      out.push(/* @__PURE__ */ h("rect", { x: num(x), y: ry, width: num(w), height: "1", fill: C5.line }));
      const fw = Math.round(tw(f, 12.5, 500, "mono")) + 12;
      out.push(/* @__PURE__ */ h(Box, { x: cols[0].x + 14, y: ry + 11, w: fw, h: 22, r: 5, fill: "#F1F5F9" }), /* @__PURE__ */ h(Text, { x: cols[0].x + 14, y: ry + 11, width: fw, align: "center", size: 12.5, lh: 22, weight: 500, family: "mono", color: C5.ink }, f));
      out.push(/* @__PURE__ */ h(Text, { x: cols[1].x + 14, y: ry + 11, size: 14, lh: 22, weight: 400, color: C5.ink2 }, d));
      out.push(/* @__PURE__ */ h(Text, { x: cols[2].x + 14, y: ry + 11, size: 12.5, lh: 22, weight: 400, family: "mono", color: C5.ink2 }, def));
    });
    return /* @__PURE__ */ h(Group, { id: "Article" }, out);
  }
  function docsDesign({ W = 1440, H = PAGE_H3 } = {}) {
    const L = layout5(W, H);
    const D = doc("Docs · Quickstart", W, H);
    return D.svg(/* @__PURE__ */ h(Fragment, null, /* @__PURE__ */ h(Header2, { L, D }), /* @__PURE__ */ h(Sidebar2, { L }), /* @__PURE__ */ h(Toc, { L }), /* @__PURE__ */ h(Article, { L, D })), C5.page);
  }

  // src/presets/docs/build.jsx
  var UI5 = `Carlito, Calibri, 'Segoe UI', sans-serif`;
  var MONO3 = `'SF Mono', Menlo, Consolas, 'DejaVu Sans Mono', monospace`;
  var I5 = (name, size, color2, sw) => raw(iconHtml(name, size, color2, sw));
  var css5 = (o) => `
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%}
body{background:#FFFFFF;color:${C5.ink};font-family:${UI5};overflow:hidden}
a{color:inherit;text-decoration:none}
.mono{font-family:${MONO3}}
.app{display:grid;grid-template-rows:64px minmax(0,1fr);height:100vh}
header{position:relative;display:flex;align-items:center;padding:0 24px;box-shadow:inset 0 -1px 0 ${C5.line}}
.logo{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#4F46E5,#14B8A6);display:flex;align-items:center;justify-content:center;flex:none}
.brand{margin-left:10px;font-size:17px;line-height:28px;font-weight:700;white-space:nowrap}
.brand span{margin-left:8px;font-weight:400;color:${C5.muted}}
.ver{margin-left:16px;height:26px;border:1px solid ${C5.line};border-radius:13px;display:flex;align-items:center;gap:4px;padding:0 7px 0 9px;font-size:12.5px;line-height:20px;font-weight:600;color:${C5.ink2}}
.search{position:absolute;left:50%;top:12px;width:420px;margin-left:-210px;height:40px;border:1px solid ${C5.line};border-radius:10px;background:#F9FAFB;display:flex;align-items:center;gap:9px;padding:0 11px 0 12px;font-size:14px;line-height:20px;color:${C5.muted}}
.kbd{margin-left:auto;width:24px;height:20px;border:1px solid ${C5.line};border-radius:5px;background:#FFFFFF;font-size:11.5px;line-height:18px;font-weight:600;text-align:center}
.links{margin-left:auto;display:flex;gap:24px;font-size:14px;line-height:20px;font-weight:500;color:${C5.ink2}}
.gh{margin-left:24px;display:flex}
.body{display:grid;grid-template-columns:${o.wideSidebar ? 300 : 272}px minmax(0,1fr) 240px;min-height:0}
${o.alwaysToc ? "" : "@media (max-width:1279px){.body{grid-template-columns:" + (o.wideSidebar ? 300 : 272) + "px minmax(0,1fr)}.toc{display:none}}"}
.side{background:${C5.side};box-shadow:inset -1px 0 0 ${C5.line};padding:24px 12px 0}
.gl{padding-left:12px;font-size:11.5px;line-height:16px;font-weight:600;letter-spacing:.6px;text-transform:uppercase;color:${C5.muted}}
.items{margin-top:8px;display:flex;flex-direction:column;gap:2px}
.it{height:32px;border-radius:8px;padding:6px 12px 0;font-size:14px;line-height:20px;color:${C5.ink2};white-space:nowrap}
.it.on{background:${C5.accentSoft};color:${C5.accent};font-weight:600}
.group+.group{margin-top:22px}
.col{padding:40px 56px 0;min-width:0}
article{max-width:720px;margin:0 auto}
.crumbs{font-size:13px;line-height:20px;color:${C5.muted};white-space:nowrap}
.crumbs i{font-style:normal;margin:0 8px}
.crumbs b{font-weight:500;color:${C5.ink2}}
h1{margin-top:12px;font-size:${o.h1Small ? 28 : 36}px;line-height:${o.h1Small ? 36 : 44}px;font-weight:600;letter-spacing:-.6px}
.lead{margin-top:12px;font-size:17px;line-height:28px;color:${C5.ink2}}
h2{margin-top:36px;font-size:22px;line-height:30px;font-weight:600;letter-spacing:-.3px}
h2.first{margin-top:${o.h2Gap ? 52 : 36}px}
.p{margin-top:10px;font-size:15.5px;line-height:26px;color:${C5.ink2}}
.code{margin-top:18px;border-radius:10px;overflow:hidden;background:${o.codeLight ? "#F8FAFC" : C5.code}${o.codeLight ? ";box-shadow:inset 0 0 0 1px " + C5.line : ""}}
.tabs{height:38px;background:${o.codeLight ? "#EEF2F7" : C5.codeBar};display:flex;padding:0 16px;gap:20px;font-size:13px;line-height:20px;font-weight:500;color:#94A3B8}
.tabs span{padding-top:9px}
.tabs .on{color:${o.codeLight ? C5.ink : "#F8FAFC"};box-shadow:inset 0 -2px 0 #818CF8}
.copy{margin-left:auto;padding-top:9px;display:flex;align-items:flex-start;gap:6px;font-family:${UI5};font-size:12px;font-weight:600}
.copy svg{margin-top:3px}
pre{padding:16px 20px;font-size:13px;line-height:22px;white-space:pre}
.call{margin-top:20px;height:52px;border-radius:8px;background:${C5.infoSoft};border-left:3px solid ${C5.info};display:flex;align-items:center;gap:12px;padding:0 16px 0 15px;font-size:14.5px;line-height:24px;font-weight:500;color:#1E3A8A;white-space:nowrap}
.tbl{margin-top:18px;border:1px solid ${C5.line};border-radius:10px;overflow:hidden}
.row{display:grid;grid-template-columns:150px minmax(0,1fr) 96px}
.row>*{padding-left:14px}
.th{height:40px;background:#F9FAFB;padding-top:11px;font-size:11.5px;line-height:16px;font-weight:600;letter-spacing:.5px;color:${C5.muted}}
.tr{height:44px;border-top:1px solid ${C5.line};padding-top:10px;font-size:14px;line-height:22px;color:${C5.ink2}}
.flag{display:inline-block;height:22px;padding:0 6px;border-radius:5px;background:#F1F5F9;font-size:12.5px;line-height:22px;font-weight:500;color:${C5.ink}}
.def{font-size:12.5px}
.toc{box-shadow:inset 1px 0 0 ${C5.line};padding:40px 24px 0}
.toc p{font-size:11.5px;line-height:16px;font-weight:600;letter-spacing:.6px;color:${C5.muted}}
.toc ul{margin-top:14px;list-style:none;display:flex;flex-direction:column;gap:10px}
.toc li{position:relative;font-size:13.5px;line-height:20px;color:${C5.ink2};white-space:nowrap}
.toc li.on{color:${C5.accent};font-weight:600}
.toc li.on::before{content:"";position:absolute;left:-12px;top:0;width:2px;height:20px;border-radius:1px;background:${C5.accent}}
`;
  function docsBuild(o = {}) {
    const active = o.wrongActive ? "Installation" : "Quickstart";
    const body = /* @__PURE__ */ hh("body", null, /* @__PURE__ */ hh("div", { className: "app" }, /* @__PURE__ */ hh("header", null, /* @__PURE__ */ hh("span", { className: "logo" }, I5("layers", 16, "#FFFFFF", 2)), /* @__PURE__ */ hh("span", { className: "brand" }, BRAND5, /* @__PURE__ */ hh("span", null, "Docs")), /* @__PURE__ */ hh("span", { className: "ver" }, "v4.2", I5("chevronDown", 12, C5.ink2, 2)), /* @__PURE__ */ hh("label", { className: "search" }, I5("search", 16, C5.muted), "Search docs", /* @__PURE__ */ hh("span", { className: "kbd mono" }, "/")), /* @__PURE__ */ hh("nav", { className: "links" }, TOPLINKS.map((t) => /* @__PURE__ */ hh("a", null, t))), /* @__PURE__ */ hh("a", { className: "gh" }, I5("github", 20, C5.ink))), /* @__PURE__ */ hh("div", { className: "body" }, /* @__PURE__ */ hh("aside", { className: "side", "data-bug": o.wideSidebar ? "Sidebar 300px wide, spec is 272px" : null }, SIDEBAR.map((g) => /* @__PURE__ */ hh("div", { className: "group" }, /* @__PURE__ */ hh("div", { className: "gl" }, g.group), /* @__PURE__ */ hh("div", { className: "items" }, g.items.map((it) => {
      const t = Array.isArray(it) ? it[0] : it;
      return /* @__PURE__ */ hh("a", { className: "it" + (t === active ? " on" : ""), "data-bug": o.wrongActive && (t === "Installation" || t === "Quickstart") ? "Sidebar highlights Installation while on Quickstart" : null }, t);
    }))))), /* @__PURE__ */ hh("main", { className: "col" }, /* @__PURE__ */ hh("article", null, /* @__PURE__ */ hh("div", { className: "crumbs" }, CRUMBS2[0], /* @__PURE__ */ hh("i", null, "/"), /* @__PURE__ */ hh("b", null, CRUMBS2[1])), /* @__PURE__ */ hh("h1", { "data-bug": o.h1Small ? "Page title set at 28px, spec is 36px" : null }, "Quickstart"), /* @__PURE__ */ hh("p", { className: "lead" }, LEAD2), /* @__PURE__ */ hh("h2", { className: "first", "data-bug": o.h2Gap ? "Section heading 52px below the lead, spec is 36px" : null }, "Install the CLI"), /* @__PURE__ */ hh("p", { className: "p" }, P1), /* @__PURE__ */ hh("div", { className: "code", "data-bug": o.codeLight ? "Code block in the light theme, spec is dark" : null }, /* @__PURE__ */ hh("div", { className: "tabs mono" }, TABS.map((t, i) => /* @__PURE__ */ hh("span", { className: i === 0 ? "on" : null }, t)), /* @__PURE__ */ hh("span", { className: "copy" }, I5("file", 14, "#94A3B8"), "Copy")), /* @__PURE__ */ hh("pre", { className: "mono" }, CODE.map((line, i) => /* @__PURE__ */ hh(Frag, null, i ? "\n" : "", line.map(([t, col]) => /* @__PURE__ */ hh("span", { style: { color: o.codeLight ? col === "#E2E8F0" ? C5.ink : col === "#FBBF24" ? "#B45309" : col === "#7DD3FC" ? "#0369A1" : col === "#C4B5FD" ? "#6D28D9" : "#64748B" : col } }, t)))))), o.noCallout ? null : /* @__PURE__ */ hh("div", { className: "call" }, I5("alert", 20, C5.info), CALLOUT), /* @__PURE__ */ hh("h2", null, "Run your first scan"), /* @__PURE__ */ hh("p", { className: "p" }, P2), /* @__PURE__ */ hh("div", { className: "tbl" }, /* @__PURE__ */ hh("div", { className: "row th" }, ["FLAG", "DESCRIPTION", "DEFAULT"].map((t) => /* @__PURE__ */ hh("span", null, t))), PARAMS.map(([f, d, def]) => /* @__PURE__ */ hh("div", { className: "row tr" }, /* @__PURE__ */ hh("span", null, /* @__PURE__ */ hh("code", { className: "flag mono" }, f)), /* @__PURE__ */ hh("span", null, d), /* @__PURE__ */ hh("span", { className: "def mono" }, def)))))), /* @__PURE__ */ hh("aside", { className: "toc" }, /* @__PURE__ */ hh("p", null, "ON THIS PAGE"), /* @__PURE__ */ hh("ul", null, TOC.map(([t, on]) => /* @__PURE__ */ hh("li", { className: on ? "on" : null }, t)))))));
    return page(`<title>Quickstart — ${BRAND5} Docs</title>
<style>${css5(o)}</style>`, String(body));
  }

  // src/presets/kanban/data.js
  var PROJECT = "Q4 remediation sprint";
  var TABS2 = ["Board", "List", "Timeline", "Files"];
  var PEOPLE = { AK: "#F59E0B", MR: "#10B981", JL: "#6366F1", SN: "#EC4899", TP: "#0EA5E9" };
  var FILTERS = ["Assignee", "Severity", "Labels"];
  var T = (id, title, pri, labels, who, due, extra = {}) => ({ id, title, pri, labels, who, due, ...extra });
  var COLUMNS = [
    { name: "To do", color: "#94A3B8", cards: [
      T("SEC-148", "Rotate leaked API token", "urgent", [["secrets", "red"]], "MR", "Oct 14"),
      T("SEC-151", "Patch OpenSSL on edge", "high", [["CVE-2026-1102", "red"], ["infra", "gray"]], "AK", "Oct 17"),
      T("SEC-153", "Close public S3 bucket", "high", [["cloud", "amber"]], "JL", "Oct 18"),
      T("SEC-156", "Enable MFA for admins", "medium", [["identity", "violet"]], "SN", "Oct 21")
    ] },
    { name: "In progress", color: "#3B82F6", cards: [
      T("SEC-139", "Upgrade Jenkins to LTS", "high", [["CVE-2026-0988", "red"]], "TP", "Oct 15", { progress: 0.6 }),
      T("SEC-142", "Remove RDP from VPN", "urgent", [["network", "gray"]], "AK", "Oct 16", { progress: 0.3 }),
      T("SEC-144", "Pin TLS 1.2 minimum", "medium", [["web", "blue"]], "MR", "Oct 19")
    ] },
    { name: "In review", color: "#F59E0B", cards: [
      T("SEC-131", "Fix SSRF in image proxy", "urgent", [["CVE-2026-0871", "red"], ["api", "gray"]], "JL", "Oct 13", { progress: 0.9 }),
      T("SEC-136", "Harden CSP headers", "medium", [["web", "blue"]], "SN", "Oct 15")
    ] },
    { name: "Done", color: "#10B981", cards: [
      T("SEC-120", "Revoke stale SSH keys", "high", [["identity", "violet"]], "TP", "Oct 8", { done: true }),
      T("SEC-124", "Block Telnet at border", "medium", [["network", "gray"]], "MR", "Oct 9", { done: true }),
      T("SEC-127", "Expire old certificates", "low", [["web", "blue"]], "AK", "Oct 10", { done: true })
    ] }
  ];
  var LABEL = { red: ["#FEE2E2", "#B91C1C"], gray: ["#F1F5F9", "#475569"], amber: ["#FEF3C7", "#B45309"], violet: ["#EDE9FE", "#6D28D9"], blue: ["#DBEAFE", "#1D4ED8"] };
  var PRI = { urgent: "#DC2626", high: "#EA580C", medium: "#CA8A04", low: "#64748B" };
  var C6 = { page: "#FFFFFF", col: "#F4F5F7", ink: "#111827", ink2: "#4B5563", muted: "#9CA3AF", line: "#E5E7EB", accent: "#2563EB" };

  // src/presets/kanban/layout.js
  var HEAD3 = 60;
  var TOOL = 52;
  var PAD3 = 24;
  var COLGAP = 16;
  var CPAD = 10;
  var cardH = (k) => 134 + (k.progress != null ? 16 : 0);
  function layout6(W, H, o = {}) {
    const nameW = measure(PROJECT, { size: 16, weight: 600 });
    let tx = 24 + 28 + 10 + nameW + 8 + 16 + 32;
    const tabs = TABS2.map((t) => {
      const w = measure(t, { size: 14, weight: 500 });
      const b = box(tx, 20, w, 20);
      tx += w + 24;
      return b;
    });
    const newW = Math.round(12 + 14 + 6 + measure("New ticket", { size: 13, weight: 600 }) + 14);
    const shareW = Math.round(measure("Share", { size: 13, weight: 600 })) + 28;
    const newB = box(W - 24 - newW, 13, newW, 34), share = box(newB.x - 10 - shareW, 13, shareW, 34);
    const avatars = box(share.x - 16 - (4 * 20 + 28), 16, 4 * 20 + 28, 28);
    const search = box(24, HEAD3 + 10, 240, 32);
    let fx = search.x + search.w + 12;
    const filters = FILTERS.map((t) => {
      const w = Math.round(12 + measure(t, { size: 13, weight: 500 }) + 6 + 12 + 10);
      const b = box(fx, HEAD3 + 10, w, 32);
      fx += w + 8;
      return b;
    });
    const groupW = measure("Group by", { size: 13 }) + 6 + measure("Status", { size: 13, weight: 600 }) + 4 + 12;
    const group = box(W - 24 - groupW, HEAD3 + 16, groupW, 20);
    const top = HEAD3 + TOOL + 8;
    const cols = (o.fixedCols ? [336, 336, 336, 336].map((w, i) => ({ x: PAD3 + i * (336 + COLGAP), w })) : tracks(PAD3, W - 2 * PAD3, COLUMNS.map(() => "1fr"), COLGAP)).map((t, i) => {
      const col = box(t.x, top, t.w, H - top - PAD3);
      let y = top + CPAD + 36 + 4;
      const cards = COLUMNS[i].cards.map((k) => {
        const b = box(t.x + CPAD, y, t.w - 2 * CPAD, cardH(k));
        y += cardH(k) + 10;
        return b;
      });
      return { col, cards };
    });
    return { W, H, tabs, newB, share, avatars, search, filters, group, cols };
  }
  var PAGE_H4 = 900;

  // src/presets/kanban/design.jsx
  function Avatar({ x, y, d, who, ring }) {
    return /* @__PURE__ */ h(Fragment, null, ring ? /* @__PURE__ */ h("circle", { cx: x + d / 2, cy: y + d / 2, r: d / 2 + 2, fill: "#FFFFFF" }) : null, /* @__PURE__ */ h("circle", { cx: x + d / 2, cy: y + d / 2, r: d / 2, fill: PEOPLE[who] || "#E5E7EB" }), /* @__PURE__ */ h(Text, { x, y: y + (d - 14) / 2, width: d, align: "center", size: d > 24 ? 11 : 9.5, lh: 14, weight: 700, color: "#FFFFFF" }, who));
  }
  function Header3({ L }) {
    const nameW = tw(PROJECT, 16, 600);
    const av = L.avatars;
    return /* @__PURE__ */ h(Group, { id: "Header" }, /* @__PURE__ */ h("rect", { x: "0", y: HEAD3 - 1, width: L.W, height: "1", fill: C6.line }), /* @__PURE__ */ h(Box, { x: 24, y: 16, w: 28, h: 28, r: 7, fill: "#DBEAFE" }), /* @__PURE__ */ h(Icon, { name: "layers", x: 30, y: 22, size: 16, color: C6.accent, sw: 2 }), /* @__PURE__ */ h(Text, { x: 62, y: 18, size: 16, lh: 24, weight: 600, color: C6.ink }, PROJECT), /* @__PURE__ */ h(Icon, { name: "star", x: 62 + nameW + 8, y: 22, size: 16, color: C6.muted }), TABS2.map((t, i) => /* @__PURE__ */ h(Fragment, null, /* @__PURE__ */ h(Text, { x: L.tabs[i].x, y: 20, size: 14, lh: 20, weight: 500, color: i === 0 ? C6.ink : C6.ink2 }, t), i === 0 ? /* @__PURE__ */ h("rect", { x: L.tabs[i].x, y: HEAD3 - 2, width: L.tabs[i].w, height: "2", fill: C6.accent }) : null)), ["AK", "MR", "JL", "SN"].map((p, i) => /* @__PURE__ */ h(Avatar, { x: av.x + i * 20, y: av.y, d: 28, who: p, ring: true })), /* @__PURE__ */ h("circle", { cx: av.x + 80 + 14, cy: av.y + 14, r: "16", fill: "#FFFFFF" }), /* @__PURE__ */ h("circle", { cx: av.x + 80 + 14, cy: av.y + 14, r: "14", fill: "#E5E7EB" }), /* @__PURE__ */ h(Text, { x: av.x + 80, y: av.y + 7, width: 28, align: "center", size: 11, lh: 14, weight: 700, color: C6.ink2 }, "+3"), /* @__PURE__ */ h(Box, { x: L.share.x, y: L.share.y, w: L.share.w, h: 34, r: 8, fill: "#FFFFFF", stroke: C6.line }), /* @__PURE__ */ h(Text, { x: L.share.x, y: L.share.y + 7, width: L.share.w, align: "center", size: 13, lh: 20, weight: 600, color: C6.ink }, "Share"), /* @__PURE__ */ h(Box, { x: L.newB.x, y: L.newB.y, w: L.newB.w, h: 34, r: 8, fill: C6.accent }), /* @__PURE__ */ h(Icon, { name: "plus", x: L.newB.x + 12, y: L.newB.y + 10, size: 14, color: "#FFFFFF", sw: 2.2 }), /* @__PURE__ */ h(Text, { x: L.newB.x + 32, y: L.newB.y + 7, size: 13, lh: 20, weight: 600, color: "#FFFFFF" }, "New ticket"));
  }
  function Toolbar({ L }) {
    const s = L.search, g = L.group;
    return /* @__PURE__ */ h(Group, { id: "Toolbar" }, /* @__PURE__ */ h(Box, { x: s.x, y: s.y, w: s.w, h: 32, r: 8, fill: "#FFFFFF", stroke: C6.line }), /* @__PURE__ */ h(Icon, { name: "search", x: s.x + 10, y: s.y + 9, size: 14, color: C6.muted }), /* @__PURE__ */ h(Text, { x: s.x + 32, y: s.y + 6, size: 13, lh: 20, weight: 400, color: C6.muted }, "Filter tickets"), FILTERS.map((t, i) => {
      const b = L.filters[i];
      return /* @__PURE__ */ h(Fragment, null, /* @__PURE__ */ h(Box, { x: b.x, y: b.y, w: b.w, h: 32, r: 8, fill: "#FFFFFF", stroke: C6.line }), /* @__PURE__ */ h(Text, { x: b.x + 12, y: b.y + 6, size: 13, lh: 20, weight: 500, color: C6.ink2 }, t), /* @__PURE__ */ h(Icon, { name: "chevronDown", x: b.x + b.w - 22, y: b.y + 10, size: 12, color: C6.ink2, sw: 2 }));
    }), /* @__PURE__ */ h(Text, { x: g.x, y: g.y, size: 13, lh: 20, weight: 400, color: C6.muted }, "Group by"), /* @__PURE__ */ h(Text, { x: g.x + tw("Group by", 13) + 6, y: g.y, size: 13, lh: 20, weight: 600, color: C6.ink }, "Status"), /* @__PURE__ */ h(Icon, { name: "chevronDown", x: g.x + g.w - 12, y: g.y + 4, size: 12, color: C6.ink2, sw: 2 }));
  }
  function Card3({ b, k }) {
    const out = [];
    out.push(/* @__PURE__ */ h(Box, { x: b.x, y: b.y, w: b.w, h: b.h, r: 10, fill: "#FFFFFF", stroke: C6.line }));
    const x = b.x + 14;
    if (k.done) out.push(/* @__PURE__ */ h(Icon, { name: "check", x, y: b.y + 15, size: 14, color: "#10B981", sw: 2.4 }));
    out.push(/* @__PURE__ */ h(Text, { x: k.done ? x + 18 : x, y: b.y + 14, size: 11.5, lh: 16, weight: 500, family: "mono", color: k.done ? "#059669" : C6.muted }, k.id));
    out.push(/* @__PURE__ */ h(Icon, { name: "flag", x: b.x + b.w - 28, y: b.y + 15, size: 14, color: PRI[k.pri], sw: 2 }));
    out.push(/* @__PURE__ */ h(Text, { x, y: b.y + 36, size: 14, lh: 20, weight: 600, color: C6.ink }, k.title));
    let lx = x;
    for (const [t, c] of k.labels) {
      const w = Math.round(tw(t, 11, 600)) + 14, [bg, fg] = LABEL[c];
      out.push(/* @__PURE__ */ h(Box, { x: lx, y: b.y + 66, w, h: 20, r: 6, fill: bg }), /* @__PURE__ */ h(Text, { x: lx, y: b.y + 66, width: w, align: "center", size: 11, lh: 20, weight: 600, color: fg }, t));
      lx += w + 6;
    }
    let fy = b.y + 98;
    if (k.progress != null) {
      out.push(/* @__PURE__ */ h(Box, { x, y: b.y + 98, w: b.w - 28, h: 4, r: 2, fill: C6.line }), /* @__PURE__ */ h(Box, { x, y: b.y + 98, w: (b.w - 28) * k.progress, h: 4, r: 2, fill: C6.accent }));
      fy += 16;
    }
    out.push(/* @__PURE__ */ h(Avatar, { x, y: fy, d: 22, who: k.who }));
    const dw = tw(k.due, 12, 400);
    out.push(/* @__PURE__ */ h(Icon, { name: "calendar", x: b.x + b.w - 14 - dw - 6 - 14, y: fy + 4, size: 14, color: C6.muted }), /* @__PURE__ */ h(Text, { x: b.x + b.w - 14, y: fy + 3, align: "right", size: 12, lh: 16, weight: 400, color: C6.ink2 }, k.due));
    return /* @__PURE__ */ h(Group, { id: `Card/${k.id}` }, out);
  }
  function Board({ L }) {
    return /* @__PURE__ */ h(Group, { id: "Board" }, L.cols.map(({ col, cards }, i) => {
      const c = COLUMNS[i];
      const nw = tw(c.name, 13.5, 600);
      const cw = Math.max(20, Math.round(tw(String(c.cards.length), 11.5, 600)) + 14);
      return /* @__PURE__ */ h(Group, { id: `Column/${c.name}` }, /* @__PURE__ */ h(Box, { x: col.x, y: col.y, w: col.w, h: col.h, r: 12, fill: C6.col }), /* @__PURE__ */ h("circle", { cx: col.x + CPAD + 8, cy: col.y + CPAD + 18, r: "4", fill: c.color }), /* @__PURE__ */ h(Text, { x: col.x + CPAD + 18, y: col.y + CPAD + 8, size: 13.5, lh: 20, weight: 600, color: C6.ink }, c.name), /* @__PURE__ */ h(Box, { x: col.x + CPAD + 18 + nw + 8, y: col.y + CPAD + 8, w: cw, h: 20, r: 10, fill: "#E5E7EB" }), /* @__PURE__ */ h(Text, { x: col.x + CPAD + 18 + nw + 8, y: col.y + CPAD + 8, width: cw, align: "center", size: 11.5, lh: 20, weight: 600, color: C6.ink2 }, String(c.cards.length)), /* @__PURE__ */ h(Icon, { name: "plus", x: col.x + col.w - CPAD - 22, y: col.y + CPAD + 10, size: 16, color: C6.muted, sw: 2 }), cards.map((b, j) => /* @__PURE__ */ h(Card3, { b, k: c.cards[j] })));
    }));
  }
  function kanbanDesign({ W = 1440, H = PAGE_H4 } = {}) {
    const L = layout6(W, H);
    const D = doc("Remediation board", W, H);
    return D.svg(/* @__PURE__ */ h(Fragment, null, /* @__PURE__ */ h(Header3, { L }), /* @__PURE__ */ h(Toolbar, { L }), /* @__PURE__ */ h(Board, { L })), C6.page);
  }

  // src/presets/kanban/build.jsx
  var UI6 = `Tahoma, Verdana, 'DejaVu Sans', sans-serif`;
  var MONO4 = `'SF Mono', Menlo, Consolas, 'DejaVu Sans Mono', monospace`;
  var I6 = (name, size, color2, sw) => raw(iconHtml(name, size, color2, sw));
  var css6 = (o) => `
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%}
body{background:#FFFFFF;color:${C6.ink};font-family:${UI6};overflow:hidden}
button{font:inherit;color:inherit;background:none;border:0}
.mono{font-family:${MONO4}}
.app{display:flex;flex-direction:column;height:100vh}
header{flex:none;height:60px;display:flex;align-items:center;padding:0 24px;box-shadow:inset 0 -1px 0 ${C6.line}}
.pi{width:28px;height:28px;border-radius:7px;background:#DBEAFE;display:flex;align-items:center;justify-content:center;flex:none}
.pn{margin-left:10px;font-size:16px;line-height:24px;font-weight:600;white-space:nowrap}
.star{margin-left:8px;display:flex}
.tabs{margin-left:32px;align-self:stretch;display:flex;gap:24px;font-size:14px;line-height:20px;font-weight:500;color:${C6.ink2}}
.tabs a{padding-top:20px;white-space:nowrap}
.tabs a.on{color:${C6.ink};box-shadow:inset 0 -2px 0 ${C6.accent}}
.people{margin-left:auto;display:flex}
.av{width:28px;height:28px;border-radius:50%;box-shadow:0 0 0 2px #FFFFFF;color:#FFFFFF;font-size:11px;line-height:14px;font-weight:700;display:flex;align-items:center;justify-content:center;flex:none}
.av+.av{margin-left:-8px}
.av.more{background:#E5E7EB;color:${C6.ink2}}
.share{margin-left:16px;height:34px;padding:0 13px;border:1px solid ${C6.line};border-radius:8px;font-size:13px;line-height:20px;font-weight:600}
.new{margin-left:10px;height:34px;padding:0 14px 0 12px;border-radius:8px;background:${C6.accent};color:#FFFFFF;display:flex;align-items:center;gap:6px;font-size:13px;line-height:20px;font-weight:600;white-space:nowrap}
.tools{flex:none;height:52px;display:flex;align-items:center;padding:0 24px}
.search{width:240px;height:32px;border:1px solid ${C6.line};border-radius:8px;display:flex;align-items:center;gap:8px;padding-left:9px;font-size:13px;line-height:20px;color:${C6.muted}}
.filter{margin-left:8px;height:32px;border:1px solid ${C6.line};border-radius:8px;display:flex;align-items:center;gap:6px;padding:0 9px 0 11px;font-size:13px;line-height:20px;font-weight:500;color:${C6.ink2};white-space:nowrap}
.search+.filter{margin-left:12px}
.group{margin-left:${o.groupLeft ? "16px" : "auto"};display:flex;align-items:center;gap:4px;font-size:13px;line-height:20px;color:${C6.muted};white-space:nowrap}
.group b{margin-left:2px;font-weight:600;color:${C6.ink}}
.board{flex:1;min-height:0;display:flex;gap:${o.colGap ? 28 : 16}px;padding:8px 24px 24px}
.col{${o.fixedCols ? "flex:none;width:336px" : "flex:1;min-width:0"};border-radius:12px;background:${C6.col};padding:10px}
.ch{height:36px;display:flex;align-items:center;padding:0 6px 0 4px;margin-bottom:4px}
.ch i{width:8px;height:8px;border-radius:50%;flex:none}
.ch b{margin-left:6px;font-size:13.5px;line-height:20px;font-weight:600;white-space:nowrap}
.cnt{margin-left:8px;min-width:20px;height:20px;padding:0 7px;border-radius:10px;background:#E5E7EB;font-size:11.5px;line-height:20px;font-weight:600;color:${C6.ink2};text-align:center}
.ch svg{margin-left:auto}
.cards{display:flex;flex-direction:column;gap:10px}
.card{height:134px;border:1px solid ${C6.line};border-radius:10px;background:#FFFFFF;padding:13px 13px 0}
.card.p{height:150px}
.r1{height:16px;display:flex;align-items:center}
.id{font-size:11.5px;line-height:16px;font-weight:500;color:${C6.muted}}
.done .id{color:#059669}
.r1 .ok{margin-right:4px;display:flex}
.r1 .pri{margin-left:auto;display:flex}
.title{margin-top:6px;font-size:14px;line-height:20px;font-weight:600;white-space:nowrap;overflow:hidden${o.ellipsis ? ";max-width:40%;text-overflow:ellipsis" : ""}}
.labels{margin-top:10px;display:flex;gap:6px}
.lab{height:20px;padding:0 7px;border-radius:6px;font-size:11px;line-height:20px;font-weight:600;white-space:nowrap}
.bar{margin-top:12px;height:4px;border-radius:2px;background:${C6.line};overflow:hidden}
.bar i{display:block;height:100%;border-radius:2px;background:${C6.accent}}
.foot{margin-top:12px;height:22px;display:flex;align-items:center}
.who{width:22px;height:22px;border-radius:50%;color:#FFFFFF;font-size:9.5px;line-height:14px;font-weight:700;display:flex;align-items:center;justify-content:center}
.due{margin-left:auto;display:flex;align-items:center;gap:6px;font-size:12px;line-height:16px;color:${C6.ink2}}
`;
  function kanbanBuild(o = {}) {
    const cols = COLUMNS.map((c) => o.doneOrder && c.name === "Done" ? { ...c, cards: c.cards.slice().reverse() } : c);
    const card = (k, ci) => {
      return /* @__PURE__ */ hh("div", { className: "card" + (k.progress != null ? " p" : "") + (k.done ? " done" : ""), "data-bug": o.doneOrder && ci === 3 ? "Done column in reverse order" : null }, /* @__PURE__ */ hh("div", { className: "r1" }, k.done ? /* @__PURE__ */ hh("span", { className: "ok" }, I6("check", 14, "#10B981", 2.4)) : null, /* @__PURE__ */ hh("span", { className: "id mono" }, k.id), /* @__PURE__ */ hh("span", { className: "pri" }, I6("flag", 14, PRI[k.pri], 2))), /* @__PURE__ */ hh("div", { className: "title", "data-bug": o.ellipsis ? "Card titles clamped to 40% of the card with an ellipsis" : null }, k.title), /* @__PURE__ */ hh("div", { className: "labels" }, k.labels.map(([t, c]) => {
        const [bg, fg] = o.labelBlue && c === "red" ? LABEL.blue : LABEL[c];
        return /* @__PURE__ */ hh("span", { className: "lab", style: { background: bg, color: fg }, "data-bug": o.labelBlue && c === "red" ? "CVE labels tinted blue, spec is red" : null }, t);
      })), k.progress != null ? /* @__PURE__ */ hh("div", { className: "bar" }, /* @__PURE__ */ hh("i", { style: { width: `${k.progress * 100}%` } })) : null, /* @__PURE__ */ hh("div", { className: "foot" }, o.noAvatar && k.id === "SEC-142" ? null : /* @__PURE__ */ hh("span", { className: "who", style: { background: PEOPLE[k.who] } }, k.who), /* @__PURE__ */ hh("span", { className: "due" }, I6("calendar", 14, C6.muted), k.due)));
    };
    const body = /* @__PURE__ */ hh("body", null, /* @__PURE__ */ hh("div", { className: "app" }, /* @__PURE__ */ hh("header", null, /* @__PURE__ */ hh("span", { className: "pi" }, I6("layers", 16, C6.accent, 2)), /* @__PURE__ */ hh("span", { className: "pn" }, PROJECT), /* @__PURE__ */ hh("span", { className: "star" }, I6("star", 16, C6.muted)), /* @__PURE__ */ hh("nav", { className: "tabs" }, TABS2.map((t, i) => /* @__PURE__ */ hh("a", { className: i === 0 ? "on" : null }, t))), /* @__PURE__ */ hh("div", { className: "people" }, ["AK", "MR", "JL", "SN"].map((p) => /* @__PURE__ */ hh("span", { className: "av", style: { background: PEOPLE[p] } }, p)), /* @__PURE__ */ hh("span", { className: "av more" }, "+3")), /* @__PURE__ */ hh("button", { className: "share" }, "Share"), /* @__PURE__ */ hh("button", { className: "new" }, I6("plus", 14, "#FFFFFF", 2.2), "New ticket")), /* @__PURE__ */ hh("div", { className: "tools" }, /* @__PURE__ */ hh("label", { className: "search" }, I6("search", 14, C6.muted), "Filter tickets"), FILTERS.filter((t) => !(o.noLabelsFilter && t === "Labels")).map((t) => /* @__PURE__ */ hh("button", { className: "filter" }, t, I6("chevronDown", 12, C6.ink2, 2))), /* @__PURE__ */ hh("span", { className: "group", "data-bug": o.groupLeft ? "Group by control follows the filters, spec pins it right" : null }, "Group by", /* @__PURE__ */ hh("b", null, "Status"), I6("chevronDown", 12, C6.ink2, 2))), /* @__PURE__ */ hh("main", { className: "board", "data-bug": o.colGap ? "Columns 28px apart, spec is 16px" : null }, cols.map((c, ci) => /* @__PURE__ */ hh("section", { className: "col" }, /* @__PURE__ */ hh("div", { className: "ch" }, /* @__PURE__ */ hh("i", { style: { background: c.color } }), /* @__PURE__ */ hh("b", null, c.name), /* @__PURE__ */ hh("span", { className: "cnt" }, String(c.cards.length)), I6("plus", 16, C6.muted, 2)), /* @__PURE__ */ hh("div", { className: "cards" }, c.cards.map((k) => card(k, ci))))))));
    return page(`<title>${PROJECT}</title>
<style>${css6(o)}</style>`, String(body));
  }

  // src/presets/mobile/data.js
  var USER3 = { name: "Maya", initials: "MO" };
  var STATUS = { title: "You are protected", sub: "12 accounts monitored · last scan 2 min ago", score: 92 };
  var ACTIONS = [["radar", "Scan", "#4F46E5", "#EEF2FF"], ["key", "Passwords", "#0EA5E9", "#E0F2FE"], ["shield", "VPN", "#10B981", "#D1FAE5"], ["cpu", "Devices", "#F59E0B", "#FEF3C7"]];
  var ALERTS2 = [
    { icon: "alert", tint: "#DC2626", bg: "#FEE2E2", title: "Password found in a breach", sub: "maya@fastmail.com · 2 sites", time: "9:41" },
    { icon: "globe", tint: "#EA580C", bg: "#FFEDD5", title: "New sign-in from Lisbon", sub: "Chrome on macOS · approve?", time: "8:02" },
    { icon: "lock", tint: "#2563EB", bg: "#DBEAFE", title: "Router firmware updated", sub: "Home network · 1.4.22", time: "Yday" },
    { icon: "check", tint: "#059669", bg: "#D1FAE5", title: "Weekly scan complete", sub: "No new exposures found", time: "Mon" }
  ];
  var TABS3 = [["home", "Home", true], ["shield", "Protect"], ["bell", "Alerts"], ["user", "Account"]];
  var C7 = { page: "#F6F7FB", card: "#FFFFFF", ink: "#0F172A", ink2: "#475569", muted: "#94A3B8", line: "#E8ECF2", accent: "#4F46E5" };

  // src/presets/mobile/layout.js
  var SIDE4 = 20;
  var STATUS_H = 47;
  var TABBAR = 84;
  function layout7(W, H, o = {}) {
    const w = o.fixedWidth ? 390 : W;
    const cw = w - 2 * SIDE4;
    const head = { y: STATUS_H + 8 };
    const card = box(SIDE4, head.y + 44 + 16, cw, 168);
    const actY = card.y + card.h + 24;
    const acts = tracks(SIDE4, cw, ACTIONS.map(() => "1fr"), 12).map((t) => box(t.x, actY + 28, t.w, 88));
    const listY = actY + 28 + 88 + 24;
    const list = box(SIDE4, listY + 28, cw, ALERTS2.length * 64);
    const tabbar = box(0, H - TABBAR, w, TABBAR);
    return { W, H, w, cw, head, card, actY, acts, listY, list, tabbar, tabs: tracks(0, w, ["1fr", "1fr", "1fr", "1fr"], 0) };
  }
  var PAGE = { w: 390, h: 844 };

  // src/presets/mobile/design.jsx
  function StatusBar({ L }) {
    const r = L.w - 24;
    return /* @__PURE__ */ h(Group, { id: "Status bar" }, /* @__PURE__ */ h(Text, { x: 30, y: 14, size: 15, lh: 20, weight: 600, color: C7.ink }, "9:41"), [0, 1, 2, 3].map((i) => /* @__PURE__ */ h("rect", { x: r - 66 + i * 5, y: 26 - (i + 1) * 3, width: "3", height: (i + 1) * 3, rx: "1", fill: C7.ink })), /* @__PURE__ */ h(Icon, { name: "wifi", x: r - 44, y: 15, size: 16, color: C7.ink, sw: 2.2 }), /* @__PURE__ */ h("rect", { x: r - 25, y: "16.5", width: "22", height: "11", rx: "3", stroke: C7.ink, strokeOpacity: "0.4" }), /* @__PURE__ */ h("rect", { x: r - 23, y: "18.5", width: "16", height: "7", rx: "1.5", fill: C7.ink }));
  }
  function Greeting({ L }) {
    const y = L.head.y;
    return /* @__PURE__ */ h(Group, { id: "Greeting" }, /* @__PURE__ */ h("circle", { cx: SIDE4 + 20, cy: y + 22, r: "20", fill: "#C7D2FE" }), /* @__PURE__ */ h(Text, { x: SIDE4, y: y + 13, width: 40, align: "center", size: 13, lh: 18, weight: 700, color: "#3730A3" }, USER3.initials), /* @__PURE__ */ h(Text, { x: SIDE4 + 52, y: y + 2, size: 13, lh: 18, weight: 400, color: C7.muted }, "Good morning,"), /* @__PURE__ */ h(Text, { x: SIDE4 + 52, y: y + 20, size: 20, lh: 24, weight: 600, color: C7.ink }, USER3.name), /* @__PURE__ */ h("circle", { cx: L.w - SIDE4 - 20, cy: y + 22, r: "19.5", fill: "#FFFFFF", stroke: C7.line }), /* @__PURE__ */ h(Icon, { name: "bell", x: L.w - SIDE4 - 30, y: y + 12, size: 20, color: C7.ink }), /* @__PURE__ */ h("circle", { cx: L.w - SIDE4 - 13, cy: y + 13, r: "4", fill: "#EF4444", stroke: "#FFFFFF", strokeWidth: "1.5" }));
  }
  function StatusCard({ L, D }) {
    const c = L.card;
    const cx = c.x + c.w / 2, cy = c.y + c.h / 2, len = (c.w + c.h) * Math.SQRT1_2, dx = Math.SQRT1_2 * len / 2;
    const grad = D.linear(cx - dx, cy - dx, cx + dx, cy + dx, [[0, "#4F46E5"], [1, "#7C3AED"]]);
    const rx = c.x + c.w - 20 - 28, ry = c.y + 20 + 28, a = Math.PI * 2 * 0.92;
    return /* @__PURE__ */ h(Group, { id: "Status card" }, /* @__PURE__ */ h("rect", { x: num(c.x), y: num(c.y), width: num(c.w), height: c.h, rx: "24", fill: grad }), /* @__PURE__ */ h(Box, { x: c.x + 20, y: c.y + 20, w: 44, h: 44, r: 14, fill: "#FFFFFF", opacity: 0.18 }), /* @__PURE__ */ h(Icon, { name: "shieldCheck", x: c.x + 31, y: c.y + 31, size: 22, color: "#FFFFFF", sw: 2 }), /* @__PURE__ */ h("circle", { cx: rx, cy: ry, r: "24", stroke: "#FFFFFF", strokeOpacity: "0.25", strokeWidth: "6" }), /* @__PURE__ */ h("path", { d: `M${num(rx)} ${num(ry - 24)}A24 24 0 1 1 ${num(rx + 24 * Math.sin(a))} ${num(ry - 24 * Math.cos(a))}`, stroke: "#FFFFFF", strokeWidth: "6", strokeLinecap: "round" }), /* @__PURE__ */ h(Text, { x: rx - 24, y: ry - 10, width: 48, align: "center", size: 15, lh: 20, weight: 700, color: "#FFFFFF" }, String(STATUS.score)), /* @__PURE__ */ h(Text, { x: c.x + 20, y: c.y + 84, size: 20, lh: 26, weight: 600, color: "#FFFFFF" }, STATUS.title), /* @__PURE__ */ h(Text, { x: c.x + 20, y: c.y + 112, size: 13, lh: 18, weight: 400, color: "#E0E7FF" }, STATUS.sub), /* @__PURE__ */ h(Box, { x: c.x + 20, y: c.y + 144, w: c.w - 40, h: 6, r: 3, fill: "#FFFFFF", opacity: 0.25 }), /* @__PURE__ */ h(Box, { x: c.x + 20, y: c.y + 144, w: (c.w - 40) * 0.92, h: 6, r: 3, fill: "#FFFFFF" }));
  }
  function Section({ x, y, w, title, link }) {
    return /* @__PURE__ */ h(Fragment, null, /* @__PURE__ */ h(Text, { x, y, size: 15, lh: 20, weight: 600, color: C7.ink }, title), /* @__PURE__ */ h(Text, { x: x + w, y: y + 1, align: "right", size: 13, lh: 18, weight: 500, color: C7.accent }, link));
  }
  function Actions({ L }) {
    return /* @__PURE__ */ h(Group, { id: "Quick actions" }, /* @__PURE__ */ h(Section, { x: SIDE4, y: L.actY, w: L.cw, title: "Quick actions", link: "Edit" }), ACTIONS.map(([icon, label, tint, bg], i) => {
      const b = L.acts[i];
      return /* @__PURE__ */ h(Fragment, null, /* @__PURE__ */ h(Box, { x: b.x, y: b.y, w: b.w, h: b.h, r: 16, fill: C7.card, stroke: C7.line }), /* @__PURE__ */ h(Box, { x: b.x + (b.w - 40) / 2, y: b.y + 14, w: 40, h: 40, r: 12, fill: bg }), /* @__PURE__ */ h(Icon, { name: icon, x: b.x + (b.w - 20) / 2, y: b.y + 24, size: 20, color: tint, sw: 2 }), /* @__PURE__ */ h(Text, { x: b.x, y: b.y + 62, width: b.w, align: "center", size: 12.5, lh: 16, weight: 500, color: C7.ink2 }, label));
    }));
  }
  function Alerts2({ L }) {
    const l = L.list;
    return /* @__PURE__ */ h(Group, { id: "Recent alerts" }, /* @__PURE__ */ h(Section, { x: SIDE4, y: L.listY, w: L.cw, title: "Recent alerts", link: "See all" }), /* @__PURE__ */ h(Box, { x: l.x, y: l.y, w: l.w, h: l.h, r: 18, fill: C7.card, stroke: C7.line }), ALERTS2.map((a, i) => {
      const ry = l.y + i * 64;
      return /* @__PURE__ */ h(Fragment, null, i ? /* @__PURE__ */ h("rect", { x: num(l.x + 64), y: ry, width: num(l.w - 64), height: "1", fill: C7.line }) : null, /* @__PURE__ */ h(Box, { x: l.x + 16, y: ry + 14, w: 36, h: 36, r: 11, fill: a.bg }), /* @__PURE__ */ h(Icon, { name: a.icon, x: l.x + 25, y: ry + 23, size: 18, color: a.tint, sw: 2 }), /* @__PURE__ */ h(Text, { x: l.x + 64, y: ry + 12, size: 14, lh: 20, weight: 600, color: C7.ink }, a.title), /* @__PURE__ */ h(Text, { x: l.x + 64, y: ry + 33, size: 12.5, lh: 18, weight: 400, color: C7.muted }, a.sub), /* @__PURE__ */ h(Text, { x: l.x + l.w - 16 - 14 - 6, y: ry + 23, align: "right", size: 12, lh: 18, weight: 400, color: C7.muted }, a.time), /* @__PURE__ */ h(Icon, { name: "chevronRight", x: l.x + l.w - 16 - 14, y: ry + 25, size: 14, color: C7.muted, sw: 2 }));
    }));
  }
  function TabBar({ L }) {
    const t = L.tabbar;
    return /* @__PURE__ */ h(Group, { id: "Tab bar" }, /* @__PURE__ */ h(Box, { x: 0, y: t.y, w: L.w, h: t.h, fill: "#FFFFFF" }), /* @__PURE__ */ h("rect", { x: "0", y: t.y, width: L.w, height: "1", fill: C7.line }), TABS3.map(([icon, label, on], i) => {
      const c = L.tabs[i];
      return /* @__PURE__ */ h(Fragment, null, /* @__PURE__ */ h(Icon, { name: icon, x: c.x + (c.w - 22) / 2, y: t.y + 10, size: 22, color: on ? C7.accent : C7.muted, sw: 2 }), /* @__PURE__ */ h(Text, { x: c.x, y: t.y + 36, width: c.w, align: "center", size: 11, lh: 14, weight: on ? 600 : 500, color: on ? C7.accent : C7.muted }, label));
    }), /* @__PURE__ */ h(Box, { x: (L.w - 134) / 2, y: L.H - 13, w: 134, h: 5, r: 2.5, fill: C7.ink }));
  }
  function mobileDesign({ W = PAGE.w, H = PAGE.h } = {}) {
    const L = layout7(W, H);
    const D = doc("Mobile · Home", W, H);
    return D.svg(/* @__PURE__ */ h(Fragment, null, /* @__PURE__ */ h(StatusBar, { L }), /* @__PURE__ */ h(Greeting, { L }), /* @__PURE__ */ h(StatusCard, { L, D }), /* @__PURE__ */ h(Actions, { L }), /* @__PURE__ */ h(Alerts2, { L }), /* @__PURE__ */ h(TabBar, { L })), C7.page);
  }

  // src/presets/mobile/build.jsx
  var UI7 = `Roboto, 'Liberation Sans', Arial, sans-serif`;
  var I7 = (name, size, color2, sw) => raw(iconHtml(name, size, color2, sw));
  var css7 = (o) => `
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%}
body{background:${C7.page};color:${C7.ink};font-family:${UI7};overflow:hidden}
.screen{position:relative;height:100vh;${o.fixedWidth ? "width:390px" : ""}}
.sb{height:47px;display:flex;align-items:flex-start;padding:14px 24px 0 30px}
.sb b{font-size:15px;line-height:20px;font-weight:600}
.sb .ic{margin-left:auto;display:flex;align-items:center;gap:6px;margin-top:2px}
.bars{display:flex;align-items:flex-end;gap:2px;height:12px}
.bars i{width:3px;border-radius:1px;background:${C7.ink}}
.bat{position:relative;width:22px;height:11px;border:1px solid rgba(15,23,42,.4);border-radius:3px}
.bat i{position:absolute;left:1px;top:1px;width:16px;height:7px;border-radius:1.5px;background:${C7.ink}}
.wrap{padding:8px 20px 0}
.hi{height:44px;display:flex;align-items:center}
.me{width:40px;height:40px;border-radius:50%;background:#C7D2FE;color:#3730A3;font-size:13px;line-height:18px;font-weight:700;display:flex;align-items:center;justify-content:center;flex:none}
.greet{margin-left:12px}
.greet span{display:block;font-size:13px;line-height:18px;color:${C7.muted}}
.greet b{display:block;font-size:20px;line-height:24px;font-weight:600}
.bell{position:relative;margin-left:${o.bellLeft ? "16px" : "auto"};width:40px;height:40px;border-radius:50%;background:#FFFFFF;border:1px solid ${C7.line};display:flex;align-items:center;justify-content:center}
.bell::after{content:"";position:absolute;right:6px;top:4px;width:8px;height:8px;border-radius:50%;background:#EF4444;box-shadow:0 0 0 1.5px #FFFFFF}
.status{position:relative;margin-top:16px;height:168px;border-radius:${o.cardRadius ? 8 : 24}px;background:linear-gradient(135deg,#4F46E5,#7C3AED);padding:20px;color:#FFFFFF}
.st{width:44px;height:44px;border-radius:14px;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center}
.ring{position:absolute;right:17px;top:17px;width:62px;height:62px}
.ring b{position:absolute;left:0;right:0;top:21px;text-align:center;font-size:15px;line-height:20px;font-weight:700}
.status h2{margin-top:20px;font-size:20px;line-height:26px;font-weight:600;white-space:nowrap}
.status p{margin-top:2px;font-size:13px;line-height:18px;color:#E0E7FF;white-space:nowrap}
.prog{margin-top:14px;height:6px;border-radius:3px;background:rgba(255,255,255,.25)}
.prog i{display:block;width:92%;height:100%;border-radius:3px;background:#FFFFFF}
.sec{margin-top:24px;height:20px;display:flex;align-items:baseline}
.sec b{font-size:15px;line-height:20px;font-weight:600}
.sec a{margin-left:auto;font-size:13px;line-height:18px;font-weight:500;color:${C7.accent}}
.acts{margin-top:8px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.act{height:${o.tallTiles ? 100 : 88}px;border-radius:16px;background:#FFFFFF;border:1px solid ${C7.line};padding-top:13px;text-align:center}
.ai{width:40px;height:40px;margin:0 auto;border-radius:12px;display:flex;align-items:center;justify-content:center}
.act .lbl{display:block;margin-top:8px;font-size:12.5px;line-height:16px;font-weight:500;color:${C7.ink2}}
.list{margin-top:8px;border-radius:18px;background:#FFFFFF;border:1px solid ${C7.line}}
.row{position:relative;height:64px;display:flex;align-items:flex-start;padding:13px 15px 0}
.row+.row::before{content:"";position:absolute;left:63px;right:-1px;top:-1px;height:1px;background:${C7.line}}
.row+.row{margin-top:0}
.ri{width:36px;height:36px;border-radius:11px;display:flex;align-items:center;justify-content:center;flex:none;margin-top:0}
.rt{margin-left:12px;min-width:0}
.rt b{display:block;margin-top:-2px;font-size:14px;line-height:20px;font-weight:600;white-space:nowrap}
.rt span{display:block;margin-top:1px;font-size:12.5px;line-height:18px;color:${C7.muted};white-space:nowrap}
.time{margin-left:auto;margin-top:9px;font-size:12px;line-height:18px;color:${C7.muted}}
.row .chev{margin:11px 0 0 6px;display:flex}
.tabbar{position:absolute;left:0;right:0;bottom:0;height:84px;background:#FFFFFF;box-shadow:inset 0 1px 0 ${C7.line};display:grid;grid-template-columns:repeat(4,minmax(0,1fr))}
.tab{padding-top:10px;text-align:center;font-size:11px;line-height:14px;font-weight:500;color:${C7.muted}}
.tab svg{display:block;margin:0 auto 4px}
.tab.on{color:${C7.accent};font-weight:600}
.home{position:absolute;left:50%;bottom:8px;width:134px;height:5px;margin-left:-67px;border-radius:2.5px;background:${C7.ink}}
`;
  function mobileBuild(o = {}) {
    const ringSvg2 = () => {
      const a = Math.PI * 2 * 0.92, x = 31 + 24 * Math.sin(a), y = 31 - 24 * Math.cos(a);
      return raw(`<svg viewBox="0 0 62 62" width="62" height="62"><circle cx="31" cy="31" r="24" fill="none" stroke="#FFFFFF" stroke-opacity="0.25" stroke-width="6"/><path d="M31 7A24 24 0 1 1 ${num(x)} ${num(y)}" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round"/></svg>`);
    };
    const body = /* @__PURE__ */ hh("body", null, /* @__PURE__ */ hh("div", { className: "screen" }, /* @__PURE__ */ hh("div", { className: "sb" }, /* @__PURE__ */ hh("b", null, "9:41"), /* @__PURE__ */ hh("span", { className: "ic" }, /* @__PURE__ */ hh("span", { className: "bars" }, [3, 6, 9, 12].map((hgt) => /* @__PURE__ */ hh("i", { style: { height: `${hgt}px` } }))), I7("wifi", 16, C7.ink, 2.2), /* @__PURE__ */ hh("span", { className: "bat" }, /* @__PURE__ */ hh("i", null)))), /* @__PURE__ */ hh("div", { className: "wrap" }, /* @__PURE__ */ hh("div", { className: "hi" }, /* @__PURE__ */ hh("span", { className: "me" }, USER3.initials), /* @__PURE__ */ hh("span", { className: "greet" }, /* @__PURE__ */ hh("span", null, "Good morning,"), /* @__PURE__ */ hh("b", null, USER3.name)), /* @__PURE__ */ hh("span", { className: "bell", "data-bug": o.bellLeft ? "Bell sits after the greeting, spec pins it to the right" : null }, I7("bell", 20, C7.ink))), /* @__PURE__ */ hh("section", { className: "status", "data-bug": o.cardRadius ? "Status card corners 8px, spec is 24px" : null }, /* @__PURE__ */ hh("span", { className: "st" }, I7("shieldCheck", 22, "#FFFFFF", 2)), /* @__PURE__ */ hh("span", { className: "ring" }, ringSvg2(), /* @__PURE__ */ hh("b", null, String(STATUS.score))), /* @__PURE__ */ hh("h2", null, STATUS.title), /* @__PURE__ */ hh("p", null, STATUS.sub), /* @__PURE__ */ hh("div", { className: "prog" }, /* @__PURE__ */ hh("i", null))), /* @__PURE__ */ hh("div", { className: "sec" }, /* @__PURE__ */ hh("b", null, "Quick actions"), /* @__PURE__ */ hh("a", null, "Edit")), /* @__PURE__ */ hh("div", { className: "acts", "data-bug": o.tallTiles ? "Quick action tiles 100px tall, spec is 88px" : null }, ACTIONS.map(([icon, label, tint, bg], i) => {
      const wrong = o.wrongIcon && i === 1;
      return /* @__PURE__ */ hh("div", { className: "act" }, /* @__PURE__ */ hh("span", { className: "ai", style: { background: bg }, "data-bug": wrong ? "Passwords tile shows a lock icon, spec is a key" : null }, I7(wrong ? "lock" : icon, 20, tint, 2)), /* @__PURE__ */ hh("span", { className: "lbl" }, label));
    })), /* @__PURE__ */ hh("div", { className: "sec" }, /* @__PURE__ */ hh("b", null, "Recent alerts"), /* @__PURE__ */ hh("a", null, "See all")), /* @__PURE__ */ hh("div", { className: "list" }, ALERTS2.map((a, i) => {
      const amber = o.alertAmber && i === 0;
      return /* @__PURE__ */ hh("div", { className: "row" }, /* @__PURE__ */ hh("span", { className: "ri", style: { background: amber ? "#FEF3C7" : a.bg }, "data-bug": amber ? "Breach alert icon amber, spec is red" : null }, I7(a.icon, 18, amber ? "#D97706" : a.tint, 2)), /* @__PURE__ */ hh("span", { className: "rt" }, /* @__PURE__ */ hh("b", null, a.title), /* @__PURE__ */ hh("span", null, a.sub)), /* @__PURE__ */ hh("span", { className: "time" }, a.time), o.noChevrons ? null : /* @__PURE__ */ hh("span", { className: "chev" }, I7("chevronRight", 14, C7.muted, 2)));
    }))), /* @__PURE__ */ hh("nav", { className: "tabbar" }, TABS3.map(([icon, label, on], i) => {
      const active = o.tabWrong ? i === 2 : !!on;
      return /* @__PURE__ */ hh("a", { className: "tab" + (active ? " on" : ""), "data-bug": o.tabWrong && (i === 0 || i === 2) ? "Alerts tab highlighted on the Home screen" : null }, I7(icon, 22, active ? C7.accent : C7.muted, 2), label);
    }), /* @__PURE__ */ hh("span", { className: "home" }))));
    return page(`<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Home</title>
<style>${css7(o)}</style>`, String(body));
  }

  // src/presets/index.js
  var DESIGNS = [
    {
      id: "soc",
      name: "SOC overview",
      kind: "svg",
      w: 1440,
      h: 960,
      family: "Dashboard",
      render: socDesign,
      layout,
      blurb: "Security operations dashboard: fixed sidebar, KPI tiles with sparklines, threat map, stacked area chart, donut, bars and an alerts table."
    },
    {
      id: "asm",
      name: "Attack surface",
      kind: "svg",
      w: 1440,
      h: 960,
      family: "Dashboard",
      render: asmDesign,
      layout: layout2,
      blurb: "Light-theme exposure dashboard: icon rail plus section panel, score gauge, ring stats, trend chart, port bars, severity heatmap and a risk table."
    },
    {
      id: "landing",
      name: "Landing page",
      kind: "svg",
      w: 1440,
      h: PAGE_H,
      family: "Marketing",
      render: landingDesign,
      layout: layout3,
      blurb: "Marketing page: centered 1200px container, two-column hero with a product illustration, logo strip, feature cards, a full-bleed stats band and a gradient call to action."
    },
    {
      id: "product",
      name: "Product page",
      kind: "svg",
      w: 1440,
      h: PAGE_H2,
      family: "Commerce",
      render: productDesign,
      layout: layout4,
      blurb: "Store product page: promo bar, header with search, thumbnail rail and a square product image beside a 480px buy box with rating, swatches, sizes and cart controls."
    },
    {
      id: "docs",
      name: "Docs page",
      kind: "svg",
      w: 1440,
      h: PAGE_H3,
      family: "Content",
      render: docsDesign,
      layout: layout5,
      blurb: "Documentation article: sidebar tree, a 720px measure with code tabs, a callout and a parameter table, and a table of contents that drops out below 1280px."
    },
    {
      id: "kanban",
      name: "Kanban board",
      kind: "svg",
      w: 1440,
      h: PAGE_H4,
      family: "App",
      render: kanbanDesign,
      layout: layout6,
      blurb: "Remediation board: header with tabs and people, a filter toolbar, and four flex columns of ticket cards with labels, progress, owners and dates."
    },
    {
      id: "mobile",
      name: "Mobile app",
      kind: "svg",
      w: PAGE.w,
      h: PAGE.h,
      family: "Mobile",
      render: mobileDesign,
      layout: layout7,
      blurb: "Phone home screen of a security app: gradient status card with a score ring, a four-up actions grid, an alerts list and a pinned tab bar."
    }
  ];
  var B2 = (id, design, name, make, note, extra = {}) => ({ id, design, name, kind: "html", make, note, ...extra });
  var BUILDS = [
    B2("soc-grid", "soc", "SOC · grid and flexbox", () => socBuild(), "Responsive build: 232px sidebar, fr grid tracks, inline SVG charts that stretch with their cards. Text falls back to Verdana."),
    B2(
      "soc-bugs",
      "soc",
      "SOC · five bugs",
      () => socBuild({ wrongDelta: true, smallDonut: true, wideOrigins: true, swapCols: true, pillSearch: true }),
      "Wrong delta color, smaller donut, wider origins column, two table columns swapped, pill-shaped search field."
    ),
    B2("soc-fixed", "soc", "SOC · fixed-pixel grid", () => socBuild({ fixedGrid: true }), "Same markup with every grid track frozen at its 1440 × 960 pixel size. Identical at 1×; does not respond to the viewport."),
    B2("asm-grid", "asm", "Attack surface · grid build", () => asmBuild(), "Responsive build: rail and panel in fixed tracks, fr rows and columns, stretchable inline SVG charts. Text falls back to Arial."),
    B2(
      "asm-bugs",
      "asm",
      "Attack surface · five bugs",
      () => asmBuild({ gaugeColor: true, swapTiles: true, tightServices: true, dropScan: true, tallHeader: true }),
      "Gauge in the wrong color, two stat tiles swapped, service rows too tight, Run scan button dropped, header 8px taller.",
      { missing: [{ label: "Run scan button missing", at: (L) => L.header.scan }] }
    ),
    B2("landing-web", "landing", "Landing · container and grid", () => landingBuild(), "Responsive build: max-width container, fr grids, an inline SVG illustration that scales with its column. Text falls back to Trebuchet MS."),
    B2(
      "landing-bugs",
      "landing",
      "Landing · five bugs",
      () => landingBuild({ ctaPill: true, logosLeft: true, heroGap: true, noLink3: true, statsIndigo: true }),
      "Pill-shaped primary button, logos packed left, lead paragraph too far from the headline, a missing card link, stat values tinted.",
      { missing: [{ label: 'Third card has no "Learn more" link', at: (L) => ({ x: L.f.cards[2].x + 28, y: L.f.cards[2].y + L.f.cards[2].h - 48, w: 104, h: 20 }) }] }
    ),
    B2("landing-fixed", "landing", "Landing · fixed-width page", () => landingBuild({ fixedWidth: true }), "The container pinned at 1200px from the left edge. Identical at the design size; no longer centered when the window is wider."),
    B2("product-web", "product", "Product · grid build", () => productBuild(), "Responsive build: fluid gallery beside a fixed 480px buy box, a square main image via aspect-ratio. Text falls back to Avenir Next / Poppins."),
    B2(
      "product-bugs",
      "product",
      "Product · five bugs",
      () => productBuild({ priceOrder: true, swatchSquare: true, sizeGap: true, noWarranty: true, cartBlue: true }),
      "Old and new price swapped, square swatches, size buttons too close, the warranty line dropped, a blue Add to cart button.",
      { missing: [{ label: "Warranty line missing from the delivery box", at: (L) => ({ x: L.info.x + 16, y: L.info.perks + 95, w: 448, h: 46 }) }] }
    ),
    B2("product-fixed", "product", "Product · fixed image height", () => productBuild({ fixedImage: true }), "Main image fixed at 712px tall. Identical at the design size; no longer square when the gallery narrows."),
    B2("docs-web", "docs", "Docs · grid build", () => docsBuild(), "Responsive build: three-column grid with a 1280px breakpoint for the table of contents, a centered 720px article. Text falls back to Calibri / Carlito."),
    B2(
      "docs-bugs",
      "docs",
      "Docs · five bugs",
      () => docsBuild({ codeLight: true, noCallout: true, h2Gap: true, wideSidebar: true, wrongActive: true }),
      "Light code block, callout dropped, heading gap too large, sidebar 28px too wide, wrong item highlighted in the sidebar.",
      { missing: [{ label: "Verification callout missing", at: (L) => ({ x: L.a.x, y: L.a.callout, w: L.a.w, h: L.a.calloutH }) }] }
    ),
    B2("docs-notoc", "docs", "Docs · no breakpoint", () => docsBuild({ alwaysToc: true }), "The table of contents never collapses. Identical down to 1280px; keeps the column at narrower widths where the design drops it."),
    B2("kanban-web", "kanban", "Kanban · flex build", () => kanbanBuild(), "Responsive build: four flex: 1 columns that stretch to the viewport bottom. Text falls back to Tahoma / DejaVu Sans."),
    B2(
      "kanban-bugs",
      "kanban",
      "Kanban · five bugs",
      () => kanbanBuild({ labelBlue: true, colGap: true, noAvatar: true, doneOrder: true, noLabelsFilter: true }),
      "CVE labels in the wrong color, columns too far apart, an owner avatar missing, the Done column reversed, the Labels filter dropped.",
      { missing: [
        { label: "Owner avatar missing on SEC-142", at: (L) => ({ x: L.cols[1].cards[1].x + 14, y: L.cols[1].cards[1].y + 114, w: 22, h: 22 }) },
        { label: "Labels filter missing", at: (L) => L.filters[2] }
      ] }
    ),
    B2("kanban-fixed", "kanban", "Kanban · fixed 336px columns", () => kanbanBuild({ fixedCols: true }), "Columns fixed at their 1440 width of 336px. Identical at the design size; leaves empty space when wider and overflows when narrower."),
    B2("mobile-web", "mobile", "Mobile · fluid build", () => mobileBuild(), "Responsive build: full-width column with 20px gutters, a 4-column grid, tab bar pinned with position: absolute. Text falls back to Roboto / Arial."),
    B2(
      "mobile-bugs",
      "mobile",
      "Mobile · five bugs",
      () => mobileBuild({ cardRadius: true, tallTiles: true, noChevrons: true, alertAmber: true, tabWrong: true }),
      "Square-ish status card, action tiles 12px too tall, row chevrons dropped, the breach alert in amber, the wrong tab active.",
      { missing: [{ label: "Row chevrons missing", at: (L) => ({ x: L.list.x + L.list.w - 72, y: L.list.y, w: 58, h: L.list.h }) }] }
    ),
    B2("mobile-fixed", "mobile", "Mobile · fixed 390px", () => mobileBuild({ fixedWidth: true }), "Screen frozen at 390px. Identical on the design phone; leaves a gap on larger phones and is clipped on smaller ones."),
    B2("asm-capped", "asm", "Attack surface · capped width", () => asmBuild({ capWidth: true }), "Content capped at 1168px. Identical at the design size; stops following the viewport once it is wider.")
  ];
  var MAKERS = { soc: socBuild, asm: asmBuild, landing: landingBuild, product: productBuild, docs: docsBuild, kanban: kanbanBuild, mobile: mobileBuild };
  var SC = (id, design, name, opts, note, extra = {}) => B2(id, design, name, () => MAKERS[design](opts), note, { scenario: true, ...extra });
  var MISSING = {
    scan: { label: "Run scan button missing", at: (L) => L.header.scan },
    callout: { label: "Verification callout missing", at: (L) => ({ x: L.a.x, y: L.a.callout, w: L.a.w, h: L.a.calloutH }) },
    chevrons: { label: "Row chevrons missing", at: (L) => ({ x: L.list.x + L.list.w - 72, y: L.list.y, w: 58, h: L.list.h }) }
  };
  BUILDS.push(
    // tolerated
    SC("soc-rounding", "soc", "SOC · 1px rounding differences", { jitter: true }, "Seven spacing values off by one pixel, the rounding a browser and a design tool commonly disagree on. Nothing anyone would file."),
    // cascades
    SC("landing-tallnav", "landing", "Landing · nav 16px taller", { tallNav: true }, "The nav bar is 88px tall instead of 72px, so everything below it sits 16px lower."),
    SC("docs-sidebar", "docs", "Docs · sidebar 28px wider", { wideSidebar: true }, "Sidebar 300px instead of 272px. The article is centered in the column that is left, so it shifts 14px."),
    SC("landing-banner", "landing", "Landing · inserted banner", { banner: true }, "A 40px announcement bar above the nav that is not in the design pushes the whole page down."),
    // spacing
    SC("kanban-gap", "kanban", "Kanban · columns 12px further apart", { colGap: true }, "Board gap 28px instead of 16px. The flexible columns absorb it, so only the gaps change."),
    SC("landing-leadgap", "landing", "Landing · lead paragraph gap", { heroGap: true }, "Lead paragraph 44px below the headline instead of 20px; the buttons and trust row follow it down."),
    SC("product-sizegap", "product", "Product · size buttons spread out", { sizeGapWide: true }, "Size buttons 22px apart instead of 10px; each button narrows to keep the row’s width."),
    SC("soc-padding", "soc", "SOC · KPI tiles over-padded", { tilePad: true }, "KPI tiles have 28px of left padding instead of 16px, so labels and values sit 12px further right."),
    // size and type
    SC("docs-h1", "docs", "Docs · page title too small", { h1Small: true }, "Page title set at 28px on a 36px line instead of 36px on 44px; the article below moves up 8px."),
    SC("soc-donut", "soc", "SOC · smaller donut", { smallDonut: true }, "Severity donut 120px instead of 150px."),
    SC("mobile-tiles", "mobile", "Mobile · taller action tiles", { tallTiles: true }, "Action tiles 100px tall instead of 88px; the alerts list moves down 12px."),
    // color and shape
    SC("soc-delta", "soc", "SOC · delta in the wrong color", { wrongDelta: true }, "The incidents delta is styled as good news (green) instead of red."),
    SC("product-cart", "product", "Product · blue cart button", { cartBlue: true }, "Add to cart in brand blue instead of near-black."),
    SC("kanban-labels", "kanban", "Kanban · CVE labels in blue", { labelBlue: true }, "Every red CVE label chip is tinted blue."),
    SC("docs-code", "docs", "Docs · light code block", { codeLight: true }, "The code block uses the light theme; the design has it dark."),
    SC("landing-pill", "landing", "Landing · pill-shaped button", { ctaPill: true }, "Primary button fully rounded instead of 10px corners."),
    SC("mobile-radius", "mobile", "Mobile · status card corners", { cardRadius: true }, "Status card corners 8px instead of 24px."),
    // missing and extra
    SC("asm-scan", "asm", "Attack surface · Run scan dropped", { dropScan: true }, "The Run scan button is missing from the header; its neighbours slide right.", { missing: [MISSING.scan] }),
    SC("docs-callout", "docs", "Docs · callout dropped", { noCallout: true }, "The verification callout is missing; the article closes the gap.", { missing: [MISSING.callout] }),
    SC("product-stock", "product", "Product · extra stock note", { stockNote: true }, 'An "Only 3 left" line under the swatches that is not in the design pushes the rest of the buy box down.'),
    SC("mobile-chevrons", "mobile", "Mobile · chevrons dropped", { noChevrons: true }, "The chevrons at the end of each alert row are missing.", { missing: [MISSING.chevrons] }),
    // order and state
    SC("soc-swap", "soc", "SOC · table columns swapped", { swapCols: true }, "Two columns of the alerts table trade places."),
    SC("product-price", "product", "Product · prices swapped", { priceOrder: true }, "The struck-out old price comes before the current price."),
    SC("kanban-reversed", "kanban", "Kanban · Done column reversed", { doneOrder: true }, "The cards in the Done column are in reverse order."),
    SC("docs-active", "docs", "Docs · wrong sidebar item", { wrongActive: true }, "The sidebar highlights Installation while the page is Quickstart."),
    SC("mobile-tab", "mobile", "Mobile · wrong active tab", { tabWrong: true }, "The tab bar highlights Alerts on the Home screen."),
    // content
    SC("landing-copy", "landing", "Landing · longer button copy", { longCta: true }, 'The primary button reads "Start your 14-day free trial"; the design says "Start free trial".'),
    SC("kanban-ellipsis", "kanban", "Kanban · titles cut off", { ellipsis: true }, "Card titles clamped to 40% of the card with an ellipsis; the design shows them in full."),
    SC("mobile-icon", "mobile", "Mobile · wrong tile icon", { wrongIcon: true }, "The Passwords tile shows a lock icon where the design has a key."),
    // alignment
    SC("landing-logos", "landing", "Landing · logos packed left", { logosLeft: true }, "Logos packed to the left with a fixed gap instead of spread across the row."),
    SC("landing-heading", "landing", "Landing · heading left-aligned", { h2Left: true }, "The features heading is left-aligned; the design centers it."),
    SC("kanban-group", "kanban", "Kanban · Group by not pinned right", { groupLeft: true }, "The Group by control follows the filters instead of being pushed to the right edge.")
  );
  function imageCopyHtml(svg, w, h2) {
    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Static copy</title>
<style>*{margin:0;padding:0}html,body{background:#fff}img{display:block}</style>
</head>
<body><img src="${url}" width="${w}" height="${h2}" alt=""></body>
</html>
`;
  }
  for (const d of DESIGNS) {
    BUILDS.push(B2(
      `${d.id}-image`,
      d.id,
      `${d.name.split(" ")[0]} · static image copy`,
      () => imageCopyHtml(d.render({ W: d.w, H: d.h }), d.w, d.h),
      "The exported SVG dropped into a page as an <img>. Pixel-perfect at the design size, frozen at every other size.",
      { staticCopy: true }
    ));
  }
  var CATEGORIES = [
    ["pass", "Should pass"],
    ["cascade", "Cascades"],
    ["spacing", "Spacing"],
    ["size", "Size and type"],
    ["color", "Color and shape"],
    ["presence", "Missing and extra"],
    ["order", "Order and state"],
    ["content", "Content"],
    ["align", "Alignment"],
    ["mixed", "Several at once"],
    ["responsive", "Responsive"],
    ["method", "Methods compared"]
  ];
  var G = (cat, id, title, design, build, expect, extra = {}) => ({ id, cat, title, design, build, algo: "viterbi-flow", expect, ...extra });
  var GALLERY = [
    G("pass", "soc-clean", "SOC dashboard, fonts differ, nothing broken", "soc", "soc-grid", "Every line renders in Verdana instead of Inter, so no text has the design’s width. Expect nothing flagged."),
    G("pass", "docs-clean", "Docs page, paragraphs reflow, nothing broken", "docs", "docs-web", "Carlito wraps the paragraphs at different words. Expect nothing flagged."),
    G("pass", "landing-clean", "Landing page, CSS shadows and gradients", "landing", "landing-web", "Gradients, shadows and the illustration are redrawn by CSS and inline SVG. Expect nothing flagged."),
    G("pass", "soc-rounding", "SOC dashboard, 1px rounding everywhere", "soc", "soc-rounding", "Seven spacing values are off by a pixel. Expect nothing flagged: it is below what anyone would file."),
    G("cascade", "cascade-flow", "Taller nav, one finding (Viterbi + flow)", "landing", "landing-tallnav", "The nav is 16px taller and everything below it sits 16px lower. Expect findings only on the nav (its contents and its bottom rule); every element below is explained by it."),
    G("cascade", "cascade-tree", "Taller nav through a parent-relative tree", "landing", "landing-tallnav", "Positions are measured from each parent, but siblings that flow one after another are not linked, so each top-level element below the nav is charged again.", { algo: "viterbi" }),
    G("cascade", "cascade-flat", "Taller nav through flat boxes", "landing", "landing-tallnav", "Absolute coordinates: every element below the nav is reported as moved 16px down. This is the double jeopardy the tree and flow methods remove.", { algo: "flat" }),
    G("cascade", "docs-sidebar", "Wider sidebar re-centers the article", "docs", "docs-sidebar", "The sidebar is 28px too wide. Expect one finding on the sidebar; the article shifts 14px because it is centered in the space left, and that is explained."),
    G("cascade", "landing-banner", "Inserted banner pushes the page down", "landing", "landing-banner", "A 40px bar that is not in the design. Expect one “not in design” finding; nothing below it is charged for moving."),
    G("spacing", "kanban-gap", "Kanban, columns 12px further apart", "kanban", "kanban-gap", "The board gap is 28px instead of 16px. The flexible columns absorb it, so every outer edge still lines up; expect one finding for the uniform gap change."),
    G("spacing", "landing-leadgap", "Landing, lead paragraph 24px too low", "landing", "landing-leadgap", "One margin is wrong. Expect the lead paragraph charged; the buttons and trust row that follow it are explained."),
    G("spacing", "product-sizegap", "Product, size buttons spread out", "product", "product-sizegap", "22px between the size buttons instead of 10px; the buttons narrow so the row keeps its width. Expect one finding for the uniform gap change."),
    G("spacing", "soc-padding", "SOC, KPI tiles over-padded", "soc", "soc-padding", "Left padding 28px instead of 16px. Expect one finding per tile, on the label; the value under it follows the label, and the icon chip and sparkline, positioned absolutely, stay put."),
    G("size", "docs-h1", "Docs, page title set too small", "docs", "docs-h1", "28px instead of 36px. Expect “text set smaller” on the title; the article below moves up 8px and is explained."),
    G("size", "soc-donut", "SOC, donut 30px smaller", "soc", "soc-donut", "Expect a size finding on the donut; the legend beside it is explained."),
    G("size", "mobile-tiles", "Mobile, action tiles 12px taller", "mobile", "mobile-tiles", "Expect the tiles’ height flagged; the alerts list below moves down 12px and is explained."),
    G("color", "soc-delta", "SOC, a delta in the wrong color", "soc", "soc-delta", "The incidents delta is green; the design has it red. Expect one color finding."),
    G("color", "product-cart", "Product, cart button in blue", "product", "product-cart", "Expect a fill color finding on the button and nothing else."),
    G("color", "kanban-labels", "Kanban, CVE labels in blue", "kanban", "kanban-labels", "Expect the CVE label chips flagged for color."),
    G("color", "docs-code", "Docs, code block in the light theme", "docs", "docs-code", "Expect the block’s fill and its text colors flagged, and its inner bands lost; nothing moved."),
    G("color", "landing-pill", "Landing, pill-shaped primary button", "landing", "landing-pill", "Corners 24px instead of 10px. Expect a corner radius finding."),
    G("color", "mobile-radius", "Mobile, status card corners too tight", "mobile", "mobile-radius", "Corners 8px instead of 24px. Expect a corner radius finding."),
    G("presence", "asm-scan", "Attack surface, Run scan button dropped", "asm", "asm-scan", "Expect one missing element; the buttons to its left slide right into its place and are explained."),
    G("presence", "docs-callout", "Docs, callout dropped", "docs", "docs-callout", "Expect one missing element; the article below closes the gap and is explained."),
    G("presence", "product-stock", "Product, an extra low-stock line", "product", "product-stock", "Expect one “not in design” finding; the sizes, cart and perks it pushes down are explained."),
    G("presence", "mobile-chevrons", "Mobile, row chevrons dropped", "mobile", "mobile-chevrons", "Each chevron sits close enough to the time beside it to read as one line, so expect every row’s time-and-chevron line flagged as shorter; nothing moved."),
    G("order", "soc-swap", "SOC, two table columns swapped", "soc", "soc-swap", "Expect the two swapped columns flagged as moved; the other columns are fine."),
    G("order", "product-price", "Product, prices in the wrong order", "product", "product-price", "The old price comes first. Expect both prices flagged as swapped."),
    G("order", "kanban-reversed", "Kanban, Done column reversed", "kanban", "kanban-reversed", "Expect the cards whose content changed places in the Done column flagged."),
    G("order", "docs-active", "Docs, wrong sidebar item highlighted", "docs", "docs-active", "Expect the highlight flagged as moved to another item."),
    G("order", "mobile-tab", "Mobile, wrong tab active", "mobile", "mobile-tab", "Expect the Home and Alerts tabs flagged for color."),
    G("content", "landing-copy", "Landing, button copy longer than the design", "landing", "landing-copy", "“Start your 14-day free trial” instead of “Start free trial”. Expect the label flagged as longer than the font explains; the second button moves right and is explained."),
    G("content", "kanban-ellipsis", "Kanban, card titles cut off", "kanban", "kanban-ellipsis", "Titles clamped to 40% of the card with an ellipsis. Expect the titles flagged as shorter than the font explains."),
    G("content", "mobile-icon", "Mobile, wrong icon in a tile", "mobile", "mobile-icon", "A lock where the design has a key. Expect the icon flagged."),
    G("align", "landing-logos", "Landing, logos packed left", "landing", "landing-logos", "A fixed gap instead of space-between. Expect the logo row flagged."),
    G("align", "landing-heading", "Landing, heading left-aligned", "landing", "landing-heading", "Expect the heading flagged as moved left; the centered subtitle under it is fine."),
    G("align", "kanban-group", "Kanban, Group by not pinned right", "kanban", "kanban-group", "margin-left: auto is missing, so the control follows the filters. Expect it flagged as moved left."),
    G("mixed", "soc-bugs", "SOC dashboard, five planted bugs", "soc", "soc-bugs", "Color, size, width, order and shape bugs in one build. Expect all five found and nothing else flagged."),
    G("mixed", "asm-bugs", "Attack surface, five bugs incl. a dropped button", "asm", "asm-bugs", "Expect all five found and nothing else flagged."),
    G("mixed", "landing-bugs", "Landing page, five bugs", "landing", "landing-bugs", "Expect all five found and nothing else flagged."),
    G("mixed", "product-bugs", "Product page, five bugs", "product", "product-bugs", "Expect all five found and nothing else flagged."),
    G("mixed", "docs-bugs", "Docs page, five bugs incl. a dropped callout", "docs", "docs-bugs", "Expect all five found and nothing else flagged."),
    G("mixed", "kanban-bugs", "Kanban board, five bugs", "kanban", "kanban-bugs", "Expect all five found and nothing else flagged."),
    G("mixed", "mobile-bugs", "Mobile app, five bugs", "mobile", "mobile-bugs", "Expect all five found and nothing else flagged."),
    G("responsive", "soc-stretch", "SOC at 1800×1200, responsive build", "soc", "soc-grid", "A CSS grid with fr tracks, compared with the design re-exported at this size. Expect a pass.", { vp: "big" }),
    G("responsive", "soc-fixed", "SOC at 1800×1200, fixed-pixel grid", "soc", "soc-fixed", "Every track frozen at its 1440 size: identical at 1440, wrong here. Expect a frozen-layout fail.", { vp: "big" }),
    G("responsive", "asm-capped", "Attack surface at 2160, width capped", "asm", "asm-capped", "Content capped at 1168px while the design keeps filling the width. Expect a fail.", { vp: "huge" }),
    G("responsive", "landing-fixed", "Landing page at 1800, not centered", "landing", "landing-fixed", "The container is pinned left. Expect the page flagged as off-center.", { vp: "wide" }),
    G("responsive", "product-fixed", "Product page at 1224, image not square", "product", "product-fixed", "Main image fixed at 712px tall. Expect the image flagged; the design keeps it square.", { vp: "narrow" }),
    G("responsive", "docs-notoc", "Docs at 1224, breakpoint ignored", "docs", "docs-notoc", "The table of contents never collapses. Expect it reported where the design drops it.", { vp: "narrow" }),
    G("responsive", "kanban-fixed", "Kanban at 2160, fixed columns", "kanban", "kanban-fixed", "Columns fixed at 336px leave the right of the board empty. Expect a fail.", { vp: "huge" }),
    G("responsive", "kanban-overflow", "Kanban at 1224, fixed columns overflow", "kanban", "kanban-fixed", "Fixed 336px columns no longer fit. Expect the last column cut off and a fail.", { vp: "narrow" }),
    G("responsive", "mobile-large", "Mobile on a larger phone, responsive", "mobile", "mobile-web", "A fluid column with 20px gutters. Expect a pass.", { vp: "large" }),
    G("responsive", "mobile-fixed", "Mobile on a larger phone, frozen at 390", "mobile", "mobile-fixed", "The screen stays 390px wide. Expect a frozen-layout fail.", { vp: "large" }),
    G("responsive", "soc-copy-1x", "Static image copy at design size", "soc", "soc-image", "The export dropped in as an image scores perfectly at the design size, which is why one size is not enough."),
    G("responsive", "soc-copy-wide", "Static image copy, stretched", "soc", "soc-image", "The same image copy at 1800×1200. Expect a frozen-layout fail.", { vp: "big" }),
    G("responsive", "soc-inferred", "SOC stretched by inferred constraints", "soc", "soc-grid", "Constraints guessed from the single export instead of the preset’s auto layout. Expect review: responsive, with approximate findings.", { vp: "big", model: "inferred" }),
    G("method", "soc-pixel", "Same SOC pair through a pixel diff", "soc", "soc-grid", "Fonts differ, so nearly every line has differing pixels. Compare with the first preset, where the tree methods flag nothing.", { algo: "pixel" }),
    G("method", "soc-ssim", "Same SOC pair through SSIM", "soc", "soc-grid", "Structural similarity tolerates small intensity changes but still reports regions, not elements, and every text line differs.", { algo: "ssim" }),
    G("method", "mismatch", "Wrong pairing: landing design, product build", "landing", "product-web", "A build made for a different design. Expect a low score and mostly missing and extra elements; there is no ground truth for this pair.")
  ];

  // src/pipeline.js
  var pipeline_exports = {};
  __export(pipeline_exports, {
    E: () => engine_exports,
    buildRaster: () => buildRaster,
    clearCaches: () => clearCaches,
    compare: () => compare,
    designRaster: () => designRaster,
    frozen: () => frozen,
    groundTruth: () => groundTruth2,
    htmlOf: () => htmlOf,
    segOf: () => segOf,
    stretched: () => stretched,
    svgOf: () => svgOf,
    verdict: () => verdict,
    viewportsFor: () => viewportsFor
  });
  var C8 = { svg: /* @__PURE__ */ new Map(), raster: /* @__PURE__ */ new Map(), seg: /* @__PURE__ */ new Map(), gt: /* @__PURE__ */ new Map(), stretch: /* @__PURE__ */ new Map() };
  var memo = (m, k, f) => {
    if (!m.has(k)) {
      const v = f();
      m.set(k, v);
      if (v && v.catch) v.catch(() => m.delete(k));
    }
    return m.get(k);
  };
  var segKey = (P) => `${P.edgeT}|${P.kH}|${P.kV}`;
  function viewportsFor(d) {
    const mobile = d.w < 640;
    if (mobile) {
      return [
        { id: "native", label: `${d.w}×${d.h}`, hint: "Design size", w: d.w, h: d.h },
        { id: "small", label: `360×${Math.round(d.h * 0.93)}`, hint: "Smaller phone", w: 360, h: Math.round(d.h * 0.93) },
        { id: "large", label: `430×${Math.round(d.h * 1.1)}`, hint: "Larger phone", w: 430, h: Math.round(d.h * 1.1) },
        { id: "tablet", label: `${Math.round(d.w * 1.5)}×${Math.round(d.h * 1.25)}`, hint: "Much wider", w: Math.round(d.w * 1.5), h: Math.round(d.h * 1.25) }
      ];
    }
    return [
      { id: "native", label: `${d.w}×${d.h}`, hint: "Design size", w: d.w, h: d.h },
      { id: "narrow", label: `${Math.round(d.w * 0.85)}×${d.h}`, hint: "Narrower", w: Math.round(d.w * 0.85), h: d.h },
      { id: "wide", label: `${Math.round(d.w * 1.25)}×${d.h}`, hint: "Wider", w: Math.round(d.w * 1.25), h: d.h },
      { id: "big", label: `${Math.round(d.w * 1.25)}×${Math.round(d.h * 1.25)}`, hint: "Wider and taller", w: Math.round(d.w * 1.25), h: Math.round(d.h * 1.25) },
      { id: "huge", label: `${Math.round(d.w * 1.5)}×${Math.round(d.h * 1.2)}`, hint: "Much wider", w: Math.round(d.w * 1.5), h: Math.round(d.h * 1.2) }
    ];
  }
  var svgOf = (d, W, H) => memo(C8.svg, `${d.id}@${W}x${H}`, () => d.render ? d.render({ W, H }) : d.src);
  var srcOfDesign = (d, W, H) => d.kind === "image" ? { type: "image", url: d.src } : { type: "svg", text: svgOf(d, W, H) };
  var htmlOf = (b) => memo(C8.svg, `html:${b.id}`, () => b.make ? b.make() : b.src);
  var srcOfBuild = (b) => b.kind === "image" ? { type: "image", url: b.src } : { type: b.kind === "svg" ? "svg" : "html", text: htmlOf(b) };
  function designRaster(d, W, H, model) {
    const native = W === d.w && H === d.h;
    if (native || model === "auto" && d.render) return memo(C8.raster, `d:${d.id}@${W}x${H}`, () => rasterize(srcOfDesign(d, W, H), W, H));
    return memo(C8.raster, `d:${d.id}@${W}x${H}|inferred`, async () => {
      const st = await stretched(d, W, H);
      return st.img;
    });
  }
  var buildRaster = (b, W, H) => memo(C8.raster, `b:${b.id}@${W}x${H}`, () => rasterize(srcOfBuild(b), W, H));
  async function segOf(img, key, P) {
    return memo(C8.seg, `${key}|${segKey(P)}`, () => segment(img, P));
  }
  var DEF = DEFAULTS;
  function stretched(d, W, H) {
    return memo(C8.stretch, `${d.id}@${W}x${H}`, async () => {
      const img0 = await designRaster(d, d.w, d.h, "auto");
      const s0 = await segOf(img0, `d:${d.id}@${d.w}x${d.h}`, DEF);
      const st = inferStretch(s0, W, H);
      return { img: synthesize(s0, img0, st.boxes, W, H), boxes: st.boxes, modes: st.modes, seg0: s0 };
    });
  }
  async function groundTruth2(d, b, W, H, model) {
    if (b.kind !== "html" || b.design !== (d.origin || d.id)) return null;
    const marks = await memo(C8.gt, `${b.id}@${W}x${H}`, () => groundTruth(htmlOf(b), W, H).catch(() => []));
    const extra = [];
    const at = (m, L) => {
      const r = m.at(L);
      return r && r.w != null ? geom.B(r.x, r.y, r.x + r.w, r.y + r.h) : r;
    };
    for (const m of b.missing || []) {
      let box2 = null;
      if (W === d.w && H === d.h) box2 = at(m, d.layout(d.w, d.h));
      else if (model === "auto" && d.layout) box2 = at(m, d.layout(W, H));
      else {
        const b0 = at(m, d.layout(d.w, d.h));
        const st = await stretched(d, W, H);
        let best = null, bestA = 0;
        for (const n of st.seg0.nodes) {
          const I8 = geom.INTER(n.box, b0);
          const a = I8 ? geom.AREA(I8) / geom.AREA(b0) : 0;
          if (a >= 0.6 && (!best || geom.AREA(n.box) < geom.AREA(best.box))) {
            best = n;
            bestA = a;
          }
        }
        const nb = best && st.boxes.get(best);
        box2 = nb ? geom.SHIFT(b0, nb.x0 - best.box.x0, nb.y0 - best.box.y0) : b0;
      }
      if (box2) extra.push({ label: m.label, box: box2, space: "design" });
    }
    return marks.concat(extra);
  }
  async function compare({ d, b, W, H, model, algo, P }) {
    const dImg = await designRaster(d, W, H, model);
    const bImg = await buildRaster(b, W, H);
    const dKey = `d:${d.id}@${W}x${H}${(W !== d.w || H !== d.h) && !(model === "auto" && d.render) ? "|inferred" : ""}`;
    const [dSeg, bSeg] = await Promise.all([segOf(dImg, dKey, P), segOf(bImg, `b:${b.id}@${W}x${H}`, P)]);
    const gt = await groundTruth2(d, b, W, H, model);
    const r = run(algo, dSeg, bSeg, dImg, bImg, P);
    const ev = gt ? evaluate(r.findings, gt) : null;
    return { dImg, bImg, dSeg, bSeg, r, gt, ev, W, H };
  }
  async function frozen(d, b, W, H, model, P) {
    if (W === d.w && H === d.h) return null;
    const segAt = async (img, key) => segOf(img, key, P);
    const d0 = await segAt(await designRaster(d, d.w, d.h, "auto"), `d:${d.id}@${d.w}x${d.h}`);
    const b0 = await segAt(await buildRaster(b, d.w, d.h), `b:${b.id}@${d.w}x${d.h}`);
    const dKey = `d:${d.id}@${W}x${H}${!(model === "auto" && d.render) ? "|inferred" : ""}`;
    const d1 = await segAt(await designRaster(d, W, H, model), dKey);
    const b1 = await segAt(await buildRaster(b, W, H), `b:${b.id}@${W}x${H}`);
    const fd = frozenShare(d0, d1), fb = frozenShare(b0, b1);
    const moveD = Math.max(0.05, 1 - fd), moveB = 1 - fb;
    return { design: fd, build: fb, index: Math.max(0, Math.min(1.2, moveB / moveD)) };
  }
  function verdict(res, fr2, model = "auto") {
    if (!res) return null;
    const { counts, score } = res.r;
    const stuck = fr2 && fr2.index < 0.5;
    if (stuck) return { level: "fail", label: "Frozen layout", note: `Only ${Math.round(fr2.index * 100)}% as responsive as the design` };
    if (counts.major === 0 && score >= 97) return { level: "pass", label: "Pass" };
    if (model === "inferred" && fr2) {
      return score >= 90 && counts.major <= 3 ? { level: "pass", label: "Pass", note: "Against an inferred stretch" } : { level: "review", label: "Review", note: "Responds like the design; the inferred stretch is approximate, so check the findings" };
    }
    if (counts.major <= 3 && score >= 90) return { level: "review", label: "Review" };
    return { level: "fail", label: "Fail" };
  }
  function clearCaches(which) {
    for (const k of which || Object.keys(C8)) C8[k].clear();
  }

  // test/harness-entry.js
  window.Engine = engine_exports;
  window.Presets = presets_exports;
  window.Pipeline = pipeline_exports;
})();
