// Speed log (CLAUDE.md rule 4): first audio within 1.5 s of the end of her speech. Kept on the device.
import { change } from './store';

export type Metric = { at: number; kind: 'first_token' | 'first_audio' | 'transcribe' | 'tts'; ms: number; model?: string };

export function logMetric(m: Omit<Metric, 'at'>) {
  const entry = { ...m, at: Date.now() };
  console.info(`[speed] ${m.kind}: ${Math.round(m.ms)} ms${m.model ? ` (${m.model})` : ''}`);
  void change<Metric[]>('metrics', [], (xs) => [...xs, entry].slice(-300));
}
