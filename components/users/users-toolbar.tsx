"use client";

import { useTranslations } from "next-intl";

import { ListArchivedToggle } from "@/components/ui/list-archived-toggle";
import { ListFiltersBar } from "@/components/ui/list-filters-bar";
import { ListNameSearch } from "@/components/ui/list-name-search";
import { USER_LIST_SEARCH_MIN_CHARS } from "@/lib/schemas/user-list-filters";
import {
  parseUserListSearchParams,
  serializeUserListSearchParams,
} from "@/lib/users/user-list-params";
import { USERS_LIST_PATH } from "@/lib/users/user-list-sort-url";

export function UsersToolbar() {
  const tUsers = useTranslations("users");

  return (
    <ListFiltersBar>
      <ListNameSearch
        pathname={USERS_LIST_PATH}
        parseFilters={parseUserListSearchParams}
        serializeFilters={serializeUserListSearchParams}
        minChars={USER_LIST_SEARCH_MIN_CHARS}
        label={tUsers("searchByName")}
      />
      <ListArchivedToggle
        pathname={USERS_LIST_PATH}
        parseFilters={parseUserListSearchParams}
        serializeFilters={serializeUserListSearchParams}
        label={tUsers("showArchived")}
      />
    </ListFiltersBar>
  );
}
