import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const [,, dId, sx = '1.25', sy = '1.25'] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', e => console.log('[pageerror]', e.message));
await page.goto('file:///home/claude/redline-v2_4/test/harness.html');
const out = await page.evaluate(async ([dId, sx, sy]) => {
  const d = Presets.DESIGNS.find(x => x.id === dId);
  const W = Math.round(d.w * sx), H = Math.round(d.h * sy);
  const seg = async (src, w, h) => Engine.segment(await Engine.rasterize(src, w, h));
  const d0 = await seg({ type: 'svg', text: d.render({ W: d.w, H: d.h }) }, d.w, d.h), d1 = await seg({ type: 'svg', text: d.render({ W, H }) }, W, H);
  const res = { design: Engine.frozenShare(d0, d1).toFixed(2) };
  for (const b of Presets.BUILDS.filter(b => b.design === dId)) {
    const b0 = await seg({ type: 'html', text: b.make() }, d.w, d.h), b1 = await seg({ type: 'html', text: b.make() }, W, H);
    res[b.id] = Engine.frozenShare(b0, b1).toFixed(2);
  }
  return res;
}, [dId, +sx, +sy]);
console.log(JSON.stringify(out));
await browser.close();
