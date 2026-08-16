import { getTranslations } from "next-intl/server";

import { cn } from "@/lib/utils";
import type { TeamListSort } from "@/lib/schemas/team-list-sort";
import type { TeamListFilters } from "@/lib/schemas/team-list-filters";

import { TeamListRowCheckbox } from "./team-list-row-checkbox";
import { TeamListSortHeaderLink } from "./team-list-sort-header-link";

export interface TeamsListTableHeaderProps {
  sort: TeamListSort;
  filters: TeamListFilters;
  showCheckboxColumn?: boolean;
}

export async function TeamsListTableHeader({
  sort,
  filters,
  showCheckboxColumn = false,
}: TeamsListTableHeaderProps) {
  const tTeams = await getTranslations("teams");
  const tCommon = await getTranslations("common");

  return (
    <thead>
      <tr className="border-b text-left">
        {showCheckboxColumn ? (
          <th className={cn("w-10 py-2", "text-center")}>
            <TeamListRowCheckbox
              documentId=""
              variant="table-header"
              selectAll
              ariaLabel={tCommon("selectAll")}
            />
          </th>
        ) : null}
        <TeamListSortHeaderLink
          column="name"
          label={tTeams("name")}
          sort={sort}
          filters={filters}
          align="left"
        />
        <TeamListSortHeaderLink
          column="since"
          label={tTeams("since")}
          sort={sort}
          filters={filters}
          align="center"
        />
        <TeamListSortHeaderLink
          column="untill"
          label={tTeams("untill")}
          sort={sort}
          filters={filters}
          align="center"
        />
        <TeamListSortHeaderLink
          column="status"
          label={tTeams("status")}
          sort={sort}
          filters={filters}
          align="center"
        />
        <TeamListSortHeaderLink
          column="exchangesFirstDay"
          label={tTeams("exchangesFirstDay")}
          sort={sort}
          filters={filters}
          align="center"
        />
        <TeamListSortHeaderLink
          column="exchangesLastDay"
          label={tTeams("exchangesLastDay")}
          sort={sort}
          filters={filters}
          align="center"
        />
        <TeamListSortHeaderLink
          column="leader"
          label={tTeams("leader")}
          sort={sort}
          filters={filters}
          align="center"
        />
      </tr>
    </thead>
  );
}
