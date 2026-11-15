import { useEffect, useState } from "react";
import type { BusinessSession } from "../auth/businessSession";
import { useActiveBusinessContext } from "../directory/activeContext";
import { fetchServices } from "./serviceApi";
import { setServerServiceData, type ServiceData } from "./services";

export function useServices(session: BusinessSession) {
  const [data, setData] = useState<ServiceData>({ categories: [], services: [] });
  const businessId = useActiveBusinessContext(session)?.businessId;
  const [loadedBusinessId, setLoadedBusinessId] = useState<string | undefined>();
  const [error, setError] = useState("");
  const visibleData = loadedBusinessId !== businessId
    ? { categories: [], services: [] } : data;

  async function refresh(): Promise<void> {
    if (!businessId) return;
    const next = await fetchServices(businessId);
    setServerServiceData(session.id, businessId, next);
    setData(next);
    setLoadedBusinessId(businessId);
    setError("");
  }

  useEffect(() => {
    if (!businessId) return;
    let cancelled = false;
    fetchServices(businessId).then((next) => {
      if (cancelled) return;
      setServerServiceData(session.id, businessId, next);
      setData(next);
      setLoadedBusinessId(businessId);
      setError("");
    }).catch((cause) => {
      if (!cancelled) { setLoadedBusinessId(businessId); setError(cause instanceof Error ? cause.message : "Xidmətlər yüklənmədi."); }
    });
    return () => { cancelled = true; };
  }, [session, businessId]);

  return { data: visibleData, refresh, error, loading: !!businessId && loadedBusinessId !== businessId };
}
