import EmptyState from "../../../components/common/EmptyState";
import { useEffect, useState, type FormEvent } from "react";
import { useCustomer } from "@/features/customer/useCustomer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { PublicReview } from "../reviews";
import { getPublicSalons, getPublicSpecialists, refreshPublicCatalog } from "../publicCatalog";
import { fetchPublicReviews, submitCustomerReview } from "../customerReviewsApi";
import { useCustomerText } from "@/features/locale/customerText";

export default function LocalReviews({ subject, title }: { subject: string; title: string }) {
  const ct = useCustomerText();
  const { user, bookings, openReviewAuth } = useCustomer();
  const specialist = subject.startsWith("master-") ? getPublicSpecialists().find((item) => item.id === Number(subject.slice(7))) : null;
  const salonId = subject.startsWith("salon-") ? Number(subject.slice(6)) : specialist?.salonId;
  const salon = getPublicSalons().find((item) => item.id === salonId);
  const serverBusinessId = salon?.partner?.ownerId === "server" ? salon.partner.businessId : null;
  const subjectType = specialist ? "staff" : "business";
  const eligibleBooking = bookings.find((booking) => booking.status === "Tamamlandı" && booking.businessId === serverBusinessId && (!specialist || (Boolean(specialist.partnerStaffId) && booking.staffId === specialist.partnerStaffId)));
  const canReview = Boolean(eligibleBooking);
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [pendingAuth, setPendingAuth] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (serverBusinessId) {
      let active = true;
      void fetchPublicReviews(serverBusinessId, specialist?.partnerStaffId).then((items) => { if (active) setReviews(items); }).catch(() => { if (active) setError("Rəyləri yükləmək mümkün olmadı."); });
      return () => { active = false; };
    }
  }, [serverBusinessId, specialist?.partnerStaffId]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) { setPendingAuth(true); setOpen(false); openReviewAuth(); return; }
    if (!canReview) { setError(ct("Rəy yalnız tamamlanmış qəbuldan sonra yazıla bilər.")); return; }
    if (!text.trim()) return;
    if (serverBusinessId) {
      if (!eligibleBooking) return;
      setSaving(true);
      try {
        await submitCustomerReview(eligibleBooking.id, subjectType, rating, text.trim());
        setReviews(await fetchPublicReviews(serverBusinessId, specialist?.partnerStaffId));
        void refreshPublicCatalog();
        setText(""); setError(""); setOpen(false);
      } catch (reason) { setError(reason instanceof Error ? reason.message : ct("Rəyi saxlamaq mümkün olmadı. Yenidən cəhd edin.")); }
      finally { setSaving(false); }
      return;
    }
    setError(ct("Rəyi saxlamaq mümkün olmadı. Yenidən cəhd edin."));
  }
  return <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-bold">{title}</h2><button type="button" onClick={() => { if (!user) { setPendingAuth(true); openReviewAuth(); } else if (!canReview) setError(ct("Rəy yalnız tamamlanmış qəbuldan sonra yazıla bilər.")); else { setError(""); setOpen(true); } }} className="min-h-11 rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold">{ct("Rəy bildir")}</button></div><p className="mt-1 text-sm text-slate-500">{ct("Müştəri rəyləri")}</p>{error && !open && <p role="status" className="mt-2 text-sm text-slate-600">{error}</p>}
    <div className="mt-4 space-y-3">{reviews.filter((review) => review.status !== "hidden").length ? reviews.filter((review) => review.status !== "hidden").map((review) => <article key={review.id} className="rounded-xl border border-slate-100 p-3"><div className="flex justify-between gap-2 text-sm"><strong>{review.name}</strong><span className="text-slate-500">{review.date}</span></div><div aria-label={`${review.rating} / 5`} className="text-amber-500">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</div><p className="mt-1 break-words text-sm">{review.text}</p>{review.reply && <p className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">{ct("Məkanın cavabı:")} {review.reply}</p>}</article>) : <EmptyState title={ct("Hələ rəy yoxdur")} description={ct("İlk rəyi siz yazın.")} compact />}</div>
    <Dialog open={open || (pendingAuth && !!user && canReview)} onOpenChange={(next) => { setOpen(next); if (!next) setPendingAuth(false); }}><DialogContent className="customer-modal max-h-[90dvh] max-w-md overflow-y-auto rounded-3xl p-5" overlayClassName="customer-overlay"><DialogHeader><DialogTitle>{ct("Rəy yazın")}</DialogTitle></DialogHeader><form onSubmit={submit} className="space-y-3"><label className="block text-xs font-semibold">{ct("Qiymət")}<select value={rating} onChange={(event) => setRating(Number(event.target.value))} className="mt-1 block w-full rounded-xl border border-slate-200 p-2 text-sm">{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} / 5</option>)}</select></label><label className="block text-xs font-semibold">{ct("Rəyiniz")}<textarea required maxLength={1000} value={text} onChange={(event) => setText(event.target.value)} className="mt-1 block min-h-28 w-full rounded-xl border border-slate-200 p-3 text-sm" /></label>{error && <p role="alert" className="text-xs text-red-700">{error}</p>}<button type="submit" disabled={saving} className="w-full rounded-xl bg-brand-primary px-5 py-3 text-sm font-semibold disabled:opacity-50">{user ? ct("Rəyi əlavə et") : ct("Daxil ol və rəy yaz")}</button></form></DialogContent></Dialog>
  </section>;
}
