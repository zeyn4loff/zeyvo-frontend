const lastPhoneKey = "zeyvo_business_last_phone_v1";

export function rememberedBusinessPhone(): string {
  try { return localStorage.getItem(lastPhoneKey) ?? ""; } catch { return ""; }
}

export function rememberBusinessPhone(phone: string): void {
  try { localStorage.setItem(lastPhoneKey, phone); } catch { /* Remembering a number is optional. */ }
}

export function normalizeBusinessPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.startsWith("994") && digits.length === 12 ? digits.slice(3) : digits;
}
