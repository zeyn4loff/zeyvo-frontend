import { businessPath, partnerDelete, partnerGet, partnerPatch, partnerPost, saveRecord } from "../api/client";
import type { Campaign, CampaignReport, MarketingData, Promo, ReferralSettings } from "./marketing";

const base = (businessId: string) => businessPath(businessId, "marketing");

/** Campaigns carry a message; promos carry a code. */
const recordKind = (item: Campaign | Promo) => "message" in item ? "campaigns" : "promos";

export async function fetchMarketing(businessId: string): Promise<MarketingData> {
  return (await partnerGet<{ marketing: MarketingData }>(base(businessId))).marketing;
}

export async function saveMarketingRecord(businessId: string, item: Campaign | Promo, exists: boolean): Promise<Campaign | Promo> {
  const path = `${base(businessId)}/${recordKind(item)}`;
  return (await saveRecord<{ record: Campaign | Promo }>(path, exists ? item.id : null, { ...item })).record;
}

export async function deleteMarketingRecord(businessId: string, item: Campaign | Promo): Promise<void> {
  await partnerDelete(`${base(businessId)}/${recordKind(item)}/${item.id}`);
}

export async function saveMarketingReferral(businessId: string, settings: ReferralSettings): Promise<ReferralSettings> {
  return (await partnerPatch<{ referral: ReferralSettings }>(`${base(businessId)}/referral`, { ...settings })).referral;
}

export async function updateMarketingReview(businessId: string, id: string, values: { reply?: string; status?: string }): Promise<void> {
  await partnerPatch(`${base(businessId)}/reviews/${id}`, values);
}

export async function sendMarketingCampaign(businessId: string, campaignId: string): Promise<CampaignReport> {
  return (await partnerPost<{ report: CampaignReport }>(`${base(businessId)}/campaigns/${campaignId}/send`)).report;
}

export async function fetchCampaignReport(businessId: string, campaignId: string): Promise<CampaignReport> {
  return (await partnerGet<{ report: CampaignReport }>(`${base(businessId)}/campaigns/${campaignId}/report`)).report;
}
