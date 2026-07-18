"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { loadMoreTemplates } from "@/app/(app)/templates/actions";
import { Button } from "@/components/ui/button";
import type { TemplateListFilters } from "@/lib/schemas/template-list-filters";
import { templateListFilterKey } from "@/lib/templates/template-list-params";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { showErrorToast } from "@/lib/ui/app-toast";

import type { TemplateListRow } from "./types";
import { TemplatesListView } from "./templates-list-view";

export interface TemplatesListWithLoadMoreProps {
  filters: TemplateListFilters;
  initialTemplates: TemplateListRow[];
  initialHasMore: boolean;
  initialPage: number;
}

export function TemplatesListWithLoadMore({
  filters,
  initialTemplates,
  initialHasMore,
  initialPage,
}: TemplatesListWithLoadMoreProps) {
  const tTemplates = useTranslations("templates");
  const filterKey = templateListFilterKey(filters);
  const [extraTemplates, setExtraTemplates] = useState<TemplateListRow[]>([]);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setExtraTemplates([]);
    setPage(initialPage);
    setHasMore(initialHasMore);
  }, [filterKey, initialTemplates, initialPage, initialHasMore]);

  const templates = [...initialTemplates, ...extraTemplates];

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
        <TemplatesListView templates={templates} />
      </div>
      {hasMore ? (
        <div className="shrink-0 pt-3">
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
