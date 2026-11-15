import type { BusinessSession } from "./businessSession";
import { authRequest, clearCsrfToken, setCsrfToken } from "../api/client";

export { PartnerApiError } from "../api/client";

export async function requestPartnerCode(phone: string, intent: "login" | "register", name?: string): Promise<{ channel: string; expires_in: number; retry_after: number }> {
  return authRequest("request-code", "POST", { phone, intent, ...(name ? { name } : {}) });
}

export async function verifyPartnerCode(phone: string, intent: "login" | "register", code: string): Promise<BusinessSession> {
  const data = await authRequest<{ account: BusinessSession; token: string }>("verify", "POST", { phone, intent, code });
  setCsrfToken(data.token);
  return data.account;
}

export async function readPartnerAccount(): Promise<BusinessSession | null> {
  return (await authRequest<{ account: BusinessSession | null }>("me")).account;
}

export async function logoutPartner(): Promise<void> {
  await authRequest("logout", "POST", {});
  clearCsrfToken();
}
