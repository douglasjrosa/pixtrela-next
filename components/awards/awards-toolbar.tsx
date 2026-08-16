"use client";

import { AwardsNameSearch } from "./awards-name-search";

export function AwardsToolbar() {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <AwardsNameSearch />
    </div>
  );
}
