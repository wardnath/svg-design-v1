import fs from 'fs';
import { bundle } from '../scripts/esb.mjs';
const js = await bundle('test/harness-entry.js');
fs.writeFileSync('test/harness.js', js);
fs.writeFileSync('test/harness.html', '<!doctype html><html><head><meta charset="utf-8"></head><body><script src="harness.js"></script></body></html>');
console.log('harness', (js.length / 1024).toFixed(0), 'KB');
