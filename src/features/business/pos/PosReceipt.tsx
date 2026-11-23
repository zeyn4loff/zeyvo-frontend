import { useFormatMoney } from "../finance/businessCurrency";
import { Printer } from "lucide-react";
import { paymentLabels, type PosSale } from "./pos";
import LocalizedText from "@/features/locale/LocalizedText";
import { useCustomerText } from "@/features/locale/customerText";
import { useLanguage } from "@/features/locale/language";

export default function PosReceipt({ sale, onNewSale }: { sale: PosSale; onNewSale: () => void }) {
  const formatMoney = useFormatMoney();
  const translateUi = useCustomerText();
  const { language } = useLanguage();
  const dateLocale = { az: "az-AZ", ru: "ru-RU", tr: "tr-TR", en: "en-GB" }[language];
  return <div className="mx-auto max-w-md p-4 sm:p-6">
    <div className="pos-print-receipt rounded-2xl border border-slate-200 bg-white p-5 shadow-sm print:border-0 print:shadow-none">
      <div className="text-center"><p className="text-xl font-black">zeyvo<span className="text-lime-500">•</span></p><h3 className="mt-2 text-lg font-bold"><LocalizedText value={"Satış çeki"} /></h3><p className="text-xs text-slate-500">{sale.number} · {new Date(sale.createdAt).toLocaleString(dateLocale)}</p></div>
      <div className="my-5 border-y border-dashed border-slate-200 py-3 text-sm">{sale.branchName && <p><LocalizedText value={"Filial:"} /> {sale.branchName}</p>}<p><LocalizedText value={"Müştəri:"} /> {sale.clientName}</p><p><LocalizedText value={"Satıcı:"} /> {sale.sellerName}</p><p><LocalizedText value={"Ödəniş:"} /> {translateUi(paymentLabels[sale.paymentMethod])} · {sale.accountName}</p></div>
      <div className="space-y-3">{sale.lines.map((line) => <div key={line.productId} className="flex justify-between gap-3 text-sm"><div className="min-w-0"><p className="font-semibold">{line.name}</p><p className="text-xs text-slate-500">{line.quantity} × {formatMoney(line.price)}</p></div><strong className="shrink-0">{formatMoney(line.total)}</strong></div>)}</div>
      <div className="mt-5 space-y-2 border-t border-dashed border-slate-200 pt-3 text-sm"><div className="flex justify-between"><span><LocalizedText value={"Ara cəm"} /></span><span>{formatMoney(sale.subtotal)}</span></div>{sale.promoCode && <p className="text-xs text-slate-500"><LocalizedText value={"Promokod:"} /> {sale.promoCode}</p>}{sale.discount > 0 && <div className="flex justify-between"><span><LocalizedText value={"Endirim"} /></span><span>-{formatMoney(sale.discount)}</span></div>}<div className="flex justify-between text-lg font-bold"><span><LocalizedText value={"Yekun"} /></span><span>{formatMoney(sale.total)}</span></div></div>
    </div>
    <div className="mt-4 flex gap-2 print:hidden"><button type="button" onClick={onNewSale} className="min-h-11 flex-1 cursor-pointer rounded-xl bg-brand-primary px-3 text-sm font-bold"><LocalizedText value={"Yeni satış"} /></button><button type="button" onClick={() => window.print()} className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold"><Printer size={16} /><LocalizedText value={"Çap et"} /></button></div>
  </div>;
}
