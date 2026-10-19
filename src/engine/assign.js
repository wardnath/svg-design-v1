/* ---------------- Hungarian (min-cost assignment) ---------------- */
function hungarian(cost) {
  const n = cost.length, m = cost[0].length, INF = 1e18;
  const u = new Float64Array(n + 1), v = new Float64Array(m + 1);
  const p = new Int32Array(m + 1), way = new Int32Array(m + 1);
  const minv = new Float64Array(m + 1), used = new Uint8Array(m + 1);
  for (let i = 1; i <= n; i++) {
    p[0] = i; let j0 = 0;
    minv.fill(INF); used.fill(0);
    do {
      used[j0] = 1;
      const i0 = p[j0], row = cost[i0 - 1];
      let delta = INF, j1 = 0;
      for (let j = 1; j <= m; j++) if (!used[j]) {
        const cur = row[j - 1] - u[i0] - v[j];
        if (cur < minv[j]) { minv[j] = cur; way[j] = j0; }
        if (minv[j] < delta) { delta = minv[j]; j1 = j; }
      }
      for (let j = 0; j <= m; j++) if (used[j]) { u[p[j]] += delta; v[j] -= delta; } else minv[j] -= delta;
      j0 = j1;
    } while (p[j0] !== 0);
    do { const j1 = way[j0]; p[j0] = p[j1]; j0 = j1; } while (j0);
  }
  const ans = new Int32Array(n).fill(-1);
  for (let j = 1; j <= m; j++) if (p[j]) ans[p[j] - 1] = j - 1;
  return ans;
}
function assign(A, Bn, costFn, delFn, insFn) {
  const n = A.length, m = Bn.length;
  if (!n || !m) return { pairs: [], delA: A.slice(), insB: Bn.slice() };
  const N = n + m, BIG = 1e9;
  const C = [];
  for (let i = 0; i < N; i++) {
    const row = new Float64Array(N);
    for (let j = 0; j < N; j++) {
      if (i < n && j < m) row[j] = costFn(A[i], Bn[j]);
      else if (i < n) row[j] = j - m === i ? delFn(A[i]) : BIG;
      else if (j < m) row[j] = i - n === j ? insFn(Bn[j]) : BIG;
      else row[j] = 0;
    }
    C.push(row);
  }
  const a = hungarian(C);
  const pairs = [], delA = [], used = new Uint8Array(m);
  for (let i = 0; i < n; i++) {
    if (a[i] >= 0 && a[i] < m) { pairs.push([A[i], Bn[a[i]]]); used[a[i]] = 1; }
    else delA.push(A[i]);
  }
  const insB = Bn.filter((_, j) => !used[j]);
  return { pairs, delA, insB };
}

export { hungarian, assign };
