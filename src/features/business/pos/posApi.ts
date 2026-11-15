import { businessPath, partnerGet, partnerPost } from "../api/client";
import type { PosSale, SaleInput } from "./pos";

const salesPath = (businessId: string) => businessPath(businessId, "pos-sales");

export async function fetchPosSales(businessId: string): Promise<PosSale[]> {
  return (await partnerGet<{ sales: PosSale[] }>(salesPath(businessId))).sales;
}

export async function postPosSale(businessId: string, branchId: string, warehouseId: string, input: SaleInput, clientName: string, clientPhone: string, accountName: string): Promise<PosSale> {
  return (await partnerPost<{ sale: PosSale }>(salesPath(businessId), {
    branchId,
    warehouseId,
    cart: input.cart.map((item) => ({ productId: item.productId.split("@")[0], quantity: item.quantity })),
    paymentMethod: input.method,
    accountId: input.accountId,
    clientId: input.clientId || null,
    accountName,
    clientName,
    clientPhone,
    sellerName: input.sellerName,
    discountType: input.discountType,
    discountValue: input.discountValue,
    promoCode: input.promoCode,
  })).sale;
}
