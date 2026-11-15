import { Search } from "lucide-react";
import { useCustomerText } from "@/features/locale/customerText";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** Classes for the control frame, so each screen keeps its own shape. */
  className: string;
  inputClassName: string;
  iconSize?: number;
};

/** The shared search control: identical icon and field, per-screen framing. */
export default function BusinessSearchInput({ label, value, onChange, placeholder, className, inputClassName, iconSize = 17 }: Props) {
  const t = useCustomerText();
  return <label className={`business-search-control flex items-center gap-2 ${className}`}>
    <Search size={iconSize} className="shrink-0 text-slate-400" />
    <input
      aria-label={t(label)}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={t(placeholder)}
      className={`min-w-0 flex-1 bg-transparent outline-none ${inputClassName}`}
    />
  </label>;
}
