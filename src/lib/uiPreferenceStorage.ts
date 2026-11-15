export function readString(key: string, fallback: string): string {
  try { return localStorage.getItem(key) || fallback; }
  catch { return fallback; }
}

export function writeString(key: string, value: string): boolean {
  try { localStorage.setItem(key, value); return true; }
  catch { return false; }
}
