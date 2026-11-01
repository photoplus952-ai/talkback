// Cut her character out of a flat green background, on the device (no model download).
// Flood fill from the borders, so green-ish pixels inside the figure are never removed,
// then soften the edge and remove green spill, crop to the figure and frame it like the Cast.

export type Px = { width: number; height: number; data: Uint8ClampedArray };

/** How "background" a pixel is: 0 = surely figure, 1 = surely background. */
function bgScore(r: number, g: number, b: number, key: [number, number, number], green: boolean): number {
  if (!green) {
    // any other flat background (white, gray, a solid color): by distance only
    const d = Math.hypot(r - key[0], g - key[1], b - key[2]);
    return Math.max(0, Math.min(1, 1 - (d - 30) / 60));
  }
  // green dominance works for any shade of the screen (lighting gradients, compression)
  const dom = g - Math.max(r, b);
  const d = Math.hypot(r - key[0], g - key[1], b - key[2]);
  const byDom = (dom - 40) / 80; // >120 dominance = background
  const byDist = 1 - (d - 60) / 120; // within 60 of the key = background
  return Math.max(0, Math.min(1, Math.max(byDom, byDist)));
}

/** Average color of the border pixels: the actual screen color the model drew. */
export function borderColor(img: Px): [number, number, number] {
  const { width: w, height: h, data } = img;
  let r = 0, g = 0, b = 0, n = 0;
  const add = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
  };
  for (let x = 0; x < w; x += 2) { add(x, 0); add(x, h - 1); }
  for (let y = 0; y < h; y += 2) { add(0, y); add(w - 1, y); }
  return [r / n, g / n, b / n];
}

/** How uneven the border is (0 = perfectly flat background). */
export function borderSpread(img: Px, key = borderColor(img)): number {
  const { width: w, height: h, data } = img;
  let sum = 0, n = 0;
  const add = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    sum += Math.hypot(data[i] - key[0], data[i + 1] - key[1], data[i + 2] - key[2]);
    n++;
  };
  for (let x = 0; x < w; x += 3) { add(x, 0); add(x, h - 1); }
  for (let y = 0; y < h; y += 3) { add(0, y); add(w - 1, y); }
  return sum / n;
}

export function isGreenScreen(key: [number, number, number]): boolean {
  return key[1] > 120 && key[1] - Math.max(key[0], key[2]) > 60;
}

/** In place: sets alpha. Returns the share of pixels removed. */
export function removeBackground(img: Px): number {
  const { width: w, height: h, data } = img;
  const key = borderColor(img);
  const green = isGreenScreen(key);
  const score = new Float32Array(w * h);
  for (let p = 0; p < w * h; p++) score[p] = bgScore(data[p * 4], data[p * 4 + 1], data[p * 4 + 2], key, green);

  // flood fill from all borders through background-ish pixels
  const bg = new Uint8Array(w * h);
  const stack: number[] = [];
  const push = (p: number) => {
    if (!bg[p] && score[p] > 0.5) {
      bg[p] = 1;
      stack.push(p);
    }
  };
  for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
  while (stack.length) {
    const p = stack.pop()!;
    const x = p % w, y = (p / w) | 0;
    if (x > 0) push(p - 1);
    if (x < w - 1) push(p + 1);
    if (y > 0) push(p - w);
    if (y < h - 1) push(p + w);
  }

  let removed = 0;
  for (let p = 0; p < w * h; p++) {
    const i = p * 4;
    if (bg[p]) {
      data[i + 3] = 0;
      removed++;
      continue;
    }
    // soft edge: a figure pixel touching the background keeps partial alpha
    const x = p % w, y = (p / w) | 0;
    const edge = (x > 0 && bg[p - 1]) || (x < w - 1 && bg[p + 1]) || (y > 0 && bg[p - w]) || (y < h - 1 && bg[p + w]);
    if (edge) data[i + 3] = Math.round(255 * (1 - score[p] * 0.85));
    // despill: no green cast on hair and edges
    if (green) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const lim = Math.max(r, b) + 6;
      if (g > lim) data[i + 1] = lim;
    }
  }
  return removed / (w * h);
}

function countClear(img: Px): number {
  let n = 0;
  for (let i = 3; i < img.data.length; i += 16) if (img.data[i] < 16) n++;
  return n / (img.data.length / 16);
}

/** Bounding box of visible pixels. */
export function alphaBox(img: Px, min = 24) {
  const { width: w, height: h, data } = img;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (data[(y * w + x) * 4 + 3] > min) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  return x1 < 0 ? null : { x0, y0, x1, y1 };
}

/**
 * Waist-up framing (the app and the video call show her from the waist up).
 * Finds the head as the top part of the figure, before the shoulders widen,
 * and estimates the mouth position (mx, my) and the head height share (headFrac).
 */
export function waistFrame(box: { x0: number; y0: number; x1: number; y1: number }, img: Px) {
  const { width: w, data } = img;
  const rows: { l: number; r: number }[] = [];
  for (let y = box.y0; y <= box.y1; y++) {
    let l = -1, r = -1;
    for (let x = box.x0; x <= box.x1; x++)
      if (data[(y * w + x) * 4 + 3] > 128) {
        if (l < 0) l = x;
        r = x;
      }
    rows.push({ l, r });
  }
  const figH = rows.length;
  // head width: median width of rows 8%..20% of the figure (hair + face)
  const band = rows.slice(Math.round(figH * 0.08), Math.max(Math.round(figH * 0.2), Math.round(figH * 0.08) + 1)).filter((r) => r.l >= 0);
  const widths = band.map((r) => r.r - r.l).sort((a, b) => a - b);
  const headW = widths[Math.floor(widths.length / 2)] || (box.x1 - box.x0) / 3;
  // shoulders: first row below 15% that is much wider than the head
  let shoulder = Math.round(figH * 0.45);
  for (let i = Math.round(figH * 0.15); i < figH; i++)
    if (rows[i].l >= 0 && rows[i].r - rows[i].l > headW * 1.7) {
      shoulder = i;
      break;
    }
  const headRows = rows.slice(0, shoulder).filter((r) => r.l >= 0);
  const headX = headRows.reduce((s, r) => s + (r.l + r.r) / 2, 0) / Math.max(1, headRows.length);
  const pad = Math.round(figH * 0.03);
  const sy = Math.max(0, box.y0 - pad);
  const H = box.y1 + 1 - sy;
  const W = Math.min(img.width, Math.round((box.x1 - box.x0 + 1) * 1.06));
  const sx = Math.round(Math.min(Math.max(0, (box.x0 + box.x1) / 2 - W / 2), img.width - W));
  // mouth: about 62% of the way from the top of the hair to the shoulders
  const mouthY = box.y0 + shoulder * 0.62;
  return { sx, sy, W, H, mx: (headX - sx) / W, my: (mouthY - sy) / H, a: H / W, headFrac: shoulder / H };
}

/**
 * Browser: image -> transparent PNG framed waist-up.
 * strict: only a green screen counts (the app's own generation retries otherwise).
 * Not strict (her upload from ChatGPT/Gemini): any flat background works; an image that is already transparent is kept.
 */
export async function cutoutCharacter(img: { mimeType: string; data: string } | Blob, strict = true) {
  const src = img instanceof Blob ? img : await (await fetch(`data:${img.mimeType};base64,${img.data}`)).blob();
  const bmp = await createImageBitmap(src);
  const cv = document.createElement('canvas');
  cv.width = bmp.width;
  cv.height = bmp.height;
  const ctx = cv.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(bmp, 0, 0);
  bmp.close();
  const px = ctx.getImageData(0, 0, cv.width, cv.height);
  const key = borderColor(px);
  const alreadyClear = countClear(px) > 0.15;
  if (!alreadyClear) {
    if (!isGreenScreen(key) && (strict || borderSpread(px, key) > 28)) return null;
    const removed = removeBackground(px);
    if (removed < 0.15 || removed > 0.9) return null;
  }
  const box = alphaBox(px);
  if (!box) return null;
  ctx.putImageData(px, 0, 0);
  const f = waistFrame(box, px);
  const out = document.createElement('canvas');
  out.width = f.W;
  out.height = f.H;
  out.getContext('2d')!.drawImage(cv, f.sx, f.sy, f.W, f.H, 0, 0, f.W, f.H);
  const blob: Blob = await new Promise((r) => out.toBlob((b) => r(b!), 'image/png'));
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  cv.width = cv.height = out.width = out.height = 0;
  return { mimeType: 'image/png', data: btoa(s), mx: f.mx, my: f.my, a: f.a, headFrac: f.headFrac };
}
