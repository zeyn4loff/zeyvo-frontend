import { useEffect, useState } from "react";
import { CarFront, Check, ChevronDown, CircleHelp, Dumbbell, GraduationCap, HeartPulse, Home, MoreHorizontal, Palette, PawPrint, Scale, Scissors, Search, Utensils, Wrench, X } from "lucide-react";
import { useLanguage } from "@/features/locale/language";
import EmptyState from "@/components/common/EmptyState";
import LocalizedText from "@/features/locale/LocalizedText";
import { useCustomerText } from "@/features/locale/customerText";

type Props = { selected: string[]; onChange: (value: string[]) => void; individual?: boolean; server?: boolean };
type TaxonomyCategory = { id: string; name: string; azName: string; subcategories: { id: string; name: string; azName: string }[] };

const icons: Record<string, typeof Scissors> = {
  beauty: Scissors, health: HeartPulse, auto: CarFront, entertainment: CircleHelp,
  services: Wrench, education: GraduationCap, rent: Home, sport: Dumbbell,
  animals: PawPrint, restaurants: Utensils, style: Palette, lawyers: Scale, other: MoreHorizontal,
};

function normalizedSelections(selected: string[], categories: TaxonomyCategory[]) {
  const values = selected.flatMap((id) => {
    const category = categories.find((item) => item.id === id);
    if (category) return category.subcategories.map((sub) => `${category.id}/${sub.id}`);
    if (id.includes("/")) return [id];
    const parent = categories.find((item) => item.subcategories.some((sub) => sub.id === id));
    return parent ? [`${parent.id}/${id}`] : [id];
  });
  return [...new Set(values)];
}

export default function BranchCategories({ selected, onChange, individual = false, server = false }: Props) {
  const translateUi = useCustomerText();
  const { language } = useLanguage();
  const [categories, setCategories] = useState<TaxonomyCategory[]>([]);
  const [loadError, setLoadError] = useState("");
  useEffect(() => {
    if (!server) return;
    const controller = new AbortController();
    fetch("/api/v1/service-taxonomies", { headers: { Accept: "application/json", "Accept-Language": language }, signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Kateqoriyaları yükləmək mümkün olmadı.");
        const result = await response.json() as { success: boolean; data?: { categories: TaxonomyCategory[] } };
        if (!result.success || !Array.isArray(result.data?.categories)) throw new Error("Kateqoriyaları yükləmək mümkün olmadı.");
        setCategories(result.data.categories);
        setLoadError("");
      }).catch((issue: unknown) => {
        if (!controller.signal.aborted) setLoadError(issue instanceof Error ? issue.message : "Kateqoriyalar yüklənmədi.");
      });
    return () => controller.abort();
  }, [language, server]);
  const [query, setQuery] = useState("");
  const [warning, setWarning] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const current = normalizedSelections(selected, categories);
  const lower = query.trim().toLocaleLowerCase("az");

  function change(next: string[]) {
    if (current.length > 0 && next.length === 0) {
      setWarning("Ən azı 1 kateqoriya seçilməlidir");
      return;
    }
    setWarning("");
    onChange(next);
  }

  function toggle(id: string) {
    change(current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function toggleAll(categoryId: string) {
    const category = categories.find((item) => item.id === categoryId);
    if (!category) return;
    const ids = category.subcategories.map((sub) => `${categoryId}/${sub.id}`);
    const allSelected = ids.every((id) => current.includes(id));
    change(allSelected ? current.filter((id) => !ids.includes(id)) : [...new Set([...current, ...ids])]);
  }

  const visible = categories.map((category) => {
    const categoryMatches = `${category.azName} ${category.name}`.toLocaleLowerCase("az").includes(lower);
    const subs = category.subcategories.filter((sub) => {
      const id = `${category.id}/${sub.id}`;
      return (!showSelectedOnly || current.includes(id)) && (!lower || categoryMatches || `${sub.azName} ${sub.name}`.toLocaleLowerCase("az").includes(lower));
    });
    return { category, subs };
  }).filter(({ subs }) => subs.length > 0);

  return <section className="min-w-0 space-y-2" aria-label={translateUi("Kateqoriyalar və alt-xidmətlər")}>
    <div className="flex items-center justify-between gap-2">
      <label htmlFor="branch-category-search" className="text-xs font-medium text-slate-700"><LocalizedText value={"Kateqoriyalar və alt-xidmətlər *"} /></label>
      <span className="shrink-0 rounded-full bg-brand-primary/30 px-2.5 py-1 text-[11px] font-semibold text-slate-800">{current.length} <LocalizedText value={"seçilib"} /></span>
    </div>
    <div className="flex min-w-0 gap-2">
      <div className="relative min-w-0 flex-1">
        <Search size={16} aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 my-auto text-slate-400" />
        <input id="branch-category-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={translateUi("Kateqoriya və ya xidmət axtar")} className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white pr-9 pl-9 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-brand-primary/40" />
        {query && <button type="button" onClick={() => setQuery("")} aria-label={translateUi("Axtarışı təmizlə")} className="absolute inset-y-0 right-2 flex w-7 cursor-pointer items-center justify-center text-slate-400 transition hover:text-slate-700"><X size={14} /></button>}
      </div>
      <button type="button" aria-pressed={showSelectedOnly} onClick={() => setShowSelectedOnly((value) => !value)} className={`min-h-10 shrink-0 cursor-pointer rounded-xl border px-3 text-xs font-semibold transition ${showSelectedOnly ? "border-brand-primary bg-brand-primary text-slate-950" : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"}`}><LocalizedText value={"Seçilənlər"} /></button>
    </div>
    {loadError && <p role="alert" className="text-xs text-red-600"><LocalizedText value={loadError} /></p>}
    <div className="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5">
      {visible.length ? visible.map(({ category, subs }) => {
        const Icon = icons[category.id] ?? CircleHelp;
        const count = category.subcategories.filter((sub) => current.includes(`${category.id}/${sub.id}`)).length;
        const allSelected = count === category.subcategories.length;
        const expanded = expandedCategory === category.id || Boolean(lower) || showSelectedOnly;
        return <div key={category.id} className={`rounded-lg border ${expanded ? "border-slate-200 bg-slate-50/60" : "border-transparent"}`}>
          <div className="flex min-w-0 items-center gap-1 px-1.5">
            <button type="button" aria-expanded={expanded} onClick={() => { setQuery(""); setShowSelectedOnly(false); setExpandedCategory(expandedCategory === category.id ? null : category.id); }} className="flex min-h-10 min-w-0 flex-1 cursor-pointer items-center gap-2 text-left">
              <Icon size={16} aria-hidden="true" className="shrink-0 text-slate-600" />
              <span className="min-w-0 truncate text-xs font-semibold text-slate-900">{category.name}</span>
              <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${count ? "bg-brand-primary/30 text-slate-800" : "bg-slate-100 text-slate-400"}`}>{count}/{category.subcategories.length}</span>
              <ChevronDown size={15} aria-hidden="true" className={`ml-auto shrink-0 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
            </button>
            {expanded && !showSelectedOnly && <button type="button" onClick={() => toggleAll(category.id)} className="min-h-9 shrink-0 cursor-pointer px-1 text-[11px] font-semibold text-slate-600 hover:text-slate-950">{allSelected ? translateUi("Seçimi ləğv et") : translateUi("Hamısını seç")}</button>}
          </div>
          {expanded && <div className="flex flex-wrap gap-1.5 border-t border-slate-200/80 px-2 py-2">{subs.map((sub) => {
            const id = `${category.id}/${sub.id}`;
            const active = current.includes(id);
            return <button key={id} type="button" aria-pressed={active} onClick={() => toggle(id)} className={`inline-flex min-h-9 max-w-full cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-left text-xs transition ${active ? "border-brand-primary bg-brand-primary font-semibold text-slate-950" : "border-slate-200 bg-white font-medium text-slate-600 hover:bg-slate-100"}`}><span className="truncate">{sub.name}</span>{active && <Check size={13} strokeWidth={2.5} aria-hidden="true" className="shrink-0" />}</button>;
          })}</div>}
        </div>;
      }) : <EmptyState title={showSelectedOnly ? translateUi("Hələ xidmət seçilməyib") : `“${query}” üzrə heç bir xidmət tapılmadı`} description={showSelectedOnly ? translateUi("Kateqoriyaları açıb xidmət seçin") : translateUi("Axtarış sözünü dəyişin")} icon={Search} compact actionLabel={translateUi("Hamısını göstər")} onAction={() => { setQuery(""); setShowSelectedOnly(false); }} />}
    </div>
    {warning && <p role="alert" className="text-[11px] text-amber-700"><LocalizedText value={warning} /></p>}
    <p className="sr-only">{individual ? translateUi("Ustanın") : translateUi("Filialın")} <LocalizedText value={"aid olduğu xidmətləri seçin."} /></p>
  </section>;
}
