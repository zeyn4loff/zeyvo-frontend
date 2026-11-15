export type BookingStatus = "Gözlənilir" | "Təsdiqləndi" | "Gəldi" | "Xidmət göstərilir" | "Tamamlandı" | "Gəlmədi" | "Ləğv edildi";
export type BookingSource = "online" | "manual";

export interface Booking {
  id: string;
  clientId?: string;
  serviceId?: string;
  paymentMethod?: "cash" | "terminal" | "deposit" | "bonus";
  paymentAccountId?: string;
  businessId?: string;
  branchId?: string;
  customerEmail?: string;
  customerAccountKey?: string;
  clientName: string;
  phone: string;
  service: string;
  masterName: string;
  date: string;
  time: string;
  durationMinutes: number;
  price: number;
  status: BookingStatus;
  source: BookingSource;
  note: string;
}

export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function addDays(dateText: string, days: number): string {
  const [year, month, day] = dateText.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return localDate(date);
}

