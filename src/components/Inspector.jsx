import React from 'react';
import { E } from '../pipeline.js';
import { colorOf, OV } from './Overlay.jsx';
const { useEffect, useRef } = React;
const { W_, H_ } = E.geom;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const fmt = (v, d = 0) => (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(v).toFixed(d);
const boxStr = b => (b ? `${Math.round(b.x0)},${Math.round(b.y0)} ${Math.round(W_(b))}×${Math.round(H_(b))}` : '—');

function Crop({ img, box, col, ghost }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c || !img || !box) return;
    const W = img.width, H = img.height, pad = 22;
    const f = ghost ? { x0: Math.min(box.x0, ghost.x0), y0: Math.min(box.y0, ghost.y0), x1: Math.max(box.x1, ghost.x1), y1: Math.max(box.y1, ghost.y1) } : box;
    const x0 = clamp(Math.floor(f.x0 - pad), 0, W - 1), y0 = clamp(Math.floor(f.y0 - pad), 0, H - 1);
    const x1 = clamp(Math.ceil(f.x1 + pad), x0 + 1, W), y1 = clamp(Math.ceil(f.y1 + pad), y0 + 1, H);
    const s = Math.min(2, 320 / (x1 - x0), 200 / (y1 - y0));
    c.width = Math.max(1, Math.round((x1 - x0) * s)); c.height = Math.max(1, Math.round((y1 - y0) * s));
    const src = document.createElement('canvas'); src.width = W; src.height = H; src.getContext('2d').putImageData(img, 0, 0);
    const x = c.getContext('2d');
    x.imageSmoothingQuality = 'high';
    x.drawImage(src, x0, y0, x1 - x0, y1 - y0, 0, 0, c.width, c.height);
    const rr = (b, color, dash) => { x.save(); x.strokeStyle = color; x.lineWidth = 2; if (dash) x.setLineDash([5, 4]); x.strokeRect((b.x0 - x0) * s, (b.y0 - y0) * s, W_(b) * s, H_(b) * s); x.restore(); };
    if (ghost) rr(ghost, OV.design, true);
    rr(box, col, false);
  }, [img, box, col, ghost]);
  return <canvas ref={ref} />;
}

function Detail({ f, res }) {
  const col = colorOf(f);
  const lvl = f.type === 'missing' || f.type === 'frame-missing' ? 'missing' : f.type === 'extra' || f.type === 'frame-extra' ? 'extra' : f.level;
  const note = t => <p className="algo-note" style={{ margin: 0 }}>{t}</p>;
  const dcp = f.decomp;
  return (
    <div className="detail" aria-live="polite">
      <div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="pill"><span className={'sw ' + lvl} />{f.level === 'ok' ? 'ok' : f.level}</span>
          <h3>{f.title}</h3>
        </div>
        <div className="sub">{f.name}{f.rescued ? ' · paired by the order-free rescue pass' : ''}{f.merged ? ' · merged blocks' : ''}</div>
      </div>
      <div className="crops">
        <div className="crop"><div className="cap"><i style={{ background: OV.design }} />Design</div>{f.dBox ? <Crop img={res.dImg} box={f.dBox} col={OV.design} /> : <div className="none">Not in the design</div>}</div>
        <div className="crop"><div className="cap"><i style={{ background: OV.build }} />Build</div>
          {f.mBox ? <Crop img={res.bImg} box={f.mBox} col={col} ghost={dcp && f.level !== 'ok' ? f.eBox : null} /> : f.eBox ? <Crop img={res.bImg} box={f.eBox} col={OV.design} /> : <div className="none">Not found in the build</div>}
        </div>
      </div>
      {f.type === 'pixel' && note('Pixel methods have no notion of an element. This region differs, but nothing says whether it is a font, a shift inherited from above, or a real defect.')}
      {f.type === 'missing' && note('No element in the build aligns with this one. The dashed box on the build is where its parent and its predecessor in the flow would put it.')}
      {f.type === 'frame-missing' && note('The frame (fill or border) is gone, but its children were found one level up, so they were matched there instead of being charged as missing.')}
      {f.type === 'extra' && note('Present in the build, unmatched in the design. Elements below it that only moved because of it are explained by flowing below it.')}
      {f.type === 'frame-extra' && note('The build wraps these children in a frame the design does not have. The children were matched one level up.')}
      {dcp && (
        <>
          <table className="dec">
            <caption>Displacement of the top-left corner, px</caption>
            <tbody>
              <tr><th /><td style={{ color: 'var(--muted)' }}>x</td><td style={{ color: 'var(--muted)' }}>y</td></tr>
              {[['Total, design → build', dcp.abs], ['Inherited from parent', dcp.inherited], ['Explained by references', dcp.explained], ['Charged to this element', dcp.residual, 'charged']].map(([l, v, c]) => (
                <tr key={l} className={c || ''}><th>{l}</th><td>{fmt(v.dx)}</td><td>{fmt(v.dy)}</td></tr>
              ))}
            </tbody>
          </table>
          <div className="refs">
            <div><span>↔</span><span>x explained by <code>{dcp.refX}</code></span></div>
            <div><span>↕</span><span>y explained by <code>{dcp.refY}</code></span></div>
          </div>
        </>
      )}
      {f.size && (
        <dl className="kv">
          <dt>Design box</dt><dd>{boxStr(f.dBox)}</dd>
          <dt>Build box</dt><dd>{boxStr(f.mBox)}</dd>
          {f.size.note ? <><dt>Size</dt><dd>{f.size.note}</dd></> : null}
          {f.size.explained ? <><dt>Excused</dt><dd>{f.size.explained}</dd></> : null}
        </dl>
      )}
      {f.color && f.color.d && f.color.m && (
        <div className="swatches">
          <span><i style={{ background: E.color.hex(f.color.d) }} />{E.color.hex(f.color.d)}</span><span>→</span>
          <span><i style={{ background: E.color.hex(f.color.m) }} />{E.color.hex(f.color.m)}</span><span>ΔE {f.color.de.toFixed(1)}</span>
        </div>
      )}
      {f.parts && (
        <div className="meters">
          {Object.entries(f.parts).map(([k, v]) => (
            <div className="meter" key={k}>
              <span>{k}</span>
              <span className="track"><span className="fill" style={{ width: `${clamp(v / 4, 0, 1) * 100}%`, background: v >= 2.5 ? OV.major : v >= 1 ? OV.minor : 'var(--muted)' }} /><span className="tick" style={{ left: '25%' }} /><span className="tick" style={{ left: '62.5%' }} /></span>
              <output>{v.toFixed(2)}</output>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* The selected issue in the collapsed inspector: what it is, where, and why it was charged. */
function MiniDetail({ f, res, onOpen }) {
  const col = colorOf(f);
  const lvl = f.type === 'missing' || f.type === 'frame-missing' ? 'missing' : f.type === 'extra' || f.type === 'frame-extra' ? 'extra' : f.level;
  const d = f.decomp;
  const moved = d && (Math.abs(d.residual.dx) >= 2 || Math.abs(d.residual.dy) >= 2);
  return (
    <div className="mini-sel" style={{ borderLeftColor: col }}>
      <div className="ms-h"><span className="pill"><span className={'sw ' + lvl} />{f.level === 'ok' ? 'ok' : lvl === f.level ? f.level : lvl}</span><span className="grow" /><span className="sv">{f.sev.toFixed(1)}</span></div>
      <div className="ms-t">{f.title}</div>
      <div className="ms-n">{f.name}</div>
      <div className="ms-crop">
        {f.mBox ? <Crop img={res.bImg} box={f.mBox} col={col} ghost={d && f.level !== 'ok' ? f.eBox : null} />
          : f.eBox ? <Crop img={res.bImg} box={f.eBox} col={OV.design} />
          : f.dBox ? <Crop img={res.dImg} box={f.dBox} col={OV.design} /> : null}
      </div>
      {moved ? <div className="ms-k"><span>charged</span><b>{fmt(d.residual.dx)}, {fmt(d.residual.dy)} px</b></div> : null}
      {d ? <div className="ms-k" title={`x explained by ${d.refX}; y explained by ${d.refY}`}><span>by</span><b>{d.refX === d.refY ? d.refX : `${d.refX} · ${d.refY}`}</b></div> : null}
      {f.size && f.size.note && f.type !== 'size' && (f.issues || []).includes('size') ? <div className="ms-k"><span>size</span><b>{f.size.note}</b></div> : null}
      {f.type === 'color' && f.color && f.color.d && f.color.m ? (
        <div className="ms-k"><span>color</span><b className="ms-sw"><i style={{ background: E.color.hex(f.color.d) }} />→<i style={{ background: E.color.hex(f.color.m) }} />ΔE {Math.round(f.color.de)}</b></div>
      ) : null}
      {onOpen ? <button type="button" className="ms-open" onClick={onOpen}>Open details</button> : null}
    </div>
  );
}

const Chevron = ({ dir }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d={dir === 'left' ? 'M10 3.5 5.5 8l4.5 4.5' : 'M6 3.5 10.5 8 6 12.5'} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

export default function Inspector({ S, set, res, err, design, build, vp, model, preset, presetCat, open = true, onToggle }) {
  const a = E.ALGOS.find(x => x.id === S.algo);
  const pix = a.family === 'pixel';
  const cnt = (cls, label, n) => <span className="count" key={label}><span className={'sw ' + cls} /><b>{n}</b>{label}</span>;
  const scoreLab = r => (pix ? (r.algo === 'pixel' ? 'Pixels identical' : 'Mean SSIM') : 'Conformance');
  // collapsed: a slim column (a strip on phones) that keeps the summary in view
  if (!open) {
    const r = res && res.r, c = r && r.counts, ev = res && res.ev, vd = res && res.verdict;
    // the selected issue first, with more about it; the rest, one line each, by severity
    const flagged = (res && res.flagged) || [];
    const sel = flagged.find(x => x.id === S.sel) || flagged[0];
    const rest = flagged.filter(x => x !== sel), CAP = 60;
    return (
      <aside className="pane insp closed" aria-label="Inspector, collapsed">
        <button type="button" className="rail-toggle insp-toggle" aria-expanded="false" title="Show the inspector" onClick={onToggle}><Chevron dir="left" /></button>
        {r ? (
          <div className="mini">
            <div className="mini-score" title={`${scoreLab(r)} at ${res.W}×${res.H}`}><div className="score">{r.score.toFixed(1)}<small>%</small></div><div className="lab">{scoreLab(r)}</div></div>
            <div className="mini-counts">
              {cnt('major', 'Major', c.major)}{cnt('minor', 'Minor', c.minor)}
              {!pix && cnt('missing', 'Missing', c.missing)}{!pix && cnt('extra', 'Extra', c.extra)}{!pix && cnt('ok', 'Matched', c.ok)}
            </div>
            {vp.id !== 'native' && vd ? <span className={'verdict ' + vd.level} title={vd.note || ''}><i />{vd.label}</span> : null}
            {ev && ev.gt ? <div className="mini-ev" title={ev.labels.join('\n')}><b>{ev.found}/{ev.gt}</b> bugs · <b>{ev.fp}</b> FA</div> : null}
            {sel ? <MiniDetail f={sel} res={res} onOpen={onToggle} /> : <div className="mini-empty">Nothing flagged.</div>}
            {rest.length ? (
              <ul className="mini-list" aria-label="Other findings">
                {rest.slice(0, CAP).map(x => (
                  <li key={x.id}>
                    <button type="button" className="mini-item" title={`${x.title} · ${x.name}`} onClick={() => set({ sel: x.id })}>
                      <span className="bar" style={{ background: colorOf(x) }} /><span className="ttl">{x.title}</span><span className="sv">{x.sev.toFixed(1)}</span>
                    </button>
                  </li>
                ))}
                {rest.length > CAP ? <li className="mini-more">+{rest.length - CAP} more in the full inspector</li> : null}
              </ul>
            ) : null}
          </div>
        ) : <div className="mini-empty">{err ? 'No result' : 'Rendering…'}</div>}
      </aside>
    );
  }
  const head = (
    <div className="pane-h"><h2>Inspector</h2><span className="grow" /><span className="tag">{a.name}</span>
      {onToggle ? <button type="button" className="rail-toggle insp-toggle" aria-expanded="true" title="Collapse the inspector to its summary" onClick={onToggle}><Chevron dir="right" /></button> : null}
    </div>
  );
  if (err) return <aside className="pane insp" aria-label="Inspector">{head}<div className="empty">No result for this pair.</div></aside>;
  if (!res) return <aside className="pane insp" aria-label="Inspector">{head}<div className="empty">Rendering both sides…</div></aside>;
  const { r, ev, flagged, verdict: vd, frozen: fr } = res;
  const c = r.counts;
  const f = r.findings.find(x => x.id === S.sel);
  return (
    <aside className="pane insp" aria-label="Inspector">
      {head}
      <div className="summary">
        <div className="score">{r.score.toFixed(1)}<small>%</small></div>
        <div className="counts">
          {cnt('major', 'Major', c.major)}{cnt('minor', 'Minor', c.minor)}
          {!pix && cnt('missing', 'Missing', c.missing)}{!pix && cnt('extra', 'Extra', c.extra)}{!pix && cnt('ok', 'Matched', c.ok)}
        </div>
        <div className="lab" title={`At ${res.W}×${res.H}`}>{scoreLab(r)}</div>
      </div>
      {preset && preset.expect ? (
        <div className="scenario">
          <div className="sc-h">{presetCat ? <span className="tag">{presetCat}</span> : null}<b>{preset.title}</b></div>
          {build.note ? <p className="sc-n">{build.note}</p> : null}
          <p className="sc-e"><b>Expect. </b>{preset.expect}</p>
        </div>
      ) : null}
      {vp.id !== 'native' && (
        <div className="evalline" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {vd && <span className={'verdict ' + vd.level}><i />{vd.label}</span>}
            <span>Stretched to <b>{vp.label}</b> · design {model === 'auto' ? 'auto layout' : 'inferred'}</span>
          </div>
          {fr && (
            <div className="respo">
              <span>Moved like the design</span>
              <span className="track"><i style={{ width: `${Math.min(1, fr.index) * 100}%`, background: fr.index >= 0.75 ? 'var(--sev-ok)' : fr.index >= 0.5 ? 'var(--sev-minor)' : 'var(--sev-major)' }} /></span>
              <output>{Math.round(Math.min(1, fr.index) * 100)}%</output>
              <span style={{ gridColumn: '1 / -1', color: 'var(--muted)', fontSize: 11.5 }}>{Math.round(fr.build * 100)}% of the build sat exactly where it sat at {design.w}×{design.h}; for the design it was {Math.round(fr.design * 100)}%.</span>
            </div>
          )}
        </div>
      )}
      {ev && ev.gt ? (
        <div className="evalline">
          <span>Planted bugs found <b>{ev.found}/{ev.gt}</b></span><span>·</span><span>False alarms <b>{ev.fp}</b></span>
          <span className="dots" title={ev.labels.join('\n')}>{ev.labels.map(l => <i key={l} className={ev.hitLabels.has(l) ? 'on' : ''} title={l} />)}</span>
        </div>
      ) : ev && vp.id === 'native' ? (
        <div className="evalline"><span>No bugs planted</span><span>·</span><span>False alarms <b>{ev.fp}</b></span></div>
      ) : !ev && build.design !== (design.origin || design.id) ? <div className="evalline">This build was made for a different design, so there is no ground truth for this pairing.</div> : null}
      {model === 'inferred' && vp.id !== 'native' && (
        <details className="note-d modelnote"><summary><b>Inferred stretch</b> · an estimate of the design at this size</summary>
          The design at this size is estimated from the one exported frame: panes keep width, card rows share it, items stick to their nearer edge, tables move column by column. Ambiguous spots (flexible middles, fixed versus fr columns) can raise findings a real resized frame would not.
        </details>
      )}
      <details className="note-d algo-note"><summary><b>{a.name}</b> · how it decides what to flag</summary>{a.blurb}</details>
      {!flagged.length ? (
        <div className="empty"><b>Nothing flagged. </b>{pix ? 'No region crosses the threshold.' : `All ${c.ok} matched elements sit within tolerance once parent and flow references are accounted for.`}</div>
      ) : (
        <ul className="flist" aria-label="Findings">
          {flagged.map(x => (
            <li key={x.id}>
              <button type="button" className="fitem" aria-current={String(x.id === S.sel)} onClick={() => set({ sel: x.id })}>
                <span className="bar" style={{ background: colorOf(x) }} />
                <span className="ttl">{x.title}</span>
                <span className="sv">{x.sev.toFixed(1)}</span>
                <span className="nm">{x.type === 'pixel' ? boxStr(x.mBox) : `${x.name} · ${boxStr(x.mBox || x.dBox)}`}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {f && f.level !== 'ok' || (f && S.showOk) ? <Detail f={f} res={res} /> : null}
    </aside>
  );
}
