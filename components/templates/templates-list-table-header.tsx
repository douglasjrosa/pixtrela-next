import { getTranslations } from "next-intl/server";

import type { TemplateListSort } from "@/lib/schemas/template-list-sort";
import type { TemplateListFilters } from "@/lib/schemas/template-list-filters";

import { ListTableHeadShell } from "@/components/ui/list-table-head-shell";
import { TemplateListSortHeaderLink } from "./template-list-sort-header-link";

export interface TemplatesListTableHeaderProps {
  sort: TemplateListSort;
  filters: TemplateListFilters;
  showCheckboxColumn?: boolean;
}

export async function TemplatesListTableHeader({
  sort,
  filters,
  showCheckboxColumn = false,
}: TemplatesListTableHeaderProps) {
  const tTemplates = await getTranslations("templates");
  const tCommon = await getTranslations("common");

  return (
    <ListTableHeadShell
      showCheckboxColumn={showCheckboxColumn}
      selectAllAriaLabel={tCommon("selectAll")}
    >
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
    </ListTableHeadShell>
  );
}
