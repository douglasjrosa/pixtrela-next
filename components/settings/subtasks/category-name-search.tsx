"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { SETTINGS_ENTITY_LIST_SEARCH_MIN_CHARS } from "@/lib/schemas/sub-task-category";
import {
  parseCategoryListSearchParams,
  serializeCategoryListSearchParams,
} from "@/lib/settings/category-list-params";

export function CategoryNameSearch() {
  const t = useTranslations("settings");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const filters = parseCategoryListSearchParams(
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
      const current = parseCategoryListSearchParams(
        Object.fromEntries(searchParams.entries()),
      );
      if ((current.q ?? undefined) === nextQ) return;
      const params = serializeCategoryListSearchParams({
        ...current,
        q: nextQ,
      });
      const query = params.toString();
      startTransition(() => {
        router.replace(
          query
            ? `/settings/subtasks/categories?${query}`
            : "/settings/subtasks/categories",
        );
      });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [value, router, searchParams]);

  return (
    <Input
      type="search"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      placeholder={t("searchCategories")}
      aria-label={t("searchCategories")}
      className="max-w-sm flex-1"
    />
  );
}
