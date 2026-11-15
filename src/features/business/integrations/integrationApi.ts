import { businessPath, partnerDelete, partnerGet, partnerPost } from "../api/client";
import type { IntegrationReview } from "./integrations";

export interface WhatsAppConnection {
  state: string;
  qr?: string;
}

const base = (businessId: string) => businessPath(businessId, "integrations", "whatsapp");

export async function fetchWhatsApp(businessId: string): Promise<WhatsAppConnection> {
  return (await partnerGet<{ whatsapp: WhatsAppConnection }>(base(businessId))).whatsapp;
}

export async function requestWhatsAppQr(businessId: string): Promise<{ state: string; qr: string }> {
  return (await partnerPost<{ whatsapp: { state: string; qr: string } }>(`${base(businessId)}/qr`)).whatsapp;
}

export async function disconnectWhatsApp(businessId: string): Promise<void> {
  await partnerDelete(`${base(businessId)}/connection`);
}

export async function fetchIntegrationReviews(businessId: string): Promise<IntegrationReview[]> {
  return (await partnerGet<{ reviews: IntegrationReview[] }>(`${base(businessId)}/reviews`)).reviews;
}

export async function saveIntegrationReview(businessId: string, rating: number, comment: string): Promise<IntegrationReview[]> {
  return (await partnerPost<{ reviews: IntegrationReview[] }>(`${base(businessId)}/reviews`, { rating, comment })).reviews;
}
