/**
 * 02 TO THE PROCESS
 * Type: TO THE rises from behind a mask line, PROCESS builds left to right
 * like a progress bar, the tagline lights up word by word with the scroll.
 * Objects: the desk is set piece by piece; the glasses from screen 01 land on
 * it last, and each object answers as they fly over.
 */
import { headline, copy, tagline, badge } from '../core/text.js';
import { COLORS } from '../config.js';
import { photo, srHeading, depth, mapped, follower, hoverLift } from './common.js';
import { LAYERS } from '../layers.generated.js';

export const LAND_T = 16.5; // when the flying glasses touch the desk (see objects/glasses.js)
const FLYOVER = { mug: 13.4, lamp: 13.9, clock: 14.4, pens: 14.9, screen: 15.2, notebook: 15.8 };

export function createProcess(stage, cfg) {
  const s = stage.add(cfg, document.getElementById('scene-process'));
  const art = s.art;
  srHeading(s.section, 'TO THE PROCESS — FROM STRATEGY TO EXECUTION');

  // workspace (photo layers in the original frame's pixels)
  const desk = mapped(art, 'desk-group', cfg.desk);
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
  const origin = (name, x, y) => { const b = LAYERS[name]; return `${x - b.x}px ${y - b.y}px`; };
  obj.swatches.style.transformOrigin = origin('s2-swatches', cfg.swatchPivot.x, cfg.swatchPivot.y);
  obj.plant.style.transformOrigin = origin('s2-plant', 150, 1150);
  obj.lamp.style.transformOrigin = origin('s2-lamp', 718, 1072);
  obj.pens.style.transformOrigin = origin('s2-pens', 652, 1092);
  obj.mug.style.transformOrigin = origin('s2-mug', 870, 1215);
  desk.style.transformOrigin = '470px 1250px';

  // the glasses, lying on the desk once they have landed
  const G = cfg.glassesOnDesk;
  const deskGlasses = depth(desk, 'desk-glasses');
  Object.assign(deskGlasses.style, { left: `${G.x - G.w / 2}px`, top: `${G.y - G.w * 0.225}px`, width: `${G.w}px`, height: `${G.w * 0.45}px` });
  deskGlasses.innerHTML = '<img src="assets/scene/glasses.png" alt="">';

  const text = depth(art, 'text-group');
  const b = badge(text, cfg.badge, cfg.index);
  const c = copy(text, cfg.copy);
  const [the, proc] = cfg.title.map((t, i) => headline(text, { ...t, cls: i === 0 ? 'masked' : '' }));
  const tag = tagline(text, cfg.tagline);

  function react(tl, el, at, push, settle = 'elastic.out(1, 0.35)') {
    tl.to(el, { ...push, duration: 0.5, ease: 'power2.out' }, at)
      .to(el, { ...Object.fromEntries(Object.keys(push).map((k) => [k, 0])), duration: 2.2, ease: settle }, at + 0.5);
  }

  function scroll(tl, T) {
    const [a0, a1] = T.t12;
    const [b0] = T.process.build;
    tl.fromTo(s.section, { autoAlpha: 0 }, { autoAlpha: 1, duration: 2.5, ease: 'power1.out' }, a0 + 3.5)
      .fromTo(s.cam, { rotateX: 30, scale: 1.18, yPercent: 12 }, { rotateX: 0, scale: 1, yPercent: 0, duration: a1 - a0 - 3.5, ease: 'power3.out' }, a0 + 3.5)
      .fromTo(desk, { opacity: 0, y: 140 }, { opacity: 1, y: 0, duration: 5, ease: 'power3.out' }, a0 + 3.5);

    ['plant', 'lamp', 'pens', 'clock', 'mug', 'swatches', 'notebook'].forEach((k, i) => {
      tl.fromTo(obj[k], { y: -100 }, { y: 0, duration: 1.8, ease: 'bounce.out' }, a0 + 4.5 + i * 0.55)
        .fromTo(obj[k], { opacity: 0 }, { opacity: 1, duration: 0.5 }, a0 + 4.5 + i * 0.55);
    });
    tl.set(obj.swatches, { rotate: -17 }, a0 + 4.4);

    // the glasses land: the flying copy hands over to this one
    tl.fromTo(deskGlasses, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05 }, LAND_T)
      .fromTo(deskGlasses, { y: -18 }, { y: 0, duration: 1.4, ease: 'bounce.out' }, LAND_T);

    tl.fromTo(the.chars, { yPercent: 108 }, { yPercent: 0, duration: 2.6, stagger: 0.3, ease: 'power4.out' }, b0)
      .fromTo(proc.root, { clipPath: 'inset(-10% 100% -10% -3%)' }, { clipPath: 'inset(-10% -3% -10% -3%)', duration: 4.5, ease: 'power1.inOut' }, b0 + 1.2)
      .fromTo(proc.chars, { yPercent: 14, opacity: 0.35 }, { yPercent: 0, opacity: 1, duration: 1.4, stagger: 0.5, ease: 'power3.out' }, b0 + 1.4)
      .fromTo(b.root, { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 2, ease: 'back.out(2)' }, b0 + 0.6)
      .fromTo(b.num, { opacity: 0 }, { opacity: 1, duration: 1.5 }, b0 + 1)
      .fromTo(c.lines.map((l) => l.firstChild), { yPercent: 110 }, { yPercent: 0, duration: 2.4, stagger: 0.5, ease: 'power3.out' }, b0 + 3)
      .fromTo(tag.root, { opacity: 0 }, { opacity: 1, duration: 1 }, b0 + 4)
      .fromTo(tag.words, { color: '#CFCFDA' }, { color: COLORS.ink, duration: 1.2, stagger: 1.4, ease: 'power1.out' }, b0 + 4.2)
      .fromTo(tag.line, { scaleX: 0 }, { scaleX: 1, transformOrigin: '0 50%', duration: 6, ease: 'none' }, b0 + 4.2);

    react(tl, obj.mug, FLYOVER.mug, { rotate: 3 });
    react(tl, obj.lamp, FLYOVER.lamp, { rotate: -2.6 });
    react(tl, obj.clock, FLYOVER.clock, { y: -7 }, 'bounce.out');
    react(tl, obj.pens, FLYOVER.pens, { rotate: 3.5 });
    tl.fromTo(screen, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 2.5, ease: 'power3.out' }, FLYOVER.screen)
      .to(obj.notebook, { y: -9, duration: 1.2, ease: 'power2.out' }, FLYOVER.notebook)
      .to(obj.notebook, { y: 0, duration: 2.2, ease: 'bounce.out' }, FLYOVER.notebook + 1.2)
      .to(obj.swatches, { rotate: 0, duration: 3, ease: 'back.out(1.6)' }, LAND_T + 1);
    react(tl, obj.plant, LAND_T + 1.8, { rotate: 4.5 });

    // 02 -> 03: the camera rushes forward into the screen of the laptop
    const [c0, c1] = T.t23;
    tl.to(s.cam, { scale: 1.9, yPercent: -2, xPercent: 12, duration: c1 - c0 - 1, ease: 'power3.in' }, c0)
      .to(s.section, { autoAlpha: 0, duration: 2.5, ease: 'power2.in' }, c0 + 3.5);
  }

  const fDesk = follower(desk, (nx, ny) => ({ rotateY: nx * 7, rotateX: -ny * 5, x: nx * 18 }), 1.1);
  const fText = follower(text, (nx, ny) => ({ x: nx * -16, y: ny * -10 }), 1.2);
  function pointer(nx, ny) { fDesk(nx, ny); fText(nx, ny); }
  [...Object.values(obj), deskGlasses].forEach((o) => hoverLift(o, { scale: 1.06 }));

  return { s, scroll, pointer, titles: [...the.chars, ...proc.chars] };
}
