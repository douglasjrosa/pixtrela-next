"use client";

import dynamic from "next/dynamic";
import { useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ListNameSearch } from "@/components/ui/list-name-search";
import { ListPageFilterButton } from "@/components/ui/list-page-filter-button";
import {
  LIST_PAGE_SEARCH_INPUT_CLASS,
  ListPageToolbar,
} from "@/components/ui/list-page-toolbar";
import { ACTIVITY_LIST_NAME_MIN_CHARS } from "@/lib/schemas/activity-list-filters";
import {
  parseActivityListSearchParams,
  serializeActivityListSearchParams,
} from "@/lib/activities/activity-list-params";
import { listSearchParamsRecord } from "@/lib/ui/list-url";

const ActivitiesFilterModal = dynamic(
  () =>
    import("./activities-filter-modal").then(
      (module) => module.ActivitiesFilterModal,
    ),
  { ssr: false },
);

export function ActivitiesToolbar({
  trailingActions,
}: {
  trailingActions?: ReactNode;
}) {
  const t = useTranslations("activities");
  const searchParams = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filters = parseActivityListSearchParams(
    listSearchParamsRecord(searchParams),
  );

  return (
    <>
      <ListPageToolbar
        search={
          <ListNameSearch
            pathname="/activities"
            parseFilters={parseActivityListSearchParams}
            serializeFilters={serializeActivityListSearchParams}
            minChars={ACTIVITY_LIST_NAME_MIN_CHARS}
            label={t("search")}
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
        <ActivitiesFilterModal
          open={filtersOpen}
          initialFilters={filters}
          onClose={() => setFiltersOpen(false)}
        />
      ) : null}
    </>
  );
}
