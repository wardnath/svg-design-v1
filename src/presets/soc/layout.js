/* Auto-layout model of the SOC overview: every box as a function of the frame
   size, written to the same rules as the CSS build (fixed sidebar, flexible
   grid tracks, pinned clusters). The design "export" and the ground truth for
   missing elements both come from here. */
import { tracks, box, measure } from '../../design-kit/index.js';
import { KPIS, NAV } from './data.js';

export const SIDE = 232, TOP = 64, PAD = 24, GAP = 16, CARD_PAD = 16, HEAD = 20;
export const ROW_SPEC = [112, '1.15fr', '1fr', '1fr'];
export const ALERT_COLS = [104, '2.2fr', '1.2fr', '1fr', 110, 128, 72];

export function cardBody(c) {
  return box(c.x + CARD_PAD, c.y + 14 + HEAD + 12, c.w - 2 * CARD_PAD, c.h - 14 - HEAD - 12 - CARD_PAD);
}

export function layout(W, H) {
  const side = box(0, 0, SIDE, H);
  const top = box(SIDE, 0, W - SIDE, TOP);
  const content = box(SIDE + PAD, TOP + PAD, W - SIDE - 2 * PAD, H - TOP - 2 * PAD);
  const rows = tracks(content.y, content.h, ROW_SPEC, GAP);
  const kc = tracks(content.x, content.w, ['1fr', '1fr', '1fr', '1fr'], GAP);
  const two = tracks(content.x, content.w, ['2fr', '1fr'], GAP);
  const kpis = kc.map(c => box(c.x, rows[0].x, c.w, rows[0].w));
  const map = box(two[0].x, rows[1].x, two[0].w, rows[1].w);
  const sev = box(two[1].x, rows[1].x, two[1].w, rows[1].w);
  const events = box(two[0].x, rows[2].x, two[0].w, rows[2].w);
  const vectors = box(two[1].x, rows[2].x, two[1].w, rows[2].w);
  const alerts = box(content.x, rows[3].x, content.w, rows[3].w);

  // top bar: title · search (flex 0 1 440px) · right cluster pushed to the end
  const titleW = measure('Security overview', { size: 18, weight: 600 });
  const rangeW = 12 + 16 + 8 + measure('Last 24 hours', { size: 13, weight: 500 }) + 8 + 14 + 12;
  const liveW = 10 + 8 + 6 + measure('Live', { size: 12, weight: 600 }) + 10;
  const rightW = rangeW + 12 + liveW + 12 + 36 + 12 + 32;
  const inner = top.w - 2 * PAD;
  const searchW = Math.max(160, Math.min(440, inner - titleW - 32 - 24 - rightW));
  const search = box(top.x + PAD + titleW + 32, 14, searchW, 36);
  let rx = top.x + top.w - PAD - rightW;
  const range = box(rx, 14, rangeW, 36); rx += rangeW + 12;
  const live = box(rx, 18, liveW, 28); rx += liveW + 12;
  const bell = box(rx, 14, 36, 36); rx += 36 + 12;
  const avatar = box(rx, 16, 32, 32);

  // sidebar nav
  const nav = [];
  let y = 72;
  for (const g of NAV) {
    const label = box(20, y, 192, 16);
    y += 16 + 6;
    const items = g.items.map(it => { const b = box(12, y, SIDE - 24, 36); y += 36 + 2; return { it, b }; });
    nav.push({ g, label, items });
    y += 14;
  }

  return { W, H, side, top, content, rows, kpis, map, sev, events, vectors, alerts, search, range, live, bell, avatar, titleW, nav,
    alertCols: tracks(alerts.x + CARD_PAD, alerts.w - 2 * CARD_PAD, ALERT_COLS, 16), kpiData: KPIS };
}
