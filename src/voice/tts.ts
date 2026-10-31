// Gemini TTS per character, one sentence at a time, fetched in parallel and played in order.
// Audio is cached on the device, so repeated lines cost nothing.
import { API_URL } from '../config';
import type { Character } from '../data/characters';
import { load, save } from '../lib/store';
import { logMetric } from '../lib/metrics';

async function fetchSentence(text: string, c: Character): Promise<Blob> {
  const key = `tts:${c.voice.tts}:${text}`;
  const cached = await load<Blob | null>(key, null);
  if (cached) return cached;
  const t0 = performance.now();
  const r = await fetch(`${API_URL}/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice: c.voice.tts, style: c.voice.style }),
  });
  if (!r.ok) throw new Error(`tts ${r.status}`);
  const blob = await r.blob();
  logMetric({ kind: 'tts', ms: performance.now() - t0, model: r.headers.get('X-Model') || '' });
  void save(key, blob);
  return blob;
}

type Item = { text: string; blob: Promise<Blob> };

/** A queue for one reply. enqueue() as sentences complete; they play in order. */
export class Speaker {
  private items: Item[] = [];
  private playing = false;
  private audio: HTMLAudioElement | null = null;
  private stopped = false;
  private firstAudioAt: number | null;
  onState?: (speaking: boolean) => void;
  onError?: () => void;

  constructor(private c: Character, startedAt: number | null = null) {
    this.firstAudioAt = startedAt;
  }

  enqueue(text: string) {
    const t = text.trim();
    if (!t || this.stopped) return;
    const blob = fetchSentence(t, this.c);
    blob.catch(() => {});
    this.items.push({ text: t, blob });
    if (!this.playing) void this.next();
  }

  private async next() {
    const it = this.items.shift();
    if (!it || this.stopped) {
      this.playing = false;
      this.onState?.(false);
      return;
    }
    this.playing = true;
    this.onState?.(true);
    try {
      const blob = await it.blob;
      if (this.stopped) return;
      const url = URL.createObjectURL(blob);
      const a = new Audio(url);
      this.audio = a;
      await new Promise<void>((resolve) => {
        a.onended = a.onerror = () => resolve();
        a.play()
          .then(() => {
            if (this.firstAudioAt !== null) {
              logMetric({ kind: 'first_audio', ms: performance.now() - this.firstAudioAt });
              this.firstAudioAt = null;
            }
          })
          .catch(() => resolve());
      });
      URL.revokeObjectURL(url);
    } catch {
      this.onError?.();
    }
    void this.next();
  }

  stop() {
    this.stopped = true;
    this.items = [];
    this.audio?.pause();
    this.playing = false;
    this.onState?.(false);
  }
}

/** Speak a whole message (the speaker button). */
export function speakAll(text: string, c: Character, sentences: string[]): Speaker {
  const s = new Speaker(c);
  (sentences.length ? sentences : [text]).forEach((x) => s.enqueue(x));
  return s;
}
