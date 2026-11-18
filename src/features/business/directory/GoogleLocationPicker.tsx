import { useEffect, useRef, useState } from "react";
import { ExternalLink, MapPin } from "lucide-react";
import LocalizedText from "@/features/locale/LocalizedText";
import { useCustomerText } from "@/features/locale/customerText";

type Point = { lat: number; lng: number };
type MapsApi = {
  importLibrary: (name: "maps" | "geocoding" | "marker") => Promise<Partial<MapsApi>>;
  Map: new (element: HTMLElement, options: Record<string, unknown>) => {
    addListener: (event: string, listener: (event: { latLng?: { lat: () => number; lng: () => number } }) => void) => void;
    setCenter: (point: Point) => void;
    setZoom: (zoom: number) => void;
  };
  Marker: new (options: Record<string, unknown>) => { setPosition: (point: Point) => void; setMap: (map: null) => void };
  Geocoder: new () => { geocode: (request: { address: string }, callback: (results: { geometry: { location: { lat: () => number; lng: () => number } } }[] | null, status: string) => void) => void };
};

declare global { interface Window { google?: { maps: MapsApi }; __zeyvoGoogleMapsReady?: () => void; gm_authFailure?: () => void } }

let mapsPromise: Promise<MapsApi> | undefined;
function loadMaps(key: string): Promise<MapsApi> {
  mapsPromise ??= new Promise<MapsApi>((resolve, reject) => {
    const script = document.createElement("script");
    let timeout = 0;
    const fail = (message: string) => {
      window.clearTimeout(timeout);
      delete window.__zeyvoGoogleMapsReady;
      script.remove();
      reject(new Error(message));
    };
    window.gm_authFailure = () => {
      window.dispatchEvent(new Event("zeyvo-google-maps-auth-failure"));
      fail("Google Maps açarı etibarsızdır və ya bu sayt üçün icazə verilməyib.");
    };
    const ready = async () => {
      const maps = window.google?.maps;
      if (!maps?.importLibrary) { fail("Google Maps yüklənmədi."); return; }
      try {
        const [mapLibrary, geocodingLibrary, markerLibrary] = await Promise.all([
          maps.importLibrary("maps"),
          maps.importLibrary("geocoding"),
          maps.importLibrary("marker"),
        ]);
        maps.Map = mapLibrary.Map ?? maps.Map;
        maps.Geocoder = geocodingLibrary.Geocoder ?? maps.Geocoder;
        maps.Marker = markerLibrary.Marker ?? maps.Marker;
        if (!maps.Map || !maps.Geocoder || !maps.Marker) throw new Error("Google Maps yüklənmədi.");
        window.clearTimeout(timeout);
        resolve(maps);
      } catch { fail("Google Maps yüklənmədi."); }
    };
    if (window.google?.maps?.importLibrary) { void ready(); return; }
    window.__zeyvoGoogleMapsReady = () => { delete window.__zeyvoGoogleMapsReady; void ready(); };
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&loading=async&callback=__zeyvoGoogleMapsReady`;
    script.async = true;
    script.onerror = () => fail("Google Maps yüklənmədi.");
    timeout = window.setTimeout(() => fail("Google Maps yüklənmədi."), 12000);
    document.head.appendChild(script);
  }).catch((error: unknown) => { mapsPromise = undefined; throw error; });
  return mapsPromise;
}

export default function GoogleLocationPicker({ address, city, country, latitude, longitude, onSelect }: {
  address: string; city: string; country: string; latitude?: number | null; longitude?: number | null;
  onSelect: (point: Point & { address?: string }) => void;
}) {
  const translateUi = useCustomerText();
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<InstanceType<MapsApi["Map"]> | null>(null);
  const marker = useRef<InstanceType<MapsApi["Marker"]> | null>(null);
  const geocoder = useRef<InstanceType<MapsApi["Geocoder"]> | null>(null);
  const [error, setError] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const point = latitude != null && longitude != null ? { lat: latitude, lng: longitude } : null;
  const pointRef = useRef<Point | null>(point);
  const onSelectRef = useRef(onSelect);
  const initialQuery = useRef(latitude != null && longitude != null ? [address, city, country].join(", ") : "");
  useEffect(() => { pointRef.current = latitude != null && longitude != null ? { lat: latitude, lng: longitude } : null; onSelectRef.current = onSelect; }, [latitude, longitude, onSelect]);

  useEffect(() => {
    const onAuthFailure = () => setError("Google Maps açarı etibarsızdır və ya bu sayt üçün icazə verilməyib.");
    window.addEventListener("zeyvo-google-maps-auth-failure", onAuthFailure);
    return () => window.removeEventListener("zeyvo-google-maps-auth-failure", onAuthFailure);
  }, []);

  useEffect(() => {
    if (!key || !container.current) return;
    let cancelled = false;
    loadMaps(key).then((maps) => {
      if (cancelled || !container.current) return;
      const center = pointRef.current ?? { lat: 40.4093, lng: 49.8671 };
      const created = new maps.Map(container.current, { center, zoom: pointRef.current ? 16 : 11, mapTypeControl: false, streetViewControl: false, fullscreenControl: false });
      map.current = created;
      geocoder.current = new maps.Geocoder();
      setMapReady(true);
      if (pointRef.current) marker.current = new maps.Marker({ map: created, position: pointRef.current });
      created.addListener("click", (event) => {
        if (!event.latLng) return;
        onSelectRef.current({ lat: event.latLng.lat(), lng: event.latLng.lng() });
      });
    }).catch((issue: unknown) => { if (!cancelled) setError(issue instanceof Error ? issue.message : "Google Maps yüklənmədi."); });
    return () => { cancelled = true; marker.current?.setMap(null); marker.current = null; map.current = null; geocoder.current = null; setMapReady(false); };
  }, [key]);

  useEffect(() => {
    const query = [address, city, country].join(", ");
    if (!mapReady || !geocoder.current || !city || address.trim().length < 5 || query === initialQuery.current) return;
    const geocoding = geocoder.current;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      geocoding.geocode({ address: query }, (results, status) => {
        if (cancelled || status !== "OK" || !results?.[0]) return;
        initialQuery.current = query;
        const location = results[0].geometry.location;
        onSelectRef.current({ lat: location.lat(), lng: location.lng() });
      });
    }, 700);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [address, city, country, mapReady]);

  useEffect(() => {
    if (!map.current || !window.google?.maps) return;
    const selectedPoint = latitude != null && longitude != null ? { lat: latitude, lng: longitude } : null;
    if (selectedPoint) {
      if (marker.current) marker.current.setPosition(selectedPoint);
      else marker.current = new window.google.maps.Marker({ map: map.current, position: selectedPoint });
      map.current.setCenter(selectedPoint);
      map.current.setZoom(16);
    } else { marker.current?.setMap(null); marker.current = null; }
  }, [latitude, longitude]);

  const url = point ? `https://www.google.com/maps/search/?api=1&query=${point.lat},${point.lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([address, city, country].filter(Boolean).join(", "))}`;
  return <div className="space-y-2">
    <div className="flex flex-wrap items-center justify-between gap-2"><span className="flex items-center gap-1 text-xs font-semibold"><MapPin size={15} className="text-brand-primary" /><LocalizedText value={"Xəritədə məkan (Google Maps)"} /></span><a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-semibold text-slate-600 underline"><LocalizedText value={"Google Maps-da aç"} /> <ExternalLink size={13} /></a></div>
    {key ? <><div className="relative"><div ref={container} role="application" aria-label={translateUi("Filialın yerini seçmək üçün xəritə")} className="h-52 w-full overflow-hidden rounded-2xl border border-slate-200 sm:h-60" />{error && <div role="alert" className="absolute inset-0 flex items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-xs font-medium text-red-700"><LocalizedText value={error} /></div>}</div><p className="text-[11px] text-slate-500"><LocalizedText value={"Ünvan yazdıqda xəritədə axtarılır. Dəqiq yeri seçmək üçün xəritəyə toxunun."} /></p></> : <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600"><LocalizedText value={"Google Maps açarı qurulmayıb."} /></p>}
  </div>;
}
