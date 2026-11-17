import { useBusinessCurrency } from "../finance/businessCurrency";
import BusinessPageLoading from "../components/BusinessPageLoading";
import { showToast } from "@/components/common/toast";
import { useContext, useState } from "react";
import BusinessFilterButton from "../components/BusinessFilterButton";
import { AlertTriangle, Check, CircleDollarSign, Package, Plus, Search, ShoppingBag } from "lucide-react";
import type { BusinessSession } from "../auth/businessSession";
import BusinessDeleteDialog from "../components/BusinessDeleteDialog";
import BusinessHeaderPortal from "../components/BusinessHeaderPortal";
import BusinessHeaderButton from "../components/BusinessHeaderButton";
import { BusinessTabButton, BusinessTabNav } from "../components/BusinessTabs";
import { BusinessHeaderContext } from "../components/businessHeaderContext";
import { useActiveBusinessContext } from "../directory/activeContext";
import { ProductDialog, SimpleDialog, StockDialog } from "./ProductDialogs";
import { money, type Product, type ProductCategory, type Supplier, type TechCard, type Warehouse } from "./products";
import { type StockInput, type StockMode } from "./stockDocuments";
import { useProducts } from "./useProducts";
import { ProductList } from "./ProductList";
import ProductSections, { type Editing, type Deleting } from "./ProductSections";
import ProductFilterDialog from "./ProductFilterDialog";
import ProductCatalog from "./ProductCatalog";
import ProductCatalogMetrics from "./ProductCatalogMetrics";
import TechCardDialog from "./TechCardDialog";
import SupplierSection from "./SupplierSection";
import WarehouseDialog from "./WarehouseDialog";
import { useServices } from "../services/useServices";
import InventoryAuditDialog from "./InventoryAuditDialog";
import InventorySection from "./InventorySection";
import OperationsSection from "./OperationsSection";
import ProductMetricCard from "./ProductMetricCard";
import { deleteInventoryRecord, postInventoryDocument, saveInventoryRecord } from "./inventoryApi";
import { readBusinesses } from "../directory/businesses";
import LocalizedText from "@/features/locale/LocalizedText";
import { useCustomerText } from "@/features/locale/customerText";

type Tab = "balances" | "warehouses" | "catalog" | "techcards" | "operations" | "inventory" | "suppliers";
const tabs: { id: Tab; label: string }[] = [
  { id: "balances", label: "Qalıqlar" }, { id: "warehouses", label: "Anbarlar" }, { id: "catalog", label: "Bütün məhsullar" },
  { id: "techcards", label: "Texnoloji kartlar" }, { id: "operations", label: "Anbar əməliyyatları" },
  { id: "inventory", label: "İnventarizasiya" }, { id: "suppliers", label: "Təchizatçılar" },
];
const tabSubtitles: Record<Tab, string> = {
  balances: "Stok və anbar qalıqları",
  warehouses: "Saxlanc məntəqələri və zonalar",
  catalog: "Nomenklatura və kateqoriyalar",
  techcards: "Xidmət üzrə sərfiyyat reseptləri",
  operations: "Mədaxil, məxaric və transferlər",
  inventory: "Faktiki qalıqların yoxlanılması və sayım aktları",
  suppliers: "Tərəfdaş şirkətlər və kontragentlər",
};
export default function BusinessProducts({ session }: { session: BusinessSession }) {
  const translateUi = useCustomerText();
  const currencyCode = useBusinessCurrency();
  const { data, refresh, error: loadError, loading } = useProducts(session);
  const { openPos } = useContext(BusinessHeaderContext);
  const activeContext = useActiveBusinessContext(session);
  const activeBranchId = activeContext?.type === "individual" ? readBusinesses(session).find((item) => item.id === activeContext.businessId)?.primaryBranchId ?? activeContext.branchId : activeContext?.branchId;
  const [tab, setTab] = useState<Tab>("balances");
  const [search, setSearch] = useState("");
  const [warehouse, setWarehouse] = useState("auto");
  const [category, setCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null | undefined>(undefined);
  const [newProductCategoryId, setNewProductCategoryId] = useState("");
  const [editing, setEditing] = useState<Editing | null>(null);
  const [stockMode, setStockMode] = useState<StockMode | null>(null);
  const [stockSupplierId, setStockSupplierId] = useState("");
  const [deleting, setDeleting] = useState<Deleting | null>(null);
  const [error, setError] = useState("");
  const { data: serviceData, loading: servicesLoading } = useServices(session);
  const services = serviceData.services;
  const selectedWarehouse = warehouse === "auto" ? data.warehouses.find((item) => item.branchId === activeBranchId)?.id ?? "all" : warehouse;
  const scopeProducts = data.products.filter((item) => selectedWarehouse === "all" || item.warehouseId === selectedWarehouse);
  const filtered = scopeProducts.filter((item) => (category === "all" || item.categoryId === category) && (stockFilter === "all" || (stockFilter === "low" && item.quantity > 0 && item.quantity <= item.minimum) || (stockFilter === "out" && item.quantity === 0) || (stockFilter === "available" && item.quantity > item.minimum)) && `${item.name} ${item.sku}`.toLocaleLowerCase("az-AZ").includes(search.toLocaleLowerCase("az-AZ")));
  const critical = scopeProducts.filter((item) => item.quantity > 0 && item.quantity <= item.minimum).length;
  const outOfStock = scopeProducts.filter((item) => item.quantity === 0).length;
  const inStock = scopeProducts.filter((item) => item.quantity > item.minimum).length;
  const value = scopeProducts.reduce((sum, item) => sum + item.quantity * item.cost, 0);
  const openCreateProduct = (categoryId: string) => { setNewProductCategoryId(categoryId); setEditingProduct(null); };
  async function saveProduct(item: Product) { if (item.sku && data.products.some((other) => other.sku.toLocaleLowerCase("az-AZ") === item.sku.toLocaleLowerCase("az-AZ") && other.warehouseId === item.warehouseId && other.id !== item.id)) { setError("Bu anbarda həmin SKU artıq mövcuddur."); return; } if (!activeContext) { setError("Biznes seçin."); return; } try { await saveInventoryRecord(activeContext.businessId, "products", item, Boolean(editingProduct)); await refresh(); setError(""); setEditingProduct(undefined); showToast("Məhsul saxlanıldı."); } catch (cause) { setError(cause instanceof Error ? cause.message : "Məhsul saxlanmadı."); } }
  async function saveSimple(item: ProductCategory | Warehouse | Supplier | TechCard) {
    if (!editing) return;
    const key = ({ category: "categories", warehouse: "warehouses", supplier: "suppliers", techcard: "techCards" } as const)[editing.kind];
    if (!activeContext) { setError("Biznes seçin."); return; }
    try { await saveInventoryRecord(activeContext.businessId, editing.kind === "techcard" ? "tech-cards" : key as "categories" | "warehouses" | "suppliers", item, Boolean(editing.initial)); await refresh(); setError(""); setEditing(null); showToast("Məlumat saxlanıldı."); } catch (cause) { setError(cause instanceof Error ? cause.message : "Məlumat saxlanmadı."); }
  }
  async function remove() {
    if (!deleting) return;
    const { kind, id } = deleting;
    if (kind === "operation" || kind === "inventory") { setError("Təsdiqlənmiş anbar sənədi silinmir. Düzəliş üçün yeni sənəd yaradın."); return; }
    if (!activeContext) { setError("Biznes seçin."); return; }
    try { await deleteInventoryRecord(activeContext.businessId, ({ product: "products", category: "categories", warehouse: "warehouses", supplier: "suppliers", techcard: "tech-cards" } as const)[kind], id); await refresh(); setError(""); setDeleting(null); showToast("Silindi."); } catch (cause) { setError(cause instanceof Error ? cause.message : "Silmək mümkün olmadı."); }
  }
  async function saveStock(input: StockInput) {
    if (!activeContext) { setError("Biznes seçin."); return; }
    try { await postInventoryDocument(activeContext.businessId, input); await refresh(); setError(""); setStockMode(null); setStockSupplierId(""); showToast("Anbar əməliyyatı saxlanıldı."); } catch (cause) { setError(cause instanceof Error ? cause.message : "Əməliyyat saxlanmadı."); }
  }
  const openDelete = (kind: Deleting["kind"], item: { id: string; name: string }) => setDeleting({ kind, id: item.id, name: item.name });
  const productList = <ProductList products={filtered} data={data} onEdit={setEditingProduct} onDelete={(item) => openDelete("product", item)} />;
  const headerActions: Record<Tab, { label: string; onClick: () => void; icon?: typeof Plus }> = {
    balances: { label: "Kassa satışı (POS)", onClick: openPos, icon: ShoppingBag },
    warehouses: { label: "Yeni anbar", onClick: () => setEditing({ kind: "warehouse" }) },
    catalog: { label: "Yeni kateqoriya", onClick: () => setEditing({ kind: "category" }) },
    techcards: { label: "Yeni texnoloji kart", onClick: () => setEditing({ kind: "techcard" }) },
    operations: { label: "Yeni əməliyyat", onClick: () => { setStockSupplierId(""); setStockMode("receipt"); } },
    inventory: { label: "Yeni inventarizasiya", onClick: () => { setStockSupplierId(""); setStockMode("inventory"); } },
    suppliers: { label: "Yeni təchizatçı", onClick: () => setEditing({ kind: "supplier" }) },
  };
  const headerAction = headerActions[tab];
  const HeaderIcon = headerAction.icon ?? Plus;
  if (loading || servicesLoading) return <BusinessPageLoading />;

  return <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 sm:px-7 sm:py-7">
    <BusinessHeaderPortal slot="title"><LocalizedText value={tabs.find((item) => item.id === tab)?.label} /></BusinessHeaderPortal>
    <BusinessHeaderPortal slot="subtitle">{tabSubtitles[tab]}</BusinessHeaderPortal>
    <BusinessHeaderPortal slot="actions"><BusinessHeaderButton onClick={headerAction.onClick}><HeaderIcon /><LocalizedText value={headerAction.label} /></BusinessHeaderButton></BusinessHeaderPortal>
    <BusinessTabNav label={translateUi("Məhsullar bölmələri")}>{tabs.map((item) => <BusinessTabButton key={item.id} active={tab === item.id} onClick={() => { setTab(item.id); setError(""); }}><LocalizedText value={item.label} /></BusinessTabButton>)}</BusinessTabNav>
    {error && <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700"><LocalizedText value={error} /></div>}
    {loadError && <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{loadError}</div>}
    {loading && <div role="status" className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600"><LocalizedText value={"Məhsullar yüklənir..."} /></div>}
    {(tab === "balances" || tab === "catalog") && <div className="flex min-w-0 gap-2"><label className="business-search-control flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3"><Search size={17} className="shrink-0 text-slate-400" /><input aria-label={translateUi("Məhsul axtar")} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={translateUi("Məhsul adı, artikol və ya barkod ilə axtarın")} className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label><BusinessFilterButton onClick={() => setFilterOpen(true)} count={Number(warehouse !== "auto") + Number(category !== "all") + Number(stockFilter !== "all")} /></div>}
    {tab === "balances" && <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      <ProductMetricCard label={translateUi("Ümumi çeşid")} value={scopeProducts.length} detail={selectedWarehouse === "all" ? translateUi("Bütün anbarlar üzrə") : translateUi("Seçilmiş anbar üzrə")} icon={Package} iconClassName="bg-slate-100 text-slate-700 group-hover:bg-brand-primary group-hover:text-black" selected={stockFilter === "all"} onClick={() => setStockFilter("all")} />
      <ProductMetricCard label={translateUi("Kifayət qədər")} value={inStock} detail={translateUi("Normal qalıq səviyyəsi")} icon={Check} iconClassName="bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100" selected={stockFilter === "available"} onClick={() => setStockFilter("available")} />
      <ProductMetricCard label={translateUi("Kritik qalıq")} value={critical} detail={`${outOfStock} bitmiş məhsul`} icon={AlertTriangle} iconClassName="bg-amber-50 text-amber-600 group-hover:bg-amber-100" valueClassName="text-amber-600" selected={stockFilter === "low"} onClick={() => setStockFilter("low")} />
      <ProductMetricCard label={translateUi("Qalıq maya dəyəri")} value={money(value, currencyCode)} detail={translateUi("Maya qiyməti ilə cəmi")} icon={CircleDollarSign} iconClassName="bg-purple-50 text-purple-600" compactValue />
    </div>}
    {tab === "catalog" && <ProductCatalogMetrics products={scopeProducts} categoryCount={data.categories.length} stockFilter={stockFilter} onStockFilterChange={setStockFilter} />}
    {tab === "balances" && productList}
    {tab === "catalog" && <ProductCatalog categories={data.categories} products={filtered} showEmptyCategories={!search.trim() && category === "all" && stockFilter === "all"} onCreateCategory={() => setEditing({ kind: "category" })} onEditCategory={(item) => setEditing({ kind: "category", initial: item })} onDeleteCategory={(item) => openDelete("category", item)} onCreateProduct={openCreateProduct} onEditProduct={setEditingProduct} onDeleteProduct={(item) => openDelete("product", item)} />}
    <ProductSections tab={tab} data={data} services={services} setEditing={setEditing} openDelete={openDelete} />
    {tab === "operations" && <OperationsSection data={data} onCreate={() => { setStockSupplierId(""); setStockMode("receipt"); }} />}
    {tab === "inventory" && <InventorySection data={data} onCreate={() => { setStockSupplierId(""); setStockMode("inventory"); }} />}
    {tab === "suppliers" && <SupplierSection suppliers={data.suppliers} operations={data.operations} onCreate={() => setEditing({ kind: "supplier" })} onEdit={(supplier) => setEditing({ kind: "supplier", initial: supplier })} onDelete={(supplier) => openDelete("supplier", supplier)} onReceipt={(supplier) => { setStockSupplierId(supplier.id); setStockMode("receipt"); }} />}
    {filterOpen && <ProductFilterDialog data={data} warehouse={warehouse} category={category} stockFilter={stockFilter} setWarehouse={setWarehouse} setCategory={setCategory} setStockFilter={setStockFilter} onClose={() => setFilterOpen(false)} />}
    {editingProduct !== undefined && <ProductDialog key={editingProduct?.id ?? `new-${newProductCategoryId}`} initial={editingProduct ?? undefined} defaultCategoryId={newProductCategoryId} defaultWarehouseId={selectedWarehouse === "all" ? undefined : selectedWarehouse} data={data} error={error} onClose={() => { setEditingProduct(undefined); setError(""); }} onSave={saveProduct} />}
    {editing?.kind === "techcard" && <TechCardDialog key={editing.initial?.id ?? "new"} initial={editing.initial as TechCard | undefined} products={data.products} warehouses={data.warehouses} services={services.filter((item) => !item.businessId || item.businessId === activeContext?.businessId)} categories={serviceData.categories} saveError={error} onClose={() => { setEditing(null); setError(""); }} onSave={saveSimple} />}
    {editing?.kind === "warehouse" && <WarehouseDialog key={editing.initial?.id ?? "new"} initial={editing.initial as Warehouse | undefined} defaultBranchId={activeBranchId} error={error} onClose={() => { setEditing(null); setError(""); }} onSave={saveSimple} />}
    {editing && (editing.kind === "category" || editing.kind === "supplier") && <SimpleDialog key={editing.initial?.id ?? editing.kind} kind={editing.kind} initial={editing.initial as ProductCategory | Supplier | undefined} error={error} onClose={() => { setEditing(null); setError(""); }} onSave={saveSimple} />}
    {stockMode === "inventory" && <InventoryAuditDialog data={data} defaultWarehouseId={selectedWarehouse === "all" ? "" : selectedWarehouse} error={error} onClose={() => { setStockMode(null); setError(""); }} onSave={saveStock} />}
    {stockMode && stockMode !== "inventory" && <StockDialog key={`${stockMode}-${stockSupplierId}`} data={data} mode={stockMode} defaultSupplierId={stockSupplierId} defaultWarehouseId={selectedWarehouse === "all" ? "" : selectedWarehouse} error={error} onClose={() => { setStockMode(null); setStockSupplierId(""); setError(""); }} onSave={saveStock} onCreateSupplier={async (supplier) => { if (!activeContext) return false; try { const id = await saveInventoryRecord(activeContext.businessId, "suppliers", supplier); await refresh(); return id; } catch (cause) { setError(cause instanceof Error ? cause.message : "Təchizatçı saxlanmadı."); return false; } }} />}
    {deleting && <BusinessDeleteDialog name={deleting.name} detail={deleting.kind === "category" ? translateUi("Bağlı məhsullar kateqoriyasız qalacaq.") : deleting.kind === "warehouse" ? translateUi("Bağlı məhsullar anbarsız qalacaq.") : undefined} error={error} onClose={() => { setDeleting(null); setError(""); }} onDelete={remove} />}
  </div>;
}
