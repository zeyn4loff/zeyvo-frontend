import { businessPath, partnerDelete, partnerGet, partnerPatch, partnerPost, saveRecord } from "../api/client";
import type { GiftCard, LoyaltyData, LoyaltyProgram, LoyaltyRule, Subscription } from "./loyalty";

export type LoyaltyEntry = LoyaltyRule | GiftCard | Subscription;
export type LoyaltyKind = "rule" | "gift_card" | "subscription";

export interface LoyaltyIssueRecord {
  id: string;
  kind: "gift_card" | "subscription";
  templateId: string;
  clientId: string;
  clientName: string;
  templateName: string;
  code: string;
  issuedAt: string;
  expiresAt: string | null;
  initialBalance: number;
  balance: number;
  history: { id: string; date: string; amount: number; note: string; balanceAfter: number }[];
}

export type ServerLoyaltyData = LoyaltyData & { issues: LoyaltyIssueRecord[] };

const base = (businessId: string) => businessPath(businessId, "loyalty");

export async function fetchLoyalty(businessId: string): Promise<ServerLoyaltyData> {
  return (await partnerGet<{ loyalty: ServerLoyaltyData }>(base(businessId))).loyalty;
}

export async function saveLoyaltyTemplate(businessId: string, kind: LoyaltyKind, item: LoyaltyEntry, existing: boolean): Promise<void> {
  const { id, name, status, ...settings } = item;
  await saveRecord(`${base(businessId)}/templates`, existing ? id : null, { kind, name, status, settings });
}

export async function deleteLoyaltyTemplate(businessId: string, id: string): Promise<void> {
  await partnerDelete(`${base(businessId)}/templates/${id}`);
}

export async function saveLoyaltyProgram(businessId: string, program: LoyaltyProgram): Promise<void> {
  await partnerPatch(`${base(businessId)}/program`, { ...program });
}

export async function issueLoyalty(businessId: string, templateId: string, clientId: string): Promise<void> {
  await partnerPost(`${base(businessId)}/issues`, { templateId, clientId });
}

export async function redeemLoyalty(businessId: string, issueId: string, amount: number, note: string, serviceId?: string): Promise<void> {
  await partnerPost(`${base(businessId)}/issues/${issueId}/redeem`, {
    operationId: crypto.randomUUID(), amount, note, ...(serviceId ? { serviceId } : {}),
  });
}
