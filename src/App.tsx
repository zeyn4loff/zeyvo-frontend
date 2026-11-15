import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Outlet, Routes, Route, useLocation } from "react-router";
import MainLayout from "@/components/layout/MainLayout";
import { CustomerProvider } from "@/features/customer/CustomerContext";
import CustomerModals from "@/features/customer/CustomerModals";
import { LocationProvider } from "@/features/location/LocationContext";
import BusinessSessionProvider from "@/features/business/auth/BusinessSessionProvider";
import PageLoadingIndicator from "@/components/common/PageLoadingIndicator";
import ToastViewport from "@/components/common/ToastViewport";
import { useCityPicker } from "@/features/location/city-picker-context";
import { SiteBrandingProvider } from "@/features/branding/SiteBrandingProvider";
import { hasPublicCatalogError, isPublicCatalogSettled, refreshPublicCatalog, useMarketplaceRevision } from "@/features/marketplace/publicCatalog";
import { useCustomerText } from "@/features/locale/customerText";

const Home = lazy(() => import("@/pages/home"));
const CatalogPage = lazy(() => import("@/pages/catalog"));
const SalonPage = lazy(() => import("@/pages/salon"));
const MasterPage = lazy(() => import("@/pages/master"));
const LegalPage = lazy(() => import("@/pages/legal"));
const StatusPage = lazy(() => import("@/pages/status"));
const BusinessAuthPage = lazy(() => import("@/pages/business-auth"));
const BusinessDashboardPage = lazy(() => import("@/pages/business-dashboard"));
const BusinessCalendarPage = lazy(() => import("@/pages/business-calendar"));
const BusinessResourcesPage = lazy(() => import("@/pages/business-resources"));
const BusinessProductsPage = lazy(() => import("@/pages/business-products"));
const BusinessStaffPage = lazy(() => import("@/pages/business-staff"));
const BusinessServicesPage = lazy(() => import("@/pages/business-services"));
const BusinessClientsPage = lazy(() => import("@/pages/business-clients"));
const BusinessLoyaltyPage = lazy(() => import("@/pages/business-loyalty"));
const BusinessMarketingPage = lazy(() => import("@/pages/business-marketing"));
const BusinessIntegrationsPage = lazy(() => import("@/pages/business-integrations"));
const BusinessFinancePage = lazy(() => import("@/pages/business-finance"));
const BusinessProfilePage = lazy(() => import("@/pages/business-profile"));

function LegacyPartnerRedirect() {
  const { pathname, search, hash } = useLocation();
  return <Navigate to={`/partner${pathname.slice("/business".length)}${search}${hash}`} replace />;
}

function LegacyCitiesRedirect() {
  const openCityPicker = useCityPicker();
  useEffect(() => { openCityPicker(); }, [openCityPicker]);
  return <Navigate to="/catalog" replace />;
}

function PublicCatalogGate() {
  const t = useCustomerText();
  useMarketplaceRevision();
  if (!isPublicCatalogSettled()) return <PageLoadingIndicator />;
  if (hasPublicCatalogError()) return <main className="container mx-auto flex min-h-[50dvh] flex-col items-center justify-center gap-4 px-4 text-center"><h1 className="text-xl font-bold">{t("Kataloq yüklənmədi")}</h1><p className="text-sm text-slate-600">{t("Bağlantını yoxlayın və yenidən cəhd edin.")}</p><button type="button" onClick={() => { void refreshPublicCatalog(); }} className="min-h-11 rounded-xl bg-brand-primary px-6 text-sm font-bold">{t("Yenidən cəhd et")}</button></main>;
  return <Outlet />;
}

function PartnerAuthRoute() {
  const { search, hash } = useLocation();
  return window.location.hostname === "partner.zeyvo.app"
    ? <Navigate to={`/${search}${hash}`} replace />
    : <BusinessAuthPage />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <SiteBrandingProvider>
      <LocationProvider>
        <BusinessSessionProvider>
        <CustomerProvider>
          <Suspense fallback={<PageLoadingIndicator />}>
            <Routes>
              {window.location.hostname === "partner.zeyvo.app" && <Route index element={<BusinessAuthPage />} />}
              <Route path="partner/auth" element={<PartnerAuthRoute />} />
              <Route path="partner" element={<BusinessDashboardPage />} />
              <Route path="partner/biznes" element={<BusinessDashboardPage />} />
              <Route path="partner/calendar" element={<BusinessCalendarPage />} />
              <Route path="partner/resources" element={<BusinessResourcesPage />} />
              <Route path="partner/products" element={<BusinessProductsPage />} />
              <Route path="partner/staff" element={<BusinessStaffPage />} />
              <Route path="partner/services" element={<BusinessServicesPage />} />
              <Route path="partner/clients" element={<BusinessClientsPage />} />
              <Route path="partner/loyalty" element={<BusinessLoyaltyPage />} />
              <Route path="partner/marketing" element={<BusinessMarketingPage />} />
              <Route path="partner/integrations" element={<BusinessIntegrationsPage />} />
              <Route path="partner/finance" element={<BusinessFinancePage />} />
              <Route path="partner/profile" element={<BusinessProfilePage />} />
              <Route path="partner/profile/:tab" element={<BusinessProfilePage />} />
              <Route path="business/*" element={<LegacyPartnerRedirect />} />
              <Route element={<MainLayout />}>
                <Route element={<PublicCatalogGate />}>
                {window.location.hostname !== "partner.zeyvo.app" && <Route index element={<Home />} />}
                <Route path="catalog" element={<CatalogPage />} />
                <Route path="catalog/:category" element={<CatalogPage />} />
                <Route path="catalog/:category/:subcategory" element={<CatalogPage />} />
                <Route path="salons" element={<CatalogPage />} />
                <Route path="salons/:category" element={<CatalogPage />} />
                <Route path="salons/:category/:subcategory" element={<CatalogPage />} />
                <Route path="masters" element={<Navigate to="/catalog?type=masters" replace />} />
                <Route path="salon/:id" element={<SalonPage />} />
                <Route path="master/:id" element={<MasterPage />} />
                <Route path="masters/:id" element={<MasterPage />} />
                <Route path="cities" element={<LegacyCitiesRedirect />} />
                <Route path="terms" element={<LegalPage />} />
                <Route path="privacy" element={<LegalPage />} />
                <Route path="for-business" element={<Navigate to="/partner/auth?mode=register" replace />} />
                <Route path="*" element={<StatusPage />} />
                </Route>
              </Route>
            </Routes>
          </Suspense>
          <CustomerModals />
          <ToastViewport />
        </CustomerProvider>
        </BusinessSessionProvider>
      </LocationProvider>
      </SiteBrandingProvider>
    </BrowserRouter>
  );
}
