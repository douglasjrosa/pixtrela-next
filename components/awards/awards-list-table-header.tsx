import { getTranslations } from "next-intl/server";

import { cn } from "@/lib/utils";
import { TABLE_HEAD_CELL_CENTER_CLASS } from "@/lib/ui/table-head-styles";
import type { AwardListSort } from "@/lib/schemas/award-list-sort";
import type { AwardListFilters } from "@/lib/schemas/award-list-filters";

import { ListRowCheckbox } from "@/components/ui/list-row-checkbox";
import { AwardListSortHeaderLink } from "./award-list-sort-header-link";

export interface AwardsListTableHeaderProps {
  sort: AwardListSort;
  filters: AwardListFilters;
  showCheckboxColumn?: boolean;
}

export async function AwardsListTableHeader({
  sort,
  filters,
  showCheckboxColumn = false,
}: AwardsListTableHeaderProps) {
  const tAwards = await getTranslations("awards");
  const tCommon = await getTranslations("common");

  return (
    <thead>
      <tr className="border-b text-left">
        {showCheckboxColumn ? (
          <th className={cn("w-10 py-2", "text-center")}>
            <ListRowCheckbox
              documentId=""
              variant="table-header"
              selectAll
              ariaLabel={tCommon("selectAll")}
            />
          </th>
        ) : null}
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
          label={tAwards("values")}
          sort={sort}
          filters={filters}
          align="center"
        />
        <th className={cn("w-24 text-center", TABLE_HEAD_CELL_CENTER_CLASS)}>
          {tAwards("listStock")}
        </th>
        <th className={cn("w-28 text-center", TABLE_HEAD_CELL_CENTER_CLASS)}>
          {tAwards("listShowInStore")}
        </th>
        <th className={cn("w-28 text-center", TABLE_HEAD_CELL_CENTER_CLASS)}>
          {tAwards("listActualPrice")}
        </th>
        <th className={cn("w-28 text-center", TABLE_HEAD_CELL_CENTER_CLASS)}>
          {tAwards("listAutoRecalculate")}
        </th>
      </tr>
    </thead>
  );
}
