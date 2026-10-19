// node test/list.mjs <design> <design|buildId> x0 y0 x1 y1 [sx] [sy] → nodes intersecting the region
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const [,, dId, which, x0, y0, x1, y1, sx = '1', sy = '1'] = process.argv;
const R = [+x0, +y0, +x1, +y1];
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', e => console.log('[pageerror]', e.message));
page.on('console', m => { if (m.text().startsWith('DBG')) console.log(m.text()); });
await page.goto('file:///home/claude/redline-v2_4/test/harness.html');
const out = await page.evaluate(async ([dId, which, R, sx, sy]) => {
  const d = Presets.DESIGNS.find(x => x.id === dId);
  const W = Math.round(d.w * sx), H = Math.round(d.h * sy);
  const img = which === 'design' ? await Engine.rasterize({ type: 'svg', text: d.render({ W, H }) }, W, H)
    : await Engine.rasterize({ type: 'html', text: Presets.BUILDS.find(x => x.id === which).make() }, W, H);
  const seg = Engine.segment(img);
  return seg.nodes.filter(n => n.box.x1 > R[0] && n.box.x0 < R[2] && n.box.y1 > R[1] && n.box.y0 < R[3]).map(n => `${n.id} ${n.kind}${n.peeled ? '(peeled)' : ''}${n.cell ? '(cell)' : ''}${n.virtual ? '(virtual)' : ''} [${[n.box.x0, n.box.y0, n.box.x1, n.box.y1].map(Math.round)}] parent=${n.parent && n.parent.id} depth=${n.depth}${n.lines ? ' lines=' + n.lines : ''}${n.fill ? ' fill=' + n.fill.map(Math.round) : ''}`);
}, [dId, which, R, +sx, +sy]);
console.log(out.join('\n'));
await browser.close();
