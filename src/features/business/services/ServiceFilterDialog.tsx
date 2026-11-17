import type { Dispatch, SetStateAction } from "react";
import BusinessFormDialog from "../components/BusinessFormDialog";
import { formatLabels, genderLabels, type ServiceCategory, type ServiceFormat, type ServiceGender } from "./services";
import LocalizedText from "@/features/locale/LocalizedText";
import { useCustomerText } from "@/features/locale/customerText";

interface Props {
  categories: ServiceCategory[];
  categoryFilter: string;
  setCategoryFilter: Dispatch<SetStateAction<string>>;
  formatFilter: ServiceFormat | "all";
  setFormatFilter: Dispatch<SetStateAction<ServiceFormat | "all">>;
  genderFilter: ServiceGender | "all-filter";
  setGenderFilter: Dispatch<SetStateAction<ServiceGender | "all-filter">>;
  onlineFilter: string;
  setOnlineFilter: Dispatch<SetStateAction<string>>;
  onClose: () => void;
  onReset: () => void;
}
export default function ServiceFilterDialog({ categories, categoryFilter, setCategoryFilter, formatFilter, setFormatFilter, genderFilter, setGenderFilter, onlineFilter, setOnlineFilter, onClose, onReset }: Props) {
  const translateUi = useCustomerText();
  return <BusinessFormDialog title={translateUi("Xidmətləri filtrlə")} onClose={() => onClose()} size="medium"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold"><LocalizedText value={"Kateqoriya"} /><select aria-label="Kateqoriya filtri" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="mt-1 min-h-11 w-full min-w-0 cursor-pointer rounded-xl border border-slate-200 px-3 text-sm"><option value="all">{translateUi("Bütün kateqoriyalar")}</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}<option value="uncategorized">{translateUi("Kateqoriyasız")}</option></select></label><label className="text-sm font-semibold">Format<select aria-label="Format filtri" value={formatFilter} onChange={(event) => setFormatFilter(event.target.value as ServiceFormat | "all")} className="mt-1 min-h-11 w-full min-w-0 cursor-pointer rounded-xl border border-slate-200 px-3 text-sm"><option value="all">{translateUi("Bütün formatlar")}</option>{(Object.keys(formatLabels) as ServiceFormat[]).map((item) => <option key={item} value={item}>{formatLabels[item]}</option>)}</select></label><label className="text-sm font-semibold"><LocalizedText value={"Kimlər üçün"} /><select aria-label={translateUi("Kimlər üçün filtri")} value={genderFilter} onChange={(event) => setGenderFilter(event.target.value as ServiceGender | "all-filter")} className="mt-1 min-h-11 w-full min-w-0 cursor-pointer rounded-xl border border-slate-200 px-3 text-sm"><option value="all-filter">{translateUi("Hamı üçün")}</option>{(Object.keys(genderLabels) as ServiceGender[]).map((item) => <option key={item} value={item}>{genderLabels[item]}</option>)}</select></label><label className="text-sm font-semibold"><LocalizedText value={"Onlayn qəbul"} /><select aria-label={translateUi("Onlayn qəbul filtri")} value={onlineFilter} onChange={(event) => setOnlineFilter(event.target.value)} className="mt-1 min-h-11 w-full min-w-0 cursor-pointer rounded-xl border border-slate-200 px-3 text-sm"><option value="all">{translateUi("Bütün statuslar")}</option><option value="true">Onlayn aktiv</option><option value="false">{translateUi("Yalnız salonda")}</option></select></label></div><div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={onReset} className="min-h-11 cursor-pointer rounded-xl bg-slate-100 px-4 text-sm font-bold"><LocalizedText value={"Filtrləri sıfırla"} /></button><button type="button" onClick={() => onClose()} className="min-h-11 cursor-pointer rounded-xl bg-brand-primary px-4 text-sm font-bold"><LocalizedText value={"Nəticələri göstər"} /></button></div></BusinessFormDialog>;
}
