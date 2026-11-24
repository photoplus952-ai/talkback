/**
 * Stage: one fixed viewport holding the four scenes as stacked layers.
 *
 * Each scene is   section.scene > .cam > .art
 *   .art  – the composition in reference pixels (same size as the frame)
 *   .cam  – what the timeline animates (camera moves, depth, tilt)
 * The .art is fitted so that the scene's crop window is centred on screen.
 */
import { el } from './typography.js';

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
      const art = el('div', 'art', cam, { width: `${cfg.ref.w}px`, height: `${cfg.ref.h}px` });
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

  /** register anything with a layout() so it re-measures on resize / font load */
  part(id, p) { this.scenes.get(id).parts.push(p); return p; }

  layout(staticMode = false) {
    const vw = (this.vw = document.documentElement.clientWidth);
    const vh = (this.vh = innerHeight);
    const mobile = vw < 760 || vw / vh < 0.8;
    this.mode = mobile ? 'mobile' : 'desktop';
    document.documentElement.dataset.layout = this.mode;
    const pad = mobile ? { x: 0.035, top: 0.1, bottom: 0.12 } : { x: 0.06, top: 0.09, bottom: 0.07 };
    for (const s of this.scenes.values()) {
      const [cx, cy, cw, ch] = s.cfg.crop[this.mode];
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
  toScreen(id, x, y) {
    const { s, tx, ty } = this.scenes.get(id).fit;
    return [tx + x * s, ty + y * s];
  }

  scale(id) { return this.scenes.get(id).fit.s; }
}
