import { getTranslations } from "next-intl/server";

import { AwardListRowPresentational } from "./award-list-row-presentational";
import { awardCostLabel } from "./award-cost-label";
import type { AwardRow, CurrencyOption } from "./types";

export interface AwardListRowProps {
  award: AwardRow;
  currencies: CurrencyOption[];
  variant: "table" | "mobile";
}

export async function AwardListRowView({
  award,
  currencies,
  variant,
}: AwardListRowProps) {
  const tAwards = await getTranslations("awards");
  const cost = awardCostLabel(award, currencies, tAwards("noCost"));

  return (
    <AwardListRowPresentational
      award={award}
      variant={variant}
      labels={{ cost }}
    />
  );
}
