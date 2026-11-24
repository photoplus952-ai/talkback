/**
 * 02 THE PROCESS
 * Main type effect: TEXT REVEAL. Each letter rises from behind an invisible
 * mask line. The camera tilts down into the workspace; small objects wake up.
 */
import { word, copyBlock, tagline, badge } from '../core/typography.js';
import { COLORS } from '../config.js';
import { photo, srHeading, depth } from './common.js';

export function createProcess(stage, cfg) {
  const s = stage.add(cfg, document.getElementById('scene-process'));
  const art = s.art;
  srHeading(s.section, 'THE PROCESS — FROM STRATEGY TO EXECUTION');
  const P = (p) => stage.part(cfg.id, p);

  // workspace (photo layers)
  const desk = depth(art, 'desk-group');
  const deskImg = photo(desk, 's2-desk', 'desk-plate');
  const screen = photo(desk, 's2-screen', 'desk-screen');
  const swatches = photo(desk, 's2-swatches', 'desk-swatches');
  const notebook = photo(desk, 's2-notebook', 'desk-notebook');
  const piv = cfg.swatchPivot;
  const sb = swatches;
  const pivot = `${piv.x - parseFloat(sb.style.left)}px ${piv.y - parseFloat(sb.style.top)}px`;

  const b = P(badge(art, { ...cfg.badge, numText: cfg.index }));
  const copy = P(copyBlock(art, cfg.copy, cfg.ref.w));
  const the = P(word(art, { ...cfg.the, color: COLORS.cobalt, cls: 'masked' }));
  const proc = P(word(art, { ...cfg.word, color: COLORS.cobalt, cls: 'masked' }));
  const tag = P(tagline(art, cfg.tagline));

  function scroll(tl, T) {
    const [a0, a1] = T.t12;
    const [b0] = T.process.build;
    // camera: enter the workspace from a steep angle
    tl.fromTo(s.section, { opacity: 0 }, { opacity: 1, duration: 4, ease: 'power1.out' }, a0 + 4)
      .fromTo(s.cam, { rotateX: 34, scale: 1.22, yPercent: 14 }, {
        rotateX: 0, scale: 1, yPercent: 0, duration: a1 - a0 - 1, ease: 'power3.out',
      }, a0 + 3)
      .fromTo(desk, { opacity: 0, y: 120 }, { opacity: 1, y: 0, duration: 9, ease: 'power3.out' }, a0 + 4)
      // headline: letters rise from behind their mask
      .fromTo(the.chars, { yPercent: 108 }, { yPercent: 0, duration: 3.5, stagger: 0.45, ease: 'power4.out' }, b0 + 1)
      .fromTo(proc.chars, { yPercent: 108 }, { yPercent: 0, duration: 3.5, stagger: 0.35, ease: 'power4.out' }, b0 + 2.5)
      .fromTo(b.root, { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 2.5, ease: 'back.out(2)' }, b0 + 2)
      .fromTo(b.num.root, { opacity: 0 }, { opacity: 1, duration: 2 }, b0 + 2.6)
      .fromTo(copy.lines.map((l) => l.firstChild), { yPercent: 110 }, { yPercent: 0, duration: 3, stagger: 0.6, ease: 'power3.out' }, b0 + 5)
      .fromTo(tag.root, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 4, ease: 'power2.inOut' }, b0 + 7)
      .fromTo(tag.underline, { scaleX: 0 }, { scaleX: 1, transformOrigin: '0 50%', duration: 3.5, ease: 'power2.inOut' }, b0 + 8.5)
      // objects come alive
      .fromTo(screen, { opacity: 0, scale: 0.9, z: -80, filter: 'brightness(1.6)' }, {
        opacity: 1, scale: 1, z: 0, filter: 'brightness(1)', duration: 4.5, ease: 'power3.out',
      }, b0 + 4)
      .fromTo(swatches, { rotate: -17, transformOrigin: pivot }, { rotate: 0, duration: 5, ease: 'back.out(1.4)' }, b0 + 6)
      .fromTo(notebook, { y: 0, filter: 'drop-shadow(0 0 0 rgba(20,24,60,0))' }, {
        y: -9, filter: 'drop-shadow(4px 10px 8px rgba(20,24,60,0.18))', duration: 3, ease: 'power2.out',
      }, b0 + 7)
      .to(notebook, { y: 0, filter: 'drop-shadow(0 0 0 rgba(20,24,60,0))', duration: 4, ease: 'power2.inOut' }, b0 + 10.5);

    // 02 -> 03: the camera rushes forward with the plane
    const [c0, c1] = T.t23;
    tl.to(s.cam, { scale: 1.9, yPercent: -4, duration: c1 - c0 - 2, ease: 'power3.in' }, c0 + 1)
      .to(s.section, { opacity: 0, duration: 3.5, ease: 'power2.in' }, c0 + 5.5);
  }

  /* gentle pointer tilt on the workspace */
  function pointer(nx, ny) {
    gsap.to(desk, { rotateY: nx * 2.2, rotateX: -ny * 1.6, x: nx * 6, duration: 1.2, ease: 'power3.out', overwrite: 'auto' });
  }

  return { s, scroll, pointer, parts: { deskImg } };
}
