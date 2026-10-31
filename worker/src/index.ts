/**
 * TALKBACK API (Cloudflare Worker, free plan).
 * Holds the Gemini key (secret GEMINI_API_KEY) so it never reaches the browser.
 *
 * Routes:
 *   GET  /health            {ok, hasKey, version}; ?deep=1 also checks the key with Gemini
 *   POST /chat              Gemini text, streamed as SSE (model fallback)
 *   POST /tts               Gemini TTS, returns audio/wav (model fallback)
 *   POST /live-token        ephemeral token for Gemini Live (the browser connects directly)
 *   POST /image             Gemini image (photo -> character), returns base64 images
 *   POST /transcribe        short recording -> exact transcript (keeps her mistakes)
 *
 * Privacy: request bodies (photos, voice, conversations) are never logged or stored.
 */

export interface Env {
  GEMINI_API_KEY?: string;
  ALLOWED_ORIGINS: string;
  CHAT_MODELS: string;
  TTS_MODELS: string;
  IMAGE_MODELS: string;
  LIVE_MODEL: string;
}

export const VERSION = '0.1.0';
const GEMINI = 'https://generativelanguage.googleapis.com';
const MAX_BODY = 15 * 1024 * 1024;

type Json = Record<string, unknown>;

// ---------- helpers ----------

export function list(v: string | undefined): string[] {
  return (v || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function corsHeaders(origin: string | null, env: Env): Record<string, string> {
  if (!origin || !list(env.ALLOWED_ORIGINS).includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Expose-Headers': 'X-Model, Server-Timing',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra },
  });
}

function err(status: number, code: string, extra: Record<string, string> = {}) {
  return json({ error: code }, status, extra);
}

async function readJson(req: Request): Promise<Json | null> {
  const len = Number(req.headers.get('Content-Length') || 0);
  if (len > MAX_BODY) return null;
  const text = await req.text();
  if (text.length > MAX_BODY) return null;
  try {
    const v = JSON.parse(text);
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Json) : null;
  } catch {
    return null;
  }
}

function gemini(env: Env, path: string, init: RequestInit = {}) {
  return fetch(`${GEMINI}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY!, ...(init.headers || {}) },
  });
}

/** Try each model in order; return the first OK response. Retries on any upstream failure (quota, missing model, 5xx). */
export async function withFallback(
  models: string[],
  call: (model: string) => Promise<Response>,
): Promise<{ res: Response; model: string }> {
  let last: Response | null = null;
  let lastModel = models[0] || '';
  for (const m of models) {
    const r = await call(m);
    if (r.ok) return { res: r, model: m };
    last = r;
    lastModel = m;
  }
  return { res: last ?? new Response('no models', { status: 500 }), model: lastModel };
}

/** Upstream errors: pass the status class, never the body (it can echo content). */
function upstreamError(r: Response, cors: Record<string, string>) {
  const code = r.status === 429 ? 'quota' : r.status === 400 ? 'bad_request' : r.status === 403 ? 'key_rejected' : 'upstream';
  return err(r.status === 429 ? 429 : 502, code, cors);
}

/** 16-bit mono PCM -> WAV */
export function pcmToWav(pcm: Uint8Array, sampleRate = 24000): Uint8Array {
  const out = new Uint8Array(44 + pcm.length);
  const v = new DataView(out.buffer);
  const w = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF');
  v.setUint32(4, 36 + pcm.length, true);
  w(8, 'WAVE');
  w(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  w(36, 'data');
  v.setUint32(40, pcm.length, true);
  out.set(pcm, 44);
  return out;
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u;
}

type Part = { text?: string; inlineData?: { mimeType: string; data: string } };
type Candidate = { content?: { parts?: Part[] } };

// ---------- routes ----------

async function health(url: URL, env: Env, cors: Record<string, string>) {
  const hasKey = !!env.GEMINI_API_KEY;
  const body: Json = { ok: true, hasKey, version: VERSION };
  if (hasKey && url.searchParams.get('deep') === '1') {
    const r = await gemini(env, '/v1beta/models?pageSize=1');
    body.keyWorks = r.ok;
  }
  return json(body, 200, cors);
}

type ChatMsg = { role: 'user' | 'model'; text: string };

async function chat(req: Request, env: Env, cors: Record<string, string>) {
  const b = await readJson(req);
  const messages = b?.messages as ChatMsg[] | undefined;
  if (!b || !Array.isArray(messages) || !messages.length) return err(400, 'bad_request', cors);
  const contents = messages.map((m) => ({ role: m.role === 'model' ? 'model' : 'user', parts: [{ text: String(m.text ?? '') }] }));
  const payload: Json = {
    contents,
    generationConfig: { thinkingConfig: { thinkingLevel: 'minimal' }, maxOutputTokens: Number(b.maxTokens) || 600 },
  };
  if (typeof b.system === 'string') payload.systemInstruction = { parts: [{ text: b.system }] };

  const t0 = Date.now();
  const { res, model } = await withFallback(list(env.CHAT_MODELS), (m) =>
    gemini(env, `/v1beta/models/${encodeURIComponent(m)}:streamGenerateContent?alt=sse`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  );
  if (!res.ok) return upstreamError(res, cors);
  return new Response(res.body, {
    headers: {
      ...cors,
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Model': model,
      'Server-Timing': `upstream;dur=${Date.now() - t0}`,
    },
  });
}

async function tts(req: Request, env: Env, cors: Record<string, string>) {
  const b = await readJson(req);
  const text = typeof b?.text === 'string' ? b.text.trim() : '';
  const voice = typeof b?.voice === 'string' ? b.voice : '';
  if (!text || !voice || text.length > 1000) return err(400, 'bad_request', cors);
  const style = typeof b?.style === 'string' && b.style ? b.style : '';
  const prompt = style ? `Say this in a ${style} way, General American accent, casual natural pace: ${text}` : text;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
    },
  };
  const t0 = Date.now();
  const { res, model } = await withFallback(list(env.TTS_MODELS), (m) =>
    gemini(env, `/v1beta/models/${encodeURIComponent(m)}:generateContent`, { method: 'POST', body: JSON.stringify(payload) }),
  );
  if (!res.ok) return upstreamError(res, cors);
  const data = (await res.json()) as { candidates?: Candidate[] };
  const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!part?.inlineData) return err(502, 'no_audio', cors);
  const rate = Number(/rate=(\d+)/.exec(part.inlineData.mimeType)?.[1]) || 24000;
  const wav = pcmToWav(b64ToBytes(part.inlineData.data), rate);
  return new Response(wav, {
    headers: {
      ...cors,
      'Content-Type': 'audio/wav',
      'Cache-Control': 'no-store',
      'X-Model': model,
      'Server-Timing': `upstream;dur=${Date.now() - t0}`,
    },
  });
}

async function liveToken(env: Env, cors: Record<string, string>) {
  const now = Date.now();
  const expireTime = new Date(now + 30 * 60_000).toISOString(); // session may run 30 min
  const newSessionExpireTime = new Date(now + 60_000).toISOString(); // must connect within 1 min
  const r = await gemini(env, '/v1alpha/auth_tokens', {
    method: 'POST',
    body: JSON.stringify({ uses: 1, expireTime, newSessionExpireTime }),
  });
  if (!r.ok) return upstreamError(r, cors);
  const t = (await r.json()) as { name?: string };
  if (!t.name) return err(502, 'no_token', cors);
  return json({ token: t.name, model: env.LIVE_MODEL, expireTime }, 200, cors);
}

async function image(req: Request, env: Env, cors: Record<string, string>) {
  const b = await readJson(req);
  const prompt = typeof b?.prompt === 'string' ? b.prompt : '';
  const images = (Array.isArray(b?.images) ? b!.images : []) as { mimeType: string; data: string }[];
  if (!prompt || images.length > 8) return err(400, 'bad_request', cors);
  const count = Math.min(Math.max(Number(b?.count) || 1, 1), 4);
  const payload = {
    contents: [
      {
        parts: [
          ...images.map((i) => ({ inlineData: { mimeType: String(i.mimeType), data: String(i.data) } })),
          { text: prompt },
        ],
      },
    ],
    generationConfig: { responseModalities: ['IMAGE'] },
  };
  const body = JSON.stringify(payload);
  const one = () =>
    withFallback(list(env.IMAGE_MODELS), (m) =>
      gemini(env, `/v1beta/models/${encodeURIComponent(m)}:generateContent`, { method: 'POST', body }),
    );
  const results = await Promise.all(Array.from({ length: count }, one));
  const out: { mimeType: string; data: string }[] = [];
  let failed: Response | null = null;
  for (const { res } of results) {
    if (!res.ok) {
      failed = res;
      continue;
    }
    const d = (await res.json()) as { candidates?: Candidate[] };
    for (const p of d.candidates?.[0]?.content?.parts || []) if (p.inlineData?.data) out.push(p.inlineData);
  }
  if (!out.length) return failed ? upstreamError(failed, cors) : err(502, 'no_image', cors);
  return json({ images: out, model: results.find((r) => r.res.ok)?.model }, 200, cors);
}

const TRANSCRIBE_PROMPT =
  'Transcribe this recording exactly as spoken. The speaker is a Hebrew speaker learning English. ' +
  'Keep every grammar mistake and word choice as is; do not correct anything. ' +
  'Write English in English and Hebrew in Hebrew. If there is no speech, return an empty string. ' +
  'Output only the transcript.';

async function transcribe(req: Request, env: Env, cors: Record<string, string>) {
  const b = await readJson(req);
  const audio = typeof b?.audio === 'string' ? b.audio : '';
  const mimeType = typeof b?.mimeType === 'string' ? b.mimeType : 'audio/webm';
  if (!audio) return err(400, 'bad_request', cors);
  const payload = {
    contents: [{ parts: [{ inlineData: { mimeType, data: audio } }, { text: TRANSCRIBE_PROMPT }] }],
    generationConfig: { thinkingConfig: { thinkingLevel: 'minimal' }, temperature: 0, maxOutputTokens: 400 },
  };
  const t0 = Date.now();
  const { res, model } = await withFallback(list(env.CHAT_MODELS), (m) =>
    gemini(env, `/v1beta/models/${encodeURIComponent(m)}:generateContent`, { method: 'POST', body: JSON.stringify(payload) }),
  );
  if (!res.ok) return upstreamError(res, cors);
  const d = (await res.json()) as { candidates?: Candidate[] };
  const text = (d.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
  return json({ text }, 200, { ...cors, 'X-Model': model, 'Server-Timing': `upstream;dur=${Date.now() - t0}` });
}

// ---------- entry ----------

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const origin = req.headers.get('Origin');
    const cors = corsHeaders(origin, env);
    const allowed = Object.keys(cors).length > 0;

    if (req.method === 'OPTIONS') return new Response(null, { status: allowed ? 204 : 403, headers: cors });

    // Health answers anyone (it reveals nothing). Everything else only for our app.
    if (url.pathname === '/health' && req.method === 'GET') return health(url, env, cors);
    if (!allowed) return err(403, 'origin_not_allowed');
    if (!env.GEMINI_API_KEY) return err(503, 'no_key', cors);
    if (req.method !== 'POST') return err(405, 'method_not_allowed', cors);

    try {
      switch (url.pathname) {
        case '/chat':
          return await chat(req, env, cors);
        case '/tts':
          return await tts(req, env, cors);
        case '/live-token':
          return await liveToken(env, cors);
        case '/image':
          return await image(req, env, cors);
        case '/transcribe':
          return await transcribe(req, env, cors);
        default:
          return err(404, 'not_found', cors);
      }
    } catch {
      return err(500, 'internal', cors);
    }
  },
};
