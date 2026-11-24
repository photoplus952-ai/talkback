/**
 * Flight path of the paper plane across the four scenes.
 *
 * Keyframes are authored against the compositions (reference pixels of a
 * scene) or the viewport (fractions), plus a depth z in px toward the viewer.
 * Between keyframes the plane follows a Catmull-Rom spline; when no rotation
 * is given it faces along its path and banks into turns automatically.
 *
 *   t      timeline units (0..100), same clock as the scroll timeline
 *   at     ['scene', x, y, group?] in reference px, or ['vp', fx, fy] viewport fractions
 *   z      px toward the viewer (0 = touching the page). 'cam' values are
 *          fractions of the camera distance (1 = at the lens)
 *   rot    [x, y, z] degrees (Euler ZYX). Omit for automatic heading.
 *   ease   easing of the segment that LEAVES this keyframe
 *   layer  'top' (above every scene) | 'mid' (between scene back & front layers)
 *   sil    0..1 cobalt silhouette      op  opacity
 *   sc     size factor (1 = the plane as drawn in frame 01); carries forward
 */
import * as THREE from 'three';

// Resting pose on THE IDEA (matches the plane in frame 01)
export const REST_ROT = [14, 12, 20];

export const PATH = [
  { t: 0, at: ['idea', 612, 880], z: 42, rot: REST_ROT, ease: 'inOut', layer: 'top', sc: 1 },
  { t: 4.5, at: ['idea', 616, 866], z: 70, rot: [10, 8, 24], ease: 'in' },
  { t: 9, at: ['idea', 800, 690], z: 280, ease: 'linear' },
  { t: 13, at: ['vp', 0.84, 0.2], z: 360, ease: 'linear', sc: 0.8 },
  { t: 17, at: ['vp', 0.7, 0.36], z: 240, ease: 'linear', sc: 0.5 },
  { t: 21, at: ['process', 560, 990, 'desk'], z: 150, ease: 'linear' },
  { t: 25, at: ['process', 240, 1170, 'desk'], z: 110, ease: 'linear' },
  { t: 29, at: ['vp', 0.04, 0.24], z: 320, ease: 'in' },
  { t: 31, at: ['vp', -0.25, 0.1], z: 420, op: 0, ease: 'linear' },
  { t: 38, at: ['vp', -0.2, 0.95], z: 200, op: 0, ease: 'linear', sc: 0.6 },
  { t: 41, at: ['vp', 0.16, 0.8], z: 380, ease: 'linear' },
  { t: 45, at: ['vp', 0.46, 0.58], z: { cam: 0.72 }, ease: 'linear' },
  { t: 47.5, at: ['vp', 0.56, 0.46], z: { cam: 1.15 }, op: 0, ease: 'linear' },
  { t: 52, at: ['product', 1180, 640], z: -80, op: 0, sil: 1, layer: 'mid', ease: 'linear', sc: 0.42 },
  { t: 54, at: ['product', 1010, 760], z: -60, sil: 1, ease: 'linear' },
  { t: 58, at: ['product', 470, 820], z: -70, sil: 1, ease: 'linear' },
  { t: 61, at: ['product', 120, 600], z: 120, sil: 0.4, ease: 'linear' },
  { t: 62.6, at: ['vp', -0.22, 0.2], z: 260, op: 0, sil: 0, layer: 'top', ease: 'linear' },
  { t: 67, at: ['vp', 0.52, 0.62], z: -1400, op: 0, ease: 'linear' },
  { t: 69, at: ['vp', 0.5, 0.58], z: -900, ease: 'linear' },
  { t: 74, at: ['vp', 0.48, 0.5], z: { cam: 0.55 }, ease: 'linear' },
  { t: 77, at: ['vp', 0.44, 0.44], z: { cam: 1.15 }, op: 0, ease: 'linear' },
  { t: 81, at: ['vp', 1.15, 0.85], z: 260, op: 0, ease: 'linear', sc: 0.5 },
  { t: 84, at: ['result', 1000, 930], z: 230, ease: 'linear' },
  { t: 88, at: ['result', 800, 760], z: 120, ease: 'inOut' },
  { t: 95, at: ['vp', 0.86, 0.14], z: -1600, op: 0.9, ease: 'out' },
  { t: 100, at: ['vp', 0.9, 0.08], z: -4200, op: 0 },
];

/** opening shot, played by time (seconds) before scrolling starts */
export const INTRO = [
  { t: 0, at: ['vp', 0.56, 0.34], z: { cam: 0.5 }, rot: [78, -30, 8], op: 0, ease: 'out' },
  { t: 0.7, at: ['vp', 0.57, 0.36], z: { cam: 0.46 }, rot: [70, -26, 12], ease: 'inOut' },
  { t: 1.9, at: ['vp', 0.74, 0.26], z: 520, rot: [40, -4, 32], ease: 'linear' },
  { t: 3.3, at: ['idea', 612, 880], z: 42, rot: REST_ROT, ease: 'inOut' },
];

const EASE = {
  linear: (u) => u,
  in: (u) => u * u * u,
  out: (u) => 1 - (1 - u) ** 3,
  inOut: (u) => (u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2),
};

const smooth = (a, b, x) => {
  const u = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return u * u * (3 - 2 * u);
};

export class Flight {
  constructor(stage, keys) {
    this.stage = stage;
    this.keys = keys;
    this.euler = new THREE.Euler();
    this.q = new THREE.Quaternion();
    this.qa = new THREE.Quaternion();
    this.qb = new THREE.Quaternion();
    this.m = new THREE.Matrix4();
    this.lastFwd = new THREE.Vector3(1, 0, 0);
  }

  /** resolve authored positions to screen px (call after stage.layout) */
  resolve(camDist) {
    const { stage } = this;
    this.pts = this.keys.map((k) => {
      const [kind, a, b, group] = k.at;
      const [x, y] = kind === 'vp' ? [a * stage.vw, b * stage.vh] : stage.toScreen(kind, a, b, group);
      const z = typeof k.z === 'object' ? k.z.cam * camDist : k.z;
      return new THREE.Vector3(x, y, z);
    });
    this.explicit = this.keys.map((k) => (k.rot ? this.quatFromDeg(k.rot, new THREE.Quaternion()) : null));
    this.tangents();
  }

  quatFromDeg(r, out) {
    this.euler.set(THREE.MathUtils.degToRad(r[0]), THREE.MathUtils.degToRad(r[1]), THREE.MathUtils.degToRad(r[2]), 'ZYX');
    return out.setFromEuler(this.euler);
  }

  /** segment index and linear progress u (0..1) inside it */
  segment(t) {
    const k = this.keys;
    if (t <= k[0].t) return [0, 0];
    for (let i = 0; i < k.length - 1; i++) {
      if (t <= k[i + 1].t) return [i, (t - k[i].t) / (k[i + 1].t - k[i].t)];
    }
    return [k.length - 2, 1];
  }

  /**
   * Time-knotted cubic Hermite spline: velocity is continuous across every
   * keyframe (no speed jumps). Keys marked as rests ('inOut' / 'in' / 'out')
   * get a zero tangent, so the plane eases in and out of them.
   */
  tangents() {
    const k = this.keys; const p = this.pts; const n = k.length;
    const still = new Set();
    k.forEach((key, i) => {
      if (key.ease === 'inOut') { still.add(i); still.add(i + 1); }
      if (key.ease === 'in') still.add(i);
      if (key.ease === 'out') still.add(i + 1);
    });
    this.tan = p.map((pt, i) => {
      if (still.has(i)) return new THREE.Vector3();
      const a = Math.max(i - 1, 0); const b = Math.min(i + 1, n - 1);
      return p[b].clone().sub(p[a]).divideScalar(Math.max(k[b].t - k[a].t, 1e-3));
    });
  }

  position(t, out = new THREE.Vector3()) {
    const [i, u] = this.segment(t);
    const p0 = this.pts[i]; const p1 = this.pts[i + 1];
    const dt = this.keys[i + 1].t - this.keys[i].t;
    const m0 = this.tan[i]; const m1 = this.tan[i + 1];
    const u2 = u * u; const u3 = u2 * u;
    const h00 = 2 * u3 - 3 * u2 + 1; const h10 = u3 - 2 * u2 + u; const h01 = -2 * u3 + 3 * u2; const h11 = u3 - u2;
    for (const ax of ['x', 'y', 'z']) {
      out[ax] = h00 * p0[ax] + h10 * dt * m0[ax] + h01 * p1[ax] + h11 * dt * m1[ax];
    }
    return out;
  }

  /** scalar channel (op, sil) linearly interpolated with the segment easing */
  channel(t, name, def) {
    const [i, u0] = this.segment(t);
    const u = u0 * u0 * (3 - 2 * u0);
    const val = (j) => {
      for (let n = j; n >= 0; n--) if (this.keys[n][name] !== undefined) return this.keys[n][name];
      return def;
    };
    const a = this.keys[i][name] ?? (name === 'op' ? 1 : val(i));
    const b = this.keys[i + 1][name] ?? (name === 'op' ? 1 : val(i + 1));
    return a + (b - a) * u;
  }

  layer(t) {
    let l = 'top';
    for (const k of this.keys) { if (k.t <= t && k.layer) l = k.layer; }
    return l;
  }

  /** full pose at time t */
  pose(t) {
    const pos = this.position(t, new THREE.Vector3());
    const dt = 0.12;
    const a = this.position(t - dt, new THREE.Vector3());
    const b = this.position(t + dt, new THREE.Vector3());
    // screen space -> world axes (y up)
    const vel = new THREE.Vector3(b.x - a.x, -(b.y - a.y), b.z - a.z);
    const acc = new THREE.Vector3(b.x + a.x - 2 * pos.x, -(b.y + a.y - 2 * pos.y), b.z + a.z - 2 * pos.z);
    if (vel.lengthSq() > 1e-4) this.lastFwd.copy(vel).normalize();
    const fwd = this.lastFwd.clone();

    // automatic heading: wings face the viewer, bank into the turn
    const up = new THREE.Vector3(0, 0.45, 1);
    const lat = acc.clone().sub(fwd.clone().multiplyScalar(acc.dot(fwd)));
    up.addScaledVector(lat, 0.06 / Math.max(vel.length() * 0.02, 0.15));
    up.sub(fwd.clone().multiplyScalar(up.dot(fwd))).normalize();
    const side = new THREE.Vector3().crossVectors(fwd, up).normalize();
    this.m.makeBasis(fwd, up, side);
    this.qa.setFromRotationMatrix(this.m);

    // blend toward authored rotations near their keyframes
    let best = 0; let qe = null;
    this.keys.forEach((k, i) => {
      if (!this.explicit[i]) return;
      const prev = this.keys[i - 1]; const next = this.keys[i + 1];
      const before = prev ? (k.t - prev.t) * 0.9 : 1;
      const after = next ? (next.t - k.t) * 0.9 : 1;
      const w = t < k.t ? smooth(k.t - before, k.t, t) : 1 - smooth(k.t, k.t + after, t);
      if (w > best) { best = w; qe = this.explicit[i]; }
    });
    const q = this.qa.clone();
    const [si, su] = this.segment(t);
    if (this.explicit[si] && this.explicit[si + 1]) {
      // both ends authored: rotate straight from one pose to the other
      q.copy(this.explicit[si]).slerp(this.explicit[si + 1], su * su * (3 - 2 * su));
    } else if (qe) q.slerp(qe, best);

    return {
      x: pos.x, y: pos.y, z: pos.z, q,
      opacity: Math.min(Math.max(this.channel(t, 'op', 1), 0), 1),
      silhouette: Math.min(Math.max(this.channel(t, 'sil', 0), 0), 1),
      scale: this.channel(t, 'sc', 1),
      layer: this.layer(t),
    };
  }
}
