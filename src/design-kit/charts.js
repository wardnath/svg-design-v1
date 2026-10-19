/* Chart geometry shared by designs (absolute coordinates) and builds
   (the same geometry in a stretchable viewBox). */
import { num } from './svg.js';
import { COLS, ROWS, landAt, project } from './worldmask.js';

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Map a series into a box: x evenly spaced, y between lo and hi. */
export function points(series, box, lo, hi) {
  const n = series.length;
  return series.map((v, i) => [box.x + (n === 1 ? box.w / 2 : (i / (n - 1)) * box.w), box.y + box.h - ((v - lo) / (hi - lo)) * box.h]);
}
export const linePath = pts => pts.map((p, i) => `${i ? 'L' : 'M'}${num(p[0])} ${num(p[1])}`).join('');

/* Monotone cubic interpolation (Fritsch–Carlson), the "smooth" line most chart libraries draw. */
export function smoothPath(pts) {
  const n = pts.length;
  if (n < 3) return linePath(pts);
  const dx = [], dy = [], m = [], t = [];
  for (let i = 0; i < n - 1; i++) { dx[i] = pts[i + 1][0] - pts[i][0]; dy[i] = pts[i + 1][1] - pts[i][1]; m[i] = dy[i] / dx[i]; }
  t[0] = m[0]; t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]);
  let d = `M${num(pts[0][0])} ${num(pts[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += `C${num(pts[i][0] + h)} ${num(pts[i][1] + h * t[i])} ${num(pts[i + 1][0] - h)} ${num(pts[i + 1][1] - h * t[i + 1])} ${num(pts[i + 1][0])} ${num(pts[i + 1][1])}`;
  }
  return d;
}
export const areaPath = (pts, baseY, smooth = true) =>
  (smooth ? smoothPath(pts) : linePath(pts)) + `L${num(pts[pts.length - 1][0])} ${num(baseY)}L${num(pts[0][0])} ${num(baseY)}Z`;

/* Annular sector from angle a0 to a1 (radians, 0 = 12 o'clock, clockwise). */
export function arcPath(cx, cy, r0, r1, a0, a1) {
  const p = (r, a) => [cx + r * Math.sin(a), cy - r * Math.cos(a)];
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = p(r1, a0), [x1, y1] = p(r1, a1), [x2, y2] = p(r0, a1), [x3, y3] = p(r0, a0);
  return `M${num(x0)} ${num(y0)}A${num(r1)} ${num(r1)} 0 ${large} 1 ${num(x1)} ${num(y1)}L${num(x2)} ${num(y2)}A${num(r0)} ${num(r0)} 0 ${large} 0 ${num(x3)} ${num(y3)}Z`;
}

/* Dot-matrix world map fitted (uniformly, centred) into a box, like an SVG with
   preserveAspectRatio="xMidYMid meet". Returns the view transform and the dots. */
export const MAP_VB = { w: COLS * 10, h: ROWS * 10 };
export function mapFit(box) {
  const s = Math.min(box.w / MAP_VB.w, box.h / MAP_VB.h);
  return { s, ox: box.x + (box.w - MAP_VB.w * s) / 2, oy: box.y + (box.h - MAP_VB.h * s) / 2 };
}
export function mapDots() {
  const out = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (landAt(c, r)) out.push([c * 10 + 5, r * 10 + 5]);
  return out;
}
export const geo = (lon, lat) => { const [c, r] = project(lon, lat); return [c * 10, r * 10]; };
/* Quadratic arc between two map points, bowed upward by a fraction of its length. */
export function arcBetween(a, b, bow = 0.28) {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return { d: `M${num(a[0])} ${num(a[1])}Q${num(mx)} ${num(my - len * bow)} ${num(b[0])} ${num(b[1])}`, c: [mx, my - len * bow] };
}

/* Split a length into tracks: fixed px tracks and fr tracks, with gaps (CSS grid rules). */
export function tracks(start, length, spec, gap = 0) {
  const fixed = spec.reduce((s, t) => s + (typeof t === 'number' ? t : 0), 0);
  const fr = spec.reduce((s, t) => s + (typeof t === 'string' ? parseFloat(t) : 0), 0);
  const free = Math.max(0, length - fixed - gap * (spec.length - 1));
  const out = [];
  let x = start;
  for (const t of spec) {
    const w = typeof t === 'number' ? t : (free * parseFloat(t)) / fr;
    out.push({ x, w });
    x += w + gap;
  }
  return out;
}
export const box = (x, y, w, h) => ({ x, y, w, h });
export const inset = (b, t, r = t, bt = t, l = r) => ({ x: b.x + l, y: b.y + t, w: b.w - l - r, h: b.h - t - bt });
