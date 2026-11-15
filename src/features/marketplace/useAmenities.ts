import { useEffect, useState } from "react";
import { useLanguage } from "@/features/locale/language";
import { branchAmenityOptions } from "./amenities";

export type AmenityOption = { code: string; name: string };

export function useAmenities(fromServer: boolean) {
  const { language } = useLanguage();
  const [options, setOptions] = useState<AmenityOption[]>(fromServer ? [] : branchAmenityOptions.map((name) => ({ code: name, name })));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!fromServer) return;
    const controller = new AbortController();
    fetch("/api/v1/amenities", {
      headers: { Accept: "application/json", "Accept-Language": language },
      signal: controller.signal,
    }).then(async (response) => {
      if (!response.ok) throw new Error("Filial imkanları yüklənmədi.");
      const result = await response.json() as { success: boolean; data?: { amenities: AmenityOption[] } };
      if (!result.success || !Array.isArray(result.data?.amenities)) throw new Error("Filial imkanları yüklənmədi.");
      setOptions(result.data.amenities);
      setError("");
    }).catch((issue: unknown) => {
      if (!controller.signal.aborted) setError(issue instanceof Error ? issue.message : "Filial imkanları yüklənmədi.");
    });
    return () => controller.abort();
  }, [fromServer, language]);

  return { options, error };
}
