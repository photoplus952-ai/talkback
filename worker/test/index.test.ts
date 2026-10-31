import { afterEach, describe, expect, it, vi } from 'vitest';
import worker, { pcmToWav, withFallback, type Env } from '../src/index';

const APP = 'https://photoplus952-ai.github.io';
const env = (over: Partial<Env> = {}): Env => ({
  GEMINI_API_KEY: 'test-key',
  ALLOWED_ORIGINS: `${APP},http://localhost:5173`,
  CHAT_MODELS: 'm-fast,m-backup',
  TTS_MODELS: 'tts-a,tts-b',
  IMAGE_MODELS: 'img-a',
  LIVE_MODEL: 'live-x',
  ...over,
});
const post = (path: string, body: unknown, origin: string | null = APP) =>
  new Request(`https://api.test${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(origin ? { Origin: origin } : {}) },
    body: JSON.stringify(body),
  });

afterEach(() => vi.unstubAllGlobals());

describe('access', () => {
  it('health works without the key and says so', async () => {
    const r = await worker.fetch(new Request('https://api.test/health'), env({ GEMINI_API_KEY: undefined }));
    expect(await r.json()).toMatchObject({ ok: true, hasKey: false });
  });

  it('deep health checks the key with Gemini', async () => {
    const f = vi.fn(async () => new Response('{}', { status: 403 }));
    vi.stubGlobal('fetch', f);
    const r = await worker.fetch(new Request('https://api.test/health?deep=1'), env());
    expect(await r.json()).toMatchObject({ hasKey: true, keyWorks: false });
    expect((f.mock.calls[0] as any)[1].headers['x-goog-api-key']).toBe('test-key');
  });

  it('blocks other sites', async () => {
    const r = await worker.fetch(post('/chat', { messages: [{ role: 'user', text: 'hi' }] }, 'https://evil.example'), env());
    expect(r.status).toBe(403);
    expect(r.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('blocks requests with no origin', async () => {
    const r = await worker.fetch(post('/chat', { messages: [] }, null), env());
    expect(r.status).toBe(403);
  });

  it('answers the preflight for the app', async () => {
    const r = await worker.fetch(new Request('https://api.test/chat', { method: 'OPTIONS', headers: { Origin: APP } }), env());
    expect(r.status).toBe(204);
    expect(r.headers.get('Access-Control-Allow-Origin')).toBe(APP);
  });

  it('says clearly when the key is missing', async () => {
    const r = await worker.fetch(post('/chat', { messages: [{ role: 'user', text: 'hi' }] }), env({ GEMINI_API_KEY: undefined }));
    expect(r.status).toBe(503);
    expect(await r.json()).toEqual({ error: 'no_key' });
  });
});

describe('chat', () => {
  it('streams from the first model that works, never exposing the key', async () => {
    const calls: string[] = [];
    vi.stubGlobal('fetch', async (u: string, init: RequestInit) => {
      calls.push(u);
      const body = JSON.parse(String(init.body));
      expect(body.systemInstruction.parts[0].text).toBe('You are Max');
      expect(body.generationConfig.thinkingConfig.thinkingLevel).toBe('minimal');
      if (u.includes('m-fast')) return new Response('quota', { status: 429 });
      return new Response('data: {"x":1}\n\n', { headers: { 'Content-Type': 'text/event-stream' } });
    });
    const r = await worker.fetch(post('/chat', { system: 'You are Max', messages: [{ role: 'user', text: 'hi' }] }), env());
    expect(r.status).toBe(200);
    expect(r.headers.get('X-Model')).toBe('m-backup');
    expect(r.headers.get('Content-Type')).toContain('text/event-stream');
    expect(await r.text()).toContain('data:');
    expect(calls[1]).toContain('m-backup:streamGenerateContent?alt=sse');
    expect(calls.join()).not.toContain('test-key');
  });

  it('reports quota without leaking the upstream body', async () => {
    vi.stubGlobal('fetch', async () => new Response('secret details', { status: 429 }));
    const r = await worker.fetch(post('/chat', { messages: [{ role: 'user', text: 'hi' }] }), env());
    expect(r.status).toBe(429);
    expect(await r.text()).not.toContain('secret');
  });
});

describe('tts', () => {
  it('returns a WAV from Gemini PCM', async () => {
    const pcm = btoa(String.fromCharCode(1, 2, 3, 4));
    vi.stubGlobal('fetch', async (_u: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body));
      expect(body.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName).toBe('Algenib');
      return Response.json({ candidates: [{ content: { parts: [{ inlineData: { mimeType: 'audio/L16;codec=pcm;rate=24000', data: pcm } }] } }] });
    });
    const r = await worker.fetch(post('/tts', { text: 'Hey there', voice: 'Algenib', style: 'dry' }), env());
    expect(r.headers.get('Content-Type')).toBe('audio/wav');
    const buf = new Uint8Array(await r.arrayBuffer());
    expect(buf.length).toBe(48);
    expect(String.fromCharCode(...buf.slice(0, 4))).toBe('RIFF');
  });
});

describe('live token', () => {
  it('creates a single-use ephemeral token', async () => {
    vi.stubGlobal('fetch', async (u: string, init: RequestInit) => {
      expect(u).toContain('/v1alpha/auth_tokens');
      expect(JSON.parse(String(init.body)).uses).toBe(1);
      return Response.json({ name: 'auth_tokens/abc' });
    });
    const r = await worker.fetch(post('/live-token', {}), env());
    expect(await r.json()).toMatchObject({ token: 'auth_tokens/abc', model: 'live-x' });
  });
});

describe('image', () => {
  it('returns the generated images', async () => {
    vi.stubGlobal('fetch', async () =>
      Response.json({ candidates: [{ content: { parts: [{ inlineData: { mimeType: 'image/png', data: 'AAA' } }] } }] }),
    );
    const r = await worker.fetch(post('/image', { prompt: 'same style', images: [{ mimeType: 'image/jpeg', data: 'BBB' }], count: 2 }), env());
    const j = (await r.json()) as { images: unknown[] };
    expect(j.images).toHaveLength(2);
  });
});

describe('transcribe', () => {
  it('sends the audio and returns the text', async () => {
    vi.stubGlobal('fetch', async (_u: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body));
      expect(body.contents[0].parts[0].inlineData).toEqual({ mimeType: 'audio/webm', data: 'QUJD' });
      return Response.json({ candidates: [{ content: { parts: [{ text: ' Yesterday I go to the client. ' }] } }] });
    });
    const r = await worker.fetch(post('/transcribe', { audio: 'QUJD', mimeType: 'audio/webm' }), env());
    expect(await r.json()).toEqual({ text: 'Yesterday I go to the client.' });
  });
});

describe('helpers', () => {
  it('pcmToWav writes a valid header', () => {
    const w = pcmToWav(new Uint8Array(10), 24000);
    const v = new DataView(w.buffer);
    expect(v.getUint32(24, true)).toBe(24000);
    expect(v.getUint32(40, true)).toBe(10);
  });
  it('withFallback returns the last failure when all fail', async () => {
    const { res, model } = await withFallback(['a', 'b'], async () => new Response('', { status: 503 }));
    expect(res.status).toBe(503);
    expect(model).toBe('b');
  });
});
