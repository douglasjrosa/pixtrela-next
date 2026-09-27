import { ListSortHeaderLink } from "@/components/ui/list-sort-header-link";
import type { AwardListFilters } from "@/lib/schemas/award-list-filters";
import type {
  AwardListSort,
  AwardListSortColumn,
} from "@/lib/schemas/award-list-sort";
import { buildAwardListSortHref } from "@/lib/awards/award-list-sort-url";

export interface AwardListSortHeaderLinkProps {
  column: AwardListSortColumn;
  label: string;
  sort: AwardListSort;
  filters: AwardListFilters;
  align?: "left" | "center";
  className?: string;
}

export function AwardListSortHeaderLink({
  column,
  label,
  sort,
  filters,
  align = "left",
  className,
}: AwardListSortHeaderLinkProps) {
  const active = sort.column === column;
  const direction = active ? sort.direction : undefined;
  const href = buildAwardListSortHref(filters, column);

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
