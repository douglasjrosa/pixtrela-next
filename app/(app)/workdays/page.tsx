import { getTranslations } from "next-intl/server";

import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import { APP_LIST_PAGE_SHELL_CLASS } from "@/components/layout/app-page-layout";
import { ListEmptyMessage } from "@/components/ui/list-empty-message";
import { WorkdayManager } from "@/components/workdays/workday-manager";
import { WorkdaysListMobileList } from "@/components/workdays/workdays-list-mobile-list";
import { WorkdaysListTableBody } from "@/components/workdays/workdays-list-table-body";
import { WorkdaysListTableFrame } from "@/components/workdays/workdays-list-table-frame";
import { WorkdaysListTableHeader } from "@/components/workdays/workdays-list-table-header";
import { getAppSession } from "@/lib/auth/app-session";
import type { Role } from "@/lib/auth/nav";
import {
  canDeactivateWorkdays,
  canDeleteWorkdays,
  canManageWorkdays,
} from "@/lib/auth/permissions";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { listWorkdayFormOptions } from "@/lib/repos/workdays";
import { loadWorkdayListPage } from "@/lib/workdays/load-workday-list-page";
import { resolveWorkdayViewerContext } from "@/lib/workdays/resolve-workday-viewer";
import {
  parseWorkdayListSearchParams,
  type SearchParamsRecord,
} from "@/lib/workdays/workday-list-params";

import { createWorkday, updateWorkday } from "./actions";

interface WorkdaysPageProps {
  searchParams: Promise<SearchParamsRecord>;
}

export default async function WorkdaysPage({
  searchParams,
}: WorkdaysPageProps) {
  const session = await getAppSession();
  const role = session?.user?.role as Role | undefined;
  const userId = session?.user?.id;

  if (!role || !canManageWorkdays(role) || !userId) {
    return <ForbiddenMessage />;
  }

  const params = await searchParams;
  const filters = parseWorkdayListSearchParams(params);
  const t = await getTranslations("workdays");
  const sort = { column: filters.column, direction: filters.direction };
  const canDeactivate = canDeactivateWorkdays(role);
  const canDelete = canDeleteWorkdays(role);
  const showCheckboxColumn = canDeactivate || canDelete;
  const viewerContext = await resolveWorkdayViewerContext({ role, userId });

  const [pageResult, formOptions] = await Promise.all([
    loadWorkdayListPage(filters, 1, viewerContext).catch((error) => {
      rethrowIfNavigationError(error);
      return {
        workdays: [],
        page: 1,
        pageCount: 1,
        hasMore: false,
      };
    }),
    listWorkdayFormOptions(
      role === "leader" ? { leaderUserId: userId } : {},
    ).catch((error) => {
      rethrowIfNavigationError(error);
      return { teams: [], users: [] };
    }),
  ]);

  let listContent;
  if (pageResult.workdays.length === 0) {
    listContent = <ListEmptyMessage>{t("empty")}</ListEmptyMessage>;
  } else {
    listContent = (
      <WorkdaysListTableFrame
        filters={filters}
        initialWorkdays={pageResult.workdays}
        initialPage={pageResult.page}
        initialHasMore={pageResult.hasMore}
        canDeactivate={canDeactivate}
        canDelete={canDelete}
        tableHeader={
          <WorkdaysListTableHeader
            sort={sort}
            filters={filters}
            showCheckboxColumn={showCheckboxColumn}
          />
        }
        tableBody={
          <WorkdaysListTableBody
            workdays={pageResult.workdays}
            showCheckboxColumn={showCheckboxColumn}
          />
        }
        mobileList={
          <WorkdaysListMobileList
            workdays={pageResult.workdays}
            showCheckboxColumn={showCheckboxColumn}
          />
        }
      />
    );
  }

  return (
    <section className={APP_LIST_PAGE_SHELL_CLASS}>
      <WorkdayManager
        teams={formOptions.teams}
        users={formOptions.users}
        actorRole={role}
        onCreate={createWorkday}
        onUpdate={updateWorkday}
      >
        {listContent}
      </WorkdayManager>
    </section>
  );
}
