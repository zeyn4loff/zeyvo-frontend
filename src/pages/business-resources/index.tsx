import { partnerPath } from "@/features/business/partnerPath";
import { Navigate } from "react-router";
import { useBusinessSession } from "@/features/business/auth/useBusinessSession";
import BusinessShell from "@/features/business/dashboard/BusinessShell";
import BusinessResources from "@/features/business/resources/BusinessResources";

export default function BusinessResourcesPage() {
  const { session } = useBusinessSession();
  if (!session) return <Navigate to={partnerPath("/auth")} replace />;
  return <BusinessShell session={session} section="resources"><BusinessResources session={session} /></BusinessShell>;
}
