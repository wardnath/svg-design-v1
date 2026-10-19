// Render designs/builds through the engine's own rasterizer (the exact pixels the
// algorithms see) and save PNGs.  node test/render.mjs <designId> <buildId|-> <sx> <sy> [tag]
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const [,, dId, bId = '-', sx = '1', sy = '1', tag = ''] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('console', m => { if (m.type() === 'error') console.log('[console]', m.text()); });
page.on('pageerror', e => console.log('[pageerror]', e.message));
await page.goto('file:///home/claude/redline-v2_4/test/harness.html');
const r = await page.evaluate(async ([dId, bId, sx, sy]) => {
  const d = Presets.DESIGNS.find(x => x.id === dId);
  const W = Math.round(d.w * sx), H = Math.round(d.h * sy);
  const toUrl = img => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').putImageData(img, 0, 0); return c.toDataURL('image/png'); };
  const t0 = performance.now();
  const svg = d.render({ W, H });
  const t1 = performance.now();
  const di = await Engine.rasterize({ type: 'svg', text: svg }, W, H);
  const t2 = performance.now();
  const out = { W, H, svgKB: Math.round(svg.length / 1024), genMs: Math.round(t1 - t0), rasterMs: Math.round(t2 - t1), d: toUrl(di) };
  if (bId !== '-') {
    const b = Presets.BUILDS.find(x => x.id === bId);
    const html = b.make();
    const t3 = performance.now();
    const bi = await Engine.rasterize({ type: 'html', text: html }, W, H);
    out.buildRasterMs = Math.round(performance.now() - t3);
    out.htmlKB = Math.round(html.length / 1024);
    out.b = toUrl(bi);
  }
  return out;
}, [dId, bId, +sx, +sy]);
const save = (u, f) => fs.writeFileSync(f, Buffer.from(u.split(',')[1], 'base64'));
const t = tag || `${dId}-${sx}x${sy}`;
save(r.d, `out/${t}-design.png`);
if (r.b) save(r.b, `out/${t}-build.png`);
delete r.d; delete r.b;
console.log(JSON.stringify(r));
await browser.close();
