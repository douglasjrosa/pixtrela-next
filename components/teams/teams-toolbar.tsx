"use client";

import { TeamsNameSearch } from "./teams-name-search";

export function TeamsToolbar() {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <TeamsNameSearch />
    </div>
  );
}
