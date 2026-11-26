/**
 * 03 AND THE RESULT
 * Type: RESULT is stamped onto the page, its two echo lines slide out from
 * underneath like printed copies.
 * Objects: the lid opens on its hinge, the screen loads block by block like a
 * site coming up, the phone turns toward the viewer, the glass star turns.
 */
import { headline, copy, el } from '../core/text.js';
import { photo, srHeading, depth, mapped, follower, hoverLift } from './common.js';
import { LAYERS } from '../layers.generated.js';

// laptop screen area and the UI blocks that load into it (device-layer px)
const SCREEN_QUAD = [[256, 712], [780, 684], [786, 1052], [305, 1082]];
const SCREEN_BLOCKS = [
  [280, 706, 780, 760], [292, 778, 488, 866], [300, 862, 540, 1070],
  [520, 842, 648, 962], [538, 962, 660, 1044], [644, 822, 786, 1030],
];

export function createResult(stage, cfg) {
  const s = stage.add(cfg, document.getElementById('scene-result'));
  const art = s.art;
  srHeading(s.section, 'And the RESULT');

  const type = depth(art, 'type');
  const parts = cfg.title.map((t) => ({ t, w: headline(type, t) }));
  const small = parts.find((p) => p.t.role === 'small').w;
  const main = parts.find((p) => p.t.role === 'main').w;
  const echoes = parts.filter((p) => p.t.role === 'echo');
  const c = copy(art, cfg.copy);

  const dev = mapped(art, 'devices', cfg.devices);
  photo(dev, 's3-base', 'dev-base');
  const lid = depth(dev, 'lid');
  photo(lid, 's3-lid', 'dev-lid');
  const lb = LAYERS['s3-lid'];
  const rel = ([x, y]) => `${x - lb.x}px ${y - lb.y}px`;
  const box = { left: `${lb.x}px`, top: `${lb.y}px`, width: `${lb.w}px`, height: `${lb.h}px` };
  const blank = el('div', 'screen-blank', lid, { ...box, clipPath: `polygon(${SCREEN_QUAD.map(rel).join(',')})` });
  const blocks = SCREEN_BLOCKS.map(([x0, y0, x1, y1]) => {
    const blk = photo(lid, 's3-lid-screen', 'screen-block');
    blk.style.clipPath = `polygon(${[[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(rel).join(',')})`;
    return blk;
  });
  const full = photo(lid, 's3-lid-screen');
  const phone = photo(dev, 's3-phone', 'dev-phone');
  const star = photo(dev, 's3-star', 'dev-star');
  const h = cfg.hinge;
  const ang = (Math.atan2(h.y1 - h.y0, h.x1 - h.x0) * 180) / Math.PI;
  lid.style.transformOrigin = `${(h.x0 + h.x1) / 2}px ${(h.y0 + h.y1) / 2}px`;
  const lidOpen = (deg) => `rotate(${ang}deg) rotateX(${deg}deg) rotate(${-ang}deg)`;
  const pb = LAYERS['s3-phone'];
  phone.style.transformOrigin = `${cfg.phonePivot.x - pb.x}px ${cfg.phonePivot.y - pb.y}px`;

  function scroll(tl, T) {
    const [c0, c1] = T.t23;
    const [b0] = T.result.build;
    tl.fromTo(s.section, { autoAlpha: 0 }, { autoAlpha: 1, duration: 2, ease: 'power1.out' }, c0 + 5)
      .fromTo(s.cam, { scale: 0.8, yPercent: 5 }, { scale: 1, yPercent: 0, duration: c1 - c0 - 3, ease: 'power3.out' }, c0 + 4.5)
      // the stamp
      .fromTo(main.root, { scale: 1.6, opacity: 0, transformOrigin: '20% 60%' }, { scale: 0.97, opacity: 1, duration: 1.8, ease: 'power3.in' }, b0)
      .to(main.root, { scale: 1, duration: 1.6, ease: 'back.out(3)' }, b0 + 1.8)
      .fromTo(small.chars, { yPercent: 70, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.6, stagger: 0.12, ease: 'back.out(2)' }, b0 + 1.2);
    echoes.forEach((e, i) => {
      tl.fromTo(e.w.root, { y: -(e.t.y - 388), opacity: 0 }, { y: 0, opacity: 1, duration: 2.6 + i * 0.6, ease: 'power3.out' }, b0 + 2 + i * 0.4);
    });
    tl.fromTo(c.lines.map((l) => l.firstChild), { yPercent: 110 }, { yPercent: 0, duration: 2, stagger: 0.4, ease: 'power3.out' }, b0 + 5)
      .fromTo(dev, { yPercent: 8, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 4, ease: 'power3.out' }, c0 + 5)
      .fromTo(lid, { transform: lidOpen(82) }, { transform: lidOpen(0), duration: 4.5, ease: 'power2.inOut' }, b0 + 0.5)
      // once open, drop the 3D transform so the screen is drawn flat and sharp
      .set(lid, { transform: 'none' }, b0 + 5.02)
      .fromTo(blank, { opacity: 0 }, { opacity: 1, duration: 1 }, b0 + 4.5)
      .fromTo(blocks, { opacity: 0, y: 14, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 1.3, stagger: 0.5, ease: 'power3.out' }, b0 + 5.2)
      .fromTo(full, { opacity: 0 }, { opacity: 1, duration: 1 }, b0 + 5.2 + 0.5 * blocks.length + 0.8)
      .fromTo(phone, { rotateY: -38, rotateZ: 4, x: 80, opacity: 0 }, { rotateY: 0, rotateZ: 0, x: 0, opacity: 1, duration: 4, ease: 'power3.out' }, b0 + 5.5)
      .fromTo(star, { y: 60, rotateY: -70, rotate: -14, opacity: 0, scale: 0.85 }, { y: 0, rotateY: 0, rotate: 0, opacity: 1, scale: 1, duration: 4, ease: 'back.out(1.3)' }, b0 + 4.5);

    const [d0] = T.t34;
    tl.to(s.cam, { scale: 0.86, duration: 6, ease: 'power2.in' }, d0)
      .to(s.section, { autoAlpha: 0, duration: 2.5 }, d0 + 3.5);
  }

  const fType = follower(type, (nx, ny) => ({ x: nx * -14, y: ny * -8 }), 1.1);
  const echoF = echoes.map((e, i) => follower(e.w.root, (nx) => ({ x: nx * -(14 + i * 14) }), 1.2 + i * 0.1));
  const fDev = follower(dev, (nx, ny) => ({ x: nx * 22, rotateY: nx * 9, rotateX: -ny * 6 }), 1.1);
  function pointer(nx, ny) { fType(nx, ny); echoF.forEach((f) => f(nx, ny)); fDev(nx, ny); }
  hoverLift(phone, { scale: 1.05 });
  hoverLift(star, { scale: 1.12, rotate: 12 });

  return { s, scroll, pointer, titles: [...small.chars, ...main.chars] };
}
