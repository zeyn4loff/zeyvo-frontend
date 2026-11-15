import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ClipboardList } from "lucide-react";
import { useCustomerText } from "@/features/locale/customerText";

type Props = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
};

export default function EmptyState({ title, description, icon: Icon = ClipboardList, actionLabel, onAction, action, compact = false, className = "" }: Props) {
  const t = useCustomerText();
  return <div className={`flex w-full min-w-0 flex-col items-center justify-center rounded-[1.75rem] border border-slate-200 bg-white px-4 text-center shadow-sm ${compact ? "min-h-44 py-6 sm:py-8" : "min-h-64 py-10 sm:min-h-72 sm:py-12"} ${className}`}>
    <span className={`flex shrink-0 items-center justify-center rounded-2xl bg-lime-50 text-slate-900 ${compact ? "size-12" : "size-14 sm:size-16"}`}><Icon size={compact ? 23 : 28} strokeWidth={1.9} aria-hidden="true" /></span>
    <h3 className="mt-4 max-w-full break-words text-base font-bold text-slate-900 sm:text-lg">{t(title)}</h3>
    {description && <p className="mt-2 max-w-xl break-words text-sm text-slate-500 sm:text-base">{t(description)}</p>}
    {(action || (actionLabel && onAction)) && <div className="mt-6 flex max-w-full flex-wrap justify-center gap-2 [&_a]:font-semibold [&_button]:font-semibold">{action ?? <button type="button" onClick={onAction} className="min-h-11 cursor-pointer rounded-xl bg-brand-primary px-5 text-sm font-semibold text-slate-900 transition hover:brightness-95 active:scale-[0.98]">{t(actionLabel ?? "")}</button>}</div>}
  </div>;
}
