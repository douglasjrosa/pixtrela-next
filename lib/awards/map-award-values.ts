export interface AwardValueComponent {
  numberOf?: number;
  currency?: { documentId?: string; name?: string; title?: string | null } | null;
}

export interface MappedAwardValue {
  numberOf: number;
  currencyDocumentId: string;
}

/** Maps Strapi Award `Value` rows to form values. */
export function mapAwardValues(
  values: AwardValueComponent[] | null | undefined,
): MappedAwardValue[] {
  if (!Array.isArray(values)) return [];
  return values
    .filter((entry) => entry.currency?.documentId)
    .map((entry) => ({
      numberOf: entry.numberOf ?? 0,
      currencyDocumentId: entry.currency!.documentId!,
    }));
}
