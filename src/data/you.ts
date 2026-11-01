// You 2.0: her chosen character. Saved on the device only. The original photo is never saved.
import { load, save } from '../lib/store';
import { API_URL } from '../config';
import { CHARS } from './characters';
import { cutoutCharacter } from '../lib/cutout';

/** cutout: transparent PNG framed like the Cast; mx/my/a as in CHARS. Older saves have no cutout. */
export type YouCharacter = {
  mimeType: string;
  data: string;
  createdAt: number;
  cutout?: boolean;
  /** waist-up image; headFrac = share of the image height taken by the head (hair to shoulders) */
  waist?: boolean;
  headFrac?: number;
  mx?: number;
  my?: number;
  a?: number;
};
export type YouImage = { mimeType: string; data: string; mx: number; my: number; a: number; headFrac: number };
const KEY = 'you.character';

export const loadYou = () => load<YouCharacter | null>(KEY, null);
export const saveYou = (y: YouCharacter) => save(KEY, y);
export const deleteYou = () => save<YouCharacter | null>(KEY, null);

// Image 0: her photo (first = strongest). Images 1-3: Cast references, waist-up, on the green screen.
export const YOU_PROMPT =
  'Portrait of the woman from image 0, redrawn as a stylized 3D animated character who belongs to the same cast as images 1, 2 and 3. ' +
  'LIKENESS IS THE TOP PRIORITY: keep her exact face from image 0: face shape, jawline, cheeks, eye shape and eye color, eyebrows, nose, lips, ' +
  'skin tone, any freckles or beauty marks, and her exact hairstyle: hair length, hair color, parting, bangs, curls or straightness, hairline. ' +
  'If she wears glasses or a head covering in image 0, keep them exactly. She must be instantly recognizable as the same person. ' +
  'STYLE from images 1, 2 and 3: same stylized 3D animated rendering, same level of detail and line quality, without changing her features. ' +
  'LIGHTING exactly like images 1, 2 and 3: dark, moody, low-key; soft cool light on the face; strong saturated hot-pink rim light along her hair, ' +
  'face edges and shoulders; deep shadows; slightly desaturated cool skin; high contrast. ' +
  'Modest casual top in black or dark tones with small pink accents, long sleeves, high neckline. ' +
  'Framing like images 1, 2 and 3: from the waist up, centered, facing the camera, friendly slight smile, the top of the head fully inside the frame. ' +
  'Background exactly like images 1, 2 and 3: a perfectly flat, uniform, pure chroma-key green (#00FF00), no gradient, no green on her. ' +
  'No text, no logo, no frame.';

/** For her own ChatGPT / Gemini chat: she attaches her photo + the cast sheet and pastes this. */
export const CHAT_APP_PROMPT =
  'I am attaching two images: (1) a photo of me, (2) three characters from my app, standing on a green background.\n' +
  'Create ONE new image: ME, drawn as a new member of that same cast.\n\n' +
  'LIKENESS IS THE TOP PRIORITY. Keep my exact face from image 1: face shape, jawline, eye shape and color, eyebrows, nose, lips, ' +
  'skin tone, freckles or beauty marks, and my exact hairstyle (length, color, parting, bangs, texture, hairline). ' +
  'If I wear glasses or a head covering, keep them exactly. I must be instantly recognizable.\n\n' +
  'STYLE exactly like image 2: the same stylized 3D animated rendering, proportions, line quality and level of detail.\n' +
  'LIGHTING exactly like image 2: dark, moody, low-key; soft cool light on the face; strong saturated hot-pink rim light along my hair, ' +
  'face edges and shoulders; deep shadows; slightly desaturated cool skin; high contrast.\n' +
  'CLOTHING: modest casual top in black or dark tones with small pink accents, long sleeves, high neckline.\n' +
  'FRAMING: from the waist up, centered, facing the camera, friendly slight smile, the whole head inside the frame. Portrait 3:4.\n' +
  'BACKGROUND: perfectly flat, uniform pure green (#00FF00), like image 2. No gradient, no shadow, no green on me.\n' +
  'No text, no logo, no frame.';

/** The cast sheet she attaches in ChatGPT / Gemini: 3 references side by side on the green screen. */
export async function castSheet(): Promise<Blob> {
  const refs = await castRefs();
  const cv = document.createElement('canvas');
  cv.width = 384 * 3;
  cv.height = 512;
  const ctx = cv.getContext('2d')!;
  for (let i = 0; i < refs.length; i++) {
    const bmp = await createImageBitmap(await (await fetch(`data:${refs[i].mimeType};base64,${refs[i].data}`)).blob());
    ctx.drawImage(bmp, i * 384, 0);
    bmp.close();
  }
  return new Promise((r) => cv.toBlob((b) => r(b!), 'image/png'));
}

/** Her finished character from ChatGPT / Gemini -> cut out and framed. null if the background could not be removed. */
export async function fromUpload(file: Blob): Promise<YouImage | null> {
  return cutoutCharacter(file, false);
}

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
/**
 * Cast references for the model only: cropped waist-up around the face and placed on the green screen, 384x512.
 * The app's own art is never changed.
 */
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
      // waist-up crop: from just above the hair to about 3.4x the mouth height, centered on the face
      const cropH = Math.min(bmp.height, bmp.height * c.my * 3.4);
      const cropW = cropH * 0.75;
      const cx = c.mx * bmp.width;
      const top = Math.max(0, bmp.height * c.my - cropH * 0.3);
      ctx.drawImage(bmp, cx - cropW / 2, top, cropW, cropH, 0, 0, cv.width, cv.height);
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
      body: JSON.stringify({ prompt: YOU_PROMPT, images: [photo, ...refs], count: 1 }),
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
