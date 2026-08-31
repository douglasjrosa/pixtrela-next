"use client";

import { useTranslations } from "next-intl";

import { ListArchivedToggle } from "@/components/ui/list-archived-toggle";
import { ListFiltersBar } from "@/components/ui/list-filters-bar";
import { ListNameSearch } from "@/components/ui/list-name-search";
import { FACTORY_ACTION_LIST_SEARCH_MIN_CHARS } from "@/lib/schemas/factory-action-list-filters";
import {
  parseFactoryActionListSearchParams,
  serializeFactoryActionListSearchParams,
} from "@/lib/factory-actions/factory-action-list-params";
import { TEMPLATES_ACTIONS_LIST_PATH } from "@/lib/factory-actions/factory-action-list-sort-url";

export function FactoryActionsToolbar() {
  const tActions = useTranslations("factoryActions");

  return (
    <ListFiltersBar>
      <ListNameSearch
        pathname={TEMPLATES_ACTIONS_LIST_PATH}
        parseFilters={parseFactoryActionListSearchParams}
        serializeFilters={serializeFactoryActionListSearchParams}
        minChars={FACTORY_ACTION_LIST_SEARCH_MIN_CHARS}
        label={tActions("searchByName")}
      />
      <ListArchivedToggle
        pathname={TEMPLATES_ACTIONS_LIST_PATH}
        parseFilters={parseFactoryActionListSearchParams}
        serializeFilters={serializeFactoryActionListSearchParams}
        label={tActions("showArchived")}
      />
    </ListFiltersBar>
  );
}
