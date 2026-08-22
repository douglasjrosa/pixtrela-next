type CurrencyDocumentRef = {
  documentId: string;
  active?: boolean;
};

type CurrencyIdRef = {
  id: string;
  active?: boolean;
};

function isActiveCurrency(item: { active?: boolean }): boolean {
  return item.active !== false;
}

export function primaryCurrencyDocumentId(
  currencies: readonly CurrencyDocumentRef[],
): string | null {
  return currencies.find(isActiveCurrency)?.documentId ?? null;
}

export function isPrimaryCurrencyDocument(
  documentId: string,
  currencies: readonly CurrencyDocumentRef[],
): boolean {
  const primaryId = primaryCurrencyDocumentId(currencies);
  return primaryId !== null && primaryId === documentId;
}

export function primaryCurrencyId(
  currencies: readonly CurrencyIdRef[],
): string | null {
  return currencies.find(isActiveCurrency)?.id ?? null;
}

export function isPrimaryCurrencyId(
  currencyId: string,
  currencies: readonly CurrencyIdRef[],
): boolean {
  const primaryId = primaryCurrencyId(currencies);
  return primaryId !== null && primaryId === currencyId;
}
