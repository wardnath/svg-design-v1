// node test/chains.mjs <design> '<build options json>' [sx] [sy] → flow chains per level (debug)
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const [,, dId, opts, sx = '1', sy = '1'] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('console', m => { if (m.text().startsWith('DBG')) console.log(m.text()); });
await page.goto('file:///home/claude/redline-v2_4/test/harness.html');
await page.evaluate(async ([dId, opts, sx, sy, UNIT]) => {
  const d = Presets.DESIGNS.find(x => x.id === dId);
  const W = Math.round(d.w * sx), H = Math.round(d.h * sy);
  const di = await Engine.rasterize({ type: 'svg', text: d.render({ W, H }) }, W, H);
  const bi = await Engine.rasterize({ type: 'html', text: Presets.MAKERS[dId](JSON.parse(opts)) }, W, H);
  const ds = Engine.segment(di), bs = Engine.segment(bi);
  globalThis.DBG_CHAINS = 1;
  Engine.run('viterbi-flow', ds, bs, di, bi, {});
}, [dId, opts, +sx, +sy, process.env.UNIT || '']);
await browser.close();
