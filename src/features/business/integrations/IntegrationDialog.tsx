import { useState } from "react";
import BusinessEntryDialog from "../components/BusinessEntryDialog";
import { BusinessTabButton, BusinessTabRail } from "../components/BusinessTabs";
import type { IntegrationsData, IntegrationReview } from "./integrations";
import type { BusinessSession } from "../auth/businessSession";
import IntegrationReviewsPanel from "./IntegrationReviewsPanel";
import WhatsAppConnectionPanel from "./WhatsAppConnectionPanel";
import IntegrationLogo from "./IntegrationLogo";
import type { CatalogIntegration } from "./integrationCatalogApi";
import LocalizedText from "@/features/locale/LocalizedText";
import { useCustomerText } from "@/features/locale/customerText";


type Tab = "connect" | "security" | "reviews";
export default function IntegrationDialog({ integration, data, session, businessId, initialTab, onClose, onAddReview, onStateChange }: { integration: CatalogIntegration; data: IntegrationsData; session: BusinessSession; businessId: string; initialTab: Tab; onClose: () => void; onAddReview: (review: IntegrationReview) => Promise<boolean>; onStateChange?: (state: string) => void }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const translateUi = useCustomerText();
  return <BusinessEntryDialog title={integration.name} description={integration.subtitle ?? integration.description ?? undefined} headerIcon={<IntegrationLogo size="header" icon={integration.icon} label={integration.name} />} onClose={onClose} width="large" scrollContent bodyPadding={false}>
    <div className="shrink-0 overflow-x-auto border-b border-slate-100 px-5 py-3 sm:px-7" aria-label={`${integration.name} ${translateUi("bölmələri")}`}><BusinessTabRail centered>{([{ id: "connect", label: "Qoşulma" }, { id: "security", label: "Təhlükəsizlik və tövsiyələr" }, { id: "reviews", label: "Rəylər və qiymət" }] as const).filter((item) => integration.connection_driver === "whatsapp" || item.id === "security").map((item) => <BusinessTabButton key={item.id} active={tab === item.id} onClick={() => { setTab(item.id);  }}><LocalizedText value={item.label} />{item.id === "reviews" ? ` (${data.reviews.length})` : ""}</BusinessTabButton>)}</BusinessTabRail></div>
    <div className="min-h-0 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
      {tab === "connect" && integration.connection_driver === "whatsapp" && <WhatsAppConnectionPanel businessId={businessId} onStateChange={onStateChange} />}
      {tab === "security" && <div className="space-y-3">{integration.security_title && <h3 className="text-base font-bold">{integration.security_title}</h3>}{integration.security_items.map((item, index) => <article key={`${index}-${item.title}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><h4 className="font-bold"><LocalizedText value={item.title} /></h4><p className="mt-1 text-sm leading-6 text-slate-600">{item.body}</p></article>)}</div>}
      {tab === "reviews" && integration.connection_driver === "whatsapp" && <IntegrationReviewsPanel reviews={data.reviews} session={session} onAdd={onAddReview} />}
    </div></BusinessEntryDialog>;
}
