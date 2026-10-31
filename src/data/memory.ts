// Memory: facts she shared, collected from the "memory" field. Device only, max 50, deduped.
import { change, load } from '../lib/store';

export type MemoryItem = { text: string; at: number; char: string };
const KEY = 'memory';
const MAX = 50;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9א-ת ]/g, '').replace(/\s+/g, ' ').trim();

export function mergeMemory(items: MemoryItem[], add: string[], char: string, now = Date.now()): MemoryItem[] {
  const out = [...items];
  for (const t of add) {
    const n = norm(t);
    if (!n) continue;
    const i = out.findIndex((x) => norm(x.text) === n);
    if (i !== -1) out.splice(i, 1);
    out.push({ text: t.trim(), at: now, char });
  }
  return out.slice(-MAX);
}

export async function remember(add: string[], char: string) {
  if (!add.length) return;
  await change<MemoryItem[]>(KEY, [], (xs) => mergeMemory(xs, add, char));
}

/** The 5 most relevant: topic matches first, then the newest. */
export function pickMemory(items: MemoryItem[], topic = '', n = 5): string[] {
  const words = norm(topic).split(' ').filter((w) => w.length > 3);
  const score = (x: MemoryItem) => (words.some((w) => norm(x.text).includes(w)) ? 1e15 : 0) + x.at;
  return [...items].sort((a, b) => score(b) - score(a)).slice(0, n).map((x) => x.text);
}

export const loadMemory = () => load<MemoryItem[]>(KEY, []);
