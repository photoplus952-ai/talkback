import { EMPTY_META, type Meta } from './types';

/** While streaming: the part to show (everything before ###). */
export function visible(raw: string): string {
  const i = raw.indexOf('###');
  return (i === -1 ? stripPartialMarker(raw) : raw.slice(0, i)).trim();
}

/** Hide a trailing "#" or "##" that may be the start of ### mid-stream. */
function stripPartialMarker(s: string): string {
  return s.replace(/#{1,2}\s*$/, '');
}

function arr<T>(v: unknown, ok: (x: any) => boolean): T[] {
  return Array.isArray(v) ? (v.filter(ok) as T[]) : [];
}

const isFix = (x: any) => x && typeof x.wrong === 'string' && typeof x.right === 'string';

/** Split the final reply into the spoken text and the JSON meta. Never throws. */
export function splitReply(raw: string): { reply: string; meta: Meta; jsonOk: boolean } {
  const i = raw.indexOf('###');
  if (i === -1) return { reply: raw.trim(), meta: EMPTY_META, jsonOk: false };
  const reply = raw.slice(0, i).trim();
  let tail = raw.slice(i + 3).trim();
  tail = tail.replace(/^```(?:json)?/i, '').replace(/```\s*$/, '').trim();
  const start = tail.indexOf('{');
  const end = tail.lastIndexOf('}');
  if (start === -1 || end === -1) return { reply, meta: EMPTY_META, jsonOk: false };
  try {
    const j = JSON.parse(tail.slice(start, end + 1));
    const meta: Meta = {
      corrections: arr(j.corrections, isFix),
      minor: arr(j.minor, isFix),
      newWords: arr(j.newWords, (x: any) => x && typeof x.en === 'string' && typeof x.he === 'string'),
      memory: arr(j.memory, (x: any) => typeof x === 'string' && x.trim().length > 0),
      helpHe: typeof j.helpHe === 'string' ? j.helpHe : '',
    };
    return { reply, meta, jsonOk: true };
  } catch {
    return { reply, meta: EMPTY_META, jsonOk: false };
  }
}

/** Sentences that are complete so far (for speaking while text still streams). */
export function completeSentences(text: string): { done: string[]; rest: string } {
  const done: string[] = [];
  const re = /[^.!?…]+[.!?…]+["')\]]*\s+/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    done.push(m[0].trim());
    last = re.lastIndex;
  }
  return { done, rest: text.slice(last) };
}
