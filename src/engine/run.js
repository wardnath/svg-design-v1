import { hungarianAlign, viterbiAlign } from './align.js';
import { estimateTextScale } from './costs.js';
import { AREA, GROW, INTER, clamp } from './geom.js';
import { DEFAULTS } from './params.js';
import { runPixel, runSSIM } from './pixel.js';
import { runFlat, runTree } from './tree.js';

/* ---------------- registry ---------------- */
const ALGOS = [
  { id: 'pixel', name: 'Pixel Δ', short: 'Pixel Δ', family: 'pixel', blurb: 'Per-pixel max-channel difference, blobbed into regions. The baseline everyone starts with: fonts and any shift light up everything.' },
  { id: 'ssim', name: 'SSIM map', short: 'SSIM', family: 'pixel', blurb: 'Windowed structural similarity on luminance. Smarter about contrast, still blind to structure: a 24px shift is a full-page failure.' },
  { id: 'flat', name: 'Flat boxes', short: 'Flat', family: 'box', blurb: 'Segment both renders, flatten every box, solve one global assignment, score absolute coordinates. Every descendant of a moved element is charged again.' },
  { id: 'tree', name: 'Tree · Hungarian', short: 'Tree', family: 'box', blurb: 'Match level by level inside matched parents, score children relative to their parent. Removes parent double jeopardy; siblings in a flow still cascade.' },
  { id: 'viterbi', name: 'Tree · Viterbi', short: 'Viterbi', family: 'box', blurb: 'Same tree, but each level is a monotone Viterbi alignment over reading order with flow-aware transitions, skips and 2:1 text merges. Residuals still parent-relative.' },
  { id: 'viterbi-flow', name: 'Tree · Viterbi + flow', short: 'Viterbi + flow', family: 'box', blurb: 'Full method. Each element is charged only for the displacement no layout reference explains: its parent, the sibling it flows after, a neighbour it was aligned with, the gap a missing sibling left. Rows and columns form flow chains anchored where they moved least. Containers may grow with their content and text may reflow.' },
];

function run(algoId, segD, segM, imgD, imgM, Pin) {
  const P = Object.assign({}, DEFAULTS, Pin || {});
  const t0 = performance.now();
  let findings, heat = null, score = null;
  if (algoId === 'pixel' || algoId === 'ssim') {
    const r = algoId === 'pixel' ? runPixel(imgD, imgM, { P }) : runSSIM(imgD, imgM, { P });
    findings = r.findings; heat = r.heat; score = r.score;
  } else {
    const pass = Q => algoId === 'flat'
      ? runFlat(segD, segM, { P: Q, flow: false })
      : runTree(segD, segM, { P: Q, flow: algoId === 'viterbi-flow', verify: algoId === 'viterbi-flow', imgD, imgM, align: algoId === 'tree' ? hungarianAlign : viterbiAlign });
    findings = pass(P);
    const ts = estimateTextScale(findings);
    if (ts) { P.ts = ts; findings = pass(P); }
  }
  findings.forEach((f, i) => { f.id = i + 1; });
  const flagged = findings.filter(f => f.level !== 'ok');
  if (score === null) {
    // area-weighted conformance over design leaves + extras
    let tot = 0, bad = 0;
    for (const f of findings) {
      const b = f.dBox || f.mBox;
      const w = Math.sqrt(Math.max(16, AREA(b)));
      tot += w;
      bad += w * clamp((f.sev - 0.8) / 2.5, 0, 1);
    }
    score = tot ? 100 * (1 - bad / tot) : 100;
  }
  const counts = { major: 0, minor: 0, ok: 0, missing: 0, extra: 0 };
  for (const f of findings) {
    counts[f.level]++;
    if (f.level !== 'ok' && (f.type === 'missing' || f.type === 'frame-missing')) counts.missing++;
    if (f.level !== 'ok' && (f.type === 'extra' || f.type === 'frame-extra')) counts.extra++;
  }
  return { algo: algoId, findings, flagged, heat, score, counts, ms: performance.now() - t0, P };
}

/* ---------------- evaluation ---------------- */
function overlapsGT(b, g) {
  const I = INTER(GROW(b, 1), GROW(g, 6));
  if (!I) return false;
  const a = AREA(I);
  return a >= 0.5 * AREA(b) || a >= 0.5 * AREA(g);
}
/* Ground truth is a set of labelled bugs, each with one or more boxes (a swapped table column
   marks every cell it moved). A bug is found when any finding overlaps any of its boxes; a
   flagged finding that overlaps no bug box is a false alarm. */
function evaluate(findings, gt) {
  const flagged = findings.filter(f => f.level !== 'ok');
  const labels = [...new Set(gt.map(g => g.label))];
  const hitLabels = new Set();
  let tp = 0;
  for (const f of flagged) {
    let any = false;
    for (const g of gt) {
      const boxes = g.space === 'design' ? [f.dBox, f.eBox] : [f.mBox, f.eBox, f.type === 'missing' ? f.dBox : null];
      if (boxes.some(b => b && overlapsGT(b, g.box))) { any = true; hitLabels.add(g.label); }
    }
    if (any) tp++;
    f.gtHit = any;
  }
  const n = labels.length;
  const recall = n ? hitLabels.size / n : null;
  const precision = flagged.length ? tp / flagged.length : (n ? 0 : 1);
  const f1 = n && (recall + precision) > 0 ? 2 * recall * precision / (recall + precision) : null;
  return { gt: n, found: hitLabels.size, flagged: flagged.length, tp, fp: flagged.length - tp, recall, precision, f1, labels, hitLabels };
}

export { ALGOS, run, overlapsGT, evaluate };
