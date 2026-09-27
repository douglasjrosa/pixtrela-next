import { getTranslations } from "next-intl/server";

import { CategoryListTableFrame } from "@/components/settings/subtasks/category-list-table-frame";
import { CategoryNameSearch } from "@/components/settings/subtasks/category-name-search";
import { CategoryPageHeader } from "@/components/settings/subtasks/category-page-header";
import { ListPageChrome } from "@/components/ui/list-page-chrome";
import { ListPageToolbar } from "@/components/ui/list-page-toolbar";
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
    <ListPageChrome
      toolbar={
        <ListPageToolbar
          search={<CategoryNameSearch />}
          trailingActions={<CategoryPageHeader />}
        />
      }
    >
      {pageResult.items.length === 0 ? (
        <ListEmptyMessage>{t("categoriesEmpty")}</ListEmptyMessage>
      ) : (
        <CategoryListTableFrame
          filters={filters}
          initialItems={pageResult.items}
          initialHasMore={hasMore}
        />
      )}
    </ListPageChrome>
  );
}
