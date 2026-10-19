// node test/dbg-seg.mjs <design> <build|-> x y [sx] [sy] → DBG lines from segment() around (x, y)
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const [,, dId, bId, x, y, sx = '1', sy = '1'] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('console', m => { if (m.text().startsWith('DBG')) console.log(m.text()); });
page.on('pageerror', e => console.log('[pageerror]', e.message));
await page.goto('file:///home/claude/redline-v2_4/test/harness.html');
await page.evaluate(async ([dId, bId, x, y, sx, sy]) => {
  const d = Presets.DESIGNS.find(q => q.id === dId);
  const W = Math.round(d.w * sx), H = Math.round(d.h * sy);
  const di = await Engine.rasterize({ type: 'svg', text: d.render({ W, H }) }, W, H);
  console.log('DBG --- design'); Engine.segment(di, { debugAt: [x, y] });
  if (bId !== '-') { const b = Presets.BUILDS.find(q => q.id === bId); const bi = await Engine.rasterize({ type: 'html', text: b.make() }, W, H); console.log('DBG --- build'); Engine.segment(bi, { debugAt: [x, y] }); }
}, [dId, bId, +x, +y, +sx, +sy]);
await browser.close();
