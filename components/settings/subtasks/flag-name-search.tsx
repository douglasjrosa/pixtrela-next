"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ListNameSearch } from "@/components/ui/list-name-search";
import { Label } from "@/components/ui/label";
import { SETTINGS_ENTITY_LIST_SEARCH_MIN_CHARS } from "@/lib/schemas/sub-task-category";
import {
  parseFlagListSearchParams,
  serializeFlagListSearchParams,
} from "@/lib/settings/flag-list-params";
import { listPathWithQuery, listSearchParamsRecord } from "@/lib/ui/list-url";
import { NATIVE_SELECT_CLASS_NAME } from "@/lib/ui/native-select";
import { cn } from "@/lib/utils";

export function FlagNameSearch({
  categories,
}: {
  categories: { id: string; name: string }[];
}) {
  const t = useTranslations("settings");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const filters = parseFlagListSearchParams(
    listSearchParamsRecord(searchParams),
  );

  function handleCategoryChange(categoryId: string): void {
    const current = parseFlagListSearchParams(
      listSearchParamsRecord(searchParams),
    );
    startTransition(() => {
      router.replace(
        listPathWithQuery(
          "/settings/subtasks/flags",
          serializeFlagListSearchParams({
            ...current,
            categoryId: categoryId || undefined,
          }),
        ),
      );
    });
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <ListNameSearch
        pathname="/settings/subtasks/flags"
        parseFilters={parseFlagListSearchParams}
        serializeFilters={serializeFlagListSearchParams}
        minChars={SETTINGS_ENTITY_LIST_SEARCH_MIN_CHARS}
        label={t("searchFlags")}
      />
      <div className="space-y-1">
        <Label htmlFor="flag-filter-category" className="sr-only">
          {t("flagCategory")}
        </Label>
        <select
          id="flag-filter-category"
          className={cn(NATIVE_SELECT_CLASS_NAME, "h-9 w-auto")}
          value={filters.categoryId ?? ""}
          onChange={(event) => handleCategoryChange(event.target.value)}
        >
          <option value="">{t("allCategories")}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
