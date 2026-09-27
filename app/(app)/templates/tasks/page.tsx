import { getTranslations } from "next-intl/server";

import { getAppSession } from "@/lib/auth/app-session";
import type { Role } from "@/lib/auth/nav";
import {
  canDeactivateTemplates,
  canDeleteTemplates,
} from "@/lib/auth/permissions";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { loadTemplateListPage } from "@/lib/templates/load-template-list-page";
import { parseTemplateListSearchParams } from "@/lib/templates/template-list-params";

import { TemplatesListChrome } from "@/components/templates/templates-list-chrome";
import { TemplatesListTableFrame } from "@/components/templates/templates-list-table-frame";
import { TemplatesListTableHeader } from "@/components/templates/templates-list-table-header";
import { ListEmptyMessage } from "@/components/ui/list-empty-message";

interface TemplateTasksPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TemplateTasksPage({
  searchParams,
}: TemplateTasksPageProps) {
  const session = await getAppSession();
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
      />
    );
  }

  return <TemplatesListChrome>{listContent}</TemplatesListChrome>;
}
