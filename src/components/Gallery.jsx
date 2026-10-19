import React from 'react';
import * as Presets from '../presets/index.js';
import { E, designRaster, buildRaster } from '../pipeline.js';
import { idle, store } from '../hooks.js';
const { useEffect, useRef, useState } = React;

/* Registration plates: design ink prints cyan, build ink prints magenta; where both print, black. */
export function platesCanvas(a, b, scale) {
  const W = Math.max(1, Math.round(a.width * scale)), H = Math.max(1, Math.round(a.height * scale));
  const shrink = img => {
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    c.getContext('2d').putImageData(img, 0, 0);
    if (scale === 1) return img.data;
    const t = document.createElement('canvas'); t.width = W; t.height = H;
    const x = t.getContext('2d', { willReadFrequently: true });
    x.imageSmoothingQuality = 'high'; x.drawImage(c, 0, 0, W, H);
    return x.getImageData(0, 0, W, H).data;
  };
  const p = shrink(a), q = shrink(b);
  const out = new ImageData(W, H), o = out.data;
  for (let i = 0; i < p.length; i += 4) {
    const ia = Math.pow(1 - (0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2]) / 255, 0.75);
    const ib = Math.pow(1 - (0.299 * q[i] + 0.587 * q[i + 1] + 0.114 * q[i + 2]) / 255, 0.75);
    o[i] = 255 * (1 - ia); o[i + 1] = 255 * (1 - ib); o[i + 2] = 255 * (1 - Math.min(ia, ib)); o[i + 3] = 255;
  }
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  c.getContext('2d').putImageData(out, 0, 0);
  return c;
}

/* Thumbnails render only once their card scrolls into view: the rail holds dozens of presets. */
function Thumb({ g, designs, builds }) {
  const ref = useRef(null);
  useEffect(() => {
    let dead = false, io = null;
    const draw = async () => {
      const d = designs.find(x => x.id === g.design), b = builds.find(x => x.id === g.build);
      if (!d || !b) return;
      try {
        const [di, bi] = await Promise.all([designRaster(d, d.w, d.h, 'auto'), buildRaster(b, d.w, d.h)]);
        await idle();
        if (dead || !ref.current) return;
        ref.current.replaceChildren(platesCanvas(di, bi, Math.min(128 / d.w, 96 / d.h)));
      } catch (e) { /* thumbnail is optional */ }
    };
    const el = ref.current;
    if (el && typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(es => {
        if (es.some(e => e.isIntersecting)) { io.disconnect(); io = null; setTimeout(() => { if (!dead) draw(); }, 150); }
      }, { rootMargin: '120px' });
      io.observe(el);
    } else setTimeout(() => { if (!dead) draw(); }, 400);
    return () => { dead = true; if (io) io.disconnect(); };
  }, [g.id]);
  return <span className="th" ref={ref} />;
}

const Chevron = ({ dir }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d={dir === 'left' ? 'M10 3.5 5.5 8l4.5 4.5' : 'M6 3.5 10.5 8 6 12.5'} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

export default function Gallery({ designs, builds, S, isOn, onPick, open, onToggle, overlay }) {
  const algoName = id => (E.ALGOS.find(a => a.id === id) || {}).short || id;
  const [cat, setCat] = useState(() => store.get('redline.v2.cat') || 'all');
  const pickCat = c => { setCat(c); store.set('redline.v2.cat', c); };
  const current = Presets.GALLERY.find(isOn);
  if (!open) {
    return (
      <aside className="pane rail closed" aria-label="Presets">
        <button type="button" className="rail-toggle" aria-expanded="false" aria-controls="presetList" title="Show presets" onClick={onToggle}><Chevron dir="right" /></button>
        <span className="rail-label">Presets{current ? ` · ${current.title}` : ''}</span>
      </aside>
    );
  }
  const groups = Presets.CATEGORIES.filter(([id]) => cat === 'all' || cat === id)
    .map(([id, label]) => [id, label, Presets.GALLERY.filter(g => g.cat === id)]).filter(([, , list]) => list.length);
  return (
    <aside className={'pane rail open' + (overlay ? ' overlay' : '')} aria-label="Presets">
      <div className="pane-h">
        <h2 title="Each preset is a design, a build, an algorithm and a viewport, grouped by the kind of inaccuracy it plants. The selectors above pair any design with any build.">Presets</h2>
        <span className="grow" />
        <label className="rail-filter">
          <span className="sr">Kind of inaccuracy</span>
          <select value={cat} onChange={e => pickCat(e.target.value)} aria-label="Kind of inaccuracy">
            <option value="all">Every kind ({Presets.GALLERY.length})</option>
            {Presets.CATEGORIES.map(([id, label]) => <option key={id} value={id}>{label} ({Presets.GALLERY.filter(g => g.cat === id).length})</option>)}
          </select>
        </label>
        <button type="button" className="rail-toggle" aria-expanded="true" aria-controls="presetList" title="Hide presets" onClick={onToggle}><Chevron dir="left" /></button>
      </div>
      <div className="list" id="presetList">
        {groups.map(([id, label, list]) => (
          <section key={id} className="group" aria-label={label}>
            <h3>{label}</h3>
            {list.map(g => {
              const on = isOn(g);
              const b = builds.find(x => x.id === g.build);
              const d = designs.find(x => x.id === g.design);
              return (
                <button key={g.id} type="button" className="preset" aria-current={String(on)} title={g.expect || (b ? b.note : '')} onClick={() => onPick(g.id)}>
                  <Thumb g={g} designs={designs} builds={builds} />
                  <span className="t">{g.title}</span>
                  <span className="s">
                    <span className="tag">{algoName(g.algo)}</span>
                    {g.vp && g.vp !== 'native' ? <span className="tag">{g.model === 'inferred' ? 'stretch · inferred' : 'stretch'}</span> : null}
                    {d ? <span>{d.family}</span> : null}
                  </span>
                </button>
              );
            })}
          </section>
        ))}
      </div>
    </aside>
  );
}
