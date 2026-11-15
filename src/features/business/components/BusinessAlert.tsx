import type { ReactNode } from "react";

const variants = {
  red: "rounded-xl bg-red-50 p-3 text-sm text-red-700",
  redStrong: "rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700",
  rose: "rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700",
  compact: "rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700",
} as const;

type Props = {
  children: ReactNode;
  variant?: keyof typeof variants;
  className?: string;
  as?: "p" | "div";
};

/** The shared failure message used across partner screens. */
export default function BusinessAlert({ children, variant = "red", className = "", as = "p" }: Props) {
  const Tag = as;
  return <Tag role="alert" className={[variants[variant], className].filter(Boolean).join(" ")}>{children}</Tag>;
}

/** The shared "loading…" line shown while a resource is still being fetched. */
export function BusinessLoadingNote({ children, className = "text-sm text-slate-500" }: { children: ReactNode; className?: string }) {
  return <p role="status" className={className}>{children}</p>;
}

/** Shown when no business or solo profile exists yet, so records cannot be created. */
export function BusinessMissingProfileNotice({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={["rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900", className].filter(Boolean).join(" ")}>{children}</p>;
}
