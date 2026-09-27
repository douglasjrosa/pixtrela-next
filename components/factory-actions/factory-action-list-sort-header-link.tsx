import { ListSortHeaderLink } from "@/components/ui/list-sort-header-link";
import type { FactoryActionListFilters } from "@/lib/schemas/factory-action-list-filters";
import type {
  FactoryActionListSort,
  FactoryActionListSortColumn,
} from "@/lib/schemas/factory-action-list-sort";
import { buildFactoryActionListSortHref } from "@/lib/factory-actions/factory-action-list-sort-url";

export interface FactoryActionListSortHeaderLinkProps {
  column: FactoryActionListSortColumn;
  label: string;
  sort: FactoryActionListSort;
  filters: FactoryActionListFilters;
  align?: "left" | "center";
}

export function FactoryActionListSortHeaderLink({
  column,
  label,
  sort,
  filters,
  align = "left",
}: FactoryActionListSortHeaderLinkProps) {
  const active = sort.column === column;
  const direction = active ? sort.direction : undefined;
  const href = buildFactoryActionListSortHref(filters, column);

  return (
    <ListSortHeaderLink
      href={href}
      label={label}
      active={active}
      direction={direction}
      align={align}
    />
  );
}
