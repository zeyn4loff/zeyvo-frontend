export interface BusinessSession {
  id: string;
  ownerName: string;
  businessName: string;
  email: string;
  phone?: string;
  avatar?: string;
  startView?: "business" | "profile";
  kind: "server";
}

const KEY = "zeyvo_business_session_v2";

function isBusinessSession(value: unknown): value is BusinessSession {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return item.kind === "server" && typeof item.id === "string" &&
    typeof item.ownerName === "string" && typeof item.businessName === "string" &&
    typeof item.email === "string";
}

export function readBusinessSession(): BusinessSession | null {
  for (const getStorage of [() => sessionStorage, () => localStorage]) {
    try {
      const storage = getStorage();
      const raw = storage.getItem(KEY);
      if (!raw) continue;
      const value: unknown = JSON.parse(raw);
      if (isBusinessSession(value) && value.kind === "server") return value;
    } catch { /* Storage may be unavailable or contain invalid data. */ }
  }
  return null;
}

export function saveBusinessSession(session: BusinessSession, remember: boolean): void {
  clearBusinessSession();
  try { (remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(session)); }
  catch { /* The session remains in memory until the page is refreshed. */ }
}

export function updateBusinessSession(session: BusinessSession): boolean {
  try {
    const storage = sessionStorage.getItem(KEY) ? sessionStorage : localStorage.getItem(KEY) ? localStorage : sessionStorage;
    storage.setItem(KEY, JSON.stringify(session));
    return true;
  } catch { return false; }
}

export function clearBusinessSession(): void {
  try { sessionStorage.removeItem(KEY); } catch { /* Storage may be unavailable. */ }
  try { localStorage.removeItem(KEY); } catch { /* Storage may be unavailable. */ }
}

