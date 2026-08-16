import { getTranslations } from "next-intl/server";

import type { TeamListSort } from "@/lib/schemas/team-list-sort";
import type { TeamListFilters } from "@/lib/schemas/team-list-filters";

import { TeamListSortHeaderLink } from "./team-list-sort-header-link";

export interface TeamsListTableHeaderProps {
  sort: TeamListSort;
  filters: TeamListFilters;
}

export async function TeamsListTableHeader({
  sort,
  filters,
}: TeamsListTableHeaderProps) {
  const tTeams = await getTranslations("teams");

  return (
    <thead>
      <tr className="border-b text-left">
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
