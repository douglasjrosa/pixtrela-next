import { ListSortHeaderLink } from "@/components/ui/list-sort-header-link";
import type { UserListFilters } from "@/lib/schemas/user-list-filters";
import type {
  UserListSort,
  UserListSortColumn,
} from "@/lib/schemas/user-list-sort";
import { buildUserListSortHref } from "@/lib/users/user-list-sort-url";

export interface UserListSortHeaderLinkProps {
  column: UserListSortColumn;
  label: string;
  sort: UserListSort;
  filters: UserListFilters;
  align?: "left" | "center";
  className?: string;
}

export function UserListSortHeaderLink({
  column,
  label,
  sort,
  filters,
  align = "left",
  className,
}: UserListSortHeaderLinkProps) {
  const active = sort.column === column;
  const direction = active ? sort.direction : undefined;
  const href = buildUserListSortHref(filters, column);

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
