import { useRef, useState, type ChangeEvent } from "react";
import { Download, Upload } from "lucide-react";
import BusinessFormDialog from "../components/BusinessFormDialog";
import LocalizedText from "@/features/locale/LocalizedText";
import { useCustomerText } from "@/features/locale/customerText";

export function ClientExportDialog({ onClose, onDownload }: { onClose: () => void; onDownload: () => void }) {
  const translateUi = useCustomerText();
  return <BusinessFormDialog title={translateUi("Müştəri bazasını ixrac et")} description={translateUi("Müştərilərin siyahısını CSV formatında əldə edin")} size="compact" onClose={onClose}>
    <div className="space-y-4 text-xs"><section className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"><strong className="block text-slate-900"><LocalizedText value={"Birbaşa CSV faylı kimi endir"} /></strong><p className="leading-relaxed text-slate-500"><LocalizedText value={"Müştəri profilləri və əlaqə məlumatları UTF-8 kodlaşdırması ilə fayla yazılır."} /></p><button type="button" onClick={onDownload} className="flex min-h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 font-bold text-white"><Download size={16} /><LocalizedText value={"CSV faylını endir"} /></button></section><div className="flex justify-end border-t border-slate-100 pt-4"><button type="button" onClick={onClose} className="min-h-10 cursor-pointer rounded-xl bg-slate-100 px-4 font-semibold"><LocalizedText value={"Bağla"} /></button></div></div>
  </BusinessFormDialog>;
}

export function ClientImportDialog({ onClose, onImport, onImportText }: { onClose: () => void; onImport: (file: File) => Promise<void>; onImportText: (text: string) => Promise<void> }) {
  const translateUi = useCustomerText();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  function select(event: ChangeEvent<HTMLInputElement>) { setFile(event.target.files?.[0] ?? null); }
  async function submit() { if (!file && !text.trim()) return; setBusy(true); try { if (file) await onImport(file); else await onImportText(text); onClose(); } finally { setBusy(false); } }
  return <BusinessFormDialog title={translateUi("Müştəri bazasını idxal et")} description={translateUi("CSV faylından müştəri siyahısını bazaya yükləyin")} size="compact" onClose={onClose}>
    <div className="space-y-4 text-xs"><section className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"><strong className="block text-slate-900"><LocalizedText value={"1. CSV faylı seçin"} /></strong><p className="leading-relaxed text-slate-500"><LocalizedText value={"Sütunlar: name, phone, email, gender, category, birthDate, discountPercent, note."} /></p><input ref={input} type="file" accept=".csv,.txt,text/csv,text/plain" onChange={select} className="sr-only" aria-label={translateUi("CSV və ya TXT faylını seç")} /><button type="button" onClick={() => input.current?.click()} className="flex min-h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 font-bold"><Upload size={16} />{file?.name ?? translateUi("Fayl seçin (.csv, .txt)")}</button></section><section className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4"><label htmlFor="client-import-text" className="block font-bold text-slate-900"><LocalizedText value={"2. Və ya məlumatı birbaşa yapışdırın"} /></label><p className="text-slate-500"><LocalizedText value={"Format: Ad Soyad, Mobil nömrə, Kateqoriya, Email, Qeyd"} /></p><textarea id="client-import-text" value={text} onChange={(event) => setText(event.target.value)} rows={4} placeholder={translateUi("Nərgiz Məmmədova, 050 234-56-78, VIP, nargiz@mail.az, Daimi qonaq")} className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs outline-none focus:border-slate-700" /></section><div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={onClose} className="min-h-10 cursor-pointer rounded-xl bg-slate-100 px-4 font-semibold"><LocalizedText value={"Bağla"} /></button><button type="button" disabled={(!file && !text.trim()) || busy} onClick={submit} className="min-h-10 cursor-pointer rounded-xl bg-brand-primary px-4 font-bold disabled:cursor-not-allowed disabled:opacity-50"><LocalizedText value={"Bazaya əlavə et"} /></button></div></div>
  </BusinessFormDialog>;
}
