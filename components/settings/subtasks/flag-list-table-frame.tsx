"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { loadMoreFlags } from "@/app/(app)/settings/subtasks/actions";
import { LoadMoreButton, LoadMoreButtonRow } from "@/components/ui/load-more-button";
import type { MaterialFlagListFilters } from "@/lib/schemas/material-flag";
import { SETTINGS_ENTITY_LIST_PAGE_SIZE } from "@/lib/schemas/sub-task-category";
import { flagListFilterKey } from "@/lib/settings/flag-list-params";

const ROW_LINK_CLASS =
  "text-inherit after:absolute after:inset-0 after:content-['']";

export type FlagListRow = {
  id: string;
  code: string;
  categoryName: string;
  index: number;
  occupied: boolean;
};

export function FlagListTableFrame({
  filters,
  initialItems,
  initialHasMore,
}: {
  filters: MaterialFlagListFilters;
  initialItems: FlagListRow[];
  initialHasMore: boolean;
}) {
  const t = useTranslations("settings");
  const filterKey = flagListFilterKey(filters);
  const [extra, setExtra] = useState<FlagListRow[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [prevKey, setPrevKey] = useState(filterKey);
  if (filterKey !== prevKey) {
    setPrevKey(filterKey);
    setExtra([]);
    setPage(1);
    setHasMore(initialHasMore);
  }
  const items = [...initialItems, ...extra];

  async function handleLoadMore(): Promise<void> {
    setLoading(true);
    try {
      const nextPage = page + 1;
      const result = await loadMoreFlags(filters, nextPage);
      setExtra((current) => [...current, ...result.items]);
      setPage(nextPage);
      setHasMore(nextPage * SETTINGS_ENTITY_LIST_PAGE_SIZE < result.total);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <table className="hidden w-full text-sm md:table">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2 font-medium">{t("flagCode")}</th>
            <th className="py-2 font-medium">{t("flagCategory")}</th>
            <th className="py-2 font-medium">{t("flagIndex")}</th>
            <th className="py-2 font-medium">{t("flagOccupied")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row) => (
            <tr
              key={row.id}
              className="relative cursor-pointer border-b hover:bg-muted/40"
            >
              <td className="py-3">
                <Link
                  href={`/settings/subtasks/flags/${row.id}`}
                  className={`font-mono font-medium ${ROW_LINK_CLASS}`}
                  aria-label={row.code}
                >
                  {row.code}
                </Link>
              </td>
              <td className="py-3">{row.categoryName}</td>
              <td className="py-3">{row.index}</td>
              <td className="py-3 text-muted-foreground">
                {row.occupied ? t("flagOccupied") : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="space-y-2 md:hidden">
        {items.map((row) => (
          <li key={row.id}>
            <Link
              href={`/settings/subtasks/flags/${row.id}`}
              className="block rounded-xl border p-3"
            >
              <p className="font-mono font-medium">{row.code}</p>
              <p className="text-sm text-muted-foreground">{row.categoryName}</p>
            </Link>
          </li>
        ))}
      </ul>
      {hasMore ? (
        <LoadMoreButtonRow>
          <LoadMoreButton
            loading={loading}
            label={t("loadMore")}
            loadingLabel={t("loadingMore")}
            onClick={handleLoadMore}
          />
        </LoadMoreButtonRow>
      ) : null}
    </div>
  );
}
