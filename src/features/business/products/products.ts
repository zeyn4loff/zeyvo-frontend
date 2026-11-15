import { currencySymbol } from "../finance/businessCurrency";

export type ProductKind = "retail" | "internal";
export interface ProductCategory { id: string; name: string; description?: string; icon?: string }
export interface Warehouse { id: string; name: string; branchId: string; responsible: string; address?: string; notes?: string; typeName?: string; isDefault?: boolean }
export interface Product { id: string; name: string; sku: string; kind: ProductKind; categoryId: string; warehouseId: string; unit: string; cost: number; price: number; quantity: number; minimum: number; description?: string }
export interface StockOperation { id: string; documentId?: string; documentNumber?: string; productId: string; productName: string; warehouseName: string; type: "receipt" | "writeoff" | "adjustment" | "transfer"; difference: number; unitCost?: number; date: string; note: string; supplierId?: string; supplierName?: string; destinationWarehouseName?: string }
export interface Inventory { id: string; documentId?: string; documentNumber?: string; productName: string; expected: number; actual: number; unitCost?: number; date: string; warehouseName?: string; responsible?: string; note?: string }
export interface Supplier { id: string; name: string; phone: string; email: string; note: string; contact?: string; voen?: string; address?: string }
export interface TechCard { id: string; name: string; productId: string; quantity: number; note: string; serviceId?: string; items?: { productId: string; quantity: number }[] }
export interface ProductData { categories: ProductCategory[]; warehouses: Warehouse[]; products: Product[]; operations: StockOperation[]; inventories: Inventory[]; suppliers: Supplier[]; techCards: TechCard[] }

export function applyStockChange(data: ProductData, productId: string, difference: number, type: StockOperation["type"], note: string): ProductData | null {
  const product = data.products.find((item) => item.id === productId);
  if (!product || !Number.isFinite(difference) || !Number.isInteger(difference) || product.quantity + difference < 0) return null;
  const warehouseName = data.warehouses.find((item) => item.id === product.warehouseId)?.name ?? "Anbarsız";
  return { ...data, products: data.products.map((item) => item.id === productId ? { ...item, quantity: item.quantity + difference } : item), operations: [{ id: crypto.randomUUID(), productId, productName: product.name, warehouseName, type, difference, unitCost: product.cost, note, date: new Date().toISOString() }, ...data.operations] };
}
export const money = (value: number, currencyCode = "AZN") => `${value.toLocaleString("az-AZ", { maximumFractionDigits: 2 })} ${currencySymbol(currencyCode)}`;
