"use client";

import { useTranslations } from "next-intl";

import { ListNameSearch } from "@/components/ui/list-name-search";
import { SETTINGS_ENTITY_LIST_SEARCH_MIN_CHARS } from "@/lib/schemas/sub-task-category";
import {
  parseCategoryListSearchParams,
  serializeCategoryListSearchParams,
} from "@/lib/settings/category-list-params";

export function CategoryNameSearch() {
  const t = useTranslations("settings");

  return (
    <ListNameSearch
      pathname="/settings/subtasks/categories"
      parseFilters={parseCategoryListSearchParams}
      serializeFilters={serializeCategoryListSearchParams}
      minChars={SETTINGS_ENTITY_LIST_SEARCH_MIN_CHARS}
      label={t("searchCategories")}
    />
  );
}
