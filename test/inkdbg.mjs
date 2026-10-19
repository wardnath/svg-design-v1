// node test/inkdbg.mjs <design> <design|buildId> x0 y0 x1 y1 [sx] [sy] → raw edge components (ink candidates) in a region
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const [,, dId, which, x0, y0, x1, y1, sx = '1', sy = '1'] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('console', m => { if (m.text().startsWith('DBG')) console.log(m.text()); });
await page.goto('file:///home/claude/redline-v2_4/test/harness.html');
await page.evaluate(async ([dId, which, R, sx, sy]) => {
  const d = Presets.DESIGNS.find(x => x.id === dId);
  const W = Math.round(d.w * sx), H = Math.round(d.h * sy);
  const img = which === 'design' ? await Engine.rasterize({ type: 'svg', text: d.render({ W, H }) }, W, H)
    : await Engine.rasterize({ type: 'html', text: Presets.BUILDS.find(x => x.id === which).make() }, W, H);
  Engine.segment(img, { debugInk: R });
}, [dId, which, [+x0, +y0, +x1, +y1], +sx, +sy]);
await browser.close();
