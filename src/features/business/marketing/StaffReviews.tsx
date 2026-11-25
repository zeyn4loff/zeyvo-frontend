import { useEffect, useState } from "react";
import type { BusinessSession } from "../auth/businessSession";
import { useActiveBusinessContext } from "../directory/activeContext";
import { businessPath, partnerGet, partnerPatch } from "../api/client";
import { useCustomerText } from "@/features/locale/customerText";

interface StaffReview { id: string; clientName: string; serviceName: string; rating: number; comment: string; reply: string; date: string; status: "pending" | "published" | "hidden" }

export default function StaffReviews({ session }: { session: BusinessSession }) {
  const ct = useCustomerText();
  const businessId = useActiveBusinessContext(session)?.businessId;
  const [reviews, setReviews] = useState<StaffReview[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId) return;
    let active = true;
    partnerGet<{ reviews: StaffReview[] }>(businessPath(businessId, "reviews"))
      .then(({ reviews: next }) => { if (active) { setReviews(next); setError(""); } })
      .catch(() => { if (active) setError(ct("Rəyləri yükləmək mümkün olmadı.")); });
    return () => { active = false; };
  }, [businessId, ct]);

  async function save(review: StaffReview) {
    if (!businessId) return;
    const reply = (drafts[review.id] ?? review.reply).trim();
    if (!reply) return;
    setSavingId(review.id);
    try {
      await partnerPatch(businessPath(businessId, `reviews/${review.id}/reply`), { reply });
      setReviews((current) => current.map((item) => item.id === review.id ? { ...item, reply } : item));
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : ct("Rəy saxlanmadı."));
    } finally { setSavingId(null); }
  }

  return <div className="mx-auto max-w-4xl space-y-4 px-4 py-5 sm:px-7 sm:py-7">
    <h2 className="text-xl font-bold">{ct("Rəylərim")}</h2>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {!reviews.length && <p className="rounded-2xl border border-slate-200 p-5 text-sm text-slate-500">{ct("Hələ rəy yoxdur")}</p>}
    {reviews.map((review) => <article key={review.id} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2"><strong>{review.clientName}</strong><span className="text-xs text-slate-500">{review.date.slice(0, 10).split("-").reverse().join(".")}</span></div>
      <p className="text-xs text-slate-500">{ct("Xidmət:")} {review.serviceName}</p>
      <p aria-label={`${review.rating} / 5`} className="text-amber-500">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
      <p className="break-words text-sm">{review.comment}</p>
      {review.status !== "published" ? <p className="text-xs text-amber-700">{ct(review.status === "pending" ? "Təsdiq gözləyir" : "Gizlədilib")}</p> : <div className="space-y-2"><label className="block text-xs font-semibold" htmlFor={`reply-${review.id}`}>{ct("Cavabınız")}</label><textarea id={`reply-${review.id}`} maxLength={3000} value={drafts[review.id] ?? review.reply} onChange={(event) => setDrafts((current) => ({ ...current, [review.id]: event.target.value }))} className="min-h-20 w-full rounded-xl border border-slate-200 p-3 text-sm" /><button type="button" disabled={savingId === review.id || !(drafts[review.id] ?? review.reply).trim()} onClick={() => void save(review)} className="min-h-10 rounded-xl bg-brand-primary px-4 text-sm font-semibold disabled:opacity-50">{ct("Cavabı saxla")}</button></div>}
    </article>)}
  </div>;
}
