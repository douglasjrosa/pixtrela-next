import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import { APP_LIST_PAGE_STACK_CLASS } from "@/components/layout/app-page-layout";
import { SubtaskPresetListMobileList } from "@/components/subtask-presets/subtask-preset-list-mobile-list";
import { SubtaskPresetListTableBody } from "@/components/subtask-presets/subtask-preset-list-table-body";
import { SubtaskPresetListTableFrame } from "@/components/subtask-presets/subtask-preset-list-table-frame";
import { SubtaskPresetListTableHeader } from "@/components/subtask-presets/subtask-preset-list-table-header";
import { SubTaskPresetManager } from "@/components/subtask-presets/subtask-preset-manager";
import { ListEmptyMessage } from "@/components/ui/list-empty-message";
import type { Role } from "@/lib/auth/nav";
import { canManageTemplates } from "@/lib/auth/permissions";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { loadSubtaskPresetListPage } from "@/lib/subtask-presets/load-subtask-preset-list-page";
import { parseSubtaskPresetListSearchParams } from "@/lib/subtask-presets/subtask-preset-list-params";

interface TemplateSubtasksPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TemplateSubtasksPage({
  searchParams,
}: TemplateSubtasksPageProps) {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;

  if (!canManageTemplates(role)) {
    return <ForbiddenMessage />;
  }

  const params = await searchParams;
  const filters = parseSubtaskPresetListSearchParams(params);
  const tPresets = await getTranslations("subTaskPresets");
  const sort = { column: filters.column, direction: filters.direction };

  const pageResult = await loadSubtaskPresetListPage(filters, 1).catch(
    (error) => {
      rethrowIfNavigationError(error);
      return {
        presets: [],
        page: 1,
        pageCount: 1,
        hasMore: false,
      };
    },
  );

  let listContent;
  if (pageResult.presets.length === 0) {
    listContent = <ListEmptyMessage>{tPresets("empty")}</ListEmptyMessage>;
  } else {
    listContent = (
      <SubtaskPresetListTableFrame
        filters={filters}
        initialPresets={pageResult.presets}
        initialPage={pageResult.page}
        initialHasMore={pageResult.hasMore}
        tableHeader={
          <SubtaskPresetListTableHeader sort={sort} filters={filters} />
        }
        tableBody={
          <SubtaskPresetListTableBody presets={pageResult.presets} />
        }
        mobileList={
          <SubtaskPresetListMobileList presets={pageResult.presets} />
        }
      />
    );
  }

  return (
    <div className={APP_LIST_PAGE_STACK_CLASS}>
      <SubTaskPresetManager>{listContent}</SubTaskPresetManager>
    </div>
  );
}
