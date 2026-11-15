import BusinessPageLoading from "../components/BusinessPageLoading";
import { showToast } from "@/components/common/toast";
import { useState } from "react";
import BusinessFilterButton from "../components/BusinessFilterButton";
import { Plus, Search } from "lucide-react";
import type { BusinessSession } from "../auth/businessSession";
import BusinessDeleteDialog from "../components/BusinessDeleteDialog";
import BusinessHeaderPortal from "../components/BusinessHeaderPortal";
import BusinessHeaderButton from "../components/BusinessHeaderButton";
import { useProducts } from "../products/useProducts";
import { useResources } from "../resources/useResources";
import { useStaff } from "../staff/useStaff";
import { ServiceCategoryDialog, ServiceDialog } from "./ServiceDialogs";
import { type Service, type ServiceCategory, type ServiceFormat, type ServiceGender } from "./services";
import { useServices } from "./useServices";
import ServiceRow from "./ServiceRow";
import ServiceFilterDialog from "./ServiceFilterDialog";
import ServiceGroups from "./ServiceGroups";
import ServiceMetrics from "./ServiceMetrics";
import { useActiveBusinessContext } from "../directory/activeContext";
import { deleteBusinessService, deleteServiceCategory, saveBusinessService, saveServiceCategory } from "./serviceApi";
export default function BusinessServices({ session }: { session: BusinessSession }) {
  const { data, refresh, error: loadError, loading } = useServices(session);
  const activeBusiness = useActiveBusinessContext(session);
  const businessId = activeBusiness?.businessId ?? "";
  const scopedServices = data.services.filter((item) => (item.businessId ?? businessId) === businessId);
  const { data: staffData, loading: staffLoading } = useStaff(session);
  const staff = staffData.members;
  const { data: resourceData, error: resourcesError, loading: resourcesLoading } = useResources(session);
  const resources = resourceData.resources;
  const { data: productData, loading: productsLoading } = useProducts(session);
  const products = productData.products;
  const techCards = productData.techCards;
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState<ServiceGender | "all-filter">("all-filter");
  const [formatFilter, setFormatFilter] = useState<ServiceFormat | "all">("all");
  const [onlineFilter, setOnlineFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const linkedServiceId = new URLSearchParams(window.location.search).get("edit");
  const [editingService, setEditingService] = useState<Service | null | undefined>(undefined);
  const [linkedDismissed, setLinkedDismissed] = useState(false);
  const visibleEditingService = editingService === undefined && !linkedDismissed ? scopedServices.find((service) => service.id === linkedServiceId) : editingService;
  const [initialServiceTab, setInitialServiceTab] = useState<"general" | "team">("general");
  const [defaultCategoryId, setDefaultCategoryId] = useState("");
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<{ kind: "service" | "category"; id: string; name: string } | null>(null);
  const [error, setError] = useState("");
  const filtered = scopedServices.filter((item) => (categoryFilter === "all" || (categoryFilter === "uncategorized" ? !item.categoryId || !data.categories.some((cat) => cat.id === item.categoryId) : item.categoryId === categoryFilter)) && (genderFilter === "all-filter" || item.gender === genderFilter || item.gender === "all") && (formatFilter === "all" || (formatFilter === "combo" ? item.isCombo || item.format === "combo" : item.format === formatFilter)) && (onlineFilter === "all" || String(item.onlineBooking) === onlineFilter) && `${item.name} ${item.description}`.toLocaleLowerCase("az-AZ").includes(search.toLocaleLowerCase("az-AZ")));
  function openService(item?: Service, categoryId = "") { if (!businessId) { setError("Əvvəlcə biznes və ya fərdi usta profili yaradın."); return; } if (resourcesError || loadError || loading) { setError("Məlumatlar yüklənmədi. Səhifəni yeniləyib yenidən cəhd edin."); return; } setLinkedDismissed(true); setDefaultCategoryId(categoryId); setInitialServiceTab("general"); setEditingService(item ?? null); setError(""); }
  async function saveService(item: Service): Promise<boolean | string> { try { await saveBusinessService(businessId, item, data.services.some((old) => old.id === item.id)); await refresh(); setLinkedDismissed(true); setEditingService(undefined); showToast("Xidmət saxlanıldı."); return true; } catch (cause) { const message = cause instanceof Error ? cause.message : "Xidməti saxlamaq mümkün olmadı."; setError(message); return message; } }
  async function saveCategory(item: ServiceCategory): Promise<void> { if (data.categories.some((old) => old.id !== item.id && old.name.toLocaleLowerCase("az-AZ") === item.name.toLocaleLowerCase("az-AZ"))) { setError("Bu kateqoriya artıq mövcuddur."); return; } try { await saveServiceCategory(businessId, item, !!editingCategory); await refresh(); setEditingCategory(undefined); setError(""); showToast("Kateqoriya saxlanıldı."); } catch (cause) { setError(cause instanceof Error ? cause.message : "Kateqoriyanı saxlamaq mümkün olmadı."); } }
  async function remove() { if (!deleting) return; try { if (deleting.kind === "service") { const parent = data.services.find((item) => item.comboIds.includes(deleting.id)); if (parent) throw new Error(`Bu xidmət “${parent.name}” kompleksinə daxildir. Əvvəlcə kompleksin tərkibini dəyişin.`); await deleteBusinessService(businessId, deleting.id); } else { await deleteServiceCategory(businessId, deleting.id); } await refresh(); if (categoryFilter === deleting.id) setCategoryFilter("all"); setDeleting(null); setError(""); showToast("Silindi."); } catch (cause) { setError(cause instanceof Error ? cause.message : "Silmək mümkün olmadı."); setDeleting(null); } }
  function reset() { setSearch(""); setCategoryFilter("all"); setGenderFilter("all-filter"); setFormatFilter("all"); setOnlineFilter("all"); }
  function serviceRow(item: Service) { return <ServiceRow key={item.id} service={item} staff={staff} onEdit={() => openService(item)} onDelete={() => setDeleting({ kind: "service", id: item.id, name: item.name })} />; }
  if (loading || staffLoading || resourcesLoading || productsLoading) return <BusinessPageLoading />;
  return <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 sm:px-7 sm:py-7">
    <BusinessHeaderPortal slot="subtitle">Xidmətlər, qiymət kataloqu və icra müddəti</BusinessHeaderPortal>
    <BusinessHeaderPortal><BusinessHeaderButton variant="secondary" disabled={!businessId || loading || !!loadError} onClick={() => setEditingCategory(null)} className="flex-1 disabled:opacity-50 sm:flex-none"><Plus />Yeni kateqoriya</BusinessHeaderButton><BusinessHeaderButton disabled={!businessId || loading || !!loadError} onClick={() => openService()} className="flex-1 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"><Plus />Yeni xidmət</BusinessHeaderButton></BusinessHeaderPortal>
    {!businessId && <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Xidmət əlavə etmək üçün əvvəlcə biznes və ya fərdi usta profili yaradın.</p>}
    {(error || loadError) && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error || loadError}</p>}
    {loading && <p className="text-sm text-slate-500">Xidmətlər yüklənir…</p>}
    <ServiceMetrics services={scopedServices} categoryCount={data.categories.length} onlineOnly={onlineFilter === "true"} onToggleOnline={() => setOnlineFilter((current) => current === "true" ? "all" : "true")} />
    <div className="flex min-w-0 gap-2 sm:gap-3"><label className="business-search-control flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-3.5 shadow-xs"><Search size={17} className="shrink-0 text-slate-400" /><input aria-label="Xidmət axtar" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Xidmət və ya təsvir adı ilə axtarın..." className="min-w-0 flex-1 bg-transparent text-xs font-medium outline-none placeholder:text-slate-400" /></label><BusinessFilterButton onClick={() => setFilterOpen(true)} count={Number(categoryFilter !== "all") + Number(formatFilter !== "all") + Number(genderFilter !== "all-filter") + Number(onlineFilter !== "all")} /></div>
    {(search || categoryFilter !== "all" || formatFilter !== "all" || genderFilter !== "all-filter" || onlineFilter !== "all") && <button type="button" onClick={reset} className="cursor-pointer text-xs font-bold text-red-600">Filtrləri sıfırla</button>}
    {filterOpen && <ServiceFilterDialog categories={data.categories} categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter} formatFilter={formatFilter} setFormatFilter={setFormatFilter} genderFilter={genderFilter} setGenderFilter={setGenderFilter} onlineFilter={onlineFilter} setOnlineFilter={setOnlineFilter} onClose={() => setFilterOpen(false)} onReset={reset} />}
    <ServiceGroups categories={data.categories} filtered={filtered} categoryFilter={categoryFilter} genderFilter={genderFilter} formatFilter={formatFilter} onlineFilter={onlineFilter} search={search} collapsed={collapsed} setCollapsed={setCollapsed} onEditCategory={setEditingCategory} onDeleteCategory={(cat) => setDeleting({ kind: "category", id: cat.id, name: cat.name })} onAddService={(categoryId) => openService(undefined, categoryId)} onAddCategory={() => setEditingCategory(null)} onResetFilters={reset} renderService={serviceRow} />
    {visibleEditingService !== undefined && <ServiceDialog key={visibleEditingService?.id ?? "new"} initial={visibleEditingService ?? undefined} initialTab={initialServiceTab} businessId={businessId} defaultCategoryId={defaultCategoryId} data={{ ...data, services: scopedServices }} staff={staff} staffAvailable={!staffLoading} resources={resources} resourceCategories={resourceData.categories} products={products} techCards={techCards} onClose={() => { setLinkedDismissed(true); setEditingService(undefined); }} onSave={saveService} />}
    {editingCategory !== undefined && <ServiceCategoryDialog key={editingCategory?.id ?? "new"} initial={editingCategory ?? undefined} error={error} onClose={() => { setEditingCategory(undefined); setError(""); }} onSave={saveCategory} />}
    {deleting && <BusinessDeleteDialog name={deleting.name} detail={deleting.kind === "category" ? "Bağlı xidmətlər kateqoriyasız qalacaq." : "Kompleksə daxil olan xidmət əvvəlcə kompleksdən çıxarılmalıdır."} onClose={() => setDeleting(null)} onDelete={remove} />}
  </div>;
}
