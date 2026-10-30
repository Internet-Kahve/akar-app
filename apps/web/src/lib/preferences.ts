/** Small per-device choices. Storage can be blocked (private windows, previews), so each read and write may fail. */
export function readPreference(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
export function writePreference(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {}
}
