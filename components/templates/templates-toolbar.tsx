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
import { TEMPLATE_LIST_SEARCH_MIN_CHARS } from "@/lib/schemas/template-list-filters";
import {
  parseTemplateListSearchParams,
  serializeTemplateListSearchParams,
} from "@/lib/templates/template-list-params";
import { listSearchParamsRecord } from "@/lib/ui/list-url";

import { TemplatesChromeActions } from "./templates-page-actions-context";
import { TemplatesFilterModal } from "./templates-filter-modal";
import { TEMPLATES_TASKS_LIST_PATH } from "./templates-page-layout";

export function TemplatesToolbar() {
  const tTemplates = useTranslations("templates");
  const searchParams = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filters = parseTemplateListSearchParams(
    listSearchParamsRecord(searchParams),
  );

  return (
    <>
      <ListPageToolbar
        search={
          <ListNameSearch
            pathname={TEMPLATES_TASKS_LIST_PATH}
            parseFilters={parseTemplateListSearchParams}
            serializeFilters={serializeTemplateListSearchParams}
            minChars={TEMPLATE_LIST_SEARCH_MIN_CHARS}
            label={tTemplates("searchByNameOrCode")}
            className={LIST_PAGE_SEARCH_INPUT_CLASS}
          />
        }
        filterButton={
          <ListPageFilterButton
            ariaLabel={tTemplates("filters")}
            onClick={() => setFiltersOpen(true)}
          />
        }
        trailingActions={<TemplatesChromeActions />}
      />
      {filtersOpen ? (
        <TemplatesFilterModal
          initialFilters={filters}
          onClose={() => setFiltersOpen(false)}
        />
      ) : null}
    </>
  );
}
