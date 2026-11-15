import { useSyncExternalStore } from "react";
import type { BusinessSession } from "../auth/businessSession";
import { readBusinesses, type Business } from "./businesses";
import { saveBusinessContext } from "./businessDirectoryApi";

export interface ActiveBusinessContext {
  businessId: string;
  businessName: string;
  branchId: string;
  branchName: string;
  type: Business["type"];
}

const changeEvent = "zeyvo-business-context-change";
const serverSelections = new Map<string, { businessId: string; branchId: string }>();

export function resolveActiveContext(session: BusinessSession): ActiveBusinessContext | null {
  const businesses = readBusinesses(session);
  const selected = serverSelections.get(session.id);
  const chosenBusiness = businesses.find((item) => item.id === selected?.businessId);
  const business = chosenBusiness && (chosenBusiness.type === "individual" || chosenBusiness.branches.length > 0) ? chosenBusiness : businesses.find((item) => item.type === "individual" || item.branches.length > 0);
  if (!business) return null;
  const branch = business.type === "individual" ? undefined : business.branches.find((item) => item.id === selected?.branchId) ?? business.branches[0];
  return { businessId: business.id, businessName: business.name, branchId: branch?.id ?? business.id, branchName: branch?.name ?? business.name, type: business.type };
}

export function hydrateActiveContext(session: BusinessSession, businessId: string, branchId: string): void {
  serverSelections.set(session.id, { businessId, branchId });
  window.dispatchEvent(new Event(changeEvent));
}

export function clearServerBusinessContext(sessionId: string): void {
  serverSelections.delete(sessionId);
  window.dispatchEvent(new Event(changeEvent));
}

export async function selectActiveContext(session: BusinessSession, businessId: string, branchId: string): Promise<boolean> {
  const business = readBusinesses(session).find((item) => item.id === businessId);
  if (!business || (business.type === "individual" ? branchId !== business.id : !business.branches.some((item) => item.id === branchId))) return false;
  try {
    await saveBusinessContext(businessId, business.type === "individual" ? business.primaryBranchId ?? "" : branchId);
    hydrateActiveContext(session, businessId, branchId);
  }
  catch { return false; }
  return true;
}

function subscribe(callback: () => void) {
  window.addEventListener(changeEvent, callback);
  return () => { window.removeEventListener(changeEvent, callback); };
}

export function useActiveBusinessContext(session: BusinessSession) {
  useSyncExternalStore(subscribe, () => {
    const selected = serverSelections.get(session.id);
    const businesses = readBusinesses(session);
    return `${selected?.businessId ?? ""}:${selected?.branchId ?? ""}:${businesses.map((business) => `${business.id}:${business.name}:${business.currencyCode ?? ""}:${business.branches.map((branch) => `${branch.id}:${branch.name}`).join(",")}`).join("|")}`;
  }, () => "");
  return resolveActiveContext(session);
}
