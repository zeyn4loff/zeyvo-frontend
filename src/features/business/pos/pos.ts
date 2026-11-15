import { roundMoney } from "../finance/finance";

export type PaymentMethod = "cash" | "terminal" | "deposit" | "bonus";
export interface CartItem { productId: string; quantity: number }
export interface SaleLine { productId: string; name: string; sku: string; quantity: number; price: number; total: number }
export interface PosSale { id: string; number: string; createdAt: string; branchId?: string; branchName?: string; promoCode?: string; clientName: string; clientPhone: string; sellerName: string; paymentMethod: PaymentMethod; accountName: string; lines: SaleLine[]; subtotal: number; discount: number; total: number }
export interface SaleInput { cart: CartItem[]; clientId: string; sellerName: string; method: PaymentMethod; accountId: string; discountType: "percent" | "fixed"; discountValue: number; promoCode?: string }
export const paymentLabels: Record<PaymentMethod, string> = { cash: "Nağd", terminal: "Kart / POS", deposit: "Depozit", bonus: "Bonus" };
export function saleTotals(subtotal: number, discountType: SaleInput["discountType"], discountValue: number) {
  const discount = roundMoney(discountType === "percent" ? subtotal * discountValue / 100 : discountValue);
  return { discount, total: roundMoney(subtotal - discount) };
}
