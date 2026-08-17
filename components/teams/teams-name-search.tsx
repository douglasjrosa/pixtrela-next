"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import {
  TEAM_LIST_SEARCH_DEBOUNCE_MS,
  TEAM_LIST_SEARCH_MIN_CHARS,
} from "@/lib/schemas/team-list-filters";
import {
  parseTeamListSearchParams,
  serializeTeamListSearchParams,
} from "@/lib/teams/team-list-params";
import { TEAMS_LIST_PATH } from "@/lib/teams/team-list-sort-url";

export function TeamsNameSearch() {
  const tTeams = useTranslations("teams");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const filters = parseTeamListSearchParams(
    Object.fromEntries(searchParams.entries()),
  );
  const [value, setValue] = useState(filters.q ?? "");
  const qFromUrl = filters.q ?? "";
  const [prevQFromUrl, setPrevQFromUrl] = useState(qFromUrl);
  if (qFromUrl !== prevQFromUrl) {
    setPrevQFromUrl(qFromUrl);
    setValue(qFromUrl);
  }

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const trimmed = value.trim();
      const nextQ =
        trimmed.length >= TEAM_LIST_SEARCH_MIN_CHARS ? trimmed : undefined;
      const current = parseTeamListSearchParams(
        Object.fromEntries(searchParams.entries()),
      );
      if ((current.q ?? undefined) === nextQ) return;

      const params = serializeTeamListSearchParams({
        ...current,
        q: nextQ,
      });
      const query = params.toString();
      startTransition(() => {
        router.replace(
          query ? `${TEAMS_LIST_PATH}?${query}` : TEAMS_LIST_PATH,
        );
      });
    }, TEAM_LIST_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(handle);
  }, [value, router, searchParams]);

  return (
    <Input
      type="search"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      placeholder={tTeams("searchByName")}
      aria-label={tTeams("searchByName")}
      className="max-w-sm flex-1"
    />
  );
}
