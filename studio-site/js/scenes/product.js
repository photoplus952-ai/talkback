/**
 * 03 THE PRODUCT
 * Main type effect: DEPTH TYPOGRAPHY. The headline is stamped into place and
 * its two echoes slide out from underneath it like printed copies, then keep
 * a gentle depth parallax with the pointer.
 * Objects: the lid opens on its hinge, the screen loads block by block like a
 * site coming up, the phone turns toward the viewer with the same design, the
 * glass star turns in 3D. Devices live on the FRONT layer so the plane can
 * pass behind them as a cobalt silhouette.
 */
import { word, stretchE, el } from '../core/typography.js';
import { COLORS } from '../config.js';
import { photo, srHeading, depth } from './common.js';
import { LAYERS } from '../layers.generated.js';

// laptop screen: the light display area and the UI blocks that load into it (reference px)
const SCREEN_QUAD = [[256, 712], [780, 684], [786, 1052], [305, 1082]];
const SCREEN_BLOCKS = [
  [280, 706, 780, 760], //   nav bar
  [292, 778, 488, 866], //   "Brand Direction"
  [300, 862, 540, 1070], //  blue wave image
  [520, 842, 648, 962], //   Aa card
  [538, 962, 660, 1044], //  colour chips
  [644, 822, 786, 1030], //  building image
];

export function createProduct(stage, cfg) {
  const front0 = stage.staticMode ? null : document.getElementById('scene-product-front');
  const s = stage.add(cfg, document.getElementById('scene-product'), front0);
  const art = s.art;
  const front = s.frontArt;
  srHeading(s.section, 'THE PRODUCT');
  const P = (p) => stage.part(cfg.id, p);

  // typography in three depth planes (echoes under the main line)
  const dEcho2 = depth(art, 'd-echo2');
  const dEcho1 = depth(art, 'd-echo1');
  const dMain = depth(art, 'd-main');
  P(word(dEcho2, { ...cfg.echoes[1], cls: 'echo echo-fade' }));
  P(word(dEcho1, { ...cfg.echoes[0], cls: 'echo' }));
  const th = P(word(dMain, { ...cfg.th, color: COLORS.cobalt }));
  const e = P(stretchE(dMain, { ...cfg.e, color: COLORS.cobalt }));
  const prod = P(word(dMain, { ...cfg.word, color: COLORS.cobalt }));

  // devices
  const dev = depth(front, 'devices');
  photo(dev, 's3-base', 'dev-base');
  const lidWrap = depth(dev, 'lid');
  photo(lidWrap, 's3-lid', 'dev-lid');
  const lb = LAYERS['s3-lid'];
  const rel = ([x, y]) => `${x - lb.x}px ${y - lb.y}px`;
  const box = { left: `${lb.x}px`, top: `${lb.y}px`, width: `${lb.w}px`, height: `${lb.h}px` };
  const blank = el('div', 'screen-blank', lidWrap, { ...box, clipPath: `polygon(${SCREEN_QUAD.map(rel).join(',')})` });
  const blocks = SCREEN_BLOCKS.map(([x0, y0, x1, y1]) => {
    const blk = photo(lidWrap, 's3-lid-screen', 'screen-block');
    blk.style.clipPath = `polygon(${[[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(rel).join(',')})`;
    blk.style.transformOrigin = rel([(x0 + x1) / 2, (y0 + y1) / 2]);
    return blk;
  });
  const fullScreen = photo(lidWrap, 's3-lid-screen', 'dev-lid-screen');
  const phone = photo(dev, 's3-phone', 'dev-phone');
  const star = photo(dev, 's3-star', 'dev-star');

  // hinge: rotate the lid around the (slightly tilted) hinge line
  const h = cfg.hinge;
  const hingeAngle = (Math.atan2(h.y1 - h.y0, h.x1 - h.x0) * 180) / Math.PI;
  lidWrap.style.transformOrigin = `${(h.x0 + h.x1) / 2}px ${(h.y0 + h.y1) / 2}px`;
  const lidOpen = (deg) => `rotate(${hingeAngle}deg) rotateX(${deg}deg) rotate(${-hingeAngle}deg)`;
  const pb = LAYERS['s3-phone'];
  phone.style.transformOrigin = `${cfg.phonePivot.x - pb.x}px ${cfg.phonePivot.y - pb.y}px`;

  // echoes start hidden under the main line (yPercent of the full-frame wrapper)
  const under = (capTop) => (-(capTop - cfg.word.capTop) / cfg.ref.h) * 100;

  function scroll(tl, T) {
    const [c0, c1] = T.t23;
    const [b0] = T.product.build;
    tl.fromTo(s.sections, { opacity: 0 }, { opacity: 1, duration: 3, ease: 'power1.out' }, c0 + 6)
      .fromTo(s.cams, { scale: 0.72, yPercent: 6 }, { scale: 1, yPercent: 0, duration: c1 - c0 + 2, ease: 'power3.out' }, c0 + 5)
      // the stamp: the headline drops onto the page and settles
      .fromTo(dMain, { scale: 1.55, opacity: 0 }, { scale: 0.975, opacity: 1, duration: 2.6, ease: 'power3.in' }, b0 + 1.5)
      .to(dMain, { scale: 1, duration: 2.2, ease: 'back.out(3)' }, b0 + 4.1)
      // copies slide out from underneath
      .fromTo(dEcho1, { yPercent: under(cfg.echoes[0].capTop), opacity: 0 }, { yPercent: 0, opacity: 1, duration: 3.6, ease: 'power3.out' }, b0 + 4.3)
      .fromTo(dEcho2, { yPercent: under(cfg.echoes[1].capTop), opacity: 0 }, { yPercent: 0, opacity: 1, duration: 4.4, ease: 'power3.out' }, b0 + 4.9)
      .fromTo(e.bars, { scaleX: 0.2 }, { scaleX: 1, transformOrigin: '0 50%', duration: 3.5, stagger: 0.3, ease: 'expo.out' }, b0 + 4.2)
      // devices
      .fromTo(dev, { yPercent: 10 }, { yPercent: 0, duration: 8, ease: 'power3.out' }, c0 + 5)
      .fromTo(lidWrap, { transform: lidOpen(82) }, { transform: lidOpen(0), duration: 7, ease: 'power2.inOut' }, b0 + 1)
      // screen turns on, then loads block by block like a page coming up
      .fromTo(blank, { opacity: 0 }, { opacity: 1, duration: 1.4 }, b0 + 6.5)
      .fromTo(blocks, { opacity: 0, y: 14, scale: 0.94 }, {
        opacity: 1, y: 0, scale: 1, duration: 1.8, stagger: 0.7, ease: 'power3.out',
      }, b0 + 7.5)
      .fromTo(fullScreen, { opacity: 0 }, { opacity: 1, duration: 1.2 }, b0 + 7.5 + 0.7 * blocks.length + 1.2)
      // the same design lands on the phone, which turns toward the viewer
      .fromTo(phone, { rotateY: -38, rotateZ: 4, x: 80, opacity: 0 }, {
        rotateY: 0, rotateZ: 0, x: 0, opacity: 1, duration: 6, ease: 'power3.out',
      }, b0 + 9)
      .fromTo(star, { y: 60, rotateY: -70, rotate: -14, opacity: 0, scale: 0.85 }, {
        y: 0, rotateY: 0, rotate: 0, opacity: 1, scale: 1, duration: 6, ease: 'back.out(1.3)',
      }, b0 + 7);

    // 03 -> 04
    const [d0] = T.t34;
    tl.to(s.cams, { scale: 0.9, duration: 9, ease: 'power2.in' }, d0 + 2)
      .to(s.sections, { opacity: 0, duration: 3 }, d0 + 8);
  }

  // pointer: depth parallax on the type, devices lean toward the pointer
  function pointer(nx, ny) {
    const q = (el2, k) => gsap.to(el2, { x: nx * k, y: ny * k * 0.6, duration: 1.1, ease: 'power3.out', overwrite: 'auto' });
    q(dEcho2, -14); q(dEcho1, -8); q(dMain, 5);
    gsap.to(dev, { x: nx * 12, rotateY: nx * 4, rotateX: -ny * 2.5, duration: 1.2, ease: 'power3.out', overwrite: 'auto' });
  }

  return { s, scroll, pointer, titles: [...th.chars, ...prod.chars] };
}
