import type { BusinessSession } from "../auth/businessSession";
import { resolveActiveContext } from "../directory/activeContext";
export type ClientCategory = "regular" | "vip" | "new" | "risk";
export type ClientGender = "female" | "male" | "other";
export interface ClientVisit { id: string; date: string; service: string; staff: string; amount: number; note: string }
export interface ClientLedgerEntry { id: string; date: string; account: "deposit" | "cashback"; amount: number; note: string; method?: string }
export interface ClientNote { id: string; date: string; text: string }
export interface ClientFile { id: string; name: string; type: string; dataUrl?: string; date: string; size?: number }
export interface ClientMessage { id: string; date: string; channel: "whatsapp" | "sms"; text: string; status: "prepared" | "opened" | "sent" | "delivered" | "read" | "failed"; providerMessageId?: string }
export interface ClientMessageTemplate { id: string; name: string; text: string }
export interface Client { id: string; name: string; phone: string; email: string; gender: ClientGender; category: ClientCategory; birthDate: string; preferredStaffId: string; loyaltyTier?: "standard" | "silver" | "gold" | "vip"; discountPercent: number; note: string; visits: ClientVisit[]; historicVisits?: number; historicSpent?: number; ledger: ClientLedgerEntry[]; notes: ClientNote[]; files: ClientFile[]; messages?: ClientMessage[]; messageTemplates?: ClientMessageTemplate[]; createdAt: string; referralCode?: string; referredByCode?: string }
const serverClients = new Map<string, Client[]>();
export function cacheServerClients(sessionId: string, businessId: string, clients: Client[]): void { serverClients.set(`${sessionId}:${businessId}`, clients); }
export const categoryLabels: Record<ClientCategory, string> = { regular: "Daimi", vip: "VIP", new: "Yeni müştəri", risk: "Risk qrupu" };
export const genderLabels: Record<ClientGender, string> = { female: "Qadın", male: "Kişi", other: "Digər" };
export function phoneDigits(phone: string) { const digits = phone.replace(/\D/g, ""); return digits.startsWith("994") ? digits.slice(3) : digits; }
export function balance(client: Client, account: ClientLedgerEntry["account"]) { return client.ledger.filter((item) => item.account === account).reduce((sum, item) => sum + item.amount, 0); }
export function totalVisits(client: Client) { return (client.historicVisits ?? 0) + client.visits.length; }
export function totalSpent(client: Client) { return (client.historicSpent ?? 0) + client.visits.reduce((sum, item) => sum + item.amount, 0); }
export function latestVisit(client: Client) { return [...client.visits].sort((a, b) => b.date.localeCompare(a.date))[0]?.date ?? ""; }
export function formatClientDate(value: string) { const date = value.slice(0, 10); return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date.split("-").reverse().join(".") : value || "—"; }
export function upcomingBirthday(client: Client, days = 30) { if (!client.birthDate) return false; const [year, month, day] = client.birthDate.split("-").map(Number); if (!year || !month || !day) return false; const now = new Date(); const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()); let next = new Date(start.getFullYear(), month - 1, day); if (next < start) next = new Date(start.getFullYear() + 1, month - 1, day); return Math.round((next.getTime() - start.getTime()) / 86400000) <= days; }
export function readClients(session: BusinessSession): Client[] {
  return serverClients.get(`${session.id}:${resolveActiveContext(session)?.businessId ?? ""}`) ?? [];
}
