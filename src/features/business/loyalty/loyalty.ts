
export type LoyaltyTab = "cards_cashback" | "gift_cards" | "subscriptions";
export type LoyaltyStatus = "active" | "inactive";
export interface LoyaltyRule { id: string; name: string; type: "discount" | "cashback"; percent: number; target: "all" | "new"; status: LoyaltyStatus; minAmount?: number; durationDays?: number; color?: "slate" | "silver" | "amber" | "purple" | "emerald" | "rose" }
export interface GiftCard { id: string; name: string; type: "general" | "service"; nominal: number; salePrice: number; serviceName: string; availableForSale: boolean; status: LoyaltyStatus; serviceIds?: string[]; durationDays?: number; usageLimit?: number; allowPartial?: boolean; color?: string }
export interface IssuedGiftCard { id: string; templateId: string; code: string; clientId: string; issuedAt: string; initialBalance: number; balance: number; history: { id: string; date: string; amount: number; note: string; balanceAfter: number }[] }
export interface Subscription { id: string; name: string; visitsCount: number; price: number; validityDays: number; serviceNames: string; availableForSale: boolean; availableOnline: boolean; soldCount: number; status: LoyaltyStatus; serviceIds?: string[]; onlyAssignedServices?: boolean; rollover?: boolean; color?: string }
export interface LoyaltyProgram { enabled: boolean; cashbackPercent: number; pointValueAzn: number; maxPayPercent: number; expiryDays: number; welcomeBonus: number; birthdayBonus: number; reviewBonus: number }
export const defaultLoyaltyProgram: LoyaltyProgram = { enabled: true, cashbackPercent: 5, pointValueAzn: 1, maxPayPercent: 50, expiryDays: 180, welcomeBonus: 10, birthdayBonus: 15, reviewBonus: 0 };
export interface LoyaltyData { rules: LoyaltyRule[]; giftCards: GiftCard[]; subscriptions: Subscription[]; issuedGiftCards?: IssuedGiftCard[]; issuedSubscriptions?: IssuedGiftCard[]; program?: LoyaltyProgram }
