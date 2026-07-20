import { Suspense } from "react";

import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import type { TemplateListFilters } from "@/lib/schemas/template-list-filters";
import { loadTemplateListPage } from "@/lib/templates/load-template-list-page";
import {
  parseTemplateListSearchParams,
  templateListFilterKey,
} from "@/lib/templates/template-list-params";

import { APP_LIST_PAGE_STACK_CLASS } from "@/components/layout/app-page-layout";
import { TemplatesListSkeleton } from "@/components/templates/templates-list-skeleton";
import { TemplatesListWithLoadMore } from "@/components/templates/templates-list-with-load-more";
import { TemplatesPageHeader } from "@/components/templates/templates-page-header";
import { TemplatesToolbar } from "@/components/templates/templates-toolbar";

interface TemplateTasksPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function TemplatesListSection({
  filters,
}: {
  filters: TemplateListFilters;
}) {
  try {
    const page = await loadTemplateListPage(filters, 1);
    return (
      <TemplatesListWithLoadMore
        filters={filters}
        initialTemplates={page.templates}
        initialHasMore={page.hasMore}
        initialPage={page.page}
      />
    );
  } catch (error) {
    rethrowIfNavigationError(error);
    return (
      <TemplatesListWithLoadMore
        filters={filters}
        initialTemplates={[]}
        initialHasMore={false}
        initialPage={1}
      />
    );
  }
}

export default async function TemplateTasksPage({
  searchParams,
}: TemplateTasksPageProps) {
  const params = await searchParams;
  const filters = parseTemplateListSearchParams(params);
  const filterKey = templateListFilterKey(filters);

  return (
    <div className={APP_LIST_PAGE_STACK_CLASS}>
      <div
        className={
          "flex shrink-0 flex-col gap-2 " +
          "max-[500px]:flex-row max-[500px]:items-center max-[500px]:gap-2"
        }
      >
        <div className="min-w-0 flex-1">
          <Suspense fallback={null}>
            <TemplatesToolbar />
          </Suspense>
        </div>
        <div className="shrink-0">
          <TemplatesPageHeader />
        </div>
      </div>
      <Suspense key={filterKey} fallback={<TemplatesListSkeleton />}>
        <TemplatesListSection filters={filters} />
      </Suspense>
    </div>
  );
}
