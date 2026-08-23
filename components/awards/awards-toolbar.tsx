"use client";

import { useTranslations } from "next-intl";

import { ListArchivedToggle } from "@/components/ui/list-archived-toggle";
import { ListFiltersBar } from "@/components/ui/list-filters-bar";
import { ListNameSearch } from "@/components/ui/list-name-search";
import { AWARDS_LIST_PATH } from "@/lib/awards/award-list-sort-url";
import {
  parseAwardListSearchParams,
  serializeAwardListSearchParams,
} from "@/lib/awards/award-list-params";
import { AWARD_LIST_SEARCH_MIN_CHARS } from "@/lib/schemas/award-list-filters";

export function AwardsToolbar() {
  const tAwards = useTranslations("awards");

  return (
    <ListFiltersBar>
      <ListNameSearch
        pathname={AWARDS_LIST_PATH}
        parseFilters={parseAwardListSearchParams}
        serializeFilters={serializeAwardListSearchParams}
        minChars={AWARD_LIST_SEARCH_MIN_CHARS}
        label={tAwards("searchByName")}
      />
      <ListArchivedToggle
        pathname={AWARDS_LIST_PATH}
        parseFilters={parseAwardListSearchParams}
        serializeFilters={serializeAwardListSearchParams}
        label={tAwards("showArchived")}
      />
    </ListFiltersBar>
  );
}
