// node test/tree.mjs <design> <build|-> <sx> <sy> x0 y0 x1 y1  → segmentation nodes inside a region
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const [,, dId, bId, sx, sy, ...rect] = process.argv;
const R = rect.map(Number);
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', e => console.log('[pageerror]', e.message));
await page.goto('file:///home/claude/redline-v2_4/test/harness.html');
const out = await page.evaluate(async ([dId, bId, sx, sy, R]) => {
  const d = Presets.DESIGNS.find(x => x.id === dId);
  const W = Math.round(d.w * sx), H = Math.round(d.h * sy);
  const dump = seg => {
    const lines = [];
    const walk = (n, dep) => {
      for (const c of n.children) {
        const b = c.box;
        const inside = b.x1 > R[0] && b.x0 < R[2] && b.y1 > R[1] && b.y0 < R[3];
        if (inside) lines.push('  '.repeat(dep) + `${c.kind} [${[b.x0, b.y0, b.x1, b.y1].map(Math.round)}]${c.lines ? ' L' + c.lines + ' p' + c.parts : ''}${c.solidity ? ' sol' + c.solidity.toFixed(2) : ''}${c.color ? ' ' + Engine.color.hex(c.color) : ''}`);
        walk(c, dep + 1);
      }
    };
    walk(seg.root, 0);
    return lines.join('\n');
  };
  const di = await Engine.rasterize({ type: 'svg', text: d.render({ W, H }) }, W, H);
  let s = '== design\n' + dump(Engine.segment(di));
  if (bId !== '-') {
    const b = Presets.BUILDS.find(x => x.id === bId);
    const bi = await Engine.rasterize({ type: 'html', text: b.make() }, W, H);
    s += '\n== build\n' + dump(Engine.segment(bi));
  }
  return s;
}, [dId, bId, +sx, +sy, R]);
console.log(out);
await browser.close();
