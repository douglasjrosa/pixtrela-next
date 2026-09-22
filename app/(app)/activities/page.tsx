import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { ActivitiesListSkeleton } from "@/components/activities/activities-list-skeleton";
import { ActivitiesListTableFrame } from "@/components/activities/activities-list-table-frame";
import { ActivitiesListTableHeader } from "@/components/activities/activities-list-table-header";
import { ActivitiesPageHeader } from "@/components/activities/activities-page-header";
import { ActivitiesToolbar } from "@/components/activities/activities-toolbar";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import {
  APP_LIST_PAGE_SHELL_CLASS,
  APP_LIST_PAGE_STACK_CLASS,
} from "@/components/layout/app-page-layout";
import { ListEmptyMessage } from "@/components/ui/list-empty-message";
import { activityListFilterKey } from "@/lib/activities/activity-list-params";
import { loadActivityListPage } from "@/lib/activities/load-activity-list-page";
import type { Role } from "@/lib/auth/nav";
import {
  canDeactivateActivities,
  canDeleteActivities,
  canViewActivities,
} from "@/lib/auth/permissions";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { listActivityFormOptions } from "@/lib/repos/activities";
import type { ActivityListFilters } from "@/lib/schemas/activity-list-filters";
import {
  parseActivityListSearchParams,
  type SearchParamsRecord,
} from "@/lib/activities/activity-list-params";

interface ActivitiesPageProps {
  searchParams: Promise<SearchParamsRecord>;
}

async function ActivitiesListSection({
  filters,
  options,
  canDeactivate,
  canDelete,
}: {
  filters: ActivityListFilters;
  options: Awaited<ReturnType<typeof listActivityFormOptions>>;
  canDeactivate: boolean;
  canDelete: boolean;
}) {
  const t = await getTranslations("activities");
  const pageResult = await loadActivityListPage(filters, 1).catch((error) => {
    rethrowIfNavigationError(error);
    return {
      activities: [],
      page: 1,
      pageCount: 1,
      hasMore: false,
    };
  });

  if (pageResult.activities.length === 0) {
    return <ListEmptyMessage>{t("empty")}</ListEmptyMessage>;
  }

  const sort = { column: filters.column, direction: filters.direction };
  const showCheckboxColumn = canDeactivate || canDelete;

  return (
    <ActivitiesListTableFrame
      filters={filters}
      options={options}
      initialActivities={pageResult.activities}
      initialPage={pageResult.page}
      initialHasMore={pageResult.hasMore}
      canDeactivate={canDeactivate}
      canDelete={canDelete}
      tableHeader={
        <ActivitiesListTableHeader
          sort={sort}
          filters={filters}
          showCheckboxColumn={showCheckboxColumn}
        />
      }
    />
  );
}

export default async function ActivitiesPage({
  searchParams,
}: ActivitiesPageProps) {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;

  if (!canViewActivities(role)) {
    return <ForbiddenMessage />;
  }

  const params = await searchParams;
  const filters = parseActivityListSearchParams(params);
  const options = await listActivityFormOptions();

  return (
    <section className={APP_LIST_PAGE_SHELL_CLASS}>
      <div className={APP_LIST_PAGE_STACK_CLASS}>
        <ActivitiesPageHeader options={options} />
        <Suspense fallback={null}>
          <ActivitiesToolbar />
        </Suspense>
        <Suspense
          key={activityListFilterKey(filters)}
          fallback={<ActivitiesListSkeleton />}
        >
          <ActivitiesListSection
            filters={filters}
            options={options}
            canDeactivate={canDeactivateActivities(role)}
            canDelete={canDeleteActivities(role)}
          />
        </Suspense>
      </div>
    </section>
  );
}
