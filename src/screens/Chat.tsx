import { useEffect, useRef, useState } from 'preact/hooks';
import { Icon } from '../components/Icon';
import { Face } from '../components/Face';
import { toast } from '../components/toast';
import { CHARS, type Character } from '../data/characters';
import { characterTurn, ChatError } from '../brain/chat';
import { completeSentences } from '../brain/parse';
import { opener } from '../brain/prompt';
import type { Msg } from '../brain/types';
import { loadMemory, pickMemory, remember } from '../data/memory';
import { addWords } from '../data/words';
import { load, save } from '../lib/store';
import { Speaker, speakAll } from '../voice/tts';
import { MicError, recordUtterance, transcribe } from '../voice/recorder';
import { autoRead } from '../data/settings';
import { href } from '../router';

const uid = () => Math.random().toString(36).slice(2, 10);

const ERR_TEXT: Record<ChatError['code'], string> = {
  offline: 'אין חיבור לאינטרנט. בדקי את הרשת ונסי שוב.',
  quota: 'נגמרה המכסה החינמית להיום. מחר היא מתחדשת, ובינתיים אפשר לחזור על מילים.',
  no_key: 'השרת עוד בלי מפתח של Gemini. בדיקה שהכול עובד תראה מה חסר.',
  server: 'משהו השתבש בדרך. נסי לשלוח שוב.',
};

type Status = 'idle' | 'thinking' | 'typing' | 'listening' | 'transcribing';

export function Chat({ id }: { id: string }) {
  const c: Character = CHARS.find((x) => x.id === id) || CHARS[0];
  const key = `chat:${c.id}`;
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [ready, setReady] = useState(false);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<{ code: ChatError['code']; retry: string } | null>(null);
  const [level, setLevel] = useState(0);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const memRef = useRef<string[]>([]);
  const speaker = useRef<Speaker | null>(null);
  const recAbort = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const msgsRef = useRef<Msg[]>([]);
  msgsRef.current = msgs;

  // load history + memory; open with a line from the character
  useEffect(() => {
    let alive = true;
    (async () => {
      const [hist, mem] = await Promise.all([load<Msg[]>(key, []), loadMemory()]);
      if (!alive) return;
      memRef.current = pickMemory(mem);
      const start = hist.length ? hist : [{ id: uid(), role: 'model' as const, text: opener(c, memRef.current), at: Date.now() }];
      setMsgs(start);
      setReady(true);
    })();
    return () => {
      alive = false;
      speaker.current?.stop();
      recAbort.current?.abort('cancel');
    };
  }, [c.id]);

  useEffect(() => {
    if (ready) void save(key, msgs.slice(-200));
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, ready]);

  async function send(text: string, endedAt?: number) {
    const t = text.trim();
    if (!t || status === 'thinking' || status === 'typing') return;
    setError(null);
    speaker.current?.stop();
    const user: Msg = { id: uid(), role: 'user', text: t, at: Date.now() };
    const reply: Msg = { id: uid(), role: 'model', text: '', at: Date.now() };
    const history = [...msgsRef.current, user];
    setMsgs([...history, reply]);
    setDraft('');
    setStatus('thinking');

    const sp = autoRead() ? new Speaker(c, endedAt ?? performance.now()) : null;
    speaker.current = sp;
    if (sp) {
      sp.onState = (on) => setSpeakingId(on ? reply.id : null);
      sp.onError = () => toast('הקול לא נטען הפעם. הטקסט כאן, ואפשר ללחוץ על הרמקול לנסות שוב.');
    }
    let spoken = 0;
    try {
      const out = await characterTurn({
        char: c,
        history,
        memory: memRef.current,
        onText: (v) => {
          setStatus('typing');
          setMsgs((xs) => xs.map((m) => (m.id === reply.id ? { ...m, text: v } : m)));
          if (sp) {
            const { done } = completeSentences(v + ' ');
            // speak only sentences that are surely complete (not the last, which may still grow)
            const safe = done.slice(0, Math.max(0, done.length - 1));
            while (spoken < safe.length) sp.enqueue(safe[spoken++]);
          }
        },
      });
      if (sp) {
        const { done, rest } = completeSentences(out.reply + ' ');
        while (spoken < done.length) sp.enqueue(done[spoken++]);
        if (rest.trim()) sp.enqueue(rest);
      }
      setMsgs((xs) =>
        xs.map((m) =>
          m.id === user.id
            ? { ...m, meta: { ...out.meta, newWords: [], memory: [], helpHe: '' } }
            : m.id === reply.id
              ? { ...m, text: out.reply || '…', meta: { ...out.meta, corrections: [], minor: [] } }
              : m,
        ),
      );
      void remember(out.meta.memory, c.id);
      if (out.meta.newWords.length) void addWords(out.meta.newWords, c.id, out.reply);
    } catch (e) {
      sp?.stop();
      setMsgs((xs) => xs.filter((m) => m.id !== reply.id));
      if ((e as Error).name !== 'AbortError') setError({ code: e instanceof ChatError ? e.code : 'server', retry: t });
      setMsgs((xs) => xs.filter((m) => m.id !== user.id));
      setDraft(t);
    } finally {
      setStatus('idle');
    }
  }

  async function mic() {
    if (status === 'listening') {
      recAbort.current?.abort('stop');
      return;
    }
    speaker.current?.stop();
    const ctl = new AbortController();
    recAbort.current = ctl;
    setStatus('listening');
    try {
      const r = await recordUtterance({ onLevel: (s) => setLevel(s.level), signal: ctl.signal });
      setLevel(0);
      if (!r) {
        setStatus('idle');
        if (!ctl.signal.aborted) toast('לא נשמע כלום. לחצי על המיקרופון ודברי באנגלית.');
        return;
      }
      setStatus('transcribing');
      const text = await transcribe(r.blob);
      setStatus('idle');
      if (!text) return toast('לא הצלחתי להבין. נסי שוב, קצת יותר קרוב לטלפון.');
      await send(text, r.endedAt);
    } catch (e) {
      setStatus('idle');
      setLevel(0);
      if (e instanceof MicError)
        toast(e.code === 'denied' ? 'צריך לאשר מיקרופון: לחצי על המנעול ליד הכתובת ← מיקרופון ← לאפשר.' : 'לא מצאתי מיקרופון. אפשר לכתוב בינתיים.');
      else toast('ההקלטה לא נשלחה. נסי שוב, או כתבי.');
    }
  }

  function playMsg(m: Msg) {
    speaker.current?.stop();
    if (speakingId === m.id) return setSpeakingId(null);
    const { done, rest } = completeSentences(m.text + ' ');
    const sp = speakAll(m.text, c, rest.trim() ? [...done, rest] : done);
    sp.onState = (on) => setSpeakingId(on ? m.id : null);
    sp.onError = () => toast('הקול לא נטען. נסי שוב עוד רגע.');
    speaker.current = sp;
  }

  const f = c.g === 'f';
  const statusText =
    status === 'thinking' || status === 'typing'
      ? f ? 'מקלידה...' : 'מקליד...'
      : status === 'listening'
        ? f ? 'מקשיבה לך...' : 'מקשיב לך...'
        : status === 'transcribing'
          ? f ? 'רגע, מבינה...' : 'רגע, מבין...'
          : speakingId
            ? f ? 'מדברת...' : 'מדבר...'
            : c.he;
  const busy = status !== 'idle';

  return (
    <div class="chat">
      <header class="chat-top">
        <a class="ib" href={href('home')} aria-label="חזרה">
          <Icon name="back" />
        </a>
        <Face c={c} size={40} />
        <div class="col grow">
          <b>{c.name}</b>
          <span class="t-sm muted" aria-live="polite">
            {statusText}
          </span>
        </div>
        <a class="chip plain" href={href('home')}>
          סיום
        </a>
      </header>

      <div class="chat-list" ref={listRef}>
        {msgs.map((m) =>
          m.role === 'model' ? (
            <div class="col g8" key={m.id} style={{ alignItems: 'flex-end' }}>
              <div class="row g8" style={{ alignItems: 'flex-end', flexDirection: 'row-reverse' }}>
                <div class="bub bub-ai" dir="auto">
                  {m.text || <span class="dots" aria-label="מקליד"><i /><i /><i /></span>}
                </div>
                {m.text && (
                  <button class={`ib speak${speakingId === m.id ? ' on' : ''}`} onClick={() => playMsg(m)} aria-label={speakingId === m.id ? 'עצירה' : 'השמעה'}>
                    <Icon name={speakingId === m.id ? 'stop' : 'speaker'} size={18} />
                  </button>
                )}
              </div>
              {m.meta?.newWords.map((w) => (
                <span class="chip violet" key={w.en}>
                  <span class="en">{w.en}</span> · {w.he}
                </span>
              ))}
              {m.meta?.helpHe && <span class="t-sm hint">{m.meta.helpHe}</span>}
            </div>
          ) : (
            <div class="col g8" key={m.id} style={{ alignItems: 'flex-start' }}>
              <div class="bub bub-me" dir="auto">
                {m.text}
              </div>
              {m.meta?.corrections.map((f, i) => (
                <span class="fix pop" key={i}>
                  <span class="fix-ic">
                    <Icon name="check" size={16} style={{ strokeWidth: 3 }} />
                  </span>
                  <span class="col">
                    <span class="fix-en">
                      <s>{f.wrong}</s> → {f.right}
                    </span>
                    <span class="fix-why">{f.why}</span>
                  </span>
                </span>
              ))}
            </div>
          ),
        )}
        {error && (
          <div class="card col g8" role="alert">
            <span>{ERR_TEXT[error.code]}</span>
            {error.code === 'no_key' ? (
              <a class="btn btn-secondary plain" href={href('check')}>לבדיקה שהכול עובד</a>
            ) : (
              <button class="btn btn-secondary" onClick={() => send(error.retry)}>
                <Icon name="refresh" />
                לשלוח שוב
              </button>
            )}
          </div>
        )}
      </div>

      <form
        class="chat-input"
        onSubmit={(e) => {
          e.preventDefault();
          void send(draft);
        }}
      >
        {status === 'listening' ? (
          <div class="wave grow" aria-label="מקליטה">
            <b />
            {[0.5, 0.8, 1, 0.7, 0.9, 0.6, 1, 0.75, 0.55].map((k, i) => (
              <i key={i} style={{ height: `${8 + level * 44 * k}px` }} />
            ))}
            <b />
          </div>
        ) : (
          <input
            class="grow en"
            dir="auto"
            value={draft}
            onInput={(e) => setDraft((e.target as HTMLInputElement).value)}
            placeholder={`Message ${c.name}…`}
            aria-label={`הודעה ל-${c.name}`}
            disabled={status === 'transcribing'}
            enterKeyHint="send"
          />
        )}
        {draft.trim() && status !== 'listening' ? (
          <button class="round-btn send" type="submit" aria-label="שליחה" disabled={busy}>
            <Icon name="send" />
          </button>
        ) : (
          <button
            class={`round-btn mic${status === 'listening' ? ' rec' : ''}`}
            type="button"
            onClick={mic}
            aria-label={status === 'listening' ? 'סיום הקלטה' : 'הקלטה'}
            disabled={status === 'thinking' || status === 'typing' || status === 'transcribing'}
          >
            <Icon name={status === 'listening' ? 'stop' : 'mic'} />
          </button>
        )}
      </form>
    </div>
  );
}
