import { useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { BusinessLoginForm, BusinessRegisterForm } from "@/features/business/auth/BusinessAuthForms";
import { useBusinessSession } from "@/features/business/auth/useBusinessSession";
import LanguageIndicator from "@/components/common/LanguageIndicator";
import { useTranslations } from "@/features/locale/language";
import { useSiteBranding } from "@/features/branding/siteBrandingContext";

type AuthMode = "login" | "register";

export default function BusinessAuthPage() {
  const { t } = useTranslations();
  const branding = useSiteBranding("partner");
  const { session, startSession } = useBusinessSession();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>(() => searchParams.get("mode") === "register" ? "register" : "login");
  const [error, setError] = useState("");

  if (session) return <Navigate to={session.startView === "profile" ? "/partner/profile/personal" : "/partner"} replace />;

  function changeMode(next: AuthMode) {
    setMode(next);
    setError("");
  }

  return <div className="flex min-h-screen flex-col bg-[#f4f5f8] text-primary">
    <header className="border-b border-lime-300 bg-brand-primary">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        {branding?.logo_url && <Link to="/" aria-label="Zeyvo Partner"><img src={branding.logo_url} alt="Zeyvo Partner" className="h-8 w-auto max-w-36 object-contain sm:h-9" /></Link>}
        <div className="flex items-center gap-3"><LanguageIndicator /><a href="https://zeyvo.app/" className="inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold sm:text-sm"><ArrowLeft size={16} />Əsas səhifə</a></div>
      </div>
    </header>

    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
      <section className="w-full max-w-[530px] rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-8" aria-label="Partner hesabı">
        <>
          <div className="mx-auto mb-5 grid w-full max-w-80 grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Partner hesabı">
            <button type="button" role="tab" aria-selected={mode === "login"} onClick={() => changeMode("login")} className={`min-h-11 cursor-pointer rounded-lg px-2 text-xs font-bold transition-colors sm:text-sm ${mode === "login" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-primary"}`}>{t("login")}</button>
            <button type="button" role="tab" aria-selected={mode === "register"} onClick={() => changeMode("register")} className={`min-h-11 cursor-pointer rounded-lg px-2 text-xs font-bold transition-colors sm:text-sm ${mode === "register" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-primary"}`}>{t("register")}</button>
          </div>
          {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {mode === "login" && <BusinessLoginForm onStart={startSession} onError={setError} />}
          {mode === "register" && <BusinessRegisterForm onStart={startSession} onError={setError} />}
        </>
      </section>
      <div className="mt-5 flex gap-5 text-xs text-slate-500"><Link to="/terms" className="hover:underline">{t("terms")}</Link><Link to="/privacy" className="hover:underline">{t("privacy")}</Link></div>
      {branding?.description && <p className="mt-4 max-w-md text-center text-xs leading-relaxed text-slate-500">{branding.description}</p>}
    </main>
  </div>;
}
