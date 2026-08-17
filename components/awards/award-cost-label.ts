import type { AwardRow, CurrencyOption } from "./types";
import { formatAwardValueRow } from "./types";

export function awardCostLabel(
  award: AwardRow,
  currencies: CurrencyOption[],
  emptyLabel: string,
): string {
  if (award.values.length === 0) return emptyLabel;
  return award.values
    .map((entry) => formatAwardValueRow(entry, currencies))
    .join(", ");
}
