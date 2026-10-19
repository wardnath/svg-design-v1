/* Compute pipeline shared by the app and the benchmark: renders, segmentations, stretch
   models, ground truth and runs, each cached by what it depends on. */
import * as E from './engine/index.js';

const C = { svg: new Map(), raster: new Map(), seg: new Map(), gt: new Map(), stretch: new Map() };
const memo = (m, k, f) => { if (!m.has(k)) { const v = f(); m.set(k, v); if (v && v.catch) v.catch(() => m.delete(k)); } return m.get(k); };
const segKey = P => `${P.edgeT}|${P.kH}|${P.kV}`;

export function viewportsFor(d) {
  const mobile = d.w < 640;
  if (mobile) {
    return [
      { id: 'native', label: `${d.w}×${d.h}`, hint: 'Design size', w: d.w, h: d.h },
      { id: 'small', label: `360×${Math.round(d.h * 0.93)}`, hint: 'Smaller phone', w: 360, h: Math.round(d.h * 0.93) },
      { id: 'large', label: `430×${Math.round(d.h * 1.1)}`, hint: 'Larger phone', w: 430, h: Math.round(d.h * 1.1) },
      { id: 'tablet', label: `${Math.round(d.w * 1.5)}×${Math.round(d.h * 1.25)}`, hint: 'Much wider', w: Math.round(d.w * 1.5), h: Math.round(d.h * 1.25) },
    ];
  }
  return [
    { id: 'native', label: `${d.w}×${d.h}`, hint: 'Design size', w: d.w, h: d.h },
    { id: 'narrow', label: `${Math.round(d.w * 0.85)}×${d.h}`, hint: 'Narrower', w: Math.round(d.w * 0.85), h: d.h },
    { id: 'wide', label: `${Math.round(d.w * 1.25)}×${d.h}`, hint: 'Wider', w: Math.round(d.w * 1.25), h: d.h },
    { id: 'big', label: `${Math.round(d.w * 1.25)}×${Math.round(d.h * 1.25)}`, hint: 'Wider and taller', w: Math.round(d.w * 1.25), h: Math.round(d.h * 1.25) },
    { id: 'huge', label: `${Math.round(d.w * 1.5)}×${Math.round(d.h * 1.2)}`, hint: 'Much wider', w: Math.round(d.w * 1.5), h: Math.round(d.h * 1.2) },
  ];
}

export const svgOf = (d, W, H) => memo(C.svg, `${d.id}@${W}x${H}`, () => (d.render ? d.render({ W, H }) : d.src));
const srcOfDesign = (d, W, H) => (d.kind === 'image' ? { type: 'image', url: d.src } : { type: 'svg', text: svgOf(d, W, H) });
export const htmlOf = b => memo(C.svg, `html:${b.id}`, () => (b.make ? b.make() : b.src));
const srcOfBuild = b => (b.kind === 'image' ? { type: 'image', url: b.src } : { type: b.kind === 'svg' ? 'svg' : 'html', text: htmlOf(b) });

export function designRaster(d, W, H, model) {
  const native = W === d.w && H === d.h;
  if (native || (model === 'auto' && d.render)) return memo(C.raster, `d:${d.id}@${W}x${H}`, () => E.rasterize(srcOfDesign(d, W, H), W, H));
  return memo(C.raster, `d:${d.id}@${W}x${H}|inferred`, async () => {
    const st = await stretched(d, W, H);
    return st.img;
  });
}
export const buildRaster = (b, W, H) => memo(C.raster, `b:${b.id}@${W}x${H}`, () => E.rasterize(srcOfBuild(b), W, H));
export async function segOf(img, key, P) {
  return memo(C.seg, `${key}|${segKey(P)}`, () => E.segment(img, P));
}
const DEF = E.DEFAULTS;
/* The inferred stretch of a design: constraints read off the native export's segmentation. */
export function stretched(d, W, H) {
  return memo(C.stretch, `${d.id}@${W}x${H}`, async () => {
    const img0 = await designRaster(d, d.w, d.h, 'auto');
    const s0 = await segOf(img0, `d:${d.id}@${d.w}x${d.h}`, DEF);
    const st = E.inferStretch(s0, W, H);
    return { img: E.synthesize(s0, img0, st.boxes, W, H), boxes: st.boxes, modes: st.modes, seg0: s0 };
  });
}

/* Ground truth: [data-bug] boxes from the build's own layout at this size, plus bugs that
   live in design space (a missing element) mapped to this size by the active stretch model. */
export async function groundTruth(d, b, W, H, model) {
  if (b.kind !== 'html' || b.design !== (d.origin || d.id)) return null;
  const marks = await memo(C.gt, `${b.id}@${W}x${H}`, () => E.groundTruth(htmlOf(b), W, H).catch(() => []));
  const extra = [];
  // presets describe boxes as {x, y, w, h}; the engine works in {x0, y0, x1, y1}
  const at = (m, L) => { const r = m.at(L); return r && r.w != null ? E.geom.B(r.x, r.y, r.x + r.w, r.y + r.h) : r; };
  for (const m of b.missing || []) {
    let box = null;
    if (W === d.w && H === d.h) box = at(m, d.layout(d.w, d.h));
    else if (model === 'auto' && d.layout) box = at(m, d.layout(W, H));
    else {
      const b0 = at(m, d.layout(d.w, d.h));
      const st = await stretched(d, W, H);
      let best = null, bestA = 0;
      for (const n of st.seg0.nodes) {
        const I = E.geom.INTER(n.box, b0);
        const a = I ? E.geom.AREA(I) / E.geom.AREA(b0) : 0;
        if (a >= 0.6 && (!best || E.geom.AREA(n.box) < E.geom.AREA(best.box))) { best = n; bestA = a; }
      }
      const nb = best && st.boxes.get(best);
      box = nb ? E.geom.SHIFT(b0, nb.x0 - best.box.x0, nb.y0 - best.box.y0) : b0;
    }
    if (box) extra.push({ label: m.label, box, space: 'design' });
  }
  // a build of this design with nothing planted still has ground truth: every flag is a false alarm
  return marks.concat(extra);
}

/* One comparison: design (at the viewport, by the stretch model) vs build at the viewport. */
export async function compare({ d, b, W, H, model, algo, P }) {
  const dImg = await designRaster(d, W, H, model);
  const bImg = await buildRaster(b, W, H);
  const dKey = `d:${d.id}@${W}x${H}${(W !== d.w || H !== d.h) && !(model === 'auto' && d.render) ? '|inferred' : ''}`;
  const [dSeg, bSeg] = await Promise.all([segOf(dImg, dKey, P), segOf(bImg, `b:${b.id}@${W}x${H}`, P)]);
  const gt = await groundTruth(d, b, W, H, model);
  const r = E.run(algo, dSeg, bSeg, dImg, bImg, P);
  const ev = gt ? E.evaluate(r.findings, gt) : null;
  return { dImg, bImg, dSeg, bSeg, r, gt, ev, W, H };
}

/* How much of a layout stayed exactly where it was at the native size. */
export async function frozen(d, b, W, H, model, P) {
  if (W === d.w && H === d.h) return null;
  const segAt = async (img, key) => segOf(img, key, P);
  const d0 = await segAt(await designRaster(d, d.w, d.h, 'auto'), `d:${d.id}@${d.w}x${d.h}`);
  const b0 = await segAt(await buildRaster(b, d.w, d.h), `b:${b.id}@${d.w}x${d.h}`);
  const dKey = `d:${d.id}@${W}x${H}${!(model === 'auto' && d.render) ? '|inferred' : ''}`;
  const d1 = await segAt(await designRaster(d, W, H, model), dKey);
  const b1 = await segAt(await buildRaster(b, W, H), `b:${b.id}@${W}x${H}`);
  const fd = E.frozenShare(d0, d1), fb = E.frozenShare(b0, b1);
  const moveD = Math.max(0.05, 1 - fd), moveB = 1 - fb;
  return { design: fd, build: fb, index: Math.max(0, Math.min(1.2, moveB / moveD)) };
}

/* Pass, review or fail. A layout that stayed put where the design moved fails outright. With an
   auto-layout design the stretched spec is exact, so the score decides; a spec inferred from a
   single export is approximate (it guesses constraints), so there a responsive build is at
   worst sent to review and only a frozen layout fails. */
export function verdict(res, fr, model = 'auto') {
  if (!res) return null;
  const { counts, score } = res.r;
  const stuck = fr && fr.index < 0.5;
  if (stuck) return { level: 'fail', label: 'Frozen layout', note: `Only ${Math.round(fr.index * 100)}% as responsive as the design` };
  if (counts.major === 0 && score >= 97) return { level: 'pass', label: 'Pass' };
  if (model === 'inferred' && fr) {
    return score >= 90 && counts.major <= 3 ? { level: 'pass', label: 'Pass', note: 'Against an inferred stretch' } : { level: 'review', label: 'Review', note: 'Responds like the design; the inferred stretch is approximate, so check the findings' };
  }
  if (counts.major <= 3 && score >= 90) return { level: 'review', label: 'Review' };
  return { level: 'fail', label: 'Fail' };
}

export function clearCaches(which) {
  for (const k of which || Object.keys(C)) C[k].clear();
}
export { E };
