import type { Booking, BookingStatus } from "./bookings";

// One palette for bookings in every calendar view.
const statusColors: Record<BookingStatus, string> = {
  "Gözlənilir": "#d8b4fe",
  "Təsdiqləndi": "#93c5fd",
  "Gəldi": "#facc15",
  "Xidmət göstərilir": "#fb923c",
  "Tamamlandı": "#5eead4",
  "Gəlmədi": "#cbd5e1",
  "Ləğv edildi": "#fda4af",
};

export function bookingColor(booking: Booking): string {
  return statusColors[booking.status];
}
