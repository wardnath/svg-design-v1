/* Preset registry: designs (parametric, exported as Figma-style SVG at any frame
   size) and builds (HTML documents). Builds name the design they implement. */
import socDesign, { layout as socLayout } from './soc/design.jsx';
import socBuild from './soc/build.jsx';
import asmDesign, { layout as asmLayout } from './asm/design.jsx';
import asmBuild from './asm/build.jsx';
import landingDesign, { layout as landingLayout, PAGE_H as LANDING_H } from './landing/design.jsx';
import landingBuild from './landing/build.jsx';
import productDesign, { layout as productLayout, PAGE_H as PRODUCT_H } from './product/design.jsx';
import productBuild from './product/build.jsx';
import docsDesign, { layout as docsLayout, PAGE_H as DOCS_H } from './docs/design.jsx';
import docsBuild from './docs/build.jsx';
import kanbanDesign, { layout as kanbanLayout, PAGE_H as KANBAN_H } from './kanban/design.jsx';
import kanbanBuild from './kanban/build.jsx';
import mobileDesign, { layout as mobileLayout, PAGE as MOBILE } from './mobile/design.jsx';
import mobileBuild from './mobile/build.jsx';

export const DESIGNS = [
  { id: 'soc', name: 'SOC overview', kind: 'svg', w: 1440, h: 960, family: 'Dashboard', render: socDesign, layout: socLayout,
    blurb: 'Security operations dashboard: fixed sidebar, KPI tiles with sparklines, threat map, stacked area chart, donut, bars and an alerts table.' },
  { id: 'asm', name: 'Attack surface', kind: 'svg', w: 1440, h: 960, family: 'Dashboard', render: asmDesign, layout: asmLayout,
    blurb: 'Light-theme exposure dashboard: icon rail plus section panel, score gauge, ring stats, trend chart, port bars, severity heatmap and a risk table.' },
  { id: 'landing', name: 'Landing page', kind: 'svg', w: 1440, h: LANDING_H, family: 'Marketing', render: landingDesign, layout: landingLayout,
    blurb: 'Marketing page: centered 1200px container, two-column hero with a product illustration, logo strip, feature cards, a full-bleed stats band and a gradient call to action.' },
  { id: 'product', name: 'Product page', kind: 'svg', w: 1440, h: PRODUCT_H, family: 'Commerce', render: productDesign, layout: productLayout,
    blurb: 'Store product page: promo bar, header with search, thumbnail rail and a square product image beside a 480px buy box with rating, swatches, sizes and cart controls.' },
  { id: 'docs', name: 'Docs page', kind: 'svg', w: 1440, h: DOCS_H, family: 'Content', render: docsDesign, layout: docsLayout,
    blurb: 'Documentation article: sidebar tree, a 720px measure with code tabs, a callout and a parameter table, and a table of contents that drops out below 1280px.' },
  { id: 'kanban', name: 'Kanban board', kind: 'svg', w: 1440, h: KANBAN_H, family: 'App', render: kanbanDesign, layout: kanbanLayout,
    blurb: 'Remediation board: header with tabs and people, a filter toolbar, and four flex columns of ticket cards with labels, progress, owners and dates.' },
  { id: 'mobile', name: 'Mobile app', kind: 'svg', w: MOBILE.w, h: MOBILE.h, family: 'Mobile', render: mobileDesign, layout: mobileLayout,
    blurb: 'Phone home screen of a security app: gradient status card with a score ring, a four-up actions grid, an alerts list and a pinned tab bar.' },
];

const B = (id, design, name, make, note, extra = {}) => ({ id, design, name, kind: 'html', make, note, ...extra });
export const BUILDS = [
  B('soc-grid', 'soc', 'SOC · grid and flexbox', () => socBuild(), 'Responsive build: 232px sidebar, fr grid tracks, inline SVG charts that stretch with their cards. Text falls back to Verdana.'),
  B('soc-bugs', 'soc', 'SOC · five bugs', () => socBuild({ wrongDelta: true, smallDonut: true, wideOrigins: true, swapCols: true, pillSearch: true }),
    'Wrong delta color, smaller donut, wider origins column, two table columns swapped, pill-shaped search field.'),
  B('soc-fixed', 'soc', 'SOC · fixed-pixel grid', () => socBuild({ fixedGrid: true }), 'Same markup with every grid track frozen at its 1440 × 960 pixel size. Identical at 1×; does not respond to the viewport.'),
  B('asm-grid', 'asm', 'Attack surface · grid build', () => asmBuild(), 'Responsive build: rail and panel in fixed tracks, fr rows and columns, stretchable inline SVG charts. Text falls back to Arial.'),
  B('asm-bugs', 'asm', 'Attack surface · five bugs', () => asmBuild({ gaugeColor: true, swapTiles: true, tightServices: true, dropScan: true, tallHeader: true }),
    'Gauge in the wrong color, two stat tiles swapped, service rows too tight, Run scan button dropped, header 8px taller.',
    { missing: [{ label: 'Run scan button missing', at: L => L.header.scan }] }),
  B('landing-web', 'landing', 'Landing · container and grid', () => landingBuild(), 'Responsive build: max-width container, fr grids, an inline SVG illustration that scales with its column. Text falls back to Trebuchet MS.'),
  B('landing-bugs', 'landing', 'Landing · five bugs', () => landingBuild({ ctaPill: true, logosLeft: true, heroGap: true, noLink3: true, statsIndigo: true }),
    'Pill-shaped primary button, logos packed left, lead paragraph too far from the headline, a missing card link, stat values tinted.',
    { missing: [{ label: 'Third card has no "Learn more" link', at: L => ({ x: L.f.cards[2].x + 28, y: L.f.cards[2].y + L.f.cards[2].h - 48, w: 104, h: 20 }) }] }),
  B('landing-fixed', 'landing', 'Landing · fixed-width page', () => landingBuild({ fixedWidth: true }), 'The container pinned at 1200px from the left edge. Identical at the design size; no longer centered when the window is wider.'),
  B('product-web', 'product', 'Product · grid build', () => productBuild(), 'Responsive build: fluid gallery beside a fixed 480px buy box, a square main image via aspect-ratio. Text falls back to Avenir Next / Poppins.'),
  B('product-bugs', 'product', 'Product · five bugs', () => productBuild({ priceOrder: true, swatchSquare: true, sizeGap: true, noWarranty: true, cartBlue: true }),
    'Old and new price swapped, square swatches, size buttons too close, the warranty line dropped, a blue Add to cart button.',
    { missing: [{ label: 'Warranty line missing from the delivery box', at: L => ({ x: L.info.x + 16, y: L.info.perks + 95, w: 448, h: 46 }) }] }),
  B('product-fixed', 'product', 'Product · fixed image height', () => productBuild({ fixedImage: true }), 'Main image fixed at 712px tall. Identical at the design size; no longer square when the gallery narrows.'),
  B('docs-web', 'docs', 'Docs · grid build', () => docsBuild(), 'Responsive build: three-column grid with a 1280px breakpoint for the table of contents, a centered 720px article. Text falls back to Calibri / Carlito.'),
  B('docs-bugs', 'docs', 'Docs · five bugs', () => docsBuild({ codeLight: true, noCallout: true, h2Gap: true, wideSidebar: true, wrongActive: true }),
    'Light code block, callout dropped, heading gap too large, sidebar 28px too wide, wrong item highlighted in the sidebar.',
    { missing: [{ label: 'Verification callout missing', at: L => ({ x: L.a.x, y: L.a.callout, w: L.a.w, h: L.a.calloutH }) }] }),
  B('docs-notoc', 'docs', 'Docs · no breakpoint', () => docsBuild({ alwaysToc: true }), 'The table of contents never collapses. Identical down to 1280px; keeps the column at narrower widths where the design drops it.'),
  B('kanban-web', 'kanban', 'Kanban · flex build', () => kanbanBuild(), 'Responsive build: four flex: 1 columns that stretch to the viewport bottom. Text falls back to Tahoma / DejaVu Sans.'),
  B('kanban-bugs', 'kanban', 'Kanban · five bugs', () => kanbanBuild({ labelBlue: true, colGap: true, noAvatar: true, doneOrder: true, noLabelsFilter: true }),
    'CVE labels in the wrong color, columns too far apart, an owner avatar missing, the Done column reversed, the Labels filter dropped.',
    { missing: [{ label: 'Owner avatar missing on SEC-142', at: L => ({ x: L.cols[1].cards[1].x + 14, y: L.cols[1].cards[1].y + 114, w: 22, h: 22 }) },
      { label: 'Labels filter missing', at: L => L.filters[2] }] }),
  B('kanban-fixed', 'kanban', 'Kanban · fixed 336px columns', () => kanbanBuild({ fixedCols: true }), 'Columns fixed at their 1440 width of 336px. Identical at the design size; leaves empty space when wider and overflows when narrower.'),
  B('mobile-web', 'mobile', 'Mobile · fluid build', () => mobileBuild(), 'Responsive build: full-width column with 20px gutters, a 4-column grid, tab bar pinned with position: absolute. Text falls back to Roboto / Arial.'),
  B('mobile-bugs', 'mobile', 'Mobile · five bugs', () => mobileBuild({ cardRadius: true, tallTiles: true, noChevrons: true, alertAmber: true, tabWrong: true }),
    'Square-ish status card, action tiles 12px too tall, row chevrons dropped, the breach alert in amber, the wrong tab active.',
    { missing: [{ label: 'Row chevrons missing', at: L => ({ x: L.list.x + L.list.w - 72, y: L.list.y, w: 58, h: L.list.h }) }] }),
  B('mobile-fixed', 'mobile', 'Mobile · fixed 390px', () => mobileBuild({ fixedWidth: true }), 'Screen frozen at 390px. Identical on the design phone; leaves a gap on larger phones and is clipped on smaller ones.'),
  B('asm-capped', 'asm', 'Attack surface · capped width', () => asmBuild({ capWidth: true }), 'Content capped at 1168px. Identical at the design size; stops following the viewport once it is wider.'),
];

/* Build generators by design id, for scenario builds and for tests that try option combinations. */
export const MAKERS = { soc: socBuild, asm: asmBuild, landing: landingBuild, product: productBuild, docs: docsBuild, kanban: kanbanBuild, mobile: mobileBuild };

/* Scenario builds: one kind of inaccuracy each, made by the same generators as the builds
   above with a single option set. They are scored at the design size in the benchmark. */
const SC = (id, design, name, opts, note, extra = {}) => B(id, design, name, () => MAKERS[design](opts), note, { scenario: true, ...extra });
const MISSING = {
  scan: { label: 'Run scan button missing', at: L => L.header.scan },
  callout: { label: 'Verification callout missing', at: L => ({ x: L.a.x, y: L.a.callout, w: L.a.w, h: L.a.calloutH }) },
  chevrons: { label: 'Row chevrons missing', at: L => ({ x: L.list.x + L.list.w - 72, y: L.list.y, w: 58, h: L.list.h }) },
};
BUILDS.push(
  // tolerated
  SC('soc-rounding', 'soc', 'SOC · 1px rounding differences', { jitter: true }, 'Seven spacing values off by one pixel, the rounding a browser and a design tool commonly disagree on. Nothing anyone would file.'),
  // cascades
  SC('landing-tallnav', 'landing', 'Landing · nav 16px taller', { tallNav: true }, 'The nav bar is 88px tall instead of 72px, so everything below it sits 16px lower.'),
  SC('docs-sidebar', 'docs', 'Docs · sidebar 28px wider', { wideSidebar: true }, 'Sidebar 300px instead of 272px. The article is centered in the column that is left, so it shifts 14px.'),
  SC('landing-banner', 'landing', 'Landing · inserted banner', { banner: true }, 'A 40px announcement bar above the nav that is not in the design pushes the whole page down.'),
  // spacing
  SC('kanban-gap', 'kanban', 'Kanban · columns 12px further apart', { colGap: true }, 'Board gap 28px instead of 16px. The flexible columns absorb it, so only the gaps change.'),
  SC('landing-leadgap', 'landing', 'Landing · lead paragraph gap', { heroGap: true }, 'Lead paragraph 44px below the headline instead of 20px; the buttons and trust row follow it down.'),
  SC('product-sizegap', 'product', 'Product · size buttons spread out', { sizeGapWide: true }, 'Size buttons 22px apart instead of 10px; each button narrows to keep the row’s width.'),
  SC('soc-padding', 'soc', 'SOC · KPI tiles over-padded', { tilePad: true }, 'KPI tiles have 28px of left padding instead of 16px, so labels and values sit 12px further right.'),
  // size and type
  SC('docs-h1', 'docs', 'Docs · page title too small', { h1Small: true }, 'Page title set at 28px on a 36px line instead of 36px on 44px; the article below moves up 8px.'),
  SC('soc-donut', 'soc', 'SOC · smaller donut', { smallDonut: true }, 'Severity donut 120px instead of 150px.'),
  SC('mobile-tiles', 'mobile', 'Mobile · taller action tiles', { tallTiles: true }, 'Action tiles 100px tall instead of 88px; the alerts list moves down 12px.'),
  // color and shape
  SC('soc-delta', 'soc', 'SOC · delta in the wrong color', { wrongDelta: true }, 'The incidents delta is styled as good news (green) instead of red.'),
  SC('product-cart', 'product', 'Product · blue cart button', { cartBlue: true }, 'Add to cart in brand blue instead of near-black.'),
  SC('kanban-labels', 'kanban', 'Kanban · CVE labels in blue', { labelBlue: true }, 'Every red CVE label chip is tinted blue.'),
  SC('docs-code', 'docs', 'Docs · light code block', { codeLight: true }, 'The code block uses the light theme; the design has it dark.'),
  SC('landing-pill', 'landing', 'Landing · pill-shaped button', { ctaPill: true }, 'Primary button fully rounded instead of 10px corners.'),
  SC('mobile-radius', 'mobile', 'Mobile · status card corners', { cardRadius: true }, 'Status card corners 8px instead of 24px.'),
  // missing and extra
  SC('asm-scan', 'asm', 'Attack surface · Run scan dropped', { dropScan: true }, 'The Run scan button is missing from the header; its neighbours slide right.', { missing: [MISSING.scan] }),
  SC('docs-callout', 'docs', 'Docs · callout dropped', { noCallout: true }, 'The verification callout is missing; the article closes the gap.', { missing: [MISSING.callout] }),
  SC('product-stock', 'product', 'Product · extra stock note', { stockNote: true }, 'An "Only 3 left" line under the swatches that is not in the design pushes the rest of the buy box down.'),
  SC('mobile-chevrons', 'mobile', 'Mobile · chevrons dropped', { noChevrons: true }, 'The chevrons at the end of each alert row are missing.', { missing: [MISSING.chevrons] }),
  // order and state
  SC('soc-swap', 'soc', 'SOC · table columns swapped', { swapCols: true }, 'Two columns of the alerts table trade places.'),
  SC('product-price', 'product', 'Product · prices swapped', { priceOrder: true }, 'The struck-out old price comes before the current price.'),
  SC('kanban-reversed', 'kanban', 'Kanban · Done column reversed', { doneOrder: true }, 'The cards in the Done column are in reverse order.'),
  SC('docs-active', 'docs', 'Docs · wrong sidebar item', { wrongActive: true }, 'The sidebar highlights Installation while the page is Quickstart.'),
  SC('mobile-tab', 'mobile', 'Mobile · wrong active tab', { tabWrong: true }, 'The tab bar highlights Alerts on the Home screen.'),
  // content
  SC('landing-copy', 'landing', 'Landing · longer button copy', { longCta: true }, 'The primary button reads "Start your 14-day free trial"; the design says "Start free trial".'),
  SC('kanban-ellipsis', 'kanban', 'Kanban · titles cut off', { ellipsis: true }, 'Card titles clamped to 40% of the card with an ellipsis; the design shows them in full.'),
  SC('mobile-icon', 'mobile', 'Mobile · wrong tile icon', { wrongIcon: true }, 'The Passwords tile shows a lock icon where the design has a key.'),
  // alignment
  SC('landing-logos', 'landing', 'Landing · logos packed left', { logosLeft: true }, 'Logos packed to the left with a fixed gap instead of spread across the row.'),
  SC('landing-heading', 'landing', 'Landing · heading left-aligned', { h2Left: true }, 'The features heading is left-aligned; the design centers it.'),
  SC('kanban-group', 'kanban', 'Kanban · Group by not pinned right', { groupLeft: true }, 'The Group by control follows the filters instead of being pushed to the right edge.'),
);

/* A build that is literally the exported design, placed as an image. It scores
   perfectly at the design's own size, which is why a single-size check is not enough. */
export function imageCopyHtml(svg, w, h) {
  const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  return `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>Static copy</title>\n<style>*{margin:0;padding:0}html,body{background:#fff}img{display:block}</style>\n</head>\n<body><img src="${url}" width="${w}" height="${h}" alt=""></body>\n</html>\n`;
}
for (const d of DESIGNS) {
  BUILDS.push(B(`${d.id}-image`, d.id, `${d.name.split(' ')[0]} · static image copy`, () => imageCopyHtml(d.render({ W: d.w, H: d.h }), d.w, d.h),
    'The exported SVG dropped into a page as an <img>. Pixel-perfect at the design size, frozen at every other size.', { staticCopy: true }));
}

/* Gallery: a design, a build, an algorithm and a viewport each, grouped by the kind of
   inaccuracy it demonstrates, with what the tool is expected to report. */
export const CATEGORIES = [
  ['pass', 'Should pass'], ['cascade', 'Cascades'], ['spacing', 'Spacing'], ['size', 'Size and type'], ['color', 'Color and shape'],
  ['presence', 'Missing and extra'], ['order', 'Order and state'], ['content', 'Content'], ['align', 'Alignment'],
  ['mixed', 'Several at once'], ['responsive', 'Responsive'], ['method', 'Methods compared'],
];
const G = (cat, id, title, design, build, expect, extra = {}) => ({ id, cat, title, design, build, algo: 'viterbi-flow', expect, ...extra });
export const GALLERY = [
  G('pass', 'soc-clean', 'SOC dashboard, fonts differ, nothing broken', 'soc', 'soc-grid', 'Nothing flagged, although no line of text has the design’s width.'),
  G('pass', 'docs-clean', 'Docs page, paragraphs reflow, nothing broken', 'docs', 'docs-web', 'Nothing flagged, although the paragraphs wrap at different words.'),
  G('pass', 'landing-clean', 'Landing page, CSS shadows and gradients', 'landing', 'landing-web', 'Nothing flagged.'),
  G('pass', 'soc-rounding', 'SOC dashboard, 1px rounding everywhere', 'soc', 'soc-rounding', 'Nothing flagged: a pixel is inside the position tolerance.'),

  G('cascade', 'cascade-flow', 'Taller nav, one finding (Viterbi + flow)', 'landing', 'landing-tallnav', 'Findings only on the nav: its contents and its bottom rule. Every element below, 16px lower, is explained by them.'),
  G('cascade', 'cascade-tree', 'Taller nav through a parent-relative tree', 'landing', 'landing-tallnav', 'Positions are measured from each parent, but siblings that flow one after another are not linked, so each top-level element below the nav is charged again.', { algo: 'viterbi' }),
  G('cascade', 'cascade-flat', 'Taller nav through flat boxes', 'landing', 'landing-tallnav', 'Every element below the nav reported as moved 16px down: the double jeopardy that the tree and flow methods remove.', { algo: 'flat' }),
  G('cascade', 'docs-sidebar', 'Wider sidebar re-centers the article', 'docs', 'docs-sidebar', 'One finding, the sidebar’s width. The article shifts 14px because it is centered in the space left, and that is explained.'),
  G('cascade', 'landing-banner', 'Inserted banner pushes the page down', 'landing', 'landing-banner', 'One “not in the design” finding, the banner. Nothing below it is charged for moving 40px.'),

  G('spacing', 'kanban-gap', 'Kanban, columns 12px further apart', 'kanban', 'kanban-gap', 'One finding for the row: all three gaps 12px wider. The columns absorb the change, so their outer edges still line up.'),
  G('spacing', 'landing-leadgap', 'Landing, lead paragraph 24px too low', 'landing', 'landing-leadgap', 'The lead paragraph charged for the gap; the buttons and trust row that follow it are explained.'),
  G('spacing', 'product-sizegap', 'Product, size buttons spread out', 'product', 'product-sizegap', 'One finding for the row: both gaps 12px wider.'),
  G('spacing', 'soc-padding', 'SOC, KPI tiles over-padded', 'soc', 'soc-padding', 'One finding per tile, on its label. The value follows the label, and the absolutely positioned chip and sparkline stay put.'),

  G('size', 'docs-h1', 'Docs, page title set too small', 'docs', 'docs-h1', '“Text set smaller” on the title. The article below moves up 8px and is explained.'),
  G('size', 'soc-donut', 'SOC, donut 30px smaller', 'soc', 'soc-donut', 'A size finding on the donut; the legend beside it is explained.'),
  G('size', 'mobile-tiles', 'Mobile, action tiles 12px taller', 'mobile', 'mobile-tiles', 'The tiles’ height flagged; the alerts list moves down 12px and is explained.'),

  G('color', 'soc-delta', 'SOC, a delta in the wrong color', 'soc', 'soc-delta', 'One color finding, on the delta.'),
  G('color', 'product-cart', 'Product, cart button in blue', 'product', 'product-cart', 'A fill color finding on the button and nothing else.'),
  G('color', 'kanban-labels', 'Kanban, CVE labels in blue', 'kanban', 'kanban-labels', 'The CVE chips flagged for color.'),
  G('color', 'docs-code', 'Docs, code block in the light theme', 'docs', 'docs-code', 'The block’s fill and its text colors flagged, and its inner bands lost; nothing moved.'),
  G('color', 'landing-pill', 'Landing, pill-shaped primary button', 'landing', 'landing-pill', 'A corner radius finding on the button.'),
  G('color', 'mobile-radius', 'Mobile, status card corners too tight', 'mobile', 'mobile-radius', 'A corner radius finding on the card.'),

  G('presence', 'asm-scan', 'Attack surface, Run scan button dropped', 'asm', 'asm-scan', 'One missing element. The buttons to its left slide into its place and are explained.'),
  G('presence', 'docs-callout', 'Docs, callout dropped', 'docs', 'docs-callout', 'One missing element. The article below closes the gap and is explained.'),
  G('presence', 'product-stock', 'Product, an extra low-stock line', 'product', 'product-stock', 'One “not in the design” finding. The sizes, cart and perks it pushes down are explained.'),
  G('presence', 'mobile-chevrons', 'Mobile, row chevrons dropped', 'mobile', 'mobile-chevrons', 'Each chevron sits close enough to the time to read as one line with it, so every row’s line is flagged as shorter; nothing moved.'),

  G('order', 'soc-swap', 'SOC, two table columns swapped', 'soc', 'soc-swap', 'The two swapped columns flagged as moved; the other columns are fine.'),
  G('order', 'product-price', 'Product, prices in the wrong order', 'product', 'product-price', '“Words rearranged within the line” on the price row.'),
  G('order', 'kanban-reversed', 'Kanban, Done column reversed', 'kanban', 'kanban-reversed', 'The cards whose content changed places flagged.'),
  G('order', 'docs-active', 'Docs, wrong sidebar item highlighted', 'docs', 'docs-active', 'The highlight flagged as moved to another item.'),
  G('order', 'mobile-tab', 'Mobile, wrong tab active', 'mobile', 'mobile-tab', 'The Home and Alerts tabs flagged for color.'),

  G('content', 'landing-copy', 'Landing, button copy longer than the design', 'landing', 'landing-copy', 'The label flagged as longer than the font explains. The second button moves right and is explained.'),
  G('content', 'kanban-ellipsis', 'Kanban, card titles cut off', 'kanban', 'kanban-ellipsis', 'The titles flagged as shorter than the font explains, not as smaller text.'),
  G('content', 'mobile-icon', 'Mobile, wrong icon in a tile', 'mobile', 'mobile-icon', '“Different icon” on the tile’s glyph, and nothing else.'),

  G('align', 'landing-logos', 'Landing, logos packed left', 'landing', 'landing-logos', 'The logo row flagged as moved.'),
  G('align', 'landing-heading', 'Landing, heading left-aligned', 'landing', 'landing-heading', 'The heading flagged as moved left; the centered subtitle under it is fine.'),
  G('align', 'kanban-group', 'Kanban, Group by not pinned right', 'kanban', 'kanban-group', 'The control flagged as moved left.'),

  G('mixed', 'soc-bugs', 'SOC dashboard, five planted bugs', 'soc', 'soc-bugs', 'All six planted bugs found (one swap marks two columns) and nothing else flagged.'),
  G('mixed', 'asm-bugs', 'Attack surface, five bugs incl. a dropped button', 'asm', 'asm-bugs', 'All five found and nothing else flagged.'),
  G('mixed', 'landing-bugs', 'Landing page, five bugs', 'landing', 'landing-bugs', 'All five found and nothing else flagged.'),
  G('mixed', 'product-bugs', 'Product page, five bugs', 'product', 'product-bugs', 'All five found and nothing else flagged.'),
  G('mixed', 'docs-bugs', 'Docs page, five bugs incl. a dropped callout', 'docs', 'docs-bugs', 'All five found and nothing else flagged.'),
  G('mixed', 'kanban-bugs', 'Kanban board, five bugs', 'kanban', 'kanban-bugs', 'All five found and nothing else flagged.'),
  G('mixed', 'mobile-bugs', 'Mobile app, five bugs', 'mobile', 'mobile-bugs', 'All five found and nothing else flagged.'),

  G('responsive', 'soc-stretch', 'SOC at 1800×1200, responsive build', 'soc', 'soc-grid', 'A pass: the build moved like the design re-exported at this size.', { vp: 'big' }),
  G('responsive', 'soc-fixed', 'SOC at 1800×1200, fixed-pixel grid', 'soc', 'soc-fixed', 'A frozen-layout fail: identical at 1440, unmoved here.', { vp: 'big' }),
  G('responsive', 'asm-capped', 'Attack surface at 2160, width capped', 'asm', 'asm-capped', 'A fail: the design keeps filling the width.', { vp: 'huge' }),
  G('responsive', 'landing-fixed', 'Landing page at 1800, not centered', 'landing', 'landing-fixed', 'A frozen-layout fail: the page is no longer centered.', { vp: 'wide' }),
  G('responsive', 'product-fixed', 'Product page at 1224, image not square', 'product', 'product-fixed', 'The image flagged; the design keeps it square.', { vp: 'narrow' }),
  G('responsive', 'docs-notoc', 'Docs at 1224, breakpoint ignored', 'docs', 'docs-notoc', 'The table of contents reported where the design drops it.', { vp: 'narrow' }),
  G('responsive', 'kanban-fixed', 'Kanban at 2160, fixed columns', 'kanban', 'kanban-fixed', 'A frozen-layout fail: the right of the board is left empty.', { vp: 'huge' }),
  G('responsive', 'kanban-overflow', 'Kanban at 1224, fixed columns overflow', 'kanban', 'kanban-fixed', 'The last column cut off, and a frozen-layout fail.', { vp: 'narrow' }),
  G('responsive', 'mobile-large', 'Mobile on a larger phone, responsive', 'mobile', 'mobile-web', 'A pass.', { vp: 'large' }),
  G('responsive', 'mobile-fixed', 'Mobile on a larger phone, frozen at 390', 'mobile', 'mobile-fixed', 'A frozen-layout fail.', { vp: 'large' }),
  G('responsive', 'soc-copy-1x', 'Static image copy at design size', 'soc', 'soc-image', 'A perfect score at the design size, which is why one size is not enough.'),
  G('responsive', 'soc-copy-wide', 'Static image copy, stretched', 'soc', 'soc-image', 'A frozen-layout fail.', { vp: 'big' }),
  G('responsive', 'soc-inferred', 'SOC stretched by inferred constraints', 'soc', 'soc-grid', 'Review: responsive, with approximate findings, since the constraints are guessed from the single export.', { vp: 'big', model: 'inferred' }),

  G('method', 'soc-pixel', 'Same SOC pair through a pixel diff', 'soc', 'soc-grid', 'Nearly every line differs in pixels, because the fonts differ. Compare the first preset, where the tree methods flag nothing.', { algo: 'pixel' }),
  G('method', 'soc-ssim', 'Same SOC pair through SSIM', 'soc', 'soc-grid', 'Regions, not elements: every line of text differs a little.', { algo: 'ssim' }),
  G('method', 'mismatch', 'Wrong pairing: landing design, product build', 'landing', 'product-web', 'A low score, mostly missing and extra elements, and no ground truth for this pair.'),
];
