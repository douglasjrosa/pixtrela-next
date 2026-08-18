"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SETTINGS_ENTITY_LIST_SEARCH_MIN_CHARS } from "@/lib/schemas/sub-task-category";
import {
  parseFlagListSearchParams,
  serializeFlagListSearchParams,
} from "@/lib/settings/flag-list-params";

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
    Object.fromEntries(searchParams.entries()),
  );
  const [value, setValue] = useState(filters.q ?? "");

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const trimmed = value.trim();
      const nextQ =
        trimmed.length >= SETTINGS_ENTITY_LIST_SEARCH_MIN_CHARS
          ? trimmed
          : undefined;
      const current = parseFlagListSearchParams(
        Object.fromEntries(searchParams.entries()),
      );
      if ((current.q ?? undefined) === nextQ) return;
      const params = serializeFlagListSearchParams({
        ...current,
        q: nextQ,
      });
      const query = params.toString();
      startTransition(() => {
        router.replace(
          query
            ? `/settings/subtasks/flags?${query}`
            : "/settings/subtasks/flags",
        );
      });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [value, router, searchParams]);

  function handleCategoryChange(categoryId: string): void {
    const current = parseFlagListSearchParams(
      Object.fromEntries(searchParams.entries()),
    );
    const params = serializeFlagListSearchParams({
      ...current,
      categoryId: categoryId || undefined,
    });
    const query = params.toString();
    startTransition(() => {
      router.replace(
        query ? `/settings/subtasks/flags?${query}` : "/settings/subtasks/flags",
      );
    });
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <Input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={t("searchFlags")}
        aria-label={t("searchFlags")}
        className="max-w-sm flex-1"
      />
      <div className="space-y-1">
        <Label htmlFor="flag-filter-category" className="sr-only">
          {t("flagCategory")}
        </Label>
        <select
          id="flag-filter-category"
          className="flex h-9 rounded-md border border-input bg-transparent px-3 text-sm"
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
