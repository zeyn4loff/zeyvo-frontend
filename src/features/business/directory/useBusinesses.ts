import { useEffect, useState } from "react";
import type { BusinessSession } from "../auth/businessSession";
import { hasLoadedBusinesses, readBusinesses, setServerBusinesses, type Business } from "./businesses";
import { fetchBusinesses } from "./businessDirectoryApi";

export function useBusinesses(session: BusinessSession) {
  const [businesses, setBusinesses] = useState<Business[]>(() => readBusinesses(session));
  const [loading, setLoading] = useState(() => !hasLoadedBusinesses(session));
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetchBusinesses().then((items) => {
      if (!active) return;
      setServerBusinesses(session.id, items);
      setBusinesses(items);
      setError("");
    }).catch((issue) => {
      if (active) setError(issue instanceof Error ? issue.message : "Bizneslər yüklənmədi.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [session.id]);

  useEffect(() => {
    const sync = () => setBusinesses(readBusinesses(session));
    window.addEventListener("zeyvo-business-context-change", sync);
    return () => window.removeEventListener("zeyvo-business-context-change", sync);
  }, [session]);

  function update(next: Business[]) {
    setServerBusinesses(session.id, next);
    setBusinesses(next);
    return true;
  }

  return { businesses, update, loading, error };
}
