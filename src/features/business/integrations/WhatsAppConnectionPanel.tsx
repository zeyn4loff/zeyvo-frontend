import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, QrCode, Smartphone } from "lucide-react";
import { disconnectWhatsApp, fetchWhatsApp, requestWhatsAppQr } from "./integrationApi";
import LocalizedText from "@/features/locale/LocalizedText";
import { useCustomerText } from "@/features/locale/customerText";

export default function WhatsAppConnectionPanel({ businessId, onStateChange }: { businessId: string; onStateChange?: (state: string) => void }) {
  const translateUi = useCustomerText();
  const [state, setState] = useState("loading");
  const [qr, setQr] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const result = await fetchWhatsApp(businessId);
      setState(result.state);
      onStateChange?.(result.state);
      if (result.state === "open") setQr("");
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Statusu yoxlamaq mümkün olmadı.");
    }
  }, [businessId, onStateChange]);

  useEffect(() => {
    if (!businessId) return;
    void fetchWhatsApp(businessId)
      .then((result) => { setState(result.state); onStateChange?.(result.state); })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Statusu yoxlamaq mümkün olmadı."));
  }, [businessId, onStateChange]);

  useEffect(() => {
    if (!businessId || !qr) return;
    const timer = window.setInterval(() => { void refresh(); }, 5000);
    return () => window.clearInterval(timer);
  }, [businessId, qr, refresh]);

  async function connect() {
    setBusy(true);
    setError("");
    try {
      const result = await requestWhatsAppQr(businessId);
      setQr(result.qr);
      setState(result.state);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "QR kodu almaq mümkün olmadı.");
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    setError("");
    try {
      await disconnectWhatsApp(businessId);
      setQr("");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Bağlantını kəsmək mümkün olmadı.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="grid min-w-0 gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[minmax(0,1fr)_220px]" aria-labelledby="whatsapp-connection-title">
    <div className="min-w-0">
      <h3 id="whatsapp-connection-title" className="font-bold"><LocalizedText value={"WhatsApp bağlantısı"} /></h3>
      <p className="mt-1 text-sm leading-6 text-slate-600"><LocalizedText value={"WhatsApp tətbiqində"} /> <strong><LocalizedText value={"Bağlı cihazlar"} /></strong> → <strong><LocalizedText value={"Cihazı bağlayın"} /></strong> <LocalizedText value={"bölməsini açın və QR kodunu oxudun."} /></p>
      <div role="status" className={`mt-4 flex items-start gap-2 rounded-xl border p-3 text-sm ${state === "open" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-700"}`}>
        {state === "open" ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden="true" /> : <Smartphone size={18} className="mt-0.5 shrink-0" aria-hidden="true" />}
        <p>{state === "open" ? translateUi("Telefon qoşulub.") : state === "loading" ? translateUi("Bağlantı yoxlanılır...") : translateUi("Telefon qoşulmayıb.")}</p>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-red-700"><LocalizedText value={error} /></p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" disabled={busy || !businessId} onClick={() => void (state === "open" ? disconnect() : connect())} className="min-h-11 rounded-xl bg-brand-primary px-4 text-sm font-bold text-slate-900 disabled:opacity-50">{busy ? translateUi("Gözləyin...") : state === "open" ? translateUi("Bağlantını kəs") : qr ? "Yeni QR kodu al" : "QR kodu al"}</button>
        <button type="button" disabled={busy || !businessId} onClick={() => void refresh()} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold"><LocalizedText value={"Statusu yenilə"} /></button>
      </div>
    </div>
    <div className={`flex min-h-48 min-w-0 flex-col items-center justify-center rounded-2xl border p-4 text-center ${state === "open" ? "border-emerald-200 bg-emerald-50" : "border-dashed border-slate-300 bg-white"}`}>
      {qr && state !== "open" ? <img src={qr} alt={translateUi("WhatsApp bağlantısı üçün QR kodu")} className="aspect-square w-full max-w-44" /> : state === "open" ? <><CheckCircle2 size={48} className="text-emerald-600" aria-hidden="true" /><span className="mt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-800"><Smartphone size={14} aria-hidden="true" /><LocalizedText value={"Telefon qoşulub"} /></span></> : <><QrCode size={48} className="text-slate-300" aria-hidden="true" /><span className="mt-2 text-xs font-semibold text-slate-500"><LocalizedText value={"QR kodu gözlənilir"} /></span></>}
    </div>
  </section>;
}
