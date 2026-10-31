import { useState } from 'preact/hooks';
import { Icon } from '../components/Icon';
import { CharacterCard } from '../components/CharacterCard';
import { toast } from '../components/toast';
import { CHARS } from '../data/characters';
import { dayNumber, greeting, week } from '../data/progress';
import { PRACTICES } from '../data/practices';
import { href } from '../router';

export function Home() {
  const [ch, setCh] = useState(CHARS[0]);
  const day = dayNumber();
  const streak = 0;
  const next = PRACTICES[0];

  return (
    <main class="screen enter">
      <header class="row between">
        <div class="col">
          <span class="t-sm muted">{greeting()}</span>
          <b style={{ fontSize: 21, lineHeight: 1.3 }}>מוכנה לסבב של היום?</b>
        </div>
        <div class="row g8">
          <span class="chip tint" aria-label={`רצף: ${streak} ימים`}>
            <Icon name="flame" filled size={16} />
            {streak}
          </span>
          <a class="avatar" href={href('profile')} aria-label="הפרופיל וההגדרות שלי">
            <Icon name="user" />
            <span class="avatar-gear">
              <Icon name="gear" size={12} />
            </span>
          </a>
        </div>
      </header>

      <ol class="week" aria-label="השבוע שלי">
        {week().map((d) => (
          <li class={d.state}>
            <span class="day">
              {d.state === 'done' && <Icon name="check" size={16} style={{ strokeWidth: 3 }} />}
              {d.state === 'missed' && <Icon name="x" size={16} />}
              {d.state === 'today' && <Icon name="flame" size={16} filled />}
            </span>
            {d.state === 'today' ? 'היום' : d.letter}
          </li>
        ))}
      </ol>

      <CharacterCard day={day} onChange={setCh} />

      <div class="duo">
        <button class="btn btn-primary btn-tile" onClick={() => toast(`שיחת וידאו עם ${ch.name} נפתחת בקרוב. בינתיים, הצ'אט כבר מדבר.`)}>
          <Icon name="video" />
          שיחת וידאו
        </button>
        <a class="btn btn-secondary btn-tile plain" href={href('chat', ch.id)}>
          <Icon name="msg" class="tint" />
          צ'אט
        </a>
      </div>

      <a class="card row g12 plain" href={href('practice')}>
        <div class="ring" style={{ '--p': 0 } as any}>
          <span>0/{PRACTICES.length}</span>
        </div>
        <div class="col grow">
          <b>התרגול של היום</b>
          <span class="t-sm muted">
            הבא: {next.title} · {next.minutes} דק'
          </span>
        </div>
        <span class="chip on">להתחיל</span>
      </a>
    </main>
  );
}
