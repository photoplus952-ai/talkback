/**
 * 01 THE IDEA
 * Main type effect: LETTER STRETCH. The E of IDEA grows bar by bar out of its
 * stem and pushes the A into place while the plane lands on it.
 */
import { word, stretchE, copyBlock, tagline, badge, el } from '../core/typography.js';
import { COLORS } from '../config.js';
import { srHeading, depth } from './common.js';

export function createIdea(stage, cfg) {
  const s = stage.add(cfg, document.getElementById('scene-idea'));
  const art = s.art;
  srHeading(s.section, 'THE IDEA — WE STARTING FROM HERE');

  const P = (p) => stage.part(cfg.id, p);
  const b = P(badge(art, { ...cfg.badge, numText: cfg.index }));
  const copy = P(copyBlock(art, cfg.copy, cfg.ref.w));

  const titleBack = depth(art, 'd-the');
  const titleFront = depth(art, 'd-idea');
  const the = P(word(titleBack, { ...cfg.the, capTop: cfg.the.capTop, color: COLORS.cobalt }));
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
      // kinetic entrance of THE / ID: letters rise and settle independently
      .from(the.chars, {
        yPercent: 70, rotate: (i) => [-8, 5, -4][i] || 0, opacity: 0,
        duration: 1.1, stagger: 0.09, ease: 'expo.out',
      }, 1.25)
      .from(id.chars, { yPercent: 70, rotate: (i) => [6, -5][i] || 0, opacity: 0, duration: 1.1, stagger: 0.09, ease: 'expo.out' }, 1.45)
      .from(e.stem, { scaleY: 0, transformOrigin: '50% 100%', duration: 0.6, ease: 'expo.out' }, 1.75)
      // the stretch: bars grow out of the stem, A rides on their ends
      .from(e.bars, { autoAlpha: 0, duration: 0.25, stagger: 0.07 }, 1.85)
      .from(e.bars, {
        scaleX: 0.16, transformOrigin: '0% 50%', duration: 1.35, stagger: 0.07, ease: 'expo.inOut',
      }, 2.0)
      .from(a.root, { x: -stretch * 0.84, duration: 1.35 + 0.14, ease: 'expo.inOut' }, 2.0)
      .from(a.root, { opacity: 0, duration: 0.4 }, 2.0)
      .from(copy.lines.map((l) => l.firstChild), { yPercent: 110, duration: 0.9, stagger: 0.08, ease: 'power4.out' }, 2.55)
      .from(tag.root, { clipPath: 'inset(0 100% 0 0)', duration: 1.2, ease: 'power3.inOut' }, 2.7)
      .from(tag.underline, { scaleX: 0, transformOrigin: '0 50%', duration: 1.0, ease: 'power3.inOut' }, 2.9);
  }

  /* ---------------- scroll: 01 -> 02 ---------------- */
  function scroll(tl, T) {
    const [a0, a1] = T.t12;
    // the title steps back into depth, top line faster than the bottom one
    tl.to(s.cam, { scale: 0.62, yPercent: -6, rotateX: 14, duration: a1 - a0 - 4, ease: 'power2.in' }, a0 + 1)
      .to(titleBack, { y: -70, duration: 8, ease: 'power1.in' }, a0 + 1)
      .to(titleFront, { y: -24, duration: 8, ease: 'power1.in' }, a0 + 1)
      .to([copy.root, b.root, b.num.root], { opacity: 0, y: -30, duration: 4, ease: 'power1.in' }, a0 + 1)
      .to([tag.root, tag.underline], { opacity: 0, duration: 3 }, a0 + 1.5)
      .to(s.section, { opacity: 0, duration: 4.5, ease: 'power1.in' }, a0 + 4);
  }

  return { s, intro, scroll, parts: { the, id, e, a, copy, tag, b } };
}
