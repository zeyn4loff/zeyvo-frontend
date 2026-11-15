import { createContext, useContext } from "react";

export type Audience = "customer" | "partner";
export interface SiteBranding { audience: Audience; logo_url: string | null; favicon_url: string | null; description: string | null }
export const BrandingContext = createContext<Partial<Record<Audience, SiteBranding>>>({});

export function useSiteBranding(audience: Audience): SiteBranding | null {
  return useContext(BrandingContext)[audience] ?? null;
}
