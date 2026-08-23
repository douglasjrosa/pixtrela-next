import { getTranslations } from "next-intl/server";

import { cn } from "@/lib/utils";
import type { TemplateListSort } from "@/lib/schemas/template-list-sort";
import type { TemplateListFilters } from "@/lib/schemas/template-list-filters";

import { ListRowCheckbox } from "@/components/ui/list-row-checkbox";
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
    <thead>
      <tr className="border-b text-left">
        {showCheckboxColumn ? (
          <th className={cn("w-10 py-2", "text-center")}>
            <ListRowCheckbox
              documentId=""
              variant="table-header"
              selectAll
              ariaLabel={tCommon("selectAll")}
            />
          </th>
        ) : null}
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
