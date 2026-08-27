"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { loadMoreFactoryActions } from "@/app/(app)/factory-actions/actions";
import { ListLoadMore } from "@/components/ui/load-more-button";
import type { FactoryAction } from "@/lib/business/factory-action";
import { formatDecimalPtBr } from "@/lib/format/decimal";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import type { FactoryActionListFilters } from "@/lib/schemas/factory-action-list-filters";
import { factoryActionListFilterKey } from "@/lib/factory-actions/factory-action-list-params";
import { showErrorToast } from "@/lib/ui/app-toast";

import { FactoryActionListRowPresentational } from "./factory-action-list-row-presentational";

export interface FactoryActionListTableFrameProps {
  filters: FactoryActionListFilters;
  initialActions: FactoryAction[];
  initialPage: number;
  initialHasMore: boolean;
  tableHeader: ReactNode;
  tableBody: ReactNode;
  mobileList: ReactNode;
}

export function FactoryActionListTableFrame({
  filters,
  initialActions,
  initialPage,
  initialHasMore,
  tableHeader,
  tableBody,
  mobileList,
}: FactoryActionListTableFrameProps) {
  const tActions = useTranslations("factoryActions");
  const filterKey = factoryActionListFilterKey(filters);
  const [extraActions, setExtraActions] = useState<FactoryAction[]>([]);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();
  const listResetKey = [
    filterKey,
    String(initialPage),
    String(initialHasMore),
    initialActions.map((row) => row.documentId).join(","),
  ].join(":");
  const [prevListResetKey, setPrevListResetKey] = useState(listResetKey);
  if (listResetKey !== prevListResetKey) {
    setPrevListResetKey(listResetKey);
    setExtraActions([]);
    setPage(initialPage);
    setHasMore(initialHasMore);
  }

  function labelsFor(action: FactoryAction) {
    return {
      unitTime: formatDecimalPtBr(action.unitTime),
      qtyQuestion: action.qtyQuestion,
    };
  }

  function handleLoadMore(): void {
    const nextPage = page + 1;
    startTransition(async () => {
      try {
        const result = await loadMoreFactoryActions(filters, nextPage);
        setExtraActions((current) => [...current, ...result.actions]);
        setPage(result.page);
        setHasMore(result.hasMore);
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tActions("error"));
      }
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <table className="hidden w-full text-sm md:table">
          {tableHeader}
          {tableBody}
          {extraActions.length > 0 ? (
            <tbody>
              {extraActions.map((action) => (
                <FactoryActionListRowPresentational
                  key={action.documentId}
                  action={action}
                  variant="table"
                  labels={labelsFor(action)}
                />
              ))}
            </tbody>
          ) : null}
        </table>

        {mobileList}

        {extraActions.length > 0 ? (
          <ul className="md:hidden">
            {extraActions.map((action) => (
              <FactoryActionListRowPresentational
                key={action.documentId}
                action={action}
                variant="mobile"
                labels={labelsFor(action)}
              />
            ))}
          </ul>
        ) : null}
      </div>

      <ListLoadMore
        visible={hasMore}
        loading={isPending}
        onClick={handleLoadMore}
      />
    </div>
  );
}
