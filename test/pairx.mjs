// node test/pairx.mjs <design> '<build options json>' sx sy [module] → runs a build made on the fly with options
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const [,, dId, opts, sx = '1', sy = '1'] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', e => console.log('[pageerror]', e.message));
await page.goto('file:///home/claude/redline-v2_4/test/harness.html');
const out = await page.evaluate(async ([dId, opts, sx, sy]) => {
  const d = Presets.DESIGNS.find(x => x.id === dId);
  const W = Math.round(d.w * sx), H = Math.round(d.h * sy);
  const di = await Engine.rasterize({ type: 'svg', text: d.render({ W, H }) }, W, H);
  const html = Presets.MAKERS[dId](JSON.parse(opts));
  const bi = await Engine.rasterize({ type: 'html', text: html }, W, H);
  const ds = Engine.segment(di), bs = Engine.segment(bi);
  const gt = await Engine.groundTruth(html, W, H);
  const r = Engine.run('viterbi-flow', ds, bs, di, bi, {});
  const ev = Engine.evaluate(r.findings, gt);
  const f = x => x ? [x.x0, x.y0, x.x1, x.y1].map(Math.round).join(',') : '-';
  const L = r.findings.filter(x => x.level !== 'ok').sort((a, b) => b.sev - a.sev).map(x =>
    `${x.level.padEnd(5)} ${x.sev.toFixed(2).padStart(5)} ${x.type.padEnd(12)} ${(x.title || '').slice(0, 34).padEnd(34)} ${(x.name || '').slice(0, 22).padEnd(22)} d[${f(x.dBox)}] m[${f(x.mBox)}] ${x.decomp ? `rx=${x.decomp.residual.dx.toFixed(0)}[${x.decomp.refX.slice(0, 30)}] ry=${x.decomp.residual.dy.toFixed(0)}[${x.decomp.refY.slice(0, 30)}]` : ''}${x.gtHit ? ' GT' : ''}`);
  return { W, H, score: r.score.toFixed(1), counts: r.counts, ev: `${ev.found}/${ev.gt} fp${ev.fp}`, L };
}, [dId, opts, +sx, +sy]);
console.log(`${dId} ${opts} @${out.W}x${out.H} score ${out.score} ${JSON.stringify(out.counts)} eval ${out.ev}`);
console.log(out.L.join('\n'));
await browser.close();
