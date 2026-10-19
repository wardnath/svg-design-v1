import { B, H_, W_, clamp } from './geom.js';
import { LEVEL } from './score.js';

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

export { blobs, runPixel, runSSIM };
