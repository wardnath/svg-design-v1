// node test/tscale.mjs <design> <build> [sx] [sy] → distribution of single-line text height/width ratios after the page scale
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const [,, dId, bId, sx = '1', sy = '1'] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('file:///home/claude/redline-v2_4/test/harness.html');
const out = await page.evaluate(async ([dId, bId, sx, sy]) => {
  const d = Presets.DESIGNS.find(x => x.id === dId), b = Presets.BUILDS.find(x => x.id === bId);
  const W = Math.round(d.w * sx), H = Math.round(d.h * sy);
  const di = await Engine.rasterize({ type: 'svg', text: d.render({ W, H }) }, W, H);
  const bi = await Engine.rasterize({ type: 'html', text: b.make() }, W, H);
  const r = Engine.run('viterbi-flow', Engine.segment(di), Engine.segment(bi), di, bi, {});
  const ts = r.P.ts || { h: 0, w: 0, m: 0 };
  const rows = [];
  for (const f of r.findings) {
    if (!f.dNodes || f.dNodes.length !== 1 || f.mNodes.length !== 1) continue;
    const a = f.dNodes[0], m = f.mNodes[0];
    if (a.kind !== 'text' || m.kind !== 'text' || a.lines !== 1 || m.lines !== 1) continue;
    const hd = a.box.y1 - a.box.y0, hm = m.box.y1 - m.box.y0, wd = a.box.x1 - a.box.x0, wm = m.box.x1 - m.box.x0;
    rows.push([+(Math.log(hm / hd) - ts.h).toFixed(3), +(Math.log(wm / wd) - ts.w).toFixed(3), hd, wd, Math.round(a.box.x0), Math.round(a.box.y0)]);
  }
  rows.sort((p, q) => Math.abs(q[0]) - Math.abs(p[0]));
  return { ts, n: rows.length, top: rows.slice(0, 12), wtop: rows.slice().sort((p, q) => Math.abs(q[1]) - Math.abs(p[1])).slice(0, 8) };
}, [dId, bId, +sx, +sy]);
console.log(JSON.stringify(out.ts), 'n', out.n);
console.log('largest height deviations [dh, dw, hd, wd, x, y]:'); for (const r of out.top) console.log(' ', JSON.stringify(r));
console.log('largest width deviations:'); for (const r of out.wtop) console.log(' ', JSON.stringify(r));
await browser.close();
