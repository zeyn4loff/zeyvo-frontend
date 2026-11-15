import { useEffect, useState } from "react";

export interface ProfileCity { id: number; name: string; regionId?: number | null; timeZone?: string | null }
export interface ProfileRegion { id: number; name: string; code?: string | null; timeZone?: string | null }
export interface ProfileCountry { code: string; name: string; flag: string | null; currencyCode?: string | null; currencySymbol?: string | null; timeZone?: string | null; regions?: ProfileRegion[]; cities: ProfileCity[] }

type State = { status: "loading" | "ready" | "error"; countries: ProfileCountry[] };

export function useProfileLocations() {
  const [state, setState] = useState<State>({ status: "loading", countries: [] });
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/v1/locations", { headers: { Accept: "application/json" }, signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("locations unavailable");
        const result = await response.json() as { success: boolean; data?: { countries?: ProfileCountry[] } };
        if (!result.success || !Array.isArray(result.data?.countries)) throw new Error("invalid locations");
        if (!controller.signal.aborted) setState({ status: "ready", countries: result.data.countries });
      })
      .catch(() => { if (!controller.signal.aborted) setState({ status: "error", countries: [] }); });
    return () => controller.abort();
  }, []);
  return state;
}
