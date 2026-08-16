"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { loadMoreTemplates } from "@/app/(app)/templates/actions";
import { Button } from "@/components/ui/button";
import type { TemplateListFilters } from "@/lib/schemas/template-list-filters";
import { templateListFilterKey } from "@/lib/templates/template-list-params";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { showErrorToast } from "@/lib/ui/app-toast";

import { TemplateListRowPresentational } from "./template-list-row-presentational";
import type { TemplateListRow } from "./types";

export interface TemplatesListTableFrameProps {
  filters: TemplateListFilters;
  initialTemplates: TemplateListRow[];
  initialPage: number;
  initialHasMore: boolean;
  tableHeader: ReactNode;
  tableBody: ReactNode;
  mobileList: ReactNode;
}

export function TemplatesListTableFrame({
  filters,
  initialTemplates,
  initialPage,
  initialHasMore,
  tableHeader,
  tableBody,
  mobileList,
}: TemplatesListTableFrameProps) {
  const tTemplates = useTranslations("templates");
  const filterKey = templateListFilterKey(filters);
  const [extraTemplates, setExtraTemplates] = useState<TemplateListRow[]>([]);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();
  const listResetKey = [
    filterKey,
    String(initialPage),
    String(initialHasMore),
    initialTemplates.map((row) => row.documentId).join(","),
  ].join(":");
  const [prevListResetKey, setPrevListResetKey] = useState(listResetKey);
  if (listResetKey !== prevListResetKey) {
    setPrevListResetKey(listResetKey);
    setExtraTemplates([]);
    setPage(initialPage);
    setHasMore(initialHasMore);
  }

  function handleLoadMore(): void {
    const nextPage = page + 1;
    startTransition(async () => {
      try {
        const result = await loadMoreTemplates(filters, nextPage);
        setExtraTemplates((current) => [...current, ...result.templates]);
        setPage(result.page);
        setHasMore(result.hasMore);
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tTemplates("error"));
      }
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <table className="hidden w-full text-sm md:table">
          {tableHeader}
          {tableBody}
          {extraTemplates.length > 0 ? (
            <tbody>
              {extraTemplates.map((template) => (
                <TemplateListRowPresentational
                  key={template.documentId}
                  template={template}
                  variant="table"
                  href={`/templates/tasks/${template.documentId}`}
                  labels={{
                    subTaskCountShort: tTemplates("subTaskCountShort", {
                      count: template.subTaskCount,
                    }),
                  }}
                />
              ))}
            </tbody>
          ) : null}
        </table>

        {mobileList}

        {extraTemplates.length > 0 ? (
          <ul className="md:hidden">
            {extraTemplates.map((template) => (
              <TemplateListRowPresentational
                key={template.documentId}
                template={template}
                variant="mobile"
                href={`/templates/tasks/${template.documentId}`}
                labels={{
                  subTaskCountShort: tTemplates("subTaskCountShort", {
                    count: template.subTaskCount,
                  }),
                }}
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
            {isPending ? tTemplates("loadingMore") : tTemplates("loadMore")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
