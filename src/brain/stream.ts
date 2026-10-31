/** Read Gemini's SSE stream (via the Worker) and yield text deltas. */
export async function* sseText(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf('\n')) !== -1) {
      const line = buf.slice(0, nl).replace(/\r$/, '');
      buf = buf.slice(nl + 1);
      const t = parseLine(line);
      if (t) yield t;
    }
  }
  const t = parseLine(buf.trim());
  if (t) yield t;
}

function parseLine(line: string): string {
  if (!line.startsWith('data:')) return '';
  const data = line.slice(5).trim();
  if (!data || data === '[DONE]') return '';
  try {
    const j = JSON.parse(data);
    const parts = j?.candidates?.[0]?.content?.parts || [];
    return parts.map((p: { text?: string; thought?: boolean }) => (p.thought ? '' : p.text || '')).join('');
  } catch {
    return '';
  }
}
