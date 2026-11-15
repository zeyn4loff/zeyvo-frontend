import { businessPath, partnerDelete, partnerGet, partnerPatch, saveRecord } from "../api/client";
import type { Resource, ResourceCategory, ResourceData, ResourceStatus } from "./resources";

const base = (businessId: string) => businessPath(businessId, "resources");

export async function fetchResources(businessId: string): Promise<ResourceData> {
  return (await partnerGet<{ resourceData: ResourceData }>(base(businessId))).resourceData;
}

export async function saveResourceCategory(businessId: string, category: ResourceCategory, existing: boolean): Promise<void> {
  await saveRecord(`${base(businessId)}/categories`, existing ? category.id : null, {
    name: category.name, description: category.description, icon: category.icon ?? null,
  });
}

export async function deleteResourceCategory(businessId: string, id: string): Promise<void> {
  await partnerDelete(`${base(businessId)}/categories/${id}`);
}

export async function saveBusinessResource(businessId: string, resource: Resource, previous?: Resource): Promise<void> {
  const previousIds = new Set(previous?.units?.map((unit) => unit.id) ?? []);
  await saveRecord(base(businessId), previous ? resource.id : null, {
    name: resource.name,
    type: resource.type,
    branchId: resource.branchId,
    categoryId: resource.categoryId || null,
    notes: resource.notes,
    units: resource.units?.map((unit) => ({ ...(previousIds.has(unit.id) ? { id: unit.id } : {}), status: unit.status })) ?? [],
  });
}

export async function deleteBusinessResource(businessId: string, id: string): Promise<void> {
  await partnerDelete(`${base(businessId)}/${id}`);
}

export async function updateResourceUnit(businessId: string, resourceId: string, unitId: string, status: ResourceStatus): Promise<void> {
  await partnerPatch(`${base(businessId)}/${resourceId}/units/${unitId}`, { status });
}
