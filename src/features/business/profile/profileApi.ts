import { partnerDelete, partnerGet, partnerPatch, partnerPost } from "../api/client";
import type { BusinessProfile } from "./profile";

type ProfileResponse = { profile: BusinessProfile };

export async function readPartnerProfile(): Promise<BusinessProfile> {
  return (await partnerGet<ProfileResponse>("profile")).profile;
}

export async function updatePartnerProfile(data: Record<string, unknown>): Promise<BusinessProfile> {
  return (await partnerPatch<ProfileResponse>("profile", data)).profile;
}

export async function uploadPartnerAvatar(file: File): Promise<BusinessProfile> {
  const form = new FormData();
  form.set("avatar", file);
  return (await partnerPost<ProfileResponse>("profile/avatar", form)).profile;
}

export async function removePartnerAvatar(): Promise<BusinessProfile> {
  return (await partnerDelete<ProfileResponse>("profile/avatar")).profile;
}

export async function deletePartnerProfile(): Promise<void> {
  await partnerDelete("profile", { confirmation: "DELETE" });
}

export type GoogleCalendarStatus = { configured: boolean; connected: boolean; last_synced_at: string | null };
export async function readGoogleCalendarStatus(): Promise<GoogleCalendarStatus> {
  return partnerGet<GoogleCalendarStatus>("profile/calendar/google");
}
export async function authorizeGoogleCalendar(): Promise<string> {
  return (await partnerPost<{ url: string }>("profile/calendar/google/authorize")).url;
}
export async function syncGoogleCalendar(): Promise<number> {
  return (await partnerPost<{ synced: number }>("profile/calendar/google/sync")).synced;
}
export async function disconnectGoogleCalendar(): Promise<void> {
  await partnerDelete("profile/calendar/google");
}
