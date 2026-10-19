import React from 'react';
import { E } from '../pipeline.js';
const { useState, useEffect, useRef } = React;

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

export default function TuneDrawer({ P, setP }) {
  const [local, setLocal] = useState(P);
  const t = useRef(0);
  useEffect(() => setLocal(P), [P]);
  const change = (k, v) => {
    const next = { ...local, [k]: v };
    setLocal(next);
    clearTimeout(t.current);
    t.current = setTimeout(() => setP(next), 250);
  };
  return (
    <section className="drawer" aria-label="Parameters">
      <div className="tune">
        {SLIDERS.map(s => s.h ? <h4 key={s.h}>{s.h}</h4> : (
          <div className="slider" key={s.k}>
            <label htmlFor={'p-' + s.k}>{s.label}</label>
            <output>{local[s.k]}{s.unit ? ' ' + s.unit : ''}</output>
            <input type="range" id={'p-' + s.k} min={s.min} max={s.max} step={s.step} value={local[s.k]} onChange={e => change(s.k, +e.target.value)} />
            <small>{s.note}</small>
          </div>
        ))}
        <div className="toggles">
          {[['merges', '2:1 text merges'], ['rescue', 'Order-free rescue pass'], ['flatten', 'Flatten unmatched frames']].map(([k, label]) => (
            <label key={k} htmlFor={'t-' + k}><input type="checkbox" id={'t-' + k} checked={!!local[k]} onChange={e => change(k, e.target.checked)} />{label}</label>
          ))}
          <button className="btn ghost" type="button" onClick={() => { setLocal({ ...E.DEFAULTS }); setP({ ...E.DEFAULTS }); }}>Reset to defaults</button>
        </div>
      </div>
    </section>
  );
}
