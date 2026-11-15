export type MarketingTab = "campaigns" | "promocodes" | "segments" | "referral" | "reviews";
export type Status = "active" | "inactive" | "draft" | "expired";
export interface Campaign { id: string; name: string; channel: "whatsapp" | "sms" | "email"; type: "automated" | "broadcast"; target: "all" | "vip" | "new" | "risk" | "birthdays"; message: string; schedule?: "auto" | "immediate" | "draft"; status: Status; sentCount?: number; deliveredCount?: number; readCount?: number; failedCount?: number; recipientCount?: number; convertedCount?: number; createdAt?: string }
export interface CampaignReport { campaignId: string; total: number; pending: number; sent: number; delivered: number; read: number; failed: number; recipients: { id: string; name: string; phone: string; status: string; error: string | null; sentAt: string | null; deliveredAt: string | null; readAt: string | null }[] }
export const campaignScheduleLabels = { auto: "Avtomatik qrafik", immediate: "Təsdiqdən sonra", draft: "Qaralama" } as const;
export interface Promo { id: string; name: string; code: string; discountType: "percent" | "fixed"; discountValue: number; minOrder: number; usageLimit: number; usedCount: number; startDate: string; endDate: string; status: Status; serviceScope?: "all" | "specific" }
export interface Referrer { id: string; clientName: string; phone: string; code: string; invitedCount: number; successfulCount: number; earnedBonus: number; lastInviteDate: string }
export interface ReferralSettings { enabled: boolean; referrerReward: number; refereeDiscount: number; minOrder: number; referrers?: Referrer[] }
export interface Review { id: string; clientName: string; phone?: string; serviceName: string; masterName?: string; rating: number; comment: string; reply: string; date: string; status: "published" | "hidden" }
export interface Segment { id: string; name: string; description: string; clientCount: number; avgCheck: number; totalRevenue: number; color: string; criteria: string; target: Campaign["target"] }
export interface MarketingData { campaigns: Campaign[]; promos: Promo[]; segments?: Segment[]; referral: ReferralSettings; reviews: Review[] }
export function marketingStatusLabel(item: Campaign | Promo) { return item.status === "expired" ? "Müddəti bitib" : item.status === "draft" ? "Qaralama" : item.status === "inactive" ? "Qeyri-aktiv" : "Aktiv"; }
