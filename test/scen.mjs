// node test/scen.mjs [galleryIds or category:<cat> ...] → each preset through the pipeline at its
// own viewport, algorithm and stretch model: eval against ground truth and the flagged findings.
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const args = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', e => console.log('[pageerror]', e.message));
page.on('console', m => { if (m.type() === 'error' || m.text().startsWith('DBG')) console.log('[console]', m.text()); });
await page.goto('file:///home/claude/redline-v2_4/test/harness.html');
const ids = await page.evaluate(args => {
  const G = Presets.GALLERY;
  if (!args.length) return G.map(g => g.id);
  return args.flatMap(a => a.startsWith('category:') ? G.filter(g => g.cat === a.slice(9)).map(g => g.id) : [a]);
}, args);
for (const id of ids) {
  const out = await page.evaluate(async id => {
    const g = Presets.GALLERY.find(x => x.id === id);
    const d = { ...Presets.DESIGNS.find(x => x.id === g.design), builtin: true }, b = Presets.BUILDS.find(x => x.id === g.build);
    const vp = Pipeline.viewportsFor(d).find(v => v.id === (g.vp || 'native'));
    const model = g.model || 'auto';
    const r = await Pipeline.compare({ d, b, W: vp.w, H: vp.h, model, algo: g.algo, P: Engine.DEFAULTS });
    const fr = await Pipeline.frozen(d, b, vp.w, vp.h, model, Engine.DEFAULTS);
    const vd = Pipeline.verdict({ ...r, r: r.r }, fr, model);
    const f = x => x ? [x.x0, x.y0, x.x1, x.y1].map(Math.round).join(',') : '-';
    const L = r.r.findings.filter(x => x.level !== 'ok').sort((a, b) => b.sev - a.sev).slice(0, 14).map(x =>
      `  ${x.level.padEnd(5)} ${x.sev.toFixed(1).padStart(5)} ${x.type.padEnd(13)} ${(x.title || '').slice(0, 40).padEnd(40)} ${(x.name || '').slice(0, 20).padEnd(20)} m[${f(x.mBox || x.eBox)}] ${x.decomp ? `rx=${x.decomp.residual.dx.toFixed(0)}[${x.decomp.refX.slice(0, 26)}] ry=${x.decomp.residual.dy.toFixed(0)}[${x.decomp.refY.slice(0, 26)}]` : ''}${x.gtHit ? ' GT' : ''}`);
    const ev = r.ev;
    return { id, cat: g.cat, algo: g.algo, vp: vp.id, score: r.r.score.toFixed(1), counts: r.r.counts, verdict: vd && vd.label, index: fr ? fr.index.toFixed(2) : '-',
      ev: ev ? `${ev.found}/${ev.gt} fp ${ev.fp}` : 'no GT', missed: ev ? ev.labels.filter(l => !ev.hitLabels.has(l)) : [], flagged: r.r.findings.filter(x => x.level !== 'ok').length, L };
  }, id);
  const c = out.counts;
  console.log(`${out.id.padEnd(16)} ${out.cat.padEnd(10)} ${out.algo.padEnd(12)} ${out.vp.padEnd(6)} score ${out.score.padStart(5)} maj ${c.major} min ${c.minor} miss ${c.missing} extra ${c.extra} | ${out.verdict} idx ${out.index} | eval ${out.ev}${out.missed.length ? ' MISSED: ' + out.missed.join(' | ') : ''}`);
  if (process.env.V !== '0') console.log(out.L.join('\n'));
}
await browser.close();
