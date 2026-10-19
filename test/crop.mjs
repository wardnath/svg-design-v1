// node test/crop.mjs <design> <build> sx sy x0 y0 x1 y1 [scale] → OUT (design | build), raw pixels
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const [,, dId, bId, sx, sy, x0, y0, x1, y1, sc = '4'] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', e => console.log('[pageerror]', e.message));
await page.goto('file:///home/claude/redline-v2_4/test/harness.html');
const url = await page.evaluate(async ([dId, bId, sx, sy, R, sc]) => {
  const d = Presets.DESIGNS.find(x => x.id === dId), b = Presets.BUILDS.find(x => x.id === bId);
  const W = Math.round(d.w * sx), H = Math.round(d.h * sy);
  const imgs = [await Engine.rasterize({ type: 'svg', text: d.render({ W, H }) }, W, H), await Engine.rasterize({ type: 'html', text: b.make() }, W, H)];
  const cw = (R[2] - R[0]) * sc, ch = (R[3] - R[1]) * sc;
  const out = document.createElement('canvas'); out.width = cw * 2 + 10; out.height = ch;
  const o = out.getContext('2d'); o.fillStyle = '#f0f'; o.fillRect(0, 0, out.width, out.height);
  o.imageSmoothingEnabled = false;
  imgs.forEach((img, k) => {
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').putImageData(img, 0, 0);
    o.drawImage(c, R[0], R[1], R[2] - R[0], R[3] - R[1], k * (cw + 10), 0, cw, ch);
  });
  return out.toDataURL();
}, [dId, bId, +sx, +sy, [+x0, +y0, +x1, +y1], +sc]);
fs.writeFileSync(process.env.OUT || 'out/crop.png', Buffer.from(url.split(',')[1], 'base64'));
await browser.close();
