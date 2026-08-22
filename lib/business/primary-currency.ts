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

export function assignedActiveCurrencyId(
  currencies: readonly CurrencyIdRef[],
  assignedId?: string | null,
): string | null {
  const assigned = currencies.find((currency) => currency.id === assignedId);
  if (assigned && isActiveCurrency(assigned)) {
    return assigned.id;
  }
  return primaryCurrencyId(currencies);
}

export function isProtectedCurrencyId(
  currencyId: string,
  currencies: readonly CurrencyIdRef[],
  assignedId?: string | null,
): boolean {
  if (assignedActiveCurrencyId(currencies, assignedId) === currencyId) {
    return true;
  }
  const active = currencies.filter(isActiveCurrency);
  return active.length === 1 && active[0]?.id === currencyId;
}

export function isProtectedCurrencyDocument(
  documentId: string,
  currencies: readonly CurrencyDocumentRef[],
  assignedId?: string | null,
): boolean {
  const asIds = currencies.map((currency) => ({
    id: currency.documentId,
    active: currency.active,
  }));
  return isProtectedCurrencyId(documentId, asIds, assignedId);
}
