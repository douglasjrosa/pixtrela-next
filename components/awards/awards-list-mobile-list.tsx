import { AwardListRowView } from "./award-list-row";
import type { AwardRow, CurrencyOption } from "./types";

export interface AwardsListMobileListProps {
  awards: AwardRow[];
  currencies: CurrencyOption[];
  showCheckboxColumn?: boolean;
}

export async function AwardsListMobileList({
  awards,
  currencies,
  showCheckboxColumn = false,
}: AwardsListMobileListProps) {
  return (
    <ul className="md:hidden">
      {awards.map((award) => (
        <AwardListRowView
          key={award.documentId}
          award={award}
          currencies={currencies}
          variant="mobile"
          showCheckboxColumn={showCheckboxColumn}
        />
      ))}
    </ul>
  );
}
