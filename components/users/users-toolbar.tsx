"use client";

import { UsersNameSearch } from "./users-name-search";

export function UsersToolbar() {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <UsersNameSearch />
    </div>
  );
}
