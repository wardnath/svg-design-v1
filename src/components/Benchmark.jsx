import React from 'react';
import SNAP from '../bench-snapshot.json';
import { E, viewportsFor } from '../pipeline.js';
import { computeBench } from '../bench.js';
const { useState, useRef } = React;

/* Benchmark: every preset build against its design. Algorithms at the design size, and the
   full method across viewports. Ships with a snapshot computed in headless Chromium when the
   page was built; "Run in this browser" recomputes it with this machine's fonts. */
export default function Benchmark({ designs, builds, S, onOpen }) {
  const [tab, setTab] = useState('algos');
  const [showSc, setShowSc] = useState(false);
  const [live, setLive] = useState(null);
  const [status, setStatus] = useState('');
  const tok = useRef(0);
  const data = live || SNAP;

  async function run() {
    const my = ++tok.current;
    const env = navigator.userAgent.replace(/\s*\(.*?\)\s*/g, ' ').slice(0, 80);
    const out = await computeBench({ designs, builds, P: S.P, env, onRow: r => { if (my === tok.current) setLive(r); }, onStatus: t => { if (my === tok.current) setStatus(t); }, cancelled: () => my !== tok.current });
    if (!out || my !== tok.current) return;
    setStatus('');
    setLive(out);
  }

  const nameOf = id => (builds.find(b => b.id === id) || { name: id }).name;
  const dOf = id => designs.find(d => d.id === id);
  const algoTotals = E.ALGOS.map(a => ({ a, t: data.algos.reduce((s, r) => ({ found: s.found + (r.cells[a.id] ? r.cells[a.id].found : 0), gt: s.gt + (r.cells[a.id] ? r.cells[a.id].gt : 0), fp: s.fp + (r.cells[a.id] ? r.cells[a.id].fp : 0) }), { found: 0, gt: 0, fp: 0 }) }));
  const maxFp = Math.max(1, ...data.algos.flatMap(r => Object.values(r.cells).map(c => c.fp)));
  const mx = Math.max(1, ...algoTotals.map(x => x.t.fp));
  return (
    <section className="section" aria-labelledby="benchTitle">
      <div className="section-h">
        <h2 id="benchTitle">Benchmark</h2>
        <div className="tabs" role="group" aria-label="Benchmark view">
          <button type="button" aria-pressed={String(tab === 'algos')} onClick={() => setTab('algos')}>Algorithms</button>
          <button type="button" aria-pressed={String(tab === 'stretch')} onClick={() => setTab('stretch')}>Stretch</button>
        </div>
        <p title="Every preset build against its own design. A finding is a hit when it overlaps a planted bug; anything else is a false alarm (FA). Dots are planted bugs, filled when found. Click any cell to open it.">
          Each build against its own design · dots are planted bugs, filled when found · FA = false alarms · click a cell to open it
        </p>
        <span className="bench-status" title={live ? '' : `Snapshot computed in ${data.env}`}>{status || (live ? (live.partial ? 'partial' : `this browser, ${new Date(live.generated).toLocaleTimeString()}`) : `snapshot ${new Date(data.generated).toLocaleDateString()}`)}</span>
        <button className="btn sm" type="button" onClick={run} disabled={!!status} title="Recompute every pair with this browser's fonts">{status ? 'Running…' : 'Run here'}</button>
      </div>
      {tab === 'algos' ? (
        <>
          <div className="matrix-wrap">
            <table className="matrix">
              <thead><tr><th>Design · build</th>{E.ALGOS.map(a => <th key={a.id} title={a.name}>{a.short}</th>)}</tr></thead>
              <tbody>
                {[...data.algos.filter(r => !r.scenario), { sep: true }, ...(showSc ? data.algos.filter(r => r.scenario) : [])].map(row => row.sep ? (
                  data.algos.some(r => r.scenario) ? (
                    <tr key="sep" className="grp">
                      <th colSpan={E.ALGOS.length + 1}>
                        <button type="button" className="grp-toggle" aria-expanded={String(showSc)} onClick={() => setShowSc(v => !v)}>
                          {showSc ? '▾' : '▸'} Single-issue scenarios · {data.algos.filter(r => r.scenario).length} builds
                        </button>
                        <small>one kind of inaccuracy per build, the rows behind the gallery’s groups{showSc ? '' : '; totals below include them'}</small>
                      </th>
                    </tr>
                  ) : null
                ) : (
                  <tr key={row.build}>
                    <th>{nameOf(row.build).replace(/^[^·]+· /, '')}<small>{(dOf(row.design) || {}).name} · {row.cells[E.ALGOS[0].id] && row.cells[E.ALGOS[0].id].gt ? `${row.cells[E.ALGOS[0].id].gt} planted` : 'clean'}</small></th>
                    {E.ALGOS.map(a => {
                      const c = row.cells[a.id];
                      if (!c) return <td key={a.id} />;
                      const cur = S.designId === row.design && S.buildId === row.build && S.algo === a.id && S.vp === 'native';
                      return (
                        <td key={a.id}>
                          <button type="button" className="cell" aria-current={String(cur)} title={`${a.name} on ${nameOf(row.build)}: found ${c.found} of ${c.gt}, ${c.fp} false alarm${c.fp === 1 ? '' : 's'}`} onClick={() => onOpen(row.design, row.build, a.id, 'native', 'auto')}>
                            <span className="dots">{c.gt ? Array.from({ length: c.gt }, (_, i) => <i key={i} className={i < c.found ? 'on' : ''} />) : <em title="No bugs planted">clean</em>}</span>
                            <span className="fp"><span className="t"><span style={{ width: `${(c.fp / maxFp) * 100}%` }} /></span><span><b>{c.fp}</b> FA</span></span>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              <tfoot><tr><th>All pairs</th>{algoTotals.map(({ a, t }) => <td key={a.id} className="mono tot"><b>{t.found}/{t.gt}</b> found<br /><b>{t.fp}</b> FA</td>)}</tr></tfoot>
            </table>
          </div>
          <div className="bars">
            <h3>False alarms summed over every pair (lower is better), with planted bugs found. Each tree column changes one thing: hierarchical matching, then ordered alignment, then flow attribution.</h3>
            {algoTotals.map(({ a, t }) => (
              <div className="barrow" key={a.id}>
                <span className="nm"><b>{a.name}</b> · {t.found}/{t.gt}</span>
                <span className="track"><span className={'b' + (a.id === S.algo ? ' me' : '')} style={{ width: `calc((100% - 52px) * ${(t.fp / mx).toFixed(4)})` }} /><span className="v">{t.fp}</span></span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="matrix-wrap">
          <table className="matrix tmatrix">
            <thead><tr><th>Design · build</th><th>Viewport</th><th>Auto layout</th><th>Inferred from export</th></tr></thead>
            <tbody>
              {data.stretch.flatMap(row => {
                const d = dOf(row.design);
                if (!d) return [];
                return viewportsFor(d).map((v, i) => {
                  const c = row.cells[v.id] || {};
                  const cell = m => {
                    const x = c[m];
                    if (!x) return <td key={m} className="mono" style={{ color: 'var(--muted)' }}>{v.id === 'native' && m === 'inferred' ? 'same as auto' : '—'}</td>;
                    return (
                      <td key={m}>
                        <button type="button" className="tcell" onClick={() => onOpen(row.design, row.build, 'viterbi-flow', v.id, m)}>
                          <span className={'verdict ' + x.verdict}><i />{x.verdict === 'pass' ? 'Pass' : x.verdict === 'review' ? 'Review' : 'Fail'}</span>
                          <span><b>{x.score}</b>%</span><span><b>{x.major}</b> major</span>
                          {x.index != null ? <span>moved {Math.round(Math.min(1, x.index) * 100)}%</span> : null}
                          {x.gt ? <span>{x.found}/{x.gt} bugs</span> : null}
                        </button>
                      </td>
                    );
                  };
                  return (
                    <tr key={row.build + v.id}>
                      {i === 0 ? <th rowSpan={viewportsFor(d).length}>{nameOf(row.build).replace(/^[^·]+· /, '')}<small>{d.name}{row.static ? ' · static copy' : ''}</small></th> : null}
                      <td className="mono">{v.label}<small style={{ display: 'block', color: 'var(--muted)', fontFamily: 'var(--font-ui)' }}>{v.hint}</small></td>
                      {cell('auto')}{cell('inferred')}
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
