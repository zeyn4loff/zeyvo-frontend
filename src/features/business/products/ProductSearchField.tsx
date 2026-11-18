import { Search, X } from "lucide-react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  clearLabel: string;
};

export default function ProductSearchField({ value, onChange, placeholder, ariaLabel, clearLabel }: Props) {
  return <div className="business-search-control flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 shadow-sm">
    <Search size={17} className="shrink-0 text-slate-400" aria-hidden="true" />
    <input aria-label={ariaLabel} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" />
    {value && <button type="button" onClick={() => onChange("")} aria-label={clearLabel} className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={16} aria-hidden="true" /></button>}
  </div>;
}
