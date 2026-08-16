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
  const showUntillColumn = filters.showArchived;

  return (
    <thead>
      <tr className="border-b text-left">
        {showCheckboxColumn ? (
          <th className={cn("w-10 px-2 py-2 align-middle", "text-center")}>
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
        {showUntillColumn ? (
          <TeamListSortHeaderLink
            column="untill"
            label={tTeams("untill")}
            sort={sort}
            filters={filters}
            align="center"
          />
        ) : null}
        <TeamListSortHeaderLink
          column="exchangePeriod"
          label={tTeams("exchangePeriod")}
          sort={sort}
          filters={filters}
          align="center"
          className="min-w-44"
        />
        <TeamListSortHeaderLink
          column="leader"
          label={tTeams("leader")}
          sort={sort}
          filters={filters}
          align="center"
        />
        <TeamListSortHeaderLink
          column="members"
          label={tTeams("members")}
          sort={sort}
          filters={filters}
          align="center"
        />
      </tr>
    </thead>
  );
}
