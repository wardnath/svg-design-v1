(() => {
  'use strict';
  const E = window.Engine, PR = window.Presets;
  const { W_, H_, CX, CY, AREA } = E.geom;
  const $ = (s, r = document) => r.querySelector(s);
  const SVGNS = 'http://www.w3.org/2000/svg';
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  function el(tag, attrs, ...kids) {
    const n = document.createElement(tag);
    if (attrs) for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
      else if (k === 'style' && typeof v === 'object') Object.assign(n.style, v);
      else n.setAttribute(k, v === true ? '' : v);
    }
    for (const c of kids.flat(3)) if (c != null && c !== false) n.append(c.nodeType ? c : document.createTextNode(String(c)));
    return n;
  }
  function sv(tag, attrs, ...kids) {
    const n = document.createElementNS(SVGNS, tag);
    if (attrs) for (const [k, v] of Object.entries(attrs)) if (v != null) n.setAttribute(k, v);
    for (const c of kids.flat(3)) if (c) n.append(c.nodeType ? c : document.createTextNode(String(c)));
    return n;
  }
  const fmt = (v, d = 0) => (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(v).toFixed(d);
  const round = v => Math.round(v);
  const boxStr = b => b ? `${round(b.x0)},${round(b.y0)} ${round(W_(b))}×${round(H_(b))}` : '—';
  const idle = () => new Promise(r => setTimeout(r, 0));

  /* Overlays sit on light UI renders in both themes, so their colors are fixed. */
  const OV = { major: '#D03B3B', minor: '#E39400', ok: '#0E9F0E', design: '#0087B8', build: '#C2187A', ink: '#0F1318', sel: '#0F1318' };
  const KIND_COLORS = { container: '#2a78d6', text: '#eb6834', shape: '#1baf7a', icon: '#eda100', image: '#e87ba4', rule: '#008300' };

  /* ---------------- state ---------------- */
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
  };
  const S = {
    designs: PR.designs.map(d => ({ id: d.id, name: d.name, kind: 'svg', src: d.src, w: d.w, h: d.h, builtin: true })),
    impls: PR.impls.map(m => ({ ...m, builtin: true })),
    designId: 'pricing', implId: 'pricing-c', algo: 'viterbi-flow', view: 'diff', presetId: 'pricing-bugs',
    P: { ...E.DEFAULTS }, spot: true, showOk: false, sel: null, swipe: 50,
    res: null, err: null, bench: null, drawer: null,
  };
  const saved = store.get('redline.custom.v1');
  if (saved) {
    for (const d of saved.designs || []) if (!S.designs.some(x => x.id === d.id)) S.designs.push(d);
    for (const m of saved.impls || []) if (!S.impls.some(x => x.id === m.id)) S.impls.push(m);
  }
  function saveCustom() {
    const keep = it => !it.builtin && (it.kind !== 'image' || it.src.length < 1500000);
    store.set('redline.custom.v1', { designs: S.designs.filter(keep), impls: S.impls.filter(keep) });
  }
  const designOf = id => S.designs.find(d => d.id === id);
  const implOf = id => S.impls.find(m => m.id === id);
  const algoOf = id => E.ALGOS.find(a => a.id === id);

  /* ---------------- caches ---------------- */
  const C = { img: new Map(), seg: new Map(), gt: new Map(), canv: new WeakMap(), plates: new Map() };
  const toSrc = it => (it.kind === 'image' ? { type: 'image', url: it.src } : { type: it.kind, text: it.src });
  const segKey = P => `${P.edgeT}|${P.kH}|${P.kV}`;
  async function designSize(d) {
    if (!d.w || !d.h) { const s = await E.nativeSize(toSrc(d)); d.w = s.w; d.h = s.h; }
    return { w: d.w, h: d.h };
  }
  function raster(it, W, H) {
    const k = `${it.id}@${W}x${H}`;
    if (!C.img.has(k)) {
      const p = E.rasterize(toSrc(it), W, H);
      C.img.set(k, p);
      p.catch(() => C.img.delete(k));
    }
    return C.img.get(k);
  }
  async function prepared(it, W, H) {
    const img = await raster(it, W, H);
    const k = `${it.id}@${W}x${H}|${segKey(S.P)}`;
    if (!C.seg.has(k)) C.seg.set(k, E.segment(img, S.P));
    return { img, seg: C.seg.get(k) };
  }
  const lineage = d => d.origin || d.id;
  function groundTruth(m, d) {
    if (m.kind !== 'html' || m.design !== lineage(d)) return Promise.resolve(null);
    const k = `${m.id}@${d.w}x${d.h}`;
    if (!C.gt.has(k)) {
      C.gt.set(k, E.groundTruth(m.src, d.w, d.h).then(g => {
        const all = g.concat((m.missing || []).map(x => ({ label: x.label, box: x.box, space: 'design' })));
        return all.length ? all : null;
      }).catch(() => null));
    }
    return C.gt.get(k);
  }
  function canvasOf(img) {
    if (C.canv.has(img)) return C.canv.get(img);
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    c.getContext('2d').putImageData(img, 0, 0);
    C.canv.set(img, c);
    return c;
  }
  /* Registration plates: design ink prints cyan, build ink prints magenta, both = black. */
  function plates(imgD, imgM, scale = 1) {
    const W = Math.max(1, Math.round(imgD.width * scale)), H = Math.max(1, Math.round(imgD.height * scale));
    const small = img => {
      if (scale === 1) return img.data;
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const x = c.getContext('2d', { willReadFrequently: true });
      x.imageSmoothingQuality = 'high';
      x.drawImage(canvasOf(img), 0, 0, W, H);
      return x.getImageData(0, 0, W, H).data;
    };
    const a = small(imgD), b = small(imgM);
    const out = new ImageData(W, H), o = out.data;
    for (let i = 0; i < a.length; i += 4) {
      const ia = Math.pow(1 - (0.299 * a[i] + 0.587 * a[i + 1] + 0.114 * a[i + 2]) / 255, 0.75);
      const ib = Math.pow(1 - (0.299 * b[i] + 0.587 * b[i + 1] + 0.114 * b[i + 2]) / 255, 0.75);
      o[i] = 255 * (1 - ia); o[i + 1] = 255 * (1 - ib); o[i + 2] = 255 * (1 - Math.min(ia, ib)); o[i + 3] = 255;
    }
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    c.getContext('2d').putImageData(out, 0, 0);
    return c;
  }

  /* ---------------- compute ---------------- */
  let token = 0;
  async function compute(opts = {}) {
    const my = ++token;
    busy(true);
    try {
      const d = designOf(S.designId), m = implOf(S.implId);
      const { w, h } = await designSize(d);
      const [D, M] = await Promise.all([prepared(d, w, h), prepared(m, w, h)]);
      const gt = await groundTruth(m, d);
      if (my !== token) return;
      await idle();
      const r = E.run(S.algo, D.seg, M.seg, D.img, M.img, S.P);
      const ev = gt ? E.evaluate(r.findings, gt) : null;
      const flagged = r.findings.filter(f => f.level !== 'ok').sort((a, b) => b.sev - a.sev);
      S.res = { d, m, D, M, r, gt, ev, W: w, H: h, flagged };
      S.err = null;
      if (!opts.keepSel || !r.findings.some(f => f.id === S.sel)) {
        const moved = flagged.find(f => f.type === 'position');
        S.sel = moved ? moved.id : flagged.length ? flagged[0].id : null;
      }
    } catch (e) {
      if (my !== token) return;
      S.err = (e && e.message) || String(e); S.res = null;
    }
    busy(false);
    renderControls(); renderStage(); renderInspector(); renderGalleryActive(); renderBench();
  }
  function busy(on) { $('#busy').classList.toggle('on', on); $('#mat').classList.toggle('dim', on && !!S.res); }

  /* ---------------- controls ---------------- */
  function renderControls() {
    const sd = $('#selDesign'), si = $('#selImpl');
    sd.replaceChildren(...S.designs.map(d => el('option', { value: d.id, text: d.name + (d.builtin ? '' : ' · yours') })));
    sd.value = S.designId;
    const dl = lineage(designOf(S.designId));
    const own = S.impls.filter(m => m.design === dl), other = S.impls.filter(m => m.design !== dl);
    si.replaceChildren(
      el('optgroup', { label: 'Built for this design' }, own.map(m => el('option', { value: m.id, text: m.name }))),
      other.length ? el('optgroup', { label: 'Other builds (mix and match)' }, other.map(m => el('option', { value: m.id, text: m.name }))) : null);
    si.value = S.implId;
    const chips = $('#algoChips');
    chips.replaceChildren(...E.ALGOS.map(a => el('button', {
      class: 'chip', type: 'button', 'aria-pressed': String(a.id === S.algo), title: a.blurb,
      onclick: () => { S.algo = a.id; S.presetId = null; compute({ keepSel: false }); },
    }, a.name)));
    for (const b of document.querySelectorAll('#views button')) b.setAttribute('aria-pressed', String(b.dataset.view === S.view));
    $('#optSpot').checked = S.spot;
    $('#optOk').checked = S.showOk;
  }
  $('#selDesign').addEventListener('change', e => {
    S.designId = e.target.value; S.presetId = null;
    const dl = lineage(designOf(S.designId));
    const own = S.impls.find(m => m.design === dl);
    if (own && implOf(S.implId).design !== dl) S.implId = own.id;
    compute();
  });
  $('#selImpl').addEventListener('change', e => { S.implId = e.target.value; S.presetId = null; compute(); });
  document.querySelectorAll('#views button').forEach(b => b.addEventListener('click', () => { S.view = b.dataset.view; renderControls(); renderStage(); }));
  $('#optSpot').addEventListener('change', e => { S.spot = e.target.checked; renderStage(); });
  $('#optOk').addEventListener('change', e => { S.showOk = e.target.checked; renderStage(); });

  /* ---------------- gallery ---------------- */
  function renderGallery() {
    const g = $('#gallery');
    g.replaceChildren(...PR.gallery.map(p => {
      const a = algoOf(p.algo), m = implOf(p.impl);
      const btn = el('button', {
        class: 'preset', type: 'button', 'data-id': p.id, title: m ? m.note : '',
        onclick: () => loadPreset(p.id, true),
      }, el('span', { class: 'th' }), el('span', { class: 't', text: p.title }),
      el('span', { class: 's' }, el('span', { class: 'tag', text: a.short }), m && (m.missing || m.src.includes('data-bug')) && p.design === m.design ? el('span', { text: bugCount(m) }) : null));
      return btn;
    }));
    renderGalleryActive();
  }
  function bugCount(m) {
    const n = (m.src.match(/data-bug="/g) || []).length + (m.missing ? m.missing.length : 0);
    return n ? `${n} planted bug${n > 1 ? 's' : ''}` : '';
  }
  function renderGalleryActive() {
    for (const b of document.querySelectorAll('.preset')) {
      const p = PR.gallery.find(x => x.id === b.dataset.id);
      const on = p && p.design === S.designId && p.impl === S.implId && p.algo === S.algo;
      b.setAttribute('aria-current', String(!!on));
    }
  }
  async function drawThumbs() {
    for (const p of PR.gallery) {
      const btn = document.querySelector(`.preset[data-id="${p.id}"] .th`);
      if (!btn || btn.firstChild) continue;
      try {
        const d = designOf(p.design), m = implOf(p.impl);
        const [D, M] = await Promise.all([raster(d, d.w, d.h), raster(m, d.w, d.h)]);
        const k = `${p.design}|${p.impl}`;
        if (!C.plates.has(k)) C.plates.set(k, plates(D, M, Math.min(128 / d.w, 96 / d.h)));
        btn.replaceChildren(C.plates.get(k).cloneNode ? cloneCanvas(C.plates.get(k)) : C.plates.get(k));
      } catch (e) { /* thumbnail is optional */ }
      await idle();
    }
  }
  function cloneCanvas(src) { const c = document.createElement('canvas'); c.width = src.width; c.height = src.height; c.getContext('2d').drawImage(src, 0, 0); return c; }
  function loadPreset(id, setHash) {
    const p = PR.gallery.find(x => x.id === id);
    if (!p) return;
    Object.assign(S, { designId: p.design, implId: p.impl, algo: p.algo, presetId: p.id });
    if (setHash) { try { history.replaceState(null, '', '#' + p.id); } catch (e) { /* ignore */ } }
    compute();
  }

  /* ---------------- stage ---------------- */
  function sizeStyle(W, H, n) {
    const r = W / H;
    return { width: `min(${W}px, 100%, calc(${n > 1 ? 66 : 72}vh * ${r.toFixed(4)}))` };
  }
  function frameEl(W, H, cap, plate, n = 1) {
    const box = el('div', { class: 'canvasbox' });
    const fr = el('div', { class: 'fr', style: sizeStyle(W, H, n) }, cap ? el('div', { class: 'cap' }, el('i', { style: { background: plate } }), cap) : null, box);
    return { fr, box };
  }
  function baseCanvas(img, wash) {
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const x = c.getContext('2d');
    x.drawImage(canvasOf(img), 0, 0);
    if (wash) { x.fillStyle = `rgba(255,255,255,${wash})`; x.fillRect(0, 0, c.width, c.height); }
    return c;
  }
  const visible = () => {
    if (!S.res) return [];
    return S.res.r.findings.filter(f => f.level !== 'ok' || (S.showOk && f.type === 'match'));
  };
  function colorOf(f) {
    if (f.type === 'missing' || f.type === 'frame-missing') return OV.design;
    if (f.type === 'extra' || f.type === 'frame-extra') return OV.build;
    return f.level === 'major' ? OV.major : f.level === 'minor' ? OV.minor : OV.ok;
  }
  function shortTag(f) {
    switch (f.type) {
      case 'missing': return 'missing';
      case 'extra': return 'extra';
      case 'frame-missing': return 'no frame';
      case 'frame-extra': return 'extra frame';
      case 'pixel': return '';
      case 'position': {
        const r = f.decomp.residual;
        return [Math.abs(r.dy) >= 2 ? (r.dy > 0 ? '↓' : '↑') + round(Math.abs(r.dy)) : '', Math.abs(r.dx) >= 2 ? (r.dx > 0 ? '→' : '←') + round(Math.abs(r.dx)) : ''].filter(Boolean).join(' ');
      }
      case 'size': return f.size && f.size.note ? f.size.note.replace('width ', 'w ').replace('height ', 'h ').replace(/^text /, '').replace(/^glyphs /, '') : 'size';
      case 'color': return 'ΔE ' + round(f.color.de);
      case 'shape': return 'shape';
      default: return '';
    }
  }

  let ovSeq = 0;
  function overlay(box, W, H, side) {
    const id = 'ov' + (++ovSeq);
    const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'none', role: 'img', 'aria-label': side === 'diff' ? 'Findings drawn over the build' : side === 'design' ? 'Design overlay' : 'Build overlay' });
    box.append(svg);
    requestAnimationFrame(() => paintOverlay(svg, W, H, side, id));
    return svg;
  }
  function paintOverlay(svg, W, H, side, id) {
    if (!svg.isConnected) return;
    const k = W / Math.max(1, svg.getBoundingClientRect().width);
    svg.replaceChildren();
    const defs = sv('defs');
    for (const [nm, col] of Object.entries({ major: OV.major, minor: OV.minor, ok: OV.ok, design: OV.design })) {
      defs.append(sv('marker', { id: `${id}-ah-${nm}`, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse', markerUnits: 'userSpaceOnUse' },
        sv('path', { d: 'M0 0L10 5L0 10Z', fill: col, transform: `scale(${k})`, 'transform-origin': '8 5' })));
    }
    svg.append(defs);
    const res = S.res;
    if (!res) return;
    const fam = algoOf(res.r.algo).family;
    const list = visible();
    // The build is washed out so overlays read; with the spotlight on, flagged regions are cut
    // out of both the wash and a dimming layer, so they show at full contrast.
    if (side === 'diff') {
      const spot = S.spot && list.some(f => f.level !== 'ok');
      let maskRef = null;
      if (spot) {
        const mask = sv('mask', { id: `${id}-m` }, sv('rect', { x: -10, y: -10, width: W + 20, height: H + 20, fill: '#fff' }));
        for (const f of list) {
          if (f.level === 'ok') continue;
          for (const b of [f.mBox, f.eBox]) {
            if (!b) continue;
            const p = 10 * k;
            mask.append(sv('rect', { x: b.x0 - p, y: b.y0 - p, width: W_(b) + 2 * p, height: H_(b) + 2 * p, rx: 6 * k, fill: '#000' }));
          }
        }
        defs.append(mask);
        maskRef = `url(#${id}-m)`;
      }
      svg.append(sv('rect', { x: 0, y: 0, width: W, height: H, fill: 'rgba(255,255,255,0.5)', mask: maskRef, 'pointer-events': 'none' }));
      if (spot) svg.append(sv('rect', { x: 0, y: 0, width: W, height: H, fill: 'rgba(15,19,24,0.34)', mask: maskRef, 'pointer-events': 'none' }));
    }
    const sorted = list.slice().sort((a, b) => (a.level === 'ok') - (b.level === 'ok') || a.sev - b.sev);
    const tags = [];
    for (const f of sorted) {
      const g = sv('g', { class: 'hit', 'data-fid': f.id });
      const col = colorOf(f);
      const isSel = f.id === S.sel;
      const sw = (f.level === 'major' ? 2.5 : f.level === 'minor' ? 1.75 : 1) + (isSel ? 1 : 0);
      const R = (b, o = {}) => sv('rect', Object.assign({ class: 'box', x: b.x0, y: b.y0, width: Math.max(1, W_(b)), height: Math.max(1, H_(b)), rx: 3 * k, fill: 'none', stroke: col, 'stroke-width': sw, 'vector-effect': 'non-scaling-stroke' }, o));
      let anchor = null;
      if (f.type === 'missing' || f.type === 'frame-missing') {
        const b = side === 'design' ? f.dBox : (f.eBox || f.dBox);
        if (side !== 'build' || f.eBox) {
          g.append(R(b, { fill: 'rgba(0,135,184,0.10)', 'stroke-dasharray': '6 4' }));
          anchor = b;
        }
      } else if (f.type === 'extra' || f.type === 'frame-extra') {
        if (side !== 'design') { g.append(R(f.mBox, { fill: 'rgba(194,24,122,0.10)', 'stroke-dasharray': '6 4' })); anchor = f.mBox; }
      } else if (f.type === 'pixel') {
        const b = f.mBox;
        g.append(R(b, { stroke: col, 'stroke-width': 1.25, fill: 'none' }));
        anchor = b;
      } else {
        const b = side === 'design' ? f.dBox : f.mBox;
        const ok = f.level === 'ok';
        if (side === 'diff' && !ok && f.eBox && (Math.abs(f.decomp.residual.dx) >= 2 || Math.abs(f.decomp.residual.dy) >= 2 || f.issues.includes('size'))) {
          g.append(R(f.eBox, { stroke: OV.design, 'stroke-width': 1.25, 'stroke-dasharray': '4 3' }));
          const a = { x: CX(f.eBox), y: CY(f.eBox) }, z = { x: CX(f.mBox), y: CY(f.mBox) };
          const rr = f.decomp.residual;
          if (Math.hypot(rr.dx, rr.dy) >= 2 && Math.hypot(z.x - a.x, z.y - a.y) > 6 * k) {
            g.append(sv('line', { x1: a.x, y1: a.y, x2: z.x, y2: z.y, stroke: col, 'stroke-width': 1.75, 'vector-effect': 'non-scaling-stroke', 'marker-end': `url(#${id}-ah-${f.level})` }));
          }
        }
        g.append(R(b, { fill: ok ? 'none' : (f.level === 'major' ? 'rgba(208,59,59,0.12)' : 'rgba(227,148,0,0.12)'), 'stroke-opacity': ok ? 0.65 : 1 }));
        anchor = ok ? null : b;
      }
      if (isSel && anchor) g.append(R(GROWk(anchor, 5 * k), { stroke: OV.sel, 'stroke-width': 1.5, 'stroke-dasharray': '2 3', fill: 'none' }));
      g.append(sv('title', null, `${f.title} · ${f.name}`));
      g.addEventListener('click', ev => { ev.stopPropagation(); select(f.id, true); });
      g.addEventListener('mouseenter', () => linkHover(f.id, true));
      g.addEventListener('mouseleave', () => linkHover(f.id, false));
      svg.append(g);
      if (anchor && (f.level === 'major' || isSel || (f.level === 'minor' && fam === 'box')) && side !== 'design') {
        const t = shortTag(f);
        if (t) tags.push({ f, t, b: anchor, col });
      }
    }
    // constant-size tags, nudged so they don't stack on each other
    const placed = [];
    for (const { f, t, b, col } of tags) {
      const fs = 11 * k, w = (t.length * 6.9 + 10) * k, h = 17 * k;
      let x = clamp(b.x0, 0, W - w), y = b.y0 - h - 3 * k;
      if (y < 0) y = b.y1 + 3 * k;
      for (let tries = 0; tries < 6 && placed.some(p => x < p.x + p.w && x + w > p.x && y < p.y + p.h && y + h > p.y); tries++) y += h + 2 * k;
      placed.push({ x, y, w, h });
      const g = sv('g', { 'pointer-events': 'none' },
        sv('rect', { x, y, width: w, height: h, rx: 3 * k, fill: col }),
        sv('text', { x: x + 5 * k, y: y + 12.2 * k, 'font-size': fs, 'font-family': 'JetBrains Mono, ui-monospace, Menlo, monospace', 'font-weight': 600, fill: '#fff' }, t));
      svg.append(g);
    }
  }
  function GROWk(b, p) { return { x0: b.x0 - p, y0: b.y0 - p, x1: b.x1 + p, y1: b.y1 + p }; }
  function linkHover(fid, on) {
    for (const g of document.querySelectorAll(`#mat g[data-fid="${fid}"]`)) g.classList.toggle('hl', on);
  }

  function renderStage() {
    const mat = $('#mat');
    mat.replaceChildren();
    if (S.err) {
      mat.append(el('div', { class: 'err' }, el('b', { text: 'Could not render this pair. ' }), S.err,
        el('div', { style: { marginTop: '6px', color: 'var(--ink-2)', fontSize: '12.5px' } }, 'Inline external images and fonts as data URIs, or upload a PNG screenshot of the build instead.')));
      renderLegend();
      return;
    }
    if (!S.res) { mat.append(el('div', { class: 'empty', text: 'Rendering…' })); return; }
    const fn = { diff: viewDiff, side: viewSide, plates: viewPlates, swipe: viewSwipe, segments: viewSegments }[S.view] || viewDiff;
    fn(mat);
    renderLegend();
  }
  function viewDiff(mat) {
    const { W, H, M, r } = S.res;
    const { fr, box } = frameEl(W, H, 'Build, with findings', OV.build);
    box.append(baseCanvas(M.img, 0));
    if (r.heat) box.append(el('div', { class: 'layer' }, heatCanvas(r.heat)));
    overlay(box, W, H, 'diff');
    mat.append(el('div', { class: 'frames' }, fr));
  }
  function heatCanvas(hm) {
    if (hm.canvas) return hm.canvas;
    const c = document.createElement('canvas'); c.width = hm.W; c.height = hm.H;
    const x = c.getContext('2d'), id = x.createImageData(hm.W, hm.H), o = id.data;
    for (let i = 0; i < hm.v.length; i++) {
      if (!hm.flag[i]) continue;
      const v = clamp(hm.v[i] * 2.2, 0.25, 1);
      o[i * 4] = 208; o[i * 4 + 1] = 59 + (1 - v) * 90; o[i * 4 + 2] = 59; o[i * 4 + 3] = 70 + 170 * v;
    }
    x.putImageData(id, 0, 0);
    hm.canvas = c;
    return c;
  }
  function viewSide(mat) {
    const { W, H, D, M } = S.res;
    const a = frameEl(W, H, 'Design', OV.design, 2), b = frameEl(W, H, 'Build', OV.build, 2);
    a.box.append(baseCanvas(D.img, 0.25)); b.box.append(baseCanvas(M.img, 0.25));
    overlay(a.box, W, H, 'design'); overlay(b.box, W, H, 'build');
    mat.append(el('div', { class: 'frames two' }, a.fr, b.fr));
  }
  function viewPlates(mat) {
    const { W, H, D, M, d, m } = S.res;
    const k = `${d.id}|${m.id}|full`;
    if (!C.plates.has(k)) C.plates.set(k, plates(D.img, M.img, 1));
    const { fr, box } = frameEl(W, H, 'Cyan prints the design, magenta the build; where both print, ink goes black', OV.ink);
    box.append(cloneCanvas(C.plates.get(k)));
    mat.append(el('div', { class: 'frames' }, fr));
  }
  function viewSwipe(mat) {
    const { W, H, D, M } = S.res;
    const { fr, box } = frameEl(W, H, null, null);
    const top = el('div', { class: 'layer', style: { clipPath: `inset(0 ${100 - S.swipe}% 0 0)` } }, baseCanvas(D.img, 0));
    box.append(baseCanvas(M.img, 0), top, sv('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'none' },
      sv('line', { x1: W * S.swipe / 100, x2: W * S.swipe / 100, y1: 0, y2: H, stroke: OV.ink, 'stroke-width': 2, 'vector-effect': 'non-scaling-stroke' })));
    const range = el('input', { type: 'range', min: 0, max: 100, value: S.swipe, id: 'swipeRange', 'aria-label': 'Swipe position' });
    range.addEventListener('input', () => {
      S.swipe = +range.value;
      top.style.clipPath = `inset(0 ${100 - S.swipe}% 0 0)`;
      const ln = box.querySelector('svg line');
      ln.setAttribute('x1', W * S.swipe / 100); ln.setAttribute('x2', W * S.swipe / 100);
    });
    mat.append(el('div', { class: 'swipe' }, el('span', { text: '◂ design' }), range, el('span', { text: 'build ▸' })), el('div', { class: 'frames' }, fr));
  }
  function viewSegments(mat) {
    const { W, H, D, M } = S.res;
    const a = frameEl(W, H, `Design · ${D.seg.stats.nodes} nodes · ${round(D.seg.stats.ms)} ms`, OV.design, 2);
    const b = frameEl(W, H, `Build · ${M.seg.stats.nodes} nodes · ${round(M.seg.stats.ms)} ms`, OV.build, 2);
    a.box.append(baseCanvas(D.img, 0.55)); b.box.append(baseCanvas(M.img, 0.55));
    for (const [fb, seg] of [[a.box, D.seg], [b.box, M.seg]]) {
      const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'none' });
      const walk = (n) => {
        for (const c of n.children) {
          const col = KIND_COLORS[c.kind] || OV.ink;
          const g = sv('g', { class: 'hit' },
            sv('rect', { class: 'box', x: c.box.x0, y: c.box.y0, width: W_(c.box), height: H_(c.box), fill: c.kind === 'text' ? 'rgba(235,104,52,0.10)' : 'none', stroke: col, 'stroke-width': c.kind === 'container' ? 1.5 : 1, 'vector-effect': 'non-scaling-stroke' }),
            sv('title', null, `${E.nodeName(c)} · depth ${c.depth}${c.color ? ' · ' + E.color.hex(c.color) : ''}`));
          svg.append(g);
          walk(c);
        }
      };
      walk(seg.root);
      fb.append(svg);
    }
    mat.append(el('div', { class: 'frames two' }, a.fr, b.fr));
  }
  function renderLegend() {
    const L = $('#legend');
    const item = (txt, col, dash, fill) => el('span', null, el('i', { class: dash ? 'dash' : '', style: { borderColor: col, background: fill || 'transparent' } }), txt);
    if (!S.res && !S.err) { L.replaceChildren(); return; }
    if (S.view === 'segments') {
      L.replaceChildren(...Object.entries(KIND_COLORS).map(([k, c]) => item(k[0].toUpperCase() + k.slice(1), c)), el('span', { text: 'Hover a box for its kind, size and depth.' }));
    } else if (S.view === 'plates' || S.view === 'swipe') {
      L.replaceChildren(el('span', { text: S.view === 'plates' ? 'Misregistration shows as colored fringes. Fonts fringe everywhere, which is why this view alone cannot rank findings.' : 'Drag the handle to wipe between the design (left) and the build (right).' }));
    } else {
      const pix = S.res && algoOf(S.res.r.algo).family === 'pixel';
      L.replaceChildren(...[
        item('Major', OV.major, false, 'rgba(208,59,59,0.15)'), item('Minor', OV.minor, false, 'rgba(227,148,0,0.15)'),
        pix ? item('Differing pixels', OV.major, false, OV.major) : item('Where references put it', OV.design, true),
        pix ? null : item('Missing from build', OV.design, true, 'rgba(0,135,184,0.12)'), pix ? null : item('Not in design', OV.build, true, 'rgba(194,24,122,0.12)'),
        S.showOk && !pix ? item('Matched, within tolerance', OV.ok) : null,
        pix ? el('span', { text: 'Pixel methods report regions, not elements.' }) : el('span', { text: 'Arrows show only the displacement nothing explains.' })].filter(Boolean));
    }
  }
  const ro = new ResizeObserver(() => {
    clearTimeout(ro.t);
    ro.t = setTimeout(() => { if (S.res && (S.view === 'diff' || S.view === 'side')) renderStage(); }, 120);
  });
  ro.observe($('#mat'));

  /* ---------------- inspector ---------------- */
  function select(fid, scroll) {
    S.sel = fid;
    renderStage();
    renderInspector();
    if (scroll) { const it = document.querySelector(`.fitem[data-fid="${fid}"]`); if (it) it.scrollIntoView({ block: 'nearest' }); }
  }
  function renderInspector() {
    const root = $('#insp');
    const a = algoOf(S.algo);
    root.replaceChildren(el('div', { class: 'pane-h' }, el('h2', { text: 'Inspector' }), el('span', { class: 'grow' }), el('span', { class: 'tag', text: a.name })));
    if (S.err) { root.append(el('div', { class: 'empty', text: 'No result for this pair.' })); return; }
    if (!S.res) { root.append(el('div', { class: 'empty', text: 'Rendering both sides…' })); return; }
    const { r, ev, flagged, gt } = S.res;
    const c = r.counts;
    const pix = a.family === 'pixel';
    root.append(el('div', { class: 'summary' },
      el('div', { class: 'score' }, r.score.toFixed(1), el('small', { text: '%' })),
      el('div', { class: 'counts' },
        cnt('major', 'Major', c.major), cnt('minor', 'Minor', c.minor),
        pix ? null : cnt('missing', 'Missing', c.missing), pix ? null : cnt('extra', 'Extra', c.extra),
        pix ? null : cnt('ok', 'Matched', c.ok)),
      el('div', { class: 'lab', text: pix ? (r.algo === 'pixel' ? 'Pixels identical' : 'Mean SSIM') : 'Conformance' })));
    if (ev) {
      root.append(el('div', { class: 'evalline' },
        el('span', null, 'Planted bugs found ', el('b', { text: `${ev.found}/${ev.gt}` })), el('span', { text: '·' }),
        el('span', null, 'False alarms ', el('b', { text: String(ev.fp) })),
        el('span', { class: 'dots', title: gt.map(g => g.label).join('\n') }, gt.map((g, i) => el('i', { class: ev.hit.has(i) ? 'on' : '', title: g.label })))));
    } else if (S.res.m.design !== lineage(S.res.d)) {
      root.append(el('div', { class: 'evalline', text: 'This build was made for a different design, so there is no ground truth for this pairing.' }));
    }
    root.append(el('p', { class: 'algo-note' }, el('b', { text: a.name + '. ' }), a.blurb));
    if (!flagged.length) {
      root.append(el('div', { class: 'empty' }, el('b', { text: 'Nothing flagged. ' }), pix ? 'No region crosses the threshold.' : `All ${c.ok} matched elements sit within tolerance once parent and flow references are accounted for.`));
      return;
    }
    const ul = el('ul', { class: 'flist', 'aria-label': 'Findings' });
    for (const f of flagged) {
      const nm = f.type === 'pixel' ? boxStr(f.mBox) : f.name + (f.decomp ? ` · ${boxStr(f.mBox)}` : f.mBox ? ` · ${boxStr(f.mBox)}` : ` · ${boxStr(f.dBox)}`);
      ul.append(el('li', null, el('button', {
        class: 'fitem', type: 'button', 'data-fid': f.id, 'aria-current': String(f.id === S.sel),
        onclick: () => select(f.id), onmouseenter: () => linkHover(f.id, true), onmouseleave: () => linkHover(f.id, false),
      }, el('span', { class: 'bar', style: { background: colorOf(f) } }), el('span', { class: 'ttl', text: f.title }), el('span', { class: 'sv', text: f.sev.toFixed(1) }),
      el('span', { class: 'nm', text: nm }))));
    }
    root.append(ul);
    const f = r.findings.find(x => x.id === S.sel);
    if (f) root.append(detail(f));
  }
  const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
  function cnt(cls, label, n) { return el('span', { class: 'count' }, el('span', { class: 'sw ' + cls }), el('b', { text: String(n) }), label); }
  function pillFor(f) {
    const lvl = f.type === 'missing' || f.type === 'frame-missing' ? 'missing' : f.type === 'extra' || f.type === 'frame-extra' ? 'extra' : f.level;
    return el('span', { class: 'pill' }, el('span', { class: 'sw ' + lvl }), f.level === 'major' ? 'major' : f.level === 'minor' ? 'minor' : 'ok');
  }
  function cropCanvas(img, box, col, ghost) {
    const W = img.width, H = img.height, pad = 22;
    const focus = ghost ? { x0: Math.min(box.x0, ghost.x0), y0: Math.min(box.y0, ghost.y0), x1: Math.max(box.x1, ghost.x1), y1: Math.max(box.y1, ghost.y1) } : box;
    const x0 = clamp(Math.floor(focus.x0 - pad), 0, W - 1), y0 = clamp(Math.floor(focus.y0 - pad), 0, H - 1);
    const x1 = clamp(Math.ceil(focus.x1 + pad), x0 + 1, W), y1 = clamp(Math.ceil(focus.y1 + pad), y0 + 1, H);
    const s = Math.min(2, 320 / (x1 - x0), 200 / (y1 - y0));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round((x1 - x0) * s)); c.height = Math.max(1, Math.round((y1 - y0) * s));
    const x = c.getContext('2d');
    x.imageSmoothingQuality = 'high';
    x.drawImage(canvasOf(img), x0, y0, x1 - x0, y1 - y0, 0, 0, c.width, c.height);
    const rr = (b, color, dash) => { x.save(); x.strokeStyle = color; x.lineWidth = 2; if (dash) x.setLineDash([5, 4]); x.strokeRect((b.x0 - x0) * s, (b.y0 - y0) * s, W_(b) * s, H_(b) * s); x.restore(); };
    if (ghost) rr(ghost, OV.design, true);
    rr(box, col, false);
    return c;
  }
  function detail(f) {
    const { D, M } = S.res;
    const col = colorOf(f);
    const wrap = el('div', { class: 'detail', 'aria-live': 'polite' });
    wrap.append(el('div', null, el('div', { style: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' } }, pillFor(f), el('h3', { text: f.title })),
      el('div', { class: 'sub', text: `${f.name}${f.rescued ? ' · paired by the order-free rescue pass' : ''}${f.merged ? ' · 2:1 text merge' : ''}` })));
    const dc = f.dBox ? el('div', { class: 'crop' }, el('div', { class: 'cap' }, el('i', { style: { background: OV.design } }), 'Design'), cropCanvas(D.img, f.dBox, OV.design))
      : el('div', { class: 'crop' }, el('div', { class: 'cap' }, el('i', { style: { background: OV.design } }), 'Design'), el('div', { class: 'none', text: 'Not in the design' }));
    const mc = f.mBox ? el('div', { class: 'crop' }, el('div', { class: 'cap' }, el('i', { style: { background: OV.build } }), 'Build'), cropCanvas(M.img, f.mBox, col, f.decomp && f.level !== 'ok' ? f.eBox : null))
      : el('div', { class: 'crop' }, el('div', { class: 'cap' }, el('i', { style: { background: OV.build } }), 'Build'),
        f.eBox ? cropCanvas(M.img, f.eBox, OV.design) : el('div', { class: 'none', text: 'Not found in the build' }));
    wrap.append(el('div', { class: 'crops' }, dc, mc));
    if (f.type === 'pixel') {
      wrap.append(el('p', { class: 'algo-note', style: { margin: 0 }, text: 'Pixel methods have no notion of an element. This region differs, but nothing says whether it is a font, a shift inherited from above, or a real defect.' }));
      return wrap;
    }
    if (f.type === 'missing' || f.type === 'frame-missing') {
      wrap.append(el('p', { class: 'algo-note', style: { margin: 0 }, text: f.type === 'missing'
        ? 'No element in the build aligns with this one. The dashed box on the build is where its parent and its predecessor in the flow would put it.'
        : 'The frame (fill or border) is gone, but its children were found one level up, so they were matched there instead of being charged as missing.' }));
      return wrap;
    }
    if (f.type === 'extra' || f.type === 'frame-extra') {
      wrap.append(el('p', { class: 'algo-note', style: { margin: 0 }, text: f.type === 'extra'
        ? 'Present in the build, unmatched in the design. Elements below it that only moved because of it are explained by flowing below it.'
        : 'The build wraps these children in a frame the design does not have. The children were matched one level up.' }));
      return wrap;
    }
    const dcp = f.decomp;
    if (dcp) {
      const row = (label, v, cls) => el('tr', { class: cls || '' }, el('th', { text: label }), el('td', { text: fmt(v.dx) }), el('td', { text: fmt(v.dy) }));
      wrap.append(el('table', { class: 'dec' },
        el('caption', { text: 'Displacement of the top-left corner, px' }),
        el('tr', null, el('th', { text: '' }), el('td', { text: 'x', style: { color: 'var(--muted)' } }), el('td', { text: 'y', style: { color: 'var(--muted)' } })),
        row('Total, design → build', dcp.abs), row('Inherited from parent', dcp.inherited), row('Explained by references', dcp.explained), row('Charged to this element', dcp.residual, 'charged')));
      wrap.append(el('div', { class: 'refs' },
        el('div', null, el('span', { text: '↔' }), el('span', null, 'x explained by ', el('code', { text: dcp.refX }))),
        el('div', null, el('span', { text: '↕' }), el('span', null, 'y explained by ', el('code', { text: dcp.refY })))));
    }
    if (f.size) {
      const kv = el('dl', { class: 'kv' },
        el('dt', { text: 'Design box' }), el('dd', { text: boxStr(f.dBox) }),
        el('dt', { text: 'Build box' }), el('dd', { text: boxStr(f.mBox) }));
      if (f.size.note) kv.append(el('dt', { text: 'Size' }), el('dd', { text: f.size.note }));
      if (f.size.explained) kv.append(el('dt', { text: 'Excused' }), el('dd', { text: f.size.explained }));
      wrap.append(kv);
    }
    if (f.color && f.color.d && f.color.m) {
      wrap.append(el('div', { class: 'swatches' },
        el('span', null, el('i', { style: { background: E.color.hex(f.color.d) } }), E.color.hex(f.color.d)),
        el('span', { text: '→' }),
        el('span', null, el('i', { style: { background: E.color.hex(f.color.m) } }), E.color.hex(f.color.m)),
        el('span', { text: `ΔE ${f.color.de.toFixed(1)}` })));
    }
    if (f.parts) {
      const max = 4;
      wrap.append(el('div', { class: 'meters' }, Object.entries(f.parts).map(([k, v]) => el('div', { class: 'meter' },
        el('span', { text: k }),
        el('span', { class: 'track' },
          el('span', { class: 'fill', style: { width: `${clamp(v / max, 0, 1) * 100}%`, background: v >= 2.5 ? OV.major : v >= 1 ? OV.minor : 'var(--muted)' } }),
          el('span', { class: 'tick', style: { left: `${100 / max}%` } }), el('span', { class: 'tick', style: { left: `${250 / max}%` } })),
        el('output', { text: v.toFixed(2) })))));
    }
    return wrap;
  }

  /* ---------------- tune & source drawers ---------------- */
  const SLIDERS = [
    { h: 'Segmentation' },
    { k: 'edgeT', label: 'Edge threshold', min: 4, max: 40, step: 1, note: 'Smallest color step (0–255, max channel) that separates two regions.' },
    { k: 'kH', label: 'Word gap', min: 0.3, max: 2, step: 0.05, note: 'Glyph blobs closer than this × height join one line.' },
    { k: 'kV', label: 'Line gap', min: 0.15, max: 1.2, step: 0.05, note: 'Lines closer than this × height join one paragraph.' },
    { h: 'Scoring' },
    { k: 'posTol', label: 'Position tolerance', min: 2, max: 24, step: 1, unit: 'px', note: 'Unexplained displacement below this is fine. Text gets 1.5×.' },
    { k: 'textSizeTol', label: 'Text mass tolerance', min: 0.1, max: 1.5, step: 0.05, note: 'Allowed ink-mass change after the page-wide font scale is removed.' },
    { k: 'colorTol', label: 'Fill color tolerance', min: 4, max: 40, step: 1, unit: 'ΔE', note: 'CIE76 distance between fills before it counts.' },
    { h: 'Pixel baselines' },
    { k: 'pixT', label: 'Pixel Δ threshold', min: 8, max: 128, step: 1, note: 'Max-channel difference that flags a pixel.' },
    { k: 'ssimT', label: 'SSIM threshold', min: 0.3, max: 0.97, step: 0.01, note: 'Local SSIM below this flags a pixel.' },
  ];
  function renderTune() {
    const d = $('#drawerTune');
    const grid = el('div', { class: 'tune' });
    for (const s of SLIDERS) {
      if (s.h) { grid.append(el('h4', { text: s.h })); continue; }
      const out = el('output', { text: S.P[s.k] + (s.unit ? ' ' + s.unit : '') });
      const inp = el('input', { type: 'range', id: 'p-' + s.k, min: s.min, max: s.max, step: s.step, value: S.P[s.k] });
      inp.addEventListener('input', () => { S.P[s.k] = +inp.value; out.textContent = inp.value + (s.unit ? ' ' + s.unit : ''); schedule(); });
      grid.append(el('div', { class: 'slider' }, el('label', { for: 'p-' + s.k, text: s.label }), out, inp, el('small', { text: s.note })));
    }
    const tg = (k, label) => {
      const i = el('input', { type: 'checkbox', id: 't-' + k });
      i.checked = !!S.P[k];
      i.addEventListener('change', () => { S.P[k] = i.checked; schedule(); });
      return el('label', { for: 't-' + k }, i, label);
    };
    grid.append(el('div', { class: 'toggles' },
      tg('merges', '2:1 text merges'), tg('rescue', 'Order-free rescue pass'), tg('flatten', 'Flatten unmatched frames'),
      el('button', { class: 'btn ghost', type: 'button', onclick: () => { S.P = { ...E.DEFAULTS }; renderTune(); schedule(); } }, 'Reset to defaults')));
    d.replaceChildren(grid);
  }
  let schedT = null;
  function schedule() { clearTimeout(schedT); schedT = setTimeout(() => compute({ keepSel: true }), 220); }
  function renderSource() {
    const d = $('#drawerSource');
    const de = designOf(S.designId), me = implOf(S.implId);
    const side = (it, label, kind) => {
      if (it.kind === 'image') return el('div', null, el('div', { class: 'lbl', text: label }), el('p', { class: 'hint', text: 'This input is an image, so there is no source to edit.' }));
      const ta = el('textarea', { id: 'src-' + kind, spellcheck: 'false', 'aria-label': label });
      ta.value = it.src;
      const apply = el('button', { class: 'btn solid', type: 'button' }, 'Render edits');
      apply.addEventListener('click', () => applyEdit(kind, ta.value));
      return el('div', null, el('div', { class: 'lbl', text: label }), ta,
        el('div', { class: 'row' }, apply, el('span', { class: 'hint', text: it.builtin ? 'Edits are saved as your own copy; the preset stays intact.' : 'Edits replace this input.' })));
    };
    d.replaceChildren(el('div', { class: 'src' }, side(de, `Design · ${de.kind.toUpperCase()}`, 'design'), side(me, `Build · ${me.kind.toUpperCase()}`, 'impl')));
  }
  async function applyEdit(kind, text) {
    try {
      if (kind === 'design') {
        const cur = designOf(S.designId);
        const sz = E.nativeSize({ type: 'svg', text });
        const s = await sz;
        const it = cur.builtin ? { id: 'u' + Date.now(), name: cur.name + ' (edited)', kind: 'svg', src: text, w: s.w, h: s.h, origin: cur.id } : Object.assign(cur, { src: text, w: s.w, h: s.h, id: cur.id.split('~')[0] + '~' + Date.now() });
        if (cur.builtin) S.designs.push(it);
        S.designId = it.id;
      } else {
        const cur = implOf(S.implId);
        const it = cur.builtin ? { id: 'u' + Date.now(), name: cur.name + ' (edited)', kind: cur.kind, src: text, design: cur.design, missing: cur.missing }
          : Object.assign(cur, { src: text, id: cur.id.split('~')[0] + '~' + Date.now() });
        if (cur.builtin) S.impls.push(it);
        S.implId = it.id;
      }
      S.presetId = null;
      saveCustom();
      toast('Rendered your edits');
      await compute();
      renderSource();
    } catch (e) { toast(e.message || String(e)); }
  }
  function toggleDrawer(which) {
    S.drawer = S.drawer === which ? null : which;
    $('#drawerTune').hidden = S.drawer !== 'tune';
    $('#drawerSource').hidden = S.drawer !== 'source';
    $('#btnTune').setAttribute('aria-pressed', String(S.drawer === 'tune'));
    $('#btnSource').setAttribute('aria-pressed', String(S.drawer === 'source'));
    if (S.drawer === 'tune') renderTune();
    if (S.drawer === 'source') renderSource();
  }
  $('#btnTune').addEventListener('click', () => toggleDrawer('tune'));
  $('#btnSource').addEventListener('click', () => toggleDrawer('source'));

  /* ---------------- add your own ---------------- */
  function openAdd() {
    const root = $('#modalRoot');
    let fileData = null, fileKind = null;
    const msg = el('div', { class: 'msg', role: 'status' });
    const name = el('input', { type: 'text', id: 'addName', placeholder: 'e.g. Checkout, v2 build' });
    const ta = el('textarea', { id: 'addText', spellcheck: 'false', placeholder: '<svg …> for a design, <html …> or <div …> for a build' });
    const rD = el('input', { type: 'radio', name: 'addKind', id: 'addKindD', value: 'design' }), rM = el('input', { type: 'radio', name: 'addKind', id: 'addKindM', value: 'impl' });
    rM.checked = true;
    const file = el('input', { type: 'file', id: 'addFile', accept: '.svg,.html,.htm,.png,.jpg,.jpeg,.webp,image/*,text/html,image/svg+xml' });
    file.addEventListener('change', () => {
      const f = file.files[0];
      if (!f) return;
      if (!name.value) name.value = f.name.replace(/\.[^.]+$/, '');
      const rd = new FileReader();
      if (f.type.startsWith('image/') && !f.type.includes('svg')) {
        rd.onload = () => { fileData = rd.result; fileKind = 'image'; ta.value = ''; ta.placeholder = `${f.name} loaded as an image`; };
        rd.readAsDataURL(f);
      } else {
        rd.onload = () => { fileData = null; fileKind = null; ta.value = rd.result; };
        rd.readAsText(f);
      }
    });
    const close = () => root.replaceChildren();
    const add = async () => {
      msg.textContent = '';
      const asDesign = rD.checked;
      let kind = fileKind, src = fileData;
      if (!src) {
        src = ta.value.trim();
        if (!src) { msg.textContent = 'Paste markup or choose a file first.'; return; }
        kind = /^\s*(<\?xml[^>]*>\s*)?<svg[\s>]/i.test(src) ? 'svg' : 'html';
      }
      if (asDesign && kind === 'html') { msg.textContent = 'A design needs to be an SVG or an image, since it defines the frame size. Add HTML as a build instead.'; return; }
      const id = 'u' + Date.now();
      const nm = name.value.trim() || (asDesign ? 'My design' : 'My build');
      try {
        if (asDesign) {
          const s = await E.nativeSize(kind === 'image' ? { type: 'image', url: src } : { type: 'svg', text: src });
          S.designs.push({ id, name: nm, kind, src, w: s.w, h: s.h });
          S.designId = id;
          if (!S.impls.some(m => m.design === id)) { /* keep the current build for a mix-and-match first look */ }
        } else {
          S.impls.push({ id, name: nm, kind, src, design: lineage(designOf(S.designId)) });
          S.implId = id;
        }
        S.presetId = null;
        saveCustom();
        close();
        toast(`Added “${nm}”`);
        compute();
      } catch (e) { msg.textContent = e.message || String(e); }
    };
    root.replaceChildren(el('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'addTitle', onclick: e => { if (e.target.classList.contains('modal')) close(); } },
      el('div', { class: 'card' },
        el('h3', { id: 'addTitle', text: 'Add a design or a build' }),
        el('p', { text: 'Designs are SVG exports or PNGs and set the frame size. Builds can be HTML, SVG or a PNG screenshot and are rendered at the design’s frame size. External images and web fonts do not load inside this renderer; inline them as data URIs, or upload a screenshot.' }),
        el('div', { class: 'radios' }, el('label', { for: 'addKindD' }, rD, 'Design'), el('label', { for: 'addKindM' }, rM, 'Build')),
        el('label', { for: 'addName', class: 'lbl', text: 'Name' }), name,
        el('label', { for: 'addText', class: 'lbl', text: 'Paste markup' }), ta,
        el('label', { class: 'file', for: 'addFile' }, 'Or choose a file ', file),
        msg,
        el('div', { class: 'row' }, el('button', { class: 'btn', type: 'button', onclick: close }, 'Cancel'), el('button', { class: 'btn solid', type: 'button', onclick: add }, 'Add and compare')))));
    name.focus();
  }
  $('#btnAdd').addEventListener('click', openAdd);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#modalRoot').firstChild) $('#modalRoot').replaceChildren(); });
  function toast(t) {
    const n = el('div', { class: 'toast', role: 'status', text: t });
    document.body.append(n);
    setTimeout(() => n.remove(), 2600);
  }

  /* ---------------- benchmark ---------------- */
  let benchToken = 0;
  async function runBench() {
    const my = ++benchToken;
    const pairs = S.impls.filter(m => m.builtin).map(m => ({ m, d: designOf(m.design) }));
    S.bench = { rows: [], running: true, total: pairs.length };
    renderBench();
    for (const { m, d } of pairs) {
      const [D, M] = await Promise.all([prepared(d, d.w, d.h), prepared(m, d.w, d.h)]);
      const gt = (await groundTruth(m, d)) || [];
      const row = { m, d, gt, cells: {} };
      for (const a of E.ALGOS) {
        await idle();
        if (my !== benchToken) return;
        const r = E.run(a.id, D.seg, M.seg, D.img, M.img, S.P);
        row.cells[a.id] = E.evaluate(r.findings, gt);
      }
      S.bench.rows.push(row);
      renderBench();
    }
    S.bench.running = false;
    renderBench();
  }
  $('#btnBench').addEventListener('click', runBench);
  function renderBench() {
    const st = $('#benchStatus'), T = $('#matrix'), bars = $('#bars');
    if (!S.bench) { st.textContent = ''; return; }
    const B = S.bench;
    st.textContent = B.running ? `Scoring ${B.rows.length + 1} of ${B.total}…` : `${B.rows.length} pairs × ${E.ALGOS.length} algorithms`;
    const maxFp = Math.max(1, ...B.rows.flatMap(r => Object.values(r.cells).map(c => c.fp)));
    const head = el('thead', null, el('tr', null, el('th', { text: 'Design · build' }), E.ALGOS.map(a => el('th', { text: a.name }))));
    const body = el('tbody');
    for (const row of B.rows) {
      body.append(el('tr', null,
        el('th', null, cap(row.m.name.replace(/^[^·]+· /, '')), el('small', { text: `${row.d.name} · ${row.gt.length ? row.gt.length + ' planted' : 'clean'}` })),
        E.ALGOS.map(a => {
          const c = row.cells[a.id];
          const cur = S.res && S.res.m.id === row.m.id && S.res.d.id === row.d.id && S.algo === a.id;
          return el('td', null, el('button', {
            class: 'cell' + (c.fp === 0 ? ' zero' : ''), type: 'button', 'aria-current': String(!!cur),
            title: `${a.name} on ${row.m.name}: found ${c.found} of ${c.gt}, ${c.fp} false alarm${c.fp === 1 ? '' : 's'}`,
            onclick: () => { Object.assign(S, { designId: row.d.id, implId: row.m.id, algo: a.id, presetId: null }); compute(); document.querySelector('.stage').scrollIntoView({ behavior: 'smooth', block: 'start' }); },
          }, el('span', { class: 'dots' }, c.gt ? Array.from({ length: c.gt }, (_, i) => el('i', { class: i < c.found ? 'on' : '' })) : el('em', { text: 'no bugs planted' })),
          el('span', { class: 'fp' }, el('span', { class: 't' }, el('span', { style: { width: `${(c.fp / maxFp) * 100}%` } })), el('span', null, el('b', { text: String(c.fp) }), ' FA'))));
        })));
    }
    const tot = a => B.rows.reduce((s, r) => ({ found: s.found + r.cells[a].found, gt: s.gt + r.cells[a].gt, fp: s.fp + r.cells[a].fp, flagged: s.flagged + r.cells[a].flagged }), { found: 0, gt: 0, fp: 0, flagged: 0 });
    const foot = el('tfoot', null, el('tr', null, el('th', { text: 'All pairs' }), E.ALGOS.map(a => {
      const t = tot(a.id);
      return el('td', { class: 'mono', text: `${t.found}/${t.gt} found · ${t.fp} FA` });
    })));
    T.replaceChildren(head, body, foot);
    const totals = E.ALGOS.map(a => ({ a, t: tot(a.id) }));
    const mx = Math.max(1, ...totals.map(x => x.t.fp));
    bars.replaceChildren(el('h3', { text: 'False alarms summed over every pair (lower is better), with planted bugs found. The tree columns change one thing at a time: hierarchical matching, then ordered alignment, then flow attribution.' }),
      ...totals.map(({ a, t }) => el('div', { class: 'barrow' },
        el('span', { class: 'nm' }, el('b', { text: a.name }), ` · ${t.found}/${t.gt}`),
        el('span', { class: 'track' },
          el('span', { class: 'b' + (a.id === S.algo ? ' me' : ''), style: { width: `calc((100% - 52px) * ${(t.fp / mx).toFixed(4)})` } }),
          el('span', { class: 'v', text: String(t.fp) })))));
  }
  function markBenchCell() { /* rendered as part of renderBench */ }

  /* ---------------- boot ---------------- */
  renderControls();
  renderGallery();
  renderInspector();
  const fromHash = (location.hash || '').slice(1);
  if (PR.gallery.some(p => p.id === fromHash)) loadPreset(fromHash, false);
  else loadPreset(S.presetId, false);
  (async () => {
    await new Promise(r => setTimeout(r, 300));
    await drawThumbs();
    await runBench();
  })();
})();
