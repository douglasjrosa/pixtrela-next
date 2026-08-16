import { AwardListRowView } from "./award-list-row";
import type { AwardRow, CurrencyOption } from "./types";

export interface AwardsListTableBodyProps {
  awards: AwardRow[];
  currencies: CurrencyOption[];
  showCheckboxColumn?: boolean;
}

export async function AwardsListTableBody({
  awards,
  currencies,
  showCheckboxColumn = false,
}: AwardsListTableBodyProps) {
  return (
    <tbody>
      {awards.map((award) => (
        <AwardListRowView
          key={award.documentId}
          award={award}
          currencies={currencies}
          variant="table"
          showCheckboxColumn={showCheckboxColumn}
        />
      ))}
    </tbody>
  );
}
