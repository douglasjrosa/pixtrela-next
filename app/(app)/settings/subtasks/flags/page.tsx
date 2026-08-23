import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { FlagListTableFrame } from "@/components/settings/subtasks/flag-list-table-frame";
import { FlagNameSearch } from "@/components/settings/subtasks/flag-name-search";
import { FlagPageHeader } from "@/components/settings/subtasks/flag-page-header";
import { APP_LIST_PAGE_STACK_CLASS } from "@/components/layout/app-page-layout";
import { ListEmptyMessage } from "@/components/ui/list-empty-message";
import { listMaterialFlags } from "@/lib/repos/material-flags";
import { listAllSubTaskCategories } from "@/lib/repos/sub-task-categories";
import { SETTINGS_ENTITY_LIST_PAGE_SIZE } from "@/lib/schemas/sub-task-category";
import { parseFlagListSearchParams } from "@/lib/settings/flag-list-params";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SettingsSubtaskFlagsPage({
  searchParams,
}: PageProps) {
  const t = await getTranslations("settings");
  const filters = parseFlagListSearchParams(await searchParams);
  const [pageResult, categories] = await Promise.all([
    listMaterialFlags(filters, 1).catch((error) => {
      rethrowIfNavigationError(error);
      return { items: [], total: 0 };
    }),
    listAllSubTaskCategories().catch((error) => {
      rethrowIfNavigationError(error);
      return [];
    }),
  ]);
  const hasMore = SETTINGS_ENTITY_LIST_PAGE_SIZE < pageResult.total;

  return (
    <div className={APP_LIST_PAGE_STACK_CLASS}>
      <div className="flex shrink-0 flex-row items-center gap-2">
        <div className="min-w-0 flex-1">
          <Suspense fallback={null}>
            <FlagNameSearch categories={categories} />
          </Suspense>
        </div>
        <div className="shrink-0">
          <FlagPageHeader categories={categories} />
        </div>
      </div>
      {pageResult.items.length === 0 ? (
        <ListEmptyMessage>{t("flagsEmpty")}</ListEmptyMessage>
      ) : (
        <FlagListTableFrame
          filters={filters}
          initialItems={pageResult.items}
          initialHasMore={hasMore}
        />
      )}
    </div>
  );
}
