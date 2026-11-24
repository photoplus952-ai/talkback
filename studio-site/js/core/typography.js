/**
 * Typography building blocks. Everything is live HTML text positioned in
 * reference pixels, so the compositions stay locked to the approved frames.
 *
 *  - word()      a headline word fitted between x0..x1 by tracking only
 *                (never squashed: cap height always matches the design)
 *  - stretchE()  the signature stretched E: a stem + three bars that end
 *                on one straight vertical line
 *  - copyBlock() Hebrew copy (RTL), one element per line for reveals
 *  - tagline()   letter-spaced English line + optional underline
 *  - badge()     the blue arrow square with the scene number
 */
import { FONTS } from '../config.js';

export const el = (tag, cls, parent, style) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (style) Object.assign(n.style, style);
  if (parent) parent.appendChild(n);
  return n;
};

/* ---------- font metrics (per 1px of font-size) ---------- */
const ctx = document.createElement('canvas').getContext('2d');
const metricCache = new Map();

function setFont(family, weight, size, stretch) {
  ctx.font = `${weight} ${size}px ${family}`;
  if ('fontStretch' in ctx) ctx.fontStretch = stretch === '125%' ? 'expanded' : 'normal';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
}

function metrics(family, weight, stretch) {
  const key = `${family}|${weight}|${stretch}`;
  if (metricCache.has(key)) return metricCache.get(key);
  setFont(family, weight, 200, stretch);
  const m = ctx.measureText('HEXZ');
  const out = {
    cap: m.actualBoundingBoxAscent / 200,
    asc: m.fontBoundingBoxAscent / 200,
    desc: m.fontBoundingBoxDescent / 200,
  };
  metricCache.set(key, out);
  return out;
}
export const clearMetrics = () => metricCache.clear();

/** distance (px per 1px font-size) from line-box top to cap top, with line-height:1 */
function capOffset(m) {
  const half = (1 - (m.asc + m.desc)) / 2;
  return half + m.asc - m.cap;
}

function ink(text, family, weight, size, stretch) {
  setFont(family, weight, size, stretch);
  const m = ctx.measureText(text);
  return { left: m.actualBoundingBoxLeft, width: m.actualBoundingBoxLeft + m.actualBoundingBoxRight };
}

/* ---------- DOM measurer (needed for variable width axis) ---------- */
let meas = null;
function domWidth(text, family, weight, stretch, size) {
  if (!meas) {
    meas = document.createElement('span');
    Object.assign(meas.style, {
      position: 'absolute', left: '-99999px', top: '0', whiteSpace: 'nowrap',
      visibility: 'hidden', lineHeight: '1', letterSpacing: '0px',
    });
    document.body.appendChild(meas);
  }
  Object.assign(meas.style, { fontFamily: family, fontWeight: weight, fontStretch: stretch, fontSize: `${size}px` });
  meas.textContent = text;
  return meas.getBoundingClientRect().width;
}

/* ---------- headline word ---------- */
/**
 * Fits a word between x0..x1 at the exact cap height. For a variable-width
 * font (Archivo stand-in) it first picks the font's own width axis so that
 * letters keep a natural tracking (~6% of cap height), then closes the
 * remainder with tracking. Glyphs are never scaled on one axis.
 */
export function word(parent, o) {
  const family = o.family || FONTS.display;
  const weight = o.weight || FONTS.displayWeight;
  const root = el('div', `word ${o.cls || ''}`, parent);
  root.setAttribute('aria-hidden', 'true');
  const chars = [...o.text].map((c) => {
    const s = el('span', 'ch', root);
    s.textContent = c === ' ' ? '\u00A0' : c;
    return s;
  });
  const api = {
    root, chars, o,
    layout() {
      const m = metrics(family, weight, '125%');
      let fs = o.capH / m.cap;
      const target = o.x1 - o.x0;
      const n = Math.max(o.text.length - 1, 1);
      let stretch = o.stretch || FONTS.displayStretch;
      const track = (o.track ?? 0.06) * o.capH;
      if (!o.stretch && family === FONTS.display) {
        // binary search the width axis (75%..125%)
        let lo = 75; let hi = 125;
        const want = target - track * n;
        if (domWidth(o.text, family, weight, '125%', fs) <= want) lo = 125;
        else {
          for (let i = 0; i < 9; i++) {
            const mid = (lo + hi) / 2;
            if (domWidth(o.text, family, weight, `${mid}%`, fs) > want) hi = mid; else lo = mid;
          }
        }
        stretch = `${lo.toFixed(1)}%`;
      }
      const adv = domWidth(o.text, family, weight, stretch, fs);
      const ik = ink(o.text, family, weight, fs, '125%');
      const lsb = ik.left; // left side bearing (approx.)
      const rsb = adv - (ik.width - ik.left); // right side bearing (approx.)
      let ls = (target - (adv + lsb - rsb)) / n;
      const minLs = -0.04 * fs;
      if (ls < minLs) {
        // still too wide (e.g. Stretch Pro without a width axis): scale uniformly
        fs *= (target - minLs * n) / (adv - minLs * 0);
        ls = minLs;
      }
      Object.assign(root.style, {
        left: `${o.x0 + lsb}px`,
        top: `${o.capTop - capOffset(m) * fs + (o.capH - m.cap * fs) / 2}px`,
        fontFamily: family,
        fontWeight: weight,
        fontStretch: stretch,
        fontSize: `${fs}px`,
        lineHeight: 1,
        letterSpacing: `${ls}px`,
        color: o.color || '',
        height: `${fs}px`,
      });
      root.style.marginRight = `${-ls}px`;
      api.fs = fs;
    },
  };
  return api;
}

/* ---------- stretched E ---------- */
export function stretchE(parent, o) {
  const root = el('div', `e-stretch ${o.cls || ''}`, parent);
  root.setAttribute('aria-hidden', 'true');
  const stem = el('i', 'e-stem', root);
  const bars = [0, 1, 2].map((i) => el('i', `e-bar e-bar-${i}`, root));
  const api = {
    root, stem, bars, o,
    layout() {
      const h = o.capH;
      const bar = h * (o.bar || 0.22);
      const r = Math.max(1, h * 0.018);
      Object.assign(root.style, {
        left: `${o.x0}px`, top: `${o.capTop}px`, width: `${o.x1 - o.x0}px`, height: `${h}px`,
        '--r': `${r}px`, color: o.color || '',
      });
      Object.assign(stem.style, { width: `${o.stem}px`, height: `${h}px` });
      const tops = [0, (h - bar) / 2, h - bar];
      bars.forEach((b, i) => Object.assign(b.style, { top: `${tops[i]}px`, height: `${bar}px` }));
    },
  };
  return api;
}

/** words as spans (spaces stay text, so spacing and RTL shaping are untouched) */
function splitWords(parent, text, cls) {
  text.split(/(\s+)/).forEach((t) => {
    if (!t) return;
    if (/^\s+$/.test(t)) parent.appendChild(document.createTextNode(t));
    else { const w = el('span', cls, parent); w.textContent = t; }
  });
}

/* ---------- Hebrew copy ---------- */
export function copyBlock(parent, o, refW) {
  const root = el('div', `copy ${o.cls || ''}`, parent);
  root.dir = 'rtl';
  root.lang = 'he';
  const lines = o.lines.map((l) => {
    const line = el('div', 'copy-line', root);
    const inner = el('span', 'copy-in', line);
    const d = typeof l === 'string' ? { text: l } : l;
    splitWords(inner, d.text, 'cw');
    if (d.weight) inner.style.fontWeight = d.weight;
    if (d.color) inner.style.color = d.color;
    return line;
  });
  const api = {
    root, lines, words: [...root.querySelectorAll('.cw')],
    layout() {
      const lh = o.pitch;
      Object.assign(root.style, {
        top: `${o.firstTop - lh * 0.5}px`,
        fontFamily: FONTS.text,
        fontSize: `${o.size}px`,
        lineHeight: `${lh}px`,
        fontWeight: o.weight || 500,
        color: o.color || '',
        textAlign: o.align === 'left' ? 'left' : 'right',
      });
      if (o.align === 'left') { root.style.left = `${o.x}px`; root.style.right = 'auto'; }
      else { root.style.right = `${refW - o.x}px`; root.style.left = 'auto'; }
    },
  };
  return api;
}

/* ---------- tagline ---------- */
export function tagline(parent, o) {
  const root = el('div', 'tagline', parent);
  root.setAttribute('aria-hidden', 'true');
  const parts = o.parts || [{ text: o.text, weight: o.weight || 500 }];
  const spans = parts.map((p) => {
    const s = el('span', 'tag-part', root);
    splitWords(s, p.text, 'tw');
    s.style.fontWeight = p.weight;
    return s;
  });
  const words = [...root.querySelectorAll('.tw')];
  const fullText = parts.map((p) => p.text).join('');
  let underline = null;
  if (o.underline) underline = el('i', 'tag-underline', parent);
  const api = {
    root, spans, words, underline,
    layout() {
      const family = FONTS.text;
      const w0 = parts[0].weight;
      const m = metrics(family, w0, 'normal');
      const fs = o.capH / m.cap;
      // ink extent across parts that may use different weights
      let x = 0; let inkL = 0; let inkR = 0;
      parts.forEach((p, i) => {
        setFont(family, p.weight, fs, 'normal');
        const mm = ctx.measureText(p.text);
        if (i === 0) inkL = -mm.actualBoundingBoxLeft;
        if (i === parts.length - 1) inkR = x + mm.actualBoundingBoxRight;
        x += mm.width;
      });
      const n = fullText.length - 1;
      const ls = (o.x1 - o.x0 - (inkR - inkL)) / n;
      Object.assign(root.style, {
        left: `${o.x0 - inkL}px`,
        top: `${o.capTop - capOffset(m) * fs}px`,
        fontFamily: family,
        fontSize: `${fs}px`,
        lineHeight: 1,
        letterSpacing: `${ls}px`,
        color: o.color || '',
      });
      if (underline) {
        Object.assign(underline.style, {
          left: `${o.underline.x0}px`, top: `${o.underline.y}px`,
          width: `${o.underline.x1 - o.underline.x0}px`, height: `${o.underline.h}px`,
        });
      }
    },
  };
  return api;
}

/* ---------- index badge ---------- */
export function badge(parent, o) {
  const root = el('div', 'badge', parent);
  root.setAttribute('aria-hidden', 'true');
  Object.assign(root.style, { left: `${o.x}px`, top: `${o.y}px`, width: `${o.size}px`, height: `${o.size}px` });
  root.innerHTML = `<svg viewBox="0 0 44 44" aria-hidden="true"><path d="M12.5 12.5 L30 30 M15 31.5 H31.5 V15" fill="none" stroke="#fff" stroke-width="4.2" stroke-linecap="square"/></svg>`;
  const num = word(parent, {
    text: o.numText, x0: o.num.x, x1: o.num.x + 30, capTop: o.num.capTop, capH: o.num.capH,
    family: FONTS.text, weight: 400, stretch: 'normal', cls: 'badge-num',
  });
  // numbers keep natural tracking
  const lay = num.layout;
  num.layout = () => { lay(); num.root.style.letterSpacing = '0.02em'; };
  return { root, num, layout: () => num.layout() };
}
