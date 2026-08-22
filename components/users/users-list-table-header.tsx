import { getTranslations } from "next-intl/server";

import { ListRowCheckbox } from "@/components/ui/list-row-checkbox";
import { cn } from "@/lib/utils";
import type { UserListSort } from "@/lib/schemas/user-list-sort";
import type { UserListFilters } from "@/lib/schemas/user-list-filters";

import { UserListSortHeaderLink } from "./user-list-sort-header-link";

export interface UsersListTableHeaderProps {
  sort: UserListSort;
  filters: UserListFilters;
  showCheckboxColumn?: boolean;
}

export async function UsersListTableHeader({
  sort,
  filters,
  showCheckboxColumn = false,
}: UsersListTableHeaderProps) {
  const tUsers = await getTranslations("users");
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
