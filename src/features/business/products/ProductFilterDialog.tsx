import { businessControlClass } from "../components/BusinessField";
import { businessLabelClass } from "../components/BusinessField";
import type { Dispatch, SetStateAction } from "react";
import BusinessFormDialog from "../components/BusinessFormDialog";
import type { ProductData } from "./products";
import LocalizedText from "@/features/locale/LocalizedText";
import { useCustomerText } from "@/features/locale/customerText";

type Props = { data: ProductData; warehouse: string; category: string; stockFilter: string; setWarehouse: Dispatch<SetStateAction<string>>; setCategory: Dispatch<SetStateAction<string>>; setStockFilter: Dispatch<SetStateAction<string>>; onClose: () => void };
export default function ProductFilterDialog({ data, warehouse, category, stockFilter, setWarehouse, setCategory, setStockFilter, onClose }: Props) {
  const translateUi = useCustomerText();
  return (
    <BusinessFormDialog title={translateUi("Məhsul filtrləri")} size="medium" onClose={onClose}><div className="space-y-3">
      <label className={businessLabelClass}>Anbar<select value={warehouse} onChange={(event) => setWarehouse(event.target.value)} className={businessControlClass}><option value="auto">Cari filial</option><option value="all">{translateUi("Bütün anbarlar")}</option>{data.warehouses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label className={businessLabelClass}><LocalizedText value={"Kateqoriya"} /><select value={category} onChange={(event) => setCategory(event.target.value)} className={businessControlClass}><option value="all">{translateUi("Bütün kateqoriyalar")}</option>{data.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label className={businessLabelClass}><LocalizedText value={"Qalıq"} /><select value={stockFilter} onChange={(event) => setStockFilter(event.target.value)} className={businessControlClass}><option value="all">{translateUi("Bütün qalıqlar")}</option><option value="low">{translateUi("Kritik qalıq")}</option><option value="out">{translateUi("Bitmiş")}</option><option value="available">{translateUi("Kifayət qədər")}</option></select></label>
      <div className="flex gap-2 pt-2"><button type="button" onClick={() => { setWarehouse("auto"); setCategory("all"); setStockFilter("all"); }} className="min-h-11 flex-1 cursor-pointer rounded-xl bg-slate-100 px-4 font-semibold"><LocalizedText value={"Sıfırla"} /></button><button type="button" onClick={onClose} className="min-h-11 flex-1 cursor-pointer rounded-xl bg-brand-primary px-4 font-semibold"><LocalizedText value={"Göstər"} /></button></div>
    </div></BusinessFormDialog>
  );
}
