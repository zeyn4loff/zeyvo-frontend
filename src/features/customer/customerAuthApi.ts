import { currentLanguage, translate } from "@/features/locale/language";

interface Envelope<T> { success: boolean; data: T; error?: { message: string }; meta?: { retry_after?: number } }
export interface CustomerAccount { id: number; name: string; phone: string; city: string; gender?: "female" | "male"; avatar?: string | null }
export interface CodeDelivery { channel: string; expires_in: number; retry_after: number }
export class CustomerApiError extends Error {
  retryAfter: number;
  constructor(message: string, retryAfter = 0) { super(message); this.retryAfter = retryAfter; }
}

let csrfToken = "";
const base = "/api/v1/customer/auth";

async function read<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({})) as Partial<Envelope<T>>;
  if (!response.ok || !payload.success) throw new CustomerApiError(payload.error?.message || translate(currentLanguage(), "requestFailed"), payload.meta?.retry_after || 0);
  return payload.data as T;
}

async function csrf(): Promise<string> {
  if (csrfToken) return csrfToken;
  csrfToken = (await read<{ token: string }>(await fetch(`${base}/csrf`, { credentials: "include", headers: { Accept: "application/json", "Accept-Language": currentLanguage() } }))).token;
  return csrfToken;
}

export const customerCsrfToken = csrf;

async function request<T>(path: string, method: "GET" | "POST", body?: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${base}/${path}`, {
    method, credentials: "include",
    headers: { Accept: "application/json", "Accept-Language": currentLanguage(), ...(body ? { "Content-Type": "application/json", "X-CSRF-TOKEN": await csrf() } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (response.status === 419) csrfToken = "";
  return read<T>(response);
}

export const customerMe = () => request<{ account: CustomerAccount | null }>("me", "GET");
export async function saveCustomerProfile(profile: { name: string; city: string; gender?: "female" | "male" }): Promise<CustomerAccount> {
  const response = await fetch("/api/v1/customer/profile", {
    method: "PATCH", credentials: "include",
    headers: { Accept: "application/json", "Accept-Language": currentLanguage(), "Content-Type": "application/json", "X-CSRF-TOKEN": await csrf() },
    body: JSON.stringify(profile),
  });
  return (await read<{ profile: CustomerAccount }>(response)).profile;
}
export async function changeCustomerAvatar(file?: File): Promise<CustomerAccount> {
  const body = new FormData();
  if (file) body.append("avatar", file);
  const response = await fetch("/api/v1/customer/profile/avatar", {
    method: file ? "POST" : "DELETE", credentials: "include",
    headers: { Accept: "application/json", "Accept-Language": currentLanguage(), "X-CSRF-TOKEN": await csrf() },
    ...(file ? { body } : {}),
  });
  return (await read<{ profile: CustomerAccount }>(response)).profile;
}
export const requestCustomerCode = (phone: string, intent: "login" | "register", name?: string) => request<CodeDelivery>("request-code", "POST", { phone, intent, ...(name ? { name } : {}) });
export async function verifyCustomerCode(phone: string, intent: "login" | "register", code: string): Promise<CustomerAccount> {
  const result = await request<{ account: CustomerAccount; token: string }>("verify", "POST", { phone, intent, code });
  csrfToken = result.token;
  return result.account;
}
export async function logoutCustomer(): Promise<void> { await request("logout", "POST", {}); csrfToken = ""; }
