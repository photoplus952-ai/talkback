// Draws the TALKBACK app icon and renders every size the PWA needs.
// Run: npm run icons  (uses the preinstalled Chromium through Playwright)
import { writeFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const OUT = new URL('../public/icons/', import.meta.url);
mkdirSync(OUT, { recursive: true });

/**
 * The mark: a speech bubble in the brand gradient (pink -> violet, 135deg),
 * with the brand sound wave inside (rounded bars, dots at the ends).
 * `scale` shrinks the mark for the maskable version (safe zone).
 */
function iconSvg({ scale = 1, rounded = false } = {}) {
  const s = scale;
  const t = (v) => 512 + (v - 512) * s; // scale around the center
  // bubble: rounded rect + tail at the bottom-left
  const bx = t(206), by = t(236), bw = 612 * s, bh = 470 * s, r = 150 * s;
  const tail = `M ${t(286)} ${t(640)} L ${t(252)} ${t(806)} Q ${t(250)} ${t(818)} ${t(262)} ${t(812)} L ${t(450)} ${t(640)} Z`;
  // wave: bars centered in the bubble
  const cx = 512, cy = t(471);
  const bars = [
    { x: -180, h: 0, dot: true },
    { x: -108, h: 150 },
    { x: -36, h: 250 },
    { x: 36, h: 190 },
    { x: 108, h: 110 },
    { x: 180, h: 0, dot: true },
  ];
  const sw = 40 * s;
  const waves = bars
    .map((b) => {
      const x = t(cx + b.x);
      if (b.dot) return `<circle cx="${x}" cy="${cy}" r="${sw / 2}" fill="#fff"/>`;
      const h = b.h * s;
      return `<line x1="${x}" y1="${cy - h / 2}" x2="${x}" y2="${cy + h / 2}" stroke="#fff" stroke-width="${sw}" stroke-linecap="round"/>`;
    })
    .join('');
  const bg = rounded
    ? `<rect width="1024" height="1024" rx="230" fill="url(#bg)"/>`
    : `<rect width="1024" height="1024" fill="url(#bg)"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <radialGradient id="bg" cx="30%" cy="22%" r="95%">
      <stop offset="0" stop-color="#231D2D"/>
      <stop offset=".55" stop-color="#0E0B14"/>
      <stop offset="1" stop-color="#0E0B14"/>
    </radialGradient>
    <linearGradient id="brand" gradientUnits="userSpaceOnUse" x1="${t(206)}" y1="${t(236)}" x2="${t(818)}" y2="${t(818)}">
      <stop offset="0" stop-color="#FF1A6E"/>
      <stop offset="1" stop-color="#7B4DFF"/>
    </linearGradient>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="${48 * s}"/>
    </filter>
  </defs>
  ${bg}
  <g opacity=".55" filter="url(#glow)">
    <rect x="${bx}" y="${by + 40 * s}" width="${bw}" height="${bh}" rx="${r}" fill="#FF1A6E"/>
  </g>
  <g fill="url(#brand)">
    <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="${r}"/>
    <path d="${tail}" stroke-linejoin="round"/>
  </g>
  ${waves}
</svg>`;
}

const normal = iconSvg({ scale: 1 });
const maskable = iconSvg({ scale: 0.78 });
const favicon = iconSvg({ scale: 1.08, rounded: true });

writeFileSync(new URL('icon.svg', OUT), normal);
writeFileSync(new URL('favicon.svg', OUT), favicon);

const browser = await chromium.launch(
  process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
);
const page = await browser.newPage({ deviceScaleFactor: 1 });
async function render(svg, size, file) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<html><body style="margin:0;background:transparent">${svg.replace('width="1024" height="1024"', `width="${size}" height="${size}"`)}</body></html>`,
  );
  await page.locator('svg').screenshot({ path: new URL(file, OUT).pathname, omitBackground: true });
}
await render(normal, 192, 'icon-192.png');
await render(normal, 512, 'icon-512.png');
await render(maskable, 512, 'icon-maskable-512.png');
await render(normal, 180, 'apple-touch-icon.png');
await render(favicon, 1024, '../../docs/design/app-icon.png');
await browser.close();
console.log('icons written to public/icons/');
