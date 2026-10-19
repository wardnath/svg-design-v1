/* Bakes src/bench-snapshot.json: runs the shared benchmark computation (src/bench.js) over
   every built-in build in headless Chromium.   node scripts/bench.mjs [designId ...] */
import fs from 'fs';
import { bundle } from './esb.mjs';
const PW = process.env.PLAYWRIGHT || '/opt/npm-tools/node_modules/playwright/index.mjs';
const { chromium } = await import(PW);
const only = process.argv.slice(2);
const js = await bundle('scripts/bench-entry.js');
fs.mkdirSync('out', { recursive: true });
fs.writeFileSync('out/bench.js', js);
fs.writeFileSync('out/bench.html', '<!doctype html><html><head><meta charset="utf-8"></head><body><script src="bench.js"></script></body></html>');
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('console', m => { const t = m.text(); if (t.startsWith('BENCH')) console.log(t.slice(6)); else if (m.type() === 'error') console.log('[error]', t); });
page.on('pageerror', e => console.log('[pageerror]', e.message));
await page.goto('file://' + process.cwd() + '/out/bench.html');
const t0 = Date.now();
const out = await page.evaluate(only => window.runBench(only.length ? only : null), only);
await browser.close();
let snap = out;
if (only.length && fs.existsSync('src/bench-snapshot.json')) {
  // merge into the existing snapshot, replacing rows for the designs that were rerun
  const old = JSON.parse(fs.readFileSync('src/bench-snapshot.json', 'utf8'));
  const keep = r => !only.includes(r.design);
  snap = { ...out, algos: (old.algos || []).filter(keep).concat(out.algos), stretch: (old.stretch || []).filter(keep).concat(out.stretch) };
}
fs.writeFileSync('src/bench-snapshot.json', JSON.stringify(snap));
const sum = snap.algos.reduce((s, r) => { const c = r.cells['viterbi-flow']; return { found: s.found + c.found, gt: s.gt + c.gt, fp: s.fp + c.fp }; }, { found: 0, gt: 0, fp: 0 });
console.log(`wrote src/bench-snapshot.json: ${snap.algos.length} builds, viterbi-flow ${sum.found}/${sum.gt} found, ${sum.fp} FA, ${((Date.now() - t0) / 1000).toFixed(0)}s`);
