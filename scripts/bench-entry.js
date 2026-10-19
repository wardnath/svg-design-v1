import * as Presets from '../src/presets/index.js';
import { computeBench } from '../src/bench.js';
import { E } from '../src/pipeline.js';
window.runBench = async (only) => {
  const designs = Presets.DESIGNS.map(d => ({ ...d, builtin: true }));
  const builds = Presets.BUILDS.filter(b => !only || only.includes(b.design)).map(b => ({ ...b, builtin: true }));
  const env = 'Headless Chromium ' + (navigator.userAgent.match(/Chrome\/([\d.]+)/) || [, ''])[1] + ' · Linux';
  return computeBench({ designs, builds, P: { ...E.DEFAULTS }, env, onStatus: t => console.log('BENCH', t) });
};
