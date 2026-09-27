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
import { AWARD_LIST_SEARCH_MIN_CHARS } from "@/lib/schemas/award-list-filters";
import {
  parseAwardListSearchParams,
  serializeAwardListSearchParams,
} from "@/lib/awards/award-list-params";
import { AWARDS_LIST_PATH } from "@/lib/awards/award-list-sort-url";
import { listSearchParamsRecord } from "@/lib/ui/list-url";

export function AwardsToolbar({ trailingActions }: { trailingActions?: ReactNode }) {
  const tAwards = useTranslations("awards");
  const searchParams = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filters = parseAwardListSearchParams(
    listSearchParamsRecord(searchParams),
  );

  return (
    <>
      <ListPageToolbar
        search={
          <ListNameSearch
            pathname={AWARDS_LIST_PATH}
            parseFilters={parseAwardListSearchParams}
            serializeFilters={serializeAwardListSearchParams}
            minChars={AWARD_LIST_SEARCH_MIN_CHARS}
            label={tAwards("searchByName")}
            className={LIST_PAGE_SEARCH_INPUT_CLASS}
          />
        }
        filterButton={
          <ListPageFilterButton
            ariaLabel={tAwards("filters")}
            onClick={() => setFiltersOpen(true)}
          />
        }
        trailingActions={trailingActions}
      />
      {filtersOpen ? (
        <ListShowArchivedFilterModal
          titleId="awards-filter-modal-title"
          title={tAwards("filters")}
          showArchivedLabel={tAwards("showArchived")}
          clearLabel={tAwards("clearFilters")}
          applyLabel={tAwards("applyFilters")}
          pathname={AWARDS_LIST_PATH}
          initialFilters={filters}
          onClose={() => setFiltersOpen(false)}
          serializeFilters={serializeAwardListSearchParams}
        />
      ) : null}
    </>
  );
}
