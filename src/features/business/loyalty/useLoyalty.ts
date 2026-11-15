import { useEffect, useState } from "react";
import type { BusinessSession } from "../auth/businessSession";
import { useActiveBusinessContext } from "../directory/activeContext";
import type { LoyaltyData, LoyaltyProgram } from "./loyalty";
import { deleteLoyaltyTemplate, fetchLoyalty, issueLoyalty, redeemLoyalty, saveLoyaltyProgram, saveLoyaltyTemplate, type LoyaltyEntry, type LoyaltyIssueRecord } from "./loyaltyApi";

const empty: LoyaltyData = { rules: [], giftCards: [], subscriptions: [] };
export function useLoyalty(session: BusinessSession) {
  const businessId = useActiveBusinessContext(session)?.businessId;
  const [data, setData] = useState<LoyaltyData>(empty);
  const [issues, setIssues] = useState<LoyaltyIssueRecord[]>([]);
  const [loadedBusinessId, setLoadedBusinessId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function refresh() {
    if (!businessId) return;
    const next = await fetchLoyalty(businessId);
    setData(next); setIssues(next.issues ?? []); setLoadedBusinessId(businessId); setError(""); setLoading(false);
  }
  useEffect(() => {
    if (!businessId) return;
    let cancelled = false;
    fetchLoyalty(businessId).then((next) => { if (!cancelled) { setData(next); setIssues(next.issues ?? []); setLoadedBusinessId(businessId); setError(""); setLoading(false); } })
      .catch((cause) => { if (!cancelled) { setError(cause instanceof Error ? cause.message : "Loyallıq məlumatları yüklənmədi."); setLoading(false); } });
    return () => { cancelled = true; };
  }, [session, businessId]);
  function update(next: LoyaltyData): boolean { setData(next); return true; }
  async function saveEntry(kind: "rule" | "gift_card" | "subscription", item: LoyaltyEntry, existing: boolean): Promise<boolean> {
    if (!businessId) return false;
    try { await saveLoyaltyTemplate(businessId, kind, item, existing); await refresh(); return true; } catch (cause) { setError(cause instanceof Error ? cause.message : "Yadda saxlamaq mümkün olmadı."); return false; }
  }
  async function removeEntry(_kind: "rule" | "gift_card" | "subscription", id: string): Promise<boolean> {
    if (!businessId) return false;
    try { await deleteLoyaltyTemplate(businessId, id); await refresh(); return true; } catch (cause) { setError(cause instanceof Error ? cause.message : "Silmək mümkün olmadı."); return false; }
  }
  async function saveProgram(program: LoyaltyProgram): Promise<boolean> { if (!businessId) return false; try { await saveLoyaltyProgram(businessId, program); await refresh(); return true; } catch (cause) { setError(cause instanceof Error ? cause.message : "Ayarlar saxlanılmadı."); return false; } }
  async function issue(templateId: string, clientId: string): Promise<boolean> { if (!businessId) return false; try { await issueLoyalty(businessId, templateId, clientId); await refresh(); return true; } catch (cause) { setError(cause instanceof Error ? cause.message : "Kart verilmədi."); return false; } }
  async function redeem(issueId: string, amount: number, note: string, serviceId?: string): Promise<boolean> { if (!businessId) return false; try { await redeemLoyalty(businessId, issueId, amount, note, serviceId); await refresh(); return true; } catch (cause) { setError(cause instanceof Error ? cause.message : "Əməliyyat alınmadı."); return false; } }
  const ready = Boolean(businessId) && loadedBusinessId === businessId;
  return { data: ready ? data : empty, issues: ready ? issues : [], update, saveEntry, removeEntry, saveProgram, issue, redeem, refresh, loading: businessId && !ready ? true : loading && Boolean(businessId), error };
}
