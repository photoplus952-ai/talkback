// Recording with simple voice activity detection: stops by itself after 500 ms of silence.
// (A small energy detector in Web Audio: no model download.)
import { API_URL } from '../config';
import { logMetric } from '../lib/metrics';

export type RecState = { level: number; speaking: boolean };

export class MicError extends Error {
  constructor(public code: 'denied' | 'unavailable') {
    super(code);
  }
}

const SILENCE_MS = 500;
const MAX_MS = 30_000;
const NO_SPEECH_MS = 8_000;

export async function recordUtterance(opts: {
  onLevel?: (s: RecState) => void;
  signal?: AbortSignal;
}): Promise<{ blob: Blob; endedAt: number } | null> {
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  } catch (e) {
    throw new MicError((e as Error).name === 'NotAllowedError' ? 'denied' : 'unavailable');
  }
  const ctx = new AudioContext();
  const src = ctx.createMediaStreamSource(stream);
  const an = ctx.createAnalyser();
  an.fftSize = 1024;
  src.connect(an);
  const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((m) => MediaRecorder.isTypeSupported(m)) || '';
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  rec.start(100);

  const buf = new Float32Array(an.fftSize);
  const t0 = performance.now();
  let noise = 0.01;
  let heard = false;
  let lastVoice = 0;
  let endedAt = 0;
  let manual = false;

  const finished = new Promise<void>((resolve) => {
    const tick = () => {
      if (opts.signal?.aborted) {
        manual = true;
        return resolve();
      }
      an.getFloatTimeDomainData(buf);
      let sum = 0;
      for (const v of buf) sum += v * v;
      const rms = Math.sqrt(sum / buf.length);
      const now = performance.now();
      if (!heard && now - t0 < 300) noise = Math.max(noise * 0.9 + rms * 0.1, 0.004);
      const speaking = rms > Math.max(noise * 3, 0.015);
      if (speaking) {
        heard = true;
        lastVoice = now;
      }
      opts.onLevel?.({ level: Math.min(1, rms * 8), speaking });
      if (heard && now - lastVoice > SILENCE_MS) return resolve();
      if (!heard && now - t0 > NO_SPEECH_MS) return resolve();
      if (now - t0 > MAX_MS) return resolve();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await finished;
  endedAt = heard ? lastVoice : performance.now();
  await new Promise<void>((r) => {
    rec.onstop = () => r();
    rec.stop();
  });
  stream.getTracks().forEach((t) => t.stop());
  void ctx.close();
  if (!heard && !manual) return null;
  if (manual && opts.signal?.reason === 'cancel') return null;
  return { blob: new Blob(chunks, { type: rec.mimeType || 'audio/webm' }), endedAt };
}

async function toBase64(b: Blob): Promise<string> {
  const bytes = new Uint8Array(await b.arrayBuffer());
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

export async function transcribe(blob: Blob): Promise<string> {
  const t0 = performance.now();
  const r = await fetch(`${API_URL}/transcribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audio: await toBase64(blob), mimeType: blob.type.split(';')[0] || 'audio/webm' }),
  });
  if (!r.ok) throw new Error(`transcribe ${r.status}`);
  const j = (await r.json()) as { text?: string };
  logMetric({ kind: 'transcribe', ms: performance.now() - t0, model: r.headers.get('X-Model') || '' });
  return (j.text || '').trim();
}
