import { partnerPath } from "@/features/business/partnerPath";
import { Navigate } from "react-router";
import { useBusinessSession } from "@/features/business/auth/useBusinessSession";
import BusinessShell from "@/features/business/dashboard/BusinessShell";
import BusinessMarketing from "@/features/business/marketing/BusinessMarketing";
import StaffReviews from "@/features/business/marketing/StaffReviews";
import { useBusinesses } from "@/features/business/directory/useBusinesses";
import { useActiveBusinessContext } from "@/features/business/directory/activeContext";
import type { BusinessSession } from "@/features/business/auth/businessSession";

function MarketingContent({ session }: { session: BusinessSession }) {
  const { businesses, loading } = useBusinesses(session);
  const active = useActiveBusinessContext(session);
  const access = businesses.find((business) => business.id === active?.businessId)?.access;
  if (loading) return null;
  return access?.role === "staff" ? <StaffReviews session={session} /> : <BusinessMarketing session={session} />;
}

export default function BusinessMarketingPage() { const { session } = useBusinessSession(); if (!session) return <Navigate to={partnerPath("/auth")} replace />; return <BusinessShell session={session} section="marketing"><MarketingContent session={session} /></BusinessShell>; }
