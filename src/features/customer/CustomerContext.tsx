import { useEffect, useRef, useState, type ReactNode } from "react";
import { CustomerContext } from "./customer-context";
import type { Salon, SalonBranch, Specialist, Service } from "@/features/marketplace/data";
import { getPublicSalons, getPublicSpecialists, isPublicCatalogSettled, useMarketplaceRevision } from "@/features/marketplace/publicCatalog";
import { createServerOnlineBooking } from "./onlineBookingApi";
import { changeCustomerAvatar, customerMe, logoutCustomer, saveCustomerProfile } from "./customerAuthApi";
import { cancelCustomerBooking, fetchCustomerBookings } from "./customerBookingsApi";
import { fetchCustomerFavorites, setCustomerFavorite, type FavoriteTarget } from "./customerFavoritesApi";
import { useCustomerText } from "@/features/locale/customerText";

type Modal = "auth" | "profile" | "favorites" | "bookings" | "booking" | null;
export interface Customer { name: string; email: string; phone: string; city: string; gender?: "female" | "male"; avatar?: string }
export interface Booking { id: string; salonId: number; salonName: string; branchName?: string; branchId?: string; staffId?: string; masterName?: string; service: string; partnerServiceId?: string; date: string; time: string; customerName?: string; phone?: string; status?: "Gözlənilir" | "Təsdiqləndi" | "Tamamlandı" | "Ləğv edildi"; partnerOwnerId?: string; businessId?: string; cancelToken?: string; createdAt: string }
export interface CustomerContextValue {
  user: Customer | null;
  modal: Modal;
  selectedSalon: Salon | null;
  selectedSpecialist: Specialist | null;
  selectedService: Service | null;
  selectedTime: string | null;
  selectedDate: string | null;
  selectedBranch: SalonBranch | null;
  favoriteSalonIds: number[];
  favoriteMasterIds: number[];
  bookings: Booking[];
  openModal: (modal: Exclude<Modal, null>) => void;
  openReviewAuth: () => void;
  closeModal: () => void;
  openBooking: (salon: Salon, specialist?: Specialist, service?: Service, time?: string, branch?: SalonBranch, date?: string) => void;
  selectBookingSpecialist: (specialist: Specialist | null) => void;
  login: (user: Customer) => void;
  logout: () => void;
  updateProfile: (user: Customer) => Promise<string | null>;
  updateAvatar: (file?: File) => Promise<string | null>;
  toggleSalonFavorite: (id: number) => void;
  toggleMasterFavorite: (id: number) => void;
  addBooking: (booking: Omit<Booking, "id" | "createdAt">) => Promise<string | null>;
  cancelBooking: (id: string) => Promise<string | null>;
}

export function CustomerProvider({ children }: { children: ReactNode }) {
  const ct = useCustomerText();
  const marketplaceRevision = useMarketplaceRevision();
  const [user, setUser] = useState<Customer | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);
  const [selectedSpecialist, setSelectedSpecialist] = useState<Specialist | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<SalonBranch | null>(null);
  const [favoriteSalonIds, setFavoriteSalonIds] = useState<number[]>([]);
  const [favoriteMasterIds, setFavoriteMasterIds] = useState<number[]>([]);
  const [pendingFavorite, setPendingFavorite] = useState<{ type: "salons" | "masters"; id: number } | null>(null);
  const [favoritesAfterLogin, setFavoritesAfterLogin] = useState(false);
  const [bookingsAfterLogin, setBookingsAfterLogin] = useState(false);
  const [reviewAfterLogin, setReviewAfterLogin] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const favoriteSync = useRef(0);
  useEffect(() => {
    if (!user || !isPublicCatalogSettled()) return;
    const version = ++favoriteSync.current;
    void fetchCustomerFavorites().then((favorites) => {
      if (version !== favoriteSync.current) return;
      const salons = getPublicSalons();
      const specialists = getPublicSpecialists();
      const salonIds = new Set(favorites.filter((item) => item.type === "business").map((item) => item.targetId));
      const staffIds = new Set(favorites.filter((item) => item.type === "staff").map((item) => item.targetId));
      const individualIds = new Set(favorites.filter((item) => item.type === "individual").map((item) => item.targetId));
      setFavoriteSalonIds(salons.filter((salon) => salon.partner && salonIds.has(salon.partner.businessId)).map((salon) => salon.id));
      setFavoriteMasterIds(specialists.filter((master) => master.partnerStaffId ? staffIds.has(master.partnerStaffId) : individualIds.has(salons.find((salon) => salon.id === master.salonId)?.partner?.businessId || "")).map((master) => master.id));
    }).catch(() => { setFavoriteSalonIds([]); setFavoriteMasterIds([]); });
    return () => { favoriteSync.current += 1; };
  }, [user, marketplaceRevision]);
  useEffect(() => {
    let active = true;
    void customerMe().then(({ account }) => {
      if (!active) return;
      if (!account) return;
      const next = { name: account.name, email: "", phone: `+${account.phone}`, city: account.city || "Bakı", gender: account.gender, avatar: account.avatar || undefined };
      setUser(next);
    }).catch(() => { if (active) setUser(null); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!user) return;
    let active = true;
    const refresh = async () => {
      try {
        const server = await fetchCustomerBookings();
        if (!active) return;
        setBookings(server);
      } catch { /* The existing list stays visible when the API is temporarily unavailable. */ }
    };
    void refresh();
    if (modal !== "bookings") return () => { active = false; };
    const timer = window.setInterval(() => { void refresh(); }, 30000);
    return () => { active = false; window.clearInterval(timer); };
  }, [user, modal]);
  function login(next: Customer) {
    setFavoriteSalonIds([]);
    setFavoriteMasterIds([]);
    setBookings([]);
    setUser(next);
    if (pendingFavorite) {
      const target = favoriteTarget(pendingFavorite.type, pendingFavorite.id);
      if (target) {
        const { type, id } = pendingFavorite;
        void setCustomerFavorite(target, true).then(() => {
          if (type === "salons") setFavoriteSalonIds((current) => current.includes(id) ? current : [...current, id]);
          else setFavoriteMasterIds((current) => current.includes(id) ? current : [...current, id]);
        }).catch(() => {
          if (type === "salons") setFavoriteSalonIds((current) => current.filter((value) => value !== id));
          else setFavoriteMasterIds((current) => current.filter((value) => value !== id));
        });
      }
    }
    setModal(selectedSalon ? "booking" : pendingFavorite || favoritesAfterLogin ? "favorites" : bookingsAfterLogin ? "bookings" : reviewAfterLogin ? null : "profile");
    setPendingFavorite(null);
    setFavoritesAfterLogin(false);
    setBookingsAfterLogin(false);
    setReviewAfterLogin(false);
  }
  function logout() { void logoutCustomer().catch(() => {}); setUser(null); setFavoriteSalonIds([]); setFavoriteMasterIds([]); setBookings([]); setModal(null); }
  function favoriteTarget(type: "salons" | "masters", id: number): FavoriteTarget | null {
    const salon = type === "salons" ? getPublicSalons().find((item) => item.id === id) : null;
    if (salon?.partner?.ownerId === "server") return { type: "business", targetId: salon.partner.businessId };
    if (type === "masters") {
      const master = getPublicSpecialists().find((item) => item.id === id);
      const business = getPublicSalons().find((item) => item.id === master?.salonId);
      if (business?.partner?.ownerId === "server") return master?.partnerStaffId
        ? { type: "staff", targetId: master.partnerStaffId }
        : { type: "individual", targetId: business.partner.businessId };
    }
    return null;
  }
  function toggleSalonFavorite(id: number) {
    if (!user) { setPendingFavorite({ type: "salons", id }); setModal("auth"); return; }
    const target = favoriteTarget("salons", id);
    if (!target) return;
    const selected = !favoriteSalonIds.includes(id);
    setFavoriteSalonIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
    void setCustomerFavorite(target, selected).catch(() => setFavoriteSalonIds((current) => selected ? current.filter((value) => value !== id) : [...current, id]));
  }
  function toggleMasterFavorite(id: number) {
    if (!user) { setPendingFavorite({ type: "masters", id }); setModal("auth"); return; }
    const target = favoriteTarget("masters", id);
    if (!target) return;
    const selected = !favoriteMasterIds.includes(id);
    setFavoriteMasterIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
    void setCustomerFavorite(target, selected).catch(() => setFavoriteMasterIds((current) => selected ? current.filter((value) => value !== id) : [...current, id]));
  }
  async function addBooking(booking: Omit<Booking, "id" | "createdAt">): Promise<string | null> {
    if (!user) return ct("Davam etmək üçün hesabınıza daxil olun.");
    if (!booking.businessId || !booking.partnerServiceId || !booking.branchId || !booking.masterName) return ct("Qəbul üçün xidmət, filial və usta seçin.");
    try {
      const created = await createServerOnlineBooking(booking.businessId, {
        branchId: booking.branchId, serviceId: booking.partnerServiceId, masterName: booking.masterName, staffId: booking.staffId,
        date: booking.date, time: booking.time,
      });
      const fallback: Booking = { ...booking, id: created.booking.id, createdAt: new Date().toISOString() };
      setBookings((current) => [fallback, ...current]);
      try { setBookings(await fetchCustomerBookings()); } catch { /* The created booking remains visible until refresh succeeds. */ }
    } catch (error) { return error instanceof Error ? error.message : ct("Qəbulu saxlamaq mümkün olmadı."); }
    setSelectedSalon(null); setSelectedSpecialist(null); setSelectedService(null); setSelectedTime(null); setSelectedDate(null); setSelectedBranch(null); setModal("bookings");
    return null;
  }
  async function cancelBooking(id: string): Promise<string | null> {
    if (!user) return ct("Davam etmək üçün hesabınıza daxil olun.");
    const entry = bookings.find((item) => item.id === id);
    if (!entry || entry.status === "Tamamlandı" || entry.status === "Ləğv edildi") return ct("Bu qəbulu ləğv etmək mümkün deyil.");
    try { await cancelCustomerBooking(id); }
    catch (error) { return error instanceof Error ? error.message : ct("Qəbul ləğv edilmədi."); }
    const next = bookings.map((booking) => booking.id === id ? { ...booking, status: "Ləğv edildi" as const } : booking);
    setBookings(next);
    return null;
  }
  async function updateProfile(next: Customer): Promise<string | null> {
    try {
      const saved = await saveCustomerProfile({ name: next.name, city: next.city, gender: next.gender });
      const merged = { ...next, name: saved.name, city: saved.city, gender: saved.gender };
      setUser(merged);
      return null;
    } catch (error) { return error instanceof Error ? error.message : ct("Profil yenilənmədi."); }
  }
  async function updateAvatar(file?: File): Promise<string | null> {
    if (!user) return ct("Davam etmək üçün hesabınıza daxil olun.");
    try {
      const saved = await changeCustomerAvatar(file);
      setUser({ ...user, avatar: saved.avatar || undefined });
      return null;
    } catch (error) { return error instanceof Error ? error.message : ct("Şəkil yenilənmədi."); }
  }
  return <CustomerContext.Provider value={{ user, modal, selectedSalon, selectedSpecialist, selectedService, selectedTime, selectedDate, selectedBranch, favoriteSalonIds, favoriteMasterIds, bookings, openModal: (next) => { if (next === "favorites" && !user) { setFavoritesAfterLogin(true); setModal("auth"); return; } if (next === "bookings" && !user) { setBookingsAfterLogin(true); setModal("auth"); return; } if (next === "auth" && modal !== "booking") { setSelectedSalon(null); setSelectedSpecialist(null); } setModal(next); }, openReviewAuth: () => { setReviewAfterLogin(true); setModal("auth"); }, closeModal: () => { setModal(null); setSelectedSalon(null); setSelectedSpecialist(null); setSelectedService(null); setSelectedTime(null); setSelectedDate(null); setSelectedBranch(null); setPendingFavorite(null); setFavoritesAfterLogin(false); setBookingsAfterLogin(false); setReviewAfterLogin(false); }, openBooking: (salon, specialist, service, time, branch, date) => { setSelectedSalon(salon); setSelectedSpecialist(specialist || null); setSelectedService(service || null); setSelectedTime(time || null); setSelectedDate(date || null); setSelectedBranch(branch || salon.branches?.find((item) => item.id === specialist?.partnerBranchId) || salon.branches?.[0] || null); setModal("booking"); }, selectBookingSpecialist: setSelectedSpecialist, login, logout, updateProfile, updateAvatar, toggleSalonFavorite, toggleMasterFavorite, addBooking, cancelBooking }}>{children}</CustomerContext.Provider>;
}
