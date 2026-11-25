/**
 * 05 LET'S TALK
 * The newspaper photo rises first; the headline on the paper is live text,
 * printed letter by letter. TALK is stamped like RESULT, its echoes slide out.
 * Contact rows rise one by one; hovering a row moves its arrow, clicking
 * copies the detail. The glasses come back and settle by the title.
 */
import { headline, tagline, badge, copy, el, arrowSvg } from '../core/text.js';
import { srHeading, depth, follower } from './common.js';

export function createContact(stage, cfg) {
  const s = stage.add(cfg, document.getElementById('scene-contact'));
  const art = s.art;
  srHeading(s.section, 'let’s TALK');

  const b = badge(art, cfg.badge, cfg.index);
  const type = depth(art, 'type');
  const parts = cfg.title.map((t) => ({ t, w: headline(type, t) }));
  const small = parts.find((p) => p.t.role === 'small').w;
  const main = parts.find((p) => p.t.role === 'main').w;
  const echoes = parts.filter((p) => p.t.role === 'echo');
  const tag = tagline(art, cfg.tagline);

  // the glasses, back from the desk
  const G = cfg.glasses;
  const glasses = el('div', 'contact-glasses', art, { left: `${G.x - G.w / 2}px`, top: `${G.y - G.w * 0.225}px`, width: `${G.w}px`, height: `${G.w * 0.45}px`, rotate: `${G.rot}deg` });
  glasses.innerHTML = '<img src="assets/scene/glasses.png" alt="">';

  // newspaper photo
  const P = cfg.photo;
  const news = el('div', 'news', art, { left: `${P.x}px`, top: `${P.y}px`, width: `${P.w}px`, height: `${P.h}px` });
  const img = el('img', '', news); img.src = P.src; img.alt = 'איש בחליפה כחולה יושב על כיסא ומחזיק עיתון שמסתיר את פניו';
  const paper = el('div', 'paper', news, { left: `${P.paper.x}px`, top: `${P.paper.y}px`, width: `${P.paper.w}px` });
  const p1 = el('span', 'p1', paper); p1.textContent = cfg.title[0].text;
  const p2 = el('span', 'p2', paper); p2.textContent = cfg.title[1].text;

  const c = copy(art, cfg.copy);
  const R = cfg.rowsBox;
  const rows = cfg.rows.map((r) => {
    const row = el('button', 'contact-row', art, { left: `${R.x}px`, top: `${r.y}px`, width: `${R.w}px` });
    row.type = 'button';
    const k = el('span', 'k', row); k.textContent = r.key;
    const v = el('span', 'v', row); v.textContent = r.value; v.dir = 'auto';
    const a = el('span', 'row-arrow', row); a.innerHTML = arrowSvg();
    row.setAttribute('aria-label', `${r.key}: ${r.value}. לחיצה מעתיקה`);
    row.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(r.value); row.classList.add('copied'); setTimeout(() => row.classList.remove('copied'), 1400); } catch (_) { /* clipboard refused */ }
    });
    return row;
  });
  const btn = el('a', 'cta', art, { left: `${cfg.button.x}px`, top: `${cfg.button.y}px` });
  btn.href = cfg.button.href;
  btn.innerHTML = `<span class="cta-arrow">${arrowSvg()}</span><span>${cfg.button.text}</span>`;

  function scroll(tl, T) {
    const [e0, e1] = T.t45;
    const [b0] = T.contact.build;
    tl.fromTo(s.section, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.5 }, e0 + 2.7)
      .fromTo(s.cam, { yPercent: 6 }, { yPercent: 0, duration: e1 - e0, ease: 'power3.out' }, e0 + 2.7)
      .fromTo(news, { y: 80, opacity: 0, rotate: 3 }, { y: 0, opacity: 1, rotate: 0, duration: 2.4, ease: 'power3.out' }, b0)
      .fromTo([p1, p2], { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.2, stagger: 0.5, ease: 'steps(6)' }, b0 + 1.8)
      .fromTo(main.root, { scale: 1.6, opacity: 0, transformOrigin: '20% 60%' }, { scale: 0.97, opacity: 1, duration: 1.6, ease: 'power3.in' }, b0 + 0.6)
      .to(main.root, { scale: 1, duration: 1.4, ease: 'back.out(3)' }, b0 + 2.2)
      .fromTo(small.chars, { yPercent: 70, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.4, stagger: 0.12, ease: 'back.out(2)' }, b0 + 1.4)
      .fromTo([b.root, b.num], { opacity: 0 }, { opacity: 1, duration: 1 }, b0 + 1);
    echoes.forEach((e, i) => {
      tl.fromTo(e.w.root, { y: -(e.t.y - cfg.title[1].y), opacity: 0 }, { y: 0, opacity: 1, duration: 2.2 + i * 0.5, ease: 'power3.out' }, b0 + 2.4 + i * 0.3);
    });
    tl.fromTo(c.lines.map((l) => l.firstChild), { yPercent: 110 }, { yPercent: 0, duration: 1.8, stagger: 0.4, ease: 'power3.out' }, b0 + 2)
      .fromTo(rows, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1.8, stagger: 0.5, ease: 'power3.out' }, b0 + 2.6)
      .fromTo(btn, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1.6, ease: 'back.out(2)' }, b0 + 4.2)
      .fromTo(tag.root, { opacity: 0, letterSpacing: '2px' }, { opacity: 1, letterSpacing: `${cfg.tagline.ls}px`, duration: 2.4, ease: 'expo.out' }, b0 + 3)
      .fromTo(tag.line, { scaleX: 0 }, { scaleX: 1, transformOrigin: '0 50%', duration: 2, ease: 'power2.out' }, b0 + 3.4)
      // the glasses return, open up and settle by the title
      .fromTo(glasses, { y: -420, x: 260, rotate: 40, scaleX: 0.35, opacity: 0 }, { y: 0, x: 0, rotate: G.rot, scaleX: 1, opacity: 1, duration: 3.2, ease: 'power3.out' }, b0 + 3.4)
      .fromTo(glasses, { scaleY: 0.85 }, { scaleY: 1, duration: 1.2, ease: 'elastic.out(1, 0.4)' }, b0 + 6.4);
  }

  const fNews = follower(news, (nx) => ({ x: nx * 14 }), 1.2);
  const fType = follower(type, (nx, ny) => ({ x: nx * -14, y: ny * -8 }), 1.1);
  const fG = follower(glasses.firstChild, (nx, ny) => ({ x: nx * 20, y: ny * 12, rotation: nx * 6 }), 1);
  function pointer(nx, ny) { fNews(nx, ny); fType(nx, ny); fG(nx, ny); }

  return { s, scroll, pointer, titles: [...small.chars, ...main.chars] };
}
