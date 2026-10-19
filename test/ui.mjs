// Load the bundled page headlessly, wait for results, report errors, screenshot.
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const [,, out = 'ui', width = '1440', scheme = 'light', hash = '', waitMs = '6000'] = process.argv;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: +width, height: 1000 }, colorScheme: scheme });
const page = await ctx.newPage();
const errs = [];
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text().slice(0, 300)); });
page.on('pageerror', e => errs.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
await page.goto('file:///home/claude/redline-v2_4/dist/preview.html' + (hash ? '#' + hash : ''));
await page.waitForFunction(() => document.querySelectorAll('.insp .score, .insp .empty b').length > 0 || document.querySelector('.err'), null, { timeout: 60000 }).catch(() => errs.push('timeout waiting for results'));
await page.waitForTimeout(+waitMs);
await page.screenshot({ path: `out/${out}.png`, fullPage: true });
const info = await page.evaluate(() => ({ docW: document.documentElement.scrollWidth, winW: innerWidth, h: document.documentElement.scrollHeight, findings: document.querySelectorAll('.fitem').length, tcards: [...document.querySelectorAll('.tcard .nums')].map(n => n.textContent.slice(0, 60)) }));
console.log(JSON.stringify(info));
console.log(errs.length ? errs.join('\n') : 'no console errors');
await browser.close();
