import fs from 'fs';
const r = p => fs.readFileSync(new URL(p, import.meta.url), 'utf8');
const safe = js => js.replace(/<\/script/gi, '<\\/script');
let out = r('./src/shell.html')
  .replace('/*__CSS__*/', () => r('./src/app.css'))
  .replace('/*__ENGINE__*/', () => safe(r('./src/engine.js')))
  .replace('/*__PRESETS__*/', () => safe(r('./src/presets.js')))
  .replace('/*__APP__*/', () => safe(r('./src/app.js')));
fs.mkdirSync(new URL('./dist/', import.meta.url), { recursive: true });
fs.writeFileSync(new URL('./dist/redline.html', import.meta.url), out);
// local preview wrapper with the publish-time skeleton
fs.writeFileSync(new URL('./dist/preview.html', import.meta.url), `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><style>:root{color-scheme:light;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui;background:#fafaf9}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${out}</body></html>`);
console.log('built', (out.length / 1024).toFixed(1) + ' KB');
