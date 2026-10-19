import React from 'react';
import * as Presets from './presets/index.js';
import { E, compare, frozen, verdict, viewportsFor, clearCaches, stretched } from './pipeline.js';
import { store, idle, useToast, useMedia } from './hooks.js';
import Header from './components/Header.jsx';
import Controls from './components/Controls.jsx';
import Gallery from './components/Gallery.jsx';
import Stage from './components/Stage.jsx';
import Inspector from './components/Inspector.jsx';
import Translation from './components/Translation.jsx';
import Benchmark from './components/Benchmark.jsx';
import TuneDrawer from './components/TuneDrawer.jsx';
import SourceDrawer from './components/SourceDrawer.jsx';
import AddDialog from './components/AddDialog.jsx';
import Method from './components/Method.jsx';

const { useState, useEffect, useMemo, useRef, useCallback } = React;
const SAVE_KEY = 'redline.v2.custom';
const VIEW_KEY = 'redline.v2.view';
const INSP_KEY = 'redline.v2.inspOpen';
const VIEW_IDS = ['diff', 'side', 'plates', 'swipe', 'segments', 'inferred'];

function loadCustom() {
  const s = store.get(SAVE_KEY) || {};
  return { designs: s.designs || [], builds: s.builds || [] };
}

export default function App() {
  const custom = useMemo(loadCustom, []);
  const [designs, setDesigns] = useState(() => Presets.DESIGNS.map(d => ({ ...d, builtin: true })).concat(custom.designs));
  const [builds, setBuilds] = useState(() => Presets.BUILDS.map(b => ({ ...b, builtin: true })).concat(custom.builds));
  const first = Presets.GALLERY.find(g => g.id === (location.hash || '').slice(1)) || Presets.GALLERY[0];
  const [S, setS] = useState({
    designId: first.design, buildId: first.build, algo: first.algo, vp: first.vp || 'native', stripModel: first.model || 'auto',
    view: VIEW_IDS.includes(store.get(VIEW_KEY)) ? store.get(VIEW_KEY) : 'diff', stretchModel: first.model || 'auto', presetId: first.id, P: { ...E.DEFAULTS }, spot: true, showOk: false, sel: null, swipe: 50, drawer: null, modal: false,
  });
  const set = useCallback(patch => setS(s => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) })), []);
  const [toast, showToast] = useToast();
  // the presets rail: a column on wide screens (open unless the viewer closed it), a drawer
  // over the stage on medium ones, a collapsible block above the stage on phones
  const medium = useMedia('(max-width: 1240px) and (min-width: 881px)'), phone = useMedia('(max-width: 880px)');
  const [railPref, setRailPref] = useState(() => { const v = store.get('redline.v2.rail'); return v == null ? true : !!v; });
  const [railDrawer, setRailDrawer] = useState(false);
  const railOpen = medium || phone ? railDrawer : railPref;
  // the inspector starts folded to its summary column (a strip on phones); opening or folding
  // it again is remembered
  const [inspOpen, setInspOpen] = useState(() => !!store.get(INSP_KEY));
  const toggleInsp = () => setInspOpen(o => { store.set(INSP_KEY, !o); return !o; });
  const toggleRail = () => { if (medium || phone) setRailDrawer(o => !o); else setRailPref(o => { store.set('redline.v2.rail', !o); return !o; }); };
  useEffect(() => {
    if (!railDrawer) return undefined;
    const esc = e => { if (e.key === 'Escape') setRailDrawer(false); };
    addEventListener('keydown', esc);
    return () => removeEventListener('keydown', esc);
  }, [railDrawer]);

  const design = designs.find(d => d.id === S.designId) || designs[0];
  const build = builds.find(b => b.id === S.buildId) || builds[0];
  const vps = useMemo(() => viewportsFor(design), [design]);
  const vp = vps.find(v => v.id === S.vp) || vps[0];
  const canAuto = !!design.render;
  // The view is only ever changed by picking it. What the stage compares against at another
  // size is separate: the preset's own auto layout, or the stretch inferred from the export when
  // the Inferred view is open, when a preset or a benchmark cell asks for it, or when the design
  // has no layout rules at all.
  const model = !canAuto || S.view === 'inferred' || S.stretchModel === 'inferred' ? 'inferred' : 'auto';
  const stripModel = canAuto ? S.stripModel : 'inferred';
  useEffect(() => { store.set(VIEW_KEY, S.view); }, [S.view]);
  // the gallery preset the current selection matches, if any (for its scenario note); at the
  // design size both stretch models are the export itself, so only stretched presets check it
  const presetMatches = useCallback(g => S.designId === g.design && S.buildId === g.build && S.algo === g.algo && S.vp === (g.vp || 'native') &&
    ((g.vp || 'native') === 'native' || model === (g.model || 'auto')), [S.designId, S.buildId, S.algo, S.vp, model]);
  const activePreset = Presets.GALLERY.find(presetMatches);

  /* ---- current comparison ---- */
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const tok = useRef(0);
  useEffect(() => {
    const my = ++tok.current;
    setBusy(true);
    (async () => {
      try {
        await idle();
        const out = await compare({ d: design, b: build, W: vp.w, H: vp.h, model, algo: S.algo, P: S.P });
        const fr = await frozen(design, build, vp.w, vp.h, model, S.P);
        if (my !== tok.current) return;
        out.flagged = out.r.findings.filter(f => f.level !== 'ok').sort((a, b) => b.sev - a.sev);
        out.frozen = fr;
        out.verdict = verdict(out, fr, model);
        if (model === 'inferred') out.inferred = await stretched(design, vp.w, vp.h);
        if (my !== tok.current) return;
        out.key = `${design.id}|${build.id}|${vp.w}x${vp.h}|${model}|${S.algo}`;
        setRes(out); setErr(null);
        setS(s => {
          if (s.sel && out.r.findings.some(f => f.id === s.sel)) return s;
          const moved = out.flagged.find(f => f.type === 'position');
          return { ...s, sel: moved ? moved.id : out.flagged[0] ? out.flagged[0].id : null };
        });
      } catch (e) {
        if (my !== tok.current) return;
        setErr(e && e.message ? e.message : String(e)); setRes(null);
      }
      if (my === tok.current) setBusy(false);
    })();
  }, [design, build, vp.w, vp.h, model, S.algo, S.P]);

  /* ---- translation strip: every viewport for this pair, full method ---- */
  const [trans, setTrans] = useState({ key: '', rows: {} });
  const ttok = useRef(0);
  useEffect(() => {
    const my = ++ttok.current;
    const key = `${design.id}|${build.id}|${stripModel}`;
    setTrans({ key, rows: {} });
    (async () => {
      await new Promise(r => setTimeout(r, 400));
      for (const v of vps) {
        if (my !== ttok.current) return;
        try {
          const out = await compare({ d: design, b: build, W: v.w, H: v.h, model: stripModel, algo: 'viterbi-flow', P: S.P });
          const fr = await frozen(design, build, v.w, v.h, stripModel, S.P);
          if (my !== ttok.current) return;
          const row = { vp: v, score: out.r.score, counts: out.r.counts, verdict: verdict(out, fr, stripModel), frozen: fr, bImg: out.bImg, flagged: out.r.findings.filter(f => f.level !== 'ok'), ev: out.ev };
          setTrans(t => (t.key === key ? { key, rows: { ...t.rows, [v.id]: row } } : t));
        } catch (e) {
          setTrans(t => (t.key === key ? { key, rows: { ...t.rows, [v.id]: { vp: v, error: e.message || String(e) } } } : t));
        }
        await idle();
      }
    })();
  }, [design, build, stripModel, S.P, vps]);

  /* ---- actions ---- */
  const loadPreset = useCallback(id => {
    const g = Presets.GALLERY.find(x => x.id === id);
    if (!g) return;
    set(s => ({ designId: g.design, buildId: g.build, algo: g.algo, vp: g.vp || 'native', presetId: g.id, sel: null,
      stretchModel: g.model || 'auto', stripModel: g.model || 'auto' }));
    setRailDrawer(false);
    try { history.replaceState(null, '', '#' + g.id); } catch (e) { /* ignore */ }
  }, [set]);
  const saveCustom = (ds, bs) => store.set(SAVE_KEY, {
    designs: ds.filter(d => !d.builtin && (d.kind !== 'image' || d.src.length < 1500000)).map(({ render, layout, ...rest }) => rest),
    builds: bs.filter(b => !b.builtin && (b.kind !== 'image' || b.src.length < 1500000)).map(({ make, ...rest }) => rest),
  });
  const addItem = useCallback((kind, item) => {
    if (kind === 'design') {
      const ds = designs.concat(item); setDesigns(ds); saveCustom(ds, builds);
      set({ designId: item.id, presetId: null, vp: 'native' });
    } else {
      const bs = builds.concat(item); setBuilds(bs); saveCustom(designs, bs);
      set({ buildId: item.id, presetId: null });
    }
    clearCaches(['seg']);
    showToast(`Added “${item.name}”`);
  }, [designs, builds, set, showToast]);
  const editSource = useCallback((kind, text) => {
    if (kind === 'design') {
      const cur = design;
      const it = { id: 'u' + Date.now(), name: cur.name.replace(/ \(edited\)$/, '') + ' (edited)', kind: 'svg', src: text, w: cur.w, h: cur.h, origin: cur.origin || cur.id, layout: cur.layout };
      try { const s = E.svgSize(text); it.w = s.w; it.h = s.h; } catch (e) { showToast(e.message); return; }
      addItem('design', it);
    } else {
      const it = { id: 'u' + Date.now(), name: build.name.replace(/ \(edited\)$/, '') + ' (edited)', kind: build.kind === 'image' ? 'html' : build.kind, src: text, design: build.design, missing: build.missing };
      addItem('build', it);
    }
  }, [design, build, addItem, showToast]);

  const selectDesign = id => {
    const d = designs.find(x => x.id === id);
    const lineage = d.origin || d.id;
    const own = builds.find(b => b.design === lineage);
    set(s => ({ designId: id, presetId: null, vp: 'native', buildId: builds.find(b => b.id === s.buildId).design === lineage || !own ? s.buildId : own.id, sel: null }));
  };

  return (
    <div className="wrap">
      <Header />
      <Controls
        designs={designs} builds={builds} design={design} build={build} S={S} set={set} vps={vps} vp={vp}
        onDesign={selectDesign} onAdd={() => set({ modal: true })} />
      {S.drawer === 'tune' && <TuneDrawer P={S.P} setP={P => set({ P })} />}
      {S.drawer === 'source' && <SourceDrawer design={design} build={build} onApply={editSource} />}
      <main className={'bench' + (railOpen ? '' : ' rail-closed') + (inspOpen ? '' : ' insp-closed')}>
        <Gallery designs={designs} builds={builds} S={S} isOn={presetMatches} onPick={loadPreset} open={railOpen} onToggle={toggleRail} overlay={medium} />
        {/* the middle column carries the stage and everything after it, so nothing waits for the
            inspector to end; the rail and the inspector stay in view beside it */}
        <div className="center">
          <Stage S={S} set={set} res={res} err={err} busy={busy} design={design} build={build} vp={vp} model={model} />
          <Translation design={design} build={build} vps={vps} vp={vp} trans={trans} model={stripModel} canAuto={canAuto}
            onPick={id => set({ vp: id, presetId: null, stretchModel: stripModel })} onModel={m => set({ stripModel: m })} />
          <Benchmark designs={designs} builds={builds} S={S} onOpen={(d, b, algo, vpId, m) => { set({ designId: d, buildId: b, algo, vp: vpId || 'native', presetId: null, sel: null, stretchModel: m === 'inferred' ? 'inferred' : 'auto', stripModel: m === 'inferred' ? 'inferred' : 'auto' }); document.querySelector('.stage') && document.querySelector('.stage').scrollIntoView({ behavior: 'smooth', block: 'start' }); }} />
          <Method />
        </div>
        <Inspector S={S} set={set} res={res} err={err} design={design} build={build} vp={vp} model={model} preset={activePreset} presetCat={activePreset ? (Presets.CATEGORIES.find(c => c[0] === activePreset.cat) || [])[1] : null} open={inspOpen} onToggle={toggleInsp} />
      </main>
      {S.modal && <AddDialog design={design} onClose={() => set({ modal: false })} onAdd={(k, it) => { set({ modal: false }); addItem(k, it); }} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
