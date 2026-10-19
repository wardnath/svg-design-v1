# Redline v2.4

Compare a design export (a Figma-style SVG) with the page that was built from it, using only pixels. Both sides are rasterized, segmented into a containment tree, aligned level by level, and every displacement is charged to exactly one element. A second test stretches the design to other viewport sizes and checks that the build reflows like the design instead of being a static copy of it.

The app is a single self-contained HTML page (`dist/redline-v2_4.html`). Open it, pick a preset from the rail, or add your own design and build.

## What changed in v2.4

- The collapsed inspector also lists the issues: the selected one first, with its level and severity, the element, a crop of the build with the expected position dashed, the displacement charged to it, the references that explain the rest, and its size or color change; then every other flagged issue on one line by severity. Clicking one, here or on the canvas, moves it to the top. "Open details" opens the full inspector. The collapsed column is 184px wide.

## What changed in v2.3

- The inspector starts collapsed to its summary column; open it with the chevron, and the choice is remembered from then on.

## What changed in v2.2

- The inspector collapses (the chevron in its header) to a slim column that keeps the summary in view: the score, the major, minor, missing, extra and matched counts, the stretch verdict, and planted bugs found against false alarms. The stage takes the width it gives up. On phones it folds to a one-line strip. The choice is remembered.

## What changed in v2.1

A pass for vertical space; the engine and the benchmark snapshot are unchanged from v2.
- Section headers are one line: the title, its controls, and a one-line description with the full text on hover. The benchmark's status and Run button sit in the same line.
- The inspector folds the method and inferred-stretch explanations to one line each, the score label no longer wraps, and the counts size to their content.
- Viewport cards are tighter: one-line titles, a short "Moved" meter.
- The stage legend keeps its note on the same line.
- The presets rail drops its footnote (the header carries it as a tooltip).

Versions are kept side by side: `redline-v2.zip` is v2 as published, `redline-v2_1.zip` to `redline-v2_3.zip` are v2.1 to v2.3, this is `redline-v2_4`, and later changes go to `v2_5` and on.

## What changed from v1

- **Seven full-page presets instead of three.** Each preset is a Figma-style SVG export: outlined text, layer ids, and gradients and filters in `<defs>`. Each has a responsive build, a build with planted bugs, and a variant that does not respond to the viewport. The presets are:
  - two cyber dashboards with left navigation and visual widgets;
  - a landing page;
  - a product page;
  - a docs page;
  - a kanban board;
  - a phone screen.
- **A gallery of single-issue scenarios.** 32 more builds each plant one kind of inaccuracy, and the gallery groups 60 presets by kind:
  - should pass: fonts, reflow, CSS-drawn effects, 1px rounding;
  - cascades: a taller nav (through three algorithms), a wider sidebar, an inserted banner;
  - spacing, size and type, color and shape;
  - missing and extra, order and state;
  - content: longer copy, truncated titles, a wrong icon;
  - alignment;
  - several at once, responsive, and methods compared.

  Each preset says what is planted and what the tool should report, and the inspector shows it beside the result.
- **Viewport stretch testing.** Every design can be shown at other viewport sizes:
  - **Auto layout.** Presets re-export themselves with their own layout rules, like resizing a Figma frame.
  - **Inferred.** For a single exported SVG, constraints are inferred from the export.

  The stage compares against auto layout. Its last tab, **Inferred**, compares against the inferred stretch instead and draws the inferred constraints on the design: stretches, scales, stays centered, or pinned to an edge. Hover a box for its horizontal and vertical constraint. Designs without layout rules always use the inferred stretch.

  The build is rendered at the same size and compared. A *frozen-layout index* asks whether the build moved at all where the design moved, so a static image copy fails even though it is pixel-perfect at the design size.
- **Multi-file JSX source.** Esbuild bundles it into one HTML page.
- **Engine work, driven by the new pages:**
  - Panels are recovered from shared border networks, such as an icon rail, a side panel and a header.
  - Curve-bounded charts are treated as single graphics.
  - Tight badges and pills are handled.
  - A frame that is missing is reported once, not once for each of its children.
  - A dropped element at the end of a right-aligned group is explained.
  - Boxes sized between pinned neighbours are not charged for their size.
  - Text is compared by font-independent signals: ink mass, joint height and width scaling, and a left-to-right profile.
  - Uniform gap changes in rows of boxes are flagged, once per row, even when flexible widths absorb them.
  - An inserted element (a banner, a stock note) is the only finding; what it pushes down or along is explained by it.
  - A full-width rule or band, or a full-height column, is a reference for what follows it, even across a large gap.
  - Icons come from the same set on both sides, so a swapped icon is caught by its ink pattern; digits and initials that look like icons are left out by their height.
  - A line that gained or lost words keeps its glyph size, so it is reported as longer or shorter than the font explains, not as set larger or smaller.

## Quick start

```bash
npm install
npm run build            # dist/redline-v2_4.html (React from cdnjs) and dist/preview.html (React inlined)
npm run bench            # recompute src/bench-snapshot.json in headless Chromium (about 4 minutes)
npm run assets           # optional: regenerate glyph outlines and the world map mask
```

`npm run bench` and the tests in `test/` use Playwright. Set `PLAYWRIGHT` to the path of `playwright/index.mjs` if it is not at `/opt/npm-tools/node_modules/playwright`.

## Layout

```
src/
  engine/            pixel-only diff engine (no DOM access, runs on RGBA buffers)
    raster.js        SVG and HTML → ImageData (HTML through foreignObject at the viewport size)
    segment.js       edges, regions, frames, panels, rules, ink lines and paragraphs
    order.js         XY-cut reading order
    costs.js         emission and transition costs, font scale
    align.js         per-level Viterbi with 1:k merges, rescue pass
    attribute.js     reference graph and Chu–Liu/Edmonds attribution, flow chains
    score.js         per-element severity: position, size, text, color, shape
    tree.js          the level-by-level runner, frame flattening, absorption
    stretch.js       inferred stretch (constraints from one export) and the frozen index
    pixel.js, verify.js, run.js, params.js, geom.js, color.js, assign.js
  design-kit/        what presets use to "export" SVG: outlined Inter / JetBrains Mono text,
                     Figma-style doc with defs and ids, icons, chart geometry, JSX → SVG and HTML
  presets/<id>/      data.js, layout.js (auto layout as a function of W × H),
                     design.jsx (the SVG export), build.jsx (the HTML implementation)
  components/        React UI: controls, gallery, stage and overlay, inspector, viewport strip,
                     benchmark, drawers
  pipeline.js        cached renders, segmentations, stretch models, ground truth, verdicts
  bench.js           benchmark computation shared by the page and scripts/bench.mjs
scripts/             build, bench, asset generation
test/                headless probes used while tuning (pair, crop, segviz, stretch, chains, ui)
```

## The method

1. **Rasterize.** The design SVG is drawn as an image. The build HTML is painted by the browser through `foreignObject` at the viewport size, so flexbox, grid and `vh` all apply. Everything after this sees only pixels.
2. **Segment.** Edge components alternate with regions, and a walk from the frame border gives nesting.
   - Frames are closed components with a large hole, or bands peeled off content that touches them, or the panels of a shared border network.
   - Holes bounded by curves make a chart a single graphic.
   - Long thin lines become rules, and ink groups into lines and paragraphs.
3. **Align.** Each level is put in reading order and aligned by Viterbi.
   - Emission compares kind, size, fill, frame contents and color, after removing the page-wide font scale.
   - Transitions are free when displacement is consistent or a gap is preserved.
   - Skips, text merges, an order-free rescue pass and absorption handle missing, extra, swapped and differently fused elements.
4. **Attribute.** Every element has candidate references, each an edge weighted by the residual it leaves: parent edges, the sibling it flows after, alignments, centring in free space, and gaps left by missing siblings.
   - The minimum arborescence charges each displacement once, so a taller header is one finding, not forty.
   - Rows and columns are flow chains anchored where they moved least. A chain pinned at both ends splits at its spring.
5. **Score.** Each element gets a severity from four things:
   - position residual;
   - size, excused when it follows content or neighbours;
   - text: ink mass, joint height and width scaling, line profile, and width beyond font noise;
   - color and corner radius.

   Font differences are expected: every build uses a fallback font stack, never the design's Inter.
6. **Stretch and verdict.** At each viewport the build is compared with the stretched design. The frozen-layout index compares how much the build moved with how much the design moved. Below 0.5 the layout fails as frozen whatever its score. With the inferred stretch, which only approximates the spec, a responsive build is at worst sent to review.

## Presets

| Design | Builds | Planted bugs (bug build) |
|---|---|---|
| SOC overview (dark dashboard) | grid, five bugs, fixed-pixel grid, image copy | delta color, smaller donut, wider column, two table columns swapped, pill search |
| Attack surface (light dashboard) | grid, five bugs, capped width, image copy | gauge color, swapped tiles, tight rows, dropped button, taller header |
| Landing page | container grid, five bugs, fixed width, image copy | pill button, logos packed left, lead gap, missing link, tinted stats |
| Product page | grid, five bugs, fixed image height, image copy | prices swapped, square swatches, size gap, missing warranty line, button color |
| Docs page | grid with breakpoint, five bugs, no breakpoint, image copy | light code block, missing callout, heading gap, wide sidebar, wrong active item |
| Kanban board | flex, five bugs, fixed columns, image copy | label color, column gap, missing avatar, reversed column, missing filter |
| Mobile app (390 × 844) | fluid, five bugs, fixed 390, image copy | card radius, tile height, missing chevrons, icon color, wrong active tab |

Bugs are marked in the build with `data-bug="…"`. Their boxes are read from the build's own layout at each viewport. Bugs that live in design space, such as a missing element, are mapped through the active stretch model.

### Scenario builds

One planted inaccuracy each, at the design size:

| Kind | Builds |
|---|---|
| Should pass | 1px rounding in seven spacing values (plus the clean builds of SOC, docs and landing) |
| Cascades | nav 16px taller, sidebar 28px wider, inserted 40px banner |
| Spacing | board gap +12px, lead paragraph gap +24px, size buttons 22px apart, KPI tile left padding +12px |
| Size and type | page title 28px instead of 36px, donut 30px smaller, action tiles 12px taller |
| Color and shape | delta color, cart button color, CVE label color, light code block, pill button, card corners |
| Missing and extra | dropped button, dropped callout, extra stock note, dropped chevrons |
| Order and state | swapped table columns, swapped prices, reversed column, wrong sidebar item, wrong tab |
| Content | longer button copy, titles cut off with an ellipsis, wrong icon |
| Alignment | logos packed left, heading left-aligned, Group by not pinned right |

## Benchmark (snapshot shipped with the page)

Every build is compared against its own design at the design size. A finding is a hit when it overlaps a planted bug; anything else is a false alarm.

| Algorithm | Main builds (28) | Scenarios (32) | All 60 builds |
|---|---|---|---|
| Pixel Δ | 36 / 36 · 1452 | 32 / 32 · 2062 | 68 / 68 · 3514 |
| SSIM map | 36 / 36 · 1107 | 32 / 32 · 1489 | 68 / 68 · 2596 |
| Flat boxes | 36 / 36 · 242 | 32 / 32 · 639 | 68 / 68 · 881 |
| Tree · Hungarian | 36 / 36 · 165 | 32 / 32 · 342 | 68 / 68 · 507 |
| Tree · Viterbi | 36 / 36 · 144 | 32 / 32 · 299 | 68 / 68 · 443 |
| **Tree · Viterbi + flow** | **36 / 36 · 0** | **32 / 32 · 0** | **68 / 68 · 0** |

Each cell is bugs found, then false alarms.

Viewport stretch (main builds) with auto layout behaves as follows:
- Every responsive build passes at every viewport.
- Every static image copy and frozen variant fails once the viewport differs from the design size.
- Variants that are only partly frozen pass exactly where they are still identical. Examples are the product page above 1440, where the container is capped anyway, and the docs page above its breakpoint.

The inferred stretch tells responsive builds from frozen ones through the frozen-layout index. Its scores are approximate.

## Using your own files

- **Add your own** takes an SVG export or a PNG as a design, and HTML, SVG or a PNG screenshot as a build.
- External images and web fonts do not load inside the renderer. Inline them as data URIs, or upload a screenshot.
- Your own designs have no auto-layout rules, so other viewports use the inferred stretch.

To add a preset in code:
1. Create `src/presets/<id>/` with:
   - `layout(W, H)` returning boxes;
   - a design that renders an SVG with the design kit;
   - a build that renders HTML with the same layout rules in CSS.
2. Register it in `src/presets/index.js`. An image-copy build is added automatically.
3. Run `npm run bench` and `npm run build`.

## Limits

- Detail below the edge threshold (a max-channel step of 10) is invisible to segmentation, by design. Keep low-contrast fills either clearly above it or clearly below it.
- A changed word inside a line is only caught when it changes the line's shape, length, color or profile. Copy that changes a line's length by less than about a third, after the font's own width difference, passes.
- Bordered elements less than about 5px apart touch in the edge map and are read as one border network with panels, so a gap that shrinks that far shows up as missing and extra frames rather than as a gap change.
- A font-size change of less than about 20% on a single word is within what font fallback does to a line, and passes.
- The inferred stretch guesses constraints from one frame. It handles side panes, card rows, grids, tables and plots, but it is not a spec.
- Text measurements rely on the browser's font fallback. The shipped snapshot was computed in headless Chromium on Linux. "Run in this browser" recomputes it with your fonts.
