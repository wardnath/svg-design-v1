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

export { B, W_, H_, CX, CY, AREA, UNION, UNIONS, INTER, OVL, SHIFT, GROW, minAbs, clamp };
