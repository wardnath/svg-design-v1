/* Auto-layout model of the attack-surface summary: an icon rail and a section panel
   of fixed width, a header whose action cluster is pinned right, and a three-row grid
   of fr tracks. The design export and the ground truth of design-space bugs both come
   from here; the CSS build implements the same rules. */
import { tracks, box, measure } from '../../design-kit/index.js';
import { NAV } from './data.js';

export const RAIL = 64, PANEL = 208, SIDE = RAIL + PANEL, TOP = 64, PAD = 24, GAP = 16;
export const CP = 18, CT = 16, HEAD = 20, HGAP = 14;
export const ROWS = [132, '1.2fr', '1fr'];
export const TILE_COLS = ['1.4fr', '1fr', '1fr', '1fr'];
export const MID_COLS = ['2fr', '1fr'];
export const LOW_COLS = ['1fr', '1.4fr'];
export const TABLE_COLS = ['1.7fr', 92, 80, '1fr', 72];

export const cardBody = c => box(c.x + CP, c.y + CT + HEAD + HGAP, c.w - 2 * CP, c.h - CT - HEAD - HGAP - CP);

export function layout(W, H) {
  const content = box(SIDE + PAD, TOP + PAD, W - SIDE - 2 * PAD, H - TOP - 2 * PAD);
  const rows = tracks(content.y, content.h, ROWS, GAP);
  const at = (cols, r) => tracks(content.x, content.w, cols, GAP).map(c => box(c.x, rows[r].x, c.w, rows[r].w));
  const tiles = at(TILE_COLS, 0);
  const [trend, services] = at(MID_COLS, 1);
  const [heat, assets] = at(LOW_COLS, 2);

  // header: title left; segmented range, Export and Run scan pinned right
  const segW = [['7d', 0], ['30d', 1], ['90d', 2]].map(([t]) => Math.round(measure(t, { size: 12.5, weight: 600 })) + 24);
  const seg = segW.reduce((a, b) => a + b, 0) + 8;
  const exportW = Math.round(12 + 16 + 8 + measure('Export', { size: 13, weight: 600 }) + 14);
  const scanW = Math.round(12 + 16 + 8 + measure('Run scan', { size: 13, weight: 600 }) + 14);
  let rx = W - PAD - (seg + 12 + exportW + 12 + scanW);
  const header = { seg: box(rx, 16, seg, 32), segW };
  rx += seg + 12;
  header.export = box(rx, 14, exportW, 36); rx += exportW + 12;
  header.scan = box(rx, 14, scanW, 36);

  // section panel: groups of 34px items
  const nav = [];
  let y = 64;
  for (const g of NAV) {
    const label = box(RAIL + 20, y, PANEL - 40, 16);
    y += 16 + 6;
    const items = g.items.map(it => { const b = box(RAIL + 10, y, PANEL - 20, 34); y += 34 + 2; return { it, b }; });
    nav.push({ g, label, items });
    y += 16;
  }
  const coverage = box(RAIL + 12, H - 16 - 84, PANEL - 24, 84);

  return { W, H, content, rows, tiles, trend, services, heat, assets, header, nav, coverage,
    tableCols: tracks(assets.x + CP, assets.w - 2 * CP, TABLE_COLS, 16) };
}
