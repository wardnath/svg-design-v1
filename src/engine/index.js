/* Redline engine, v2. Layout registration from pixels only: segmentation →
   containment tree → per-level alignment → residual attribution → findings. */
export { DEFAULTS } from './params.js';
export { rasterize, nativeSize, groundTruth, svgSize, loadImage, svgUrl, htmlToXhtml, foreignObjectSvg } from './raster.js';
export { segment } from './segment.js';
export { ALGOS, run, evaluate } from './run.js';
export { nodeName } from './attribute.js';
export { inferStretch, synthesize, frozenShare } from './stretch.js';
import * as G from './geom.js';
import * as C from './color.js';
export const geom = G;
export const color = C;
