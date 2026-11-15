import { useEffect, useState } from "react";
import type { BusinessSession } from "../auth/businessSession";
import type { MarketingData } from "./marketing";
import { useActiveBusinessContext } from "../directory/activeContext";
import { fetchMarketing } from "./marketingApi";

const emptyMarketing: MarketingData = { campaigns: [], promos: [], segments: [], referral: { enabled: false, referrerReward: 10, refereeDiscount: 15, minOrder: 25 }, reviews: [] };

export function useMarketing(session: BusinessSession) {
  const activeContext = useActiveBusinessContext(session);
  const businessId = activeContext?.businessId ?? null;
  const [data, setData] = useState<MarketingData>(emptyMarketing);
  const [loadedBusinessId, setLoadedBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!businessId) return;
    let active = true;
    queueMicrotask(() => { if (active) setLoading(true); });
    fetchMarketing(businessId).then((next) => { if (active) { setData(next); setLoadedBusinessId(businessId); setError(""); } }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Marketinq məlumatları yüklənmədi."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [businessId]);
  function update(next: MarketingData) { setData(next); return true; }
  return { data: loadedBusinessId !== businessId ? emptyMarketing : data, update, loading, error, businessId };
}
