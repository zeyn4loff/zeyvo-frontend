import { businessPath, partnerDelete, partnerGet, saveRecord } from "../api/client";
import type { StaffData, StaffMember, StaffRole } from "./staff";

const base = (businessId: string) => businessPath(businessId, "staff");

export async function fetchStaff(businessId: string): Promise<StaffData> {
  return (await partnerGet<{ staffData: StaffData }>(base(businessId))).staffData;
}

export async function saveStaffMember(businessId: string, member: StaffMember, serviceIds: string[], existing: boolean): Promise<void> {
  await saveRecord(base(businessId), existing ? member.id : null, {
    ...member,
    branchIds: member.branchIds?.length ? member.branchIds : [member.branchId],
    serviceIds,
  });
}

export async function deleteStaffMember(businessId: string, id: string): Promise<void> {
  await partnerDelete(`${base(businessId)}/${id}`);
}

export async function saveStaffRole(businessId: string, role: StaffRole, existing: boolean): Promise<void> {
  await saveRecord(`${base(businessId)}/roles`, existing ? role.id : null, {
    name: role.name, description: role.description, commission: role.commission, isDefault: role.isDefault,
  });
}

export async function deleteStaffRole(businessId: string, id: string): Promise<void> {
  await partnerDelete(`${base(businessId)}/roles/${id}`);
}
