/* Auto-layout model of the product page: full-bleed promo and header, a 1440px-max
   container with 48px gutters, a gallery that takes the free width (its main image stays
   square) and a 480px buy box. */
import { box, measure, tracks } from '../../design-kit/index.js';
import { NAV, SIZES } from './data.js';

export const MAXW = 1440, GUT = 48, PROMO_H = 36, HEAD_H = 72, INFO_W = 480, COL_GAP = 64;

export function layout(W, H) {
  const outer = Math.min(W, MAXW);
  const c = { x: (W - outer) / 2 + GUT, w: outer - 2 * GUT };
  const hy = PROMO_H;
  // header: wordmark, links, then search and three icons pinned right
  const logoW = measure('NORTHBOUND', { size: 18, weight: 700, ls: 2.5 });
  let lx = c.x + logoW + 56;
  const links = NAV.map(([t]) => { const w = measure(t, { size: 14.5, weight: 500 }); const b = box(lx, hy + 26, w, 20); lx += w + 28; return b; });
  const right = c.x + c.w;
  const icons = [box(right - 22, hy + 25, 22, 22), box(right - 64, hy + 25, 22, 22), box(right - 106, hy + 25, 22, 22)]; // cart, heart, user
  const search = box(right - 106 - 24 - 260, hy + 16, 260, 40);
  // breadcrumb and the two columns
  const crumbY = PROMO_H + HEAD_H + 24;
  const top = crumbY + 20 + 24;
  const gal = box(c.x, top, c.w - INFO_W - COL_GAP, 0);
  const imgW = gal.w - 72 - 16;
  const img = box(gal.x + 88, top, imgW, imgW);
  const thumbs = [0, 1, 2, 3].map(i => box(gal.x, top + i * 100, 72, 88));
  const ix = c.x + c.w - INFO_W;
  const info = { x: ix, w: INFO_W, kicker: top, title: top + 24, rating: top + 76, price: top + 116, rule: top + 176, colorLabel: top + 201, swatches: top + 233,
    sizeLabel: top + 297, sizes: top + 329, cart: top + 405, perks: top + 481, folds: top + 641 };
  info.sizeCells = tracks(ix, INFO_W, SIZES.map(() => '1fr'), 10);
  return { W, H, c, links, icons, search, crumbY, gal, img, thumbs, info };
}
export const PAGE_H = 1024;
