"use client";

import { useTranslations } from "next-intl";

import { ListArchivedToggle } from "@/components/ui/list-archived-toggle";
import { ListFiltersBar } from "@/components/ui/list-filters-bar";
import { ListNameSearch } from "@/components/ui/list-name-search";
import { SUBTASK_PRESET_LIST_SEARCH_MIN_CHARS } from "@/lib/schemas/subtask-preset-list-filters";
import {
  parseSubtaskPresetListSearchParams,
  serializeSubtaskPresetListSearchParams,
} from "@/lib/subtask-presets/subtask-preset-list-params";
import { TEMPLATES_SUBTASKS_LIST_PATH } from "@/lib/subtask-presets/subtask-preset-list-sort-url";

export function SubtaskPresetsToolbar() {
  const tPresets = useTranslations("subTaskPresets");

  return (
    <ListFiltersBar>
      <ListNameSearch
        pathname={TEMPLATES_SUBTASKS_LIST_PATH}
        parseFilters={parseSubtaskPresetListSearchParams}
        serializeFilters={serializeSubtaskPresetListSearchParams}
        minChars={SUBTASK_PRESET_LIST_SEARCH_MIN_CHARS}
        label={tPresets("searchByName")}
      />
      <ListArchivedToggle
        pathname={TEMPLATES_SUBTASKS_LIST_PATH}
        parseFilters={parseSubtaskPresetListSearchParams}
        serializeFilters={serializeSubtaskPresetListSearchParams}
        label={tPresets("showArchived")}
      />
    </ListFiltersBar>
  );
}
