/* The product screenshot in the hero, drawn as vector art on a 600 × 432 canvas. The
   design places it with a transform; the build inlines it as an <svg> that scales with
   its column (width 100%, fixed aspect ratio), as a marketing site does with an
   illustration. */
import { num, points, smoothPath, areaPath, rng } from '../../design-kit/index.js';

export const MOCK = { w: 600, h: 432 };
const R = rng(5);
const series = Array.from({ length: 18 }, (_, i) => 40 + 30 * Math.sin(i / 2.6) + i * 3 + R() * 10);

export function mockMarkup(gid = 'mk') {
  const s = [];
  const rect = (x, y, w, h, r, fill, extra = '') => s.push(`<rect x="${num(x)}" y="${num(y)}" width="${num(w)}" height="${num(h)}"${r ? ` rx="${num(r)}"` : ''} fill="${fill}"${extra}/>`);
  rect(0, 0, 600, 432, 16, '#0B1220');
  // window chrome
  ['#F87171', '#FBBF24', '#34D399'].forEach((c, i) => s.push(`<circle cx="${22 + i * 16}" cy="20" r="5" fill="${c}"/>`));
  rect(0, 40, 600, 1, 0, '#1E293B');
  // sidebar
  rect(0, 41, 128, 391, 0, '#111B30');
  [0, 1, 2, 3, 4, 5].forEach(i => rect(16, 64 + i * 30, i === 1 ? 96 : 72 - (i % 3) * 10, 10, 5, i === 1 ? '#6366F1' : '#1E293B'));
  // KPI tiles
  const kx = 148, kw = 136;
  [['#22D3EE', 0.72], ['#F43F5E', 0.38], ['#A78BFA', 0.55]].forEach(([c, f], i) => {
    const x = kx + i * (kw + 10);
    rect(x, 60, kw, 76, 10, '#172238');
    rect(x + 12, 74, 48, 6, 3, '#334155');
    rect(x + 12, 90, 70, 14, 4, '#E2E8F0');
    rect(x + 12, 118, kw - 24, 6, 3, '#2A3650');
    rect(x + 12, 118, (kw - 24) * f, 6, 3, c);
  });
  // chart card
  rect(148, 148, 428, 170, 10, '#172238');
  rect(164, 162, 80, 8, 4, '#334155');
  const plot = { x: 164, y: 188, w: 396, h: 112 };
  [0, 1, 2].forEach(i => rect(plot.x, plot.y + i * 56, plot.w, 1, 0, '#2A3650'));
  const pts = points(series, plot, 0, 140);
  s.push(`<defs><linearGradient id="${gid}" x1="0" y1="${plot.y}" x2="0" y2="${plot.y + plot.h}" gradientUnits="userSpaceOnUse"><stop stop-color="#6366F1" stop-opacity="0.45"/><stop offset="1" stop-color="#6366F1" stop-opacity="0"/></linearGradient></defs>`);
  s.push(`<path d="${areaPath(pts, plot.y + plot.h)}" fill="url(#${gid})"/>`);
  s.push(`<path d="${smoothPath(pts)}" fill="none" stroke="#818CF8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`);
  // findings list
  rect(148, 330, 428, 84, 10, '#172238');
  [['#F43F5E', 210], ['#FB923C', 168], ['#FACC15', 132]].forEach(([c, w], i) => {
    const y = 346 + i * 22;
    s.push(`<circle cx="168" cy="${y + 5}" r="4" fill="${c}"/>`);
    rect(182, y, w, 10, 5, '#334155');
    rect(520, y, 40, 10, 5, '#2A3650');
  });
  return s.join('');
}
