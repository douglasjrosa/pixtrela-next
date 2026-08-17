import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import {
  canDeactivateTemplates,
  canDeleteTemplates,
} from "@/lib/auth/permissions";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { loadTemplateListPage } from "@/lib/templates/load-template-list-page";
import { parseTemplateListSearchParams } from "@/lib/templates/template-list-params";

import { APP_LIST_PAGE_STACK_CLASS } from "@/components/layout/app-page-layout";
import { TemplatesListMobileList } from "@/components/templates/templates-list-mobile-list";
import { TemplatesListTableBody } from "@/components/templates/templates-list-table-body";
import { TemplatesListTableFrame } from "@/components/templates/templates-list-table-frame";
import { TemplatesListTableHeader } from "@/components/templates/templates-list-table-header";
import { TemplatesPageHeader } from "@/components/templates/templates-page-header";
import { TemplatesToolbar } from "@/components/templates/templates-toolbar";
import { ListEmptyMessage } from "@/components/ui/list-empty-message";

interface TemplateTasksPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TemplateTasksPage({
  searchParams,
}: TemplateTasksPageProps) {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  const params = await searchParams;
  const filters = parseTemplateListSearchParams(params);
  const tTemplates = await getTranslations("templates");
  const sort = { column: filters.column, direction: filters.direction };
  const canDeactivate = canDeactivateTemplates(role);
  const canDelete = canDeleteTemplates(role);
  const bulkEnabled = canDeactivate || canDelete;
  const showCheckboxColumn = bulkEnabled;

  const pageResult = await loadTemplateListPage(filters, 1).catch((error) => {
    rethrowIfNavigationError(error);
    return {
      templates: [],
      page: 1,
      pageCount: 1,
      hasMore: false,
    };
  });

  let listContent;
  if (pageResult.templates.length === 0) {
    listContent = <ListEmptyMessage>{tTemplates("empty")}</ListEmptyMessage>;
  } else {
    listContent = (
      <TemplatesListTableFrame
        filters={filters}
        initialTemplates={pageResult.templates}
        initialPage={pageResult.page}
        initialHasMore={pageResult.hasMore}
        canDeactivate={canDeactivate}
        canDelete={canDelete}
        tableHeader={
          <TemplatesListTableHeader
            sort={sort}
            filters={filters}
            showCheckboxColumn={showCheckboxColumn}
          />
        }
        tableBody={
          <TemplatesListTableBody
            templates={pageResult.templates}
            showCheckboxColumn={showCheckboxColumn}
          />
        }
        mobileList={
          <TemplatesListMobileList
            templates={pageResult.templates}
            showCheckboxColumn={showCheckboxColumn}
          />
        }
      />
    );
  }

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
      {listContent}
    </div>
  );
}
