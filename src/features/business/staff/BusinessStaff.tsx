import BusinessPageLoading from "../components/BusinessPageLoading";
import { showToast } from "@/components/common/toast";
import { useState } from "react";
import { CalendarDays, Plus } from "lucide-react";
import type { BusinessSession } from "../auth/businessSession";
import BusinessDeleteDialog from "../components/BusinessDeleteDialog";
import BusinessHeaderPortal from "../components/BusinessHeaderPortal";
import BusinessHeaderButton from "../components/BusinessHeaderButton";
import { BusinessTabButton, BusinessTabNav } from "../components/BusinessTabs";
import { readBusinesses } from "../directory/businesses";
import { useActiveBusinessContext } from "../directory/activeContext";
import { useServices } from "../services/useServices";
import { RoleFormDialog, StaffFormDialog } from "./StaffDialogs";
import StaffEmploymentDialog from "./StaffEmploymentDialog";
import StaffFilterDialog from "./StaffFilterDialog";
import { emptyStaffFilters, type StaffFilters } from "./staffFilters";
import StaffScheduleTab from "./StaffScheduleTab";
import StaffRolesTab from "./StaffRolesTab";
import StaffTeamView from "./StaffTeamView";
import { weekdays, type StaffMember, type StaffRole } from "./staff";
import { useStaff } from "./useStaff";
import { deleteStaffMember, deleteStaffRole, saveStaffMember, saveStaffRole } from "./staffApi";
import LocalizedText from "@/features/locale/LocalizedText";
import { useCustomerText } from "@/features/locale/customerText";

type Tab = "team" | "schedule" | "roles";
export default function BusinessStaff({ session }: { session: BusinessSession }) {
  const translateUi = useCustomerText();
  const { data, refresh, error: loadError, loading } = useStaff(session);
  const { data: serviceData, refresh: refreshServices, loading: servicesLoading } = useServices(session);
  const activeContext = useActiveBusinessContext(session);
  const businesses = readBusinesses(session);
  const branches = businesses.flatMap((business) => business.branches);
  const actualBranchId = activeContext?.type === "individual" ? businesses.find((business) => business.id === activeContext.businessId)?.primaryBranchId ?? activeContext.branchId : activeContext?.branchId;
  const [tab, setTab] = useState<Tab>("team");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<StaffFilters>(emptyStaffFilters);
  const [filterOpen, setFilterOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<{ item?: StaffMember; tab: "info" | "online" | "services" | "schedule" | "pay" } | null>(null);
  const [editingRole, setEditingRole] = useState<StaffRole | null | undefined>(undefined);
  const [employment, setEmployment] = useState<{ id: string; mode: "dismiss" | "rehire" | "history" } | null>(null);
  const [deleting, setDeleting] = useState<{ kind: "staff" | "role"; id: string; name: string } | null>(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const todayKey = weekdays[(new Date().getDay() + 6) % 7];
  const roleName = (id: string) => data.roles.find((role) => role.id === id)?.name ?? "Vəzifəsiz";
  const branchName = (id: string) => branches.find((branch) => branch.id === id)?.name ?? (id ? "Əvvəlki filial" : "Filiala bağlı deyil");
  const branchMembers = data.members.filter((item) => item.branchId === actualBranchId || item.branchIds?.includes(actualBranchId ?? ""));
  const filtered = branchMembers.filter((item) => (filters.role === "all" || item.roleId === filters.role) && (filters.status === "all" || item.status === filters.status) && (filters.shift === "all" || (item.status === "active" && item.schedule?.[todayKey]?.enabled)) && (filters.online === "all" || (item.status === "active" && item.onlineBooking)) && `${item.name} ${item.specialization} ${item.phone} ${item.email} ${roleName(item.roleId)}`.toLocaleLowerCase("az-AZ").includes(search.toLocaleLowerCase("az-AZ")));
  const totalPages = Math.max(1, Math.ceil(filtered.length / 10));
  const shown = filtered.slice((Math.min(page, totalPages) - 1) * 10, Math.min(page, totalPages) * 10);
  const employmentMember = data.members.find((member) => member.id === employment?.id);
  const activeFilterCount = Object.values(filters).filter((value) => value !== "all").length;
  const avgRating = branchMembers.filter((item) => item.rating != null);
  async function saveStaff(item: StaffMember, selectedServiceIds: string[]) {
    try {
      if (!activeContext?.businessId) throw new Error("Biznes seçin.");
      await saveStaffMember(activeContext.businessId, item, selectedServiceIds, data.members.some((old) => old.id === item.id));
      await Promise.all([refresh(), refreshServices()]);
      setEditingStaff(null); setError(""); showToast("Usta saxlanıldı.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Ustanı saxlamaq mümkün olmadı."); }
  }
  async function saveRole(item: StaffRole) {
    if (data.roles.some((role) => role.id !== item.id && role.name.toLocaleLowerCase("az-AZ") === item.name.toLocaleLowerCase("az-AZ"))) { setError("Bu vəzifə artıq mövcuddur."); return; }
    try {
      if (!activeContext?.businessId) throw new Error("Biznes seçin.");
      await saveStaffRole(activeContext.businessId, item, data.roles.some((role) => role.id === item.id));
      await refresh();
      setEditingRole(undefined); setError(""); showToast("Vəzifə saxlanıldı.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Vəzifəni saxlamaq mümkün olmadı."); }
  }
  async function remove() {
    if (!deleting) return;
    try {
      if (!activeContext?.businessId) throw new Error("Biznes seçin.");
      if (deleting.kind === "staff") { await deleteStaffMember(activeContext.businessId, deleting.id); await Promise.all([refresh(), refreshServices()]); }
      else { await deleteStaffRole(activeContext.businessId, deleting.id); await refresh(); }
      setDeleting(null); showToast("Silindi.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Silmək mümkün olmadı."); }
  }
  async function saveEmployment(item: StaffMember) {
    await saveStaff(item, serviceData.services.filter((service) => service.staffIds.includes(item.id)).map((service) => service.id));
    setEmployment(null);
  }
  function openStaff(item?: StaffMember, selected: "info" | "online" | "services" | "schedule" | "pay" = "info") { setEditingStaff({ item, tab: selected }); }
  const tabs: { id: Tab; label: string; count?: number }[] = [{ id: "team", label: "Ustalar", count: branchMembers.length }, { id: "schedule", label: "İş qrafiki & Smenlər" }, { id: "roles", label: "Vəzifələr və rollar", count: data.roles.length }];
  if (loading || servicesLoading) return <BusinessPageLoading />;
  return <div className="mx-auto max-w-7xl space-y-6 px-4 py-5 sm:px-7 sm:py-7">
    <BusinessHeaderPortal slot="subtitle"><LocalizedText value={"Mütəxəssislər, iş cədvəli və komissiyalar"} /></BusinessHeaderPortal>
    <BusinessHeaderPortal>
      {tab === "team" && <BusinessHeaderButton variant="secondary" onClick={() => setTab("schedule")} className="flex-1 sm:flex-none"><CalendarDays /><LocalizedText value={"İş qrafiki"} /></BusinessHeaderButton>}
      {tab === "roles" ? <BusinessHeaderButton onClick={() => setEditingRole(null)} className="flex-1 sm:flex-none"><Plus /><LocalizedText value={"Yeni vəzifə"} /></BusinessHeaderButton> : <BusinessHeaderButton onClick={() => openStaff()} className="flex-1 sm:flex-none"><Plus />Yeni usta</BusinessHeaderButton>}
    </BusinessHeaderPortal>
    <BusinessTabNav label={translateUi("Heyət bölmələri")} centered>{tabs.map((item) => <BusinessTabButton key={item.id} active={tab === item.id} count={item.count} onClick={() => { setTab(item.id); setError(""); }}><LocalizedText value={item.label} /></BusinessTabButton>)}</BusinessTabNav>
    {loading && <p className="text-sm text-slate-500"><LocalizedText value={"Ustalar yüklənir…"} /></p>}
    {(error || loadError) && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error || loadError}</p>}
    {tab === "team" && <StaffTeamView data={{ ...data, members: branchMembers }} services={serviceData.services} filters={filters} setFilters={setFilters} search={search} setSearch={setSearch} setFilterOpen={setFilterOpen} page={page} setPage={setPage} todayKey={todayKey} roleName={roleName} branchName={branchName} filtered={filtered} shown={shown} totalPages={totalPages} activeFilterCount={activeFilterCount} avgRating={avgRating} openStaff={openStaff} setDeleting={setDeleting} setEmployment={setEmployment} />}
    {tab === "schedule" && <StaffScheduleTab members={branchMembers} today={todayKey} roleName={roleName} onEditSchedule={(item) => openStaff(item, "schedule")} />}
    {tab === "roles" && <StaffRolesTab roles={data.roles} members={branchMembers} onEdit={setEditingRole} onDelete={(role) => setDeleting({ kind: "role", id: role.id, name: role.name })} />}
    {filterOpen && <StaffFilterDialog filters={filters} roles={data.roles} onChange={(next) => { setFilters(next); setPage(1); }} onClose={() => setFilterOpen(false)} />}
    {editingStaff && <StaffFormDialog key={editingStaff.item?.id ?? "new"} initial={editingStaff.item} initialTab={editingStaff.tab} roles={data.roles} branchId={actualBranchId ?? ""} serviceData={serviceData} onClose={() => setEditingStaff(null)} onSave={saveStaff} />}
    {editingRole !== undefined && <RoleFormDialog key={editingRole?.id ?? "new"} initial={editingRole ?? undefined} error={error} onClose={() => { setEditingRole(undefined); setError(""); }} onSave={saveRole} />}
    {employment && employmentMember && <StaffEmploymentDialog key={`${employment.id}-${employment.mode}`} member={employmentMember} roles={data.roles} mode={employment.mode} onClose={() => setEmployment(null)} onSave={saveEmployment} onModeChange={(mode) => setEmployment({ id: employment.id, mode })} />}
    {deleting && <BusinessDeleteDialog name={deleting.name} detail={deleting.kind === "role" ? translateUi("Bu vəzifədəki ustalar vəzifəsiz qalacaq.") : undefined} onClose={() => setDeleting(null)} onDelete={remove} />}
  </div>;
}
