import React from 'react';
import { OV, colorOf } from './Overlay.jsx';
const { useEffect, useRef } = React;

function Thumb({ row }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c || !row || !row.bImg) return;
    const img = row.bImg, s = Math.min(240 / img.width, 160 / img.height);
    c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
    const src = document.createElement('canvas'); src.width = img.width; src.height = img.height; src.getContext('2d').putImageData(img, 0, 0);
    const x = c.getContext('2d');
    x.imageSmoothingQuality = 'high';
    x.drawImage(src, 0, 0, c.width, c.height);
    x.fillStyle = 'rgba(255,255,255,0.35)'; x.fillRect(0, 0, c.width, c.height);
    for (const f of row.flagged || []) {
      const b = f.mBox || f.eBox; if (!b) continue;
      x.strokeStyle = colorOf(f); x.lineWidth = f.level === 'major' ? 1.6 : 1;
      x.strokeRect(b.x0 * s, b.y0 * s, (b.x1 - b.x0) * s, (b.y1 - b.y0) * s);
    }
  }, [row]);
  return <canvas ref={ref} />;
}

export default function Translation({ design, build, vps, vp, trans, model, canAuto, onPick, onModel }) {
  return (
    <section className="section trans" aria-labelledby="transTitle">
      <div className="section-h">
        <h2 id="transTitle">Viewport stretch</h2>
        <div className="seg2" role="group" aria-label="Design at other sizes">
          <button type="button" aria-pressed={String(model === 'auto')} disabled={!canAuto} onClick={() => onModel('auto')}>Auto layout</button>
          <button type="button" aria-pressed={String(model === 'inferred')} onClick={() => onModel('inferred')}>Inferred</button>
        </div>
        <p title={`The build is rendered at each viewport and compared with the design at that size, either re-exported by its own auto layout or inferred from the single export. A static copy passes at ${design.w}×${design.h} and fails everywhere else.`}>
          The build at each viewport against the design at that size · a static copy passes only at {design.w}×{design.h}
        </p>
      </div>
      <div className="trans-grid">
        {vps.map(v => {
          const row = trans.rows[v.id];
          return (
            <button key={v.id} type="button" className="tcard" aria-current={String(v.id === vp.id)} onClick={() => onPick(v.id)}>
              <span className="tt"><b>{v.label}</b><span>{v.hint}</span></span>
              <span className="thumb">{row && row.bImg ? <Thumb row={row} /> : <span className="pending">{row && row.error ? 'Could not render' : 'Rendering…'}</span>}</span>
              {row && !row.error ? (
                <>
                  <span className="nums">
                    {row.verdict && <span className={'verdict ' + row.verdict.level}><i />{row.verdict.label}</span>}
                    <span><b>{row.score.toFixed(1)}</b>%</span>
                    <span><b>{row.counts.major}</b> major</span>
                    {row.ev && row.ev.gt ? <span><b>{row.ev.found}/{row.ev.gt}</b> bugs</span> : null}
                  </span>
                  {row.frozen ? (
                    <span className="respo">
                      <span title="How much the build moved where the design moved">Moved</span>
                      <span className="track"><i style={{ width: `${Math.min(1, row.frozen.index) * 100}%`, background: row.frozen.index >= 0.75 ? 'var(--sev-ok)' : row.frozen.index >= 0.5 ? 'var(--sev-minor)' : 'var(--sev-major)' }} /></span>
                      <output>{Math.round(Math.min(1, row.frozen.index) * 100)}%</output>
                    </span>
                  ) : <span className="nums" style={{ color: 'var(--muted)' }}>Reference size</span>}
                </>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
