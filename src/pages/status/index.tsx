import { Link } from "react-router";
import EmptyState from "@/components/common/EmptyState";
import { FileQuestion } from "lucide-react";
import { useCustomerText } from "@/features/locale/customerText";

export default function StatusPage() {
  const ct = useCustomerText();
  return <div className="container mx-auto px-4 py-8 sm:py-12"><EmptyState title={ct("Səhifə tapılmadı") } description={ct("Axtardığınız səhifə mövcud deyil.") } icon={FileQuestion} action={<Link to="/" className="inline-flex min-h-11 items-center rounded-xl bg-brand-primary px-5 text-sm font-bold text-slate-900">{ct("Əsas səhifəyə qayıt")}</Link>} /></div>;
}
