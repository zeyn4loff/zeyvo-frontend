import { partnerPath } from "@/features/business/partnerPath";
import { Navigate } from "react-router";
import { useBusinessSession } from "@/features/business/auth/useBusinessSession";
import BusinessShell from "@/features/business/dashboard/BusinessShell";
import BusinessMarketing from "@/features/business/marketing/BusinessMarketing";
export default function BusinessMarketingPage() { const { session } = useBusinessSession(); if (!session) return <Navigate to={partnerPath("/auth")} replace />; return <BusinessShell session={session} section="marketing"><BusinessMarketing session={session} /></BusinessShell>; }
