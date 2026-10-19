/* JSX → HTML string serializer for build presets (a React component rendered to
   static markup, minus React). Text children are escaped; nested markup is not. */
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
export class Markup { constructor(s) { this.s = s; } toString() { return this.s; } }
export const raw = s => new Markup(String(s));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escA = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const flat = (arr, out = []) => { for (const x of arr) { if (Array.isArray(x)) flat(x, out); else if (x != null && x !== false && x !== true) out.push(x); } return out; };
const KEBAB_SVG = new Set(['strokeWidth', 'strokeLinecap', 'strokeLinejoin', 'strokeDasharray', 'strokeOpacity', 'fillOpacity', 'fillRule', 'stopColor', 'stopOpacity', 'vectorEffect', 'textAnchor', 'fontSize', 'fontWeight']);
const attrName = k => (k === 'className' ? 'class' : k === 'htmlFor' ? 'for' : KEBAB_SVG.has(k) ? k.replace(/[A-Z]/g, c => '-' + c.toLowerCase()) : k);
const styleStr = o => Object.entries(o).filter(([, v]) => v != null && v !== false).map(([k, v]) => `${k.replace(/[A-Z]/g, c => '-' + c.toLowerCase())}:${v}`).join(';');

export function hh(tag, props, ...children) {
  const kids = flat(children);
  if (typeof tag === 'function') return tag({ ...(props || {}), children: kids });
  let attrs = '';
  if (props) for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false || k === 'children' || k === 'key') continue;
    const val = k === 'style' && typeof v === 'object' ? styleStr(v) : v;
    attrs += v === true ? ` ${attrName(k)}` : ` ${attrName(k)}="${escA(val)}"`;
  }
  const inner = kids.map(c => (c instanceof Markup ? c.s : esc(c))).join('');
  return new Markup(VOID.has(tag) ? `<${tag}${attrs}>` : `<${tag}${attrs}>${inner}</${tag}>`);
}
export const Frag = ({ children }) => new Markup(flat(children || []).map(c => (c instanceof Markup ? c.s : esc(c))).join(''));
export const page = (head, body, lang = 'en') => `<!doctype html>\n<html lang="${lang}">\n<head>\n<meta charset="utf-8">\n${head}\n</head>\n${body}\n</html>\n`;
