import { useEffect, useState } from 'preact/hooks';
import { Icon } from '../components/Icon';
import { health } from '../api';
import { href } from '../router';

type State = 'wait' | 'ok' | 'bad';
type Item = { id: string; title: string; state: State; note: string };

function installed(): boolean {
  return matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
}

async function micState(): Promise<State> {
  try {
    const p = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    return p.state === 'denied' ? 'bad' : 'ok';
  } catch {
    return 'ok';
  }
}

export function Check() {
  const [items, setItems] = useState<Item[]>([
    { id: 'server', title: 'החיבור לשרת', state: 'wait', note: 'בודקת...' },
    { id: 'key', title: 'המפתח של Gemini', state: 'wait', note: 'בודקת...' },
    { id: 'install', title: 'מותקנת כאפליקציה', state: 'wait', note: '' },
    { id: 'mic', title: 'גישה למיקרופון', state: 'wait', note: '' },
  ]);
  const set = (id: string, state: State, note: string) =>
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, state, note } : x)));

  async function run() {
    setItems((xs) => xs.map((x) => ({ ...x, state: 'wait', note: 'בודקת...' })));
    set('install', installed() ? 'ok' : 'bad', installed() ? 'מעולה' : 'בכרום: תפריט ⋮ ← "התקנת אפליקציה"');
    const m = await micState();
    set('mic', m, m === 'ok' ? 'אפשר לדבר' : 'צריך לאשר מיקרופון בהגדרות האתר');
    try {
      const h = await health(true);
      set('server', 'ok', 'השרת עונה');
      if (!h.hasKey) set('key', 'bad', 'עוד לא הודבק מפתח בשרת');
      else if (h.keyWorks === false) set('key', 'bad', 'המפתח לא עובד. כדאי להדביק אותו שוב');
      else set('key', 'ok', 'המפתח עובד');
    } catch {
      set('server', 'bad', 'אין תשובה. בדקי אינטרנט ונסי שוב');
      set('key', 'bad', 'אי אפשר לבדוק בלי שרת');
    }
  }

  useEffect(() => {
    run();
  }, []);

  return (
    <main class="screen enter" style={{ paddingBottom: 40 }}>
      <div class="top-bar">
        <a class="ib" href={href('settings')} aria-label="חזרה">
          <Icon name="back" />
        </a>
        <h1 class="t-section">בדיקה שהכול עובד</h1>
        <span style={{ width: 44 }} />
      </div>
      <section class="card" style={{ paddingBlock: 4 }} aria-live="polite">
        {items.map((it) => (
          <div class="li" key={it.id} data-check={it.id} data-state={it.state}>
            <span class={`status-dot ${it.state}`}>
              {it.state === 'ok' && <Icon name="check" size={16} style={{ strokeWidth: 3 }} label="תקין" />}
              {it.state === 'bad' && <Icon name="x" size={16} style={{ strokeWidth: 3 }} label="לא תקין" />}
              {it.state === 'wait' && <Icon name="refresh" size={16} class="spin" label="בודקת" />}
            </span>
            <span class="col grow">
              <b>{it.title}</b>
              <span class="t-sm muted">{it.note}</span>
            </span>
          </div>
        ))}
      </section>
      <button class="btn btn-secondary btn-block" onClick={run}>
        <Icon name="refresh" />
        לבדוק שוב
      </button>
    </main>
  );
}
