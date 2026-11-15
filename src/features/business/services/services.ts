import type { BusinessSession } from "../auth/businessSession";
import { currencySymbol } from "../finance/businessCurrency";
export type ServiceGender = "all" | "women" | "men" | "kids";
export type PriceType = "fixed" | "from" | "range";
export type ServiceFormat = "individual" | "combo" | "group";
export interface ServiceCategory { id: string; name: string; description: string; icon?: string }
export interface ServiceComboItem { serviceId: string; price: number; duration: number }
export interface ServiceOnlineSettings { minAdvanceHours: number; maxAdvanceDays: number; reminderEnabled: boolean; reminderHours: number; reminderText: string; onlineTitle?: string; imageUrls?: string[]; depositType?: "none" | "fixed" | "percent"; depositValue?: number; cancellationRule?: "free_2h" | "free_12h" | "free_24h" | "free_any" | "strict"; clientNote?: string; reviewRequestEnabled?: boolean; reviewRequestDays?: number; reviewRequestText?: string; repeatReminderEnabled?: boolean; repeatReminderDays?: number; repeatReminderText?: string }
export interface ServiceMaterialItem { productId: string; quantity: number }
export interface ServiceStaffOverride { price?: number; duration?: number; useCustomMaterials?: boolean; techCardId?: string; materials?: ServiceMaterialItem[] }
export interface ServiceTranslation { name: string; description: string }
export interface Service { id: string; businessId?: string; name: string; categoryId: string; description: string; price: number; priceMax: number; priceType: PriceType; duration: number; breakTime: number; bufferTime: number; gender: ServiceGender; format: ServiceFormat; isCombo?: boolean; capacity: number; staffIds: string[]; resourceIds: string[]; productIds: string[]; techCardId?: string; materialItems?: ServiceMaterialItem[]; comboIds: string[]; onlineBooking: boolean; comboItems?: ServiceComboItem[]; staffProductIds?: Record<string, string[]>; staffOverrides?: Record<string, ServiceStaffOverride>; onlineSettings?: ServiceOnlineSettings; translations?: Record<string, ServiceTranslation> }
export interface ServiceData { categories: ServiceCategory[]; services: Service[] }
const serverCache = new Map<string, ServiceData>();
export function setServerServiceData(sessionId: string, businessId: string, data: ServiceData): void {
  serverCache.set(`${sessionId}:${businessId}`, data);
  window.dispatchEvent(new Event("zeyvo-marketplace-change"));
}
export const genderLabels: Record<ServiceGender, string> = { all: "Hamısı", women: "Qadın", men: "Kişi", kids: "Uşaq" };
export const formatLabels: Record<ServiceFormat, string> = { individual: "Fərdi", combo: "Kompleks", group: "Qrup" };
export function formatPrice(service: Service, currencyCode = "AZN"): string { const symbol = currencySymbol(currencyCode); if (service.priceType === "from") return `${service.price} ${symbol}+`; if (service.priceType === "range") return `${service.price}–${service.priceMax} ${symbol}`; return `${service.price} ${symbol}`; }
export function readServiceData(session: BusinessSession): ServiceData {
  const values = [...serverCache.entries()]
    .filter(([cacheKey]) => cacheKey.startsWith(`${session.id}:`))
    .map(([, value]) => value);
  return { categories: values.flatMap((value) => value.categories), services: values.flatMap((value) => value.services) };
}
