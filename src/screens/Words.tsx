import { useEffect, useState } from 'preact/hooks';
import { Icon } from '../components/Icon';
import { href } from '../router';
import { loadWords, type SavedWord } from '../data/words';
import { CHARS } from '../data/characters';

export function Words() {
  const [words, setWords] = useState<SavedWord[] | null>(null);
  useEffect(() => {
    loadWords().then(setWords);
  }, []);

  return (
    <main class="screen enter">
      <div class="col g4">
        <span class="title-en">WORDS</span>
        <span class="t-sm muted">{words ? `${words.length} מילים` : ' '}</span>
      </div>
      {words && !words.length && (
        <div class="card empty">
          <span class="ic">
            <Icon name="book" size={28} />
          </span>
          <h2 class="t-section">עוד אין כאן מילים</h2>
          <p class="t-body muted" style={{ margin: 0 }}>
            כל מילה חדשה מהשיחות שלך תגיע לכאן, ותחזור בדיוק לפני שתשכחי אותה.
          </p>
          <a class="btn btn-secondary plain" href={href('chat', CHARS[0].id)}>
            לדבר עם Max
          </a>
        </div>
      )}
      {!!words?.length && (
        <section class="card" style={{ paddingBlock: 4 }}>
          {[...words].reverse().map((w) => (
            <div class="li" key={w.en}>
              <span class="col grow">
                <b class="en">{w.en}</b>
                <span class="t-sm muted">{w.he}</span>
              </span>
              {w.kind === 'slang' && <span class="soon">סלנג</span>}
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
