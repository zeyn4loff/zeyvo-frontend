import { useEffect, useState } from "react";
import { Check, Link2, Search, Star } from "lucide-react";
import { useLanguage } from "@/features/locale/language";
import type { BusinessSession } from "../auth/businessSession";
import BusinessHeaderPortal from "../components/BusinessHeaderPortal";
import { BusinessTabButton, BusinessTabNav } from "../components/BusinessTabs";
import IntegrationDialog from "./IntegrationDialog";
import IntegrationLogo from "./IntegrationLogo";
import { useActiveBusinessContext } from "../directory/activeContext";
import { fetchIntegrationReviews, fetchWhatsApp, saveIntegrationReview } from "./integrationApi";
import type { IntegrationReview } from "./integrations";
import { fetchIntegrationCatalog, type CatalogIntegration } from "./integrationCatalogApi";

const categoryLabels: Record<string, string> = { notifications: "Bildirişlər", calendar: "Təqvim", payments: "Ödənişlər", other: "Digər" };

type DialogTab = "connect" | "security" | "reviews";

function IntegrationCard({ integration, reviewCount, rating, state, onOpen }: { integration: CatalogIntegration; reviewCount: number; rating: string | null; state: string; onOpen: (tab: DialogTab) => void }) {
  const isWhatsApp = integration.connection_driver === "whatsapp";
  return <article className="flex min-w-0 flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm sm:p-6">
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <IntegrationLogo icon={integration.icon} label={integration.name} />
        <div className="flex flex-wrap items-center gap-1.5"><span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">{isWhatsApp ? state === "open" ? "Qoşulub" : "Qoşulmayıb" : "Tezliklə"}</span></div>
      </div>
      <div><h2 className="text-sm font-bold leading-tight text-slate-900 sm:text-base">{integration.name}</h2>{integration.subtitle && <p className="mt-0.5 text-[11px] font-medium text-slate-400">{integration.subtitle}</p>}</div>
      {integration.description && <p className="text-xs leading-relaxed text-slate-600">{integration.description}</p>}
      {isWhatsApp && <div className="flex items-center gap-1.5 text-xs text-slate-700"><Star size={14} className="text-amber-500" fill={rating ? "currentColor" : "none"} /><span className="font-semibold">{rating ?? "—"}</span><button type="button" onClick={() => onOpen("reviews")} className="cursor-pointer text-slate-500 underline underline-offset-2 hover:text-slate-900">({reviewCount} rəy)</button></div>}
      <ul className="space-y-1 border-t border-slate-100 pt-3">{integration.features.map((feature) => <li key={feature} className="flex items-center gap-1.5 text-[11px] text-slate-600"><Check size={13} className="shrink-0 text-emerald-600" />{feature}</li>)}</ul>
    </div>
    <div className="flex gap-2 border-t border-slate-100 pt-3">{isWhatsApp ? <><button type="button" onClick={() => onOpen("connect")} className="flex min-h-10 min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-brand-primary px-3 text-xs font-bold text-slate-900 hover:bg-lime-400"><Link2 size={15} />Qoşulma statusu</button><button type="button" onClick={() => onOpen("reviews")} className="min-h-10 cursor-pointer rounded-xl bg-slate-100 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-200">Rəy</button></> : <button type="button" onClick={() => onOpen("security")} className="min-h-10 flex-1 cursor-pointer rounded-xl bg-slate-100 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-200">Ətraflı</button>}</div>
  </article>;
}

export default function BusinessIntegrations({ session }: { session: BusinessSession }) {
  const { language } = useLanguage();
  const [catalog, setCatalog] = useState<CatalogIntegration[]>([]);
  const [catalogError, setCatalogError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetchIntegrationCatalog(controller.signal).then((items) => { setCatalog(items); setCatalogError(false); }).catch(() => { if (!controller.signal.aborted) setCatalogError(true); });
    return () => controller.abort();
  }, [language]);
  const activeBusiness = useActiveBusinessContext(session);
  const businessId = activeBusiness?.businessId ?? "";
  const [connectionState, setConnectionState] = useState("not_created");
  useEffect(() => { if (!businessId) return; fetchWhatsApp(businessId).then((result) => setConnectionState(result.state)).catch(() => setConnectionState("unknown")); }, [businessId]);
  const [serverReviews, setServerReviews] = useState<IntegrationReview[]>([]);
  useEffect(() => { if (!businessId) return; fetchIntegrationReviews(businessId).then(setServerReviews).catch(() => setServerReviews([])); }, [businessId]);
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<{ integration: CatalogIntegration; tab: DialogTab } | null>(null);
  const reviews = serverReviews;
  const ratedReviews = reviews.filter((review) => review.rating > 0);
  const rating = ratedReviews.length ? (ratedReviews.reduce((sum, review) => sum + review.rating, 0) / ratedReviews.length).toFixed(1) : null;
  const categories = [...new Set(catalog.map((item) => item.category))];
  const visible = catalog.filter((item) => (category === "all" || item.category === category) && `${item.name} ${item.description ?? ""}`.toLocaleLowerCase(language).includes(query.trim().toLocaleLowerCase(language)));

  async function addReview(review: IntegrationReview): Promise<boolean> {
    if (!businessId) return false;
    try { setServerReviews(await saveIntegrationReview(businessId, review.rating, review.comment)); return true; }
    catch { return false; }
  }

  return <main className="mx-auto max-w-7xl space-y-6 px-4 py-5 sm:px-7 sm:py-7">
    <BusinessHeaderPortal slot="subtitle">İnteqrasiyalar kataloqu və bağlantı ayarları</BusinessHeaderPortal>
    <BusinessTabNav label="İnteqrasiya bölmələri"><BusinessTabButton active={category === "all"} count={catalog.length} onClick={() => setCategory("all")}>Bütün xidmətlər</BusinessTabButton>{categories.map((item) => <BusinessTabButton key={item} active={category === item} count={catalog.filter((integration) => integration.category === item).length} onClick={() => setCategory(item)}>{categoryLabels[item] ?? item}</BusinessTabButton>)}</BusinessTabNav>
    <label className="business-search-control flex min-h-11 w-full items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 shadow-sm focus-within:border-slate-400"><Search size={17} className="shrink-0 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="İnteqrasiya axtar" placeholder="İnteqrasiya axtar..." className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label>
    {visible.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visible.map((integration) => <IntegrationCard key={integration.slug} integration={integration} reviewCount={integration.connection_driver === "whatsapp" ? reviews.length : 0} rating={integration.connection_driver === "whatsapp" ? rating : null} state={connectionState} onOpen={(tab) => setDialog({ integration, tab })} />)}</div> : <section className="flex min-h-56 flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white px-4 py-8 text-center shadow-sm sm:min-h-64 sm:py-10"><span className="flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"><Search size={23} strokeWidth={1.8} /></span><h2 className="mt-3 text-base font-bold text-slate-900">{catalogError ? "İnteqrasiyaları yükləmək mümkün olmadı" : "İnteqrasiya tapılmadı"}</h2><p className="mt-1 max-w-sm text-sm text-slate-500">{catalogError ? "Səhifəni yeniləyin və bir daha yoxlayın." : "Axtarış sözünü dəyişin və yenidən yoxlayın."}</p></section>}
    {dialog && <IntegrationDialog integration={dialog.integration} data={{ reviews }} session={session} businessId={businessId} initialTab={dialog.tab} onClose={() => setDialog(null)} onAddReview={addReview} onStateChange={setConnectionState} />}
  </main>;
}
