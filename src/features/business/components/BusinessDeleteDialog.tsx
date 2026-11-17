import BusinessEntryDialog from "./BusinessEntryDialog";
import { useCustomerText } from "@/features/locale/customerText";
import LocalizedText from "@/features/locale/LocalizedText";


export default function BusinessDeleteDialog({ name, detail, error, blocked = false, onClose, onDelete }: { name: string; detail?: string; error?: string; blocked?: boolean; onClose: () => void; onDelete: () => void }) {
  const t = useCustomerText();
  return <BusinessEntryDialog title={t("Silinməni təsdiqləyin")} onClose={onClose} width="confirm" footer={<><button type="button" onClick={onClose} className="min-h-11 flex-1 cursor-pointer rounded-xl bg-slate-100 px-3 text-xs font-bold hover:bg-slate-200">{t("Ləğv et")}</button><button type="button" disabled={blocked} onClick={onDelete} className="min-h-11 flex-1 cursor-pointer rounded-xl bg-rose-600 px-3 text-xs font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40">{t("Bəli, sil")}</button></>}>
    <p className="break-words text-sm leading-relaxed text-slate-600">“{name}” {t("silinəcək.")} <LocalizedText value={detail} /></p>
    {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-xs text-red-700"><LocalizedText value={error} /></p>}
  </BusinessEntryDialog>;
}
