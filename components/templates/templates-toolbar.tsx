"use client";

import { useTranslations } from "next-intl";

import { ListArchivedToggle } from "@/components/ui/list-archived-toggle";
import { ListFiltersBar } from "@/components/ui/list-filters-bar";
import { ListNameSearch } from "@/components/ui/list-name-search";
import { TEMPLATE_LIST_SEARCH_MIN_CHARS } from "@/lib/schemas/template-list-filters";
import {
  parseTemplateListSearchParams,
  serializeTemplateListSearchParams,
} from "@/lib/templates/template-list-params";

import { TEMPLATES_TASKS_LIST_PATH } from "./templates-page-layout";

export function TemplatesToolbar() {
  const tTemplates = useTranslations("templates");

  return (
    <ListFiltersBar>
      <ListNameSearch
        pathname={TEMPLATES_TASKS_LIST_PATH}
        parseFilters={parseTemplateListSearchParams}
        serializeFilters={serializeTemplateListSearchParams}
        minChars={TEMPLATE_LIST_SEARCH_MIN_CHARS}
        label={tTemplates("searchByNameOrCode")}
      />
      <ListArchivedToggle
        pathname={TEMPLATES_TASKS_LIST_PATH}
        parseFilters={parseTemplateListSearchParams}
        serializeFilters={serializeTemplateListSearchParams}
        label={tTemplates("showArchived")}
      />
    </ListFiltersBar>
  );
}
