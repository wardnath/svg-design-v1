// Bundles the multi-file JSX app into one self-contained HTML page.
//   dist/redline-v2_4.html  — artifact form (no doctype/html/body; React from cdnjs)
//   dist/preview.html     — full document with React inlined, for local and headless runs
import fs from 'fs';
import path from 'path';
import { bundle } from './esb.mjs';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const r = p => fs.readFileSync(path.join(root, p), 'utf8');
const safe = s => s.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');
const t0 = Date.now();
const app = await bundle(path.join(root, 'src/main.jsx'), { minify: process.argv.includes('--min') });
const css = r('src/styles/app.css');
const shell = r('src/index.html').replace('/*__CSS__*/', () => css);
const cdn = '<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>\n<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>';
const local = `<script>${safe(r('node_modules/react/umd/react.production.min.js'))}</script>\n<script>${safe(r('node_modules/react-dom/umd/react-dom.production.min.js'))}</script>`;
const page = (react) => shell.replace('<!--__REACT__-->', () => react).replace('/*__APP__*/', () => safe(app));
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/redline-v2_4.html'), page(cdn));
fs.writeFileSync(path.join(root, 'dist/preview.html'), `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><style>:root{color-scheme:light;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui;background:#fafaf9}img{max-width:100%}[hidden]{display:none!important}</style></head><body>\n${page(local)}\n</body></html>\n`);
console.log(`built in ${Date.now() - t0} ms: app ${(app.length / 1024).toFixed(0)} KB, artifact ${(fs.statSync(path.join(root, 'dist/redline-v2_4.html')).size / 1024).toFixed(0)} KB`);
