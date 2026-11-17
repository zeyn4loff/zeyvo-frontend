import { businessLabelClass } from "../components/BusinessField";
import { businessControlClass, businessTextareaClass } from "../components/BusinessField";
import { useState, type FormEvent } from "react";
import BusinessFormDialog from "../components/BusinessFormDialog";
import CategoryIconPicker, { type CategoryIcon } from "../components/CategoryIconPicker";
import type { ResourceCategory } from "./resources";
import LocalizedText from "@/features/locale/LocalizedText";
import { useCustomerText } from "@/features/locale/customerText";


const fieldClass = businessControlClass;

export function CategoryFormDialog({ initial, error, onClose, onSave }: { initial?: ResourceCategory; error?: string; onClose: () => void; onSave: (category: ResourceCategory) => void }) {
  const translateUi = useCustomerText();
  const [icon, setIcon] = useState<CategoryIcon>((initial?.icon as CategoryIcon) ?? "folder");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") || "").trim();
    if (!name) return;
    onSave({ id: initial?.id ?? crypto.randomUUID(), name, icon, description: String(data.get("description") || "").trim() });
  }
  return <BusinessFormDialog title={initial ? translateUi("Kateqoriyanı redaktə et") : translateUi("Yeni kateqoriya")} onClose={onClose} size="medium">
    <form onSubmit={submit} className="space-y-4 text-sm"><label className={businessLabelClass}><LocalizedText value={"Kateqoriyanın adı *"} /><input name="name" required maxLength={100} autoFocus defaultValue={initial?.name} className={fieldClass} /></label><CategoryIconPicker value={icon} onChange={setIcon} options={["folder", "medical", "dental", "heart", "scissors", "spa", "nail", "laser", "chair", "room", "bed", "wrench", "car", "dumbbell", "book", "paw", "sparkles"]} /><label className={businessLabelClass}><LocalizedText value={"Təsvir"} /><textarea name="description" defaultValue={initial?.description} maxLength={300} rows={3} className={businessTextareaClass} /></label>{error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-700"><LocalizedText value={error} /></p>}<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="min-h-11 cursor-pointer rounded-xl bg-slate-100 px-5 font-semibold"><LocalizedText value={"İmtina"} /></button><button type="submit" className="min-h-11 cursor-pointer rounded-xl bg-brand-primary px-5 font-bold">Yadda saxla</button></div></form>
  </BusinessFormDialog>;
}
