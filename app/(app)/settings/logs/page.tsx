import { LogsScreen } from "@/components/settings/logs/logs-screen";
import { APP_LIST_PAGE_STACK_CLASS } from "@/components/layout/app-page-layout";
import { LOG_PAGE_SIZE } from "@/lib/logs/constants";
import { parseLogListSearchParams } from "@/lib/logs/log-list-params";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { listLogActorOptions, listLogs } from "@/lib/repos/logs";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SettingsLogsPage({ searchParams }: PageProps) {
  const filters = parseLogListSearchParams(await searchParams);
  const [pageResult, actors] = await Promise.all([
    listLogs(filters, 1).catch((error) => {
      rethrowIfNavigationError(error);
      return { items: [], total: 0 };
    }),
    listLogActorOptions().catch((error) => {
      rethrowIfNavigationError(error);
      return [];
    }),
  ]);
  const hasMore = LOG_PAGE_SIZE < pageResult.total;

  return (
    <div className={APP_LIST_PAGE_STACK_CLASS}>
      <LogsScreen
        initialFilters={filters}
        initialItems={pageResult.items}
        initialHasMore={hasMore}
        actors={actors}
      />
    </div>
  );
}
