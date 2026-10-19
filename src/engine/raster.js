import { B } from './geom.js';

/* ---------------- rasterization ---------------- */
async function loadImage(url) {
  const img = new Image();
  img.src = url;
  try { await img.decode(); } catch (e) {
    throw new Error('The browser could not decode this input as an image (' + (e && e.message || 'decode failed') + ').');
  }
  return img;
}
function toImageData(img, W, H, mode) {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  if (mode === 'fitWidth') {
    const s = W / img.naturalWidth;
    ctx.drawImage(img, 0, 0, W, img.naturalHeight * s);
  } else ctx.drawImage(img, 0, 0, W, H);
  try { return ctx.getImageData(0, 0, W, H); } catch (e) {
    throw new Error('This browser refuses to read back the rendered HTML (tainted canvas). Use Chrome, or upload a PNG screenshot instead.');
  }
}
function svgSize(svgText) {
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
  if (doc.getElementsByTagName('parsererror').length) throw new Error('The SVG is not well-formed XML.');
  const svg = doc.documentElement;
  let w = parseFloat(svg.getAttribute('width')), h = parseFloat(svg.getAttribute('height'));
  const vb = (svg.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
  if ((!w || !h) && vb.length === 4) { w = w || vb[2]; h = h || vb[3]; }
  return { w: Math.round(w || 800), h: Math.round(h || 600) };
}
function ensureSvgSize(svgText, W, H) {
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
  const svg = doc.documentElement;
  if (!svg.getAttribute('width')) svg.setAttribute('width', W);
  if (!svg.getAttribute('height')) svg.setAttribute('height', H);
  return new XMLSerializer().serializeToString(doc);
}
const svgUrl = s => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);

function htmlToXhtml(html, mutate) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script, link[rel="stylesheet"], iframe, object, embed').forEach(n => n.remove());
  if (mutate) mutate(doc);
  return new XMLSerializer().serializeToString(doc.documentElement);
}
function foreignObjectSvg(xhtml, W, H) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    `<foreignObject x="0" y="0" width="${W}" height="${H}">${xhtml}</foreignObject></svg>`;
}
async function rasterize(src, W, H) {
  if (src.type === 'svg') {
    const img = await loadImage(svgUrl(ensureSvgSize(src.text, W, H)));
    return toImageData(img, W, H);
  }
  if (src.type === 'html') {
    const img = await loadImage(svgUrl(foreignObjectSvg(htmlToXhtml(src.text), W, H)));
    return toImageData(img, W, H);
  }
  if (src.type === 'image') {
    const img = await loadImage(src.url);
    return toImageData(img, W, H, 'fitWidth');
  }
  throw new Error('Unknown source type ' + src.type);
}
function nativeSize(src) {
  return new Promise((resolve, reject) => {
    if (src.type === 'svg') return resolve(svgSize(src.text));
    if (src.type === 'image') {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => reject(new Error('Image did not load.'));
      img.src = src.url;
      return;
    }
    resolve(null);
  });
}

/* Ground truth for the benchmark. The eval harness (never the algorithms)
   re-renders the implementation with every [data-bug] element painted a
   unique solid color and everything else visibility:hidden — same layout,
   so the marker pixels give exact boxes. */
async function groundTruth(html, W, H) {
  const labels = [];
  const xhtml = htmlToXhtml(html, doc => {
    const st = doc.createElement('style');
    st.textContent = 'html, html *{visibility:hidden!important;}';
    (doc.head || doc.documentElement).appendChild(st);
    doc.querySelectorAll('[data-bug]').forEach((el, k) => {
      labels.push(el.getAttribute('data-bug'));
      const col = `rgb(${(k * 53 + 31) % 200 + 40},${255 - k},${(k * 97 + 11) % 200 + 40})`;
      el.style.setProperty('visibility', 'visible', 'important');
      el.style.setProperty('background', col, 'important');
      el.style.setProperty('border-color', 'transparent', 'important');
      el.style.setProperty('box-shadow', 'none', 'important');
      el.style.setProperty('outline', 'none', 'important');
      el.style.setProperty('color', 'transparent', 'important');
      el.setAttribute('data-bugk', k);
    });
  });
  if (!labels.length) return [];
  const img = await loadImage(svgUrl(foreignObjectSvg(xhtml, W, H)));
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.drawImage(img, 0, 0, W, H);
  const d = ctx.getImageData(0, 0, W, H).data;
  const boxes = labels.map(() => null);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    const k = 255 - d[i + 1];
    if (k < 0 || k >= labels.length || d[i] === 0) continue;
    const er = (k * 53 + 31) % 200 + 40, eb = (k * 97 + 11) % 200 + 40;
    if (Math.abs(d[i] - er) > 2 || Math.abs(d[i + 2] - eb) > 2) continue;
    const b = boxes[k];
    if (!b) boxes[k] = B(x, y, x + 1, y + 1);
    else { if (x < b.x0) b.x0 = x; if (y < b.y0) b.y0 = y; if (x + 1 > b.x1) b.x1 = x + 1; if (y + 1 > b.y1) b.y1 = y + 1; }
  }
  return labels.map((label, k) => boxes[k] && { label, box: boxes[k], space: 'impl' }).filter(Boolean);
}

export { loadImage, toImageData, svgSize, ensureSvgSize, svgUrl, htmlToXhtml, foreignObjectSvg, rasterize, nativeSize, groundTruth };
