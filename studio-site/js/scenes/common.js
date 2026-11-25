import { LAYERS } from '../layers.generated.js';
import { el } from '../core/text.js';

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

/**
 * Pointer follower: smooth, cheap (one quickTo per property, no new tweens per
 * mouse event). map(nx, ny) returns the target values, nx/ny in -1..1.
 */
export function follower(el, map, duration = 0.9) {
  const keys = Object.keys(map(0, 0));
  const q = Object.fromEntries(keys.map((k) => [k, gsap.quickTo(el, k, { duration, ease: 'power3.out' })]));
  return (nx, ny) => { const v = map(nx, ny); for (const k of keys) q[k](v[k]); };
}

/** gentle lift when the pointer is over an object */
export function hoverLift(el, vars = { scale: 1.05 }) {
  el.classList.add('hoverable');
  const back = Object.fromEntries(Object.keys(vars).map((k) => [k, k === 'scale' ? 1 : 0]));
  el.addEventListener('pointerenter', () => gsap.to(el, { ...vars, duration: 0.45, ease: 'back.out(2.2)', overwrite: false }));
  el.addEventListener('pointerleave', () => gsap.to(el, { ...back, duration: 0.7, ease: 'elastic.out(1, 0.45)', overwrite: false }));
}

/**
 * A group that holds photo layers drawn in another frame's pixels:
 * frame px = x + layerPx * scale (y measured from refY0).
 */
export function mapped(parent, cls, m) {
  const outer = el('div', 'mapped', parent, {
    transform: `translate(${m.x}px, ${m.y - (m.refY0 || 0) * m.scale}px) scale(${m.scale})`,
  });
  return el('div', `depth ${cls}`, outer);
}

/** wrap an element so pointer parallax and scroll tweens never fight */
export function depth(parent, cls = '') {
  return el('div', `depth ${cls}`, parent);
}
