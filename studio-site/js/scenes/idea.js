/**
 * 01 THE IDEA
 * Main type effect: LETTER STRETCH. Letters wake up in the plane's wake, the
 * E of IDEA grows bar by bar and pushes the A into place, and the title gives
 * a little under the plane when it lands.
 * On scroll the title breaks apart into depth, letter by letter.
 */
import { word, stretchE, copyBlock, tagline, badge } from '../core/typography.js';
import { COLORS } from '../config.js';
import { srHeading, depth } from './common.js';

export const LANDING = 3.3; // seconds into the opening, matches INTRO in flight.js

export function createIdea(stage, cfg) {
  const s = stage.add(cfg, document.getElementById('scene-idea'));
  const art = s.art;
  srHeading(s.section, 'THE IDEA — WE STARTING FROM HERE');

  const P = (p) => stage.part(cfg.id, p);
  const b = P(badge(art, { ...cfg.badge, numText: cfg.index }));
  const copy = P(copyBlock(art, cfg.copy, cfg.ref.w));

  const titleBack = depth(art, 'd-the');
  const titleFront = depth(art, 'd-idea');
  const the = P(word(titleBack, { ...cfg.the, color: COLORS.cobalt }));
  const I = cfg.idea;
  const id = P(word(titleFront, { ...I.id, capTop: I.capTop, capH: I.capH, color: COLORS.cobalt }));
  const e = P(stretchE(titleFront, { ...I.e, capTop: I.capTop, capH: I.capH, color: COLORS.cobalt }));
  const a = P(word(titleFront, { ...I.a, capTop: I.capTop, capH: I.capH, color: COLORS.cobalt }));
  const tag = P(tagline(art, cfg.tagline));

  /* ---------------- opening (time based) ---------------- */
  function intro(tl) {
    const stretch = I.e.x1 - I.e.x0 - I.e.stem;
    tl.from(b.root, { scale: 0.4, opacity: 0, duration: 0.7, ease: 'back.out(2)' }, 1.0)
      .from(b.num.chars, { yPercent: 60, opacity: 0, duration: 0.5, stagger: 0.06, ease: 'power3.out' }, 1.1)
      // letters wake up in the plane's wake (it arrives from the right):
      // each one leans in the air stream and springs back upright
      .from(the.chars, {
        yPercent: 55, rotate: (i) => [-14, 10, -9][i] || 0, opacity: 0,
        duration: 1.0, stagger: { each: 0.11, from: 'end' }, ease: 'back.out(2.2)',
      }, 1.3)
      .from(id.chars, {
        yPercent: 55, rotate: (i) => [12, -10][i] || 0, opacity: 0,
        duration: 1.0, stagger: { each: 0.11, from: 'end' }, ease: 'back.out(2.2)',
      }, 1.75)
      .from(e.stem, { scaleY: 0, transformOrigin: '50% 100%', duration: 0.55, ease: 'back.out(1.8)' }, 1.95)
      // the stretch: the bars follow the plane's tail, the A rides on their ends
      .from(e.bars, { autoAlpha: 0, duration: 0.2, stagger: 0.07 }, 2.05)
      .from(e.bars, {
        scaleX: 0.16, transformOrigin: '0% 50%', duration: 1.25, stagger: 0.07, ease: 'expo.inOut',
      }, 2.1)
      .from(a.root, { x: -stretch * 0.84, duration: 1.39, ease: 'expo.inOut' }, 2.1)
      .from(a.chars, { opacity: 0, rotate: 8, duration: 0.5 }, 2.1)
      // landing: the letters under the plane give a little, then settle
      .to([e.root, a.root, ...id.chars.slice(1), the.chars[2]], {
        y: (i) => [7, 5, 4, 3][i] ?? 3, duration: 0.14, ease: 'power2.out',
      }, LANDING - 0.04)
      .to([e.root, a.root, ...id.chars.slice(1), the.chars[2]], {
        y: 0, duration: 1.1, ease: 'elastic.out(1, 0.32)',
      }, LANDING + 0.1)
      // Hebrew: word by word from soft to sharp
      .from(copy.words, {
        opacity: 0, filter: 'blur(9px)', y: 8, duration: 0.8, stagger: 0.07, ease: 'power2.out',
      }, 2.45)
      // tagline opens from tight to its full tracking, the line draws with it
      .from(tag.root, { letterSpacing: '0px', opacity: 0, duration: 1.5, ease: 'expo.out' }, 2.75)
      .from(tag.underline, { scaleX: 0, transformOrigin: '0 50%', duration: 1.3, ease: 'expo.out' }, 2.8);
  }

  /* ---------------- scroll: 01 -> 02 ---------------- */
  function scroll(tl, T) {
    const [a0, a1] = T.t12;
    const pieces = [...the.chars, ...id.chars, e.root, a.root];
    const rnd = gsap.utils.random;
    // the title breaks apart into depth, every letter at its own speed
    tl.to(s.cam, { scale: 0.78, yPercent: -4, rotateX: 12, duration: a1 - a0 - 4, ease: 'power2.in' }, a0 + 1)
      .to(pieces, {
        x: () => rnd(-110, 110), y: () => rnd(-260, -120), scale: () => rnd(0.2, 0.45),
        rotate: () => rnd(-28, 28), opacity: 0,
        duration: 4.2, stagger: { each: 0.22, from: 'random' }, ease: 'power2.in',
      }, a0 + 1.2)
      .to([copy.root, b.root, b.num.root], { opacity: 0, y: -30, duration: 4, ease: 'power1.in' }, a0 + 1)
      .to([tag.root, tag.underline], { opacity: 0, duration: 3 }, a0 + 1.5)
      .to(s.section, { opacity: 0, duration: 2.5, ease: 'power1.in' }, a0 + 4.5);
  }

  return { s, intro, scroll, titles: [...the.chars, ...id.chars, ...a.chars] };
}
