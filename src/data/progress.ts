// Minimal progress for M1: the day of the 30-day journey, counted from the first time the app opened.
// Real practice history (done/missed days, XP, streak) arrives with the daily practices (M5).
const KEY = 'tb.startDate';

function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function startDate(): Date {
  let v: string | null = null;
  try {
    v = localStorage.getItem(KEY);
    if (!v) {
      v = todayKey();
      localStorage.setItem(KEY, v);
    }
  } catch {
    v = todayKey();
  }
  const [y, m, d] = v.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function dayNumber(now = new Date(), start = startDate()): number {
  const a = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.max(1, Math.round((b - a) / 86_400_000) + 1);
}

export type DayState = 'done' | 'missed' | 'today' | 'future' | 'past';

export const WEEK_LETTERS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

/**
 * Sunday-first week around today. 'done' / 'missed' need practice history, which M5 records;
 * until then past days stay neutral instead of showing a false ✕.
 */
export function week(now = new Date()): { letter: string; state: DayState }[] {
  const dow = now.getDay();
  return WEEK_LETTERS.map((letter, i) => ({ letter, state: i === dow ? 'today' : i > dow ? 'future' : 'past' }));
}

export function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h >= 5 && h < 12) return 'בוקר טוב';
  if (h >= 12 && h < 17) return 'צהריים טובים';
  if (h >= 17 && h < 22) return 'ערב טוב';
  return 'לילה טוב';
}
