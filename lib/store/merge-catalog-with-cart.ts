export type CatalogAwardPriceRow = {
  awardId: string;
  title: string;
  stock: number;
  imageUrl: string | null;
  currencyId: string;
  unitCost: number;
  currencyActive: boolean;
  currencyShowInStore: boolean;
};

export type StoreCurrencyView = {
  currencyId: string;
  label: string;
  iconUrl: string | null;
  balance: number;
};

export type MergedAwardPrice = {
  currencyId: string;
  label: string;
  iconUrl: string | null;
  unitCost: number;
  qty: number;
};

export type MergedStoreCard = {
  awardId: string;
  title: string;
  stock: number;
  imageUrl: string | null;
  prices: MergedAwardPrice[];
};

export function mergeCatalogWithCart(
  rows: ReadonlyArray<CatalogAwardPriceRow>,
  storeCurrencies: ReadonlyArray<StoreCurrencyView>,
  cartRows: ReadonlyArray<{
    awardId: string;
    currencyId: string;
    qty: number;
  }>,
): MergedStoreCard[] {
  const storeById = new Map(
    storeCurrencies.map((currency) => [currency.currencyId, currency]),
  );
  const qtyByLine = new Map(
    cartRows.map((row) => [`${row.awardId}:${row.currencyId}`, row.qty]),
  );

  const cards = new Map<string, MergedStoreCard>();

  for (const row of rows) {
    if (!row.currencyActive || !row.currencyShowInStore) continue;
    if (row.unitCost <= 0) continue;
    const currency = storeById.get(row.currencyId);
    if (!currency) continue;

    const existing = cards.get(row.awardId) ?? {
      awardId: row.awardId,
      title: row.title,
      stock: row.stock,
      imageUrl: row.imageUrl,
      prices: [],
    };

    existing.prices.push({
      currencyId: row.currencyId,
      label: currency.label,
      iconUrl: currency.iconUrl,
      unitCost: row.unitCost,
      qty: qtyByLine.get(`${row.awardId}:${row.currencyId}`) ?? 0,
    });
    cards.set(row.awardId, existing);
  }

  return [...cards.values()]
    .filter((card) => card.prices.length > 0)
    .sort((left, right) => left.title.localeCompare(right.title, "pt-BR"));
}
