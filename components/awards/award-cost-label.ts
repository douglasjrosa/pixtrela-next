import type { AwardRow, CurrencyOption } from "./types";
import { formatAwardValueRow } from "./types";

export function formatAwardActualPrice(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function awardCostLabel(
  award: AwardRow,
  currencies: CurrencyOption[],
  emptyLabel: string,
): string {
  const activeValues = award.values.filter((entry) => entry.numberOf > 0);
  if (activeValues.length === 0) return emptyLabel;
  return activeValues
    .map((entry) => formatAwardValueRow(entry, currencies))
    .join(", ");
}
