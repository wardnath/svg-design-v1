import React from 'react';
import { E, stretched } from '../pipeline.js';
import { useWidth, useImageCanvas } from '../hooks.js';
import Overlay, { OV, colorOf } from './Overlay.jsx';
import { platesCanvas } from './Gallery.jsx';
const { useState, useMemo, useEffect, useRef } = React;
const { W_, H_ } = E.geom;

const KIND_COLORS = { container: '#2a78d6', text: '#eb6834', shape: '#1baf7a', icon: '#eda100', image: '#e87ba4', rule: '#008300' };
const VIEWS = [
  ['diff', 'Diff', 'The build with what was flagged'],
  ['side', 'Side by side', 'Design and build, each annotated'],
  ['plates', 'Plates', 'Design in cyan over the build in magenta'],
  ['swipe', 'Swipe', 'Wipe between design and build'],
  ['segments', 'Segments', 'What segmentation sees on each side'],
  ['inferred', 'Inferred', 'Against constraints guessed from the export'],
];

/* Inferred constraints, in Figma's vocabulary: what each element does when the frame resizes. */
const MODES = [['stretch', 'Stretches with its slot', '#2a78d6'], ['scale', 'Scales with its track', '#8b5cf6'], ['center', 'Stays centered', '#d98a00'], ['pin', 'Pinned to an edge', '#1baf7a']];
const MODE_COLOR = Object.fromEntries(MODES.map(([k, , c]) => [k, c]));
const AXIS_X = { left: 'left', right: 'right', stretch: 'left and right', center: 'center', scale: 'scale', fit: 'scale, keeping aspect' };
const AXIS_Y = { top: 'top', bottom: 'bottom', stretch: 'top and bottom', center: 'center', scale: 'scale' };
const modeOf = m => (m.x === 'stretch' || m.y === 'stretch' ? 'stretch' : m.x === 'scale' || m.y === 'scale' || m.x === 'fit' ? 'scale' : m.x === 'center' || m.y === 'center' ? 'center' : 'pin');
const isFrame = n => n.kind === 'container' || n.kind === 'image' || n.kind === 'shape' || n.kind === 'rule';

function Constraints({ st, W, H }) {
  const items = [];
  const walk = n => { for (const c of n.children || []) { const b = st.boxes.get(c), m = st.modes.get(c); if (b && m) items.push([c, b, m]); walk(c); } };
  walk(st.seg0.root);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      {items.map(([n, b, m]) => {
        const c = MODE_COLOR[modeOf(m)], frame = isFrame(n);
        return (
          <g key={n.id} className="hit">
            <rect className="box" x={b.x0} y={b.y0} width={W_(b)} height={H_(b)} fill={frame ? 'none' : c} fillOpacity={frame ? undefined : 0.2}
              stroke={c} strokeOpacity={frame ? 1 : 0.6} strokeWidth={frame ? 1.5 : 0.75} vectorEffect="non-scaling-stroke" />
            <title>{`${E.nodeName(n)} · horizontal: ${AXIS_X[m.x] || m.x} · vertical: ${AXIS_Y[m.y] || m.y}`}</title>
          </g>
        );
      })}
    </svg>
  );
}

function Frame({ W, H, cap, plate, n = 1, children }) {
  const style = { width: `min(${W}px, 100%, calc(${n > 1 ? 66 : 72}vh * ${(W / H).toFixed(4)}))` };
  return (
    <div className="fr" style={style}>
      {cap ? <div className="cap"><i style={{ background: plate }} />{cap}</div> : null}
      <div className="canvasbox">{children}</div>
    </div>
  );
}
function Img({ img, wash }) { const ref = useImageCanvas(img, wash); return <canvas ref={ref} />; }

function HeatLayer({ heat }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c || !heat) return;
    c.width = heat.W; c.height = heat.H;
    const x = c.getContext('2d'), id = x.createImageData(heat.W, heat.H), o = id.data;
    for (let i = 0; i < heat.v.length; i++) {
      if (!heat.flag[i]) continue;
      const v = Math.max(0.25, Math.min(1, heat.v[i] * 2.2));
      o[i * 4] = 208; o[i * 4 + 1] = 59 + (1 - v) * 90; o[i * 4 + 2] = 59; o[i * 4 + 3] = 70 + 170 * v;
    }
    x.putImageData(id, 0, 0);
  }, [heat]);
  return <div className="layer"><canvas ref={ref} /></div>;
}

function Segments({ seg, W, H }) {
  const rects = [];
  const walk = n => { for (const c of n.children) { rects.push(c); walk(c); } };
  walk(seg.root);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      {rects.map(c => (
        <g key={c.id} className="hit">
          <rect className="box" x={c.box.x0} y={c.box.y0} width={W_(c.box)} height={H_(c.box)} fill={c.kind === 'text' ? 'rgba(235,104,52,0.10)' : 'none'} stroke={KIND_COLORS[c.kind] || '#000'} strokeWidth={c.kind === 'container' ? 1.5 : 1} vectorEffect="non-scaling-stroke" />
          <title>{`${E.nodeName(c)} · depth ${c.depth}${c.color ? ' · ' + E.color.hex(c.color) : ''}`}</title>
        </g>
      ))}
    </svg>
  );
}

function PlatesView({ dImg, bImg, W, H }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current && dImg && bImg) ref.current.replaceChildren(platesCanvas(dImg, bImg, 1)); }, [dImg, bImg]);
  return (
    <div className="frames"><Frame W={W} H={H} cap="Cyan prints the design, magenta the build; where both print, ink goes black" plate="#0F1318"><div ref={ref} /></Frame></div>
  );
}

function SwipeView({ dImg, bImg, W, H, swipe, setSwipe }) {
  return (
    <>
      <div className="swipe"><span>◂ design</span><input type="range" min="0" max="100" value={swipe} id="swipeRange" aria-label="Swipe position" onChange={e => setSwipe(+e.target.value)} /><span>build ▸</span></div>
      <div className="frames">
        <Frame W={W} H={H}>
          <Img img={bImg} />
          <div className="layer" style={{ clipPath: `inset(0 ${100 - swipe}% 0 0)` }}><Img img={dImg} /></div>
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"><line x1={W * swipe / 100} x2={W * swipe / 100} y1="0" y2={H} stroke="#0F1318" strokeWidth="2" vectorEffect="non-scaling-stroke" /></svg>
        </Frame>
      </div>
    </>
  );
}

/* ---------- view thumbnails: every view of the current result, small, under the canvas ---------- */
const TW = 240, TH = 150;
const fit = (W, H, tw = TW, th = TH) => { const s = Math.min(tw / W, th / H); return { s, w: Math.max(1, Math.round(W * s)), h: Math.max(1, Math.round(H * s)) }; };
function toCanvas(img) {
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  c.getContext('2d').putImageData(img, 0, 0);
  return c;
}
function ctxOf(c, w, h) { c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; return x; }
const wash = (x, w, h, a) => { x.fillStyle = `rgba(255,255,255,${a})`; x.fillRect(0, 0, w, h); };
const DRAW = {
  diff(c, { src, res, flagged }) {
    const { s, w, h } = fit(res.W, res.H), x = ctxOf(c, w, h);
    x.drawImage(src.b, 0, 0, w, h); wash(x, w, h, 0.35);
    for (const f of flagged) {
      const b = f.mBox || f.eBox; if (!b) continue;
      x.strokeStyle = colorOf(f); x.lineWidth = f.level === 'major' ? 2 : 1.25;
      x.strokeRect(b.x0 * s, b.y0 * s, Math.max(2, (b.x1 - b.x0) * s), Math.max(2, (b.y1 - b.y0) * s));
    }
  },
  side(c, { src, res, flagged }) {
    const g = 6, { s, w, h } = fit(res.W, res.H, (TW - g) / 2, TH), x = ctxOf(c, 2 * w + g, h);
    x.drawImage(src.d, 0, 0, w, h); x.drawImage(src.b, w + g, 0, w, h); wash(x, 2 * w + g, h, 0.25);
    for (const f of flagged) {
      x.strokeStyle = colorOf(f); x.lineWidth = 1.25;
      if (f.dBox) x.strokeRect(f.dBox.x0 * s, f.dBox.y0 * s, Math.max(2, (f.dBox.x1 - f.dBox.x0) * s), Math.max(2, (f.dBox.y1 - f.dBox.y0) * s));
      if (f.mBox) x.strokeRect(w + g + f.mBox.x0 * s, f.mBox.y0 * s, Math.max(2, (f.mBox.x1 - f.mBox.x0) * s), Math.max(2, (f.mBox.y1 - f.mBox.y0) * s));
    }
  },
  plates(c, { res }) {
    const { s } = fit(res.W, res.H), p = platesCanvas(res.dImg, res.bImg, s), x = ctxOf(c, p.width, p.height);
    x.drawImage(p, 0, 0);
  },
  swipe(c, { src, res }) {
    const { w, h } = fit(res.W, res.H), x = ctxOf(c, w, h);
    x.drawImage(src.b, 0, 0, w, h);
    x.save(); x.beginPath(); x.rect(0, 0, w / 2, h); x.clip(); x.drawImage(src.d, 0, 0, w, h); x.restore();
    x.fillStyle = '#0F1318'; x.fillRect(w / 2 - 1, 0, 2, h);
    x.beginPath(); x.arc(w / 2, h / 2, 6, 0, Math.PI * 2); x.fill();
  },
  segments(c, { src, res }) {
    const g = 6, { s, w, h } = fit(res.W, res.H, (TW - g) / 2, TH), x = ctxOf(c, 2 * w + g, h);
    const side = (img, seg, ox) => {
      x.drawImage(img, ox, 0, w, h); x.fillStyle = 'rgba(255,255,255,0.55)'; x.fillRect(ox, 0, w, h);
      const walk = n => { for (const k of n.children) { x.strokeStyle = KIND_COLORS[k.kind] || '#000'; x.lineWidth = k.kind === 'container' ? 1.2 : 0.8; x.strokeRect(ox + k.box.x0 * s, k.box.y0 * s, (k.box.x1 - k.box.x0) * s, (k.box.y1 - k.box.y0) * s); walk(k); } };
      walk(seg.root);
    };
    side(src.d, res.dSeg, 0); side(src.b, res.bSeg, w + g);
  },
  inferred(c, { inf, res }) {
    const { s, w, h } = fit(res.W, res.H), x = ctxOf(c, w, h);
    if (!inf) { x.fillStyle = 'rgba(127,127,127,0.12)'; x.fillRect(0, 0, w, h); return; }
    x.drawImage(inf.src, 0, 0, w, h); wash(x, w, h, 0.4);
    const walk = n => {
      for (const k of n.children || []) {
        const b = inf.st.boxes.get(k), m = inf.st.modes.get(k);
        if (b && m && isFrame(k)) { x.strokeStyle = MODE_COLOR[modeOf(m)]; x.lineWidth = 1.2; x.strokeRect(b.x0 * s, b.y0 * s, (b.x1 - b.x0) * s, (b.y1 - b.y0) * s); }
        walk(k);
      }
    };
    walk(inf.st.seg0.root);
  },
};

function ViewThumb({ id, label, hint, on, onPick, args }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current && args) DRAW[id](ref.current, args); }, [args]);
  return (
    <button type="button" className="vthumb" aria-pressed={String(on)} title={hint} onClick={onPick}>
      <span className="vt-img">{args ? <canvas ref={ref} /> : null}</span>
      <span className="vt-lab">{label}</span>
    </button>
  );
}

function ViewStrip({ res, design, view, flagged, onPick }) {
  const src = useMemo(() => (res ? { d: toCanvas(res.dImg), b: toCanvas(res.bImg) } : null), [res]);
  // the Inferred thumbnail needs the inferred stretch even while another view is on screen;
  // it is computed after a pause and cached by the pipeline, so opening the view is quick
  const [inf, setInf] = useState(null);
  useEffect(() => {
    if (!res) return undefined;
    if (res.inferred) { setInf({ src: src.d, st: res.inferred }); return undefined; }
    let dead = false;
    setInf(null);
    const t = setTimeout(async () => {
      try {
        const st = await stretched(design, res.W, res.H);
        if (dead) return;
        const native = res.W === design.w && res.H === design.h;
        setInf({ src: native ? src.d : toCanvas(st.img), st });
      } catch (e) { /* the thumbnail stays blank */ }
    }, 700);
    return () => { dead = true; clearTimeout(t); };
  }, [res, design, src]);
  const base = useMemo(() => (res ? { src, res, flagged } : null), [res, src, flagged]);
  const infArgs = useMemo(() => (res ? { res, inf } : null), [res, inf]);
  return (
    <div className="viewstrip" role="group" aria-label="View">
      {VIEWS.map(([id, label, hint]) => (
        <ViewThumb key={id} id={id} label={label} hint={hint} on={view === id} onPick={() => onPick(id)} args={id === 'inferred' ? infArgs : base} />
      ))}
    </div>
  );
}

export default function Stage({ S, set, res, err, busy, design, build, vp, model }) {
  const [matRef, width] = useWidth();
  const [hover, setHover] = useState(null);
  const algo = E.ALGOS.find(a => a.id === S.algo);
  const visible = useMemo(() => (res ? res.r.findings.filter(f => f.level !== 'ok' || (S.showOk && f.type === 'match')) : []), [res, S.showOk]);
  const fw = n => Math.min(width - 36, (width - 36 - (n - 1) * 18) / n);
  const cur = VIEWS.find(v => v[0] === S.view) || VIEWS[0];
  // Picking a view is the only thing that changes it. The Inferred view compares against the
  // inferred stretch (and the viewport strip follows); leaving it goes back to auto layout.
  const pickView = id => set(s => ({ view: id,
    stripModel: id === 'inferred' ? 'inferred' : s.view === 'inferred' ? 'auto' : s.stripModel,
    stretchModel: s.view === 'inferred' && id !== 'inferred' ? 'auto' : s.stretchModel }));
  let body = null, legend = null;
  if (err) {
    body = <div className="err"><b>Could not render this pair. </b>{err}<div style={{ marginTop: 6, color: 'var(--ink-2)', fontSize: 12.5 }}>Inline external images and fonts as data URIs, or upload a PNG screenshot of the build instead.</div></div>;
  } else if (!res) {
    body = <div className="empty">Rendering both sides at {vp.label}…</div>;
  } else {
    const { W, H, dImg, bImg } = res;
    const ovProps = { findings: visible, W, H, sel: S.sel, onSelect: id => set({ sel: id }), spot: S.spot, family: algo.family, hover, setHover };
    const stretchNote = vp.id !== 'native' ? ` at ${vp.label}${model === 'inferred' ? ' (inferred from the export)' : ' (auto layout)'}` : '';
    if (S.view === 'diff') {
      body = (
        <div className="frames">
          <Frame W={W} H={H} cap={`Build, with findings${stretchNote}`} plate={OV.build}>
            <Img img={bImg} />
            {res.r.heat ? <HeatLayer heat={res.r.heat} /> : null}
            <Overlay {...ovProps} side="diff" width={Math.min(W, fw(1))} />
          </Frame>
        </div>
      );
    } else if (S.view === 'side') {
      body = (
        <div className="frames two">
          <Frame W={W} H={H} n={2} cap={`Design${stretchNote}`} plate={OV.design}><Img img={dImg} wash={0.25} /><Overlay {...ovProps} side="design" width={fw(2)} /></Frame>
          <Frame W={W} H={H} n={2} cap={`Build at ${W}×${H}`} plate={OV.build}><Img img={bImg} wash={0.25} /><Overlay {...ovProps} side="build" width={fw(2)} /></Frame>
        </div>
      );
    } else if (S.view === 'plates') {
      body = <PlatesView dImg={dImg} bImg={bImg} W={W} H={H} />;
    } else if (S.view === 'swipe') {
      body = <SwipeView dImg={dImg} bImg={bImg} W={W} H={H} swipe={S.swipe} setSwipe={v => set({ swipe: v })} />;
    } else if (S.view === 'inferred') {
      const st = res.inferred, native = W === design.w && H === design.h;
      body = (
        <div className="frames two">
          <Frame W={W} H={H} n={2} cap={native ? `Export at ${W}×${H}, with inferred constraints` : `Design inferred at ${W}×${H}`} plate={OV.design}>
            <Img img={dImg} wash={0.35} />
            {st ? <Constraints st={st} W={W} H={H} /> : null}
          </Frame>
          <Frame W={W} H={H} n={2} cap={`Build at ${W}×${H}, with findings`} plate={OV.build}>
            <Img img={bImg} wash={0.25} />
            <Overlay {...ovProps} side="build" width={fw(2)} />
          </Frame>
        </div>
      );
    } else {
      body = (
        <div className="frames two">
          <Frame W={W} H={H} n={2} cap={`Design · ${res.dSeg.stats.nodes} nodes · ${Math.round(res.dSeg.stats.ms)} ms`} plate={OV.design}><Img img={dImg} wash={0.55} /><Segments seg={res.dSeg} W={W} H={H} /></Frame>
          <Frame W={W} H={H} n={2} cap={`Build · ${res.bSeg.stats.nodes} nodes · ${Math.round(res.bSeg.stats.ms)} ms`} plate={OV.build}><Img img={bImg} wash={0.55} /><Segments seg={res.bSeg} W={W} H={H} /></Frame>
        </div>
      );
    }
    const item = (t, c, dash, fill) => <span key={t}><i className={dash ? 'dash' : ''} style={{ borderColor: c, background: fill || 'transparent' }} />{t}</span>;
    if (S.view === 'segments') legend = [...Object.entries(KIND_COLORS).map(([k, c]) => item(k[0].toUpperCase() + k.slice(1), c)), <span key="n" className="note" title="Hover a box for its kind, size and depth.">Hover a box for its kind, size and depth.</span>];
    else if (S.view === 'inferred') {
      const t = vp.id === 'native'
        ? 'Guessed from this one export. Pick another viewport to see them applied; the build is then compared against that estimate.'
        : 'Guessed from the one export, so the design at this size is an estimate. Hover a box for its constraints.';
      legend = [...MODES.map(([, t2, c]) => item(t2, c)), <span key="n" className="note" title={t}>{t}</span>];
    }
    else if (S.view === 'plates' || S.view === 'swipe') {
      const t = S.view === 'plates' ? 'Misregistration shows as colored fringes. Fonts fringe everywhere, which is why this view alone cannot rank findings.' : 'Drag the handle to wipe between the design (left) and the build (right).';
      legend = [<span key="n" className="note" title={t}>{t}</span>];
    }
    else {
      const pix = algo.family === 'pixel';
      legend = [item('Major', OV.major, false, 'rgba(208,59,59,0.15)'), item('Minor', OV.minor, false, 'rgba(227,148,0,0.15)'),
        pix ? item('Differing pixels', OV.major, false, OV.major) : item('Where references put it', OV.design, true),
        pix ? null : item('Missing from build', OV.design, true, 'rgba(0,135,184,0.12)'), pix ? null : item('Not in design', OV.build, true, 'rgba(194,24,122,0.12)'),
        S.showOk && !pix ? item('Matched, within tolerance', OV.ok) : null,
        <span key="n" className="note" title={pix ? 'Pixel methods report regions, not elements.' : 'Arrows show only the displacement nothing explains.'}>{pix ? 'Pixel methods report regions, not elements.' : 'Arrows show only the displacement nothing explains.'}</span>].filter(Boolean);
    }
  }
  return (
    <section className="pane stage" aria-label="Stage">
      <div className="pane-h">
        <h2>{cur[1]}</h2><span className="vhint">{cur[2]}</span>
        <span className="grow" />
        <label className="opt" htmlFor="optSpot"><input type="checkbox" id="optSpot" checked={S.spot} onChange={e => set({ spot: e.target.checked })} /> Spotlight</label>
        <label className="opt" htmlFor="optOk"><input type="checkbox" id="optOk" checked={S.showOk} onChange={e => set({ showOk: e.target.checked })} /> Show matched</label>
        <span className={'busy' + (busy ? ' on' : '')} aria-hidden="true" />
      </div>
      <div className={'mat' + (busy && res ? ' dim' : '')} ref={matRef}>{body}</div>
      <div className="legend">{legend}</div>
      <ViewStrip res={res} design={design} view={S.view} flagged={res ? res.flagged || [] : []} onPick={pickView} />
    </section>
  );
}
