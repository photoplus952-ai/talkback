/**
 * The Flying Idea: a procedural folded-paper dart rendered with Three.js.
 *
 * World units are CSS pixels: the plane z = 0 is the page (screen surface),
 * x/y = 0 is the viewport centre, +z comes toward the viewer. That keeps the
 * 3D object locked to the HTML compositions underneath it.
 *
 * The page receives a soft contact shadow, so the plane really sits above the
 * typography. Material can morph into a cobalt silhouette (scene 03).
 */
import * as THREE from 'three';

const PAPER = new THREE.Color('#F7F7FA');
const COBALT = new THREE.Color('#0A2FD2');
const WHITE = new THREE.Color('#ffffff');

function paperTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#f8f8fa';
  g.fillRect(0, 0, 512, 512);
  const img = g.getImageData(0, 0, 512, 512);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 7;
    img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
  g.globalAlpha = 0.05;
  for (let i = 0; i < 90; i++) {
    g.strokeStyle = Math.random() > 0.5 ? '#ffffff' : '#c9c9d2';
    g.beginPath();
    const x = Math.random() * 512; const y = Math.random() * 512;
    g.moveTo(x, y);
    g.lineTo(x + (Math.random() - 0.5) * 120, y + (Math.random() - 0.5) * 30);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** keel print: the "DIA DOS" mark seen on the plane in frame 01 */
function keelTexture(mirror) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#f4f4f7';
  g.fillRect(0, 0, 1024, 256);
  // UV: u along the keel (1 = nose), v up (1 = spine). Print sits near the spine.
  g.save();
  if (mirror) { g.translate(1024, 0); g.scale(-1, 1); }
  g.fillStyle = 'rgba(72,72,80,0.8)';
  g.font = "800 84px 'Archivo', 'Arial Black', sans-serif";
  g.translate(mirror ? 160 : 380, 112);
  g.rotate(-0.06);
  g.fillText('DIA DOS', 0, 0);
  g.restore();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function tri(a, b, c, uv) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c], 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv || [1, 0.5, 0, 0.5, 0, 1], 2));
  g.computeVertexNormals();
  return g;
}

/** Dart, length 1, nose at +x. */
function buildDart(mats) {
  const group = new THREE.Group();
  const N = [0.5, 0, 0];
  const T = [-0.5, 0.0, 0];
  const K = [-0.5, -0.2, 0];
  const add = (geo, mat) => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return m;
  };
  for (const s of [-1, 1]) {
    // Y-shaped dart: wings rise from the spine (dihedral), keel hangs below
    const M = [-0.5, 0.045, 0.13 * s];
    const W = [-0.46, 0.14, 0.33 * s];
    const F = [-0.5, -0.004, 0.012 * s];
    // inner wing panel, outer wing panel (crease between them)
    add(tri(N, F, M, [1, 0.5, 0, 0.48, 0, 0.3]), mats.wing);
    add(tri(N, M, W, [1, 0.5, 0, 0.3, 0.05, 0]), mats.wing);
    // keel side (single sided, printed)
    const kz = 0.004 * s;
    const a = [N[0], N[1], kz * 0.2];
    const b = [T[0], T[1], kz];
    const c = [K[0], K[1], kz];
    const geo = s > 0 ? tri(a, b, c, [1, 1, 0, 1, 0, 0]) : tri(a, c, b, [1, 1, 0, 0, 0, 1]);
    add(geo, s > 0 ? mats.keelR : mats.keelL);
  }
  return group;
}

export class PaperPlane {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, 1, 10, 20000);

    const hemi = new THREE.HemisphereLight('#ffffff', '#b9bfdc', 1.6);
    this.scene.add(hemi);
    const key = new THREE.DirectionalLight('#ffffff', 2.4);
    this.key = key;
    this.scene.add(key, key.target);
    const rim = new THREE.DirectionalLight('#dfe5ff', 0.7);
    rim.position.set(-600, -300, 500);
    this.scene.add(rim);

    // contact shadow on the page: a soft elongated blob (much cheaper than a
    // real-time shadow map, and softer, like the shadow in frame 01)
    const sc = document.createElement('canvas'); sc.width = 256; sc.height = 128;
    const sg = sc.getContext('2d');
    const grd = sg.createRadialGradient(128, 64, 4, 128, 64, 64);
    grd.addColorStop(0, 'rgba(11,18,64,0.55)'); grd.addColorStop(0.55, 'rgba(11,18,64,0.18)'); grd.addColorStop(1, 'rgba(11,18,64,0)');
    sg.setTransform(2, 0, 0, 1, -128, 0); sg.fillStyle = grd; sg.fillRect(0, 0, 256, 128);
    this.shadowMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false, opacity: 0.3 });
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.shadowMat);
    this.shadow.renderOrder = -1;
    this.scene.add(this.shadow);
    this.fwd = new THREE.Vector3();

    const paper = paperTexture();
    const std = (map) => new THREE.MeshStandardMaterial({
      color: PAPER.clone(), map, roughness: 0.82, metalness: 0, side: THREE.DoubleSide, flatShading: true,
      transparent: true,
    });
    this.mats = {
      wing: std(paper),
      keelL: std(keelTexture(true)),
      keelR: std(keelTexture(false)),
    };
    this.mats.keelL.side = THREE.FrontSide;
    this.mats.keelR.side = THREE.FrontSide;
    Object.values(this.mats).forEach((m) => { m.emissive = new THREE.Color('#000'); });

    this.pivot = new THREE.Group();
    this.dart = buildDart(this.mats);
    this.pivot.add(this.dart);
    this.scene.add(this.pivot);

    this.tmpQ = new THREE.Quaternion();
    this.silhouette = 0;
  }

  resize(vw, vh) {
    this.vw = vw; this.vh = vh;
    this.renderer.setSize(vw, vh, false);
    this.camera.aspect = vw / vh;
    this.camera.fov = 30;
    this.dist = vh / 2 / Math.tan(THREE.MathUtils.degToRad(15));
    this.camera.near = 10;
    this.camera.far = this.dist * 4;
    this.camera.position.set(0, 0, this.dist);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();
    // key light from the upper right, in front of the page
    const k = this.key;
    k.position.set(vw * 0.32, vh * 0.55, 1400);
    k.target.position.set(0, 0, 0);
  }

  /**
   * pose: { x, y (screen px), z (px toward viewer), q (THREE.Quaternion),
   *         size (px length), silhouette 0..1, opacity 0..1, shadow 0..1 }
   */
  setPose(p) {
    // x/y are where the plane should APPEAR on screen; unproject for its depth
    const k = Math.max(this.dist - p.z, 1) / this.dist;
    this.pivot.position.set((p.x - this.vw / 2) * k, (this.vh / 2 - p.y) * k, p.z);
    this.pivot.quaternion.copy(p.q);
    this.pivot.scale.setScalar(p.size);
    const sil = p.silhouette || 0;
    // close to the lens the paper fills the frame: keep it bright, like a white wipe
    const glow = Math.min(Math.max((p.z - this.dist * 0.25) / (this.dist * 0.4), 0), 1) * (1 - sil);
    if (sil !== this.silhouette || glow !== this.glow) {
      for (const m of Object.values(this.mats)) {
        m.color.copy(PAPER).lerp(COBALT, sil);
        m.emissive.copy(COBALT).multiplyScalar(sil * 0.55).add(WHITE.clone().multiplyScalar(glow * 0.62));
        m.roughness = 0.82 - sil * 0.4;
      }
      this.silhouette = sil;
      this.glow = glow;
    }
    const op = p.opacity ?? 1;
    for (const m of Object.values(this.mats)) m.opacity = op;
    this.pivot.visible = op > 0.002;
    // shadow: falls down-left (light from the upper right), grows softer and
    // fainter as the plane climbs away from the page
    const h = Math.max(p.z, 0);
    const fade = Math.max(0, 1 - h / 700);
    this.fwd.set(1, 0, 0).applyQuaternion(p.q);
    this.shadow.visible = op > 0.002 && fade > 0.01 && p.z > -40;
    this.shadow.position.set(this.pivot.position.x - h * 0.35, this.pivot.position.y - h * 0.55 - p.size * 0.06, 0);
    this.shadow.rotation.z = Math.atan2(this.fwd.y, this.fwd.x);
    const spread = 1 + h / 260;
    this.shadow.scale.set(p.size * 0.95 * spread, p.size * 0.3 * spread, 1);
    this.shadowMat.opacity = 0.42 * (p.shadow ?? 1) * op * fade;
    this.visible = this.pivot.visible;
  }

  /** draws only when something changed (an invisible plane costs nothing) */
  render() {
    if (!this.visible && this.wasVisible === false) return;
    this.wasVisible = this.visible;
    this.renderer.render(this.scene, this.camera);
  }
}
