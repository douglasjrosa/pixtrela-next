import { getTranslations } from "next-intl/server";

import { ListRowCheckbox } from "@/components/ui/list-row-checkbox";
import type { WorkdayListFilters } from "@/lib/schemas/workday-list-filters";
import type { WorkdayListSort } from "@/lib/schemas/workday-list-sort";
import { cn } from "@/lib/utils";

import { WorkdayListSortHeaderLink } from "./workday-list-sort-header-link";

export interface WorkdaysListTableHeaderProps {
  sort: WorkdayListSort;
  filters: WorkdayListFilters;
  showCheckboxColumn?: boolean;
}

export async function WorkdaysListTableHeader({
  sort,
  filters,
  showCheckboxColumn = false,
}: WorkdaysListTableHeaderProps) {
  const [t, tCommon] = await Promise.all([
    getTranslations("workdays"),
    getTranslations("common"),
  ]);

  return (
    <thead>
      <tr className="border-b text-left">
        {showCheckboxColumn ? (
          <th className={cn("w-10 px-2 py-2 align-middle", "text-center")}>
            <ListRowCheckbox
              documentId=""
              variant="table-header"
              selectAll
              ariaLabel={tCommon("selectAll")}
            />
          </th>
        ) : null}
        <WorkdayListSortHeaderLink
          column="action"
          label={t("action")}
          sort={sort}
          filters={filters}
          align="center"
        />
        <WorkdayListSortHeaderLink
          column="scope"
          label={t("scope")}
          sort={sort}
          filters={filters}
          align="center"
        />
        <WorkdayListSortHeaderLink
          column="validity"
          label={t("validity")}
          sort={sort}
          filters={filters}
          align="center"
        />
        <WorkdayListSortHeaderLink
          column="slots"
          label={t("slots")}
          sort={sort}
          filters={filters}
          align="center"
        />
      </tr>
    </thead>
  );
}
