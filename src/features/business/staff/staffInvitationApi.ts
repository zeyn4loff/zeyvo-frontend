import { businessPath, partnerGet, partnerPatch, partnerPost } from "../api/client";

export type ServerStaffInvitation = {
  id: string;
  businessId: string;
  businessName: string;
  staffId: string;
  staffName: string;
  senderName: string;
  recipientPhone: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
};

const staffPath = (businessId: string, staffId: string) => businessPath(businessId, "staff", staffId, "invitation");

export async function fetchStaffInvitation(businessId: string, staffId: string): Promise<ServerStaffInvitation | null> {
  return (await partnerGet<{ invitation: ServerStaffInvitation | null }>(staffPath(businessId, staffId))).invitation;
}

export async function sendStaffInvitation(businessId: string, staffId: string, phone: string): Promise<ServerStaffInvitation> {
  return (await partnerPost<{ invitation: ServerStaffInvitation }>(staffPath(businessId, staffId), { phone })).invitation;
}

export async function fetchIncomingStaffInvitations(): Promise<ServerStaffInvitation[]> {
  return (await partnerGet<{ invitations: ServerStaffInvitation[] }>("staff-invitations")).invitations;
}

export async function answerIncomingStaffInvitation(id: string, accept: boolean): Promise<ServerStaffInvitation> {
  return (await partnerPatch<{ invitation: ServerStaffInvitation }>(`staff-invitations/${id}`, { accept })).invitation;
}
