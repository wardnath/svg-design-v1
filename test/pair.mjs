// node test/pair.mjs <design> <build> <sx> <sy> [algo] [all]  → findings via the engine
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const [,, dId, bId, sx = '1', sy = '1', algo = 'viterbi-flow', all = ''] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', e => console.log('[pageerror]', e.message));
page.on('console', m => { if (m.type() === 'error' || m.text().startsWith('DBG')) console.log('[console]', m.text()); });
await page.goto('file:///home/claude/redline-v2_4/test/harness.html');
const out = await page.evaluate(async ([dId, bId, sx, sy, algo, all]) => {
  const d = Presets.DESIGNS.find(x => x.id === dId), b = Presets.BUILDS.find(x => x.id === bId);
  const W = Math.round(d.w * sx), H = Math.round(d.h * sy);
  const di = await Engine.rasterize({ type: 'svg', text: d.render({ W, H }) }, W, H);
  const html = b.make();
  const bi = await Engine.rasterize({ type: 'html', text: html }, W, H);
  const t0 = performance.now();
  const ds = Engine.segment(di), bs = Engine.segment(bi);
  const t1 = performance.now();
  const gt = await Engine.groundTruth(html, W, H);
  const r = Engine.run(algo, ds, bs, di, bi, {});
  const ev = Engine.evaluate(r.findings, gt);
  const f = x => x ? [x.x0, x.y0, x.x1, x.y1].map(Math.round).join(',') : '-';
  const L = r.findings.filter(x => all || x.level !== 'ok').sort((a, b) => b.sev - a.sev).map(x =>
    `${x.level.padEnd(5)} ${x.sev.toFixed(2).padStart(5)} ${x.type.padEnd(12)} ${(x.title || '').slice(0, 34).padEnd(34)} ${(x.name || '').slice(0, 22).padEnd(22)} d[${f(x.dBox)}] m[${f(x.mBox)}] ${x.decomp ? `rx=${x.decomp.residual.dx.toFixed(0)}[${x.decomp.refX.slice(0, 30)}] ry=${x.decomp.residual.dy.toFixed(0)}[${x.decomp.refY.slice(0, 30)}]` : ''}${x.gtHit ? ' GT' : ''}`);
  return { W, H, nodes: [ds.stats.nodes, bs.stats.nodes], segMs: Math.round(t1 - t0), runMs: Math.round(r.ms), score: r.score.toFixed(1), counts: r.counts, ev: `${ev.found}/${ev.gt} fp${ev.fp}`, gt: gt.map(g => g.label), missed: ev.labels.filter(l => !ev.hitLabels.has(l)), L };
}, [dId, bId, +sx, +sy, algo, all]);
console.log(`${dId} vs ${bId} @${out.W}x${out.H} nodes ${out.nodes} seg ${out.segMs}ms run ${out.runMs}ms score ${out.score} ${JSON.stringify(out.counts)} eval ${out.ev}`);
if (out.gt.length) console.log('GT:', out.gt.join(' | ')); if (out.missed && out.missed.length) console.log('MISSED:', out.missed.join(' | '));
console.log(out.L.join('\n'));
await browser.close();
