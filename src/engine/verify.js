import { clamp } from './geom.js';

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

export { inkIn, presentInPixels };
