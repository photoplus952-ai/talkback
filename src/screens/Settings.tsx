import { Icon, type IconName } from '../components/Icon';
import { useState } from 'preact/hooks';
import { href } from '../router';
import { autoRead, setAutoRead } from '../data/settings';
import { deleteYou } from '../data/you';
import { toast } from '../components/toast';

function Row({ icon, title, value, to }: { icon: IconName; title: string; value?: string; to?: string }) {
  const inner = (
    <>
      <span class="ic">
        <Icon name={icon} />
      </span>
      <span class="grow">{title}</span>
      {value && <span class="t-sm muted">{value}</span>}
      {to && <Icon name="back" size={18} class="muted" style={{ transform: 'scaleX(-1)' }} />}
    </>
  );
  return to ? (
    <a class="li plain" href={to}>
      {inner}
    </a>
  ) : (
    <div class="li">{inner}</div>
  );
}

export function Settings() {
  const [auto, setAuto] = useState(autoRead());
  return (
    <main class="screen enter" style={{ paddingBottom: 40 }}>
      <div class="top-bar">
        <a class="ib" href={href('profile')} aria-label="חזרה">
          <Icon name="back" />
        </a>
        <h1 class="t-section">פרופיל והגדרות</h1>
        <span style={{ width: 44 }} />
      </div>

      <h2 class="t-label muted" style={{ margin: '8px 0 0' }}>שיחה וקול</h2>
      <section class="card" style={{ paddingBlock: 4 }}>
        <label class="li">
          <span class="ic">
            <Icon name="speaker" />
          </span>
          <span class="grow">הקראה אוטומטית של התשובות</span>
          <input
            type="checkbox"
            class="switch"
            checked={auto}
            onChange={(e) => {
              const on = (e.target as HTMLInputElement).checked;
              setAuto(on);
              setAutoRead(on);
            }}
          />
        </label>
      </section>

      <h2 class="t-label muted" style={{ margin: '8px 0 0' }}>פרטיות</h2>
      <section class="card" style={{ paddingBlock: 4 }}>
        <Row icon="lock" title="שיחות וזיכרון נשמרים רק במכשיר" />
        <Row icon="shield" title="המפתח של Gemini שמור בשרת, לא בטלפון" />
        <button
          class="li"
          style={{ width: '100%', color: 'var(--red)', textAlign: 'start' }}
          onClick={async () => {
            if (!confirm('למחוק את הדמות שלך מהטלפון?')) return;
            await deleteYou();
            toast('הדמות נמחקה. אפשר ליצור חדשה מהפרופיל.');
          }}
        >
          <span class="ic" style={{ color: 'var(--red)' }}>
            <Icon name="trash" />
          </span>
          <span class="grow">מחיקת הדמות שלי</span>
        </button>
      </section>

      <h2 class="t-label muted" style={{ margin: '8px 0 0' }}>מערכת</h2>
      <section class="card" style={{ paddingBlock: 4 }}>
        <Row icon="refresh" title="בדיקה שהכול עובד" to={href('check')} />
        <Row icon="star" title="גרסה" value={__APP_VERSION__} />
      </section>
    </main>
  );
}
