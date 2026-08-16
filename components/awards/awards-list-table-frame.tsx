"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { loadMoreAwards } from "@/app/(app)/awards/actions";
import { Button } from "@/components/ui/button";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import type { AwardListFilters } from "@/lib/schemas/award-list-filters";
import { awardListFilterKey } from "@/lib/awards/award-list-params";
import { showErrorToast } from "@/lib/ui/app-toast";

import { awardCostLabel } from "./award-cost-label";
import { AwardListRowPresentational } from "./award-list-row-presentational";
import type { AwardRow, CurrencyOption } from "./types";

export interface AwardsListTableFrameProps {
  filters: AwardListFilters;
  currencies: CurrencyOption[];
  initialAwards: AwardRow[];
  initialPage: number;
  initialHasMore: boolean;
  tableHeader: ReactNode;
  tableBody: ReactNode;
  mobileList: ReactNode;
}

export function AwardsListTableFrame({
  filters,
  currencies,
  initialAwards,
  initialPage,
  initialHasMore,
  tableHeader,
  tableBody,
  mobileList,
}: AwardsListTableFrameProps) {
  const tAwards = useTranslations("awards");
  const filterKey = awardListFilterKey(filters);
  const [extraAwards, setExtraAwards] = useState<AwardRow[]>([]);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();
  const listResetKey = [
    filterKey,
    String(initialPage),
    String(initialHasMore),
    initialAwards.map((row) => row.documentId).join(","),
  ].join(":");
  const [prevListResetKey, setPrevListResetKey] = useState(listResetKey);
  if (listResetKey !== prevListResetKey) {
    setPrevListResetKey(listResetKey);
    setExtraAwards([]);
    setPage(initialPage);
    setHasMore(initialHasMore);
  }

  function handleLoadMore(): void {
    const nextPage = page + 1;
    startTransition(async () => {
      try {
        const result = await loadMoreAwards(filters, nextPage);
        setExtraAwards((current) => [...current, ...result.awards]);
        setPage(result.page);
        setHasMore(result.hasMore);
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tAwards("error"));
      }
    });
  }

  function extraRow(award: AwardRow, variant: "table" | "mobile") {
    return (
      <AwardListRowPresentational
        key={award.documentId}
        award={award}
        variant={variant}
        labels={{
          cost: awardCostLabel(award, currencies, tAwards("noCost")),
        }}
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <table className="hidden w-full text-sm md:table">
          {tableHeader}
          {tableBody}
          {extraAwards.length > 0 ? (
            <tbody>{extraAwards.map((award) => extraRow(award, "table"))}</tbody>
          ) : null}
        </table>

        {mobileList}

        {extraAwards.length > 0 ? (
          <ul className="md:hidden">
            {extraAwards.map((award) => extraRow(award, "mobile"))}
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
            {isPending ? tAwards("loadingMore") : tAwards("loadMore")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
