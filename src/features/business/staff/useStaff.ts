import { useEffect, useState } from "react";
import type { BusinessSession } from "../auth/businessSession";
import { useActiveBusinessContext } from "../directory/activeContext";
import { fetchStaff } from "./staffApi";
import { setServerStaffData, type StaffData } from "./staff";

export function useStaff(session: BusinessSession) {
  const [data, setData] = useState<StaffData>({ roles: [], members: [] });
  const businessId = useActiveBusinessContext(session)?.businessId;
  const [loadedBusinessId, setLoadedBusinessId] = useState<string>();
  const [error, setError] = useState("");

  async function refresh(): Promise<void> {
    if (!businessId) return;
    const next = await fetchStaff(businessId);
    setServerStaffData(session.id, businessId, next);
    setData(next);
    setLoadedBusinessId(businessId);
    setError("");
  }

  useEffect(() => {
    if (!businessId) return;
    let cancelled = false;
    fetchStaff(businessId).then((next) => {
      if (cancelled) return;
      setServerStaffData(session.id, businessId, next);
      setData(next);
      setLoadedBusinessId(businessId);
      setError("");
    }).catch((cause) => {
      if (!cancelled) { setLoadedBusinessId(businessId); setError(cause instanceof Error ? cause.message : "Ustalar yüklənmədi."); }
    });
    return () => { cancelled = true; };
  }, [session, businessId]);

  return { data: loadedBusinessId !== businessId ? { roles: [], members: [] } : data, refresh, error, loading: !!businessId && loadedBusinessId !== businessId };
}
