/**
 * Boot: builds the four scenes, the plane and one master timeline that the
 * scroll position scrubs (reversible by construction).
 */
import { SCENES, TIMING, IDEA, PROCESS, PRODUCT, RESULT } from './config.js';
import { Stage } from './core/stage.js';
import { clearMetrics } from './core/typography.js';
import { createIdea } from './scenes/idea.js';
import { createProcess } from './scenes/process.js';
import { createProduct } from './scenes/product.js';
import { createResult } from './scenes/result.js';
import { PaperPlane } from './objects/paperPlane.js';
import { Flight, PATH, INTRO } from './objects/flight.js';

const params = new URLSearchParams(location.search);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || params.has('static');
const root = document.documentElement;
root.classList.toggle('is-static', reduced);
root.classList.add('js');

const stage = new Stage(document.querySelector('.viewport'));
stage.staticMode = reduced;
const idea = createIdea(stage, IDEA);
const process = createProcess(stage, PROCESS);
const product = createProduct(stage, PRODUCT);
const result = createResult(stage, RESULT);
const scenes = [idea, process, product, result];

/* reference overlay for art-direction checks: ?ref=1 (or press R) */
function refOverlay(on) {
  for (const sc of scenes) {
    let o = sc.s.art.querySelector('.ref-overlay');
    if (!o && on) {
      o = document.createElement('img');
      o.className = 'ref-overlay';
      o.src = sc.s.cfg.ref.src;
      o.alt = '';
      sc.s.art.appendChild(o);
    }
    if (o) o.hidden = !on;
  }
  root.classList.toggle('show-ref', on);
}

/* ---------------- plane ---------------- */
const canvas = document.querySelector('.plane-canvas');
let plane = null;
try { plane = new PaperPlane(canvas); } catch (err) { console.warn('WebGL unavailable', err); canvas.remove(); }
const flight = new Flight(stage, PATH);
const introFlight = new Flight(stage, INTRO);

function layout() {
  clearMetrics();
  stage.layout(reduced);
  if (plane) plane.resize(stage.vw, stage.vh);
  const dist = plane ? plane.dist : stage.vh * 1.87;
  flight.resolve(dist);
  introFlight.resolve(dist);
  // iris for scene 04 opens where the plane crosses the lens
  const p = flight.pose(76);
  result.s.section.style.setProperty('--cx', `${p.x}px`);
  result.s.section.style.setProperty('--cy', `${p.y}px`);
  planeSize = IDEA.plane.length * stage.scale('idea');
}
let planeSize = 300;

/* ---------------- master timeline ---------------- */
const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
let introTl = null;
let st = null;
let lenis = null;

function buildTimeline() {
  scenes.forEach((sc) => sc.scroll && sc.scroll(tl, TIMING));
  tl.set({}, {}, TIMING.total); // fix the length to 100 units
  // page tint follows the scenes
  const bgs = SCENES.map((c) => c.bg);
  tl.fromTo(document.body, { backgroundColor: bgs[0] }, { backgroundColor: bgs[1], duration: 10 }, TIMING.t12[0] + 4)
    .to(document.body, { backgroundColor: bgs[2], duration: 8 }, TIMING.t23[0] + 4)
    .to(document.body, { backgroundColor: bgs[3], duration: 8 }, TIMING.t34[0] + 4);
}

function setupScroll() {
  gsap.registerPlugin(ScrollTrigger);
  const scroller = document.querySelector('.scroller');
  scroller.style.height = `${TIMING.scrollLength * 100}vh`;
  if (window.Lenis) {
    lenis = new window.Lenis({ duration: 1.15, smoothWheel: true, wheelMultiplier: 0.9 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  st = ScrollTrigger.create({
    trigger: scroller, start: 'top top', end: 'bottom bottom', scrub: 0.7, animation: tl,
    onUpdate: (self) => updateNav(self.progress),
  });
}

/* ---------------- navigation (works with and without motion) ---------------- */
const navButtons = [...document.querySelectorAll('.scene-nav button')];
const anchors = [0, TIMING.process.rest[0] + 2, TIMING.product.rest[0] + 3, TIMING.result.rest[0] + 4];
function updateNav(progress) {
  const t = progress * TIMING.total;
  let active = 0;
  anchors.forEach((a, i) => { if (t >= a - 6) active = i; });
  navButtons.forEach((b, i) => b.setAttribute('aria-current', i === active ? 'step' : 'false'));
  document.querySelector('.scene-nav').style.setProperty('--p', progress.toFixed(4));
}
navButtons.forEach((btn, i) => btn.addEventListener('click', () => {
  if (reduced || !st) {
    document.getElementById(`scene-${SCENES[i].id}`).scrollIntoView({ behavior: 'auto' });
    return;
  }
  const y = st.start + (st.end - st.start) * (anchors[i] / TIMING.total);
  if (lenis) lenis.scrollTo(y, { duration: 1.8 });
  else window.scrollTo({ top: y, behavior: 'smooth' });
}));

/* ---------------- pointer ---------------- */
const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
if (!reduced) {
  addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / innerWidth) * 2 - 1;
    pointer.y = (e.clientY / innerHeight) * 2 - 1;
    scenes.forEach((sc) => sc.pointer && sc.pointer(pointer.x, pointer.y));
  }, { passive: true });
}

/* ---------------- headline letters lean toward the pointer ---------------- */
// Uses the CSS `translate` property so it never fights the scroll tweens (which use `transform`).
const MAGNET = [
  { from: -1, to: 9, items: idea.titles },
  { from: 13, to: 42, items: process.titles },
  { from: 50, to: 69, items: product.titles },
  { from: 80, to: 101, items: result.titles },
].map((g) => ({ ...g, items: g.items.map((it) => ({ els: Array.isArray(it) ? it : [it], x: 0, y: 0 })) }));
let pointerActive = false;
addEventListener('pointermove', (e) => { pointerActive = e.pointerType === 'mouse'; pointer.cx = e.clientX; pointer.cy = e.clientY; }, { passive: true });
document.addEventListener('pointerleave', () => { pointerActive = false; });

function magnet(t) {
  for (const g of MAGNET) {
    const live = pointerActive && t >= g.from && t <= g.to;
    for (const it of g.items) {
      let tx = 0; let ty = 0;
      if (live) {
        const r = it.els[0].getBoundingClientRect();
        const dx = pointer.cx - (r.left + r.width / 2) + it.x;
        const dy = pointer.cy - (r.top + r.height / 2) + it.y;
        const d = Math.hypot(dx, dy);
        const R = Math.max(r.height * 1.6, 120);
        const k = d < R ? (1 - d / R) ** 2 : 0;
        tx = dx * 0.16 * k; ty = dy * 0.16 * k;
      }
      if (Math.abs(tx - it.x) < 0.01 && Math.abs(ty - it.y) < 0.01 && !live) continue;
      it.x += (tx - it.x) * 0.14;
      it.y += (ty - it.y) * 0.14;
      // translate is applied inside the scaled artboard: convert screen px to frame px
      const sc = stage.scenes.get(SCENES[MAGNET.indexOf(g)].id).fit.s;
      for (const el of it.els) el.style.translate = `${(it.x / sc).toFixed(2)}px ${(it.y / sc).toFixed(2)}px`;
    }
  }
}

/* ---------------- render loop ---------------- */
let introDone = reduced;

function frame() {
  magnet(tl.time());
  if (!plane) return;
  const now = performance.now() / 1000;
  const t = tl.time();
  let pose;
  if (!introDone) {
    const it = introTl ? introTl.time() : 0;
    pose = introFlight.pose(Math.min(it, INTRO[INTRO.length - 1].t));
    if (it >= INTRO[INTRO.length - 1].t) introDone = true;
  } else {
    pose = flight.pose(t);
  }
  // breathing hover, strongest when resting
  const calm = Math.max(0, 1 - Math.abs(t - 0) / 6);
  pointer.sx += (pointer.x - pointer.sx) * 0.05;
  pointer.sy += (pointer.y - pointer.sy) * 0.05;
  const s = stage.scale('idea');
  if (pose.y === undefined) return;
  pose.y += Math.sin(now * 1.3) * 4 * s * (0.4 + calm);
  pose.z += Math.sin(now * 0.9) * 6 * (0.4 + calm);
  const wob = new pose.q.constructor().setFromAxisAngle({ x: 1, y: 0, z: 0, isVector3: true }, Math.sin(now * 1.1) * 0.025 + pointer.sy * 0.05 * calm);
  pose.q.multiply(wob);
  pose.size = planeSize * (pose.scale || 1);
  plane.setPose(pose);
  canvas.dataset.layer = pose.layer;
  plane.render();
}

/* ---------------- boot ---------------- */
async function boot() {
  layout();
  if (params.has('ref')) refOverlay(true);
  addEventListener('keydown', (e) => { if (e.key === 'r' && e.altKey) refOverlay(!root.classList.contains('show-ref')); });

  try { await document.fonts.ready; } catch (_) { /* ignore */ }
  layout();
  document.fonts.addEventListener?.('loadingdone', () => { layout(); ScrollTrigger?.refresh?.(); });

  if (reduced) {
    // static, readable document: every scene in its resting composition
    if (plane) {
      const p = flight.pose(0);
      p.size = planeSize;
      plane.setPose(p);
      plane.render();
    }
    root.classList.add('ready');
    return;
  }

  buildTimeline();
  setupScroll();
  introTl = gsap.timeline({ onComplete: () => { root.classList.add('intro-done'); } });
  idea.intro(introTl);
  // scrolling early fast-forwards the opening
  addEventListener('wheel', () => introTl.progress() < 1 && introTl.timeScale(3.5), { passive: true, once: true });
  addEventListener('touchmove', () => introTl.progress() < 1 && introTl.timeScale(3.5), { passive: true, once: true });

  addEventListener('resize', () => { layout(); ScrollTrigger.refresh(); });
  gsap.ticker.add(frame);
  root.classList.add('ready');

  // debug / review helpers
  window.__studio = { tl, st, stage, flight, plane, refOverlay, seek: (t) => { introTl.progress(1); introDone = true; tl.time(t); },
    intro: (t) => { introDone = false; introTl.pause(); introTl.time(t); } };
}

boot();
