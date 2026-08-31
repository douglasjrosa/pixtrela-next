import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import { APP_LIST_PAGE_STACK_CLASS } from "@/components/layout/app-page-layout";
import { FactoryActionListTableFrame } from "@/components/factory-actions/factory-action-list-table-frame";
import { FactoryActionListTableHeader } from "@/components/factory-actions/factory-action-list-table-header";
import { FactoryActionManager } from "@/components/factory-actions/factory-action-manager";
import { FactoryActionsToolbar } from "@/components/factory-actions/factory-actions-toolbar";
import { ListEmptyMessage } from "@/components/ui/list-empty-message";
import type { Role } from "@/lib/auth/nav";
import {
  canDeactivateTemplates,
  canDeleteTemplates,
  canManageTemplates,
} from "@/lib/auth/permissions";
import { parseFactoryActionListSearchParams } from "@/lib/factory-actions/factory-action-list-params";
import { loadFactoryActionListPage } from "@/lib/factory-actions/load-factory-action-list-page";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";

interface TemplateActionsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TemplateActionsPage({
  searchParams,
}: TemplateActionsPageProps) {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;

  if (!canManageTemplates(role)) {
    return <ForbiddenMessage />;
  }

  const params = await searchParams;
  const filters = parseFactoryActionListSearchParams(params);
  const tActions = await getTranslations("factoryActions");
  const sort = { column: filters.column, direction: filters.direction };
  const canDeactivate = canDeactivateTemplates(role);
  const canDelete = canDeleteTemplates(role);
  const bulkEnabled = canDeactivate || canDelete;
  const showCheckboxColumn = bulkEnabled;

  const pageResult = await loadFactoryActionListPage(filters, 1).catch(
    (error) => {
      rethrowIfNavigationError(error);
      return {
        actions: [],
        page: 1,
        pageCount: 1,
        hasMore: false,
      };
    },
  );

  let listContent;
  if (pageResult.actions.length === 0) {
    listContent = <ListEmptyMessage>{tActions("empty")}</ListEmptyMessage>;
  } else {
    listContent = (
      <FactoryActionListTableFrame
        filters={filters}
        initialActions={pageResult.actions}
        initialPage={pageResult.page}
        initialHasMore={pageResult.hasMore}
        canDeactivate={canDeactivate}
        canDelete={canDelete}
        tableHeader={
          <FactoryActionListTableHeader
            sort={sort}
            filters={filters}
            showCheckboxColumn={showCheckboxColumn}
          />
        }
      />
    );
  }

  return (
    <FactoryActionManager>
      <div className={APP_LIST_PAGE_STACK_CLASS}>
        <Suspense fallback={null}>
          <FactoryActionsToolbar />
        </Suspense>
        {listContent}
      </div>
    </FactoryActionManager>
  );
}
