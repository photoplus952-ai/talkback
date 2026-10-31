import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { CHARS, type Character } from '../data/characters';

// Board geometry (card 350 wide, 320 tall): character 620 tall, face at 29% across and 85px down.
const BOARD_W = 350;
const CARD_H = 320;
const IMG_H = 620;
const FACE_FX = 0.29;
const FACE_Y = 85;

/** left = cardW*fx - mx*imgW (DESIGN.md) */
export function placeCharacter(c: Character, cardW: number) {
  const k = cardW / BOARD_W;
  const imgH = IMG_H * k;
  const imgW = imgH / c.a;
  return { height: imgH, left: cardW * FACE_FX - c.mx * imgW, top: FACE_Y * k - c.my * imgH };
}

type Slide = { idx: number; role: 'in' | 'out' | 'still'; dir: 1 | -1; key: number };

/**
 * Character card with a swipe carousel: the old character slides fully out sideways,
 * the new one slides in from the other side at the same moment. No fade. The background stays put.
 */
export function CharacterCard({ day, onChange }: { day: number; onChange?: (c: Character) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(BOARD_W);
  const [idx, setIdx] = useState(0);
  const [slides, setSlides] = useState<Slide[]>([{ idx: 0, role: 'still', dir: 1, key: 0 }]);
  const drag = useRef<{ x: number; y: number; id: number } | null>(null);
  const keyRef = useRef(1);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth || BOARD_W));
    ro.observe(el);
    setW(el.clientWidth || BOARD_W);
    return () => ro.disconnect();
  }, []);

  useEffect(() => onChange?.(CHARS[idx]), [idx]);

  function go(dir: 1 | -1) {
    const next = (idx + dir + CHARS.length) % CHARS.length;
    const k = keyRef.current++;
    setSlides([
      { idx, role: 'out', dir, key: k * 2 },
      { idx: next, role: 'in', dir, key: k * 2 + 1 },
    ]);
    setIdx(next);
  }
  function jump(to: number) {
    if (to === idx) return;
    go((to > idx ? 1 : -1) as 1 | -1);
    // go() moves one step; for a jump, swap the incoming slide's character
    setSlides((s) => s.map((x) => (x.role === 'in' ? { ...x, idx: to } : x)));
    setIdx(to);
  }

  // RTL: the next character waits on the left, so a swipe to the right (finger moves right) brings it in.
  function onDown(e: PointerEvent) {
    drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
  }
  function onUp(e: PointerEvent) {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) go(dx > 0 ? 1 : -1);
  }
  function onKey(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft') go(1);
    if (e.key === 'ArrowRight') go(-1);
  }

  const c = CHARS[idx];
  const nameSize = Math.round(190 * (w / BOARD_W));

  return (
    <section
      ref={ref}
      class="hero"
      style={{ height: Math.round(CARD_H * (w / BOARD_W)) }}
      aria-roledescription="קרוסלה"
      aria-label={`${c.name}, ${c.he}`}
      tabIndex={0}
      onPointerDown={onDown}
      onPointerUp={onUp}
      onPointerCancel={() => (drag.current = null)}
      onKeyDown={onKey}
    >
      {slides.map((s) => {
        const ch = CHARS[s.idx];
        const p = placeCharacter(ch, w);
        return (
          <div
            key={s.key}
            class={`hero-slide ${s.role}`}
            style={{ '--dir': s.dir } as any}
            aria-hidden={s.role === 'out' ? true : undefined}
            onAnimationEnd={() => s.role === 'out' && setSlides((all) => all.filter((x) => x.key !== s.key))}
          >
            <span class="hero-name display" style={{ fontSize: nameSize }}>
              {ch.name.toUpperCase()}
            </span>
            <img
              class="hero-img"
              src={ch.img}
              alt=""
              draggable={false}
              style={{ height: p.height, left: p.left, top: p.top }}
            />
            <p class="hero-greet">{ch.greet}</p>
          </div>
        );
      })}

      <div class="hero-day" aria-label={`יום ${day} מתוך 30`}>
        <span class="display" style={{ fontSize: 15, letterSpacing: '.1em' }}>DAY</span>
        <span class="row" style={{ alignItems: 'flex-end', gap: 4, direction: 'ltr' }}>
          <span class="display" style={{ fontSize: 96 }}>{String(Math.min(day, 30)).padStart(2, '0')}</span>
          <span class="display" style={{ fontSize: 22, opacity: 0.85 }}>/30</span>
        </span>
      </div>

      <div class="hero-dots" role="tablist" aria-label="בחירת דמות">
        {CHARS.map((x, i) => (
          <button
            key={x.id}
            role="tab"
            aria-selected={i === idx}
            aria-label={`${x.name}, ${x.he}`}
            onClick={() => jump(i)}
          >
            <i />
          </button>
        ))}
      </div>
    </section>
  );
}
