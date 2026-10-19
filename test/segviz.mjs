// node test/segviz.mjs <design> <build> <sx> <sy> <x0> <y0> <x1> <y1> [scale] → out/segviz.png (design | build)
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const [,, dId, bId, sx, sy, x0, y0, x1, y1, sc = '2'] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', e => console.log('[pageerror]', e.message));
await page.goto('file:///home/claude/redline-v2_4/test/harness.html');
const url = await page.evaluate(async ([dId, bId, sx, sy, R, sc]) => {
  const d = Presets.DESIGNS.find(x => x.id === dId), b = Presets.BUILDS.find(x => x.id === bId);
  const W = Math.round(d.w * sx), H = Math.round(d.h * sy);
  const imgs = [await Engine.rasterize({ type: 'svg', text: d.render({ W, H }) }, W, H), await Engine.rasterize({ type: 'html', text: b.make() }, W, H)];
  const cw = (R[2] - R[0]) * sc, ch = (R[3] - R[1]) * sc;
  const out = document.createElement('canvas'); out.width = cw * 2 + 20; out.height = ch;
  const o = out.getContext('2d'); o.fillStyle = '#fff'; o.fillRect(0, 0, out.width, out.height);
  const COL = { container: '#2a78d6', text: '#eb6834', shape: '#1baf7a', icon: '#eda100', image: '#e87ba4', rule: '#00b300' };
  imgs.forEach((img, k) => {
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').putImageData(img, 0, 0);
    const ox = k * (cw + 20);
    o.imageSmoothingEnabled = false;
    o.globalAlpha = 0.55; o.drawImage(c, R[0], R[1], R[2] - R[0], R[3] - R[1], ox, 0, cw, ch); o.globalAlpha = 1;
    const seg = Engine.segment(img);
    o.save(); o.beginPath(); o.rect(ox, 0, cw, ch); o.clip();
    const walk = n => { for (const q of n.children) { const bb = q.box; o.strokeStyle = COL[q.kind] || '#000'; o.lineWidth = q.kind === 'container' ? 2 : 1.25; o.strokeRect(ox + (bb.x0 - R[0]) * sc + 0.5, (bb.y0 - R[1]) * sc + 0.5, (bb.x1 - bb.x0) * sc - 1, (bb.y1 - bb.y0) * sc - 1); walk(q); } };
    walk(seg.root);
    o.restore();
  });
  return out.toDataURL();
}, [dId, bId, +sx, +sy, [+x0, +y0, +x1, +y1], +sc]);
fs.writeFileSync(process.env.OUT || 'out/segviz.png', Buffer.from(url.split(',')[1], 'base64'));
await browser.close();
