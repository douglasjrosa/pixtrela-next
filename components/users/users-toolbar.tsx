"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  parseUserListSearchParams,
  serializeUserListSearchParams,
} from "@/lib/users/user-list-params";
import { USERS_LIST_PATH } from "@/lib/users/user-list-sort-url";

import { UsersNameSearch } from "./users-name-search";

export function UsersToolbar() {
  const tUsers = useTranslations("users");
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters = parseUserListSearchParams(
    Object.fromEntries(searchParams.entries()),
  );

  function handleArchivedChange(checked: boolean): void {
    const params = serializeUserListSearchParams({
      ...filters,
      showArchived: checked,
    });
    const query = params.toString();
    router.replace(query ? `${USERS_LIST_PATH}?${query}` : USERS_LIST_PATH);
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <UsersNameSearch />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4 rounded border border-input accent-primary"
          checked={filters.showArchived}
          onChange={(event) => handleArchivedChange(event.target.checked)}
        />
        {tUsers("showArchived")}
      </label>
    </div>
  );
}
