/**
 * Boot: builds the five screens and the flying glasses, and one master
 * timeline that the scroll scrubs (so everything plays backwards too).
 */
import { SCENES, TIMING, ANCHORS, WELCOME, PROCESS, RESULT, WORKS, CONTACT } from './config.js';
import { Stage } from './core/stage.js';
import { createWelcome } from './scenes/welcome.js';
import { createProcess } from './scenes/process.js';
import { createResult } from './scenes/result.js';
import { createWorks } from './scenes/works.js';
import { createContact } from './scenes/contact.js';
import { Glasses } from './objects/glasses.js';

const params = new URLSearchParams(location.search);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || params.has('static');
const root = document.documentElement;
root.classList.toggle('is-static', reduced);
root.classList.add('js');

const stage = new Stage(document.querySelector('.viewport'));
stage.staticMode = reduced;
const welcome = createWelcome(stage, WELCOME);
const process = createProcess(stage, PROCESS);
const result = createResult(stage, RESULT);
const works = createWorks(stage, WORKS);
const contact = createContact(stage, CONTACT);
const scenes = [welcome, process, result, works, contact];

/* reference overlay: ?ref=1 or Alt+R */
function refOverlay(on) {
  for (const sc of scenes) {
    if (!sc.s.cfg.ref) continue;
    let o = sc.s.art.querySelector('.ref-overlay');
    if (!o && on) { o = document.createElement('img'); o.className = 'ref-overlay'; o.src = sc.s.cfg.ref; o.alt = ''; sc.s.art.appendChild(o); }
    if (o) o.hidden = !on;
  }
  root.classList.toggle('show-ref', on);
}

const glasses = new Glasses(stage, document.querySelector('.fly-layer'));
const layout = () => stage.layout(reduced);

/* ---------------- master timeline ---------------- */
const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
let st = null; let lenis = null; let introTl = null; let introDone = reduced;

function buildTimeline() {
  scenes.forEach((sc) => sc.scroll && sc.scroll(tl, TIMING));
  tl.set({}, {}, TIMING.total);
}

/* soft lock: when scrolling stops near a resting moment, ease onto it */
const snapPoints = [...ANCHORS, ...works.anchors(TIMING)].sort((a, b) => a - b);
let snapTimer = 0; let snapping = false;
function queueSnap() { clearTimeout(snapTimer); if (!snapping && st) snapTimer = setTimeout(trySnap, 170); }
function trySnap() {
  if (!introDone || !lenis) return;
  const span = st.end - st.start;
  const t = ((lenis.scroll - st.start) / span) * TIMING.total;
  let best = null;
  for (const a of snapPoints) if (Math.abs(t - a) < 6 && (best === null || Math.abs(t - a) < Math.abs(t - best))) best = a;
  if (best === null || Math.abs(t - best) < 0.2) return;
  snapping = true;
  lenis.scrollTo(st.start + span * (best / TIMING.total), {
    duration: 0.9, easing: (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2),
    onComplete: () => { snapping = false; },
  });
  setTimeout(() => { snapping = false; }, 1100);
}

function setupScroll() {
  gsap.registerPlugin(ScrollTrigger);
  const scroller = document.querySelector('.scroller');
  scroller.style.height = `${TIMING.scrollLength * 100}vh`;
  if (window.Lenis) {
    lenis = new window.Lenis({ duration: 1.1, smoothWheel: true, wheelMultiplier: 0.9 });
    lenis.on('scroll', ScrollTrigger.update);
    lenis.on('scroll', queueSnap);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  st = ScrollTrigger.create({
    trigger: scroller, start: 'top top', end: 'bottom bottom', scrub: 0.45, animation: tl,
    onUpdate: (self) => updateNav(self.progress),
  });
}

/* ---------------- navigation ---------------- */
const nav = document.querySelector('.scene-nav');
const navButtons = [...nav.querySelectorAll('button')];
function updateNav(progress) {
  const t = progress * TIMING.total;
  let active = 0;
  ANCHORS.forEach((a, i) => { if (t >= a - 5) active = i; });
  navButtons.forEach((b, i) => b.setAttribute('aria-current', i === active ? 'step' : 'false'));
  nav.style.setProperty('--p', progress.toFixed(4));
}
navButtons.forEach((btn, i) => btn.addEventListener('click', () => {
  if (reduced || !st) { document.getElementById(`scene-${SCENES[i].id}`).scrollIntoView(); return; }
  const y = st.start + (st.end - st.start) * (ANCHORS[i] / TIMING.total);
  if (lenis) lenis.scrollTo(y, { duration: 1.8 }); else scrollTo({ top: y, behavior: 'smooth' });
}));

/* ---------------- pointer ---------------- */
const pointer = { x: 0, y: 0, sx: 0, sy: 0, cx: 0, cy: 0 };
let pointerActive = false;
if (!reduced) {
  addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / innerWidth) * 2 - 1; pointer.y = (e.clientY / innerHeight) * 2 - 1;
    pointer.cx = e.clientX; pointer.cy = e.clientY; pointerActive = e.pointerType === 'mouse';
    scenes.forEach((sc) => sc.pointer && sc.pointer(pointer.x, pointer.y));
  }, { passive: true });
  document.addEventListener('pointerleave', () => { pointerActive = false; });
}

/* headline letters lean toward the pointer (left/top offsets: GSAP owns transform) */
const MAGNET = [
  [-1, 6, welcome], [20, 30, process], [42, 52, result], [56, 88, works], [94, 101, contact],
].map(([from, to, sc], gi) => ({ from, to, id: SCENES[gi].id, items: sc.titles.map((e) => ({ e, x: 0, y: 0 })), dirty: false }));
function magnet(t) {
  for (const g of MAGNET) {
    const live = pointerActive && t >= g.from && t <= g.to;
    if (!live && !g.dirty) continue;
    const sc = stage.scenes.get(g.id).fit.s;
    const rects = live ? g.items.map((it) => it.e.getBoundingClientRect()) : null;
    let moving = false;
    g.items.forEach((it, i) => {
      let tx = 0; let ty = 0;
      if (live) {
        const r = rects[i];
        const dx = pointer.cx - (r.left + r.width / 2) + it.x; const dy = pointer.cy - (r.top + r.height / 2) + it.y;
        const d = Math.hypot(dx, dy); const R = Math.max(r.height * 2.2, 200);
        const k = d < R ? (1 - d / R) ** 1.5 : 0;
        tx = dx * 0.3 * k; ty = dy * 0.3 * k;
      }
      it.x += (tx - it.x) * 0.16; it.y += (ty - it.y) * 0.16;
      if (Math.abs(it.x) > 0.05 || Math.abs(it.y) > 0.05) moving = true;
      it.e.style.left = `${(it.x / sc).toFixed(2)}px`; it.e.style.top = `${(it.y / sc).toFixed(2)}px`;
    });
    g.dirty = live || moving;
  }
}

/* ---------------- render loop ---------------- */
let leftTop = false; let replaying = false;
function frame() {
  const t = tl.time();
  const now = performance.now() / 1000;
  magnet(t);
  pointer.sx += (pointer.x - pointer.sx) * 0.06; pointer.sy += (pointer.y - pointer.sy) * 0.06;
  // back at the top after a visit further down: the opening plays again
  if (t > 8) leftTop = true;
  if (leftTop && introDone && t < 0.3 && introTl) { leftTop = false; replaying = true; introTl.timeScale(1.6).restart(); }
  if (replaying && t > 0.8) { introTl.progress(1); replaying = false; }
  glasses.render(t, now, pointer);
  works.render();
}

/* ---------------- boot ---------------- */
async function boot() {
  layout();
  if (params.has('ref')) refOverlay(true);
  addEventListener('keydown', (e) => { if (e.key === 'r' && e.altKey) refOverlay(!root.classList.contains('show-ref')); });
  try { await document.fonts.ready; } catch (_) { /* ignore */ }
  layout();

  if (reduced) {
    // a calm, readable page: every screen in its resting composition
    root.classList.add('ready');
    welcome.s.art.appendChild(Object.assign(document.createElement('img'), {
      className: 'glasses-static', src: 'assets/scene/glasses.png', alt: 'משקפי שמש כחולים',
    }));
    return;
  }

  buildTimeline();
  setupScroll();
  introTl = gsap.timeline({ onComplete: () => { introDone = true; } });
  introTl.fromTo(glasses.drop, { y: -520, op: 0, rot: -14 }, { y: 0, op: 1, rot: 0, duration: 1.3, ease: 'bounce.out' }, 0.2)
    .fromTo(glasses.drop, { op: 0 }, { op: 1, duration: 0.3 }, 0.2);
  welcome.intro(introTl);
  const fast = () => introTl.progress() < 1 && introTl.timeScale(3.5);
  addEventListener('wheel', fast, { passive: true, once: true });
  addEventListener('touchmove', fast, { passive: true, once: true });
  addEventListener('resize', () => { layout(); ScrollTrigger.refresh(); });
  gsap.ticker.add(frame);
  root.classList.add('ready');

  window.__studio = { tl, st, stage, refOverlay, seek: (t) => { introTl.progress(1); introDone = true; tl.time(t); }, intro: (t) => { introTl.pause(); introTl.time(t); } };
}

boot();
