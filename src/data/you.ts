// You 2.0: her chosen character. Saved on the device only. The original photo is never saved.
import { load, save } from '../lib/store';
import { API_URL } from '../config';
import { CHARS } from './characters';
import { cutoutCharacter } from '../lib/cutout';

/** cutout: transparent PNG framed like the Cast; mx/my/a as in CHARS. Older saves have no cutout. */
export type YouCharacter = { mimeType: string; data: string; createdAt: number; cutout?: boolean; mx?: number; my?: number; a?: number };
export type YouImage = { mimeType: string; data: string; mx: number; my: number; a: number };
const KEY = 'you.character';

export const loadYou = () => load<YouCharacter | null>(KEY, null);
export const saveYou = (y: YouCharacter) => save(KEY, y);
export const deleteYou = () => save<YouCharacter | null>(KEY, null);

// Image 0-2: Cast references on a green screen. Image 3: her photo. (FLUX.2 takes up to 4 images.)
export const YOU_PROMPT =
  'Create a new character: the woman from image 3, drawn in exactly the same stylized 3D animated style as the characters in images 0, 1 and 2, ' +
  'as if she belongs to the same cast: same rendering, proportions, line quality and level of detail. ' +
  'Lighting exactly like images 0, 1 and 2: dark, moody, low-key lighting, soft cool light on the face, ' +
  'strong saturated hot-pink rim light along the edges of her hair, face, shoulders, arms and legs, deep shadows, slightly desaturated cool skin, high contrast. ' +
  'Keep her face shape, facial features, eye color and hairstyle from image 3 so she is clearly recognizable. ' +
  'Modest casual clothing in black and dark tones with small pink accents, long sleeves, long pants or long skirt, sneakers. ' +
  'Full body from head to shoes, standing, relaxed confident pose, facing the camera, friendly slight smile, the whole figure inside the frame with a small margin. ' +
  'Background exactly like images 0, 1 and 2: a perfectly flat, uniform, pure chroma-key green (#00FF00), no floor shadow, no gradient, no green on the character. ' +
  'No text, no logo, no frame.';

export function dataUrl(y: { mimeType: string; data: string }) {
  return `data:${y.mimeType};base64,${y.data}`;
}

async function blobToB64(b: Blob): Promise<string> {
  const bytes = new Uint8Array(await b.arrayBuffer());
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

/** Read her photo into memory only, scaled to the model's input size (512). Nothing is written anywhere. */
export async function readPhoto(file: File): Promise<{ mimeType: string; data: string }> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, 512 / Math.max(bmp.width, bmp.height));
  const cv = document.createElement('canvas');
  cv.width = Math.round(bmp.width * k);
  cv.height = Math.round(bmp.height * k);
  cv.getContext('2d')!.drawImage(bmp, 0, 0, cv.width, cv.height);
  bmp.close();
  const blob: Blob = await new Promise((r) => cv.toBlob((b) => r(b!), 'image/jpeg', 0.9));
  cv.width = cv.height = 0;
  return { mimeType: 'image/jpeg', data: await blobToB64(blob) };
}

// Two women and one man from the Cast: style, lighting and the green screen to copy.
const REF_IDS = ['speedrunner', 'overthinker', 'cynic'];

let refsCache: { mimeType: string; data: string }[] | null = null;
/** Cast references for the model only: placed on the green screen, 384x512. The app's own art is never changed. */
export async function castRefs() {
  if (refsCache) return refsCache;
  refsCache = await Promise.all(
    REF_IDS.map(async (id) => {
      const c = CHARS.find((x) => x.id === id)!;
      const bmp = await createImageBitmap(await (await fetch(c.img)).blob());
      const cv = document.createElement('canvas');
      cv.width = 384;
      cv.height = 512;
      const ctx = cv.getContext('2d')!;
      ctx.fillStyle = '#00FF00';
      ctx.fillRect(0, 0, cv.width, cv.height);
      const k = Math.min((cv.height * 0.94) / bmp.height, (cv.width * 0.94) / bmp.width);
      const w = bmp.width * k, h = bmp.height * k;
      ctx.drawImage(bmp, (cv.width - w) / 2, (cv.height - h) / 2, w, h);
      bmp.close();
      const blob: Blob = await new Promise((r) => cv.toBlob((b) => r(b!), 'image/png'));
      return { mimeType: 'image/png', data: await blobToB64(blob) };
    }),
  );
  return refsCache;
}

export class ImageError extends Error {
  constructor(public code: 'quota' | 'no_key' | 'offline' | 'server') {
    super(code);
  }
}

async function requestImage(photo: { mimeType: string; data: string }): Promise<{ mimeType: string; data: string }> {
  const refs = await castRefs();
  let r: Response;
  try {
    r = await fetch(`${API_URL}/image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: YOU_PROMPT, images: [...refs, photo], count: 1 }),
    });
  } catch {
    throw new ImageError('offline');
  }
  if (!r.ok) {
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    throw new ImageError(j.error === 'quota' ? 'quota' : j.error === 'no_key' ? 'no_key' : 'server');
  }
  const j = (await r.json()) as { images: { mimeType: string; data: string }[] };
  if (!j.images?.[0]) throw new ImageError('server');
  return j.images[0];
}

/** One version of her character, cut out of the background. Off-style results are requested again, at most twice. */
export async function generateOne(photo: { mimeType: string; data: string }): Promise<YouImage> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const raw = await requestImage(photo);
    const cut = await cutoutCharacter(raw);
    if (cut) return cut;
  }
  throw new ImageError('server');
}
