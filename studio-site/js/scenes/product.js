/**
 * 03 THE PRODUCT
 * Main type effect: DEPTH TYPOGRAPHY. The headline and its two echoes arrive
 * from different depths and keep a gentle parallax with the pointer.
 * The laptop lid opens on its hinge, its screen lights up, the phone turns
 * toward the viewer. Devices live on the FRONT layer so the plane can pass
 * behind them as a cobalt silhouette.
 */
import { word, stretchE } from '../core/typography.js';
import { COLORS } from '../config.js';
import { photo, srHeading, depth } from './common.js';
import { LAYERS } from '../layers.generated.js';

export function createProduct(stage, cfg) {
  const front0 = stage.staticMode ? null : document.getElementById('scene-product-front');
  const s = stage.add(cfg, document.getElementById('scene-product'), front0);
  const art = s.art;
  const front = s.frontArt;
  srHeading(s.section, 'THE PRODUCT');
  const P = (p) => stage.part(cfg.id, p);

  // typography in three depth planes
  const dEcho2 = depth(art, 'd-echo2');
  const dEcho1 = depth(art, 'd-echo1');
  const dMain = depth(art, 'd-main');
  const echo2 = P(word(dEcho2, { ...cfg.echoes[1], cls: 'echo echo-fade' }));
  const echo1 = P(word(dEcho1, { ...cfg.echoes[0], cls: 'echo' }));
  const th = P(word(dMain, { ...cfg.th, color: COLORS.cobalt }));
  const e = P(stretchE(dMain, { ...cfg.e, color: COLORS.cobalt }));
  const prod = P(word(dMain, { ...cfg.word, color: COLORS.cobalt }));

  // devices
  const dev = depth(front, 'devices');
  const base = photo(dev, 's3-base', 'dev-base');
  const lidWrap = depth(dev, 'lid');
  photo(lidWrap, 's3-lid', 'dev-lid');
  const lidScreen = photo(lidWrap, 's3-lid-screen', 'dev-lid-screen');
  const phone = photo(dev, 's3-phone', 'dev-phone');
  const star = photo(dev, 's3-star', 'dev-star');

  // hinge: rotate the lid around the (slightly tilted) hinge line
  const h = cfg.hinge;
  const hingeAngle = (Math.atan2(h.y1 - h.y0, h.x1 - h.x0) * 180) / Math.PI;
  const hx = (h.x0 + h.x1) / 2; const hy = (h.y0 + h.y1) / 2;
  lidWrap.style.transformOrigin = `${hx}px ${hy}px`;
  const lidOpen = (deg) => `rotate(${hingeAngle}deg) rotateX(${deg}deg) rotate(${-hingeAngle}deg)`;
  const pb = LAYERS['s3-phone'];
  phone.style.transformOrigin = `${cfg.phonePivot.x - pb.x}px ${cfg.phonePivot.y - pb.y}px`;

  function scroll(tl, T) {
    const [c0, c1] = T.t23;
    const [b0] = T.product.build;
    tl.fromTo(s.sections, { opacity: 0 }, { opacity: 1, duration: 3, ease: 'power1.out' }, c0 + 6)
      .fromTo(s.cams, { scale: 0.72, yPercent: 6 }, { scale: 1, yPercent: 0, duration: c1 - c0 + 2, ease: 'power3.out' }, c0 + 5)
      // depth typography: three planes converge
      .fromTo(dEcho2, { scale: 0.62, opacity: 0, yPercent: 8 }, { scale: 1, opacity: 1, yPercent: 0, duration: 7, ease: 'power3.out' }, b0 + 1)
      .fromTo(dEcho1, { scale: 0.78, opacity: 0, yPercent: 5 }, { scale: 1, opacity: 1, yPercent: 0, duration: 7, ease: 'power3.out' }, b0 + 2)
      .fromTo(dMain, { scale: 1.32, opacity: 0 }, { scale: 1, opacity: 1, duration: 7, ease: 'power3.out' }, b0 + 2.5)
      .fromTo(e.bars, { scaleX: 0.2 }, { scaleX: 1, transformOrigin: '0 50%', duration: 4, stagger: 0.35, ease: 'expo.out' }, b0 + 6)
      // devices
      .fromTo(dev, { yPercent: 10 }, { yPercent: 0, duration: 8, ease: 'power3.out' }, c0 + 5)
      .fromTo(lidWrap, { transform: lidOpen(82) }, { transform: lidOpen(0), duration: 8, ease: 'power2.inOut' }, b0 + 2)
      .fromTo(lidScreen, { clipPath: 'inset(0 0 100% 0)', opacity: 0.4 }, {
        clipPath: 'inset(0 0 0% 0)', opacity: 1, duration: 5, ease: 'power2.inOut',
      }, b0 + 8)
      .fromTo(phone, { rotateY: -32, rotateZ: 4, x: 70, opacity: 0 }, {
        rotateY: 0, rotateZ: 0, x: 0, opacity: 1, duration: 7, ease: 'power3.out',
      }, b0 + 6)
      .fromTo(star, { y: 60, rotate: -18, opacity: 0, scale: 0.8 }, {
        y: 0, rotate: 0, opacity: 1, scale: 1, duration: 6, ease: 'back.out(1.3)',
      }, b0 + 8);

    // 03 -> 04
    const [d0] = T.t34;
    tl.to(s.cams, { scale: 0.9, duration: 9, ease: 'power2.in' }, d0 + 2)
      .to(s.sections, { opacity: 0, duration: 3 }, d0 + 8);
  }

  // pointer parallax by depth (readable at all times: small amplitudes)
  function pointer(nx, ny) {
    const q = (el2, k) => gsap.to(el2, { x: nx * k, y: ny * k * 0.6, duration: 1.1, ease: 'power3.out', overwrite: 'auto' });
    q(dEcho2, -14); q(dEcho1, -8); q(dMain, 5);
    gsap.to(dev, { x: nx * 12, rotateY: nx * 3, duration: 1.2, ease: 'power3.out', overwrite: 'auto' });
  }

  return { s, scroll, pointer, parts: { echo1, echo2, th, e, prod, base } };
}
