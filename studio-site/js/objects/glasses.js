/**
 * The thread of the story: the blue sunglasses from screen 01.
 * They drop in when the site opens, rest on the title, then, with the scroll,
 * tilt down, turn and fly to the desk of screen 02, where they lie next to the
 * laptop (the scene's own copy takes over at the landing, see process.js).
 *
 * Keyframes: t = timeline units (0..100), at = [scene, x, y] in frame px,
 * ['desk', x, y] in desk-layer px, or ['vp', fx, fy] viewport fractions;
 * w = width in frame px; rx / ry / rz = degrees.
 */
import { WELCOME, PROCESS } from '../config.js';
import { LAND_T } from '../scenes/process.js';

const REST = WELCOME.glasses;
const D = PROCESS.desk;
const ON_DESK = PROCESS.glassesOnDesk;

export const PATH = [
  { t: 0, at: ['welcome', REST.x, REST.y], w: REST.w, rx: 0, ry: 0, rz: 0 },
  { t: 3, at: ['welcome', REST.x, REST.y - 6], w: REST.w, rx: 0, ry: 0, rz: 0 },
  { t: 8, at: ['vp', 0.62, 0.3], w: 640, rx: 30, ry: 35, rz: -24 },
  { t: 12.5, at: ['vp', 0.74, 0.4], w: 430, rx: 48, ry: -18, rz: 14 },
  { t: LAND_T, at: ['desk', ON_DESK.x, ON_DESK.y], w: ON_DESK.w * D.scale, rx: 0, ry: 0, rz: 0 },
];

const ease = (u) => u * u * (3 - 2 * u);

export class Glasses {
  constructor(stage, layer) {
    this.stage = stage;
    this.el = document.createElement('div');
    this.el.className = 'glasses-fly';
    this.el.innerHTML = '<img src="assets/scene/glasses.png" alt="משקפי שמש כחולים">';
    layer.appendChild(this.el);
    this.drop = { y: 0, op: 1, rot: 0 }; // opening drop, tweened by main.js
  }

  point(k) {
    const [kind, a, b] = k.at;
    if (kind === 'vp') return [a * this.stage.vw, b * this.stage.vh, this.stage.scale('welcome')];
    if (kind === 'desk') {
      const [x, y] = this.stage.toScreen('process', D.x + a * D.scale, D.y + (b - D.refY0) * D.scale);
      return [x, y, this.stage.scale('process')];
    }
    const [x, y] = this.stage.toScreen(kind, a, b);
    return [x, y, this.stage.scale(kind)];
  }

  render(t, now, pointer) {
    const P = PATH;
    const visible = t < LAND_T;
    this.el.style.visibility = visible ? 'visible' : 'hidden';
    if (!visible) return;
    let i = 0;
    while (i < P.length - 2 && t > P[i + 1].t) i++;
    const k0 = P[i]; const k1 = P[i + 1];
    const u = ease(Math.min(Math.max((t - k0.t) / (k1.t - k0.t), 0), 1));
    const [x0, y0, s0] = this.point(k0); const [x1, y1, s1] = this.point(k1);
    // a gentle arc between keyframes: lift in the middle of each hop
    const lift = Math.sin(u * Math.PI) * 40 * s1;
    const x = x0 + (x1 - x0) * u;
    const y = y0 + (y1 - y0) * u - lift;
    const w = k0.w * s0 + (k1.w * s1 - k0.w * s0) * u;
    const lerp = (p) => k0[p] + (k1[p] - k0[p]) * u;
    const calm = Math.max(0, 1 - t / 3);
    const bob = Math.sin(now * 1.4) * 5 * s0 * calm;
    const px = pointer.sx * 26 * s0 * calm; const py = pointer.sy * 16 * s0 * calm;
    const h = w * 0.45;
    this.el.style.width = `${w}px`;
    this.el.style.height = `${h}px`;
    this.el.style.opacity = this.drop.op;
    this.el.style.transform = `translate3d(${x - w / 2 + px}px, ${y - h / 2 + bob + py + this.drop.y * s0}px, 0) rotateX(${lerp('rx')}deg) rotateY(${lerp('ry') + pointer.sx * 10 * calm}deg) rotateZ(${lerp('rz') + this.drop.rot - pointer.sx * 3 * calm}deg)`;
    // shadow grows softer while the glasses are up in the air
    const air = Math.sin(u * Math.PI) * (i > 0 ? 1 : 0) + (this.drop.y < -5 ? 1 : 0);
    this.el.style.setProperty('--sh', `${8 + air * 26}px`);
    this.el.style.setProperty('--sy', `${14 + air * 40}px`);
  }
}
