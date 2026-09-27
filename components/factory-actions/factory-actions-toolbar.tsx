"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ListNameSearch } from "@/components/ui/list-name-search";
import { ListPageFilterButton } from "@/components/ui/list-page-filter-button";
import {
  LIST_PAGE_SEARCH_INPUT_CLASS,
  ListPageToolbar,
} from "@/components/ui/list-page-toolbar";
import { ListShowArchivedFilterModal } from "@/components/ui/list-show-archived-filter-modal";
import { TemplatesChromeActions } from "@/components/templates/templates-page-actions-context";
import { FACTORY_ACTION_LIST_SEARCH_MIN_CHARS } from "@/lib/schemas/factory-action-list-filters";
import {
  parseFactoryActionListSearchParams,
  serializeFactoryActionListSearchParams,
} from "@/lib/factory-actions/factory-action-list-params";
import { TEMPLATES_ACTIONS_LIST_PATH } from "@/lib/factory-actions/factory-action-list-sort-url";
import { listSearchParamsRecord } from "@/lib/ui/list-url";

export function FactoryActionsToolbar() {
  const tActions = useTranslations("factoryActions");
  const searchParams = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filters = parseFactoryActionListSearchParams(
    listSearchParamsRecord(searchParams),
  );

  return (
    <>
      <ListPageToolbar
        search={
          <ListNameSearch
            pathname={TEMPLATES_ACTIONS_LIST_PATH}
            parseFilters={parseFactoryActionListSearchParams}
            serializeFilters={serializeFactoryActionListSearchParams}
            minChars={FACTORY_ACTION_LIST_SEARCH_MIN_CHARS}
            label={tActions("searchByName")}
            className={LIST_PAGE_SEARCH_INPUT_CLASS}
          />
        }
        filterButton={
          <ListPageFilterButton
            ariaLabel={tActions("filters")}
            onClick={() => setFiltersOpen(true)}
          />
        }
        trailingActions={<TemplatesChromeActions />}
      />
      {filtersOpen ? (
        <ListShowArchivedFilterModal
          titleId="factory-actions-filter-modal-title"
          title={tActions("filters")}
          showArchivedLabel={tActions("showArchived")}
          clearLabel={tActions("clearFilters")}
          applyLabel={tActions("applyFilters")}
          pathname={TEMPLATES_ACTIONS_LIST_PATH}
          initialFilters={filters}
          onClose={() => setFiltersOpen(false)}
          serializeFilters={serializeFactoryActionListSearchParams}
        />
      ) : null}
    </>
  );
}
