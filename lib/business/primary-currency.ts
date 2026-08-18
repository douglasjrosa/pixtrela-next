export function primaryCurrencyDocumentId(
  currencies: readonly { documentId: string }[],
): string | null {
  return currencies[0]?.documentId ?? null;
}

export function isPrimaryCurrencyDocument(
  documentId: string,
  currencies: readonly { documentId: string }[],
): boolean {
  const primaryId = primaryCurrencyDocumentId(currencies);
  return primaryId !== null && primaryId === documentId;
}

export function primaryCurrencyId(
  currencies: readonly { id: string }[],
): string | null {
  return currencies[0]?.id ?? null;
}

export function isPrimaryCurrencyId(
  currencyId: string,
  currencies: readonly { id: string }[],
): boolean {
  const primaryId = primaryCurrencyId(currencies);
  return primaryId !== null && primaryId === currencyId;
}
