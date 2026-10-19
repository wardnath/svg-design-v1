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

export { cutGroups, xyOrder };
