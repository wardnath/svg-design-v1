/* Auto-layout model of the marketing page: a 1200px centered container with 32px
   gutters, full-bleed bands for the nav, the stats strip and the footer, and section
   heights set by their content (no viewport units), so a taller frame only adds page
   background below the footer. */
import { tracks, box, measure } from '../../design-kit/index.js';
import { LINKS } from './data.js';
import { MOCK } from './mock.js';

export const MAXW = 1200, GUT = 32, NAV_H = 72;
export const HERO_TOP = 72, HERO_BOTTOM = 88;

export function container(W) {
  const w = Math.min(MAXW, W - 2 * GUT);
  return { x: (W - w) / 2, w };
}

export function layout(W, H, o = {}) {
  const c = o.fixedWidth ? { x: 120, w: MAXW } : container(W);
  // nav: logo, links after it, actions pinned right
  const logoW = 32 + 10 + measure('Sentinel', { size: 20, weight: 700 });
  let lx = c.x + logoW + 48;
  const links = LINKS.map(t => { const w = measure(t, { size: 14.5, weight: 500 }); const b = box(lx, 26, w, 20); lx += w + 32; return b; });
  const ctaW = Math.round(measure('Start free trial', { size: 14, weight: 600 })) + 36;
  const cta = box(c.x + c.w - ctaW, 16, ctaW, 40);
  const signW = measure('Sign in', { size: 14.5, weight: 500 });
  const sign = box(cta.x - 24 - signW, 26, signW, 20);

  // hero: text column and illustration column
  const y0 = NAV_H + HERO_TOP;
  const [lc, rc] = tracks(c.x, c.w, ['1fr', '1.1fr'], 64);
  const tagW = Math.round(measure('New', { size: 12, weight: 600 })) + 16;
  const eyebrowW = Math.round(4 + tagW + 8 + measure('Exposure graph is live', { size: 13, weight: 500 }) + 6 + 14 + 12);
  const hero = {
    left: box(lc.x, y0, lc.w, 0),
    eyebrow: box(lc.x, y0, eyebrowW, 30), tagW,
    h1: box(lc.x, y0 + 30 + 24, lc.w, 180),
    lead: box(lc.x, y0 + 30 + 24 + 180 + 20, lc.w, 84),
  };
  const ctaY = hero.lead.y + 84 + 36;
  const b1W = Math.round(measure('Start free trial', { size: 15, weight: 600 })) + 68;
  const b2W = Math.round(measure('Book a demo', { size: 15, weight: 600 })) + 44;
  hero.cta1 = box(lc.x, ctaY, b1W, 48);
  hero.cta2 = box(lc.x + b1W + 12, ctaY, b2W, 48);
  hero.trust = box(lc.x, ctaY + 48 + 28, lc.w, 32);
  const mockW = rc.w, mockH = (rc.w * MOCK.h) / MOCK.w;
  hero.mock = box(rc.x, y0 + 8, mockW, mockH);
  const heroEnd = Math.max(hero.trust.y + 32, hero.mock.y + mockH) + HERO_BOTTOM;

  // logo strip: label, then six marks spread across the container
  const logos = { label: box(c.x, heroEnd + 36, c.w, 18), y: heroEnd + 36 + 18 + 24, rule: heroEnd };
  const logoEnd = logos.y + 32 + 64;

  // features
  const f = { head: box(c.x, logoEnd, c.w, 44), sub: box(c.x, logoEnd + 44 + 12, c.w, 28) };
  const cardsY = f.sub.y + 28 + 48;
  f.cards = tracks(c.x, c.w, ['1fr', '1fr', '1fr'], 24).map(t => box(t.x, cardsY, t.w, 280));
  const featEnd = cardsY + 280 + 96;

  // stats band (full bleed), then the closing call to action and the footer
  const stats = { band: box(0, featEnd, W, 168), cols: tracks(c.x, c.w, ['1fr', '1fr', '1fr', '1fr'], 24) };
  const ctaCard = box(c.x, featEnd + 168 + 88, c.w, 248);
  const footY = ctaCard.y + 248 + 72;
  const foot = { rule: footY, row: box(c.x, footY + 24, c.w, 20) };
  // generous bottom margin: a build that pushes the page down (a taller nav, an inserted
  // banner) must not clip the footer at the same frame height
  const total = foot.row.y + 20 + 64;

  return { W, H, c, links, cta, sign, hero, logos, f, stats, ctaCard, foot, total };
}

/* The frame height the page needs at the design width. */
export const PAGE_H = Math.ceil(layout(1440, 0).total);
