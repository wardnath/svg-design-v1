/* Tiny JSX → markup serializer used by design and build presets.
   Design files declare  /** @jsx h *\/  and get strings back, which keeps the
   output byte-for-byte like an exported file: no runtime, no virtual DOM. */

const KEBAB = new Set([
  'strokeWidth', 'strokeLinecap', 'strokeLinejoin', 'strokeDasharray', 'strokeDashoffset', 'strokeOpacity', 'strokeMiterlimit',
  'fillOpacity', 'fillRule', 'clipRule', 'clipPath', 'stopColor', 'stopOpacity', 'floodOpacity', 'floodColor',
  'colorInterpolationFilters', 'fontFamily', 'fontSize', 'fontWeight', 'textAnchor', 'dominantBaseline', 'letterSpacing',
  'vectorEffect', 'shapeRendering', 'mixBlendMode', 'maskType',
]);
const attrName = k => (k === 'className' ? 'class' : KEBAB.has(k) ? k.replace(/[A-Z]/g, c => '-' + c.toLowerCase()) : k);
const esc = v => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const flat = arr => {
  const out = [];
  const walk = a => { for (const x of a) { if (Array.isArray(x)) walk(x); else if (x != null && x !== false && x !== true) out.push(x); } };
  walk(arr);
  return out;
};
export const num = v => {
  if (typeof v !== 'number') return v;
  const r = Math.round(v * 100) / 100;
  return Object.is(r, -0) ? 0 : r;
};

export function h(tag, props, ...children) {
  const kids = flat(children);
  if (typeof tag === 'function') return tag({ ...(props || {}), children: kids });
  let attrs = '';
  if (props) for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false || k === 'children' || k === 'key') continue;
    attrs += ` ${attrName(k)}="${esc(typeof v === 'number' ? num(v) : v)}"`;
  }
  const inner = kids.join('');
  return inner ? `<${tag}${attrs}>${inner}</${tag}>` : `<${tag}${attrs}/>`;
}
export const Fragment = ({ children }) => flat(children || []).join('');
export const raw = s => s;
export const escapeText = esc;

/* A Figma-style export document: clip group, defs collected at the end,
   ids in Figma's numbering scheme (clip0_12_7, filter0_d_12_7, paint0_linear_12_7). */
let docSeq = 40;
export function doc(name, W, H) {
  const node = `${++docSeq}_${(docSeq * 7) % 97}`;
  const defs = [];
  let nPaint = 0, nFilter = 0, nClip = 1;
  const clipId = `clip0_${node}`;
  const d = {
    W, H, name, node,
    linear(x1, y1, x2, y2, stops) {
      const id = `paint${nPaint++}_linear_${node}`;
      defs.push(`<linearGradient id="${id}" x1="${num(x1)}" y1="${num(y1)}" x2="${num(x2)}" y2="${num(y2)}" gradientUnits="userSpaceOnUse">` +
        stops.map(([o, c, a]) => `<stop${o ? ` offset="${num(o)}"` : ''} stop-color="${c}"${a != null && a !== 1 ? ` stop-opacity="${num(a)}"` : ''}/>`).join('') + '</linearGradient>');
      return `url(#${id})`;
    },
    radial(cx, cy, r, stops) {
      const id = `paint${nPaint++}_radial_${node}`;
      defs.push(`<radialGradient id="${id}" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(${num(cx)} ${num(cy)}) scale(${num(r)})">` +
        stops.map(([o, c, a]) => `<stop${o ? ` offset="${num(o)}"` : ''} stop-color="${c}"${a != null && a !== 1 ? ` stop-opacity="${num(a)}"` : ''}/>`).join('') + '</radialGradient>');
      return `url(#${id})`;
    },
    /* Figma drop shadow, exported as its usual flood/matrix/offset/blur/blend chain. */
    shadow(box, layers) {
      const id = `filter${nFilter++}_d_${node}`;
      const ext = layers.reduce((m, l) => Math.max(m, (l.blur || 0) * 2 + Math.abs(l.dy || 0) + (l.spread || 0)), 0);
      const x = box.x - ext, y = box.y - ext, w = box.w + 2 * ext, hh = box.h + 2 * ext;
      let f = `<filter id="${id}" x="${num(x)}" y="${num(y)}" width="${num(w)}" height="${num(hh)}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">` +
        `<feFlood flood-opacity="0" result="BackgroundImageFix"/>`;
      let prev = 'BackgroundImageFix';
      layers.forEach((l, i) => {
        const [r, g, b] = hexRgb(l.color || '#101828');
        f += `<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>`;
        if (l.spread) f += `<feMorphology radius="${num(Math.abs(l.spread))}" operator="${l.spread > 0 ? 'dilate' : 'erode'}" in="SourceAlpha" result="effect${i + 1}_dropShadow_${node}"/>`;
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
    clip(box, r = 0) {
      const id = `clip${nClip++}_${node}`;
      defs.push(`<clipPath id="${id}"><rect x="${num(box.x)}" y="${num(box.y)}" width="${num(box.w)}" height="${num(box.h)}"${r ? ` rx="${num(r)}"` : ''} fill="white"/></clipPath>`);
      return `url(#${id})`;
    },
    svg(content, bg = '#FFFFFF') {
      defs.push(`<clipPath id="${clipId}"><rect width="${W}" height="${H}" fill="white"/></clipPath>`);
      return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" xmlns="http://www.w3.org/2000/svg">\n` +
        `<g id="${esc(name)}" clip-path="url(#${clipId})">\n<rect width="${W}" height="${H}" fill="${bg}"/>\n${content}\n</g>\n<defs>\n${defs.join('\n')}\n</defs>\n</svg>\n`;
    },
  };
  return d;
}

export function hexRgb(hex) {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}
export function mix(a, b, t) {
  const p = hexRgb(a), q = hexRgb(b);
  return '#' + p.map((v, i) => Math.round(v + (q[i] - v) * t).toString(16).padStart(2, '0')).join('').toUpperCase();
}
