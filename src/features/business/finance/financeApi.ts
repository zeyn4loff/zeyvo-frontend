import { businessPath, partnerDelete, partnerGet, partnerPost, saveRecord } from "../api/client";
import type { FinanceData } from "./finance";

export async function fetchFinance(businessId: string): Promise<FinanceData> {
  return (await partnerGet<{ finance: FinanceData }>(businessPath(businessId, "finance"))).finance;
}

export async function saveFinanceRecord(businessId: string, resource: string, id: string | null, record: Record<string, unknown>): Promise<FinanceData> {
  return (await saveRecord<{ finance: FinanceData }>(businessPath(businessId, "finance", resource), id, record)).finance;
}

export async function deleteFinanceRecord(businessId: string, resource: string, id: string): Promise<FinanceData> {
  return (await partnerDelete<{ finance: FinanceData }>(businessPath(businessId, "finance", resource, id))).finance;
}

export async function runFinanceAction(businessId: string, action: string, data: Record<string, unknown>): Promise<FinanceData> {
  return (await partnerPost<{ finance: FinanceData }>(businessPath(businessId, "finance", "actions", action), data)).finance;
}

export async function sendFinanceReport(businessId: string, email: string, transactionIds: string[]): Promise<number> {
  return (await partnerPost<{ sentCount: number }>(businessPath(businessId, "finance", "reports", "email"), { email, transactionIds })).sentCount;
}
