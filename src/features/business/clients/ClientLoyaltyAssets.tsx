import { useCurrencySymbol } from "../finance/businessCurrency";
import { Gift, Plus, Ticket } from "lucide-react";
import { useState, type FormEvent } from "react";
import BusinessFormDialog from "../components/BusinessFormDialog";
import type { GiftCard, LoyaltyData, Subscription } from "../loyalty/loyalty";
import type { LoyaltyIssueRecord } from "../loyalty/loyaltyApi";
import type { Service } from "../services/services";
import type { Client } from "./clients";
import { clientBox } from "./clientProfileStyles";

type Kind = "gift_card" | "subscription";
type Props = {
  client: Client;
  data: LoyaltyData;
  issues?: LoyaltyIssueRecord[];
  services?: Service[];
  error?: string;
  onIssue?: (templateId: string, clientId: string) => Promise<boolean>;
  onRedeem?: (issueId: string, amount: number, note: string, serviceId?: string) => Promise<boolean>;
};
const field = "mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-slate-900";
const date = (value?: string | null) => value ? new Date(value).toLocaleDateString("az-AZ") : "—";

export default function ClientLoyaltyAssets({ client, data, issues, services = [], error = "", onIssue, onRedeem }: Props) {
  const currencySign = useCurrencySymbol();
  const [kind, setKind] = useState<Kind>("gift_card");
  const [openedAt] = useState(() => Date.now());
  const [action, setAction] = useState<"issue" | "redeem" | null>(null);
  const [selected, setSelected] = useState<LoyaltyIssueRecord | null>(null);
  const [templateId, setTemplateId] = useState("");
  const [amount, setAmount] = useState(1);
  const [serviceId, setServiceId] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState("");
  const allIssues: LoyaltyIssueRecord[] = issues ?? [
    ...(data.issuedGiftCards ?? []).map((item) => ({ ...item, kind: "gift_card" as const, clientName: client.name, templateName: data.giftCards.find((card) => card.id === item.templateId)?.name ?? item.code, expiresAt: null })),
    ...(data.issuedSubscriptions ?? []).map((item) => ({ ...item, kind: "subscription" as const, clientName: client.name, templateName: data.subscriptions.find((card) => card.id === item.templateId)?.name ?? item.code, expiresAt: null })),
  ];
  const mine = allIssues.filter((item) => item.clientId === client.id);
  const visible = mine.filter((item) => item.kind === kind).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  const templates: (GiftCard | Subscription)[] = kind === "gift_card" ? data.giftCards : data.subscriptions;
  const available = templates.filter((item) => item.status === "active" && item.availableForSale);
  const selectedTemplate = templates.find((item) => item.id === selected?.templateId);
  const serviceRequired = !!selectedTemplate && (("nominal" in selectedTemplate && selectedTemplate.type === "service") || ("visitsCount" in selectedTemplate && selectedTemplate.onlyAssignedServices));
  const allowedServices = selectedTemplate?.serviceIds ?? [];
  const close = () => { setAction(null); setLocalError(""); setSelected(null); setServiceId(""); setNote(""); };
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setLocalError("");
    try {
      const ok = action === "issue" ? await onIssue?.(templateId, client.id) : selected ? await onRedeem?.(selected.id, kind === "subscription" ? 1 : amount, note, serviceId || undefined) : false;
      if (ok) { close(); setTemplateId(""); } else setLocalError("Əməliyyat alınmadı. Məlumatları yoxlayın.");
    } catch { setLocalError("Əməliyyat alınmadı. Yenidən cəhd edin."); }
    finally { setBusy(false); }
  }
  return <section className={`${clientBox} min-w-0 space-y-4`}>
    <div className="flex flex-wrap items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-brand-primary/30 text-slate-900"><Gift size={19} /></span><div><h3 className="text-sm font-bold text-slate-900">Kartlar və abunəliklər</h3><p className="text-xs text-slate-500">{client.name} üçün verilənlər və istifadə tarixçəsi</p></div></div>
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-3"><div role="tablist" aria-label="Müştərinin kartları və abunəlikləri" className="inline-flex max-w-full rounded-2xl bg-slate-100 p-1">{(["gift_card", "subscription"] as Kind[]).map((value) => <button key={value} type="button" role="tab" aria-selected={kind === value} onClick={() => setKind(value)} className={`min-h-10 rounded-xl px-3 text-xs font-bold sm:px-4 ${kind === value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>{value === "gift_card" ? "Hədiyyə kartları" : "Abunəliklər"} <span className="ml-1 text-slate-400">{mine.filter((item) => item.kind === value).length}</span></button>)}</div>{onIssue && <button type="button" disabled={!available.length} onClick={() => { setTemplateId(""); setAction("issue"); }} className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl bg-brand-primary px-3 text-xs font-bold text-slate-900 disabled:opacity-40"><Plus size={15} />{kind === "gift_card" ? "Kart ver" : "Abunəlik ver"}</button>}</div>
    {visible.length ? <div className="grid gap-3 lg:grid-cols-2">{visible.map((item) => { const expired = !!item.expiresAt && new Date(item.expiresAt).getTime() < openedAt; const active = item.balance > 0 && !expired; return <article key={item.id} className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 sm:p-4"><div className="flex min-w-0 items-start justify-between gap-3"><div className="min-w-0"><h4 className="break-words text-sm font-bold text-slate-900">{item.templateName}</h4><p className="mt-1 break-all tabular-nums text-[11px] text-slate-500">{item.code}</p></div><span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>{active ? "Aktiv" : expired ? "Vaxtı bitib" : "İstifadə edilib"}</span></div><div className="mt-3 flex flex-wrap items-end justify-between gap-2 border-t border-slate-200 pt-3"><div><p className="text-[11px] text-slate-500">Qalıq</p><strong className="text-lg font-black text-slate-900">{kind === "gift_card" ? `${Number(item.balance).toFixed(2)} ${currencySign}` : `${item.balance} ziyarət`}</strong><p className="text-[11px] text-slate-500">Verilib: {date(item.issuedAt)}{item.expiresAt ? ` · Bitir: ${date(item.expiresAt)}` : ""}</p></div>{onRedeem && <button type="button" disabled={!active} onClick={() => { setSelected(item); setAmount(kind === "gift_card" ? Math.min(1, item.balance) : 1); setServiceId(""); setAction("redeem"); }} className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold disabled:opacity-40">İstifadə et</button>}</div>{item.history.length > 0 && <details className="mt-3 border-t border-slate-200 pt-2 text-xs"><summary className="cursor-pointer font-semibold text-slate-700">İstifadə tarixçəsi ({item.history.length})</summary><ul className="mt-2 space-y-1 text-slate-500">{item.history.map((entry) => <li key={entry.id} className="break-words">{date(entry.date)} · −{entry.amount}{kind === "gift_card" ? ` ${currencySign}` : " ziyarət"} · Qalıq {entry.balanceAfter}{entry.note ? ` · ${entry.note}` : ""}</li>)}</ul></details>}</article>; })}</div> : <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-xs text-slate-500"><Ticket size={18} className="shrink-0" /><span>Bu müştəriyə hələ {kind === "gift_card" ? "hədiyyə kartı" : "abunəlik"} verilməyib.</span></div>}
    {action && <BusinessFormDialog title={action === "issue" ? kind === "gift_card" ? "Hədiyyə kartı ver" : "Abunəlik ver" : "İstifadəni qeydə al"} description={client.name} onClose={close} size="medium"><form onSubmit={(event) => void submit(event)} className="space-y-4 text-sm">{action === "issue" ? <label className="block font-semibold">{kind === "gift_card" ? "Hədiyyə kartı" : "Abunəlik"}<select required value={templateId} onChange={(event) => setTemplateId(event.target.value)} className={field}><option value="">Seçin</option>{available.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label> : <><p className="rounded-xl bg-slate-50 p-3 text-slate-600">{selected?.templateName} · Qalıq: {selected?.balance}{kind === "gift_card" ? ` ${currencySign}` : " ziyarət"}</p>{kind === "gift_card" && <label className="block font-semibold">Məbləğ ({currencySign})<input required type="number" min="0.01" max={selected?.balance} step="0.01" value={amount} onChange={(event) => setAmount(Number(event.target.value))} className={field} /></label>}{serviceRequired && <label className="block font-semibold">Xidmət<select required value={serviceId} onChange={(event) => setServiceId(event.target.value)} className={field}><option value="">Xidmət seçin</option>{allowedServices.map((id) => <option key={id} value={id}>{services.find((service) => service.id === id)?.name ?? id}</option>)}</select></label>}<label className="block font-semibold">Qeyd<input value={note} onChange={(event) => setNote(event.target.value)} maxLength={150} className={field} /></label></>}{(localError || error) && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-700">{error || localError}</p>}<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={close} className="min-h-11 rounded-xl bg-slate-100 px-4 font-bold">İmtina</button><button type="submit" disabled={busy} className="min-h-11 rounded-xl bg-brand-primary px-4 font-bold disabled:opacity-50">{busy ? "Gözləyin..." : "Təsdiq et"}</button></div></form></BusinessFormDialog>}
  </section>;
}
