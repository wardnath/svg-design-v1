/* Design kit: what design presets use to "export" a Figma-like SVG. */
import { h, Fragment, doc, num, mix, hexRgb, escapeText } from './svg.js';
import { textPath, measure, wrap, metrics } from './text.js';
import { iconSvg, iconHtml, ICONS } from './icons.js';
export * from './charts.js';
export { h, Fragment, doc, num, mix, hexRgb, escapeText, textPath, measure, wrap, metrics, iconSvg, iconHtml, ICONS };

const layerId = s => String(s).replace(/[^A-Za-z0-9 ._-]/g, '').trim().replace(/\s+/g, '_').slice(0, 40) || 'Text';

/* <Text x y size weight color family ls lh align width>content</Text> → outlined path. */
export function Text({ x = 0, y = 0, size = 14, weight = 400, color = '#000', family = 'inter', ls = 0, lh, align = 'left', width, opacity, id, children }) {
  const s = Array.isArray(children) ? children.join('') : String(children ?? '');
  const t = textPath(s, { x, y, size, weight, family, ls, lh, align, width });
  return `<path id="${escapeText(id || layerId(s))}" d="${t.d}" fill="${color}"${opacity != null ? ` fill-opacity="${num(opacity)}"` : ''}/>`;
}
/* Text metrics for layout code. */
export const tw = (s, size = 14, weight = 400, family = 'inter', ls = 0) => measure(s, { size, weight, family, ls });

/* Rectangle with Figma's export conventions: inside strokes are inset by half the
   stroke width, so a 1px border lands on whole pixels. */
export function Box({ x, y, w, h: hh, r = 0, fill, stroke, sw = 1, opacity, filter, id, dash }) {
  const inset = stroke ? sw / 2 : 0;
  const a = [`x="${num(x + inset)}"`, `y="${num(y + inset)}"`, `width="${num(w - 2 * inset)}"`, `height="${num(hh - 2 * inset)}"`];
  if (r) a.push(`rx="${num(Math.max(0, r - inset))}"`);
  a.push(`fill="${fill || 'none'}"`);
  if (opacity != null) a.push(`fill-opacity="${num(opacity)}"`);
  if (stroke) { a.push(`stroke="${stroke}"`); if (sw !== 1) a.push(`stroke-width="${num(sw)}"`); }
  if (dash) a.push(`stroke-dasharray="${dash}"`);
  const rect = `<rect ${id ? `id="${escapeText(id)}" ` : ''}${a.join(' ')}/>`;
  return filter ? `<g filter="${filter}">${rect}</g>` : rect;
}
export const Icon = ({ name, x, y, size = 20, color = '#000', sw = 1.75 }) => iconSvg(name, x, y, size, color, sw);
export const Group = ({ id, children, ...rest }) => h('g', { id: id ? layerId(id) : undefined, ...rest }, children);
