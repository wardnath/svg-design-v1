import { assign } from './assign.js';
import { KIND_GROUP, emission, gapCost, parentResidual, plausibleMerge, transCost } from './costs.js';
import { H_, OVL, UNIONS, W_ } from './geom.js';

/* ---------------- per-level aligners ---------------- */
const mkUnit = (dn, mn) => ({ d: dn, m: mn, db: UNIONS(dn.map(x => x.box)), mb: UNIONS(mn.map(x => x.box)) });
const sameLine = nodes => nodes.every(n => OVL(n.box.y0, n.box.y1, nodes[0].box.y0, nodes[0].box.y1) > 0.5 * Math.min(H_(n.box), H_(nodes[0].box)));
const rep = nodes => {
  if (nodes.length === 1) return nodes[0];
  const wsum = nodes.reduce((a, n) => a + (n.px || 1), 0);
  const palette = nodes.every(n => n.palette) ? nodes.flatMap(n => n.palette.map(([c, w]) => [c, w * (n.px || 1) / wsum])) : null;
  return {
    kind: nodes.every(n => KIND_GROUP[n.kind] === 'ink') ? 'text' : nodes[0].kind, color: nodes[0].color, palette,
    lines: nodes.every(n => (n.lines || 1) === 1) && sameLine(nodes) ? 1 : 2, px: nodes.reduce((a, n) => a + (n.px || 0), 0) || null,
  };
};

function hungarianAlign(D, M, Pd, Pm, P) {
  const cost = (d, m) => {
    const r = parentResidual(d.box, m.box, Pd.box, Pm.box);
    return emission(d, m, d.box, m.box, P) + Math.min(5, Math.hypot(r.x, r.y) / P.transTau);
  };
  const r = assign(D, M, cost, d => gapCost(d, P) + 1.2, m => gapCost(m, P) + 1.2);
  return { units: r.pairs.map(([d, m]) => mkUnit([d], [m])), delD: r.delA, insM: r.insB };
}

function viterbiAlign(D, M, Pd, Pm, P) {
  const n = D.length, k = M.length;
  if (!n || !k) return { units: [], delD: D.slice(), insM: M.slice() };
  const K = n * k > 2500 ? Math.min(4, P.window) : P.window;
  const INF = 1e18;
  const maxMerge = !P.merges ? 1 : n * k > 2500 ? 2 : 3;
  const types = [[1, 1]];
  for (let q = 2; q <= maxMerge; q++) types.push([q, 1], [1, q]);
  const T = types.length, S = (n + 1) * (k + 1);
  const idx = (i, j) => i * (k + 1) + j;
  const dp = types.map(() => new Float64Array(S).fill(INF));
  const bpR = types.map(() => new Uint8Array(S));
  const bpI = types.map(() => new Int32Array(S)), bpJ = types.map(() => new Int32Array(S)), bpT = types.map(() => new Int8Array(S));
  const cache = types.map(() => new Array(S));
  const Rv = new Float64Array(S).fill(INF), Rop = new Int8Array(S).fill(-1);
  const gd = D.map(x => gapCost(x, P)), gm = M.map(x => gapCost(x, P));
  const GD = new Float64Array(n + 1), GM = new Float64Array(k + 1);
  for (let i = 0; i < n; i++) GD[i + 1] = GD[i] + gd[i];
  for (let j = 0; j < k; j++) GM[j + 1] = GM[j] + gm[j];
  function unit(t, i, j) {
    const id = idx(i, j);
    if (cache[t][id] !== undefined) return cache[t][id];
    const [a, b] = types[t];
    const dn = D.slice(i - a, i), mn = M.slice(j - b, j);
    let u = null;
    const many = a > 1 ? dn : b > 1 ? mn : null;
    if (!many || plausibleMerge(many)) {
      u = mkUnit(dn, mn);
      const pr = parentResidual(u.db, u.mb, Pd.box, Pm.box);
      const st = Math.min(4, Math.hypot(pr.x, pr.y) / P.transTau);
      u.st = st;
      let e = emission(rep(dn), rep(mn), u.db, u.mb, P) + P.posPrior * Math.min(1.5, st);
      if (many) {
        // A merge is only plausible when the union on one side has the shape of the single box
        // on the other, after the page-wide font scale is taken out.
        const ts = P.ts || { w: 0, h: 0 };
        const lw = Math.abs(Math.log(Math.max(1, W_(u.mb)) / Math.max(1, W_(u.db))) - ts.w);
        const lh = Math.abs(Math.log(Math.max(1, H_(u.mb)) / Math.max(1, H_(u.db))) - ts.h);
        e += 0.35 * (many.length - 1) + 0.15 + 2.2 * (Math.max(0, lw - 0.12) + Math.max(0, lh - 0.12));
      }
      u.e = e;
    }
    cache[t][id] = u;
    return u;
  }
  Rv[0] = 0;
  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= k; j++) {
      const id = idx(i, j);
      for (let t = 0; t < T; t++) {
        const [a, b] = types[t];
        if (i < a || j < b) continue;
        const u = unit(t, i, j);
        if (!u) continue;
        const i0 = i - a, j0 = j - b;
        let best = Rv[idx(i0, j0)] + u.st + (i0 > 0 || j0 > 0 ? P.resetPen : 0);
        let fromR = 1, bi = 0, bj = 0, bt = 0;
        for (let pi = i0; pi >= Math.max(1, i0 - K); pi--) {
          for (let pj = j0; pj >= Math.max(1, j0 - K); pj--) {
            const gaps = (GD[i0] - GD[pi]) + (GM[j0] - GM[pj]);
            if (gaps >= best) continue;
            const pid = idx(pi, pj);
            for (let pt = 0; pt < T; pt++) {
              const v = dp[pt][pid];
              if (v >= INF) continue;
              const c = v + gaps + transCost(cache[pt][pid], u, P, i0 > pi ? D.slice(pi, i0) : null, j0 > pj ? M.slice(pj, j0) : null);
              if (c < best) { best = c; fromR = 0; bi = pi; bj = pj; bt = pt; }
            }
          }
        }
        dp[t][id] = u.e + best;
        bpR[t][id] = fromR; bpI[t][id] = bi; bpJ[t][id] = bj; bpT[t][id] = bt;
      }
      if (i === 0 && j === 0) continue;
      let rb = INF, op = -1;
      if (i > 0 && Rv[idx(i - 1, j)] + gd[i - 1] < rb) { rb = Rv[idx(i - 1, j)] + gd[i - 1]; op = 0; }
      if (j > 0 && Rv[idx(i, j - 1)] + gm[j - 1] < rb) { rb = Rv[idx(i, j - 1)] + gm[j - 1]; op = 1; }
      for (let t = 0; t < T; t++) if (dp[t][id] < rb) { rb = dp[t][id]; op = 2 + t; }
      Rv[id] = rb; Rop[id] = op;
    }
  }
  const units = [], delD = [], insM = [];
  let i = n, j = k, mode = 0, t = 0, guard = 0;
  while ((i > 0 || j > 0) && guard++ < 100000) {
    if (mode === 0) {
      const op = Rop[idx(i, j)];
      if (op === 0) { delD.push(D[i - 1]); i--; }
      else if (op === 1) { insM.push(M[j - 1]); j--; }
      else { mode = 1; t = op - 2; }
    } else {
      const id = idx(i, j);
      units.push(cache[t][id]);
      const [a, b] = types[t];
      const i0 = i - a, j0 = j - b;
      if (bpR[t][id]) { i = i0; j = j0; mode = 0; }
      else {
        const pi = bpI[t][id], pj = bpJ[t][id];
        for (let x = pi; x < i0; x++) delD.push(D[x]);
        for (let y = pj; y < j0; y++) insM.push(M[y]);
        t = bpT[t][id]; i = pi; j = pj;
      }
    }
  }
  units.reverse();
  return { units, delD, insM };
}

function rescue(res, Pd, Pm, P) {
  if (!res.delD.length || !res.insM.length) return;
  const cost = (d, m) => {
    const r = parentResidual(d.box, m.box, Pd.box, Pm.box);
    return emission(d, m, d.box, m.box, P) + 0.35 * Math.min(6, Math.hypot(r.x, r.y) / P.transTau);
  };
  const r = assign(res.delD, res.insM, cost, () => P.rescueMax, () => P.rescueMax);
  for (const [d, m] of r.pairs) { const u = mkUnit([d], [m]); u.rescued = true; res.units.push(u); }
  res.delD = r.delA; res.insM = r.insB;
}

export { mkUnit, sameLine, rep, hungarianAlign, viterbiAlign, rescue };
