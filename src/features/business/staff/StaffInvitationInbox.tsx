import { useEffect, useState } from "react";
import { Bell, CalendarDays, Clock3, Star, Volume2, VolumeX, X } from "lucide-react";
import { showToast } from "@/components/common/toast";
import type { BusinessNotification } from "./businessNotifications";
import { answerIncomingStaffInvitation, fetchIncomingStaffInvitations, type ServerStaffInvitation } from "./staffInvitationApi";
import type { BusinessSession } from "../auth/businessSession";
import { fetchBookingNotifications, readBookingNotification } from "../calendar/bookingNotificationApi";
import { BOOKING_CHANGED_EVENT, subscribeToBookings } from "../calendar/bookingRealtime";
import LocalizedText from "@/features/locale/LocalizedText";
import { useCustomerText } from "@/features/locale/customerText";

const notificationIcons = { booking: CalendarDays, review: Star, schedule: Clock3 };
let notificationAudio: AudioContext | null = null;

function unlockNotificationSound(): void {
  try {
    notificationAudio ??= new AudioContext();
    if (notificationAudio.state === "suspended") void notificationAudio.resume();
  } catch { /* Audio is optional when the browser does not support it. */ }
}

function playNotificationSound(): void {
  try {
    const audio = notificationAudio;
    if (!audio || audio.state !== "running") return;
    const tone = audio.createOscillator();
    const volume = audio.createGain();
    tone.type = "sine";
    tone.frequency.setValueAtTime(660, audio.currentTime);
    tone.frequency.setValueAtTime(880, audio.currentTime + 0.11);
    volume.gain.setValueAtTime(0.0001, audio.currentTime);
    volume.gain.exponentialRampToValueAtTime(0.08, audio.currentTime + 0.02);
    volume.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.28);
    tone.connect(volume).connect(audio.destination);
    tone.start(); tone.stop(audio.currentTime + 0.3);
  } catch { /* Browser may block audio until the user interacts with the page. */ }
}

export default function StaffInvitationInbox({ session, businessId }: { email: string; session: BusinessSession; businessId?: string }) {
  const translateUi = useCustomerText();
  const [open, setOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem("zeyvo-booking-sound") !== "off");
  const [serverInvitations, setServerInvitations] = useState<ServerStaffInvitation[]>([]);
  const [notifications, setNotifications] = useState<BusinessNotification[]>([]);
  useEffect(() => {
    
    let active = true;
    const refresh = () => { void fetchIncomingStaffInvitations().then((items) => { if (active) setServerInvitations(items); }).catch(() => {}); };
    refresh();
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [session]);
  useEffect(() => {
    if (!businessId) return;
    let active = true;
    const refresh = () => { void fetchBookingNotifications(businessId).then((items) => { if (active) setNotifications(items); }).catch(() => {}); };
    refresh();
    let unsubscribe: (() => void) | undefined;
    void subscribeToBookings(businessId, (event) => {
      window.dispatchEvent(new CustomEvent(BOOKING_CHANGED_EVENT, { detail: event }));
      refresh();
      if (event.notificationId && soundEnabled) playNotificationSound();
      if (event.notificationId) showToast("Yeni onlayn müraciət gəldi.");
    }).then((stop) => { if (active) unsubscribe = stop; else stop(); }).catch(() => {});
    return () => { active = false; unsubscribe?.(); };
  }, [businessId, soundEnabled]);
  const displayedInvitations = serverInvitations;
  const unreadCount = displayedInvitations.filter((item) => item.status === "pending").length + notifications.filter((item) => !item.read).length;
  async function answerServer(id: string, accept: boolean) {
    try {
      const result = await answerIncomingStaffInvitation(id, accept);
      setServerInvitations((items) => items.map((item) => item.id === id ? result : item));
      showToast(accept ? "Dəvət qəbul edildi." : "Dəvət rədd edildi.");
    } catch (error) { showToast(error instanceof Error ? error.message : "Dəvəti yeniləmək mümkün olmadı."); }
  }
  async function markRead(id: string) {
    if (businessId) {
      try { await readBookingNotification(businessId, id); setNotifications((items) => items.map((item) => item.id === id ? { ...item, read: true } : item)); }
      catch { showToast("Bildirişi yeniləmək mümkün olmadı."); }
      return;
    }

  }
  return <div className="relative shrink-0">
    <button type="button" onClick={() => { unlockNotificationSound(); setOpen((value) => !value); }} aria-label={`Bildirişlər${unreadCount ? `, ${unreadCount} yeni` : ""}`} aria-expanded={open} className="relative flex size-9 cursor-pointer items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"><Bell size={18} />{unreadCount > 0 && <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-brand-primary text-[10px] font-bold text-slate-900">{unreadCount}</span>}</button>
    {open && <div className="fixed inset-0 z-[69]" onClick={() => setOpen(false)}><div className="absolute inset-0 bg-slate-900/20" /></div>}
    {open && <section aria-label={translateUi("Bildirişlər")} className="fixed inset-x-2 bottom-2 top-2 z-[70] flex min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-11 sm:max-h-[min(75dvh,36rem)] sm:w-[min(25rem,calc(100vw-2rem))]"><div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-brand-primary/30"><Bell size={17} /></span><div><strong className="block text-sm text-slate-900"><LocalizedText value={"Bildirişlər"} /></strong><span className="text-[11px] text-slate-500">{unreadCount ? `${unreadCount} yeni bildiriş` : translateUi("Hamısı oxunub")}</span></div></div><div className="flex gap-1"><button type="button" aria-label={soundEnabled ? translateUi("Bildiriş səsini söndür") : translateUi("Bildiriş səsini aç")} title={soundEnabled ? translateUi("Səsi söndür") : translateUi("Səsi aç")} onClick={() => { const next = !soundEnabled; setSoundEnabled(next); localStorage.setItem("zeyvo-booking-sound", next ? "on" : "off"); if (next) { unlockNotificationSound(); playNotificationSound(); } }} className="flex size-9 cursor-pointer items-center justify-center rounded-xl bg-slate-100 text-slate-600">{soundEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}</button><button type="button" aria-label={translateUi("Bağla")} onClick={() => setOpen(false)} className="flex size-9 cursor-pointer items-center justify-center rounded-xl bg-slate-100 text-slate-500"><X size={17} /></button></div></div><div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain p-3 sm:p-4">
      {displayedInvitations.length === 0 && notifications.length === 0 ? <p className="py-5 text-center text-sm text-slate-500"><LocalizedText value={"Yeni bildiriş yoxdur."} /></p> : <div className="space-y-2">
        {displayedInvitations.map((item) => <article key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs"><div className="flex items-start justify-between gap-2"><strong className="text-sm text-slate-900">{item.businessName}</strong><span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${item.status === "pending" ? "bg-brand-primary/30 text-slate-900" : item.status === "accepted" ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>{item.status === "pending" ? translateUi("Dəvət") : item.status === "accepted" ? translateUi("Qəbul edildi") : translateUi("Rədd edildi")}</span></div><p className="mt-1 leading-5 text-slate-600">{item.senderName} sizi {item.staffName} <LocalizedText value={"profili üçün komandaya dəvət edir."} /></p>{item.status === "pending" && <div className="mt-3 flex gap-2"><button type="button" onClick={() => { void answerServer(item.id, true); }} className="min-h-10 flex-1 cursor-pointer rounded-xl bg-brand-primary px-2 font-bold text-slate-900"><LocalizedText value={"Qəbul et"} /></button><button type="button" onClick={() => { void answerServer(item.id, false); }} className="min-h-10 flex-1 cursor-pointer rounded-xl border border-slate-200 bg-white px-2 font-semibold text-slate-700"><LocalizedText value={"Rədd et"} /></button></div>}</article>)}
        {notifications.map((item) => { const Icon = notificationIcons[item.kind]; return <article key={item.id} className={`rounded-2xl border p-3.5 text-xs ${item.read ? "border-slate-200 bg-white" : "border-brand-primary/60 bg-brand-primary/10"}`}><div className="flex items-start gap-2.5"><span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${item.read ? "bg-slate-100" : "bg-brand-primary/25"} text-slate-700`}><Icon size={17} /></span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><strong className="text-sm text-slate-900"><LocalizedText value={item.title} /></strong>{!item.read && <span className="mt-1 size-2 shrink-0 rounded-full bg-brand-primary" aria-label={translateUi("Oxunmayıb")} />}</div><p className="mt-1 leading-5 text-slate-600">{item.message}</p><div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-slate-400"><time>{item.date}</time>{!item.read && <button type="button" onClick={() => markRead(item.id)} className="min-h-8 cursor-pointer rounded-lg px-2 font-semibold text-slate-700 hover:bg-white">✓ Oxundu</button>}</div></div></div></article>; })}
      </div>}
    </div></section>}
  </div>;
}
