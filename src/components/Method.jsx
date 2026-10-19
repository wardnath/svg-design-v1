import React from 'react';

const STEPS = [
  ['1 · rasterize', 'Both sides become pixels', <>The design SVG is drawn to a canvas as an image. The build HTML goes through an SVG <code>foreignObject</code> at the viewport size, so the browser lays it out (flexbox, grid, <code>vh</code> units) and paints it. The algorithms only ever receive the RGBA buffer; a PNG screenshot enters the same way.</>],
  ['2 · segment', 'Pixels become a containment tree', <>Edges are color steps from 1- and 2-pixel stencils. Edge components and the regions between them form an alternating graph; a walk from the frame border yields nesting. Frames are closed components with a large hole, a band peeled off content that touches it (tight badges, pills), or the panels of a shared border network (rail, side panel, header). Holes bounded by curves make a chart a single graphic. Long thin lines split back into rules; ink groups into lines and paragraphs.</>],
  ['3 · align', 'Viterbi per level, inside matched parents', <>Children are put in reading order and aligned by a first-order Viterbi pass: emission compares kind, size, fill and what a frame contains, against the page’s font scale; transitions are free when displacement is consistent or a gap is preserved. Skips, merges, an order-free rescue pass and a geometric absorption step cover missing, extra, swapped and differently fused elements. A frame whose contents all went missing is reported once.</>],
  ['4 · attribute', 'Each displacement is charged once', <>References (parent edges, the sibling an element flows after, a full-width rule or column it is laid out after, alignments, centring in leftover space, gaps of missing siblings, room taken by inserted ones) are edges weighted by the residual they leave; Chu–Liu/Edmonds picks the minimum arborescence, so a cascade lands on its first element. Rows and columns are flow chains anchored where they moved least, split at a spring when both ends are pinned; a row whose gaps all changed alike is charged once. A box sized between two pinned neighbours is not charged for its size; text is judged by ink mass, glyph size and its left-to-right profile, and icons by their ink pattern.</>],
  ['5 · stretch', 'The design at another viewport', <>Presets re-export themselves at any size with their own auto-layout rules, like resizing a Figma frame. For a single exported SVG, constraints are inferred: an XY-cut turns siblings into rows and columns; side panes keep width, card rows share it, items at a pane’s foot stay there, grids scale by track, plots scale; the stretched design is re-composed from the export’s own pixels with seam stretching. The inferred spec is approximate.</>],
  ['6 · verdict', 'Responsive, or a static copy?', <>At each viewport the full method compares the build with the stretched design. Independently, the share of elements that sat exactly where they sat at the design size measures whether the build responded at all: a responsive build moves as much as the design; a static copy moves nothing and fails whatever its score.</>],
];

export default function Method() {
  return (
    <section className="section" aria-labelledby="methodTitle">
      <div className="section-h"><h2 id="methodTitle">How it works</h2></div>
      <div className="method">
        {STEPS.map(([n, h, p]) => <div className="step" key={n}><div className="n">{n}</div><h3>{h}</h3><p>{p}</p></div>)}
      </div>
    </section>
  );
}
