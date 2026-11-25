import BusinessPageLoading from "../components/BusinessPageLoading";
import { showToast as setMessage } from "../../../components/common/toast";
import BusinessPagination from "../components/BusinessPagination";
import { useEffect, useState } from "react";
import BusinessFilterButton from "../components/BusinessFilterButton";
import { BadgeCheck, Clock3, Megaphone, Plus, Search, Send, Ticket, TrendingUp, Zap } from "lucide-react";
import type { BusinessSession } from "../auth/businessSession";
import BusinessDeleteDialog from "../components/BusinessDeleteDialog";
import BusinessHeaderPortal from "../components/BusinessHeaderPortal";
import BusinessHeaderButton from "../components/BusinessHeaderButton";
import { BusinessTabButton, BusinessTabNav } from "../components/BusinessTabs";
import MarketingDialog from "./MarketingDialog";
import MarketingTable from "./MarketingTable";
import CampaignReportDialog from "./CampaignReportDialog";
import MarketingSegments from "./MarketingSegments";
import MarketingMetrics, { type MarketingMetric } from "./MarketingMetrics";
import MarketingFilterDialog from "./MarketingFilterDialog";
import MarketingReferral from "./MarketingReferral";
import { type Campaign, type MarketingTab, type Promo, type ReferralSettings } from "./marketing";
import ReviewsPanel from "./ReviewsPanel";
import { updateMarketingReview } from "./marketingApi";
import { useMarketing } from "./useMarketing";
import { deleteMarketingRecord, fetchMarketing, saveMarketingRecord, saveMarketingReferral } from "./marketingApi";
import { fetchWhatsApp } from "../integrations/integrationApi";
import LocalizedText from "@/features/locale/LocalizedText";
import { useCustomerText } from "@/features/locale/customerText";
const tabs: { id: MarketingTab; label: string }[] = [{ id: "campaigns", label: "Kampaniyalar və bildirişlər" }, { id: "promocodes", label: "Promokodlar" }, { id: "segments", label: "Müştəri seqmentləri" }, { id: "referral", label: "Referal proqramı" }, { id: "reviews", label: "Rəylər və reputasiya" }];
export default function BusinessMarketing({ session }: { session: BusinessSession }) {
  const translateUi = useCustomerText();
  const { data, update, loading, error: loadError, businessId } = useMarketing(session);
  const [whatsAppState, setWhatsAppState] = useState("loading");
  useEffect(() => {
    if (!businessId) return;
    let active = true;
    fetchWhatsApp(businessId).then((connection) => { if (active) setWhatsAppState(connection.state); }).catch(() => { if (active) setWhatsAppState("unknown"); });
    return () => { active = false; };
  }, [businessId]);
  const [tab, setTab] = useState<MarketingTab>("campaigns");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [campaignType, setCampaignType] = useState("all");
  const [pageSize, setPageSize] = useState(10);
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Campaign | Promo | null | undefined>(undefined);
  const [campaignTarget, setCampaignTarget] = useState<Campaign["target"] | null>(null);
  const [deleting, setDeleting] = useState<Campaign | Promo | null>(null);
  const [reportCampaign, setReportCampaign] = useState<Campaign | null>(null);
  const list: (Campaign | Promo)[] = tab === "campaigns" ? data.campaigns : tab === "promocodes" ? data.promos : [];
  const filtered = list.filter((item) => (status === "all" || item.status === status) && (type === "all" || ("channel" in item ? item.channel === type : item.discountType === type)) && (campaignType === "all" || ("channel" in item && item.type === campaignType)) && (!query.trim() || `${item.name} ${"code" in item ? item.code : item.message}`.toLocaleLowerCase("az-AZ").includes(query.toLocaleLowerCase("az-AZ").trim())));
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const shown = filtered.slice((Math.min(page, totalPages) - 1) * pageSize, Math.min(page, totalPages) * pageSize);
  const segments = data.segments ?? [];
  const counts: Record<MarketingTab, number> = { campaigns: data.campaigns.filter((x) => x.status === "active").length, promocodes: data.promos.filter((x) => x.status === "active").length, segments: segments.length, referral: data.referral.referrers?.length ?? 0, reviews: data.reviews.length };
  async function save(item: Campaign | Promo): Promise<boolean> {
    try {
      const exists = "message" in item ? data.campaigns.some((x) => x.id === item.id) : data.promos.some((x) => x.id === item.id);
      const saved = await saveMarketingRecord(businessId ?? "", item, exists);
      if ("message" in saved) update({ ...data, campaigns: exists ? data.campaigns.map((x) => x.id === saved.id ? saved : x) : [saved, ...data.campaigns] });
      else update({ ...data, promos: exists ? data.promos.map((x) => x.id === saved.id ? saved : x) : [saved, ...data.promos] });
      setMessage(translateUi("message" in saved ? "Yadda saxlanıldı. Bildiriş göndərilmədi." : "Yadda saxlanıldı."));
      return true;
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : translateUi("Yadda saxlamaq mümkün olmadı.")); return false; }
  }
  async function remove() {
    if (!deleting) return;
    try {
      await deleteMarketingRecord(businessId ?? "", deleting);
      const next = "message" in deleting ? { ...data, campaigns: data.campaigns.filter((x) => x.id !== deleting.id) } : { ...data, promos: data.promos.filter((x) => x.id !== deleting.id) };
      update(next); setMessage(translateUi("Silindi.")); setDeleting(null);
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : translateUi("Silmək mümkün olmadı.")); }
  }
  async function saveReferral(next: ReferralSettings) {
    try { const saved = await saveMarketingReferral(businessId ?? "", next); update({ ...data, referral: saved }); setMessage(translateUi("Referal qaydaları saxlanıldı.")); }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : translateUi("Yadda saxlamaq mümkün olmadı.")); }
  }
  const metrics: MarketingMetric[] = tab === "campaigns" ? [
    { title: "Hazır kampaniyalar", value: data.campaigns.filter((x) => x.status === "active").length, unit: "ədəd", detail: "Göndəriş üçün hazırlanıb", icon: Megaphone, tone: "purple" },
    { title: "Göndərilən bildirişlər", value: data.campaigns.reduce((sum, item) => sum + (item.sentCount ?? 0), 0), unit: "ədəd", detail: "WhatsApp ilə göndərilib", icon: Send, tone: "emerald" },
    { title: "Çatdırılma faizi", value: `${Math.round(100 * data.campaigns.reduce((sum, item) => sum + (item.deliveredCount ?? 0), 0) / Math.max(1, data.campaigns.reduce((sum, item) => sum + (item.sentCount ?? 0), 0)))}%`, unit: "", detail: "Təsdiqlənmiş çatdırılma", icon: Send, tone: "blue" },
    { title: "Avtomatik kampaniyalar", value: data.campaigns.filter((x) => x.type === "automated").length, unit: "ədəd", detail: "Hazırlanmış avtomatik qaydalar", icon: Zap, tone: "amber" },
  ] : [
    { title: "Aktiv promokodlar", value: data.promos.filter((x) => x.status === "active").length, unit: "kod", detail: "İstifadəyə açıq kodlar", icon: Ticket, tone: "purple" },
    { title: "Cəmi istifadə", value: data.promos.reduce((sum, x) => sum + x.usedCount, 0), unit: "dəfə", detail: "Müştərilər tərəfindən tətbiq edilib", icon: BadgeCheck, tone: "emerald" },
    { title: "Maksimum limit", value: data.promos.reduce((sum, x) => sum + x.usageLimit, 0), unit: "ümumi", detail: "Müəyyən edilmiş ümumi kvota", icon: TrendingUp, tone: "blue" },
    { title: "Müddəti bitənlər", value: data.promos.filter((x) => x.status === "expired" || (x.endDate && x.endDate < new Date().toISOString().slice(0, 10))).length, unit: "kod", detail: "Vaxtı və ya limiti tamamlanıb", icon: Clock3, tone: "slate" },
  ];
  if (loading) return <BusinessPageLoading />;
  return <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 sm:px-7 sm:py-7">
    {loading && <p role="status" className="text-sm text-slate-500"><LocalizedText value={"Marketinq məlumatları yüklənir…"} /></p>}
    {loadError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{loadError}</p>}
    <BusinessHeaderPortal slot="subtitle"><LocalizedText value={"Kampaniyalar, bildirişlər, promokodlar, seqmentlər, referal və rəylər"} /></BusinessHeaderPortal>
    {(tab === "campaigns" || tab === "promocodes") && <BusinessHeaderPortal slot="actions"><BusinessHeaderButton onClick={() => setEditing(null)}><Plus />{translateUi(tab === "campaigns" ? "Yeni kampaniya" : "Yeni promokod")}</BusinessHeaderButton></BusinessHeaderPortal>}
    <BusinessTabNav label={translateUi("Marketinq bölmələri")}>{tabs.map((x) => <BusinessTabButton key={x.id} active={tab === x.id} count={counts[x.id]} onClick={() => { setTab(x.id); setQuery(""); setStatus("all"); setType("all"); setPage(1); setMessage(""); }}><LocalizedText value={x.label} /></BusinessTabButton>)}</BusinessTabNav>

    {(tab === "campaigns" || tab === "promocodes") && <>{tab === "campaigns" && <p role="status" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">{whatsAppState === "open" ? translateUi("WhatsApp qoşulub. Kampaniyanı siyahıdan göndərə və hesabatını izləyə bilərsiniz.") : translateUi("Göndəriş üçün WhatsApp bağlantısını inteqrasiyalar bölməsində qoşun.")}</p>}<MarketingMetrics items={metrics} /><div className="space-y-3"><div className="flex min-w-0 gap-2"><label className="business-search-control flex h-11 min-w-0 flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 shadow-sm"><Search size={16} className="shrink-0 text-slate-400" /><input aria-label={translateUi("Marketinq axtarışı")} value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder={tab === "campaigns" ? translateUi("Kampaniya adı və ya mətn ilə axtarın...") : translateUi("Promokod adı və ya təsviri ilə axtarın...")} className="min-w-0 flex-1 bg-transparent text-xs font-medium outline-none placeholder:text-slate-400" /></label><BusinessFilterButton onClick={() => setFilterOpen(true)} count={Number(status !== "all") + Number(type !== "all") + Number(campaignType !== "all")} /></div>{(query || status !== "all" || type !== "all" || campaignType !== "all") && <div className="flex flex-wrap items-center gap-2 text-[11px]"><span className="text-slate-400"><LocalizedText value={"Aktiv:"} /></span>{query && <button type="button" onClick={() => setQuery("")} className="rounded-xl bg-slate-100 px-2.5 py-1"><LocalizedText value={"Axtarış:"} /> {query} ×</button>}{type !== "all" && <button type="button" onClick={() => setType("all")} className="rounded-xl bg-amber-50 px-2.5 py-1">{translateUi(({ whatsapp: "WhatsApp", sms: "SMS", percent: "Faizlə (%)", fixed: "Sabit məbləğ (₼)" } as Record<string, string>)[type] ?? type)} ×</button>}{campaignType !== "all" && <button type="button" onClick={() => setCampaignType("all")} className="rounded-xl bg-amber-50 px-2.5 py-1">{translateUi(({ automated: "Avtomatik", broadcast: "Kütləvi" } as Record<string, string>)[campaignType] ?? campaignType)} ×</button>}{status !== "all" && <button type="button" onClick={() => setStatus("all")} className="rounded-xl bg-amber-50 px-2.5 py-1">{translateUi(({ active: "Aktiv", inactive: "Qeyri-aktiv", draft: "Qaralama", expired: "Müddəti bitib" } as Record<string, string>)[status] ?? status)} ×</button>}<button type="button" onClick={() => { setQuery(""); setStatus("all"); setType("all"); setCampaignType("all"); }} className="font-semibold text-rose-600 underline"><LocalizedText value={"Hamısını sıfırla"} /></button></div>}</div><MarketingTable kind={tab} entries={shown} onEdit={setEditing} onDelete={setDeleting} onSend={setReportCampaign} onReport={setReportCampaign} canSend={whatsAppState === "open"} onCopy={(code) => { void navigator.clipboard.writeText(code).then(() => setMessage(translateUi("Kod kopyalandı."))).catch(() => setMessage(translateUi("Kodu kopyalamaq mümkün olmadı."))); }} /><BusinessPagination totalItems={filtered.length} currentPage={page} pageSize={pageSize} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} itemFromLabel={translateUi(tab === "campaigns" ? "kampaniyadan" : "promokoddan")} onPageChange={setPage} /></>}
    {tab === "segments" && <MarketingSegments segments={segments} onCampaign={(segment) => { setCampaignTarget(segment.target); setEditing(null); }} />}
    {tab === "referral" && <MarketingReferral settings={data.referral} onSave={saveReferral} serverMode />}
    {tab === "reviews" && <ReviewsPanel reviews={data.reviews} onChange={async (reviews) => { const changed = reviews.find((review) => { const before = data.reviews.find((item) => item.id === review.id); return before && (before.reply !== review.reply || before.status !== review.status); }); if (!changed) return false; const before = data.reviews.find((item) => item.id === changed.id); if (!before) return false; const values = { ...(before.reply !== changed.reply ? { reply: changed.reply } : {}), ...(before.status !== changed.status ? { status: changed.status } : {}) }; try { await updateMarketingReview(businessId ?? "", changed.id, values); update({ ...data, reviews }); return true; } catch (cause) { setMessage(cause instanceof Error ? cause.message : translateUi("Rəy saxlanmadı.")); return false; } }} /> }
    {filterOpen && <MarketingFilterDialog tab={tab} status={status} type={type} campaignType={campaignType} onApply={(next) => { setStatus(next.status); setType(next.type); setCampaignType(next.campaignType); setPage(1); setFilterOpen(false); }} onClose={() => setFilterOpen(false)} />}
    {editing !== undefined && <MarketingDialog key={`${tab}-${editing?.id ?? "new"}`} kind={(editing && "message" in editing) || campaignTarget || tab === "campaigns" ? "campaign" : "promo"} initialTarget={campaignTarget ?? undefined} item={editing} usedCodes={data.promos.map((x) => x.code)} serverMode onClose={() => { setEditing(undefined); setCampaignTarget(null); }} onSave={save} />}{reportCampaign && <CampaignReportDialog campaign={reportCampaign} businessId={businessId ?? ""} canSend={whatsAppState === "open"} onClose={() => setReportCampaign(null)} onSent={() => { void fetchMarketing(businessId ?? "").then(update); }} />}{deleting && <BusinessDeleteDialog name={deleting.name} onClose={() => setDeleting(null)} onDelete={remove} />}

  </main>;
}
