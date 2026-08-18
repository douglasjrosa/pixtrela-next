import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { CategoryListTableFrame } from "@/components/settings/subtasks/category-list-table-frame";
import { CategoryNameSearch } from "@/components/settings/subtasks/category-name-search";
import { CategoryPageHeader } from "@/components/settings/subtasks/category-page-header";
import { APP_LIST_PAGE_STACK_CLASS } from "@/components/layout/app-page-layout";
import { ListEmptyMessage } from "@/components/ui/list-empty-message";
import { listSubTaskCategories } from "@/lib/repos/sub-task-categories";
import { SETTINGS_ENTITY_LIST_PAGE_SIZE } from "@/lib/schemas/sub-task-category";
import { parseCategoryListSearchParams } from "@/lib/settings/category-list-params";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SettingsSubtaskCategoriesPage({
  searchParams,
}: PageProps) {
  const t = await getTranslations("settings");
  const filters = parseCategoryListSearchParams(await searchParams);
  const pageResult = await listSubTaskCategories(filters, 1).catch((error) => {
    rethrowIfNavigationError(error);
    return { items: [], total: 0 };
  });
  const hasMore = SETTINGS_ENTITY_LIST_PAGE_SIZE < pageResult.total;

  return (
    <div className={APP_LIST_PAGE_STACK_CLASS}>
      <div className="flex shrink-0 flex-col gap-2 max-[500px]:flex-row max-[500px]:items-center">
        <div className="min-w-0 flex-1">
          <Suspense fallback={null}>
            <CategoryNameSearch />
          </Suspense>
        </div>
        <div className="shrink-0">
          <CategoryPageHeader />
        </div>
      </div>
      {pageResult.items.length === 0 ? (
        <ListEmptyMessage>{t("categoriesEmpty")}</ListEmptyMessage>
      ) : (
        <CategoryListTableFrame
          filters={filters}
          initialItems={pageResult.items}
          initialHasMore={hasMore}
        />
      )}
    </div>
  );
}
