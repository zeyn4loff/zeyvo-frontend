export interface OnlineBookingResult {
  booking: { id: string; status: string; date: string; time: string; masterName: string };
  cancelToken: string;
}

async function request<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`/api/v1/${path}`, {
    method: "POST", credentials: "include",
    headers: { Accept: "application/json", "Accept-Language": currentLanguage(), "Content-Type": "application/json", "X-CSRF-TOKEN": await customerCsrfToken() },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({})) as { data?: T; error?: { message?: string } };
  if (!response.ok || !payload.data) throw new Error(payload.error?.message || translate(currentLanguage(), "requestFailed"));
  return payload.data;
}

export function createServerOnlineBooking(businessId: string, body: Record<string, unknown>): Promise<OnlineBookingResult> {
  return request(`businesses/${businessId}/online-bookings`, body);
}

export function cancelServerOnlineBooking(id: string, token: string): Promise<void> {
  return request(`online-bookings/${id}/cancel`, { token });
}

export function fetchServerOnlineBookingStatus(id: string, token: string): Promise<{ booking: { status: string; date: string; time: string; masterName: string } }> {
  return request(`online-bookings/${id}/status`, { token });
}
import { currentLanguage, translate } from "@/features/locale/language";
import { customerCsrfToken } from "./customerAuthApi";

export interface AvailableSlot { time: string; masterName: string; staffId: string }

export async function fetchAvailableSlots(businessId: string, branchId: string, serviceId: string, date: string, staffId?: string): Promise<AvailableSlot[]> {
  const query = new URLSearchParams({ branchId, serviceId, date });
  if (staffId) query.set("staffId", staffId);
  const response = await fetch(`/api/v1/businesses/${businessId}/availability?${query}`, {
    credentials: "include", headers: { Accept: "application/json", "Accept-Language": currentLanguage() },
  });
  const payload = await response.json().catch(() => ({})) as { data?: { slots?: AvailableSlot[] }; error?: { message?: string } };
  if (!response.ok || !Array.isArray(payload.data?.slots)) throw new Error(payload.error?.message || translate(currentLanguage(), "requestFailed"));
  return payload.data.slots;
}

