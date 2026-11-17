import { useState, type FormEvent } from "react";
import { FileBarChart2, Mail } from "lucide-react";
import BusinessFormDialog from "../components/BusinessFormDialog";
import { businessControlClass, businessLabelClass } from "../components/BusinessField";
import { type FinanceData, type FinanceTransaction } from "./finance";
import { downloadFinanceReport, financeReportRows } from "./financeExport";
import { sendFinanceReport } from "./financeApi";
import LocalizedText from "@/features/locale/LocalizedText";
import { useCustomerText } from "@/features/locale/customerText";

type Period = "filtered" | "this_month" | "last_month" | "this_year" | "all";
type Format = "xlsx" | "csv";
type Props = { data: FinanceData; filteredTransactions: FinanceTransaction[]; defaultEmail: string; businessId?: string; onClose: () => void };

function selectPeriod(data: FinanceData, filtered: FinanceTransaction[], period: Period): FinanceTransaction[] {
  if (period === "filtered") return filtered;
  if (period === "all") return data.transactions;
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  if (period === "this_month") return data.transactions.filter((item) => item.date.startsWith(`${year}-${month}`));
  if (period === "this_year") return data.transactions.filter((item) => item.date.startsWith(`${year}-`));
  const previous = new Date(year, now.getMonth() - 1, 1);
  const prefix = `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, "0")}`;
  return data.transactions.filter((item) => item.date.startsWith(prefix));
}

export default function FinanceReportDialog({ data, filteredTransactions, defaultEmail, businessId, onClose }: Props) {
  const translateUi = useCustomerText();
  const [email, setEmail] = useState(defaultEmail);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [format, setFormat] = useState<Format>("xlsx");
  const [period, setPeriod] = useState<Period>("filtered");
  const items = selectPeriod(data, filteredTransactions, period);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!businessId) {
      setFeedback("Hesabatı göndərmək üçün biznes seçin.");
      return;
    }
    setSending(true);
    setFeedback("");
    try {
      const count = await sendFinanceReport(businessId, email, items.map((item) => item.id));
      setFeedback(`Hesabat göndərildi: ${count} əməliyyat.`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Hesabat göndərilmədi. Yenidən cəhd edin.");
    } finally {
      setSending(false);
    }
  }

  return <BusinessFormDialog size="compact" title={translateUi("Maliyyə hesabatının eksportu")} description={translateUi("Hesabatı yükləyin və ya e-poçtla göndərin")} onClose={onClose}>
    <form onSubmit={submit} className="space-y-4 text-xs">
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-brand-primary/40"><FileBarChart2 size={16} /></span>
        <div><strong className="text-slate-900"><LocalizedText value={"Maliyyə əməliyyatları arxivi"} /></strong><p className="mt-0.5 text-[11px] text-slate-500"><LocalizedText value={"Seçilmiş dövr üzrə"} /> {items.length} <LocalizedText value={"əməliyyat daxil edilir."} /></p></div>
      </div>
      <label className={businessLabelClass}><LocalizedText value={"E-poçt ünvanı *"} />
        <span className="relative block"><Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" className={`${businessControlClass} pl-10`} /></span>
      </label>
      <fieldset><legend className={businessLabelClass}><LocalizedText value={"Fayl formatı"} /></legend><div className="mt-1.5 grid grid-cols-2 gap-2">
        {([["xlsx", "Excel cədvəli", ".xlsx"], ["csv", "CSV formatı", ".csv"]] as const).map(([value, label, extension]) => <label key={value} className={`flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-xl border p-3 ${format === value ? "border-slate-900 bg-amber-50" : "border-slate-200"}`}><span className="font-bold"><LocalizedText value={label} /> <small className="font-mono text-slate-400">{extension}</small></span><input type="radio" name="finance-export-format" value={value} checked={format === value} onChange={() => setFormat(value)} className="accent-slate-900" /></label>)}
      </div></fieldset>
      <label className={businessLabelClass}><LocalizedText value={"Hesabat dövrü"} />
        <select value={period} onChange={(event) => setPeriod(event.target.value as Period)} className={businessControlClass}>
          <option value="filtered">{translateUi("Cari filtrlərə uyğun dövr")}</option>
          <option value="this_month">Cari ay</option>
          <option value="last_month">{translateUi("Keçən ay")}</option>
          <option value="this_year">Cari il</option>
          <option value="all">{translateUi("Bütün tarixçə")}</option>
        </select>
      </label>
      {businessId && <p className="text-[11px] text-slate-500"><LocalizedText value={"E-poçtla CSV göndərilir. Faylı ayrıca Excel və ya CSV formatında yükləyə bilərsiniz."} /></p>}
      {feedback && <p role="status" className="rounded-xl bg-slate-100 p-3 text-slate-700"><LocalizedText value={feedback} /></p>}
      <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
        <button type="button" onClick={onClose} className="min-h-11 rounded-xl bg-slate-100 px-4 text-xs font-semibold"><LocalizedText value={"Ləğv et"} /></button>
        <button type="button" onClick={() => downloadFinanceReport(financeReportRows(items, data), format)} className="min-h-11 rounded-xl border border-slate-200 px-4 text-xs font-semibold"><LocalizedText value={"Faylı yüklə"} /></button>
        <button type="submit" disabled={sending || !businessId} className="min-h-11 rounded-xl bg-brand-primary px-4 text-xs font-bold disabled:opacity-50">{sending ? translateUi("Göndərilir...") : translateUi("E-poçtla göndər")}</button>
      </div>
    </form>
  </BusinessFormDialog>;
}
