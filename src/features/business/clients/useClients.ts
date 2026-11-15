import { useEffect, useState } from "react";
import type { BusinessSession } from "../auth/businessSession";
import { useActiveBusinessContext } from "../directory/activeContext";
import { deleteClientRecord, fetchClients, saveClientRecord } from "./clientsApi";
import { cacheServerClients, type Client } from "./clients";

export function useClients(session: BusinessSession) {
  const businessId = useActiveBusinessContext(session)?.businessId;
  const [clients, setClients] = useState<Client[]>([]);
  const [loadedBusinessId, setLoadedBusinessId] = useState<string>();
  const [error, setError] = useState("");

  async function refresh(): Promise<void> {
    if (!businessId) return;
    const next = await fetchClients(businessId);
    cacheServerClients(session.id, businessId, next);
    setClients(next);
    setLoadedBusinessId(businessId);
    setError("");
  }

  useEffect(() => {
    if (!businessId) return;
    let cancelled = false;
    fetchClients(businessId).then((next) => {
      if (!cancelled) { cacheServerClients(session.id, businessId, next); setClients(next); setLoadedBusinessId(businessId); setError(""); }
    }).catch((cause) => {
      if (!cancelled) { setLoadedBusinessId(businessId); setError(cause instanceof Error ? cause.message : "Müştərilər yüklənmədi."); }
    });
    return () => { cancelled = true; };
  }, [session, businessId]);

  useEffect(() => {
    const refreshAfterSale = () => { void refresh(); };
    window.addEventListener("zeyvo-pos-sale", refreshAfterSale);
    return () => window.removeEventListener("zeyvo-pos-sale", refreshAfterSale);
  });

  async function save(item: Client): Promise<boolean> {
    if (!businessId) { setError("Biznes seçilməyib."); return false; }
    try {
      const saved = await saveClientRecord(businessId, item, clients.some((old) => old.id === item.id));
      setClients((current) => { const next = current.some((old) => old.id === saved.id) ? current.map((old) => old.id === saved.id ? saved : old) : [...current, saved]; cacheServerClients(session.id, businessId, next); return next; });
      setError("");
      return true;
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Müştəri saxlanmadı."); return false; }
  }

  async function remove(id: string): Promise<boolean> {
    if (!businessId) { setError("Biznes seçilməyib."); return false; }
    try { await deleteClientRecord(businessId, id); setClients((current) => { const next = current.filter((item) => item.id !== id); cacheServerClients(session.id, businessId, next); return next; }); setError(""); return true; }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Müştəri silinmədi."); return false; }
  }

  return { clients: loadedBusinessId !== businessId ? [] : clients, save, remove, refresh, error, loading: !!businessId && loadedBusinessId !== businessId };
}
