import { useEffect, useState } from "react";
import type { BusinessSession } from "../auth/businessSession";
import { useActiveBusinessContext } from "../directory/activeContext";
import { fetchResources } from "./resourceApi";
import { setServerResourceData, type ResourceData } from "./resources";

export function useResources(session: BusinessSession) {
  const [data, setData] = useState<ResourceData>({ categories: [], resources: [] });
  const context = useActiveBusinessContext(session);
  const businessId = context?.businessId;
  const [loadedBusinessId, setLoadedBusinessId] = useState<string | undefined>();
  const [error, setError] = useState("");
  const empty: ResourceData = { categories: [], resources: [] };
  const visibleData = loadedBusinessId !== businessId ? empty : data;

  async function refresh() {
    if (!businessId) return;
    const next = await fetchResources(businessId);
    setServerResourceData(session.id, businessId, next);
    setData(next);
    setLoadedBusinessId(businessId);
    setError("");
  }

  useEffect(() => {
    if (!businessId) return;
    let cancelled = false;
    fetchResources(businessId).then((next) => {
      if (cancelled) return;
      setServerResourceData(session.id, businessId, next);
      setData(next);
      setLoadedBusinessId(businessId);
      setError("");
    }).catch((cause) => {
      if (!cancelled) { setLoadedBusinessId(businessId); setError(cause instanceof Error ? cause.message : "Resurslar yüklənmədi."); }
    });
    return () => { cancelled = true; };
  }, [session, businessId]);

  return { data: visibleData, refresh, error, loading: !!businessId && loadedBusinessId !== businessId };
}
