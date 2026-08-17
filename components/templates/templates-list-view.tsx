import { getTranslations } from "next-intl/server";

import { ListEmptyMessage } from "@/components/ui/list-empty-message";
import type { TemplateListSort } from "@/lib/schemas/template-list-sort";
import type { TemplateListFilters } from "@/lib/schemas/template-list-filters";

import { TemplatesListMobileList } from "./templates-list-mobile-list";
import { TemplatesListTableBody } from "./templates-list-table-body";
import { TemplatesListTableHeader } from "./templates-list-table-header";
import type { TemplateListRow } from "./types";

export interface TemplatesListViewProps {
  templates: TemplateListRow[];
  sort: TemplateListSort;
  filters: TemplateListFilters;
}

export async function TemplatesListView({
  templates,
  sort,
  filters,
}: TemplatesListViewProps) {
  const tTemplates = await getTranslations("templates");

  if (templates.length === 0) {
    return <ListEmptyMessage>{tTemplates("empty")}</ListEmptyMessage>;
  }

  return (
    <>
      <TemplatesListTableHeader sort={sort} filters={filters} />
      <TemplatesListTableBody templates={templates} />
      <TemplatesListMobileList templates={templates} />
    </>
  );
}
