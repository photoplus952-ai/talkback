import { LAYERS } from '../layers.generated.js';
import { el } from '../core/typography.js';

export const ASSET_BASE = 'assets/layers/';

/** a cut-out photo layer at its exact place in the frame */
export function photo(parent, name, cls = '') {
  const b = LAYERS[name];
  const wrap = el('div', `photo ${cls}`, parent, {
    left: `${b.x}px`, top: `${b.y}px`, width: `${b.w}px`, height: `${b.h}px`,
  });
  const img = el('img', '', wrap);
  img.alt = '';
  img.decoding = 'async';
  // scene 01 is pure type and 3D, so photos decode in the background while it plays
  img.fetchPriority = 'low';
  img.width = b.w;
  img.height = b.h;
  img.src = `${ASSET_BASE}${name}.webp`;
  return wrap;
}

/** visually hidden heading so every scene has real, accessible text */
export function srHeading(parent, text, level = 'h2') {
  const h = el(level, 'sr-only', parent);
  h.textContent = text;
  return h;
}

/** wrap an element so pointer parallax and scroll tweens never fight */
export function depth(parent, cls = '') {
  return el('div', `depth ${cls}`, parent);
}
