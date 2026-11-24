/**
 * 04 THE RESULT
 * Main type effect: STROKE TO FILL. RESULT punches in letter by letter as an
 * outline, the title fills with cobalt from the baseline up while its E
 * stretches, and IMPACT lands last as a single beat.
 * The MADE IT HAPPEN band unrolls from the top like a ribbon with a real fold;
 * MADE IT is written stroke by stroke, then HAPPEN fills.
 * The scene is revealed through an iris that opens where the plane passes the lens.
 */
import { word, stretchE, copyBlock, tagline, el } from '../core/typography.js';
import { COLORS } from '../config.js';
import { photo, srHeading, depth, follower } from './common.js';

export function createResult(stage, cfg) {
  const s = stage.add(cfg, document.getElementById('scene-result'));
  const art = s.art;
  srHeading(s.section, 'THE RESULT — WHERE STRATEGY BECOMES IMPACT. MADE IT HAPPEN');
  const P = (p) => stage.part(cfg.id, p);

  /* band */
  const B = cfg.band;
  const bandWrap = el('div', 'band-wrap', art, {
    left: `${B.x}px`, top: `${B.y - B.length}px`, width: `${B.width}px`, height: `${B.length}px`,
    transform: `rotate(${-B.angle}deg)`,
  });
  const band = el('div', 'band', bandWrap);
  el('div', 'band-panel', band);
  const fold = el('div', 'band-fold', bandWrap);
  const T = cfg.bandText;
  const line = el('div', 'band-line', band, {
    left: `${T.inset + T.capH}px`, top: `${B.length - T.along[1]}px`,
    width: `${T.along[1] - T.along[0]}px`, height: `${T.capH}px`,
  });
  const bandWords = T.parts.map((p) => P(word(line, {
    text: p.text, x0: p.x0, x1: p.x1, capTop: 0, capH: T.capH, cls: `band-${p.style}`,
  })));

  /* people */
  const people = depth(art, 'people');
  photo(people, 's4-people', 'people-photo');

  /* title: outline layer + fill layer (clipped) */
  const mkTitle = (cls) => {
    const g = depth(art, cls);
    return {
      g,
      th: P(word(g, { ...cfg.th, color: COLORS.cobalt })),
      e: P(stretchE(g, { ...cfg.e, color: COLORS.cobalt })),
      res: P(word(g, { ...cfg.word, color: COLORS.cobalt })),
    };
  };
  const outline = mkTitle('title-outline');
  const fill = mkTitle('title-fill');

  const tag = P(tagline(art, cfg.tagline));
  const impact = tag.spans[tag.spans.length - 1];
  impact.style.display = 'inline-block';
  const copy = P(copyBlock(art, cfg.copy, cfg.ref.w));

  /* ribbon: one progress value drives the reveal edge and the curl riding on it */
  const ribbon = { p: stage.staticMode ? 1 : 0 };
  const FOLD = 74;
  function drawRibbon() {
    const p = ribbon.p;
    const edge = B.length * p;
    band.style.clipPath = `inset(0 -40px ${(1 - p) * 100}% -40px)`;
    fold.style.transform = `translateY(${edge}px) perspective(600px) rotateX(${-62 + p * 20}deg)`;
    fold.style.opacity = p <= 0.001 || p >= 0.995 ? 0 : Math.min(1, (1 - p) * 14);
  }
  drawRibbon();

  function scroll(tl, Tm) {
    const [d0, d1] = Tm.t34;
    const [b0] = Tm.result.build;
    // iris reveal (centre set by main.js where the plane meets the lens)
    tl.fromTo(s.section, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, d0 + 5)
      .fromTo(s.section, { '--iris': '0%' }, { '--iris': '150%', duration: d1 - d0 - 5, ease: 'power2.in' }, d0 + 5)
      .fromTo(people, { scale: 1.14, rotate: -2 }, { scale: 1, rotate: 0, duration: 12, ease: 'power3.out' }, d0 + 6)
      // band unrolls from the top, curl on its leading edge
      .fromTo(ribbon, { p: 0 }, { p: 1, duration: 7, ease: 'power2.inOut', onUpdate: drawRibbon }, b0 + 1)
      // MADE IT is written stroke by stroke, then HAPPEN fills
      .fromTo(bandWords[0].chars, { clipPath: 'inset(-12% 100% -12% -12%)' }, {
        clipPath: 'inset(-12% -12% -12% -12%)', duration: 0.9, stagger: 0.55, ease: 'power1.inOut',
      }, b0 + 3)
      .fromTo(bandWords[1].chars, { opacity: 0, yPercent: 18 }, { opacity: 1, yPercent: 0, duration: 1.2, stagger: 0.3, ease: 'power3.out' }, b0 + 6.8)
      .fromTo(bandWords[1].root, { '--f': 0 }, { '--f': 1, duration: 2.2, ease: 'power2.inOut' }, b0 + 8.6);

    // THE: outline fades up; RESULT: each letter punches in (outline and fill together)
    tl.fromTo(outline.th.chars, { opacity: 0, yPercent: 18 }, { opacity: 1, yPercent: 0, duration: 2, stagger: 0.25, ease: 'power3.out' }, b0 + 1)
      .fromTo(outline.e.root, { opacity: 0 }, { opacity: 1, duration: 1.2 }, b0 + 1.6);
    outline.res.chars.forEach((c, i) => {
      tl.fromTo([c, fill.res.chars[i]], { scale: 1.7, opacity: 0 }, {
        scale: 1, opacity: 1, duration: 1.1, ease: 'back.out(2.6)', transformOrigin: '50% 60%',
      }, b0 + 2 + i * 0.42);
    });
    tl.fromTo([outline.e.bars, fill.e.bars], { scaleX: 0.12 }, { scaleX: 1, transformOrigin: '0 50%', duration: 4, stagger: 0.2, ease: 'expo.inOut' }, b0 + 2.4)
      .fromTo(fill.g, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 4.5, ease: 'power2.inOut' }, b0 + 5.2)
      // tagline, then IMPACT as the last beat
      .fromTo(tag.root, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 3.2, ease: 'power2.inOut' }, b0 + 8)
      .fromTo(impact, { scale: 1 }, { scale: 1.16, duration: 0.7, ease: 'power3.out' }, b0 + 11.4)
      .to(impact, { scale: 1, duration: 1.6, ease: 'elastic.out(1, 0.4)' }, b0 + 12.1)
      .fromTo(copy.lines.map((l) => l.firstChild), { yPercent: 110 }, { yPercent: 0, duration: 2.6, stagger: 0.45, ease: 'power3.out' }, b0 + 9);
  }

  /* hover: the outlined MADE IT fills, like the title did */
  band.addEventListener('pointerenter', () => gsap.to(bandWords[0].root, { '--fill': 1, duration: 0.6, ease: 'power2.out' }));
  band.addEventListener('pointerleave', () => gsap.to(bandWords[0].root, { '--fill': 0, duration: 0.8, ease: 'power2.out' }));

  const fPeople = follower(people, (nx, ny) => ({ x: nx * 18, y: ny * 12 }), 1.3);
  const fTitle = follower([outline.g, fill.g], (nx, ny) => ({ x: nx * -16, y: ny * -10 }), 1.1);
  const fCopy = follower(copy.root, (nx, ny) => ({ x: nx * -24, y: ny * -14 }), 1.2);
  function pointer(nx, ny) { fPeople(nx, ny); fTitle(nx, ny); fCopy(nx, ny); }

  // magnet: outline + fill letters move as pairs
  const titles = [...outline.th.chars, ...outline.res.chars].map((c, i) => [c, [...fill.th.chars, ...fill.res.chars][i]]);
  return { s, scroll, pointer, band, titles };
}
