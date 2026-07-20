"use client";

import { TemplatesNameSearch } from "./templates-name-search";

export function TemplatesToolbar() {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <TemplatesNameSearch />
    </div>
  );
}
