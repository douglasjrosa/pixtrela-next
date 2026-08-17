"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  parseTeamListSearchParams,
  serializeTeamListSearchParams,
} from "@/lib/teams/team-list-params";

import { TeamsNameSearch } from "./teams-name-search";

export function TeamsToolbar() {
  const tTeams = useTranslations("teams");
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters = parseTeamListSearchParams(
    Object.fromEntries(searchParams.entries()),
  );

  function handleArchivedChange(checked: boolean): void {
    const params = serializeTeamListSearchParams({
      ...filters,
      showArchived: checked,
    });
    const query = params.toString();
    router.replace(query ? `/teams?${query}` : "/teams");
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <TeamsNameSearch />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4 rounded border border-input accent-primary"
          checked={filters.showArchived}
          onChange={(event) => handleArchivedChange(event.target.checked)}
        />
        {tTeams("showArchived")}
      </label>
    </div>
  );
}
