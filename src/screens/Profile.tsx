import { Icon } from '../components/Icon';
import { toast } from '../components/toast';
import { CHARS, type Character } from '../data/characters';
import { href } from '../router';

/** Cast thumbnail: waist-up crop around the face (same placement rule as the big card). */
function castImg(c: Character) {
  const W = 132;
  const h = 300;
  const w = h / c.a;
  return { height: h, left: W * 0.5 - c.mx * w, top: 38 - c.my * h };
}

export function Profile() {
  return (
    <main class="screen enter">
      <div class="top-bar">
        <h1 class="t-screen">הפרופיל שלי</h1>
        <a class="ib" href={href('settings')} aria-label="הגדרות">
          <Icon name="gear" />
        </a>
      </div>

      <section class="you-card" aria-label="You 2.0">
        <span class="bgword display">YOU</span>
        <div class="col g4">
          <span class="display" style={{ fontSize: 34, color: 'var(--pink-tint)' }}>YOU 2.0</span>
          <span class="t-body">את, רק שוטפת</span>
          <span class="t-sm muted">הדמות שלך, בקול שלך, עם מבטא אמריקאי. נבנית בשלב 4.</span>
        </div>
        <div class="row g8">
          <span class="chip"><Icon name="flame" filled size={16} class="tint" />0 ימים</span>
          <span class="chip"><Icon name="zap" size={16} class="tint" />0 XP</span>
          <span class="chip"><Icon name="mic" size={16} class="tint" />הקול שלי</span>
        </div>
      </section>

      <button class="btn btn-primary btn-block" onClick={() => toast('עוד קצת. קודם נבנה את הדמות שלך, ואז תדברי עם עצמך.')}>
        <Icon name="sparkle" />
        לדבר עם עצמי
      </button>

      <div class="row between" style={{ marginTop: 8 }}>
        <span class="display" style={{ fontSize: 26 }}>THE CAST</span>
        <span class="t-sm muted">{CHARS.length} דמויות</span>
      </div>
      <div class="hscroll" role="list">
        {CHARS.map((c) => {
          const p = castImg(c);
          return (
            <div class="cast-card" role="listitem" key={c.id}>
              <img src={c.img} alt="" loading="lazy" style={{ height: p.height, left: p.left, top: p.top }} />
              <span class="cc">
                <span class="display" style={{ fontSize: 22 }}>{c.name.toUpperCase()}</span>
                <span class="t-sm">{c.he}</span>
              </span>
            </div>
          );
        })}
      </div>
    </main>
  );
}
