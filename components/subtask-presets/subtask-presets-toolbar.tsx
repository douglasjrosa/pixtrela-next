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
import { SUBTASK_PRESET_LIST_SEARCH_MIN_CHARS } from "@/lib/schemas/subtask-preset-list-filters";
import {
  parseSubtaskPresetListSearchParams,
  serializeSubtaskPresetListSearchParams,
} from "@/lib/subtask-presets/subtask-preset-list-params";
import { TEMPLATES_SUBTASKS_LIST_PATH } from "@/lib/subtask-presets/subtask-preset-list-sort-url";
import { listSearchParamsRecord } from "@/lib/ui/list-url";

export function SubtaskPresetsToolbar() {
  const tPresets = useTranslations("subTaskPresets");
  const searchParams = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filters = parseSubtaskPresetListSearchParams(
    listSearchParamsRecord(searchParams),
  );

  return (
    <>
      <ListPageToolbar
        search={
          <ListNameSearch
            pathname={TEMPLATES_SUBTASKS_LIST_PATH}
            parseFilters={parseSubtaskPresetListSearchParams}
            serializeFilters={serializeSubtaskPresetListSearchParams}
            minChars={SUBTASK_PRESET_LIST_SEARCH_MIN_CHARS}
            label={tPresets("searchByName")}
            className={LIST_PAGE_SEARCH_INPUT_CLASS}
          />
        }
        filterButton={
          <ListPageFilterButton
            ariaLabel={tPresets("filters")}
            onClick={() => setFiltersOpen(true)}
          />
        }
        trailingActions={<TemplatesChromeActions />}
      />
      {filtersOpen ? (
        <ListShowArchivedFilterModal
          titleId="subtask-presets-filter-modal-title"
          title={tPresets("filters")}
          showArchivedLabel={tPresets("showArchived")}
          clearLabel={tPresets("clearFilters")}
          applyLabel={tPresets("applyFilters")}
          pathname={TEMPLATES_SUBTASKS_LIST_PATH}
          initialFilters={filters}
          onClose={() => setFiltersOpen(false)}
          serializeFilters={serializeSubtaskPresetListSearchParams}
        />
      ) : null}
    </>
  );
}
