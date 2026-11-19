import { PartnerApiError, businessPath, partnerDelete, partnerGet, partnerPost, saveRecord } from "../api/client";
import type { Service, ServiceCategory, ServiceData } from "./services";

const base = (businessId: string) => businessPath(businessId, "services");

export async function fetchServices(businessId: string): Promise<ServiceData> {
  return (await partnerGet<{ serviceData: ServiceData }>(base(businessId))).serviceData;
}

export async function saveServiceCategory(businessId: string, category: ServiceCategory, existing: boolean): Promise<void> {
  await saveRecord(`${base(businessId)}/categories`, existing ? category.id : null, {
    name: category.name, description: category.description, icon: category.icon ?? null,
  });
}

export async function deleteServiceCategory(businessId: string, id: string): Promise<void> {
  await partnerDelete(`${base(businessId)}/categories/${id}`);
}

export async function saveBusinessService(businessId: string, service: Service, existing: boolean): Promise<void> {
  const uploaded: string[] = [];
  const imageUrls: string[] = [];
  try {
    for (const imageUrl of service.onlineSettings?.imageUrls ?? []) {
      if (!imageUrl.startsWith("data:")) { imageUrls.push(imageUrl); continue; }
      let image: { url: string; filename: string };
      try {
        const [header, encoded] = imageUrl.split(",", 2);
        if (!encoded) throw new Error("Invalid image data");
        const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
        const blob = new Blob([bytes], { type: header.slice(5).split(";")[0] });
        const form = new FormData();
        form.append("file", blob, `service-image.${blob.type === "image/png" ? "png" : blob.type === "image/jpeg" ? "jpg" : "webp"}`);
        image = await partnerPost<{ url: string; filename: string }>(`${base(businessId)}/media`, form);
      } catch (cause) {
        if (cause instanceof PartnerApiError) {
          if (cause.status === 401 || cause.status === 419) throw new Error("Sessiya bitib. Yenidən daxil olun.", { cause });
          if (cause.status === 404 || cause.status === 405) throw new Error("Şəkil yükləmə xidməti serverdə mövcud deyil.", { cause });
          if (cause.status === 413) throw new Error("Şəkil server üçün çox böyükdür. Daha kiçik şəkil seçin.", { cause });
          if (cause.status === 422) throw new Error("Şəkil qəbul edilmədi. PNG, JPG və ya WebP seçin (maksimum 5 MB).", { cause });
          if (cause.status >= 500) throw new Error("Server şəkli saxlaya bilmədi. Bir az sonra yenidən cəhd edin.", { cause });
        }
        throw new Error("Şəkilləri yükləmək mümkün olmadı. İnternet bağlantısını yoxlayıb yenidən cəhd edin.", { cause });
      }
      uploaded.push(image.filename);
      imageUrls.push(image.url);
    }
    await saveRecord(base(businessId), existing ? service.id : null, {
    name: service.name,
    description: service.description,
    categoryId: service.categoryId || null,
    techCardId: service.techCardId || null,
    price: service.price,
    priceMax: service.priceMax,
    priceType: service.priceType,
    duration: service.duration,
    breakTime: service.breakTime,
    bufferTime: service.bufferTime,
    gender: service.gender,
    format: service.format,
    isCombo: service.isCombo ?? false,
    capacity: service.capacity,
    onlineBooking: service.onlineBooking,
    staffIds: service.staffIds,
    staffOverrides: service.staffOverrides ?? {},
    staffProductIds: service.staffProductIds ?? {},
    onlineSettings: service.onlineSettings ? { ...service.onlineSettings, imageUrls } : null,
    resourceIds: service.resourceIds,
    materialItems: (service.materialItems ?? []).map((item) => ({ ...item, productId: item.productId.split("@")[0] })),
    comboItems: service.comboItems ?? [],
    translations: Object.fromEntries(Object.entries(service.translations ?? {}).filter(([, value]) => value.name.trim())),
    });
  } catch (error) {
    await Promise.allSettled(uploaded.map((filename) => partnerDelete(`${base(businessId)}/media/${filename}`)));
    throw error;
  }
}

export async function deleteBusinessService(businessId: string, id: string): Promise<void> {
  await partnerDelete(`${base(businessId)}/${id}`);
}
