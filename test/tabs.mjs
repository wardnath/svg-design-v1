// Open a preset, click a stage tab (and optionally a viewport), screenshot the stage and inspector.
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const [,, out = 'tab', hash = 'soc-clean', tab = 'Inferred', vp = '', width = '1440'] = process.argv;
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: +width, height: 1100 } })).newPage();
const errs = [];
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text().slice(0, 300)); });
page.on('pageerror', e => errs.push('pageerror: ' + e.message));
await page.goto('file:///home/claude/redline-v2_4/dist/preview.html#' + hash);
const settle = async () => {
  await page.waitForTimeout(300);
  await page.waitForFunction(() => !document.querySelector('.stage .busy.on'), null, { timeout: 60000 });
  await page.waitForTimeout(400);
};
await page.waitForFunction(() => document.querySelectorAll('.insp .score, .insp .empty b').length > 0, null, { timeout: 60000 });
if (vp) { await page.click(`.vp button:has-text("${vp}")`); await settle(); }
await page.click(`.vthumb:has-text("${tab}")`); await settle();
const info = await page.evaluate(() => ({
  pressed: [...document.querySelectorAll('.vthumb[aria-pressed="true"]')].map(b => b.textContent),
  caps: [...document.querySelectorAll('.stage .cap')].map(c => c.textContent),
  legend: document.querySelector('.stage .legend').textContent.slice(0, 200),
  boxes: document.querySelectorAll('.stage .fr:first-child svg .hit').length,
  strip: [...document.querySelectorAll('.trans .seg2 button[aria-pressed="true"]')].map(b => b.textContent),
  controls: [...document.querySelectorAll('.controls .field > span:first-child')].map(s => s.textContent),
  score: document.querySelector('.insp .score') && document.querySelector('.insp .score').textContent,
}));
console.log(JSON.stringify(info, null, 1));
const r = await page.locator('main.bench').boundingBox();
await page.screenshot({ path: `out/${out}.png`, clip: { x: r.x, y: r.y, width: r.width, height: Math.min(r.height, 900) } });
console.log(errs.length ? errs.join('\n') : 'no console errors');
await browser.close();
