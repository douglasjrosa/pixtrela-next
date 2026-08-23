import type { AwardRow } from "@/components/awards/types";
import type { AwardListItem } from "@/lib/repos/awards";

export function mapAwardListItemToRow(item: AwardListItem): AwardRow {
  return {
    documentId: item.id,
    name: item.name,
    title: item.title,
    description: item.description,
    warnings: item.warnings,
    active: item.active,
    showInStore: item.showInStore,
    stock: item.stock,
    actualPrice: item.actualPrice,
    autoRecalculate: item.autoRecalculate,
    imageId: item.imageMediaId,
    imageUrl: item.imageUrl,
    values: item.prices.map((price) => ({
      numberOf: price.numberOf,
      currencyDocumentId: price.currencyId,
    })),
  };
}
