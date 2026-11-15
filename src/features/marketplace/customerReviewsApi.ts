import { customerCsrfToken } from "@/features/customer/customerAuthApi";
import { currentLanguage, translate } from "@/features/locale/language";
import type { PublicReview } from "./reviews";

async function read<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({})) as { success?: boolean; data?: T; error?: { message?: string } };
  if (!response.ok || !payload.success) throw new Error(payload.error?.message || translate(currentLanguage(), "requestFailed"));
  return payload.data as T;
}

export async function fetchPublicReviews(businessId: string, staffId?: string): Promise<PublicReview[]> {
  const query = staffId ? `?staffId=${encodeURIComponent(staffId)}` : "";
  const data = await read<{ reviews: PublicReview[] }>(await fetch(`/api/v1/catalog/${encodeURIComponent(businessId)}/reviews${query}`, {
    headers: { Accept: "application/json", "Accept-Language": currentLanguage() },
  }));
  return data.reviews;
}

export async function submitCustomerReview(bookingId: string, subjectType: "business" | "staff", rating: number, comment: string): Promise<void> {
  await read(await fetch("/api/v1/customer/reviews", {
    method: "POST", credentials: "include",
    headers: { Accept: "application/json", "Accept-Language": currentLanguage(), "Content-Type": "application/json", "X-CSRF-TOKEN": await customerCsrfToken() },
    body: JSON.stringify({ bookingId, subjectType, rating, comment }),
  }));
}
