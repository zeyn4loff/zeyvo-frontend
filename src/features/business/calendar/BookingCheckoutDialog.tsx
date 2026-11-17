import { useState, type FormEvent } from "react";
import type { BusinessSession } from "../auth/businessSession";
import { balance, phoneDigits, type Client } from "../clients/clients";
import BusinessFormDialog from "../components/BusinessFormDialog";
import type { FinanceData } from "../finance/finance";
import { paymentLabels, type PaymentMethod } from "../pos/pos";
import type { Booking } from "./bookings";
import LocalizedText from "@/features/locale/LocalizedText";
import { useCustomerText } from "@/features/locale/customerText";

export default function BookingCheckoutDialog({ session, booking, accounts, clients, initialMethod = "cash", onClose, onConfirm }: {
  session: BusinessSession;
  booking: Booking;
  accounts: FinanceData["accounts"];
  clients: Client[];
  initialMethod?: PaymentMethod;
  onClose: () => void;
  onConfirm: (method: PaymentMethod, accountId: string) => Promise<string | null> | string | null;
}) {
  const translateUi = useCustomerText();
  void session;
  const client = clients.find((item) => item.id === booking.clientId || (phoneDigits(booking.phone).length >= 9 && phoneDigits(item.phone) === phoneDigits(booking.phone)));
  const [method, setMethod] = useState<PaymentMethod>(initialMethod);
  const [accountId, setAccountId] = useState(accounts.find((account) => account.type === (initialMethod === "terminal" ? "pos" : "cash"))?.id ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  function chooseMethod(next: PaymentMethod) { setMethod(next); if (next === "cash" || next === "terminal") setAccountId(accounts.find((account) => account.type === (next === "cash" ? "cash" : "pos"))?.id ?? ""); }
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (busy) return; setBusy(true); try { const result = await onConfirm(method, accountId); if (result) setError(result); } finally { setBusy(false); } }
  return <BusinessFormDialog size="medium" title={translateUi("Qəbulu tamamla")} onClose={onClose}><form onSubmit={submit} className="space-y-4 text-sm"><div className="rounded-xl bg-slate-50 p-3"><p className="font-bold">{booking.clientName}</p><p className="mt-1 text-slate-500">{booking.service} · {booking.date} {booking.time}</p><strong className="mt-2 block text-lg">{booking.price.toFixed(2)} ₼</strong></div><fieldset><legend className="mb-2 font-bold"><LocalizedText value={"Ödəniş üsulu"} /></legend><div className="grid grid-cols-2 gap-2">{(Object.keys(paymentLabels) as PaymentMethod[]).map((item) => <button key={item} type="button" disabled={busy} aria-pressed={method === item} onClick={() => chooseMethod(item)} className={`min-h-11 cursor-pointer rounded-xl border px-2 font-bold ${method === item ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white"}`}>{paymentLabels[item]}</button>)}</div></fieldset>{method === "deposit" || method === "bonus" ? <p className="rounded-xl bg-slate-50 p-3 text-slate-600"><LocalizedText value={"Müştəri balansı:"} /> {client ? balance(client, method === "deposit" ? "deposit" : "cashback").toFixed(2) : "0.00"} ₼</p> : <label className="block font-bold"><LocalizedText value={"Kassa hesabı"} /><select required disabled={busy} value={accountId} onChange={(event) => setAccountId(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3"><option value="">{translateUi("Hesab seçin")}</option>{accounts.filter((account) => account.type === (method === "cash" ? "cash" : "pos")).map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>}{error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-700"><LocalizedText value={error} /></p>}<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" disabled={busy} onClick={onClose} className="min-h-11 cursor-pointer rounded-xl bg-slate-100 px-5 font-bold"><LocalizedText value={"İmtina"} /></button><button type="submit" disabled={busy} className="min-h-11 cursor-pointer rounded-xl bg-brand-primary px-5 font-bold disabled:opacity-50">{busy ? translateUi("Ödəniş saxlanır…") : translateUi("Ödənişi təsdiqlə")}</button></div></form></BusinessFormDialog>;
}
