export { formatMoney } from "./businessCurrency";

export type FinanceTab = "accounts" | "transactions" | "payroll" | "categories";
export type AccountType = "cash" | "pos" | "bank" | "safe";
export type FinanceKind = "income" | "expense" | "transfer";
export interface FinanceAccount { id: string; name: string; type: AccountType; openingBalance: number; details: string; isDefault?: boolean }
export interface FinanceCategory { id: string; name: string; type: "income" | "expense" }
export interface FinanceTransaction { id: string; date: string; time?: string; type: FinanceKind; accountId: string; toAccountId: string; categoryId: string; amount: number; title: string; counterparty: string; note: string; payrollId: string; sourceType?: string | null }
export interface CashShift { id: string; accountId: string; openedAt: string; openingCash: number; closedAt: string; closingCash: number; note: string; number?: number; cashier?: string; actualCash?: number }
export interface ShiftFormValues { cashier: string; openingCash: number; actualCash: number; note: string }
export interface PayrollAccrual { id: string; staffId: string; period: string; amount: number; note: string; serviceTurnover?: number; serviceRate?: number; productSales?: number; productRate?: number }
export type PayrollPaymentType = "salary" | "advance" | "bonus";
export interface FinanceData { accounts: FinanceAccount[]; categories: FinanceCategory[]; transactions: FinanceTransaction[]; shifts: CashShift[]; payroll: PayrollAccrual[] }
export const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
export const accountTypes: Record<AccountType, string> = { cash: "Nağd kassa", pos: "POS terminal", bank: "Bank hesabı", safe: "Seyf" };
export function accountBalance(data: FinanceData, accountId: string): number { const account = data.accounts.find((item) => item.id === accountId); if (!account) return 0; return roundMoney(data.transactions.reduce((balance, item) => balance + (item.type === "income" && item.accountId === accountId ? item.amount : 0) - (item.type === "expense" && item.accountId === accountId ? item.amount : 0) - (item.type === "transfer" && item.accountId === accountId ? item.amount : 0) + (item.type === "transfer" && item.toAccountId === accountId ? item.amount : 0), account.openingBalance)); }
export function payrollPaid(data: FinanceData, payrollId: string): number { return roundMoney(data.transactions.filter((item) => item.payrollId === payrollId && item.type === "expense").reduce((sum, item) => sum + item.amount, 0)); }
export function canPost(data: FinanceData, entry: FinanceTransaction, replacingId?: string): string | null { const account = data.accounts.find((item) => item.id === entry.accountId); if (!account) return "Kassa seçin."; if (!Number.isFinite(entry.amount) || entry.amount <= 0) return "Məbləğ sıfırdan böyük olmalıdır."; if (entry.type === "transfer") { if (!data.accounts.some((item) => item.id === entry.toAccountId) || entry.toAccountId === entry.accountId) return "Fərqli hədəf kassa seçin."; } else if (!data.categories.some((item) => item.id === entry.categoryId && item.type === entry.type)) return "Uyğun kateqoriya seçin."; const base = replacingId ? { ...data, transactions: data.transactions.filter((item) => item.id !== replacingId) } : data; const candidate = { ...base, transactions: [entry, ...base.transactions] }; if (candidate.accounts.some((item) => accountBalance(candidate, item.id) < 0)) return "Əməliyyat nəticəsində kassa qalığı mənfi ola bilməz."; return null; }
export function localDate(): string { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
