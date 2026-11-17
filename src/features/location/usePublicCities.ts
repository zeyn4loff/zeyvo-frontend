import { useEffect, useState } from "react";
import { useLanguage } from "@/features/locale/language";

type CityState = { status: "loading" | "ready" | "error"; cities: { name: string; canonicalName: string; id: number }[] };

export function usePublicCities(): CityState {
  const { language } = useLanguage();
  const [state, setState] = useState<CityState>({ status: "loading", cities: [] });

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/v1/locations", { headers: { Accept: "application/json", "Accept-Language": language }, signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("locations unavailable");
        const result = await response.json() as { success?: boolean; data?: { countries?: { cities?: { id: number; name: string; canonicalName: string }[] }[] } };
        if (!result.success || !Array.isArray(result.data?.countries)) throw new Error("invalid locations");
        const cities = result.data.countries.flatMap((country) => country.cities ?? []);
        if (!controller.signal.aborted) setState({ status: "ready", cities });
      })
      .catch(() => { if (!controller.signal.aborted) setState({ status: "error", cities: [] }); });
    return () => controller.abort();
  }, [language]);

  return state;
}
