import React from 'react';
import { E } from '../pipeline.js';

export default function Controls({ designs, builds, design, build, S, set, vps, vp, onDesign, onAdd }) {
  const lineage = design.origin || design.id;
  const own = builds.filter(b => b.design === lineage), other = builds.filter(b => b.design !== lineage);
  return (
    <section className="controls" aria-label="What to compare">
      <label className="field f-design"><span>Design</span>
        <span className="sel"><i style={{ background: 'var(--plate-d)' }} />
          <select id="selDesign" aria-label="Design" value={design.id} onChange={e => onDesign(e.target.value)}>
            {designs.map(d => <option key={d.id} value={d.id}>{d.name + (d.builtin ? '' : ' · yours')}</option>)}
          </select>
        </span>
      </label>
      <label className="field f-build"><span>Build</span>
        <span className="sel"><i style={{ background: 'var(--plate-m)' }} />
          <select id="selBuild" aria-label="Build" value={build.id} onChange={e => set({ buildId: e.target.value, presetId: null, sel: null })}>
            <optgroup label="Built for this design">{own.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</optgroup>
            {other.length ? <optgroup label="Other builds (mix and match)">{other.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</optgroup> : null}
          </select>
        </span>
      </label>
      {/* chips where there is room, a menu where there is not: the bar stays one row */}
      <div className="field f-algo"><span>Algorithm</span>
        <div className="chips algo-chips" role="group" aria-label="Algorithm">
          {E.ALGOS.map(a => (
            <button key={a.id} type="button" className="chip" title={`${a.name}. ${a.blurb}`} aria-pressed={String(a.id === S.algo)} onClick={() => set({ algo: a.id, presetId: null })}>{a.short}</button>
          ))}
        </div>
        <span className="sel algo-select">
          <select aria-label="Algorithm" value={S.algo} onChange={e => set({ algo: e.target.value, presetId: null })}>
            {E.ALGOS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </span>
      </div>
      <div className="field f-vp"><span>Viewport</span>
        <div className="vp vp-chips" role="group" aria-label="Viewport">
          {vps.map(v => (
            <button key={v.id} type="button" aria-pressed={String(v.id === vp.id)} title={v.hint} onClick={() => set({ vp: v.id, presetId: null })}>{v.label}</button>
          ))}
        </div>
        <span className="sel vp-select">
          <select aria-label="Viewport" value={vp.id} onChange={e => set({ vp: e.target.value, presetId: null })}>
            {vps.map(v => <option key={v.id} value={v.id} title={v.hint}>{v.label}</option>)}
          </select>
        </span>
      </div>
      <div className="ctl-end">
        <button className="btn icon" type="button" title="Tune the engine's parameters" aria-label="Tune" aria-pressed={String(S.drawer === 'tune')} onClick={() => set({ drawer: S.drawer === 'tune' ? null : 'tune' })}>
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 4h7M12 4h2M2 12h3M8 12h6M10.5 2.5v3M6.5 10.5v3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        </button>
        <button className="btn icon" type="button" title="Edit the source of this design and build" aria-label="Source" aria-pressed={String(S.drawer === 'source')} onClick={() => set({ drawer: S.drawer === 'source' ? null : 'source' })}>
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M5.5 4.5 2 8l3.5 3.5M10.5 4.5 14 8l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <button className="btn solid" type="button" title="Add your own design or build" onClick={onAdd}>
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>Add
        </button>
      </div>
    </section>
  );
}
