import { partnerPath } from "@/features/business/partnerPath";
import { Navigate } from "react-router";
import { useBusinessSession } from "@/features/business/auth/useBusinessSession";
import BusinessShell from "@/features/business/dashboard/BusinessShell";
import BusinessFinance from "@/features/business/finance/BusinessFinance";
export default function BusinessFinancePage() { const { session } = useBusinessSession(); if (!session) return <Navigate to={partnerPath("/auth")} replace />; return <BusinessShell session={session} section="finance"><BusinessFinance session={session} /></BusinessShell>; }
