/**
 * Text building blocks for the 1920x1080 frames. Everything is live HTML
 * text, placed with the same numbers as in Figma (box top-left, font size,
 * letter spacing), so the frames stay editable and accessible.
 */
import { FONTS, COLORS } from '../config.js';

export const el = (tag, cls, parent, style) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (style) Object.assign(n.style, style);
  if (parent) parent.appendChild(n);
  return n;
};

const ARROW = '<svg viewBox="0 0 44 44" aria-hidden="true"><path d="M12.5 12.5 L30 30 M15 31.5 H31.5 V15" fill="none" stroke="#fff" stroke-width="4.2" stroke-linecap="square"/></svg>';
export const arrowSvg = () => ARROW;

/** headline word(s), one span per letter so letters can move on their own */
export function headline(parent, o) {
  const root = el('div', `word ${o.cls || ''}`, parent, {
    left: `${o.x}px`, top: `${o.y}px`, fontFamily: FONTS.display, fontWeight: 400,
    fontSize: `${o.size}px`, letterSpacing: `${o.ls || 0}px`, color: o.color || COLORS.cobalt,
  });
  root.setAttribute('aria-hidden', 'true');
  const chars = [...o.text].map((c) => {
    const s = el('span', 'ch', root);
    s.textContent = c === ' ' ? ' ' : c;
    return s;
  });
  return { root, chars };
}

function splitWords(parent, text, cls) {
  text.split(/(\s+)/).forEach((t) => {
    if (!t) return;
    if (/^\s+$/.test(t)) parent.appendChild(document.createTextNode(t));
    else el('span', cls, parent).textContent = t;
  });
}

/** Hebrew copy, right aligned to `right`, one element per line */
export function copy(parent, o) {
  const root = el('div', 'copy', parent, {
    ...(o.left != null ? { left: `${o.left}px`, textAlign: 'left' } : { right: `${1920 - o.right}px` }), top: `${o.top}px`, fontFamily: FONTS.text, fontSize: `${o.size}px`,
    lineHeight: `${o.lh}px`, fontWeight: o.weight || 500, color: o.color || COLORS.bright,
  });
  root.dir = 'rtl';
  root.lang = 'he';
  const lines = o.lines.map((t) => {
    const line = el('div', 'copy-line', root);
    splitWords(el('span', 'copy-in', line), t, 'cw');
    return line;
  });
  return { root, lines, words: [...root.querySelectorAll('.cw')] };
}

/** spaced English line with its underline */
export function tagline(parent, o) {
  const root = el('div', 'tagline', parent, {
    left: `${o.x}px`, top: `${o.y}px`, fontFamily: FONTS.latin, fontWeight: 500,
    fontSize: `${o.size}px`, letterSpacing: `${o.ls}px`, color: o.color || COLORS.ink,
  });
  root.setAttribute('aria-hidden', 'true');
  splitWords(root, o.text, 'tw');
  if (o.w) {
    // fit the tracking so the line spans exactly the designed width
    const fit = () => {
      root.style.letterSpacing = '0px';
      const w0 = root.getBoundingClientRect().width / (root.closest('.art')?.getBoundingClientRect().width / 1920 || 1);
      const n = o.text.length - 1;
      root.style.letterSpacing = `${(o.w - w0) / n}px`;
    };
    fit(); document.fonts?.ready.then(fit); root._fit = fit;
  }
  const line = o.line ? el('i', 'underline', parent, {
    left: `${o.line.x}px`, top: `${o.line.y}px`, width: `${o.line.w}px`, height: `${o.line.h}px`,
  }) : null;
  return { root, line, words: [...root.querySelectorAll('.tw')] };
}

/** the blue arrow square + scene number */
export function badge(parent, o, index) {
  const root = el('div', 'badge', parent, { left: `${o.x}px`, top: `${o.y}px`, width: `${o.size}px`, height: `${o.size}px` });
  root.innerHTML = ARROW;
  root.setAttribute('aria-hidden', 'true');
  const num = el('div', 'badge-num', parent, {
    left: `${o.num.x}px`, top: `${o.num.y}px`, fontFamily: FONTS.latin, fontSize: `${o.num.size}px`, color: COLORS.num,
  });
  num.textContent = index;
  num.setAttribute('aria-hidden', 'true');
  return { root, num };
}
