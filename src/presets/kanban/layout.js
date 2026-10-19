/* Auto-layout model of the board: header and toolbar rows, then four columns that share
   the width equally (flex: 1) and stretch to the bottom of the viewport. Cards are fixed-
   height stacks, so a taller window only lengthens the column backgrounds. */
import { box, measure, tracks } from '../../design-kit/index.js';
import { COLUMNS, TABS, FILTERS, PROJECT } from './data.js';

export const HEAD = 60, TOOL = 52, PAD = 24, COLGAP = 16, CPAD = 10;
export const cardH = k => 134 + (k.progress != null ? 16 : 0);

export function layout(W, H, o = {}) {
  const nameW = measure(PROJECT, { size: 16, weight: 600 });
  let tx = 24 + 28 + 10 + nameW + 8 + 16 + 32;
  const tabs = TABS.map(t => { const w = measure(t, { size: 14, weight: 500 }); const b = box(tx, 20, w, 20); tx += w + 24; return b; });
  const newW = Math.round(12 + 14 + 6 + measure('New ticket', { size: 13, weight: 600 }) + 14);
  const shareW = Math.round(measure('Share', { size: 13, weight: 600 })) + 28;
  const newB = box(W - 24 - newW, 13, newW, 34), share = box(newB.x - 10 - shareW, 13, shareW, 34);
  const avatars = box(share.x - 16 - (4 * 20 + 28), 16, 4 * 20 + 28, 28);
  // toolbar
  const search = box(24, HEAD + 10, 240, 32);
  let fx = search.x + search.w + 12;
  const filters = FILTERS.map(t => { const w = Math.round(12 + measure(t, { size: 13, weight: 500 }) + 6 + 12 + 10); const b = box(fx, HEAD + 10, w, 32); fx += w + 8; return b; });
  const groupW = measure('Group by', { size: 13 }) + 6 + measure('Status', { size: 13, weight: 600 }) + 4 + 12;
  const group = box(W - 24 - groupW, HEAD + 16, groupW, 20);
  // board
  const top = HEAD + TOOL + 8;
  const cols = (o.fixedCols ? [336, 336, 336, 336].map((w, i) => ({ x: PAD + i * (336 + COLGAP), w })) : tracks(PAD, W - 2 * PAD, COLUMNS.map(() => '1fr'), COLGAP))
    .map((t, i) => {
      const col = box(t.x, top, t.w, H - top - PAD);
      let y = top + CPAD + 36 + 4;
      const cards = COLUMNS[i].cards.map(k => { const b = box(t.x + CPAD, y, t.w - 2 * CPAD, cardH(k)); y += cardH(k) + 10; return b; });
      return { col, cards };
    });
  return { W, H, tabs, newB, share, avatars, search, filters, group, cols };
}
export const PAGE_H = 900;
