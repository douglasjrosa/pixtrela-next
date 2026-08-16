import { getTranslations } from "next-intl/server";

import type { TemplateListSort } from "@/lib/schemas/template-list-sort";
import type { TemplateListFilters } from "@/lib/schemas/template-list-filters";

import { TemplateListSortHeaderLink } from "./template-list-sort-header-link";

export interface TemplatesListTableHeaderProps {
  sort: TemplateListSort;
  filters: TemplateListFilters;
}

export async function TemplatesListTableHeader({
  sort,
  filters,
}: TemplatesListTableHeaderProps) {
  const tTemplates = await getTranslations("templates");

  return (
    <thead>
      <tr className="border-b text-left">
        <TemplateListSortHeaderLink
          column="name"
          label={tTemplates("name")}
          sort={sort}
          filters={filters}
          align="left"
        />
        <TemplateListSortHeaderLink
          column="code"
          label={tTemplates("code")}
          sort={sort}
          filters={filters}
          align="center"
        />
        <TemplateListSortHeaderLink
          column="subTaskCount"
          label={tTemplates("subtasks")}
          sort={sort}
          filters={filters}
          align="center"
        />
      </tr>
    </thead>
  );
}
