import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import { APP_LIST_PAGE_STACK_CLASS } from "@/components/layout/app-page-layout";
import { FactoryActionListMobileList } from "@/components/factory-actions/factory-action-list-mobile-list";
import { FactoryActionListTableBody } from "@/components/factory-actions/factory-action-list-table-body";
import { FactoryActionListTableFrame } from "@/components/factory-actions/factory-action-list-table-frame";
import { FactoryActionListTableHeader } from "@/components/factory-actions/factory-action-list-table-header";
import { FactoryActionManager } from "@/components/factory-actions/factory-action-manager";
import { ListEmptyMessage } from "@/components/ui/list-empty-message";
import type { Role } from "@/lib/auth/nav";
import { canManageTemplates } from "@/lib/auth/permissions";
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
        tableHeader={
          <FactoryActionListTableHeader sort={sort} filters={filters} />
        }
        tableBody={
          <FactoryActionListTableBody actions={pageResult.actions} />
        }
        mobileList={
          <FactoryActionListMobileList actions={pageResult.actions} />
        }
      />
    );
  }

  return (
    <div className={APP_LIST_PAGE_STACK_CLASS}>
      <FactoryActionManager>{listContent}</FactoryActionManager>
    </div>
  );
}
