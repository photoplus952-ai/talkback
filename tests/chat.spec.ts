import { expect, test, type Page } from '@playwright/test';

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
  const seen: { chat: any[]; tts: string[]; image: number } = { chat: [], tts: [], image: 0 };
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
    // a 1x1 pink PNG
    const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    await r.fulfill({ json: { images: [{ mimeType: 'image/png', data: png }] }, headers: { 'Access-Control-Allow-Origin': '*' } });
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
  await expect(page.getByText('התמונה שלך לא נשמרת')).toBeVisible();
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
  await page.locator('input[type=file]:not([capture])').setInputFiles({ name: 'me.png', mimeType: 'image/png', buffer: png });
  await expect(page.locator('.you-opt img')).toHaveCount(4);
  expect(seen.image).toBe(4);
  await page.getByRole('button', { name: 'גרסה 2' }).click();
  await page.getByRole('button', { name: 'זו אני' }).click();
  await expect(page.getByAltText('הדמות שלי')).toBeVisible();
  await expect(page.getByRole('button', { name: 'לדבר עם עצמי' })).toBeVisible();
});
