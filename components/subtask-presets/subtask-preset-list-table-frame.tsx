"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { loadMoreSubTaskPresets } from "@/app/(app)/sub-task-presets/actions";
import { Button } from "@/components/ui/button";
import type { SubTaskPreset } from "@/lib/business/subtask-preset";
import { formatDurationMinutes } from "@/lib/format/duration";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import type { SubtaskPresetListFilters } from "@/lib/schemas/subtask-preset-list-filters";
import { subtaskPresetListFilterKey } from "@/lib/subtask-presets/subtask-preset-list-params";
import { showErrorToast } from "@/lib/ui/app-toast";

import { SubtaskPresetListRowPresentational } from "./subtask-preset-list-row-presentational";

export interface SubtaskPresetListTableFrameProps {
  filters: SubtaskPresetListFilters;
  initialPresets: SubTaskPreset[];
  initialPage: number;
  initialHasMore: boolean;
  tableHeader: ReactNode;
  tableBody: ReactNode;
  mobileList: ReactNode;
}

export function SubtaskPresetListTableFrame({
  filters,
  initialPresets,
  initialPage,
  initialHasMore,
  tableHeader,
  tableBody,
  mobileList,
}: SubtaskPresetListTableFrameProps) {
  const tPresets = useTranslations("subTaskPresets");
  const tSharing = useTranslations("subtasks.sharingType");
  const tDuration = useTranslations("duration");
  const filterKey = subtaskPresetListFilterKey(filters);
  const [extraPresets, setExtraPresets] = useState<SubTaskPreset[]>([]);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();
  const listResetKey = [
    filterKey,
    String(initialPage),
    String(initialHasMore),
    initialPresets.map((row) => row.documentId).join(","),
  ].join(":");
  const [prevListResetKey, setPrevListResetKey] = useState(listResetKey);
  if (listResetKey !== prevListResetKey) {
    setPrevListResetKey(listResetKey);
    setExtraPresets([]);
    setPage(initialPage);
    setHasMore(initialHasMore);
  }

  function labelsFor(preset: SubTaskPreset) {
    return {
      sharingType: tSharing(preset.sharingType),
      expectedTime: formatDurationMinutes(preset.expectedTime, (key, values) =>
        tDuration(key, values),
      ),
    };
  }

  function handleLoadMore(): void {
    const nextPage = page + 1;
    startTransition(async () => {
      try {
        const result = await loadMoreSubTaskPresets(filters, nextPage);
        setExtraPresets((current) => [...current, ...result.presets]);
        setPage(result.page);
        setHasMore(result.hasMore);
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tPresets("error"));
      }
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <table className="hidden w-full text-sm md:table">
          {tableHeader}
          {tableBody}
          {extraPresets.length > 0 ? (
            <tbody>
              {extraPresets.map((preset) => (
                <SubtaskPresetListRowPresentational
                  key={preset.documentId}
                  preset={preset}
                  variant="table"
                  labels={labelsFor(preset)}
                />
              ))}
            </tbody>
          ) : null}
        </table>

        {mobileList}

        {extraPresets.length > 0 ? (
          <ul className="md:hidden">
            {extraPresets.map((preset) => (
              <SubtaskPresetListRowPresentational
                key={preset.documentId}
                preset={preset}
                variant="mobile"
                labels={labelsFor(preset)}
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
            {isPending ? tPresets("loadingMore") : tPresets("loadMore")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
