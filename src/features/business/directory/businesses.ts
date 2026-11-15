import type { BusinessSession } from "../auth/businessSession";

export interface Branch {
  id: string;
  name: string;
  city: string;
  cityId?: number | null;
  countryCode?: string | null;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  phone: string;
  hours: string;
  amenities?: string[];
  logo?: string;
  category?: string;
  categories?: string[];
  phones?: string[];
  description?: string;
  mapUrl?: string;
  photos?: string[];
  media?: { id: number; url: string }[];
  scheduleDays?: Record<string, { isOff: boolean; open: string; close: string }>;
  whatsapp?: string;
  telegram?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  linkedin?: string;
}

export interface Business extends Partial<Omit<Branch, "id" | "name" | "description">> {
  id: string;
  type: "business" | "individual";
  name: string;
  description: string;
  topCategory?: string;
  category?: string;
  image?: string;
  primaryBranchId?: string;
  status?: "draft" | "published" | "suspended";
  currencyCode?: string | null;
  access?: { role: "owner" | "admin" | "staff"; staffId?: string | null; permissions: Record<string, boolean> };
  branches: Branch[];
}

const serverBusinesses = new Map<string, Business[]>();

export function readBusinesses(session: BusinessSession): Business[] {
  return serverBusinesses.get(session.id) ?? [];
}

export function hasLoadedBusinesses(session: BusinessSession): boolean {
  return serverBusinesses.has(session.id);
}

export function setServerBusinesses(sessionId: string, businesses: Business[]): void {
  serverBusinesses.set(sessionId, businesses);
  window.dispatchEvent(new Event("zeyvo-business-context-change"));
  window.dispatchEvent(new Event("zeyvo-marketplace-change"));
}

export function clearServerBusinesses(sessionId: string): void {
  serverBusinesses.delete(sessionId);
  window.dispatchEvent(new Event("zeyvo-business-context-change"));
}
