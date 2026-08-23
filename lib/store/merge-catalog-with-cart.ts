export type CatalogAwardForCart = {
  id: string;
  title: string;
  stock: number;
  imageUrl?: string | null;
  cost: number;
};

export type CatalogCartLine = {
  awardId: string;
  title: string;
  qty: number;
  stock: number;
  imageUrl: string | null;
  unitCost: number;
};

export function mergeCatalogWithCart(
  awards: ReadonlyArray<CatalogAwardForCart>,
  cartRows: ReadonlyArray<{ awardId: string; qty: number }>,
): CatalogCartLine[] {
  const qtyByAward = new Map(cartRows.map((row) => [row.awardId, row.qty]));

  return [...awards]
    .sort((left, right) => left.title.localeCompare(right.title, "pt-BR"))
    .map((award) => ({
      awardId: award.id,
      title: award.title,
      qty: qtyByAward.get(award.id) ?? 0,
      stock: award.stock,
      imageUrl: award.imageUrl ?? null,
      unitCost: award.cost,
    }));
}
