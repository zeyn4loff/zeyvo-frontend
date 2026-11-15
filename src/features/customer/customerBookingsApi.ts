import { currentLanguage, translate } from "@/features/locale/language";
import type { Booking } from "./CustomerContext";
import { customerCsrfToken } from "./customerAuthApi";

interface ServerBooking {
  id: string; businessId: string; branchId: string; serviceId: string; staffId?: string;
  businessName: string; branchName?: string; service: string; masterName?: string;
  date: string; time: string; status: string; createdAt: string;
}

async function request<T>(path: string, method: "GET" | "POST" = "GET"): Promise<T> {
  const response = await fetch(`/api/v1/customer/bookings${path}`, {
    method, credentials: "include",
    headers: { Accept: "application/json", "Accept-Language": currentLanguage(), ...(method === "POST" ? { "X-CSRF-TOKEN": await customerCsrfToken() } : {}) },
  });
  const payload = await response.json().catch(() => ({})) as { success?: boolean; data?: T; error?: { message?: string } };
  if (!response.ok || !payload.success) throw new Error(payload.error?.message || translate(currentLanguage(), "requestFailed"));
  return payload.data as T;
}

export async function fetchCustomerBookings(): Promise<Booking[]> {
  const { bookings } = await request<{ bookings: ServerBooking[] }>("");
  return bookings.map((item) => ({
    id: item.id, salonId: 0, salonName: item.businessName, branchName: item.branchName,
    branchId: item.branchId, businessId: item.businessId, staffId: item.staffId, partnerServiceId: item.serviceId,
    service: item.service, masterName: item.masterName, date: item.date, time: item.time,
    status: item.status === "Gəldi" || item.status === "Xidmət göstərilir" ? "Təsdiqləndi" : item.status === "Gəlmədi" ? "Ləğv edildi" : item.status as Booking["status"],
    createdAt: item.createdAt,
  }));
}

export async function cancelCustomerBooking(id: string): Promise<void> {
  await request(`/${encodeURIComponent(id)}/cancel`, "POST");
}
