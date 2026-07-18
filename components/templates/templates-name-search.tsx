"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import {
  TEMPLATE_LIST_NAME_MIN_CHARS,
  TEMPLATE_LIST_SEARCH_DEBOUNCE_MS,
} from "@/lib/schemas/template-list-filters";
import {
  parseTemplateListSearchParams,
  serializeTemplateListSearchParams,
} from "@/lib/templates/template-list-params";
import { TEMPLATES_TASKS_LIST_PATH } from "./templates-page-layout";

export function TemplatesNameSearch() {
  const tTemplates = useTranslations("templates");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const filters = parseTemplateListSearchParams(
    Object.fromEntries(searchParams.entries()),
  );
  const [value, setValue] = useState(filters.q ?? "");

  useEffect(() => {
    setValue(filters.q ?? "");
  }, [filters.q]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const trimmed = value.trim();
      const nextQ =
        trimmed.length >= TEMPLATE_LIST_NAME_MIN_CHARS ? trimmed : undefined;
      const current = parseTemplateListSearchParams(
        Object.fromEntries(searchParams.entries()),
      );
      if ((current.q ?? undefined) === nextQ) return;

      const params = serializeTemplateListSearchParams({
        ...current,
        q: nextQ,
      });
      const query = params.toString();
      startTransition(() => {
        router.replace(
          query
            ? `${TEMPLATES_TASKS_LIST_PATH}?${query}`
            : TEMPLATES_TASKS_LIST_PATH,
        );
      });
    }, TEMPLATE_LIST_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(handle);
  }, [value, router, searchParams]);

  return (
    <Input
      type="search"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      placeholder={tTemplates("searchByName")}
      aria-label={tTemplates("searchByName")}
      className="max-w-sm flex-1"
    />
  );
}
