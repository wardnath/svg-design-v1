// node test/stretch.mjs <design> <build> <sx> <sy> → out/inferred-*.png, findings vs build
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const [,, dId, bId, sx = '1.25', sy = '1.25', show = '12'] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', e => console.log('[pageerror]', e.message, e.stack));
page.on('console', m => { if (m.type() === 'error') console.log('[console]', m.text()); });
await page.goto('file:///home/claude/redline-v2_4/test/harness.html');
const out = await page.evaluate(async ([dId, bId, sx, sy, show]) => {
  const d = Presets.DESIGNS.find(x => x.id === dId), b = Presets.BUILDS.find(x => x.id === bId);
  const W = Math.round(d.w * sx), H = Math.round(d.h * sy);
  const toUrl = img => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').putImageData(img, 0, 0); return c.toDataURL(); };
  const d0 = await Engine.rasterize({ type: 'svg', text: d.render({ W: d.w, H: d.h }) }, d.w, d.h);
  const s0 = Engine.segment(d0);
  const t0 = performance.now();
  const st = Engine.inferStretch(s0, W, H);
  const di = Engine.synthesize(s0, d0, st.boxes, W, H);
  const tInf = performance.now() - t0;
  const auto = await Engine.rasterize({ type: 'svg', text: d.render({ W, H }) }, W, H);
  const bi = await Engine.rasterize({ type: 'html', text: b.make() }, W, H);
  const ds = Engine.segment(di), bs = Engine.segment(bi), as = Engine.segment(auto);
  const r = Engine.run('viterbi-flow', ds, bs, di, bi, {});
  const ra = Engine.run('viterbi-flow', as, bs, auto, bi, {});
  const ri = Engine.run('viterbi-flow', as, ds, auto, di, {});   // inference vs designer's own resize
  const f = x => x ? [x.x0, x.y0, x.x1, x.y1].map(Math.round).join(',') : '-';
  const L = r.flagged.sort((p, q) => q.sev - p.sev).slice(0, show).map(x => `${x.level.padEnd(5)} ${x.sev.toFixed(1).padStart(5)} ${x.type.padEnd(10)} ${x.title.slice(0, 32).padEnd(32)} ${x.name.slice(0, 20).padEnd(20)} d[${f(x.dBox)}] m[${f(x.mBox)}]`);
  return { W, H, tInf: Math.round(tInf), inferred: { score: r.score.toFixed(1), flagged: r.flagged.length }, auto: { score: ra.score.toFixed(1), flagged: ra.flagged.length }, inferVsAuto: { score: ri.score.toFixed(1), flagged: ri.flagged.length }, L, img: toUrl(di), autoImg: toUrl(auto) };
}, [dId, bId, +sx, +sy, +show]);
fs.writeFileSync(`out/inferred-${dId}.png`, Buffer.from(out.img.split(',')[1], 'base64'));
fs.writeFileSync(`out/auto-${dId}.png`, Buffer.from(out.autoImg.split(',')[1], 'base64'));
console.log(`${dId} → ${out.W}x${out.H} inference ${out.tInf}ms | build vs inferred: ${JSON.stringify(out.inferred)} | build vs auto-layout: ${JSON.stringify(out.auto)} | inferred vs auto: ${JSON.stringify(out.inferVsAuto)}`);
console.log(out.L.join('\n'));
await browser.close();
