import { getTranslations } from "next-intl/server";

import { AwardListRowPresentational } from "./award-list-row-presentational";
import { awardCostLabel } from "./award-cost-label";
import type { AwardRow, CurrencyOption } from "./types";
import { awardDisplayTitle } from "./types";

export interface AwardListRowProps {
  award: AwardRow;
  currencies: CurrencyOption[];
  variant: "table" | "mobile";
  showCheckboxColumn?: boolean;
}

export async function AwardListRowView({
  award,
  currencies,
  variant,
  showCheckboxColumn = false,
}: AwardListRowProps) {
  const tAwards = await getTranslations("awards");
  const tCommon = await getTranslations("common");
  const cost = awardCostLabel(award, currencies, tAwards("noCost"));

  return (
    <AwardListRowPresentational
      award={award}
      variant={variant}
      labels={{
        cost,
        stock: String(award.stock),
        showInStore: award.showInStore
          ? tCommon("yes")
          : tCommon("no"),
        inactive: tAwards("inactive"),
        selectRow: tCommon("selectRow", { name: awardDisplayTitle(award) }),
      }}
      showCheckboxColumn={showCheckboxColumn}
    />
  );
}
