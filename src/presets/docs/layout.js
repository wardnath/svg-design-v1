/* Auto-layout model of the docs page: fixed sidebar (272) and table of contents (240,
   hidden below a 1280px breakpoint), an article column that centers a 720px measure,
   and a header with a centered search field. */
import { box, measure, tracks, wrap } from '../../design-kit/index.js';
import { SIDEBAR, TOC, LEAD, P1 } from './data.js';

export const TOP = 64, SIDE = 272, TOCW = 240, MEASURE = 720, BREAK = 1280;

export function layout(W, H, o = {}) {
  const showToc = o.alwaysToc || W >= BREAK;
  const colX = SIDE, colW = W - SIDE - (showToc ? TOCW : 0);
  const aw = Math.min(MEASURE, colW - 112);
  const ax = colX + 56 + (colW - 112 - aw) / 2;
  // header: brand and version on the left, search centered, links and GitHub on the right
  const searchW = 420, search = box((W - searchW) / 2, 12, searchW, 40);
  const versionX = 24 + 28 + 10 + measure('Corvid', { size: 17, weight: 700 }) + 8 + measure('Docs', { size: 17, weight: 400 }) + 16;
  // sidebar tree
  const nav = [];
  let y = TOP + 24;
  for (const g of SIDEBAR) {
    const label = box(24, y, SIDE - 48, 16);
    y += 16 + 8;
    const items = g.items.map(it => { const b = box(12, y, SIDE - 24, 32); y += 32 + 2; return { it, b }; });
    nav.push({ g, label, items });
    y += 20;
  }
  // article flow (heights fixed by the copy at this measure)
  const lines = (t, size, w) => wrap(t, w, { size }).length;
  const a = { x: ax, w: aw };
  a.crumbs = TOP + 40;
  a.h1 = a.crumbs + 20 + 12;
  a.lead = a.h1 + 44 + 12; a.leadH = 28 * lines(LEAD, 17, aw);
  a.h2a = a.lead + a.leadH + 36;
  a.p1 = a.h2a + 30 + 10; a.p1H = 26 * lines(P1, 15.5, aw);
  a.code = a.p1 + a.p1H + 18; a.codeH = 38 + 16 + 3 * 22 + 16;
  a.callout = a.code + a.codeH + 20; a.calloutH = 52;
  a.h2b = a.callout + a.calloutH + 36;
  a.p2 = a.h2b + 30 + 10;
  a.table = a.p2 + 26 + 18;
  a.cols = tracks(ax, aw, [150, '1fr', 96], 0);
  const toc = showToc ? { x: W - TOCW + 24, y: TOP + 40, items: TOC.map((t, i) => box(W - TOCW + 24, TOP + 40 + 16 + 14 + i * 30, TOCW - 48, 20)) } : null;
  return { W, H, showToc, colX, colW, search, versionX, nav, a, toc };
}
export const PAGE_H = 1000;
