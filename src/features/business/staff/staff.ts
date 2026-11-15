import type { BusinessSession } from "../auth/businessSession";
import { resolveActiveContext } from "../directory/activeContext";
export const weekdays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type Weekday = typeof weekdays[number];
export const dayLabels: Record<Weekday, string> = { mon: "Bazar ertəsi", tue: "Çərşənbə axşamı", wed: "Çərşənbə", thu: "Cümə axşamı", fri: "Cümə", sat: "Şənbə", sun: "Bazar" };
export interface Shift { enabled: boolean; start: string; end: string; breakStart?: string; breakEnd?: string }
export type WeekSchedule = Record<Weekday, Shift>;
export interface StaffRole { id: string; name: string; description: string; commission: number; isDefault: boolean }
export type StaffStatus = "active" | "vacation" | "inactive" | "dismissed";
export type StaffSalaryScheme = "commission" | "fixed_plus_commission" | "fixed" | "booth_rental";
export interface DismissalInfo { reason: string; date: string; docNo: string; note: string }
export type EmploymentEvent = { type: "dismissed"; date: string; reason: string; docNo: string; note: string } | { type: "rehire"; date: string; roleId: string; note: string };
export interface StaffScheduleException { id: string; date: string; available: boolean; start: string; end: string; note: string }
export interface StaffReview { id: string; author: string; rating: number; date: string; comment: string; reply: string }
export interface StaffMember { id: string; name: string; roleId: string; specialization: string; phone: string; email: string; branchId: string; branchIds?: string[]; status: StaffStatus; onlineBooking: boolean; onlineNote?: string; gender?: "female" | "male"; avatar?: string; salaryScheme?: StaffSalaryScheme; rentalType?: "daily" | "monthly"; rentalAmount?: number; rentalCardCommission?: number; permissionTemplate?: string; permissions?: Record<string, boolean>; serviceCommission: number; productCommission: number; fixedSalary: number; schedule: WeekSchedule; color: string; bio: string; rating?: number; reviewsCount?: number; scheduleExceptions?: StaffScheduleException[]; reviews?: StaffReview[]; dismissalInfo?: DismissalInfo | null; employmentHistory?: EmploymentEvent[] }
export interface StaffData { roles: StaffRole[]; members: StaffMember[] }
export function staffAvailableAt(member: StaffMember, dateText: string, time: string, durationMinutes: number) {
  const [year, month, day] = dateText.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return false;
  const dayKey = weekdays[(date.getDay() + 6) % 7];
  const exception = member.scheduleExceptions?.find((item) => item.date === dateText);
  const shift = exception ? { enabled: exception.available, start: exception.start, end: exception.end } : member.schedule[dayKey];
  if (!shift?.enabled) return false;
  const toMinutes = (value: string) => { const [hours, mins] = value.split(":").map(Number); return hours * 60 + mins; };
  return toMinutes(time) >= toMinutes(shift.start) && toMinutes(time) + durationMinutes <= toMinutes(shift.end);
}
const serverStaff = new Map<string, { businessId: string; data: StaffData }>();
export function setServerStaffData(sessionId: string, businessId: string, data: StaffData): void {
  serverStaff.set(sessionId, { businessId, data });
  window.dispatchEvent(new Event("zeyvo-business-staff-change"));
}
export function todayLocalDate(date = new Date()): string { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
export function dismissStaff(member: StaffMember, info: DismissalInfo): StaffMember { return { ...member, status: "dismissed", onlineBooking: false, dismissalInfo: info, employmentHistory: [...(member.employmentHistory ?? []), { type: "dismissed", ...info }] }; }
export function rehireStaff(member: StaffMember, details: { date: string; roleId: string; onlineBooking: boolean; note: string }): StaffMember { return { ...member, status: "active", roleId: details.roleId, onlineBooking: details.onlineBooking, dismissalInfo: null, employmentHistory: [...(member.employmentHistory ?? []), { type: "rehire", date: details.date, roleId: details.roleId, note: details.note }] }; }
export function defaultSchedule(start = "09:00", end = "19:00"): WeekSchedule { return Object.fromEntries(weekdays.map((day) => [day, { enabled: day !== "sun", start: day === "sat" && start === "09:00" ? "10:00" : start, end: day === "sat" && end === "19:00" ? "18:00" : end }])) as WeekSchedule; }
export function readStaffData(session: BusinessSession): StaffData {
  const cached = serverStaff.get(session.id);
  return cached && cached.businessId === resolveActiveContext(session)?.businessId
    ? cached.data : { roles: [], members: [] };
}
