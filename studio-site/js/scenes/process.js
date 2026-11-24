/**
 * 02 THE PROCESS
 * Main type effect: TEXT REVEAL. THE rises from behind a mask line, PROCESS
 * builds left to right like a progress bar, and FROM STRATEGY TO EXECUTION
 * lights up word by word as you scroll while its line fills.
 * Objects: the desk is set piece by piece, then each object reacts when the
 * plane flies over it.
 */
import { word, copyBlock, tagline, badge } from '../core/typography.js';
import { COLORS } from '../config.js';
import { photo, srHeading, depth, follower, hoverLift } from './common.js';
import { LAYERS } from '../layers.generated.js';

// when the plane passes over each object (timeline units, see flight.js)
const FLYOVER = { mug: 18.6, lamp: 19.2, clock: 19.7, pens: 20.2, screen: 21, notebook: 22, swatches: 24.6, plant: 26.2 };

export function createProcess(stage, cfg) {
  const s = stage.add(cfg, document.getElementById('scene-process'));
  const art = s.art;
  srHeading(s.section, 'THE PROCESS — FROM STRATEGY TO EXECUTION');
  const P = (p) => stage.part(cfg.id, p);

  // workspace (photo layers, back to front)
  const desk = depth(stage.group(cfg.id, 'desk', depth(art, 'layout')), 'desk-group');
  photo(desk, 's2-desk', 'desk-plate');
  const screen = photo(desk, 's2-screen', 'desk-screen');
  const obj = {
    plant: photo(desk, 's2-plant'),
    lamp: photo(desk, 's2-lamp'),
    pens: photo(desk, 's2-pens'),
    clock: photo(desk, 's2-clock'),
    mug: photo(desk, 's2-mug'),
    swatches: photo(desk, 's2-swatches'),
    notebook: photo(desk, 's2-notebook'),
  };
  // pivots (reference px -> layer px)
  const origin = (name, x, y) => { const b = LAYERS[name]; return `${x - b.x}px ${y - b.y}px`; };
  obj.swatches.style.transformOrigin = origin('s2-swatches', cfg.swatchPivot.x, cfg.swatchPivot.y);
  obj.plant.style.transformOrigin = origin('s2-plant', 150, 1150);
  obj.lamp.style.transformOrigin = origin('s2-lamp', 718, 1072);
  obj.pens.style.transformOrigin = origin('s2-pens', 652, 1092);
  obj.mug.style.transformOrigin = origin('s2-mug', 870, 1215);

  const text = depth(stage.group(cfg.id, 'text', depth(art, 'layout')), 'text-group');
  const b = P(badge(text, { ...cfg.badge, numText: cfg.index }));
  const copy = P(copyBlock(text, cfg.copy, cfg.ref.w));
  const the = P(word(text, { ...cfg.the, color: COLORS.cobalt, cls: 'masked' }));
  const proc = P(word(text, { ...cfg.word, color: COLORS.cobalt }));
  const tag = P(tagline(text, cfg.tagline));

  /** a small physical reaction: push, then settle with a damped spring */
  function react(tl, el, at, push, settle = 'elastic.out(1, 0.35)') {
    tl.to(el, { ...push, duration: 0.6, ease: 'power2.out' }, at)
      .to(el, { ...Object.fromEntries(Object.keys(push).map((k) => [k, 0])), duration: 2.6, ease: settle }, at + 0.6);
  }

  function scroll(tl, T) {
    const [a0, a1] = T.t12;
    const [b0] = T.process.build;
    // camera: enter the workspace from a steep angle
    tl.fromTo(s.section, { autoAlpha: 0 }, { autoAlpha: 1, duration: 3, ease: 'power1.out' }, a0 + 4.5)
      .fromTo(s.cam, { rotateX: 34, scale: 1.22, yPercent: 14 }, {
        rotateX: 0, scale: 1, yPercent: 0, duration: a1 - a0 - 4.5, ease: 'power3.out',
      }, a0 + 4.5)
      .fromTo(desk, { opacity: 0, y: 120 }, { opacity: 1, y: 0, duration: 6, ease: 'power3.out' }, a0 + 4.5);

    // the desk is set: objects land one after another
    ['plant', 'lamp', 'pens', 'clock', 'mug', 'swatches', 'notebook'].forEach((k, i) => {
      tl.fromTo(obj[k], { y: -95 }, { y: 0, duration: 2.2, ease: 'bounce.out' }, a0 + 6 + i * 0.75)
        .fromTo(obj[k], { opacity: 0 }, { opacity: 1, duration: 0.6 }, a0 + 6 + i * 0.75);
    });
    tl.set(obj.swatches, { rotate: -17 }, a0 + 5.9); // fan arrives closed

    // headline
    tl.fromTo(the.chars, { yPercent: 108 }, { yPercent: 0, duration: 3.5, stagger: 0.45, ease: 'power4.out' }, b0 + 1)
      // PROCESS loads left to right like a progress bar
      .fromTo(proc.root, { clipPath: 'inset(-6% 100% -6% -3%)' }, { clipPath: 'inset(-6% -3% -6% -3%)', duration: 6, ease: 'power1.inOut' }, b0 + 2.5)
      .fromTo(proc.chars, { yPercent: 14, opacity: 0.35 }, { yPercent: 0, opacity: 1, duration: 1.6, stagger: 0.75, ease: 'power3.out' }, b0 + 2.7)
      .fromTo(b.root, { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 2.5, ease: 'back.out(2)' }, b0 + 2)
      .fromTo(b.num.root, { opacity: 0 }, { opacity: 1, duration: 2 }, b0 + 2.6)
      .fromTo(copy.lines.map((l) => l.firstChild), { yPercent: 110 }, { yPercent: 0, duration: 3, stagger: 0.6, ease: 'power3.out' }, b0 + 5)
      // FROM STRATEGY TO EXECUTION: words light up with the scroll, the line fills like a progress meter
      .fromTo(tag.root, { opacity: 0 }, { opacity: 1, duration: 1.5 }, b0 + 5.5)
      .fromTo(tag.words, { color: '#CFCFDA' }, { color: COLORS.ink, duration: 1.6, stagger: 2.2, ease: 'power1.out' }, b0 + 6)
      .fromTo(tag.underline, { scaleX: 0 }, { scaleX: 1, transformOrigin: '0 50%', duration: 9, ease: 'none' }, b0 + 6);

    // reactions as the plane flies over the desk
    react(tl, obj.mug, FLYOVER.mug, { rotate: 3 });
    react(tl, obj.lamp, FLYOVER.lamp, { rotate: -2.6 });
    react(tl, obj.clock, FLYOVER.clock, { y: -7 }, 'bounce.out');
    react(tl, obj.pens, FLYOVER.pens, { rotate: 3.5 });
    tl.fromTo(screen, { opacity: 0, scale: 0.9, z: -80 }, { opacity: 1, scale: 1, z: 0, duration: 3.5, ease: 'power3.out' }, FLYOVER.screen)
      .to(obj.notebook, { y: -9, duration: 1.6, ease: 'power2.out' }, FLYOVER.notebook)
      .to(obj.notebook, { y: 0, duration: 3, ease: 'bounce.out' }, FLYOVER.notebook + 1.6)
      .to(obj.swatches, { rotate: 0, duration: 4, ease: 'back.out(1.6)' }, FLYOVER.swatches);
    react(tl, obj.plant, FLYOVER.plant, { rotate: 4.5 });

    // 02 -> 03: the camera rushes forward with the plane
    const [c0, c1] = T.t23;
    tl.to(s.cam, { scale: 1.9, yPercent: -4, duration: c1 - c0 - 2, ease: 'power3.in' }, c0 + 1)
      .to(s.section, { autoAlpha: 0, duration: 3, ease: 'power2.in' }, c0 + 4);
  }

  /* pointer: the workspace tilts toward the pointer, the title floats against it */
  const fDesk = follower(desk, (nx, ny) => ({ rotateY: nx * 7, rotateX: -ny * 5, x: nx * 18 }), 1.1);
  const fText = follower(text, (nx, ny) => ({ x: nx * -16, y: ny * -10 }), 1.2);
  function pointer(nx, ny) { fDesk(nx, ny); fText(nx, ny); }
  // every object answers the pointer
  Object.values(obj).forEach((o) => hoverLift(o, { scale: 1.06 }));

  return { s, scroll, pointer, titles: [...the.chars, ...proc.chars] };
}
