import { getTranslations } from "next-intl/server";

import type { FactoryActionListSort } from "@/lib/schemas/factory-action-list-sort";
import type { FactoryActionListFilters } from "@/lib/schemas/factory-action-list-filters";

import { FactoryActionListSortHeaderLink } from "./factory-action-list-sort-header-link";

export interface FactoryActionListTableHeaderProps {
  sort: FactoryActionListSort;
  filters: FactoryActionListFilters;
}

export async function FactoryActionListTableHeader({
  sort,
  filters,
}: FactoryActionListTableHeaderProps) {
  const tActions = await getTranslations("factoryActions");

  return (
    <thead>
      <tr className="border-b text-left">
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
