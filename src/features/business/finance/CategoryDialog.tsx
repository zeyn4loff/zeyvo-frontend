import { useState, type FormEvent } from "react";
import type { FinanceCategory } from "./finance";
import { Buttons, Frame } from "./FinanceDialogUi";
import { businessControlClass, businessLabelClass } from "../components/BusinessField";
import LocalizedText from "@/features/locale/LocalizedText";
import { useCustomerText } from "@/features/locale/customerText";

type Props = {
  category: FinanceCategory | null;
  defaultType: FinanceCategory["type"];
  onClose: () => void;
  onSave: (entry: FinanceCategory) => Promise<string | null>;
};

export function CategoryDialog({ category, defaultType, onClose, onSave }: Props) {
  const translateUi = useCustomerText();
  const [draft, setDraft] = useState<FinanceCategory>(() => category ?? { id: crypto.randomUUID(), name: "", type: defaultType });
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const issue = await onSave({ ...draft, name: draft.name.trim() });
    if (issue) setError(issue);
    else onClose();
  }
  return <Frame title={category ? translateUi("Kateqoriyanı redaktə et") : translateUi("Maliyyə kateqoriyası")} description={translateUi("Gəlir və ya xərc təsnifatı")} onClose={onClose}>
    <form onSubmit={submit} className="space-y-4">
      <label className={businessLabelClass}><LocalizedText value={"Kateqoriyanın adı *"} />
        <input required maxLength={80} value={draft.name} onChange={(event) => { setDraft({ ...draft, name: event.target.value }); setError(""); }} placeholder={translateUi("məs. İcarə haqqı, Reklam xərcləri...")} className={businessControlClass} />
      </label>
      <label className={businessLabelClass}><LocalizedText value={"Növ *"} />
        <select required value={draft.type} onChange={(event) => { setDraft({ ...draft, type: event.target.value as FinanceCategory["type"] }); setError(""); }} className={businessControlClass}>
          <option value="expense">{translateUi("Xərc kateqoriyası")}</option>
          <option value="income">{translateUi("Gəlir kateqoriyası")}</option>
        </select>
      </label>
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700"><LocalizedText value={error} /></p>}
      <Buttons onClose={onClose} />
    </form>
  </Frame>;
}
