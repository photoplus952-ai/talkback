import { dayNumber } from '../data/progress';

const SKILLS = ['שטף', 'אוצר מילים', 'זמנים', 'הגייה'];

export function Progress() {
  const day = Math.min(dayNumber(), 30);
  return (
    <main class="screen enter">
      <span class="title-en">PROGRESS</span>
      <section class="card col g12">
        <h2 class="t-section">המיומנויות שלך</h2>
        <p class="t-sm muted" style={{ margin: 0 }}>
          אחרי השיחה הראשונה נדע מאיפה מתחילות.
        </p>
        {SKILLS.map((s) => (
          <div class="col g4">
            <div class="row between t-sm">
              <span>{s}</span>
              <span class="muted">—</span>
            </div>
            <div class="bar">
              <i style={{ width: '0%' }} />
            </div>
          </div>
        ))}
      </section>
      <section class="card col g12">
        <h2 class="t-section">30 הימים שלך</h2>
        <div class="days30">
          {Array.from({ length: 30 }, (_, i) => (
            <span class={i + 1 === day ? 'today' : ''} aria-current={i + 1 === day ? 'date' : undefined}>
              {i + 1}
            </span>
          ))}
        </div>
        <div class="row g12 t-label muted">
          <span class="row g4">
            <i style={{ width: 10, height: 10, borderRadius: 3, boxShadow: '0 0 0 2px var(--violet)', display: 'inline-block' }} />
            היום
          </span>
        </div>
      </section>
    </main>
  );
}
