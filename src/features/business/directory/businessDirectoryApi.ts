import { businessPath, partnerDelete, partnerGet, partnerPatch, partnerPost } from "../api/client";
import type { Branch, Business } from "./businesses";

type BusinessResponse = { business: Business };
type ListResponse = { businesses: Business[] };
export type BusinessContext = { businessId: string | null; branchId: string | null };

const base = "businesses";

export async function fetchBusinesses(): Promise<Business[]> {
  return (await partnerGet<ListResponse>(base)).businesses;
}

export async function fetchBusinessContext(): Promise<BusinessContext> {
  return (await partnerGet<{ context: BusinessContext }>(`${base}/context`)).context;
}

export async function saveBusinessContext(businessId: string, branchId: string): Promise<void> {
  await partnerPatch(`${base}/context`, { businessId, branchId });
}

function businessPayload(value: Business): Record<string, unknown> {
  return { type: value.type, name: value.name, description: value.description };
}

export async function createBusiness(value: Business): Promise<Business> {
  return (await partnerPost<BusinessResponse>(base, businessPayload(value))).business;
}

export async function updateBusiness(value: Business): Promise<Business> {
  return (await partnerPatch<BusinessResponse>(`${base}/${value.id}`, businessPayload(value))).business;
}

export async function setBusinessPublication(id: string, published: boolean): Promise<Business> {
  return (await partnerPatch<BusinessResponse>(`${base}/${id}/publication`, { published })).business;
}

export async function removeBusiness(id: string): Promise<void> {
  await partnerDelete(`${base}/${id}`);
}

function branchPayload(value: Branch): Record<string, unknown> {
  return {
    name: value.name,
    city: value.city,
    city_id: value.cityId ?? null,
    address: value.address,
    latitude: value.latitude ?? null,
    longitude: value.longitude ?? null,
    description: value.description ?? "",
    phones: value.phones ?? (value.phone ? [value.phone] : []),
    categories: value.categories ?? (value.category ? [value.category] : []),
    amenities: value.amenities ?? [],
    schedule_days: value.scheduleDays ?? {},
    whatsapp: value.whatsapp ?? "",
    telegram: value.telegram ?? "",
    instagram: value.instagram ?? "",
    facebook: value.facebook ?? "",
    tiktok: value.tiktok ?? "",
    linkedin: value.linkedin ?? "",
  };
}

function dataUrlFile(dataUrl: string, name: string): File {
  const [header, encoded] = dataUrl.split(",", 2);
  const type = header.match(/^data:([^;]+);base64$/)?.[1] ?? "image/jpeg";
  const binary = atob(encoded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new File([bytes], name, { type });
}

function mediaForm(kind: "logo" | "photo", dataUrl: string, name: string): FormData {
  const form = new FormData();
  form.set("kind", kind);
  form.set("file", dataUrlFile(dataUrl, name));
  return form;
}

/** Uploads newly added pictures and removes the ones the partner deleted. */
async function syncMedia(businessId: string, branchId: string, next: Branch, previous?: Branch): Promise<void> {
  const path = businessPath(businessId, "branches", branchId);
  if (next.logo?.startsWith("data:")) {
    await partnerPost(`${path}/media`, mediaForm("logo", next.logo, "logo.jpg"));
  } else if (previous?.logo && !next.logo) {
    await partnerDelete(`${path}/logo`);
  }
  for (const media of previous?.media ?? []) {
    if (!next.photos?.includes(media.url)) await partnerDelete(`${path}/media/${media.id}`);
  }
  for (const [index, photo] of (next.photos ?? []).entries()) {
    if (!photo.startsWith("data:")) continue;
    await partnerPost(`${path}/media`, mediaForm("photo", photo, `photo-${index + 1}.jpg`));
  }
}

/** Reloads the directory so the saved record carries its generated media URLs. */
async function reloadBusiness(businessId: string, fallback: Business): Promise<Business> {
  return (await fetchBusinesses()).find((item) => item.id === businessId) ?? fallback;
}

export async function createIndividual(value: Business, profile: Branch): Promise<Business> {
  const created = (await partnerPost<BusinessResponse>(`${base}/individual`, {
    ...branchPayload(profile),
    business_description: profile.description ?? value.description,
  })).business;
  if (created.primaryBranchId) await syncMedia(created.id, created.primaryBranchId, profile);
  return reloadBusiness(created.id, created);
}

export async function saveIndividual(value: Business, profile: Branch): Promise<Business> {
  const previous = value as Branch;
  const saved = (await partnerPatch<BusinessResponse>(`${base}/${value.id}/primary-branch`, branchPayload(profile))).business;
  if (saved.primaryBranchId) await syncMedia(saved.id, saved.primaryBranchId, profile, previous);
  return reloadBusiness(saved.id, saved);
}

export async function saveBranch(businessId: string, value: Branch, previous?: Branch): Promise<Business> {
  const branchesPath = businessPath(businessId, "branches");
  const result = previous
    ? await partnerPatch<BusinessResponse & { branchId?: string }>(`${branchesPath}/${previous.id}`, branchPayload(value))
    : await partnerPost<BusinessResponse & { branchId?: string }>(branchesPath, branchPayload(value));
  const branchId = previous?.id ?? result.branchId;
  if (branchId) await syncMedia(businessId, branchId, value, previous);
  return reloadBusiness(businessId, result.business);
}

export async function removeBranch(businessId: string, branchId: string): Promise<void> {
  await partnerDelete(businessPath(businessId, "branches", branchId));
}
