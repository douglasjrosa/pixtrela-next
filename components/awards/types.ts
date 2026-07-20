import type { AwardFormInput } from "@/lib/schemas/award";

export interface CurrencyOption {
  documentId: string;
  name: string;
  title?: string | null;
}

export interface AwardRow {
  documentId: string;
  name: string;
  title?: string | null;
  description?: string | null;
  warnings?: string | null;
  imageId?: number | null;
  imageUrl?: string | null;
  values: AwardFormInput["values"];
}

export function currencyLabel(currency: CurrencyOption): string {
  return currency.title ?? currency.name;
}

export function formatAwardValueRow(
  entry: AwardFormInput["values"][number],
  currencies: CurrencyOption[],
): string {
  const currency = currencies.find(
    (option) => option.documentId === entry.currencyDocumentId,
  );
  const label = currency ? currencyLabel(currency) : "—";
  return `${entry.numberOf} ${label}`;
}
