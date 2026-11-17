import { useFormatMoney } from "./businessCurrency";
import { useState, type FormEvent } from "react";
import { accountBalance, type FinanceAccount, type FinanceData } from "./finance";
import { Buttons, Frame } from "./FinanceDialogUi";
import { businessControlClass, businessLabelClass } from "../components/BusinessField";
import LocalizedText from "@/features/locale/LocalizedText";
import { useCustomerText } from "@/features/locale/customerText";

type Props = {
  account: FinanceAccount | null;
  data: FinanceData;
  onClose: () => void;
  onSave: (entry: FinanceAccount) => Promise<string | null>;
};

const accountTypeOptions: { value: FinanceAccount["type"]; label: string }[] = [
  { value: "cash", label: "Nağd kassa (Pul yeşiyi)" },
  { value: "pos", label: "POS Terminal" },
  { value: "bank", label: "Bank hesabı (Cari)" },
  { value: "safe", label: "Daxili seyf (Rezerv)" },
];

export function AccountDialog({ account, data, onClose, onSave }: Props) {
  const translateUi = useCustomerText();
  const formatMoney = useFormatMoney();
  const [draft, setDraft] = useState<FinanceAccount>(() => account ?? { id: crypto.randomUUID(), name: "", type: "cash", openingBalance: 0, details: "" });
  const [error, setError] = useState("");
  const update = (patch: Partial<FinanceAccount>) => { setDraft((value) => ({ ...value, ...patch })); setError(""); };
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const issue = await onSave({ ...draft, name: draft.name.trim(), details: draft.details.trim() });
    if (issue) setError(issue);
    else onClose();
  }

  return <Frame title={account ? translateUi("Kassa / hesabı redaktə et") : "Yeni kassa / hesab"} description={translateUi("Hesab məlumatlarının daxil edilməsi")} onClose={onClose}>
    <form onSubmit={submit} className="space-y-4">
      <label className={businessLabelClass}><LocalizedText value={"Hesabın adı *"} />
        <input required maxLength={80} value={draft.name} onChange={(event) => update({ name: event.target.value })} placeholder={translateUi("məs. Əsas nağd kassa, ABB Bank hesabı...")} className={businessControlClass} />
      </label>
      <label className={businessLabelClass}><LocalizedText value={"Hesabın növü *"} />
        <select required value={draft.type} onChange={(event) => update({ type: event.target.value as FinanceAccount["type"] })} className={businessControlClass}>
          {accountTypeOptions.map((option) => <option key={option.value} value={option.value}>{translateUi(option.label)}</option>)}
        </select>
      </label>
      <label className={businessLabelClass}><LocalizedText value={"İlkin balans (₼)"} />
        <input type="number" min="0" step="0.01" value={draft.openingBalance || ""} onChange={(event) => update({ openingBalance: Number(event.target.value) })} placeholder="0.00" className={`${businessControlClass} font-mono text-sm font-bold`} />
      </label>
      {account && <p className="text-[11px] text-slate-500"><LocalizedText value={"Cari qalıq:"} /> {formatMoney(accountBalance(data, account.id))}<LocalizedText value={". İlkin balans dəyişdikdə cari qalıq da yenilənir."} /></p>}
      <label className={businessLabelClass}><LocalizedText value={"İzah və ya rekvizit (IBAN / Terminal ID)"} />
        <input maxLength={200} value={draft.details} onChange={(event) => update({ details: event.target.value })} placeholder={translateUi("məs. AZ21ABBB... və ya Terminal #12")} className={businessControlClass} />
      </label>
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700"><LocalizedText value={error} /></p>}
      <Buttons onClose={onClose} />
    </form>
  </Frame>;
}
