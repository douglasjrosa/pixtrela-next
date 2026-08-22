"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { loadMoreCategories } from "@/app/(app)/settings/subtasks/actions";
import { ListLoadMore } from "@/components/ui/load-more-button";
import type { SubTaskCategoryListFilters } from "@/lib/schemas/sub-task-category";
import { SETTINGS_ENTITY_LIST_PAGE_SIZE } from "@/lib/schemas/sub-task-category";
import { categoryListFilterKey } from "@/lib/settings/category-list-params";

const ROW_LINK_CLASS =
  "text-inherit after:absolute after:inset-0 after:content-['']";

export type CategoryListRow = {
  id: string;
  name: string;
  ref: string;
  description: string | null;
};

export function CategoryListTableFrame({
  filters,
  initialItems,
  initialHasMore,
}: {
  filters: SubTaskCategoryListFilters;
  initialItems: CategoryListRow[];
  initialHasMore: boolean;
}) {
  const t = useTranslations("settings");
  const filterKey = categoryListFilterKey(filters);
  const [extra, setExtra] = useState<CategoryListRow[]>([]);
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
      const result = await loadMoreCategories(filters, nextPage);
      setExtra((current) => [...current, ...result.items]);
      setPage(nextPage);
      setHasMore(
        nextPage * SETTINGS_ENTITY_LIST_PAGE_SIZE < result.total,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <table className="hidden w-full text-sm md:table">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2 font-medium">{t("categoryName")}</th>
            <th className="py-2 font-medium">{t("categoryRef")}</th>
            <th className="py-2 font-medium">{t("categoryDescription")}</th>
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
                  href={`/settings/subtasks/categories/${row.id}`}
                  className={`font-medium ${ROW_LINK_CLASS}`}
                  aria-label={row.name}
                >
                  {row.name}
                </Link>
              </td>
              <td className="py-3 font-mono">{row.ref}</td>
              <td className="py-3 text-muted-foreground">
                {row.description ?? ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="space-y-2 md:hidden">
        {items.map((row) => (
          <li key={row.id}>
            <Link
              href={`/settings/subtasks/categories/${row.id}`}
              className="block rounded-xl border p-3"
            >
              <p className="font-medium">{row.name}</p>
              <p className="font-mono text-sm text-muted-foreground">{row.ref}</p>
            </Link>
          </li>
        ))}
      </ul>
      <ListLoadMore
        visible={hasMore}
        loading={loading}
        onClick={handleLoadMore}
      />
    </div>
  );
}
