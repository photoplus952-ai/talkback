// Cut her character out of a flat green background, on the device (no model download).
// Flood fill from the borders, so green-ish pixels inside the figure are never removed,
// then soften the edge and remove green spill, crop to the figure and frame it like the Cast.

export type Px = { width: number; height: number; data: Uint8ClampedArray };

/** How "background" a pixel is: 0 = surely figure, 1 = surely background. */
function bgScore(r: number, g: number, b: number, key: [number, number, number]): number {
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

export function isGreenScreen(key: [number, number, number]): boolean {
  return key[1] > 120 && key[1] - Math.max(key[0], key[2]) > 60;
}

/** In place: sets alpha. Returns the share of pixels removed. */
export function removeBackground(img: Px): number {
  const { width: w, height: h, data } = img;
  const key = borderColor(img);
  const score = new Float32Array(w * h);
  for (let p = 0; p < w * h; p++) score[p] = bgScore(data[p * 4], data[p * 4 + 1], data[p * 4 + 2], key);

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
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const lim = Math.max(r, b) + 6;
    if (g > lim) data[i + 1] = lim;
  }
  return removed / (w * h);
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
 * Frame like the Cast: figure fills the height with a small margin, aspect (h/w) about 1.37.
 * Also estimates the mouth position (mx, my) from the head: the Cast has the mouth ~11% below the top.
 */
export function castFrame(box: { x0: number; y0: number; x1: number; y1: number }, img: Px) {
  const figH = box.y1 - box.y0 + 1;
  const H = Math.round(figH / 0.94);
  const W = Math.max(Math.round(H / 1.37), Math.round((box.x1 - box.x0 + 1) * 1.06));
  const top = box.y0 - Math.round(H * 0.02);
  // head center: middle of the visible pixels in the top 10% of the figure
  const headBottom = box.y0 + Math.round(figH * 0.1);
  let sx = 0, n = 0;
  for (let y = box.y0; y <= headBottom; y++)
    for (let x = box.x0; x <= box.x1; x++)
      if (img.data[(y * img.width + x) * 4 + 3] > 128) { sx += x; n++; }
  const headX = n ? sx / n : (box.x0 + box.x1) / 2;
  const left = Math.round(headX - W / 2);
  const mouthY = box.y0 + figH * 0.115;
  return {
    sx: left, sy: top, W, H,
    mx: (headX - left) / W,
    my: (mouthY - top) / H,
    a: H / W,
  };
}

/** Browser: PNG data (base64) -> transparent PNG framed like the Cast. */
export async function cutoutCharacter(img: { mimeType: string; data: string }) {
  const bmp = await createImageBitmap(await (await fetch(`data:${img.mimeType};base64,${img.data}`)).blob());
  const cv = document.createElement('canvas');
  cv.width = bmp.width;
  cv.height = bmp.height;
  const ctx = cv.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(bmp, 0, 0);
  bmp.close();
  const px = ctx.getImageData(0, 0, cv.width, cv.height);
  const key = borderColor(px);
  if (!isGreenScreen(key)) return null; // model ignored the green screen: ask again
  const removed = removeBackground(px);
  if (removed < 0.2 || removed > 0.9) return null;
  const box = alphaBox(px);
  if (!box) return null;
  ctx.putImageData(px, 0, 0);
  const f = castFrame(box, px);
  const out = document.createElement('canvas');
  out.width = f.W;
  out.height = f.H;
  out.getContext('2d')!.drawImage(cv, f.sx, f.sy, f.W, f.H, 0, 0, f.W, f.H);
  const blob: Blob = await new Promise((r) => out.toBlob((b) => r(b!), 'image/png'));
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  cv.width = cv.height = out.width = out.height = 0;
  return { mimeType: 'image/png', data: btoa(s), mx: f.mx, my: f.my, a: f.a };
}
