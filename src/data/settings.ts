// Small per-device preferences.
const AUTO = 'tb.autoread';

export function autoRead(): boolean {
  try {
    return localStorage.getItem(AUTO) !== '0';
  } catch {
    return true;
  }
}

export function setAutoRead(on: boolean) {
  try {
    localStorage.setItem(AUTO, on ? '1' : '0');
  } catch {
    /* ignore */
  }
}
