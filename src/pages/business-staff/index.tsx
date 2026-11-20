import { Navigate } from "react-router";
import { useBusinessSession } from "@/features/business/auth/useBusinessSession";
import { partnerPath } from "@/features/business/partnerPath";
import BusinessShell from "@/features/business/dashboard/BusinessShell";
import BusinessStaff from "@/features/business/staff/BusinessStaff";
export default function BusinessStaffPage() { const { session } = useBusinessSession(); if (!session) return <Navigate to={partnerPath("/auth")} replace />; return <BusinessShell session={session} section="staff"><BusinessStaff session={session} /></BusinessShell>; }
