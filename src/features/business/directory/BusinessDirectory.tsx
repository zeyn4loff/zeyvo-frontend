import BusinessPageLoading from "../components/BusinessPageLoading";
import { showToast } from "@/components/common/toast";
import EmptyState from "../../../components/common/EmptyState";
import { useState } from "react";
import { Building2, Plus } from "lucide-react";
import type { BusinessSession } from "../auth/businessSession";
import { type Branch, type Business } from "./businesses";
import { useBusinesses } from "./useBusinesses";
import { BusinessFormDialog } from "./BusinessDialogs";
import BranchFormDialog from "./BranchFormDialog";
import BusinessDeleteDialog from "../components/BusinessDeleteDialog";
import BusinessHeaderPortal from "../components/BusinessHeaderPortal";
import BusinessHeaderButton from "../components/BusinessHeaderButton";
import BusinessDirectoryCard from "./BusinessDirectoryCard";
import { createBusiness, updateBusiness, createIndividual, saveIndividual as saveIndividualApi, saveBranch as saveBranchApi, removeBusiness, removeBranch, fetchBusinesses, setBusinessPublication } from "./businessDirectoryApi";
import { useCustomerText } from "@/features/locale/customerText";
import LocalizedText from "@/features/locale/LocalizedText";


type EditingBranch = { businessId: string; branch?: Branch };
type Deleting = { businessId: string; branchId?: string; name: string };

export default function BusinessDirectory({ session }: { session: BusinessSession }) {
  const t = useCustomerText();
  const { businesses, update, loading, error: loadError } = useBusinesses(session);
  const [editingBusiness, setEditingBusiness] = useState<Business | null | undefined>(undefined);
  const [editingIndividual, setEditingIndividual] = useState<{ business: Business; creating: boolean } | null>(null);
  const [editingBranch, setEditingBranch] = useState<EditingBranch | null>(null);
  const [deleting, setDeleting] = useState<Deleting | null>(null);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [saveError, setSaveError] = useState("");
  const deletionBlock = deleting ? (() => {
    const business = businesses.find((item) => item.id === deleting.businessId);
    if (!business) return t("Profil tapılmadı.");
    return !deleting.branchId && business.type === "business" && business.branches.length > 0 ? t("Əvvəlcə filialları silin.") : "";
  })() : "";

  async function reconcileServer(): Promise<void> {
    try { update(await fetchBusinesses()); } catch { /* The original request error remains visible. */ }
  }

  async function saveBusiness(item: Business) {
    try {
      const saved = await (businesses.some((business) => business.id === item.id) ? updateBusiness(item) : createBusiness(item));
      if (!update(businesses.some((business) => business.id === item.id) ? businesses.map((business) => business.id === item.id ? saved : business) : [...businesses, saved])) throw new Error("Məlumat yadda saxlanmadı.");
      setSaveError("");
      setEditingBusiness(undefined);
      showToast(t("Biznes məlumatları saxlanıldı."));
    } catch (issue) { await reconcileServer(); setSaveError(issue instanceof Error ? issue.message : t("Biznes saxlanılmadı.")); }
  }

  function configureIndividual(item: Business) {
    setEditingIndividual({ business: item, creating: !businesses.some((business) => business.id === item.id) });
    setEditingBusiness(undefined);
    setSaveError("");
  }

  function editBusiness(business: Business) {
    if (business.type === "individual") configureIndividual(business);
    else setEditingBusiness(business);
  }

  async function saveIndividual(profile: Branch) {
    if (!editingIndividual) return;
      try {
        const saved = editingIndividual.creating
          ? await createIndividual(editingIndividual.business, profile)
          : await saveIndividualApi(editingIndividual.business, profile);
        update(editingIndividual.creating ? [...businesses, saved] : businesses.map((business) => business.id === saved.id ? saved : business));
        setSaveError(""); setEditingIndividual(null); showToast(t("Fərdi profil saxlanıldı."));
      } catch (issue) { await reconcileServer(); setSaveError(issue instanceof Error ? issue.message : t("Fərdi profil saxlanılmadı.")); }
  }

  async function saveBranch(item: Branch) {
    if (!editingBranch) return;
      try {
        const saved = await saveBranchApi(editingBranch.businessId, item, editingBranch.branch);
        update(businesses.map((business) => business.id === saved.id ? saved : business));
        setSaveError(""); setEditingBranch(null); showToast(t("Filial saxlanıldı."));
      } catch (issue) { await reconcileServer(); setSaveError(issue instanceof Error ? issue.message : t("Filial saxlanılmadı.")); }
  }

  async function togglePublication(business: Business) {
    const publishing = business.status !== "published";
    try {
      const saved = await setBusinessPublication(business.id, publishing);
      update(businesses.map((item) => item.id === saved.id ? saved : item));
      setSaveError("");
      showToast(t(publishing ? "Biznes kataloqda yayımlandı." : "Biznes kataloqdan gizlədildi."));
    } catch (issue) { setSaveError(issue instanceof Error ? issue.message : t("Biznesin statusu dəyişmədi.")); }
  }

  async function deleteItem() {
    if (!deleting || deletionBlock) return;
    try {
      if (deleting.branchId) await removeBranch(deleting.businessId, deleting.branchId);
      else await removeBusiness(deleting.businessId);
    } catch (issue) { await reconcileServer(); setSaveError(issue instanceof Error ? issue.message : t("Silmək mümkün olmadı.")); return; }
    update(deleting.branchId ? businesses.map((business) => business.id === deleting.businessId ? { ...business, branches: business.branches.filter((branch) => branch.id !== deleting.branchId) } : business) : businesses.filter((business) => business.id !== deleting.businessId));
    setSaveError("");
    setDeleting(null);
    showToast(t("Silindi."));
  }

  if (loading) return <BusinessPageLoading />;
  return <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-7 sm:py-7">
    <BusinessHeaderPortal><BusinessHeaderButton onClick={() => setEditingBusiness(null)} className="w-full sm:w-auto"><Plus />{t("Yeni biznes və ya fərdi usta")}</BusinessHeaderButton></BusinessHeaderPortal>
    {loading && <p role="status" className="mb-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{t("Bizneslər yüklənir...")}</p>}
    {loadError && <p role="alert" className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{loadError}</p>}
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {!loading && (businesses.length === 0 ? <EmptyState title={t("Hələ biznes və ya fərdi usta yoxdur")} description={t("Başlamaq üçün biznes və ya fərdi usta əlavə edin.")} icon={Building2} actionLabel={t("Biznes və ya fərdi usta əlavə et")} onAction={() => setEditingBusiness(null)} className="border-0 shadow-none" /> : <div className="divide-y divide-slate-100">{businesses.map((business) => <BusinessDirectoryCard
        key={business.id}
        business={business}
        collapsed={collapsed.includes(business.id)}
        onToggle={() => setCollapsed((current) => current.includes(business.id) ? current.filter((id) => id !== business.id) : [...current, business.id])}
        onEditBusiness={() => editBusiness(business)}
        onDeleteBusiness={() => setDeleting({ businessId: business.id, name: business.name })}
        onEditBranch={(branch) => setEditingBranch({ businessId: business.id, branch })}
        onDeleteBranch={(branch) => setDeleting({ businessId: business.id, branchId: branch.id, name: branch.name })}
        onAddBranch={() => setEditingBranch({ businessId: business.id })}
        onTogglePublication={() => void togglePublication(business)}
      />)}</div>)}
    </div>
    {saveError && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700"><LocalizedText value={saveError} /></p>}
    {editingBusiness !== undefined && <BusinessFormDialog key={editingBusiness?.id ?? "new-business"} open initial={editingBusiness ?? undefined} saveError={saveError} onClose={() => { setEditingBusiness(undefined); setSaveError(""); }} onSave={saveBusiness} onConfigureIndividual={configureIndividual} />}
    {editingIndividual && <BranchFormDialog key={editingIndividual.business.id} open individual server creating={editingIndividual.creating} initial={{ ...editingIndividual.business, id: editingIndividual.business.id, name: editingIndividual.business.name, city: editingIndividual.business.city ?? "Bakı", address: editingIndividual.business.address ?? "", phone: editingIndividual.business.phone ?? "", hours: editingIndividual.business.hours ?? "", logo: editingIndividual.business.logo ?? editingIndividual.business.image }} saveError={saveError} onClose={() => { setEditingIndividual(null); setSaveError(""); }} onSave={saveIndividual} />}
    {editingBranch && <BranchFormDialog key={editingBranch.branch?.id ?? `${editingBranch.businessId}-new`} open server initial={editingBranch.branch} saveError={saveError} onClose={() => { setEditingBranch(null); setSaveError(""); }} onSave={saveBranch} />}
    {deleting && <BusinessDeleteDialog name={deleting.name} detail={deletionBlock} error={saveError} blocked={!!deletionBlock} onClose={() => { setDeleting(null); setSaveError(""); }} onDelete={deleteItem} />}
  </div>;
}
