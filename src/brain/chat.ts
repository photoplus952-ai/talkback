import { API_URL } from '../config';
import type { Character } from '../data/characters';
import { sseText } from './stream';
import { splitReply, visible } from './parse';
import type { Meta, Msg } from './types';
import { systemPrompt, needsGentle, type PromptOpts } from './prompt';
import { logMetric } from '../lib/metrics';
import { change, load } from '../lib/store';

export class ChatError extends Error {
  constructor(public code: 'offline' | 'quota' | 'no_key' | 'server', msg?: string) {
    super(msg || code);
  }
}

const HISTORY = 16;

export type TurnResult = { reply: string; meta: Meta; jsonOk: boolean; model: string };

/** One character turn: streams the visible reply through onText, resolves with reply + meta. */
export async function characterTurn(opts: {
  char: Character;
  history: Msg[];
  memory: string[];
  prompt?: Partial<PromptOpts>;
  onText: (visibleSoFar: string) => void;
  signal?: AbortSignal;
}): Promise<TurnResult> {
  const { char, history, memory } = opts;
  const userTexts = history.filter((m) => m.role === 'user').map((m) => m.text);
  const openers = await load<string[]>('openers', []);
  const system = systemPrompt(char, {
    mode: 'text chat',
    memory,
    gentle: needsGentle(userTexts),
    avoidOpeners: openers,
    ...opts.prompt,
  });
  // Gemini wants the conversation to start with the user.
  let msgs = history.slice(-HISTORY);
  while (msgs.length && msgs[0].role === 'model') msgs = msgs.slice(1);
  const messages = msgs.map((m) => ({ role: m.role, text: m.text }));
  if (!messages.length) messages.push({ role: 'user', text: '(she opened the chat)' });

  const t0 = performance.now();
  let res: Response;
  try {
    res = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system, messages }),
      signal: opts.signal,
    });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new ChatError('offline');
  }
  if (!res.ok || !res.body) {
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    throw new ChatError(j.error === 'quota' ? 'quota' : j.error === 'no_key' ? 'no_key' : 'server');
  }
  const model = res.headers.get('X-Model') || '';
  let raw = '';
  let first = true;
  for await (const delta of sseText(res.body)) {
    if (first) {
      first = false;
      logMetric({ kind: 'first_token', ms: performance.now() - t0, model });
    }
    raw += delta;
    opts.onText(visible(raw));
  }
  const out = splitReply(raw);
  const opener = out.reply.split(/\s+/).slice(0, 4).join(' ');
  if (opener) void change<string[]>('openers', [], (xs) => [...xs, opener].slice(-10));
  return { ...out, model };
}
