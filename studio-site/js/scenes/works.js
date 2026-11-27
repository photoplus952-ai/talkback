/**
 * 04 THE WORKS
 * The works sit on a curved strip in 3D. Scrolling moves the strip; the work
 * in the middle stands upright and large, its neighbours lean back into depth.
 * When the scroll stops, it locks onto the nearest work (main.js anchors).
 * A cobalt VIEW circle follows the pointer over the works; a click opens the
 * work full size. Videos play only while they are in the middle.
 */
import { headline, copy, tagline, badge, el } from '../core/text.js';
import { srHeading, depth } from './common.js';

export function createWorks(stage, cfg) {
  const s = stage.add(cfg, document.getElementById('scene-works'));
  const art = s.art;
  srHeading(s.section, 'THE WORKS');

  const LG = (n) => stage.group(cfg.id, n, el('div', 'layout', art));
  const gHead = LG('head'); const gCopy = LG('copy'); const gGal = LG('gallery'); const gFoot = LG('foot');
  const big = headline(gGal, { ...cfg.bigOutline, cls: 'outline-word' });
  const b = badge(gHead, cfg.badge, cfg.index);
  const words = cfg.title.map((t) => headline(gHead, t));
  const c = copy(gCopy, cfg.copy);
  const tag = tagline(gFoot, cfg.tagline);

  // gallery
  const ribbon = el('div', 'ribbon', gGal);
  const list = el('ul', 'sr-only', s.section);
  const tiles = cfg.items.map((it, i) => {
    const t = el('button', 'tile', ribbon);
    t.type = 'button';
    t.setAttribute('aria-label', `${it.name}, ${it.cat}`);
    if (it.src.endsWith('.mp4')) {
      const v = el('video', '', t); v.src = it.src; v.poster = it.poster; v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'metadata';
    } else {
      const im = el('img', '', t); im.src = it.src; im.alt = ''; im.loading = 'lazy'; im.decoding = 'async';
    }
    el('li', '', list).textContent = `${it.name} — ${it.cat}`;
    t.addEventListener('click', () => openWork(i));
    return t;
  });
  const cap = el('div', 'caption', gFoot);
  const capCount = el('div', 'c-count', cap); const capName = el('div', 'c-name', cap); const capCat = el('div', 'c-cat', cap);
  const bar = el('i', '', el('div', 'progress', gFoot));
  const view = el('div', 'view', gGal); view.textContent = 'VIEW'; view.setAttribute('aria-hidden', 'true');

  // widths follow each work's proportions
  const ws = tiles.map(() => 420);
  tiles.forEach((t, i) => {
    const m = t.firstChild;
    const set = () => { const r = (m.naturalWidth || m.videoWidth) / (m.naturalHeight || m.videoHeight); if (r) ws[i] = Math.max(300, Math.min(600, 440 * r)); };
    m.addEventListener(m.tagName === 'VIDEO' ? 'loadedmetadata' : 'load', set); set();
  });

  const state = { p: 0 };
  let pos = 0;
  const n = tiles.length;
  const gap = 40;
  function render() {
    pos += (state.p - pos) * 0.14;
    const k = Math.max(0, Math.min(n - 2, Math.floor(pos))); const f = pos - k;
    const centre = (j) => { let x = 0; for (let m = 0; m < j; m++) x += ws[m] / 2 + gap + ws[m + 1] / 2; return x; };
    const cur = centre(k) + (centre(k + 1) - centre(k)) * f;
    tiles.forEach((t, i) => {
      const d = i - pos; const ad = Math.min(Math.abs(d), 3.2);
      t.style.width = `${ws[i]}px`;
      t.style.left = `${960 + (centre(i) - cur) * 0.78 - ws[i] / 2}px`;
      t.style.transform = `translateZ(${-ad * 170}px) rotateY(${Math.max(-38, Math.min(38, -d * 24))}deg) scale(${1 - ad * 0.04})`;
      t.style.zIndex = 100 - Math.round(ad * 10);
      t.style.filter = ad > 0.05 ? `saturate(${1 - ad * 0.25}) brightness(${1 - ad * 0.06})` : '';
      const v = t.querySelector('video');
      if (v) { if (ad < 0.5 && s.section.style.visibility !== 'hidden') v.play().catch(() => {}); else if (!v.paused) v.pause(); }
    });
    const ci = Math.max(0, Math.min(n - 1, Math.round(pos)));
    const it = cfg.items[ci];
    const label = `${String(ci + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}`;
    if (capCount.textContent !== label) { capCount.textContent = label; capName.textContent = it.name; capCat.textContent = it.cat; }
    bar.style.width = `${(pos / (n - 1)) * 100}%`;
  }

  // VIEW circle
  ribbon.addEventListener('pointermove', (e) => {
    const r = s.art.getBoundingClientRect(); const sc = r.width / 1920;
    view.style.left = `${(e.clientX - r.left) / sc}px`; view.style.top = `${(e.clientY - r.top) / sc}px`;
    view.classList.toggle('on', !!e.target.closest('.tile'));
  });
  ribbon.addEventListener('pointerleave', () => view.classList.remove('on'));

  // lightbox
  const box = el('div', 'lightbox', document.body); box.hidden = true;
  box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
  const boxMedia = el('div', 'lb-media', box); const boxCap = el('div', 'lb-cap', box);
  const close = el('button', 'lb-close', box); close.type = 'button'; close.textContent = '×'; close.setAttribute('aria-label', 'סגירה');
  function openWork(i) {
    const it = cfg.items[i];
    boxMedia.innerHTML = it.src.endsWith('.mp4')
      ? `<video src="${it.src}" poster="${it.poster}" autoplay muted loop playsinline controls></video>`
      : `<img src="${it.src}" alt="${it.name}, ${it.cat}">`;
    boxCap.innerHTML = `<b>${it.name}</b><span>${it.cat}</span>`;
    box.hidden = false;
    gsap.fromTo(box, { opacity: 0 }, { opacity: 1, duration: 0.35 });
    gsap.fromTo(boxMedia, { scale: 0.92, y: 30 }, { scale: 1, y: 0, duration: 0.6, ease: 'expo.out' });
    close.focus();
  }
  const shut = () => gsap.to(box, { opacity: 0, duration: 0.25, onComplete: () => { box.hidden = true; boxMedia.innerHTML = ''; } });
  close.addEventListener('click', shut);
  box.addEventListener('click', (e) => { if (e.target === box) shut(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !box.hidden) shut(); });

  function scroll(tl, T) {
    const [d0, d1] = T.t34;
    const [b0] = T.works.build;
    const [g0, g1] = T.works.scrub;
    tl.fromTo(s.section, { autoAlpha: 0 }, { autoAlpha: 1, duration: 2 }, d0 + 3)
      .fromTo(big.root, { xPercent: 12, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 5, ease: 'power3.out' }, d0 + 3)
      .fromTo(words.flatMap((w) => w.chars), { yPercent: 80, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 2, stagger: 0.15, ease: 'back.out(2)' }, b0)
      .fromTo([b.root, b.num], { opacity: 0 }, { opacity: 1, duration: 1 }, b0)
      .fromTo(c.lines.map((l) => l.firstChild), { yPercent: 110 }, { yPercent: 0, duration: 2, stagger: 0.4, ease: 'power3.out' }, b0 + 1)
      .fromTo(ribbon, { x: 1100, opacity: 0 }, { x: 0, opacity: 1, duration: 5, ease: 'power3.out' }, d0 + 3.5)
      .fromTo([tag.root, cap], { opacity: 0 }, { opacity: 1, duration: 1.5 }, b0 + 2)
      .fromTo(tag.line, { scaleX: 0 }, { scaleX: 1, transformOrigin: '0 50%', duration: 2.5, ease: 'power2.out' }, b0 + 2)
      // the scroll moves the gallery
      .fromTo(state, { p: 0 }, { p: n - 1, duration: g1 - g0, ease: 'none' }, g0)
      // the big outline drifts the other way
      .to(big.root, { xPercent: -22, duration: g1 - g0, ease: 'none' }, g0);

    const [e0] = T.t45;
    tl.to([ribbon, cap], { y: -80, opacity: 0, duration: 2, ease: 'power2.in' }, e0)
      .to(s.section, { autoAlpha: 0, duration: 1.5 }, e0 + 1.2);
  }

  return { s, scroll, render, titles: words.flatMap((w) => w.chars), anchors: (T) => {
    const [g0, g1] = T.works.scrub;
    return cfg.items.map((_, i) => g0 + ((g1 - g0) * i) / (n - 1));
  } };
}
