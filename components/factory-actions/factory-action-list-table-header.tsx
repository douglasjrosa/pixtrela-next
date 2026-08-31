import { getTranslations } from "next-intl/server";

import { cn } from "@/lib/utils";
import type { FactoryActionListSort } from "@/lib/schemas/factory-action-list-sort";
import type { FactoryActionListFilters } from "@/lib/schemas/factory-action-list-filters";

import { ListRowCheckbox } from "@/components/ui/list-row-checkbox";
import { FactoryActionListSortHeaderLink } from "./factory-action-list-sort-header-link";

export interface FactoryActionListTableHeaderProps {
  sort: FactoryActionListSort;
  filters: FactoryActionListFilters;
  showCheckboxColumn?: boolean;
}

export async function FactoryActionListTableHeader({
  sort,
  filters,
  showCheckboxColumn = false,
}: FactoryActionListTableHeaderProps) {
  const tActions = await getTranslations("factoryActions");
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
        <FactoryActionListSortHeaderLink
          column="name"
          label={tActions("name")}
          sort={sort}
          filters={filters}
          align="left"
        />
        <FactoryActionListSortHeaderLink
          column="unitTime"
          label={tActions("unitTime")}
          sort={sort}
          filters={filters}
          align="center"
        />
        <FactoryActionListSortHeaderLink
          column="qtyQuestion"
          label={tActions("qtyQuestion")}
          sort={sort}
          filters={filters}
          align="center"
        />
      </tr>
    </thead>
  );
}
