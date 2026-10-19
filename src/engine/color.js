import { clamp } from './geom.js';

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

/* Palette distance: every color on one side is matched to its nearest color on the other,
   weighted, both ways. A legend of colored dots and gray labels compares to itself even when
   the font changes how much of each color there is. */
function paletteDE(a, b) {
  const one = (p, q) => p.reduce((s, [c, w]) => s + w * Math.min(...q.map(([d]) => dE(c, d))), 0);
  return 0.5 * (one(a, b) + one(b, a));
}
const nodeDE = (a, b) => (a.palette && b.palette ? paletteDE(a.palette, b.palette) : a.color && b.color ? dE(a.color, b.color) : 0);
export { lin, lab, dE, cdist, hex, paletteDE, nodeDE };
