import { getTranslations } from "next-intl/server";

import type { AwardListSort } from "@/lib/schemas/award-list-sort";
import type { AwardListFilters } from "@/lib/schemas/award-list-filters";

import { AwardListSortHeaderLink } from "./award-list-sort-header-link";

export interface AwardsListTableHeaderProps {
  sort: AwardListSort;
  filters: AwardListFilters;
}

export async function AwardsListTableHeader({
  sort,
  filters,
}: AwardsListTableHeaderProps) {
  const tAwards = await getTranslations("awards");

  return (
    <thead>
      <tr className="border-b text-left">
        <th className="w-12 py-2 pr-3" aria-hidden />
        <AwardListSortHeaderLink
          column="title"
          label={tAwards("titleField")}
          sort={sort}
          filters={filters}
          align="left"
        />
        <AwardListSortHeaderLink
          column="starCost"
          label={tAwards("starCost")}
          sort={sort}
          filters={filters}
          align="center"
        />
      </tr>
    </thead>
  );
}
