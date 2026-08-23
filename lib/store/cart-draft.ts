import { cartLineCost, cartTotal } from "@/lib/domain/cart";

export type CartDraftItem = {
  id: string;
  title: string;
  qty: number;
  stock: number;
  imageSrc: string | null;
  unitCost: number;
};

export type CartDraftLine = CartDraftItem & {
  lineCost: number;
};

export function mapCartDraftLines(
  items: ReadonlyArray<CartDraftItem>,
): CartDraftLine[] {
  return items.map((item) => ({
    ...item,
    lineCost: cartLineCost(item.unitCost, item.qty),
  }));
}

export function computeCartDraftTotal(
  items: ReadonlyArray<Pick<CartDraftItem, "unitCost" | "qty">>,
): number {
  return cartTotal(
    items.map((item) => ({ unitCost: item.unitCost, qty: item.qty })),
  );
}

export function isCartDraftDirty(
  baseline: ReadonlyArray<Pick<CartDraftItem, "id" | "qty">>,
  draft: ReadonlyArray<Pick<CartDraftItem, "id" | "qty">>,
): boolean {
  if (baseline.length !== draft.length) return true;

  const draftById = new Map(draft.map((item) => [item.id, item.qty]));
  return baseline.some((item) => draftById.get(item.id) !== item.qty);
}

export function serializeCartDraftPayload(
  draft: ReadonlyArray<Pick<CartDraftItem, "id" | "qty">>,
): string {
  return JSON.stringify({
    items: draft.map((item) => ({
      itemId: item.id,
      qty: item.qty,
    })),
  });
}

export function clampDraftQty(qty: number, stock: number): number {
  if (stock <= 0) return 0;
  return Math.max(1, Math.min(Math.floor(qty), stock));
}
