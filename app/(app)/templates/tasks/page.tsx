import { Suspense } from "react";

import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import type { TemplateListFilters } from "@/lib/schemas/template-list-filters";
import { loadTemplateListPage } from "@/lib/templates/load-template-list-page";
import {
  parseTemplateListSearchParams,
  templateListFilterKey,
} from "@/lib/templates/template-list-params";

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
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <TemplatesPageHeader />
      <Suspense fallback={null}>
        <TemplatesToolbar />
      </Suspense>
      <Suspense key={filterKey} fallback={<TemplatesListSkeleton />}>
        <TemplatesListSection filters={filters} />
      </Suspense>
    </div>
  );
}
