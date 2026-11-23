import { useBusinessCurrency } from "../finance/businessCurrency";
import { useEffect, useMemo, useRef, useState } from "react";
import type { BusinessSession } from "../auth/businessSession";
import { phoneDigits, type Client } from "../clients/clients";
import { fetchFinance } from "../finance/financeApi";
import { fetchClients, saveClientRecord } from "../clients/clientsApi";
import { useProducts } from "../products/useProducts";
import { saleTotals, type CartItem, type PaymentMethod, type PosSale } from "./pos";
import { useActiveBusinessContext } from "../directory/activeContext";
import { fetchMarketing } from "../marketing/marketingApi";
import type { Promo } from "../marketing/marketing";
import { promoIssue } from "../marketing/promoRules";
import { localDate } from "../finance/finance";
import { fetchPosSales, postPosSale } from "./posApi";
import { readBusinesses } from "../directory/businesses";
import { useCustomerText } from "@/features/locale/customerText";

export default function usePosCheckout(session: BusinessSession, onClose: () => void) {
  const currencyCode = useBusinessCurrency();
  const translateUi = useCustomerText();
  const activeContext = useActiveBusinessContext(session);
  const branchId = activeContext?.type === "individual" ? readBusinesses(session).find((item) => item.id === activeContext.businessId)?.primaryBranchId ?? activeContext.branchId : activeContext?.branchId;
  const { data: products, refresh: refreshProducts } = useProducts(session);
  const [clients, setClients] = useState<Client[]>([]);
  const [addingClient, setAddingClient] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [finance, setFinance] = useState<Awaited<ReturnType<typeof fetchFinance>>>(() => ({ accounts: [], categories: [], transactions: [], shifts: [], payroll: [] }));
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mobilePane, setMobilePane] = useState<"products" | "cart">("products");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [clientId, setClientId] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [accountId, setAccountId] = useState(finance.accounts.find((item) => item.type === "cash")?.id ?? "");
  const [error, setError] = useState("");
  const [checkoutDataReady, setCheckoutDataReady] = useState(false);
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [serverPromos, setServerPromos] = useState<Promo[]>([]);
  useEffect(() => {
    if (!activeContext?.businessId) return;
    let active = true;
    fetchMarketing(activeContext.businessId).then((marketing) => { if (active) setServerPromos(marketing.promos); }).catch(() => {});
    return () => { active = false; };
  }, [activeContext?.businessId]);
  useEffect(() => {
    if (!activeContext?.businessId) return;
    let active = true;
    const pending = window.setTimeout(() => { if (active) setCheckoutDataReady(false); }, 0);
    const businessId = activeContext.businessId;
    Promise.all([fetchFinance(businessId), fetchClients(businessId)]).then(([nextFinance, nextClients]) => {
      if (!active) return;
      setFinance(nextFinance);
      setClients(nextClients);
      setAccountId(nextFinance.accounts.find((item) => item.type === "cash")?.id ?? "");
      setCheckoutDataReady(true);
    }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Kassa məlumatları yüklənmədi."); });
    return () => { active = false; window.clearTimeout(pending); };
  }, [activeContext?.businessId]);
  const [receipt, setReceipt] = useState<PosSale | null>(null);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [recentSale, setRecentSale] = useState<PosSale | undefined>();
  useEffect(() => {
    if (!activeContext?.businessId) return;
    let active = true;
    fetchPosSales(activeContext.businessId).then((sales) => { if (active) setRecentSale(sales.find((sale) => sale.branchId === branchId)); }).catch(() => {});
    return () => { active = false; };
  }, [activeContext?.businessId, branchId]);
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", onKeyDown); };
  }, [onClose]);
  const client = clients.find((item) => item.id === clientId);
  const sellable = useMemo(() => products.products.filter((item) => item.kind === "retail" && item.price > 0 && products.warehouses.some((warehouse) => warehouse.id === item.warehouseId && warehouse.branchId === branchId)), [products, branchId]);
  const visible = sellable.filter((item) => (category === "all" || item.categoryId === category) && `${item.name} ${item.sku}`.toLocaleLowerCase().includes(query.toLocaleLowerCase().trim()));
  const subtotal = cart.reduce((sum, item) => sum + (sellable.find((product) => product.id === item.productId)?.price ?? 0) * item.quantity, 0);
  const selectedPromo = serverPromos.find((item) => item.code.toLocaleUpperCase("az-AZ") === promoCode.trim().toLocaleUpperCase("az-AZ"));
  const promoError = promoCode.trim() ? promoIssue(selectedPromo, subtotal, localDate(), currencyCode, translateUi) : null;
  const totals = saleTotals(subtotal, !promoError && selectedPromo ? selectedPromo.discountType : discountType, !promoError && selectedPromo ? selectedPromo.discountValue : Number(discountValue) || 0);
  const balanceMethod = method === "deposit" || method === "bonus";
  const accounts = finance.accounts.filter((item) => method === "cash" ? item.type === "cash" || item.type === "safe" : item.type === "pos" || item.type === "bank");
  function changeQuantity(productId: string, difference: number) {
    const product = sellable.find((item) => item.id === productId);
    if (!product) return;
    setCart((previous) => {
      const current = previous.find((item) => item.productId === productId)?.quantity ?? 0;
      const next = Math.max(0, Math.min(product.quantity, current + difference));
      return next === 0 ? previous.filter((item) => item.productId !== productId) : current === 0 ? [...previous, { productId, quantity: next }] : previous.map((item) => item.productId === productId ? { ...item, quantity: next } : item);
    });
    setError("");
  }
  function changeMethod(next: PaymentMethod) { if (next === "deposit" || next === "bonus") return; setMethod(next); setAccountId(finance.accounts.find((item) => next === "cash" ? item.type === "cash" : item.type === "pos" || item.type === "bank")?.id ?? ""); setError(""); }
  async function addClient() {
    const digits = phoneDigits(clientPhone);
    if (!clientName.trim() || digits.length !== 9) { setError("Müştəri adı və 9 rəqəmli mobil nömrə daxil edin."); return; }
    if (clients.some((item) => phoneDigits(item.phone) === digits)) { setError("Bu mobil nömrə artıq müştərilər siyahısındadır."); return; }
    const client: Client = { id: crypto.randomUUID(), name: clientName.trim(), phone: `+994 ${digits.slice(0, 2)} ${digits.slice(2, 5)}-${digits.slice(5, 7)}-${digits.slice(7)}`, email: "", gender: "other", category: "new", birthDate: "", preferredStaffId: "", discountPercent: 0, note: "", visits: [], ledger: [], notes: [], files: [], createdAt: new Date().toISOString() };
    try {
      if (!activeContext?.businessId) throw new Error("Biznes seçin.");
      const saved = await saveClientRecord(activeContext.businessId, client, false);
      if (!saved) throw new Error("Müştəri saxlanmadı.");
      setClients([saved, ...clients]); setClientId(saved.id); setClientName(""); setClientPhone(""); setAddingClient(false); setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Müştəri saxlanmadı."); }
  }
  async function submit() {
    if (submitting.current || !checkoutDataReady) return;
    submitting.current = true;
    setBusy(true);
    try {
      if (!activeContext?.businessId || !branchId) throw new Error("Satış üçün filial seçin.");
      if (method === "deposit" || method === "bonus") throw new Error("Bu ödəniş üsulu server satışına hələ qoşulmayıb.");
      const warehouse = products.warehouses.find((item) => item.branchId === branchId && cart.every((entry) => products.products.find((product) => product.id === entry.productId)?.warehouseId === item.id));
      if (!warehouse) throw new Error("Səbətdəki məhsullar eyni filial anbarından olmalıdır.");
      const sale = await postPosSale(activeContext.businessId, branchId, warehouse.id, { cart, clientId, sellerName: session.ownerName, method, accountId, discountType, discountValue: promoCode.trim() ? 0 : Number(discountValue) || 0, promoCode }, client?.name ?? "Anonim alıcı", client?.phone ?? "", method === "cash" ? "Nağd" : "POS-Terminal");
      await refreshProducts();
      setReceipt(sale); setRecentSale(sale); setCart([]); setError("");
      window.dispatchEvent(new Event("zeyvo-pos-sale"));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Satış saxlanmadı."); submitting.current = false; }
    finally { setBusy(false); }
  }
  function newSale() { submitting.current = false; setReceipt(null); setMobilePane("products"); }
  return { activeContext, branchId, products, clients, addingClient, setAddingClient, clientName, setClientName, clientPhone, setClientPhone, cart, mobilePane, setMobilePane, query, setQuery, category, setCategory, clientId, setClientId, method, accountId, setAccountId, discountType, setDiscountType, discountValue, setDiscountValue, promoCode, setPromoCode, promoError, error, receipt, busy, checkoutDataReady, recentSale, sellable, visible, subtotal, totals, balanceMethod, accounts, client, changeQuantity, changeMethod, addClient, submit, newSale };
}
