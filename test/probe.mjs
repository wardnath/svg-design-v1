// node test/probe.mjs <galleryId> x0,y0,x1,y1 → every finding (ok included) whose build or design
// box overlaps the region, with its score parts, plus the page-wide text scale.
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const [,, id, region = '0,0,99999,99999'] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', e => console.log('[pageerror]', e.message));
page.on('console', m => { if (m.type() === 'error' || m.text().startsWith('DBG')) console.log('[console]', m.text()); });
await page.goto('file:///home/claude/redline-v2_4/test/harness.html');
const out = await page.evaluate(async ([id, region, DEPTH]) => {
  const [x0, y0, x1, y1] = region.split(',').map(Number);
  const g = Presets.GALLERY.find(x => x.id === id);
  const d = { ...Presets.DESIGNS.find(x => x.id === g.design), builtin: true }, b = Presets.BUILDS.find(x => x.id === g.build);
  const vp = Pipeline.viewportsFor(d).find(v => v.id === (g.vp || 'native'));
  const r = await Pipeline.compare({ d, b, W: vp.w, H: vp.h, model: g.model || 'auto', algo: g.algo, P: Engine.DEFAULTS });
  const hit = bx => bx && bx.x1 > x0 && bx.x0 < x1 && bx.y1 > y0 && bx.y0 < y1;
  const f = x => x ? [x.x0, x.y0, x.x1, x.y1].map(Math.round).join(',') : '-';
  const L = r.r.findings.filter(x => (hit(x.mBox) || hit(x.dBox) || hit(x.eBox)) && (!DEPTH || x.depth <= +DEPTH)).map(x => {
    const p = x.parts ? Object.entries(x.parts).map(([k, v]) => `${k[0]}${v.toFixed(2)}`).join(' ') : '';
    const sz = x.size ? `dw=${(x.size.dw || 0).toFixed(1)} dh=${(x.size.dh || 0).toFixed(1)} "${x.size.note || ''}" ${x.size.explained || ''}` : '';
    const lines = x.dNodes ? `lines ${x.dNodes.map(n => n.lines || '-').join('+')}→${(x.mNodes || []).map(n => n.lines || '-').join('+')}` : '';
    return `${x.depth} ${x.level.padEnd(5)} ${x.type.padEnd(12)} ${(x.title || '').slice(0, 38).padEnd(38)} ${(x.name || '').padEnd(18)} d[${f(x.dBox)}] m[${f(x.mBox)}] ${p} ${sz} ${lines} ${x.decomp ? `rx=${x.decomp.residual.dx.toFixed(0)}[${x.decomp.refX}] ry=${x.decomp.residual.dy.toFixed(0)}[${x.decomp.refY}]` : ''}`;
  });
  return { ts: r.r.ts || null, L };
}, [id, region, process.env.DEPTH || '']);
console.log('ts', JSON.stringify(out.ts));
console.log(out.L.join('\n'));
await browser.close();
