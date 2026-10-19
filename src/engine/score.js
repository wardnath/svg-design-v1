import { rep } from './align.js';
import { unitName } from './attribute.js';
import { nodeDE } from './color.js';
import { KIND_GROUP } from './costs.js';
import { AREA, B, H_, UNIONS, W_ } from './geom.js';

/* ---------------- severity ---------------- */
const LEVEL = s => (s >= 2.5 ? 'major' : s >= 1 ? 'minor' : 'ok');
function sizeCheck(u, P, contentExplained, missingKids) {
  const d = u.d[0], db = u.db, mb = u.mb;
  const dw = W_(mb) - W_(db), dh = H_(mb) - H_(db);
  // rules and bars: only their length means anything (thickness is mostly anti-aliasing)
  if (u.d.every(n => n.kind === 'rule') && u.m.every(n => n.kind === 'rule')) {
    const horiz = W_(db) >= H_(db);
    const ld = horiz ? W_(db) : H_(db), lm = horiz ? W_(mb) : H_(mb);
    const s = Math.abs(lm - ld) / Math.max(P.sizeTol, 0.05 * ld);
    return { s, dw, dh, note: `${horiz ? 'length' : 'height'} ${lm > ld ? '+' : '−'}${Math.abs(Math.round(lm - ld))}px`, explained: '' };
  }
  const ink = KIND_GROUP[d.kind] === 'ink' || u.d.length > 1;
  if (ink) {
    // Text is compared by ink mass (edge pixels), which survives reflow: the same words wrapped
    // onto more lines keep their mass. Single-line blocks also compare height (≈ font size).
    const pd = u.d.reduce((a, n) => a + (n.px || AREA(n.box) * 0.3), 0), pm = u.m.reduce((a, n) => a + (n.px || AREA(n.box) * 0.3), 0);
    const lr = Math.log(Math.max(1, pm) / Math.max(1, pd)) - (P.ts ? P.ts.m : 0);
    const sMass = Math.max(0, Math.abs(lr) - Math.log(1 + P.textSizeTol)) / Math.log(1.25);
    let sH = 0, sZ = 0, zNote = '';
    // The glyphs' own size: the median height of the ink across the line's profile bins. A
    // font-size change scales it; a line that only gained or lost words (a descender in a new
    // word, an ellipsis) keeps it, even when its box grew or shrank.
    const glyphH = (n, bh) => { if (!n.prof) return null; const e = n.prof.ext.filter((v, i) => v != null && n.prof.n[i] >= 4).map(v => v * bh).sort((p, q) => p - q); return e.length >= 3 ? e[e.length >> 1] : null; };
    const gd = u.d.length === 1 ? glyphH(u.d[0], H_(db)) : null, gm = u.m.length === 1 ? glyphH(u.m[0], H_(mb)) : null;
    const dGlyph = gd && gm ? Math.log(gm / gd) - (P.ts ? P.ts.h : 0) : null;
    if (u.d.length === 1 && u.m.length === 1 && u.d[0].lines === 1 && u.m[0].lines === 1) {
      const dh = Math.log(H_(mb) / H_(db)) - (P.ts ? P.ts.h : 0), dw = Math.log(W_(mb) / W_(db)) - (P.ts ? P.ts.w : 0);
      sH = Math.max(0, Math.abs(dh) - Math.log(1.22)) / Math.log(1.15);
      // A font-size change scales a line's height and width together. Against the noise of a
      // fallback font (a pixel of height at small sizes, about 8% of width per string), the
      // two together are evidence that neither is alone.
      const zh = dh / Math.max(0.07, 1.2 / Math.min(H_(db), H_(mb))), zw = dw / 0.08;
      const glyphsKept = dGlyph != null && Math.abs(dGlyph) < Math.max(0.08, 0.4 * Math.abs(dh));
      if (Math.sign(dh) === Math.sign(dw) && Math.min(Math.abs(zh), Math.abs(zw)) >= 1 && !glyphsKept) {
        const z = Math.hypot(zh, zw);
        sZ = Math.max(0, z - 2.4) / 0.8;
        zNote = `text set ${dh > 0 ? 'larger' : 'smaller'} (≈${Math.round(Math.abs(Math.exp((dh + dw) / 2) - 1) * 100)}%)`;
      }
    }
    // a single line much wider or narrower than the font explains, at the same height: words
    // or an icon added to or dropped from the line
    let sW = 0, wNote = '';
    if (u.d.length === 1 && u.m.length === 1 && u.d[0].lines === 1 && u.m[0].lines === 1) {
      const dh = Math.log(H_(mb) / H_(db)) - (P.ts ? P.ts.h : 0), dw = Math.log(W_(mb) / W_(db)) - (P.ts ? P.ts.w : 0);
      const glyphsKept = dGlyph != null && Math.abs(dGlyph) < Math.max(0.08, 0.4 * Math.abs(dh));
      if (Math.abs(dh) < 0.12 || glyphsKept) { sW = Math.max(0, Math.abs(dw) - 0.24) / 0.12; wNote = `line ${dw > 0 ? 'longer' : 'shorter'} than the font explains (${Math.round(W_(db))}→${Math.round(W_(mb))}px)`; }
    }
    const s = Math.max(sMass, sH, sZ, sW);
    let note;
    if (sW >= Math.max(sH, sMass, sZ) && sW >= 1) note = wNote;
    else if (sZ >= Math.max(sH, sMass) && sZ > 0) note = zNote;
    else if (sH > sMass) note = `glyphs ${H_(mb) > H_(db) ? 'taller' : 'shorter'} (${Math.round(H_(db))}→${Math.round(H_(mb))}px line)`;
    else note = lr > 0 ? `text ${Math.round((Math.exp(lr) - 1) * 100)}% heavier` : `text ${Math.round((1 - Math.exp(lr)) * 100)}% lighter`;
    const reflow = (u.d[0].lines || 1) !== (u.m[0].lines || 1);
    // words rearranged inside one line (the old price before the new one): the left-to-right
    // profile of ink darkness and glyph height no longer lines up, at any small shift
    let sP = 0;
    if (u.d.length === 1 && u.m.length === 1 && u.d[0].prof && u.m[0].prof) {
      const a = u.d[0].prof, b = u.m[0].prof;
      let best = Infinity;
      for (const sh of [-1, 0, 1]) {
        let dl = 0, de = 0, k = 0;
        for (let i = 0; i < 8; i++) {
          const j = i + sh;
          if (j < 0 || j > 7 || a.n[i] < 4 || b.n[j] < 4) continue;
          dl += Math.abs(a.lum[i] - b.lum[j]) / 255; de += Math.abs(a.ext[i] - b.ext[j]); k++;
        }
        if (k >= 4) best = Math.min(best, Math.max(0, dl / k - 0.14) / 0.08 + Math.max(0, de / k - 0.22) / 0.12);
      }
      if (best < Infinity) sP = best;
    }
    if (sP > s && sP >= 1) return { s: sP, dw, dh, note: 'words rearranged or restyled within the line', explained: '' };
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
  if (contentExplained && u.edges) {
    // both edges explained by independent references: the layout set this size
    const ex = Math.max(u.edges.x0, u.edges.x1), ey = Math.max(u.edges.y0, u.edges.y1);
    if (ex / tw < sx) { sx = ex / tw; if (Math.abs(dw) > tw) explained = explained ? explained + ', width set by its neighbours' : 'width set by its neighbours'; }
    if (ey / th < sy) { sy = ey / th; if (Math.abs(dh) > th) explained = explained ? explained + ', height set by its neighbours' : 'height set by its neighbours'; }
  }
  const parts = [];
  if (Math.abs(dw) >= 2) parts.push(`width ${dw > 0 ? '+' : '−'}${Math.abs(Math.round(dw))}px`);
  if (Math.abs(dh) >= 2) parts.push(`height ${dh > 0 ? '+' : '−'}${Math.abs(Math.round(dh))}px`);
  return { s: Math.max(sx, sy), dw, dh, note: parts.join(', '), explained };
}
/* Correlation of two 12 × 12 glyph masks pooled to n × n cells. */
function maskCorr(a, b, n) {
  const k = 12 / n, pa = new Array(n * n).fill(0), pb = new Array(n * n).fill(0);
  for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) { const c = Math.floor(y / k) * n + Math.floor(x / k); pa[c] += a[y * 12 + x]; pb[c] += b[y * 12 + x]; }
  const N = n * n, ma = pa.reduce((p, q) => p + q, 0) / N, mb = pb.reduce((p, q) => p + q, 0) / N;
  let s = 0, sa = 0, sb = 0;
  for (let i = 0; i < N; i++) { s += (pa[i] - ma) * (pb[i] - mb); sa += (pa[i] - ma) ** 2; sb += (pb[i] - mb) ** 2; }
  return sa && sb ? s / Math.sqrt(sa * sb) : 1;
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
  // a frame on one side matched to bare ink on the other (a badge whose fill one render
  // separated and the other did not): fill and ink colors are not comparable
  const sameGroup = KIND_GROUP[d.kind] === KIND_GROUP[m.kind] || (u.d.length > 1 || u.m.length > 1);
  const de = d.color && m.color && sameGroup ? nodeDE(rep(u.d), rep(u.m)) : 0;
  const sCol = de > ctol ? 1 + (de - ctol) / 12 : de / ctol * 0.9;
  let sShape = 0, shapeNote = 'Shape differs (corners or outline)';
  if (u.d.length === 1 && u.m.length === 1 && d.solidity && m.solidity && !d.graphic && !m.graphic && Math.min(W_(db), H_(db)) >= 16) {
    sShape = Math.max(0, Math.abs(d.solidity - m.solidity) - 0.05) / 0.04;
    if (d.radius != null && m.radius != null) {
      const rs = Math.max(0, Math.abs(d.radius - m.radius) - 2) / 2.5;
      if (rs > sShape) { sShape = rs; shapeNote = `Corner radius ≈${Math.round(d.radius)}px → ≈${Math.round(m.radius)}px`; }
    }
  }
  // A different icon. Icons come from the same set on both sides, so their ink patterns agree
  // cell by cell; glyphs that only look like icons (digits, initials) follow the font and are
  // left out by height. Both a coarse and a finer grid have to disagree.
  if (u.d.length === 1 && u.m.length === 1 && d.kind === 'icon' && m.kind === 'icon' && d.mask && m.mask && d.tall >= 1.2 && m.tall >= 1.2) {
    const c4 = maskCorr(d.mask, m.mask, 4), c6 = maskCorr(d.mask, m.mask, 6);
    const sG = c4 < 0.45 && c6 < 0.6 ? Math.max(0, 0.62 - c4) / 0.06 : 0;
    if (sG > sShape) { sShape = sG; shapeNote = 'Different icon'; }
  }
  const comps = [['position', sPos], ['size', size.s], ['color', sCol], ['shape', sShape]];
  comps.sort((a, b) => b[1] - a[1]);
  const sev = comps[0][1];
  const top = comps[0][0];
  let title;
  if (sev < 1) title = 'Matches';
  else if (top === 'position') title = rx.gapNote && Math.abs(rx.v) >= Math.abs(ry.v) ? rx.gapNote : ry.gapNote && Math.abs(ry.v) >= Math.abs(rx.v) ? ry.gapNote : `Moved ${fmtVec(rx.v, ry.v)}`;
  else if (top === 'size') title = size.note ? size.note[0].toUpperCase() + size.note.slice(1) : 'Size differs';
  else if (top === 'color') title = `${ink ? 'Text color' : 'Fill color'} off (ΔE ${Math.round(de)})`;
  else title = shapeNote;
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

export { LEVEL, sizeCheck, fmtVec, expectedBox, scoreUnit };
