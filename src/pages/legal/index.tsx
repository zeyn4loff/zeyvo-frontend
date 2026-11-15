import { Link, useLocation } from "react-router";
import Breadcrumbs from "@/features/marketplace/components/Breadcrumbs";
import { useTranslations } from "@/features/locale/language";
import { type LegalTab, useLegalContent } from "@/features/customer/legalContent";

export default function LegalPage() {
  const tab: LegalTab = useLocation().pathname === "/privacy" ? "privacy" : "terms";
  const { language, t } = useTranslations();
  const { content, loading, error } = useLegalContent(tab, language);
  const title = content?.title || (tab === "terms" ? t("terms") : t("privacyPage"));
  return <div className="container mx-auto space-y-6 px-4 py-8 pb-24">
    <Breadcrumbs items={[{ label: title }]} />
    <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 md:p-10">
      <h1 className="break-words text-2xl font-bold tracking-tight [overflow-wrap:anywhere] sm:text-3xl">{title}</h1>
      {content?.subtitle && <p className="mt-1 text-sm text-slate-500">{content.subtitle}</p>}
      <nav aria-label="Legal pages" className="mt-6 flex rounded-xl bg-slate-100 p-1 text-sm font-semibold">
        <Link to="/terms" aria-current={tab === "terms" ? "page" : undefined} className={`min-w-0 flex-1 rounded-lg px-2 py-2 text-center text-xs [overflow-wrap:anywhere] sm:text-sm ${tab === "terms" ? "bg-white shadow-sm" : ""}`}>{t("terms")}</Link>
        <Link to="/privacy" aria-current={tab === "privacy" ? "page" : undefined} className={`min-w-0 flex-1 rounded-lg px-2 py-2 text-center text-xs [overflow-wrap:anywhere] sm:text-sm ${tab === "privacy" ? "bg-white shadow-sm" : ""}`}>{t("privacyPage")}</Link>
      </nav>
      <div aria-busy={loading} className="mt-6 space-y-3 text-sm leading-relaxed text-slate-600 sm:text-base">
        {loading && <p>{t("loading")}</p>}
        {error && <p role="alert">{t("requestFailed")}</p>}
        {content?.paragraphs.map((paragraph, index) => <p key={index} className="rounded-xl border border-slate-100 bg-slate-50 p-4 sm:p-5">{paragraph}</p>)}
      </div>
    </section>
  </div>;
}
