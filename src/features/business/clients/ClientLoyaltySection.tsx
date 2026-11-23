import { useCurrencySymbol } from "../finance/businessCurrency";
import { Check, CircleCheck, Copy, Minus, Plus, Star } from "lucide-react";
import type { LoyaltyData } from "../loyalty/loyalty";
import type { LoyaltyIssueRecord } from "../loyalty/loyaltyApi";
import type { Service } from "../services/services";
import ClientLoyaltyAssets from "./ClientLoyaltyAssets";
import { balance, totalVisits, type Client } from "./clients";
import type { DepositDirection } from "./ClientBalanceDialog";
import { clientBox } from "./clientProfileStyles";
import LocalizedText from "@/features/locale/LocalizedText";
import { useCustomerText } from "@/features/locale/customerText";

const tiers = [
  { id: "standard", name: "Standart Kart", cashback: 3, min: 0, colors: ["#1E232A", "#2B303A", "#121418"] },
  { id: "silver", name: "Gümüş Kart", cashback: 5, min: 300, colors: ["#334155", "#475569", "#1E293B"] },
  { id: "gold", name: "Qızıl Kart", cashback: 7, min: 800, colors: ["#78350F", "#92400E", "#451A03"] },
  { id: "vip", name: "VIP Kart", cashback: 10, min: 1500, colors: ["#3B0764", "#4C1D95", "#1E1B4B"] },
] as const;

export default function ClientLoyaltySection({ client, spent, loyaltyData, loyaltyIssues, loyaltyServices, loyaltyError, onIssueLoyalty, onRedeemLoyalty, onEditInfo, onBonus }: {
  client: Client;
  spent: number;
  loyaltyData: LoyaltyData;
  loyaltyIssues?: LoyaltyIssueRecord[];
  loyaltyServices?: Service[];
  loyaltyError?: string;
  onIssueLoyalty?: (templateId: string, clientId: string) => Promise<boolean>;
  onRedeemLoyalty?: (issueId: string, amount: number, note: string, serviceId?: string) => Promise<boolean>;
  onEditInfo: () => void;
  onBonus: (direction: DepositDirection) => void;
}) {
  const translateUi = useCustomerText();
  const currencySign = useCurrencySymbol();
  const money = (value: number) => `${value.toFixed(2)} ${currencySign}`;
  const tier = tiers.find((item) => item.id === (client.loyaltyTier ?? "standard")) ?? tiers[0];
  const next = tiers[tiers.indexOf(tier) + 1];
  const progress = next ? Math.max(0, Math.min(100, Math.round((spent - tier.min) / (next.min - tier.min) * 100))) : 100;
  const bonus = balance(client, "cashback");
  const cardNumber = `LC-${client.id.replace(/\D/g, "").padEnd(6, "0").slice(0, 6)}`;
  const bonusEntries = client.ledger.filter((item) => item.account === "cashback");

  return <div className="mt-4 space-y-4 text-xs">
    <section className="relative overflow-hidden rounded-3xl border border-white/10 p-5 text-white shadow-md sm:p-6" style={{ background: `linear-gradient(125deg, ${tier.colors.join(", ")})` }}>
      <div className="pointer-events-none absolute -bottom-10 -right-10 size-48 rounded-full bg-white/5 blur-2xl" />
      <div className="relative z-10 flex min-h-[175px] flex-col justify-between gap-4 sm:min-h-[185px]">
        <div className="flex flex-wrap items-start justify-between gap-3"><div className="flex gap-2.5"><span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-brand-primary font-black text-slate-900">Z</span><div><strong className="text-[11px] leading-none">ZEYVO LOYALTY</strong><button type="button" onClick={() => navigator.clipboard?.writeText(cardNumber)} title={translateUi("Kart nömrəsini kopyala")} className="mt-1 flex items-center gap-1.5 tabular-nums text-xs text-white/70 hover:text-white">{cardNumber}<Copy size={12} /></button></div></div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-white/20 bg-white/15 px-3 py-1 font-bold">{translateUi(tier.name)}</span><span className="rounded-md border border-emerald-400/30 bg-emerald-500/25 px-2 py-0.5 text-[10px] font-bold text-emerald-300"><LocalizedText value={"Aktiv"} /></span><button type="button" onClick={onEditInfo} className="inline-flex items-center gap-1 rounded-xl border border-white/20 bg-white/15 px-2.5 py-1 text-[11px] font-bold"><Star size={13} className="text-brand-primary" /><LocalizedText value={"Səviyyəni dəyiş"} /></button></div></div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">{[["Keşbek dərəcəsi", `+${tier.cashback}%`, "text-brand-primary"], ["Fərdi endirim", `${client.discountPercent}%`, "text-white"], ["Bonus balansı", money(bonus), "text-emerald-300"]].map(([title, value, color]) => <div key={title} className="min-w-0 rounded-2xl border border-white/15 bg-white/10 px-2.5 py-2 sm:px-3.5"><p className="text-[10px] text-white/70"><LocalizedText value={title} /></p><strong className={`mt-0.5 block break-words tabular-nums text-sm sm:text-lg ${color}`}>{value}</strong></div>)}</div>
        <div className="flex flex-wrap items-end justify-between gap-2 border-t border-white/15 pt-3"><div><p className="text-[10px] text-white/60"><LocalizedText value={"Kart sahibi"} /></p><strong className="text-sm">{client.name}</strong></div><div className="text-right"><p className="text-[10px] text-white/60"><LocalizedText value={"Ümumi dövriyyə"} /></p><strong className="tabular-nums">{money(spent)} <span className="font-normal text-white/60">({totalVisits(client)} <LocalizedText value={"qəbul)"} /></span></strong></div></div>
      </div>
    </section>

    <section className={`${clientBox} space-y-4`}><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold"><LocalizedText value={"Loyallıq inkişafı və keçid şərtləri"} /></h3><span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">{translateUi(tier.name)}</span></div><span className="tabular-nums font-bold text-amber-800">{next ? `${translateUi("Növbəti səviyyəyə:")} +${money(Math.max(0, next.min - spent))}` : translateUi("Maksimum səviyyə əldə olunub")}</span></div>
      <div className="relative py-2"><div className="absolute left-[12%] right-[12%] top-6 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-primary" style={{ width: `${progress}%` }} /></div><div className="relative grid grid-cols-4 gap-1 text-center">{tiers.map((item, index) => <div key={item.id} className="min-w-0"><span className={`mx-auto mb-2 flex size-8 items-center justify-center rounded-full border-2 tabular-nums font-bold ${item.id === tier.id ? "border-amber-400 bg-brand-primary text-slate-900 ring-2 ring-amber-200" : spent >= item.min ? "border-emerald-600 bg-emerald-500 text-white" : "border-slate-300 bg-slate-100 text-slate-400"}`}>{item.id === tier.id ? <Star size={14} fill="currentColor" /> : spent >= item.min ? <Check size={14} /> : index + 1}</span><strong className="block truncate text-[10px] sm:text-xs">{translateUi(item.name)}</strong><span className="block text-[11px] font-bold text-amber-700">+{item.cashback}%</span><span className="text-[10px] text-slate-400">{item.min} {currencySign}</span></div>)}</div></div>
      <div className="flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-2 text-[11px] text-slate-500"><span><LocalizedText value={"Cari dövriyyə:"} /> <strong className="tabular-nums text-slate-800">{money(spent)}</strong></span><span>{next ? <><LocalizedText value={"Növbəti hədəf:"} /> <strong className="tabular-nums text-slate-800">{money(next.min)}</strong> ({translateUi(next.name)})</> : translateUi("VIP imtiyazları aktivdir")}</span></div>
    </section>

    <section className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm sm:p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><CircleCheck size={16} className="text-emerald-600" /><h3 className="font-bold"><LocalizedText value={"Keşbek və bonus balansı"} /></h3><span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800"><LocalizedText value={"1 bonus = 1.00"} /> {currencySign}</span></div><div className="mt-1 flex items-baseline gap-2"><strong className="tabular-nums text-2xl font-black text-emerald-700 sm:text-3xl">{money(bonus)}</strong><span className="text-slate-400"><LocalizedText value={"mövcud bonus"} /></span></div><p className="mt-1 text-[11px] text-slate-500"><LocalizedText value={"Xidmət və məhsul qəbullarında ödəniş kimi tam və ya qismən istifadə edilə bilər."} /></p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => onBonus("topup")} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-brand-primary px-4 font-bold"><Plus size={16} /><LocalizedText value={"Bonus əlavə et"} /></button><button type="button" onClick={() => onBonus("spend")} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 font-bold"><Minus size={16} /><LocalizedText value={"Bonus sil"} /></button></div></div></section>

    <ClientLoyaltyAssets client={client} data={loyaltyData} issues={loyaltyIssues} services={loyaltyServices} error={loyaltyError} onIssue={onIssueLoyalty} onRedeem={onRedeemLoyalty} />

    <section className={`${clientBox} space-y-3`}><h3 className="font-bold"><LocalizedText value={"Bonus əməliyyatları"} /></h3>{bonusEntries.length ? bonusEntries.map((item) => <div key={item.id} className="flex flex-wrap justify-between gap-2 border-b border-slate-100 py-2"><div><strong>{item.amount >= 0 ? translateUi("Mədaxil") : translateUi("Məxaric")}</strong><p className="text-slate-500">{item.date.slice(0, 10).split("-").reverse().join(".")} · {item.note || translateUi("Qeyd yoxdur")}</p></div><strong className={item.amount >= 0 ? "text-emerald-700" : "text-rose-700"}>{item.amount > 0 ? "+" : ""}{money(item.amount)}</strong></div>) : <p className="py-4 text-center text-slate-400"><LocalizedText value={"Bonus əməliyyatı yoxdur."} /></p>}</section>
  </div>;
}
