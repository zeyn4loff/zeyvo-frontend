import { businessPath, partnerDelete, partnerGet, saveRecord } from "../api/client";
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
    onlineSettings: service.onlineSettings ?? null,
    resourceIds: service.resourceIds,
    materialItems: (service.materialItems ?? []).map((item) => ({ ...item, productId: item.productId.split("@")[0] })),
    comboItems: service.comboItems ?? [],
    translations: Object.fromEntries(Object.entries(service.translations ?? {}).filter(([, value]) => value.name.trim())),
  });
}

export async function deleteBusinessService(businessId: string, id: string): Promise<void> {
  await partnerDelete(`${base(businessId)}/${id}`);
}
