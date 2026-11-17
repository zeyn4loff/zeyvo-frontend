import { useEffect, useState } from "react";
import { useLanguage } from "@/features/locale/language";
import { authorizeGoogleCalendar, disconnectGoogleCalendar, readGoogleCalendarStatus, syncGoogleCalendar, type GoogleCalendarStatus } from "./profileApi";
import { profileCopy } from "./profileLocale";
import LocalizedText from "@/features/locale/LocalizedText";


const messages = {
  az: { connected: "Qoşulub", connect: "Google hesabını qoş", disconnect: "Bağlantını kəs", unavailable: "Google Calendar hələ sazlanmayıb.", own: "Yalnız sizə təyin olunmuş qəbullar şəxsi təqviminizlə sinxronlaşdırılır.", done: "Sinxronlaşdırıldı", error: "Google hesabını qoşmaq mümkün olmadı.", loading: "Yüklənir..." },
  ru: { connected: "Подключено", connect: "Подключить Google", disconnect: "Отключить", unavailable: "Google Calendar ещё не настроен.", own: "С личным календарём синхронизируются только назначенные вам записи.", done: "Синхронизировано", error: "Не удалось подключить аккаунт Google.", loading: "Загрузка..." },
  tr: { connected: "Bağlı", connect: "Google hesabını bağla", disconnect: "Bağlantıyı kes", unavailable: "Google Calendar henüz yapılandırılmadı.", own: "Yalnızca size atanan randevular kişisel takviminizle senkronize edilir.", done: "Senkronize edildi", error: "Google hesabı bağlanamadı.", loading: "Yükleniyor..." },
  en: { connected: "Connected", connect: "Connect Google", disconnect: "Disconnect", unavailable: "Google Calendar is not configured yet.", own: "Only appointments assigned to you sync with your personal calendar.", done: "Synced", error: "Could not connect the Google account.", loading: "Loading..." },
} as const;

export default function ConnectedAppsPanel() {
  const { language } = useLanguage();
  const text = profileCopy(language);
  const labels = messages[language];
  const [status, setStatus] = useState<GoogleCalendarStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(() => {
    const result = new URLSearchParams(window.location.search).get("google");
    return result === "connected" ? labels.connected : result ? labels.error : "";
  });
  async function load() {
    try { setStatus(await readGoogleCalendarStatus()); }
    catch (error) { setNotice(error instanceof Error ? error.message : labels.error); }
  }
  useEffect(() => {
    let active = true;
    void readGoogleCalendarStatus()
      .then((value) => { if (active) setStatus(value); })
      .catch((error) => { if (active) setNotice(error instanceof Error ? error.message : labels.error); });
    return () => { active = false; };
  }, [labels.error]);
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (!query.has("google")) return;
    query.delete("google");
    window.history.replaceState(null, "", `${window.location.pathname}${query.size ? `?${query}` : ""}${window.location.hash}`);
  }, []);
  async function act(action: "connect" | "sync" | "disconnect") {
    setBusy(true); setNotice("");
    try {
      if (action === "connect") { window.location.assign(await authorizeGoogleCalendar()); return; }
      if (action === "sync") { await syncGoogleCalendar(); setNotice(labels.done); }
      if (action === "disconnect") { await disconnectGoogleCalendar(); setNotice(""); }
      await load();
    } catch (error) { setNotice(error instanceof Error ? error.message : labels.error); }
    finally { setBusy(false); }
  }
  return <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
    <div className="border-b border-slate-100 pb-3">
      <h2 className="text-sm font-bold">{text.apps}</h2>
      <p className="mt-1 text-xs font-medium text-slate-400">{text.appsDetail}</p>
    </div>
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex min-w-0 items-center gap-3.5">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white p-2 shadow-sm"><img src="/google-calendar.png" alt="" className="size-full object-contain" /></span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-bold">Google Calendar</h3>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${status?.connected ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600"}`}>
              <span className={`size-1.5 rounded-full ${status?.connected ? "bg-emerald-500" : "bg-slate-400"}`} />{status?.connected ? labels.connected : text.disconnected}
            </span></div>
          <p className="mt-0.5 text-xs font-medium text-slate-500">{status?.connected ? labels.own : text.googleDisconnected}</p>
        </div>
      </div>
      <div className="grid gap-2 min-[400px]:grid-cols-2 sm:flex sm:shrink-0">
        {status?.connected ? <><button type="button" disabled={busy} onClick={() => void act("sync")} className="min-h-11 rounded-xl bg-brand-primary px-4 text-xs font-bold disabled:opacity-50">{text.sync}</button>
          <button type="button" disabled={busy} onClick={() => void act("disconnect")} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold disabled:opacity-50">{labels.disconnect}</button></>
          : <button type="button" disabled={busy || !status?.configured} onClick={() => void act("connect")} className="min-h-11 rounded-xl bg-brand-primary px-4 text-xs font-bold disabled:opacity-50">{status ? labels.connect : labels.loading}</button>}
      </div>
    </div>
    {status && !status.configured && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">{labels.unavailable}</p>}
    {notice && <p role="status" className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600"><LocalizedText value={notice} /></p>}
  </section>;
}
