/**
 * The thread of the story: the blue sunglasses from screen 01.
 * They drop in when the site opens and rest on the title. With the scroll they
 * lift off, glide in one smooth curve over the desk of screen 02 and land next
 * to the laptop, where the scene's own copy takes over (see process.js).
 *
 * The photo is never skewed in 3D (that distorts it): the flight uses only
 * position, size and a gentle in-plane turn, plus a shadow that grows softer
 * and further away while they are in the air.
 *
 * Keyframes: t = timeline units, at = [scene, x, y] in frame px,
 * ['desk', x, y] in desk-layer px or ['vp', fx, fy] viewport fractions,
 * w = width in frame px, rz = degrees, rest = the glasses stand still there.
 */
import { WELCOME, PROCESS } from '../config.js';
import { LAND_T } from '../scenes/process.js';

const REST = WELCOME.glasses;
const D = PROCESS.desk;
const ON_DESK = PROCESS.glassesOnDesk;

export const PATH = [
  { t: 0, at: ['welcome', REST.x, REST.y], w: REST.w, rz: 0, rest: true },
  { t: 3.5, at: ['welcome', REST.x, REST.y - 10], w: REST.w, rz: 0 },
  { t: 8, at: ['vp', 0.7, 0.3], w: 600, rz: -9 },
  { t: 12.5, at: ['vp', 0.66, 0.48], w: 380, rz: 7 },
  { t: LAND_T, at: ['desk', ON_DESK.x, ON_DESK.y], w: ON_DESK.w * D.scale, rz: 0, rest: true },
];

export class Glasses {
  constructor(stage, layer) {
    this.stage = stage;
    this.el = document.createElement('div');
    this.el.className = 'glasses-fly';
    this.el.innerHTML = '<img src="assets/scene/glasses.png" alt="משקפי שמש כחולים">';
    layer.appendChild(this.el);
    this.drop = { y: 0, op: 1, rot: 0 }; // opening drop, tweened by main.js
  }

  /** keyframe -> [screen x, screen y, screen width, rotation] */
  point(k) {
    const st = this.stage;
    let x; let y; let s;
    const [kind, a, b] = k.at;
    if (kind === 'vp') { x = a * st.vw; y = b * st.vh; s = st.scale('welcome'); }
    else if (kind === 'desk') { [x, y] = st.toScreen('process', D.x + a * D.scale, D.y + (b - D.refY0) * D.scale); s = st.scale('process'); }
    else { [x, y] = st.toScreen(kind, a, b); s = st.scale(kind); }
    return [x, y, k.w * s, k.rz];
  }

  /**
   * Time-knotted cubic Hermite through all keyframes: speed is continuous,
   * so the flight is one gesture instead of hops; rests get a zero tangent.
   */
  sample(t) {
    const P = PATH;
    const pts = P.map((k) => this.point(k));
    let i = 0;
    while (i < P.length - 2 && t > P[i + 1].t) i++;
    const t0 = P[i].t; const t1 = P[i + 1].t; const dt = t1 - t0;
    const u = Math.min(Math.max((t - t0) / dt, 0), 1);
    const tan = (j) => {
      if (P[j].rest) return [0, 0, 0, 0];
      const a = Math.max(j - 1, 0); const b = Math.min(j + 1, P.length - 1);
      return pts[b].map((v, c) => (v - pts[a][c]) / (P[b].t - P[a].t));
    };
    const m0 = tan(i); const m1 = tan(i + 1);
    const u2 = u * u; const u3 = u2 * u;
    const h00 = 2 * u3 - 3 * u2 + 1; const h10 = u3 - 2 * u2 + u; const h01 = -2 * u3 + 3 * u2; const h11 = u3 - u2;
    const v = pts[i].map((p0, c) => h00 * p0 + h10 * dt * m0[c] + h01 * pts[i + 1][c] + h11 * dt * m1[c]);
    // height above the page: 0 at the rests, 1 in the middle of the flight
    const air = Math.sin(Math.min(Math.max((t - P[1].t) / (P[P.length - 1].t - P[1].t), 0), 1) * Math.PI);
    return { x: v[0], y: v[1], w: v[2], rz: v[3], air };
  }

  render(t, now, pointer) {
    const visible = t < LAND_T;
    this.el.style.visibility = visible ? 'visible' : 'hidden';
    if (!visible) return;
    const { x, y, w, rz, air } = this.sample(t);
    const s0 = this.stage.scale('welcome');
    const calm = Math.max(0, 1 - t / 3);
    const bob = Math.sin(now * 1.4) * 5 * s0 * calm;
    const px = pointer.sx * 26 * s0 * calm; const py = pointer.sy * 16 * s0 * calm;
    const h = w * (356 / 824);
    this.el.style.width = `${w}px`;
    this.el.style.height = `${h}px`;
    this.el.style.opacity = this.drop.op;
    this.el.style.transform = `translate3d(${x - w / 2 + px}px, ${y - h / 2 + bob + py + this.drop.y * s0}px, 0) rotate(${rz + this.drop.rot - pointer.sx * 3 * calm}deg) scale(${1 + air * 0.06})`;
    const inAir = air + (this.drop.y < -5 ? 1 : 0);
    this.el.style.setProperty('--sh', `${8 + inAir * 22}px`);
    this.el.style.setProperty('--sy', `${12 + inAir * 46}px`);
    this.el.style.setProperty('--so', `${0.22 - inAir * 0.08}`);
  }
}
