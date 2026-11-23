import { businessLabelClass } from "../components/BusinessField";
import BusinessFormDialog from "../components/BusinessFormDialog";
import LocalizedText from "@/features/locale/LocalizedText";
import { useCustomerText } from "@/features/locale/customerText";

export function ReviewReplyDialog({ reply, onChange, onClose, onSave }: {
  reply: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const translateUi = useCustomerText();
  return <BusinessFormDialog title={translateUi("Rəyə cavab")} onClose={onClose} size="medium">
    <label className={businessLabelClass}><LocalizedText value={"Cavab"} />
      <textarea autoFocus value={reply} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-28 w-full min-w-0 rounded-xl border border-slate-200 p-3 text-sm" maxLength={1000} />
    </label>
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <button type="button" onClick={onClose} className="min-h-11 cursor-pointer rounded-xl bg-slate-100 px-4"><LocalizedText value={"İmtina"} /></button>
      <button type="button" onClick={onSave} className="min-h-11 cursor-pointer rounded-xl bg-brand-primary px-4 font-bold"><LocalizedText value={"Saxla"} /></button>
    </div>
  </BusinessFormDialog>;
}
