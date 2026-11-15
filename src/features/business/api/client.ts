import { currentLanguage, translate } from "@/features/locale/language";

/** Shape every partner endpoint responds with. */
interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string; details: Record<string, unknown> };
  meta: { retry_after?: number; channel?: string };
}

export class PartnerApiError extends Error {
  code: string;
  status: number;
  retryAfter: number;
  channel?: string;

  constructor(message: string, code: string, retryAfter = 0, channel?: string, status = 0) {
    super(message);
    this.code = code;
    this.status = status;
    this.retryAfter = retryAfter;
    this.channel = channel;
  }
}

export type RequestMethod = "GET" | "POST" | "PATCH" | "DELETE";
export type RequestBody = Record<string, unknown> | FormData | undefined;

const authBase = "/api/v1/partner/auth";
const partnerBase = "/api/v1/partner";
export const partnerSessionExpiredEvent = "zeyvo-partner-session-expired";
let csrfToken = "";

/** The verify endpoint hands back a fresh token, so the session keeps the same one. */
export function setCsrfToken(token: string): void {
  csrfToken = token;
}

export function clearCsrfToken(): void {
  csrfToken = "";
}

function baseHeaders(): Record<string, string> {
  return { Accept: "application/json", "Accept-Language": currentLanguage() };
}

async function readEnvelope<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({})) as Partial<ApiEnvelope<T>>;
  if (!response.ok || !body.success) {
    const details = Object.values(body.error?.details ?? {}).flatMap((value) => Array.isArray(value) ? value : [value]);
    const fieldMessage = details.find((value): value is string => typeof value === "string" && value.length > 0);
    const fields = body.error?.details?.fields;
    const fieldNames = fields && typeof fields === "object" ? Object.keys(fields) : [];
    const message = fieldMessage || body.error?.message || translate(currentLanguage(), "requestFailed");
    throw new PartnerApiError(
      fieldNames.length ? `${message} (${fieldNames.join(", ")})` : message,
      body.error?.code || "request_failed",
      body.meta?.retry_after || 0,
      body.meta?.channel,
      response.status,
    );
  }
  return body.data as T;
}

async function csrf(): Promise<string> {
  if (csrfToken) return csrfToken;
  const response = await fetch(`${authBase}/csrf`, { credentials: "include", headers: baseHeaders() });
  csrfToken = (await readEnvelope<{ token: string }>(response)).token;
  return csrfToken;
}

/** Broadcast auth returns Pusher's raw payload, outside the normal API envelope. */
export async function authorizeBroadcastChannel(socketId: string, channelName: string): Promise<{ auth: string; channel_data?: string }> {
  const response = await fetch("/api/v1/broadcasting/auth", {
    method: "POST", credentials: "include",
    headers: { ...baseHeaders(), "Content-Type": "application/json", "X-CSRF-TOKEN": await csrf() },
    body: JSON.stringify({ socket_id: socketId, channel_name: channelName }),
  });
  if (response.status === 401) window.dispatchEvent(new Event(partnerSessionExpiredEvent));
  if (!response.ok) throw new Error("Kanal icazəsi alınmadı.");
  return response.json();
}

async function send<T>(url: string, method: RequestMethod, body?: RequestBody): Promise<T> {
  const token = method === "GET" ? "" : await csrf();
  const form = body instanceof FormData;
  const response = await fetch(url, {
    method,
    credentials: "include",
    headers: {
      ...baseHeaders(),
      ...(token ? { "X-CSRF-TOKEN": token } : {}),
      ...(body && !form ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: form ? body : JSON.stringify(body) } : {}),
  });
  if (response.status === 419) clearCsrfToken();
  if (response.status === 401 && url.startsWith(`${partnerBase}/`) && !url.startsWith(`${authBase}/`)) {
    window.dispatchEvent(new Event(partnerSessionExpiredEvent));
  }
  return readEnvelope<T>(response);
}

/** Calls an endpoint below /api/v1/partner/auth. */
export function authRequest<T>(path: string, method: RequestMethod = "GET", body?: RequestBody): Promise<T> {
  return send<T>(`${authBase}/${path}`, method, body);
}

/** Calls an endpoint below /api/v1/partner. */
export function partnerRequest<T>(path: string, method: RequestMethod = "GET", body?: RequestBody): Promise<T> {
  return send<T>(`${partnerBase}/${path}`, method, body);
}

export function partnerGet<T>(path: string): Promise<T> {
  return partnerRequest<T>(path, "GET");
}

export function partnerPost<T>(path: string, body?: RequestBody): Promise<T> {
  return partnerRequest<T>(path, "POST", body);
}

export function partnerPatch<T>(path: string, body?: RequestBody): Promise<T> {
  return partnerRequest<T>(path, "PATCH", body);
}

export function partnerDelete<T>(path: string, body?: RequestBody): Promise<T> {
  return partnerRequest<T>(path, "DELETE", body);
}

/** Creates with POST, or updates with PATCH when an identifier is given. */
export function saveRecord<T>(path: string, id: string | null | undefined, body?: RequestBody): Promise<T> {
  return id ? partnerPatch<T>(`${path}/${id}`, body) : partnerPost<T>(path, body);
}

/** Builds `businesses/{id}/...` paths used by every tenant-scoped endpoint. */
export function businessPath(businessId: string, ...segments: (string | number)[]): string {
  return ["businesses", businessId, ...segments.filter((segment) => segment !== "")].join("/");
}

/** Downloads a stored file; the caller shows the message when it fails. */
export async function partnerBlob(path: string, failureMessage: string): Promise<Blob> {
  const response = await fetch(`${partnerBase}/${path}`, { credentials: "include" });
  if (!response.ok) throw new Error(failureMessage);
  return response.blob();
}

/** Reads a public endpoint that needs no session or token. */
export async function publicData<T>(path: string, failureMessage: string, signal?: AbortSignal): Promise<Partial<T>> {
  const response = await fetch(path, { headers: baseHeaders(), signal });
  if (!response.ok) throw new Error(failureMessage);
  const payload = await response.json() as { data?: Partial<T> };
  return payload.data ?? {};
}
