import { useEffect, useState } from "react";
import { useCustomer } from "@/features/customer/useCustomer";
import { fetchAvailableSlots } from "@/features/customer/onlineBookingApi";
import type { Salon } from "@/features/marketplace/data";

export default function QuickBookingSlots({ salon }: { salon: Salon }) {
  const { openBooking } = useCustomer();
  const [slots, setSlots] = useState<{ date: string; time: string; label: string }[]>([]);
  const businessId = salon.partner?.businessId;
  const branchId = salon.branches?.[0]?.id;
  const serviceId = salon.services[0]?.partnerServiceId;
  const branchCount = salon.branches?.length ?? 0;
  useEffect(() => {
    if (!businessId || !branchId || !serviceId || branchCount !== 1) return;
    let active = true;
    const dates = [0, 1].map((offset) => {
      const day = new Date(); day.setHours(12, 0, 0, 0); day.setDate(day.getDate() + offset);
      return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
    });
    void Promise.all(dates.map((date) => fetchAvailableSlots(businessId, branchId, serviceId, date)))
      .then((days) => { if (active) setSlots(days.flatMap((items, index) => items.map((slot) => ({ date: dates[index], time: slot.time, label: index === 0 ? slot.time : `Sabah ${slot.time}` }))).slice(0, 3)); })
      .catch(() => { if (active) setSlots([]); });
    return () => { active = false; };
  }, [businessId, branchId, serviceId, branchCount]);

  if (!slots.length) return null;
  return <div className="mt-3 border-t border-slate-100 pt-3">
    <p className="mb-2 text-xs font-semibold text-slate-600">Yaxın boş vaxtlar · {salon.services[0].name}</p>
    <div className="flex flex-wrap gap-2">{slots.map((slot) => <button key={`${slot.date}-${slot.time}`} type="button" onClick={() => openBooking(salon, undefined, salon.services[0], slot.time, salon.branches?.[0], slot.date)} className="min-h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-primary hover:border-brand-primary hover:bg-brand-primary/20">{slot.label}</button>)}</div>
  </div>;
}
