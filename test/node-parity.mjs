// Parity check: the split v2 engine must reproduce v1's result on v1's saved renders.
import * as esbuild from 'esbuild';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const sharp = require('/opt/npm-tools/node_modules/sharp');
const out = await esbuild.build({ entryPoints: ['src/engine/index.js'], bundle: true, format: 'cjs', platform: 'node', write: false, logLevel: 'warning' });
const mod = { exports: {} };
new Function('module', 'exports', 'require', out.outputFiles[0].text)(mod, mod.exports, require);
const E = mod.exports;
const load = async f => { const { data, info } = await sharp(f).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); return { width: info.width, height: info.height, data: new Uint8ClampedArray(data) }; };
const [d, b] = await Promise.all([load('/home/claude/redline/out/pricing.png'), load('/home/claude/redline/out/pricing-c.png')]);
const sd = E.segment(d), sb = E.segment(b);
for (const a of E.ALGOS) {
  const r = E.run(a.id, sd, sb, d, b);
  console.log(a.id.padEnd(13), 'flagged', String(r.flagged.length).padStart(3), 'score', r.score.toFixed(1), a.id === 'viterbi-flow' ? r.flagged.map(f => f.title).join(' | ') : '');
}
