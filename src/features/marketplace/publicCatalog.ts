import { categories, type Salon, type Service, type Specialist } from "./data";
import { useEffect, useSyncExternalStore } from "react";

let marketplaceRevision = 0;
interface CatalogBusiness {
  id: string; type: "business" | "individual"; name: string; description: string; rating: number; reviewsCount: number;
  branches: { id: string; name: string; city: string; address: string; description: string; category: string; amenities: string[]; scheduleDays: Record<string, { isOff: boolean; open: string; close: string }>; hours: string; phone: string; logo: string; photos: string[]; whatsapp: string; instagram: string; facebook: string }[];
  services: { id: string; name: string; category: string; price: number; duration: number; staffIds: string[] }[];
  staff: { id: string; branchId: string | null; name: string; specialization: string; bio: string; avatar: string; rating: number; reviewsCount: number }[];
}
let serverBusinesses: CatalogBusiness[] = [];
let catalogSettled = false;
let catalogRequested = false;
let catalogError = false;
async function loadPublicCatalog(): Promise<void> {
  try {
    const [response, taxonomyResponse] = await Promise.all([
      fetch("/api/v1/catalog", { headers: { Accept: "application/json" } }),
      fetch("/api/v1/service-taxonomies", { headers: { Accept: "application/json" } }),
    ]);
    const [payload, taxonomyPayload] = await Promise.all([response.json(), taxonomyResponse.json()]);
    if (response.ok && taxonomyResponse.ok && payload.success && taxonomyPayload.success && Array.isArray(payload.data?.businesses) && Array.isArray(taxonomyPayload.data?.categories) && taxonomyPayload.data.categories.length > 0) {
      serverBusinesses = payload.data.businesses;
      categories.splice(0, categories.length, ...taxonomyPayload.data.categories.map((category: { id: string; name: string; azName: string; subcategories: { id: string; name: string; azName: string }[] }) => ({
        id: category.id,
        title: category.name,
        azName: category.azName,
        subcategories: category.subcategories.map((subcategory) => ({ ...subcategory, image: "" })),
      })));
      catalogError = false;
    } else throw new Error("Catalog response is invalid");
  } catch { serverBusinesses = []; catalogError = true; }
  finally { catalogSettled = true; notifyMarketplace(); }
}
export function isPublicCatalogSettled(): boolean { return catalogSettled; }
export function hasPublicCatalogError(): boolean { return catalogError; }
export async function refreshPublicCatalog(): Promise<void> { await loadPublicCatalog(); }
const listeners = new Set<() => void>();
function notifyMarketplace() { marketplaceRevision += 1; listeners.forEach((listener) => listener()); }
export function useMarketplaceRevision(): number {
  useEffect(() => { if (!catalogRequested) { catalogRequested = true; void loadPublicCatalog(); } }, []);
  return useSyncExternalStore((listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; }, () => marketplaceRevision, () => 0);
}


function stableId(value: string): number {
  let hash = 2166136261;
  for (const character of value) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return 1_000_000 + (hash >>> 0);
}

function personalAvatar(name: string): string {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toLocaleUpperCase("az") ?? "").join("").replace(/[^\p{L}]/gu, "");
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><rect width="160" height="160" rx="32" fill="#d0f482"/><text x="80" y="102" text-anchor="middle" font-family="Arial,sans-serif" font-size="58" font-weight="700" fill="#111827">${initials}</text></svg>`)}`;
}

export function getPublicSalons(): Salon[] {
  const remote: Salon[] = serverBusinesses.map((business) => {
    const branch = business.branches[0];
    const category = branch?.category?.split("/")[0] || "beauty";
    const id = stableId(`server:${business.id}`);
    const services: Service[] = business.services.map((service) => ({ id: stableId(`server:${service.id}`), partnerServiceId: service.id, name: service.name, category: service.category, price: service.price, duration: `${service.duration} dəq` }));
    const publicStaff: Specialist[] = business.staff.map((member) => ({
      id: stableId(`server:${member.id}`), partnerStaffId: member.id, partnerBranchId: member.branchId ?? branch?.id,
      topCategory: category, name: member.name, title: member.specialization || "Usta", salonName: business.name,
      salonId: id, rating: member.rating, photo: member.avatar || personalAvatar(member.name), bio: member.bio,
      services: business.services.filter((service) => service.staffIds.includes(member.id)).map((service) => services.find((item) => item.partnerServiceId === service.id)!).filter(Boolean),
    }));
    if (business.type === "individual" && publicStaff.length === 0) publicStaff.push({ id: stableId(`server:${business.id}:individual`), topCategory: category, name: business.name, title: "Fərdi usta", salonName: "", salonId: id, rating: 0, photo: branch?.logo || personalAvatar(business.name), bio: business.description, services });
    return {
      id, isIndividual: business.type === "individual", partner: { ownerId: "server", businessId: business.id },
      city: branch?.city || "", topCategory: category, category: branch?.category?.split("/").at(-1) || "", name: business.name,
      tag: categories.find((item) => item.id === category)?.azName || category,
      rating: business.rating, reviewsCount: business.reviewsCount, location: branch?.address || branch?.city || "", workHours: branch?.hours,
      description: business.description || branch?.description || "", image: branch?.logo || branch?.photos[0] || "",
      services, slots: [], specialists: publicStaff,
      branches: business.branches.map((item) => ({ id: item.id, name: item.name, address: item.address, city: item.city, hours: item.hours, phone: item.phone, amenities: item.amenities, description: item.description, logo: item.logo, photos: item.photos, scheduleDays: item.scheduleDays, whatsapp: item.whatsapp, instagram: item.instagram, facebook: item.facebook })),
      contact: { phone: branch?.phone, instagram: branch?.instagram },
    };
  });
  return remote;
}

export function getCatalogSalons(): Salon[] {
  return getPublicSalons().filter((salon) => !salon.isIndividual);
}

export function getPublicSpecialists(): Specialist[] {
  return getPublicSalons().flatMap((salon) => salon.specialists ?? []);
}
