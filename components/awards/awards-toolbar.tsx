"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { AWARDS_LIST_PATH } from "@/lib/awards/award-list-sort-url";
import {
  parseAwardListSearchParams,
  serializeAwardListSearchParams,
} from "@/lib/awards/award-list-params";

import { AwardsNameSearch } from "./awards-name-search";

export function AwardsToolbar() {
  const tAwards = useTranslations("awards");
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters = parseAwardListSearchParams(
    Object.fromEntries(searchParams.entries()),
  );

  function handleArchivedChange(checked: boolean): void {
    const params = serializeAwardListSearchParams({
      ...filters,
      showArchived: checked,
    });
    const query = params.toString();
    router.replace(query ? `${AWARDS_LIST_PATH}?${query}` : AWARDS_LIST_PATH);
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <AwardsNameSearch />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4 rounded border border-input accent-primary"
          checked={filters.showArchived}
          onChange={(event) => handleArchivedChange(event.target.checked)}
        />
        {tAwards("showArchived")}
      </label>
    </div>
  );
}
