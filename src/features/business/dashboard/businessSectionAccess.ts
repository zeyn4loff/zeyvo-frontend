import type { Business } from "../directory/businesses";
import type { BusinessSection } from "./BusinessSidebarNav";

export function canSeeBusinessSection(section: BusinessSection, access?: Business["access"], hasBusinessContext = true): boolean {
  if (!hasBusinessContext) return section === "business" || section === "profile";
  if (!access || access.role !== "staff" || section === "profile") return true;
  if (section === "calendar") return true;
  if (section === "services") return Boolean(access.permissions.canManageServices);
  if (section === "resources" || section === "products") return Boolean(access.permissions.canManageInventory);
  if (section === "clients") return Boolean(access.permissions.canViewClientContacts);
  return false;
}
