import { currencySymbol } from "../finance/businessCurrency";
import type { Promo } from "./marketing";

export function promoIssue(promo: Promo | undefined, subtotal: number, date: string, currencyCode = "AZN", translate: (text: string) => string = (text) => text): string | null {
  if (!promo) return translate("Promokod tapılmadı.");
  if (promo.status !== "active") return translate("Promokod hazırda istifadə edilmir.");
  if (promo.startDate && date < promo.startDate) return translate("Promokodun müddəti başlamayıb.");
  if (promo.endDate && date > promo.endDate) return translate("Promokodun müddəti bitib.");
  if (promo.usageLimit > 0 && promo.usedCount >= promo.usageLimit) return translate("Promokodun istifadə limiti dolub.");
  if (subtotal < promo.minOrder) return `${translate("Promokod üçün minimum məbləğ")} ${promo.minOrder} ${currencySymbol(currencyCode)}.`;
  return null;
}
