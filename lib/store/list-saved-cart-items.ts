import type { MergedStoreCard } from "@/lib/store/merge-catalog-with-cart";

export type SavedCartListLine = {
  currencyId: string;
  qty: number;
  label: string;
  unitCost: number;
  iconUrl: string | null;
};

export type SavedCartListItem = {
  awardId: string;
  title: string;
  imageUrl: string | null;
  lines: SavedCartListLine[];
};

export function listSavedCartItems(
  cards: ReadonlyArray<MergedStoreCard>,
): SavedCartListItem[] {
  return cards
    .map((card) => {
      const lines = card.prices
        .filter((price) => price.qty > 0)
        .map((price) => ({
          currencyId: price.currencyId,
          qty: price.qty,
          label: price.label,
          unitCost: price.unitCost,
          iconUrl: price.iconUrl,
        }));
      if (lines.length === 0) return null;
      return {
        awardId: card.awardId,
        title: card.title,
        imageUrl: card.imageUrl,
        lines,
      };
    })
    .filter((item): item is SavedCartListItem => item !== null);
}
