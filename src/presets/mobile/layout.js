/* Auto-layout model of the phone screen: 20px gutters, content stacked from the top, a
   four-column actions grid and a tab bar pinned to the bottom edge. */
import { box, tracks } from '../../design-kit/index.js';
import { ACTIONS, ALERTS } from './data.js';

export const SIDE = 20, STATUS_H = 47, TABBAR = 84;
export function layout(W, H, o = {}) {
  const w = o.fixedWidth ? 390 : W;
  const cw = w - 2 * SIDE;
  const head = { y: STATUS_H + 8 };            // greeting row, 44 tall
  const card = box(SIDE, head.y + 44 + 16, cw, 168);
  const actY = card.y + card.h + 24;
  const acts = tracks(SIDE, cw, ACTIONS.map(() => '1fr'), 12).map(t => box(t.x, actY + 28, t.w, 88));
  const listY = actY + 28 + 88 + 24;
  const list = box(SIDE, listY + 28, cw, ALERTS.length * 64);
  const tabbar = box(0, H - TABBAR, w, TABBAR);
  return { W, H, w, cw, head, card, actY, acts, listY, list, tabbar, tabs: tracks(0, w, ['1fr', '1fr', '1fr', '1fr'], 0) };
}
export const PAGE = { w: 390, h: 844 };
