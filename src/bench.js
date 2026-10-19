/* Benchmark computation shared by the in-page "Run in this browser" button and
   scripts/bench.mjs (which bakes the snapshot shipped with the page): every built-in
   build against its own design, all algorithms at the design size, then the full method
   at every viewport under both stretch models (main builds only). */
import { E, compare, frozen, verdict, viewportsFor } from './pipeline.js';

const tick = () => new Promise(r => setTimeout(r, 0));

export async function computeBench({ designs, builds, P, env, onRow, onStatus, cancelled }) {
  const pairs = builds.filter(b => b.builtin).map(b => ({ b, d: designs.find(d => d.id === b.design) })).filter(p => p.d);
  const out = { generated: new Date().toISOString(), env, algos: [], stretch: [] };
  let i = 0;
  for (const { b, d } of pairs) {
    if (cancelled && cancelled()) return null;
    if (onStatus) onStatus(`Scoring ${++i} of ${pairs.length}: ${b.name}`);
    const row = { build: b.id, design: d.id, cells: {} };
    for (const a of E.ALGOS) {
      const r = await compare({ d, b, W: d.w, H: d.h, model: 'auto', algo: a.id, P });
      row.cells[a.id] = r.ev ? { found: r.ev.found, gt: r.ev.gt, fp: r.ev.fp } : { found: 0, gt: 0, fp: r.r.flagged.length };
      await tick();
    }
    if (b.scenario) row.scenario = true;
    out.algos.push(row);
    // single-issue scenarios are about one kind of inaccuracy at the design size; the stretch
    // table covers the main builds
    if (b.scenario) { if (onRow) onRow({ ...out, partial: true }); continue; }
    const srow = { build: b.id, design: d.id, static: !!b.staticCopy, cells: {} };
    for (const v of viewportsFor(d)) {
      srow.cells[v.id] = {};
      for (const model of d.render ? ['auto', 'inferred'] : ['inferred']) {
        if (v.id === 'native' && model === 'inferred') continue;
        const r = await compare({ d, b, W: v.w, H: v.h, model, algo: 'viterbi-flow', P });
        const fr = await frozen(d, b, v.w, v.h, model, P);
        const vd = verdict(r, fr, model);
        srow.cells[v.id][model] = { score: +r.r.score.toFixed(1), major: r.r.counts.major, verdict: vd.level, index: fr ? +fr.index.toFixed(2) : null,
          found: r.ev ? r.ev.found : 0, gt: r.ev ? r.ev.gt : 0, fp: r.ev ? r.ev.fp : r.r.flagged.length };
        await tick();
      }
    }
    out.stretch.push(srow);
    if (onRow) onRow({ ...out, partial: true });
  }
  return out;
}
