import { expect, test, type Page } from '@playwright/test';
import { deflateSync } from 'node:zlib';

/** A 120x160 green-screen PNG with a dark figure and pink rim, like the model should return. */
function greenScreenPng(): string {
  const w = 120, h = 160;
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const fig = (x - 60) ** 2 / 400 + (y - 30) ** 2 / 400 <= 1 || (x >= 40 && x <= 80 && y >= 48 && y <= 150);
      const rim = fig && (x === 40 || x === 80);
      const [r, g, b] = rim ? [255, 26, 110] : fig ? [24, 20, 30] : [0, 255, 0];
      raw.set([r, g, b], y * (w * 3 + 1) + 1 + x * 3);
    }
  }
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf: Buffer) => {
    let c = 0xffffffff;
    for (const v of buf) c = crcTable[(c ^ v) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ]).toString('base64');
}

const API = 'https://talkback-api.myappp20266.workers.dev';
const sse = (text: string) =>
  text
    .match(/[\s\S]{1,25}/g)!
    .map((t) => `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: t }] } }] })}\r\n\r\n`)
    .join('');

// 0.05 s of silence as WAV
function wav(): Buffer {
  const pcm = Buffer.alloc(2400);
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(24000, 24);
  h.writeUInt32LE(48000, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

async function mockApi(page: Page) {
  const seen: { chat: any[]; tts: string[]; image: number; prompt: string } = { chat: [], tts: [], image: 0, prompt: '' };
  await page.route(`${API}/chat`, async (r) => {
    seen.chat.push(r.request().postDataJSON());
    await r.fulfill({
      headers: { 'Content-Type': 'text/event-stream', 'Access-Control-Allow-Origin': '*', 'X-Model': 'mock' },
      body: sse(
        'Oh, so you went and showed him the logo. Bold move. What did he say?\n###\n' +
          JSON.stringify({
            corrections: [{ wrong: 'I go', right: 'I went', why: 'אתמול = זמן עבר', type: 'tense' }],
            minor: [],
            newWords: [{ en: 'bold move', he: 'מהלך נועז', kind: 'slang' }],
            memory: ['showed a client her logo'],
            helpHe: '',
          }),
      ),
    });
  });
  await page.route(`${API}/tts`, async (r) => {
    seen.tts.push(r.request().postDataJSON().text);
    await r.fulfill({ headers: { 'Content-Type': 'audio/wav', 'Access-Control-Allow-Origin': '*' }, body: wav() });
  });
  await page.route(`${API}/image`, async (r) => {
    seen.image++;
    seen.prompt = r.request().postDataJSON().prompt;
    await r.fulfill({ json: { images: [{ mimeType: 'image/png', data: greenScreenPng() }] }, headers: { 'Access-Control-Allow-Origin': '*' } });
  });
  return seen;
}

test('chat: streams a reply, shows the correction and the new word, speaks it', async ({ page }) => {
  const seen = await mockApi(page);
  await page.goto('./');
  await page.getByRole('link', { name: "צ'אט" }).click();
  await expect(page.locator('.chat-top')).toContainText('Max');
  await expect(page.getByRole('navigation', { name: 'ניווט ראשי' })).toHaveCount(0);

  await page.getByPlaceholder('Message Max…').fill('Yesterday I go to the client and show him the logo.');
  await page.getByRole('button', { name: 'שליחה' }).click();

  await expect(page.locator('.bub-ai').last()).toHaveText('Oh, so you went and showed him the logo. Bold move. What did he say?');
  await expect(page.locator('.fix')).toContainText('I went');
  await expect(page.locator('.fix s')).toHaveText('I go');
  await expect(page.locator('.chip.violet')).toContainText('bold move');
  await expect(page.locator('.bub-ai').last()).not.toContainText('###');

  const req = seen.chat[0];
  expect(req.system).toContain('You are Max');
  expect(req.messages.at(-1)).toEqual({ role: 'user', text: 'Yesterday I go to the client and show him the logo.' });
  await expect.poll(() => seen.tts.length).toBeGreaterThanOrEqual(3);
  expect(seen.tts[0]).toBe('Oh, so you went and showed him the logo.');

  // the word lands in Words, and the conversation survives a reload
  await page.goto('./#/words');
  await expect(page.getByText('bold move')).toBeVisible();
  await page.goto('./#/chat/cynic');
  await expect(page.locator('.bub-me')).toContainText('Yesterday I go');
});

test('chat: shows a clear message when the key is missing', async ({ page }) => {
  await page.route(`${API}/chat`, (r) =>
    r.fulfill({ status: 503, json: { error: 'no_key' }, headers: { 'Access-Control-Allow-Origin': '*' } }),
  );
  await page.goto('./#/chat/speedrunner');
  await page.getByPlaceholder('Message Zoe…').fill('hi');
  await page.getByRole('button', { name: 'שליחה' }).click();
  await expect(page.getByRole('alert')).toContainText('בלי מפתח');
  await expect(page.getByPlaceholder('Message Zoe…')).toHaveValue('hi');
});

test('you 2.0: photo to 4 versions, pick one, saved on the profile', async ({ page }) => {
  const seen = await mockApi(page);
  await page.goto('./#/profile');
  await page.getByRole('link', { name: 'ליצור את הדמות שלי' }).click();
  await page.getByRole('button', { name: /כאן באפליקציה/ }).click();
  await expect(page.getByText('התמונה שלך לא נשמרת')).toBeVisible();
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
  await page.locator('input[type=file]:not([capture])').first().setInputFiles({ name: 'me.png', mimeType: 'image/png', buffer: png });
  await expect(page.locator('.you-opt img')).toHaveCount(4);
  expect(seen.image).toBe(4);
  expect(seen.prompt).toContain('rim light');
  expect(seen.prompt).toContain('#00FF00');
  // the green is gone: the chosen image is a transparent PNG
  const transparentCorner = await page.locator('.you-opt img').first().evaluate(async (img: HTMLImageElement) => {
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const x = c.getContext('2d')!; x.drawImage(img, 0, 0);
    return x.getImageData(1, 1, 1, 1).data[3];
  });
  expect(transparentCorner).toBe(0);
  await page.getByRole('button', { name: 'גרסה 2' }).click();
  await page.getByRole('button', { name: 'זו אני' }).click();
  await expect(page.getByAltText('הדמות שלי')).toBeVisible();
  await expect(page.getByRole('button', { name: 'לדבר עם עצמי' })).toBeVisible();
});

test('you 2.0: made in ChatGPT/Gemini, uploaded, background removed', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('./#/you');
  await page.getByRole('button', { name: /ב-ChatGPT או ב-Gemini/ }).click();
  await page.getByRole('button', { name: 'להעתיק' }).click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain('LIKENESS IS THE TOP PRIORITY');
  expect(copied).toContain('#00FF00');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'לשמור או לשתף' }).click()]);
  expect(download.suggestedFilename()).toBe('talkback-cast.png');
  await page.locator('input[type=file]').nth(2).setInputFiles({ name: 'me.png', mimeType: 'image/png', buffer: Buffer.from(greenScreenPng(), 'base64') });
  await expect(page.getByRole('heading', { name: 'זו את?' })).toBeVisible();
  await page.getByRole('button', { name: 'זו אני' }).click();
  await expect(page.getByAltText('הדמות שלי')).toBeVisible();
  await expect(page.getByRole('link', { name: 'להחליף דמות' })).toBeVisible();
});
