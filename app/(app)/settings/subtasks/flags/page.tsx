import { getTranslations } from "next-intl/server";

import { FlagListTableFrame } from "@/components/settings/subtasks/flag-list-table-frame";
import { FlagNameSearch } from "@/components/settings/subtasks/flag-name-search";
import { FlagPageHeader } from "@/components/settings/subtasks/flag-page-header";
import { ListPageChrome } from "@/components/ui/list-page-chrome";
import { ListPageToolbar } from "@/components/ui/list-page-toolbar";
import { ListEmptyMessage } from "@/components/ui/list-empty-message";
import { loadMaterialFlagsSettings } from "@/lib/material-flags/load-material-flags-settings";
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
  const [pageResult, categories, flagsSettings] = await Promise.all([
    listMaterialFlags(filters, 1).catch((error) => {
      rethrowIfNavigationError(error);
      return { items: [], total: 0 };
    }),
    listAllSubTaskCategories().catch((error) => {
      rethrowIfNavigationError(error);
      return [];
    }),
    loadMaterialFlagsSettings(),
  ]);
  const flagsEnabled = flagsSettings.enabled;
  const hasMore = SETTINGS_ENTITY_LIST_PAGE_SIZE < pageResult.total;

  return (
    <ListPageChrome
      toolbar={
        <ListPageToolbar
          search={
            flagsEnabled ? <FlagNameSearch categories={categories} /> : undefined
          }
          trailingActions={
            <FlagPageHeader
              categories={categories}
              flagsEnabled={flagsEnabled}
            />
          }
        />
      }
    >
      {!flagsEnabled ? null : pageResult.items.length === 0 ? (
        <ListEmptyMessage>{t("flagsEmpty")}</ListEmptyMessage>
      ) : (
        <FlagListTableFrame
          filters={filters}
          initialItems={pageResult.items}
          initialHasMore={hasMore}
        />
      )}
    </ListPageChrome>
  );
}
