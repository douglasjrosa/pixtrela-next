import { ListSortHeaderLink } from "@/components/ui/list-sort-header-link";
import type { TemplateListFilters } from "@/lib/schemas/template-list-filters";
import type {
  TemplateListSort,
  TemplateListSortColumn,
} from "@/lib/schemas/template-list-sort";
import { buildTemplateListSortHref } from "@/lib/templates/template-list-sort-url";

export interface TemplateListSortHeaderLinkProps {
  column: TemplateListSortColumn;
  label: string;
  sort: TemplateListSort;
  filters: TemplateListFilters;
  align?: "left" | "center";
  className?: string;
}

export function TemplateListSortHeaderLink({
  column,
  label,
  sort,
  filters,
  align = "left",
  className,
}: TemplateListSortHeaderLinkProps) {
  const active = sort.column === column;
  const direction = active ? sort.direction : undefined;
  const href = buildTemplateListSortHref(filters, column);

  return (
    <ListSortHeaderLink
      href={href}
      label={label}
      active={active}
      direction={direction}
      align={align}
      className={className}
    />
  );
}
