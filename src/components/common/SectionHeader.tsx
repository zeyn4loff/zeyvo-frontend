
import type { ReactNode } from "react";
import { Badge } from "../ui/badge";
import { useCustomerText } from "@/features/locale/customerText";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  children?: ReactNode;
}

export default function SectionHeader({
  title,
  subtitle,
  description,
  children,
}: SectionHeaderProps) {
  const t = useCustomerText();
  return (
    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight text-primary">
            {t(title)}
          </h2>

          {subtitle && (
            <Badge
              variant="secondary"
              className="px-3 py-1 text-xs font-bold text-primary bg-badge-gray"
            >
              {t(subtitle)}
            </Badge>
          )}
        </div>

        <p className="mt-1 text-xs font-medium text-slate-500">
          {description ? t(description) : null}
        </p>
      </div>

      {children && (
        <div className="flex shrink-0 items-center gap-2">
          {children}
        </div>
      )}
    </div>
  );
}
