"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { ListFiltersBar } from "@/components/ui/list-filters-bar";
import { ListNameSearch } from "@/components/ui/list-name-search";
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

export function ActivitiesToolbar() {
  const t = useTranslations("activities");
  const searchParams = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filters = parseActivityListSearchParams(
    listSearchParamsRecord(searchParams),
  );

  return (
    <>
      <ListFiltersBar>
        <Button
          type="button"
          variant="outline"
          onClick={() => setFiltersOpen(true)}
        >
          {t("filters")}
        </Button>
        <ListNameSearch
          pathname="/activities"
          parseFilters={parseActivityListSearchParams}
          serializeFilters={serializeActivityListSearchParams}
          minChars={ACTIVITY_LIST_NAME_MIN_CHARS}
          label={t("search")}
        />
      </ListFiltersBar>
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
