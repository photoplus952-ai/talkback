/**
 * Stage: one fixed viewport holding the five 1920x1080 scenes as stacked layers.
 *
 * Each scene is   section.scene > .cam > .art
 *   .art  – the composition in reference pixels (same size as the frame)
 *   .cam  – what the timeline animates (camera moves, depth, tilt)
 * The .art is fitted so that the scene's crop window is centred on screen.
 */
import { el } from './text.js';

export class Stage {
  constructor(root) {
    this.root = root;
    this.scenes = new Map();
    this.vw = innerWidth;
    this.vh = innerHeight;
    this.mode = 'desktop';
  }

  /**
   * section      – back layer (typography, photos behind the plane)
   * frontSection – optional layer stacked above the plane canvas, used when
   *                the plane must pass BEHIND an object. Same fit, same camera.
   */
  add(cfg, section, frontSection = null) {
    const mk = (sec, extra) => {
      sec.classList.add('scene', `scene-${cfg.id}`, ...extra);
      sec.dataset.scene = cfg.id;
      const cam = el('div', 'cam', sec);
      const art = el('div', 'art', cam, { width: '1920px', height: '1080px' });
      return { cam, art };
    };
    const back = mk(section, []);
    const front = frontSection ? mk(frontSection, ['scene-front']) : null;
    const s = {
      cfg, section, cam: back.cam, art: back.art,
      frontSection, frontArt: front ? front.art : back.art,
      cams: front ? [back.cam, front.cam] : [back.cam],
      sections: frontSection ? [section, frontSection] : [section],
      arts: front ? [back.art, front.art] : [back.art],
      fit: { s: 1, tx: 0, ty: 0 }, parts: [],
    };
    this.scenes.set(cfg.id, s);
    return s;
  }

  /** a named group whose position can change per layout (see cfg.layouts) */
  group(id, name, el) { const s = this.scenes.get(id); (s.groups ||= {})[name] = el; return el; }

  /** register anything with a layout() so it re-measures on resize / font load */
  part(id, p) { this.scenes.get(id).parts.push(p); return p; }

  layout(staticMode = false) {
    const vw = (this.vw = document.documentElement.clientWidth);
    const vh = (this.vh = innerHeight);
    const mobile = vw < 760 || vw / vh < 0.8;
    this.mode = mobile ? 'mobile' : 'desktop';
    document.documentElement.dataset.layout = this.mode;
    const pad = mobile ? { x: 0.035, top: 0.1, bottom: 0.12 } : { x: 0, top: 0, bottom: 0 };
    for (const s of this.scenes.values()) {
      // a layout can rearrange named groups (e.g. side-by-side on wide screens)
      const lay = (s.cfg.layouts && s.cfg.layouts[this.mode]) || null;
      s.offsets = (lay && lay.groups) || {};
      for (const [name, el] of Object.entries(s.groups || {})) {
        const [dx, dy, k = 1] = s.offsets[name] || [0, 0, 1];
        // layout wrappers are never animated by GSAP, so a plain transform is safe
        el.style.transformOrigin = '0 0';
        el.style.transform = dx || dy || k !== 1 ? `translate3d(${dx}px, ${dy}px, 0) scale(${k})` : '';
      }
      const [cx, cy, cw, ch] = (lay && lay.crop) || s.cfg.crop[this.mode] || s.cfg.crop.desktop;
      const h = staticMode ? s.section.clientHeight || vh : vh;
      const availW = vw * (1 - pad.x * 2);
      const availH = h * (1 - pad.top - pad.bottom);
      const sc = Math.min(availW / cw, availH / ch);
      const tx = vw / 2 - (cx + cw / 2) * sc;
      const ty = h * pad.top + availH / 2 - (cy + ch / 2) * sc;
      s.fit = { s: sc, tx, ty };
      s.arts.forEach((a) => { a.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${sc})`; });
      s.parts.forEach((p) => p.layout && p.layout());
    }
  }

  /** reference pixel -> viewport pixel (ignores camera animation) */
  toScreen(id, x, y, group) {
    const sc = this.scenes.get(id);
    const { s, tx, ty } = sc.fit;
    const [dx, dy, k = 1] = (group && sc.offsets && sc.offsets[group]) || [0, 0, 1];
    return [tx + (x * k + dx) * s, ty + (y * k + dy) * s];
  }

  /** extra scale a named group has in the current layout */
  groupScale(id, group) { const o = this.scenes.get(id).offsets?.[group]; return (o && o[2]) || 1; }

  scale(id) { return this.scenes.get(id).fit.s; }
}
