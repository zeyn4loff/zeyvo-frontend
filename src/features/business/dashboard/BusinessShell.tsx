import { partnerPath } from "@/features/business/partnerPath";
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { Menu, ShoppingBag, X } from "lucide-react";
import { useBusinessSession } from "../auth/useBusinessSession";
import BusinessPosDialog from "../pos/BusinessPosDialog";
import type { BusinessSession } from "../auth/businessSession";
import { useActiveBusinessContext } from "../directory/activeContext";
import BusinessContextDialog from "../directory/BusinessContextDialog";
import { readBusinesses } from "../directory/businesses";
import { useBusinesses } from "../directory/useBusinesses";
import { BusinessCurrencyContext } from "../finance/businessCurrency";
import { BusinessHeaderContext } from "../components/businessHeaderContext";
import type { ReactNode } from "react";
import BusinessSidebarFooter from "./BusinessSidebarFooter";
import BusinessSidebarNav, { type BusinessSection } from "./BusinessSidebarNav";
import { canSeeBusinessSection } from "./businessSectionAccess";
import StaffInvitationInbox from "../staff/StaffInvitationInbox";
import { useLanguage } from "@/features/locale/language";
import { businessNavigationLabel, businessShellLabel } from "./businessNavigationLocale";
import { useSiteBranding } from "@/features/branding/siteBrandingContext";
import PageLoadingIndicator from "@/components/common/PageLoadingIndicator";

export default function BusinessShell({ session, section = "business", children }: { session: BusinessSession; section?: BusinessSection; children: ReactNode }) {
  const { language } = useLanguage();
  const branding = useSiteBranding("partner");
  const [menuOpen, setMenuOpen] = useState(false);
  const [posOpen, setPosOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [headerActions, setHeaderActions] = useState<HTMLElement | null>(null);
  const [headerSubtitle, setHeaderSubtitle] = useState<HTMLElement | null>(null);
  const [headerTitle, setHeaderTitle] = useState<HTMLElement | null>(null);
  const activeContext = useActiveBusinessContext(session);
  const { businesses, loading: businessesLoading } = useBusinesses(session);
  const activeBusiness = businesses.find((business) => business.id === activeContext?.businessId) ?? readBusinesses(session).find((business) => business.id === activeContext?.businessId);
  const hasBusinessContext = Boolean(activeContext && activeBusiness);
  const access = activeBusiness?.access;
  const canOpenPos = hasBusinessContext && (!access || access.role !== "staff" || Boolean(access.permissions.canCollectPayment));
  const currencyCode = activeBusiness?.currencyCode || "AZN";
  const { endSession } = useBusinessSession();
  const navigate = useNavigate();
  useEffect(() => {
    if (access?.role === "staff" && section === "business") navigate(partnerPath("/calendar"), { replace: true });
  }, [access?.role, navigate, section]);
  function logout() { endSession(); navigate(partnerPath("/auth"), { replace: true }); }

  return <BusinessCurrencyContext.Provider value={currencyCode}><BusinessHeaderContext.Provider value={{ actions: headerActions, subtitle: headerSubtitle, title: headerTitle, openPos: () => setPosOpen(true) }}><div className="flex h-dvh w-full overflow-hidden bg-[#101114] p-2 text-[#101114] sm:p-3 lg:p-3.5">
    {menuOpen && <button type="button" aria-label={businessShellLabel("closeMenu", language)} onClick={() => setMenuOpen(false)} className="fixed inset-0 z-40 cursor-pointer bg-black/60 lg:hidden" />}
    <aside className={`fixed inset-y-2 left-2 z-50 flex w-64 flex-col overflow-y-auto bg-[#101114] p-4 text-white transition-transform duration-300 lg:static lg:h-full lg:w-72 lg:shrink-0 lg:translate-none ${menuOpen ? "translate-x-0" : "-translate-x-[calc(100%+1rem)]"}`} aria-label={businessShellLabel("partnerMenu", language)}>
      <div className="flex items-center justify-between border-b border-white/10 pb-3">{branding?.logo_url && <Link to={partnerPath()} onClick={() => setMenuOpen(false)} aria-label="Zeyvo Partner"><img src={branding.logo_url} alt="Zeyvo Partner" className="h-8 w-auto max-w-44 object-contain brightness-0 invert" /></Link>}<button type="button" onClick={() => setMenuOpen(false)} aria-label={businessShellLabel("close", language)} className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-zinc-400 lg:hidden"><X size={16} /></button></div>
      {canOpenPos && <button type="button" onClick={() => { setMenuOpen(false); setPosOpen(true); }} className="mt-6 flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-primary px-3.5 text-xs font-bold text-[#101114]"><ShoppingBag size={16} />{{ az: "Kassa satışı (POS)", ru: "Продажа (POS)", tr: "Kasa satışı (POS)", en: "POS sale" }[language]}</button>}
      {!businessesLoading && <div className="mt-6"><BusinessSidebarNav section={section} session={session} access={access} hasBusinessContext={hasBusinessContext} onNavigate={() => setMenuOpen(false)} /></div>}
      <BusinessSidebarFooter session={session} activeContext={activeContext} profileActive={section === "profile"} onSwitch={() => { setMenuOpen(false); setContextOpen(true); }} onProfile={() => setMenuOpen(false)} onLogout={logout} />
    </aside>
    <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[28px] bg-white sm:rounded-[32px]">
      <header className="shrink-0 border-b border-slate-100 bg-white"><div className={"mx-auto flex min-h-16 max-w-7xl flex-col gap-3 px-4 py-3.5 sm:px-7 sm:py-4 sm:flex-row sm:items-center sm:justify-between"}><div className="flex min-w-0 items-center gap-3 sm:gap-4"><button type="button" onClick={() => setMenuOpen(true)} aria-label={businessShellLabel("openMenu", language)} className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-slate-100 lg:hidden"><Menu size={16} /></button><div className="min-w-0"><h1 className="business-header-title truncate text-lg font-bold tracking-tight sm:text-xl"><span ref={setHeaderTitle} className="business-header-title-override" /><span className="business-header-title-default">{businessNavigationLabel(section, language)}</span></h1><div ref={setHeaderSubtitle} className="text-xs text-slate-400" /></div></div><div className="flex min-w-0 items-center gap-2"><div ref={setHeaderActions} className="flex w-full flex-wrap gap-2 empty:hidden sm:w-auto sm:justify-end" /><StaffInvitationInbox email={session.email} session={session} businessId={activeContext?.businessId} /></div></div></header>
      <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain">{businessesLoading ? <PageLoadingIndicator /> : !hasBusinessContext && section !== "business" && section !== "profile" ? <Navigate to={partnerPath()} replace /> : access && !canSeeBusinessSection(section, access, hasBusinessContext) ? <div className="mx-auto max-w-xl px-5 py-14 text-center"><h2 className="text-xl font-bold">{businessShellLabel("noAccess", language)}</h2><p className="mt-2 text-sm text-slate-500">{businessShellLabel("ownerManages", language)}</p><Link to={partnerPath("/calendar")} className="mt-6 inline-flex rounded-xl bg-brand-primary px-5 py-3 text-sm font-bold">{businessShellLabel("goCalendar", language)}</Link></div> : children}</div>
    </main>
    {posOpen && canOpenPos && <BusinessPosDialog session={session} onClose={() => setPosOpen(false)} />}
    {contextOpen && <BusinessContextDialog session={session} active={activeContext} onClose={() => setContextOpen(false)} />}
  </div></BusinessHeaderContext.Provider></BusinessCurrencyContext.Provider>;
}
