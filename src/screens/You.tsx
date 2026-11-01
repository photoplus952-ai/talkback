import { useEffect, useRef, useState } from 'preact/hooks';
import { Icon } from '../components/Icon';
import { toast } from '../components/toast';
import { href } from '../router';
import {
  CHAT_APP_PROMPT,
  castSheet,
  dataUrl,
  fromUpload,
  generateOne,
  ImageError,
  readPhoto,
  saveYou,
  type YouImage,
} from '../data/you';

type Img = { mimeType: string; data: string };
type Slot = { state: 'wait' } | { state: 'ok'; img: YouImage } | { state: 'bad' };
type Step = 'start' | 'chatapp' | 'review' | 'photo' | 'choose';

const ERR: Record<ImageError['code'], string> = {
  quota: 'נגמרה המכסה החינמית של יצירת תמונות להיום. אפשר ליצור ב-ChatGPT או ב-Gemini ולהעלות.',
  no_key: 'השרת עוד בלי מפתח. בדיקה שהכול עובד תראה מה חסר.',
  offline: 'אין חיבור לאינטרנט. בדקי את הרשת ונסי שוב.',
  server: 'חלק מהגרסאות לא יצאו. אפשר לבקש עוד.',
};

export function You() {
  const [step, setStep] = useState<Step>('start');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [review, setReview] = useState<YouImage | null>(null);
  const [busy, setBusy] = useState(false);
  const photo = useRef<Img | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLInputElement>(null);

  // privacy: drop the photo from memory when leaving this screen
  useEffect(() => () => void (photo.current = null), []);

  // ---------- path 1: ChatGPT / Gemini ----------
  async function shareSheet() {
    try {
      const blob = await castSheet();
      const file = new File([blob], 'talkback-cast.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'talkback-cast.png';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
        toast('התמונה נשמרה בהורדות.');
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') toast('לא הצלחתי לשמור. נסי שוב.');
    }
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(CHAT_APP_PROMPT);
      toast('ההוראה הועתקה. עכשיו מדביקים אותה בשיחה.');
    } catch {
      toast('לא הצלחתי להעתיק. לחצי לחיצה ארוכה על הטקסט והעתיקי.');
    }
  }

  async function onResult(e: Event) {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0];
    input.value = '';
    if (!f) return;
    setBusy(true);
    try {
      const img = await fromUpload(f);
      if (!img) {
        toast('לא הצלחתי להפריד מהרקע. בקשי שם: "make the background flat pure green", והעלי שוב.');
        return;
      }
      setReview(img);
      setStep('review');
    } catch {
      toast('לא הצלחתי לפתוח את התמונה. נסי שוב.');
    } finally {
      setBusy(false);
    }
  }

  // ---------- path 2: in the app ----------
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

  async function onPhoto(e: Event) {
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

  // ---------- save ----------
  async function keep(img: YouImage) {
    await saveYou({ ...img, createdAt: Date.now(), cutout: true, waist: true });
    photo.current = null;
    toast('הנה את. שמרתי את הדמות רק בטלפון שלך.');
    location.hash = href('profile');
  }

  const pending = slots.some((s) => s.state === 'wait');
  const back = step === 'start' ? href('profile') : undefined;

  return (
    <main class="screen enter" style={{ paddingBottom: 40 }}>
      <div class="top-bar">
        {back ? (
          <a class="ib" href={back} aria-label="חזרה">
            <Icon name="back" />
          </a>
        ) : (
          <button class="ib" onClick={() => setStep(step === 'review' ? 'chatapp' : step === 'choose' ? 'photo' : 'start')} aria-label="חזרה">
            <Icon name="back" />
          </button>
        )}
        <span class="display" style={{ fontSize: 22 }}>YOU 2.0</span>
        <span style={{ width: 44 }} />
      </div>

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPhoto} />
      <input ref={camRef} type="file" accept="image/*" capture="user" hidden onChange={onPhoto} />
      <input ref={resultRef} type="file" accept="image/*" hidden onChange={onResult} />

      {step === 'start' && (
        <>
          <h1 class="t-screen">איך ליצור אותך?</h1>
          <button class="card col g8 choice" onClick={() => setStep('chatapp')}>
            <span class="row g8">
              <span class="soon">מומלץ</span>
              <b>ב-ChatGPT או ב-Gemini</b>
            </span>
            <span class="t-sm muted">הכי דומה לך. יוצרים שם בעזרת הוראה מוכנה, ומעלים לכאן את מה שיצא.</span>
          </button>
          <button class="card col g8 choice" onClick={() => setStep('photo')}>
            <b>כאן באפליקציה</b>
            <span class="t-sm muted">מהיר, אבל הדמיון פחות מדויק.</span>
          </button>
        </>
      )}

      {step === 'chatapp' && (
        <>
          <h1 class="t-screen">ארבעה צעדים קצרים</h1>
          <ol class="steps">
            <li>
              <b>לשמור את תמונת הצוות</b>
              <span class="t-sm muted">שלוש דמויות לדוגמה, כדי שידעו באיזה סגנון לצייר אותך.</span>
              <button class="btn btn-secondary" onClick={shareSheet}>
                <Icon name="upload" />
                לשמור או לשתף
              </button>
            </li>
            <li>
              <b>להעתיק את ההוראה</b>
              <span class="t-sm muted">באנגלית, כי ככה הם מבינים הכי טוב.</span>
              <button class="btn btn-secondary" onClick={copyPrompt}>
                <Icon name="edit" />
                להעתיק
              </button>
            </li>
            <li>
              <b>לפתוח שיחה חדשה ולשלוח</b>
              <span class="t-sm muted">מצרפים תמונה ברורה שלך ואת תמונת הצוות, מדביקים את ההוראה ושולחים. אם לא דומה, כותבים שם <span class="en" dir="ltr">more like my photo</span>.</span>
              <div class="row g8">
                <a class="btn btn-secondary grow plain" href="https://chatgpt.com/" target="_blank" rel="noopener">ChatGPT</a>
                <a class="btn btn-secondary grow plain" href="https://gemini.google.com/app" target="_blank" rel="noopener">Gemini</a>
              </div>
            </li>
            <li>
              <b>לשמור את התמונה שיצאה ולהעלות לכאן</b>
              <span class="t-sm muted">את הרקע נוריד כאן.</span>
            </li>
          </ol>
          <button class="btn btn-primary btn-block" onClick={() => resultRef.current?.click()} disabled={busy}>
            <Icon name="image" />
            {busy ? 'מכינה...' : 'להעלות את הדמות שלי'}
          </button>
          <section class="card row g12" style={{ alignItems: 'flex-start' }}>
            <span class="ic" style={{ color: 'var(--pink-tint)' }}>
              <Icon name="shield" />
            </span>
            <span class="t-sm muted">
              התמונה שלך נשלחת מהחשבון שלך ב-ChatGPT או ב-Gemini, לא דרכנו. בסוף אפשר למחוק שם את השיחה. כאן נשמרת רק הדמות, ורק בטלפון שלך.
            </span>
          </section>
        </>
      )}

      {step === 'review' && review && (
        <>
          <h1 class="t-screen">זו את?</h1>
          <div class="you-opt on" style={{ aspectRatio: '3 / 4' }}>
            <img src={dataUrl(review)} alt="הדמות שלי" />
          </div>
          <button class="btn btn-primary btn-block" onClick={() => keep(review)}>
            זו אני
          </button>
          <button class="btn btn-secondary btn-block" onClick={() => resultRef.current?.click()}>
            <Icon name="refresh" />
            להעלות תמונה אחרת
          </button>
        </>
      )}

      {step === 'photo' && (
        <>
          <h1 class="t-screen">תמונה אחת, ואת בצוות</h1>
          <p class="t-body muted" style={{ margin: 0 }}>
            תמונה ברורה של הפנים, באור טוב, בלי משקפי שמש.
          </p>
          <section class="card row g12" style={{ alignItems: 'flex-start' }}>
            <span class="ic" style={{ color: 'var(--pink-tint)' }}>
              <Icon name="shield" />
            </span>
            <div class="col g4">
              <b>התמונה שלך לא נשמרת</b>
              <span class="t-sm muted">
                היא נשלחת פעם אחת ליצירת הדמות ונמחקת מיד. רק הדמות שתבחרי נשמרת, ורק בטלפון שלך.
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
          <button
            class="btn btn-primary btn-block"
            disabled={picked === null}
            onClick={() => {
              const s = picked !== null ? slots[picked] : null;
              if (s?.state === 'ok') void keep(s.img);
            }}
          >
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
              <Icon name="camera" />
              להחליף תמונה
            </button>
          </div>
          <button class="btn btn-ghost btn-block" onClick={() => setStep('chatapp')}>
            לא דומה לי? ליצור ב-ChatGPT או ב-Gemini
          </button>
        </>
      )}
    </main>
  );
}
