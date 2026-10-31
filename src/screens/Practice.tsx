import { Icon } from '../components/Icon';
import { toast } from '../components/toast';
import { dayNumber } from '../data/progress';
import { PRACTICES } from '../data/practices';

export function Practice() {
  const total = PRACTICES.reduce((s, p) => s + p.xp, 0);
  const minutes = PRACTICES.reduce((s, p) => s + p.minutes, 0);
  return (
    <main class="screen enter">
      <span class="t-sm muted">
        יום {dayNumber()} · כ-{minutes} דקות
      </span>
      <h1 class="t-screen">התרגול של היום</h1>
      <div class="col g8">
        <div class="row between t-sm">
          <span class="muted">התקדמות היום</span>
          <b class="display" style={{ fontSize: 18 }}>0/{total} XP</b>
        </div>
        <div class="bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={0}>
          <i style={{ width: '0%' }} />
        </div>
      </div>
      <ul class="col g8" style={{ padding: 0, margin: 0, listStyle: 'none' }}>
        {PRACTICES.map((p) => (
          <li>
            <button class="card station locked" style={{ width: '100%', textAlign: 'start' }} onClick={() => toast('התרגולים נפתחים בקרוב. בינתיים, תסתכלי מה מחכה לך.')}>
              <span class="ic">
                <Icon name={p.icon} />
              </span>
              <span class="col grow">
                <b>{p.title}</b>
                <span class="t-sm muted">
                  {p.goal} · {p.minutes} דק'
                </span>
              </span>
              <span class="soon">+{p.xp} XP</span>
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
