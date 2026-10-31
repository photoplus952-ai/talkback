import { useEffect, useState } from 'preact/hooks';

type Listener = (msg: string) => void;
const listeners = new Set<Listener>();

/** Short message at the bottom of the screen. Always says what to do next. */
export function toast(msg: string) {
  listeners.forEach((l) => l(msg));
}

export function ToastHost() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    let t: number | undefined;
    const l: Listener = (m) => {
      setMsg(m);
      clearTimeout(t);
      t = window.setTimeout(() => setMsg(null), 3200);
    };
    listeners.add(l);
    return () => {
      listeners.delete(l);
      clearTimeout(t);
    };
  }, []);
  return (
    <div class="toast" role="status" aria-live="polite" data-show={msg ? '' : undefined}>
      {msg}
    </div>
  );
}
