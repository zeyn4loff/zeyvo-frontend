import { partnerPath } from "@/features/business/partnerPath";
import { Navigate } from "react-router";
import { useBusinessSession } from "@/features/business/auth/useBusinessSession";
import BusinessShell from "@/features/business/dashboard/BusinessShell";
import BusinessClients from "@/features/business/clients/BusinessClients";
export default function BusinessClientsPage() { const { session } = useBusinessSession(); if (!session) return <Navigate to={partnerPath("/auth")} replace />; return <BusinessShell session={session} section="clients"><BusinessClients session={session} /></BusinessShell>; }
