import { useEffect, useRef, useState } from 'preact/hooks';
import { Icon } from '../components/Icon';
import { toast } from '../components/toast';
import { href } from '../router';
import { dataUrl, generateOne, ImageError, readPhoto, saveYou } from '../data/you';

type Img = { mimeType: string; data: string };
type Slot = { state: 'wait' } | { state: 'ok'; img: Img } | { state: 'bad' };

const ERR: Record<ImageError['code'], string> = {
  quota: 'נגמרה המכסה החינמית של יצירת תמונות להיום. אפשר לנסות שוב מחר.',
  no_key: 'השרת עוד בלי מפתח. בדיקה שהכול עובד תראה מה חסר.',
  offline: 'אין חיבור לאינטרנט. בדקי את הרשת ונסי שוב.',
  server: 'חלק מהגרסאות לא יצאו. אפשר לבקש עוד.',
};

export function You() {
  const [step, setStep] = useState<'photo' | 'choose'>('photo');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const photo = useRef<Img | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  // privacy: drop the photo from memory when leaving this screen
  useEffect(() => () => void (photo.current = null), []);

  function run(n: number) {
    const p = photo.current;
    if (!p) return setStep('photo');
    const start = slots.length;
    setSlots((s) => [...s, ...Array.from({ length: n }, () => ({ state: 'wait' }) as Slot)]);
    let shown = false;
    for (let i = 0; i < n; i++) {
      generateOne(p)
        .then((img) => setSlots((s) => s.map((x, j) => (j === start + i ? { state: 'ok', img } : x))))
        .catch((e) => {
          setSlots((s) => s.map((x, j) => (j === start + i ? { state: 'bad' } : x)));
          if (!shown) {
            shown = true;
            toast(ERR[e instanceof ImageError ? e.code : 'server']);
          }
        });
    }
  }

  async function onFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0];
    input.value = '';
    if (!f) return;
    try {
      photo.current = await readPhoto(f);
    } catch {
      return toast('לא הצלחתי לפתוח את התמונה. נסי תמונה אחרת.');
    }
    setStep('choose');
    setSlots([]);
    setPicked(null);
    setTimeout(() => run(4), 0);
  }

  async function choose() {
    const s = picked !== null ? slots[picked] : null;
    if (!s || s.state !== 'ok') return;
    await saveYou({ ...s.img, createdAt: Date.now() });
    photo.current = null;
    toast('הנה את. שמרתי את הדמות רק בטלפון שלך.');
    location.hash = href('profile');
  }

  const pending = slots.some((s) => s.state === 'wait');

  return (
    <main class="screen enter" style={{ paddingBottom: 40 }}>
      <div class="top-bar">
        <a class="ib" href={href('profile')} aria-label="חזרה">
          <Icon name="back" />
        </a>
        <span class="display" style={{ fontSize: 22 }}>YOU 2.0</span>
        <span style={{ width: 44 }} />
      </div>

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
      <input ref={camRef} type="file" accept="image/*" capture="user" hidden onChange={onFile} />

      {step === 'photo' && (
        <>
          <h1 class="t-screen">תמונה אחת, ואת בצוות</h1>
          <p class="t-body muted" style={{ margin: 0 }}>
            תמונה ברורה של הפנים, באור טוב, בלי משקפי שמש. נהפוך אותה לדמות בדיוק בסגנון של Max ו-Zoe.
          </p>
          <section class="card row g12" style={{ alignItems: 'flex-start' }}>
            <span class="ic" style={{ color: 'var(--pink-tint)' }}>
              <Icon name="shield" />
            </span>
            <div class="col g4">
              <b>התמונה שלך לא נשמרת</b>
              <span class="t-sm muted">
                היא נשלחת פעם אחת ליצירת הדמות ונמחקת מיד. לא אצלנו ולא בשום מקום אחר. רק הדמות שתבחרי נשמרת, ורק בטלפון שלך.
              </span>
            </div>
          </section>
          <button class="btn btn-primary btn-block" onClick={() => camRef.current?.click()}>
            <Icon name="camera" />
            לצלם עכשיו
          </button>
          <button class="btn btn-secondary btn-block" onClick={() => fileRef.current?.click()}>
            <Icon name="image" />
            לבחור מהגלריה
          </button>
        </>
      )}

      {step === 'choose' && (
        <>
          <h1 class="t-screen">בחרי אחת</h1>
          <p class="t-sm muted" style={{ margin: 0 }} aria-live="polite">
            {pending ? 'מציירים אותך... זה לוקח בערך חצי דקה.' : 'לחצי על הגרסה שהכי את.'}
          </p>
          <div class="you-grid">
            {slots.map((s, i) => (
              <button
                key={i}
                class={`you-opt${picked === i ? ' on' : ''}`}
                disabled={s.state !== 'ok'}
                onClick={() => setPicked(i)}
                aria-pressed={picked === i}
                aria-label={`גרסה ${i + 1}`}
              >
                {s.state === 'ok' && <img src={dataUrl(s.img)} alt="" />}
                {s.state === 'wait' && <span class="shimmer" />}
                {s.state === 'bad' && (
                  <span class="col g4" style={{ alignItems: 'center' }}>
                    <Icon name="x" class="muted" />
                    <span class="t-sm muted">לא יצא</span>
                  </span>
                )}
                {picked === i && (
                  <span class="you-check">
                    <Icon name="check" size={16} style={{ strokeWidth: 3 }} />
                  </span>
                )}
              </button>
            ))}
          </div>
          <button class="btn btn-primary btn-block" disabled={picked === null} onClick={choose}>
            זו אני
          </button>
          <div class="row g8">
            <button class="btn btn-secondary grow" disabled={pending || slots.length >= 12} onClick={() => run(2)}>
              <Icon name="refresh" />
              עוד גרסאות
            </button>
            <button
              class="btn btn-secondary grow"
              onClick={() => {
                photo.current = null;
                setSlots([]);
                setStep('photo');
              }}
            >
              תמונה אחרת
            </button>
          </div>
        </>
      )}
    </main>
  );
}
