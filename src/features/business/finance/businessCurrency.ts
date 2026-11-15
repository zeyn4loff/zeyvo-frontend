import { createContext, useContext } from "react";

export const BusinessCurrencyContext = createContext("AZN");

export function currencySymbol(code: string): string {
  if (code === "AZN") return "₼";
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency: code, currencyDisplay: "narrowSymbol" }).formatToParts(0).find((part) => part.type === "currency")?.value ?? code;
  } catch {
    return code;
  }
}

export function formatMoney(value: number, code = "AZN"): string {
  const number = value.toLocaleString("az-AZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${number} ${currencySymbol(code)}`;
}

export function useBusinessCurrency(): string {
  return useContext(BusinessCurrencyContext);
}

export function useFormatMoney(): (value: number) => string {
  const code = useBusinessCurrency();
  return (value) => formatMoney(value, code);
}

export function useCurrencySymbol(): string {
  return currencySymbol(useBusinessCurrency());
}
