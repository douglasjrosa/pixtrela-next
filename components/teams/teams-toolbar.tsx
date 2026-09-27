"use client";

import { useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ListNameSearch } from "@/components/ui/list-name-search";
import { ListPageFilterButton } from "@/components/ui/list-page-filter-button";
import {
  LIST_PAGE_SEARCH_INPUT_CLASS,
  ListPageToolbar,
} from "@/components/ui/list-page-toolbar";
import { ListShowArchivedFilterModal } from "@/components/ui/list-show-archived-filter-modal";
import { TEAM_LIST_SEARCH_MIN_CHARS } from "@/lib/schemas/team-list-filters";
import {
  parseTeamListSearchParams,
  serializeTeamListSearchParams,
} from "@/lib/teams/team-list-params";
import { TEAMS_LIST_PATH } from "@/lib/teams/team-list-sort-url";
import { listSearchParamsRecord } from "@/lib/ui/list-url";

export function TeamsToolbar({ trailingActions }: { trailingActions?: ReactNode }) {
  const tTeams = useTranslations("teams");
  const searchParams = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filters = parseTeamListSearchParams(
    listSearchParamsRecord(searchParams),
  );

  return (
    <>
      <ListPageToolbar
        search={
          <ListNameSearch
            pathname={TEAMS_LIST_PATH}
            parseFilters={parseTeamListSearchParams}
            serializeFilters={serializeTeamListSearchParams}
            minChars={TEAM_LIST_SEARCH_MIN_CHARS}
            label={tTeams("searchByName")}
            className={LIST_PAGE_SEARCH_INPUT_CLASS}
          />
        }
        filterButton={
          <ListPageFilterButton
            ariaLabel={tTeams("filters")}
            onClick={() => setFiltersOpen(true)}
          />
        }
        trailingActions={trailingActions}
      />
      {filtersOpen ? (
        <ListShowArchivedFilterModal
          titleId="teams-filter-modal-title"
          title={tTeams("filters")}
          showArchivedLabel={tTeams("showArchived")}
          clearLabel={tTeams("clearFilters")}
          applyLabel={tTeams("applyFilters")}
          pathname={TEAMS_LIST_PATH}
          initialFilters={filters}
          onClose={() => setFiltersOpen(false)}
          serializeFilters={serializeTeamListSearchParams}
        />
      ) : null}
    </>
  );
}
