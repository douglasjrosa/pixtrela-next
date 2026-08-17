import { getTranslations } from "next-intl/server";

import type { UserListSort } from "@/lib/schemas/user-list-sort";
import type { UserListFilters } from "@/lib/schemas/user-list-filters";

import { UserListSortHeaderLink } from "./user-list-sort-header-link";

export interface UsersListTableHeaderProps {
  sort: UserListSort;
  filters: UserListFilters;
}

export async function UsersListTableHeader({
  sort,
  filters,
}: UsersListTableHeaderProps) {
  const tUsers = await getTranslations("users");

  return (
    <thead>
      <tr className="border-b text-left">
        <th className="w-12 py-2 pr-3" aria-hidden />
        <UserListSortHeaderLink
          column="name"
          label={tUsers("name")}
          sort={sort}
          filters={filters}
          align="left"
        />
        <UserListSortHeaderLink
          column="code"
          label={tUsers("code")}
          sort={sort}
          filters={filters}
          align="center"
        />
        <UserListSortHeaderLink
          column="role"
          label={tUsers("role")}
          sort={sort}
          filters={filters}
          align="center"
        />
      </tr>
    </thead>
  );
}
