import { publicData } from "../api/client";

export interface CatalogIntegration {
  slug: string;
  category: string;
  icon: string | null;
  name: string;
  subtitle: string | null;
  description: string | null;
  features: string[];
  security_title: string | null;
  security_items: { title: string; body: string }[];
  connection_driver: "whatsapp" | null;
}

export async function fetchIntegrationCatalog(signal?: AbortSignal): Promise<CatalogIntegration[]> {
  const data = await publicData<{ integrations?: CatalogIntegration[] }>("/api/v1/integrations", "İnteqrasiyalar yüklənmədi.", signal);
  return data.integrations ?? [];
}
