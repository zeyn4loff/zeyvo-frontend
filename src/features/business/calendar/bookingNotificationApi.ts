import { businessPath, partnerGet, partnerPatch } from "../api/client";
import type { BusinessNotification } from "../staff/businessNotifications";

export async function fetchBookingNotifications(businessId: string): Promise<BusinessNotification[]> {
  return (await partnerGet<{ notifications: BusinessNotification[] }>(businessPath(businessId, "booking-notifications"))).notifications;
}

export async function readBookingNotification(businessId: string, id: string): Promise<void> {
  await partnerPatch(businessPath(businessId, "booking-notifications", id, "read"));
}
