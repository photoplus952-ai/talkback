import { Icon, type IconName } from '../components/Icon';
import { href } from '../router';

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
  return (
    <main class="screen enter" style={{ paddingBottom: 40 }}>
      <div class="top-bar">
        <a class="ib" href={href('profile')} aria-label="חזרה">
          <Icon name="back" />
        </a>
        <h1 class="t-section">פרופיל והגדרות</h1>
        <span style={{ width: 44 }} />
      </div>

      <h2 class="t-label muted" style={{ margin: '8px 0 0' }}>פרטיות</h2>
      <section class="card" style={{ paddingBlock: 4 }}>
        <Row icon="lock" title="שיחות וזיכרון נשמרים רק במכשיר" />
        <Row icon="shield" title="המפתח של Gemini שמור בשרת, לא בטלפון" />
      </section>

      <h2 class="t-label muted" style={{ margin: '8px 0 0' }}>מערכת</h2>
      <section class="card" style={{ paddingBlock: 4 }}>
        <Row icon="refresh" title="בדיקה שהכול עובד" to={href('check')} />
        <Row icon="star" title="גרסה" value={__APP_VERSION__} />
      </section>
    </main>
  );
}
