import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";

import { cn } from "@/lib/utils";
import type {
  UserListSort,
  UserListSortColumn,
} from "@/lib/schemas/user-list-sort";
import type { UserListFilters } from "@/lib/schemas/user-list-filters";
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
    <th
      className={cn(
        "py-2",
        align === "center" ? "text-center" : "text-left",
        className,
      )}
    >
      <Link
        href={href}
        scroll={false}
        className={cn(
          "flex w-full items-center gap-1 rounded-md px-2 py-1 font-medium",
          "transition-colors hover:bg-muted focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring",
          align === "center" ? "justify-center" : "justify-start",
          active ? "text-foreground" : "text-muted-foreground",
        )}
        aria-sort={
          active ? (direction === "asc" ? "ascending" : "descending") : "none"
        }
      >
        <span>{label}</span>
        {active ? (
          direction === "asc" ? (
            <ArrowUp className="size-3.5 shrink-0" aria-hidden />
          ) : (
            <ArrowDown className="size-3.5 shrink-0" aria-hidden />
          )
        ) : null}
      </Link>
    </th>
  );
}
