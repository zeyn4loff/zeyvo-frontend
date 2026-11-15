export function phoneIdentity(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("994") ? digits : `994${digits}`;
}
