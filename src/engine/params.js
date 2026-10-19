/* ---------------- defaults ---------------- */
const DEFAULTS = {
  edgeT: 10,          // max-channel step that counts as an edge
  kH: 0.9,            // word/line merge: horizontal gap ≤ kH × glyph height
  kV: 0.45,           // line→paragraph merge: vertical gap ≤ kV × line height (lists stay separate)
  posTol: 6,          // px of unexplained displacement that is still fine
  textPosMul: 1.5,    // text gets extra slack (ascender/line-box differences between fonts)
  textSizeTol: 0.6,   // text ink mass may differ by ±60% (font fallback, weight); reflow is free
  sizeTol: 6,         // px (or 5%) for boxes
  colorTol: 12,       // ΔE76 for fills
  textColorTol: 24,   // ΔE76 for text ink (anti-aliasing, weight)
  transTau: 24,       // px that make one unit of positional cost in matching
  gapBase: 1.4,       // cost to leave an element unmatched
  resetPen: 0.4,      // cost of re-anchoring to the parent mid-sequence
  posPrior: 0.05,     // tie-breaking parent-relative prior inside the emission cost
  window: 6,          // max consecutive skips between linked matches
  merges: true,       // allow 2:1 / 1:2 text block merges
  rescue: true,       // order-free second pass for leftovers (swaps, wraps)
  rescueMax: 2.0,
  flatten: true,      // splice children of unmatched frames into the parent level
  pixT: 40,           // pixel diff threshold (0–255)
  ssimT: 0.72,        // SSIM below this is flagged
};

export { DEFAULTS };
