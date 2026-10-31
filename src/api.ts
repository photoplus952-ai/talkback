import { API_URL } from './config';

export type Health = { ok: boolean; hasKey: boolean; keyWorks?: boolean; version?: string };

/** GET /health. deep=true also asks Gemini once to confirm the key works (costs nothing). */
export async function health(deep = false, timeoutMs = 8000): Promise<Health> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const r = await fetch(`${API_URL}/health${deep ? '?deep=1' : ''}`, { signal: ctl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return (await r.json()) as Health;
  } finally {
    clearTimeout(t);
  }
}
