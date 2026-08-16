"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  parseTemplateListSearchParams,
  serializeTemplateListSearchParams,
} from "@/lib/templates/template-list-params";

import { TemplatesNameSearch } from "./templates-name-search";
import { TEMPLATES_TASKS_LIST_PATH } from "./templates-page-layout";

export function TemplatesToolbar() {
  const tTemplates = useTranslations("templates");
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters = parseTemplateListSearchParams(
    Object.fromEntries(searchParams.entries()),
  );

  function handleArchivedChange(checked: boolean): void {
    const params = serializeTemplateListSearchParams({
      ...filters,
      showArchived: checked,
    });
    const query = params.toString();
    router.replace(
      query
        ? `${TEMPLATES_TASKS_LIST_PATH}?${query}`
        : TEMPLATES_TASKS_LIST_PATH,
    );
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <TemplatesNameSearch />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4 rounded border border-input accent-primary"
          checked={filters.showArchived}
          onChange={(event) => handleArchivedChange(event.target.checked)}
        />
        {tTemplates("showArchived")}
      </label>
    </div>
  );
}
