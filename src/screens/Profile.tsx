import { useEffect, useState } from 'preact/hooks';
import { Icon } from '../components/Icon';
import { dataUrl, loadYou, type YouCharacter } from '../data/you';
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

/**
 * Waist-up on a 260px card: the image stands on the bottom edge of the card (no floating cut line),
 * head near the top. Older full-body saves are scaled like the Cast.
 */
function youArt(y: YouCharacter) {
  const cardH = 260;
  if (y.waist) {
    const h = cardH * 0.96;
    const w = h / (y.a || 1.2);
    return { height: h, left: `calc(26% - ${(y.mx ?? 0.5) * w}px)`, bottom: 0 };
  }
  const h = cardH * 2.1;
  const w = h / (y.a || 1.37);
  return { height: h, left: `calc(26% - ${(y.mx ?? 0.5) * w}px)`, top: cardH * 0.3 - (y.my ?? 0.115) * h };
}

export function Profile() {
  const [you, setYou] = useState<YouCharacter | null | undefined>(undefined);
  useEffect(() => {
    loadYou().then(setYou);
  }, []);
  return (
    <main class="screen enter">
      <div class="top-bar">
        <h1 class="t-screen">הפרופיל שלי</h1>
        <a class="ib" href={href('settings')} aria-label="הגדרות">
          <Icon name="gear" />
        </a>
      </div>

      <section class={`you-card${you ? ' has-art' : ''}`} aria-label="You 2.0" style={you ? { paddingInlineEnd: '46%' } : undefined}>
        {you && <span class="hero-name display" style={{ fontSize: 150, left: -8, bottom: -10 }}>YOU</span>}
        {you?.cutout ? (
          <img class="you-art" src={dataUrl(you)} alt="הדמות שלי" style={youArt(you)} />
        ) : you ? (
          <img class="you-art old" src={dataUrl(you)} alt="הדמות שלי" />
        ) : (
          <span class="bgword display">YOU</span>
        )}
        <div class="col g4" style={{ position: 'relative' }}>
          <span class="display" style={{ fontSize: 34, color: 'var(--pink-tint)' }}>YOU 2.0</span>
          <span class="t-body">את, רק שוטפת</span>
          <span class="t-sm muted">
            {you && !you.cutout
              ? 'יש גרסה חדשה: בלי רקע ובתאורה של הצוות.'
              : you
                ? 'הקול שלך באנגלית מגיע בקרוב.'
                : 'תמונה אחת שלך, ואת חלק מהצוות.'}
          </span>
          {you && (
            <a class="chip plain" href={href('you')} style={{ marginTop: 6, alignSelf: 'flex-start', background: 'rgba(14,11,20,.55)' }}>
              <Icon name="refresh" size={16} />
              להחליף דמות
            </a>
          )}
        </div>
        <div class="row g8" style={{ position: 'relative', flexWrap: 'wrap' }}>
          <span class="chip"><Icon name="flame" filled size={16} class="tint" />0 ימים</span>
          <span class="chip"><Icon name="zap" size={16} class="tint" />0 XP</span>
          <span class="chip"><Icon name="mic" size={16} class="tint" />הקול שלי</span>
        </div>
      </section>

      {you === null && (
        <a class="btn btn-primary btn-block plain" href={href('you')}>
          <Icon name="sparkle" />
          ליצור את הדמות שלי
        </a>
      )}
      {you && (
        <button class="btn btn-primary btn-block" onClick={() => toast('השיחה עם עצמך תיפתח כשהקול שלך יהיה מוכן. זה השלב הבא.')}>
          <Icon name="sparkle" />
          לדבר עם עצמי
        </button>
      )}

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
