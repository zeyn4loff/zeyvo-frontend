import { businessPath, partnerDelete, partnerGet, partnerPatch, partnerPost } from "../api/client";
import type { Booking, BookingStatus } from "./bookings";

const path = (businessId: string) => businessPath(businessId, "bookings");

export async function fetchBookings(businessId: string): Promise<Booking[]> {
  return (await partnerGet<{ bookings: Booking[] }>(path(businessId))).bookings;
}

export async function saveBookingRecord(businessId: string, booking: Booking, exists: boolean): Promise<Booking> {
  const body = { ...booking, branchId: booking.branchId, serviceId: booking.serviceId };
  const response = exists
    ? await partnerPatch<{ booking: Booking }>(`${path(businessId)}/${booking.id}`, body)
    : await partnerPost<{ booking: Booking }>(path(businessId), body);
  return response.booking;
}

export async function setBookingStatusRecord(businessId: string, id: string, status: BookingStatus): Promise<Booking> {
  return (await partnerPatch<{ booking: Booking }>(`${path(businessId)}/${id}/status`, { status })).booking;
}

export async function checkoutBookingRecord(businessId: string, id: string, paymentMethod: string, paymentAccountId: string): Promise<Booking> {
  return (await partnerPost<{ booking: Booking }>(`${path(businessId)}/${id}/checkout`, { paymentMethod, paymentAccountId: paymentAccountId || null })).booking;
}

export async function deleteBookingRecord(businessId: string, id: string): Promise<void> {
  await partnerDelete(`${path(businessId)}/${id}`);
}
