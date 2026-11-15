import { businessPath, partnerDelete, partnerGet, partnerPost, saveRecord } from "../api/client";
import type { Product, ProductCategory, ProductData, Supplier, TechCard, Warehouse } from "./products";
import type { StockInput } from "./stockDocuments";

type RecordKind = "categories" | "warehouses" | "products" | "suppliers" | "tech-cards";
type InventoryRecord = Product | ProductCategory | Warehouse | Supplier | TechCard;

const base = (businessId: string) => businessPath(businessId, "inventory");
/** Catalog rows arrive as `productId@warehouseId`; the API only wants the product. */
const masterId = (id: string) => id.split("@")[0];

export async function fetchInventory(businessId: string): Promise<ProductData> {
  const inventory = (await partnerGet<{ inventory: ProductData }>(base(businessId))).inventory;
  const firstVariant = new Map<string, string>();
  for (const product of inventory.products) {
    if (!firstVariant.has(masterId(product.id))) firstVariant.set(masterId(product.id), product.id);
  }
  return {
    ...inventory,
    techCards: inventory.techCards.map((card) => ({
      ...card,
      productId: firstVariant.get(card.productId) ?? card.productId,
      items: card.items?.map((item) => ({ ...item, productId: firstVariant.get(item.productId) ?? item.productId })),
    })),
  };
}

function recordBody(kind: RecordKind, record: InventoryRecord): Record<string, unknown> {
  if (kind !== "tech-cards") return { ...record };
  const card = record as TechCard;
  return {
    name: card.name,
    serviceId: card.serviceId,
    note: card.note,
    items: (card.items ?? [{ productId: card.productId, quantity: card.quantity }])
      .map((item) => ({ productId: masterId(item.productId), quantity: item.quantity })),
  };
}

export async function saveInventoryRecord(businessId: string, kind: RecordKind, record: InventoryRecord, existing = false): Promise<string> {
  const path = `${base(businessId)}/${kind}`;
  const saved = await saveRecord<{ id: string }>(path, existing ? masterId(record.id) : null, recordBody(kind, record));
  return saved.id;
}

export async function deleteInventoryRecord(businessId: string, kind: RecordKind, id: string): Promise<void> {
  await partnerDelete(`${base(businessId)}/${kind}/${masterId(id)}`);
}

export async function postInventoryDocument(businessId: string, input: StockInput): Promise<void> {
  await partnerPost(`${base(businessId)}/documents`, {
    ...input,
    lines: input.lines.map((line) => ({ ...line, productId: masterId(line.productId) })),
  });
}
