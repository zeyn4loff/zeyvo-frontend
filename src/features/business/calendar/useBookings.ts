import { useCallback, useEffect, useState } from "react";
import type { BusinessSession } from "../auth/businessSession";
import type { Booking } from "./bookings";
import { useActiveBusinessContext } from "../directory/activeContext";
import { fetchBookings } from "./bookingApi";
import { BOOKING_CHANGED_EVENT, type BookingChangedDetail } from "./bookingRealtime";

export function useBookings(session: BusinessSession) {
  const businessId = useActiveBusinessContext(session)?.businessId;
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadedBusinessId, setLoadedBusinessId] = useState<string>();
  const [error, setError] = useState("");
  const refresh = useCallback(async (): Promise<void> => {
    if (!businessId) return;
    try { setBookings(await fetchBookings(businessId)); setLoadedBusinessId(businessId); setError(""); }
    catch (cause) { setLoadedBusinessId(businessId); setError(cause instanceof Error ? cause.message : "Qəbullar yüklənmədi."); }
  }, [businessId]);
  useEffect(() => {
    if (!businessId) return;
    let cancelled = false;
    fetchBookings(businessId).then((next) => { if (!cancelled) { setBookings(next); setLoadedBusinessId(businessId); setError(""); } })
      .catch((cause) => { if (!cancelled) { setLoadedBusinessId(businessId); setError(cause instanceof Error ? cause.message : "Qəbullar yüklənmədi."); } });
    return () => { cancelled = true; };
  }, [businessId]);
  useEffect(() => {
    if (!businessId) return;
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<BookingChangedDetail>).detail;
      if (detail?.businessId === businessId) void refresh();
    };
    window.addEventListener(BOOKING_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(BOOKING_CHANGED_EVENT, onChange);
  }, [businessId, refresh]);
  return { bookings: loadedBusinessId !== businessId ? [] : bookings, refresh, error, loading: !!businessId && loadedBusinessId !== businessId };
}
