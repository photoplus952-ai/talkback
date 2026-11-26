/**
 * 01 YOU'RE WELCOME
 * Opening (time based): the glasses drop in (objects/glasses.js), letters rise
 * one by one and lean, the smile is drawn like a signature, the Hebrew sharpens
 * word by word, the tagline opens to its full tracking.
 * Scroll: the letters break apart into depth while the glasses fly to the desk.
 */
import { headline, copy, tagline, badge, el } from '../core/text.js';
import { srHeading, follower } from './common.js';

export function createWelcome(stage, cfg) {
  const s = stage.add(cfg, document.getElementById('scene-welcome'));
  const art = s.art;
  srHeading(s.section, 'Youre welcome. WE STARTING FROM HERE', 'h1');

  const b = badge(art, cfg.badge, cfg.index);
  const c = copy(art, cfg.copy);
  const titleBox = el('div', 'depth', art);
  const words = cfg.title.map((t) => headline(titleBox, t));
  const chars = words.flatMap((w) => w.chars);

  // smile: drawn from right to left, like a signature
  const S = cfg.smile;
  const svg = el('div', 'smile', art, { left: `${S.x}px`, top: `${S.y}px`, width: `${S.w}px`, height: `${S.h}px` });
  svg.innerHTML = '<img src="assets/scene/smile.png" alt="">';
  const tag = tagline(art, cfg.tagline);

  function intro(tl) {
    tl.from(b.root, { scale: 0.4, opacity: 0, duration: 0.6, ease: 'back.out(2)' }, 0.9)
      .from(b.num, { opacity: 0, x: -10, duration: 0.5 }, 1.0)
      .from(words[0].chars, { yPercent: 60, rotate: (i) => (i % 2 ? 9 : -11), opacity: 0, duration: 0.9, stagger: 0.07, ease: 'back.out(2.2)' }, 1.0)
      .from(words[1].chars, { yPercent: 60, rotate: (i) => (i % 2 ? -8 : 10), opacity: 0, duration: 0.9, stagger: 0.06, ease: 'back.out(2.2)' }, 1.25)
      .fromTo(svg, { clipPath: 'inset(0% 0% 0% 100%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'power2.inOut' }, 1.9)
      .set(svg, { clipPath: 'none' })
      .from(c.words, { opacity: 0, filter: 'blur(8px)', y: 6, duration: 0.7, stagger: 0.05, ease: 'power2.out' }, 1.6)
      .from(tag.root, { letterSpacing: '0px', opacity: 0, duration: 1.4, ease: 'expo.out' }, 2.0)
      .from(tag.line, { scaleX: 0, transformOrigin: '0 50%', duration: 1.1, ease: 'expo.out' }, 2.1);
  }

  function scroll(tl, T) {
    const [a0] = T.t12;
    const rnd = gsap.utils.random;
    tl.to(chars, {
      x: () => rnd(-120, 120), y: () => rnd(-280, -120), scale: () => rnd(0.2, 0.45), rotate: () => rnd(-30, 30), opacity: 0,
      duration: 3, stagger: { each: 0.1, from: 'random' }, ease: 'power2.in',
    }, a0 + 0.3)
      .to(svg, { opacity: 0, scale: 0.6, transformOrigin: '60% 0%', duration: 2 }, a0 + 0.3)
      .to([c.root, b.root, b.num], { opacity: 0, y: -30, duration: 2.2, ease: 'power1.in' }, a0 + 0.3)
      .to([tag.root, tag.line], { opacity: 0, duration: 1.8 }, a0 + 0.5)
      .to(s.section, { autoAlpha: 0, duration: 1.2 }, a0 + 3.4);
  }

  const fTitle = follower(titleBox, (nx, ny) => ({ x: nx * 16, y: ny * 10 }));
  const fCopy = follower(c.root, (nx, ny) => ({ x: nx * -28, y: ny * -16 }), 1.2);
  function pointer(nx, ny) { fTitle(nx, ny); fCopy(nx, ny); }

  return { s, intro, scroll, pointer, titles: chars };
}
