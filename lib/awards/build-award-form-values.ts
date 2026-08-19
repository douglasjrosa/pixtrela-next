import type { AwardFormInput } from "@/lib/schemas/award";

export interface AwardCurrencyOption {
  documentId: string;
}

const DEFAULT_AWARD_VALUE_NUMBER = 1;

/** Builds one value row per currency, preserving saved amounts when present. */
export function buildAwardValuesForCurrencies(
  currencies: readonly AwardCurrencyOption[],
  existing: readonly AwardFormInput["values"][number][] = [],
): AwardFormInput["values"] {
  if (currencies.length === 0) {
    return [];
  }

  const existingByCurrencyId = new Map(
    existing.map((entry) => [entry.currencyDocumentId, entry.numberOf]),
  );

  return currencies.map((currency) => ({
    currencyDocumentId: currency.documentId,
    numberOf: existingByCurrencyId.get(currency.documentId) ?? DEFAULT_AWARD_VALUE_NUMBER,
  }));
}
