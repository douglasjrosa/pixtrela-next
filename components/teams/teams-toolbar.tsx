"use client";

import { useTranslations } from "next-intl";

import { ListArchivedToggle } from "@/components/ui/list-archived-toggle";
import { ListFiltersBar } from "@/components/ui/list-filters-bar";
import { ListNameSearch } from "@/components/ui/list-name-search";
import { TEAM_LIST_SEARCH_MIN_CHARS } from "@/lib/schemas/team-list-filters";
import {
  parseTeamListSearchParams,
  serializeTeamListSearchParams,
} from "@/lib/teams/team-list-params";
import { TEAMS_LIST_PATH } from "@/lib/teams/team-list-sort-url";

export function TeamsToolbar() {
  const tTeams = useTranslations("teams");

  return (
    <ListFiltersBar>
      <ListNameSearch
        pathname={TEAMS_LIST_PATH}
        parseFilters={parseTeamListSearchParams}
        serializeFilters={serializeTeamListSearchParams}
        minChars={TEAM_LIST_SEARCH_MIN_CHARS}
        label={tTeams("searchByName")}
      />
      <ListArchivedToggle
        pathname={TEAMS_LIST_PATH}
        parseFilters={parseTeamListSearchParams}
        serializeFilters={serializeTeamListSearchParams}
        label={tTeams("showArchived")}
      />
    </ListFiltersBar>
  );
}
