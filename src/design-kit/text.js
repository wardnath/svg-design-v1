/* Outlined text: Inter and JetBrains Mono glyphs → one <path> per text layer,
   which is how Figma exports text unless "Outline text" is switched off. */
import GLYPHS from './glyphs.js';
import { num } from './svg.js';

const WEIGHTS = { inter: [400, 500, 600, 700], mono: [400, 500, 600] };
function fontKey(family, weight) {
  const fam = family === 'mono' ? 'mono' : 'inter';
  const w = WEIGHTS[fam].reduce((a, b) => (Math.abs(b - weight) < Math.abs(a - weight) ? b : a));
  return `${fam}-${w}`;
}

const decoded = new Map();
function glyph(fk, ch) {
  const key = fk + ch;
  if (decoded.has(key)) return decoded.get(key);
  const f = GLYPHS[fk];
  const g = f.glyphs[ch] || f.glyphs['?'];
  const cmds = [];
  const re = /([mlqcz])([^mlqcz]*)/g;
  let m, x = 0, y = 0;
  while ((m = re.exec(g[1]))) {
    const t = m[1];
    const n = (m[2].match(/-?\d+/g) || []).map(Number);
    if (t === 'z') { cmds.push(['Z']); continue; }
    if (t === 'm' || t === 'l') { x += n[0]; y += n[1]; cmds.push([t.toUpperCase(), x, y]); }
    else if (t === 'q') { const x1 = x + n[0], y1 = y + n[1]; x += n[2]; y += n[3]; cmds.push(['Q', x1, y1, x, y]); }
    else if (t === 'c') { const x1 = x + n[0], y1 = y + n[1], x2 = x + n[2], y2 = y + n[3]; x += n[4]; y += n[5]; cmds.push(['C', x1, y1, x2, y2, x, y]); }
  }
  const r = { adv: g[0], cmds };
  decoded.set(key, r);
  return r;
}

export function metrics({ size = 14, weight = 400, family = 'inter' } = {}) {
  const f = GLYPHS[fontKey(family, weight)];
  const s = size / f.upm;
  return { asc: f.asc * s, desc: -f.desc * s, capH: f.capH * s, xH: f.xH * s };
}

/* Advance width of a single line, with kerning and letter-spacing (px). */
export function measure(text, { size = 14, weight = 400, family = 'inter', ls = 0 } = {}) {
  const fk = fontKey(family, weight), f = GLYPHS[fk], s = size / f.upm;
  let w = 0, prev = null, n = 0;
  for (const ch of String(text)) {
    w += glyph(fk, ch).adv;
    if (prev) w += f.kern[prev + ch] || 0;
    prev = ch; n++;
  }
  return w * s + ls * Math.max(0, n - 1);
}

/* Greedy word wrap, the same rule a browser and Figma's fixed-width text box apply. */
export function wrap(text, maxWidth, opts) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (!cur || measure(t, opts) <= maxWidth + 0.01) cur = t;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

/* Text layer → path. (x, y) is the top-left of the first line box; line boxes are
   `lh` tall with the glyphs' ascent+descent centred in them (CSS half-leading). */
export function textPath(text, { x = 0, y = 0, size = 14, weight = 400, family = 'inter', ls = 0, lh, align = 'left', width, lines } = {}) {
  const fk = fontKey(family, weight), f = GLYPHS[fk], s = size / f.upm;
  const L = lh || Math.round(size * 1.4);
  const ls_ = lines || (width ? wrap(text, width, { size, weight, family, ls }) : String(text).split('\n'));
  const asc = f.asc * s, desc = -f.desc * s;
  let d = '';
  let maxW = 0;
  ls_.forEach((line, i) => {
    const lw = measure(line, { size, weight, family, ls });
    maxW = Math.max(maxW, lw);
    const boxW = width != null ? width : 0;
    let x0 = x;
    if (align === 'center') x0 = width != null ? x + (boxW - lw) / 2 : x - lw / 2;
    else if (align === 'right') x0 = width != null ? x + boxW - lw : x - lw;
    const base = y + i * L + (L - (asc + desc)) / 2 + asc;
    let pen = 0, prev = null;
    for (const ch of line) {
      const g = glyph(fk, ch);
      if (prev) pen += f.kern[prev + ch] || 0;
      for (const c of g.cmds) {
        if (c[0] === 'Z') { d += 'Z'; continue; }
        d += c[0];
        for (let k = 1; k < c.length; k += 2) {
          const X = x0 + (pen + c[k]) * s, Y = base - c[k + 1] * s;
          d += (k > 1 ? ' ' : '') + num(X) + ' ' + num(Y);
        }
      }
      pen += g.adv + ls / s;
      prev = ch;
    }
  });
  return { d, width: width != null ? width : maxW, textWidth: maxW, height: ls_.length * L, lines: ls_.length, lh: L };
}
