// Words she met in conversations. Device only. Spaced repetition comes in M5.
import { change, load } from '../lib/store';
import type { NewWord } from '../brain/types';

export type SavedWord = NewWord & { at: number; char: string; example?: string };
const KEY = 'words';

export async function addWords(ws: NewWord[], char: string, example?: string): Promise<SavedWord[]> {
  return change<SavedWord[]>(KEY, [], (xs) => {
    const out = [...xs];
    for (const w of ws) {
      if (!w.en?.trim()) continue;
      if (out.some((x) => x.en.toLowerCase() === w.en.toLowerCase())) continue;
      out.push({ en: w.en.trim(), he: w.he.trim(), kind: w.kind === 'slang' ? 'slang' : 'word', at: Date.now(), char, example });
    }
    return out;
  });
}

export const loadWords = () => load<SavedWord[]>(KEY, []);
