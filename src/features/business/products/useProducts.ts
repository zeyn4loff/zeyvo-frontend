import { useEffect, useState } from "react";
import type { BusinessSession } from "../auth/businessSession";
import type { ProductData } from "./products";
import { useActiveBusinessContext } from "../directory/activeContext";
import { fetchInventory } from "./inventoryApi";
export function useProducts(session: BusinessSession) {
  const emptyData = (): ProductData => ({ categories: [], warehouses: [], products: [], operations: [], inventories: [], suppliers: [], techCards: [] });
  const [data, setData] = useState<ProductData>(emptyData);
  const activeContext = useActiveBusinessContext(session);
  const businessId = activeContext?.businessId;
  const [loadedBusinessId, setLoadedBusinessId] = useState<string | undefined>(undefined);
  const [error, setError] = useState("");
  const visibleData = loadedBusinessId !== businessId ? emptyData() : data;
  async function refresh() {
    if (!businessId) return;
    setData(await fetchInventory(businessId));
    setLoadedBusinessId(businessId);
    setError("");
  }
  useEffect(() => {
    if (!businessId) return;
    let cancelled = false;
    fetchInventory(businessId).then((inventory) => { if (!cancelled) { setData(inventory); setLoadedBusinessId(businessId); setError(""); } }).catch((cause) => { if (!cancelled) { setData(emptyData()); setLoadedBusinessId(businessId); setError(cause instanceof Error ? cause.message : "Məhsullar yüklənmədi."); } });
    return () => { cancelled = true; };
  }, [session, businessId]);
  useEffect(() => {
    const onSale = () => {
      if (businessId) {
        fetchInventory(businessId).then((inventory) => { setData(inventory); setLoadedBusinessId(businessId); setError(""); }).catch((cause) => { setError(cause instanceof Error ? cause.message : "Məhsullar yenilənmədi."); });
      }
    };
    window.addEventListener("zeyvo-pos-sale", onSale);
    return () => window.removeEventListener("zeyvo-pos-sale", onSale);
  }, [session, businessId]);
  return { data: visibleData, refresh, error, loading: !!businessId && loadedBusinessId !== businessId };
}
