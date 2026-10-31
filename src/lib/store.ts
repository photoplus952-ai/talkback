// On-device storage (IndexedDB). Conversations, words, memory and metrics never leave the device.
import { get, set, update, createStore, type UseStore } from 'idb-keyval';

let db: UseStore | null = null;
function store(): UseStore {
  if (!db) db = createStore('talkback', 'kv');
  return db;
}

export async function load<T>(key: string, fallback: T): Promise<T> {
  try {
    const v = await get<T>(key, store());
    return v === undefined ? fallback : v;
  } catch {
    return fallback;
  }
}

export async function save<T>(key: string, value: T): Promise<void> {
  try {
    await set(key, value, store());
  } catch {
    /* storage blocked: keep working in memory */
  }
}

export async function change<T>(key: string, fallback: T, fn: (v: T) => T): Promise<T> {
  let out = fallback;
  try {
    await update<T>(key, (v) => (out = fn(v === undefined ? fallback : v)), store());
  } catch {
    out = fn(fallback);
  }
  return out;
}
