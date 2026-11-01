import { describe, expect, it } from 'vitest';
import { alphaBox, borderColor, isGreenScreen, removeBackground, waistFrame, type Px } from './cutout';

/** 60x80 green screen with a dark "figure" (20..40 x 10..75) and a green button inside it. */
function sample(): Px {
  const w = 60, h = 80;
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const fig = x >= 20 && x <= 40 && y >= 10 && y <= 75;
      const inner = x >= 28 && x <= 31 && y >= 40 && y <= 43; // green-ish detail fully inside the figure
      const [r, g, b] = inner ? [40, 200, 40] : fig ? (x === 20 || x === 40 ? [255, 26, 110] : [20, 18, 24]) : [10, 250 - (y % 7), 12];
      data.set([r, g, b, 255], i);
    }
  return { width: w, height: h, data };
}

describe('cutout', () => {
  it('recognizes the green screen', () => {
    const k = borderColor(sample());
    expect(isGreenScreen(k)).toBe(true);
    expect(isGreenScreen([255, 26, 110])).toBe(false);
  });

  it('removes the background but keeps green details inside the figure and the pink rim', () => {
    const img = sample();
    const removed = removeBackground(img);
    expect(removed).toBeGreaterThan(0.6);
    const a = (x: number, y: number) => img.data[(y * img.width + x) * 4 + 3];
    expect(a(2, 2)).toBe(0);
    expect(a(50, 70)).toBe(0);
    expect(a(30, 30)).toBe(255);
    expect(a(29, 41)).toBeGreaterThan(0); // inner green kept
    expect(a(20, 30)).toBeGreaterThan(200); // pink rim kept
    // despill: no pixel of the figure is left greener than red/blue allow
    const i = (41 * img.width + 29) * 4;
    expect(img.data[i + 1]).toBeLessThanOrEqual(Math.max(img.data[i], img.data[i + 2]) + 6);
  });

  it('frames waist-up and finds the head', () => {
    // head: circle r=8 at (30,14); shoulders/torso from y=26 down to the bottom edge
    const w = 60, h = 80;
    const data = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const head = (x - 30) ** 2 + (y - 14) ** 2 <= 64;
        const neck = x >= 27 && x <= 33 && y > 20 && y < 26;
        const body = x >= 8 && x <= 52 && y >= 26;
        data.set(head || neck || body ? [20, 18, 24, 255] : [0, 250, 0, 255], (y * w + x) * 4);
      }
    const img = { width: w, height: h, data };
    removeBackground(img);
    const box = alphaBox(img)!;
    const f = waistFrame(box, img);
    expect(f.headFrac).toBeGreaterThan(0.2);
    expect(f.headFrac).toBeLessThan(0.35);
    expect(f.mx).toBeCloseTo(0.5, 1);
    const mouthPx = f.sy + f.my * f.H;
    expect(mouthPx).toBeGreaterThan(12);
    expect(mouthPx).toBeLessThan(22);
  });
});
