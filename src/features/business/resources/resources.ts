import type { BusinessSession } from "../auth/businessSession";
import { resolveActiveContext } from "../directory/activeContext";

export type ResourceType = "chair" | "room" | "device";
export type ResourceStatus = "active" | "busy" | "maintenance";
export interface ResourceUnit { id: string; status: ResourceStatus }

export interface ResourceCategory { id: string; name: string; description: string; icon?: string }
export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  /** Legacy group status; new records store a status for every physical unit. */
  status?: ResourceStatus;
  branchId: string;
  categoryId: string;
  notes: string;
  quantity?: number;
  units?: ResourceUnit[];
}
export interface ResourceData { categories: ResourceCategory[]; resources: Resource[] }

const statuses: ResourceStatus[] = ["active", "busy", "maintenance"];

/** Preserve older locally stored resources that had one status for the whole quantity. */
export function resourceUnits(resource: Resource): ResourceUnit[] {
  if (Array.isArray(resource.units) && resource.units.length > 0) {
    const valid = resource.units.filter((unit): unit is ResourceUnit => !!unit && typeof unit.id === "string" && statuses.includes(unit.status));
    if (valid.length > 0) return valid;
  }
  const count = Math.max(1, Math.min(1000, Math.floor(Number(resource.quantity) || 1)));
  const status = resource.status && statuses.includes(resource.status) ? resource.status : "active";
  return Array.from({ length: count }, (_, index) => ({ id: `${resource.id}-unit-${index + 1}`, status }));
}

const serverData = new Map<string, ResourceData>();
const serverKey = (sessionId: string, businessId: string) => `${sessionId}:${businessId}`;

export function setServerResourceData(sessionId: string, businessId: string, data: ResourceData): void {
  serverData.set(serverKey(sessionId, businessId), data);
}

export function readResourceData(session: BusinessSession): ResourceData {
  const businessId = resolveActiveContext(session)?.businessId;
  return businessId ? serverData.get(serverKey(session.id, businessId)) ?? { categories: [], resources: [] } : { categories: [], resources: [] };
}

export const typeLabels: Record<ResourceType, string> = { chair: "Kreslo", room: "Otaq / kabinet", device: "Aparat / cihaz" };
export const statusLabels: Record<ResourceStatus, string> = { active: "Aktiv / Boş", busy: "Məşğul", maintenance: "Təmirdə" };
