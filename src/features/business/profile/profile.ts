import type { BusinessSession } from "../auth/businessSession";
import type { Language } from "@/features/locale/language";

export type ProfileTab = "personal" | "startpage" | "messengers" | "social" | "apps" | "security";
export type ProfileGender = "female" | "male" | "";
export interface BusinessProfile {
  ownerName: string;
  phone: string;
  gender: ProfileGender;
  language: Language;
  country: string;
  city: string;
  cityId?: number | null;
  bio: string;
  avatar: string;
  startView: "business" | "profile";
  whatsapp: string;
  telegram: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  linkedin: string;
}
export function defaultProfile(session: BusinessSession): BusinessProfile { return { ownerName: session.ownerName, phone: session.phone ?? "", gender: "", language: "az", country: "AZ", city: "", bio: "", avatar: "", startView: "business", whatsapp: "", telegram: "", instagram: "", facebook: "", tiktok: "", linkedin: "" }; }
export function normalizeHandle(value: string, service: "telegram" | "instagram" | "facebook" | "tiktok" | "linkedin") {
  const trimmed = value.trim();
  const withoutUrl = trimmed.replace(/^https?:\/\/(?:www\.)?/i, "");
  const prefixes: Record<typeof service, RegExp> = { telegram: /^(?:t\.me\/|@)/i, instagram: /^(?:instagram\.com\/|@)/i, facebook: /^facebook\.com\//i, tiktok: /^(?:tiktok\.com\/@?|@)/i, linkedin: /^linkedin\.com\/(?:in\/)?/i };
  return withoutUrl.replace(prefixes[service], "").replace(/\/$/, "");
}
export function phoneDigits(phone: string) { const digits = phone.replace(/\D/g, ""); return digits.startsWith("994") ? digits.slice(3) : digits; }
export function formattedPhone(value: string) { const digits = phoneDigits(value).slice(0, 9); return digits ? `+994 ${digits.slice(0, 2)} ${digits.slice(2, 5)}-${digits.slice(5, 7)}-${digits.slice(7)}` : ""; }
