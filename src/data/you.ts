// You 2.0: her chosen character. Saved on the device only. The original photo is never saved.
import { load, save } from '../lib/store';
import { API_URL } from '../config';
import { CHARS } from './characters';

export type YouCharacter = { mimeType: string; data: string; createdAt: number };
const KEY = 'you.character';

export const loadYou = () => load<YouCharacter | null>(KEY, null);
export const saveYou = (y: YouCharacter) => save(KEY, y);
export const deleteYou = () => save<YouCharacter | null>(KEY, null);

export const YOU_PROMPT =
  'Turn the person in the LAST image into a character in exactly the same stylized 3D animated style as the ' +
  'reference characters (the first images): same rendering, lighting, proportions and line quality. ' +
  'Keep her facial features, face shape, skin tone, eye color and hairstyle so she is clearly recognizable. ' +
  'Modest, casual clothing in dark tones like the references, long sleeves. Full body, standing, relaxed confident pose, ' +
  'facing the camera, friendly slight smile. Plain flat solid background in pink #FF1A6E. No text, no logo, no frame.';

export function dataUrl(y: { mimeType: string; data: string }) {
  return `data:${y.mimeType};base64,${y.data}`;
}

async function blobToB64(b: Blob): Promise<string> {
  const bytes = new Uint8Array(await b.arrayBuffer());
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

/** Read her photo into memory only, scaled down to about 1024px. Nothing is written anywhere. */
export async function readPhoto(file: File): Promise<{ mimeType: string; data: string }> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, 1024 / Math.max(bmp.width, bmp.height));
  const cv = document.createElement('canvas');
  cv.width = Math.round(bmp.width * k);
  cv.height = Math.round(bmp.height * k);
  cv.getContext('2d')!.drawImage(bmp, 0, 0, cv.width, cv.height);
  bmp.close();
  const blob: Blob = await new Promise((r) => cv.toBlob((b) => r(b!), 'image/jpeg', 0.9));
  cv.width = cv.height = 0;
  return { mimeType: 'image/jpeg', data: await blobToB64(blob) };
}

let refsCache: { mimeType: string; data: string }[] | null = null;
/** The 5 Cast images, sent as style references (unchanged files). */
export async function castRefs() {
  if (refsCache) return refsCache;
  refsCache = await Promise.all(
    CHARS.map(async (c) => {
      const b = await (await fetch(c.img)).blob();
      return { mimeType: b.type || 'image/webp', data: await blobToB64(b) };
    }),
  );
  return refsCache;
}

export class ImageError extends Error {
  constructor(public code: 'quota' | 'no_key' | 'offline' | 'server') {
    super(code);
  }
}

/** One version of her character. */
export async function generateOne(photo: { mimeType: string; data: string }): Promise<{ mimeType: string; data: string }> {
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
