import { useCurrencySymbol } from "../finance/businessCurrency";
import { useState, type FormEvent } from "react";
import BusinessFormDialog from "../components/BusinessFormDialog";
import { balance, type Client } from "./clients";
import { clientField, clientLabel } from "./clientProfileStyles";
import LocalizedText from "@/features/locale/LocalizedText";
import { useCustomerText } from "@/features/locale/customerText";

export type DepositDirection = "topup" | "spend";

export default function ClientBalanceDialog({ client, account, initialDirection, onClose, onSave }: {
  client: Client;
  account: "deposit" | "cashback";
  initialDirection: DepositDirection;
  onClose: () => void;
  onSave: (direction: DepositDirection, amount: number, method: string, note: string) => Promise<boolean>;
}) {
  const translateUi = useCustomerText();
  const currencySign = useCurrencySymbol();
  const [direction, setDirection] = useState<DepositDirection>(initialDirection);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const current = balance(client, account);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 0.01 || Math.abs(Math.round(value * 100) - value * 100) > 1e-6) {
      setError(`Ən azı 0.01 ${currencySign} məbləğ daxil edin.`);
      return;
    }
    if (direction === "spend" && value > current) {
      setError(account === "deposit" ? "Depozit balansı kifayət etmir." : "Bonus balansı kifayət etmir.");
      return;
    }
    const form = new FormData(event.currentTarget);
    if (await onSave(direction, value, String(form.get("method") ?? ""), String(form.get("note") ?? "").trim())) onClose();
    else setError("Əməliyyatı yadda saxlamaq mümkün olmadı.");
  }

  return <BusinessFormDialog title={account === "deposit" ? translateUi("Depozit əməliyyatı") : translateUi("Bonus əməliyyatı")} description={`${client.name} • ${translateUi("Cari qalıq:")} ${current.toFixed(2)} ${currencySign}`} size="compact" onClose={onClose}>
    <form onSubmit={submit} className="space-y-4 text-xs">
      <div className={clientLabel}><LocalizedText value={"Əməliyyat növü"} /><div className="mt-1.5 grid grid-cols-2 gap-1.5 rounded-xl border border-slate-200 bg-slate-100 p-1">{(["topup", "spend"] as const).map((item) => <button key={item} type="button" aria-pressed={direction === item} onClick={() => { setDirection(item); setError(""); }} className={`min-h-9 rounded-lg px-2 font-bold ${direction === item ? "bg-brand-primary text-slate-900 shadow-sm" : "text-slate-600"}`}>{item === "topup" ? translateUi("+ Mədaxil (Artır)") : translateUi("− Məxaric (Sil / Ödə)")}</button>)}</div></div>
      <div className={clientLabel}><LocalizedText value={"Məbləğ ("} />{currencySign})<input type="number" inputMode="decimal" min="0.01" step="0.01" required autoFocus value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" className={`${clientField} tabular-nums`} /><div className="mt-2 flex flex-wrap gap-1.5">{[20, 50, 100, 200].map((value) => <button key={value} type="button" onClick={() => setAmount(String(value))} className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{value} {currencySign}</button>)}</div></div>
      {account === "deposit" && direction === "topup" && <label className={clientLabel}><LocalizedText value={"Ödəniş üsulu"} /><select name="method" defaultValue="Bank kartı (POS Terminal)" className={clientField}><option>{translateUi("Nağd ödəniş")}</option><option>{translateUi("Bank kartı (POS Terminal)")}</option><option>{translateUi("Bank köçürməsi")}</option></select></label>}
      <label className={clientLabel}><LocalizedText value={"Təsvir və ya qeyd"} /><input name="note" maxLength={200} placeholder={translateUi("Məs: Avans depoziti, paket ödənişi...")} className={clientField} /></label>
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-2.5 text-rose-700"><LocalizedText value={error} /></p>}
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={onClose} className="min-h-10 rounded-xl bg-slate-100 px-4 font-semibold"><LocalizedText value={"İmtina"} /></button><button type="submit" className="min-h-10 rounded-xl bg-brand-primary px-5 font-bold"><LocalizedText value={"Təsdiq et"} /></button></div>
    </form>
  </BusinessFormDialog>;
}
