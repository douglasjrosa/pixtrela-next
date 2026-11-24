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
import { WORKDAY_LIST_SEARCH_MIN_CHARS } from "@/lib/schemas/workday-list-filters";
import { listSearchParamsRecord } from "@/lib/ui/list-url";
import {
  parseWorkdayListSearchParams,
  serializeWorkdayListSearchParams,
} from "@/lib/workdays/workday-list-params";
import { WORKDAYS_LIST_PATH } from "@/lib/workdays/workday-list-sort-url";

import { WorkdaysFilterModal } from "./workdays-filter-modal";

export function WorkdaysToolbar({
  trailingActions,
}: {
  trailingActions?: ReactNode;
}) {
  const t = useTranslations("workdays");
  const searchParams = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filters = parseWorkdayListSearchParams(
    listSearchParamsRecord(searchParams),
  );

  return (
    <>
      <ListPageToolbar
        search={
          <ListNameSearch
            pathname={WORKDAYS_LIST_PATH}
            parseFilters={parseWorkdayListSearchParams}
            serializeFilters={serializeWorkdayListSearchParams}
            minChars={WORKDAY_LIST_SEARCH_MIN_CHARS}
            label={t("searchPlaceholder")}
            className={LIST_PAGE_SEARCH_INPUT_CLASS}
          />
        }
        filterButton={
          <ListPageFilterButton
            ariaLabel={t("filters")}
            onClick={() => setFiltersOpen(true)}
          />
        }
        trailingActions={trailingActions}
      />
      {filtersOpen ? (
        <WorkdaysFilterModal
          initialFilters={filters}
          onClose={() => setFiltersOpen(false)}
        />
      ) : null}
    </>
  );
}
