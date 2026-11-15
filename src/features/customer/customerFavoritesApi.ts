import { currentLanguage, translate } from "@/features/locale/language";
import { customerCsrfToken } from "./customerAuthApi";

export type FavoriteTarget = { type: "business" | "staff" | "individual"; targetId: string };

async function request(path: string, method: "GET" | "PUT" | "DELETE"): Promise<FavoriteTarget[]> {
  const response = await fetch(`/api/v1/customer/favorites${path}`, {
    method, credentials: "include",
    headers: { Accept: "application/json", "Accept-Language": currentLanguage(), ...(method !== "GET" ? { "X-CSRF-TOKEN": await customerCsrfToken() } : {}) },
  });
  const payload = await response.json().catch(() => ({})) as { success?: boolean; data?: { favorites: FavoriteTarget[] }; error?: { message?: string } };
  if (!response.ok || !payload.success) throw new Error(payload.error?.message || translate(currentLanguage(), "requestFailed"));
  return payload.data?.favorites ?? [];
}

export const fetchCustomerFavorites = () => request("", "GET");
export const setCustomerFavorite = (target: FavoriteTarget, selected: boolean) =>
  request(`/${target.type}/${encodeURIComponent(target.targetId)}`, selected ? "PUT" : "DELETE");
