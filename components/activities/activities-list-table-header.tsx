import { getTranslations } from "next-intl/server";

import { ListRowCheckbox } from "@/components/ui/list-row-checkbox";
import { ListTableHeadCell } from "@/components/ui/list-table-head-cell";
import { cn } from "@/lib/utils";
import type { ActivityListFilters } from "@/lib/schemas/activity-list-filters";
import type { ActivityListSort } from "@/lib/schemas/activity-list-sort";

import { ActivityListSortHeaderLink } from "./activity-list-sort-header-link";

export interface ActivitiesListTableHeaderProps {
  sort: ActivityListSort;
  filters: ActivityListFilters;
  showCheckboxColumn?: boolean;
}

export async function ActivitiesListTableHeader({
  sort,
  filters,
  showCheckboxColumn = false,
}: ActivitiesListTableHeaderProps) {
  const t = await getTranslations("activities");
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
        <ActivityListSortHeaderLink
          column="action"
          label={t("actionColumn")}
          sort={sort}
          filters={filters}
          align="center"
        />
        <ActivityListSortHeaderLink
          column="colaborator"
          label={t("colaborator")}
          sort={sort}
          filters={filters}
        />
        <ActivityListSortHeaderLink
          column="timestamp"
          label={t("dateTime")}
          sort={sort}
          filters={filters}
          align="center"
        />
        <ActivityListSortHeaderLink
          column="qty"
          label={t("qty")}
          sort={sort}
          filters={filters}
          align="center"
        />
        <ListTableHeadCell align="center">{t("earned")}</ListTableHeadCell>
        <ActivityListSortHeaderLink
          column="subtask"
          label={t("subtask")}
          sort={sort}
          filters={filters}
          align="center"
        />
      </tr>
    </thead>
  );
}
