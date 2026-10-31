import { Icon } from '../components/Icon';
import { href } from '../router';

export function Words() {
  return (
    <main class="screen enter">
      <div class="col g4">
        <span class="title-en">WORDS</span>
        <span class="t-sm muted">0 מילים</span>
      </div>
      <div class="card empty">
        <span class="ic">
          <Icon name="book" size={28} />
        </span>
        <h2 class="t-section">עוד אין כאן מילים</h2>
        <p class="t-body muted" style={{ margin: 0 }}>
          כל מילה חדשה מהשיחות שלך תגיע לכאן, ותחזור בדיוק לפני שתשכחי אותה.
        </p>
        <a class="btn btn-secondary plain" href={href('home')}>
          לבחור דמות לשיחה
        </a>
      </div>
    </main>
  );
}
