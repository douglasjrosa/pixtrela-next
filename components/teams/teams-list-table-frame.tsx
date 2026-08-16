"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { loadMoreTeams } from "@/app/(app)/teams/actions";
import { Button } from "@/components/ui/button";
import { isTeamActive } from "@/lib/business/team-active";
import { formatDatePtBr } from "@/lib/format/datetime";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import type { TeamListFilters } from "@/lib/schemas/team-list-filters";
import { teamListFilterKey } from "@/lib/teams/team-list-params";
import { showErrorToast } from "@/lib/ui/app-toast";

import { TeamListRowPresentational } from "./team-list-row-presentational";
import type { TeamRow } from "./types";

export interface TeamsListTableFrameProps {
  filters: TeamListFilters;
  initialTeams: TeamRow[];
  initialPage: number;
  initialHasMore: boolean;
  tableHeader: ReactNode;
  tableBody: ReactNode;
  mobileList: ReactNode;
}

export function TeamsListTableFrame({
  filters,
  initialTeams,
  initialPage,
  initialHasMore,
  tableHeader,
  tableBody,
  mobileList,
}: TeamsListTableFrameProps) {
  const tTeams = useTranslations("teams");
  const filterKey = teamListFilterKey(filters);
  const [extraTeams, setExtraTeams] = useState<TeamRow[]>([]);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();
  const listResetKey = [
    filterKey,
    String(initialPage),
    String(initialHasMore),
    initialTeams.map((row) => row.documentId).join(","),
  ].join(":");
  const [prevListResetKey, setPrevListResetKey] = useState(listResetKey);
  if (listResetKey !== prevListResetKey) {
    setPrevListResetKey(listResetKey);
    setExtraTeams([]);
    setPage(initialPage);
    setHasMore(initialHasMore);
  }

  function labelsFor(team: TeamRow) {
    const active = isTeamActive(team.untill);
    return {
      since: formatDatePtBr(team.since),
      untill: formatDatePtBr(team.untill),
      status: active ? tTeams("active") : tTeams("inactive"),
      leader: team.leader?.name ?? tTeams("noLeader"),
      exchangesFirstDay: tTeams("exchangesFirstDay"),
      exchangesLastDay: tTeams("exchangesLastDay"),
    };
  }

  function handleLoadMore(): void {
    const nextPage = page + 1;
    startTransition(async () => {
      try {
        const result = await loadMoreTeams(filters, nextPage);
        setExtraTeams((current) => [...current, ...result.teams]);
        setPage(result.page);
        setHasMore(result.hasMore);
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tTeams("error"));
      }
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <table className="hidden w-full text-sm md:table">
          {tableHeader}
          {tableBody}
          {extraTeams.length > 0 ? (
            <tbody>
              {extraTeams.map((team) => (
                <TeamListRowPresentational
                  key={team.documentId}
                  team={team}
                  variant="table"
                  labels={labelsFor(team)}
                />
              ))}
            </tbody>
          ) : null}
        </table>

        {mobileList}

        {extraTeams.length > 0 ? (
          <ul className="md:hidden">
            {extraTeams.map((team) => (
              <TeamListRowPresentational
                key={team.documentId}
                team={team}
                variant="mobile"
                labels={labelsFor(team)}
              />
            ))}
          </ul>
        ) : null}
      </div>

      {hasMore ? (
        <div className="flex shrink-0 justify-center pt-3">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={handleLoadMore}
          >
            {isPending ? tTeams("loadingMore") : tTeams("loadMore")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
