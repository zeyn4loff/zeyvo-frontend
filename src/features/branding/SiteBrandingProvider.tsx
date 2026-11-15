import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router";
import { useLanguage, type Language } from "@/features/locale/language";
import { BrandingContext, useSiteBranding, type Audience, type SiteBranding } from "./siteBrandingContext";

interface BrandingState { language: Language; brandings: Partial<Record<Audience, SiteBranding>> }

async function fetchBranding(audience: Audience, language: Language, signal: AbortSignal): Promise<SiteBranding | null> {
  try {
    const response = await fetch(`/api/v1/site/branding/${audience}`, { headers: { Accept: "application/json", "Accept-Language": language }, signal });
    const envelope = await response.json();
    return response.ok && envelope.success ? envelope.data as SiteBranding : null;
  } catch { return null; }
}

function SiteFavicon() {
  const { pathname } = useLocation();
  const audience: Audience = pathname.startsWith("/partner") || pathname.startsWith("/business") ? "partner" : "customer";
  const branding = useSiteBranding(audience);
  useEffect(() => {
    let icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!branding?.favicon_url) { icon?.remove(); return; }
    if (!icon) { icon = document.createElement("link"); icon.rel = "icon"; document.head.appendChild(icon); }
    icon.href = branding.favicon_url;
  }, [branding?.favicon_url]);
  return null;
}

export function SiteBrandingProvider({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  const [state, setState] = useState<BrandingState>({ language, brandings: {} });
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([fetchBranding("customer", language, controller.signal), fetchBranding("partner", language, controller.signal)])
      .then(([customer, partner]) => {
        if (!controller.signal.aborted) setState({ language, brandings: { ...(customer ? { customer } : {}), ...(partner ? { partner } : {}) } });
      });
    return () => controller.abort();
  }, [language]);
  return <BrandingContext.Provider value={state.language === language ? state.brandings : {}}><SiteFavicon />{children}</BrandingContext.Provider>;
}

