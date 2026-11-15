import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import BusinessDatePicker from "../components/BusinessDatePicker";
import type { BusinessSession } from "../auth/businessSession";
import { BusinessTabButton, BusinessTabRail } from "../components/BusinessTabs";
import { useStaff } from "../staff/useStaff";
import BookingDialog from "./BookingDialog";
import { addDays, localDate, type Booking, type BookingStatus } from "./bookings";
import { DailyView, PendingView, WeeklyView, type CalendarView, type EditingBooking } from "./CalendarViews";
import { useBookings } from "./useBookings";
import { useActiveBusinessContext } from "../directory/activeContext";
import { useServices } from "../services/useServices";
import { readBusinesses } from "../directory/businesses";
import BookingCheckoutDialog from "./BookingCheckoutDialog";
import type { PaymentMethod } from "../pos/pos";
import { showToast } from "@/components/common/toast";
import MasterFilter from "./MasterFilter";
import { checkoutBookingRecord, deleteBookingRecord, saveBookingRecord, setBookingStatusRecord } from "./bookingApi";
import { useClients } from "../clients/useClients";
import { useFinance } from "../finance/useFinance";
import { useCustomerText } from "@/features/locale/customerText";

export default function BusinessCalendar({ session }: { session: BusinessSession }) {
  const t = useCustomerText();
  const { bookings, refresh: refreshBookings, loading: bookingsLoading, error: bookingsError } = useBookings(session);
  const { clients, refresh: refreshClients } = useClients(session);
  const { data: financeData } = useFinance(session);
  const { data: serviceData } = useServices(session);
  const activeBusiness = useActiveBusinessContext(session);
  const scopedBookings = bookings.filter((booking) =>
    (booking.businessId ?? activeBusiness?.businessId) === activeBusiness?.businessId &&
    (!booking.branchId || booking.branchId === activeBusiness?.branchId),
  );
  const [date, setDate] = useState(localDate);
  const [view, setView] = useState<CalendarView>("daily");
  const [master, setMaster] = useState("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<EditingBooking | null>(null);
  const [actionError, setActionError] = useState("");
  const [pendingCheckout, setPendingCheckout] = useState<Booking | null>(null);
  const [checkoutMethod, setCheckoutMethod] = useState<PaymentMethod>("cash");

  // Current staff appears in new bookings; historical names remain visible.
  const { data: staffData } = useStaff(session);
  const activeStaff = staffData.members.filter((person) => person.status !== "dismissed" && person.branchId === activeBusiness?.branchId);
  const activeMasters = activeStaff.map((person) => person.name);
  const masters = [...new Set([...activeMasters, ...scopedBookings.map((booking) => booking.masterName).filter(Boolean)])];
  const visibleMasters = master === "all" ? masters : [master];
  const pendingCount = scopedBookings.filter((booking) => booking.status === "Gözlənilir").length;
  const filtered = scopedBookings.filter((booking) =>
    (master === "all" || booking.masterName === master) &&
    (!search || `${booking.clientName} ${booking.service} ${booking.phone}`.toLocaleLowerCase("az-AZ").includes(search.toLocaleLowerCase("az-AZ"))),
  );
  const daily = filtered.filter((booking) => booking.date === date).sort((a, b) => a.time.localeCompare(b.time));

  function openNewBooking() {
    const candidates = Array.from({ length: 56 }, (_, index) => {
      const minutes = 8 * 60 + index * 15;
      return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
    });
    const now = new Date();
    const earliest = date === localDate() ? now.getHours() * 60 + now.getMinutes() : 0;
    const available = candidates.filter((time) => { const [hours, minutes] = time.split(":").map(Number); return hours * 60 + minutes >= earliest; })
      .flatMap((time) => (master === "all" ? activeMasters : [master]).map((masterName) => ({ time, masterName })))
      .find(({ time, masterName }) => !scopedBookings.some((booking) => {
        if (booking.date !== date || booking.masterName !== masterName || booking.status === "Ləğv edildi") return false;
        const start = (value: string) => { const [hours, minutes] = value.split(":").map(Number); return hours * 60 + minutes; };
        return start(time) < start(booking.time) + booking.durationMinutes && start(booking.time) < start(time) + 30;
      }));
    setEditing({ date, time: available?.time ?? "10:00", masterName: available?.masterName });
  }

  function editBooking(booking: Booking) {
    setEditing({ booking, date: booking.date, time: booking.time });
  }

  async function saveBooking(next: Booking, method: PaymentMethod = "cash"): Promise<string | null> {
    if (!next.clientName || !next.service || !next.masterName || !next.date || !next.time) return t("Məcburi sahələri doldurun.");
    if (!Number.isFinite(next.price) || next.price < 0 || !Number.isFinite(next.durationMinutes) || next.durationMinutes <= 0) return t("Qiyməti və müddəti yoxlayın.");
    const previous = bookings.find((booking) => booking.id === next.id);
    if (previous?.paymentMethod && (next.price !== previous.price || next.status !== "Tamamlandı")) return t("Ödənilmiş qəbulun məbləğini və statusunu dəyişmək üçün ayrıca kassa düzəlişi lazımdır.");
    if (!activeBusiness) return t("Əvvəlcə biznes seçin.");
    try {
      const completed = next.status === "Tamamlandı" && !previous?.paymentMethod;
      const branchId = activeBusiness.type === "individual"
        ? readBusinesses(session).find((item) => item.id === activeBusiness.businessId)?.primaryBranchId ?? activeBusiness.branchId
        : activeBusiness.branchId;
      const saved = await saveBookingRecord(activeBusiness.businessId, { ...next, branchId, status: completed ? previous?.status ?? "Təsdiqləndi" : next.status }, Boolean(previous));
      await refreshBookings();
      if (completed) { setCheckoutMethod(method); setPendingCheckout(saved); setEditing(null); return null; }
      setEditing(null); setDate(saved.date); showToast(t(previous ? "Qəbul yeniləndi." : "Qəbul əlavə edildi."));
      return null;
    } catch (cause) { return cause instanceof Error ? cause.message : t("Qəbul saxlanmadı."); }
  }

  async function setBookingStatus(id: string, next: BookingStatus) {
    const booking = bookings.find((item) => item.id === id);
    if (!booking) return;
    if (next === "Tamamlandı" && !booking.paymentMethod) { setCheckoutMethod("cash"); setPendingCheckout(booking); return; }
    if (booking.paymentMethod && next !== "Tamamlandı") { setActionError(t("Ödənişi qeydə alınmış qəbulun statusunu dəyişmək üçün kassa düzəlişi lazımdır.")); return; }
    if (!activeBusiness) return;
    try { await setBookingStatusRecord(activeBusiness.businessId, id, next); await refreshBookings(); setActionError(""); showToast(t("Qəbul statusu yeniləndi.")); }
    catch (cause) { setActionError(cause instanceof Error ? cause.message : t("Status saxlanmadı.")); }
  }

  async function deleteBooking(id: string): Promise<string | null> {
    const booking = bookings.find((item) => item.id === id);
    if (booking?.paymentMethod) return t("Ödənişi qeydə alınmış qəbulu silmək üçün əvvəlcə kassa düzəlişi lazımdır.");
    if (!activeBusiness) return t("Əvvəlcə biznes seçin.");
    try { await deleteBookingRecord(activeBusiness.businessId, id); await refreshBookings(); setEditing(null); setActionError(""); showToast(t("Qəbul silindi.")); return null; }
    catch (cause) { return cause instanceof Error ? cause.message : t("Qəbul silinmədi."); }
  }

  async function confirmCheckout(method: PaymentMethod, accountId: string): Promise<string | null> {
    if (!pendingCheckout) return t("Qəbul tapılmadı.");
    if (!activeBusiness) return t("Əvvəlcə biznes seçin.");
    try {
      const saved = await checkoutBookingRecord(activeBusiness.businessId, pendingCheckout.id, method, accountId);
      await Promise.all([refreshBookings(), refreshClients()]);
      setDate(saved.date); setPendingCheckout(null); setActionError(""); showToast(t("Qəbul və ödəniş qeydə alındı."));
      return null;
    } catch (cause) { return cause instanceof Error ? cause.message : t("Ödəniş saxlanmadı."); }
  }

  return <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 sm:px-7 sm:py-7">
    <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex shrink-0 items-center rounded-xl bg-slate-100 p-0.5 sm:p-1">
          <button type="button" onClick={() => setDate(addDays(date, view === "weekly" ? -7 : -1))} aria-label={t("Əvvəlki tarix")} className="flex size-8 cursor-pointer items-center justify-center rounded-lg hover:bg-white sm:size-9"><ChevronLeft size={18} /></button>
          <button type="button" onClick={() => setDate(localDate())} className="min-h-8 cursor-pointer rounded-lg px-1.5 text-[11px] font-semibold hover:bg-white sm:min-h-9 sm:px-3 sm:text-xs">{t("Bu gün")}</button>
          <button type="button" onClick={() => setDate(addDays(date, view === "weekly" ? 7 : 1))} aria-label={t("Növbəti tarix")} className="flex size-8 cursor-pointer items-center justify-center rounded-lg hover:bg-white sm:size-9"><ChevronRight size={18} /></button>
        </div>
        <div className="min-w-0 flex-1 text-xs font-bold sm:w-44 sm:flex-none"><BusinessDatePicker label={t("Tarix seçin")} value={date} onChange={setDate} /></div>
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-2 xl:justify-end"><div className="max-w-full overflow-x-auto"><BusinessTabRail>{([
        { value: "daily", label: t("Günlük (Ustalar)") },
        { value: "weekly", label: t("Həftəlik") },
        { value: "pending", label: `${t("Onlayn müraciətlər")}${pendingCount ? ` (${pendingCount})` : ""}` },
      ] as { value: CalendarView; label: string }[]).map((item) => <BusinessTabButton key={item.value} active={view === item.value} onClick={() => setView(item.value)}>{item.label}</BusinessTabButton>)}</BusinessTabRail></div>
        <MasterFilter masters={masters} value={master} onChange={setMaster} />
        <button type="button" onClick={openNewBooking} className="flex min-h-10 w-full cursor-pointer items-center justify-center gap-1 rounded-xl bg-brand-primary px-4 text-xs font-bold sm:ml-auto sm:w-auto"><Plus size={16} />{t("Yeni qəbul")}</button>
      </div>
    </section>

    {(actionError || bookingsError) && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{actionError || bookingsError}</p>}
    {bookingsLoading && <div className="flex min-h-48 items-center justify-center" role="status"><span className="size-9 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" /><span className="sr-only">{t("Qəbullar yüklənir")}</span></div>}
    {!bookingsLoading && <>
    {view === "daily" && <DailyView date={date} bookings={daily} masters={visibleMasters} staff={activeStaff} roles={staffData.roles} onEdit={editBooking} onStatus={setBookingStatus} onCreate={(time, masterName) => setEditing({ date, time, masterName })} />}
    {view === "weekly" && <WeeklyView date={date} bookings={filtered} onSelectDay={(day) => { setDate(day); setView("daily"); }} onEdit={editBooking} />}
    {view === "pending" && <PendingView bookings={filtered} search={search} onSearch={setSearch} onEdit={editBooking} onStatus={setBookingStatus} />}
    {editing && <BookingDialog key={editing.booking?.id ?? `${editing.date}-${editing.time}`} initial={editing.booking} businessId={activeBusiness?.businessId} branchId={activeBusiness?.branchId} date={editing.date} time={editing.time} masterName={editing.masterName} masters={activeMasters} clients={clients} services={serviceData.services.filter((item) => !item.businessId || item.businessId === activeBusiness?.businessId)} categories={serviceData.categories} bookings={scopedBookings} onClose={() => setEditing(null)} onSave={saveBooking} onDelete={deleteBooking} />}
    {pendingCheckout && <BookingCheckoutDialog session={session} booking={pendingCheckout} accounts={financeData.accounts} clients={clients} initialMethod={checkoutMethod} onClose={() => setPendingCheckout(null)} onConfirm={confirmCheckout} />}
    </>}
  </div>;
}
