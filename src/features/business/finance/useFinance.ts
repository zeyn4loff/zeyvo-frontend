import { useCallback, useEffect, useState } from "react";
import type { BusinessSession } from "../auth/businessSession";
import { useActiveBusinessContext } from "../directory/activeContext";
import type { FinanceData } from "./finance";
import { deleteFinanceRecord, fetchFinance, runFinanceAction, saveFinanceRecord } from "./financeApi";

type FinanceCollection = "accounts" | "categories" | "transactions" | "payroll" | "shifts";

export function useFinance(session: BusinessSession) {
  const businessId = useActiveBusinessContext(session)?.businessId;
  const [data, setData] = useState<FinanceData>({ accounts: [], categories: [], transactions: [], payroll: [], shifts: [] });
  const [loading, setLoading] = useState(true);
  const [loadedBusinessId, setLoadedBusinessId] = useState<string | undefined>();
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!businessId) { setLoading(false); setError("Əvvəlcə biznes seçin."); return; }
    try { setData(await fetchFinance(businessId)); setLoadedBusinessId(businessId); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Maliyyə məlumatları yüklənmədi."); }
    finally { setLoading(false); }
  }, [businessId]);

  useEffect(() => {
    const task = window.setTimeout(() => { void refresh(); }, 0);
    window.addEventListener("zeyvo-pos-sale", refresh);
    return () => { window.clearTimeout(task); window.removeEventListener("zeyvo-pos-sale", refresh); };
  }, [refresh]);

  async function update(next: FinanceData): Promise<string | null> {
    if (!businessId) return "Əvvəlcə biznes seçin.";
    try {
      let result: FinanceData | undefined;
      for (const resource of ["accounts", "categories", "transactions", "payroll", "shifts"] as FinanceCollection[]) {
        const before = data[resource] as Array<{ id: string }>;
        const after = next[resource] as Array<{ id: string }>;
        if (JSON.stringify(before) === JSON.stringify(after)) continue;
        const added = after.find((entry) => !before.some((old) => old.id === entry.id));
        const removed = before.find((old) => !after.some((entry) => old.id === entry.id));
        const changed = after.find((entry) => before.some((old) => old.id === entry.id && JSON.stringify(old) !== JSON.stringify(entry)));
        if (resource === "shifts") {
          if (added) result = await runFinanceAction(businessId, "shift-open", added as Record<string, unknown>);
          else if (changed) result = await runFinanceAction(businessId, "shift-close", { shiftId: changed.id, actualCash: (changed as { actualCash?: number }).actualCash, note: (changed as { note?: string }).note });
        } else if (resource === "transactions" && added && (added as { payrollId?: string }).payrollId) {
          const payment = added as unknown as { payrollId: string; accountId: string; amount: number; date: string; note: string; title: string };
          result = await runFinanceAction(businessId, "payroll-payment", { payrollId: payment.payrollId, accountId: payment.accountId, amount: payment.amount, date: payment.date, note: payment.note, paymentType: payment.title.startsWith("Avans") ? "advance" : payment.title.startsWith("Bonus") ? "bonus" : "salary" });
        } else if (added) result = await saveFinanceRecord(businessId, resource, null, added as Record<string, unknown>);
        else if (removed) result = await deleteFinanceRecord(businessId, resource, removed.id);
        else if (changed) result = await saveFinanceRecord(businessId, resource, changed.id, changed as Record<string, unknown>);
        break;
      }
      if (!result) return "Dəyişiklik tapılmadı.";
      setData(result);
      setError("");
      return null;
    } catch (cause) { return cause instanceof Error ? cause.message : "Dəyişiklik saxlanmadı."; }
  }

  return { data, update, loading: loading || (loadedBusinessId !== businessId && !error), error, refresh };
}
