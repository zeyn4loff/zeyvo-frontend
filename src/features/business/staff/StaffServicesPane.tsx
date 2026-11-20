import { partnerPath } from "@/features/business/partnerPath";
import { useCurrencySymbol } from "../finance/businessCurrency";
import { useState } from "react";
import { ChevronRight, FileText, Info, Plus, Search, Wrench } from "lucide-react";
import type { Service, ServiceData } from "../services/services";
import BusinessFormDialog from "../components/BusinessFormDialog";
import LocalizedText from "@/features/locale/LocalizedText";
import { useCustomerText } from "@/features/locale/customerText";

function AssignedService({ service, memberId }: { service: Service; memberId?: string }) {
  const translateUi = useCustomerText();
  const currencySign = useCurrencySymbol();
  const custom = memberId ? service.staffOverrides?.[memberId] : undefined;
  const customPrice = custom?.price !== undefined && custom.price !== service.price;
  const customDuration = custom?.duration !== undefined && custom.duration !== service.duration;

  return <article className="flex min-w-0 flex-col gap-2 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:gap-3">
    <div className="min-w-0 flex-1">
      <div className="flex min-w-0 items-center gap-2"><strong className="min-w-0 truncate text-xs text-slate-900">{service.name}</strong>{service.isCombo && <span className="shrink-0 rounded-md bg-purple-100 px-1.5 py-0.5 text-[9px] font-bold text-purple-800">Kompleks</span>}</div>
      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-slate-400"><span><LocalizedText value={"Baza:"} /> <b>{service.price} {currencySign}</b></span><span>•</span><span>{service.duration || 30} <LocalizedText value={"dəq"} /></span>{customPrice && <span className="font-semibold text-amber-700"><LocalizedText value={"• Fərdi qiymət:"} /> {custom.price} {currencySign}</span>}{customDuration && <span className="font-semibold text-amber-700"><LocalizedText value={"• Fərdi vaxt:"} /> {custom.duration} <LocalizedText value={"dəq"} /></span>}</div>
    </div>
    <div className="flex shrink-0 items-center gap-2"><span className="rounded-md border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700"><LocalizedText value={"Təyin edilib"} /></span><a href={partnerPath(`/services?edit=${encodeURIComponent(service.id)}`)} title={translateUi("Xidməti «Xidmətlər» bölməsində redaktə et")} className="inline-flex min-h-8 items-center gap-1 rounded-lg bg-slate-100 px-2.5 text-[11px] font-semibold text-slate-700 shadow-xs hover:bg-slate-200"><LocalizedText value={"Xidmətə bax"} /><ChevronRight size={12} className="text-slate-400" /></a></div>
  </article>;
}

function StaffServicePicker({ data, selected, onApply, onClose }: { data: ServiceData; selected: string[]; onApply: (ids: string[]) => void; onClose: () => void }) {
  const translateUi = useCustomerText();
  const currencySign = useCurrencySymbol();
  const [draft, setDraft] = useState(selected);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const categoryNames = new Map(data.categories.map((category) => [category.id, category.name]));
  const categories = data.categories.filter((category) => data.services.some((service) => service.categoryId === category.id));
  const hasOther = data.services.some((service) => !categoryNames.has(service.categoryId));
  const normalized = query.trim().toLocaleLowerCase("az-AZ");
  const visible = data.services.filter((service) => {
    const category = categoryNames.get(service.categoryId) ?? translateUi("Digər xidmətlər");
    return (categoryId === "all" || (categoryId === "other" ? !categoryNames.has(service.categoryId) : service.categoryId === categoryId))
      && (!normalized || `${service.name} ${service.description} ${category}`.toLocaleLowerCase("az-AZ").includes(normalized));
  });
  function toggle(id: string) { setDraft((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]); }

  return <BusinessFormDialog size="stock" title={translateUi("Xidmət seçimi")} description={translateUi("Ustanın göstərəcəyi xidmətləri seçin")} onClose={onClose}>
    <div className="min-w-0 space-y-3 text-xs">
      <label className="relative block"><Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input autoFocus type="search" value={query} onChange={(event) => setQuery(event.target.value)} aria-label={translateUi("Xidmət adı ilə axtarın")} placeholder={translateUi("Xidmət adı ilə axtarın...")} className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 font-medium outline-none focus:border-slate-900 focus:bg-white" /></label>
      <div aria-label={translateUi("Xidmət kateqoriyaları")} className="flex max-w-full gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[{ id: "all", name: translateUi("Bütün xidmətlər") }, ...categories, ...(hasOther ? [{ id: "other", name: translateUi("Digər xidmətlər") }] : [])].map((category) => <button key={category.id} type="button" aria-pressed={categoryId === category.id} onClick={() => setCategoryId(category.id)} className={`min-h-9 shrink-0 whitespace-nowrap rounded-lg px-3 py-1 font-semibold ${categoryId === category.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}>{category.name}</button>)}
      </div>
      <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50">
        {visible.map((service) => <label key={service.id} className={`flex min-h-16 cursor-pointer items-center gap-3 p-3 hover:bg-amber-50/50 ${draft.includes(service.id) ? "bg-amber-50/70" : ""}`}><input type="checkbox" checked={draft.includes(service.id)} onChange={() => toggle(service.id)} className="size-4 shrink-0 accent-slate-900" /><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><Wrench size={17} /></span><span className="min-w-0 flex-1"><strong className="block break-words text-slate-900">{service.name}</strong><small className="text-slate-500">{categoryNames.get(service.categoryId) ?? translateUi("Digər xidmətlər")} · {service.duration} <LocalizedText value={"dəq"} /></small></span><span className="shrink-0 font-bold">{service.price.toFixed(2)} {currencySign}</span></label>)}
        {!visible.length && <p className="p-8 text-center text-slate-500"><LocalizedText value={"Axtarışa uyğun xidmət tapılmadı"} /></p>}
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3"><span className="text-slate-500"><LocalizedText value={"Seçilib:"} /> {draft.length}</span><div className="flex gap-2"><button type="button" onClick={onClose} className="min-h-10 rounded-xl bg-slate-100 px-4 font-bold"><LocalizedText value={"Ləğv et"} /></button><button type="button" onClick={() => { onApply(draft); onClose(); }} className="min-h-10 rounded-xl bg-brand-primary px-4 font-bold"><LocalizedText value={"Təsdiq et"} /></button></div></div>
    </div>
  </BusinessFormDialog>;
}

export default function StaffServicesPane({ data, selected, memberId, onChange }: { data: ServiceData; selected: string[]; memberId?: string; onChange: (ids: string[]) => void }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const assigned = data.services.filter((service) => selected.includes(service.id));

  return <section className="min-w-0 space-y-3.5 text-xs">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-1"><div><h3 className="font-bold text-slate-900"><LocalizedText value={"Ustanın göstərdiyi xidmətlər"} /></h3><p className="text-[11px] font-normal text-slate-400"><LocalizedText value={"Xidmətləri burada seçin və yadda saxlayın"} /></p></div><button type="button" onClick={() => setPickerOpen(true)} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-brand-primary px-3 font-bold text-slate-900"><Plus size={16} /><LocalizedText value={"Xidmət seç"} /></button></div>
    <div className="flex items-start gap-2.5 rounded-2xl border border-slate-200/80 bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-600"><Info size={16} className="mt-0.5 shrink-0 text-slate-400" /><p><LocalizedText value={"Fərdi qiymət və müddəti xidmətin heyət bölməsində dəyişə bilərsiniz."} /></p></div>
    <div className="max-h-[46vh] space-y-3 overflow-y-auto pr-1">
      {assigned.length > 0 && <div className="flex flex-wrap gap-2">{assigned.map((service) => <button type="button" key={service.id} onClick={() => onChange(selected.filter((id) => id !== service.id))} className="min-h-9 rounded-xl bg-brand-primary px-3 font-semibold text-slate-900" aria-label={`${service.name} xidmətini çıxar`}>{service.name} ×</button>)}</div>}
      {assigned.map((service) => <AssignedService key={service.id} service={service} memberId={memberId} />)}
      {!assigned.length && <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center"><FileText size={30} className="mx-auto text-slate-400" /><p className="font-bold text-slate-800"><LocalizedText value={"Bu ustaya hələ heç bir xidmət təyin edilməyib"} /></p><button type="button" onClick={() => setPickerOpen(true)} className="min-h-10 rounded-xl bg-brand-primary px-4 font-bold"><LocalizedText value={"Xidmət seç"} /></button></div>}
    </div>
    {pickerOpen && <StaffServicePicker data={data} selected={selected} onApply={onChange} onClose={() => setPickerOpen(false)} />}
  </section>;
}
