import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslations } from "@/features/locale/language";
import { type LegalTab, useLegalContent } from "./legalContent";

interface Props { tab: LegalTab | null; onTabChange: (tab: LegalTab | null) => void }

export default function LegalModal({ tab, onTabChange }: Props) {
  const { language, t } = useTranslations();
  const { content, loading, error } = useLegalContent(tab, language);
  return <Dialog open={tab !== null} onOpenChange={(open) => { if (!open) onTabChange(null); }}>
    <DialogContent className="customer-modal customer-sheet flex max-h-[90dvh] w-full flex-col rounded-t-3xl border-0 p-5 shadow-2xl sm:w-[calc(100vw-2rem)] sm:max-w-xl sm:rounded-3xl sm:p-7" overlayClassName="customer-overlay bg-black/60">
      <DialogHeader><DialogTitle className="text-lg font-bold">{content?.title || (tab === "privacy" ? t("privacyPage") : t("terms"))}</DialogTitle>{content?.subtitle && <p className="text-xs text-slate-500">{content.subtitle}</p>}</DialogHeader>
      <div role="tablist" aria-label="Legal pages" className="flex shrink-0 rounded-xl bg-slate-100 p-1">
        {(["terms", "privacy"] as const).map((value) => <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => onTabChange(value)} className={`min-w-0 flex-1 rounded-lg px-2 py-2 text-xs font-semibold [overflow-wrap:anywhere] transition-colors ${tab === value ? "bg-white text-primary shadow-sm" : "text-slate-500"}`}>{value === "terms" ? t("terms") : t("privacyPage")}</button>)}
      </div>
      <div role="tabpanel" aria-busy={loading} className="min-h-24 flex-1 space-y-3 overflow-y-auto overscroll-contain text-sm leading-relaxed text-slate-600">
        {loading && <p>{t("loading")}</p>}
        {error && <p role="alert">{t("requestFailed")}</p>}
        {content?.paragraphs.map((paragraph, index) => <p key={index} className="rounded-xl border border-slate-100 bg-slate-50 p-3">{paragraph}</p>)}
      </div>
      <button type="button" onClick={() => onTabChange(null)} className="h-10 shrink-0 rounded-xl bg-brand-primary px-5 text-sm font-semibold">{t("close")}</button>
    </DialogContent>
  </Dialog>;
}
